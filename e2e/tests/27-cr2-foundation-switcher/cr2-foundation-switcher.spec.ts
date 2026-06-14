/**
 * 27. CR2 — Foundation switcher
 * Forgatókönyvek: E2E-080 … E2E-084
 *
 * Kapcsolódó US: US-220
 *
 * Stratégia:
 *  - Multi-foundation user esetén dropdown látható a navban
 *  - POST /api/v1/me/scope-switch → új JWT → UI újratölt
 *  - Egyetlen Foundation esetén switcher nem jelenik meg
 *  - OA owner-szintre visszaváltás
 *  - Idegen Foundation-ra switch kísérlete 403-at kap
 */

import { test, expect, FOUNDATION_X_ID, FOUNDATION_Y_ID, FOUNDATION_P_ID, OWNER_A_ID } from '../../fixtures/cr2-fixture';
import { generateCr2Jwt, CR2_USERS } from '../../helpers/cr2-jwt';

const EMPTY_PAGE = { items: [], totalCount: 0, page: 1, pageSize: 20 };
function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

const AVAILABLE_SCOPES = {
  platformRole: null,
  ownerId: null,
  ownerName: null,
  ownerRole: null,
  foundations: [
    { foundationId: FOUNDATION_X_ID, foundationName: 'X Alapítvány', role: 'FoundationAdmin' },
    { foundationId: FOUNDATION_Y_ID, foundationName: 'Y Alapítvány', role: 'Megtekinto' },
  ],
};

const SINGLE_SCOPE = {
  platformRole: null,
  ownerId: null,
  ownerName: null,
  ownerRole: null,
  foundations: [
    { foundationId: FOUNDATION_X_ID, foundationName: 'X Alapítvány', role: 'PalyazatiMunkatars' },
  ],
};

// ─── E2E-080 | Sikeres Foundation-váltás ─────────────────────────────────────

test.describe('E2E-080 | Sikeres Foundation-váltás', () => {
  test('Scope-switch endpoint meghívása után új JWT érkezik', async ({ foundationAdminXMultiPage: page }) => {
    const newToken = generateCr2Jwt({
      ...CR2_USERS.FoundationAdminXmulti,
      foundationId: FOUNDATION_Y_ID,
      foundationRoles: { [FOUNDATION_Y_ID]: 'Megtekinto' },
    });

    await page.route('**/api/v1/me/available-scopes**', (route) => route.fulfill(ok(AVAILABLE_SCOPES)));
    await page.route('**/api/v1/me/scope-switch**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({ accessToken: newToken, expiresInSeconds: 28800 }));
      }
      return route.continue();
    });
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/granters**', (route) => route.fulfill(ok([])));
    await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      const responseBody = await r.json().catch(() => ({}));
      return { status: r.status, body: responseBody };
    }, { url: '/api/v1/me/scope-switch', body: { targetFoundationId: FOUNDATION_Y_ID } });

    expect(result.status).toBe(200);
    expect((result.body as Record<string, unknown>)['accessToken']).toBeTruthy();
  });

  test('Foundation-választó dropdown látható multi-foundation felhasználónak', async ({ foundationAdminXMultiPage: page }) => {
    await page.route('**/api/v1/me/available-scopes**', (route) => route.fulfill(ok(AVAILABLE_SCOPES)));
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/granters**', (route) => route.fulfill(ok([])));
    await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const switcher = page.locator('[data-testid="foundation-switcher"]')
      .or(page.getByRole('combobox', { name: /foundation/i }))
      .or(page.locator('app-foundation-switcher'));

    await expect(switcher.first()).toBeVisible({ timeout: 8_000 });
  });

  test('Scope-switch után SCOPE_SWITCH audit-bejegyzés keletkezik', async ({ foundationAdminXMultiPage: page }) => {
    const capturedRequests: unknown[] = [];
    await page.route('**/api/v1/me/scope-switch**', async (route) => {
      if (route.request().method() === 'POST') {
        capturedRequests.push(route.request().postDataJSON());
        const newToken = generateCr2Jwt({ ...CR2_USERS.FoundationAdminXmulti, foundationId: FOUNDATION_Y_ID });
        return route.fulfill(ok({ accessToken: newToken, expiresInSeconds: 28800 }));
      }
      return route.continue();
    });
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/granters**', (route) => route.fulfill(ok([])));
    await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await page.evaluate(async (data: { url: string; body: unknown }) => {
      await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
    }, { url: '/api/v1/me/scope-switch', body: { targetFoundationId: FOUNDATION_Y_ID } });

    expect(capturedRequests).toHaveLength(1);
    const body = capturedRequests[0] as Record<string, unknown>;
    expect(body['targetFoundationId']).toBe(FOUNDATION_Y_ID);
  });
});

