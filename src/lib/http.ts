import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
// Note: Avoid importing auth/next-auth at module scope to prevent pulling
// heavy deps and env validation into every route that uses this file.

// Types
export type TraceId = string;
export type HandlerContext<TBody = any, TSession = any> = {
  traceId: TraceId;
  body?: TBody;
  session?: TSession;
  // place for middlewares to pass data
  meta?: Record<string, unknown>;
};

export type HandlerResult<T = any> =
  | NextResponse
  | {
      data?: T;
      error?: unknown;
      message?: string;
      status?: number;
      headers?: Record<string, string>;
    };

export type Handler<TBody = any, TOut = any> = (
  req: NextRequest,
  ctx: HandlerContext<TBody>
) => Promise<HandlerResult<TOut>>;

export type Middleware = (handler: Handler) => Handler;

// Utilities
const toErrorString = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  try {
    return typeof err === "string" ? err : JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
};

export const getTraceId = (req?: NextRequest): TraceId => {
  const headerId = req?.headers.get("x-trace-id");
  // crypto.randomUUID is available in Node 18+
  const uuid = (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return headerId || uuid;
};

export const getClientIp = (req: NextRequest): string => {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  // Next.js local dev often exposes 127.0.0.1
  return "127.0.0.1";
};

// Response helpers with standard shape
export function ok<T = any>(
  traceId: TraceId,
  data: T,
  init?: { status?: number; message?: string; headers?: Record<string, string> }
) {
  const { status = 200, message, headers = {} } = init || {};
  return NextResponse.json(
    { success: true, data, message, traceId },
    { status, headers: { "x-trace-id": traceId, ...headers } }
  );
}

export function err(
  traceId: TraceId,
  status: number,
  error: unknown,
  init?: { message?: string; headers?: Record<string, string> }
) {
  const { message, headers = {} } = init || {};
  const payload: any = {
    success: false,
    error: typeof error === "string" ? error : toErrorString(error),
    message,
    traceId,
  };
  // If it's a zod-like object, include issues
  if (typeof error === "object" && error && (error as any).issues) {
    payload.issues = (error as any).issues;
  }
  return NextResponse.json(payload, {
    status,
    headers: { "x-trace-id": traceId, ...headers },
  });
}

// Core handler normalizer
export const handle = (options?: { defaultStatus?: number }): Middleware => {
  const { defaultStatus = 200 } = options || {};
  return (next: Handler): Handler => {
    return async (req, ctx) => {
      const traceId = ctx.traceId || getTraceId(req);
      try {
        const result = await next(req, { ...ctx, traceId });

        // If already a NextResponse, attach trace header and return
        if (result instanceof NextResponse) {
          result.headers.set("x-trace-id", traceId);
          return result;
        }

        const { data, error, message, status, headers } = (result || {}) as any;
        if (error !== undefined) {
          const code = typeof status === "number" ? status : 400;
          return err(traceId, code, error, { message, headers });
        }
        // Default: treat result as data if not explicitly provided
        const outData = data !== undefined ? data : result;
        return ok(traceId, outData, { status: status ?? defaultStatus, message, headers });
      } catch (e) {
        console.error(`[handle] Uncaught error`, e, { traceId });
        return err(traceId, 500, e, { message: "Internal Server Error" });
      }
    };
  };
};

// Error boundary middleware
export const withErrorBoundary = (options?: {
  onError?: (e: unknown, req: NextRequest, ctx: HandlerContext) => void;
  mapStatus?: (e: unknown) => number | undefined;
}): Middleware => {
  return (next: Handler): Handler => {
    return async (req, ctx) => {
      const traceId = ctx.traceId || getTraceId(req);
      try {
        return await next(req, { ...ctx, traceId });
      } catch (e) {
        options?.onError?.(e, req, ctx);
        const status = options?.mapStatus?.(e) ?? 500;
        console.error(`[withErrorBoundary]`, e, { traceId });
        return err(traceId, status, e, { message: status === 500 ? "Internal Server Error" : undefined });
      }
    };
  };
};

// Zod validation middleware
export const withValidation = <T>(
  schema: ZodSchema<T>,
  options?: { source?: "auto" | "body" | "query" }
): Middleware => {
  const source = options?.source ?? "auto";
  return (next: Handler): Handler => {
    return async (req, ctx) => {
      const traceId = ctx.traceId || getTraceId(req);
      let raw: unknown;
      try {
        if (source === "query" || (source === "auto" && req.method === "GET")) {
          const url = new URL(req.url);
          // Convert URLSearchParams to plain object
          raw = Object.fromEntries(url.searchParams.entries());
        } else {
          raw = await req.json();
        }
      } catch (e) {
        return err(traceId, 400, "Invalid or missing JSON body", { message: "Bad Request" });
      }

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        const issues = parsed.error.flatten();
        return err(traceId, 400, { message: "Invalid input", issues }, { message: "Invalid input" });
      }

      return next(req, { ...ctx, traceId, body: parsed.data as any });
    };
  };
};

