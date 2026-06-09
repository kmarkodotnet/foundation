/**
 * 10. kategória – Esemény és teljesítés igazolása
 * Forgatókönyvek: TS-090, TS-091, TS-092
 *
 * Stratégia:
 *  - TS-090: Munkatárs, Proof lépés Active, sikeres igazolás rögzítése fotóval
 *  - TS-091: Fotó nélkül a Mentés gomb le van tiltva
 *  - TS-092: Thumbnail kattintásra lightbox nyílik, Bezárás gombbal zárható
 *
 * API végpontok:
 *   GET  /api/v1/applications/{id}/proof-records        → ProofRecordDto[]
 *   POST /api/v1/applications/{id}/proof-records        → ProofRecordDto
 *   GET  /api/v1/applications/{id}/proof-records/{rid}/photos/{pid} → Blob
 *   GET  /api/v1/applications/{id}/proof-records/{rid}/photos/download-all → Blob (ZIP)
 *
 * Panel label: "[8] Teljesítés igazolása"
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Konstansok ──────────────────────────────────────────────────────────────

const APP_ID = 'dddddddd-0000-0000-0000-000000000010';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
const STEP_PROOF_ID = 'step-p-000-0000-0000-000000000008';
const RECORD_ID = 'record-00-0000-0000-000000000001';
const PHOTO_ID = 'photo-000-0000-0000-000000000001';

// ─── Mock adatok ──────────────────────────────────────────────────────────────

const MOCK_PHOTO: object = {
  id: PHOTO_ID,
  fileName: 'test.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 12345,
};

const MOCK_RECORD: object = {
  id: RECORD_ID,
  applicationId: APP_ID,
  proofType: 'Event',
  eventDate: '2026-05-20',
  description: null,
  photos: [MOCK_PHOTO],
  createdAt: '2026-05-20T10:00:00Z',
  createdByUserName: 'Teszt Munkatárs',
};

const MOCK_RECORD_ASSET: object = {
  id: 'record-00-0000-0000-000000000002',
  applicationId: APP_ID,
  proofType: 'Asset',
  eventDate: '2026-05-25',
  description: 'Eszközbeszerzés',
  photos: [],
  createdAt: '2026-05-25T10:00:00Z',
  createdByUserName: 'Teszt Munkatárs',
};

// ─── Workflow lépések ─────────────────────────────────────────────────────────

function makeSteps(proofStatus = 'Active') {
  const completed = (type: string, order: number) => ({
    id: `step-p-000-0000-0000-00000000000${order}`,
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
    {
      id: STEP_PROOF_ID,
      stepType: 'Proof',
      status: proofStatus,
      order: 8,
      isSkippable: true,
      skippedReason: null,
      completedAt: proofStatus === 'Completed' ? '2026-06-01T10:00:00Z' : null,
      completedByUserName: proofStatus === 'Completed' ? 'Teszt Munkatárs' : null,
      approvedAt: null,
      approvedByUserName: null,
      rejectionNote: null,
    },
    {
      id: 'step-p-000-0000-0000-000000000009',
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

// ─── Mock ApplicationDetail ───────────────────────────────────────────────────

const APP_WON: object = {
  id: APP_ID,
  title: 'Igazolás Teszt Pályázat',
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

// ─── Segédfüggvények ──────────────────────────────────────────────────────────

function ok(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

// Minimal 1×1 pixel JPEG as ArrayBuffer for photo blob mock
function minimalJpegBuffer(): Buffer {
  // 1×1 pixel white JPEG
  const jpegBytes = Buffer.from([
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
    0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
    0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8a, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3, 0xa4,
    0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7,
    0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca,
    0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2, 0xe3,
    0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5,
    0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00,
    0x00, 0x3f, 0x00, 0xfb, 0xd5, 0xff, 0xd9,
  ]);
  return jpegBytes;
}

async function mockDetailPage(
  page: import('@playwright/test').Page,
  appData: object,
  proofRecords: object[] = [],
): Promise<void> {
  await page.route(`**/api/v1/applications/${APP_ID}`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(appData));
    return route.continue();
  });
  await page.route(`**/api/v1/applications/${APP_ID}/proof-records`, (route) => {
    if (route.request().method() === 'GET') return route.fulfill(ok(proofRecords));
    return route.continue();
  });
  await page.route(
    `**/api/v1/applications/${APP_ID}/proof-records/*/photos/*`,
    (route) => {
      const url = route.request().url();
      if (url.includes('download-all')) return route.continue();
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'image/jpeg',
          body: minimalJpegBuffer(),
        });
      }
      return route.continue();
    },
  );
  await page.route(
    `**/api/v1/applications/${APP_ID}/proof-records/*/photos/download-all`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/zip',
        body: Buffer.from('PK'),
      }),
  );
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
  await page.route(`**/api/v1/applications/${APP_ID}/invoices**`, (route) =>
    route.fulfill(
      ok({ items: [], summary: { awardedAmount: 0, totalPlanned: 0, totalInvoiced: 0, totalPaid: 0, totalUnpaid: 0, balance: 0 } }),
    ),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/budget-plan`, (route) =>
    route.fulfill(ok({ items: [], totalPlanned: 0, awardedAmount: 1_000_000, difference: 1_000_000 })),
  );
  await page.route(`**/api/v1/applications/${APP_ID}/vendor-contracts**`, (route) =>
    route.fulfill(ok([])),
  );
}

