// 🛡️ API Route para verificación de sesión robusta
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logSecurityEvent, SecurityEvents } from "@/lib/security";

const verifySessionSchema = z
  .object({
    sessionId: z
      .union([
        z.string().trim().min(1, "Session ID requerido"),
        z.number().int().positive({ message: "Session ID inválido" }),
      ])
      .transform((value) => {
        const normalized = String(value).trim();
        if (!/^\d+$/.test(normalized)) {
          throw new z.ZodError([
            {
              code: z.ZodIssueCode.custom,
              message: "Session ID inválido",
              path: ["sessionId"],
            },
          ]);
        }
        return normalized;
      }),
    lastActivity: z
      .number({ invalid_type_error: "lastActivity debe ser numérico" })
      .int("lastActivity debe ser un entero")
      .optional(),
  })
  .strict();

/**
 * POST /api/auth/verify-session
 * Verificar la validez e integridad de la sesión actual
 */
export async function POST(request) {
  try {
    // Obtener IP del cliente
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    let rawBody = null;
    try {
      rawBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Cuerpo de la petición inválido',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    const validation = verifySessionSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Datos de verificación inválidos',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { sessionId, lastActivity } = validation.data;

    // Obtener sesión del servidor
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      await logSecurityEvent(SecurityEvents.SESSION_VERIFICATION_FAILED, {
        sessionId,
        ip: clientIP,
        reason: 'no_server_session'
      });

      return NextResponse.json(
        { 
          valid: false, 
          error: 'Sesión no encontrada',
          code: 'NO_SESSION'
        },
        { status: 401 }
      );
    }

    // Verificar que el ID de sesión coincida
    const serverSessionId = session.user.id ? String(session.user.id) : undefined;

    if (serverSessionId !== sessionId) {
      await logSecurityEvent(SecurityEvents.SESSION_ID_MISMATCH, {
        sessionId,
        serverSessionId,
        ip: clientIP
      });

      return NextResponse.json(
        { 
          valid: false, 
          error: 'ID de sesión no coincide',
          code: 'SESSION_MISMATCH'
        },
        { status: 401 }
      );
    }

    // Verificar usuario en base de datos
    const numericSessionId = Number.parseInt(sessionId, 10);

    if (Number.isNaN(numericSessionId)) {
      await logSecurityEvent(SecurityEvents.SESSION_VERIFICATION_FAILED, {
        sessionId,
        ip: clientIP,
        reason: 'invalid_session_id_format'
      });

      return NextResponse.json(
        {
          valid: false,
          error: 'Formato de sesión inválido',
          code: 'INVALID_SESSION_ID',
        },
        { status: 400 }
      );
    }

    const dbUser = await prisma.usuarios.findUnique({
      where: { id: numericSessionId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        esAdministrador: true,
        esRecolector: true,
        lockedUntil: true,
        lastLoginAt: true,
        passwordVersion: true,
        failedLogins: true
      }
    });

    if (!dbUser) {
      await logSecurityEvent(SecurityEvents.USER_NOT_FOUND_IN_SESSION, {
        sessionId,
        ip: clientIP
      });

      return NextResponse.json(
        { 
          valid: false, 
          error: 'Usuario no válido',
          code: 'USER_NOT_FOUND'
        },
        { status: 401 }
      );
    }

    // Verificar si la cuenta está bloqueada
    if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
      await logSecurityEvent(SecurityEvents.LOCKED_ACCOUNT_ACCESS_ATTEMPT, {
        userId: sessionId,
        ip: clientIP,
        lockedUntil: dbUser.lockedUntil
      });

      return NextResponse.json(
        { 
          valid: false, 
          error: 'Cuenta bloqueada temporalmente',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: dbUser.lockedUntil
        },
        { status: 423 }
      );
    }

    // Verificar versión de contraseña (para invalidar sesiones tras cambio)
    if (session.user.passwordVersion !== undefined && 
        dbUser.passwordVersion !== session.user.passwordVersion) {
      
      await logSecurityEvent(SecurityEvents.PASSWORD_VERSION_MISMATCH, {
        userId: sessionId,
        sessionVersion: session.user.passwordVersion,
        dbVersion: dbUser.passwordVersion,
        ip: clientIP
      });

      return NextResponse.json(
        { 
          valid: false, 
          error: 'Contraseña cambiada, inicia sesión nuevamente',
          code: 'PASSWORD_CHANGED'
        },
        { status: 401 }
      );
    }

    // Verificar actividad reciente (opcional)
    if (lastActivity) {
      const timeSinceActivity = Date.now() - lastActivity;
      const maxInactivity = 30 * 60 * 1000; // 30 minutos

      if (timeSinceActivity > maxInactivity) {
        await logSecurityEvent(SecurityEvents.SESSION_INACTIVE, {
          userId: sessionId,
          lastActivity: new Date(lastActivity),
          inactivityPeriod: timeSinceActivity,
          ip: clientIP
        });

        return NextResponse.json(
          { 
            valid: false, 
            error: 'Sesión inactiva por mucho tiempo',
            code: 'SESSION_INACTIVE'
          },
          { status: 401 }
        );
      }
    }

    // Actualizar último acceso
    await prisma.usuarios.update({
      where: { id: numericSessionId },
      data: { 
        lastLoginAt: new Date(),
        failedLogins: 0 // Resetear intentos fallidos en verificación exitosa
      }
    });

    // Log de verificación exitosa
    await logSecurityEvent(SecurityEvents.SESSION_VERIFIED, {
      userId: sessionId,
      ip: clientIP,
      userAgent: request.headers.get('user-agent'),
      lastActivity: lastActivity ? new Date(lastActivity) : null
    });

    // Preparar información del usuario para respuesta
    const userRole = dbUser.esAdministrador ? 'admin' : 
                     dbUser.esRecolector ? 'collector' : 'user';

    return NextResponse.json({
      valid: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: userRole,
        emailVerified: dbUser.emailVerified,
        lastLoginAt: dbUser.lastLoginAt
      },
      session: {
        expiresAt: session.expires,
        issuedAt: session.iat || Date.now()
      }
    });

  } catch (error) {
    console.error('[SessionVerification] Error:', error);
    
    // Log del error
    await logSecurityEvent(SecurityEvents.SESSION_VERIFICATION_ERROR, {
      error: error.message,
      stack: error.stack,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    return NextResponse.json(
      { 
        valid: false, 
        error: 'Error interno de verificación',
        code: 'VERIFICATION_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/verify-session
 * Método no permitido - solo POST
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}