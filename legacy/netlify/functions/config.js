const { ok, withHandler } = require('./_utils');

exports.handler = withHandler(async (event, ctx, meta) => {
  return ok({ env: process.env.RUNTIME_ENV || 'unknown', version: process.env.APP_VERSION || 'dev' }, meta.origin);
});
