import { NextResponse } from 'next/server';
import { withAuth } from "next-auth/middleware";
// Importar funciones de seguridad
import { SecurityHeadersService } from './src/lib/securityHeaders.js';

// Combined middleware: handles auth protection + WebView fixes + canonical host
// Nota: Para Capacitor, el flujo de Google es SIEMPRE nativo (sin OAuth). Este middleware solo maneja errores genéricos.
function mainMiddleware(request) {
	const url = new URL(request.url);
	const host = request.headers.get('host') || url.host;
	const ua = (request.headers.get('user-agent') || '').toLowerCase();
	const isWebViewUA = /\bwv\b|webview|; wv\)|gsa\/|fbav|fban|line\//i.test(ua);
	const method = request.method || 'GET';

	// CRITICAL: Handle POST→page conversions FIRST before any auth redirects
	if (method === 'POST') {
		const p = url.pathname;
		const isPageRoute = p === '/' || p === '/home' || p.startsWith('/auth/') || 
			p === '/remitente' || p === '/cotizador' || p === '/destinatario' || 
			p === '/pagos' || p === '/profile';
		if (isPageRoute) {
			const res = NextResponse.redirect(url, 303);
			res.headers.set('X-Diag-Post-Converted', '1');
			return res;
		}
	}

	// If user lands on API/UI error endpoint with OAuthCallback, force bridge to home (drastic, unconditional)
	if (url.pathname.startsWith('/api/auth/error') || url.pathname.startsWith('/auth/error')) {
		const qs = url.search || '';
		// Unconditional: any API error goes to bridge home
		const bridge = new URL('/auth/bridge', url);
		bridge.search = '?to=%2Fhome';
		const res = NextResponse.redirect(bridge, 303);
		res.headers.set('Cache-Control','no-store');
		res.headers.set('X-Diag-Api-Error', '1');
		return res;
	}

	// Global safety net: if any URL carries error=OAuthCallback, route to bridge/home
	if (url.searchParams.get('error') === 'OAuthCallback') {
		url.pathname = '/auth/bridge';
		url.search = '?to=%2Fhome';
		const res = NextResponse.redirect(url, 303);
		res.headers.set('Cache-Control','no-store');
		res.headers.set('X-Diag-Error-Param-Bridge', '1');
		return res;
	}

	// Canonical host enforcement: always serve on https://www.bisonteapp.com in production
	const CANONICAL_HOST = 'www.bisonteapp.com';
	const isProd = process.env.NODE_ENV === 'production';
	const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
	const isVercelPreview = host.endsWith('.vercel.app');

	if (isProd && !isLocal) {
		let changed = false;
		// Redirect any non-canonical host (except vercel preview domains) to the canonical host
		if (!isVercelPreview && host !== CANONICAL_HOST) {
			url.hostname = CANONICAL_HOST;
			changed = true;
		}
		// Enforce https
		if (url.protocol !== 'https:') {
			url.protocol = 'https:';
			changed = true;
		}
		if (changed) {
			return NextResponse.redirect(url, 308);
		}
	}

	// If webview lands on root with OAuthCallback error, jump to bridge
	const explicitWv = url.searchParams.get('wv') === '1';
	if ((isWebViewUA || explicitWv) && url.pathname === '/' && url.searchParams.get('error') === 'OAuthCallback') {
		url.pathname = '/auth/bridge';
		url.search = '';
		const res = NextResponse.redirect(url, 303);
		res.headers.set('X-Diag-Root-Bridge', '1');
		return res;
	}

	return NextResponse.next();
}

// Auth-protected middleware wrapper with security enhancements
export default withAuth(
  async function authMiddleware(req) {
    // 🛡️ SECURITY CHECKS FIRST
    const clientIP = getClientIP(req);
    const { pathname } = req.nextUrl;
    
    // Rate limiting
    if (isRateLimited(clientIP, pathname)) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0'
        }
      });
    }
    
    // Bloquear rutas maliciosas
    if (isBlockedPath(pathname) || hasBlockedPatterns(req)) {
      console.warn(`[Security] Blocked malicious request: ${pathname} from ${clientIP}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // Ejecutar la lógica principal del middleware
    const mainResponse = mainMiddleware(req);
    if (mainResponse && mainResponse.status !== 200) {
      // Aplicar headers de seguridad a las respuestas
      const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      };
      
      Object.entries(securityHeaders).forEach(([key, value]) => {
        mainResponse.headers.set(key, value);
      });
      
      return mainResponse; // Return redirects immediately with security headers
    }

    // Then handle auth-specific logic
    const admins = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com", 
      "bisonteoskar@gmail.com",
    ];
    const userEmail = req.nextauth.token?.email;

    if (req.nextUrl.pathname.startsWith("/admin") && (!userEmail || !admins.includes(userEmail))) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Si llegamos aquí, aplicar headers de seguridad y continuar
    const response = NextResponse.next();
    
    // Aplicar headers de seguridad a todas las respuestas
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY', 
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  },
  {
    pages: {
      signIn: "/",
      signOut: "/auth/signout", 
      error: "/auth/error",
      verifyRequest: "/auth/verify-request",
      newUser: null,
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname;
        const protectedPaths = [
          "/remitente",
          "/home",
          "/cotizador",
          "/destinatario",
          "/pagos",
          "/profile",
          "/perfilCard",
        ];
        const isProtected = protectedPaths.some((path) => p === path || p.startsWith(path + "/"));
        return isProtected ? !!token : true;
      }
    }
  }
);

/**
 * 🛡️ Funciones de seguridad adicionales
 */

// Rate limiting simple en memoria
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests por minuto por IP

function getClientIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         request.ip ||
         'unknown';
}

function isRateLimited(ip, pathname) {
  const now = Date.now();
  const key = `${ip}:${pathname}`;
  
  // Limpiar entradas antiguas
  for (const [storeKey, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(storeKey);
    }
  }
  
  const existing = rateLimitStore.get(key);
  
  if (!existing) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now
    });
    return false;
  }
  
  if (now - existing.firstRequest < RATE_LIMIT_WINDOW) {
    existing.count++;
    return existing.count > RATE_LIMIT_MAX_REQUESTS;
  } else {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now
    });
    return false;
  }
}

function isBlockedPath(pathname) {
  const blockedPaths = [
    '/admin/phpmyadmin',
    '/.env',
    '/wp-admin',
    '/wp-login.php',
    '/.git',
    '/config.php',
    '/install.php'
  ];

  return blockedPaths.some(blocked => pathname.startsWith(blocked));
}

function hasBlockedPatterns(request) {
  const { pathname, search } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  
  const maliciousPatterns = [
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDROP\b|\bDELETE\b)/i,
    /<script|javascript:/i,
    /\.\.\/|%2e%2e%2f/i,
    /(\||\;|\&|\$\(|\`)/
  ];

  const fullUrl = pathname + search;
  return maliciousPatterns.some(pattern => pattern.test(fullUrl));
}



export const config = {
	matcher: [
		'/:path*', // Match all paths for main middleware
	],
};

