/**
 * 8. kategória – Alvállalkozói szerződések
 * Forgatókönyvek: TS-070, TS-071, TS-072
 *
 * Stratégia:
 *  - TS-070: Munkatárs, VendorContracts lépés Active (app status: Won)
 *            Sikeres szerződés rögzítés: form kitöltés, mentés, snackbar, lista frissülés
 *  - TS-071: Törlési kísérlet kapcsolt számla esetén → backend 422, hibaüzenet
 *  - TS-072: Törlés kapcsolt számla nélkül → megerősítő dialog, törlés, snackbar, lista frissülés
 *
 * API végpontok:
 *   GET    /api/v1/applications/{id}/vendor-contracts
 *   POST   /api/v1/applications/{id}/vendor-contracts
 *   DELETE /api/v1/applications/{id}/vendor-contracts/{contractId}
 *   GET    /api/v1/vendors
 *   GET    /api/v1/applications/{id}/budget-plan
 *
 * Panel label: "[6] Alvállalkozói szerz."
 * "Szerződés hozzáadása" gomb → inline form
 * "Mentés" → POST, "Törlés" tooltip ikon → ConfirmDialog → DELETE
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000008';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_VENDOR_ID = 'step-v-000-0000-0000-000000000006';

const VENDOR_1 = { id: 'vendor-00-0000-0000-000000000001', name: 'ABC Építő Kft.', isActive: true };
const VENDOR_2 = { id: 'vendor-00-0000-0000-000000000002', name: 'XYZ Szolgáltató Zrt.', isActive: true };

const CONTRACT_1 = {
  id: 'contract-0000-0000-0000-000000000001',
  applicationId: APP_ID,
  vendorId: VENDOR_1.id,
  vendorName: VENDOR_1.name,
  contractIdentifier: 'ALVALLALK-001',
  contractDate: '2026-05-01',
  amount: 500_000,
  currency: 'HUF',
  budgetItemId: null,
  notes: null,
  createdAt: '2026-05-01T10:00:00Z',
};

const CONTRACT_2 = {
  id: 'contract-0000-0000-0000-000000000002',
  applicationId: APP_ID,
  vendorId: VENDOR_2.id,
  vendorName: VENDOR_2.name,
  contractIdentifier: null,
  contractDate: '2026-05-10',
  amount: 300_000,
  currency: 'HUF',
  budgetItemId: null,
  notes: 'Teszt megjegyzés',
  createdAt: '2026-05-10T10:00:00Z',
};

// ─── Workflow lépések ─────────────────────────────────────────────────────────

function makeSteps(vendorStatus: string = 'Active') {
  const completed = (type: string, order: number) => ({
    id: `step-v-000-0000-0000-00000000000${order}`,
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
    {
      id: STEP_VENDOR_ID,
      stepType: 'VendorContracts',
      status: vendorStatus,
      order: 6,
      isSkippable: true,
      skippedReason: null,
      completedAt: vendorStatus === 'Completed' ? '2026-06-10T10:00:00Z' : null,
      completedByUserName: vendorStatus === 'Completed' ? 'Teszt Munkatárs' : null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    ...['Invoices', 'Proof', 'Settlement'].map((type, i) => ({
      id: `step-v-000-0000-0000-00000000000${i + 7}`,
      stepType: type,
      status: 'Pending',
      order: i + 7,
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

const APP_WON: object = {
  id: APP_ID,
  title: 'Alvállalkozói Szerz. Teszt Pályázat',
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

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
  contracts: object[] = [],
  vendors: object[] = [VENDOR_1, VENDOR_2],
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/vendor-contracts`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(contracts));
    return route.continue();
  });
  await page.route(`**/api/v1/vendors**`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(vendors));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/budget-plan`, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill(ok({ items: [], totalPlanned: 0, awardedAmount: 1_000_000, difference: 1_000_000 }));
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

/** A VendorContracts panel locatora */
function vendorPanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({
      has: page
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[6\] Alvállalkozói szerz\./i }),
    });
}

