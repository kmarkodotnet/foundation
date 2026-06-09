/**
 * 7. kategória – Költési terv
 * Forgatókönyvek: TS-060, TS-061, TS-062, TS-063, TS-064
 *
 * Stratégia:
 *  - TS-060/061/062/063: Munkatárs, BudgetPlan lépés Active (app status: Won)
 *  - TS-064: Munkatárs (jóváhagyásra küldés) + Elnök (jóváhagyás)
 *  - Tételek helyi állapotban kezeltek, mentés PUT /budget-plan-nal
 *  - Az inline item form: name (required), type (mat-select), plannedAmount (required)
 *  - BudgetPlan panel label: "[5] Költési terv"
 *  - GET /budget-plan → BudgetPlan, PUT /budget-plan → updated BudgetPlan
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'ffffffff-0000-0000-0000-000000000007';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_BUDGET_ID = 'step-b-000-0000-0000-000000000005';

// ─── Workflow lépések ─────────────────────────────────────────────────────────

function makeSteps(budgetStatus: string = 'Active') {
  const completed = (type: string, order: number) => ({
    id: `step-b-000-0000-0000-00000000000${order}`,
    stepType: type,
    status: 'Completed',
    order,
    isSkippable: order >= 4,
    skippedReason: null,
    completedAt: `2026-0${order}-01T10:00:00Z`,
    completedByUserName: 'Teszt Munkatárs',
    approvedAt: null,
    approvedByUserName: null,
    rejectionNote: null,
  });

  return [
    completed('Call', 1),
    completed('Submission', 2),
    completed('Result', 3),
    completed('Contract', 4),
    {
      id: STEP_BUDGET_ID,
      stepType: 'BudgetPlan',
      status: budgetStatus,
      order: 5,
      isSkippable: true,
      skippedReason: null,
      completedAt: budgetStatus === 'Completed' ? '2026-06-05T10:00:00Z' : null,
      completedByUserName: budgetStatus === 'Completed' ? 'Teszt Munkatárs' : null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    ...['VendorContracts', 'Invoices', 'Proof', 'Settlement'].map((type, i) => ({
      id: `step-b-000-0000-0000-00000000000${i + 6}`,
      stepType: type,
      status: 'Pending',
      order: i + 6,
      isSkippable: type !== 'Settlement',
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    })),
  ];
}

// ─── Mock ApplicationDetail ───────────────────────────────────────────────────

const APP_WON = {
  id: APP_ID,
  title: 'Költési Terv Teszt Pályázat',
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
  awardedAmount: 1_000_000,
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

// ─── Mock BudgetPlan objektumok ───────────────────────────────────────────────

const EMPTY_BUDGET_PLAN = {
  id: 'bp-00000000-0000-0000-0000-000000000001',
  applicationId: APP_ID,
  notes: null,
  totalPlanned: 0,
  awardedAmount: 1_000_000,
  difference: 1_000_000,
  approvedAt: null,
  approvedByUserId: null,
  items: [],
};

const BUDGET_PLAN_WITH_ONE_ITEM = {
  ...EMPTY_BUDGET_PLAN,
  totalPlanned: 500_000,
  difference: 500_000,
  items: [
    {
      id: 'item-0000-0000-0000-000000000001',
      name: 'Rendezvény bérlés',
      type: 'Event',
      description: null,
      plannedAmount: 500_000,
      sortOrder: 1,
    },
  ],
};

const BUDGET_PLAN_WITH_TWO_ITEMS = {
  ...EMPTY_BUDGET_PLAN,
  totalPlanned: 800_000,
  difference: 200_000,
  items: [
    {
      id: 'item-0000-0000-0000-000000000001',
      name: 'Rendezvény bérlés',
      type: 'Event',
      description: null,
      plannedAmount: 500_000,
      sortOrder: 1,
    },
    {
      id: 'item-0000-0000-0000-000000000002',
      name: 'Laptop',
      type: 'Asset',
      description: null,
      plannedAmount: 300_000,
      sortOrder: 2,
    },
  ],
};

const BUDGET_PLAN_OVER_BUDGET = {
  ...EMPTY_BUDGET_PLAN,
  totalPlanned: 1_200_000,
  difference: -200_000,
  items: [
    {
      id: 'item-0000-0000-0000-000000000001',
      name: 'Nagy tétel',
      type: 'Other',
      description: null,
      plannedAmount: 1_200_000,
      sortOrder: 1,
    },
  ],
};

// WorkflowStepDetail jóváhagyás válaszhoz
const BUDGET_STEP_DETAIL_ACTIVE = {
  id: STEP_BUDGET_ID,
  stepType: 'BudgetPlan',
  status: 'Active',
  order: 5,
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
  contractIdentifier: null,
  contractDate: null,
  notificationReceived: null,
  notificationDate: null,
};

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
  budgetPlan: object | null = EMPTY_BUDGET_PLAN,
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/budget-plan`, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill(ok(budgetPlan));
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

/** Kibontja a [5] Költési terv panelt, ha zárt */
async function expandBudgetPanel(page: import('@playwright/test').Page): Promise<void> {
  const header = page
    .locator('mat-expansion-panel-header')
    .filter({ hasText: /\[5\] Költési terv/i });
  await header.waitFor({ state: 'visible', timeout: 10_000 });
  const panel = page
    .locator('mat-expansion-panel')
    .filter({ has: page.locator('mat-expansion-panel-header').filter({ hasText: /\[5\] Költési terv/i }) });
  const expanded = await panel.evaluate((el) => el.classList.contains('mat-expanded'));
  if (!expanded) await header.click();
}

