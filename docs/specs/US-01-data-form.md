# US-01 — Policyholder and vehicle data form

Status: Draft — **HC-1 sign-off pending** (Product Owner: name + date). Implemented in the 2026-11-22 session at the operator's request before formal sign-off; see FLOW.md §4.
Story: [docs/user-stories/US-01.md](../user-stories/US-01.md) · ADRs: [ADR-0001](../adr/0001-multi-country-content-strategy.md), [ADR-0002](../adr/0002-content-localization-strapi-i18n.md), [ADR-0005](../adr/0005-client-state-and-persistence.md), [ADR-0006](../adr/0006-dynamic-form-engine.md)

## 1. Goal
Capture policyholder and vehicle data with a form whose fields, types, validations, copy and
order are 100 % defined in Strapi per country, so business can change it without a deploy.

## 2. Scope
**In:** step 1 screen, dynamic form engine, field types `text | number | select | date | checkbox`,
typed validators, section grouping, persistence of entered values, country routing.
**Out:** address autocomplete, real vehicle registry lookups, server-side validation (no backend
of our own; Strapi is read-only for the browser — ADR-0004).

## 3. Acceptance criteria
| ID | Given / When / Then | Source | Test type |
|----|---|---|---|
| US-01-AC-01 | Given fields for CO and CL in Strapi, when I open `/co/quote/data`, then I see **only** CO fields | Scenario "Form configured by country" | e2e + unit (mapper/query) |
| US-01-AC-02 | Fields are rendered ascending by `order` (ties → by `key`) inside their section, sections in order *policyholder → vehicle* | Scenario "Form configured by country" | unit |
| US-01-AC-03 | Given a field violates its validation, when it is blurred or I press *Continue*, then the **configured** `errorMessage` appears next to it, linked via `aria-describedby` | Scenario "Field validation" | component + e2e |
| US-01-AC-04 | Given any field is invalid, when I press *Continue*, then I stay on step 1 and focus moves to the first invalid field | Scenario "Field validation" + G-08 | component + e2e |
| US-01-AC-05 | Given business publishes a new field in Strapi, when I reload, then it is rendered with no code change | Scenario "Configuration change without deployment" | unit (engine renders any config) + manual QA recipe |
| US-01-AC-06 | Given I reached step 2, when I go back to step 1 (button, browser back, or summary "Edit"), then all values are still filled | Scenario "Keep data when going back" | e2e |
| US-01-AC-07 | Select options come from Strapi (`options[]`) in the active language | Business rule | unit (mapper) |
| US-01-AC-08 | Vehicle year is valid iff `currentYear − 20 ≤ year ≤ currentYear + 1` | Business rule + G-01 | unit (boundaries) |
| US-01-AC-09 | Birth date is valid iff completed age at today ≥ `country.legalAge` (18 in CO and CL) | Business rule + G-02 | unit (boundaries) |
| US-01-AC-10 | Chilean RUT is validated with the modulo-11 check digit (accepts dots/hyphen, `K` case-insensitive) | Context (RUT) + G-05 | unit |
| US-01-AC-11 | While the configuration loads I see a skeleton; if it fails I see an error with *Retry*; if the country has 0 fields I see an empty-state message and cannot continue | CLAUDE.md §3.9 + G-06 | component |
| US-01-AC-12 | Every control has a visible `<label>`; required fields are announced; the form is fully operable by keyboard | Tech req. accessibility | e2e (keyboard) + component |
| US-01-AC-13 | An unknown country code in the URL shows the country picker instead of a broken form | G-07 | unit (guard) |
| US-01-AC-14 | A field type not in the supported list is skipped (not rendered, warning logged without values), the rest of the form works | G-04 | unit (mapper) |

## 4. Business rules (formalised)
- **R1 Vehicle year** (`validation.minYearOffset = −20`, `maxYearOffset = +1`): integer;
  `currentYear − 20 ≤ v ≤ currentYear + 1`, **both inclusive**. "More than 20 years old" is read
  as `currentYear − v > 20`.
- **R2 Legal age** (`country.legalAge`, 18 in CO and CL; a field may override it with `validation.minAgeYears`, RV-08): completed years computed on the user's local
  calendar date; turning 18 **today** is valid; birth dates in the future are invalid.
