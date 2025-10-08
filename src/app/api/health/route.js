import { NextResponse } from "next/server";

import { compose, handle, withErrorBoundary } from "@/lib/http";

/**
 * Health check endpoint
 * GET /api/health
 */
export const GET = compose(
  handle(),
  withErrorBoundary()
)(async (req, { traceId }) => {
  const uptimeSeconds = Math.round(process.uptime());
  const data = {
    service: "bisonte-api",
    status: "ok",
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  version: process.env.APP_VERSION || "dev",
  environment: process.env.NODE_ENV || "development",
  };
  const res = NextResponse.json({ success: true, data, traceId }, { status: 200 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
});

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
