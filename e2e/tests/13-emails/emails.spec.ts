/**
 * 13. kategória – E-mail csatolások
 * Forgatókönyvek: TS-120, TS-121
 *
 * Stratégia:
 *  - TS-120: Munkatárs e-mailt rögzít → "E-mail rekord rögzítve." snackbar, listában megjelenik
 *  - TS-121: Saját e-mail törölhető; más felhasználóé nem (Munkatárs); Admin mindent törölhet
 *
 * Az e-mail szekció a [2] Beadás panel végén a gm-email-record komponensben jelenik meg.
 *
 * API végpontok:
 *   GET    /api/v1/applications/{id}/emails?stepId={stepId}  → EmailRecordDto[]
 *   POST   /api/v1/applications/{id}/emails                  → EmailRecordDto
 *   DELETE /api/v1/applications/{id}/emails/{emailId}
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-1111-0000-0000-000000000013';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_ID = 'step-em-00-0000-0000-000000000002';

// JWT-ben a PalyazatiMunkatars user ID-je
const MUNKATARS_USER_ID = '00000000-0000-0000-0000-000000000003';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000099';

// ─── Mock e-mail adatok ───────────────────────────────────────────────────────

const EMAIL_OWN = {
  id: 'email-000-0000-0000-000000000001',
  applicationId: APP_ID,
  workflowStepId: STEP_ID,
  subject: 'Pályázat státuszáról érdeklődés',
  senderEmail: 'partner@alapitvany.hu',
  sentDate: '2026-05-15',
  direction: 'In',
  contentSummary: 'Az alapítvány kéri a jelenlegi státusz megküldését.',
  hasAttachment: false,
  attachmentFileName: null,
  createdByUserId: MUNKATARS_USER_ID,
  createdByName: 'Teszt Munkatárs',
  createdAt: '2026-05-15T10:00:00Z',
};

const EMAIL_OTHER = {
  ...EMAIL_OWN,
  id: 'email-000-0000-0000-000000000002',
  subject: 'Más felhasználó e-mailje',
  createdByUserId: OTHER_USER_ID,
  createdByName: 'Másik Felhasználó',
};

// ─── Mock ApplicationDetail + Workflow ───────────────────────────────────────

function makeSteps() {
  return [
    {
      id: 'step-em-00-0000-0000-000000000001',
      stepType: 'Call',
      status: 'Completed',
      order: 1,
      isSkippable: false,
      skippedReason: null,
      completedAt: '2026-03-01T10:00:00Z',
      completedByUserName: 'Teszt Munkatárs',
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: STEP_ID,
      stepType: 'Submission',
      status: 'Active',
      order: 2,
      isSkippable: false,
      skippedReason: null,
      completedAt: null,
      completedByUserName: null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    ...['Result', 'Contract', 'BudgetPlan', 'VendorContracts', 'Invoices', 'Proof', 'Settlement'].map(
      (type, i) => ({
        id: `step-em-00-0000-0000-00000000000${i + 3}`,
        stepType: type,
        status: 'Pending',
        order: i + 3,
        isSkippable: i >= 2,
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

const APP_ACTIVE: object = {
  id: APP_ID,
  title: 'E-mail Teszt Pályázat',
  identifier: null,
  description: null,
  status: 'Active',
  granterId: GRANTER_ID,
  granterName: 'Teszt Alapítvány',
  applicationTypeName: null,
  minAmount: null,
  maxAmount: null,
  submissionDeadline: '2026-07-10T23:59:59Z',
  spendingDeadline: null,
  otherMetadata: null,
  awardedAmount: null,
  resultDate: null,
  resultIdentifier: null,
  isArchived: false,
  createdByUserName: 'Teszt Munkatárs',
  createdAt: '2026-04-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  workflowSteps: makeSteps(),
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

// ─── Segédfüggvények ──────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  emails: object[] = [],
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(APP_ACTIVE));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/emails**`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(emails));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/documents**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/comments**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok([])));
}

/** [2] Beadás panel */
function submissionPanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({
      has: page.locator('mat-expansion-panel-header').filter({ hasText: /\[2\] Beadás/i }),
    });
}

