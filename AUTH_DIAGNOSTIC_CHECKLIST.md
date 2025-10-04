# Auth Flow Diagnostic Checklist

This checklist keeps the Bisonte authentication experience healthy across registration, login, session handling, and password recovery. Run it after deployments, domain changes, or whenever users report login issues.

## 1. Domain alignment (production)

Make sure the platform serves exclusively from `https://bisonteapp.com`. Validate these environment variables in the hosting provider (Vercel or equivalent):

| Variable | Expected value |
| --- | --- |
| `NEXTAUTH_URL` | `https://bisonteapp.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://bisonteapp.com` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://bisonteapp.com/api` |
| `NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN` | `https://bisonteapp.com` |
| `FALLBACK_API_BASE_URL` | `https://bisonteapp.com/api` |
| `ALLOWED_ORIGINS` | `https://bisonteapp.com,https://www.bisonteapp.com` |
| `BASE_URL` | `https://bisonteapp.com/api` |

> Keep the `www` hostname as an alias/redirect so cookies issued for `.bisonteapp.com` remain valid.

## 2. Automated smoke test

Use the CLI helper to validate the full auth pipeline. The script registers a temporary user, logs in, confirms the session, and exercises password recovery.

```powershell
$env:BASE_URL = "https://bisonteapp.com"
npm run diagnostics:auth
```

Optional flags:

- Reuse a known user with `DIAG_LOGIN_EMAIL` and `DIAG_LOGIN_PASSWORD`.
- Skip registration when cached credentials exist via `DIAG_SKIP_REGISTER=1`.
- Force a fresh user even if cached credentials exist with `DIAG_FORCE_REGISTER=1`.
- Add `DEBUG=1` for verbose logs.

Success output example:

```
→ 1) Registrando usuario... OK
→ 2) Iniciando sesión con credenciales... OK
→ 3) Verificando sesión persistente... OK
→ 4) Solicitando recuperación de contraseña... OK
✅ Diagnóstico completado
```

Credentials are cached at `scripts/auth/.diagnostics-auth-cache.json`; remove the file to regenerate them.

## 3. Manual QA flow (web)

1. **Registration** (`/register`)
   - Submit a brand-new email.
   - Confirm validation for weak passwords and required fields.
   - Ensure success redirects to `/registro-exitoso`.
2. **Auto-login**
   - From `/registro-exitoso`, press **Comenzar** and verify the session on `/home`.
   - Confirm that `localStorage` keys `nombreRegistro`, `emailRegistro`, and `passwordRegistro` are cleared.
3. **Credential login** (`/login`)
   - Sign in with the same credentials and ensure the form accepts them.
   - Trigger rate limiting with repeated wrong passwords and confirm the error messaging.
4. **Session persistence**
   - Refresh `/home` and verify the session is still active.
   - Check `/api/auth/session`; it should return user metadata.
5. **Password recovery** (`/recuperar`)
   - Request a recovery email for the test account.
   - Confirm the success toast and verify the email in Resend/SMTP.
6. **Logout**
   - Sign out and ensure cookies and storage are cleared.

## 4. Edge cases to monitor

- **Google sign-in**: Test both desktop browsers and mobile WebView bridge (`/auth/bridge`).
- **Account reuse**: Register an email that previously used Google; it should now accept credentials.
- **Password updates**: After changing a password, older sessions should invalidate (`passwordVersion`).
- **Rate limits**: Confirm repeated failed logins surface the lockout message and reset correctly.

## 5. Incident quick-reference

1. Capture the affected email and domain.
2. Run `npm run diagnostics:auth` against production for a baseline.
3. Review hosting environment variables and latest deploy logs.
4. Inspect the Prisma `usuarios` table (duplicates, missing hashes) with `prisma studio`.
5. Check Resend for suppression or bounces if recovery emails fail.

Update this checklist as new findings or edge cases emerge.# Auth Flow Diagnostic Checklist# Auth Flow Diagnostic Checklist



This checklist centralises the key checks to keep the Bisonte authentication experience healthy across registration, login, session handling, and password recovery. Run it after deployments, domain changes, or whenever users report login issues.This checklist centralises the key checks to keep the Bisonte authentication experience healthy across registration, login, session handling, and password recovery. Run it after deployments, domain changes, or whenever users report login issues.



