/**
 * 16. kategória – Szerződő cégek
 * Forgatókönyvek: TS-150, TS-151
 *
 * Stratégia:
 *  - TS-150: Munkatárs új szerződő céget rögzít → snackbar, navigál a detail oldalra
 *            Adószám formátum figyelmeztetés (hasTaxNumberWarning)
 *  - TS-151: Admin inaktiválja a céget (Confirm dialog), státusz "inaktív" lesz
 *            Munkatárs / Elnök nem látja az Inaktiválás gombot
 *
 * API végpontok:
 *   GET   /api/v1/vendors/{id}        → VendorDetailDto
 *   POST  /api/v1/vendors             → CreateVendorResult { vendor, hasTaxNumberWarning }
 *   PATCH /api/v1/vendors/{id}/deactivate → VendorDto
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const VENDOR_ID = 'vvvvvvvv-0000-0000-0000-000000000016';
const NEW_VENDOR_ID = 'vvvvvvvv-0000-0000-0000-000000000017';

// ─── Mock adatok ─────────────────────────────────────────────────────────────

const ACTIVE_VENDOR_DETAIL = {
  id: VENDOR_ID,
  name: 'Teszt Kft.',
  taxNumber: '12345678-1-23',
  address: '1011 Budapest, Teszt utca 1.',
  phone: '+36 1 234 5678',
  email: 'info@teszt.hu',
  status: 'Active',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-03-01T10:00:00Z',
  contracts: [],
  summary: { totalContracts: 0, totalAmount: 0 },
};

const INACTIVE_VENDOR_DETAIL = {
  ...ACTIVE_VENDOR_DETAIL,
  status: 'Inactive',
};

const NEW_VENDOR_DETAIL = {
  id: NEW_VENDOR_ID,
  name: 'Új Kft.',
  taxNumber: null,
  address: null,
  phone: null,
  email: null,
  status: 'Active',
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  contracts: [],
  summary: { totalContracts: 0, totalAmount: 0 },
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-150 | Új szerződő cég rögzítése ──────────────────────────────────────

test.describe('TS-150 | Új szerződő cég rögzítése', () => {
  test('Munkatárs új céget rögzít – snackbar és navigáció a detail oldalra', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/vendors', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({ vendor: { ...NEW_VENDOR_DETAIL }, hasTaxNumberWarning: false }));
      }
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/vendors/${NEW_VENDOR_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(NEW_VENDOR_DETAIL));
      return route.continue();
    });

    await page.goto('/vendors/new');
    await page.waitForLoadState('networkidle');

    // Fejléc látható
    await expect(page.getByText('Új szerződő cég')).toBeVisible({ timeout: 5_000 });

    // Név kitöltése
    await page.locator('input[formcontrolname="name"]').fill('Új Kft.');

    // Mentés gomb aktív
    const saveBtn = page.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();

    // Sikeres snackbar
    await expect(page.locator('mat-snack-bar-container')).toContainText('Szerződő cég rögzítve.', { timeout: 8_000 });

    // Navigálás a detail oldalra
    await expect(page).toHaveURL(new RegExp(`/vendors/${NEW_VENDOR_ID}`), { timeout: 8_000 });
  });

  test('Adószám formátum figyelmeztetés – mentés sikeres, navigáció megtörténik', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/vendors', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({ vendor: { ...NEW_VENDOR_DETAIL, taxNumber: 'ROSSZ' }, hasTaxNumberWarning: true }));
      }
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/vendors/${NEW_VENDOR_ID}`, (route) =>
      route.fulfill(ok({ ...NEW_VENDOR_DETAIL, taxNumber: 'ROSSZ' })),
    );

    await page.goto('/vendors/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[formcontrolname="name"]').fill('Figyelmeztetős Kft.');
    await page.locator('input[formcontrolname="taxNumber"]').fill('ROSSZ');
    await page.getByRole('button', { name: /^mentés$/i }).click();

    // Sikeres snackbar
    await expect(page.locator('mat-snack-bar-container')).toContainText('Szerződő cég rögzítve.', { timeout: 8_000 });
    // Navigálás a detail oldalra
    await expect(page).toHaveURL(new RegExp(`/vendors/${NEW_VENDOR_ID}`), { timeout: 8_000 });
  });

  test('Mentés gomb le van tiltva kötelező név mező hiányában', async ({ munkatarsPage: page }) => {
    await page.goto('/vendors/new');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /^mentés$/i })).toBeDisabled();
  });

  test('Duplikált névnél hibaüzenet snackbar jelenik meg', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/vendors', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 400, contentType: 'application/json', body: '{"title":"Duplicate"}' });
      }
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/vendors/new');
    await page.waitForLoadState('networkidle');

    await page.locator('input[formcontrolname="name"]').fill('Meglévő Kft.');
    await page.getByRole('button', { name: /^mentés$/i }).click();

    await expect(page.locator('mat-snack-bar-container')).toContainText('Ez a szerződő cég már szerepel a rendszerben.', { timeout: 8_000 });
    // Oldalon maradunk
    await expect(page).toHaveURL(/\/vendors\/new/, { timeout: 3_000 });
  });
});

// ─── TS-151 | Szerződő cég inaktiválása ──────────────────────────────────────

test.describe('TS-151 | Szerződő cég inaktiválása', () => {
  test('Admin inaktiválja a céget – confirm dialog, státusz inaktív lesz', async ({ adminPage: page }) => {
    let activated = true;

    await page.route(`**/api/v1/vendors/${VENDOR_ID}`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill(ok(activated ? ACTIVE_VENDOR_DETAIL : INACTIVE_VENDOR_DETAIL));
      }
      return route.continue();
    });
    await page.route(`**/api/v1/vendors/${VENDOR_ID}/deactivate`, (route) => {
      if (route.request().method() === 'PATCH') {
        activated = false;
        return route.fulfill(ok({ ...ACTIVE_VENDOR_DETAIL, status: 'Inactive' }));
      }
      return route.continue();
    });

    await page.goto(`/vendors/${VENDOR_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Teszt Kft.')).toBeVisible({ timeout: 5_000 });

    // Inaktiválás gomb látható (admin + aktív cég)
    const deactivateBtn = page.getByRole('button', { name: /inaktiválás/i });
    await expect(deactivateBtn).toBeVisible();
    await deactivateBtn.click();

    // Confirm dialog
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText('Cég inaktiválása')).toBeVisible();
    await dialog.getByRole('button', { name: /^inaktiválás$/i }).click();

    // Snackbar
    await expect(page.locator('mat-snack-bar-container')).toContainText('Cég inaktiválva.', { timeout: 8_000 });
    // Badge inaktív állapotot mutat
    await expect(page.locator('.gm-badge-inactive')).toBeVisible({ timeout: 5_000 });
  });

  test('Munkatárs nem látja az Inaktiválás gombot', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/vendors/${VENDOR_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(ACTIVE_VENDOR_DETAIL));
      return route.continue();
    });

    await page.goto(`/vendors/${VENDOR_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Teszt Kft.')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /inaktiválás/i })).not.toBeVisible();
  });

  test('Inaktív cégnél Aktiválás gomb látható (admin)', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/vendors/${VENDOR_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(INACTIVE_VENDOR_DETAIL));
      return route.continue();
    });

    await page.goto(`/vendors/${VENDOR_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Teszt Kft.')).toBeVisible({ timeout: 5_000 });
    // Inaktív cégnél Aktiválás gomb látható, Inaktiválás nem
    await expect(page.getByRole('button', { name: /aktiválás/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^inaktiválás$/i })).not.toBeVisible();
  });
});
