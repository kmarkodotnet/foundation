import { Page, Route } from '@playwright/test';
import { TestUser } from './jwt';

const EMPTY_PAGE = { items: [], totalCount: 0, page: 1, pageSize: 20 };

function jsonOk(route: Route, body: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/** Intercepts SignalR WebSocket so it never blocks tests */
export async function mockSignalR(page: Page): Promise<void> {
  await page.route('**/hubs/**', (route) => route.abort());
}

/** Mocks the applications list with an empty or provided dataset */
export async function mockApplicationsList(
  page: Page,
  payload: unknown = EMPTY_PAGE,
): Promise<void> {
  await page.route('**/api/v1/applications**', (route) => jsonOk(route, payload));
}

/** Mocks the granters list */
export async function mockGrantersList(
  page: Page,
  payload: unknown = EMPTY_PAGE,
): Promise<void> {
  await page.route('**/api/v1/granters**', (route) => jsonOk(route, payload));
}

/** Mocks the codelists endpoint */
export async function mockCodelists(
  page: Page,
  payload: unknown = EMPTY_PAGE,
): Promise<void> {
  await page.route('**/api/v1/codelists**', (route) => jsonOk(route, payload));
}

/** Mocks the logout endpoint to return 204 */
export async function mockLogout(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/logout', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 204, body: '' });
    } else {
      await route.continue();
    }
  });
}

/** Mocks the notifications endpoint */
export async function mockNotifications(
  page: Page,
  payload: unknown = EMPTY_PAGE,
): Promise<void> {
  await page.route('**/api/v1/notifications**', (route) => jsonOk(route, payload));
}

/** Mocks the user profile (/auth/me) endpoint */
export async function mockCurrentUser(page: Page, user: object): Promise<void> {
  await page.route('**/api/v1/auth/me', (route) => jsonOk(route, user));
}

/** Builds a UserProfileDto payload from a TestUser */
export function buildUserProfilePayload(user: TestUser, overrides: object = {}): object {
  return {
    id: user.id,
    email: user.email,
    fullName: user.name,
    role: user.role,
    lastLoginAt: '2026-06-01T10:00:00Z',
    notificationPreferences: {
      emailOnDeadlineApproaching: true,
      emailOnDeadlineMissed: true,
      emailOnResultRecorded: true,
      emailOnApprovalRequired: true,
      emailOnNewComment: true,
      emailOnDocumentUploaded: true,
    },
    ...overrides,
  };
}

/** Mocks GET /api/v1/auth/me with a user profile payload */
export async function mockUserProfile(page: Page, payload: object): Promise<void> {
  await page.route('**/api/v1/auth/me', (route) => {
    if (route.request().method() === 'GET') {
      return jsonOk(route, payload);
    }
    return route.continue();
  });
}

/** Registers all common mocks needed for an authenticated session */
export async function mockAuthenticatedSession(page: Page): Promise<void> {
  await mockSignalR(page);
  await mockApplicationsList(page);
  await mockGrantersList(page);
  await mockCodelists(page);
  await mockLogout(page);
  await mockNotifications(page);
}
