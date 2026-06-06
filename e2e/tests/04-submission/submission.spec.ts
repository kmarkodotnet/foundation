/**
 * 4. kategória – Pályázati anyag és beadás
 * Forgatókönyvek: TS-030, TS-031
 *
 * Stratégia:
 *  - Minden fixture-alapú (munkatarsPage / elnokPage / adminPage)
 *  - Backend API hívások mockolt route-okkal kezelve
 *  - Az alkalmazás detail oldala az /applications/:id útvonalon érhető el
 *  - A Submission lépés expansion panelben jelenik meg, Active állapotban auto-kibontva
 *  - Approval panel csak Elnök/Admin szerepkörnél jelenik meg (*hasRole direktíva)
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'cccccccc-0000-0000-0000-000000000004';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_CALL_ID = 'step-0000-0000-0000-000000000001';
const STEP_SUBMISSION_ID = 'step-0000-0000-0000-000000000002';

// ─── Mock adatok ─────────────────────────────────────────────────────────────

function makeWorkflowSteps(submissionStatus: string = 'Active') {
  return [
    {
      id: STEP_CALL_ID,
      stepType: 'Call',
      status: 'Completed',
      order: 1,
      isSkippable: false,
      skippedReason: null,
      completedAt: '2026-05-01T12:00:00Z',
      completedByUserName: 'Teszt Munkatárs',
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: STEP_SUBMISSION_ID,
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
      id: 'step-0000-0000-0000-000000000003',
      stepType: 'Result',
      status: 'Pending',
      order: 3,
      isSkippable: false,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-0000-0000-0000-000000000004',
      stepType: 'Contract',
      status: 'Pending',
      order: 4,
      isSkippable: true,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-0000-0000-0000-000000000005',
      stepType: 'BudgetPlan',
      status: 'Pending',
      order: 5,
      isSkippable: true,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-0000-0000-0000-000000000006',
      stepType: 'VendorContracts',
      status: 'Pending',
      order: 6,
      isSkippable: true,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-0000-0000-0000-000000000007',
      stepType: 'Invoices',
      status: 'Pending',
      order: 7,
      isSkippable: true,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-0000-0000-0000-000000000008',
      stepType: 'Proof',
      status: 'Pending',
      order: 8,
      isSkippable: true,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-0000-0000-0000-000000000009',
      stepType: 'Settlement',
      status: 'Pending',
      order: 9,
      isSkippable: false,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
  ];
}

const TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION = {
  id: APP_ID,
  title: 'Beadás Teszt Pályázat',
  identifier: null,
  description: null,
  status: 'Draft',
  granterId: GRANTER_ID,
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2027-01-01T23:59:59Z',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: null,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Teszt Munkatárs',
  createdAt: '2026-06-04T10:00:00Z',
  updatedAt: '2026-06-04T10:00:00Z',
  workflowSteps: makeWorkflowSteps('Active'),
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

const TEST_APP_SUBMITTED = {
  ...TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION,
  status: 'Submitted',
  workflowSteps: makeWorkflowSteps('Completed'),
};

// WorkflowStepDetail a mentés után visszakapott válaszban
const SUBMISSION_STEP_DETAIL_ACTIVE = {
  id: STEP_SUBMISSION_ID,
  stepType: 'Submission',
  status: 'Active',
  order: 2,
  isSkippable: false,
  completedAt: null,
  completedByUserId: null,
  approvedAt: null,
  approvedByUserId: null,
  rejectionNote: null,
  skippedReason: null,
  submittedAt: '2026-05-10T23:59:59.000Z',
  submissionMethodId: null,
  submissionMethodName: null,
  externalIdentifier: null,
  notes: null,
  contractIdentifier: null,
  contractDate: null,
  notificationReceived: null,
  notificationDate: null,
};

const SUBMISSION_STEP_DETAIL_COMPLETED = {
  ...SUBMISSION_STEP_DETAIL_ACTIVE,
  status: 'Completed',
  completedAt: '2026-05-11T10:00:00Z',
};

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

function ok(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

const EMPTY_LIST = { items: [], totalCount: 0, page: 1, pageSize: 20 };

/**
 * Regisztrál minden szükséges mock route-ot a detail oldalhoz:
 * - GET /api/v1/applications/:id → ApplicationDetail
 * - GET /api/v1/documents?* → üres lista
 * - GET /api/v1/applications/:id/comments* → üres lista
 * - GET /api/v1/applications/:id/emails* → üres lista
 * - GET /api/v1/codelists/** → üres lista (submission methods)
 */