- **R3 Required**: empty string, `null` and unchecked checkbox are "empty". A required checkbox must be `true`.
- **R4 Error copy**: when a control is invalid the field's `errorMessage` is shown (one configured
  message per field, as the story says). If `requiredMessage` is configured and the control is
  empty, it is shown instead. If no copy is configured at all, the generic UI message
  `form.errors.generic` is used (should never happen with seed data — reviewer check).
- **R5 Patterns** are anchored (`^…$`) by the engine so business users cannot accidentally write partial matches.

## 5. Gap analysis
| Gap | Question the story does not answer | Decision | Risk if wrong |
|---|---|---|---|
| G-01 | Is year `currentYear+1` valid? Is "20 years old" inclusive? | ASSUMPTION: both inclusive (R1) | 1 boundary year wrongly accepted/rejected — covered by unit tests, cheap to flip in Strapi (offsets are content) |
| G-02 | Legal age: same in both countries? on birthday? | ASSUMPTION: 18 in CO & CL, stored as `country.legalAge` and referenced by the field validation so a new country can differ | Wrong age for a future country — content change only |
| G-03 | Pricing (US-02) and masking (US-03) need to know *which* field is the birth date / document / vehicle year — but keys are free text edited by business | **NEEDS-ADR → ADR-0006**: each field has an optional semantic `role` enum (`documentNumber`, `birthDate`, `vehicleYear`, …). Logic uses roles, never keys | Business renames a key and pricing silently breaks |
| G-04 | What if Strapi sends a type we do not support? | Skip field + `console.warn(key,type)` (no values) | A required field silently disappears → mitigated: QA recipe + reviewer check |
| G-05 | Document validation per country? | CO: digits 6–10 (`co-document`); CL: RUT mod-11 (`rut`); named `validator` attribute | Rejecting real-but-unusual IDs — validator selectable per field from Strapi |
| G-06 | Strapi down / slow / no fields | Error + Retry; empty state blocks Continue | — |
| G-07 | How is "context of a country" set? | **NEEDS-ADR → ADR-0001**: URL path segment `/:country/…` | Shareable links break if changed later |
| G-08 | When are errors shown? | On blur and on submit (not on every keystroke) | UX preference only |
| G-09 | Business removes a field while a user has saved data | Values for unknown keys are dropped on load; select values not in options are reset | Stale PII stays in sessionStorage → dropped |
| G-10 | Languages? | **NEEDS-ADR → ADR-0002/0003** (US-04) | — |

## 6. Data contract — `GET /api/form-fields?filters[country][code][$eq]=CO&locale=es&sort=order:asc&populate=*`
| Field | Type | Localized | Req | Example |
|---|---|---|---|---|
| `key` | string (unique per country) | no | ✔ | `documentNumber` |
| `label` | string | **yes** | ✔ | `Número de documento` |
| `type` | enum `text,number,select,date,checkbox` | no | ✔ | `text` |
| `section` | enum `policyholder,vehicle` | no | ✔ | `policyholder` |
| `role` | enum `none,fullName,documentType,documentNumber,birthDate,email,phone,vehicleYear,vehiclePlate,vehicleMake,vehicleUse,city` | no | ✔ | `documentNumber` |
| `required` | boolean | no | ✔ | `true` |
| `order` | integer | no | ✔ | `30` |
| `placeholder`, `helpText`, `errorMessage`, `requiredMessage` | string | **yes** | – | `Solo números, sin puntos` |
| `validation` | component `form.validation` (`minLength,maxLength,min,max,pattern,minYearOffset,maxYearOffset,minAgeYears,validator`) | no | – | `{ "validator": "rut" }` |
| `options[]` | repeatable `form.option` (`value` non-localized, `label` localized) | mixed | – | `{ value: "CC", label: "Cédula de ciudadanía" }` |
| `country` | relation manyToOne → `country` | no | ✔ | `CO` |

## 7. UX states
Loading skeleton (3 rows) · error card with Retry · empty state · keyboard: Tab order follows
visual order, Enter submits · mobile: single column ≤ 640 px, two columns ≥ 900 px · language
switch re-fetches labels and **keeps values** (US-04).

