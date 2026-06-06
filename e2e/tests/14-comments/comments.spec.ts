/**
 * 14. kategória – Megjegyzések
 * Forgatókönyvek: TS-130, TS-131, TS-132
 *
 * Stratégia:
 *  - TS-130: Megjegyzés hozzáadása → megjelenik a listában, form bezárul
 *  - TS-131: Saját megjegyzés szerkeszthető és törölhető
 *  - TS-132: Más felhasználó megjegyzésénél nincs szerkesztés/törlés gomb
 *
 * A megjegyzés szekció a [2] Beadás panel gm-comment-section komponensében jelenik meg.
 *
 * API végpontok:
 *   GET    /api/v1/applications/{id}/comments?stepId={stepId}  → CommentDto[]
 *   POST   /api/v1/applications/{id}/comments                  → CommentDto
 *   PUT    /api/v1/applications/{id}/comments/{commentId}      → CommentDto
 *   DELETE /api/v1/applications/{id}/comments/{commentId}
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'cccccccc-1111-0000-0000-000000000014';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_ID = 'step-cm-00-0000-0000-000000000002';

// JWT-ben a PalyazatiMunkatars user ID-je (UUID — sub claim a JWT-ben)
const MUNKATARS_USER_ID = '00000000-0000-0000-0000-000000000003';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000099';

// ─── Mock megjegyzés adatok ───────────────────────────────────────────────────

const COMMENT_OWN = {
  id: 'comment-00-0000-0000-000000000001',
  applicationId: APP_ID,
  workflowStepId: STEP_ID,
  authorId: MUNKATARS_USER_ID,
  authorName: 'Teszt Munkatárs',
  authorAvatarUrl: null,
  body: 'Ez egy teszt megjegyzés.',
  isDeleted: false,
  createdAt: '2026-05-15T10:00:00Z',
  updatedAt: '2026-05-15T10:00:00Z',
};

const COMMENT_OTHER = {
  ...COMMENT_OWN,
  id: 'comment-00-0000-0000-000000000002',
  authorId: OTHER_USER_ID,
  authorName: 'Másik Felhasználó',
  body: 'Más felhasználó megjegyzése.',
};

const COMMENT_NEW = {
  ...COMMENT_OWN,
  id: 'comment-00-0000-0000-000000000003',
  body: 'Újonnan hozzáadott megjegyzés.',
};

const COMMENT_EDITED = {
  ...COMMENT_OWN,
  body: 'Szerkesztett megjegyzés szövege.',
  updatedAt: '2026-05-16T10:00:00Z',
};

// ─── Mock ApplicationDetail + Workflow ───────────────────────────────────────

function makeSteps() {
  return [
    {
      id: 'step-cm-00-0000-0000-000000000001',
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
        id: `step-cm-00-0000-0000-00000000000${i + 3}`,
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
  title: 'Megjegyzés Teszt Pályázat',
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
  comments: object[] = [],
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(APP_ACTIVE));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/comments**`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(comments));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/emails**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/documents**`, (route) =>
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

// ─── TS-130 | Megjegyzés hozzáadása ──────────────────────────────────────────

test.describe('TS-130 | Megjegyzés hozzáadása', () => {
  test('Munkatárs megjegyzést ad hozzá – megjelenik a listában', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, []);

    // POST /comments → visszaadja az új megjegyzést
    await page.route(`**/api/v1/applications/${APP_ID}/comments`, (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(COMMENT_NEW));
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    // "Megjegyzés hozzáadása" gomb látható
    const addBtn = commentSection.getByRole('button', { name: /megjegyzés hozzáadása/i });
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();

    // Beviteli forma megjelenik
    const addForm = commentSection.locator('.add-form');
    await expect(addForm).toBeVisible({ timeout: 3_000 });

    // Szöveg beírása
    const textarea = addForm.locator('textarea');
    await textarea.fill('Újonnan hozzáadott megjegyzés.');

    // Küldés gomb aktív
    const sendBtn = addForm.getByRole('button', { name: /küldés/i });
    await expect(sendBtn).toBeEnabled({ timeout: 3_000 });
    await sendBtn.click();

    // Megjegyzés megjelenik a listában
    await expect(commentSection.getByText('Újonnan hozzáadott megjegyzés.')).toBeVisible({ timeout: 8_000 });
    // Forma bezárul
    await expect(addForm).not.toBeVisible({ timeout: 3_000 });
  });

  test('Küldés gomb le van tiltva üres szöveg esetén', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    await commentSection.getByRole('button', { name: /megjegyzés hozzáadása/i }).click();
    const addForm = commentSection.locator('.add-form');
    await expect(addForm).toBeVisible({ timeout: 3_000 });

    // Üres textarea → Küldés tiltva
    const sendBtn = addForm.getByRole('button', { name: /küldés/i });
    await expect(sendBtn).toBeDisabled();
  });

  test('Megjegyzés megjelenik chat-szerű elrendezésben – szerző neve látható', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [COMMENT_OWN]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    await expect(commentSection.getByText('Ez egy teszt megjegyzés.')).toBeVisible({ timeout: 5_000 });
    await expect(commentSection.getByText('Teszt Munkatárs')).toBeVisible();
    // A .comment-bubble megjelenik
    await expect(commentSection.locator('.comment-bubble').first()).toBeVisible();
  });
});

// ─── TS-131 | Saját megjegyzés szerkesztése és törlése ───────────────────────

test.describe('TS-131 | Saját megjegyzés szerkesztése és törlése', () => {
  test('Saját megjegyzés szerkeszthető – szerkesztés gomb látható, tartalom frissül', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [COMMENT_OWN]);

    await page.route(`**/api/v1/applications/${APP_ID}/comments/${COMMENT_OWN.id}`, (route) => {
      if (route.request().method() === 'PUT') return route.fulfill(ok(COMMENT_EDITED));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    // Saját megjegyzés látható
    await expect(commentSection.getByText('Ez egy teszt megjegyzés.')).toBeVisible({ timeout: 5_000 });

    // Szerkesztés gomb (edit icon, matTooltip="Szerkesztés") látható
    const bubble = commentSection.locator('.comment-bubble').first();
    const editBtn = bubble.locator('.comment-actions button').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Szerkesztő forma megjelenik előre kitöltve
    const editForm = bubble.locator('.edit-form');
    await expect(editForm).toBeVisible({ timeout: 3_000 });
    const editTextarea = editForm.locator('textarea');
    await expect(editTextarea).toHaveValue('Ez egy teszt megjegyzés.');

    // Szöveg módosítása
    await editTextarea.clear();
    await editTextarea.fill('Szerkesztett megjegyzés szövege.');

    // Mentés
    const saveBtn = editForm.getByRole('button', { name: /mentés/i });
    await saveBtn.click();

    // Frissített tartalom megjelenik
    await expect(commentSection.getByText('Szerkesztett megjegyzés szövege.')).toBeVisible({ timeout: 8_000 });
    // Szerkesztő forma eltűnik
    await expect(editForm).not.toBeVisible({ timeout: 3_000 });
  });

  test('Saját megjegyzés törölhető – Törlés gomb látható, ConfirmDialog, tartalom lecserélődik', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [COMMENT_OWN]);

    await page.route(`**/api/v1/applications/${APP_ID}/comments/${COMMENT_OWN.id}`, (route) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204, body: '' });
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    await expect(commentSection.getByText('Ez egy teszt megjegyzés.')).toBeVisible({ timeout: 5_000 });

    // Törlés gomb látható (warn color, második gomb a comment-actions-ban)
    const bubble = commentSection.locator('.comment-bubble').first();
    const deleteBtn = bubble.locator('.comment-actions button[color="warn"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // ConfirmDialog megnyílik
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText('Megjegyzés törlése')).toBeVisible();

    // Megerősítés
    await dialog.getByRole('button', { name: /^törlés$/i }).click();

    // "[Megjegyzés törölve]" megjelenik
    await expect(commentSection.getByText('[Megjegyzés törölve]')).toBeVisible({ timeout: 8_000 });
  });

  test('Mégse gomb visszaállítja a szerkesztési állapotot', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [COMMENT_OWN]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    await expect(commentSection.getByText('Ez egy teszt megjegyzés.')).toBeVisible({ timeout: 5_000 });

    // Szerkesztés megnyitása
    const bubble = commentSection.locator('.comment-bubble').first();
    await bubble.locator('.comment-actions button').first().click();
    await expect(bubble.locator('.edit-form')).toBeVisible({ timeout: 3_000 });

    // Mégse
    await bubble.locator('.edit-form').getByRole('button', { name: /mégse/i }).click();

    // Forma eltűnik, eredeti szöveg marad
    await expect(bubble.locator('.edit-form')).not.toBeVisible({ timeout: 3_000 });
    await expect(commentSection.getByText('Ez egy teszt megjegyzés.')).toBeVisible();
  });
});

// ─── TS-132 | Más felhasználó megjegyzésénél nincs szerkesztés/törlés ─────────

test.describe('TS-132 | Más felhasználó megjegyzésének szerkesztési kísérlete', () => {
  test('Más felhasználó megjegyzésénél nincs szerkesztés/törlés gomb – Munkatárs', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, [COMMENT_OTHER]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    await expect(commentSection.getByText('Más felhasználó megjegyzése.')).toBeVisible({ timeout: 5_000 });

    // Nincs .comment-actions div más felhasználó megjegyzésénél
    const bubble = commentSection.locator('.comment-bubble').first();
    await expect(bubble.locator('.comment-actions')).not.toBeVisible();
  });

  test('Admin látja a szerkesztés/törlés gombokat más felhasználó megjegyzésénél is', async ({ adminPage: page }) => {
    await mockDetailPage(page, [COMMENT_OTHER]);

    await page.route(`**/api/v1/applications/${APP_ID}/comments/${COMMENT_OTHER.id}`, (route) => {
      if (route.request().method() === 'DELETE') return route.fulfill({ status: 204, body: '' });
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);
    const commentSection = panel.locator('gm-comment-section');

    await expect(commentSection.getByText('Más felhasználó megjegyzése.')).toBeVisible({ timeout: 5_000 });

    // Admin látja a comment-actions-t
    const bubble = commentSection.locator('.comment-bubble').first();
    await expect(bubble.locator('.comment-actions')).toBeVisible();

    // Törlés gomb látható
    const deleteBtn = bubble.locator('.comment-actions button[color="warn"]');
    await expect(deleteBtn).toBeVisible();

    // Admin töröl
    await deleteBtn.click();
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: /^törlés$/i }).click();

    // "[Megjegyzés törölve]" megjelenik
    await expect(commentSection.getByText('[Megjegyzés törölve]')).toBeVisible({ timeout: 8_000 });
  });
});
