# Project Structure

This document outlines the current repository layout after cleanup and legacy isolation.

## Top-level

- src/                Main application (Next.js App Router)
- prisma/             Prisma schema and migrations
- public/             Static assets
- scripts/            Maintenance, checks and test scripts
- docs/               Documentation and reports
- shared/             Shared utilities (client/server-safe)
- legacy/             Archived/legacy apps and functions (not part of builds)
- config files        next.config.js, tsconfig.json, .eslintrc.json, .eslintignore, .vercelignore, etc.

## src/

- app/
	- api/                       HTTP endpoints (App Router route handlers)
	- [segments]/                Pages and layouts
- components/                  Reusable UI components
- context/                     React contexts and Providers
- config/                      Local configuration (ads, etc.)
- libs/                        Low-level libs (e.g., prisma client)
- auth/                        NextAuth helpers
- utils/                       General helpers
- server/                      Backend layering (new)
	- controllers/               Orchestrate use-cases per endpoint
	- schemas/                   Zod schemas (input/output validation)
	- services/                  Integrations and domain services
	- repositories/              Data access (Prisma)
	- http/                      HTTP wrappers (auth, validation, rate limit, errors)

## legacy/

Contains older or alternative implementations preserved for reference. Excluded from lint/typecheck/deploy.

- legacy/frontend/             Legacy Next.js app
- legacy/backend/              Legacy backend/server
- legacy/netlify/              Legacy Netlify setup
- legacy/netlify-bisonte-api/  Legacy Netlify functions
- legacy/api-server/           Old API server code
- legacy/apps/, archive/       Archived apps and files

## Notes

- App Router API routes live under `src/app/api/**/route.(ts|js)`.
- Prefer TypeScript routes and avoid duplicate `.js` when `.ts/.tsx` exists.
- Use `export const dynamic = 'force-dynamic'` for routes that depend on `request.url` or headers.
- Environment validation should be centralized (e.g., `src/env.ts`).
- Tests should target `src/app/api/**` via an HTTP test harness.

