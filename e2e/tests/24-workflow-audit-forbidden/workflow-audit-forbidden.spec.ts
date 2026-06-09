/**
 * 24. kategória – Munkafolyamat tab, Lépés kihagyás/visszaállítás, Előzmények tab, 403 oldal
 * Forgatókönyvek: TS-230, TS-231, TS-232, TS-233, TS-234
 *
 * Stratégia:
 *  - TS-230: Munkafolyamat accordion – lépés típusnév látható, aktív lépés kinyílik,
 *            "Lépés lezárása" gomb POST-ot küld és snackbar jelenik meg
 *  - TS-231: Lépés kihagyása – Admin/Munkatárs látja a gombot aktív lépésnél,
 *            dialog megerősítés POST /skip hívást indít, Mégsem nem küld POST-ot,
 *            Megtekintő nem látja a gombot
 *  - TS-232: Lépés visszaállítása – Admin látja a "Visszaállítás" gombot kihagyott
 *            lépésnél, POST /restore hívás és snackbar jelenik meg
 *  - TS-233: Előzmények tab – Admin/Elnök látja, Munkatárs nem látja;
 *            tab tartalma: audit bejegyzések megjelennek; üres lista kezelt
 *  - TS-234: 403 Forbidden oldal – fejléc látható, visszanavigáció /applications-ra
 *
 * API végpontok:
 *   GET  /api/v1/applications/{id}                                → ApplicationDetail
 *   POST /api/v1/applications/{id}/workflow/{type}/complete        → WorkflowStepDetail
 *   POST /api/v1/applications/{id}/workflow/{type}/skip            → WorkflowStepDetail
 *   POST /api/v1/applications/{id}/workflow/{type}/restore         → WorkflowStepDetail
 *   GET  /api/v1/audit-logs/application/{id}                      → AuditLogEntry[]
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000024';

const VENDOR_STEP_ACTIVE = {
  id: 'step-vendor-0024',
  stepType: 'VendorContracts',
  status: 'Active',
  order: 6,
  isSkippable: true,
  skippedReason: null,
  completedAt: null,
};

const VENDOR_STEP_SKIPPED = {
  ...VENDOR_STEP_ACTIVE,
  status: 'Skipped',
  skippedReason: 'Nem szükséges alvállalkozó',
};

const APP_BASE = {
  id: APP_ID,
  title: 'Munkafolyamat Teszt Pályázat',
  identifier: 'MTP-2026-001',
  description: null,
  status: 'InProgress',
  granterId: 'bbbbbbbb-0000-0000-0000-000000000024',
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2026-09-30',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: null,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Admin Felhasználó',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
  workflowSteps: [],
};

const APP_WITH_ACTIVE_STEP = {
  ...APP_BASE,
  workflowSteps: [VENDOR_STEP_ACTIVE],
};

const APP_WITH_SKIPPED_STEP = {
  ...APP_BASE,
  workflowSteps: [VENDOR_STEP_SKIPPED],
};

const STEP_DETAIL_COMPLETED = {
  id: VENDOR_STEP_ACTIVE.id,
  stepType: 'VendorContracts',
  status: 'Completed',
  order: 6,
  isSkippable: true,
  skippedReason: null,
  completedAt: '2026-06-06T10:00:00Z',
};

const STEP_DETAIL_SKIPPED = {
  ...STEP_DETAIL_COMPLETED,
  status: 'Skipped',
  skippedReason: 'Nem szükséges',
  completedAt: null,
};

const STEP_DETAIL_ACTIVE = {
  ...STEP_DETAIL_COMPLETED,
  status: 'Active',
  completedAt: null,
};

const AUDIT_ENTRY = {
  id: 1,
  createdAt: '2026-06-01T10:00:00Z',
  userId: 'user-admin-001',
  userName: 'Admin Felhasználó',
  userEmail: 'admin@example.com',
  entityType: 'Application',
  entityId: APP_ID,
  action: 'Update',
  fieldName: 'title',
  oldValue: 'Régi cím',
  newValue: 'Új cím',
  ipAddress: '127.0.0.1',
};

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

/**
 * Regisztrálja a workflow alútvonalak mock-ait.
 * Visszaad [] minden GET kérésre (kivéve budget-plan → null),
 * és átengedi a POST kéréseket a következő kezelőnek.
 * Regisztrálási sorrend: alacsonyabb prioritású legyen, mint az app detail mock.
 */
