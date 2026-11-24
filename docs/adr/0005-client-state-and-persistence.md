# ADR-0005 — Client state: one signal store persisted to `sessionStorage`

- Status: Proposed — **HC-2 Johan Sebastian Beltran 2026-11-22** (tech lead: name + date) · Specs: US-01-AC-06, US-02-AC-13, US-03-AC-08/10/11, US-04-AC-04

## Options
| Option | Pros | Cons |
|---|---|---|
| NgRx Store / SignalStore | Devtools, patterns | Dependency and ceremony for ~6 fields |
| **Plain `@Injectable` store with `signal`s + `effect` → `sessionStorage`** | Tiny, typed, testable without TestBed; survives reload; cleared when the tab closes (PII minimization) | Hand-rolled versioning |
| `localStorage` | Survives browser restart | Keeps PII (document number, birth date) indefinitely on shared devices |
| IndexedDB | Large data | Overkill, async API |

## Decision
`QuoteStore` keyed by country (`ciq.quote.v1.CO`), so switching country never mixes data.
State: `{ formValues, planCode, termsAccepted, termsVersion, payment: {status, attemptId, quoteNumber, error} }`.
Stored JSON carries a schema version; incompatible versions are discarded. On successful payment
the form values are wiped and only the confirmation (quote number, plan name, price) is kept.

## Consequences
- ✅ Back/refresh keep data (US-01-AC-06); PII lives only for the tab session.
- ⚠️ Data is per tab; opening a second tab starts a new quote (acceptable, documented).