/** A [8] Teljesítés igazolása panel locatora */
function proofPanel(page: import('@playwright/test').Page) {
  return page
    .locator('mat-expansion-panel')
    .filter({
      has: page
        .locator('mat-expansion-panel-header')
        .filter({ hasText: /\[8\] Teljesítés igazolása/i }),
    });
}

/** Kibontja a [8] Teljesítés igazolása panelt, ha zárt */
async function expandProofPanel(page: import('@playwright/test').Page): Promise<void> {
  const panel = proofPanel(page);
  const header = panel.locator('mat-expansion-panel-header');
  const isExpanded = await header.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await header.click();
    await expect(panel).toHaveClass(/mat-expanded/, { timeout: 5_000 });
  }
}

// ─── TS-090 | Igazolás rögzítése fotóval ─────────────────────────────────────

test.describe('TS-090 | Igazolás rögzítése fotóval – sikeres eset', () => {
  test('Munkatárs sikeresen rögzít igazolást 1 fotóval', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    // Override POST proof-records to return the new record
    await page.route(`**/api/v1/applications/${APP_ID}/proof-records`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok(MOCK_RECORD));
      }
      if (route.request().method() === 'GET') {
        return route.fulfill(ok([]));
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    // Kibontja a panelt
    await expandProofPanel(page);
    const panel = proofPanel(page);

    // Üres állapot látható
    await expect(panel.getByText('Még nem rögzítettünk igazolást.')).toBeVisible();

    // Igazolás hozzáadása gomb látható
    const addBtn = panel.getByRole('button', { name: /igazolás hozzáadása/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Dialog megnyílik
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Igazolás rögzítése')).toBeVisible();

    // Típus kiválasztása: Esemény
    await dialog.locator('mat-select[formcontrolname="proofType"]').click();
    const option = page.locator('mat-option').filter({ hasText: /^Esemény$/ });
    await expect(option).toBeVisible();
    await option.click();

    // Esemény dátuma kitöltése
    const dateInput = dialog.locator('input[formcontrolname="eventDate"]');
    await dateInput.fill('2026-05-20');
    await dateInput.press('Tab');

    // Fotó csatolása
    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: minimalJpegBuffer(),
    });

    // A fájl megjelenik a listában
    await expect(dialog.getByText('test.jpg')).toBeVisible();

    // Mentés gomb engedélyezett
    const saveBtn = dialog.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // Sikeres snackbar
    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Igazolás sikeresen rögzítve.', { timeout: 8_000 });

    // Dialog bezárul
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // Az igazolás megjelenik a panelban (Esemény típus)
    await expect(panel.getByText('Esemény')).toBeVisible({ timeout: 5_000 });
  });

  test('Igazolás hozzáadása gomb nem látható olvasó szerepkörű felhasználónak', async ({ megtekintosPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    // Gomb nem látható
    await expect(panel.getByRole('button', { name: /igazolás hozzáadása/i })).not.toBeVisible();
  });
});

// ─── TS-091 | Igazolás mentése fotó nélkül – tiltva ─────────────────────────

