import { NextResponse } from "next/server";

import { checkRateLimit, validatePasswordStrength, getRateLimitIdentity, resetRateLimit } from "../../../lib/security";
import { handleEmailAuth } from "../../../lib/userManager";

/**
 * Get register endpoint info
 * GET /api/register
 */
export async function GET() {
  return NextResponse.json({
    message: "Endpoint de registro de usuarios",
    method: "POST",
    requiredFields: ["email", "password", "nombre"],
    optionalFields: ["celular", "ciudad"]
  });
}

/**
 * Register new user
 * POST /api/register
 */
export async function POST(request) {
  try {
    const { email, password, nombre, celular, ciudad } = await request.json();

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password || !nombre) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son requeridos" },
        { status: 400 }
      );
    }

    // Smart rate limits - more generous for normal usage
    const clientIdentity = getRateLimitIdentity(request, { extra: 'register' });
    const emailIdentity = `email:${normalizedEmail}`;

    // Smart registration limits: allow burst but prevent spam (sliding window)
    const [shortWindow, mediumWindow, longWindow, emailWindow] = await Promise.all([
      checkRateLimit(clientIdentity, 'register_burst', 20, 2 * 60 * 1000),
      checkRateLimit(clientIdentity, 'register_medium', 90, 60 * 60 * 1000),
      checkRateLimit(clientIdentity, 'register_daily', 500, 24 * 60 * 60 * 1000),
      checkRateLimit(emailIdentity, 'register_email', 6, 60 * 60 * 1000)
    ]);

    if (!shortWindow?.allowed || !mediumWindow?.allowed || !longWindow?.allowed || !emailWindow?.allowed) {
      let errorMessage = "Límite de registros alcanzado.";
      let retryMinutes = 1;
      let blockSource = 'ip';
      
      if (!emailWindow?.allowed) {
        errorMessage = "Este email ya ha sido usado recientemente. Intenta más tarde.";
        retryMinutes = emailWindow.resetIn;
        blockSource = 'email';
      } else if (!shortWindow?.allowed) {
        errorMessage = "Demasiados registros muy seguidos. Espera un momento.";
        retryMinutes = shortWindow.resetIn;
      } else if (!mediumWindow?.allowed) {
        errorMessage = "Límite temporal alcanzado. Intenta en unos minutos.";
        retryMinutes = mediumWindow.resetIn;
      } else if (!longWindow?.allowed) {
        errorMessage = "Límite diario alcanzado. Intenta mañana.";
        retryMinutes = longWindow.resetIn;
      }

      retryMinutes = Math.max(1, retryMinutes ?? 1);

      return NextResponse.json(
        {
          error: errorMessage,
          retryInMinutes: retryMinutes,
          blockedBy: blockSource
        },
        { status: 429 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "La contraseña no cumple los requisitos", details: passwordValidation.errors },
        { status: 400 }
      );
    }

    try {
      // Use improved user management (handles duplicates automatically)
      const userResult = await handleEmailAuth(normalizedEmail, password, {
        nombre,
        celular,
        ciudad
      });

      // Successful registration should release the stricter buckets to avoid lockouts on retry
      resetRateLimit(emailIdentity, 'register_email');
      resetRateLimit(clientIdentity, 'register_burst');

      return NextResponse.json(
        { 
          success: true,
          message: "Usuario registrado exitosamente",
          user: {
            id: userResult.id,
            email: userResult.email,
            name: userResult.name,
            method: userResult.method
          }
        },
        { status: 201 }
      );
      
    } catch (userError) {
      // Handle specific user creation errors
      if (userError.message.includes('Ya existe un usuario')) {
        return NextResponse.json(
          { error: "El usuario ya existe" },
          { status: 409 }
        );
      }
      
      console.error('[Registration] User creation error:', userError);
      throw userError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error("Error in user registration:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}