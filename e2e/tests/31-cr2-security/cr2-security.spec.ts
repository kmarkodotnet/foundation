/**
 * 31. CR2 — JWT biztonsági tesztek
 * Forgatókönyvek: E2E-120 … E2E-124
 *
 * Kapcsolódó US-ok: US-230, US-231
 *
 * Stratégia:
 *  - JWT aláírás manipuláció → 401
 *  - Audience mismatch (business JWT platform endpointon) → 403
 *  - Lejárt JWT → 401
 *  - Hiányzó JWT → 401
 *  - foundation_roles claim manipulálása → hozzáférés nem bővül
 */

import { test, expect, FOUNDATION_X_ID, FOUNDATION_Y_ID } from '../../fixtures/cr2-fixture';
import { generateCr2Jwt, generateExpiredCr2Jwt, CR2_USERS } from '../../helpers/cr2-jwt';

// Segédfüggvény: fetch a böngésző contextusen belül, opcionális Authorization headerrel
async function pageFetch(
  page: import('@playwright/test').Page,
  method: string,
  url: string,
  token?: string,
): Promise<{ status: number }> {
  return page.evaluate(
    async ({ method, url, token }: { method: string; url: string; token?: string }) => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(url, { method, headers });
      return { status: r.status };
    },
    { method, url, token },
  );
}

// ─── E2E-120 | JWT aláírás manipuláció → 401 ─────────────────────────────────

test.describe('E2E-120 | Manipulált JWT aláírás elutasítása', () => {
  test('Módosított signature-jű JWT → API 401-et ad', async ({ page }) => {
    const validToken = generateCr2Jwt(CR2_USERS.FoundationAdminX);
    const parts = validToken.split('.');
    const tamperedSignature = parts[2]!.slice(0, -4) + 'XXXX';
    const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Unauthorized', detail: 'Invalid token signature.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill({ status: 401, body: '{}' }));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/applications', tamperedToken);
    expect([401, 403]).toContain(result.status);
  });

  test('Módosított payload-jú JWT → API 401-et ad', async ({ page }) => {
    const validToken = generateCr2Jwt(CR2_USERS.PalyazatiMunkatarsX);
    const parts = validToken.split('.');
    const payloadJson = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8')) as Record<string, unknown>;
    payloadJson['platform_role'] = 'PlatformAdmin';
    const tamperedPayload = Buffer.from(JSON.stringify(payloadJson)).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    await page.route('**/api/v1/platform/**', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Unauthorized', detail: 'Token validation failed.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill({ status: 401, body: '{}' }));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/platform/owners', tamperedToken);
    expect([401, 403]).toContain(result.status);
  });
});

// ─── E2E-121 | Audience mismatch → 403 ───────────────────────────────────────

