import { defineConfig, devices } from 'playwright/test';

/**
 * Playwright config for the Vue dev server (Vite, port 5173).
 * Used for competition.spec.js and any future Vue-app E2E tests.
 *
 * Usage:
 *   npx playwright test --config=playwright-vue.config.js
 *   npx playwright test tests/competition.spec.js --config=playwright-vue.config.js
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/competition.spec.js', '**/champion-evaluation.spec.js', '**/deck-recovery.spec.js', '**/cast.spec.js', '**/stack-library.spec.js'],
  fullyParallel: false,   // competition tests share a dev server; serial is safer
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174/MemoryWhole/',
    trace: 'on-first-retry',
    // Clear localStorage between tests so each starts with a clean state
    storageState: undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx vite --port 5174 --host 127.0.0.1',
    url: 'http://127.0.0.1:5174/MemoryWhole/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