async function mockWorkflowSubRoutes(page: import('@playwright/test').Page): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}/**`, (route) => {
    const method = route.request().method();
    const url = route.request().url();
    if (method === 'GET') {
      if (url.includes('/budget-plan')) return route.fulfill(ok(null));
      return route.fulfill(ok([]));
    }
    return route.continue();
  });
  await page.route('**/api/v1/vendors**', (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok([]));
    return route.continue();
  });
}

// ─── TS-230 | Munkafolyamat lépések megjelenítése ─────────────────────────────

test.describe('TS-230 | Munkafolyamat lépések megjelenítése', () => {
  test('Aktív lépés típusneve látható az accordion fejlécben', async ({ munkatarsPage: page }) => {
    await mockWorkflowSubRoutes(page);
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('mat-panel-title', { hasText: 'Alvállalkozói szerz.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Lépés lezárása gomb megjelenik az aktív lépésnél', async ({ adminPage: page }) => {
    await mockWorkflowSubRoutes(page);
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Lépés lezárása' })).toBeVisible({ timeout: 8_000 });
  });

  test('Lépés lezárása – POST hívás és "Lépés lezárva." snackbar', async ({ adminPage: page }) => {
    let completeCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}/**`, (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'POST' && url.includes('/complete')) {
        completeCalled = true;
        return route.fulfill(ok(STEP_DETAIL_COMPLETED));
      }
      if (method === 'GET') {
        if (url.includes('/budget-plan')) return route.fulfill(ok(null));
        return route.fulfill(ok([]));
      }
      return route.continue();
    });
    await page.route('**/api/v1/vendors**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Lépés lezárása' }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: 'Lépés lezárva' }),
    ).toBeVisible({ timeout: 5_000 });
    expect(completeCalled).toBe(true);
  });
});

// ─── TS-231 | Lépés kihagyása ─────────────────────────────────────────────────

test.describe('TS-231 | Lépés kihagyása', () => {
  test('Admin látja a "Lépés kihagyása" gombot aktív kihagyható lépésnél', async ({ adminPage: page }) => {
    await mockWorkflowSubRoutes(page);
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Lépés kihagyása' })).toBeVisible({ timeout: 8_000 });
  });

  test('Kihagyás megerősítése – POST /skip hívás és "Lépés kihagyva." snackbar', async ({ adminPage: page }) => {
    let skipCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}/**`, (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'POST' && url.includes('/skip')) {
        skipCalled = true;
        return route.fulfill(ok(STEP_DETAIL_SKIPPED));
      }
      if (method === 'GET') {
        if (url.includes('/budget-plan')) return route.fulfill(ok(null));
        return route.fulfill(ok([]));
      }
      return route.continue();
    });
    await page.route('**/api/v1/vendors**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Lépés kihagyása' }).click();

    // Dialog megjelenik
    await expect(
      page.locator('h2[mat-dialog-title]', { hasText: 'Lépés kihagyása' }),
    ).toBeVisible({ timeout: 5_000 });

    // Megerősítés gomb
    await page.locator('button', { hasText: 'Kihagyás megerősítése' }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: 'Lépés kihagyva' }),
    ).toBeVisible({ timeout: 5_000 });
    expect(skipCalled).toBe(true);
  });

  test('Mégsem – POST /skip nem hívódik meg', async ({ adminPage: page }) => {
    let skipCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}/**`, (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'POST' && url.includes('/skip')) {
        skipCalled = true;
        return route.fulfill(ok(STEP_DETAIL_SKIPPED));
      }
      if (method === 'GET') {
        if (url.includes('/budget-plan')) return route.fulfill(ok(null));
        return route.fulfill(ok([]));
      }
      return route.continue();
    });
    await page.route('**/api/v1/vendors**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Lépés kihagyása' }).click();
    await expect(
      page.locator('h2[mat-dialog-title]', { hasText: 'Lépés kihagyása' }),
    ).toBeVisible({ timeout: 5_000 });

    await page.locator('button', { hasText: 'Mégsem' }).click();

    expect(skipCalled).toBe(false);
  });

  test('Megtekintő nem látja a "Lépés kihagyása" gombot', async ({ megtekintosPage: page }) => {
    await mockWorkflowSubRoutes(page);
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_ACTIVE_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: 'Lépés kihagyása' })).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-232 | Lépés visszaállítása ───────────────────────────────────────────

