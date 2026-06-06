import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env['PW_BASE_URL'] ?? 'http://192.168.1.138.nip.io:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { slowMo: process.env['PWSLOWMO'] ? Number(process.env['PWSLOWMO']) : 0 },
      },
    },
  ],
});
