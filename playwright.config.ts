import { defineConfig } from '@playwright/test';

// The end-to-end tests load the built extension (dist/chrome) into
// Playwright's Chromium and drive live lichess.org pages.

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: process.env['CI'] === undefined ? 2 : 1,
  retries: process.env['CI'] === undefined ? 0 : 2,
  forbidOnly: process.env['CI'] !== undefined,
  reporter: process.env['CI'] === undefined ? 'list' : [['github'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
