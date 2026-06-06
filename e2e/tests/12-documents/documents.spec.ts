/**
 * 12. kategória – Dokumentumkezelés
 * Forgatókönyvek: TS-110, TS-111, TS-112, TS-113, TS-114, TS-115
 *
 * Stratégia:
 *  - TS-110: Munkatárs PDF feltöltése → "Dokumentum feltöltve." snackbar, dok. listában megjelenik
 *  - TS-111: Nem engedélyezett formátum (.exe) → hibaüzenet snackbar
 *  - TS-112: 50 MB-nál nagyobb fájl → hibaüzenet snackbar
 *  - TS-113: Letöltés gomb kattintással a fájl letöltése megindul (blob trigger)
 *  - TS-114: JPG előnézet → lightbox megnyílik, bezárható X-szel
 *  - TS-115: Verzióelőzmények megtekintése; archivált verzió letölthető
 *
 * A dokumentum komponensek a [2] Beadás panelban kerülnek tesztelésre
 * (step-submission.component.html: gm-document-upload + gm-document-list)
 *
 * API végpontok:
 *   GET   /api/v1/applications/{id}/documents?includeArchived=true&stepId={stepId}
 *   POST  /api/v1/applications/{id}/documents          (multipart, reportProgress)
 *   GET   /api/v1/applications/{id}/documents/{docId}/download  → Blob
 *   GET   /api/v1/applications/{id}/documents/{docId}/versions  → DocumentVersionDto[]
 *   PATCH /api/v1/applications/{id}/documents/{docId}/archive
 *
 * Panel label: "[2] Beadás"
 */

import { test, expect } from '../../fixtures/auth.fixture';
import { HttpEventType } from '@playwright/test';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'ffffffff-0000-0000-0000-000000000012';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_SUBMISSION_ID = 'step-doc-00-0000-0000-000000000002';

// ─── Mock dokumentumok ────────────────────────────────────────────────────────

const DOC_PDF = {
  id: 'doc-00000-0000-0000-000000000001',
  workflowStepId: STEP_SUBMISSION_ID,
  documentType: 'SubmissionDocument',
  displayName: 'Pályázati dokumentáció',
  fileName: 'palyazat.pdf',
  fileSizeBytes: 102_400,
  contentType: 'application/pdf',
  version: 1,
  isArchived: false,
  previousVersionId: null,
  uploadedByName: 'Teszt Munkatárs',
  uploadedAt: '2026-06-01T10:00:00Z',
};

const DOC_IMAGE = {
  id: 'doc-00000-0000-0000-000000000002',
  workflowStepId: STEP_SUBMISSION_ID,
  documentType: 'Other',
  displayName: null,
  fileName: 'kepek.jpg',
  fileSizeBytes: 51_200,
  contentType: 'image/jpeg',
  version: 1,
  isArchived: false,
  previousVersionId: null,
  uploadedByName: 'Teszt Munkatárs',
  uploadedAt: '2026-06-01T11:00:00Z',
};

const DOC_PDF_V2 = {
  ...DOC_PDF,
  id: 'doc-00000-0000-0000-000000000003',
  version: 2,
  previousVersionId: DOC_PDF.id,
};

const VERSION_HISTORY = [
  {
    id: DOC_PDF.id,
    version: 1,
    fileName: 'palyazat.pdf',
    displayName: 'Pályázati dokumentáció',
    uploadedAt: '2026-06-01T10:00:00Z',
    uploadedByName: 'Teszt Munkatárs',
    isArchived: true,
  },
];

// ─── Workflow lépések ─────────────────────────────────────────────────────────

function makeSteps() {
  return [
    {
      id: 'step-doc-00-0000-0000-000000000001',
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
      id: STEP_SUBMISSION_ID,
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
    ...['Result', 'Contract', 'BudgetPlan', 'VendorContracts', 'Invoices', 'Proof', 'Settlement'].map((type, i) => ({
      id: `step-doc-00-0000-0000-00000000000${i + 3}`,
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
    })),
  ];
}

// ─── Mock ApplicationDetail ───────────────────────────────────────────────────

const APP_ACTIVE: object = {
  id: APP_ID,
  title: 'Dokumentum Teszt Pályázat',
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

function minimalJpegBuffer(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xfb, 0xd5, 0xff, 0xd9,
  ]);
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
  docs: object[] = [],
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/documents**`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(docs));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/comments**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/emails**`, (route) =>
    route.fulfill(ok([])),
  );
  await page.route('**/api/v1/codelists**', (route) => route.fulfill(ok([])));
}

/** A [2] Beadás panel locatora */
function submissionPanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({
      has: page
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[2\] Beadás/i }),
    });
}

