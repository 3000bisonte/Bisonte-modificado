import { compose, handle } from "@/lib/http";

/**
 * Simple ping endpoint for connectivity testing
 * GET /api/ping
 */
export const GET = compose(handle())(async () => {
  return {
    data: {
      pong: true,
      time: Date.now(),
      timestamp: new Date().toISOString(),
    },
    status: 200,
  };
});
