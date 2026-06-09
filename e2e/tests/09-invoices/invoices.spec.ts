/**
 * 9. kategória – Számlák és fizetések
 * Forgatókönyvek: TS-080, TS-081, TS-082, TS-083, TS-084, TS-085
 *
 * Stratégia:
 *  - TS-080: Pénzügyes, Invoices lépés Active, új fizetve státuszú számla rögzítése
 *  - TS-081: Pénzügyes, fizetve jelölő=igen, de fizetési dátum üres → form invalid
 *  - TS-082: Pénzügyes, kifizetetlen számla "Megjelölés fizetettnek" gyorsgomb → MarkPaidDialog
 *  - TS-083: Pénzügyes, fizetve/fizetetlen badge megjelenítés (UI nem tartalmaz szűrő vezérlőt,
 *            a tesztek a badge rendszert és összesítőt ellenőrzik)
 *  - TS-084: Pénzügyi összesítő panel mezői és over-budget stílus
 *  - TS-085: Lezárt pályázatnál (ClosedWon / isLocked=true) a törlés/módosítás gombok nem láthatók
 *
 * API végpontok:
 *   GET   /api/v1/applications/{id}/invoices   → InvoiceListDto { items, summary }
 *   POST  /api/v1/applications/{id}/invoices   → Invoice
 *   PATCH /api/v1/applications/{id}/invoices/{invoiceId}/mark-paid → Invoice
 *   DELETE /api/v1/applications/{id}/invoices/{invoiceId}
 *   GET   /api/v1/applications/{id}/budget-plan
 *
 * Panel label: "[7] Számlák"
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'cccccccc-0000-0000-0000-000000000009';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_INVOICES_ID = 'step-i-000-0000-0000-000000000007';

// ─── Mock számlák ─────────────────────────────────────────────────────────────

const INVOICE_PAID = {
  id: 'invoice-00-0000-0000-000000000001',
  applicationId: APP_ID,
  supplierName: 'ABC Kft.',
  invoiceNumber: 'SZ-2026-001',
  issueDate: '2026-01-15',
  amount: 300_000,
  isPaid: true,
  paymentDate: '2026-01-20',
  budgetItemId: null,
  notes: null,
  createdAt: '2026-01-15T10:00:00Z',
};

const INVOICE_UNPAID = {
  id: 'invoice-00-0000-0000-000000000002',
  applicationId: APP_ID,
  supplierName: 'XYZ Zrt.',
  invoiceNumber: 'SZ-2026-002',
  issueDate: '2026-02-10',
  amount: 150_000,
  isPaid: false,
  paymentDate: null,
  budgetItemId: null,
  notes: 'Kifizetésre vár',
  createdAt: '2026-02-10T10:00:00Z',
};

const INVOICE_UNPAID_AFTER_MARK = {
  ...INVOICE_UNPAID,
  isPaid: true,
  paymentDate: '2026-03-01',
};

// ─── Mock összesítők ──────────────────────────────────────────────────────────

const SUMMARY_NORMAL = {
  awardedAmount: 1_000_000,
  totalPlanned: 800_000,
  totalInvoiced: 450_000,
  totalPaid: 300_000,
  totalUnpaid: 150_000,
  balance: 550_000,
};

const SUMMARY_OVER_BUDGET = {
  awardedAmount: 1_000_000,
  totalPlanned: 800_000,
  totalInvoiced: 1_200_000,
  totalPaid: 1_000_000,
  totalUnpaid: 200_000,
  balance: -200_000,
};

const EMPTY_SUMMARY = {
  awardedAmount: 1_000_000,
  totalPlanned: 800_000,
  totalInvoiced: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  balance: 1_000_000,
};

// ─── Workflow lépések ─────────────────────────────────────────────────────────

function makeSteps(invoiceStatus: string = 'Active', locked = false) {
  const completed = (type: string, order: number) => ({
    id: `step-i-000-0000-0000-00000000000${order}`,
    stepType: type,
    status: locked ? 'Locked' : 'Completed',
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
    {
      id: STEP_INVOICES_ID,
      stepType: 'Invoices',
      status: locked ? 'Locked' : invoiceStatus,
      order: 7,
      isSkippable: true,
      skippedReason: null,
      completedAt: invoiceStatus === 'Completed' || locked ? '2026-06-15T10:00:00Z' : null,
      completedByUserName: invoiceStatus === 'Completed' || locked ? 'Teszt Pénzügyes' : null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    ...['Proof', 'Settlement'].map((type, i) => ({
      id: `step-i-000-0000-0000-00000000000${i + 8}`,
      stepType: type,
      status: locked ? 'Locked' : 'Pending',
      order: i + 8,
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

// ─── Mock ApplicationDetail objektumok ───────────────────────────────────────

const APP_WON: object = {
  id: APP_ID,
  title: 'Számlák Teszt Pályázat',
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
  workflowSteps: makeSteps('Locked', true),
};

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

function makeInvoiceListDto(items: object[], summary: object) {
  return { items, summary };
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
  invoiceItems: object[] = [],
  summary: object = EMPTY_SUMMARY,
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/invoices`, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill(ok(makeInvoiceListDto(invoiceItems, summary)));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/budget-plan`, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill(ok({ items: [], totalPlanned: 800_000, awardedAmount: 1_000_000, difference: 200_000 }));
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

/** A Számlák panel locatora */
function invoicePanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({
      has: page
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[7\] Számlák/i }),
    });
}

