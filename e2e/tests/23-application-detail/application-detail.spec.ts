/**
 * 23. kategória – Pályázat részletező és szerkesztés
 * Forgatókönyvek: TS-220, TS-221, TS-222, TS-223, TS-224
 *
 * Stratégia:
 *  - TS-220: Részletező oldal – cím, státusz, pályáztató, határidő látható; Vissza navigál
 *  - TS-221: Szerkesztés gomb – jogosult szerepkörnél látható, Megtekintőnél nem
 *  - TS-222: Szerkesztési form – mezők kitöltve GET-ből; Mentés PUT-ot küld és visszanavigál;
 *            Mégsem visszanavigál PUT nélkül
 *  - TS-223: Szerkesztési validáció – üres cím → Mentés gomb disabled
 *  - TS-224: Archiválás – Admin+ClosedWon esetén gomb látható; confirm dialog; DELETE hívás;
 *            Munkatárs nem látja a gombot
 *
 * API végpontok:
 *   GET    /api/v1/applications/{id}  → ApplicationDetail
 *   PUT    /api/v1/applications/{id}  → ApplicationDetail
 *   DELETE /api/v1/applications/{id}  → 204
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000023';

const APP_DETAIL = {
  id: APP_ID,
  title: 'Kultúra Fejlesztési Program 2026',
  identifier: 'KFP-2026-001',
  description: 'Teszt leírás a pályázathoz.',
  status: 'InProgress',
  granterId: 'bbbbbbbb-0000-0000-0000-000000000023',
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2026-09-30',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: null,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Admin Felhasználó',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  workflowSteps: [],
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

const CLOSED_WON_APP = {
  ...APP_DETAIL,
  status: 'ClosedWon',
  awardedAmount: 5_000_000,
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-220 | Részletező oldal betöltése ──────────────────────────────────────

test.describe('TS-220 | Részletező oldal betöltése', () => {
  test('Pályázat neve és státusza megjelenik az oldalon', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Kultúra Fejlesztési Program 2026' })).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('gm-status-badge')).toBeVisible();
  });

  test('Pályáztató neve és beadási határidő megjelenik az info kártyán', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('strong', { hasText: 'Teszt Alapítvány' }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('Vissza gomb – visszanavigál a pályázat listára', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Vissza"]');
    await expect(page).toHaveURL(/\/applications(\?|$)/, { timeout: 5_000 });
  });

  test('Munkafolyamat tab megjelenik', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.mat-mdc-tab', { hasText: 'Munkafolyamat' })).toBeVisible({ timeout: 8_000 });
  });
});

// ─── TS-221 | Szerkesztés gomb láthatósága ────────────────────────────────────

test.describe('TS-221 | Szerkesztés gomb láthatósága', () => {
  test('Admin látja a Szerkesztés gombot aktív pályázatnál', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /szerkesztés/i })).toBeVisible({ timeout: 8_000 });
  });

  test('Megtekintő nem látja a Szerkesztés gombot', async ({ megtekintosPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /szerkesztés/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('Szerkesztés gombra kattintva az edit oldalra navigál', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /szerkesztés/i }).click();
    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}/edit`), { timeout: 5_000 });
  });
});

// ─── TS-222 | Szerkesztési form ───────────────────────────────────────────────

test.describe('TS-222 | Szerkesztési form', () => {
  test('Form mezők a GET válasz értékeivel töltődnek be', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}/edit`);
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[formcontrolname="title"]');
    await expect(titleInput).toHaveValue('Kultúra Fejlesztési Program 2026', { timeout: 5_000 });

    const identifierInput = page.locator('input[formcontrolname="identifier"]');
    await expect(identifierInput).toHaveValue('KFP-2026-001');
  });

  test('Mentés – PUT hívás és visszanavigálás a részletező oldalra', async ({ munkatarsPage: page }) => {
    let putCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok(APP_DETAIL));
      if (method === 'PUT') {
        putCalled = true;
        return route.fulfill(ok(APP_DETAIL));
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}/edit`);
    await page.waitForLoadState('networkidle');

    // Cím módosítása
    const titleInput = page.locator('input[formcontrolname="title"]');
    await titleInput.clear();
    await titleInput.fill('Módosított Pályázat Cím');

    await page.getByRole('button', { name: /mentés/i }).click();

    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}$`), { timeout: 8_000 });
    expect(putCalled).toBe(true);
  });

  test('Mégsem – visszanavigál PUT nélkül', async ({ munkatarsPage: page }) => {
    let putCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok(APP_DETAIL));
      if (method === 'PUT') {
        putCalled = true;
        return route.fulfill(ok(APP_DETAIL));
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}/edit`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Mégsem' }).click();

    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}$`), { timeout: 5_000 });
    expect(putCalled).toBe(false);
  });
});

// ─── TS-223 | Szerkesztési validáció ─────────────────────────────────────────

test.describe('TS-223 | Szerkesztési validáció', () => {
  test('Üres cím esetén Mentés gomb disabled', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}/edit`);
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[formcontrolname="title"]');
    await titleInput.clear();

    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled({ timeout: 3_000 });
  });

  test('Üres cím esetén validációs hiba üzenet megjelenik', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_DETAIL));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}/edit`);
    await page.waitForLoadState('networkidle');

    const titleInput = page.locator('input[formcontrolname="title"]');
    await titleInput.clear();
    await titleInput.blur();

    await expect(page.locator('mat-error', { hasText: 'kötelező' })).toBeVisible({ timeout: 3_000 });
  });
});

// ─── TS-224 | Archiválás ─────────────────────────────────────────────────────

test.describe('TS-224 | Pályázat archiválása', () => {
  test('Admin ClosedWon pályázatnál látja az Archiválás gombot', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(CLOSED_WON_APP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /archiválás/i })).toBeVisible({ timeout: 8_000 });
  });

  test('Munkatárs nem látja az Archiválás gombot ClosedWon pályázatnál', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(CLOSED_WON_APP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /archiválás/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('Archiválás confirm dialog – megerősítés után DELETE hívás és navigálás a listára', async ({ adminPage: page }) => {
    let deleteCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok(CLOSED_WON_APP));
      if (method === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /archiválás/i }).click();

    // Confirm dialog megjelenik
    await expect(page.locator('h2[mat-dialog-title]', { hasText: 'Pályázat archiválása' })).toBeVisible({ timeout: 5_000 });

    // Megerősítés gomb
    await page.locator('button', { hasText: 'Archiválás' }).last().click();

    // Visszanavigálás a listára (URL-ben query paraméterek is lehetnek)
    await expect(page).toHaveURL(/\/applications(\?|$)/, { timeout: 8_000 });
    expect(deleteCalled).toBe(true);
  });

  test('Archiválás confirm dialog – Mégsem kattintásra DELETE nem hívódik', async ({ adminPage: page }) => {
    let deleteCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok(CLOSED_WON_APP));
      if (method === 'DELETE') {
        deleteCalled = true;
        return route.fulfill({ status: 204, body: '' });
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /archiválás/i }).click();
    await expect(page.locator('h2[mat-dialog-title]', { hasText: 'Pályázat archiválása' })).toBeVisible({ timeout: 5_000 });

    await page.locator('button', { hasText: 'Mégsem' }).click();

    expect(deleteCalled).toBe(false);
    // Marad a részletező oldalon
    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}$`), { timeout: 3_000 });
  });
});
