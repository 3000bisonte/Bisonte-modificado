// 🛡️ Sistema de headers de seguridad robustos
import { NextResponse } from 'next/server';

/**
 * 🔒 Headers de seguridad estándar para todas las respuestas
 */
export const SecurityHeaders = {
  // Content Security Policy - Previene XSS
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.bisonte.app https://*.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; '),

  // Prevenir clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevenir MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Habilitar protección XSS del browser
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (antes Feature Policy)
  'Permissions-Policy': [
    'geolocation=(self)',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'speaker=(self)'
  ].join(', '),
  
  // HSTS - Forzar HTTPS (solo en producción)
  ...(process.env.NODE_ENV === 'production' ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  } : {}),
  
  // Cross-Origin headers
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Cache control para recursos sensibles
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * 🔐 Headers específicos para APIs de autenticación
 */
export const AuthSecurityHeaders = {
  ...SecurityHeaders,
  
  // Headers adicionales para APIs sensibles
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  'X-Permitted-Cross-Domain-Policies': 'none',
  
  // Prevenir caching de respuestas de autenticación
  'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
  'Surrogate-Control': 'no-store'
};

/**
 * 🌐 Headers para CORS seguro
 */
export const CorsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://bisonteapp.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key'
  ].join(', '),
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 horas
  'Vary': 'Origin'
};

/**
 * 📱 Headers específicos para APIs móviles
 */
export const MobileApiHeaders = {
  ...SecurityHeaders,
  
  // Menos restrictivo para aplicaciones móviles
  'Content-Security-Policy': [
    "default-src 'self' capacitor://localhost http://localhost:*",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob: capacitor://localhost",
    "connect-src 'self' https: capacitor://localhost http://localhost:*",
    "frame-src 'none'",
    "object-src 'none'"
  ].join('; ')
};

/**
 * 🛠️ Utility para aplicar headers de seguridad a respuestas
 */
export class SecurityHeadersService {
  
  /**
   * Aplicar headers de seguridad estándar
   */
  static applySecurityHeaders(response, options = {}) {
    const {
      type = 'standard',
      customHeaders = {},
      overrideDefaults = false
    } = options;

    let headers;
    
    switch (type) {
      case 'auth':
        headers = AuthSecurityHeaders;
        break;
      case 'mobile':
        headers = MobileApiHeaders;
        break;
      case 'cors':
        headers = { ...SecurityHeaders, ...CorsHeaders };
        break;
      default:
        headers = SecurityHeaders;
    }

    // Combinar headers
    const finalHeaders = overrideDefaults ? 
      { ...customHeaders } : 
      { ...headers, ...customHeaders };

    // Aplicar headers a la respuesta
    Object.entries(finalHeaders).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        response.headers.set(key, value);
      }
    });

    return response;
  }

  /**
   * Crear respuesta JSON con headers de seguridad
   */
  static jsonResponse(data, status = 200, options = {}) {
    const response = NextResponse.json(data, { status });
    return this.applySecurityHeaders(response, options);
  }

  /**
   * Crear respuesta de error con headers de seguridad
   */
  static errorResponse(error, status = 500, options = {}) {
    const errorData = {
      error: typeof error === 'string' ? error : error.message,
      timestamp: new Date().toISOString(),
      status
    };

    const response = NextResponse.json(errorData, { status });
    return this.applySecurityHeaders(response, {
      type: 'auth',
      ...options
    });
  }

  /**
   * Manejar preflight CORS
   */
  static corsPreflightResponse(options = {}) {
    const response = new NextResponse(null, { status: 200 });
    return this.applySecurityHeaders(response, {
      type: 'cors',
      ...options
    });
  }

  /**
   * Headers específicos para logout
   */
  static logoutResponse(data = {}, options = {}) {
    const logoutHeaders = {
      // Limpiar cache
      'Clear-Site-Data': '"cache", "cookies", "storage", "executionContexts"',
      
      // Prevenir cache de la respuesta de logout
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    return this.jsonResponse(data, 200, {
      type: 'auth',
      customHeaders: logoutHeaders,
      ...options
    });
  }

  /**
   * Detectar si la request viene de una app móvil
   */
  static isMobileApp(request) {
    const userAgent = request.headers.get('user-agent') || '';
    const customHeader = request.headers.get('x-app-type');
    
    return customHeader === 'mobile' || 
           userAgent.includes('Capacitor') ||
           userAgent.includes('BisonteApp');
  }

  /**
   * Aplicar headers basado en el tipo de cliente
   */
  static adaptiveHeaders(request, response, options = {}) {
    const headerType = this.isMobileApp(request) ? 'mobile' : 'standard';
    
    return this.applySecurityHeaders(response, {
      type: headerType,
      ...options
    });
  }

  /**
   * Validar headers de request para seguridad
   */
  static validateRequestHeaders(request) {
    const issues = [];
    
    // Verificar Content-Type para requests con body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        issues.push({
          type: 'invalid_content_type',
          message: 'Content-Type debe ser application/json'
        });
      }
    }

    // Verificar User-Agent (básico anti-bot)
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      issues.push({
        type: 'suspicious_user_agent',
        message: 'User-Agent sospechoso o ausente'
      });
    }

    // Verificar Origin en requests con credenciales
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'capacitor://localhost'
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      issues.push({
        type: 'invalid_origin',
        message: `Origin no permitido: ${origin}`
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Rate limiting headers
   */
  static rateLimitHeaders(limit, remaining, reset) {
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
      'X-RateLimit-Reset': reset.toString(),
      'Retry-After': remaining <= 0 ? Math.ceil((reset - Date.now()) / 1000).toString() : undefined
    };
  }
}

export default SecurityHeadersService;