import { compose, handle } from "@/lib/http";

/**
 * System status and basic metrics
 * GET /api/status
 */
export const GET = compose(handle())(async () => ({
  data: {
    status: "ok",
    timestamp: new Date().toISOString(),
  },
}));
