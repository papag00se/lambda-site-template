import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4077';

export default defineConfig({
    testDir: './frontend/e2e',
    fullyParallel: true,
    reporter: 'list',
    timeout: 30_000,
    use: {
        baseURL,
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command: 'node backend/local.js',
              url: 'http://127.0.0.1:4077/api/test',
              reuseExistingServer: !process.env.CI,
              timeout: 90_000
          }
});
