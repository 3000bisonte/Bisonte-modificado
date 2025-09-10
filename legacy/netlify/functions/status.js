const { ok, withHandler } = require('./_utils');

exports.handler = withHandler(async (event, ctx, meta) => {
  return ok({ status: 'running', timestamp: new Date().toISOString() }, meta.origin);
});
