# ADR-0008 — Simulated payment gateway behind an injectable port

- Status: Proposed — **HC-2 Johan Sebastian Beltran 2026-11-22** (tech lead: name + date) · Specs: US-03-AC-07..11 · Gap: US-03 G-06

## Options
| Option | Pros | Cons |
|---|---|---|
| Random failure (e.g. 20 %) | "Realistic" | Flaky e2e; QA cannot reproduce |
| Fail on magic data (email `+fail`) | No extra UI | Hidden knowledge; couples payment to form content that business can remove |
| **`PaymentGateway` abstract class + `MockPaymentGateway`; outcome chosen in a visible, clearly labelled "Sandbox" selector (Approve / Decline)** | Deterministic, discoverable by QA and evaluators, swappable for a real adapter via DI | A demo control is visible in the UI (labelled, and would be removed by providing the real adapter) |

## Decision
Third option. Latency 1.2 s (configurable for tests), returns `{ quoteNumber }` or throws
`PaymentDeclinedError`. Double submission prevented in two layers: the button (`disabled` +
`aria-busy`) and the store (`pay()` is a no-op unless status ∈ {idle, failed}); each attempt
has an `attemptId` (idempotency key) that a real gateway would receive.

## Consequences
- ✅ Deterministic e2e for both success and failure paths.
- ✅ Real gateway = new class + one provider line; no card data ever touches our code (a real
  integration would use the provider's hosted fields/redirect).
