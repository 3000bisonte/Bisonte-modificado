// Shared utilities for Netlify Functions (Option B split architecture)
const crypto = require('crypto');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length === 0) return true; // fallback allow all if not configured
  return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
}

function baseHeaders(origin) {
  const allowOrigin = isOriginAllowed(origin) ? origin : (ALLOWED_ORIGINS.includes('*') ? '*' : '');
  return {
    'Access-Control-Allow-Origin': allowOrigin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Security-Policy': "default-src 'none'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
}

function json(statusCode, body, origin, extraHeaders = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...baseHeaders(origin), ...extraHeaders },
    body: JSON.stringify(body)
  };
}

function ok(data, origin) { return json(200, { success: true, ...data }, origin); }
function created(data, origin) { return json(201, { success: true, ...data }, origin); }
function badRequest(message, origin, code = 'BAD_REQUEST') { return json(400, { success:false, error: code, message }, origin); }
function unauthorized(message='Unauthorized', origin, code='UNAUTHORIZED') { return json(401, { success:false, error: code, message }, origin); }
function internalError(message, origin, code='INTERNAL_ERROR') { return json(500, { success:false, error: code, message }, origin); }

function preflight(origin) { return { statusCode: 204, headers: baseHeaders(origin), body: '' }; }

// Minimal HMAC token (NOT a full JWT) for temporary auth bridging
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'dev-secret-change';

function sign(payload, expiresInSeconds = 900) {
  const exp = Math.floor(Date.now()/1000) + expiresInSeconds;
  const data = { ...payload, exp };
  const raw = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(raw).digest('base64url');
  return `${raw}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) throw new Error('malformed');
  const [raw, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(raw).digest('base64url');
  if (sig !== expected) throw new Error('signature');
  const data = JSON.parse(Buffer.from(raw, 'base64url').toString());
  if (data.exp && data.exp < Math.floor(Date.now()/1000)) throw new Error('expired');
  return data;
}

function withHandler(fn) {
  return async (event, context) => {
    const origin = event.headers?.origin || '';
    if (event.httpMethod === 'OPTIONS') return preflight(origin);
    const requestId = event.headers['x-request-id'] || crypto.randomUUID();
    const start = Date.now();
    try {
      const res = await fn(event, context, { origin, requestId });
      return res;
    } catch (err) {
      console.error('[function-error]', { name: err.name, message: err.message, stack: err.stack, requestId });
      return internalError('Unexpected error', origin);
    } finally {
      const ms = Date.now() - start;
      console.log('[function-done]', { path: event.path, requestId, ms });
    }
  };
}

module.exports = { json, ok, created, badRequest, unauthorized, internalError, preflight, sign, verify, withHandler };
