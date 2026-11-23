# QA handoff — Increment 1 (US-01, US-02, US-03, US-04)

Prepared by: `qa-handoff` agent role · Checkpoint: **HC-4 (QA accepts / returns defects)**

## Definition of Done check
| DoD item (CLAUDE.md §4) | Evidence | OK |
|---|---|---|
| Every AC mapped to ≥1 test | `node tools/traceability.mjs --check` (spec §8 tables are generated from real test titles, RV-06) | ✅ |
| Unit tests green | `logs/unit-tests-final.log` | ✅ |
| E2E green (desktop, mobile, keyboard-only) on the **production build + production CSP** | `logs/e2e-final-prod-build-csp.log` (12/12) | ✅ |
| No open blocker/major review findings | `docs/reviews/REVIEW-increment-1.md` (2nd pass) | ✅ — but HC-1/HC-2/HC-3 human sign-offs are still pending, so this note is **not** ready for HC-4 until they are signed |

## Environment
`docker compose up --build` → app http://localhost:8080 · admin http://localhost:1337/admin

## Scope to test
US-01-AC-01…14 · US-02-AC-01…13 · US-03-AC-01…13 · US-04-AC-01…07

## Fictitious test data
| Country | Valid | Invalid (expect configured message) |
|---|---|---|
| CO | Cédula `1020304050`, plate `ABC123`, mobile `3001234567`, birth `1990-05-17`, year `2021` | document `12345`, plate `AB1234`, year next+1, birth 17 years ago |
| CL | RUT `12.345.678-5` / `10.000.013-K`, patente `BCDF12` or `AE1234`, year `2020` | RUT `12.345.678-4`, patente `AEIO12` |

## Recipes
- **Payment failure:** summary → *Resultado simulado del pago (sandbox)* → *Rechazar* → *Pagar*. Expect the alert, data kept, retry possible.
- **Config change without deploy (US-01-AC-05):** Strapi → Content Manager → *Form field* → *Create new entry* (locale *es*): key `licenseYears`, label "Años con licencia", type `number`, section `policyholder`, order `55`, country *Colombia*, required ✔ → **Publish**. Reload `/co/quote/data`: the field appears after "Correo electrónico". Switch to EN: label falls back to Spanish until an `en` localization is published.
- **No plans (US-02-AC-07):** set `active = false` on the 3 CO plans (or unpublish them) → step 2 shows the "no plans" message.
- **Recommended (US-02-AC-03/04):** flag a second plan as recommended → only the first by `order` is highlighted.
- **Terms by country (US-03-AC-05):** edit the CO terms body in Strapi and publish → summary shows the new text; CL unaffected.
- **Deep links / back button:** open `/co/quote/summary` in a new tab → redirected to step 1. After paying, browser *Back* stays on the confirmation.

## Known limitations
- Session data lives in `sessionStorage` per tab (ADR-0005): a second tab starts a new quote.
- Prices are monthly premiums from a simulated rule (ADR-0007), not a rating engine.
- `docker compose` was validated statically in the authoring sandbox (no Docker Hub access); see README "Requirements not met".