/** Kibontja a [2] Beadás panelt, ha zárt */
async function expandSubmissionPanel(page: import('@playwright/test').Page): Promise<void> {
  const panel = submissionPanel(page);
  const header = panel.locator('mat-expansion-panel-header');
  const isExpanded = await header.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await header.click();
    await expect(panel).toHaveClass(/mat-expanded/, { timeout: 5_000 });
  }
}

// ─── TS-110 | Dokumentum feltöltése – sikeres eset ───────────────────────────

test.describe('TS-110 | Dokumentum feltöltése – sikeres eset', () => {
  test('Munkatárs sikeresen tölt fel PDF dokumentumot', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    // POST documents → visszaadja az új dokumentumot
    await page.route(`**/api/v1/applications/${APP_ID}/documents`, (route) => {
      if (route.request().method() === 'POST') return route.fulfill(ok(DOC_PDF));
      if (route.request().method() === 'GET') return route.fulfill(ok([]));
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    // "Dokumentum hozzáadása" gomb látható
    const addBtn = panel.getByRole('button', { name: /dokumentum hozzáadása/i });
    await expect(addBtn).toBeVisible({ timeout: 5_000 });
    await addBtn.click();

    // Form megnyílt
    await expect(panel.getByText('Dokumentum feltöltése')).toBeVisible({ timeout: 3_000 });

    // Dokumentum típusa: SubmissionDocument (Beadási dokumentum)
    await panel.locator('mat-select[formcontrolname="documentType"]').click();
    const option = page.locator('mat-option').filter({ hasText: /beadási dokumentum/i });
    await expect(option).toBeVisible();
    await option.click();

    // Megjelenítési név kitöltése
    await panel.locator('input[formcontrolname="displayName"]').fill('Pályázati dokumentáció');

    // Fájl kiválasztása
    const fileInput = panel.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'palyazat.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test content'),
    });

    // Fájlnév megjelenik
    await expect(panel.getByText('palyazat.pdf')).toBeVisible({ timeout: 3_000 });

    // Feltöltés gomb engedélyezett
    const uploadBtn = panel.getByRole('button', { name: /^feltöltés$/i });
    await expect(uploadBtn).toBeEnabled({ timeout: 3_000 });
    await uploadBtn.click();

    // Sikeres snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Dokumentum feltöltve.', { timeout: 8_000 });

    // Dokumentum megjelenik a listában (a refresh után a mock visszaadja)
    await page.route(`**/api/v1/applications/${APP_ID}/documents**`, (route) =>
      route.fulfill(ok([DOC_PDF])),
    );
    // A form bezárul feltöltés után
    await expect(panel.getByText('Dokumentum feltöltése')).not.toBeVisible({ timeout: 5_000 });
  });

  test('Feltöltés gomb le van tiltva, ha nincs fájl kiválasztva', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await panel.getByRole('button', { name: /dokumentum hozzáadása/i }).click();
    await expect(panel.getByText('Dokumentum feltöltése')).toBeVisible({ timeout: 3_000 });

    // Nincs fájl → Feltöltés le van tiltva
    const uploadBtn = panel.getByRole('button', { name: /^feltöltés$/i });
    await expect(uploadBtn).toBeDisabled();
  });

  test('Mégse gomb bezárja a feltöltő formuzt', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await panel.getByRole('button', { name: /dokumentum hozzáadása/i }).click();
    await expect(panel.getByText('Dokumentum feltöltése')).toBeVisible({ timeout: 3_000 });

    await panel.getByRole('button', { name: /^mégse$/i }).click();
    await expect(panel.getByText('Dokumentum feltöltése')).not.toBeVisible({ timeout: 3_000 });
    // Gomb visszajön
    await expect(panel.getByRole('button', { name: /dokumentum hozzáadása/i })).toBeVisible();
  });
});

// ─── TS-111 | Nem engedélyezett fájlformátum elutasítása ─────────────────────

