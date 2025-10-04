# Vercel Deployment Guide (Bisonte)

Use this guide whenever you promote a new build of the logistics dashboard. It captures the configuration that keeps the Next.js + NextAuth stack healthy in production.

---

## ✅ Pre-flight checklist

1. **Dependencies**
   - `npm install --ignore-scripts`
   - Ensure `package-lock.json` stays committed
2. **Quality gates**
   - `npm run lint`
   - `npm run test`
3. **Prisma** (if schema changed)
   - `npm run prisma:migrate:deploy`
4. **Environment parity**
   - Copy `.env.example` to `.env.local`
   - Confirm secrets are valid

---

## 🌐 Environment variables (Production)

Set these in Vercel → **Settings → Environment Variables**. All public URLs should point to `https://bisonteapp.com`.

| Variable | Value |
| --- | --- |
| `NEXTAUTH_SECRET` | 32+ char secret from 1Password |
| `NEXTAUTH_URL` | `https://bisonteapp.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://bisonteapp.com` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://bisonteapp.com/api` |
| `NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN` | `https://bisonteapp.com` |
| `FALLBACK_API_BASE_URL` | `https://bisonteapp.com/api` |
| `ALLOWED_ORIGINS` | `https://bisonteapp.com,https://www.bisonteapp.com` |
| `BASE_URL` | `https://bisonteapp.com/api` |
| `DATABASE_URL` | Prisma connection string |
| `RESEND_API_KEY` | Resend API key |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `CENTRAL_RATE_LIMIT_SECRET` | Shared secret for rate limiter |

For preview deployments, swap URLs for the preview domain (e.g. `https://project-branch.vercel.app`) but keep the secrets identical.

---

## 🚀 Deploying

1. **Repository**
   - Project: `bisonte-logistica`
   - Framework: **Next.js**
2. **Commands**
   - Install: `npm install --ignore-scripts`
   - Build: `npm run build`
3. **Artifacts**
   - Output directory: auto (`.vercel/output`)
   - Include the `prisma/` folder (`.vercelignore` should not exclude it)
4. **Branches**
   - Production: `main`
   - Preview: all other branches

---

## 🔄 Post-deploy verification

1. Check `https://bisonteapp.com/api/health`
2. Run the auth diagnostic:
   ```powershell
   $env:BASE_URL = "https://bisonteapp.com"
   npm run diagnostics:auth
   ```
3. Manually log in with a test account and trigger password recovery
4. Review Vercel logs for `server-only` or Prisma warnings
5. Ensure any Netlify fallback is disabled or mirrors the same env vars

---

## 🛠️ Troubleshooting hints

- **Cookie issues on `www.`**: force apex redirect and ensure cookies use `.bisonteapp.com`
- **OAuth 500 errors**: verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- **Prisma client mismatch**: run `npm run prisma:generate`, commit the result, redeploy
- **Aggressive rate limits**: double-check `CENTRAL_RATE_LIMIT_SECRET` and `ALLOWED_ORIGINS`

---

## 📎 Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run diagnostics:auth` | Full auth flow smoke test |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:studio` | Inspect database |
| `npm run test` | App test suite |
| `npm run lint` | ESLint with warnings treated as failures |

Keep this document updated as the deployment pipeline evolves.# Vercel Deployment Guide (Bisonte)# Vercel Deployment Instructions



Use this guide whenever you promote a new build of the logistics dashboard. It captures the exact configuration proven to work with the current Next.js + NextAuth stack and helps avoid regressions related to environment variables or preview domains.## 🚀 Deploy to Vercel Production



---### 1. Push Code to GitHub

```bash

## ✅ Pre-flight checklistgit add .

git commit -m "Production ready configuration"

1. **Dependencies**git push

   - Local install with `npm install --ignore-scripts` (required because Prisma codegen is handled manually via `npm run prisma:generate`).```

   - Confirm `package-lock.json` is committed.

