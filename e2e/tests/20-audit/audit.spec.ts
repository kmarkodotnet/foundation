/**
 * 20. kategória – Audit napló
 * Forgatókönyvek: TS-190, TS-191, TS-192
 *
 * Stratégia:
 *  - TS-190: Hozzáférés-vezérlés – Admin eléri az oldalt, Munkatárs /403-ra kerül,
 *            bejegyzések láthatók a táblázatban
 *  - TS-191: Szűrők alkalmazása – entitás típusa szűrő PATCH paramétert küld,
 *            törlés visszaállítja az alapállapotot
 *  - TS-192: CSV export – Admin letölti az audit naplót, fájlnév helyes
 *
 * API végpontok:
 *   GET /api/v1/audit-logs                  → PagedResult<AuditLogEntry>
 *   GET /api/v1/audit-logs/export           → blob (csv)
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const AUDIT_ENTRY = {
  id: 1,
  createdAt: '2026-06-01T10:00:00Z',
  userId: 'user-admin-001',
  userName: 'Admin Felhasználó',
  userEmail: 'admin@example.com',
  entityType: 'Application',
  entityId: 'aaaaaaaa-0000-0000-0000-000000000020',
  action: 'Create',
  fieldName: null,
  oldValue: null,
  newValue: null,
  ipAddress: '127.0.0.1',
};

const PAGED_RESULT = {
  items: [AUDIT_ENTRY],
  totalCount: 1,
  page: 1,
  pageSize: 50,
};

const EMPTY_PAGED = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 50,
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-190 | Hozzáférés-vezérlés ─────────────────────────────────────────────

test.describe('TS-190 | Audit napló hozzáférés', () => {
  test('Admin hozzáfér az audit naplóhoz – oldal fejléce látható', async ({ adminPage: page }) => {
    await page.route('**/api/v1/audit-logs**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(PAGED_RESULT));
      return route.continue();
    });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Audit napló' })).toBeVisible({ timeout: 8_000 });
  });

  test('Munkatárs nem fér hozzá az audit naplóhoz – /403-ra irányítja', async ({ munkatarsPage: page }) => {
    await page.goto('/audit');
    await expect(page).toHaveURL(/\/403/, { timeout: 5_000 });
  });

  test('Admin látja az audit bejegyzéseket a táblázatban', async ({ adminPage: page }) => {
    await page.route('**/api/v1/audit-logs**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(PAGED_RESULT));
      return route.continue();
    });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('td', { hasText: 'Application' }).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('td', { hasText: 'Admin Felhasználó' }).first()).toBeVisible();
  });
});

// ─── TS-191 | Szűrők alkalmazása ──────────────────────────────────────────────

test.describe('TS-191 | Audit napló szűrők', () => {
  test('Entitás típusa szűrő – Szűrés gomb API hívást indít a paraméterrel', async ({ adminPage: page }) => {
    const capturedUrls: string[] = [];

    await page.route('**/api/v1/audit-logs**', (route) => {
      if (route.request().method() === 'GET') {
        capturedUrls.push(route.request().url());
        return route.fulfill(ok(EMPTY_PAGED));
      }
      return route.continue();
    });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    // Entitás típusa select – első mat-select az oldalon
    const entityTypeSelect = page.locator('mat-select').first();
    await entityTypeSelect.click();
    await page.locator('mat-option', { hasText: 'Application' }).click();

    await page.getByRole('button', { name: 'Szűrés' }).click();
    await page.waitForLoadState('networkidle');

    expect(capturedUrls.some((url) => url.includes('entityType=Application'))).toBe(true);
  });

  test('Törlés gomb – szűrők alaphelyzetbe állnak, oldal elérhető marad', async ({ adminPage: page }) => {
    await page.route('**/api/v1/audit-logs**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(EMPTY_PAGED));
      return route.continue();
    });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Törlés' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Audit napló' })).toBeVisible({ timeout: 5_000 });
  });

  test('Üres találati lista – üres állapot üzenet jelenik meg', async ({ adminPage: page }) => {
    await page.route('**/api/v1/audit-logs**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(EMPTY_PAGED));
      return route.continue();
    });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('p.gm-empty', { hasText: 'Nincs audit bejegyzés' }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-192 | CSV export ──────────────────────────────────────────────────────

test.describe('TS-192 | Audit napló CSV export', () => {
  test('Admin letölti az audit naplót CSV formátumban – fájlnév helyes', async ({ adminPage: page }) => {
    await page.route('**/api/v1/audit-logs**', (route) => {
      const url = route.request().url();
      if (url.includes('/export') && route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'text/csv',
          body: 'id,createdAt,userName,entityType,action\n1,2026-06-01,Admin Felhasználó,Application,Create',
          headers: {
            'Content-Disposition': 'attachment; filename="audit_naplo_20260601.csv"',
          },
        });
      }
      if (route.request().method() === 'GET') return route.fulfill(ok(PAGED_RESULT));
      return route.continue();
    });

    await page.goto('/audit');
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download', { timeout: 8_000 });
    await page.getByRole('button', { name: /export csv/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('audit_naplo_');
  });
});
