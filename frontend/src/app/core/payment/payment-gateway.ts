import { Injectable, InjectionToken, inject } from '@angular/core';
import { generateQuoteNumber } from '../domain/quote-number';

export type SandboxOutcome = 'approve' | 'decline';

export interface PaymentRequest {
  attemptId: string; // idempotency key (ADR-0008)
  countryCode: string;
  planCode: string;
  amount: number;
  currency: string;
  outcome: SandboxOutcome;
}

export interface PaymentResult {
  quoteNumber: string;
  paidAt: string;
}

export class PaymentDeclinedError extends Error {
  constructor() {
    super('PAYMENT_DECLINED');
    this.name = 'PaymentDeclinedError';
  }
}

/** Port: swap `MockPaymentGateway` for a real adapter with one provider line (ADR-0008). */
export abstract class PaymentGateway {
  abstract charge(req: PaymentRequest): Promise<PaymentResult>;
}

export const PAYMENT_LATENCY_MS = new InjectionToken<number>('PAYMENT_LATENCY_MS', {
  providedIn: 'root',
  factory: () => 1200,
});

@Injectable()
export class MockPaymentGateway extends PaymentGateway {
  private readonly latency = inject(PAYMENT_LATENCY_MS);
  private readonly processed = new Map<string, PaymentResult>();

  async charge(req: PaymentRequest): Promise<PaymentResult> {
    await new Promise((r) => setTimeout(r, this.latency));
    const previous = this.processed.get(req.attemptId);
    if (previous) return previous; // idempotent replay
    if (req.outcome === 'decline') throw new PaymentDeclinedError();
    const now = new Date();
    const result = { quoteNumber: generateQuoteNumber(req.countryCode, now), paidAt: now.toISOString() };
    this.processed.set(req.attemptId, result);
    return result;
  }
}
