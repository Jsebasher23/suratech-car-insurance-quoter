---
name: country-content-model
description: Project knowledge on how country (CO/CL) and language (es/en/pt) variability is modelled in Strapi 5 and consumed in Angular. Use before adding a content type, field, plan property, validation rule, country, or locale.
---

# Country & language content model (project skill)

Decisions: ADR-0001 (country = relation), ADR-0002 (language = Strapi i18n locale),
ADR-0003 (UI chrome dictionaries), ADR-0004 (public read-only permissions).

## Two independent axes
| Axis | Values | Where it lives | Why |
|---|---|---|---|
| **Country** (market) | `CO`, `CL` | `country` collection type + `manyToOne` relation on every market-specific type | business data: regulation, currency, documents, plans |
| **Language** | `es` (default), `en`, `pt` | Strapi i18n locale on *text* attributes only | presentation: the same plan in 3 languages |

Never encode the country in the locale (`es-CO`) — it couples market and language and
breaks "Chilean user reading in English".

## Content types (backend/src/api)
| Type | Localized attrs | Non-localized attrs |
|---|---|---|
| `country` | `name` | `code` (CO/CL, unique), `currency` (COP/CLP), `numberLocale` (es-CO), `flag`, `legalAge` |
| `form-field` | `label`, `helpText`, `errorMessage`, `placeholder`, `options[].label` | `key`, `type`, `section`, `required`, `order`, `validation{…}`, `options[].value`, `country` |
| `plan` | `name`, `shortDescription`, `coverages[]`, `benefits[]`, `badge` | `code`, `basePrice`, `currency`, `order`, `recommended`, `active`, `country` |
| `legal-term` | `title`, `body` | `version`, `country` |

Non-localized attributes are shared across locales automatically by Strapi 5
(`pluginOptions.i18n.localized: false`), so a business user changes a price **once**.

## Recipe: add a new form field (no code)
1. Strapi admin → Form field → Create (locale `es`) → key, type, section, order, country,
   validation → Publish.
2. Switch locale to `en` and `pt` → fill label/help/error → Publish.
3. Reload the app. Missing translations fall back to `es` (see `ContentApi`).

## Recipe: add a new validation kind (needs code — rare)
1. Add the attribute to component `form.validation` (schema.json).
2. Map it in `frontend/src/app/core/api/form-field.mapper.ts` → `FieldValidation`.
3. Implement it as a pure `ValidatorFn` factory in `core/domain/validators.ts` + tests.
4. Document it in this table:

| Validation attr | Applies to | Meaning |
|---|---|---|
| `minLength`/`maxLength` | text | string length |
| `pattern` | text | JS regex source, anchored automatically |
| `min`/`max` | number | numeric range |
| `minYearOffset`/`maxYearOffset` | number (year) | `currentYear+min ≤ v ≤ currentYear+max` (vehicle year: −20…+1) |
| `minAgeYears` | date | completed years at today ≥ value (legal age) |
| `validator` | text | named algorithm: `rut`, `co-document`, `plate-co`, `plate-cl`, `email` |

## Recipe: add a new country
Seed a `country` row + its fields, plans, terms in all locales. **No Angular change**: the
router accepts any code returned by `GET /api/countries`.

## Reading content from Angular
Always through `core/api/content-api.ts` → mappers → domain models. Queries always pass
`filters[country][code][$eq]`, `locale`, `sort`, and only published content is served by
the REST API by default. Plans additionally filter `active=true`.
