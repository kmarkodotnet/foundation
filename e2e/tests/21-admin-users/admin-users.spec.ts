/**
 * 21. kategória – Admin: Felhasználók kezelése
 * Forgatókönyvek: TS-200, TS-201, TS-202, TS-203
 *
 * Stratégia:
 *  - TS-200: Hozzáférés – Admin eléri, Munkatárs /403-ra kerül
 *  - TS-201: Felhasználók listázása – sor megjelenik, keresés szűr
 *  - TS-202: Szerepkör módosítása – PUT hívás, snackbar megjelenik
 *  - TS-203: Inaktiválás – dialog megerősítés, PUT hívás, snackbar;
 *            Reaktiválás – közvetlen PUT hívás, snackbar
 *
 * API végpontok:
 *   GET  /api/v1/users                 → AdminUser[]
 *   PUT  /api/v1/users/{id}/role       → 200
 *   PUT  /api/v1/users/{id}/deactivate → 200
 *   PUT  /api/v1/users/{id}/activate   → 200
 *
 * Megjegyzés:
 *   Az Admin teszt felhasználó ID-ja: 00000000-0000-0000-0000-000000000001
 *   A deaktiválás gomb csak más felhasználóknál jelenik meg (row.id !== currentUserId)
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
const USER_A_ID = 'bbbbbbbb-0000-0000-0000-000000000021';
const USER_B_ID = 'cccccccc-0000-0000-0000-000000000021';

const ACTIVE_USER: Record<string, unknown> = {
  id: USER_A_ID,
  email: 'penzugyes@teszt.hu',
  name: 'Teszt Pénzügyes',
  profilePictureUrl: null,
  role: 'Penzugyes',
  isActive: true,
  createdAt: '2026-01-01T10:00:00Z',
  lastLoginAt: '2026-06-01T08:00:00Z',
};

const INACTIVE_USER: Record<string, unknown> = {
  id: USER_B_ID,
  email: 'inaktiv@teszt.hu',
  name: 'Inaktív Felhasználó',
  profilePictureUrl: null,
  role: 'Megtekinto',
  isActive: false,
  createdAt: '2026-01-01T10:00:00Z',
  lastLoginAt: null,
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-200 | Hozzáférés-vezérlés ─────────────────────────────────────────────

test.describe('TS-200 | Admin felhasználókezelés hozzáférés', () => {
  test('Admin hozzáfér – "Felhasználók kezelése" fejléc látható', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_USER]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Felhasználók kezelése' })).toBeVisible({ timeout: 8_000 });
  });

  test('Munkatárs nem fér hozzá – /403-ra irányítja', async ({ munkatarsPage: page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });

  test('Elnök nem fér hozzá – /403-ra irányítja', async ({ elnokPage: page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });
});

// ─── TS-201 | Felhasználók listázása és keresés ───────────────────────────────

test.describe('TS-201 | Felhasználók listázása', () => {
  test('Aktív felhasználó neve és e-mail-je megjelenik a táblázatban', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_USER]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('td', { hasText: 'Teszt Pénzügyes' }).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('td small.gm-email', { hasText: 'penzugyes@teszt.hu' }).first()).toBeVisible();
  });

  test('Inaktív felhasználónál "Inaktív" chip jelenik meg', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([INACTIVE_USER]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('mat-chip.gm-inactive-chip', { hasText: 'Inaktív' })).toBeVisible({ timeout: 8_000 });
  });

  test('Nincs találat – üres állapot üzenet megjelenik', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('p.gm-empty', { hasText: 'Nincs találat' })).toBeVisible({ timeout: 5_000 });
  });

  test('Keresőbe írva az API searchTerm paraméterrel hívódik', async ({ adminPage: page }) => {
    const capturedUrls: string[] = [];

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') {
        capturedUrls.push(route.request().url());
        return route.fulfill(ok([ACTIVE_USER]));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await page.locator('input[formcontrolname="searchTerm"]').fill('Pénzügyes');
    // 300ms debounce + hálózati válasz bevárása
    await page.waitForTimeout(400);
    await page.waitForLoadState('networkidle');

    expect(capturedUrls.some((url) => url.includes('searchTerm='))).toBe(true);
  });
});

// ─── TS-202 | Szerepkör módosítása ───────────────────────────────────────────

test.describe('TS-202 | Szerepkör módosítása', () => {
  test('Szerepkör változtatása – PUT hívás és "Szerepkör frissítve." snackbar', async ({ adminPage: page }) => {
    let putCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([ACTIVE_USER]));
      if (method === 'PUT' && url.includes('/role')) {
        putCalled = true;
        return route.fulfill(ok({}));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // A sorban lévő szerepkör mat-select (nem a szűrő select)
    const userRow = page.locator('tr').filter({ hasText: 'Teszt Pénzügyes' });
    const roleSelect = userRow.locator('mat-select');
    await expect(roleSelect).toBeVisible({ timeout: 5_000 });
    await roleSelect.click();

    // Új szerepkör kiválasztása
    await page.locator('mat-option', { hasText: 'Pályázati munkatárs' }).click();

    // Snackbar megjelenik
    await expect(page.locator('mat-snack-bar-container', { hasText: 'Szerepkör frissítve' })).toBeVisible({ timeout: 5_000 });
    expect(putCalled).toBe(true);
  });
});

// ─── TS-203 | Inaktiválás és reaktiválás ─────────────────────────────────────

test.describe('TS-203 | Felhasználó inaktiválása és reaktiválása', () => {
  test('Inaktiválás – dialog megerősítés után PUT /deactivate és snackbar', async ({ adminPage: page }) => {
    let deactivateCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([ACTIVE_USER]));
      if (method === 'PUT' && url.includes('/deactivate')) {
        deactivateCalled = true;
        return route.fulfill(ok({}));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Inaktiválás gomb (block ikon)
    const deactivateBtn = page.locator('button[mattooltip="Inaktiválás"]');
    await expect(deactivateBtn).toBeVisible({ timeout: 5_000 });
    await deactivateBtn.click();

    // Confirm dialog megjelenik
    await expect(page.locator('h2[mat-dialog-title]', { hasText: 'Felhasználó inaktiválása' })).toBeVisible({ timeout: 5_000 });

    // Megerősítés
    await page.locator('button', { hasText: 'Inaktiválás' }).last().click();

    // Snackbar megjelenik
    await expect(page.locator('mat-snack-bar-container', { hasText: 'Felhasználó inaktiválva' })).toBeVisible({ timeout: 5_000 });
    expect(deactivateCalled).toBe(true);
  });

  test('Inaktiválás – "Mégsem" kattintásra a PUT nem hívódik meg', async ({ adminPage: page }) => {
    let deactivateCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([ACTIVE_USER]));
      if (method === 'PUT' && url.includes('/deactivate')) {
        deactivateCalled = true;
        return route.fulfill(ok({}));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await page.locator('button[mattooltip="Inaktiválás"]').click();
    await expect(page.locator('h2[mat-dialog-title]', { hasText: 'Felhasználó inaktiválása' })).toBeVisible({ timeout: 5_000 });

    await page.locator('button', { hasText: 'Mégsem' }).click();

    expect(deactivateCalled).toBe(false);
  });

  test('Reaktiválás – közvetlen PUT /activate és snackbar', async ({ adminPage: page }) => {
    let activateCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([INACTIVE_USER]));
      if (method === 'PUT' && url.includes('/activate')) {
        activateCalled = true;
        return route.fulfill(ok({}));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Reaktiválás gomb (check_circle ikon, dialog nélkül)
    const activateBtn = page.locator('button[mattooltip="Reaktiválás"]');
    await expect(activateBtn).toBeVisible({ timeout: 5_000 });
    await activateBtn.click();

    await expect(page.locator('mat-snack-bar-container', { hasText: 'Felhasználó reaktiválva' })).toBeVisible({ timeout: 5_000 });
    expect(activateCalled).toBe(true);
  });
});

// ─── TS-200/B | FS-eltérés vizsgálat – Elnök R jog a felhasználókezelésben ──
//
// FS (5.1 jogosultsági mátrix): Elnök → Felhasználók: R
// A jelenlegi route guard (/admin) csak Admin-t enged → Elnök /403-ra kerül.
// Ha ez a teszt elbukik, az implementáció szűkebb a FS-nél (app.routes.ts
// felülvizsgálandó). Ha átmegy, az Elnök olvasási jog implementálva van.

test.describe('TS-200/B | Felhasználókezelés – Elnök R jog (FS-eltérés vizsgálat)', () => {
  test('Elnök hozzáfér a felhasználókezelés oldalhoz – fejléc látható (FS: R jog)', async ({
    elnokPage: page,
  }) => {
    await mockUsers(page);
    await page.goto('/admin/users');
    // FS szerint R jog → oldal elérhető; ha /403-ra kerül, az route guard eltérés
    await expect(page.getByRole('heading', { name: /felhasználók/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('Elnöknél NEM látható a szerepkör-módosítás (nincs U jog)', async ({
    elnokPage: page,
  }) => {
    await mockUsers(page);
    await page.goto('/admin/users');
    await page.waitForURL(/\/admin\/users/, { timeout: 5_000 });
    await expect(page.locator('mat-select').first()).not.toBeVisible();
  });
});

// ─── TS-203/B | Felhasználókezelés – Pénzügyes és Megtekintő hozzáférés ──────

test.describe('TS-203/B | Felhasználókezelés hozzáférés – Pénzügyes és Megtekintő', () => {
  test('Pénzügyes nem fér hozzá az admin/users oldalhoz – /403-ra irányítja', async ({ penzugyesPage: page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });

  test('Megtekintő nem fér hozzá az admin/users oldalhoz – /403-ra irányítja', async ({ megtekintosPage: page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });
});