test.describe('TS-232 | Lépés visszaállítása', () => {
  test('Admin látja a "Visszaállítás" gombot kihagyott lépésnél', async ({ adminPage: page }) => {
    await mockWorkflowSubRoutes(page);
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_SKIPPED_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    // A kihagyott lépés nincs automatikusan kinyitva – kinyitjuk
    await page.locator('mat-expansion-panel-header', { hasText: 'Alvállalkozói' }).click();

    await expect(page.getByRole('button', { name: 'Visszaállítás' })).toBeVisible({ timeout: 5_000 });
  });

  test('Visszaállítás – POST /restore hívás és "Lépés visszaállítva." snackbar', async ({ adminPage: page }) => {
    let restoreCalled = false;

    await page.route(`**/api/v1/applications/${APP_ID}/**`, (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'POST' && url.includes('/restore')) {
        restoreCalled = true;
        return route.fulfill(ok(STEP_DETAIL_ACTIVE));
      }
      if (method === 'GET') {
        if (url.includes('/budget-plan')) return route.fulfill(ok(null));
        return route.fulfill(ok([]));
      }
      return route.continue();
    });
    await page.route('**/api/v1/vendors**', (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_WITH_SKIPPED_STEP));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    // Kinyitjuk a kihagyott lépés panelját
    await page.locator('mat-expansion-panel-header', { hasText: 'Alvállalkozói' }).click();

    await expect(page.getByRole('button', { name: 'Visszaállítás' })).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Visszaállítás' }).click();

    await expect(
      page.locator('mat-snack-bar-container', { hasText: 'Lépés visszaállítva' }),
    ).toBeVisible({ timeout: 5_000 });
    expect(restoreCalled).toBe(true);
  });
});

// ─── TS-233 | Előzmények tab ──────────────────────────────────────────────────

test.describe('TS-233 | Előzmények tab', () => {
  test('Admin/Elnök látja az "Előzmények" tabot a pályázat részletezőjén', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/audit-logs/application/${APP_ID}**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_BASE));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('.mat-mdc-tab', { hasText: 'Előzmények' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Munkatárs nem látja az "Előzmények" tabot', async ({ munkatarsPage: page }) => {
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_BASE));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('.mat-mdc-tab', { hasText: 'Előzmények' }),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test('Előzmények tabra kattintva audit bejegyzések megjelennek', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/audit-logs/application/${APP_ID}**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([AUDIT_ENTRY]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_BASE));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('.mat-mdc-tab', { hasText: 'Előzmények' }).click();
    await page.waitForLoadState('networkidle');

    const userCell = page.locator('td', { hasText: 'Admin Felhasználó' }).first();
    await userCell.waitFor({ state: 'attached', timeout: 8_000 });
    await userCell.scrollIntoViewIfNeeded();
    await expect(userCell).toBeVisible({ timeout: 5_000 });
  });

  test('Üres előzmény lista esetén "Nincs audit bejegyzés." üzenet jelenik meg', async ({ adminPage: page }) => {
    await page.route(`**/api/v1/audit-logs/application/${APP_ID}**`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });
    await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') return route.fulfill(ok(APP_BASE));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await page.locator('.mat-mdc-tab', { hasText: 'Előzmények' }).click();
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('p.gm-empty', { hasText: 'Nincs audit bejegyzés' }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-234 | 403 Forbidden oldal ─────────────────────────────────────────────

test.describe('TS-234 | 403 Forbidden oldal', () => {
  test('"403 – Hozzáférés megtagadva" fejléc látható a /403 oldalon', async ({ munkatarsPage: page }) => {
    await page.goto('/403');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: '403 – Hozzáférés megtagadva' }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('"Vissza a főoldalra" gomb visszanavigál /applications-ra', async ({ munkatarsPage: page }) => {
    await page.goto('/403');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: 'Vissza a főoldalra' }).click();
    await expect(page).toHaveURL(/\/applications(\?|$)/, { timeout: 5_000 });
  });
});
