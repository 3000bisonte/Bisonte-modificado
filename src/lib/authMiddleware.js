// Middleware avanzado de autenticación y autorización
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logSecurityEvent, SecurityEvents } from "@/lib/security";

// Esquemas de validación para diferentes tipos de usuarios
const UserRoleSchema = z.enum(['admin', 'collector', 'user']);
const SessionValidationSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  emailVerified: z.boolean(),
  passwordVersion: z.number().optional(),
});

/**
 * Middleware de autenticación avanzado
 * Valida sesión, verifica integridad y maneja autorización
 */
export class AuthMiddleware {
  constructor() {
    this.requiredPermissions = {
      // Definir permisos por ruta y método
      'GET:/api/admin/*': ['admin'],
      'POST:/api/admin/*': ['admin'],
      'PUT:/api/admin/*': ['admin'],
      'DELETE:/api/admin/*': ['admin'],
      
      'GET:/api/collector/*': ['admin', 'collector'],
      'POST:/api/collector/*': ['admin', 'collector'],
      'PUT:/api/collector/*': ['admin', 'collector'],
      
      'GET:/api/user/*': ['admin', 'collector', 'user'],
      'POST:/api/envio/*': ['admin', 'collector', 'user'],
      'GET:/api/envio/*': ['admin', 'collector', 'user'],
    };
  }

  /**
   * Verificar autenticación básica
   */
  async verifyAuthentication(request) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        await this.logSecurityEvent(SecurityEvents.UNAUTHORIZED_ACCESS, {
          ip: this.getClientIP(request),
          userAgent: request.headers.get('user-agent'),
          path: request.nextUrl.pathname,
          method: request.method,
          error: 'No session found'
        });
        
