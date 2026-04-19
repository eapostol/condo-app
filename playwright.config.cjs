// Minimal Playwright smoke harness for the existing dev stack.
// It assumes the frontend and backend are already running locally.

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: './tests/ui',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'line',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
};