// Auth middleware (NextAuth). Optionally restrict by roles.
export const withAuth = (options?: { roles?: string[] }): Middleware => {
  const { roles } = options || {};
  return (next: Handler): Handler => {
    return async (req, ctx) => {
      const traceId = ctx.traceId || getTraceId(req);
      // Lazy import next-auth and our auth options to avoid module-scope side effects
      const [{ getServerSession }, { authOptions }] = await Promise.all([
        import("next-auth"),
        import("@/lib/auth"),
      ]);
      const session = await getServerSession(authOptions as any);
      if (!session) {
        return err(traceId, 401, "Unauthorized", { message: "Not authenticated" });
      }
      if (roles && roles.length > 0) {
        const role = (session as any).user?.role;
        if (!roles.includes(role)) {
          return err(traceId, 403, "Forbidden", { message: "Insufficient permissions" });
        }
      }
      return next(req, { ...ctx, traceId, session });
    };
  };
};

// Simple in-memory rate limiter (per-process)
type RateBucket = { count: number; resetAt: number };
const globalRateStore: Map<string, RateBucket> = (globalThis as any).__rateStore || new Map();
(globalThis as any).__rateStore = globalRateStore;

export const withRateLimit = (options: {
  key?: (req: NextRequest) => string;
  limit: number;
  windowSec: number;
}): Middleware => {
  const { key, limit, windowSec } = options;
  return (next: Handler): Handler => {
    return async (req, ctx) => {
      const traceId = ctx.traceId || getTraceId(req);
      const k = key ? key(req) : `${req.method}:${getClientIp(req)}`;
      const now = Date.now();
      const existing = globalRateStore.get(k);
      const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + windowSec * 1000;
      const count = existing && existing.resetAt > now ? existing.count + 1 : 1;
      const bucket = { count, resetAt };
      globalRateStore.set(k, bucket);

      if (count > limit) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        return err(traceId, 429, "Too Many Requests", {
          message: "Rate limit exceeded",
          headers: { "Retry-After": `${retryAfter}` },
        });
      }

      // Pass rate info in meta
      const remaining = Math.max(0, limit - count);
      const res = await next(req, { ...ctx, traceId, meta: { ...(ctx.meta || {}), rate: { remaining, resetAt } } });

      if (res instanceof NextResponse) {
        res.headers.set("x-ratelimit-remaining", `${remaining}`);
        res.headers.set("x-ratelimit-reset", `${Math.ceil(resetAt / 1000)}`);
      }
      return res;
    };
  };
};

// Compose middlewares left-to-right
export const compose = (...middlewares: Middleware[]) => (handler: Handler): Handler => {
  return middlewares.reduceRight((next, mw) => mw(next), handler);
};

// Convenience to build a standard success response inside handlers
export const success = <T = any>(data: T, init?: { message?: string; status?: number; headers?: Record<string, string> }): HandlerResult<T> => ({
  data,
  message: init?.message,
  status: init?.status,
  headers: init?.headers,
});

// Convenience to build a standard error response inside handlers
export const failure = (error: unknown, init?: { message?: string; status?: number; headers?: Record<string, string> }): HandlerResult => ({
  error,
  message: init?.message,
  status: init?.status ?? 400,
  headers: init?.headers,
});
