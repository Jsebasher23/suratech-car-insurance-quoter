import { Injectable, computed, signal } from '@angular/core';
import { FormValues } from '../domain/models';
import { PaymentDeclinedError, PaymentGateway, PaymentRequest } from '../payment/payment-gateway';
import { safeStorage } from '../util/safe-storage';

export type PaymentStatus = 'idle' | 'processing' | 'failed' | 'paid';

export interface Confirmation {
  quoteNumber: string;
  planName: string;
  amount: number;
  currency: string;
  numberLocale: string;
  paidAt: string;
}

export interface QuoteState {
  v: 1;
  formValues: FormValues;
  step1Complete: boolean;
  planCode: string | null;
  termsAccepted: boolean;
  termsVersion: string | null;
  payment: { status: PaymentStatus; attemptId: string | null; error: 'declined' | 'failed' | null };
  confirmation: Confirmation | null;
}

const empty = (): QuoteState => ({
  v: 1,
  formValues: {},
  step1Complete: false,
  planCode: null,
  termsAccepted: false,
  termsVersion: null,
  payment: { status: 'idle', attemptId: null, error: null },
  confirmation: null,
});

export const storageKey = (country: string) => `ciq.quote.v1.${country}`;

const newAttemptId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * ADR-0005 — single source of truth for the wizard, one state per country, persisted to
 * sessionStorage after every mutation (PII lives only for the tab session).
 */
@Injectable({ providedIn: 'root' })
export class QuoteStore {
  private readonly storage = safeStorage(() => globalThis.sessionStorage);
  private country: string | null = null;
  private readonly _state = signal<QuoteState>(empty());

  readonly state = this._state.asReadonly();
  readonly formValues = computed(() => this._state().formValues);
  readonly step1Complete = computed(() => this._state().step1Complete);
  readonly planCode = computed(() => this._state().planCode);
  readonly termsAccepted = computed(() => this._state().termsAccepted);
  readonly payment = computed(() => this._state().payment);
  readonly confirmation = computed(() => this._state().confirmation);
  readonly isProcessing = computed(() => this._state().payment.status === 'processing');

  /** Switches to (and restores) the state of `country`. Corrupt / old data is discarded. */
  useCountry(country: string): void {
    if (this.country === country) return;
    this.country = country;
    const raw = this.storage.get(storageKey(country));
    let restored = empty();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<QuoteState>;
        if (parsed.v === 1) {
          restored = { ...empty(), ...parsed } as QuoteState;
          // a reload in the middle of a payment must not leave the UI locked
          if (restored.payment.status === 'processing') {
            restored = { ...restored, payment: { ...restored.payment, status: 'idle' } };
          }
        }
      } catch {
        /* discard */
      }
    }
    this._state.set(restored);
  }

  setFormValues(values: FormValues, valid: boolean): void {
    this.patch({ formValues: { ...values }, step1Complete: valid });
  }

  selectPlan(code: string): void {
    this.patch({ planCode: code });
  }

  /** US-02-AC-13 — clears the selection if the chosen plan is no longer offered. */
  reconcilePlan(availableCodes: string[]): void {
    const current = this._state().planCode;
    if (current && !availableCodes.includes(current)) this.patch({ planCode: null });
  }

  /** US-03 G-07 — acceptance survives a language switch but not a new terms version. */
  syncTermsVersion(version: string | null): void {
    const s = this._state();
    if (s.termsVersion !== version) this.patch({ termsVersion: version, termsAccepted: false });
  }

  setTermsAccepted(accepted: boolean): void {
    this.patch({ termsAccepted: accepted });
  }

  /**
   * US-03-AC-08 — no double submission: a pay() while processing (or after paying) is a no-op.
   * US-03-AC-10 — on failure everything is kept so the user can retry.
   */
  async pay(
    gateway: PaymentGateway,
    req: Omit<PaymentRequest, 'attemptId'>,
    confirmation: Omit<Confirmation, 'quoteNumber' | 'paidAt'>,
  ): Promise<void> {
    const s = this._state();
    if (s.payment.status === 'processing' || s.payment.status === 'paid' || !s.termsAccepted) return;
    const attemptId = newAttemptId();
    this.patch({ payment: { status: 'processing', attemptId, error: null } });
    try {
      const result = await gateway.charge({ ...req, attemptId });
      // PII minimization: once paid, drop the form values and keep only the confirmation
      this.patch({
        formValues: {},
        step1Complete: false,
        termsAccepted: false,
        payment: { status: 'paid', attemptId, error: null },
        confirmation: { ...confirmation, quoteNumber: result.quoteNumber, paidAt: result.paidAt },
      });
    } catch (e) {
      this.patch({
        payment: { status: 'failed', attemptId, error: e instanceof PaymentDeclinedError ? 'declined' : 'failed' },
      });
    }
  }

  /** "New quote" from the confirmation screen. */
  reset(): void {
    this._state.set(empty());
    this.persist();
  }

  private patch(p: Partial<QuoteState>): void {
    this._state.update((s) => ({ ...s, ...p }));
    this.persist();
  }

  private persist(): void {
    if (this.country) this.storage.set(storageKey(this.country), JSON.stringify(this._state()));
  }
}
