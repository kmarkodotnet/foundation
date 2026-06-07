/**
 * 3. kategória – Pályázati felhívások
 * Forgatókönyvek: TS-020 … TS-025
 *
 * Stratégia:
 *  - Minden fixture-alapú (munkatarsPage / adminPage)
 *  - Backend API hívások mockolt route-okkal kezelve
 *  - Granterek tömbként mockolt (Granter[]), pályázatok oldalt mockolt
 */

import { test, expect } from '../../fixtures/auth.fixture';

// ─── Mock adatok ────────────────────────────────────────────────────────────

const APP_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const GRANTER_ID = 'bbbbbbbb-0000-0000-0000-000000000001';

const TEST_GRANTERS = [
  {
    id: GRANTER_ID,
    name: 'Teszt Alapítvány',
    description: null,
    phoneNumber: null,
    email: null,
    status: 'Active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const TEST_APP_DRAFT = {
  id: APP_ID,
  title: 'Teszt Pályázat 2026',
  identifier: null,
  description: 'Eredeti leírás.',
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
  workflowSteps: [],
  granterContractIdentifier: null,
  granterContractDate: null,
  granterNotificationReceived: null,
  granterNotificationDate: null,
};

const TEST_APP_CLOSED_WON = {
  ...TEST_APP_DRAFT,
  status: 'ClosedWon',
  awardedAmount: 1500000,
};

const makeListPage = (overrides: object = {}) => ({
  items: [
    {
      id: APP_ID,
      title: 'Teszt Pályázat 2026',
      identifier: null,
      granterName: 'Teszt Alapítvány',
      status: 'Draft',
      submissionDeadline: '2027-01-01T23:59:59Z',
      spendingDeadline: null,
      awardedAmount: null,
      lastModifiedAt: '2026-06-04T10:00:00Z',
      isDeadlineWarning: false,
      isDeadlineCritical: false,
      isSpendingDeadlineWarning: false,
      ...overrides,
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
});

// ─── Segédfüggvények ────────────────────────────────────────────────────────

function ok(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TS-020 | Új pályázati felhívás rögzítése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-020 | Új pályázat rögzítése', () => {
  test('Az "Új pályázat" gomb megjelenik Munkatárs felhasználónál', async ({ munkatarsPage }) => {
    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(munkatarsPage.getByRole('button', { name: /új pályázat/i })).toBeVisible();
  });

  test('Az "Új pályázat" gombra kattintva az /applications/new oldalra navigál', async ({
    munkatarsPage,
  }) => {
    await munkatarsPage.goto('/applications');
    await munkatarsPage.waitForURL('**/applications**', { timeout: 10_000 });

    await munkatarsPage.getByRole('button', { name: /új pályázat/i }).click();

    await munkatarsPage.waitForURL('**/applications/new**', { timeout: 10_000 });
    await expect(munkatarsPage.getByText('Új pályázat rögzítése')).toBeVisible();
  });

  test('Sikeres mentés után a detail oldalra navigál és Tervezet státuszt mutat', async ({
    munkatarsPage,
  }) => {
    // Override granters mock with real Granter[] array
    await munkatarsPage.route('**/api/v1/granters**', (route) =>
      route.fulfill(ok(TEST_GRANTERS)),
    );

    // Single comprehensive handler for all applications/** requests (LIFO: runs first).
    // Inline URL+method check avoids route.continue() going to the real network.
    await munkatarsPage.route('**/api/v1/applications**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(TEST_APP_DRAFT),
        });
      } else if (url.includes(APP_ID)) {
        await route.fulfill(ok(TEST_APP_DRAFT));
      } else {
        await route.fulfill(ok({ items: [], totalCount: 0, page: 1, pageSize: 20 }));
      }
    });

    await munkatarsPage.goto('/applications/new');
    await munkatarsPage.waitForLoadState('networkidle');

    // Fill title via placeholder (more reliable than getByLabel for Angular Material)
    await munkatarsPage.getByPlaceholder('pl. Oktatási pályázat 2025').fill('Teszt Pályázat 2026');

    // Select granter
    await munkatarsPage
      .locator('mat-form-field')
      .filter({ hasText: /pályáztató/i })
      .locator('mat-select')
      .click();
    await munkatarsPage.locator('mat-option').filter({ hasText: 'Teszt Alapítvány' }).click();

    // Fill date (Angular Material native adapter: M/D/YYYY)
    await munkatarsPage.getByLabel(/beadási határidő/i).fill('1/1/2027');
    await munkatarsPage.keyboard.press('Escape'); // close datepicker if open

    // Submit
    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();

    // Wait for detail URL (UUID present, /new absent)
    await munkatarsPage.waitForURL(
      (url) => url.href.includes(APP_ID) && !url.href.includes('/new'),
      { timeout: 10_000 },
    );
    await expect(munkatarsPage.getByText('Tervezet')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-021 | Kötelező mezők validációja
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-021 | Kötelező mezők validációja', () => {
  test('A Mentés gomb le van tiltva, ha a form üres', async ({ munkatarsPage }) => {
    await munkatarsPage.goto('/applications/new');
    await munkatarsPage.waitForLoadState('networkidle');

    const saveBtn = munkatarsPage.getByRole('button', { name: /mentés/i });
    await expect(saveBtn).toBeDisabled();
  });

  test('Pályázat neve kötelező hibaüzenet megjelenik, ha a mező érintett és üres', async ({
    munkatarsPage,
  }) => {
    // Override granters mock: fixture returns paged object, but service expects Granter[].
    // Wrong type causes @for to throw during CD, breaking error state rendering.
    await munkatarsPage.route('**/api/v1/granters**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await munkatarsPage.goto('/applications/new');
    await munkatarsPage.waitForLoadState('networkidle');

    const titleInput = munkatarsPage.getByPlaceholder('pl. Oktatási pályázat 2025');
    await titleInput.click();
    await titleInput.fill('a');
    await titleInput.fill('');
    await titleInput.blur(); // blur fires onTouched() → marks touched → mat-error shows

    await expect(munkatarsPage.getByText('A pályázat neve kötelező.')).toBeVisible({ timeout: 5_000 });
  });

  test('Beadási határidő kötelező hibaüzenet megjelenik, ha a mező érintett és üres', async ({
    munkatarsPage,
  }) => {
    // Override granters mock (same reason as title test)
    await munkatarsPage.route('**/api/v1/granters**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );

    await munkatarsPage.goto('/applications/new');
    await munkatarsPage.waitForLoadState('networkidle');

    // Click the datepicker input → calendar opens → Escape closes it.
    // MatDatepickerInput.closedStream fires onTouched(), marking the control touched.
    const deadlineInput = munkatarsPage
      .locator('mat-form-field')
      .filter({ hasText: /beadási határidő/i })
      .locator('input');
    await deadlineInput.click({ force: true });
    await munkatarsPage.keyboard.press('Escape');
    await deadlineInput.blur();

    await expect(munkatarsPage.getByText('A beadási határidő kötelező.')).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-022 | Min > Max összeg – backend validáció
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-022 | Min > Max összeg validáció', () => {
  test('Min > Max esetén a backend 422-t ad vissza és hibaüzenet jelenik meg', async ({
    munkatarsPage,
  }) => {
    await munkatarsPage.route('**/api/v1/granters**', (route) =>
      route.fulfill(ok(TEST_GRANTERS)),
    );

    // Backend rejects min > max with 422
    await munkatarsPage.route('**/api/v1/applications**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 422, body: '' });
      } else {
        await route.continue();
      }
    });

    await munkatarsPage.goto('/applications/new');
    await munkatarsPage.waitForLoadState('networkidle');

    // Fill required fields
    await munkatarsPage.getByPlaceholder('pl. Oktatási pályázat 2025').fill('Min Max Teszt');
    await munkatarsPage
      .locator('mat-form-field')
      .filter({ hasText: /pályáztató/i })
      .locator('mat-select')
      .click();
    await munkatarsPage.locator('mat-option').filter({ hasText: 'Teszt Alapítvány' }).click();
    await munkatarsPage.getByLabel(/beadási határidő/i).fill('1/1/2027');
    await munkatarsPage.keyboard.press('Escape');

    // Set min > max
    await munkatarsPage.getByLabel(/minimális összeg/i).fill('500000');
    await munkatarsPage.getByLabel(/maximális összeg/i).fill('200000');

    // Submit
    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();

    // Frontend shows generic error snackbar
    await expect(
      munkatarsPage.getByText('Nem sikerült létrehozni a pályázatot.'),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-023 | Pályázati felhívás szerkesztése
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-023 | Pályázati felhívás szerkesztése', () => {
  test('A "Szerkesztés" gomb látható Draft állapotú pályázatnál', async ({ munkatarsPage }) => {
    await munkatarsPage.route(`**/api/v1/applications/${APP_ID}**`, (route) =>
      route.fulfill(ok(TEST_APP_DRAFT)),
    );

    await munkatarsPage.goto(`/applications/${APP_ID}`);
    await munkatarsPage.waitForLoadState('networkidle');

    await expect(munkatarsPage.getByRole('button', { name: /szerkesztés/i })).toBeVisible();
  });

  test('Az edit form az aktuális adatokkal töltődik be', async ({ munkatarsPage }) => {
    await munkatarsPage.route(`**/api/v1/applications/${APP_ID}**`, (route) =>
      route.fulfill(ok(TEST_APP_DRAFT)),
    );

    await munkatarsPage.goto(`/applications/${APP_ID}/edit`);
    await munkatarsPage.waitForLoadState('networkidle');

    const titleInput = munkatarsPage.getByLabel(/pályázat neve/i);
    await expect(titleInput).toHaveValue('Teszt Pályázat 2026');
  });

  test('Mentés után visszanavigál a detail oldalra', async ({ munkatarsPage }) => {
    await munkatarsPage.route(`**/api/v1/applications/${APP_ID}**`, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill(ok({ ...TEST_APP_DRAFT, title: 'Módosított Pályázat' }));
      } else {
        await route.fulfill(ok(TEST_APP_DRAFT));
      }
    });

    await munkatarsPage.goto(`/applications/${APP_ID}/edit`);
    await munkatarsPage.waitForLoadState('networkidle');

    // Modify title
    const titleInput = munkatarsPage.getByLabel(/pályázat neve/i);
    await titleInput.clear();
    await titleInput.fill('Módosított Pályázat');

    await munkatarsPage.getByRole('button', { name: /mentés/i }).click();

    // Wait for URL without /edit (predicate avoids matching current /edit URL immediately)
    await munkatarsPage.waitForURL(
      (url) => url.href.includes(APP_ID) && !url.href.includes('/edit'),
      { timeout: 10_000 },
    );
    expect(munkatarsPage.url()).not.toContain('/edit');
  });

  test('A "Mégsem" gomb visszanavigál a detail oldalra mentés nélkül', async ({
    munkatarsPage,
  }) => {
    await munkatarsPage.route(`**/api/v1/applications/${APP_ID}**`, (route) =>
      route.fulfill(ok(TEST_APP_DRAFT)),
    );

    await munkatarsPage.goto(`/applications/${APP_ID}/edit`);
    await munkatarsPage.waitForLoadState('networkidle');

    await munkatarsPage.getByRole('button', { name: /mégsem/i }).click();

    // Wait for URL without /edit
    await munkatarsPage.waitForURL(
      (url) => url.href.includes(APP_ID) && !url.href.includes('/edit'),
      { timeout: 10_000 },
    );
    expect(munkatarsPage.url()).not.toContain('/edit');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-024 | Pályázat archiválása
// ─────────────────────────────────────────────────────────────────────────────
test.describe('TS-024 | Pályázat archiválása', () => {
  test('Az "Archiválás" gomb nem látható Draft állapotú pályázatnál', async ({ adminPage }) => {
    await adminPage.route(`**/api/v1/applications/${APP_ID}**`, (route) =>
      route.fulfill(ok(TEST_APP_DRAFT)),
    );

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    // Draft is not ClosedWon/ClosedLost → archive button absent
    await expect(adminPage.getByRole('button', { name: /archiválás/i })).toHaveCount(0);
  });

  test('Az "Archiválás" gomb látható ClosedWon állapotú pályázatnál Admin-nak', async ({
    adminPage,
  }) => {
    await adminPage.route(`**/api/v1/applications/${APP_ID}**`, (route) =>
      route.fulfill(ok(TEST_APP_CLOSED_WON)),
    );

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await expect(adminPage.getByRole('button', { name: /archiválás/i })).toBeVisible();
  });

  test('Az "Archiválás" gombra kattintva megerősítő dialog jelenik meg', async ({
    adminPage,
  }) => {
    await adminPage.route(`**/api/v1/applications/${APP_ID}**`, (route) =>
      route.fulfill(ok(TEST_APP_CLOSED_WON)),
    );

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await adminPage.getByRole('button', { name: /archiválás/i }).click();

    // Confirm dialog appears
    await expect(adminPage.getByText('Pályázat archiválása')).toBeVisible();
    await expect(adminPage.getByText(/biztosan archiválja/i)).toBeVisible();
  });

  test('Megerősítés után a listára navigál', async ({ adminPage }) => {
    await adminPage.route(`**/api/v1/applications/${APP_ID}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204, body: '' });
      } else {
        await route.fulfill(ok(TEST_APP_CLOSED_WON));
      }
    });

    await adminPage.goto(`/applications/${APP_ID}`);
    await adminPage.waitForLoadState('networkidle');

    await adminPage.getByRole('button', { name: /archiválás/i }).click();

    // Click confirm button inside the dialog (scoped to avoid matching the page button)
    await adminPage
      .locator('mat-dialog-container')
      .getByRole('button', { name: /archiválás/i })
      .click();

    // Wait for navigation to list — predicate excludes current /APP_ID URL
    await adminPage.waitForURL(
      (url) => url.href.includes('/applications') && !url.href.includes(APP_ID),
      { timeout: 10_000 },
    );
    expect(adminPage.url()).not.toContain(APP_ID);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TS-025 | 7 napos határidő figyelmeztető ikon
// ─────────────────────────────────────────────────────────────────────────────
async function loadListWithData(
  page: import('@playwright/test').Page,
  overrides: object,
): Promise<void> {
  // Register a new route; in Playwright routes are checked LIFO so this
  // overrides the empty-list mock registered by the auth fixture.
  await page.route('**/api/v1/applications**', (route) =>
    route.fulfill(ok(makeListPage(overrides))),
  );

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/api/v1/applications') && !r.url().includes('/export'),
    ),
    page.goto('/applications'),
  ]);
  await page.waitForLoadState('networkidle');
}

test.describe('TS-025 | Határidő figyelmeztető ikonok', () => {
  test('isDeadlineWarning=true esetén "schedule" ikon jelenik meg a listában', async ({
    munkatarsPage,
  }) => {
    await loadListWithData(munkatarsPage, { isDeadlineWarning: true });

    // span.gm-deadline-warning contains the mat-icon when warning flag is set
    const warningIcon = munkatarsPage.locator('.gm-deadline-warning mat-icon.gm-deadline-icon');
    await warningIcon.waitFor({ state: 'attached', timeout: 8_000 });
    await warningIcon.scrollIntoViewIfNeeded();
    await expect(warningIcon).toBeVisible({ timeout: 5_000 });
  });

  test('isDeadlineCritical=true esetén "warning" ikon jelenik meg a listában', async ({
    munkatarsPage,
  }) => {
    await loadListWithData(munkatarsPage, { isDeadlineCritical: true });

    // span.gm-deadline-critical contains the mat-icon when critical flag is set
    const criticalIcon = munkatarsPage.locator('.gm-deadline-critical mat-icon.gm-deadline-icon');
    await criticalIcon.waitFor({ state: 'attached', timeout: 8_000 });
    await criticalIcon.scrollIntoViewIfNeeded();
    await expect(criticalIcon).toBeVisible({ timeout: 5_000 });
  });
});