2. **Lint & tests**### 2. Connect to Vercel

   - `npm run lint`1. Go to [vercel.com](https://vercel.com)

   - `npm run test` (or targeted suites relevant to your change)2. Import your GitHub repository: `3000bisonte/Bisonte-modificado`

3. **Prisma**3. Configure project settings

   - If you touched the schema, run `npm run prisma:migrate:deploy` locally and ensure `prisma/migrations` is up to date.

4. **Environment parity**### 3. Environment Variables in Vercel Dashboard

   - `cp .env.example .env.local` (if needed) and verify secrets are valid.

**Required Variables:** Copy these to Vercel Environment Variables section:

---

**Core:**

## 🌐 Environment variables (Production)```

NODE_ENV=production

Set these in the Vercel project dashboard under **Settings → Environment Variables**. Pay special attention to domains: all references should point to `https://bisonteapp.com`.APP_VERSION=1.0.0

```

| Variable | Value |

| --- | --- |**Database:**

| `NEXTAUTH_SECRET` | Unique 32+ char string (consult 1Password) |```

| `NEXTAUTH_URL` | `https://bisonteapp.com` |DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

| `NEXT_PUBLIC_SITE_URL` | `https://bisonteapp.com` |```

| `NEXT_PUBLIC_API_BASE_URL` | `https://bisonteapp.com/api` |

| `NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN` | `https://bisonteapp.com` |**Authentication:**

| `FALLBACK_API_BASE_URL` | `https://bisonteapp.com/api` |```

| `ALLOWED_ORIGINS` | `https://bisonteapp.com,https://www.bisonteapp.com` |NEXTAUTH_URL=https://bisonte-modificado.vercel.app

| `BASE_URL` | `https://bisonteapp.com/api` |NEXTAUTH_SECRET=<generated-random-secret>

| `DATABASE_URL` | Prisma connection string |```

| `RESEND_API_KEY` | Resend (transactional email) key |

| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |**Google OAuth:**

| `CENTRAL_RATE_LIMIT_SECRET` | Shared secret for rate limiter |```

GOOGLE_CLIENT_ID=<google-oauth-client-id>

For **Preview** environments, point URLs to the preview domain (e.g., `https://bisonteapp-git-feature.vercel.app`) and keep secrets identical to production.GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

```

---

**Email:**

## 🚀 Deploying```

RESEND_API_KEY=<resend-api-key>

1. **Connect repository**EMAIL_FROM=logistica@notificaciones.bisonteapp.com

   - Vercel project: `bisonte-logistica` (monorepo root).```

   - Framework preset: **Next.js**.

2. **Build & output settings****Public URLs:**

   - Build command: `npm run build````

   - Install command: `npm install --ignore-scripts`NEXT_PUBLIC_SITE_URL=https://bisonte-modificado.vercel.app

   - Output directory: `.vercel/output` (auto for Next.js).NEXT_PUBLIC_API_BASE_URL=https://bisonte-modificado.vercel.app/api

3. **Prisma considerations**NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true

   - Add `prisma generate` to `postinstall` if using edge runtime; otherwise keep manual.NEXT_PUBLIC_APP_NAME=Bisonte Logística

   - Ensure `prisma` folder is included (not ignored in `.vercelignore`).NEXT_PUBLIC_APP_VERSION=1.0.0

4. **Branches**```

   - Production: `main`

   - Preview: every other branch automatically creates a preview deployment.**Security:**

```

---WEBHOOK_SECRET=<webhook-secret>

ADMIN_EMAILS=3000bisonte@gmail.com

## 🔄 Post-deploy verificationCORS_ORIGINS=https://bisonte-modificado.vercel.app

RATE_LIMIT_ENABLED=true

After Vercel finishes building:RATE_LIMIT_PER_MINUTE=60

```

1. Visit `https://bisonteapp.com/api/health` to confirm API is reachable.

2. Execute the auth diagnostic script against production:### 4. Deploy

   ```powershell1. Click "Deploy" in Vercel dashboard

   $env:BASE_URL = "https://bisonteapp.com"2. Wait for build completion

   npm run diagnostics:auth3. Your app will be available at: `https://bisonte-modificado.vercel.app`

   ```

3. Manually log in with a test account and confirm session persistence and password recovery flows.### 5. Post-Deployment

4. Check Vercel logs for `server-only` import warnings or Prisma errors.- Update Google OAuth redirect URIs to include your Vercel domain

5. Confirm Netlify (if still in use) is either disabled or mirrors the environment variables to avoid inconsistencies.- Test all authentication flows

- Test email functionality

---- Monitor deployment logs



## 🛠️ Troubleshooting hints## 🔧 Troubleshooting



- **Cookies missing on `www.` subdomain**: Ensure Vercel forces redirect to apex and that session cookies are issued for `.bisonteapp.com`.**Build Fails:**

- **Auth callback returns 500**: Inspect `NEXTAUTH_URL` / `NEXTAUTH_SECRET`. Mismatched domains commonly cause CSRF errors.- Check environment variables are set correctly

- **Prisma client mismatch**: Re-run `npm run prisma:generate`, commit the generated client (if applicable), and redeploy.- Verify all dependencies are in package.json

- **Rate limit misfires**: Validate `CENTRAL_RATE_LIMIT_SECRET` and `ALLOWED_ORIGINS` alignment between Vercel and Netlify functions.- Check build logs in Vercel dashboard



---**Authentication Issues:**

- Verify NEXTAUTH_URL matches your domain

## 📎 Useful scripts- Check Google OAuth redirect URIs

- Ensure NEXTAUTH_SECRET is set

| Script | Purpose |

| --- | --- |**Database Issues:**

| `npm run diagnostics:auth` | Full auth flow smoke test |- Verify DATABASE_URL is accessible from Vercel

| `npm run prisma:generate` | Regenerate Prisma client |- Check database connection limits

| `npm run prisma:studio` | Launch Prisma Studio |- Ensure database allows SSL connections
| `npm run test` | Application test suite |
| `npm run lint` | ESLint with strict failure on warnings |

Keep this document updated as the deployment pipeline evolves. Small tweaks to domain configuration or secrets should be reflected here immediately to preserve a reliable guide for the next deploy.