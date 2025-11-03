import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

import { checkRateLimit, validatePasswordStrength, getRateLimitIdentity, resetRateLimit } from "../../../lib/security";
import { handleEmailAuth } from "../../../lib/userManager";

const prisma = new PrismaClient();

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

    // Validación de campos requeridos
    if (!normalizedEmail || !password || !nombre) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son requeridos" },
        { status: 400 }
      );
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validación de formato de nombre (solo letras, espacios, tildes y ñ)
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nombreRegex.test(nombre.trim())) {
      return NextResponse.json(
        { error: "El nombre solo puede contener letras" },
        { status: 400 }
      );
    }

    // Validación de longitud de nombre
    if (nombre.trim().length > 100) {
      return NextResponse.json(
        { error: "El nombre no puede exceder 100 caracteres" },
        { status: 400 }
      );
    }

    // Validación de formato de celular (si está presente)
    if (celular) {
      const celularRegex = /^\+?\d{7,15}$/;
      if (!celularRegex.test(celular.trim())) {
        return NextResponse.json(
          { error: "Formato de celular inválido. Debe contener entre 7 y 15 dígitos" },
          { status: 400 }
        );
      }
    }

    // Validación de longitud de ciudad (si está presente)
    if (ciudad && ciudad.trim().length > 100) {
      return NextResponse.json(
        { error: "El nombre de la ciudad no puede exceder 100 caracteres" },
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

    // Check for existing user with password (registration should not allow duplicates)
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 409 }
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