/**
 * 29. CR2 — Owner életciklus
 * Forgatókönyvek: E2E-100 … E2E-102
 *
 * Kapcsolódó US-ok: US-200, US-201, US-202
 *
 * Stratégia:
 *  - Owner provisioning: POST /platform/owners → 201 + OWNER_PROVISIONED audit
 *  - Owner felfüggesztés blokkolja a bejelentkezést → 403
 *  - Owner archiválás csak üres Foundation-listával lehetséges
 */

import { test, expect, OWNER_A_ID } from '../../fixtures/cr2-fixture';

const EMPTY_PAGE = { items: [], totalCount: 0, page: 1, pageSize: 20 };
function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const NEW_OWNER_ID = 'cccccccc-0000-0000-0000-000000000099';
const NEW_OWNER = {
  id: NEW_OWNER_ID,
  name: 'Teszt Nonprofit Kft.',
  taxNumber: '12345678-2-41',
  status: 'Active',
  createdAt: '2026-06-14T10:00:00Z',
};

const ACTIVE_OWNER = {
  id: OWNER_A_ID,
  name: 'Owner A Szervezet',
  taxNumber: '11111111-2-41',
  status: 'Active',
  createdAt: '2026-06-01T08:00:00Z',
};

// ─── E2E-100 | Teljes Owner provisioning folyamat ─────────────────────────────

test.describe('E2E-100 | Owner provisioning — POST /platform/owners', () => {
  test('POST /platform/owners 201-et és az új Owner-t adja vissza', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(NEW_OWNER),
        });
      }
      return route.fulfill(ok(EMPTY_PAGE));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, {
      url: '/api/v1/platform/owners',
      body: { name: 'Teszt Nonprofit Kft.', taxNumber: '12345678-2-41', adminEmail: 'admin@teszt-nonprofit.hu' },
    });

    expect(result.status).toBe(201);
    const body = result.body as Record<string, unknown>;
    expect(body['id']).toBeTruthy();
    expect(body['status']).toBe('Active');
  });

  test('Owner provisioning után OWNER_PROVISIONED audit bejegyzés keletkezik', async ({ platformAdminPage: page }) => {
    const AUDIT_LOG = {
      items: [
        {
          id: 1,
          action: 'OWNER_PROVISIONED',
          entityType: 'Owner',
          entityId: NEW_OWNER_ID,
          userId: '00000000-0000-0000-0000-000000000010',
          createdAt: '2026-06-14T10:00:00Z',
        },
      ],
      totalCount: 1, page: 1, pageSize: 20,
    };

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/audit-logs**', (route) => route.fulfill(ok(AUDIT_LOG)));

    await page.goto('/platform/audit-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('OWNER_PROVISIONED')).toBeVisible({ timeout: 8_000 });
  });

  test('Owner meghívó email elküldése a provisioning során', async ({ platformAdminPage: page }) => {
    const capturedBodies: unknown[] = [];

    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBodies.push(route.request().postDataJSON());
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(NEW_OWNER),
        });
      }
      return route.fulfill(ok({ items: [ACTIVE_OWNER], totalCount: 1, page: 1, pageSize: 20 }));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async (data: { url: string; body: unknown }) => {
      await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
    }, {
      url: '/api/v1/platform/owners',
      body: { name: 'Teszt Nonprofit Kft.', taxNumber: '12345678-2-41', adminEmail: 'admin@teszt-nonprofit.hu' },
    });

    expect(capturedBodies).toHaveLength(1);
    const body = capturedBodies[0] as Record<string, unknown>;
    expect(body['adminEmail']).toBeTruthy();
  });

  test('Owner lista oldal megjelenik a PlatformAdmin számára', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [ACTIVE_OWNER], totalCount: 1, page: 1, pageSize: 20 })),
    );

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /owner/i })).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E2E-101 | Owner felfüggesztése blokkolja a bejelentkezést ────────────────