test.describe('TS-111 | Nem engedélyezett fájlformátum elutasítása', () => {
  test('.exe fájl feltöltéskor hibaüzenet jelenik meg', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await panel.getByRole('button', { name: /dokumentum hozzáadása/i }).click();
    await expect(panel.getByText('Dokumentum feltöltése')).toBeVisible({ timeout: 3_000 });

    const fileInput = panel.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'virus.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ test'),
    });

    // Hibaüzenet snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Nem támogatott fájlformátum', { timeout: 8_000 });
    await expect(snack).toContainText('PDF, DOCX, XLSX, JPG, PNG, TIFF, MSG, EML');

    // Feltöltés gomb még mindig le van tiltva (nincs kiválasztott érvényes fájl)
    const uploadBtn = panel.getByRole('button', { name: /^feltöltés$/i });
    await expect(uploadBtn).toBeDisabled();
  });

  test('.txt fájl feltöltéskor hibaüzenet jelenik meg', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await panel.getByRole('button', { name: /dokumentum hozzáadása/i }).click();
    await expect(panel.getByText('Dokumentum feltöltése')).toBeVisible({ timeout: 3_000 });

    const fileInput = panel.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('some text'),
    });

    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Nem támogatott fájlformátum', { timeout: 8_000 });
  });
});

// ─── TS-112 | 50 MB-os fájlméret korlát ──────────────────────────────────────

test.describe('TS-112 | 50 MB-os fájlméret korlát', () => {
  test('50 MB-nál nagyobb PDF feltöltésekor hibaüzenet jelenik meg', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await panel.getByRole('button', { name: /dokumentum hozzáadása/i }).click();
    await expect(panel.getByText('Dokumentum feltöltése')).toBeVisible({ timeout: 3_000 });

    // 55 MB-os szintetikus File objektum (page.evaluate-val, mert Playwright
    // nem enged 50 MB-nál nagyobb buffert setInputFiles-ban)
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      const fileInput = Array.from(inputs).find(
        (el) => (el as HTMLInputElement).accept.includes('.pdf'),
      ) as HTMLInputElement | undefined;
      if (!fileInput) return;
      const smallBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      const file = new File([smallBlob], 'huge.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 55 * 1024 * 1024 });
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Hibaüzenet snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('A fájl mérete nem lehet nagyobb 50 MB-nál', { timeout: 8_000 });

    // Feltöltés le van tiltva
    const uploadBtn = panel.getByRole('button', { name: /^feltöltés$/i });
    await expect(uploadBtn).toBeDisabled();
  });
});

// ─── TS-113 | Dokumentum letöltése ───────────────────────────────────────────

