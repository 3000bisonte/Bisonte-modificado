#!/usr/bin/env node

/**
 * Bisonte auth pipeline diagnostic
 *
 * Steps covered:
 *  1. Register a disposable user via /api/register (unless DIAG_SKIP_REGISTER=1)
 *  2. Perform a credential login using NextAuth
 *  3. Validate the active session via /api/auth/session
 *  4. Trigger password recovery UX via /api/auth/password/request
 *
 * Usage:
 *   BASE_URL="https://bisonteapp.com" npm run diagnostics:auth
 *
 * Optional env vars:
 *   DIAG_LOGIN_EMAIL / DIAG_LOGIN_PASSWORD  - reuse existing credentials
 *   DIAG_SKIP_REGISTER=1                    - reuse cached credentials if available
 *   DIAG_FORCE_REGISTER=1                   - always create a brand-new user
 *   DEBUG=1                                 - print verbose output
 */

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const process = require('node:process');

const rawBaseUrl =
  process.env.BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000';
const BASE_URL = rawBaseUrl.replace(/\/$/, '');

const CACHE_PATH = path.resolve(process.cwd(), 'scripts', 'auth', '.diagnostics-auth-cache.json');
const cookieStore = new Map();

function debugLog(message) {
  if (process.env.DEBUG) {
    console.log(message);
  }
}

async function readCachedCredentials() {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed?.email && parsed?.password) {
      return parsed;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`⚠️  No se pudo leer cache de credenciales: ${error.message}`);
    }
  }
  return null;
}

async function writeCachedCredentials(credentials) {
  try {
    await fs.writeFile(CACHE_PATH, JSON.stringify(credentials, null, 2), 'utf8');
  } catch (error) {
    console.warn(`⚠️  No se pudo almacenar cache de credenciales: ${error.message}`);
  }
}

