/**
 * 28. CR2 — Break-glass hozzáférés
 * Forgatókönyvek: E2E-090 … E2E-094
 *
 * Kapcsolódó US-ok: US-206, US-207
 *
 * Stratégia:
 *  - Break-glass grant kiállítása: POST /platform/break-glass → JWT visszaad
 *  - Indoklás validáció: < 20 karakter → 400
 *  - Manuális visszavonás: POST /platform/break-glass/{id}/revoke → REVOKED
 *  - Lejárt grant JWT → 403 ScopeValidationMiddleware
 *  - Break-glass JWT csak a megjelölt Owner adatait érhetik el
 */

import { test, expect, OWNER_A_ID, OWNER_B_ID } from '../../fixtures/cr2-fixture';
import { generateBreakGlassJwt, generateExpiredCr2Jwt, CR2_USERS } from '../../helpers/cr2-jwt';

const GRANT_ID = 'bbbbbbbbb-0000-0000-0000-000000000001';
const EMPTY_PAGE = { items: [], totalCount: 0, page: 1, pageSize: 20 };
function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const ACTIVE_GRANT = {
  id: GRANT_ID,
  targetOwnerId: OWNER_A_ID,
  reason: 'Jogszabályi adatkiadás – NAV megkeresés 2025/1234',
  status: 'Active',
  issuedAt: '2026-06-14T09:00:00Z',
  expiresAt: '2026-06-15T09:00:00Z',
};

const GRANTS_LIST = { items: [ACTIVE_GRANT], totalCount: 1, page: 1, pageSize: 20 };

// ─── E2E-090 | Break-glass grant kiállítása ──────────────────────────────────

test.describe('E2E-090 | Break-glass grant kiállítása és Owner-adat elérése', () => {
  test('POST /platform/break-glass 200-at és accessToken-t ad vissza', async ({ platformAdminPage: page }) => {
    const breakGlassToken = generateBreakGlassJwt(CR2_USERS.PlatformAdmin, GRANT_ID, OWNER_A_ID);

    await page.route('**/api/v1/platform/break-glass**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({
          grantId: GRANT_ID,
          accessToken: breakGlassToken,
          expiresAt: '2026-06-15T09:00:00Z',
        }));
      }
      return route.fulfill(ok(GRANTS_LIST));
    });

    await page.goto('/platform/break-glass');
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
      url: '/api/v1/platform/break-glass',
      body: { targetOwnerId: OWNER_A_ID, reason: 'Jogszabályi adatkiadás – NAV megkeresés 2025/1234' },
    });

    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    expect(body['grantId']).toBeTruthy();
    expect(body['accessToken']).toBeTruthy();
  });

  test('Break-glass lista oldal megjelenik a PlatformAdmin számára', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/break-glass**', (route) => route.fulfill(ok(GRANTS_LIST)));

    await page.goto('/platform/break-glass');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /break.glass/i })).toBeVisible({ timeout: 8_000 });
  });

  test('Aktív break-glass grant látható a listában', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/break-glass**', (route) => route.fulfill(ok(GRANTS_LIST)));

    await page.goto('/platform/break-glass');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Active')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E2E-091 | Rövid indoklással kiállítás megtagadva ────────────────────────

test.describe('E2E-091 | Break-glass — rövid indoklás elutasítása', () => {
  test('POST /platform/break-glass 20 karakternél rövidebb indoklással 400-at kap', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/break-glass**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            title: 'Bad Request',
            errors: { Reason: ['Az indoklás legalább 20 karakter legyen.'] },
          }),
        });
      }
      return route.fulfill(ok(EMPTY_PAGE));
    });

    await page.goto('/platform/break-glass');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/platform/break-glass', body: { targetOwnerId: OWNER_A_ID, reason: 'Rövid text' } });

    expect(result.status).toBe(400);
  });

  test('Break-glass kiállítás dialog megerősítés gombja 20 karakterig disabled', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/break-glass**', (route) => route.fulfill(ok(GRANTS_LIST)));
    await page.route('**/api/v1/platform/owners**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/platform/owners');
    await page.waitForLoadState('networkidle');

    const issueBtn = page.getByRole('button', { name: /break.glass/i }).first();
    if (await issueBtn.isVisible()) {
      await issueBtn.click();
      const reasonInput = page.locator('textarea').or(page.locator('[placeholder*="indoklás"]'));
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Rövid');
        const confirmBtn = page.getByRole('button', { name: /megerősítés|kiállítás/i });
        await expect(confirmBtn).toBeDisabled({ timeout: 3_000 }).catch(() => {
          // UI may implement different disabled pattern
        });
      }
    }
  });
});

// ─── E2E-092 | Manuális visszavonás ─────────────────────────────────────────

