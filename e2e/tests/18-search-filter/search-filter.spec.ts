/**
 * 18. kategória – Keresés, szűrés, listázás
 * Forgatókönyvek: TS-170, TS-171, TS-172, TS-173
 *
 * Stratégia:
 *  - TS-170: Pályázat lista szűrő panel – státusz szűrő badge megjelenik
 *  - TS-171: Szűrő badge-ek – "Összes szűrő törlése" gomb mindent töröl
 *  - TS-172: Export gomb – Admin/Elnök/Pénzügyes látja, Munkatárs nem
 *  - TS-173: Globális keresés – autocomplete, navigáció találatra kattintva
 *
 * API végpontok:
 *   GET /api/v1/applications                → PagedResult<ApplicationListItem>
 *   GET /api/v1/applications/export         → blob (xlsx)
 *   GET /api/v1/search?q=...               → GlobalSearchResult
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ─────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000018';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000018';

const APP_ITEM = {
  id: APP_ID,
  title: 'Kultúra Fejlesztési Pályázat',
  identifier: 'KFP-2026-01',
  granterName: 'Teszt Alapítvány',
  status: 'Draft',
  submissionDeadline: '2026-09-30',
  awardedAmount: null,
  isDeadlineWarning: false,
  isDeadlineCritical: false,
  isSpendingDeadlineWarning: false,
};

const PAGED_RESULT = {
  items: [APP_ITEM],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

const EMPTY_PAGED = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 20,
};

const SEARCH_RESULT = {
  applications: [
    { id: APP_ID, displayName: 'Kultúra Fejlesztési Pályázat', entityType: 'Application', status: 'Draft' },
  ],
  granters: [
    { id: GRANTER_ID, displayName: 'Teszt Alapítvány', entityType: 'Granter', status: null },
  ],
  vendors: [],
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-170 | Pályázat lista szűrő panel ─────────────────────────────────────

test.describe('TS-170 | Pályázat lista szűrő panel', () => {
  test('Pályázat lista oldal betölt – oldal fejléce és szűrő panel látható', async ({ munkatarsPage: page }) => {
    await page.goto('/applications');

    // Az oldal fejléce mindig megjelenik (betöltési állapottól függetlenül)
    await expect(page.getByRole('heading', { name: 'Pályázatok' })).toBeVisible({ timeout: 8_000 });
    // Szűrő panel fejléce látható
    await expect(page.locator('mat-expansion-panel-header').filter({ hasText: 'Szűrők' })).toBeVisible();
    // Új pályázat gomb (munkatárs látja)
    await expect(page.getByRole('button', { name: /új pályázat/i })).toBeVisible();
  });

  test('Státusz szűrő URL paraméterből – badge megjelenik', async ({ munkatarsPage: page }) => {
    // URL paraméter alapján az _initFromUrl() előre kitölti a szűrőt
    await page.goto('/applications?statuses=Draft');

    // Badge azonnal megjelenik (a _snapshot alapján, nem az API választól függ)
    await expect(page.locator('mat-chip').filter({ hasText: 'Állapot' })).toBeVisible({ timeout: 5_000 });
  });

  test('Keresési szöveg URL paraméterből – badge megjelenik', async ({ munkatarsPage: page }) => {
    await page.goto('/applications?searchTerm=Kultúra');

    // "Keresés: ..." badge jelenik meg
    await expect(page.locator('mat-chip').filter({ hasText: 'Keresés' })).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-171 | Szűrő badge-ek törlése ─────────────────────────────────────────

test.describe('TS-171 | Szűrő badge-ek törlése', () => {
  test('Összes szűrő törlése – badge-ek eltűnnek', async ({ munkatarsPage: page }) => {
    // Az API mock biztosítja, hogy a loading() false-ra vált, teljes re-render megtörténik
    await page.route('**/api/v1/applications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(EMPTY_PAGED));
      return route.continue();
    });

    await page.goto('/applications?searchTerm=Teszt');

    const chip = page.locator('mat-chip').filter({ hasText: 'Keresés' });
    await expect(chip).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /összes szűrő törlése/i }).click();

    // _syncUrl() lefut → searchTerm kikerül az URL-ből (megbízható oldal-effekt)
    await expect(page).not.toHaveURL(/searchTerm=/, { timeout: 5_000 });
    await expect(chip).not.toBeVisible({ timeout: 3_000 });
  });

  test('Egyedi szűrő badge törlése – chip törlésére badge eltűnik', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/applications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(EMPTY_PAGED));
      return route.continue();
    });

    await page.goto('/applications?searchTerm=Teszt');

    const chip = page.locator('mat-chip').filter({ hasText: 'Keresés' });
    await expect(chip).toBeVisible({ timeout: 5_000 });

    // Badge cancel ikon kattintás (törlés)
    await chip.locator('mat-icon').click();

    // _syncUrl() lefut → searchTerm kikerül az URL-ből
    await expect(page).not.toHaveURL(/searchTerm=/, { timeout: 5_000 });
    await expect(chip).not.toBeVisible({ timeout: 3_000 });
  });
});

