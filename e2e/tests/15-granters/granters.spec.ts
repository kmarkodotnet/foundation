/**
 * 15. kategória – Pályáztatók kezelése
 * Forgatókönyvek: TS-140, TS-141, TS-142, TS-143
 *
 * Stratégia:
 *  - TS-140: Munkatárs új pályáztatót rögzít → navigál a részletező oldalra
 *  - TS-141: Duplikált név → hibás API válasz → hibaüzenet snackbar
 *  - TS-142: Admin inaktiválja a pályáztatót → státusz megváltozik
 *  - TS-143: Részletező oldal – pályáztató adatai és kapcsolt pályázatok
 *
 * API végpontok:
 *   GET    /api/v1/granters            → Granter[]
 *   GET    /api/v1/granters/{id}       → GranterDetail
 *   POST   /api/v1/granters            → Granter
 *   PATCH  /api/v1/granters/{id}/deactivate
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const GRANTER_ID = 'aaaaaaaa-bbbb-0000-0000-000000000015';
const NEW_GRANTER_ID = 'aaaaaaaa-bbbb-0000-0000-000000000016';
const APP_ID = 'dddddddd-eeee-0000-0000-000000000015';

// ─── Mock adatok ─────────────────────────────────────────────────────────────

const ACTIVE_GRANTER = {
  id: GRANTER_ID,
  name: 'Teszt Alapítvány',
  description: 'Egy tesztelési célú alapítvány leírása.',
  phoneNumber: '+36 1 234 5678',
  email: 'info@tesztalapítvány.hu',
  status: 'Active',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
  applications: [
    {
      id: APP_ID,
      title: 'Kultúra Fejlesztési Program',
      identifier: 'KFP-2026',
      status: 'Active',
      awardedAmount: null,
    },
  ],
};

const INACTIVE_GRANTER = {
  ...ACTIVE_GRANTER,
  status: 'Inactive',
};

const CREATED_GRANTER = {
  id: NEW_GRANTER_ID,
  name: 'Új Teszt Pályáztató',
  description: null,
  phoneNumber: null,
  email: 'uj@pályáztató.hu',
  status: 'Active',
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  applications: [],
};

// ─── Segédfüggvény ────────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-140 | Új pályáztató rögzítése ────────────────────────────────────────

test.describe('TS-140 | Új pályáztató rögzítése', () => {
  test('Munkatárs új pályáztatót rögzít – navigál a részlező oldalra', async ({ munkatarsPage: page }) => {
    // POST /granters → visszaadja az új pályáztatót
    await page.route('**/api/v1/granters', (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(CREATED_GRANTER));
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    // GET /granters/{newId} → visszaadja az új pályáztató részleteit
    await page.route(`**/api/v1/granters/${NEW_GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok({ ...CREATED_GRANTER, applications: [] }));
      return route.continue();
    });

    await page.goto('/granters/new');
    await page.waitForLoadState('networkidle');

    // Megnevezés
    await page.locator('input[formcontrolname="name"]').fill('Új Teszt Pályáztató');

    // E-mail
    await page.locator('input[formcontrolname="email"]').fill('uj@pályáztató.hu');

    // Mentés gomb aktív
    const saveBtn = page.getByRole('button', { name: /mentés/i });
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();

    // Navigálás a detail oldalra
    await expect(page).toHaveURL(new RegExp(`/granters/${NEW_GRANTER_ID}`), { timeout: 8_000 });
    await expect(page.getByText('Új Teszt Pályáztató')).toBeVisible({ timeout: 5_000 });
  });

  test('Mentés gomb le van tiltva kötelező név mező hiányában', async ({ munkatarsPage: page }) => {
    await page.goto('/granters/new');
    await page.waitForLoadState('networkidle');

    // Üres form → Mentés tiltva
    const saveBtn = page.getByRole('button', { name: /mentés/i });
    await expect(saveBtn).toBeDisabled();

    // E-mail kitöltve de név üres → még mindig tiltva
    await page.locator('input[formcontrolname="email"]').fill('test@test.hu');
    await expect(saveBtn).toBeDisabled();
  });

  test('Érvénytelen e-mail formátum esetén hibaüzenet jelenik meg', async ({ munkatarsPage: page }) => {
    await page.goto('/granters/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[formcontrolname="name"]').fill('Valami Alapítvány');
    await page.locator('input[formcontrolname="email"]').fill('rossz-email');
    await page.locator('input[formcontrolname="email"]').blur();

    // Hibaüzenet az email mezőnél
    await expect(page.getByText('Érvénytelen e-mail cím formátum.')).toBeVisible({ timeout: 3_000 });
    // Mentés le van tiltva
    await expect(page.getByRole('button', { name: /mentés/i })).toBeDisabled();
  });
});

// ─── TS-141 | Duplikált pályáztató neve – hibakezelés ────────────────────────

test.describe('TS-141 | Duplikált pályáztató neve – hibakezelés', () => {
  test('Duplikált névvel való létrehozás kísérlete – hibaüzenet snackbar', async ({ munkatarsPage: page }) => {
    // POST /granters → 422 hibával tér vissza
    await page.route('**/api/v1/granters', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'ValidationError',
            title: 'Validation Error',
            errors: { name: ['Ez a pályáztató már szerepel a rendszerben.'] },
          }),
        });
      }
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/granters/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[formcontrolname="name"]').fill('Magyar Alapítvány');
    await page.getByRole('button', { name: /mentés/i }).click();

    // Hibaüzenet snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Nem sikerült létrehozni a pályáztatót.', { timeout: 8_000 });

    // Az oldal nem navigál el (még mindig a create oldalon vagyunk)
    await expect(page).toHaveURL(/\/granters\/new/, { timeout: 3_000 });
  });
});

// ─── TS-142 | Pályáztató inaktiválása ────────────────────────────────────────

test.describe('TS-142 | Pályáztató inaktiválása', () => {
  test('Admin inaktiválja a pályáztatót – státusz Inaktív lesz', async ({ adminPage: page }) => {
    let isActive = true;

    // Állapotfüggő GET mock
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill(ok(isActive ? ACTIVE_GRANTER : INACTIVE_GRANTER));
      }
      return route.continue();
    });
    // PATCH /deactivate
    await page.route(`**/api/v1/granters/${GRANTER_ID}/deactivate`, (route) => {
      if (route.request().method() === 'PATCH') {
        isActive = false;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
      return route.continue();
    });

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    // "Inaktiválás" gomb látható (aktív pályáztató, admin)
    const deactivateBtn = page.getByRole('button', { name: /inaktiválás/i });
    await expect(deactivateBtn).toBeVisible({ timeout: 5_000 });
    await deactivateBtn.click();

    // ConfirmDialog megnyílik
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText('Pályáztató inaktiválása')).toBeVisible();

    // Megerősítés
    await dialog.getByRole('button', { name: /^inaktiválás$/i }).click();

    // Státusz chip megváltozott: "Inaktív"
    await expect(page.locator('mat-chip').filter({ hasText: 'Inaktív' })).toBeVisible({ timeout: 8_000 });
    // "Inaktiválás" gomb eltűnik (már nem aktív)
    await expect(deactivateBtn).not.toBeVisible({ timeout: 5_000 });
  });

  test('Munkatárs nem látja az Inaktiválás gombot', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(ACTIVE_GRANTER));
      return route.continue();
    });

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Teszt Alapítvány')).toBeVisible({ timeout: 5_000 });

    // Inaktiválás gomb nem látható munkatársnak (csak adminnak)
    await expect(page.getByRole('button', { name: /inaktiválás/i })).not.toBeVisible();
  });

  test('Inaktiválás mégse – pályáztató marad aktív', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(ACTIVE_GRANTER));
      return route.continue();
    });

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /inaktiválás/i }).click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Mégse
    await dialog.getByRole('button', { name: /mégsem/i }).click();

    // Pályáztató aktív marad
    await expect(page.locator('mat-chip').filter({ hasText: 'Aktív' })).toBeVisible({ timeout: 3_000 });
  });
});

// ─── TS-143 | Pályáztató részletező oldal ────────────────────────────────────

test.describe('TS-143 | Pályáztató részletező oldal', () => {
  test('Részletező oldal megjeleníti a pályáztató adatait és kapcsolt pályázatait', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(ACTIVE_GRANTER));
      return route.continue();
    });

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    // Pályáztató neve
    await expect(page.getByText('Teszt Alapítvány')).toBeVisible({ timeout: 5_000 });
    // Státusz chip: Aktív
    await expect(page.locator('mat-chip').filter({ hasText: 'Aktív' })).toBeVisible();
    // E-mail cím
    await expect(page.getByText('info@tesztalapítvány.hu')).toBeVisible();
    // Telefonszám
    await expect(page.getByText('+36 1 234 5678')).toBeVisible();
    // Leírás
    await expect(page.getByText('Egy tesztelési célú alapítvány leírása.')).toBeVisible();
    // Kapcsolt pályázat neve
    await expect(page.getByText('Kultúra Fejlesztési Program')).toBeVisible();
  });

  test('Kapcsolt pályázatra kattintva navigál az alkalmazás részlető oldalára', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(ACTIVE_GRANTER));
      return route.continue();
    });
    // A pályázat részlető oldal hívásait mockoljuk
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: APP_ID, title: 'Kultúra Fejlesztési Program', status: 'Active', workflowSteps: [] }),
    }));

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Kultúra Fejlesztési Program')).toBeVisible({ timeout: 5_000 });

    // Kattintás a pályázat nevére → navigálás
    await page.getByText('Kultúra Fejlesztési Program').click();
    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}`), { timeout: 8_000 });
  });

  test('Üres kapcsolt pályázatok listája – üres állapot látható', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok({ ...ACTIVE_GRANTER, applications: [] }));
      return route.continue();
    });

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Teszt Alapítvány')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Nincs kapcsolt pályázat.')).toBeVisible();
  });
});