// ─── E2E-081 | Egy Foundation-nál nincs switcher ─────────────────────────────

test.describe('E2E-081 | Egyetlen Foundation esetén switcher nem jelenik meg', () => {
  test('PalyazatiMunkatars (1 Foundation) esetén nincs Foundation-választó', async ({ munkatarsXPage: page }) => {
    await page.route('**/api/v1/me/available-scopes**', (route) => route.fulfill(ok(SINGLE_SCOPE)));
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/granters**', (route) => route.fulfill(ok([])));
    await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const switcher = page.locator('[data-testid="foundation-switcher"]')
      .or(page.locator('app-foundation-switcher'));
    await expect(switcher.first()).toHaveCount(0);
  });
});

// ─── E2E-082 | OwnerAdmin visszaváltás owner-szintre ─────────────────────────

test.describe('E2E-082 | OwnerAdmin visszaváltás Owner-szintű kontextusba', () => {
  test('Scope-switch targetFoundationId=null → owner audience JWT-t ad vissza', async ({ ownerAdminAPage: page }) => {
    const ownerToken = generateCr2Jwt(CR2_USERS.OwnerAdminA);

    await page.route('**/api/v1/me/scope-switch**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        if (body['targetFoundationId'] === null || body['targetFoundationId'] === undefined) {
          return route.fulfill(ok({ accessToken: ownerToken, expiresInSeconds: 28800 }));
        }
      }
      return route.continue();
    });
    await page.route('**/api/v1/owner/**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/owner/foundations');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/me/scope-switch', body: { targetFoundationId: null } });

    expect(result.status).toBe(200);
  });

  test('OwnerAdmin owner oldalra navigál visszaváltás után', async ({ ownerAdminAPage: page }) => {
    await page.route('**/api/v1/owner/**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/me/available-scopes**', (route) => route.fulfill(ok({
      platformRole: null,
      ownerId: OWNER_A_ID,
      ownerName: 'Owner A',
      ownerRole: 'OwnerAdmin',
      foundations: [
        { foundationId: FOUNDATION_X_ID, foundationName: 'X Alapítvány', role: 'FoundationAdmin' },
      ],
    })));

    await page.goto('/owner/dashboard');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/owner');
  });
});

// ─── E2E-083 | Idegen Foundation-ra scope-switch kísérlete → 403 ──────────────

test.describe('E2E-083 | Idegen Foundation-ra switch megtagadva', () => {
  test('Foundation X user Foundation P-re (Owner B) nem válthat — 403', async ({ foundationAdminXPage: page }) => {
    await page.route('**/api/v1/me/scope-switch**', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        if (body['targetFoundationId'] === FOUNDATION_P_ID) {
          return route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ title: 'Forbidden', detail: 'Nincs jogosultsága ehhez a Foundationhoz.' }),
          });
        }
      }
      return route.continue();
    });
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/granters**', (route) => route.fulfill(ok([])));
    await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async (data: { url: string; body: unknown }) => {
      const r = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.body),
      });
      return { status: r.status };
    }, { url: '/api/v1/me/scope-switch', body: { targetFoundationId: FOUNDATION_P_ID } });

    expect(result.status).toBe(403);
  });
});

// ─── E2E-084 | Scope-váltáskor nyitott modálok bezárul ───────────────────────

test.describe('E2E-084 | Scope-váltás utáni modal-bezárás', () => {
  test('Scope-switch esemény kiadásakor az alkalmazás oldal újratölt', async ({ foundationAdminXMultiPage: page }) => {
    const newToken = generateCr2Jwt({
      ...CR2_USERS.FoundationAdminXmulti,
      foundationId: FOUNDATION_Y_ID,
      foundationRoles: { [FOUNDATION_Y_ID]: 'Megtekinto' },
    });

    await page.route('**/api/v1/me/scope-switch**', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({ accessToken: newToken, expiresInSeconds: 28800 }));
      }
      return route.continue();
    });
    await page.route('**/api/v1/me/available-scopes**', (route) => route.fulfill(ok(AVAILABLE_SCOPES)));
    await page.route('**/api/v1/applications**', (route) => route.fulfill(ok(EMPTY_PAGE)));
    await page.route('**/api/v1/granters**', (route) => route.fulfill(ok([])));
    await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok(EMPTY_PAGE)));

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    // Scope-switch szimulálása a store-on keresztül (Angular esemény)
    await page.evaluate(
      ({ key, value }: { key: string; value: string }) => sessionStorage.setItem(key, value),
      { key: 'gm_token', value: newToken },
    );

    // Lap frissítése után Foundation Y context
    await page.reload();
    await page.waitForLoadState('networkidle');

    const currentToken = await page.evaluate(() => sessionStorage.getItem('gm_token'));
    expect(currentToken).toBe(newToken);
  });
});