/** Kibontja a [6] Alvállalkozói szerz. panelt, ha zárt */
async function expandVendorPanel(page: import('@playwright/test').Page): Promise<void> {
  const header = page
    .locator('mat-expansion-panel-header')
    .filter({ hasText: /\[6\] Alvállalkozói szerz\./i });
  await header.waitFor({ state: 'visible', timeout: 10_000 });
  const panel = vendorPanel(page);
  const expanded = await panel.evaluate((el) => el.classList.contains('mat-expanded'));
  if (!expanded) await header.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-070 | Új alvállalkozói szerződés rögzítése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-070 | Új alvállalkozói szerződés rögzítése', () => {
  test('A [6] Alvállalkozói szerz. panel Active állapotban auto-kibontva', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(
      munkatarsPage
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[6\] Alvállalkozói szerz\./i }),
    ).toBeVisible({ timeout: 10_000 });

    const panel = vendorPanel(munkatarsPage);
    // Active → auto-kibontva → "Szerződés hozzáadása" gomb látható
    await expect(
      panel.getByRole('button', { name: /szerződés hozzáadása/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Üres lista állapotban tájékoztató szöveg jelenik meg', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await expect(
      panel.getByText(/nincs rögzített alvállalkozói szerződés/i),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Szerződés hozzáadása" gombra kattintva az inline form megjelenik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();

    await expect(panel.getByText(/új szerződés rögzítése/i)).toBeVisible({ timeout: 5_000 });
    await expect(panel.locator('mat-select[formcontrolname="vendorId"]')).toBeVisible();
    await expect(panel.getByLabel(/összeg \(ft\)/i)).toBeVisible();
  });

  test('A "Mentés" gomb disabled, ha a kötelező mezők üresek', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();

    await expect(
      panel.getByRole('button', { name: /^mentés$/i }),
    ).toBeDisabled({ timeout: 5_000 });
  });

  test('Szállító lista megjelenik a mat-select-ben', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [], [VENDOR_1, VENDOR_2]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();

    // Szállító mat-select megnyitása
    await panel.locator('mat-select[formcontrolname="vendorId"]').click();

    await expect(
      munkatarsPage.locator('mat-option').filter({ hasText: VENDOR_1.name }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      munkatarsPage.locator('mat-option').filter({ hasText: VENDOR_2.name }),
    ).toBeVisible();
  });

  test('Sikeres mentés után "Alvállalkozói szerződés rögzítve." snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(CONTRACT_1));
        } else if (route.request().method() === 'GET') {
          await route.fulfill(ok([]));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();

    // Szállító kiválasztása
    await panel.locator('mat-select[formcontrolname="vendorId"]').click();
    await munkatarsPage.locator('mat-option').filter({ hasText: VENDOR_1.name }).click();

    // Összeg kitöltése
    await panel.getByLabel(/összeg \(ft\)/i).click({ force: true });
    await panel.getByLabel(/összeg \(ft\)/i).fill('500000');

    // Dátum kitöltése
    const dateInput = panel.locator('input[formcontrolname="contractDate"]');
    await dateInput.click({ force: true });
    await dateInput.fill('2026-05-01');
    await munkatarsPage.keyboard.press('Escape');

    await panel.getByRole('button', { name: /^mentés$/i }).click();

    await expect(
      munkatarsPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: 'Alvállalkozói szerződés rögzítve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Sikeres mentés után a szerződés megjelenik a táblában', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(ok(CONTRACT_1));
        } else if (route.request().method() === 'GET') {
          await route.fulfill(ok([]));
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();

    await panel.locator('mat-select[formcontrolname="vendorId"]').click();
    await munkatarsPage.locator('mat-option').filter({ hasText: VENDOR_1.name }).click();

    await panel.getByLabel(/összeg \(ft\)/i).click({ force: true });
    await panel.getByLabel(/összeg \(ft\)/i).fill('500000');

    const dateInput = panel.locator('input[formcontrolname="contractDate"]');
    await dateInput.click({ force: true });
    await dateInput.fill('2026-05-01');
    await munkatarsPage.keyboard.press('Escape');

    await panel.getByRole('button', { name: /^mentés$/i }).click();

    // A szerződés megjelenik a táblában
    await expect(panel.getByText(VENDOR_1.name)).toBeVisible({ timeout: 8_000 });
  });

  test('Több szerződés rögzítése esetén mindkettő megjelenik a táblában', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1, CONTRACT_2]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await expect(panel.getByText(VENDOR_1.name)).toBeVisible({ timeout: 8_000 });
    await expect(panel.getByText(VENDOR_2.name)).toBeVisible();
  });

  test('Összesítő panel megjelenik, ha van szerződés', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1, CONTRACT_2]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await expect(panel.getByText(/szerződések száma:/i)).toBeVisible({ timeout: 8_000 });
    await expect(panel.getByText(/összes szerződéses összeg:/i)).toBeVisible();
  });

  test('"Mégse" gombra kattintva a form bezárul', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();

    await expect(panel.getByText(/új szerződés rögzítése/i)).toBeVisible({ timeout: 5_000 });

    await panel.getByRole('button', { name: /mégse/i }).click();

    await expect(panel.getByText(/új szerződés rögzítése/i)).toHaveCount(0);
  });

  test('"Mégse" után a "Szerződés hozzáadása" gomb újra látható', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, []);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.getByRole('button', { name: /szerződés hozzáadása/i }).click();
    await panel.getByRole('button', { name: /mégse/i }).click();

    await expect(
      panel.getByRole('button', { name: /szerződés hozzáadása/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Pénzügyesnél a "Szerződés hozzáadása" gomb látható (R,C,U jog)', async ({ penzugyesPage }) => {
    await mockDetailPage(penzugyesPage, APP_WON, []);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = vendorPanel(penzugyesPage);
    await expect(
      panel.getByRole('button', { name: /szerződés hozzáadása/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('"Lépés lezárása" gomb megjelenik Active lépésnél Munkatársnak', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(
      munkatarsPage.getByRole('button', { name: /lépés lezárása/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-071 | Alvállalkozói szerződés törlése – kapcsolt számla esetén tiltva
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-071 | Törlés tiltva kapcsolt számla esetén', () => {
  test('Törlés gomb látható Active lépésnél Munkatársnak', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await expect(
      panel.locator('button[mattooltip="Törlés"]'),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Ha a DELETE 422 hibát ad, hibaüzenet snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              title: 'Validation error',
              status: 422,
              detail: 'A szerződés nem törölhető, mert 2 db számla kapcsolódik hozzá.',
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);

    // Törlés gombra kattintás
    await panel.locator('button[mattooltip="Törlés"]').click();

    // Megerősítő dialog megjelenik
    await expect(
      munkatarsPage.locator('mat-dialog-container').filter({ hasText: /törlés/i }),
    ).toBeVisible({ timeout: 8_000 });

    // Törlés megerősítése
    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    // Hibaüzenet snackbar
    await expect(
      munkatarsPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: /nem törölhető.*számla/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Ha a DELETE 422 hibát ad, a szerződés megmarad a listában', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            body: JSON.stringify({
              title: 'Validation error',
              status: 422,
              detail: 'A szerződés nem törölhető, mert 2 db számla kapcsolódik hozzá.',
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    // Hiba után a szerződés még mindig ott van
    await expect(panel.getByText(VENDOR_1.name)).toBeVisible({ timeout: 8_000 });
  });

  test('Ha a DELETE 409 hibát ad (conflict), hibaüzenet snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              title: 'Conflict',
              status: 409,
              detail: 'A szerződés nem törölhető, mert kapcsolt számlák léteznek.',
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    await expect(
      munkatarsPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: /nem törölhető/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-072 | Alvállalkozói szerződés törlése – nincs kapcsolt számla
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-072 | Törlés nincs kapcsolt számla esetén', () => {
  test('Törlés ikonra kattintva megerősítő dialog jelenik meg', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await expect(
      munkatarsPage.locator('mat-dialog-container').filter({ hasText: /szerződés törlése/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Megerősítő dialog a szállító nevét tartalmazza', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await expect(
      munkatarsPage.locator('mat-dialog-container').filter({ hasText: VENDOR_1.name }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Sikeres törlés után "Szerződés törölve." snackbar jelenik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, body: '' });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    await expect(
      munkatarsPage
        .locator('mat-snack-bar-container')
        .filter({ hasText: 'Szerződés törölve.' }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('Törlés után a szerződés eltűnik a listából', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1, CONTRACT_2]);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, body: '' });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);

    // Mindkét szerződés látható
    await expect(panel.getByText(VENDOR_1.name)).toBeVisible({ timeout: 8_000 });
    await expect(panel.getByText(VENDOR_2.name)).toBeVisible();

    // Az első törlése
    const firstRow = panel.locator('tr.mat-mdc-row').first();
    await firstRow.locator('button[mattooltip="Törlés"]').click();

    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    // Az első eltűnik, a második megmarad
    await expect(panel.getByText(VENDOR_1.name)).toHaveCount(0, { timeout: 8_000 });
    await expect(panel.getByText(VENDOR_2.name)).toBeVisible();
  });

  test('Dialog "Mégsem" gombra kattintva az API nem hívódik meg', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);

    let deleteApiCalled = false;
    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteApiCalled = true;
          await route.continue();
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    // Mégsem gomb
    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /mégsem/i })
      .click();

    // Dialog bezárul
    await expect(munkatarsPage.locator('mat-dialog-container')).toHaveCount(0);

    // DELETE nem hívódott meg
    expect(deleteApiCalled).toBe(false);
  });

  test('"Mégsem" után a szerződés megmarad a listában', async ({ munkatarsPage }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);
    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /mégsem/i })
      .click();

    // A szerződés megmarad
    await expect(panel.getByText(VENDOR_1.name)).toBeVisible({ timeout: 5_000 });
  });

  test('Utolsó szerződés törlése után az üres állapot üzenet megjelenik', async ({
    munkatarsPage,
  }) => {
    await mockDetailPage(munkatarsPage, APP_WON, [CONTRACT_1]);

    await munkatarsPage.route(
      `**/api/v1/applications/${APP_ID}/vendor-contracts/${CONTRACT_1.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204, body: '' });
        } else {
          await route.continue();
        }
      },
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    const panel = vendorPanel(munkatarsPage);
    await panel.locator('button[mattooltip="Törlés"]').click();

    await munkatarsPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /törlés/i })
      .click();

    // Törlés után üres állapot üzenet jelenik meg
    await expect(
      panel.getByText(/nincs rögzített alvállalkozói szerződés/i),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-070/B | FS-eltérés vizsgálat – Pénzügyes C/U jog alvállalkozói szerz.-nél
// ─────────────────────────────────────────────────────────────────────────────
// FS (5.1 jogosultsági mátrix): Pénzügyes → Alvállalkozói szerz.: R,C,U
// A meglévő TS-070 azt állítja, hogy a gomb NEM látható Pénzügyesnél.
// Ez a teszt a FS-t követi: ha átmegy, az implementáció hibás (TS-070 javítandó).
// Ha elbukik, az implementáció helyes és a FS felülvizsgálandó.
test.describe('TS-070/B | Alvállalkozói szerz. – Pénzügyes (C, U) — FS-eltérés vizsgálat', () => {
  test('Pénzügyesnél a "Szerződés hozzáadása" gomb LÁTHATÓ (FS: R,C,U jog)', async ({
    penzugyesPage,
  }) => {
    await mockDetailPage(penzugyesPage, APP_WON, []);
    await penzugyesPage.goto(`/applications/${APP_ID}`);
    await penzugyesPage.waitForLoadState('networkidle');

    const panel = vendorPanel(penzugyesPage);
    // FS szerint C jog → gomb látható; ha ez a teszt elbukik, az implementáció
    // a TS-070 viselkedést tükrözi (gomb nem látható) → FS vs impl eltérés
    await expect(
      panel.getByRole('button', { name: /szerződés hozzáadása/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-073/B | Alvállalkozói lépés jóváhagyása – Elnök (U jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-073/B | Alvállalkozói lépés jóváhagyása – Elnök (U jog)', () => {
  test('Elnöknél megjelenik a "Jóváhagyás" gomb Active VendorContracts lépésnél', async ({
    elnokPage,
  }) => {
    await mockDetailPage(elnokPage, APP_WON, [CONTRACT_1]);
    await elnokPage.goto(`/applications/${APP_ID}`);
    await elnokPage.waitForLoadState('networkidle');

    // Az approval panel *hasRole="['Admin', 'Elnok']" → Elnöknél látható
    await expect(
      elnokPage.getByRole('button', { name: /^jóváhagyás$/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-073/C | Alvállalkozói szerz. panel – Megtekintő (R jog)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-073/C | Alvállalkozói szerz. panel – Megtekintő (R jog)', () => {
  test('Megtekintőnél a "Szerződés hozzáadása" gomb NEM látható', async ({
    megtekintosPage,
  }) => {
    await mockDetailPage(megtekintosPage, APP_WON, []);
    await megtekintosPage.goto(`/applications/${APP_ID}`);
    await megtekintosPage.waitForLoadState('networkidle');

    const panel = vendorPanel(megtekintosPage);
    // Megtekintő R jogú → gomb nem látható
    await expect(
      panel.getByRole('button', { name: /szerződés hozzáadása/i }),
    ).toHaveCount(0, { timeout: 8_000 });
  });
});
