/**
 * 2. kategória – Felhasználói profil
 * Forgatókönyvek: TS-010, TS-011
 *
 * Stratégia:
 *  - Hitelesített állapot: munkatarsPage fixture (injektált JWT)
 *  - GET /api/v1/auth/me: mockoljuk a profil adatokkal
 *  - PUT /api/v1/auth/me/notification-preferences: mockoljuk a mentési végpontot
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { buildUserProfilePayload, mockUserProfile } from '../../helpers/api-mocks';
import { TEST_USERS } from '../../helpers/jwt';

const PREFS_URL = '**/api/v1/auth/me/notification-preferences';

const defaultProfile = buildUserProfilePayload(TEST_USERS['PalyazatiMunkatars']);

// ─────────────────────────────────────────────────────────────────────────────
// TS-010 | Saját profil megtekintése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-010 | Saját profil megtekintése', () => {
  test('A profil oldal megjeleníti a felhasználó nevét és e-mail címét', async ({
    munkatarsPage,
  }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(munkatarsPage.getByText('Teszt Munkatárs')).toBeVisible();
    await expect(munkatarsPage.getByText('munkatars@test.hu')).toBeVisible();
  });

  test('A szerepkör chip-ként jelenik meg (nem szerkeszthető beviteli mező)', async ({
    munkatarsPage,
  }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    // Role is shown as a mat-chip
    await expect(munkatarsPage.locator('mat-chip').filter({ hasText: 'Pályázati munkatárs' })).toBeVisible();
    // No editable input for role
    await expect(munkatarsPage.locator('input[name="role"]')).toHaveCount(0);
  });

  test('Az értesítési beállítások section hat kapcsolót tartalmaz', async ({
    munkatarsPage,
  }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(munkatarsPage.getByText('Értesítési beállítások')).toBeVisible();
    await expect(munkatarsPage.locator('mat-slide-toggle')).toHaveCount(6);
  });

  test('A sidebar "Profil" linkjén navigálva megnyílik a profil oldal', async ({
    munkatarsPage,
  }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForLoadState('networkidle');

    // On mobile the sidenav is closed — open it first
    const hamburger = munkatarsPage.getByRole('button', { name: 'Navigáció megnyitása' });
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await munkatarsPage.waitForTimeout(300);
    }

    await munkatarsPage.getByRole('link', { name: /profil/i }).click();

    await munkatarsPage.waitForURL('**/profile**', { timeout: 10_000 });
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(munkatarsPage.getByText('Teszt Munkatárs')).toBeVisible();
  });

  test('A profil menüből navigálva megnyílik a profil oldal', async ({
    munkatarsPage,
  }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });

    await munkatarsPage.getByRole('button', { name: /profil menü/i }).click();
    await munkatarsPage.getByRole('menuitem', { name: /profil/i }).click();

    await munkatarsPage.waitForURL('**/profile**', { timeout: 10_000 });
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(munkatarsPage.getByText('Teszt Munkatárs')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-011 | Értesítési beállítások módosítása
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-011 | Értesítési beállítások módosítása', () => {
  test('A Mentés gomb elküldi a módosított beállítást a backendnek', async ({
    munkatarsPage,
  }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    let capturedBody: Record<string, boolean> | null = null;
    await munkatarsPage.route(PREFS_URL, async (route) => {
      if (route.request().method() === 'PUT') {
        capturedBody = JSON.parse(route.request().postData() ?? '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: route.request().postData() ?? '{}',
        });
      } else {
        await route.continue();
      }
    });

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    // Toggle off "Határidő közeledési értesítés" (was true → becomes false)
    const toggle = munkatarsPage.getByRole('switch', { name: /határidő közeledési/i });
    await toggle.scrollIntoViewIfNeeded();
    await toggle.click();
    const responsePromise = munkatarsPage.waitForResponse(PREFS_URL);
    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();
    await responsePromise;

    expect(capturedBody?.emailOnDeadlineApproaching).toBe(false);
  });

  test('Mentés után megerősítő snackbar jelenik meg', async ({ munkatarsPage }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.route(PREFS_URL, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: route.request().postData() ?? '{}',
        });
      } else {
        await route.continue();
      }
    });

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();

    await expect(munkatarsPage.getByText('Értesítési beállítások elmentve.')).toBeVisible({
      timeout: 5_000,
    });
  });

  test('Oldal frissítés után a mentett beállítás megmarad', async ({ munkatarsPage }) => {
    let getCallCount = 0;
    const updatedPrefs = {
      emailOnDeadlineApproaching: false,
      emailOnDeadlineMissed: true,
      emailOnResultRecorded: true,
      emailOnApprovalRequired: true,
      emailOnNewComment: true,
      emailOnDocumentUploaded: true,
    };

    // First GET returns all-true; subsequent GETs return updated prefs
    await munkatarsPage.route('**/api/v1/auth/me', async (route) => {
      if (route.request().method() === 'GET') {
        getCallCount++;
        const prefs = getCallCount === 1
          ? (defaultProfile as any).notificationPreferences
          : updatedPrefs;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...defaultProfile, notificationPreferences: prefs }),
        });
      } else {
        await route.continue();
      }
    });

    await munkatarsPage.route(PREFS_URL, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedPrefs),
        });
      } else {
        await route.continue();
      }
    });

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    // Toggle off and save
    await munkatarsPage.getByRole('switch', { name: /határidő közeledési/i }).click();
    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();
    await expect(munkatarsPage.getByText('Értesítési beállítások elmentve.')).toBeVisible({
      timeout: 5_000,
    });

    // Reload page
    await munkatarsPage.reload();
    await munkatarsPage.waitForLoadState('networkidle');

    // The toggle should be off (aria-checked="false")
    await expect(
      munkatarsPage.getByRole('switch', { name: /határidő közeledési/i }),
    ).toHaveAttribute('aria-checked', 'false');
  });

  test('Backend hiba esetén hibaüzenet snackbar jelenik meg', async ({ munkatarsPage }) => {
    await mockUserProfile(munkatarsPage, defaultProfile);

    await munkatarsPage.route(PREFS_URL, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 500, body: '' });
      } else {
        await route.continue();
      }
    });

    await munkatarsPage.goto('/profile');
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();

    await expect(
      munkatarsPage.getByText('Nem sikerült elmenteni a beállításokat.'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
