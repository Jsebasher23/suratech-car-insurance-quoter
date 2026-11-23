import { TestBed } from '@angular/core/testing';
import { PaymentDeclinedError, PaymentGateway, PaymentRequest, PaymentResult } from '../payment/payment-gateway';
import { QuoteStore, storageKey } from './quote.store';

class ControlledGateway extends PaymentGateway {
  calls: PaymentRequest[] = [];
  private resolveFn?: (r: PaymentResult) => void;
  private rejectFn?: (e: unknown) => void;
  charge(req: PaymentRequest): Promise<PaymentResult> {
    this.calls.push(req);
    return new Promise((res, rej) => {
      this.resolveFn = res;
      this.rejectFn = rej;
    });
  }
  approve() { this.resolveFn?.({ quoteNumber: 'CO-20261122-ABC123', paidAt: '2026-11-22T20:00:00Z' }); }
  decline() { this.rejectFn?.(new PaymentDeclinedError()); }
}

const req = { countryCode: 'CO', planCode: 'CO-PLUS', amount: 149900, currency: 'COP', outcome: 'approve' as const };
const conf = { planName: 'Plus', amount: 149900, currency: 'COP', numberLocale: 'es-CO' };

describe('QuoteStore', () => {
  let store: QuoteStore;
  beforeEach(() => {
    sessionStorage.clear();
    store = TestBed.inject(QuoteStore);
    store.useCountry('CO');
  });

  it('US-01-AC-06 persists answers per country in sessionStorage and restores them', () => {
    store.setFormValues({ fullName: 'Ana' }, true);
    expect(JSON.parse(sessionStorage.getItem(storageKey('CO'))!).formValues).toEqual({ fullName: 'Ana' });
    store.useCountry('CL');
    expect(store.formValues()).toEqual({}); // countries never mix
    store.useCountry('CO');
    expect(store.formValues()).toEqual({ fullName: 'Ana' });
  });

  it('discards corrupt stored state', () => {
    sessionStorage.setItem(storageKey('CL'), '{not json');
    store.useCountry('CL');
    expect(store.formValues()).toEqual({});
  });

  it('US-02-AC-13 clears a plan that is no longer offered', () => {
    store.selectPlan('CO-OLD');
    store.reconcilePlan(['CO-PLUS']);
    expect(store.planCode()).toBeNull();
    store.selectPlan('CO-PLUS');
    store.reconcilePlan(['CO-PLUS']);
    expect(store.planCode()).toBe('CO-PLUS');
  });

  it('US-03 G-07 acceptance is reset when the terms version changes', () => {
    store.syncTermsVersion('v1');
    store.setTermsAccepted(true);
    store.syncTermsVersion('v1');
    expect(store.termsAccepted()).toBe(true);
    store.syncTermsVersion('v2');
    expect(store.termsAccepted()).toBe(false);
  });

  it('US-03-AC-06 does not pay without accepted terms', async () => {
    const gw = new ControlledGateway();
    await store.pay(gw, req, conf);
    expect(gw.calls).toHaveLength(0);
  });

  it('US-03-AC-08 ignores a second pay while processing (single charge, idempotency key)', async () => {
    const gw = new ControlledGateway();
    store.setTermsAccepted(true);
    const first = store.pay(gw, req, conf);
    expect(store.isProcessing()).toBe(true);
    await store.pay(gw, req, conf); // double click
    expect(gw.calls).toHaveLength(1);
    expect(gw.calls[0].attemptId).toBeTruthy();
    gw.approve();
    await first;
    expect(store.payment().status).toBe('paid');
    expect(store.confirmation()?.quoteNumber).toBe('CO-20261122-ABC123');
    expect(store.formValues()).toEqual({}); // PII dropped after payment (ADR-0005)
    await store.pay(gw, req, conf); // after paid
    expect(gw.calls).toHaveLength(1);
  });

  it('US-03-AC-10 a declined payment keeps data and allows a retry with a new attempt id', async () => {
    const gw = new ControlledGateway();
    store.setFormValues({ fullName: 'Ana' }, true);
    store.selectPlan('CO-PLUS');
    store.setTermsAccepted(true);
    const p = store.pay(gw, req, conf);
    gw.decline();
    await p;
    expect(store.payment()).toMatchObject({ status: 'failed', error: 'declined' });
    expect(store.formValues()).toEqual({ fullName: 'Ana' });
    expect(store.planCode()).toBe('CO-PLUS');
    expect(store.termsAccepted()).toBe(true);
    const retry = store.pay(gw, req, conf);
    expect(gw.calls).toHaveLength(2);
    expect(gw.calls[1].attemptId).not.toBe(gw.calls[0].attemptId);
    gw.approve();
    await retry;
    expect(store.payment().status).toBe('paid');
  });

  it('a reload during processing does not leave the pay button locked', () => {
    sessionStorage.setItem(storageKey('CL'), JSON.stringify({ v: 1, formValues: {}, payment: { status: 'processing', attemptId: 'x', error: null } }));
    store.useCountry('CL');
    expect(store.isProcessing()).toBe(false);
  });
});
