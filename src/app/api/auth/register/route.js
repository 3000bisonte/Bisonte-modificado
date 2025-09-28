import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/security";
import { handleEmailAuth } from "@/lib/userManager";
import prisma from "@/lib/prisma";
import { compose, handle, withErrorBoundary, withRateLimit, err, ok, getTraceId } from "@/lib/http";

/**
 * Register new user
 * POST /api/auth/register
 */
export const POST = compose(
  withRateLimit({ limit: 5, windowSec: 3600, key: (req) => `register:${req.headers.get("x-forwarded-for") || "unknown"}` }),
  handle(),
  withErrorBoundary()
)(async (request, { traceId }) => {
  const { email, password, nombre, celular, ciudad } = await request.json();

  if (!email || !password || !nombre) {
    return err(traceId, 400, "Email, contraseña y nombre son requeridos");
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return err(traceId, 400, { message: "La contraseña no cumple los requisitos", issues: passwordValidation.errors });
  }

  try {
    // Use improved user management (handles duplicates automatically)
    const userResult = await handleEmailAuth(email, password, {
      nombre,
      celular,
      ciudad
    });

    return ok(traceId, {
      message: "Usuario registrado exitosamente",
      user: { 
        id: userResult.id, 
        email: userResult.email, 
        name: userResult.name,
        method: userResult.method
      },
    }, { status: 201 });
    
  } catch (error) {
    // Handle specific errors
    if (error.message.includes('Ya existe un usuario')) {
      return err(traceId, 409, "El usuario ya existe");
    }
    
    console.error('[Registration] Error:', error);
    return err(traceId, 500, "Error interno del servidor");
  }
});