test.describe('TS-091 | Igazolás mentése fotó nélkül – tiltva', () => {
  test('Mentés gomb le van tiltva, ha nincs feltöltött fotó', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    const addBtn = panel.getByRole('button', { name: /igazolás hozzáadása/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    // Típus kiválasztása
    await dialog.locator('mat-select[formcontrolname="proofType"]').click();
    const option = page.locator('mat-option').filter({ hasText: /^Esemény$/ });
    await expect(option).toBeVisible();
    await option.click();

    // Dátum megadása
    const dateInput = dialog.locator('input[formcontrolname="eventDate"]');
    await dateInput.fill('2026-05-20');
    await dateInput.press('Tab');

    // Nincs feltöltött fotó → Mentés gomb le van tiltva
    const saveBtn = dialog.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeDisabled();

    // Megjelenik az üzenet hogy fotó szükséges
    await expect(dialog.getByText(/legalább egy fotó szükséges/i)).toBeVisible();
  });

  test('Mentés gomb le van tiltva, ha a form is üres', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    await panel.getByRole('button', { name: /igazolás hozzáadása/i }).click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    // Üres form + nincs fotó → Mentés le van tiltva
    const saveBtn = dialog.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('Hibás fájlformátum esetén hibaüzenet jelenik meg', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    await panel.getByRole('button', { name: /igazolás hozzáadása/i }).click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test'),
    });

    // Hibaüzenet megjelenik
    await expect(dialog.getByText(/ez a fájlformátum nem támogatott/i)).toBeVisible();

    // Mentés még mindig le van tiltva (nincs érvényes fotó)
    const saveBtn = dialog.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeDisabled();
  });
});

// ─── TS-092 | Fotó lightbox előnézet ─────────────────────────────────────────

test.describe('TS-092 | Fotó lightbox előnézet', () => {
  test('Thumbnail kattintásra lightbox megnyílik és bezárható', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, [MOCK_RECORD]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    // Rekord kártya megjelenik
    await expect(panel.getByText('Esemény')).toBeVisible({ timeout: 5_000 });

    // Várjuk meg, hogy a thumbnail img betöltődjön (a blob URL beállítódjon)
    // openLightbox() csak akkor nyit, ha thumbnailUrls().get(photo.id) már be van állítva
    const thumbnailImg = panel.locator('.thumbnail-img').first();
    await expect(thumbnailImg).toBeVisible({ timeout: 8_000 });

    // Kattintás a thumbnail-wrapper-re (ami az img-t körülveszi)
    await panel.locator('.thumbnail-wrapper').first().click();

    // Lightbox megnyílik
    const lightbox = page.locator('.lightbox-overlay');
    await expect(lightbox).toBeVisible({ timeout: 5_000 });

    // Lightbox tartalom látható
    const lightboxContent = page.locator('.lightbox-content');
    await expect(lightboxContent).toBeVisible();

    // Lightbox control gombok láthatók (mat-icon-button, az ikon szöveggel azonosítva)
    // Sorrend: chevron_left | download | chevron_right | close
    const controls = lightboxContent.locator('.lightbox-controls button');
    await expect(controls).toHaveCount(4);

    // Letöltés gomb (2. gomb, index 1)
    const downloadBtn = controls.nth(1);
    await expect(downloadBtn).toBeVisible();

    // Bezárás gomb (utolsó gomb)
    const closeBtn = controls.last();
    await expect(closeBtn).toBeVisible();

    // Bezárás gombbal bezárul
    await closeBtn.click();
    await expect(lightbox).not.toBeVisible({ timeout: 5_000 });
  });

  test('Lightbox overlay kattintásra bezárható', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, [MOCK_RECORD]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    await expect(panel.getByText('Esemény')).toBeVisible({ timeout: 5_000 });

    // Várjuk a thumbnail img megjelenését (blob URL betöltés)
    const thumbnailImg = panel.locator('.thumbnail-img').first();
    await expect(thumbnailImg).toBeVisible({ timeout: 8_000 });
    await panel.locator('.thumbnail-wrapper').first().click();

    const lightbox = page.locator('.lightbox-overlay');
    await expect(lightbox).toBeVisible({ timeout: 5_000 });

    // Az overlay-re kattintva bezárul (click)="closeLightbox()" az overlay-en van
    // page.evaluate-val dispatch-elünk click eventet, mert a sidenav elfedi az overlay egyes részeit
    await page.evaluate(() => {
      const el = document.querySelector('.lightbox-overlay') as HTMLElement;
      el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await expect(lightbox).not.toBeVisible({ timeout: 5_000 });
  });

  test('Összes letöltése gomb megjelenik fénykép mellé', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, [MOCK_RECORD]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    await expect(panel.getByText('Esemény')).toBeVisible({ timeout: 5_000 });

    // Összes letöltése gomb megjelenik (ha van fotó)
    const downloadAllBtn = panel.getByRole('button', { name: /összes letöltése/i });
    await expect(downloadAllBtn).toBeVisible({ timeout: 5_000 });
  });

  test('Nincs fotójú igazolásnál nem jelenik meg thumbnail és lightbox', async ({ munkatarsPage: page }) => {
    await mockDetailPage(page, APP_WON, [MOCK_RECORD_ASSET]);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    // Rekord kártya megjelenik
    await expect(panel.getByText('Tárgyi teljesítés')).toBeVisible({ timeout: 5_000 });

    // Nincs feltöltött fotó üzenet látható
    await expect(panel.getByText('Nincs feltöltött fotó.')).toBeVisible();

    // Nincs thumbnail
    await expect(panel.locator('.thumbnail-wrapper')).not.toBeVisible();

    // Nincs Összes letöltése gomb
    await expect(panel.getByRole('button', { name: /összes letöltése/i })).not.toBeVisible();
  });
});

