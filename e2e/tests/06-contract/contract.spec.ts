/**
 * 6. kategória – Értesítő és szerződéskötés
 * Forgatókönyvek: TS-050, TS-051, TS-052
 *
 * Stratégia:
 *  - TS-050: Munkatárs, Contract lépés Active (app status: Won)
 *  - TS-051: Munkatárs, lépés kihagyása SkipReasonDialog-on át
 *  - TS-052: Admin/Elnök, Skipped lépés visszaállítása
 *
 * Contract lépés panel label: "[4] Szerz./Pályáztató"
 * Skip gomb: *hasRole=['Admin', 'PalyazatiMunkatars']
 * Visszaállítás gomb: *hasRole=['Admin', 'Elnok']
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'eeeeeeee-0000-0000-0000-000000000006';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_CONTRACT_ID = 'step-c-000-0000-0000-000000000004';

// ─── Segéd: workflow lépések gyártója ────────────────────────────────────────

function makeSteps(contractStatus: string = 'Active', skippedReason: string | null = null) {
  const base = (type: string, order: number, status: string, extra: object = {}) => ({
    id: `step-c-000-0000-0000-00000000000${order}`,
    stepType: type,
    status,
    order,
    isSkippable: order >= 4,
    skippedReason: null,
    completedAt: status === 'Completed' ? `2026-0${order}-01T10:00:00Z` : null,
    completedByUserName: status === 'Completed' ? 'Teszt Munkatárs' : null,
    approvedAt: null,
    approvedByUserName: null,
    rejectionNote: null,
    ...extra,
  });

  return [
    base('Call', 1, 'Completed'),
    base('Submission', 2, 'Completed'),
    base('Result', 3, 'Completed'),
    {
      ...base('Contract', 4, contractStatus),
      id: STEP_CONTRACT_ID,
      skippedReason,
    },
    base('BudgetPlan', 5, 'Pending'),
    base('VendorContracts', 6, 'Pending'),
    base('Invoices', 7, 'Pending'),
    base('Proof', 8, 'Pending'),
    base('Settlement', 9, 'Pending'),
  ];
}

// ─── Mock ApplicationDetail objektumok ───────────────────────────────────────

const APP_WON_CONTRACT_ACTIVE = {
  id: APP_ID,
  title: 'Szerződés Teszt Pályázat',
  identifier: null,
  description: null,
  status: 'Won',
  granterId: GRANTER_ID,
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2026-05-10T23:59:59Z',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: 2000000,
  resultDate: '2026-06-01',
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Teszt Munkatárs',
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  workflowSteps: makeSteps('Active'),
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

const APP_WON_CONTRACT_SKIPPED = {
  ...APP_WON_CONTRACT_ACTIVE,
  workflowSteps: makeSteps('Skipped', 'Nem volt szükség szerződésre'),
};

const APP_WON_CONTRACT_COMPLETED = {
  ...APP_WON_CONTRACT_ACTIVE,
  workflowSteps: makeSteps('Completed'),
  granterContractIdentifier: 'SZERZ-2026-001',
  granterContractDate: '2026-06-05',
  granterNotificationReceived: true,
  granterNotificationDate: '2026-06-03',
};

// WorkflowStepDetail válasz sikeres mentés után
const CONTRACT_STEP_DETAIL_ACTIVE: object = {
  id: STEP_CONTRACT_ID,
  stepType: 'Contract',
  status: 'Active',
  order: 4,
  isSkippable: true,
  completedAt: null,
  completedByUserId: null,
  approvedAt: null,
  approvedByUserId: null,
  rejectionNote: null,
  skippedReason: null,
  submittedAt: null,
  submissionMethodId: null,
  submissionMethodName: null,
  externalIdentifier: null,
  notes: null,
  contractIdentifier: 'SZERZ-2026-001',
  contractDate: '2026-06-05',
  notificationReceived: false,
  notificationDate: null,
};

const CONTRACT_STEP_DETAIL_COMPLETED: object = {
  ...CONTRACT_STEP_DETAIL_ACTIVE,
  status: 'Completed',
  completedAt: '2026-06-05T10:00:00Z',
};

const CONTRACT_STEP_DETAIL_SKIPPED: object = {
  ...CONTRACT_STEP_DETAIL_ACTIVE,
  status: 'Skipped',
  skippedReason: 'Nem volt szükség szerződésre',
};

const CONTRACT_STEP_DETAIL_RESTORED: object = {
  ...CONTRACT_STEP_DETAIL_ACTIVE,
  status: 'Active',
  skippedReason: null,
};

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/documents**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/comments**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/emails**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok([])));
}

/** Kibontja a [4] Szerz./Pályáztató panelt, ha zárt */
async function expandContractPanel(page: import('@playwright/test').Page): Promise<void> {
  const header = page
    .locator('mat-expansion-panel-header')
    .filter({ hasText: /\[4\] Szerz\./i });
  await header.waitFor({ state: 'visible', timeout: 10_000 });
  const panel = page
    .locator('mat-expansion-panel')
    .filter({ has: page.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });
  const expanded = await panel.evaluate((el) => el.classList.contains('mat-expanded'));
  if (!expanded) await header.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-050 | Értesítő/szerződési adatok rögzítése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-050 | Értesítő/szerződési adatok rögzítése', () => {
  test('A [4] Szerz. panel Active állapotban auto-kibontva és a form látható', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(
      munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }),
    ).toBeVisible({ timeout: 10_000 });

    // Active → auto-kibontva → a form visible
    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });
    await expect(
      contractPanel.locator('form.contract-form'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('A Mentés gomb aktív (minden mező opcionális)', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });

    await expect(
      contractPanel.getByRole('button', { name: /mentés/i }),
    ).toBeEnabled({ timeout: 5_000 });
  });

  test('Mentés után "Adatok elmentve." snackbar jelenik meg', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/contract-granter`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(CONTRACT_STEP_DETAIL_ACTIVE));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });

    // Kitöltjük az azonosítót (opcionális mező, force nem kell – sima text input)
    const identifierInput = contractPanel.getByLabel(/szerződés azonosítója/i);
    await identifierInput.click({ force: true });
    await identifierInput.fill('SZERZ-2026-001');

    await contractPanel.getByRole('button', { name: /mentés/i }).click();

    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Adatok elmentve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Értesítő érkezett" jelölőnégyzet bejelölése esetén az értesítő dátum mező megjelenik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });

    // Értesítő érkezett checkbox bejelölése
    await contractPanel.getByText('Értesítő érkezett').click();

    // Az értesítő dátuma mező megjelenik
    await expect(
      contractPanel.locator('mat-form-field').filter({ hasText: /értesítő dátuma/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('"Értesítő érkezett" bejelölve + üres dátum → form invalid, Mentés disabled', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });

    await contractPanel.getByText('Értesítő érkezett').click();

    // A dátum mező üres → notificationDate required → form invalid
    await expect(
      contractPanel.getByRole('button', { name: /mentés/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('"Lépés lezárása" jelölőnégyzet bejelölésével a snackbar lezárás üzenetet mutat', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/contract-granter`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(CONTRACT_STEP_DETAIL_COMPLETED));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });

    // "Lépés lezárása (Completed)" checkbox bejelölése
    await contractPanel.getByText('Lépés lezárása (Completed)').click();
    await contractPanel.getByRole('button', { name: /mentés/i }).click();

    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Szerz./Értesítő lépés lezárva.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Completed lépésnél a form nem szerkeszthető, összefoglaló nézet látható', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_COMPLETED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    // Completed panel zárt → ki kell nyitni
    await expandContractPanel(munkatarsPage);

    // Az összefoglaló nézet (contract-summary) látható, nem a form
    const contractPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[4\] Szerz\./i }) });

    await expect(contractPanel.locator('.contract-summary')).toBeVisible({ timeout: 5_000 });
    await expect(contractPanel.locator('form.contract-form')).toHaveCount(0);

    // A rögzített szerződés azonosítója megjelenik
    await expect(contractPanel.getByText('SZERZ-2026-001')).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-051 | Lépés kihagyása indokkal
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-051 | Lépés kihagyása indokkal', () => {
  test('Active lépésnél a "Lépés kihagyása" gomb látható Munkatársnak', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(
      munkatarsPage.getByRole('button', { name: /lépés kihagyása/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('"Lépés kihagyása" gombra kattintva a skip dialog megjelenik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /lépés kihagyása/i }).click();

    // Dialog megjelenik
    await expect(
      munkatarsPage.locator('mat-dialog-container').filter({ hasText: /lépés kihagyása/i }),
    ).toBeVisible({ timeout: 8_000 });

    // Opcionális indok textarea
    await expect(
      munkatarsPage.locator('mat-dialog-container').locator('textarea'),
    ).toBeVisible();
  });

  test('Indok megadásával és megerősítéssel snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/Contract/skip`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(CONTRACT_STEP_DETAIL_SKIPPED));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /lépés kihagyása/i }).click();

    // Indok megadása
    await munkatarsPage
      .locator('mat-dialog-container')
      .locator('textarea')
      .fill('Nem volt szükség szerződésre');

    // Kihagyás megerősítése
    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /kihagyás megerősítése/i })
      .click();

    // Snackbar
    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Lépés kihagyva.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Indok megadása nélkül is lehet kihagyni (opcionális)', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/Contract/skip`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok({ ...CONTRACT_STEP_DETAIL_SKIPPED, skippedReason: null }));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /lépés kihagyása/i }).click();

    // Indok üresen marad → megerősítés gomb aktív
    const confirmBtn = munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /kihagyás megerősítése/i });
    await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });

    await confirmBtn.click();

    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Lépés kihagyva.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Dialog "Mégsem" gombra kattintva az API nem hívódik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_ACTIVE);

    let apiCalled = false;
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/Contract/skip`,
      async (route) => {
        apiCalled = true;
        await route.continue();
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /lépés kihagyása/i }).click();
    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /mégsem/i })
      .click();

    await expect(munkatarsPage.locator('mat-dialog-container')).toHaveCount(0);
    expect(apiCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-052 | Kihagyott lépés visszaállítása
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-052 | Kihagyott lépés visszaállítása', () => {
  test('Skipped lépésnél a kihagyás indoka megjelenik', async ({ adminPage }) => {
    await mockDetailPage(adminPage, APP_WON_CONTRACT_SKIPPED);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    // Skipped panel zárt → ki kell nyitni
    await expandContractPanel(adminPage);

    await expect(
      adminPage.getByText(/nem volt szükség szerződésre/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Admin-nak a "Visszaállítás" gomb látható Skipped lépésnél', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON_CONTRACT_SKIPPED);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandContractPanel(adminPage);

    await expect(
      adminPage.getByRole('button', { name: /visszaállítás/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Elnöknek is látható a "Visszaállítás" gomb', async ({ elnokPage }) => {
    await mockDetailPage(elnokPage, APP_WON_CONTRACT_SKIPPED);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await expandContractPanel(elnokPage);

    await expect(
      elnokPage.getByRole('button', { name: /visszaállítás/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Munkatársnál a "Visszaállítás" gomb NEM látható', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_SKIPPED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expandContractPanel(munkatarsPage);

    // *hasRole="['Admin', 'Elnok']" → Munkatársnál a gomb el van rejtve
    await expect(
      munkatarsPage.getByRole('button', { name: /visszaállítás/i }),
    ).toHaveCount(0);
  });

  test('Visszaállítás gombra kattintva "Lépés visszaállítva." snackbar jelenik meg', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON_CONTRACT_SKIPPED);

    await adminPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/Contract/restore`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(CONTRACT_STEP_DETAIL_RESTORED));
        } else {
          await route.continue();
        }
      },
    );

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandContractPanel(adminPage);
    await adminPage.getByRole('button', { name: /visszaállítás/i }).click();

    await expect(
      adminPage.locator('mat-snack-bar-container').filter({ hasText: 'Lépés visszaállítva.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Skipped lépésnél a "Lépés kihagyása" gomb nem jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON_CONTRACT_SKIPPED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expandContractPanel(munkatarsPage);

    // stepStatus === 'Skipped' → a skip gomb template blokkja nem renderel
    await expect(
      munkatarsPage.getByRole('button', { name: /lépés kihagyása/i }),
    ).toHaveCount(0);
  });
});
