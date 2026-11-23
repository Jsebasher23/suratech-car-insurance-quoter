# US-02 — Plan list

Status: Approved (HC-1 — candidate as Product Owner proxy, 2026-11-22)
Story: [docs/user-stories/US-02.md](../user-stories/US-02.md) · ADRs: [ADR-0001](../adr/0001-multi-country-content-strategy.md), [ADR-0002](../adr/0002-content-localization-strapi-i18n.md), [ADR-0007](../adr/0007-simulated-pricing-rule.md)

## 1. Goal
Let the person compare the plans their country offers and choose exactly one, with a final
price adjusted to their step-1 data and shown in the country's currency.

## 2. Scope
**In:** step 2 screen, plan cards, recommended highlight, simulated pricing, single selection,
empty/error/loading states, price formatting per country.
**Out:** real rating engine, plan comparison table export, discounts/coupons.

## 3. Acceptance criteria
| ID | Given / When / Then | Source | Test type |
|----|---|---|---|
| US-02-AC-01 | Given step 1 is valid, when I reach step 2, then I see only plans that are **published**, `active = true` and of my country | Scenario "Plans for the country" | unit (query) + e2e |
| US-02-AC-02 | Plans are shown ascending by `order` (ties → by `name`) | Scenario "Plans for the country" | unit |
| US-02-AC-03 | The plan flagged `recommended` is visually distinguished (badge + accent border) **and** the distinction is exposed to assistive tech (badge text inside the radio's accessible name) | Scenario "Recommended plan" | component + e2e |
| US-02-AC-04 | If more than one plan is flagged, only the **first by order** is highlighted | G-01 | unit |
| US-02-AC-05 | When I select a plan it is marked as chosen (`aria-checked`, visual state) and *Continue* becomes enabled | Scenario "Plan selection" | component + e2e |
| US-02-AC-06 | Only one plan can be selected at a time (native radio group; arrow keys move selection) | Business rule | component |
| US-02-AC-07 | Given there are no active plans for my country, then I see a message explaining that no plans are available and *Continue* stays disabled | Scenario "No plans available" | component + e2e (route-mocked) |
| US-02-AC-08 | Prices use the country currency and number format (`COP` / `es-CO`, `CLP` / `es-CL`, 0 decimals) regardless of the UI language | Business rule + ADR-0002 | unit (MoneyPipe) |
| US-02-AC-09 | Final price = documented simulated rule applied to base price (ADR-0007); a "Why this price?" disclosure lists the factors applied | Business rule | unit (pricing) + component |
| US-02-AC-10 | A plan whose `currency` ≠ country currency is not shown (content error, warning logged) | G-03 | unit |
| US-02-AC-11 | Navigating to `/xx/quote/plans` without a valid step 1 redirects to step 1 | G-05 | unit (guard) |
| US-02-AC-12 | Loading skeleton; on error a message with *Retry* | CLAUDE.md §3.9 | component |
| US-02-AC-13 | If the previously selected plan is no longer offered, the selection is cleared | G-04 | unit (store) |

## 4. Business rules (formalised)
- **Visibility:** `publishedAt ≠ null` (Strapi REST default `status=published`) ∧ `active` ∧ `country.code = ctx`.
- **Price:** see ADR-0007. `final = roundTo100(basePrice × vehicleAgeFactor × driverAgeFactor)`.
  Prices are **monthly premiums** (G-02).
- **Selection:** exactly 0 or 1 `planCode` in the store; selecting another replaces it.

## 5. Gap analysis
| Gap | Question | Decision | Risk if wrong |
|---|---|---|---|
| G-01 | Two or more plans flagged recommended? | Highlight only the first by order; the seed keeps one | Business confused why the second is not highlighted → documented in the Strapi field description |
| G-02 | Is the price monthly or yearly? | ASSUMPTION: monthly; label "/month" comes from the i18n dictionary | Wrong expectation in UI copy only |
| G-03 | Plan currency differs from country currency? | Treat as content error: hide the plan | A plan disappears → warning in console + reviewer checklist |
| G-04 | Plan unpublished while user is on step 3? | Store clears the selection when the plan list no longer contains it; summary re-validates | User pays a withdrawn plan → avoided |
| G-05 | Deep link to step 2 | Guard requires valid step 1 | — |
| G-06 | Coverages shape? | Repeatable component `plan.coverage { name, detail }` (localized) | — |
| G-07 | Which step-1 data drives the price? | Fields with `role = birthDate` and `role = vehicleYear` (ADR-0006); missing role → factor 1.0 | Business removes the birth date field → price = base |

## 6. Data contract — `GET /api/plans?filters[country][code][$eq]=CL&filters[active][$eq]=true&locale=pt&sort[0]=order:asc&populate=*`
| Field | Type | Localized | Example |
|---|---|---|---|
| `code` | string | no | `CL-FULL` |
| `name`, `shortDescription`, `badge` | string | yes | `Total` |
| `basePrice` | decimal | no | `38990` |
| `currency` | enum `COP,CLP` | no | `CLP` |
| `coverages[]` | repeatable `plan.coverage {name, detail}` | yes | `Daño propio` |
| `benefits[]` | repeatable `plan.benefit {text}` | yes | `Auto de reemplazo 7 días` |
| `order` | integer | no | `20` |
| `recommended`, `active` | boolean | no | `true` |
| `country` | relation | no | `CL` |

## 7. UX states
Skeleton cards · error + Retry · empty message · cards stack on mobile, 3-up grid on desktop ·
radio group keyboard behaviour · prices re-computed (not re-fetched) when step-1 data changes.

## 8. Traceability
| AC | Test | Status |
|---|---|---|
| AC-01 | `content-api.spec.ts › US-02-AC-01 queries active plans for the country`; e2e full flow | ✅ |
| AC-02 | `plan.mapper.spec.ts › US-02-AC-02 sorts by order then name` | ✅ |
| AC-03 | `plans-step.spec.ts › US-02-AC-03 distinguishes the recommended plan`; e2e | ✅ |
| AC-04 | `plan.mapper.spec.ts › US-02-AC-04 highlights only the first recommended` | ✅ |
| AC-05 | `plans-step.spec.ts › US-02-AC-05 marks selection and enables continue` ; e2e | ✅ |
| AC-06 | `plans-step.spec.ts › US-02-AC-06 single selection` | ✅ |
| AC-07 | `plans-step.spec.ts › US-02-AC-07 shows empty message`; `e2e/edge-cases.spec.ts › US-02-AC-07` | ✅ |
| AC-08 | `money.spec.ts › US-02-AC-08 formats COP/CLP with the country locale` | ✅ |
| AC-09 | `pricing.spec.ts › US-02-AC-09 …` (factor table) | ✅ |
| AC-10 | `plan.mapper.spec.ts › US-02-AC-10 drops plans with foreign currency` | ✅ |
| AC-11 | `step.guards.spec.ts › US-02-AC-11 …` | ✅ |
| AC-12 | `plans-step.spec.ts › US-02-AC-12 error and retry` | ✅ |
| AC-13 | `quote.store.spec.ts › US-02-AC-13 clears a withdrawn plan` | ✅ |
