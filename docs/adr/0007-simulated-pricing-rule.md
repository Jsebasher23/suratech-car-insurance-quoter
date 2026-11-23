# ADR-0007 — Simulated pricing rule

- Status: Proposed — **HC-2 sign-off pending** (tech lead: name + date) · Specs: US-02-AC-09, US-02 G-07

## Context
The brief allows a simulated final price based on step-1 data, as long as it is documented.

## Options
1. Show base price only — simplest, but ignores the business rule's intent.
2. **Deterministic multiplicative factors from vehicle age and driver age** — explainable to the user ("Why this price?"), unit-testable, country-agnostic.
3. Factors configured in Strapi per country — more flexible but adds a content type nobody asked for (YAGNI; noted as future work).

## Decision (option 2)
```
vehicleAge = currentYear − vehicleYear
vehicleAgeFactor = 0.95 if vehicleAge ≤ 1 · 1.00 if 2–5 · 1.10 if 6–10 · 1.25 if 11–20
driverAge = completed years from birthDate
driverAgeFactor  = 1.20 if < 25 · 1.00 if 25–64 · 1.10 if ≥ 65
final = round(basePrice × vehicleAgeFactor × driverAgeFactor / 100) × 100
```
Missing `vehicleYear`/`birthDate` role (business removed the field) → factor 1.00.
Implemented in `frontend/src/app/core/domain/pricing.ts`; the UI lists the applied factors.

## Consequences
- ✅ Transparent, testable (boundary table in `pricing.spec.ts`).
- ⚠️ Same factors for CO and CL; per-country factors would be content (future ADR).
