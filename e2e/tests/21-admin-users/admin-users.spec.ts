/**
 * 21. kategória – Admin: Felhasználók kezelése
 * Forgatókönyvek: TS-200, TS-201, TS-202, TS-203, TS-204, TS-205, TS-206, TS-207
 *
 * Kapcsolódó US-ok: US-160, US-161, US-162, US-164, US-165
 *
 * Stratégia:
 *  - TS-200: Hozzáférés – Admin eléri, Munkatárs /403-ra kerül
 *  - TS-201: Felhasználók listázása – sor megjelenik, keresés szűr
 *  - TS-202: Szerepkör módosítása – PUT hívás, snackbar megjelenik
 *  - TS-203: Inaktiválás – dialog megerősítés, PUT hívás, snackbar;
 *            Reaktiválás – közvetlen PUT hívás, snackbar
 *  - TS-204: Meghívó létrehozása és kiküldése (US-164)
 *  - TS-205: Meghívók listázása státuszokkal (US-165)
 *  - TS-206: Meghívó visszavonása (US-165)
 *  - TS-207: Meghívó újraküldése (US-165)
 *
 * API végpontok:
 *   GET  /api/v1/users                    → AdminUser[]
 *   PUT  /api/v1/users/{id}/role          → 200
 *   PUT  /api/v1/users/{id}/deactivate    → 200
 *   PUT  /api/v1/users/{id}/activate      → 200
 *   POST /api/v1/invitations              → 201
 *   GET  /api/v1/invitations              → Invitation[]
 *   PUT  /api/v1/invitations/{id}/revoke  → 200
 *   POST /api/v1/invitations/{id}/resend  → 200
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

async function mockUsers(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/users**', (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_USER]));
    return route.continue();
  });
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

  test('Elnök hozzáfér – "Felhasználók kezelése" fejléc látható (csak olvasás)', async ({ elnokPage: page }) => {
    await mockUsers(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Felhasználók kezelése' })).toBeVisible({ timeout: 8_000 });
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

// ─── Mock adatok – meghívók ───────────────────────────────────────────────────

const INVITE_ID_1 = 'aaaaaaaa-0000-0000-0000-000000000201';
const INVITE_ID_2 = 'bbbbbbbb-0000-0000-0000-000000000202';

const PENDING_INVITATION = {
  id: INVITE_ID_1,
  email: 'uj.munkatars@teszt.hu',
  role: 'PalyazatiMunkatars',
  status: 'Pending',
  createdAt: '2026-06-10T10:00:00Z',
  expiresAt: '2026-06-13T10:00:00Z',
};

const EXPIRED_INVITATION = {
  id: INVITE_ID_2,
  email: 'regi.penzugyes@teszt.hu',
  role: 'Penzugyes',
  status: 'Expired',
  createdAt: '2026-06-01T10:00:00Z',
  expiresAt: '2026-06-04T10:00:00Z',
};

const ACCEPTED_INVITATION = {
  id: 'cccccccc-0000-0000-0000-000000000203',
  email: 'elfogadott@teszt.hu',
  role: 'Megtekinto',
  status: 'Accepted',
  createdAt: '2026-06-05T10:00:00Z',
  expiresAt: '2026-06-08T10:00:00Z',
};

// ─── TS-204 | Meghívó létrehozása és kiküldése (US-164) ──────────────────────

test.describe('TS-204 | Meghívó létrehozása és kiküldése', () => {
  test('"Új meghívó" gomb elérhető a felhasználókezelés oldalon', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACTIVE_USER]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /új meghívó/i })).toBeVisible({ timeout: 8_000 });
  });

  test('Meghívó űrlap tartalmaz email és szerepkör mezőt', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /új meghívó/i }).click();

    await expect(page.locator('input[formcontrolname="email"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('mat-select[formcontrolname="role"]')).toBeVisible();
  });

  test('Sikeres meghívó küldés – POST hívás és "Meghívó elküldve" snackbar', async ({ adminPage: page }) => {
    let postCalled = false;
    let postedBody: unknown = null;

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok([]));
      if (method === 'POST') {
        postCalled = true;
        postedBody = JSON.parse(route.request().postData() ?? '{}');
        return route.fulfill(ok({ ...PENDING_INVITATION, id: 'new-id' }));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /új meghívó/i }).click();
    await page.locator('input[formcontrolname="email"]').fill('uj.munkatars@teszt.hu');
    const roleSelect = page.locator('mat-select[formcontrolname="role"]');
    await roleSelect.click();
    await page.locator('mat-option', { hasText: 'Pályázati munkatárs' }).click();
    await page.getByRole('button', { name: /küldés|meghívás/i }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: /meghívó elküldve/i }),
    ).toBeVisible({ timeout: 5_000 });
    expect(postCalled).toBe(true);
    expect((postedBody as Record<string, unknown>)['email']).toBe('uj.munkatars@teszt.hu');
  });

  test('Már létező aktív fiókhoz küldött meghívónál hibaüzenet jelenik meg', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') return route.fulfill(ok([]));
      if (method === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Az e-mail cím már regisztrált felhasználóhoz tartozik.' }),
        });
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /új meghívó/i }).click();
    await page.locator('input[formcontrolname="email"]').fill('letezik@teszt.hu');
    const roleSelect = page.locator('mat-select[formcontrolname="role"]');
    await roleSelect.click();
    await page.locator('mat-option', { hasText: 'Megtekintő' }).click();
    await page.getByRole('button', { name: /küldés|meghívás/i }).click();

    await expect(
      page.locator('mat-snack-bar-container, [role="alert"]').filter({ hasText: /már regisztrált/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Érvénytelen email formátumnál a Küldés gomb disabled', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /új meghívó/i }).click();
    await page.locator('input[formcontrolname="email"]').fill('nem-valid-email');
    await page.locator('input[formcontrolname="email"]').blur();

    await expect(page.getByRole('button', { name: /küldés|meghívás/i })).toBeDisabled({ timeout: 3_000 });
  });
});

// ─── TS-205 | Meghívók listázása (US-165) ────────────────────────────────────

test.describe('TS-205 | Meghívók listázása', () => {
  test('Meghívók tab elérhető a felhasználókezelés oldalon', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([PENDING_INVITATION]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('tab', { name: /meghívók/i })).toBeVisible({ timeout: 8_000 });
  });

  test('PENDING meghívó email-je és szerepköre megjelenik a listában', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([PENDING_INVITATION]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();

    await expect(page.locator('td', { hasText: 'uj.munkatars@teszt.hu' }).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('td', { hasText: /pályázati munkatárs/i }).first()).toBeVisible();
  });

  test('EXPIRED chip megjelenik a lejárt meghívónál', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([EXPIRED_INVITATION]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();

    await expect(page.locator('mat-chip', { hasText: /lejárt|expired/i }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('ACCEPTED meghívónál nincs visszavonás vagy újraküldés gomb', async ({ adminPage: page }) => {
    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([ACCEPTED_INVITATION]));
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();
    await page.waitForLoadState('networkidle');

    const acceptedRow = page.locator('tr').filter({ hasText: 'elfogadott@teszt.hu' });
    await expect(acceptedRow.locator('button[mattooltip="Visszavonás"]')).toHaveCount(0);
    await expect(acceptedRow.locator('button[mattooltip="Újraküldés"]')).toHaveCount(0);
  });
});

// ─── TS-206 | Meghívó visszavonása (US-165) ──────────────────────────────────

test.describe('TS-206 | Meghívó visszavonása', () => {
  test('PENDING meghívó visszavonása – PUT /revoke hívás és "Meghívó visszavonva" snackbar', async ({ adminPage: page }) => {
    let revokeCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([PENDING_INVITATION]));
      if (method === 'PUT' && url.includes('/revoke')) {
        revokeCalled = true;
        return route.fulfill(ok({ ...PENDING_INVITATION, status: 'REVOKED' }));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();
    await page.waitForLoadState('networkidle');

    await page.locator('button[mattooltip="Visszavonás"]').click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: /visszavon/i }),
    ).toBeVisible({ timeout: 5_000 });
    expect(revokeCalled).toBe(true);
  });

  test('Visszavonás után a meghívó státusza REVOKED chip-pel jelenik meg', async ({ adminPage: page }) => {
    const REVOKED_INVITATION = { ...PENDING_INVITATION, status: 'Revoked' };
    let callCount = 0;

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') {
        callCount++;
        return route.fulfill(ok(callCount === 1 ? [PENDING_INVITATION] : [REVOKED_INVITATION]));
      }
      if (method === 'PUT' && url.includes('/revoke')) {
        return route.fulfill(ok(REVOKED_INVITATION));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();
    await page.waitForLoadState('networkidle');

    await page.locator('button[mattooltip="Visszavonás"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('mat-chip', { hasText: /visszavon|revoked/i }).first()).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-207 | Meghívó újraküldése (US-165) ───────────────────────────────────

test.describe('TS-207 | Meghívó újraküldése', () => {
  test('Lejárt meghívó újraküldése – POST /resend hívás és "Meghívó újraküldve" snackbar', async ({ adminPage: page }) => {
    let resendCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([EXPIRED_INVITATION]));
      if (method === 'POST' && url.includes('/resend')) {
        resendCalled = true;
        return route.fulfill(ok({ ...EXPIRED_INVITATION, status: 'PENDING' }));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();
    await page.waitForLoadState('networkidle');

    await page.locator('button[mattooltip="Újraküldés"]').click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: /újraküld/i }),
    ).toBeVisible({ timeout: 5_000 });
    expect(resendCalled).toBe(true);
  });

  test('Újraküldés után a meghívó státusza PENDING-re vált', async ({ adminPage: page }) => {
    let callCount = 0;

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') {
        callCount++;
        return route.fulfill(ok(callCount === 1 ? [EXPIRED_INVITATION] : [{ ...EXPIRED_INVITATION, status: 'Pending' }]));
      }
      if (method === 'POST' && url.includes('/resend')) {
        return route.fulfill(ok({ ...EXPIRED_INVITATION, status: 'Pending' }));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();
    await page.waitForLoadState('networkidle');

    await page.locator('button[mattooltip="Újraküldés"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('mat-chip', { hasText: /függő|pending/i }).first()).toBeVisible({ timeout: 5_000 });
  });

  test('PENDING meghívónál is elérhető az újraküldés (pl. elveszett email esetén)', async ({ adminPage: page }) => {
    let resendCalled = false;

    await page.route('**/api/v1/users**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route('**/api/v1/invitations**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([PENDING_INVITATION]));
      if (method === 'POST' && url.includes('/resend')) {
        resendCalled = true;
        return route.fulfill(ok(PENDING_INVITATION));
      }
      return route.continue();
    });

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /meghívók/i }).click();
    await page.waitForLoadState('networkidle');

    const resendBtn = page.locator('button[mattooltip="Újraküldés"]');
    await expect(resendBtn).toBeVisible({ timeout: 5_000 });
    await resendBtn.click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: /újraküld/i }),
    ).toBeVisible({ timeout: 5_000 });
    expect(resendCalled).toBe(true);
  });
});