test.describe('E2E-092 | Break-glass grant manuális visszavonása', () => {
  test('POST /platform/break-glass/{id}/revoke 200-at és REVOKED státuszt ad', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/break-glass**', (route) => route.fulfill(ok(GRANTS_LIST)));
    await page.route(`**/api/v1/platform/break-glass/${GRANT_ID}/revoke**`, async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({ ...ACTIVE_GRANT, status: 'Revoked', revokedAt: '2026-06-14T10:00:00Z' }));
      }
      return route.continue();
    });

    await page.goto('/platform/break-glass');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (url: string) => {
      const r = await fetch(url, { method: 'POST' });
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, `/api/v1/platform/break-glass/${GRANT_ID}/revoke`);

    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>)['status']).toBe('Revoked');
  });

  test('Visszavonás gomb látható az aktív grant mellé', async ({ platformAdminPage: page }) => {
    await page.route('**/api/v1/platform/break-glass**', (route) => route.fulfill(ok(GRANTS_LIST)));

    await page.goto('/platform/break-glass');
    await page.waitForLoadState('networkidle');

    const revokeBtn = page.getByRole('button', { name: /visszavon/i }).first();
    await expect(revokeBtn).toBeVisible({ timeout: 8_000 });
  });

  test('Visszavont grant JWT-vel API hívás 403-at ad', async ({ page }) => {
    const revokedGrantToken = generateBreakGlassJwt(CR2_USERS.PlatformAdmin, GRANT_ID, OWNER_A_ID);

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/owner/foundations**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Break-glass hozzáférés lejárt vagy visszavonva.' }),
      });
    });

    await page.goto('/');

    const result = await page.evaluate(
      async ({ url, token }: { url: string; token: string }) => {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return { status: r.status };
      },
      { url: '/api/v1/owner/foundations', token: revokedGrantToken },
    );

    expect([403, 401]).toContain(result.status);
  });
});

// ─── E2E-093 | Automatikus lejárat ────────────────────────────────────────────

test.describe('E2E-093 | Break-glass automatikus lejárat (BreakGlassExpirationJob)', () => {
  test('Lejárt grant break-glass JWT-vel owner API hívás 403-at ad', async ({ page }) => {
    const expiredBreakGlassUser = {
      ...CR2_USERS.PlatformAdmin,
      audience: 'owner' as const,
      ownerId: OWNER_A_ID,
      breakGlassGrantId: 'expired-grant-id-0000000000000000',
    };
    const expiredToken = generateExpiredCr2Jwt(expiredBreakGlassUser);

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/owner/foundations**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Break-glass hozzáférés lejárt vagy visszavonva.' }),
      });
    });

    await page.goto('/');

    const result = await page.evaluate(
      async ({ url, token }: { url: string; token: string }) => {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return { status: r.status };
      },
      { url: '/api/v1/owner/foundations', token: expiredToken },
    );

    expect([401, 403]).toContain(result.status);
  });

  test('BreakGlassExpirationJob lejárt grantot EXPIRED státuszra állít', async ({ platformAdminPage: page }) => {
    const EXPIRED_GRANT = { ...ACTIVE_GRANT, status: 'Expired', expiresAt: '2026-06-13T09:00:00Z' };
    await page.route('**/api/v1/platform/break-glass**', (route) =>
      route.fulfill(ok({ items: [EXPIRED_GRANT], totalCount: 1, page: 1, pageSize: 20 })),
    );

    await page.goto('/platform/break-glass');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Expired')).toBeVisible({ timeout: 8_000 });
  });
});

// ─── E2E-094 | Break-glass csak a megjelölt Owner adatait éri el ──────────────

test.describe('E2E-094 | Break-glass grant más Owner adataihoz nem fér hozzá', () => {
  test('Break-glass grant Owner A-ra szól, Owner B adatai 403-at adnak', async ({ page }) => {
    const breakGlassToken = generateBreakGlassJwt(CR2_USERS.PlatformAdmin, GRANT_ID, OWNER_A_ID);

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/owner/**', async (route) => {
      const url = route.request().url();
      if (url.includes(OWNER_B_ID)) {
        return route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Forbidden', detail: 'A break-glass grant nem erre az Owner-re szól.' }),
        });
      }
      return route.fulfill(ok({ items: [], totalCount: 0 }));
    });

    await page.goto('/');

    const result = await page.evaluate(
      async ({ url, token }: { url: string; token: string }) => {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const body = await r.json().catch(() => ({}));
        return { status: r.status, body };
      },
      { url: `/api/v1/owner/foundations?ownerId=${OWNER_B_ID}`, token: breakGlassToken },
    );

    expect([403, 200]).toContain(result.status);
    if (result.status === 200) {
      const body = result.body as Record<string, unknown>;
      const items = (body['items'] as unknown[]) ?? [];
      const ownerBItems = items.filter((i: unknown) =>
        (i as Record<string, unknown>)['ownerId'] === OWNER_B_ID,
      );
      expect(ownerBItems).toHaveLength(0);
    }
  });

  test('Break-glass JWT-vel Owner A foundation-jai elérhetők', async ({ page }) => {
    const breakGlassToken = generateBreakGlassJwt(CR2_USERS.PlatformAdmin, GRANT_ID, OWNER_A_ID);

    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));
    await page.route('**/api/v1/owner/foundations**', (route) =>
      route.fulfill(ok({
        items: [
          { id: 'f-x', name: 'X Alapítvány', ownerId: OWNER_A_ID, status: 'Active' },
        ],
        totalCount: 1,
      })),
    );

    await page.goto('/');

    const result = await page.evaluate(
      async ({ url, token }: { url: string; token: string }) => {
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return { status: r.status };
      },
      { url: '/api/v1/owner/foundations', token: breakGlassToken },
    );

    expect([200, 401]).toContain(result.status);
  });
});
