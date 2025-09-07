const { ok, badRequest, unauthorized, internalError, withHandler } = require('./_utils');
const bcrypt = require('bcryptjs');

// Reuse recovery store (ensures code was validated previously) - alternatively we could require user re-supply code.
// Here we demand both code + newPassword again for atomic reset to avoid TOCTOU after validate.
const recoveryModule = require('./password-recovery');
const recoveryStore = recoveryModule.recoveryStore || (global.__recoveryStore = global.__recoveryStore || new Map());

// Lazy Prisma import to keep cold start smaller when not used
let prisma;
function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

exports.handler = withHandler(async (event, ctx, meta) => {
  if (event.httpMethod !== 'POST') return badRequest('Use POST', meta.origin);
  let body; try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON', meta.origin); }
  const { email, code, newPassword } = body;
  if (!email || !code || !newPassword) return badRequest('email, code, newPassword required', meta.origin);
  const rec = recoveryStore.get(email.toLowerCase());
  if (!rec) return unauthorized('code_invalid', meta.origin);
  if (rec.exp < Date.now()) { recoveryStore.delete(email.toLowerCase()); return unauthorized('code_expired', meta.origin); }
  if (rec.code !== code) return unauthorized('code_invalid', meta.origin);
  if (newPassword.length < 8) return badRequest('password_too_short', meta.origin);

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const db = getPrisma();
    const user = await db.usuarios.update({
      where: { email: email.toLowerCase() },
      data: { password: hashed, token: null, tokenFecha: null }
    }).catch(err => {
      if (err.code === 'P2025') return null;
      throw err;
    });
    if (!user) {
      // If user does not exist, still consume code to avoid user enumeration
      recoveryStore.delete(email.toLowerCase());
      return ok({ reset: true }, meta.origin);
    }
    recoveryStore.delete(email.toLowerCase());
    return ok({ reset: true }, meta.origin);
  } catch (e) {
    console.error('[password-reset]', e);
    return internalError('reset_failed', meta.origin);
  }
});
