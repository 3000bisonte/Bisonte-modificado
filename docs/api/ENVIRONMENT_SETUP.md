# Environment Setup

This project validates critical environment variables at startup and during prebuild using `envalid` (see `src/lib/env.ts`). The build will fail fast if something important is missing or malformed.

## Files
- `.env.example`: template with all required keys. Copy to `.env.local` for local dev.
- `.env.local`: local development secrets (never commit).
- Production: set secrets in your hosting provider (Vercel/Netlify) using the same keys.

## Required Variables

- Core
  - `NODE_ENV` (development|test|production)
  - `APP_VERSION` (optional; defaults to `dev`)
- Database (Prisma)
  - `DATABASE_URL` (PostgreSQL/MySQL connection string)
- NextAuth
  - `NEXTAUTH_URL` (absolute, e.g., https://bisonteapp.com)
  - `NEXTAUTH_SECRET` (32+ chars)
- Google OAuth (optional)
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Email (Resend)
  - `RESEND_API_KEY` (required if emails are sent)
  - `EMAIL_FROM` (default from address)
- MercadoPago
  - `MP_ACCESS_TOKEN`
  - `MP_PUBLIC_KEY`
- Security (legacy)
  - `JWT_SECRET` (avoid defaults in production)
  - `TOKEN_SECRET`
- Public URLs
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
- Ads (public)
  - `NEXT_PUBLIC_ADMOB_*`, `NEXT_PUBLIC_ADSENSE_*`
- CORS
  - `ALLOWED_ORIGINS` (comma-separated)
- Misc
  - `RUNTIME_ENV`

## How validation works
- Import `env` from `src/lib/env.ts` anywhere you access `process.env`.
- The prebuild step `scripts/prebuild-env-check.js` imports `env.ts` to force validation during CI and `npm run build`.
- If a variable is missing or invalid, the script exits with a clear error.

## Best practices
- Never expose secrets as `NEXT_PUBLIC_*`.
- Prefer a single `DATABASE_URL` used by Prisma.
- Keep `.env.local` for local only. Set production values in the platform dashboard.
- Rotate `NEXTAUTH_SECRET`, `JWT_SECRET`, and API keys periodically.