// ─── TS-142/B | Új pályáztató gomb – Elnök és Pénzügyes ─────────────────────

test.describe('TS-142/B | Új pályáztató gomb – Elnök és Pénzügyes', () => {
  test('Elnöknél az "Új pályáztató" gomb NEM látható', async ({ elnokPage: page }) => {
    await page.route('**/api/v1/granters', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/granters');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /új pályáztató/i })).toHaveCount(0);
  });

  test('Pénzügyesnél az "Új pályáztató" gomb NEM látható', async ({ penzugyesPage: page }) => {
    await page.route('**/api/v1/granters', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/granters');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /új pályáztató/i })).toHaveCount(0);
  });
});

// ─── TS-144 | Pályáztató részletező oldal – Megtekintő (R jog) ───────────────

test.describe('TS-144 | Pályáztató részletező oldal – Megtekintő (R jog)', () => {
  test('Megtekintő látja a pályáztató adatait és kapcsolt pályázatait', async ({ megtekintosPage: page }) => {
    await page.route(`**/api/v1/granters/${GRANTER_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(ACTIVE_GRANTER));
      return route.continue();
    });

    await page.goto(`/granters/${GRANTER_ID}`);
    await page.waitForLoadState('networkidle');

    // Pályáztató neve
    await expect(page.getByText('Teszt Alapítvány')).toBeVisible({ timeout: 5_000 });
    // Státusz chip: Aktív
    await expect(page.locator('mat-chip').filter({ hasText: 'Aktív' })).toBeVisible();
    // E-mail cím
    await expect(page.getByText('info@tesztalapítvány.hu')).toBeVisible();
    // Telefonszám
    await expect(page.getByText('+36 1 234 5678')).toBeVisible();
    // Leírás
    await expect(page.getByText('Egy tesztelési célú alapítvány leírása.')).toBeVisible();
    // Kapcsolt pályázat neve
    await expect(page.getByText('Kultúra Fejlesztési Program')).toBeVisible();

    // Inaktiválás gomb NEM látható Megtekintőnek
    await expect(page.getByRole('button', { name: /inaktiválás/i })).not.toBeVisible();
  });
});
