import { NextResponse } from "next/server";

/**
 * API utilities for consistent error handling and CORS
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://bisonte-modificado.vercel.app',
  'https://www.bisonteapp.com',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
];

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length === 0) return true;
  return ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*');
}

/**
 * Get CORS headers
 */
export function getCorsHeaders(origin) {
  const allowOrigin = isOriginAllowed(origin) ? origin : (ALLOWED_ORIGINS.includes('*') ? '*' : '');
  
  return {
    'Access-Control-Allow-Origin': allowOrigin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Security-Policy': "default-src 'none'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(request) {
  const origin = request.headers.get('origin');
  
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }
  
  return null;
}

/**
 * Create success response with CORS headers
 */
export function createResponse(data, status = 200, request = null) {
  const origin = request?.headers.get('origin');
  
  return NextResponse.json(
    { success: true, ...data },
    {
      status,
      headers: getCorsHeaders(origin)
    }
  );
}

/**
 * Create error response with CORS headers
 */
export function createErrorResponse(error, status = 400, request = null) {
  const origin = request?.headers.get('origin');
  
  return NextResponse.json(
    { success: false, error },
    {
      status,
      headers: getCorsHeaders(origin)
    }
  );
}

/**
 * Rate limiting store (in-memory, for development)
 */
const rateStore = new Map();

/**
 * Simple rate limiting
 */
export function checkApiRateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = rateStore.get(key);
  
  if (!entry || entry.windowEnd < now) {
    rateStore.set(key, { count: 1, windowEnd: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (entry.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfter: Math.ceil((entry.windowEnd - now) / 1000) 
    };
  }
  
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

/**
 * Get client IP from request
 */
export function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

/**
 * API request logger
 */
export function logApiRequest(request, response, startTime) {
  const duration = Date.now() - startTime;
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  console.log(`[API] ${request.method} ${request.url} - ${response.status} - ${duration}ms - ${ip} - ${userAgent}`);
}
