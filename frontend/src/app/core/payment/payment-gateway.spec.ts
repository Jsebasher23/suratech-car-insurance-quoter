import { TestBed } from '@angular/core/testing';
import { QUOTE_NUMBER_PATTERN } from '../domain/quote-number';
import { MockPaymentGateway, PAYMENT_LATENCY_MS, PaymentDeclinedError } from './payment-gateway';

describe('MockPaymentGateway', () => {
  let gw: MockPaymentGateway;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MockPaymentGateway, { provide: PAYMENT_LATENCY_MS, useValue: 0 }] });
    gw = TestBed.inject(MockPaymentGateway);
  });
  const base = { countryCode: 'CL', planCode: 'CL-COMPLETE', amount: 32990, currency: 'CLP' };

  it('US-03-AC-09 approves with a quote number in the documented format', async () => {
    const r = await gw.charge({ ...base, attemptId: 'a1', outcome: 'approve' });
    expect(r.quoteNumber).toMatch(QUOTE_NUMBER_PATTERN);
    expect(r.quoteNumber.startsWith('CL-')).toBe(true);
  });

  it('US-03-AC-10 declines deterministically when the sandbox says so', async () => {
    await expect(gw.charge({ ...base, attemptId: 'a2', outcome: 'decline' })).rejects.toBeInstanceOf(PaymentDeclinedError);
  });

  it('US-03-AC-08 is idempotent per attemptId', async () => {
    const a = await gw.charge({ ...base, attemptId: 'same', outcome: 'approve' });
    const b = await gw.charge({ ...base, attemptId: 'same', outcome: 'approve' });
    expect(b.quoteNumber).toBe(a.quoteNumber);
  });
});
