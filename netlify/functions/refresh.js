const { ok, badRequest, unauthorized, verify, sign, withHandler } = require('./_utils');

exports.handler = withHandler(async (event, ctx, meta) => {
  if (event.httpMethod !== 'POST') return badRequest('Use POST', meta.origin);
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch(e){ return badRequest('Invalid JSON', meta.origin); }
  const { refresh } = body;
  if (!refresh) return badRequest('refresh required', meta.origin);
  try {
    const data = verify(refresh);
    if (data.type !== 'refresh') return unauthorized('Wrong token type', meta.origin);
  const access = sign({ sub: data.sub, type: 'access', pv: data.pv }, 900);
    return ok({ access }, meta.origin);
  } catch (e) {
    return unauthorized('Invalid refresh', meta.origin);
  }
});