## 1. Domain alignment (production)## 1. Domain alignment (production)



Update the platform to serve exclusively from `https://bisonteapp.com` (the apex). Double-check these environment variables in Vercel (or the chosen host):Update the platform to serve exclusively from `https://bisonteapp.com` (the apex). Double-check these environment variables in Vercel (or the chosen host):



| Variable | Expected value || Variable | Expected value |

| --- | --- || --- | --- |

| `NEXTAUTH_URL` | `https://bisonteapp.com` || `NEXTAUTH_URL` | `https://bisonteapp.com` |

| `NEXT_PUBLIC_SITE_URL` | `https://bisonteapp.com` || `NEXT_PUBLIC_SITE_URL` | `https://bisonteapp.com` |

| `NEXT_PUBLIC_API_BASE_URL` | `https://bisonteapp.com/api` || `NEXT_PUBLIC_API_BASE_URL` | `https://bisonteapp.com/api` |

| `NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN` | `https://bisonteapp.com` || `NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN` | `https://bisonteapp.com` |

| `FALLBACK_API_BASE_URL` | `https://bisonteapp.com/api` || `FALLBACK_API_BASE_URL` | `https://bisonteapp.com/api` |

| `ALLOWED_ORIGINS` | `https://bisonteapp.com,https://www.bisonteapp.com` || `ALLOWED_ORIGINS` | `https://bisonteapp.com,https://www.bisonteapp.com` |

| `BASE_URL` | `https://bisonteapp.com/api` || `BASE_URL` | `https://bisonteapp.com/api` |



> Keep the `www` hostname as an alias/redirect in Vercel so cookies issued for `.bisonteapp.com` remain valid on both hosts.> Keep the `www` hostname as an alias/redirect in Vercel so cookies issued for `.bisonteapp.com` remain valid on both hosts.



## 2. Automated smoke test## 2. Automated smoke test



Use the new CLI helper to validate the full auth pipeline. The script registers a disposable user, logs in, confirms the session, and exercises password recovery.Use the new CLI helper to validate the full auth pipeline. The script registers a disposable user, logs in, confirms the session, and exercises password recovery.



```powershell```powershell

# BASE_URL defaults to http://localhost:3000 if omitted# BASE_URL defaults to http://localhost:3000 if omitted

$env:BASE_URL = "https://bisonteapp.com"$env:BASE_URL = "https://bisonteapp.com"

npm run diagnostics:authnpm run diagnostics:auth

``````



Advanced options:Advanced options:



- Reutiliza un usuario existente sin registrar otro: define `DIAG_LOGIN_EMAIL` y `DIAG_LOGIN_PASSWORD`.- Reutiliza un usuario existente sin registrar otro: define `DIAG_LOGIN_EMAIL` y `DIAG_LOGIN_PASSWORD`.

- Para omitir el paso de registro y usar credenciales cacheadas automáticamente, añade `DIAG_SKIP_REGISTER=1`.- Para omitir el paso de registro y usar credenciales cacheadas automáticamente, añade `DIAG_SKIP_REGISTER=1`.

- El script guarda las últimas credenciales exitosas en `scripts/auth/.diagnostics-auth-cache.json`; bórralo si deseas regenerarlas.- El script guarda las últimas credenciales exitosas en `scripts/auth/.diagnostics-auth-cache.json`; bórralo si deseas regenerarlas.



Success output should resemble:Success output should resemble:



``````

→ 1) Registrando usuario... OK→ 1) Registrando usuario... OK

→ 2) Obteniendo token CSRF... OK→ 2) Obteniendo token CSRF... OK

→ 3) Iniciando sesión con credenciales... OK→ 3) Iniciando sesión con credenciales... OK

→ 4) Verificando sesión persistente... OK→ 4) Verificando sesión persistente... OK

→ 5) Solicitando recuperación de contraseña... OK→ 5) Solicitando recuperación de contraseña... OK

✅ Diagnóstico completado✅ Diagnóstico completado

``````



If any step fails, re-run with `DEBUG=1` to view the full stack trace:If any step fails, re-run with `DEBUG=1` to view the full stack trace:



```powershell```powershell

$env:DEBUG = "1"$env:DEBUG = "1"

npm run diagnostics:authnpm run diagnostics:auth

``````



