import { Pipe, PipeTransform } from '@angular/core';

/**
 * US-02-AC-08 / US-04-AC-07 — money is formatted with the COUNTRY locale and currency,
 * independent of the UI language. COP and CLP are shown without decimals.
 */
export function formatMoney(amount: number, currency: string, numberLocale: string): string {
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(amount: number | null | undefined, currency: string, numberLocale: string): string {
    return amount == null ? '' : formatMoney(amount, currency, numberLocale);
  }
}
