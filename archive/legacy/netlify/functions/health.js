const { ok, withHandler } = require('./_utils');

let started = Date.now();

exports.handler = withHandler(async (event, ctx, meta) => {
  return ok({ service: 'bisonte-api', status: 'ok', uptimeSeconds: Math.round((Date.now()-started)/1000) }, meta.origin);
});
