/**
 * 25. kategória – Pályázat létrehozása
 * Forgatókönyvek: TS-240, TS-241, TS-242, TS-243, TS-244
 *
 * Stratégia:
 *  - TS-240: Hozzáférés – Admin/Munkatárs eléri, Megtekintő /403-ra kerül
 *  - TS-241: Pályáztató dropdown – GET /api/v1/granters alapján feltöltődik
 *  - TS-242: Mentés – POST /api/v1/applications hívás → részletező oldalra navigál;
 *            API hiba esetén hibaüzenet snackbar
 *  - TS-243: Validáció – kezdetben Mentés disabled; üres cím → disabled + mat-error;
 *            múltbeli határidő → pastDate hiba
 *  - TS-244: Navigáció – Mégsem és Vissza gomb visszanavigál /applications-ra
 *
 * API végpontok:
 *   GET  /api/v1/granters?activeOnly=true  → Granter[]
 *   POST /api/v1/applications              → ApplicationDetail
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000025';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000025';

const GRANTER = {
  id: GRANTER_ID,
  name: 'Teszt Alapítvány',
  isActive: true,
  contactEmail: null,
  contactPhone: null,
  websiteUrl: null,
  notes: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const CREATED_APP = {
  id: APP_ID,
  title: 'Teszt Pályázat 2026',
  identifier: null,
  description: null,
  status: 'Draft',
  granterId: GRANTER_ID,
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2030-12-31',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: null,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Admin Felhasználó',
  createdAt: '2026-06-06T10:00:00Z',
  updatedAt: '2026-06-06T10:00:00Z',
  workflowSteps: [],
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-240 | Hozzáférés-vezérlés ─────────────────────────────────────────────

test.describe('TS-240 | Pályázat létrehozása hozzáférés', () => {
  test('Munkatárs eléri – "Új pályázat rögzítése" fejléc látható', async ({ munkatarsPage: page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: 'Új pályázat rögzítése' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Admin eléri – "Új pályázat rögzítése" fejléc látható', async ({ adminPage: page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: 'Új pályázat rögzítése' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Megtekintő nem fér hozzá – /403-ra irányítja', async ({ megtekintosPage: page }) => {
    await page.goto('/applications/new');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });
});

// ─── TS-241 | Pályáztató dropdown betöltése ───────────────────────────────────

test.describe('TS-241 | Pályáztató dropdown betöltése', () => {
  test('A GET /granters válasz alapján a pályáztatók megjelennek a dropdownban', async ({ munkatarsPage: page }) => {
    // Felülírjuk a fixture granters mock-ját valódi adatokkal
    await page.route('**/api/v1/granters**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([GRANTER]));
      return route.continue();
    });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    // Megnyitjuk a dropdownt
    await page.locator('mat-select[formcontrolname="granterId"]').click();

    await expect(
      page.locator('mat-option', { hasText: 'Teszt Alapítvány' }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Pályáztató nélkül a Mentés gomb disabled marad', async ({ munkatarsPage: page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    // Cím kitöltése (pályáztató és határidő hiányzik)
    await page.locator('input[formcontrolname="title"]').fill('Teszt cím');

    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled({ timeout: 3_000 });
  });
});

// ─── TS-242 | Mentés (POST) ───────────────────────────────────────────────────

test.describe('TS-242 | Pályázat mentése', () => {
  test('Form kitöltve → POST hívás → navigál a részletező oldalra', async ({ munkatarsPage: page }) => {
    let postCalled = false;

    // Granterek mock (felülírjuk a fixture-t)
    await page.route('**/api/v1/granters**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([GRANTER]));
      return route.continue();
    });

    // POST végpont
    await page.route('**/api/v1/applications', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill(ok(CREATED_APP));
      }
      return route.continue();
    });

    // Részletező oldal mock (navigálás utáni GET)
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(CREATED_APP));
      return route.continue();
    });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    // Cím kitöltése
    await page.locator('input[formcontrolname="title"]').fill('Teszt Pályázat 2026');

    // Pályáztató kiválasztása
    await page.locator('mat-select[formcontrolname="granterId"]').click();
    await page.locator('mat-option', { hasText: 'Teszt Alapítvány' }).click();

    // Beadási határidő kitöltése (jövőbeli dátum Chrome en-US formátumban)
    const deadlineInput = page.locator('input[formcontrolname="submissionDeadline"]');
    await deadlineInput.fill('12/31/2030');
    await deadlineInput.press('Tab');

    // Mentés
    await page.getByRole('button', { name: /mentés/i }).click();

    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}$`), { timeout: 8_000 });
    expect(postCalled).toBe(true);
  });

  test('API hiba esetén hibaüzenet snackbar jelenik meg', async ({ munkatarsPage: page }) => {
    // Granterek mock
    await page.route('**/api/v1/granters**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([GRANTER]));
      return route.continue();
    });

    // POST – szerverhiba
    await page.route('**/api/v1/applications', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Szerverhiba.' }),
        });
      }
      return route.continue();
    });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[formcontrolname="title"]').fill('Teszt Pályázat 2026');
    await page.locator('mat-select[formcontrolname="granterId"]').click();
    await page.locator('mat-option', { hasText: 'Teszt Alapítvány' }).click();

    const deadlineInput = page.locator('input[formcontrolname="submissionDeadline"]');
    await deadlineInput.fill('12/31/2030');
    await deadlineInput.press('Tab');

    await page.getByRole('button', { name: /mentés/i }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: 'Nem sikerült létrehozni a pályázatot' }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-243 | Validáció ───────────────────────────────────────────────────────

test.describe('TS-243 | Validáció', () => {
  test('Kezdetben a Mentés gomb disabled – a form érvénytelen', async ({ munkatarsPage: page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled({ timeout: 5_000 });
  });

  test('Üres cím esetén mat-error jelenik meg és a Mentés disabled marad', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/granters**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[formcontrolname="title"]');
    await titleInput.click();
    await titleInput.press('Tab');

    await expect(
      page.locator('mat-error', { hasText: 'A pályázat neve kötelező' }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled();
  });

  test('Múltbeli beadási határidő esetén validációs hiba jelenik meg', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/granters**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([GRANTER]));
      return route.continue();
    });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    const deadlineInput = page.locator('input[formcontrolname="submissionDeadline"]');
    await deadlineInput.fill('1/1/2020');
    await deadlineInput.press('Tab');

    await expect(
      page.locator('mat-error', { hasText: 'jövőbeli' }),
    ).toBeVisible({ timeout: 3_000 });
  });
});

// ─── TS-244 | Navigáció ───────────────────────────────────────────────────────

test.describe('TS-244 | Navigáció – Mégsem és Vissza', () => {
  test('Mégsem gomb visszanavigál /applications-ra (POST nélkül)', async ({ munkatarsPage: page }) => {
    let postCalled = false;

    await page.route('**/api/v1/applications', (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        return route.fulfill(ok(CREATED_APP));
      }
      return route.continue();
    });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Mégsem' }).click();

    await expect(page).toHaveURL(/\/applications(\?|$)/, { timeout: 5_000 });
    expect(postCalled).toBe(false);
  });

  test('Vissza gomb visszanavigál /applications-ra', async ({ munkatarsPage: page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Vissza"]');

    await expect(page).toHaveURL(/\/applications(\?|$)/, { timeout: 5_000 });
  });
});
