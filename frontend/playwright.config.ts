import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against a running stack (docker compose → http://localhost:8080, or `ng serve` +
 * Strapi → http://localhost:4200). Set E2E_BASE_URL accordingly.
 * PW_CHROMIUM_PATH lets you reuse a local Chromium when the Playwright CDN is not reachable.
 */
const executablePath = process.env['PW_CHROMIUM_PATH'] || undefined;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], locale: 'es-CO' } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], locale: 'es-CO' }, testMatch: /quote-flow/ },
  ],
});
