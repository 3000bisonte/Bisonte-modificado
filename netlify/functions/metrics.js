const { ok, withHandler } = require('./_utils');

let hits = 0;
let start = Date.now();

exports.handler = withHandler(async (event, ctx, meta) => {
  hits++;
  return ok({ hits, uptimeSeconds: Math.round((Date.now()-start)/1000) }, meta.origin);
});