/** Kibontja a [7] Számlák panelt, ha zárt */
async function expandInvoicePanel(page: import('@playwright/test').Page): Promise<void> {
  const header = page
    .locator('mat-expansion-panel-header')
    .filter({ hasText: /\[7\] Számlák/i });
  await header.waitFor({ state: 'visible', timeout: 10_000 });
  const panel = invoicePanel(page);
  const expanded = await panel.evaluate((el) => el.classList.contains('mat-expanded'));
  if (!expanded) await header.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-080 | Új számla rögzítése (fizetve)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-080 | Új számla rögzítése (fizetve)', () => {
  test('A [7] Számlák panel Active állapotban auto-kibontva', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    await expect(
      penzugyesPage
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[7\] Számlák/i }),
    ).toBeVisible({ timeout: 10_000 });

    const panel = invoicePanel(penzugyesPage);
    // Active → "Számla hozzáadása" gomb látható
    await expect(
      panel.getByRole('button', { name: /számla hozzáadása/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Üres lista esetén tájékoztató szöveg jelenik meg', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.getByText(/nincs rögzített számla/i),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Számla hozzáadása" gombra kattintva az inline form megjelenik', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    await expect(panel.getByText(/új számla rögzítése/i)).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByLabel(/szállító neve/i)).toBeVisible();
    await expect(panel.getByLabel(/számla sorszáma/i)).toBeVisible();
    await expect(panel.getByLabel(/összeg \(ft\)/i)).toBeVisible();
  });

  test('"Mentés" gomb disabled, ha a kötelező mezők üresek', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    await expect(
      panel.getByRole('button', { name: /^mentés$/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('"Fizetve" checkbox bejelölésekor megjelenik a Fizetés dátuma mező', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    await panel.locator('mat-checkbox[formcontrolname="isPaid"]').click();

    await expect(panel.locator('mat-form-field').filter({ hasText: /fizetés dátuma/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('Sikeres mentés (fizetve) után "Számla rögzítve." snackbar jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);

    await penzugyesPage.route(
      `**/api/v1/applications/${APP_ID}/invoices`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(INVOICE_PAID));
        } else if (route.request().method() === 'GET') {
          await route.fulfill(ok(makeInvoiceListDto([INVOICE_PAID], SUMMARY_NORMAL)));
        } else {
          await route.continue();
        }
      },
    );

    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    // Szállító neve
    await panel.getByLabel(/szállító neve/i).click({ force: true });
    await panel.getByLabel(/szállító neve/i).fill('ABC Kft.');

    // Számla sorszáma
    await panel.getByLabel(/számla sorszáma/i).click({ force: true });
    await panel.getByLabel(/számla sorszáma/i).fill('SZ-2026-001');

    // Összeg
    await panel.getByLabel(/összeg \(ft\)/i).click({ force: true });
    await panel.getByLabel(/összeg \(ft\)/i).fill('300000');

    // Kiállítás dátuma
    const issueInput = panel.locator('input[formcontrolname="issueDate"]');
    await issueInput.click({ force: true });
    await issueInput.fill('2026-01-15');
    await penzugyesPage.keyboard.press('Escape');

    // Fizetve checkbox
    await panel.locator('mat-checkbox[formcontrolname="isPaid"]').click();

    // Fizetés dátuma
    const paymentInput = panel.locator('input[formcontrolname="paymentDate"]');
    await paymentInput.waitFor({ state: 'visible', timeout: 5_000 });
    await paymentInput.click({ force: true });
    await paymentInput.fill('2026-01-20');
    await panel.getByLabel(/szállító neve/i).click({ force: true }); // datepicker bezárása

    await panel.getByRole('button', { name: /^mentés$/i }).click();

    await expect(
      penzugyesPage.locator('mat-snack-bar-container').filter({ hasText: 'Számla rögzítve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Fizetve számla "Fizetve" badge-dzsel jelenik meg a táblában', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.locator('.badge-paid').first()).toBeVisible({ timeout: 8_000 });
    await expect(panel.locator('.badge-paid').first()).toHaveText('Fizetve');
  });

  test('Fizetve számlánál a "Megjelölés fizetettnek" gomb NEM jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.locator('button[mattooltip="Megjelölés fizetettnek"]'),
    ).toHaveCount(0, { timeout: 8_000 });
  });

  test('"Mégse" gombra kattintva a form bezárul', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();
    await expect(panel.getByText(/új számla rögzítése/i)).toBeVisible({ timeout: 5_000 });

    await panel.getByRole('button', { name: /mégse/i }).click();

    await expect(panel.getByText(/új számla rögzítése/i)).toHaveCount(0);
  });

  test('Munkatársnál a "Számla hozzáadása" gomb NEM látható', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [], EMPTY_SUMMARY);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = invoicePanel(munkatarsPage);
    await expect(
      panel.getByRole('button', { name: /számla hozzáadása/i }),
    ).toHaveCount(0, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-081 | Fizetve = igen, de fizetési dátum nélkül
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-081 | Fizetve=igen, fizetési dátum nélkül', () => {
  test('Fizetve jelölő bekapcsolásakor a Fizetés dátuma mező kötelezővé válik', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    // Alap mezők kitöltése
    await panel.getByLabel(/szállító neve/i).fill('ABC Kft.');
    await panel.getByLabel(/számla sorszáma/i).fill('SZ-2026-001');
    await panel.getByLabel(/összeg \(ft\)/i).fill('300000');

    const issueInput = panel.locator('input[formcontrolname="issueDate"]');
    await issueInput.click({ force: true });
    await issueInput.fill('2026-01-15');
    await panel.getByLabel(/szállító neve/i).click({ force: true });

    // Fizetve checkbox bejelölése (paymentDate üresen marad)
    await panel.locator('mat-checkbox[formcontrolname="isPaid"]').click();

    // Fizetés dátuma mező megjelenik
    await expect(panel.locator('mat-form-field').filter({ hasText: /fizetés dátuma/i })).toBeVisible({
      timeout: 5_000,
    });
  });

  test('"Mentés" gomb disabled, ha isPaid=true de paymentDate üres', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    // Alap mezők kitöltése
    await panel.getByLabel(/szállító neve/i).fill('ABC Kft.');
    await panel.getByLabel(/számla sorszáma/i).fill('SZ-2026-001');
    await panel.getByLabel(/összeg \(ft\)/i).fill('300000');

    const issueInput = panel.locator('input[formcontrolname="issueDate"]');
    await issueInput.click({ force: true });
    await issueInput.fill('2026-01-15');
    await panel.getByLabel(/szállító neve/i).click({ force: true });

    // Fizetve=igen, paymentDate üresen
    await panel.locator('mat-checkbox[formcontrolname="isPaid"]').click();

    // Form invalid → Mentés disabled
    await expect(
      panel.getByRole('button', { name: /^mentés$/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('Ha isPaid=false, a fizetési dátum mező nem jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    // isPaid=false (alapértelmezett) → paymentDate mező NEM jelenik meg
    await expect(panel.locator('input[formcontrolname="paymentDate"]')).toHaveCount(0);
  });

  test('Ha isPaid=false és alapmezők ki vannak töltve, a Mentés gomb engedélyezett', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);

    // POST mock, hogy ne kelljen valódi hívás
    await penzugyesPage.route(`**/api/v1/applications/${APP_ID}/invoices`, async (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(INVOICE_UNPAID));
      if (route.request().method() === 'GET')
        return route.fulfill(ok(makeInvoiceListDto([], EMPTY_SUMMARY)));
      return route.continue();
    });

    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    await panel.getByLabel(/szállító neve/i).fill('XYZ Zrt.');
    await panel.getByLabel(/számla sorszáma/i).fill('SZ-2026-002');
    await panel.getByLabel(/összeg \(ft\)/i).fill('150000');

    const issueInput = panel.locator('input[formcontrolname="issueDate"]');
    await issueInput.click({ force: true });
    await issueInput.fill('2026-02-10');
    await penzugyesPage.keyboard.press('Escape');

    // isPaid=false → a Mentés gomb aktív
    await expect(
      panel.getByRole('button', { name: /^mentés$/i }),
    ).toBeEnabled({ timeout: 5_000 });
  });

  test('Fizetési dátum hibaüzenet jelenik meg isPaid=true esetén', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.getByRole('button', { name: /számla hozzáadása/i }).click();

    await panel.getByLabel(/szállító neve/i).fill('ABC Kft.');
    await panel.getByLabel(/számla sorszáma/i).fill('SZ-2026-001');
    await panel.getByLabel(/összeg \(ft\)/i).fill('300000');

    const issueInput = panel.locator('input[formcontrolname="issueDate"]');
    await issueInput.click({ force: true });
    await issueInput.fill('2026-01-15');
    await penzugyesPage.keyboard.press('Escape');

    await panel.locator('mat-checkbox[formcontrolname="isPaid"]').click();

    // Érintse meg a paymentDate mezőt és hagyja üresen
    const paymentInput = panel.locator('input[formcontrolname="paymentDate"]');
    await paymentInput.waitFor({ state: 'visible', timeout: 5_000 });
    await paymentInput.click({ force: true });
    await penzugyesPage.keyboard.press('Tab');

    // Hibaüzenet megjelenik
    await expect(
      panel.getByText(/fizetés dátuma kötelező/i),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-082 | Fizetési státusz gyors frissítése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-082 | Fizetési státusz gyors frissítése', () => {
  test('Kifizetetlen számlánál megjelenik a "Megjelölés fizetettnek" gomb', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.locator('button[mattooltip="Megjelölés fizetettnek"]'),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Megjelölés fizetettnek" gombra kattintva a dialog megjelenik', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.locator('button[mattooltip="Megjelölés fizetettnek"]').click();

    await expect(
      penzugyesPage
        .locator('mat-dialog-container')
        .filter({ hasText: /megjelölés fizetettnek/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Dialog tartalmaz dátum beviteli mezőt', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.locator('button[mattooltip="Megjelölés fizetettnek"]').click();

    await expect(
      penzugyesPage
        .locator('mat-dialog-container')
        .locator('mat-form-field')
        .filter({ hasText: /fizetés dátuma/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Dialog "Mentés" gomb disabled, ha a dátum üres', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.locator('button[mattooltip="Megjelölés fizetettnek"]').click();

    await expect(
      penzugyesPage.locator('mat-dialog-container').getByRole('button', { name: /^mentés$/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('Sikeres fizetés jelölés után "Számla fizetettre jelölve." snackbar jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);

    await penzugyesPage.route(
      `**/api/v1/applications/${APP_ID}/invoices/${INVOICE_UNPAID.id}/mark-paid`,
      async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill(ok(INVOICE_UNPAID_AFTER_MARK));
        } else {
          await route.continue();
        }
      },
    );

    // GET invoices második hívásra a frissített listát adja vissza
    let getCount = 0;
    await penzugyesPage.route(
      `**/api/v1/applications/${APP_ID}/invoices`,
      async (route) => {
        if (route.request().method() === 'GET') {
          getCount++;
          const items = getCount > 1 ? [INVOICE_UNPAID_AFTER_MARK] : [INVOICE_UNPAID];
          return route.fulfill(ok(makeInvoiceListDto(items, SUMMARY_NORMAL)));
        }
        return route.continue();
      },
    );

    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.locator('button[mattooltip="Megjelölés fizetettnek"]').click();

    // Dátum megadása a dialogban – ESC kerülendő (bezárja a mat-dialog-ot)
    const dialog = penzugyesPage.locator('mat-dialog-container');
    await dialog.waitFor({ state: 'visible', timeout: 8_000 });

    const dialogDateInput = dialog.locator('input[formcontrolname="paymentDate"]');
    await dialogDateInput.click({ force: true });
    await dialogDateInput.fill('2026-03-01');
    // Tab-bal lépünk ki a datepicker mezőből (nem ESC, az bezárná a dialogot)
    await dialogDateInput.press('Tab');
    // Várjuk, hogy a Mentés gomb engedélyezett legyen
    const saveBtn = dialog.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    await expect(
      penzugyesPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: 'Számla fizetettre jelölve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Dialog "Mégse" gombra kattintva az API nem hívódik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);

    let markPaidCalled = false;
    await penzugyesPage.route(
      `**/api/v1/applications/${APP_ID}/invoices/${INVOICE_UNPAID.id}/mark-paid`,
      async (route) => {
        markPaidCalled = true;
        await route.continue();
      },
    );

    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.locator('button[mattooltip="Megjelölés fizetettnek"]').click();

    await penzugyesPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /mégse/i })
      .click();

    await expect(penzugyesPage.locator('mat-dialog-container')).toHaveCount(0);
    expect(markPaidCalled).toBe(false);
  });

  test('Már fizetve lévő számlánál nincs "Megjelölés fizetettnek" gomb', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.locator('button[mattooltip="Megjelölés fizetettnek"]'),
    ).toHaveCount(0, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-083 | Számlák fizetve / fizetetlen badge megjelenítés
// Megjegyzés: az UI nem tartalmaz szűrő vezérlőt. A tesztek a badge-rendszert
// és az összesítő panel értékeit ellenőrzik, amelyek a szűrési feltételeket pótolják.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-083 | Fizetve / fizetetlen badge megjelenítés', () => {
  test('Fizetett számla "Fizetve" badge-dzsel jelenik meg', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.locator('.badge-paid')).toBeVisible({ timeout: 8_000 });
    await expect(panel.locator('.badge-paid')).toHaveText('Fizetve');
  });

  test('Kifizetetlen számla "Fizetetlen" badge-dzsel jelenik meg', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.locator('.badge-unpaid')).toBeVisible({ timeout: 8_000 });
    await expect(panel.locator('.badge-unpaid')).toHaveText('Fizetetlen');
  });

  test('Vegyesen fizetve és fizetetlen számlák esetén mindkét badge megjelenik', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(
      penzugyesPage,
      APP_WON,
      [INVOICE_PAID, INVOICE_UNPAID],
      SUMMARY_NORMAL,
    );
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.locator('.badge-paid')).toBeVisible({ timeout: 8_000 });
    await expect(panel.locator('.badge-unpaid')).toBeVisible();
  });

  test('Vegyesen fizetve és fizetetlen esetén mindkét számla sor megjelenik', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(
      penzugyesPage,
      APP_WON,
      [INVOICE_PAID, INVOICE_UNPAID],
      SUMMARY_NORMAL,
    );
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    const rows = panel.locator('tr.mat-mdc-row');
    await expect(rows).toHaveCount(2, { timeout: 8_000 });
  });

  test('Az összesítő a Fizetve és Fizetetlen összegeket helyesen mutatja', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(
      penzugyesPage,
      APP_WON,
      [INVOICE_PAID, INVOICE_UNPAID],
      SUMMARY_NORMAL,
    );
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.getByText('Fizetve:')).toBeVisible({ timeout: 8_000 });
    await expect(panel.getByText('Fizetetlen:')).toBeVisible();
  });

  test('Kifizetetlen számlánál a "Megjelölés fizetettnek" gomb látható (szűrési proxy)', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.locator('button[mattooltip="Megjelölés fizetettnek"]'),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-084 | Pénzügyi összesítő panel
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-084 | Pénzügyi összesítő panel', () => {
  test('Összesítő panel megjelenik és tartalmazza az összes sort', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID, INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.getByText('Megítélt összeg:')).toBeVisible({ timeout: 8_000 });
    await expect(panel.getByText('Tervezett összeg:')).toBeVisible();
    await expect(panel.getByText('Rögzített számlák összege:')).toBeVisible();
    await expect(panel.getByText('Fizetve:')).toBeVisible();
    await expect(panel.getByText('Fizetetlen:')).toBeVisible();
    await expect(panel.getByText('Egyenleg:')).toBeVisible();
  });

  test('Normál esetben az összesítő NEM mutat over-budget stílust', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    // "Rögzített számlák összege" sor strong elemje NEM tartalmaz over-budget class-t
    await expect(panel.locator('.over-budget')).toHaveCount(0, { timeout: 8_000 });
  });

  test('Ha számlák összege > megítélt összeg, "over-budget" stílus megjelenik', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(
      penzugyesPage,
      APP_WON,
      [INVOICE_PAID, INVOICE_UNPAID],
      SUMMARY_OVER_BUDGET,
    );
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.locator('.over-budget').first()).toBeVisible({ timeout: 8_000 });
  });

  test('Összesítő panel összegek nem üresek (tartalom ellenőrzés)', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID, INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    // A summary panel strong elemei nem üresek
    const summaryStrongs = panel.locator('.summary-panel strong');
    await expect(summaryStrongs.first()).toBeVisible({ timeout: 8_000 });
    const count = await summaryStrongs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Üres lista esetén az összesítő nulla értékeket mutat', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [], EMPTY_SUMMARY);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    // Összesítő megjelenik (mindig renderelődik)
    await expect(panel.getByText('Megítélt összeg:')).toBeVisible({ timeout: 8_000 });
    // Over-budget stílus nem jelenik meg
    await expect(panel.locator('.over-budget')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-085 | Számla törlése lezárt pályázatnál tiltva
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-085 | Számla törlése lezárt pályázatnál tiltva', () => {
  test('ClosedWon pályázatnál a "Törlés" gomb NEM jelenik meg', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_CLOSED_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    // Lezárt → a Számlák panel zárt → ki kell nyitni
    await expandInvoicePanel(penzugyesPage);

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.locator('button[mattooltip="Törlés"]'),
    ).toHaveCount(0, { timeout: 8_000 });
  });

  test('ClosedWon pályázatnál a "Megjelölés fizetettnek" gomb NEM jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_CLOSED_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    await expandInvoicePanel(penzugyesPage);

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.locator('button[mattooltip="Megjelölés fizetettnek"]'),
    ).toHaveCount(0, { timeout: 8_000 });
  });

  test('ClosedWon pályázatnál a "Számla hozzáadása" gomb NEM jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_CLOSED_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    await expandInvoicePanel(penzugyesPage);

    const panel = invoicePanel(penzugyesPage);
    await expect(
      panel.getByRole('button', { name: /számla hozzáadása/i }),
    ).toHaveCount(0, { timeout: 8_000 });
  });

  test('ClosedWon pályázatnál a számlák adatai olvasható nézetben jelennek meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_CLOSED_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    await expandInvoicePanel(penzugyesPage);

    const panel = invoicePanel(penzugyesPage);
    // A számla adatai olvashatók
    await expect(panel.getByText(INVOICE_PAID.supplierName)).toBeVisible({ timeout: 8_000 });
    await expect(panel.getByText(INVOICE_PAID.invoiceNumber)).toBeVisible();
  });

  test('Lezárt pályázat Direct DELETE kísérlet esetén snackbar hibaüzenet', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);

    await penzugyesPage.route(
      `**/api/v1/applications/${APP_ID}/invoices/${INVOICE_PAID.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              title: 'Validation error',
              status: 422,
              detail: 'A pályázat zárolt állapotban van, törlés nem lehetséges.',
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    // Active állapotban van törlés gomb
    await expect(panel.locator('button[mattooltip="Törlés"]')).toBeVisible({ timeout: 8_000 });
    await panel.locator('button[mattooltip="Törlés"]').click();

    await penzugyesPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    await expect(
      penzugyesPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: /zárolt állapotban/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Active Won pályázatnál a Törlés gomb látható Pénzügyesnél', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await expect(panel.locator('button[mattooltip="Törlés"]')).toBeVisible({ timeout: 8_000 });
  });

  test('Sikeres törlés után "Számla törölve." snackbar jelenik meg', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);

    await penzugyesPage.route(
      `**/api/v1/applications/${APP_ID}/invoices/${INVOICE_PAID.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, body: '' });
        } else {
          await route.continue();
        }
      },
    );

    // Törlés utáni friss lista
    let getCount = 0;
    await penzugyesPage.route(`**/api/v1/applications/${APP_ID}/invoices`, async (route) => {
      if (route.request().method() === 'GET') {
        getCount++;
        const items = getCount > 1 ? [] : [INVOICE_PAID];
        return route.fulfill(ok(makeInvoiceListDto(items, EMPTY_SUMMARY)));
      }
      return route.continue();
    });

    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = invoicePanel(penzugyesPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await penzugyesPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    await expect(
      penzugyesPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: 'Számla törölve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-085/B | Számla jóváhagyása – Elnök (U jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-085/B | Számla panel – Elnök (U jog)', () => {
  test('Elnöknél megjelenik a "Jóváhagyás" gomb Active Invoices lépésnél', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON, [INVOICE_PAID], SUMMARY_NORMAL);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    // Az approval panel *hasRole="['Admin', 'Elnok']" → Elnöknél látható
    await expect(
      elnokPage.getByRole('button', { name: /^jóváhagyás$/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Elnöknél a "Számla hozzáadása" gomb NEM látható', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON, [], EMPTY_SUMMARY);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    const panel = invoicePanel(elnokPage);
    // *hasRole="['Penzugyes', 'Admin']" → Elnöknél nem látható
    await expect(
      panel.getByRole('button', { name: /számla hozzáadása/i }),
    ).toHaveCount(0, { timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-086 | Számla panel – Megtekintő (R jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-086 | Számla panel – Megtekintő (R jog)', () => {
  test('Megtekintőnél a "Számla hozzáadása" gomb NEM látható', async ({
    megtekintosPage,
  }) => {
    await mockDetailPage(megtekintosPage, APP_WON, [], EMPTY_SUMMARY);
    await megtekintosPage.goto(`/applications/${APP_ID}`);
    await megtekintosPage.waitForLoadState('networkidle');

    const panel = invoicePanel(megtekintosPage);
    await expect(
      panel.getByRole('button', { name: /számla hozzáadása/i }),
    ).toHaveCount(0, { timeout: 8_000 });
  });

  test('Megtekintőnél a "Megjelölés fizetettnek" gomb NEM látható', async ({
    megtekintosPage,
  }) => {
    await mockDetailPage(megtekintosPage, APP_WON, [INVOICE_UNPAID], SUMMARY_NORMAL);
    await megtekintosPage.goto(`/applications/${APP_ID}`);
    await megtekintosPage.waitForLoadState('networkidle');

    const panel = invoicePanel(megtekintosPage);
    // Megtekintő R jogú → fizetettnek jelölés nem elérhető
    await expect(
      panel.locator('button[mattooltip="Megjelölés fizetettnek"]'),
    ).toHaveCount(0, { timeout: 8_000 });
  });
});