        return {
          success: false,
          error: 'No autorizado - Sesión requerida',
          status: 401
        };
      }

      // Validar estructura de sesión
      const sessionValidation = SessionValidationSchema.safeParse(session.user);
      if (!sessionValidation.success) {
        await this.logSecurityEvent(SecurityEvents.SESSION_INVALID, {
          userId: session.user.id,
          ip: this.getClientIP(request),
          error: 'Invalid session structure',
          validation_errors: sessionValidation.error.errors
        });
        
        return {
          success: false,
          error: 'Sesión inválida',
          status: 401
        };
      }

      // Verificar integridad de usuario en BD
      const dbUser = await prisma.usuarios.findUnique({
        where: { id: parseInt(session.user.id) },
        select: {
          id: true,
          email: true,
          esAdministrador: true,
          esRecolector: true,
          emailVerified: true,
          passwordVersion: true,
          lockedUntil: true,
          lastLoginAt: true
        }
      });

      if (!dbUser) {
        await this.logSecurityEvent(SecurityEvents.USER_NOT_FOUND, {
          userId: session.user.id,
          ip: this.getClientIP(request),
          error: 'User not found in database'
        });
        
        return {
          success: false,
          error: 'Usuario no válido',
          status: 401
        };
      }

      // Verificar si la cuenta está bloqueada
      if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
        await this.logSecurityEvent(SecurityEvents.BLOCKED_ACCESS_ATTEMPT, {
          userId: session.user.id,
          ip: this.getClientIP(request),
          lockedUntil: dbUser.lockedUntil
        });
        
        return {
          success: false,
          error: 'Cuenta temporalmente bloqueada',
          status: 423
        };
      }

      // Verificar versión de password (para invalidar sesiones después de cambio)
      if (session.user.passwordVersion !== undefined && 
          dbUser.passwordVersion !== session.user.passwordVersion) {
        await this.logSecurityEvent(SecurityEvents.PASSWORD_VERSION_MISMATCH, {
          userId: session.user.id,
          sessionVersion: session.user.passwordVersion,
          dbVersion: dbUser.passwordVersion,
          ip: this.getClientIP(request)
        });
        
        return {
          success: false,
          error: 'Sesión expirada - Inicia sesión nuevamente',
          status: 401
        };
      }

      // Determinar rol actual
      const role = dbUser.esAdministrador ? 'admin' : 
                   dbUser.esRecolector ? 'collector' : 'user';

      return {
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role,
          emailVerified: dbUser.emailVerified,
          lastLoginAt: dbUser.lastLoginAt
        }
      };

    } catch (error) {
      console.error('[AuthMiddleware] Authentication error:', error);
      
      await this.logSecurityEvent(SecurityEvents.AUTH_MIDDLEWARE_ERROR, {
        ip: this.getClientIP(request),
        error: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        error: 'Error interno de autenticación',
        status: 500
      };
    }
  }

  /**
   * Verificar autorización basada en permisos
   */
  async verifyAuthorization(request, user) {
    try {
      const path = request.nextUrl.pathname;
      const method = request.method;
      const routeKey = `${method}:${path}`;
      
      // Buscar permisos requeridos para esta ruta
      const requiredRoles = this.findRequiredRoles(routeKey);
      
      if (requiredRoles.length === 0) {
        // Ruta pública o sin restricciones específicas
        return { success: true };
      }

      if (!requiredRoles.includes(user.role)) {
        await this.logSecurityEvent(SecurityEvents.AUTHORIZATION_FAILED, {
          userId: user.id,
          userRole: user.role,
          requiredRoles,
          path,
          method,
          ip: this.getClientIP(request)
        });
        
        return {
          success: false,
          error: 'No tienes permisos para acceder a este recurso',
          status: 403
        };
      }

      return { success: true };

    } catch (error) {
      console.error('[AuthMiddleware] Authorization error:', error);
      
      await this.logSecurityEvent(SecurityEvents.AUTH_MIDDLEWARE_ERROR, {
        userId: user?.id,
        error: error.message,
        type: 'authorization'
      });
      
      return {
        success: false,
        error: 'Error interno de autorización',
        status: 500
      };
    }
  }

  /**
   * Buscar roles requeridos para una ruta
   */
  findRequiredRoles(routeKey) {
    // Busqueda exacta
    if (this.requiredPermissions[routeKey]) {
      return this.requiredPermissions[routeKey];
    }

    // Busqueda con wildcards
    for (const [pattern, roles] of Object.entries(this.requiredPermissions)) {
      if (this.matchesPattern(routeKey, pattern)) {
        return roles;
      }
    }

    return [];
  }

  /**
   * Verificar si una ruta coincide con un patrón
   */
  matchesPattern(route, pattern) {
    const routeRegex = pattern
      .replace(/\*/g, '.*')
      .replace(/\//g, '\\/');
    
    return new RegExp(`^${routeRegex}$`).test(route);
  }

  /**
   * Obtener IP del cliente
   */
  getClientIP(request) {
    return request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown';
  }

  /**
   * Log de eventos de seguridad
   */
  async logSecurityEvent(event, metadata) {
    try {
      await logSecurityEvent(event, {
        timestamp: new Date().toISOString(),
        ...metadata
      });
    } catch (error) {
      console.error('[AuthMiddleware] Logging error:', error);
    }
  }

  /**
   * Middleware principal que combina autenticación y autorización
   */
  async authenticate(request, options = {}) {
    const {
      requireAuth = true,
      requireEmailVerified = false,
      allowedRoles = [],
      skipRoleCheck = false
    } = options;

    try {
      // Verificar autenticación
      if (requireAuth) {
        const authResult = await this.verifyAuthentication(request);
        
        if (!authResult.success) {
          return NextResponse.json(
            { error: authResult.error, code: 'AUTHENTICATION_FAILED' },
            { status: authResult.status }
          );
        }

        const user = authResult.user;

        // Verificar email verificado si es requerido
        if (requireEmailVerified && !user.emailVerified) {
          await this.logSecurityEvent(SecurityEvents.UNVERIFIED_EMAIL_ACCESS, {
            userId: user.id,
            email: user.email,
            ip: this.getClientIP(request),
            path: request.nextUrl.pathname
          });
          
          return NextResponse.json(
            { error: 'Email no verificado', code: 'EMAIL_NOT_VERIFIED' },
            { status: 403 }
          );
        }

        // Verificar autorización si no se omite
        if (!skipRoleCheck) {
          const authzResult = await this.verifyAuthorization(request, user);
          
          if (!authzResult.success) {
            return NextResponse.json(
              { error: authzResult.error, code: 'AUTHORIZATION_FAILED' },
              { status: authzResult.status }
            );
          }
        }

        // Verificar roles específicos si se proporcionan
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
          await this.logSecurityEvent(SecurityEvents.ROLE_ACCESS_DENIED, {
            userId: user.id,
            userRole: user.role,
            allowedRoles,
            ip: this.getClientIP(request),
            path: request.nextUrl.pathname
          });
          
          return NextResponse.json(
            { error: 'Rol insuficiente para esta acción', code: 'INSUFFICIENT_ROLE' },
            { status: 403 }
          );
        }

        // Actualizar último acceso
        await this.updateLastAccess(user.id);

        return { success: true, user };
      }

      return { success: true };

    } catch (error) {
      console.error('[AuthMiddleware] General error:', error);
      
      await this.logSecurityEvent(SecurityEvents.AUTH_MIDDLEWARE_ERROR, {
        error: error.message,
        ip: this.getClientIP(request),
        path: request.nextUrl.pathname
      });
      
      return NextResponse.json(
        { error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  }

  /**
   * Actualizar último acceso del usuario
   */
  async updateLastAccess(userId) {
    try {
      await prisma.usuarios.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      console.error('[AuthMiddleware] Error updating last access:', error);
    }
  }
}

// Instancia singleton del middleware
const authMiddleware = new AuthMiddleware();

/**
 * Helper functions para uso en API routes
 */

/**
 * Middleware para rutas que requieren autenticación básica
 */
export async function requireAuth(request, options = {}) {
  return await authMiddleware.authenticate(request, {
    requireAuth: true,
    ...options
  });
}

/**
 * Middleware para rutas de administrador
 */
export async function requireAdmin(request) {
  return await authMiddleware.authenticate(request, {
    requireAuth: true,
    allowedRoles: ['admin'],
    requireEmailVerified: true
  });
}

/**
 * Middleware para rutas de recolector
 */
export async function requireCollector(request) {
  return await authMiddleware.authenticate(request, {
    requireAuth: true,
    allowedRoles: ['admin', 'collector'],
    requireEmailVerified: true
  });
}

/**
 * Middleware para rutas de usuario autenticado
 */
export async function requireUser(request) {
  return await authMiddleware.authenticate(request, {
    requireAuth: true,
    allowedRoles: ['admin', 'collector', 'user']
  });
}

/**
 * Middleware para rutas públicas con autenticación opcional
 */
export async function optionalAuth(request) {
  return await authMiddleware.authenticate(request, {
    requireAuth: false
  });
}

export default authMiddleware;