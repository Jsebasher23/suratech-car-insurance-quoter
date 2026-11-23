import { expect, test } from '@playwright/test';

/**
 * RV-01 regression: the global stylesheet must apply under the production CSP
 * (script-src 'self' blocks inline onload handlers). Meaningful against the nginx image or
 * `npm run preview:prod`; trivially green against `ng serve`.
 */
test('RV-01 global styles apply under the production CSP', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) violations.push(m.text());
  });
  await page.goto('/co/quote/data');
  await expect(page.getByTestId('data-form')).toBeVisible();
  const hidden = page.locator('.visually-hidden').first();
  expect(await hidden.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
  const btn = page.getByTestId('continue');
  expect(await btn.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('999px');
  expect(violations).toEqual([]);
});

test('RV-02 the skip link moves focus to the main content without leaving the wizard', async ({ page }) => {
  await page.goto('/co/quote/data');
  await expect(page.getByTestId('data-form')).toBeVisible();
  // The step heading takes focus on load (CLAUDE.md §3.8), so put focus on the skip link directly
  await page.getByTestId('skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/co\/quote\/data$/);
  await expect(page.locator('main#main')).toBeFocused();
});

test('RV-13 the page title names the step, country and brand in the active language', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('ciq.lang', 'en'));
  await page.goto('/cl/quote/data');
  await expect(page).toHaveTitle('Your details · Chile · Ruta Segura');
});
