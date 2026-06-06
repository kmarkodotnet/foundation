/**
 * 11. kategória – Elszámolás
 * Forgatókönyvek: TS-100, TS-101, TS-102
 *
 * Stratégia:
 *  - TS-100: Pénzügyes, Settlement lépés Active, dátum + opcionális mezők kitöltése, mentés
 *  - TS-101: Mentés után hasLowCoverageWarning=true → figyelmeztetés jelenik meg
 *  - TS-102: Elnök jóváhagyja az elszámolást → ConfirmDialog → POST approve → ClosedWon
 *
 * API végpontok:
 *   GET  /api/v1/applications/{id}/settlement         → SettlementDto | null
 *   PUT  /api/v1/applications/{id}/settlement         → SettlementDto
 *   POST /api/v1/applications/{id}/settlement/request-approval → void
 *   POST /api/v1/applications/{id}/settlement/approve → ApplicationDetail
 *
 * Panel label: "[9] Elszámolás"
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'eeeeeeee-0000-0000-0000-000000000011';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_SETTLEMENT_ID = 'step-s-000-0000-0000-000000000009';

// ─── Mock Settlement adatok ───────────────────────────────────────────────────

const SETTLEMENT_SAVED: object = {
  id: 'settlement-0-0000-0000-000000000001',
  applicationId: APP_ID,
  settlementDate: '2026-06-01',
  settlementMethodId: null,
  description: 'Rendezvény lebonyolítva',
  notes: 'Minden számla befizetve',
  invoiceCoveragePercent: 95,
  hasLowCoverageWarning: false,
  approvedAt: null,
  approvedByUserId: null,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
};

const SETTLEMENT_LOW_COVERAGE: object = {
  ...SETTLEMENT_SAVED,
  invoiceCoveragePercent: 60,
  hasLowCoverageWarning: true,
};

// ─── Workflow lépések ─────────────────────────────────────────────────────────

function makeSteps(settlementStatus = 'Active') {
  const completed = (type: string, order: number) => ({
    id: `step-s-000-0000-0000-00000000000${order}`,
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
    completed('BudgetPlan', 5),
    completed('VendorContracts', 6),
    completed('Invoices', 7),
    completed('Proof', 8),
    {
      id: STEP_SETTLEMENT_ID,
      stepType: 'Settlement',
      status: settlementStatus,
      order: 9,
      isSkippable: false,
      skippedReason: null,
      completedAt: settlementStatus === 'Completed' ? '2026-06-15T10:00:00Z' : null,
      completedByUserName: settlementStatus === 'Completed' ? 'Teszt Pénzügyes' : null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
  ];
}

// ─── Mock ApplicationDetail objektumok ───────────────────────────────────────

const APP_WON: object = {
  id: APP_ID,
  title: 'Elszámolás Teszt Pályázat',
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
  resultDate: '2026-05-15',
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Teszt Munkatárs',
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-05-15T10:00:00Z',
  workflowSteps: makeSteps('Active'),
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

const APP_CLOSED_WON: object = {
  ...APP_WON,
  status: 'ClosedWon',
  workflowSteps: makeSteps('Locked'),
};

// ─── Segédfüggvények ──────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

function noContent() {
  return { status: 204, body: '' };
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
  settlement: object | null = null,
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/settlement`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(settlement));
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
  // Egyéb lépés API-k
  await page.route(`**/api/v1/applications/${APP_ID}/invoices**`, (route) =>
    route.fulfill(ok({ items: [], summary: { awardedAmount: 0, totalPlanned: 0, totalInvoiced: 0, totalPaid: 0, totalUnpaid: 0, balance: 0 } })),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/budget-plan`, (route) =>
    route.fulfill(ok({ items: [], totalPlanned: 0, awardedAmount: 1_000_000, difference: 1_000_000 })),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/vendor-contracts**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/proof-records**`, (route) =>
    route.fulfill(ok([])),
  );
}

/** A [9] Elszámolás panel locatora */
function settlementPanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({
      has: page
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[9\] Elszámolás/i }),
    });
}

/** Kibontja a [9] Elszámolás panelt, ha zárt */
async function expandSettlementPanel(page: import('@playwright/test').Page): Promise<void> {
  const panel = settlementPanel(page);
  const header = panel.locator('mat-expansion-panel-header');
  const isExpanded = await header.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await header.click();
    await expect(panel).toHaveClass(/mat-expanded/, { timeout: 5_000 });
  }
}

// ─── TS-100 | Elszámolás rögzítése ───────────────────────────────────────────

test.describe('TS-100 | Elszámolás rögzítése', () => {
  test('Pénzügyes sikeresen rögzíti az elszámolást dátummal', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, null);

    // PUT settlement → sikeres válasz
    await page.route(`**/api/v1/applications/${APP_ID}/settlement`, (route) => {
      if (route.request().method() === 'PUT') return route.fulfill(ok(SETTLEMENT_SAVED));
      if (route.request().method() === 'GET') return route.fulfill(ok(null));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    // Dátum kitöltése
    const dateInput = panel.locator('input[formcontrolname="settlementDate"]');
    await expect(dateInput).toBeVisible({ timeout: 5_000 });
    await dateInput.fill('2026-06-01');
    await dateInput.press('Tab');

    // Opcionális mezők
    await panel.locator('textarea[formcontrolname="description"]').fill('Rendezvény lebonyolítva');
    await panel.locator('textarea[formcontrolname="notes"]').fill('Minden számla befizetve');

    // Mentés
    const saveBtn = panel.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Sikeres snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Elszámolás adatai elmentve.', { timeout: 8_000 });

    // Jóváhagyásra küldés gomb megjelenik (settlement() beállítva)
    await expect(panel.getByRole('button', { name: /jóváhagyásra küldés/i })).toBeVisible({ timeout: 5_000 });
  });

  test('Mentés gomb le van tiltva, ha a dátum hiányzik', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, null);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // Dátum nélkül → Mentés gomb le van tiltva
    const saveBtn = panel.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('Jóváhagyásra küldés gomb elküldi a kérést', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    let requestApprovalCalled = false;
    await page.route(`**/api/v1/applications/${APP_ID}/settlement/request-approval`, (route) => {
      if (route.request().method() === 'POST') {
        requestApprovalCalled = true;
        return route.fulfill(noContent());
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    // Elszámolás megvan, form fel van töltve
    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // Jóváhagyásra küldés gomb
    const requestBtn = panel.getByRole('button', { name: /jóváhagyásra küldés/i });
    await expect(requestBtn).toBeVisible({ timeout: 5_000 });
    await requestBtn.click();

    // Snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Jóváhagyási kérés elküldve az Elnöknek.', { timeout: 8_000 });
    expect(requestApprovalCalled).toBe(true);
  });

  test('Pénzügyes nem látja a jóváhagyás szekciót', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // Pénzügyes canApprove=false → Jóváhagyás és lezárás gomb nem látható
    await expect(panel.getByRole('button', { name: /jóváhagyás és lezárás/i })).not.toBeVisible();
    await expect(panel.getByRole('button', { name: /visszautasítás/i })).not.toBeVisible();
  });
});

// ─── TS-101 | Elszámolás – alacsony fedezet figyelmeztetés ───────────────────

test.describe('TS-101 | Elszámolás – 80%-os küszöb figyelmeztetés', () => {
  test('Alacsony fedezet esetén figyelmeztetés jelenik meg a mentés után', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, null);

    // PUT visszaad alacsony fedezetes settlement-et
    await page.route(`**/api/v1/applications/${APP_ID}/settlement`, (route) => {
      if (route.request().method() === 'PUT') return route.fulfill(ok(SETTLEMENT_LOW_COVERAGE));
      if (route.request().method() === 'GET') return route.fulfill(ok(null));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    const dateInput = panel.locator('input[formcontrolname="settlementDate"]');
    await expect(dateInput).toBeVisible({ timeout: 5_000 });
    await dateInput.fill('2026-06-01');
    await dateInput.press('Tab');

    const saveBtn = panel.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Snackbar – sikeres mentés
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Elszámolás adatai elmentve.', { timeout: 8_000 });

    // Figyelmeztetés megjelenik
    await expect(panel.getByText(/a rögzített számlák összege 60%/i)).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText(/nem éri el az elnyert összeg 80%-át/i)).toBeVisible();
  });

  test('Magas fedezet esetén figyelmeztetés nem jelenik meg', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // hasLowCoverageWarning=false → figyelmeztetés nem látható
    await expect(panel.getByText(/nem éri el az elnyert összeg 80%-át/i)).not.toBeVisible();
  });
});

// ─── TS-102 | Pályázat lezárása elnöki jóváhagyással ─────────────────────────

test.describe('TS-102 | Pályázat lezárása elnöki jóváhagyással', () => {
  test('Elnök jóváhagyja az elszámolást – pályázat ClosedWon állapotba kerül', async ({ elnokPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    // POST approve → visszaadja a ClosedWon pályázatot
    await page.route(`**/api/v1/applications/${APP_ID}/settlement/approve`, (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(APP_CLOSED_WON));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    // Elszámolás megjelenik
    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // Jóváhagyás és lezárás gomb látható
    const approveBtn = panel.getByRole('button', { name: /jóváhagyás és lezárás/i });
    await expect(approveBtn).toBeVisible({ timeout: 5_000 });
    await approveBtn.click();

    // ConfirmDialog megnyílik
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText('Pályázat lezárása')).toBeVisible();
    await expect(dialog.getByText('Biztosan lezárod a pályázatot? Ez után módosítás nem lehetséges.')).toBeVisible();

    // Jóváhagyás és lezárás a dialogban
    const confirmBtn = dialog.getByRole('button', { name: /jóváhagyás és lezárás/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Sikeres snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Pályázat sikeresen lezárva. CLOSED_WON státusz.', { timeout: 8_000 });

    // Dialog bezárul
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('Elnök megnyitja a ConfirmDialogot, de Mégse-t nyom – nem lezárja a pályázatot', async ({ elnokPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    let approveCalled = false;
    await page.route(`**/api/v1/applications/${APP_ID}/settlement/approve`, (route) => {
      approveCalled = true;
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    await panel.getByRole('button', { name: /jóváhagyás és lezárás/i }).click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Mégsem → dialog bezárul, approve nem hívódik
    await dialog.getByRole('button', { name: /mégsem/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    expect(approveCalled).toBe(false);
  });

  test('Elnök visszautasítja az elszámolást megjegyzéssel', async ({ elnokPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    await page.route(`**/api/v1/applications/${APP_ID}/settlement/approve`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok({ ...APP_WON, workflowSteps: makeSteps('Active') }));
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // Visszautasítás gomb
    const rejectBtn = panel.getByRole('button', { name: /^visszautasítás$/i });
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Visszautasítás oka textarea megjelenik
    await expect(panel.locator('textarea').last()).toBeVisible({ timeout: 3_000 });

    // Megjegyzés kitöltése
    await panel.locator('textarea').last().fill('A számlák hiányosak, újra kell küldeni.');

    // Visszautasítás küldése gomb
    const submitRejectBtn = panel.getByRole('button', { name: /visszautasítás küldése/i });
    await expect(submitRejectBtn).toBeEnabled();
    await submitRejectBtn.click();

    // Snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Elszámolás visszautasítva.', { timeout: 8_000 });
  });

  test('Elnök látja a jóváhagyás szekciót, de a mentés gombokat nem (canModify=false)', async ({ elnokPage: page }) => {
    await mockDetailPage(page, APP_WON, SETTLEMENT_SAVED);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSettlementPanel(page);
    const panel = settlementPanel(page);

    await expect(panel.locator('input[formcontrolname="settlementDate"]')).toBeVisible({ timeout: 5_000 });

    // Elnök: canModify=false → Mentés és Jóváhagyásra küldés nem látható
    await expect(panel.getByRole('button', { name: /^mentés$/i })).not.toBeVisible();
    await expect(panel.getByRole('button', { name: /jóváhagyásra küldés/i })).not.toBeVisible();

    // Elnök: canApprove=true → Jóváhagyás és lezárás látható
    await expect(panel.getByRole('button', { name: /jóváhagyás és lezárás/i })).toBeVisible();
  });
});
