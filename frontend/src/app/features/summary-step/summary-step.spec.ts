import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PaymentGateway, PaymentRequest, PaymentResult } from '../../core/payment/payment-gateway';
import { CO_FIELDS, CO_PLANS, CO_TERMS, VALID_CO_VALUES } from '../../../testing/fixtures';
import { setupStep } from '../../../testing/harness';
import { SummaryStep } from './summary-step';

class PendingGateway extends PaymentGateway {
  calls: PaymentRequest[] = [];
  resolve?: (r: PaymentResult) => void;
  charge(req: PaymentRequest) {
    this.calls.push(req);
    return new Promise<PaymentResult>((r) => (this.resolve = r));
  }
}

async function render() {
  const gw = new PendingGateway();
  const ctx = await setupStep([{ provide: PaymentGateway, useValue: gw }]);
  ctx.store.setFormValues(VALID_CO_VALUES, true);
  ctx.store.selectPlan('CO-PLUS');
  vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(SummaryStep);
  const el: HTMLElement = fixture.nativeElement;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); };
  await settle();
  return { ...ctx, gw, el, settle };
}
const pay = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('[data-testid=pay]')!;

describe('SummaryStep (US-03)', () => {
  it('US-03-AC-01 shows policyholder, vehicle and plan with its final price; document masked', async () => {
    const { el, api, settle } = await render();
    api.emitDefaults();
    await settle();
    expect(el.querySelector('[data-testid=summary-policyholder]')?.textContent).toContain('Ana María Pérez');
    expect(el.querySelector('[data-testid=summary-vehicle]')?.textContent).toContain('ABC123');
    expect(el.querySelector('[data-testid=value-documentNumber]')?.textContent?.trim()).toBe('•••••••050');
    expect(el.querySelector('[data-testid=summary-plan]')?.textContent).toContain('Plus');
    expect(el.querySelector('[data-testid=summary-price]')?.textContent?.replace(/\s/g, ' ')).toBe('$ 149.900');
  });

  it('US-03-AC-05 renders the country terms as plain text paragraphs with version', async () => {
    const { el, api, settle } = await render();
    api.emitDefaults();
    await settle();
    const body = el.querySelector('[data-testid=terms-body]')!;
    expect(body.querySelectorAll('p').length).toBe(2);
    expect(body.querySelector('b')).toBeNull(); // no HTML injection
    expect(body.textContent).toContain('<b>sin HTML</b>');
    expect(el.textContent).toContain(CO_TERMS.version);
  });

  it('US-03-AC-06 pay is disabled until terms are accepted', async () => {
    const { el, api, settle } = await render();
    api.emitDefaults();
    await settle();
    expect(pay(el).disabled).toBe(true);
    el.querySelector<HTMLInputElement>('[data-testid=accept-terms]')!.click();
    await settle();
    expect(pay(el).disabled).toBe(false);
  });

  it('US-03-AC-07 locks the button with aria-busy while processing; second click does nothing', async () => {
    const { el, api, gw, settle } = await render();
    api.emitDefaults();
    await settle();
    el.querySelector<HTMLInputElement>('[data-testid=accept-terms]')!.click();
    await settle();
    pay(el).click();
    await settle();
    expect(pay(el).disabled).toBe(true);
    expect(pay(el).getAttribute('aria-busy')).toBe('true');
    expect(pay(el).textContent).toContain('Procesando pago');
    pay(el).click();
    expect(gw.calls).toHaveLength(1);
    gw.resolve!({ quoteNumber: 'CO-20261122-ABCDEF', paidAt: new Date().toISOString() });
  });

  it('US-03-AC-12 without terms for the country, payment is blocked with an explanation', async () => {
    const { el, api, settle } = await render();
    api.fields$.next(CO_FIELDS);
    api.plans$.next(CO_PLANS);
    api.terms$.next(null);
    await settle();
    expect(el.querySelector('[data-testid=terms-missing]')).not.toBeNull();
    expect(pay(el).disabled).toBe(true);
  });
});
