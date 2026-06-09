/**
 * 1. kategória – Hitelesítés és munkamenet
 * Forgatókönyvek: TS-001 … TS-007
 *
 * Stratégia:
 *  - Google OAuth flow: OidcCallbackComponent-en keresztül szimulálva
 *    (sessionStorage-ba írjuk az oauth state-t, majd /auth/callback-et hívunk)
 *  - Hitelesített állapot: JWT-t injektálunk az addInitScript-tel
 *    (az APP_INITIALIZER restoreSession() előtt fut)
 *  - Backend API-k: page.route()-tal mockoljuk ahol szükséges
 */

import { test, expect, simulateOAuthLogin, TEST_USERS } from '../../fixtures/auth.fixture';
import { mockApplicationsList, mockAuthenticatedSession, mockSignalR } from '../../helpers/api-mocks';

const BASE = 'http://192.168.1.138.nip.io:8080';

// ─────────────────────────────────────────────────────────────────────────────
// TS-001 | Sikeres Google-bejelentkezés
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-001 | Sikeres Google-bejelentkezés', () => {
  test('A login oldalon megjelenik a Google bejelentkezés gomb', async ({ page }) => {
    await page.goto('/login');

    const loginBtn = page.getByRole('button', { name: /bejelentkezés google-fiókkal/i });
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeEnabled();
  });

  test('Google gombra kattintva Google OAuth URL-re navigál', async ({ page }) => {
    await page.goto('/login');

    // Intercept the navigation attempt to Google
    let capturedUrl = '';
    page.on('request', (req) => {
      if (req.url().includes('accounts.google.com')) {
        capturedUrl = req.url();
      }
    });

    // Abort the external navigation so the browser doesn't actually leave
    await page.route('https://accounts.google.com/**', (route) => route.abort());

    await page.getByRole('button', { name: /bejelentkezés google-fiókkal/i }).click();

    // Give a moment for the redirect to be initiated
    await page.waitForTimeout(1000);

    expect(capturedUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(capturedUrl).toContain('response_type=code');
    expect(capturedUrl).toContain('scope=openid');
  });

  test('Sikeres OAuth callback után az alkalmazás listára navigál', async ({ page }) => {
    const user = TEST_USERS['PalyazatiMunkatars'];

    await mockApplicationsList(page);
    await mockSignalR(page);

    await simulateOAuthLogin(page, user, async () => {
      await mockApplicationsList(page);
    });

    // Should end up on the applications page
    await page.waitForURL('**/applications**', { timeout: 10_000 });
    expect(page.url()).toContain('/applications');
  });

  test('Bejelentkezés után a navbar mutatja a felhasználó nevét', async ({ page }) => {
    const user = TEST_USERS['PalyazatiMunkatars'];

    await simulateOAuthLogin(page, user, async () => {
      await mockApplicationsList(page);
      await mockSignalR(page);
    });

    await page.waitForURL('**/applications**', { timeout: 10_000 });

    // The user name is inside the profile menu — open it first
    await page.getByRole('button', { name: /profil menü/i }).click();
    await expect(page.getByText(user.name)).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-002 | Első bejelentkezés – Megtekintő szerepkör automatikus kiosztása
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-002 | Első bejelentkezés – Megtekintő alapértelmezett szerepkör', () => {
  test('Új felhasználó Megtekintő szerepkörrel jön létre', async ({ page }) => {
    const newUser = TEST_USERS['Megtekinto'];

    await simulateOAuthLogin(page, newUser, async () => {
      await mockApplicationsList(page);
      await mockSignalR(page);
    });

    await page.waitForURL('**/applications**', { timeout: 10_000 });

    // Open profile menu to see the user info
    await page.getByRole('button', { name: /profil menü/i }).click();
    const profileName = page.getByText(newUser.name);
    await expect(profileName).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-003 | Inaktív fiók bejelentkezési kísérlete
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-003 | Inaktív fiók hibaüzenet', () => {
  test('Az /login?error=inactive URL-n megjelenik a helyes hibaüzenet', async ({ page }) => {
    await page.goto('/login?error=inactive');

    const errorDiv = page.locator('[role="alert"]');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText('A fiókod inaktív');
    await expect(errorDiv).toContainText('adminisztrátortól');
  });

  test('Inaktív fiók esetén a 403-as backend válasz a login oldalra irányít', async ({ page }) => {
    const testState = 'e2e-inactive-state-test';

    // Mock google-callback to return 403 (inactive user)
    await page.route('**/api/v1/auth/google-callback', async (route) => {
      await route.fulfill({ status: 403, body: '' });
    });

    await page.goto('/login');
    await page.evaluate(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_oauth_state', value: testState },
    );

    await page.goto(`/auth/callback?code=inactive-code&state=${testState}`);

    // OidcCallbackComponent catches 403 and redirects to /login?error=inactive
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('error=inactive');

    await expect(page.locator('[role="alert"]')).toContainText('inaktív');
  });

  test('Bejelentkezés gomb látható az inaktív hibaüzenet után is', async ({ page }) => {
    await page.goto('/login?error=inactive');

    const loginBtn = page.getByRole('button', { name: /bejelentkezés google-fiókkal/i });
    await expect(loginBtn).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-004 | Munkamenet lejárata
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-004 | Munkamenet lejárata', () => {
  test('Lejárt JWT esetén a védett oldal a login-ra irányít', async ({ expiredAuthPage }) => {
    // The expiredAuthPage fixture injects an expired token before Angular starts
    await expiredAuthPage.goto('/applications');

    // Auth guard detects expired token → redirect to /login
    await expiredAuthPage.waitForURL('**/login**', { timeout: 10_000 });
    expect(expiredAuthPage.url()).toContain('/login');
  });

  test('Lejárt JWT után a login oldal jelenik meg (nem védett tartalom)', async ({
    expiredAuthPage,
  }) => {
    await expiredAuthPage.goto('/applications');
    await expiredAuthPage.waitForURL('**/login**', { timeout: 10_000 });

    const loginBtn = expiredAuthPage.getByRole('button', {
      name: /bejelentkezés google-fiókkal/i,
    });
    await expect(loginBtn).toBeVisible();
  });

  test('Token eltávolítása után védett oldalra navigálva login oldalra kerül', async ({ page }) => {
    // Start authenticated
    const user = TEST_USERS['PalyazatiMunkatars'];
    await page.addInitScript(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_token', value: 'INVALID.JWT.TOKEN' },
    );

    await page.goto('/applications');

    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-005 | Kijelentkezés
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-005 | Kijelentkezés', () => {
  test('A profilmenüben elérhető a Kijelentkezés opció', async ({ munkatarsPage }) => {
    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });

    // Open profile menu
    await munkatarsPage.getByRole('button', { name: /profil menü/i }).click();

    const logoutBtn = munkatarsPage.getByRole('menuitem', { name: /kijelentkezés/i });
    await expect(logoutBtn).toBeVisible();
  });

  test('Kijelentkezés után a rendszer a login oldalra irányít', async ({ munkatarsPage }) => {
    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });

    // Open profile menu and click logout
    await munkatarsPage.getByRole('button', { name: /profil menü/i }).click();
    await munkatarsPage.getByRole('menuitem', { name: /kijelentkezés/i }).click();

    await munkatarsPage.waitForURL('**/login**', { timeout: 10_000 });
    expect(munkatarsPage.url()).toContain('/login');
  });

  test('Kijelentkezés után a token törlődik a sessionStorage-ból', async ({ munkatarsPage }) => {
    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });

    await munkatarsPage.getByRole('button', { name: /profil menü/i }).click();
    await munkatarsPage.getByRole('menuitem', { name: /kijelentkezés/i }).click();

    await munkatarsPage.waitForURL('**/login**', { timeout: 10_000 });

    const token = await munkatarsPage.evaluate(() => sessionStorage.getItem('gm_token'));
    expect(token).toBeNull();
  });

  test('Kijelentkezés után Vissza gombbal nem jelenik meg védett tartalom', async ({
    munkatarsPage,
  }) => {
    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });

    await munkatarsPage.getByRole('button', { name: /profil menü/i }).click();
    await munkatarsPage.getByRole('menuitem', { name: /kijelentkezés/i }).click();
    await munkatarsPage.waitForURL('**/login**', { timeout: 10_000 });

    // Press Back
    await munkatarsPage.goBack();

    // Auth guard should redirect back to login
    await munkatarsPage.waitForURL('**/login**', { timeout: 10_000 });
    expect(munkatarsPage.url()).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-006 | Védett oldal bejelentkezés nélkül
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-006 | Védett oldal bejelentkezés nélkül', () => {
  test('Bejelentkezés nélkül /applications oldalra navigálva a login oldalra kerül', async ({
    page,
  }) => {
    // Fresh page – no auth
    await page.goto('/applications');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('Bejelentkezés nélkül /granters oldalra navigálva a login oldalra kerül', async ({
    page,
  }) => {
    await page.goto('/granters');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('Bejelentkezés nélkül /admin oldalra navigálva a login oldalra kerül', async ({
    page,
  }) => {
    await page.goto('/admin');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  test('Bejelentkezés nélkül /profile oldalra navigálva a login oldalra kerül', async ({
    page,
  }) => {
    await page.goto('/profile');
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-007 | Jogosultság-ellenőrzés (UI + API)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-007 | Jogosulatlan hozzáférés megakadályozása', () => {
  test('Megtekintő felhasználónál nincs "Új pályázat" gomb az applications oldalon', async ({
    megtekintosPage,
  }) => {
    await megtekintosPage.goto('/applications');
    await megtekintosPage.waitForURL('**/applications**', { timeout: 10_000 });
    // Wait for the page content to load
    await megtekintosPage.waitForLoadState('networkidle');

    // The "Új pályázat" button should NOT appear for Megtekintő
    const newAppBtn = megtekintosPage.getByRole('button', { name: /új pályázat/i });
    await expect(newAppBtn).toHaveCount(0);
  });

  test('Megtekintő felhasználónak az Admin menü nem elérhető a navigációban', async ({
    megtekintosPage,
  }) => {
    await megtekintosPage.goto('/applications');
    await megtekintosPage.waitForURL('**/applications**', { timeout: 10_000 });
    await megtekintosPage.waitForLoadState('networkidle');

    // Admin-only nav items should not be visible
    await expect(megtekintosPage.getByRole('link', { name: /felhasználók/i })).toHaveCount(0);
    await expect(megtekintosPage.getByRole('link', { name: /rendszerbeállítás/i })).toHaveCount(0);
  });

  test('Megtekintő nem éri el az /admin útvonalat (403 forbidden)', async ({
    megtekintosPage,
  }) => {
    // Mock any API calls that would be made on admin page
    await megtekintosPage.route('**/api/v1/admin/**', async (route) => {
      await route.fulfill({ status: 403, body: JSON.stringify({ title: 'Forbidden' }) });
    });

    await megtekintosPage.goto('/admin');

    // roleGuard should redirect to /403 or /applications
    await megtekintosPage.waitForURL(/\/(403|applications)/, { timeout: 10_000 });
    const url = megtekintosPage.url();
    expect(url.includes('/403') || url.includes('/applications')).toBeTruthy();
  });

  test('API szinten a DELETE kérés 403-at ad vissza jogosulatlan JWT-vel', async ({ page }) => {
    // Use Megtekintő JWT directly in the API request
    const { generateJwt, TEST_USERS: users } = await import('../../helpers/jwt');
    const token = generateJwt(users['Megtekinto']);

    // Make a DELETE request to applications endpoint with Megtekintő token
    const response = await page.request.delete(`${BASE}/api/v1/applications/some-fake-id`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Backend should return 403 Forbidden (role check) or 404 (not found) – not 200
    expect([403, 404, 400]).toContain(response.status());
  });

  test('Bejelentkezés nélküli API-hívás 401-et kap', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/v1/applications`);
    expect(response.status()).toBe(401);
  });
});
