/**
 * Smoke tests — run against the real backend (no mocking).
 *
 * Prerequisites:
 *   - Backend: ASPNETCORE_ENVIRONMENT=Development
 *   - Frontend running
 *   - API_BASE_URL env var (if API is not on the same origin as PW_BASE_URL)
 *
 * Run: npx playwright test tests/smoke --project=chromium
 */

import { test, expect } from '../../fixtures/real-auth.fixture';

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

test.describe('smoke: auth', () => {
  test('test-login endpoint issues a valid JWT and app loads', async ({ realAdminPage }) => {
    await realAdminPage.goto('/');
    await expect(realAdminPage).not.toHaveURL(/\/login/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit log — Admin + Elnök látja, többi nem
// ─────────────────────────────────────────────────────────────────────────────

test.describe('smoke: audit log permissions', () => {
  // FE route guard: /audit → csak Admin (app.routes.ts data: { roles: ['Admin'] })
  // BE policy: CanViewAuditLog → Admin + Elnök

  test('Admin látja az audit napló oldalt', async ({ realAdminPage }) => {
    await realAdminPage.goto('/audit');
    await expect(realAdminPage.getByRole('heading', { name: /audit napló/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Elnök látja az audit napló oldalt', async ({ realElnokPage }) => {
    await realElnokPage.goto('/audit');
    await expect(realElnokPage.getByRole('heading', { name: /audit napló/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Pályázati munkatárs nem fér hozzá az audit naplóhoz (403-ra irányítja)', async ({
    realMunkatarsPage,
  }) => {
    await realMunkatarsPage.goto('/audit');
    await expect(realMunkatarsPage).toHaveURL(/\/(403|applications|login)/, { timeout: 10_000 });
  });

  test('Megtekintő nem fér hozzá az audit naplóhoz (403-ra irányítja)', async ({
    realMegtekintokPage,
  }) => {
    await realMegtekintokPage.goto('/audit');
    await expect(realMegtekintokPage).toHaveURL(/\/(403|applications|login)/, {
      timeout: 10_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pályázat létrehozás — Admin + Munkatárs igen, Megtekintő + Pénzügyes nem
// ─────────────────────────────────────────────────────────────────────────────

test.describe('smoke: application create permissions', () => {
  test('Admin látja az Új pályázat gombot', async ({ realAdminPage }) => {
    await realAdminPage.goto('/applications');
    await expect(realAdminPage.getByRole('button', { name: /új pályázat/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Pályázati munkatárs látja az Új pályázat gombot', async ({ realMunkatarsPage }) => {
    await realMunkatarsPage.goto('/applications');
    await expect(realMunkatarsPage.getByRole('button', { name: /új pályázat/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Megtekintő nem látja az Új pályázat gombot', async ({ realMegtekintokPage }) => {
    await realMegtekintokPage.goto('/applications');
    await expect(
      realMegtekintokPage.getByRole('button', { name: /új pályázat/i }),
    ).toHaveCount(0);
  });

  test('Pénzügyes nem látja az Új pályázat gombot', async ({ realPenzugyesPage }) => {
    await realPenzugyesPage.goto('/applications');
    await expect(
      realPenzugyesPage.getByRole('button', { name: /új pályázat/i }),
    ).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Felhasználókezelés — csak Admin
// ─────────────────────────────────────────────────────────────────────────────

test.describe('smoke: user management permissions', () => {
  test('Admin eléri a felhasználókezelést', async ({ realAdminPage }) => {
    await realAdminPage.goto('/admin/users');
    await expect(
      realAdminPage.getByRole('heading', { name: /felhasználók/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Elnök hozzáfér a felhasználókezeléshez (olvasás jog)', async ({
    realElnokPage,
  }) => {
    await realElnokPage.goto('/admin/users');
    await expect(
      realElnokPage.getByRole('heading', { name: /felhasználók/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
