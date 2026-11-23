# ADR-0004 — Security: no token in the browser, Public role read-only on 4 types

- Status: Accepted (HC-2, 2026-11-22) · Specs: technical requirement "Security", US-03

## Context
The brief forbids any Strapi token with write permissions in the browser and requires minimal,
justified Public permissions.

## Options
| Option | Pros | Cons |
|---|---|---|
| Read-only API token in `environment.ts` | Can revoke | Still a secret in a public bundle (anyone can copy it); no benefit over Public role for public content |
| BFF (Node) holding a token, proxying to Strapi | Token never public; can add caching | Extra service to build/run/test for read-only public content |
| **Public role with `find` + `findOne` only on `country`, `form-field`, `plan`, `legal-term`; no token at all; nginx reverse proxy `/api` → Strapi** | Zero secrets in the browser; same-origin (no CORS widening); permissions set in code at bootstrap → reproducible & reviewable | Content is world-readable (it is public marketing content anyway) |

## Decision
Third option. `backend/src/bootstrap/permissions.ts` sets the Public role on every boot to
**exactly** these 8 actions and removes any other Public action (drift protection: if someone
ticks "create" in the admin, the next boot reverts it and logs a warning).
Not granted: `create/update/delete` on anything, `users-permissions` register/auth endpoints are
disabled for Public (no end-user accounts in scope), upload `find` not granted (no media used).
Quotes and payments are **not** persisted in Strapi (front-end persistence, ADR-0005), so the
browser never needs write access.

CORS: `config/middlewares.ts` allows only the configured `FRONTEND_ORIGIN` (dev server), the
production path is same-origin through nginx. Admin panel is exposed on its own port for the
business team; its JWT/salts come from environment variables generated per environment
(`.env.example` contains placeholders only).

## Consequences
- ✅ Nothing to leak; review checklist greps `frontend/` for `token|Bearer|apiKey`.
- ⚠️ If quotes must be stored later, add a BFF/custom route with server-side token — new ADR.