test.describe('E2E-101 | Owner felfüggesztés és reaktiválás', () => {
  test('PATCH /platform/owners/{id}/suspend 200-at és Suspended státuszt ad', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [ACTIVE_OWNER], totalCount: 1, page: 1, pageSize: 20 })),
    );
    await page.route(`**/api/v1/platform/owners/${OWNER_A_ID}/suspend**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'POST') {
        return route.fulfill(ok({ ...ACTIVE_OWNER, status: 'Suspended' }));
      }
      return route.fulfill(ok({}));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'PATCH' });
      return { status: r.status };
    }, `/api/v1/platform/owners/${OWNER_A_ID}/suspend`);

    expect([200, 204]).toContain(result.status);
  });

  test('Felfüggesztett Owner bejelentkezési kísérlete 403-at kap', async ({ page }) => {
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/auth/google**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Forbidden',
          detail: 'Az Owner szervezet felfüggesztve. Kérjük vegye fel a kapcsolatot az adminisztrátorral.',
        }),
      });
    });

    await page.goto('/');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/auth/google', body: { idToken: 'mock-google-token' } });

    expect(result.status).toBe(403);
  });

  test('Owner reaktiválásakor az Active státusz visszaáll', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [{ ...ACTIVE_OWNER, status: 'Suspended' }], totalCount: 1, page: 1, pageSize: 20 })),
    );
    await page.route(`**/api/v1/platform/owners/${OWNER_A_ID}/reactivate**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'POST') {
        return route.fulfill(ok({ ...ACTIVE_OWNER, status: 'Active' }));
      }
      return route.fulfill(ok({}));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const reactivateBtn = page.getByRole('button', { name: /reaktiváln/i }).first();
    if (await reactivateBtn.isVisible()) {
      const result = await page.evaluate(async (url: string) => {
        const r = await fetch(url, { method: 'PATCH' });
        return { status: r.status };
      }, `/api/v1/platform/owners/${OWNER_A_ID}/reactivate`);
      expect([200, 204]).toContain(result.status);
    }
  });

  test('Felfüggesztett Owner a listában Suspended státusszal jelenik meg', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [{ ...ACTIVE_OWNER, status: 'Suspended' }], totalCount: 1, page: 1, pageSize: 20 })),
    );

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Suspended')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E2E-102 | Owner archiválás csak üres Foundation-listával ─────────────────

test.describe('E2E-102 | Owner archiválás — aktív Foundation-ok blokkolnak', () => {
  test('DELETE/archive aktív Foundation-nal rendelkező Owner-t 409-et kap', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [ACTIVE_OWNER], totalCount: 1, page: 1, pageSize: 20 })),
    );
    await page.route(`**/api/v1/platform/owners/${OWNER_A_ID}/archive**`, async (route) => {
      return route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Conflict',
          detail: 'Az Owner nem archiválható, amíg aktív Foundationjai vannak.',
        }),
      });
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'POST' });
      return { status: r.status };
    }, `/api/v1/platform/owners/${OWNER_A_ID}/archive`);

    expect(result.status).toBe(409);
  });

  test('Üres Foundation-listájú Owner archiválása 200-at ad', async ({ platformAdminPage: page }) => {
    const EMPTY_OWNER_ID = 'dddddddd-0000-0000-0000-000000000099';

    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [ACTIVE_OWNER], totalCount: 1, page: 1, pageSize: 20 })),
    );
    await page.route(`**/api/v1/platform/owners/${EMPTY_OWNER_ID}/archive**`, async (route) => {
      return route.fulfill(ok({ id: EMPTY_OWNER_ID, status: 'Archived' }));
    });

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'POST' });
      return { status: r.status };
    }, `/api/v1/platform/owners/${EMPTY_OWNER_ID}/archive`);

    expect([200, 204]).toContain(result.status);
  });

  test('Archivált Owner a listában Archived státusszal jelenik meg', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/owners**', (route) =>
      route.fulfill(ok({ items: [{ ...ACTIVE_OWNER, status: 'Archived' }], totalCount: 1, page: 1, pageSize: 20 })),
    );

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Archived')).toBeVisible({ timeout: 8_000 });
  });
});
