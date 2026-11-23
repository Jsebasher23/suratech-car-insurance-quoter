import { Page, expect, test } from '@playwright/test';
import { startFresh } from './helpers';

/** Moves focus with Tab only until `selector` is focused (max 80 presses). */
async function tabTo(page: Page, selector: string) {
  for (let i = 0; i < 80; i++) {
    if (await page.locator(selector).evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Could not reach ${selector} with Tab`);
}

test('US-01-AC-12 completes the Chile wizard using only the keyboard', async ({ page }) => {
  await startFresh(page, '/cl/quote/data');
  const kb = page.keyboard;

  await tabTo(page, '#f-fullName');
  await kb.type('Matías Rojas Soto');
  await tabTo(page, '#f-rut');
  await kb.type('12.345.678-5');
  await tabTo(page, '#f-birthDate');
  await kb.type('17051990'); // es-CO date order dd/mm/yyyy
  await tabTo(page, '#f-email');
  await kb.type('matias.rojas@example.com');
  await tabTo(page, '#f-region');
  await kb.press('ArrowDown');
  await tabTo(page, '#f-patente');
  await kb.type('BCDF12');
  await tabTo(page, '#f-make');
  await kb.press('ArrowDown');
  await tabTo(page, '#f-vehicleYear');
  await kb.type('2020');
  await tabTo(page, '#f-fuel');
  await kb.press('ArrowDown');
  await tabTo(page, '#f-vehicleUse');
  await kb.press('ArrowDown');

  await tabTo(page, '[data-testid=continue]');
  await kb.press('Enter');
  await expect(page).toHaveURL(/\/cl\/quote\/plans$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused(); // focus moved to step heading

  // CLP prices, Chilean plans
  await expect(page.getByTestId('plan-CL-COMPLETE').getByTestId('plan-price')).toHaveText(/\$\d{2}\.\d{3}/);

  await tabTo(page, 'input[name=plan] >> nth=0'); // no selection yet → Tab enters the group on the first radio
  await kb.press('Space'); // first plan
  await kb.press('ArrowRight'); // radio group: move to recommended
  await expect(page.getByTestId('plan-CL-COMPLETE')).toHaveClass(/plan--chosen/);
  await tabTo(page, '[data-testid=continue]');
  await kb.press('Enter');

  await expect(page).toHaveURL(/summary$/);
  await expect(page.getByTestId('value-rut')).toHaveText('••.•••.•78-5');
  await expect(page.getByTestId('terms')).toContainText('Ley 19.628'); // CL terms
  await tabTo(page, '[data-testid=accept-terms]');
  await kb.press('Space');
  await tabTo(page, '[data-testid=pay]');
  await kb.press('Enter');
  await expect(page.getByTestId('quote-number')).toHaveText(/^CL-\d{8}-[A-Z0-9]{6}$/);
});
