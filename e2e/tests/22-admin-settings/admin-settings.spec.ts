/**
 * 22. kategória – Admin: Rendszerbeállítások
 * Forgatókönyvek: TS-210, TS-211, TS-212, TS-213
 *
 * Stratégia:
 *  - TS-210: Hozzáférés – Admin eléri, Munkatárs /403-ra kerül
 *  - TS-211: Beállítások betöltése – mezők a GET válasz értékeivel töltődnek be
 *  - TS-212: Mentés – PUT hívás, "Beállítások mentve." snackbar megjelenik
 *  - TS-213: Validáció – 0 nap értéknél hiba, Mentés gomb disabled
 *
 * API végpontok:
 *   GET /api/v1/system-settings → SystemSettings
 *   PUT /api/v1/system-settings → SystemSettings
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const SETTINGS = {
  organizationName: 'Teszt Alapítvány',
  defaultUserRole: 'Megtekinto',
  notificationWarningDays: 7,
  spendingWarningDays: 14,
  maxFileSizeMb: 50,
  updatedAt: '2026-06-01T10:00:00Z',
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-210 | Hozzáférés-vezérlés ─────────────────────────────────────────────

test.describe('TS-210 | Rendszerbeállítások hozzáférés', () => {
  test('Admin hozzáfér – "Rendszerbeállítások" fejléc látható', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Rendszerbeállítások' })).toBeVisible({ timeout: 8_000 });
  });

  test('Munkatárs nem fér hozzá – /403-ra irányítja', async ({ munkatarsPage: page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });

  test('Admin sidebar menüben látja a "Rendszerbeállítások" linket', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a[routerlink="/admin/settings"]')).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-211 | Beállítások betöltése ──────────────────────────────────────────

test.describe('TS-211 | Beállítások betöltése', () => {
  test('GET válasz értékei megjelennek az űrlapmezőkben', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Szervezet neve mező
    const orgName = page.locator('input[formcontrolname="organizationName"]');
    await expect(orgName).toHaveValue('Teszt Alapítvány', { timeout: 5_000 });

    // Beadási határidő figyelmeztetés
    const notifDays = page.locator('input[formcontrolname="notificationWarningDays"]');
    await expect(notifDays).toHaveValue('7');

    // Felhasználási határidő figyelmeztetés
    const spendDays = page.locator('input[formcontrolname="spendingWarningDays"]');
    await expect(spendDays).toHaveValue('14');

    // Maximum fájlméret
    const maxFile = page.locator('input[formcontrolname="maxFileSizeMb"]');
    await expect(maxFile).toHaveValue('50');
  });

  test('Három kártya-szekció látható: Szervezet, Értesítések, Fájlkezelés', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('mat-card-title', { hasText: 'Szervezet' })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('mat-card-title', { hasText: 'Értesítések' })).toBeVisible();
    await expect(page.locator('mat-card-title', { hasText: 'Fájlkezelés' })).toBeVisible();
  });
});

// ─── TS-212 | Beállítások mentése ────────────────────────────────────────────

test.describe('TS-212 | Beállítások mentése', () => {
  test('Mentés gomb – PUT hívás és "Beállítások mentve." snackbar', async ({ adminPage: page }) => {
    let putCalled = false;

    await page.route('**/api/v1/system-settings**', (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok(SETTINGS));
      if (method === 'PUT') {
        putCalled = true;
        return route.fulfill(ok({ ...SETTINGS, updatedAt: new Date().toISOString() }));
      }
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    // Szervezet nevét módosítjuk
    const orgName = page.locator('input[formcontrolname="organizationName"]');
    await orgName.clear();
    await orgName.fill('Módosított Alapítvány');

    await page.getByRole('button', { name: /mentés/i }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: 'Beállítások mentve' }),
    ).toBeVisible({ timeout: 5_000 });
    expect(putCalled).toBe(true);
  });

  test('API hiba esetén hibaüzenet snackbar jelenik meg', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok(SETTINGS));
      if (method === 'PUT') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Szerverhiba történt.' }),
        });
      }
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /mentés/i }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: 'Szerverhiba' }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-213 | Validáció ────────────────────────────────────────────────────────

test.describe('TS-213 | Validáció', () => {
  test('Üres szervezetnév esetén Mentés gomb disabled', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const orgName = page.locator('input[formcontrolname="organizationName"]');
    await orgName.clear();

    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled({ timeout: 3_000 });
  });

  test('Értesítési napok 0 értéknél validációs hiba és Mentés disabled', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const notifDays = page.locator('input[formcontrolname="notificationWarningDays"]');
    await notifDays.clear();
    await notifDays.fill('0');
    await notifDays.blur();

    await expect(page.locator('mat-error', { hasText: '1–90 nap között' })).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled();
  });

  test('Maximum fájlméret 0 MB értéknél validációs hiba', async ({ adminPage: page }) => {
    await page.route('**/api/v1/system-settings**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SETTINGS));
      return route.continue();
    });

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');

    const maxFile = page.locator('input[formcontrolname="maxFileSizeMb"]');
    await maxFile.clear();
    await maxFile.fill('0');
    await maxFile.blur();

    await expect(page.locator('mat-error', { hasText: '1–500 MB között' })).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled();
  });
});
