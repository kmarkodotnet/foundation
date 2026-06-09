/**
 * 5. kategória – Pályázati eredmény
 * Forgatókönyvek: TS-040, TS-041, TS-042, TS-043
 *
 * Stratégia:
 *  - TS-040/041/042: Munkatárs, Result lépés Active (app status: Submitted)
 *  - TS-043: Admin, Result lépés Completed + correctionMode (app status: Won)
 *  - "Nyert" → mat-radio-button kattintás, awardedAmount + resultDate kötelező
 *  - "Nem nyert" → confirm dialog után mentés
 *  - Eredmény korrekciója → csak Admin + Won/Lost állapotnál elérhető
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'dddddddd-0000-0000-0000-000000000005';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

// ─── Mock lépések ────────────────────────────────────────────────────────────

function makeSteps(resultStatus: string = 'Active', submissionStatus: string = 'Completed') {
  return [
    {
      id: 'step-r-0000-0000-0000-000000000001',
      stepType: 'Call',
      status: 'Completed',
      order: 1,
      isSkippable: false,
      skippedReason: null,
      completedAt: '2026-04-01T12:00:00Z',
      completedByUserName: 'Teszt Munkatárs',
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-r-0000-0000-0000-000000000002',
      stepType: 'Submission',
      status: submissionStatus,
      order: 2,
      isSkippable: false,
      skippedReason: null,
      completedAt: submissionStatus === 'Completed' ? '2026-05-10T23:59:59Z' : null,
      completedByUserName: submissionStatus === 'Completed' ? 'Teszt Munkatárs' : null,
      approvedAt: submissionStatus === 'Completed' ? '2026-05-11T10:00:00Z' : null,
      approvedByUserName: submissionStatus === 'Completed' ? 'Teszt Elnök' : null,
      rejectionNote: null,
    },
    {
      id: 'step-r-0000-0000-0000-000000000003',
      stepType: 'Result',
      status: resultStatus,
      order: 3,
      isSkippable: false,
      skippedReason: null,
      completedAt: resultStatus === 'Completed' ? '2026-06-01T10:00:00Z' : null,
      completedByUserName: resultStatus === 'Completed' ? 'Teszt Munkatárs' : null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    ...['Contract', 'BudgetPlan', 'VendorContracts', 'Invoices', 'Proof', 'Settlement'].map(
      (type, i) => ({
        id: `step-r-0000-0000-0000-00000000000${i + 4}`,
        stepType: type,
        status: resultStatus === 'Completed' ? 'Active' : 'Pending',
        order: i + 4,
        isSkippable: type !== 'Settlement',
        skippedReason: null,
        completedAt: null,
        completedByUserName: null,
        approvedAt: null,
        approvedByUserName: null,
        rejectionNote: null,
      }),
    ),
  ];
}

// ─── Mock ApplicationDetail objektumok ───────────────────────────────────────

const APP_SUBMITTED = {
  id: APP_ID,
  title: 'Eredmény Teszt Pályázat',
  identifier: null,
  description: null,
  status: 'Submitted',
  granterId: GRANTER_ID,
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2026-05-10T23:59:59Z',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: null,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Teszt Munkatárs',
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-05-11T10:00:00Z',
  workflowSteps: makeSteps('Active'),
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

const APP_WON = {
  ...APP_SUBMITTED,
  status: 'Won',
  awardedAmount: 2000000,
  resultDate: '2026-06-01',
  resultIdentifier: 'EREDM-2026-001',
  workflowSteps: makeSteps('Completed'),
};

const APP_LOST = {
  ...APP_SUBMITTED,
  status: 'Lost',
  awardedAmount: null,
  resultDate: '2026-06-01',
  workflowSteps: makeSteps('Completed'),
};

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

function ok(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
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

/** Kibontja a [3] Eredmény panelt, ha zárt */
async function expandResultPanel(page: import('@playwright/test').Page): Promise<void> {
  const header = page
    .locator('mat-expansion-panel-header')
    .filter({ hasText: /\[3\] Eredmény/i });
  await header.waitFor({ state: 'visible', timeout: 10_000 });
  const panel = page
    .locator('mat-expansion-panel')
    .filter({ has: page.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });
  const expanded = await panel.evaluate((el) =>
    el.classList.contains('mat-expanded'),
  );
  if (!expanded) await header.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-040 | Nyert eredmény rögzítése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-040 | Nyert eredmény rögzítése', () => {
  test('A [3. Eredmény] panel automatikusan kibontva Active állapotban', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(
      munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Active állapotban auto-kibontva → a form content látható
    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });
    await expect(resultPanel.locator('mat-radio-group')).toBeVisible({ timeout: 5_000 });
  });

  test('"Nyert" választásakor megjelenik az Elnyert összeg és dátum mező', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    // Kattintsunk a "Nyert" radio gombra
    await resultPanel.locator('mat-radio-button').filter({ hasText: /^Nyert$/ }).click();

    // Az Elnyert összeg mező megjelenik
    await expect(
      resultPanel.getByLabel(/elnyert összeg/i),
    ).toBeVisible({ timeout: 5_000 });

    // Az Eredmény dátuma mező megjelenik
    await expect(
      resultPanel.locator('mat-form-field').filter({ hasText: /eredmény dátuma/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('"Nyert" választáskor a Rögzítés gomb le van tiltva, ha az összeg üres', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /^Nyert$/ }).click();

    // awardedAmount üres → form invalid → gomb disabled
    await expect(
      resultPanel.getByRole('button', { name: /rögzítés/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('Sikeres nyert rögzítés után WON snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);

    // PUT result → visszaad WON alkalmazást
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/result`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(APP_WON));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    // Nyert választása
    await resultPanel.locator('mat-radio-button').filter({ hasText: /^Nyert$/ }).click();

    // Elnyert összeg kitöltése
    await resultPanel.getByLabel(/elnyert összeg/i).fill('2000000');

    // Eredmény dátuma kitöltése (force: true: mat-label overlay)
    const datePicker = resultPanel
      .locator('mat-form-field')
      .filter({ hasText: /eredmény dátuma/i })
      .locator('input');
    await datePicker.click({ force: true });
    await datePicker.fill('6/1/2026');
    await munkatarsPage.keyboard.press('Escape');
    await datePicker.blur();

    // Rögzítés gomb
    await resultPanel.getByRole('button', { name: /rögzítés/i }).click();

    // Snackbar WON üzenettel
    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: /WON/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-041 | Nyert eredmény – elnyert összeg nélkül nem menthető
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-041 | Nyert eredmény – kötelező összeg validáció', () => {
  test('Nyert + üres összeg → form invalid, Rögzítés disabled', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    // Nyert választása
    await resultPanel.locator('mat-radio-button').filter({ hasText: /^Nyert$/ }).click();

    // Az összeg mezőt üresen hagyjuk → form invalid
    const saveBtn = resultPanel.getByRole('button', { name: /rögzítés/i });
    await expect(saveBtn).toBeDisabled({ timeout: 5_000 });
  });

  test('Nyert + üres összeg → validációs hibaüzenet jelenik meg a blur után', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /^Nyert$/ }).click();

    // Érintjük az összeg mezőt és üresen hagyjuk (force: true: mat-label overlay)
    const amountInput = resultPanel.getByLabel(/elnyert összeg/i);
    await amountInput.click({ force: true });
    await amountInput.fill('');
    await amountInput.blur();

    await expect(
      resultPanel.getByText('Az elnyert összeg megadása kötelező.'),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-042 | Nem nyert eredmény rögzítése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-042 | Nem nyert eredmény rögzítése', () => {
  test('"Nem nyert" választáskor az Elnyert összeg mező nem jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();

    // Az elnyert összeg mező NEM jelenik meg
    await expect(
      resultPanel.getByLabel(/elnyert összeg/i),
    ).toHaveCount(0);
  });

  test('"Nem nyert" választáskor a Rögzítés gomb aktív (form valid)', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();

    await expect(
      resultPanel.getByRole('button', { name: /rögzítés/i }),
    ).toBeEnabled({ timeout: 5_000 });
  });

  test('"Nem nyert" rögzítésekor megerősítő dialog jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();
    await resultPanel.getByRole('button', { name: /rögzítés/i }).click();

    // Confirm dialog megjelenik
    await expect(
      munkatarsPage.locator('mat-dialog-container').filter({ hasText: /nem nyert eredmény/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Megerősítés után LOST snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);

    // PUT result → LOST alkalmazás
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/result`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(APP_LOST));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();
    await resultPanel.getByRole('button', { name: /rögzítés/i }).click();

    // Confirm dialog – kattintás a Rögzítés gombra a dialog belsejében
    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /rögzítés/i })
      .click();

    // LOST snackbar
    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: /LOST/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Dialog mégse gombra kattintva nem kerül elmentésre az eredmény', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_SUBMITTED);

    let apiCalled = false;
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/result`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          apiCalled = true;
          await route.fulfill(ok(APP_LOST));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const resultPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[3\] Eredmény/i }) });

    await resultPanel.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();
    await resultPanel.getByRole('button', { name: /rögzítés/i }).click();

    // Dialog megjelent → Mégsem / Cancel
    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /mégsem/i })
      .click();

    // A dialog bezárul, az API nem lett meghívva
    await expect(munkatarsPage.locator('mat-dialog-container')).toHaveCount(0);
    expect(apiCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-043 | Eredmény korrekciója Admin által
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-043 | Eredmény korrekciója Admin által', () => {
  test('WON pályázatnál Admin-nak megjelenik az "Eredmény korrekciója" gomb', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    // A Result lépés Completed → zárt panel, ki kell nyitni
    await expandResultPanel(adminPage);

    await expect(
      adminPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Munkatársnál nem jelenik meg az "Eredmény korrekciója" gomb', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expandResultPanel(munkatarsPage);

    // canCorrect = isAdmin() && status Won/Lost → Munkatársnál false
    await expect(
      munkatarsPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toHaveCount(0);
  });

  test('"Eredmény korrekciója" gombra kattintva a form megjelenik, előtöltve', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandResultPanel(adminPage);
    await adminPage.getByRole('button', { name: /eredmény korrekciója/i }).click();

    // A form megjelenik
    await expect(adminPage.locator('mat-radio-group')).toBeVisible({ timeout: 5_000 });

    // A "Módosítás mentése" gomb látható (correctionMode=true)
    await expect(
      adminPage.getByRole('button', { name: /módosítás mentése/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('WON → Nem nyert korrekciókor figyelmeztető dialog jelenik meg', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandResultPanel(adminPage);
    await adminPage.getByRole('button', { name: /eredmény korrekciója/i }).click();

    // Váltás Nem nyert-re
    await adminPage.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();
    await adminPage.getByRole('button', { name: /módosítás mentése/i }).click();

    // Figyelmeztető dialog a [4]–[9] lépésekről
    await expect(
      adminPage.locator('mat-dialog-container').filter({ hasText: /eredmény korrekciója/i }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      adminPage.locator('mat-dialog-container').filter({ hasText: /\[4\]–\[9\]/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Korrekció megerősítése után snackbar jelenik meg', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON);

    // PUT result/correct endpoint
    await adminPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/result/correct`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(APP_LOST));
        } else {
          await route.continue();
        }
      },
    );

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandResultPanel(adminPage);
    await adminPage.getByRole('button', { name: /eredmény korrekciója/i }).click();

    await adminPage.locator('mat-radio-button').filter({ hasText: /nem nyert/i }).click();
    await adminPage.getByRole('button', { name: /módosítás mentése/i }).click();

    // Dialog megerősítés
    await adminPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /módosítás/i })
      .click();

    // Snackbar
    await expect(
      adminPage.locator('mat-snack-bar-container').filter({ hasText: /eredmény sikeresen javítva/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Mégsem" gombra kattintva a korrekciós form bezárul', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandResultPanel(adminPage);
    await adminPage.getByRole('button', { name: /eredmény korrekciója/i }).click();

    // Form látható
    await expect(adminPage.locator('mat-radio-group')).toBeVisible({ timeout: 5_000 });

    // Mégsem
    await adminPage.getByRole('button', { name: /mégsem/i }).click();

    // A form eltűnik (correctionMode = false → result-summary jelenik meg)
    await expect(adminPage.locator('mat-radio-group')).toHaveCount(0);
    await expect(
      adminPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('LOST pályázatnál Admin-nak is megjelenik az "Eredmény korrekciója" gomb', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_LOST);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expandResultPanel(adminPage);

    await expect(
      adminPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-043/B | Eredmény korrekciója – Elnök (U jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-043/B | Eredmény korrekciója – Elnök (U jog)', () => {
  test('WON pályázatnál Elnöknek megjelenik az "Eredmény korrekciója" gomb', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await expandResultPanel(elnokPage);

    await expect(
      elnokPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-044 | Eredmény korrekciója – Pénzügyes és Megtekintő (R jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-044 | Eredmény korrekciója – Pénzügyes és Megtekintő (R jog)', () => {
  test('Pénzügyesnél nem jelenik meg az "Eredmény korrekciója" gomb', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    await expandResultPanel(penzugyesPage);

    // canCorrect = isAdmin() && status Won/Lost → Pénzügyesnél false
    await expect(
      penzugyesPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toHaveCount(0);
  });

  test('Megtekintőnél nem jelenik meg az "Eredmény korrekciója" gomb', async ({
    megtekintosPage,
  }) => {
    await mockDetailPage(megtekintosPage, APP_WON);
    await megtekintosPage.goto(`/applications/${APP_ID}`);
    await megtekintosPage.waitForLoadState('networkidle');

    await expandResultPanel(megtekintosPage);

    // canCorrect = isAdmin() && status Won/Lost → Megtekintőnél false
    await expect(
      megtekintosPage.getByRole('button', { name: /eredmény korrekciója/i }),
    ).toHaveCount(0);
  });
});