// ─── TS-090/B | Igazolás rögzítése – Admin ───────────────────────────────────

test.describe('TS-090/B | Igazolás rögzítése – Admin', () => {
  test('Admin sikeresen rögzít igazolást fotóval', async ({ adminPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.route(`**/api/v1/applications/${APP_ID}/proof-records`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill(ok(MOCK_RECORD));
      }
      if (route.request().method() === 'GET') {
        return route.fulfill(ok([]));
      }
      return route.continue();
    });

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    const addBtn = panel.getByRole('button', { name: /igazolás hozzáadása/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible();

    await dialog.locator('mat-select[formcontrolname="proofType"]').click();
    const option = page.locator('mat-option').filter({ hasText: /^Esemény$/ });
    await expect(option).toBeVisible();
    await option.click();

    const dateInput = dialog.locator('input[formcontrolname="eventDate"]');
    await dateInput.fill('2026-05-20');
    await dateInput.press('Tab');

    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: minimalJpegBuffer(),
    });

    await expect(dialog.getByText('test.jpg')).toBeVisible();

    const saveBtn = dialog.getByRole('button', { name: /^mentés$/i });
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    const snack = page.locator('mat-snack-bar-container');
    await expect(snack).toContainText('Igazolás sikeresen rögzítve.', { timeout: 8_000 });
  });
});

// ─── TS-090/C | Igazolás hozzáadása gomb – Elnök ─────────────────────────────

test.describe('TS-090/C | Igazolás hozzáadása gomb – Elnök', () => {
  test('Elnöknél az "Igazolás hozzáadása" gomb NEM látható', async ({ elnokPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    // *hasRole="['Admin', 'PalyazatiMunkatars']" → Elnöknél nem látható
    await expect(panel.getByRole('button', { name: /igazolás hozzáadása/i })).not.toBeVisible();
  });
});

// ─── TS-093 | Igazolás hozzáadása gomb – Pénzügyes ───────────────────────────

test.describe('TS-093 | Igazolás hozzáadása gomb – Pénzügyes (R jog)', () => {
  test('Pénzügyesnél az "Igazolás hozzáadása" gomb NEM látható', async ({ penzugyesPage: page }) => {
    await mockDetailPage(page, APP_WON, []);

    await page.goto(`/applications/${APP_ID}`);
    await page.waitForLoadState('networkidle');

    await expandProofPanel(page);
    const panel = proofPanel(page);

    // *hasRole="['Admin', 'PalyazatiMunkatars']" → Pénzügyesnél nem látható
    await expect(panel.getByRole('button', { name: /igazolás hozzáadása/i })).not.toBeVisible();
  });
});