## 3. Manual QA flow (web)## 3. Manual QA flow (web)



1. **Registration form** (`/register`)1. **Registration form** (`/register`)

   - Submit a brand-new email.   - Submit a brand-new email.

   - Confirm validation messages for weak passwords or missing fields.   - Confirm validation messages for weak passwords or missing fields.

   - Ensure success redirects to `/registro-exitoso`.   - Ensure success redirects to `/registro-exitoso`.

2. **Auto-login from success page**2. **Auto-login from success page**

   - Click **Comenzar** and verify the user lands on `/home` with an active session (check the developer tools > Application > Cookies).   - Click **Comenzar** and verify the user lands on `/home` with an active session (check the developer tools > Application > Cookies).

   - Confirm that `localStorage` keys `nombreRegistro`, `emailRegistro`, and `passwordRegistro` are removed after a successful login.   - Confirm that `localStorage` keys `nombreRegistro`, `emailRegistro`, and `passwordRegistro` are removed after a successful login.

3. **Credential login page** (`/login`)3. **Credential login page** (`/login`)

   - Retry with the same email and password; the form should not reject fresh credentials.   - Retry with the same email and password; the form should not reject fresh credentials.

   - Validate rate-limit feedback after repeated wrong inputs (error message should mention too many attempts or account lockout).   - Validate rate-limit feedback after repeated wrong inputs (error message should mention too many attempts or account lockout).

4. **Session persistence**4. **Session persistence**

   - Refresh `/home` and ensure the session is still active.   - Refresh `/home` and ensure the session is still active.

   - Open `/api/auth/session` in a new tab; it must return the signed-in user metadata.   - Open `/api/auth/session` in a new tab; it must return the signed-in user metadata.

5. **Password recovery** (`/recuperar`)5. **Password recovery** (`/recuperar`)

   - Request a recovery email for the test account.   - Request a recovery email for the test account.

   - Verify that the success toast appears immediately.   - Verify that the success toast appears immediately.

   - Check the Resend dashboard (or SMTP fallback) to confirm delivery, and open the link/code to guarantee it resolves to the new domain.   - Check the Resend dashboard (or SMTP fallback) to confirm delivery, and open the link/code to guarantee it resolves to the new domain.

6. **Logout**6. **Logout**

   - Execute a logout and confirm cookies/session storage are cleared.   - Execute a logout and confirm cookies/session storage are cleared.



## 4. Edge cases to monitor## 4. Edge cases to monitor



- **Google sign-in**: Validate both desktop browser and mobile WebView flows (bridge to `/auth/bridge`).- **Google sign-in**: Validate both desktop browser and mobile WebView flows (bridge to `/auth/bridge`).

- **Account reuse**: Re-registering an email that previously used Google should now attach a password and allow credential logins.- **Account reuse**: Re-registering an email that previously used Google should now attach a password and allow credential logins.

- **Password updates**: After changing a password, verify that older sessions are invalidated (via `passwordVersion`).- **Password updates**: After changing a password, verify that older sessions are invalidated (via `passwordVersion`).

- **Rate limits**: Repeated failed logins should surface the lockout message and reset after the configured window.- **Rate limits**: Repeated failed logins should surface the lockout message and reset after the configured window.



## 5. Incident quick-reference## 5. Incident quick-reference



When auth reports arrive:When auth reports arrive:



1. Capture the exact email/domain the user used.1. Capture the exact email/domain the user used.

2. Run `npm run diagnostics:auth` against production to confirm the baseline.2. Run `npm run diagnostics:auth` against production to confirm the baseline.

3. Check Vercel environment variables and recent deploy logs for domain mismatches.3. Check Vercel environment variables and recent deploy logs for domain mismatches.

4. Inspect the Prisma `usuarios` table for duplicate emails or missing `password` hashes with `prisma studio`.4. Inspect the Prisma `usuarios` table for duplicate emails or missing `password` hashes with `prisma studio`.

5. Review the Resend activity log for suppression or bounces if recovery emails are missing.5. Review the Resend activity log for suppression or bounces if recovery emails are missing.



Keeping this checklist handy should make auth regressions easy to spot and quick to fix. Feel free to append new findings or edge cases as they arise.Keeping this checklist handy should make auth regressions easy to spot and quick to fix. Feel free to append new findings or edge cases as they arise.