async function expandSubmissionPanel(page: import('@playwright/test').Page): Promise<void> {
  const panel = submissionPanel(page);
  const header = panel.locator('mat-expansion-panel-header');
  if ((await header.getAttribute('aria-expanded')) !== 'true') {
    await header.click();
    await expect(panel).toHaveClass(/mat-expanded/, { timeout: 5_000 });
  }
}

// ─── TS-120 | E-mail manuális rögzítése ──────────────────────────────────────

test.describe('TS-120 | E-mail manuális rögzítése', () => {
  test('Munkatárs e-mailt rögzít – sikeres eset', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, []);

    // POST email → visszaadja az új rekordot
    await page.route(`**/api/v1/applications/${APP_ID}/emails`, (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(EMAIL_OWN));
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    // "E-mail hozzáadása" gomb látható
    const addBtn = emailSection.getByRole('button', { name: /e-mail hozzáadása/i });
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();

    // Form megjelenik
    await expect(emailSection.locator('.add-form-card')).toBeVisible({ timeout: 3_000 });

    // Tárgy
    await emailSection.locator('input[formcontrolname="subject"]').fill('Pályázat státuszáról érdeklődés');

    // Feladó e-mail
    await emailSection.locator('input[formcontrolname="senderEmail"]').fill('partner@alapitvany.hu');

    // Küldés dátuma
    const dateInput = emailSection.locator('input[formcontrolname="sentDate"]');
    await dateInput.fill('2026-05-15');
    await dateInput.press('Tab');

    // Irány: Bejövő
    await emailSection.locator('mat-select[formcontrolname="direction"]').click();
    const bejovOption = page.locator('mat-option').filter({ hasText: /^bejövő$/i });
    await expect(bejovOption).toBeVisible();
    await bejovOption.click();

    // Tartalom összefoglalója (opcionális)
    await emailSection.locator('textarea[formcontrolname="contentSummary"]').fill('Teszt tartalom összefoglaló');

    // Mentés
    const saveBtn = emailSection.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();

    // Sikeres snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('E-mail rekord rögzítve.', { timeout: 8_000 });
  });

  test('Mentés gomb le van tiltva kötelező mezők hiányában', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    await emailSection.getByRole('button', { name: /e-mail hozzáadása/i }).click();
    await expect(emailSection.locator('.add-form-card')).toBeVisible({ timeout: 3_000 });

    // Üres form → Mentés le van tiltva
    const saveBtn = emailSection.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('E-mail hozzáadása gomb nem látható olvasó szerepkörű felhasználónak', async ({ megtekintosPage: page }) => {
    await mockDetailPage(page, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    await expect(emailSection.getByRole('button', { name: /e-mail hozzáadása/i })).not.toBeVisible({ timeout: 5_000 });
  });

  test('E-mail megjelenik a listában – tárgy, irány badge, feladó', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [EMAIL_OWN]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    await expect(emailSection.getByText('Pályázat státuszáról érdeklődés')).toBeVisible({ timeout: 5_000 });
    await expect(emailSection.getByText('Bejövő')).toBeVisible();
    await expect(emailSection.getByText('partner@alapitvany.hu')).toBeVisible();
    await expect(emailSection.getByText('Teszt Munkatárs')).toBeVisible();
  });
});

// ─── TS-121 | E-mail törlése – csak saját vagy Admin ─────────────────────────

