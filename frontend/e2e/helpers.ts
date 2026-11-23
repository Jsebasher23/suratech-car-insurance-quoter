import { Page, expect } from '@playwright/test';

/** Fictitious people only (CLAUDE.md §3.5). */
export const CO_PERSON = {
  fullName: 'Ana María Pérez',
  documentType: 'CC',
  documentNumber: '1020304050',
  birthDate: '1990-05-17',
  email: 'ana.perez@example.com',
  mobile: '3001234567',
  city: 'Medellín',
  plate: 'ABC123',
  make: 'Mazda',
  vehicleYear: '2021',
  vehicleUse: 'private',
};

export async function fillColombia(page: Page) {
  await page.locator('#f-fullName').fill(CO_PERSON.fullName);
  await page.locator('#f-documentType').selectOption(CO_PERSON.documentType);
  await page.locator('#f-documentNumber').fill(CO_PERSON.documentNumber);
  await page.locator('#f-birthDate').fill(CO_PERSON.birthDate);
  await page.locator('#f-email').fill(CO_PERSON.email);
  await page.locator('#f-mobile').fill(CO_PERSON.mobile);
  await page.locator('#f-city').selectOption(CO_PERSON.city);
  await page.locator('#f-dataConsent').check();
  await page.locator('#f-plate').fill(CO_PERSON.plate);
  await page.locator('#f-make').selectOption(CO_PERSON.make);
  await page.locator('#f-vehicleYear').fill(CO_PERSON.vehicleYear);
  await page.locator('#f-vehicleUse').selectOption(CO_PERSON.vehicleUse);
}

export async function startFresh(page: Page, path: string) {
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.setItem('ciq.lang', 'es');
  });
  await page.goto(path);
  await expect(page.getByTestId('data-form')).toBeVisible();
}
