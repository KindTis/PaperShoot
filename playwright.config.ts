import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4174/PaperShoot/',
    viewport: { width: 1280, height: 720 },
    headless: true,
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4174/PaperShoot/',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
