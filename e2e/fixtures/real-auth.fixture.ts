import { test as base, Page, request, TestInfo } from '@playwright/test';
import { UserRole, TEST_USERS, TestUser } from '../helpers/jwt';

const STORAGE_KEY = 'gm_token';

/**
 * Calls the real backend test-login endpoint to get a genuine JWT.
 * Requires the backend to be running with ASPNETCORE_ENVIRONMENT=Development.
 */
async function fetchRealToken(apiBaseUrl: string, user: TestUser): Promise<string> {
  const ctx = await request.newContext({ baseURL: apiBaseUrl });
  const resp = await ctx.post('/api/v1/auth/test-login', {
    data: {
      role: user.role,
      email: user.email,
      name: user.name,
    },
  });

  if (!resp.ok()) {
    throw new Error(
      `test-login failed for role "${user.role}" (HTTP ${resp.status()}). ` +
        `Is the backend running with ASPNETCORE_ENVIRONMENT=Development?`,
    );
  }

  const body = await resp.json();
  await ctx.dispose();
  return body.accessToken as string;
}

async function injectRealToken(
  page: Page,
  apiBaseUrl: string,
  user: TestUser,
  testInfo: TestInfo,
): Promise<void> {
  let token: string;
  try {
    token = await fetchRealToken(apiBaseUrl, user);
  } catch (err) {
    testInfo.skip(
      true,
      `Backend not available — start the API with ASPNETCORE_ENVIRONMENT=Development. ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: token },
  );
}

function resolveApiBase(baseURL: string | undefined): string {
  return process.env['API_BASE_URL'] ?? baseURL ?? 'http://localhost:5000';
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended test fixtures — one per role, all backed by real backend JWTs
// ─────────────────────────────────────────────────────────────────────────────

type RealAuthFixtures = {
  /** Admin — CanViewAuditLog, CanManageUsers, CanCreateApplication, CanApproveApplication */
  realAdminPage: Page;
  /** Elnök — CanApproveApplication, CanViewAuditLog */
  realElnokPage: Page;
  /** Pályázati munkatárs — CanCreateApplication */
  realMunkatarsPage: Page;
  /** Pénzügyes — CanManageInvoices */
  realPenzugyesPage: Page;
  /** Megtekintő — read-only, no write permissions */
  realMegtekintokPage: Page;
};

export const test = base.extend<RealAuthFixtures>({
  realAdminPage: async ({ page, baseURL }, use, testInfo) => {
    await injectRealToken(page, resolveApiBase(baseURL), TEST_USERS['Admin'], testInfo);
    await use(page);
  },

  realElnokPage: async ({ page, baseURL }, use, testInfo) => {
    await injectRealToken(page, resolveApiBase(baseURL), TEST_USERS['Elnok'], testInfo);
    await use(page);
  },

  realMunkatarsPage: async ({ page, baseURL }, use, testInfo) => {
    await injectRealToken(page, resolveApiBase(baseURL), TEST_USERS['PalyazatiMunkatars'], testInfo);
    await use(page);
  },

  realPenzugyesPage: async ({ page, baseURL }, use, testInfo) => {
    await injectRealToken(page, resolveApiBase(baseURL), TEST_USERS['Penzugyes'], testInfo);
    await use(page);
  },

  realMegtekintokPage: async ({ page, baseURL }, use, testInfo) => {
    await injectRealToken(page, resolveApiBase(baseURL), TEST_USERS['Megtekinto'], testInfo);
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { TEST_USERS, UserRole };
