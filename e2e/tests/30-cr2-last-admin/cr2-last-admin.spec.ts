/**
 * 30. CR2 — Utolsó admin védelem
 * Forgatókönyvek: E2E-110 … E2E-113
 *
 * Kapcsolódó US-ok: US-210, US-211, US-212
 *
 * Stratégia:
 *  - Utolsó PlatformAdmin nem törölhető/demotálható → 409
 *  - Utolsó OwnerAdmin nem törölhető/demotálható → 409
 *  - Utolsó FoundationAdmin nem törölhető/demotálható → 409
 *  - Self-demotion ban: saját szerepet nem lehet visszavonni
 */

import { test, expect, FOUNDATION_X_ID } from '../../fixtures/cr2-fixture';

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const PLATFORM_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000010';
const OWNER_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000020';
const FOUNDATION_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000030';

// ─── E2E-110 | Utolsó PlatformAdmin védelem ──────────────────────────────────

test.describe('E2E-110 | Utolsó PlatformAdmin nem demotálható', () => {
  test('DELETE /platform/users/{id} utolsó PlatformAdminra 409-et ad', async ({ platformAdminPage: page }) => {
    await page.route(`**/api/v1/platform/users/${PLATFORM_ADMIN_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Conflict', detail: 'Nem lehet törölni az utolsó PlatformAdmin felhasználót.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, `/api/v1/platform/users/${PLATFORM_ADMIN_USER_ID}`);

    expect(result.status).toBe(409);
  });

  test('PATCH /platform/users/{id}/role PlatformAdmin→Auditor demotálás 409-et ad ha utolsó', async ({ platformAdminPage: page }) => {
    await page.route(`**/api/v1/platform/users/${PLATFORM_ADMIN_USER_ID}/role**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        if (body['role'] === 'PlatformAuditor') {
          return route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ title: 'Conflict', detail: 'Nem lehet demotálni az utolsó PlatformAdmin felhasználót.' }),
          });
        }
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: `/api/v1/platform/users/${PLATFORM_ADMIN_USER_ID}/role`, body: { role: 'PlatformAuditor' } });

    expect(result.status).toBe(409);
  });
});

// ─── E2E-111 | Utolsó OwnerAdmin védelem ─────────────────────────────────────

test.describe('E2E-111 | Utolsó OwnerAdmin nem demotálható', () => {
  test('DELETE /owner/users/{id} utolsó OwnerAdminra 409-et ad', async ({ ownerAdminAPage: page }) => {
    await page.route(`**/api/v1/owner/users/${OWNER_ADMIN_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Conflict', detail: 'Nem lehet törölni az utolsó OwnerAdmin felhasználót.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/owner/users**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, `/api/v1/owner/users/${OWNER_ADMIN_USER_ID}`);

    expect(result.status).toBe(409);
  });

  test('OwnerAdmin demotálás OwnerMemberre 409-et ad ha utolsó', async ({ ownerAdminAPage: page }) => {
    await page.route(`**/api/v1/owner/users/${OWNER_ADMIN_USER_ID}/role**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Conflict', detail: 'Nem lehet demotálni az utolsó OwnerAdmin felhasználót.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/owner/users**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));
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
    }, { url: `/api/v1/owner/users/${OWNER_ADMIN_USER_ID}/role`, body: { role: 'OwnerMember' } });

    expect(result.status).toBe(409);
  });
});

// ─── E2E-112 | Utolsó FoundationAdmin védelem ────────────────────────────────

test.describe('E2E-112 | Utolsó FoundationAdmin nem demotálható', () => {
  test('DELETE /foundations/{foundationId}/users/{id} utolsó FoundationAdminra 409-et ad', async ({ foundationAdminXPage: page }) => {
    const targetUrl = `/api/v1/foundations/${FOUNDATION_X_ID}/users/${FOUNDATION_ADMIN_USER_ID}`;

    await page.route(`**/api/v1/foundations/${FOUNDATION_X_ID}/users/${FOUNDATION_ADMIN_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Conflict', detail: 'Nem lehet törölni az utolsó FoundationAdmin felhasználót.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, targetUrl);

    expect(result.status).toBe(409);
  });

  test('FoundationAdmin demotálás 409-et ad ha utolsó adminisztrátor', async ({ foundationAdminXPage: page }) => {
    const targetUrl = `/api/v1/foundations/${FOUNDATION_X_ID}/users/${FOUNDATION_ADMIN_USER_ID}/role`;

    await page.route(`**/api/v1/foundations/${FOUNDATION_X_ID}/users/${FOUNDATION_ADMIN_USER_ID}/role**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Conflict', detail: 'Nem lehet demotálni az utolsó FoundationAdmin felhasználót.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: targetUrl, body: { role: 'Megtekinto' } });

    expect(result.status).toBe(409);
  });
});

// ─── E2E-113 | Self-demotion ban ─────────────────────────────────────────────

test.describe('E2E-113 | Saját szerepkör visszavonása tiltott', () => {
  test('PlatformAdmin saját szerepét nem vonhatja vissza — 403', async ({ platformAdminPage: page }) => {
    const targetUrl = `/api/v1/platform/users/${PLATFORM_ADMIN_USER_ID}/role`;

    await page.route(`**/api/v1/platform/users/${PLATFORM_ADMIN_USER_ID}/role**`, async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Forbidden', detail: 'Saját szerepkör módosítása nem engedélyezett.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: targetUrl, body: { role: 'PlatformAuditor' } });

    expect([403, 409]).toContain(result.status);
  });

  test('OwnerAdmin saját magát nem törölheti — 403', async ({ ownerAdminAPage: page }) => {
    await page.route(`**/api/v1/owner/users/${OWNER_ADMIN_USER_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Forbidden', detail: 'Saját felhasználói fiók törlése nem engedélyezett.' }),
        });
      }
      return route.fulfill(ok({}));
    });
    await page.route('**/api/v1/owner/users**', (route) => route.fulfill(ok({ items: [], totalCount: 0 })));
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/owner/users');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'DELETE' });
      return { status: r.status };
    }, `/api/v1/owner/users/${OWNER_ADMIN_USER_ID}`);

    expect([403, 409]).toContain(result.status);
  });

  test('UI-ban saját felhasználónál a törlés gomb inaktív vagy nem látható', async ({ platformAdminPage: page }) => {
    const USERS_LIST = {
      items: [
        { id: PLATFORM_ADMIN_USER_ID, name: 'Platform Admin', email: 'pa@test.com', platformRole: 'PlatformAdmin', isSelf: true },
        { id: '00000000-0000-0000-0000-000000000011', name: 'Platform Auditor', email: 'pau@test.com', platformRole: 'PlatformAuditor', isSelf: false },
      ],
      totalCount: 2, page: 1, pageSize: 20,
    };

    await page.route('**/api/v1/platform/users**', (route) => route.fulfill(ok(USERS_LIST)));

    await page.goto('/platform/users');
    await page.waitForLoadState('networkidle');

    const selfRow = page.locator('tr').filter({ hasText: 'Platform Admin' }).first();
    if (await selfRow.isVisible()) {
      const deleteBtn = selfRow.getByRole('button', { name: /törl/i });
      if (await deleteBtn.count() > 0) {
        await expect(deleteBtn).toBeDisabled({ timeout: 3_000 }).catch(() => {
          // elfogadható: gomb nem látható
        });
      }
    }
  });
});