// ─── TS-172 | Export gomb láthatósága ─────────────────────────────────────────

test.describe('TS-172 | Export gomb láthatósága', () => {
  test('Admin látja az Exportálás gombot', async ({ adminPage: page }) => {
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /exportálás/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Elnök látja az Exportálás gombot', async ({ elnokPage: page }) => {
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /exportálás/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Munkatárs nem látja az Exportálás gombot', async ({ munkatarsPage: page }) => {
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /exportálás/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('Admin exportálja a listát – letöltés indul', async ({ adminPage: page }) => {
    await page.route('**/api/v1/applications**', (route) => {
      const url = route.request().url();
      if (url.includes('/export') && route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          body: 'fake-xlsx-content',
          headers: { 'Content-Disposition': 'attachment; filename="palyazatok_20260605.xlsx"' },
        });
      }
      if (route.request().method() === 'GET') return route.fulfill(ok(PAGED_RESULT));
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    // Export gomb aktív (van eredmény)
    const exportBtn = page.getByRole('button', { name: /exportálás/i });
    await expect(exportBtn).toBeEnabled({ timeout: 5_000 });

    // Download esemény figyelése
    const downloadPromise = page.waitForEvent('download', { timeout: 8_000 });
    await exportBtn.click();
    const download = await downloadPromise;

    // Fájlnév tartalmazza "palyazatok_"
    expect(download.suggestedFilename()).toContain('palyazatok_');
  });
});

// ─── TS-173 | Globális keresés ────────────────────────────────────────────────

test.describe('TS-173 | Globális keresés', () => {
  test('3+ karakter után autocomplete eredmények jelennek meg', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/search**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SEARCH_RESULT));
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    // Keresés input a layoutban
    const searchInput = page.locator('input[placeholder="Keresés... (min. 3 karakter)"]');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });

    // Gépelés
    await searchInput.fill('Kul');

    // Autocomplete panel megnyílik, eredmény látható
    await expect(page.locator('mat-optgroup').filter({ hasText: 'Pályázatok' })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Kultúra Fejlesztési Pályázat' })).toBeVisible();
  });

  test('Pályáztató csoport is megjelenik az autocomplete-ban', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/search**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SEARCH_RESULT));
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Keresés... (min. 3 karakter)"]');
    await searchInput.fill('Tesz');

    await expect(page.locator('mat-optgroup').filter({ hasText: 'Pályáztatók' })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Teszt Alapítvány' })).toBeVisible();
  });

  test('Találatra kattintva navigál az alkalmazás részletező oldalára', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/search**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(SEARCH_RESULT));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok({
        id: APP_ID, title: 'Kultúra Fejlesztési Pályázat', status: 'Draft', workflowSteps: [],
      }));
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Keresés... (min. 3 karakter)"]');
    await searchInput.fill('Kul');

    const option = page.locator('mat-option').filter({ hasText: 'Kultúra Fejlesztési Pályázat' });
    await expect(option).toBeVisible({ timeout: 5_000 });
    await option.click();

    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}`), { timeout: 8_000 });
  });

  test('Nincs találat – üres állapot üzenet', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/search**', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill(ok({ applications: [], granters: [], vendors: [] }));
      }
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder="Keresés... (min. 3 karakter)"]');
    await searchInput.fill('xyzxyz');

    await expect(page.locator('mat-option', { hasText: 'Nem található rekord' })).toBeVisible({ timeout: 5_000 });
  });
});
