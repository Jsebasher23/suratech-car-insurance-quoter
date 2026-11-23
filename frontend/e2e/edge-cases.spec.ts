import { expect, test } from '@playwright/test';
import { fillColombia, startFresh } from './helpers';

test('US-01-AC-03/04 invalid field shows its Strapi message and blocks the step', async ({ page }) => {
  await startFresh(page, '/co/quote/data');
  await fillColombia(page);
  await page.locator('#f-vehicleYear').fill(String(new Date().getFullYear() + 2));
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('error-vehicleYear')).toHaveText(/entre hace 20 años y el próximo año/);
  await expect(page.locator('#f-vehicleYear')).toBeFocused();
  await expect(page).toHaveURL(/data$/);
});

test('US-01-AC-09 a minor cannot continue', async ({ page }) => {
  await startFresh(page, '/co/quote/data');
  await fillColombia(page);
  const d = new Date();
  const minor = `${d.getFullYear() - 17}-01-01`;
  await page.locator('#f-birthDate').fill(minor);
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('error-birthDate')).toContainText('18');
});

test('US-02-AC-07 shows a message when the country has no active plans', async ({ page }) => {
  await page.route('**/api/plans**', (route) => route.fulfill({ json: { data: [], meta: {} } }));
  await startFresh(page, '/co/quote/data');
  await fillColombia(page);
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('no-plans')).toContainText('No hay planes disponibles');
  await expect(page.getByTestId('continue')).toBeDisabled();
});

test('US-01-AC-11 Strapi down → error with retry that recovers', async ({ page }) => {
  let fail = true;
  await page.route('**/api/form-fields**', (route) => (fail ? route.fulfill({ status: 503, body: 'down' }) : route.continue()));
  await page.goto('/co/quote/data');
  await expect(page.getByTestId('load-error')).toBeVisible();
  fail = false;
  await page.getByTestId('retry').click();
  await expect(page.getByTestId('data-form')).toBeVisible();
});

test('US-01-AC-13 unknown country shows the picker', async ({ page }) => {
  await page.goto('/ar/quote/data');
  await expect(page.getByTestId('unknown-country')).toBeVisible();
  await expect(page.getByTestId('country-CO')).toBeVisible();
});

test('US-02-AC-11 deep link to plans without data goes back to step 1', async ({ page }) => {
  await startFresh(page, '/co/quote/data');
  await page.goto('/co/quote/summary');
  await expect(page).toHaveURL(/data$/);
});
