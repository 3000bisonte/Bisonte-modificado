const { ok, badRequest, withHandler } = require('./_utils');
const crypto = require('crypto');

// In-memory store (replace with persistent DB later)
const recoveryStore = new Map(); // email -> { code, exp }

exports.handler = withHandler(async (event, ctx, meta) => {
	if (event.httpMethod !== 'POST') return badRequest('Use POST', meta.origin);
	let body; try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON', meta.origin); }
	const { email } = body;
	if (!email) return badRequest('email required', meta.origin);
	const code = String(100000 + Math.floor(Math.random()*900000));
	const exp = Date.now() + 10*60*1000;
	recoveryStore.set(email.toLowerCase(), { code, exp });
	// TODO integrate actual email service
	console.log('[password-recovery] issued', { email, code });
	return ok({ issued: true, expiresInMinutes: 10 }, meta.origin);
});

// (Optional future) add validation endpoint separate file
