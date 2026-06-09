/**
 * 17. kategória – Kódszótárak
 * Forgatókönyvek: TS-160, TS-161, TS-162
 *
 * Stratégia:
 *  - TS-160: Admin új elemet rögzít egy kódszótárba → elem megjelenik a listában
 *  - TS-161: Admin deaktiválja a kódszótár elemet → státusz "Inaktív" lesz
 *  - TS-162: Admin törli a kódszótárat (confirm dialog) → kódszótár eltűnik
 *
 * API végpontok:
 *   GET    /api/v1/code-lists                            → CodeListDto[]
 *   POST   /api/v1/code-lists                            → CodeListDto
 *   DELETE /api/v1/code-lists/{id}                       → 204
 *   GET    /api/v1/code-lists/{id}/items                 → CodeListItemDto[]
 *   POST   /api/v1/code-lists/{id}/items                 → CodeListItemDto
 *   PUT    /api/v1/code-lists/{id}/items/{itemId}        → CodeListItemDto
 *   PATCH  /api/v1/code-lists/{id}/items/{itemId}/deactivate → CodeListItemDto
 *   PATCH  /api/v1/code-lists/{id}/items/{itemId}/activate   → CodeListItemDto
 */

import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const LIST_ID = 'cccccccc-0000-0000-0000-000000000017';
const SYSTEM_LIST_ID = 'cccccccc-1111-0000-0000-000000000017';
const ITEM_ID = 'dddddddd-0000-0000-0000-000000000017';
const NEW_ITEM_ID = 'dddddddd-1111-0000-0000-000000000017';

// ─── Mock adatok ─────────────────────────────────────────────────────────────

const USER_LIST = {
  id: LIST_ID,
  name: 'Teszt Kódszótár',
  isSystem: false,
  itemCount: 1,
};

const SYSTEM_LIST = {
  id: SYSTEM_LIST_ID,
  name: 'Rendszer Kódszótár',
  isSystem: true,
  itemCount: 2,
};

const ACTIVE_ITEM = {
  id: ITEM_ID,
  code: 'TESZT_01',
  name: 'Teszt Elem',
  description: null,
  status: 'Active',
};

const INACTIVE_ITEM = {
  ...ACTIVE_ITEM,
  status: 'Inactive',
};

const NEW_ITEM = {
  id: NEW_ITEM_ID,
  code: 'UJ_01',
  name: 'Új Elem',
  description: null,
  status: 'Active',
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-160 | Kódszótár elem rögzítése ───────────────────────────────────────

test.describe('TS-160 | Kódszótár elem rögzítése', () => {
  test('Admin új elemet rögzít – elem megjelenik a listában', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_ITEM]));
      if (route.request().method() === 'POST') return route.fulfill(ok(NEW_ITEM));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    // Kódszótár nevére kattintás
    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    // Létező elem látható
    await expect(page.locator('.item-row').filter({ hasText: 'TESZT_01' })).toBeVisible({ timeout: 5_000 });

    // Új elem gomb
    await page.getByRole('button', { name: /^Új elem$/i }).click();

    // Dialog megnyílik
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('h2')).toContainText('Új elem');

    // Kitöltés
    await dialog.locator('input[formControlName="code"]').fill('UJ_01');
    await dialog.locator('input[formControlName="name"]').fill('Új Elem');

    // Mentés
    await dialog.getByRole('button', { name: /^Mentés$/i }).click();

    // Dialog bezárul, új elem megjelenik
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.item-row').filter({ hasText: 'Új Elem' })).toBeVisible({ timeout: 5_000 });
  });

  test('Elem szerkesztése – dialog megnyílik szerkesztési módban', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_ITEM]));
      if (route.request().method() === 'PUT') return route.fulfill(ok({ ...ACTIVE_ITEM, name: 'Módosított Elem' }));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    // Szerkesztés gomb kattintás az item soron (edit ikon, nem warn szín)
    const itemRow = page.locator('.item-row').filter({ hasText: 'TESZT_01' });
    await itemRow.locator('button[mattooltip="Szerkesztés"]').click();

    // Dialog megnyílik szerkesztési módban
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('h2')).toContainText('Elem szerkesztése');

    // Meglévő kód látható az inputban
    await expect(dialog.locator('input[formControlName="code"]')).toHaveValue('TESZT_01');
  });

  test('Munkatárs nem látja az Új elem gombot', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_ITEM]));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.item-row').filter({ hasText: 'TESZT_01' })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /^Új elem$/i })).not.toBeVisible();
  });
});

// ─── TS-161 | Kódszótár elem inaktiválása ────────────────────────────────────

