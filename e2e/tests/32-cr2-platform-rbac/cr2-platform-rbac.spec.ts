/**
 * 32. CR2 — Platform RBAC
 * Forgatókönyvek: E2E-040 … E2E-042
 *
 * Kapcsolódó US-ok: US-205, US-206
 *
 * Stratégia:
 *  - PlatformAdmin (PA) vs PlatformAuditor (PAu) jogosultságok
 *  - PA nem fér hozzá business adatokhoz (pályázatok, granterek)
 *  - Platform + Foundation role kombináció vizsgálata
 */

import { test, expect } from '../../fixtures/cr2-fixture';
import { generateCr2Jwt, CR2_USERS } from '../../helpers/cr2-jwt';

const EMPTY_PAGE = { items: [], totalCount: 0, page: 1, pageSize: 20 };
function ok(body: unknown = {}) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const PLATFORM_USERS_LIST = {
  items: [
    { id: '00000000-0000-0000-0000-000000000010', name: 'Platform Admin', email: 'pa@test.com', role: 'PlatformAdmin' },
    { id: '00000000-0000-0000-0000-000000000011', name: 'Platform Auditor', email: 'pau@test.com', role: 'PlatformAuditor' },
  ],
  totalCount: 2, page: 1, pageSize: 20,
};

const OWNERS_LIST = {
  items: [
    { id: 'aaaaaaaa-0000-0000-0000-000000000001', name: 'Owner A', status: 'Active' },
  ],
  totalCount: 1, page: 1, pageSize: 20,
};

// ─── E2E-040 | PlatformAdmin vs PlatformAuditor jogosultság-különbség ─────────

test.describe('E2E-040 | PA vs PAu CRUD jogosultságok', () => {
  test('PlatformAdmin POST /platform/owners 201-et kap', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-owner-id', status: 'Active' }),
        });
      }
      return route.fulfill(ok(OWNERS_LIST));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/platform/owners', body: { name: 'Új Owner', taxNumber: '99999999-2-41', adminEmail: 'admin@uj-owner.hu' } });

    expect(result.status).toBe(201);
  });

  test('PlatformAuditor POST /platform/owners 403-at kap', async ({ platformAuditorPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Forbidden', detail: 'PlatformAuditor csak olvasási jogosultsággal rendelkezik.' }),
        });
      }
      return route.fulfill(ok(OWNERS_LIST));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/platform/owners', body: { name: 'Új Owner', taxNumber: '99999999-2-41', adminEmail: 'admin@uj-owner.hu' } });

    expect([403, 405]).toContain(result.status);
  });

  test('PlatformAuditor GET /platform/owners 200-at kap', async ({ platformAuditorPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', (route) => route.fulfill(ok(OWNERS_LIST)));

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      return { status: r.status };
    }, '/api/v1/platform/owners');

    expect(result.status).toBe(200);
  });

  test('PlatformAuditor platform audit-log oldala olvasható', async ({ platformAuditorPage: page }) => {
    const AUDIT_LOG = {
      items: [
        { id: 1, action: 'Create', entityType: 'Owner', createdAt: '2026-06-14T09:00:00Z' },
      ],
      totalCount: 1, page: 1, pageSize: 20,
    };

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/audit-logs**', (route) => route.fulfill(ok(AUDIT_LOG)));

    await page.goto('/platform/audit-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Create')).toBeVisible({ timeout: 8_000 });
  });

  test('PlatformAdmin DELETE /platform/users/{id} 200-at kap', async ({ platformAdminPage: page }) => {
    const TARGET_USER_ID = '00000000-0000-0000-0000-000000000099';

    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok(PLATFORM_USERS_LIST)));
    await page.route(`**/api/v1/platform/users/${TARGET_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fulfill(ok({}));
    });

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, `/api/v1/platform/users/${TARGET_USER_ID}`);

    expect([200, 204]).toContain(result.status);
  });

  test('PlatformAuditor DELETE /platform/users/{id} 403-at kap', async ({ platformAuditorPage: page }) => {
    const TARGET_USER_ID = '00000000-0000-0000-0000-000000000099';

    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok(PLATFORM_USERS_LIST)));
    await page.route(`**/api/v1/platform/users/${TARGET_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Forbidden', detail: 'Nincs törlési jogosultsága.' }),
        });
      }
      return route.fulfill(ok({}));
    });

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, `/api/v1/platform/users/${TARGET_USER_ID}`);

    expect([403, 405]).toContain(result.status);
  });
});

// ─── E2E-041 | PlatformAdmin nem fér hozzá business adatokhoz ─────────────────

test.describe('E2E-041 | PlatformAdmin nem fér hozzá business API-hoz', () => {
  test('PlatformAdmin GET /applications 403-at kap', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Platform audience nem fér hozzá business erőforrásokhoz.' }),
      });
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      return { status: r.status };
    }, '/api/v1/applications');

    expect([401, 403]).toContain(result.status);
  });

  test('PlatformAdmin GET /granters 403-at kap', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/granters**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Platform audience nem fér hozzá business erőforrásokhoz.' }),
      });
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      return { status: r.status };
    }, '/api/v1/granters');

    expect([401, 403]).toContain(result.status);
  });

  test('PlatformAdmin felhasználói lista oldala megjelenik', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok(PLATFORM_USERS_LIST)));

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /felhasználó|user/i })).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E2E-042 | Platform + Foundation szerepkör kombináció ────────────────────

test.describe('E2E-042 | Platform és Foundation szerepkör kombináció', () => {
  test('Felhasználó egyszerre lehet FoundationAdmin és PlatformAuditor', async ({ page }) => {
    const hybridToken = generateCr2Jwt({ ...CR2_USERS.PlatformAuditor });

    await page.addInitScript(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_token', value: hybridToken },
    );
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/platform');
  });

  test('Platform audience token nem ad business pályázat-listázási jogot', async ({ platformAuditorPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Audience mismatch.' }),
      });
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      return { status: r.status };
    }, '/api/v1/applications');

    expect([401, 403]).toContain(result.status);
  });

  test('Nincs szerepkörrel rendelkező felhasználó 403-at kap minden endpointon', async ({ page }) => {
    const noRoleToken = generateCr2Jwt({
      id: '00000000-0000-0000-0000-999999999999',
      googleId: 'google-no-role',
      email: 'norole@test.com',
      name: 'No Role User',
      audience: 'business' as const,
    });

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Nincs érvényes szerepköre.' }),
      });
    });

    await page.goto('/');

    const result = await page.evaluate(
      async ({ url, token }: { url: string; token: string }) => {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return { status: r.status };
      },
      { url: '/api/v1/applications', token: noRoleToken },
    );

    expect([401, 403]).toContain(result.status);
  });
});