## 8. Traceability
<!-- TRACE:START (generated by tools/traceability.mjs — do not edit by hand) -->
| AC | Tests (file › title) | Coverage |
|---|---|---|
| US-01-AC-01 | `src/app/core/api/content-api.spec.ts` › US-01-AC-01 queries form fields filtered by country and locale, without any auth header<br>`src/app/features/data-step/data-step.spec.ts` › US-01-AC-01/02 renders only the configured fields, in order, grouped by section<br>`e2e/quote-flow.spec.ts` › US-01-AC-01 only the fields configured for Colombia are shown | ✅ covered |
| US-01-AC-02 | `src/app/core/api/form-field.mapper.spec.ts` › US-01-AC-02 sorts by section (policyholder → vehicle), then order, then key<br>`src/app/features/data-step/data-step.spec.ts` › US-01-AC-01/02 renders only the configured fields, in order, grouped by section | ✅ covered |
| US-01-AC-03 | `src/app/core/domain/validators.spec.ts` › US-01-AC-03 required checkbox must be checked<br>`src/app/core/domain/validators.spec.ts` › US-01-AC-03 select only accepts configured options<br>`src/app/core/domain/validators.spec.ts` › US-01-AC-03 shows requiredMessage when empty<br>`src/app/core/domain/validators.spec.ts` › US-01-AC-03 shows the configured errorMessage when a rule fails<br>`src/app/features/data-step/data-step.spec.ts` › US-01-AC-03 shows the configured error message linked by aria-describedby<br>`e2e/edge-cases.spec.ts` › US-01-AC-03/04 invalid field shows its Strapi message and blocks the step | ✅ covered |
| US-01-AC-04 | `src/app/features/data-step/data-step.spec.ts` › US-01-AC-04 blocks continue and focuses the first invalid field<br>`e2e/edge-cases.spec.ts` › US-01-AC-03/04 invalid field shows its Strapi message and blocks the step | ✅ covered |
| US-01-AC-05 | `src/app/core/domain/form-builder.spec.ts` › US-01-AC-05 builds a control for ANY configured field without code changes | ✅ covered |
| US-01-AC-06 | `src/app/core/domain/form-builder.spec.ts` › US-01-AC-06 restores saved values and is valid with valid data<br>`src/app/core/state/quote.store.spec.ts` › US-01-AC-06 persists answers per country in sessionStorage and restores them<br>`src/app/features/data-step/data-step.spec.ts` › US-01-AC-06 restores saved values and navigates to plans when valid<br>`e2e/quote-flow.spec.ts` › US-01-AC-06 keeps data when going back (button and browser back) | ✅ covered |
| US-01-AC-07 | `src/app/core/api/form-field.mapper.spec.ts` › US-01-AC-07 maps select options from Strapi | ✅ covered |
| US-01-AC-08 | `src/app/core/domain/validators.spec.ts` › US-01-AC-08 year %s valid=%s | ✅ covered |
| US-01-AC-09 | `src/app/core/domain/validators.spec.ts` › US-01-AC-09 born %s valid=%s<br>`src/app/core/domain/validators.spec.ts` › US-01-AC-09 falls back to country.legalAge when the birthDate field has no minAgeYears<br>`e2e/edge-cases.spec.ts` › US-01-AC-09 a minor cannot continue | ✅ covered |
| US-01-AC-10 | `src/app/core/domain/rut.spec.ts` › US-01-AC-10 %s valid=%s<br>`src/app/core/domain/rut.spec.ts` › US-01-AC-10 computes 0 and K check digits | ✅ covered |
| US-01-AC-11 | `src/app/features/data-step/data-step.spec.ts` › US-01-AC-11 shows a skeleton while loading, an error with Retry, and an empty state<br>`src/app/features/data-step/data-step.spec.ts` › US-01-AC-11 empty configuration blocks Continue<br>`e2e/edge-cases.spec.ts` › US-01-AC-11 Strapi down → error with retry that recovers | ✅ covered |
| US-01-AC-12 | `src/app/features/data-step/data-step.spec.ts` › US-01-AC-12 every control has an associated label<br>`e2e/keyboard.spec.ts` › US-01-AC-12 completes the wizard with keyboard only (Chile; US-02-AC-06 arrow keys in the plan group) | ✅ covered |
| US-01-AC-13 | `src/app/core/routing/step.guards.spec.ts` › US-01-AC-13 redirects an unknown country to the picker<br>`src/app/core/routing/step.guards.spec.ts` › US-01-AC-13 accepts a known country case-insensitively<br>`e2e/edge-cases.spec.ts` › US-01-AC-13 unknown country shows the picker | ✅ covered |
| US-01-AC-14 | `src/app/core/api/form-field.mapper.spec.ts` › US-01-AC-14 skips unsupported field types and warns without values | ✅ covered |
<!-- TRACE:END -->