/** A cost panel locatora */
function budgetPanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({ has: page.locator('mat-expansion-panel-header').filter({ hasText: /\[5\] Költési terv/i }) });
}

/** Kitölt és hozzáad egy tételt az inline formban */
async function addItem(
  page: import('@playwright/test').Page,
  name: string,
  type: string,
  amount: number,
): Promise<void> {
  const panel = budgetPanel(page);
  await panel.getByRole('button', { name: /tétel hozzáadása/i }).click();
  await expect(panel.getByText(/új tétel/i)).toBeVisible({ timeout: 5_000 });

  // Tétel neve
  await panel.getByLabel(/tétel neve/i).click({ force: true });
  await panel.getByLabel(/tétel neve/i).fill(name);

  // Típus (mat-select)
  await panel.locator('mat-select[formcontrolname="type"]').click();
  await page.locator('mat-option').filter({ hasText: type }).click();

  // Tervezett összeg
  await panel.getByLabel(/tervezett összeg/i).click({ force: true });
  await panel.getByLabel(/tervezett összeg/i).fill(String(amount));

  await panel.getByRole('button', { name: /^hozzáadás$/i }).click();
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-060 | Új költési terv tételekkel – sikeres eset
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-060 | Új költési terv tételekkel', () => {
  test('A [5] Költési terv panel Active állapotban auto-kibontva', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(
      munkatarsPage.locator('mat-expansion-panel-header').filter({ hasText: /\[5\] Költési terv/i }),
    ).toBeVisible({ timeout: 10_000 });

    const panel = budgetPanel(munkatarsPage);
    // "Tétel hozzáadása" gomb látható → panel kibontva
    await expect(panel.getByRole('button', { name: /tétel hozzáadása/i })).toBeVisible({ timeout: 5_000 });
  });

  test('"Tétel hozzáadása" gombra kattintva az inline form megjelenik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await panel.getByRole('button', { name: /tétel hozzáadása/i }).click();

    await expect(panel.getByText(/új tétel/i)).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByLabel(/tétel neve/i)).toBeVisible();
    await expect(panel.locator('mat-select[formcontrolname="type"]')).toBeVisible();
    await expect(panel.getByLabel(/tervezett összeg/i)).toBeVisible();
  });

  test('"Hozzáadás" gomb le van tiltva, ha a kötelező mezők üresek', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await panel.getByRole('button', { name: /tétel hozzáadása/i }).click();

    await expect(
      panel.getByRole('button', { name: /^hozzáadás$/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('Tétel hozzáadása után megjelenik a táblában', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await addItem(munkatarsPage, 'Rendezvény bérlés', 'Rendezvény', 500_000);

    const panel = budgetPanel(munkatarsPage);
    await expect(panel.getByText('Rendezvény bérlés')).toBeVisible({ timeout: 5_000 });
  });

  test('Két tétel hozzáadása után mindkét tétel megjelenik a táblában', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await addItem(munkatarsPage, 'Rendezvény bérlés', 'Rendezvény', 500_000);
    await addItem(munkatarsPage, 'Laptop', 'Eszköz', 300_000);

    const panel = budgetPanel(munkatarsPage);
    await expect(panel.getByText('Rendezvény bérlés')).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText('Laptop')).toBeVisible({ timeout: 5_000 });
  });

  test('Mentés után "Költési terv elmentve." snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);

    await munkatarsPage.route(`**/api/v1/applications/${APP_ID}/budget-plan`, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill(ok(BUDGET_PLAN_WITH_ONE_ITEM));
      } else {
        await route.fulfill(ok(null));
      }
    });

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await addItem(munkatarsPage, 'Rendezvény bérlés', 'Rendezvény', 500_000);

    const panel = budgetPanel(munkatarsPage);
    await panel.getByRole('button', { name: /mentés/i }).click();

    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Költési terv elmentve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Összesítő panel megjelenik az elnyert összeggel és a különbséggel', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    // Összesítő panel: "Megítélt összeg" és "Tervezett összeg" sorok
    await expect(panel.getByText('Megítélt összeg:')).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText('Tervezett összeg:')).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText('Különbség:')).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-061 | Költési terv – túllépési figyelmeztetés
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-061 | Költési terv – túllépési figyelmeztetés', () => {
  test('Ha tervezett > elnyert, figyelmeztetés jelenik meg', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_OVER_BUDGET);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await expect(
      panel.getByText('A tervezett összeg meghaladja a megítélt összeget.'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Túllépés esetén az összesítő panel "over-budget" stílust kap', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_OVER_BUDGET);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    const summaryPanel = panel.locator('.summary-panel');
    await expect(summaryPanel).toHaveClass(/over-budget/, { timeout: 5_000 });
  });

  test('Túllépés esetén a Mentés gomb NEM tiltott (nem blokkoló figyelmeztetés)', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_OVER_BUDGET);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await expect(panel.getByRole('button', { name: /mentés/i })).toBeEnabled({ timeout: 5_000 });
  });

  test('Túllépés nélkül a figyelmeztetés nem jelenik meg', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await expect(
      panel.getByText('A tervezett összeg meghaladja a megítélt összeget.'),
    ).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-062 | Tétel törlése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-062 | Tétel törlése', () => {
  test('Törlés ikonra kattintva a tétel eltűnik a táblából (helyi állapot)', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);

    // Mindkét tétel látható
    await expect(panel.getByText('Rendezvény bérlés')).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText('Laptop')).toBeVisible();

    // Az első tétel sorának törlés ikonja
    const firstRow = panel.locator('tr.mat-mdc-row').first();
    await firstRow.locator('button[mattooltip="Törlés"]').click();

    // A törölt tétel eltűnik a helyi táblából
    await expect(panel.getByText('Rendezvény bérlés')).toHaveCount(0);
    // A második tétel megmarad
    await expect(panel.getByText('Laptop')).toBeVisible();
  });

  test('Ha a mentés backend hibával tér vissza, hibaüzenet snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_ONE_ITEM);

    // Backend 422 visszaadása → nem sikerült menteni
    await munkatarsPage.route(`**/api/v1/applications/${APP_ID}/budget-plan`, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ title: 'Validation error', status: 422 }),
        });
      } else {
        await route.fulfill(ok(BUDGET_PLAN_WITH_ONE_ITEM));
      }
    });

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);

    // Törlés gomb megnyomása
    const firstRow = panel.locator('tr.mat-mdc-row').first();
    await firstRow.locator('button[mattooltip="Törlés"]').click();

    // Mentés → backend hiba
    await panel.getByRole('button', { name: /mentés/i }).click();

    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Nem sikerült menteni a költési tervet.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Szerkesztés ikon is megjelenik minden tételnél', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    const editButtons = panel.locator('button[mattooltip="Szerkesztés"]');
    await expect(editButtons).toHaveCount(2, { timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-063 | Tételek sorrendje és szerkesztése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-063 | Tételek sorrendje és szerkesztése', () => {
  test('A tételek a hozzáadás sorrendjében jelennek meg a táblában', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    const rows = panel.locator('tr.mat-mdc-row');
    await expect(rows).toHaveCount(2, { timeout: 5_000 });

    // Első tétel: "Rendezvény bérlés" (sortOrder=1)
    await expect(rows.nth(0)).toContainText('Rendezvény bérlés');
    // Második tétel: "Laptop" (sortOrder=2)
    await expect(rows.nth(1)).toContainText('Laptop');
  });

  test('Tétel szerkesztésével a módosított adatok megjelennek a táblában', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);

    // Szerkesztés ikon az első tételnél
    await panel.locator('tr.mat-mdc-row').first().locator('button[mattooltip="Szerkesztés"]').click();

    // Az inline form "Tétel szerkesztése" felirattal jelenik meg
    await expect(panel.getByText(/tétel szerkesztése/i)).toBeVisible({ timeout: 5_000 });

    // Módosítjuk a nevet
    const nameInput = panel.getByLabel(/tétel neve/i);
    await nameInput.click({ force: true });
    await nameInput.clear();
    await nameInput.fill('Módosított tétel');

    await panel.getByRole('button', { name: /^módosítás$/i }).click();

    // A módosított név megjelenik a táblában
    await expect(panel.getByText('Módosított tétel')).toBeVisible({ timeout: 5_000 });
  });

  test('"Mégse" gombra kattintva a szerkesztési form bezárul', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await panel.getByRole('button', { name: /tétel hozzáadása/i }).click();
    await expect(panel.getByText(/új tétel/i)).toBeVisible({ timeout: 5_000 });

    await panel.getByRole('button', { name: /mégse/i }).click();

    await expect(panel.getByText(/új tétel/i)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-064 | Elnöki jóváhagyás a költési tervhez
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-064 | Elnöki jóváhagyás a költési tervhez', () => {
  test('"Jóváhagyásra küldés" gomb disabled ha nincs tétel', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, null);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = budgetPanel(munkatarsPage);
    await expect(
      panel.getByRole('button', { name: /jóváhagyásra küldés/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('"Jóváhagyásra küldés" gomb aktív ha van tétel, és snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/budget-plan/request-approval`,
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

    const panel = budgetPanel(munkatarsPage);
    const sendBtn = panel.getByRole('button', { name: /jóváhagyásra küldés/i });
    await expect(sendBtn).toBeEnabled({ timeout: 5_000 });

    await sendBtn.click();

    await expect(
      munkatarsPage.locator('mat-snack-bar-container').filter({ hasText: 'Jóváhagyási kérés elküldve az Elnöknek.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Elnöknél megjelenik a "Jóváhagyás" gomb Active BudgetPlan lépésnél', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    // Az approval panel *hasRole="['Admin', 'Elnok']" → Elnöknél látható
    await expect(
      elnokPage.getByRole('button', { name: /^jóváhagyás$/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Jóváhagyás után "Költési terv jóváhagyva." snackbar jelenik meg', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);

    await elnokPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/BudgetPlan/approve`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(BUDGET_STEP_DETAIL_ACTIVE));
        } else {
          await route.continue();
        }
      },
    );

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await elnokPage.getByRole('button', { name: /^jóváhagyás$/i }).click();

    await expect(
      elnokPage.locator('mat-snack-bar-container').filter({ hasText: 'Költési terv jóváhagyva.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Visszautasítás gombra kattintva az indok mező megjelenik', async ({ elnokPage }) => {
    await mockDetailPage(elnokPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await elnokPage.getByRole('button', { name: /visszautasítás$/i }).click();

    await expect(elnokPage.getByLabel(/visszautasítás oka/i)).toBeVisible({ timeout: 5_000 });
  });

  test('Visszautasítás indok nélkül nem megerősíthető', async ({ elnokPage }) => {
    await mockDetailPage(elnokPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await elnokPage.getByRole('button', { name: /visszautasítás$/i }).click();

    await expect(
      elnokPage.getByRole('button', { name: /visszautasítás megerősítése/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('Sikeres visszautasítás után "Visszautasítva" snackbar jelenik meg', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);

    await elnokPage.route(
      `**/api/v1/applications/${APP_ID}/workflow/BudgetPlan/approve`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok({ ...BUDGET_STEP_DETAIL_ACTIVE, rejectionNote: 'Felülvizsgálat szükséges' }));
        } else {
          await route.continue();
        }
      },
    );

    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    await elnokPage.getByRole('button', { name: /visszautasítás$/i }).click();
    await elnokPage.getByLabel(/visszautasítás oka/i).fill('Felülvizsgálat szükséges');
    await elnokPage.getByRole('button', { name: /visszautasítás megerősítése/i }).click();

    await expect(
      elnokPage.locator('mat-snack-bar-container').filter({ hasText: 'Költési terv visszautasítva.' }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-064/B | Költési terv tételek kezelése – Admin
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-064/B | Költési terv tételek kezelése – Admin', () => {
  test('Admin hozzáadhat tételt a költési tervhez', async ({ adminPage }) => {
    await mockDetailPage(adminPage, APP_WON, null);
    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await addItem(adminPage, 'Rendezvény bérlés', 'Rendezvény', 500_000);

    const panel = budgetPanel(adminPage);
    await expect(panel.getByText('Rendezvény bérlés')).toBeVisible({ timeout: 5_000 });
  });

  test('Admin mentés után "Költési terv elmentve." snackbar jelenik meg', async ({
    adminPage,
  }) => {
    await mockDetailPage(adminPage, APP_WON, null);

    await adminPage.route(`**/api/v1/applications/${APP_ID}/budget-plan`, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill(ok(BUDGET_PLAN_WITH_ONE_ITEM));
      } else {
        await route.fulfill(ok(null));
      }
    });

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await addItem(adminPage, 'Rendezvény bérlés', 'Rendezvény', 500_000);

    const panel = budgetPanel(adminPage);
    await panel.getByRole('button', { name: /mentés/i }).click();

    await expect(
      adminPage.locator('mat-snack-bar-container').filter({ hasText: 'Költési terv elmentve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-065 | Tétel hozzáadása gomb – Pénzügyes és Megtekintő (R jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-065 | Tétel hozzáadása gomb – Pénzügyes és Megtekintő (R jog)', () => {
  test('Pénzügyesnél a "Tétel hozzáadása" gomb NEM látható', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = budgetPanel(penzugyesPage);
    // *hasRole="['Admin', 'PalyazatiMunkatars', 'Elnok']" → Pénzügyesnél nem látható
    await expect(
      panel.getByRole('button', { name: /tétel hozzáadása/i }),
    ).toHaveCount(0);
  });

  test('Megtekintőnél a "Tétel hozzáadása" gomb NEM látható', async ({
    megtekintosPage,
  }) => {
    await mockDetailPage(megtekintosPage, APP_WON, BUDGET_PLAN_WITH_TWO_ITEMS);
    await megtekintosPage.goto(`/applications/${APP_ID}`);
    await megtekintosPage.waitForLoadState('networkidle');

    const panel = budgetPanel(megtekintosPage);
    // *hasRole="['Admin', 'PalyazatiMunkatars', 'Elnok']" → Megtekintőnél nem látható
    await expect(
      panel.getByRole('button', { name: /tétel hozzáadása/i }),
    ).toHaveCount(0);
  });
});
