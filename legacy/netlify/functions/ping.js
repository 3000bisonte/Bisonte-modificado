const { ok, withHandler } = require('./_utils');
exports.handler = withHandler(async (event, ctx, meta) => ok({ pong: true, time: Date.now() }, meta.origin));
