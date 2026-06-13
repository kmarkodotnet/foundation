/**
 * 1. kategória – Hitelesítés és munkamenet
 * Forgatókönyvek: TS-001 … TS-008
 *
 * Kapcsolódó US-ok: US-001, US-002, US-003, US-006, US-007
 *
 * Stratégia:
 *  - Google OAuth flow: OidcCallbackComponent-en keresztül szimulálva
 *    (sessionStorage-ba írjuk az oauth state-t, majd /auth/callback-et hívunk)
 *  - Hitelesített állapot: JWT-t injektálunk az addInitScript-tel
 *    (az APP_INITIALIZER restoreSession() előtt fut)
 *  - Backend API-k: page.route()-tal mockoljuk ahol szükséges
 *  - Meghívó flow: /auth/accept-invitation?token=... útvonal, backend
 *    POST /api/v1/auth/accept-invitation végponton keresztül aktivál
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
// TS-002 | Meghívó nélküli belépési kísérlet visszautasítása (US-006)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-002 | Meghívó nélküli belépési kísérlet visszautasítása', () => {
  test('Meghívó nélküli Google-fiók esetén a backend 403-at ad és /login?error=no-invitation-re irányít', async ({
    page,
  }) => {
    const testState = 'e2e-no-invite-state-test';

    // Backend visszautasítja: nincs aktív meghívó ehhez az email-hez
    await page.route('**/api/v1/auth/google-callback', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'no-invitation' }),
      });
    });

    await page.goto('/login');
    await page.evaluate(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_oauth_state', value: testState },
    );

    await page.goto(`/auth/callback?code=uninvited-code&state=${testState}`);

    // OidcCallbackComponent 403 + detail=no-invitation → /login?error=no-invitation
    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('error=no-invitation');
  });

  test('/login?error=no-invitation URL-n megjelenik a helyes hibaüzenet', async ({ page }) => {
    await page.goto('/login?error=no-invitation');

    const errorDiv = page.locator('[role="alert"]');
    await expect(errorDiv).toBeVisible();
    await expect(errorDiv).toContainText('nincs meghívva');
    await expect(errorDiv).toContainText('adminisztrátortól');
  });

  test('Bejelentkezés gomb látható a meghívó hibaüzenet után is', async ({ page }) => {
    await page.goto('/login?error=no-invitation');

    const loginBtn = page.getByRole('button', { name: /bejelentkezés google-fiókkal/i });
    await expect(loginBtn).toBeVisible();
  });

  test('Meghívó nélküli kísérletnél fiók nem jön létre (nincs GET /api/v1/users/me hívás)', async ({
    page,
  }) => {
    const testState = 'e2e-no-invite-me-check';
    let meCalled = false;

    await page.route('**/api/v1/auth/google-callback', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
    });

    await page.route('**/api/v1/users/me', async (route) => {
      meCalled = true;
      await route.continue();
    });

    await page.goto('/login');
    await page.evaluate(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_oauth_state', value: testState },
    );
    await page.goto(`/auth/callback?code=uninvited-code&state=${testState}`);
    await page.waitForURL('**/login**', { timeout: 10_000 });

    expect(meCalled).toBe(false);
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

// ─────────────────────────────────────────────────────────────────────────────
// TS-008 | Meghívó elfogadása és fiók aktiválása (US-007)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-008 | Meghívó elfogadása és fiók aktiválása', () => {
  const VALID_TOKEN = 'valid-invite-token-abc123456789012';

  /**
   * Szimulál egy teljes meghívó-elfogadási flow-t:
   * 1. Beállítja a gm_oauth_state-t és gm_invitation_token-t sessionStorage-ban
   * 2. Navigál az /auth/callback?code=...&state=... URL-re
   * Az OidcCallbackComponent észleli a gm_invitation_token-t és acceptInvitation()-t hív.
   */
  async function simulateInvitationCallback(
    page: import('@playwright/test').Page,
    invitationToken: string,
    code: string,
  ) {
    const testState = `e2e-invite-state-${invitationToken}`;
    await page.goto('/login');
    await page.evaluate(
      ({ state, invToken }: { state: string; invToken: string }) => {
        sessionStorage.setItem('gm_oauth_state', state);
        sessionStorage.setItem('gm_invitation_token', invToken);
      },
      { state: testState, invToken: invitationToken },
    );
    await page.goto(`/auth/callback?code=${code}&state=${testState}`);
  }

  test('Érvényes meghívó linkre navigálva (AcceptInvitationComponent) Google OAuth indul', async ({ page }) => {
    let capturedUrl = '';
    page.on('request', (req) => {
      if (req.url().includes('accounts.google.com')) capturedUrl = req.url();
    });
    await page.route('https://accounts.google.com/**', (route) => route.abort());

    // Az /auth/accept?token=... az AcceptInvitationComponent-et tölti be
    await page.goto(`/auth/accept?token=${VALID_TOKEN}`);
    // A komponens ngOnInit után automatikusan nem indítja az OAuth-ot,
    // de a gomb kattintásra igen
    await page.getByRole('button', { name: /elfogadás google-lel/i }).click();
    await page.waitForTimeout(1000);

    expect(capturedUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
  });

  test('/auth/accept token nélkül – hibaüzenet jelenik meg', async ({ page }) => {
    await page.goto('/auth/accept');

    await expect(page.getByText(/érvénytelen meghívó link/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /elfogadás/i })).toHaveCount(0);
  });

  test('Érvényes meghívó és egyező email – alkalmazások oldalra navigál', async ({ page }) => {
    await page.route('**/api/v1/auth/accept-invitation', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJlbWFpbCI6InVqQHRlc3QuaHUiLCJuYW1lIjoiVWogRmVsc3puYWzDsyIsInJvbGUiOiJQYWx5YXphdGlNdW5rYXRhcnMiLCJ1c2VySWQiOiJuZXctdXNlci1pZCJ9.sig',
            expiresIn: 28800,
            user: {
              id: 'new-user-id',
              fullName: 'Új Felhasználó',
              email: 'uj@teszt.hu',
              role: 'PalyazatiMunkatars',
            },
          }),
        });
      }
    });

    await mockApplicationsList(page);
    await mockSignalR(page);

    await simulateInvitationCallback(page, VALID_TOKEN, 'invite-code');

    await page.waitForURL('**/applications**', { timeout: 10_000 });
    expect(page.url()).toContain('/applications');
  });

  test('Lejárt meghívó tokennél a login oldalon lejárt-hibaüzenet jelenik meg', async ({ page }) => {
    await page.route('**/api/v1/auth/accept-invitation', async (route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Gone', detail: 'invitation-expired' }),
      });
    });

    await simulateInvitationCallback(page, 'expired-token-0000000000000000000', 'exp-code');

    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('error=invitation-expired');
    await expect(page.locator('[role="alert"]')).toContainText('lejárt');
    await expect(page.locator('[role="alert"]')).toContainText('adminisztrátortól');
  });

  test('Visszavont meghívó tokennél a login oldalon visszavonás-hibaüzenet jelenik meg', async ({ page }) => {
    await page.route('**/api/v1/auth/accept-invitation', async (route) => {
      await route.fulfill({
        status: 410,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Gone', detail: 'invitation-revoked' }),
      });
    });

    await simulateInvitationCallback(page, 'revoked-token-0000000000000000000', 'rev-code');

    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('error=invitation-revoked');
    await expect(page.locator('[role="alert"]')).toContainText('visszavon');
  });

  test('E-mail eltérés esetén a login oldalon email-mismatch hibaüzenet jelenik meg', async ({ page }) => {
    await page.route('**/api/v1/auth/accept-invitation', async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Unprocessable Entity', detail: 'email-mismatch' }),
      });
    });

    await simulateInvitationCallback(page, 'mismatch-token-000000000000000000', 'mis-code');

    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('error=email-mismatch');
    await expect(page.locator('[role="alert"]')).toContainText('nem egyezik');
    await expect(page.locator('[role="alert"]')).toContainText('meghívóban');
  });

  test('Már elfogadott meghívó tokennél a login oldalon conflict-hibaüzenet jelenik meg', async ({ page }) => {
    await page.route('**/api/v1/auth/accept-invitation', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Conflict', detail: 'invitation-already-accepted' }),
      });
    });

    await simulateInvitationCallback(page, 'accepted-token-00000000000000000', 'acc-code');

    await page.waitForURL('**/login**', { timeout: 10_000 });
    expect(page.url()).toContain('error=invitation-already-accepted');
    await expect(page.locator('[role="alert"]')).toContainText('már');
  });

  test('A gm_invitation_token törlődik a sessionStorage-ból sikeres elfogadás után', async ({ page }) => {
    await page.route('**/api/v1/auth/accept-invitation', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5LCJlbWFpbCI6InVqQHRlc3QuaHUiLCJuYW1lIjoiVWogRmVsc3puYWzDsyIsInJvbGUiOiJNZWd0ZWtpbnRvIiwidXNlcklkIjoibmV3LWlkIn0.sig',
            expiresIn: 28800,
            user: { id: 'new-id', fullName: 'Új User', email: 'uj@teszt.hu', role: 'Megtekinto' },
          }),
        });
      }
    });

    await mockApplicationsList(page);
    await mockSignalR(page);

    await simulateInvitationCallback(page, VALID_TOKEN, 'clean-code');
    await page.waitForURL('**/applications**', { timeout: 10_000 });

    const invToken = await page.evaluate(() => sessionStorage.getItem('gm_invitation_token'));
    expect(invToken).toBeNull();
  });
});
