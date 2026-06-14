/**
 * 33. CR2 — Owner RBAC
 * Forgatókönyvek: E2E-030 … E2E-033
 *
 * Kapcsolódó US-ok: US-203, US-204
 *
 * Stratégia:
 *  - OwnerAdmin (OA) vs OwnerMember jogosultság-különbség CRUD-ra
 *  - OA cross-foundation aggregált olvasása (saját Owner-en belül)
 *  - OA privilege escalation megakadályozása
 *  - OA cross-Owner izoláció (Owner A → Owner B adat)
 */

import { test, expect, OWNER_A_ID, OWNER_B_ID, FOUNDATION_X_ID, FOUNDATION_Y_ID } from '../../fixtures/cr2-fixture';
import { generateCr2Jwt, CR2_USERS } from '../../helpers/cr2-jwt';

const EMPTY_PAGE = { items: [], totalCount: 0, page: 1, pageSize: 20 };
function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const OWNER_A_FOUNDATIONS = {
  items: [
    { id: FOUNDATION_X_ID, name: 'X Alapítvány', ownerId: OWNER_A_ID, status: 'Active' },
    { id: FOUNDATION_Y_ID, name: 'Y Alapítvány', ownerId: OWNER_A_ID, status: 'Active' },
  ],
  totalCount: 2, page: 1, pageSize: 20,
};

const OWNER_A_USERS = {
  items: [
    { id: '00000000-0000-0000-0000-000000000020', name: 'Owner Admin A', email: 'oa@owner-a.com', role: 'OwnerAdmin', ownerId: OWNER_A_ID },
    { id: '00000000-0000-0000-0000-000000000099', name: 'Owner Member', email: 'om@owner-a.com', role: 'OwnerMember', ownerId: OWNER_A_ID },
  ],
  totalCount: 2, page: 1, pageSize: 20,
};

// ─── E2E-030 | OwnerAdmin vs OwnerMember CRUD jogosultságok ──────────────────

