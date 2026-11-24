# ADR-0001 — Multi-country content strategy: `country` as a relation + country in the URL path

- Status: Proposed — **HC-2 Johan Sebastian Beltran 2026-11-22** (tech lead: name + date)
- Deciders: architect agent (proposal), candidate (approval)
- Specs: US-01-AC-01, US-01-AC-13, US-02-AC-01, US-03-AC-05 · Gaps: US-01 G-07

## Context and problem
One Angular build must sell in Colombia and Chile. Each country has its own documents,
currency, plans, coverages, legal terms and copy, edited by a non-technical team in Strapi.
We must decide (a) how content is partitioned by country in Strapi and (b) how the Angular app
knows the current country.

## Decision drivers
1. Business users must not be able to break the other country by mistake.
2. Adding a 3rd country must need **zero** Angular changes and no new deployment of the CMS.
3. Language must remain an independent axis (US-04: a Chilean user reading Portuguese).
4. Simple, cacheable public REST queries (no write tokens, ADR-0004).

## Considered options — Strapi side
| Option | Pros | Cons |
|---|---|---|
| **A. `country` collection type + `manyToOne` relation on every market-specific type** | Country is data (currency, legal age, number locale live on it); filter `filters[country][code][$eq]=CO`; a new country is a new row; works with i18n as a separate axis | Relation must be set on every entry (seed + required field); queries need the filter (encapsulated in `ContentApi`) |
| B. Use Strapi i18n locales as countries (`es-CO`, `es-CL`) | Built-in, locale switcher in admin | Couples country and language: "Chile in English" needs `en-CL` and duplicates every entry per language×country; non-localized fields (price!) would be shared across countries — dangerous |
| C. Separate Strapi instance / database per country | Strong isolation | 2× infra and 2× admin logins; the "same build" app needs runtime routing to different APIs; cross-country content (shared field definitions) duplicated |
| D. Enumeration field `country: enum(CO,CL)` instead of a relation | Simplest schema | Country attributes (currency, locale, legal age, flag) have nowhere to live; adding a country = schema change = deploy |

## Considered options — Angular side
| Option | Pros | Cons |
|---|---|---|
| **1. URL path segment `/:country/quote/…`** | Shareable, bookmarkable, testable, same build; SEO-friendly; the guard validates against `GET /api/countries` | Every route has the param |
| 2. Sub-domain `co.example.com` | Clean URLs | Needs DNS/TLS per country, harder locally and in e2e |
| 3. Build-time environment per country | Trivial code | **Violates "same build"** |
| 4. Geo-IP detection | Zero clicks | Wrong for travellers/VPN; not testable; still needs an override |

## Decision
**Option A + Option 1.** `country` (non-localized `code`, `currency`, `numberLocale`, `legalAge`,
`flag`; localized `name`) is referenced by `form-field`, `plan` and `legal-term`. The app reads
the country from the first path segment, resolves it against `/api/countries` in a functional
guard and exposes it through `CountryContext` (signal). The landing page `/` lists the countries
returned by Strapi, so a new country appears automatically.

## Consequences
- ✅ New country = Strapi content only (verified by the seed: CO and CL share zero code paths).
- ✅ Country-specific behaviour (currency, legal age, number format) is data, so components
  contain no `if (country === 'CO')` (enforced by CLAUDE.md §3.3 and the review checklist).
- ✅ Independent language axis (ADR-0002).
- ⚠️ Every market-specific type must have the `country` relation marked **required**; an entry
  without country would be invisible in both markets (acceptable failure mode: invisible, not
  wrong market).
- ⚠️ Business can reuse a field definition across countries only by duplicating the entry
  (Strapi has no "many countries" UX that is safer than one-per-entry). Accepted: explicit > clever.
