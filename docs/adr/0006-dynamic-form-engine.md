# ADR-0006 — Dynamic form engine: typed Reactive Forms + semantic `role` per field

- Status: Accepted (HC-2, 2026-11-22) · Specs: US-01-AC-02..05, -14, US-02 G-07, US-03-AC-02 · Gap: US-01 G-03

## Context
Step 1 must be generated from Strapi with typed validations. Downstream logic (pricing, masking,
summary grouping) must find "the birth date" or "the document number" even though field keys are
free text edited by business users.

## Options (form technology)
| Option | Pros | Cons |
|---|---|---|
| **Reactive Forms (`FormGroup<Record<string, FormControl>>`) built from config** | Stable API, rich validator model, `aria` wiring is ours | Some boilerplate |
| Signal Forms (`@angular/forms/signals`) | Signal-native | Experimental in Angular 21 — API may change; risk for an assessment |
| Third-party (Formly) | Fast | Extra dependency, its own config schema to map, harder a11y control |

## Options (finding semantic fields)
| Option | Pros | Cons |
|---|---|---|
| Hard-coded keys (`birthDate`) | Simple | Business renames → silent breakage |
| **`role` enum on the field (non-localized)** | Explicit contract; business can rename keys, reorder, add fields freely | One more attribute to fill (defaults to `none`) |

## Decision
Reactive Forms + `role`. Validators are pure factories in `core/domain/validators.ts` built from
the `validation` component (see skill `country-content-model` for the table). Unsupported field
types are dropped by the mapper with a warning (no values logged).

## Consequences
- ✅ Any combination of supported types/validations renders with no code change (US-01-AC-05).
- ✅ Migration to Signal Forms is localized in `DynamicForm` when it becomes stable.
- ⚠️ A *new validation kind* still needs code (documented recipe in the skill).
