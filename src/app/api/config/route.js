import { NextResponse } from "next/server";

import { env } from "@/lib/env";

/**
 * Configuration endpoint
 * GET /api/config
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
  env: env.NODE_ENV,
  version: env.APP_VERSION,
      runtime: "Next.js",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
