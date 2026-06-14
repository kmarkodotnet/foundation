import { test as base, Page } from '@playwright/test';
import { generateCr2Jwt, Cr2User, CR2_USERS } from '../helpers/cr2-jwt';
import { mockSignalR, mockApplicationsList, mockGrantersList, mockCodelists, mockLogout, mockNotifications, mockAvailableScopes } from '../helpers/api-mocks';

const STORAGE_KEY = 'gm_token';

async function injectCr2Token(page: Page, user: Cr2User): Promise<void> {
  const token = generateCr2Jwt(user);
  await page.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      sessionStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: token },
  );
}

async function mockCr2Session(page: Page): Promise<void> {
  await mockSignalR(page);
  await mockLogout(page);
  await mockNotifications(page);
  await mockAvailableScopes(page);
}

async function mockBusinessSession(page: Page): Promise<void> {
  await mockCr2Session(page);
  await mockApplicationsList(page);
  await mockGrantersList(page);
  await mockCodelists(page);
}

type Cr2Fixtures = {
  platformAdminPage: Page;
  platformAuditorPage: Page;
  ownerAdminAPage: Page;
  ownerAdminBPage: Page;
  foundationAdminXPage: Page;
  foundationAdminXMultiPage: Page;
  munkatarsXPage: Page;
};

export const test = base.extend<Cr2Fixtures>({
  platformAdminPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.PlatformAdmin);
    await mockCr2Session(page);
    await use(page);
  },
  platformAuditorPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.PlatformAuditor);
    await mockCr2Session(page);
    await use(page);
  },
  ownerAdminAPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.OwnerAdminA);
    await mockCr2Session(page);
    await use(page);
  },
  ownerAdminBPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.OwnerAdminB);
    await mockCr2Session(page);
    await use(page);
  },
  foundationAdminXPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.FoundationAdminX);
    await mockBusinessSession(page);
    await use(page);
  },
  foundationAdminXMultiPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.FoundationAdminXmulti);
    await mockBusinessSession(page);
    await use(page);
  },
  munkatarsXPage: async ({ page }, use) => {
    await injectCr2Token(page, CR2_USERS.PalyazatiMunkatarsX);
    await mockBusinessSession(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { generateCr2Jwt, generateBreakGlassJwt, CR2_USERS, OWNER_A_ID, OWNER_B_ID, FOUNDATION_X_ID, FOUNDATION_Y_ID, FOUNDATION_P_ID } from '../helpers/cr2-jwt';
