const { ok, badRequest, unauthorized, withHandler, rateLimit } = require('./_utils');

// Reuse same in-memory map by requiring password-recovery (side-effect export)
const recoveryModule = require('./password-recovery');
const recoveryStore = recoveryModule.recoveryStore || (global.__recoveryStore = global.__recoveryStore || new Map());

exports.handler = withHandler(async (event, ctx, meta) => {
  if (event.httpMethod !== 'POST') return badRequest('Use POST', meta.origin);
  let body; try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON', meta.origin); }
  const { email, code, newPassword } = body;
  if (!email || !code || !newPassword) return badRequest('email, code, newPassword required', meta.origin);
  const key = `validate:${(event.headers['x-forwarded-for']||'').split(',')[0] || 'ip-unknown'}:${email.toLowerCase()}`;
  const rl = rateLimit(key, 8, 15*60*1000); // 8 attempts per 15 min
  if (!rl.allowed) return unauthorized(`rate_limited_retry_after_${rl.retryAfter}s`, meta.origin);
  const rec = recoveryStore.get(email.toLowerCase());
  if (!rec) return unauthorized('code_invalid', meta.origin);
  if (rec.exp < Date.now()) { recoveryStore.delete(email.toLowerCase()); return unauthorized('code_expired', meta.origin); }
  if (rec.code !== code) return unauthorized('code_invalid', meta.origin);
  // For now just consume code
  recoveryStore.delete(email.toLowerCase());
  return ok({ reset: true }, meta.origin);
});
