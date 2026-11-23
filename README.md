# Ruta Segura — Multi-country car insurance quote (Angular 21 + Strapi 5)

One Angular build that sells car insurance in **Colombia** and **Chile**, with every form field,
plan and legal text managed from **Strapi** by the business team, and the whole UI and CMS content
available in **Spanish, English and Portuguese** (runtime switch).

> The way this was built (agents, skills, specs, ADRs, reviews, human checkpoints) is described in
> **[FLOW.md](./FLOW.md)** — that is 65 % of the assessment, so please start there.

## Run it — one command

```bash
docker compose up --build
```

| What | URL |
|---|---|
| App (country picker) | http://localhost:8080 |
| Colombia directly | http://localhost:8080/co/quote/data |
| Chile directly | http://localhost:8080/cl/quote/data |
| Strapi admin (business team) | http://localhost:1337/admin — create the first admin user on first visit |

First boot seeds fictitious content for CO and CL in es/en/pt (`backend/src/seed/data.ts`) and
enforces the read-only Public permissions (`backend/src/bootstrap/permissions.ts`).
Secrets are generated per installation on first boot (`backend/docker-entrypoint.sh`); nothing
secret is committed. To reset all content: `docker compose down -v`.

### Run without Docker (development)

```bash
# terminal 1 — Strapi (seeds on first boot)
cd backend && cp .env.example .env   # then replace the "tobemodified" values
npm install && npm run develop       # http://localhost:1337

# terminal 2 — Angular (proxies /api → :1337, see proxy.conf.json)
cd frontend && npm install && npm start   # http://localhost:4200
```

## Tests

```bash
cd frontend
npm test                       # Vitest unit + component tests (130 tests)
npm run lint                   # ESLint + angular-eslint + project rules (e.g. no country literals in components)
npm run preview:prod           # production build served with the same CSP/headers as nginx (:8081)
npm run e2e                    # Playwright (12 tests), needs the app running (E2E_BASE_URL, default :4200)
E2E_BASE_URL=http://localhost:8081 npm run e2e      # against the production build + CSP (recommended)
node ../tools/traceability.mjs --check              # every acceptance criterion has ≥1 test
E2E_BASE_URL=http://localhost:8080 npm run e2e      # against docker compose
docker compose --profile e2e run --rm e2e           # e2e inside the official Playwright image
```
If the Playwright browser CDN is blocked, point to any local Chromium:
`PW_CHROMIUM_PATH=/path/to/chrome npm run e2e`.

Every test title starts with the acceptance-criterion ID it proves (e.g. `US-03-AC-08 …`); the
AC → test matrix is at the end of each spec in [`docs/specs/`](./docs/specs). Raw outputs of the
runs are in [`logs/`](./logs).

## What a reviewer can try in 5 minutes

| Try | Where |
|---|---|
| Same app, different country: fields, document (cédula vs RUT), plate format, currency, terms | `/co/…` vs `/cl/…` |
| Switch ES / EN / PT mid-wizard — data is kept, CMS copy changes, prices keep the country format | header switch |
| Add/reorder a field without code | Strapi → *Form field* → create (locale es) → set country, type, order → **Publish** → reload app |
| Hide a plan | Strapi → *Plan* → `active = false` or unpublish → reload |
| Mark another plan recommended | Strapi → *Plan* → `recommended` (only the first by order is highlighted — US-02 G-01) |
| Payment failure + retry | Summary → "Simulated payment result (sandbox)" → *Decline* |
| Keyboard only | Tab / Space / arrows / Enter through the whole wizard |
| Valid fictitious test data | CO: cédula `1020304050`, plate `ABC123` · CL: RUT `12.345.678-5`, patente `BCDF12` |

## Architecture at a glance

```
Browser ──► nginx (web:8080) ──/api (GET only)──► Strapi 5 (Public role: find/findOne on 4 types)
             │ serves Angular build                    │ SQLite volume, i18n es/en/pt
             └─ CSP, no token anywhere                 └─ seed + permission enforcement at bootstrap
```

| Concern | Decision | ADR |
|---|---|---|
| Country differentiation | `country` collection + relation on every market type; country = URL segment `/co`, `/cl` | [0001](docs/adr/0001-multi-country-content-strategy.md) |
| Content language | Strapi i18n locales `es`/`en`/`pt`, only text attributes localized, fallback to `es` | [0002](docs/adr/0002-content-localization-strapi-i18n.md) |
| UI language | typed signal-based `I18nService`, same build | [0003](docs/adr/0003-runtime-ui-translations.md) |
| Security | no token in the browser, minimal Public role enforced in code, GET-only proxy | [0004](docs/adr/0004-security-public-read-only.md) |
| State | one signal store per country in `sessionStorage` | [0005](docs/adr/0005-client-state-and-persistence.md) |
| Dynamic form | typed Reactive Forms + semantic `role` per field | [0006](docs/adr/0006-dynamic-form-engine.md) |
| Price | documented simulated rule (vehicle age × driver age) | [0007](docs/adr/0007-simulated-pricing-rule.md) |
| Payment | `PaymentGateway` port + mock with sandbox outcome, idempotency key | [0008](docs/adr/0008-simulated-payment-gateway.md) |
| Tooling | Claude Code subagents + skills, own SDD variant | [0009](docs/adr/0009-ai-tooling-and-sdd-variant.md) |

Frontend layout: `core/` (api + mappers, domain pure functions, i18n, state, routing guards),
`features/` (one folder per wizard step), `shared/ui/`. Angular 21: standalone components,
signals, `input()/output()`, `@if/@for/@switch`, OnPush, zoneless, lazy routes, no NgModules.

## Requirements not met / deviations (and why)

| Item | Status | Why / mitigation |
|---|---|---|
| `docker compose up` verified end-to-end | **Not executed in the authoring sandbox** | Docker Hub was unreachable from the environment where this was built, so images could not be pulled. Compose, Dockerfiles and entrypoint were validated statically (`docker compose config`, `sh -n`), the Strapi production build and the Angular production build were run successfully, and the same production bundle was verified end-to-end with Strapi behind a local server that sends the nginx headers (`npm run preview:prod`, e2e 12/12). Please report if the first `docker compose up --build` fails on your machine. |
| Strapi admin user seeded | Not seeded on purpose | Creating an admin with a password in the repo would mean committing credentials; Strapi asks for one on first visit. |
| Strapi as source for pricing factors | Not done | Simulated rule lives in code (ADR-0007, option 3 rejected as YAGNI). |
| Signal Forms | Not used | Experimental in Angular 21; Reactive Forms chosen (ADR-0006). |
| Business content in the admin for the 3 locales | Seeded for all 3 | New content created only in `es` is shown in `es` for every language (fallback, US-04-AC-05). |
| Human sign-offs (HC-1 specs, HC-2 ADRs, HC-3 review triage) | **Pending** | Built in one session at the operator's request; statuses are honestly marked pending. Sign them before submitting (FLOW.md §4–5). |
| Review findings RV-10, RV-20…RV-28 | Open (minor/nit) | Await HC-3 triage — see the review report's second pass. |
| Unedited agent session logs | Partial | `logs/` contains the raw tool outputs (scaffold, builds, tests, API smoke, review). The full chat transcript must be exported from the Claude session by the candidate — see FLOW.md §7. |

All people, companies, IDs, plates and legal texts in this repository are **fictitious**.
