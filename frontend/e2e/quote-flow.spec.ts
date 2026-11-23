import { expect, test } from '@playwright/test';
import { CO_PERSON, fillColombia, startFresh } from './helpers';

/**
 * Full flow for one country (Colombia). Each `test.step` title starts with the AC it proves,
 * so the HTML report and the spec traceability tables point to the same names (RV-06).
 */
test.describe('Full quote flow — Colombia', () => {
  test('US-01..US-04 full flow CO', async ({ page }) => {
    await test.step('US-01-AC-01 only the fields configured for Colombia are shown', async () => {
      await startFresh(page, '/co/quote/data');
      await expect(page.locator('#f-documentType')).toBeVisible();
      await expect(page.locator('#f-plate')).toBeVisible();
      await expect(page.locator('#f-rut')).toHaveCount(0);
      await expect(page.locator('#f-patente')).toHaveCount(0);
    });

    await test.step('US-01 fill step 1 and continue', async () => {
      await fillColombia(page);
      await page.getByTestId('continue').click();
      await expect(page).toHaveURL(/\/co\/quote\/plans$/);
    });

    await test.step('US-02-AC-01 only active and published CO plans, in the configured order', async () => {
      const plans = page.locator('[data-testid^=plan-CO-]');
      await expect(plans).toHaveCount(3);
      await expect(page.getByTestId('plan-CO-LEGACY')).toHaveCount(0); // inactive
      await expect(page.getByTestId('plan-CO-PILOT')).toHaveCount(0); // draft
      expect(await plans.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))).toEqual([
        'plan-CO-BASIC',
        'plan-CO-PLUS',
        'plan-CO-FULL',
      ]);
    });

    await test.step('US-02-AC-03 the recommended plan is distinguished', async () => {
      await expect(page.getByTestId('plan-CO-PLUS').getByTestId('recommended-badge')).toBeVisible();
    });

    await test.step('US-02-AC-08 prices in COP with the Colombian format', async () => {
      await expect(page.getByTestId('plan-CO-PLUS').getByTestId('plan-price')).toHaveText(/\$\s?149\.900/);
    });

    await test.step('US-01-AC-06 keeps data when going back (button and browser back)', async () => {
      await page.getByTestId('back').click();
      await expect(page.locator('#f-fullName')).toHaveValue(CO_PERSON.fullName);
      await page.getByTestId('continue').click();
      await expect(page).toHaveURL(/plans$/);
      await page.goBack();
      await expect(page).toHaveURL(/data$/);
      await expect(page.locator('#f-plate')).toHaveValue(CO_PERSON.plate);
      await page.getByTestId('continue').click();
    });

    await test.step('US-02-AC-05 selecting a plan marks it and enables continue', async () => {
      await expect(page.getByTestId('continue')).toBeDisabled();
      await page.getByTestId('plan-CO-PLUS').click();
      await expect(page.getByTestId('plan-CO-PLUS')).toHaveClass(/plan--chosen/);
      await expect(page.getByTestId('continue')).toBeEnabled();
      await page.getByTestId('continue').click();
      await expect(page).toHaveURL(/\/co\/quote\/summary$/);
    });

    await test.step('US-03-AC-01 summary shows data, vehicle and plan with final price', async () => {
      await expect(page.getByTestId('summary-policyholder')).toContainText(CO_PERSON.fullName);
      await expect(page.getByTestId('summary-vehicle')).toContainText(CO_PERSON.plate);
      await expect(page.getByTestId('summary-price')).toHaveText(/149\.900/);
    });

    await test.step('US-03-AC-02 document number is masked', async () => {
      await expect(page.getByTestId('value-documentNumber')).toHaveText('•••••••050');
    });

    await test.step('US-03-AC-05 terms are the Colombian ones; US-03-AC-06 pay disabled until accepted', async () => {
      await expect(page.getByTestId('terms')).toContainText('SOAT');
      await expect(page.getByTestId('pay')).toBeDisabled();
      await page.getByTestId('accept-terms').check();
      await expect(page.getByTestId('pay')).toBeEnabled();
    });

    await test.step('US-04-AC-04 switch language keeps data, plan and terms acceptance; US-04-AC-03 CMS copy translated', async () => {
      await page.getByTestId('lang-en').click();
      await expect(page.getByTestId('terms')).toContainText('Terms and conditions');
      await expect(page.getByTestId('summary-policyholder')).toContainText('Full name');
      await expect(page.getByTestId('summary-policyholder')).toContainText(CO_PERSON.fullName);
      await expect(page.getByTestId('summary-plan')).toContainText('Plus');
      await expect(page.getByTestId('accept-terms')).toBeChecked();
      await expect(page.getByTestId('summary-price')).toHaveText(/\$\s?149\.900/); // US-04-AC-07
      await page.getByTestId('lang-es').click();
    });

    await test.step('US-03-AC-04 edit links keep data', async () => {
      await page.getByTestId('edit-data').first().click();
      await expect(page.locator('#f-email')).toHaveValue(CO_PERSON.email);
      await page.getByTestId('continue').click();
      await page.getByTestId('continue').click(); // plan still selected
      await expect(page).toHaveURL(/summary$/);
      await page.getByTestId('change-plan').click();
      await expect(page.getByTestId('plan-CO-PLUS')).toHaveClass(/plan--chosen/);
      await page.getByTestId('continue').click();
    });

    await test.step('US-03-AC-10 declined then retry without losing information', async () => {
      await page.getByTestId('accept-terms').check();
      await page.getByTestId('sandbox-outcome').selectOption('decline');
      await page.getByTestId('pay').click();
      await expect(page.getByTestId('pay')).toBeDisabled(); // US-03-AC-07
      await expect(page.getByTestId('payment-error')).toBeVisible();
      await expect(page.getByTestId('payment-error')).toBeFocused();
      await expect(page.getByTestId('summary-policyholder')).toContainText(CO_PERSON.fullName);
      await expect(page.getByTestId('accept-terms')).toBeChecked();
      await page.getByTestId('sandbox-outcome').selectOption('approve');
      await page.getByTestId('pay').click();
    });

    await test.step('US-03-AC-09 confirmation with the quote number', async () => {
      await expect(page).toHaveURL(/\/co\/quote\/confirmation$/);
      await expect(page.getByTestId('quote-number')).toHaveText(/^CO-\d{8}-[A-Z0-9]{6}$/);
    });

    await test.step('US-03-AC-11 browser back cannot pay again', async () => {
      await page.goBack();
      await expect(page).toHaveURL(/confirmation$/);
    });
  });
});