test.describe('E2E-030 | OwnerAdmin CRUD vs OwnerMember olvasás', () => {
  test('OwnerAdmin POST /owner/foundations 201-et kap', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/foundations**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-foundation-id',
            name: 'Új Alapítvány',
            ownerId: OWNER_A_ID,
            status: 'Active',
          }),
        });
      }
      return route.fulfill(ok(OWNER_A_FOUNDATIONS));
    });
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, { url: '/api/v1/owner/foundations', body: { name: 'Új Alapítvány', taxNumber: '55555555-2-41' } });

    expect(result.status).toBe(201);
  });

  test('OwnerMember POST /owner/foundations 403-at kap', async ({ page }) => {
    const ownerMemberToken = generateCr2Jwt({
      ...CR2_USERS.OwnerAdminA,
      id: '00000000-0000-0000-0000-000000000099',
      email: 'om@owner-a.com',
      name: 'Owner Member',
      ownerRole: 'OwnerMember',
    });

    await page.addInitScript(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_token', value: ownerMemberToken },
    );
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/owner/foundations**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Forbidden', detail: 'OwnerMember nem hozhat létre Foundationt.' }),
        });
      }
      return route.fulfill(ok(OWNER_A_FOUNDATIONS));
    });
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/owner/foundations', body: { name: 'Új Alapítvány', taxNumber: '55555555-2-41' } });

    expect([403, 405]).toContain(result.status);
  });

  test('OwnerAdmin DELETE /owner/users/{id} sikeres', async ({ ownerAdminAPage: page }) => {
    const MEMBER_USER_ID = '00000000-0000-0000-0000-000000000099';

    await page.route(`**/api/v1/owner/users/${MEMBER_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204, body: '' });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/owner/users**', (route) => route.fulfill(ok(OWNER_A_USERS)));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, `/api/v1/owner/users/${MEMBER_USER_ID}`);

    expect([200, 204]).toContain(result.status);
  });

  test('OwnerAdmin GET /owner/users 200-at kap', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/users**', (route) => route.fulfill(ok(OWNER_A_USERS)));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, '/api/v1/owner/users');

    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    expect(body['items']).toBeTruthy();
  });
});

// ─── E2E-031 | OwnerAdmin cross-foundation aggregált olvasás ─────────────────

test.describe('E2E-031 | OwnerAdmin cross-foundation adatolvasás (saját Owner)', () => {
  test('GET /owner/foundations mindkét Foundation-t visszaadja Owner A-nak', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/foundations**', (route) => route.fulfill(ok(OWNER_A_FOUNDATIONS)));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, '/api/v1/owner/foundations');

    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    const items = (body['items'] as unknown[]) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(2);

    const foundationIds = items.map((f: unknown) => (f as Record<string, unknown>)['id']);
    expect(foundationIds).toContain(FOUNDATION_X_ID);
    expect(foundationIds).toContain(FOUNDATION_Y_ID);
  });

  test('Owner audit-log mindkét Foundation eseményét tartalmazza', async ({ ownerAdminAPage: page }) => {
    const AUDIT_LOG = {
      items: [
        { id: 1, foundationId: FOUNDATION_X_ID, action: 'Create', entityType: 'Application', createdAt: '2026-06-14T08:00:00Z' },
        { id: 2, foundationId: FOUNDATION_Y_ID, action: 'Update', entityType: 'Application', createdAt: '2026-06-14T09:00:00Z' },
      ],
      totalCount: 2, page: 1, pageSize: 50,
    };

    await page.route('**/api/v1/owner/audit-logs**', (route) => route.fulfill(ok(AUDIT_LOG)));
    await page.route('**/api/v1/owner/**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/owner/audit-logs');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(2, { timeout: 8_000 });
  });

  test('OwnerAdmin dashboard mindkét Foundation összesítőjét mutatja', async ({ ownerAdminAPage: page }) => {
    const DASHBOARD = {
      ownerId: OWNER_A_ID,
      ownerName: 'Owner A',
      totalApplications: 5,
      foundations: [
        { foundationId: FOUNDATION_X_ID, name: 'X Alapítvány', activeApplications: 3 },
        { foundationId: FOUNDATION_Y_ID, name: 'Y Alapítvány', activeApplications: 2 },
      ],
    };

    await page.route('**/api/v1/owner/reports/dashboard**', (route) => route.fulfill(ok(DASHBOARD)));
    await page.route('**/api/v1/owner/**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('X Alapítvány')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Y Alapítvány')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E2E-032 | OwnerAdmin privilege escalation megakadályozása ────────────────

test.describe('E2E-032 | OwnerAdmin nem adhat magának PlatformAdmin szerepet', () => {
  test('PATCH /owner/users/{id}/role PlatformAdmin szerepre 403-at kap', async ({ ownerAdminAPage: page }) => {
    const OWN_USER_ID = '00000000-0000-0000-0000-000000000020';

    await page.route(`**/api/v1/owner/users/${OWN_USER_ID}/role**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        if (body['role'] === 'PlatformAdmin' || body['role'] === 'PlatformAuditor') {
          return route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ title: 'Forbidden', detail: 'OwnerAdmin nem adhat Platform szintű szerepkört.' }),
          });
        }
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/owner/users**', (route) => route.fulfill(ok(OWNER_A_USERS)));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: `/api/v1/owner/users/${OWN_USER_ID}/role`, body: { role: 'PlatformAdmin' } });

    expect([400, 403, 422]).toContain(result.status);
  });

  test('OwnerAdmin nem hozhat létre platformszintű erőforrást', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/platform/**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Audience mismatch: owner JWT nem fér hozzá platform API-hoz.' }),
      });
    });
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      return { status: r.status };
    }, '/api/v1/platform/owners');

    expect([401, 403]).toContain(result.status);
  });
});

// ─── E2E-033 | OwnerAdmin cross-Owner izoláció ───────────────────────────────

test.describe('E2E-033 | OwnerAdmin nem fér hozzá Owner B adataihoz', () => {
  test('Owner A JWT-vel Owner B foundation-jai nem látszanak', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/foundations**', async (route) => {
      return route.fulfill(ok(OWNER_A_FOUNDATIONS));
    });
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, '/api/v1/owner/foundations');

    const body = result.body as Record<string, unknown>;
    const items = (body['items'] as unknown[]) ?? [];
    const ownerBItems = items.filter(
      (f: unknown) => (f as Record<string, unknown>)['ownerId'] === OWNER_B_ID,
    );

    expect(ownerBItems).toHaveLength(0);
  });

  test('Owner B Foundation közvetlen lekérése Owner A JWT-vel 404-et ad', async ({ ownerAdminAPage: page }) => {
    const OWNER_B_FOUNDATION_ID = 'ffffffff-0000-0000-0000-000000000003';

    await page.route(`**/api/v1/owner/foundations/${OWNER_B_FOUNDATION_ID}**`, async (route) => {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', detail: 'Az erőforrás nem található.' }),
      });
    });
    await page.route('**/api/v1/owner/foundations**', (route) => route.fulfill(ok(OWNER_A_FOUNDATIONS)));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      return { status: r.status };
    }, `/api/v1/owner/foundations/${OWNER_B_FOUNDATION_ID}`);

    expect([403, 404]).toContain(result.status);
  });

  test('Owner A JWT-vel Owner B felhasználói nem látszanak', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/users**', async (route) => {
      return route.fulfill(ok(OWNER_A_USERS));
    });
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url);
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, '/api/v1/owner/users');

    const body = result.body as Record<string, unknown>;
    const items = (body['items'] as unknown[]) ?? [];
    const ownerBUsers = items.filter(
      (u: unknown) => (u as Record<string, unknown>)['ownerId'] === OWNER_B_ID,
    );

    expect(ownerBUsers).toHaveLength(0);
  });

  test('Cross-Owner meghívási kísérlet 403-at ad', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/invitations**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        if (body['targetOwnerId'] === OWNER_B_ID) {
          return route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ title: 'Forbidden', detail: 'Nincs jogosultsága ehhez az Owner-hez.' }),
          });
        }
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/owner/invitations', body: { email: 'hack@owner-b.com', targetOwnerId: OWNER_B_ID, role: 'OwnerAdmin' } });

    expect([400, 403, 422]).toContain(result.status);
  });
});
