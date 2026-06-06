import { test as base, Page } from '@playwright/test';
import {
  generateJwt,
  generateExpiredJwt,
  TEST_USERS,
  UserRole,
  TestUser,
  buildAuthResult,
} from '../helpers/jwt';
import { mockAuthenticatedSession } from '../helpers/api-mocks';

const STORAGE_KEY = 'gm_token';
const OAUTH_STATE_KEY = 'gm_oauth_state';

/** Injects a valid JWT into sessionStorage BEFORE Angular initializes */
async function injectToken(page: Page, user: TestUser): Promise<void> {
  const token = generateJwt(user);
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: token },
  );
}

/** Injects an EXPIRED JWT into sessionStorage */
async function injectExpiredToken(page: Page, user: TestUser): Promise<void> {
  const token = generateExpiredJwt(user);
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: token },
  );
}

/**
 * Simulates the full Google OAuth callback flow:
 * 1. Sets the OAuth state in sessionStorage
 * 2. Mocks the google-callback API endpoint
 * 3. Navigates to /auth/callback with the test code + state
 */
export async function simulateOAuthLogin(
  page: Page,
  user: TestUser,
  extraMocks?: () => Promise<void>,
): Promise<void> {
  const testState = 'e2e-oauth-state-test-12345';
  const testCode = 'e2e-auth-code-test';

  // Mock google-callback
  await page.route('**/api/v1/auth/google-callback', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildAuthResult(user)),
      });
    } else {
      await route.continue();
    }
  });

  // Extra mocks (e.g. applications list)
  if (extraMocks) await extraMocks();

  // First: navigate to login to establish the origin in sessionStorage
  await page.goto('/login');

  // Set the OAuth state that OidcCallbackComponent will validate
  await page.evaluate(
    ({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
    },
    { key: OAUTH_STATE_KEY, value: testState },
  );

  // Navigate to the callback URL (simulates Google redirect)
  await page.goto(`/auth/callback?code=${testCode}&state=${testState}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended test fixtures
// ─────────────────────────────────────────────────────────────────────────────

type AuthFixtures = {
  /** Page pre-authenticated as Admin with mocked APIs */
  adminPage: Page;
  /** Page pre-authenticated as Elnök with mocked APIs */
  elnokPage: Page;
  /** Page pre-authenticated as Pályázati munkatárs with mocked APIs */
  munkatarsPage: Page;
  /** Page pre-authenticated as Pénzügyes with mocked APIs */
  penzugyesPage: Page;
  /** Page pre-authenticated as Megtekintő with mocked APIs */
  megtekintosPage: Page;
  /** Page with an EXPIRED token (no role) */
  expiredAuthPage: Page;
};

export const test = base.extend<AuthFixtures>({
  adminPage: async ({ page }, use) => {
    await injectToken(page, TEST_USERS['Admin']);
    await mockAuthenticatedSession(page);
    await use(page);
  },

  elnokPage: async ({ page }, use) => {
    await injectToken(page, TEST_USERS['Elnok']);
    await mockAuthenticatedSession(page);
    await use(page);
  },

  munkatarsPage: async ({ page }, use) => {
    await injectToken(page, TEST_USERS['PalyazatiMunkatars']);
    await mockAuthenticatedSession(page);
    await use(page);
  },

  penzugyesPage: async ({ page }, use) => {
    await injectToken(page, TEST_USERS['Penzugyes']);
    await mockAuthenticatedSession(page);
    await use(page);
  },

  megtekintosPage: async ({ page }, use) => {
    await injectToken(page, TEST_USERS['Megtekintos']);
    await mockAuthenticatedSession(page);
    await use(page);
  },

  expiredAuthPage: async ({ page }, use) => {
    await injectExpiredToken(page, TEST_USERS['PalyazatiMunkatars']);
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { generateJwt, generateExpiredJwt, TEST_USERS, buildAuthResult, UserRole };