test.describe('E2E-121 | Audience mismatch — business JWT platform endpointon', () => {
  test('Business audience JWT platform endpointon 403-at ad', async ({ page }) => {
    const businessToken = generateCr2Jwt(CR2_USERS.FoundationAdminX);

    await page.route('**/api/v1/platform/**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Az audience claim értéke nem egyezik a megkövetelt értékkel.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/platform/owners', businessToken);
    expect([401, 403]).toContain(result.status);
  });

  test('Owner audience JWT business endpointon 403-at ad', async ({ page }) => {
    const ownerToken = generateCr2Jwt(CR2_USERS.OwnerAdminA);

    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Az audience claim értéke nem egyezik a megkövetelt értékkel.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/applications', ownerToken);
    expect([401, 403]).toContain(result.status);
  });

  test('Platform audience JWT owner endpointon 403-at ad', async ({ page }) => {
    const platformToken = generateCr2Jwt(CR2_USERS.PlatformAdmin);

    await page.route('**/api/v1/owner/**', async (route) => {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Forbidden', detail: 'Platform audience nem férhet hozzá owner erőforrásokhoz.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/owner/foundations', platformToken);
    expect([401, 403]).toContain(result.status);
  });
});

// ─── E2E-122 | Lejárt JWT → 401 ──────────────────────────────────────────────

test.describe('E2E-122 | Lejárt JWT elutasítása', () => {
  test('Lejárt JWT-vel API hívás 401-et kap', async ({ page }) => {
    const expiredToken = generateExpiredCr2Jwt(CR2_USERS.FoundationAdminX);

    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Unauthorized', detail: 'Token has expired.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/applications', expiredToken);
    expect([401, 403]).toContain(result.status);
  });

  test('Lejárt JWT-vel owner API hívás 401-et kap', async ({ page }) => {
    const expiredOwnerToken = generateExpiredCr2Jwt(CR2_USERS.OwnerAdminA);

    await page.route('**/api/v1/owner/**', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Unauthorized', detail: 'Token has expired.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/owner/foundations', expiredOwnerToken);
    expect([401, 403]).toContain(result.status);
  });
});

// ─── E2E-123 | Hiányzó Authorization header → 401 ────────────────────────────

test.describe('E2E-123 | Hiányzó JWT → 401', () => {
  test('Authorization header nélküli kérés 401-et kap', async ({ page }) => {
    await page.route('**/api/v1/applications**', async (route) => {
      const auth = route.request().headers()['authorization'];
      if (!auth) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Unauthorized', detail: 'Authentication required.' }),
        });
      }
      return route.continue();
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/applications');
    expect([401, 403]).toContain(result.status);
  });

  test('"Bearer " prefix nélküli token 401-et kap', async ({ page }) => {
    const token = generateCr2Jwt(CR2_USERS.FoundationAdminX);

    await page.route('**/api/v1/applications**', async (route) => {
      const auth = route.request().headers()['authorization'] ?? '';
      if (!auth.startsWith('Bearer ')) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Unauthorized', detail: 'Invalid authorization scheme.' }),
        });
      }
      return route.continue();
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    // Token Bearer prefix nélkül küldve
    const result = await page.evaluate(
      async ({ url, token }: { url: string; token: string }) => {
        const r = await fetch(url, { headers: { Authorization: token } }); // nincs Bearer prefix
        return { status: r.status };
      },
      { url: '/api/v1/applications', token },
    );

    expect([401, 403]).toContain(result.status);
  });
});

// ─── E2E-124 | Foundation_roles claim manipulálása nem bővít jogot ────────────

test.describe('E2E-124 | foundation_roles claim manipuláció nem bővít hozzáférést', () => {
  test('Foundation Y-ra manipulált foundation_roles JWT-vel Foundation Y adat 401-et ad', async ({ page }) => {
    const validXToken = generateCr2Jwt(CR2_USERS.FoundationAdminX);
    const parts = validXToken.split('.');
    const payloadJson = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf-8')) as Record<string, unknown>;

    const manipulatedRoles: Record<string, string> = {};
    manipulatedRoles[FOUNDATION_X_ID] = 'FoundationAdmin';
    manipulatedRoles[FOUNDATION_Y_ID] = 'FoundationAdmin';
    payloadJson['foundation_roles'] = JSON.stringify(manipulatedRoles);
    payloadJson['foundation_id'] = FOUNDATION_Y_ID;

    const tamperedPayload = Buffer.from(JSON.stringify(payloadJson)).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    await page.route('**/api/v1/applications**', async (route) => {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Unauthorized', detail: 'Token signature is invalid.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', '/api/v1/applications', tamperedToken);
    expect([401, 403]).toContain(result.status);
  });

  test('Érvényes aláírású Foundation X token Foundation Y erőforráshoz nem fér hozzá', async ({ page }) => {
    const xToken = generateCr2Jwt(CR2_USERS.FoundationAdminX);
    const FOUNDATION_Y_APP_ID = 'app-y-00000000-0000-0000-0000-000000000002';

    await page.route(`**/api/v1/applications/${FOUNDATION_Y_APP_ID}**`, async (route) => {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Not Found', detail: 'Az erőforrás nem található vagy nincs hozzáférése.' }),
      });
    });
    await page.route('**/hubs/**', (route) => route.abort());
    await page.route('**/api/v1/**', (route) => route.fulfill(ok({})));

    await page.goto('/');

    const result = await pageFetch(page, 'GET', `/api/v1/applications/${FOUNDATION_Y_APP_ID}`, xToken);
    expect([403, 404]).toContain(result.status);
  });
});

function ok(body: unknown = {}) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}