test.describe('TS-113 | Dokumentum letöltése', () => {
  test('Letöltés gomb kattintáskor a download endpoint meghívódik', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_PDF]);

    let downloadCalled = false;
    await page.route(`**/api/v1/applications/${APP_ID}/documents/${DOC_PDF.id}/download`, (route) => {
      downloadCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4 test'),
      });
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    // Dokumentum megjelenik a listában
    await expect(panel.getByText('Pályázati dokumentáció')).toBeVisible({ timeout: 5_000 });

    // Letöltés gomb (mat-icon-button matTooltip="Letöltés")
    // Az első dokumentum sorának első akció gombja a letöltés
    const docItem = panel.locator('.dl-item').first();
    const downloadBtn = docItem.locator('button').first();
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();

    // Endpoint meghívódott
    await expect.poll(() => downloadCalled, { timeout: 5_000 }).toBe(true);
  });

  test('Dokumentum neve és mérete megjelenik a listában', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_PDF]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    // Megjelenítési név látható
    await expect(panel.getByText('Pályázati dokumentáció')).toBeVisible({ timeout: 5_000 });

    // Fájlméret látható (100 KB)
    await expect(panel.getByText(/100\.0 KB/)).toBeVisible();

    // Feltöltő neve látható
    await expect(panel.getByText('Teszt Munkatárs')).toBeVisible();

    // Verzió látható
    await expect(panel.getByText(/v1/)).toBeVisible();
  });

  test('Üres dokumentum lista esetén üzenet megjelenik', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await expect(panel.getByText('Ehhez a lépéshez még nincs dokumentum.')).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-114 | Kép előnézet lightbox ──────────────────────────────────────────

test.describe('TS-114 | Kép előnézet lightbox', () => {
  test('JPG kép Előnézet gombjára kattintva lightbox nyílik meg', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_IMAGE]);

    // Mock a kép blob letöltéshez
    await page.route(
      `**/api/v1/applications/${APP_ID}/documents/${DOC_IMAGE.id}/download`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'image/jpeg',
          body: minimalJpegBuffer(),
        }),
    );

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    // JPG dokumentum megjelenik
    await expect(panel.getByText('kepek.jpg')).toBeVisible({ timeout: 5_000 });

    // Előnézet gomb (2. gomb a sor akcióiban, mat-icon: image)
    const docItem = panel.locator('.dl-item').first();
    // Előnézet gomb: a download után következik
    const previewBtn = docItem.locator('button').nth(1);
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Lightbox megnyílik
    const lightbox = page.locator('.dl-lightbox-overlay');
    await expect(lightbox).toBeVisible({ timeout: 8_000 });

    // Kép látható a lightboxban
    await expect(page.locator('.dl-lightbox-img')).toBeVisible();

    // Bezárás gomb látható
    const lightboxContent = page.locator('.dl-lightbox-content');
    const closeBtn = lightboxContent.locator('button').last();
    await expect(closeBtn).toBeVisible();

    // Bezárás gombra kattintva lightbox eltűnik
    await closeBtn.click();
    await expect(lightbox).not.toBeVisible({ timeout: 5_000 });
  });

  test('Lightbox az overlay-re kattintva bezárható', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_IMAGE]);

    await page.route(
      `**/api/v1/applications/${APP_ID}/documents/${DOC_IMAGE.id}/download`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'image/jpeg',
          body: minimalJpegBuffer(),
        }),
    );

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await expect(panel.getByText('kepek.jpg')).toBeVisible({ timeout: 5_000 });

    const docItem = panel.locator('.dl-item').first();
    await docItem.locator('button').nth(1).click();

    const lightbox = page.locator('.dl-lightbox-overlay');
    await expect(lightbox).toBeVisible({ timeout: 8_000 });

    // Overlay kattintás (page.evaluate, mert sidenav elfedi)
    await page.evaluate(() => {
      const el = document.querySelector('.dl-lightbox-overlay') as HTMLElement;
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(lightbox).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── TS-115 | Dokumentum verziókezelés ───────────────────────────────────────

test.describe('TS-115 | Dokumentum verziókezelés', () => {
  test('Verzióelőzmények megtekinthető és archivált verzió látható', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_PDF_V2]);

    // Mock versions endpoint
    await page.route(
      `**/api/v1/applications/${APP_ID}/documents/${DOC_PDF_V2.id}/versions`,
      (route) => route.fulfill(ok(VERSION_HISTORY)),
    );

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    // v2 dokumentum megjelenik
    await expect(panel.getByText('Pályázati dokumentáció')).toBeVisible({ timeout: 5_000 });
    await expect(panel.getByText(/v2/)).toBeVisible();

    // Verzióelőzmények gomb kattintás (history ikon gomb)
    const docItem = panel.locator('.dl-item').first();
    // History gomb: download (0), preview (1), history (2)
    const historyBtn = docItem.locator('button').nth(2);
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();

    // Verzióelőzmények panel megjelenik
    const versionsSection = panel.locator('.dl-versions');
    await expect(versionsSection).toBeVisible({ timeout: 5_000 });
    await expect(versionsSection.getByText('Verzióelőzmények')).toBeVisible();

    // v1 verzió látható archivált jelzővel
    await expect(versionsSection.getByText(/v1/)).toBeVisible();
    await expect(versionsSection.getByText('Archivált')).toBeVisible();

    // Verzió letöltés gombja látható
    const versionDownloadBtn = versionsSection.locator('button');
    await expect(versionDownloadBtn).toBeVisible();
  });

  test('Verzióelőzmények panel újra kattintásra becsukódik', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_PDF_V2]);

    await page.route(
      `**/api/v1/applications/${APP_ID}/documents/${DOC_PDF_V2.id}/versions`,
      (route) => route.fulfill(ok(VERSION_HISTORY)),
    );

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await expect(panel.getByText('Pályázati dokumentáció')).toBeVisible({ timeout: 5_000 });

    const docItem = panel.locator('.dl-item').first();
    const historyBtn = docItem.locator('button').nth(2);

    // Megnyitás
    await historyBtn.click();
    await expect(panel.locator('.dl-versions')).toBeVisible({ timeout: 5_000 });

    // Bezárás ugyanazzal a gombbal
    await historyBtn.click();
    await expect(panel.locator('.dl-versions')).not.toBeVisible({ timeout: 3_000 });
  });

  test('Ha nincs korábbi verzió, üzenet megjelenik', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_ACTIVE, [DOC_PDF]);

    await page.route(
      `**/api/v1/applications/${APP_ID}/documents/${DOC_PDF.id}/versions`,
      (route) => route.fulfill(ok([])),
    );

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandSubmissionPanel(page);
    const panel = submissionPanel(page);

    await expect(panel.getByText('Pályázati dokumentáció')).toBeVisible({ timeout: 5_000 });

    const docItem = panel.locator('.dl-item').first();
    const historyBtn = docItem.locator('button').nth(2);
    await historyBtn.click();

    const versionsSection = panel.locator('.dl-versions');
    await expect(versionsSection).toBeVisible({ timeout: 5_000 });
    await expect(versionsSection.getByText('Nincs korábbi verzió.')).toBeVisible();
  });
});