test.describe('TS-161 | Kódszótár elem inaktiválása', () => {
  test('Admin deaktiválja az elemet – státusz Inaktív lesz', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_ITEM]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items/${ITEM_ID}/deactivate`, (route) => {
      if (route.request().method() === 'PATCH') return route.fulfill(ok(INACTIVE_ITEM));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    const itemRow = page.locator('.item-row').filter({ hasText: 'TESZT_01' });
    await expect(itemRow).toBeVisible({ timeout: 5_000 });

    // Státusz "Aktív"
    await expect(itemRow.locator('.item-status')).toHaveText('Aktív');

    // Deaktiválás gomb (color="warn", matTooltip="Deaktiválás")
    await itemRow.locator('button[color="warn"]').click();

    // includeInactive=false esetén az elem eltűnik a listából (frontend kiszűri)
    await expect(itemRow).not.toBeVisible({ timeout: 5_000 });
  });

  test('Inaktív elemet aktiválni lehet', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([INACTIVE_ITEM]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items/${ITEM_ID}/activate`, (route) => {
      if (route.request().method() === 'PATCH') return route.fulfill(ok(ACTIVE_ITEM));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    const itemRow = page.locator('.item-row').filter({ hasText: 'TESZT_01' });
    await expect(itemRow).toBeVisible({ timeout: 5_000 });

    // Státusz "Inaktív"
    await expect(itemRow.locator('.item-status')).toContainText('Inaktív');

    // Aktiválás gomb (color="primary")
    await itemRow.locator('button[color="primary"]').click();

    // Státusz "Aktív" lesz
    await expect(itemRow.locator('.item-status')).toHaveText('Aktív', { timeout: 5_000 });
  });
});

// ─── TS-162 | Kódszótár törlése ──────────────────────────────────────────────

test.describe('TS-162 | Kódszótár törlése', () => {
  test('Admin törli a kódszótárat – confirm dialog, kódszótár eltűnik', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}`, (route) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204, body: '' });
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    // Törlés gomb látható (nem rendszer kódszótár)
    const deleteBtn = page.getByRole('button', { name: /^Törlés$/i });
    await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
    await deleteBtn.click();

    // Confirm dialog
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText('Kódszótár törlése')).toBeVisible();

    await dialog.getByRole('button', { name: /^Törlés$/i }).click();

    // Snackbar
    await expect(page.locator('mat-snack-bar-container')).toContainText('Kódszótár törölve.', { timeout: 8_000 });

    // Kódszótár eltűnik a listából
    await expect(page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' })).not.toBeVisible({ timeout: 5_000 });
  });

  test('Rendszer kódszótárnál Törlés gomb nem látható', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([SYSTEM_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${SYSTEM_LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_ITEM]));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Rendszer Kódszótár' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.item-row').filter({ hasText: 'TESZT_01' })).toBeVisible({ timeout: 5_000 });

    // Törlés gomb NEM látható rendszer kódszótárnál
    await expect(page.getByRole('button', { name: /^Törlés$/i })).not.toBeVisible();
    // Rendszer badge látható az items-header-ben
    await expect(page.locator('.system-badge')).toBeVisible();
  });

  test('Üres bal panel – nincs kódszótár állapot látható', async ({ adminPage: page }) => {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Nincsenek kódszótárak.')).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-163 | Kódszótár "Új elem" gomb – Elnök, Pénzügyes, Megtekintő ────────

test.describe('TS-163 | Kódszótár "Új elem" gomb – Elnök, Pénzügyes, Megtekintő (R jog)', () => {
  async function setupCodelistPage(page: Page) {
    await page.route('**/api/v1/code-lists', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([USER_LIST]));
      return route.continue();
    });
    await page.route(`**/api/v1/code-lists/${LIST_ID}/items**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_ITEM]));
      return route.continue();
    });
    await page.goto('/codelists');
    await page.waitForLoadState('networkidle');
    await page.locator('mat-nav-list a[mat-list-item]').filter({ hasText: 'Teszt Kódszótár' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.item-row').filter({ hasText: 'TESZT_01' })).toBeVisible({ timeout: 5_000 });
  }

  test('Elnöknél az "Új elem" gomb NEM látható', async ({ elnokPage: page }) => {
    await setupCodelistPage(page);
    await expect(page.getByRole('button', { name: /^Új elem$/i })).not.toBeVisible();
  });

  test('Pénzügyesnél az "Új elem" gomb NEM látható', async ({ penzugyesPage: page }) => {
    await setupCodelistPage(page);
    await expect(page.getByRole('button', { name: /^Új elem$/i })).not.toBeVisible();
  });

  test('Megtekintőnél az "Új elem" gomb NEM látható', async ({ megtekintosPage: page }) => {
    await setupCodelistPage(page);
    await expect(page.getByRole('button', { name: /^Új elem$/i })).not.toBeVisible();
  });
});