async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill(ok(appData));
    }
    return route.continue();
  });

  // Documents endpoint (DocumentListComponent, DocumentUploadComponent)
  await page.route(`**/api/v1/applications/${APP_ID}/documents**`, (route) =>
    route.fulfill(ok([])),
  );

  // Comments endpoint (CommentSectionComponent)
  await page.route(`**/api/v1/applications/${APP_ID}/comments**`, (route) =>
    route.fulfill(ok([])),
  );

  // Emails endpoint (EmailRecordComponent)
  await page.route(`**/api/v1/applications/${APP_ID}/emails**`, (route) =>
    route.fulfill(ok([])),
  );

  // Codelists (submission method lookup)
  await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok([])));
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-030 | Beadás adatainak rögzítése – lépés lezárása
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-030 | Beadás adatainak rögzítése', () => {
  test('A [2. Beadás] panel automatikusan kibontva Active állapotban', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    // Az expansion panel header szövege megjelenik
    await expect(
      munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[2\] Beadás/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('A Mentés gomb le van tiltva, ha a Beadás időpontja üres (kötelező mező)', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    // Kibontjuk a Beadás panelt ha nincs nyitva
    const submissionPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[2\] Beadás/i }) });
    const isExpanded = await submissionPanel.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await submissionPanel.locator('mat-expansion-panel-header').click();
    }

    // A form submittedAt vezérlő kötelező → Mentés gomb disabled, ha üres
    const saveBtn = submissionPanel.getByRole('button', { name: /mentés/i });
    await expect(saveBtn).toBeDisabled({ timeout: 5_000 });
  });

  test('Beadás időpontjának kitöltése után a Mentés gomb aktívvá válik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    // A Beadás panelben levő datepicker input megkeresése
    const submissionPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[2\] Beadás/i }) });

    // A mat-label az mdc-notched-outline-ban pointer-events interceptet okoz → force: true szükséges
    const dateInput = submissionPanel.locator('input[matInput]').first();
    await dateInput.click({ force: true });
    await dateInput.fill('5/10/2026');
    await munkatarsPage.keyboard.press('Escape');
    await dateInput.blur();

    const saveBtn = submissionPanel.getByRole('button', { name: /mentés/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('Mentés után snackbar jelenik meg és a "Jóváhagyásra küldés" gomb is megjelenik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    // PUT submission → visszaad egy Active WorkflowStepDetail-t (nincs completedAt)
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/submission`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(SUBMISSION_STEP_DETAIL_ACTIVE));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const submissionPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[2\] Beadás/i }) });

    // Kitöltjük a dátumot (force: true: mat-label overlay interceptálja az eseményt)
    const dateInput = submissionPanel.locator('input[matInput]').first();
    await dateInput.click({ force: true });
    await dateInput.fill('5/10/2026');
    await munkatarsPage.keyboard.press('Escape');
    await dateInput.blur();

    // Mentés
    await submissionPanel.getByRole('button', { name: /mentés/i }).click();

    // Snackbar üzenet megjelenik
    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Beadás adatai elmentve' }),
    ).toBeVisible({ timeout: 8_000 });

    // Mentés után megjelenik a "Jóváhagyásra küldés" gomb (savedDetail != null)
    await expect(
      submissionPanel.getByRole('button', { name: /jóváhagyásra küldés/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Jóváhagyásra küldés gombra kattintva értesítés jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    // PUT submission
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/submission`,
      async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill(ok(SUBMISSION_STEP_DETAIL_ACTIVE));
        } else {
          await route.continue();
        }
      },
    );

    // POST request-approval
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/submission/request-approval`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ status: 204, body: '' });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const submissionPanel = munkatarsPage
      .locator('mat-expansion-panel')
      .filter({ has: munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[2\] Beadás/i }) });

    // Dátum kitöltése és mentés (force: true: mat-label overlay interceptálja az eseményt)
    const dateInput = submissionPanel.locator('input[matInput]').first();
    await dateInput.click({ force: true });
    await dateInput.fill('5/10/2026');
    await munkatarsPage.keyboard.press('Escape');
    await dateInput.blur();
    await submissionPanel.getByRole('button', { name: /mentés/i }).click();

    // Várunk a mentés snackbarra
    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Beadás adatai elmentve' }),
    ).toBeVisible({ timeout: 8_000 });

    // Jóváhagyásra küldés
    await submissionPanel.getByRole('button', { name: /jóváhagyásra küldés/i }).click();

    // Sikeres küldés snackbar
    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Jóváhagyási kérés elküldve' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Beadás formja nem látható ha a lépés Completed állapotban van', async ({
    munkatarsPage,
  }) => {
    // Completed állapotú Submission lépéssel
    await mockDetailPage(munkatarsPage, TEST_APP_SUBMITTED);

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    // A Completed panel ZÁRT ([expanded]="step.status === 'Active'" → false) → ki kell nyitni
    const submissionHeader = munkatarsPage
      .locator('mat-expansion-panel-header')
      .filter({ hasText: /\[2\] Beadás/i });
    await submissionHeader.click();

    // A Completed lépésnél megjelenik a "jóváhagyva" üzenet
    await expect(
      munkatarsPage.getByText('A beadás jóváhagyva.'),
    ).toBeVisible({ timeout: 10_000 });

    // A szerkesztési form nem látható (isEditable() = false, mert status !== 'Active')
    const saveBtn = munkatarsPage.getByRole('button', { name: /mentés/i });
    await expect(saveBtn).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-031 | Beadás jóváhagyása elnök által
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-031 | Beadás jóváhagyása elnök által', () => {
  test('Elnöknél megjelenik a "Jóváhagyás" gomb Active Submission lépésnél', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    // Az approval panel csak Elnök/Admin szerepkörnél látható
    await expect(
      elnokPage.getByRole('button', { name: /jóváhagyás/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Adminnél is megjelenik a "Jóváhagyás" gomb Active Submission lépésnél', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expect(
      adminPage.getByRole('button', { name: /jóváhagyás/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Munkatársnál nem jelenik meg az approval panel', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    // A *hasRole="['Admin', 'Elnok']" direktíva elrejti a panelt Munkatárs elől
    await expect(
      munkatarsPage.locator('.gm-approval-panel'),
    ).toHaveCount(0);
  });

  test('Jóváhagyás gombra kattintva API hívás történik és snackbar jelenik meg', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    // POST approve endpoint mock
    await elnokPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/submission/approve`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(SUBMISSION_STEP_DETAIL_COMPLETED));
        } else {
          await route.continue();
        }
      },
    );

    // Az oldal újratöltésekor az alkalmazás frissül (a detail oldal reload-olja magát stepChanged után)
    // Biztosítjuk, hogy a reload a Submitted app-ot adja vissza
    let callCount = 0;
    await elnokPage.route(`**/api/v1/applications/${APP_ID}`, (route) => {
      if (route.request().method() === 'GET') {
        callCount++;
        const data = callCount === 1
          ? TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION
          : TEST_APP_SUBMITTED;
        return route.fulfill(ok(data));
      }
      return route.continue();
    });

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    // Kattints a Jóváhagyás gombra
    await elnokPage.getByRole('button', { name: /^jóváhagyás$/i }).click();

    // Snackbar megjelenik
    await expect(
      elnokPage.locator('mat-snack-bar-container').filter({ hasText: 'Beadás jóváhagyva' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Visszautasítás gombra kattintva megjelenik az indok beviteli mező', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await elnokPage.getByRole('button', { name: /visszautasítás$/i }).click();

    // Megjelenik a visszautasítás oka mező
    await expect(
      elnokPage.getByLabel(/visszautasítás oka/i),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Visszautasítás megerősítése előtt az indok megadása kötelező', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await elnokPage.getByRole('button', { name: /visszautasítás$/i }).click();
    await elnokPage.getByLabel(/visszautasítás oka/i).fill('');

    // A megerősítés gomb le van tiltva ha az indok mező üres
    const confirmBtn = elnokPage.getByRole('button', { name: /visszautasítás megerősítése/i });
    await expect(confirmBtn).toBeDisabled({ timeout: 5_000 });
  });

  test('Sikeres visszautasítás után snackbar jelenik meg', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, TEST_APP_DRAFT_WITH_ACTIVE_SUBMISSION);

    // POST approve endpoint – visszautasítás esetén (isApproved: false)
    await elnokPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/submission/approve`,
      async (route) => {
        if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() ?? '{}');
          const responseStep = {
            ...SUBMISSION_STEP_DETAIL_ACTIVE,
            rejectionNote: body.rejectionNote ?? 'Hiányzó dokumentumok',
          };
          await route.fulfill(ok(responseStep));
        } else {
          await route.continue();
        }
      },
    );

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    // Visszautasítás folyamata
    await elnokPage.getByRole('button', { name: /visszautasítás$/i }).click();
    await elnokPage.getByLabel(/visszautasítás oka/i).fill('Hiányzó dokumentumok');
    await elnokPage.getByRole('button', { name: /visszautasítás megerősítése/i }).click();

    // Snackbar megjelenik
    await expect(
      elnokPage.locator('mat-snack-bar-container').filter({ hasText: 'Beadás visszautasítva' }),
    ).toBeVisible({ timeout: 8_000 });
  });
});