function getSetCookie(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  if (typeof headers.raw === 'function') {
    const raw = headers.raw();
    if (Array.isArray(raw?.['set-cookie'])) {
      return raw['set-cookie'];
    }
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

function storeCookies(response) {
  const cookies = getSetCookie(response.headers);
  for (const cookie of cookies) {
    const [nameValue] = cookie.split(';');
    if (!nameValue) continue;
    const [name, ...valueParts] = nameValue.split('=');
    if (!name) continue;
    cookieStore.set(name.trim(), valueParts.join('=').trim());
  }
  if (cookies.length > 0) {
    debugLog(`🍪  Cookies almacenadas: ${Array.from(cookieStore.keys()).join(', ')}`);
  }
}

function buildCookieHeader() {
  if (cookieStore.size === 0) return '';
  return Array.from(cookieStore.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function fetchWithSession(url, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookieHeader = buildCookieHeader();
  if (cookieHeader) {
    headers.set('Cookie', cookieHeader);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  storeCookies(response);
  return response;
}

async function fetchFollowRedirects(url, init = {}, maxRedirects = 8) {
  let currentUrl = url;
  let options = { ...init };
  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetchWithSession(currentUrl, {
      ...options,
      redirect: 'manual',
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      return response;
    }

    const nextUrl = new URL(location, currentUrl).toString();
    debugLog(`↪️  ${response.status} ${currentUrl} -> ${nextUrl}`);

    if (response.status === 303 && options.method && options.method !== 'GET') {
      options = { ...options, method: 'GET', body: undefined };
    }

    currentUrl = nextUrl;
  }

  throw new Error(`Demasiados redireccionamientos al solicitar ${url}`);
}

async function step(label, action) {
  process.stdout.write(`→ ${label}... `);
  try {
    const result = await action();
    console.log('OK');
    return result;
  } catch (error) {
    console.log('FAIL');
    throw error;
  }
}

async function registerUser(credentials) {
  const response = await fetchWithSession(`${BASE_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Diagnóstico Bisonte',
      celular: '+573001234567',
      ciudad: 'Bogotá',
      email: credentials.email,
      password: credentials.password,
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { raw: text };
  }

  if (response.status === 201) {
    debugLog(`🆕  Usuario registrado: ${credentials.email}`);
    return { status: 201, data };
  }

  if (response.status === 409 || response.status === 429) {
    debugLog(`ℹ️  Registro respondió ${response.status}: ${text}`);
    return { status: response.status, data };
  }

  throw new Error(`Registro falló (${response.status}): ${text}`);
}

async function getCsrfToken() {
  const response = await fetchWithSession(`${BASE_URL}/api/auth/csrf`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CSRF request failed (${response.status}): ${text}`);
  }

  const payload = await response.json();
  const token = payload?.csrfToken;
  if (!token) {
    throw new Error('No se obtuvo csrfToken');
  }
  debugLog(`🔑  csrfToken recibido: ${token.slice(0, 6)}…`);
  return token;
}

async function fetchSigninPage() {
  const response = await fetchFollowRedirects(`${BASE_URL}/api/auth/signin/credentials`, {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo acceder al formulario de login (${response.status})`);
  }

  const html = await response.text();
  const match = html.match(/name="csrfToken"[^>]*value="([^"]+)"/);
  if (!match) {
    throw new Error('No se encontró token CSRF en la página de login');
  }
  return match[1];
}

async function login(credentials) {
  const loginParams = new URLSearchParams();
  const csrfToken = await getCsrfToken().catch(async () => {
    // Algunos despliegues sólo exponen el token via formulario HTML
    return fetchSigninPage();
  });

  loginParams.set('csrfToken', csrfToken);
  loginParams.set('email', credentials.email);
  loginParams.set('password', credentials.password);
  loginParams.set('callbackUrl', `${BASE_URL}/home`);
  loginParams.set('json', 'true');

  const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: buildCookieHeader(),
      Accept: 'application/json,text/html,*/*',
      Referer: `${BASE_URL}/api/auth/signin/credentials`,
    },
    body: loginParams.toString(),
    redirect: 'manual',
  });

  storeCookies(response);

  const contentType = response.headers.get('content-type') || '';
  let parsed = null;
  if (contentType.includes('application/json')) {
    try {
      parsed = await response.json();
    } catch (error) {
      debugLog(`JSON parse error ignored: ${error.message}`);
    }
  }

  if (parsed?.error) {
    throw new Error(`Credenciales rechazadas: ${parsed.error}`);
  }

  if ([302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location') || '';
    if (/error=/i.test(location)) {
      throw new Error(`Login redirigió a error: ${location}`);
    }
  }

  const hasSessionCookie = cookieStore.has('__Secure-next-auth.session-token') ||
    cookieStore.has('next-auth.session-token');

  if (!hasSessionCookie) {
    throw new Error('Login no estableció cookie de sesión');
  }

  return parsed ?? { status: response.status };
}

async function verifySession() {
  const response = await fetchWithSession(`${BASE_URL}/api/auth/session`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sesión inválida (${response.status}): ${text}`);
  }

  const payload = await response.json();
  if (!payload?.user?.email) {
    throw new Error(`Respuesta de sesión inesperada: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function requestPasswordRecovery(email) {
  const response = await fetch(`${BASE_URL}/api/auth/password/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    // ignore non JSON responses
  }

  if (!response.ok) {
    throw new Error(`Recuperación falló (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

function generateCredentials() {
  const suffix = crypto.randomInt(10_000, 99_999);
  const email = `diagnostico+${Date.now()}-${suffix}@bisonteapp.com`;
  const password = `Bisonte${suffix}!A`;
  return { email, password };
}

async function determineCredentials() {
  if (process.env.DIAG_LOGIN_EMAIL && process.env.DIAG_LOGIN_PASSWORD) {
    return {
      email: process.env.DIAG_LOGIN_EMAIL,
      password: process.env.DIAG_LOGIN_PASSWORD,
      source: 'env',
    };
  }

  const cached = await readCachedCredentials();
  if (cached && !process.env.DIAG_FORCE_REGISTER) {
    return { ...cached, source: 'cache' };
  }

  return { ...generateCredentials(), source: 'generated' };
}

async function main() {
  console.log('🔍  Diagnóstico de autenticación Bisonte');
  console.log(`   Base URL: ${BASE_URL}`);

  const credentials = await determineCredentials();
  const skipRegister = process.env.DIAG_SKIP_REGISTER === '1' && credentials.source !== 'generated';
  const forceRegister = process.env.DIAG_FORCE_REGISTER === '1';

  let activeCredentials = credentials;

  if (!skipRegister || forceRegister || credentials.source === 'generated') {
    await step('1) Registrando usuario', async () => {
      if (skipRegister && credentials.source === 'cache') {
        console.log(`   ℹ️  Registro omitido; usando cache ${credentials.email}`);
        return { skipped: true };
      }

      if (credentials.source === 'env' && process.env.DIAG_SKIP_REGISTER === '1') {
        console.log(`   ℹ️  Registro omitido; usando variables de entorno (${credentials.email})`);
        return { skipped: true };
      }

      const freshCreds = credentials.source === 'generated' ? credentials : generateCredentials();
      if (credentials.source !== 'generated') {
        activeCredentials = freshCreds;
      }

      const result = await registerUser(freshCreds);
      if (result.status === 201) {
        await writeCachedCredentials(freshCreds);
        activeCredentials = freshCreds;
      } else if (credentials.source !== 'generated') {
        activeCredentials = credentials;
      }

      return result;
    });
  } else {
    console.log('→ 1) Registrando usuario... OMITIDO');
  }

  if (!activeCredentials?.email || !activeCredentials?.password) {
    throw new Error('No se determinaron credenciales activas para continuar con el diagnóstico');
  }

  await step('2) Iniciando sesión con credenciales', async () => {
    await login(activeCredentials);
    return { email: activeCredentials.email };
  });

  const session = await step('3) Verificando sesión persistente', async () => {
    return verifySession();
  });

  const recovery = await step('4) Solicitando recuperación de contraseña', async () => {
    return requestPasswordRecovery(activeCredentials.email);
  });

  console.log('\n✅ Diagnóstico completado');
  console.log(`   • Usuario: ${activeCredentials.email}`);
  console.log(`   • Sesión válida para: ${session?.user?.email ?? 'desconocido'}`);
  console.log(`   • Respuesta de recuperación: ${recovery?.message ?? 'sin mensaje'}`);
  console.log('\nℹ️  Si necesitas regenerar credenciales, borra scripts/auth/.diagnostics-auth-cache.json');
}

main().catch((error) => {
  console.error(`\n❌ Diagnóstico interrumpido: ${error.message}`);
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exit(1);
});
