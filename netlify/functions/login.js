const { ok, badRequest, unauthorized, sign, withHandler } = require('./_utils');

// Temporary in-memory demo users
const users = [
	{ id: '1', email: 'demo@bisonte.com', password: 'demo123', name: 'Usuario Demo', role: 'user', esAdministrador: false, esRecolector: true },
	{ id: '2', email: 'admin@bisonte.com', password: 'admin123', name: 'Administrador', role: 'admin', esAdministrador: true, esRecolector: false },
	{ id: '3', email: 'user@bisonte.com', password: 'user123', name: 'Usuario Normal', role: 'user', esAdministrador: false, esRecolector: false }
];

exports.handler = withHandler(async (event, ctx, meta) => {
	if (event.httpMethod !== 'POST') return badRequest('Use POST', meta.origin);
	let body; try { body = JSON.parse(event.body || '{}'); } catch { return badRequest('Invalid JSON', meta.origin); }
	const { email, password } = body;
	if (!email || !password) return badRequest('email & password required', meta.origin);
	const user = users.find(u => u.email === email && u.password === password);
	if (!user) return unauthorized('Invalid credentials', meta.origin);
	const access = sign({ sub: user.id, email: user.email, role: user.role, type: 'access' }, 900);
	const refresh = sign({ sub: user.id, type: 'refresh' }, 60 * 60 * 24 * 7);
	return ok({ access, refresh, user: { ...user, password: undefined } }, meta.origin);
});
