/**
 * 19. kategória – Értesítések
 * Forgatókönyvek: TS-180, TS-181, TS-182, TS-183
 *
 * Stratégia:
 *  - TS-180: Értesítési harang badge – olvasatlan értesítés esetén badge megjelenik, különben rejtett
 *  - TS-181: Értesítések dropdown – harangra kattintva elemek láthatók, üres állapot kezelt
 *  - TS-182: Értesítésre kattintva olvasottnak jelöl (PATCH) és az alkalmazás oldalára navigál
 *  - TS-183: "Összes olvasott" gomb – PATCH /read-all hívás megtörténik
 *
 * API végpontok:
 *   GET   /api/v1/notifications?includeRead=false → AppNotification[]
 *   PATCH /api/v1/notifications/{id}/read         → 200
 *   PATCH /api/v1/notifications/read-all          → 200
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const NOTIF_ID = 'notif-0001-0000-0000-000000000019';
const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000019';

const UNREAD_NOTIFICATION = {
  id: NOTIF_ID,
  type: 'SubmissionDeadlineApproaching',
  title: 'Közelgő beadási határidő',
  body: 'A pályázat beadási határideje 7 napon belül lejár.',
  relatedEntityId: APP_ID,
  relatedEntityType: 'Application',
  isRead: false,
  readAt: null,
  createdAt: '2026-06-01T10:00:00Z',
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// ─── TS-180 | Értesítési harang badge ────────────────────────────────────────

test.describe('TS-180 | Értesítési harang badge', () => {
  test('Olvasatlan értesítés esetén badge megjelenik a harangon', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/notifications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([UNREAD_NOTIFICATION]));
      return route.fulfill(ok({}));
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('button[aria-label="Értesítések"] .mat-badge-content');
    await expect(badge).toBeVisible({ timeout: 5_000 });
  });

  test('Nincs olvasatlan értesítés esetén badge nem látható', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/notifications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.fulfill(ok({}));
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('button[aria-label="Értesítések"] .mat-badge-content');
    await expect(badge).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-181 | Értesítések dropdown ───────────────────────────────────────────

test.describe('TS-181 | Értesítések dropdown', () => {
  test('Harang kattintásra dropdown nyílik értesítés elemekkel', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/notifications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([UNREAD_NOTIFICATION]));
      return route.fulfill(ok({}));
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Értesítések"]');

    await expect(
      page.locator('.gm-notif-item-title', { hasText: 'Közelgő beadási határidő' }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.locator('.gm-notif-item-body', { hasText: '7 napon belül' }),
    ).toBeVisible();
  });

  test('Üres értesítési lista – "Nincs értesítés" üzenet jelenik meg', async ({ munkatarsPage: page }) => {
    await page.route('**/api/v1/notifications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.fulfill(ok({}));
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Értesítések"]');

    await expect(
      page.locator('.gm-notif-empty', { hasText: 'Nincs értesítés' }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-182 | Értesítés kattintás – olvasottnak jelölés és navigálás ─────────

test.describe('TS-182 | Értesítés kattintás', () => {
  test('Kattintásra olvasottnak jelöl és az alkalmazás részlező oldalára navigál', async ({ munkatarsPage: page }) => {
    let patchCalled = false;

    await page.route('**/api/v1/notifications**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([UNREAD_NOTIFICATION]));
      if (method === 'PATCH' && url.includes('/read')) {
        patchCalled = true;
        return route.fulfill(ok({}));
      }
      return route.fulfill(ok({}));
    });

    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill(ok({
          id: APP_ID,
          title: 'Közelgő pályázat',
          status: 'Draft',
          workflowSteps: [],
        }));
      }
      return route.continue();
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Értesítések"]');

    const notifItem = page.locator('button.gm-notif-item').first();
    await expect(notifItem).toBeVisible({ timeout: 5_000 });
    await notifItem.click();

    await expect(page).toHaveURL(new RegExp(`/applications/${APP_ID}`), { timeout: 8_000 });
    expect(patchCalled).toBe(true);
  });
});

// ─── TS-183 | Összes olvasottnak jelölése ────────────────────────────────────

test.describe('TS-183 | Összes olvasott', () => {
  test('"Összes olvasott" gomb – PATCH /read-all hívás megtörténik', async ({ munkatarsPage: page }) => {
    let readAllCalled = false;

    await page.route('**/api/v1/notifications**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'GET') return route.fulfill(ok([UNREAD_NOTIFICATION]));
      if (method === 'PATCH' && url.includes('read-all')) {
        readAllCalled = true;
        return route.fulfill(ok({}));
      }
      return route.fulfill(ok({}));
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Értesítések"]');

    // "Összes olvasott" gomb látható (van olvasatlan értesítés)
    const allReadBtn = page.locator('button').filter({ hasText: 'Összes olvasott' });
    await expect(allReadBtn).toBeVisible({ timeout: 5_000 });
    await allReadBtn.click();

    expect(readAllCalled).toBe(true);
  });

  test('Olvasott értesítés esetén az "Összes olvasott" gomb nem jelenik meg', async ({ munkatarsPage: page }) => {
    const READ_NOTIFICATION = { ...UNREAD_NOTIFICATION, isRead: true, readAt: '2026-06-02T10:00:00Z' };

    await page.route('**/api/v1/notifications**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([READ_NOTIFICATION]));
      return route.fulfill(ok({}));
    });

    await page.goto('/applications');
    await page.waitForLoadState('networkidle');

    await page.click('button[aria-label="Értesítések"]');

    const allReadBtn = page.locator('button').filter({ hasText: 'Összes olvasott' });
    await expect(allReadBtn).not.toBeVisible({ timeout: 5_000 });
  });
});