test.describe('TS-121 | E-mail törlése – csak saját vagy Admin', () => {
  test('Saját e-mail törölhető – Törlés gomb látható és ConfirmDialog megnyílik', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [EMAIL_OWN]);

    await page.route(`**/api/v1/applications/${APP_ID}/emails/${EMAIL_OWN.id}`, (route) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204, body: '' });
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    await expect(emailSection.getByText('Pályázat státuszáról érdeklődés')).toBeVisible({ timeout: 5_000 });

    // Törlés gomb látható (saját e-mail)
    const emailCard = emailSection.locator('.email-card').first();
    const deleteBtn = emailCard.locator('button[color="warn"]');
    await expect(deleteBtn).toBeVisible();

    // Kattintás → ConfirmDialog
    await deleteBtn.click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText('E-mail rekord törlése')).toBeVisible();

    // Megerősítés
    await dialog.getByRole('button', { name: /^törlés$/i }).click();

    // Snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('E-mail rekord törölve.', { timeout: 8_000 });
  });

  test('Más felhasználó e-mailjénél Törlés gomb nem látható Munkatársnak', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [EMAIL_OTHER]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    await expect(emailSection.getByText('Más felhasználó e-mailje')).toBeVisible({ timeout: 5_000 });

    // Törlés gomb (piros warn gomb) nem látható más felhasználó emailjénél
    const emailCard = emailSection.locator('.email-card').first();
    await expect(emailCard.locator('button[color="warn"]')).not.toBeVisible();
  });

  test('Admin törölhet más felhasználó e-mailjét is', async ({ adminPage: page }) => {
    await mockDetailPage(page, [EMAIL_OTHER]);

    await page.route(`**/api/v1/applications/${APP_ID}/emails/${EMAIL_OTHER.id}`, (route) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204, body: '' });
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    await expect(emailSection.getByText('Más felhasználó e-mailje')).toBeVisible({ timeout: 5_000 });

    // Admin sees delete button for other user's email too
    const emailCard = emailSection.locator('.email-card').first();
    const deleteBtn = emailCard.locator('button[color="warn"]');
    await expect(deleteBtn).toBeVisible();

    await deleteBtn.click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    await dialog.getByRole('button', { name: /^törlés$/i }).click();

    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('E-mail rekord törölve.', { timeout: 8_000 });
  });
});

// ─── TS-120/B | E-mail hozzáadása gomb – Elnök ───────────────────────────────

test.describe('TS-120/B | E-mail hozzáadása gomb – Elnök', () => {
  test('Elnöknél az "E-mail hozzáadása" gomb NEM látható', async ({ elnokPage: page }) => {
    await mockDetailPage(page, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    // *hasRole direktíva alapján Elnök nem látja az e-mail hozzáadása gombot
    await expect(emailSection.getByRole('button', { name: /e-mail hozzáadása/i })).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-120/C | E-mail rögzítése – Pénzügyes ─────────────────────────────────

test.describe('TS-120/C | E-mail rögzítése – Pénzügyes', () => {
  test('Pénzügyes sikeresen rögzít e-mailt', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, []);

    await page.route(`**/api/v1/applications/${APP_ID}/emails`, (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(EMAIL_OWN));
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const emailSection = panel.locator('gm-email-record');

    const addBtn = emailSection.getByRole('button', { name: /e-mail hozzáadása/i });
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();

    await expect(emailSection.locator('.add-form-card')).toBeVisible({ timeout: 3_000 });

    await emailSection.locator('input[formcontrolname="subject"]').fill('Pályázat státuszáról érdeklődés');
    await emailSection.locator('input[formcontrolname="senderEmail"]').fill('partner@alapitvany.hu');

    const dateInput = emailSection.locator('input[formcontrolname="sentDate"]');
    await dateInput.fill('2026-05-15');
    await dateInput.press('Tab');

    await emailSection.locator('mat-select[formcontrolname="direction"]').click();
    const bejovOption = page.locator('mat-option').filter({ hasText: /^bejövő$/i });
    await expect(bejovOption).toBeVisible();
    await bejovOption.click();

    const saveBtn = emailSection.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled({ timeout: 3_000 });
    await saveBtn.click();

    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('E-mail rekord rögzítve.', { timeout: 8_000 });
  });
});
