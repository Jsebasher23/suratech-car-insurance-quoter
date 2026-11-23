import { expect, test } from '@playwright/test';
import { CO_PERSON, fillColombia, startFresh } from './helpers';

test.describe('Full quote flow — Colombia', () => {
  test('US-01..03 happy path with decline-then-retry, back navigation and language switch', async ({ page }) => {
    // ── Step 1 (US-01) ──────────────────────────────────────────────
    await startFresh(page, '/co/quote/data');
    // US-01-AC-01: only CO fields (placa + cédula), not CL (RUT + patente)
    await expect(page.locator('#f-documentType')).toBeVisible();
    await expect(page.locator('#f-plate')).toBeVisible();
    await expect(page.locator('#f-rut')).toHaveCount(0);
    await expect(page.locator('#f-patente')).toHaveCount(0);

    await fillColombia(page);
    await page.getByTestId('continue').click();

    // ── Step 2 (US-02) ──────────────────────────────────────────────
    await expect(page).toHaveURL(/\/co\/quote\/plans$/);
    const plans = page.locator('[data-testid^=plan-CO-]');
    // US-02-AC-01: active + published only (CO-LEGACY inactive, CO-PILOT draft are hidden), in order
    await expect(plans).toHaveCount(3);
    await expect(page.getByTestId('plan-CO-LEGACY')).toHaveCount(0);
    await expect(page.getByTestId('plan-CO-PILOT')).toHaveCount(0);
    expect(await plans.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')))).toEqual([
      'plan-CO-BASIC',
      'plan-CO-PLUS',
      'plan-CO-FULL',
    ]);
    // US-02-AC-03: recommended is distinguished
    await expect(page.getByTestId('plan-CO-PLUS').getByTestId('recommended-badge')).toBeVisible();
    // US-02-AC-08: COP format
    await expect(page.getByTestId('plan-CO-PLUS').getByTestId('plan-price')).toHaveText(/\$\s?149\.900/);

    // US-01-AC-06: going back keeps data
    await page.getByTestId('back').click();
    await expect(page.locator('#f-fullName')).toHaveValue(CO_PERSON.fullName);
    await expect(page.locator('#f-plate')).toHaveValue(CO_PERSON.plate);
    await page.getByTestId('continue').click();

    // US-02-AC-05
    await expect(page.getByTestId('continue')).toBeDisabled();
    await page.getByTestId('plan-CO-PLUS').click();
    await expect(page.getByTestId('continue')).toBeEnabled();
    await page.getByTestId('continue').click();

    // ── Step 3 (US-03) ──────────────────────────────────────────────
    await expect(page).toHaveURL(/\/co\/quote\/summary$/);
    await expect(page.getByTestId('summary-policyholder')).toContainText(CO_PERSON.fullName);
    await expect(page.getByTestId('value-documentNumber')).toHaveText('•••••••050'); // US-03-AC-02
    await expect(page.getByTestId('summary-price')).toHaveText(/149\.900/);
    await expect(page.getByTestId('terms')).toContainText('SOAT'); // US-03-AC-05 CO-specific terms
    await expect(page.getByTestId('pay')).toBeDisabled(); // US-03-AC-06

    // US-04-AC-04: switching language keeps data, plan and translates CMS content
    await page.getByTestId('lang-en').click();
    await expect(page.getByTestId('terms')).toContainText('Terms and conditions');
    await expect(page.getByTestId('summary-plan')).toContainText('Plus');
    await expect(page.getByTestId('summary-policyholder')).toContainText('Full name');
    await expect(page.getByTestId('summary-policyholder')).toContainText(CO_PERSON.fullName);
    await page.getByTestId('lang-es').click();

    // US-03-AC-04: edit link goes back with data preserved
    await page.getByTestId('edit-data').first().click();
    await expect(page.locator('#f-email')).toHaveValue(CO_PERSON.email);
    await page.getByTestId('continue').click();
    await page.getByTestId('continue').click(); // plan still selected
    await expect(page).toHaveURL(/summary$/);

    await page.getByTestId('accept-terms').check();
    await expect(page.getByTestId('pay')).toBeEnabled();

    // US-03-AC-10: declined payment, clear error, data kept, retry possible
    await page.getByTestId('sandbox-outcome').selectOption('decline');
    await page.getByTestId('pay').click();
    await expect(page.getByTestId('pay')).toBeDisabled(); // US-03-AC-07 locked while processing
    await expect(page.getByTestId('payment-error')).toBeVisible();
    await expect(page.getByTestId('summary-policyholder')).toContainText(CO_PERSON.fullName);
    await expect(page.getByTestId('accept-terms')).toBeChecked();

    // retry → approve
    await page.getByTestId('sandbox-outcome').selectOption('approve');
    await page.getByTestId('pay').click();

    // US-03-AC-09
    await expect(page).toHaveURL(/\/co\/quote\/confirmation$/);
    await expect(page.getByTestId('quote-number')).toHaveText(/^CO-\d{8}-[A-Z0-9]{6}$/);

    // US-03-AC-11: browser back cannot pay again
    await page.goBack();
    await expect(page).toHaveURL(/confirmation$/);
  });
});
