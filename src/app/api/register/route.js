import { NextResponse } from "next/server";
import { checkRateLimit, validatePasswordStrength } from "../../../lib/security";
import { handleEmailAuth } from "../../../lib/userManager";
import prisma from "../../../lib/prisma";

/**
 * Register new user
 * POST /api/register
 */
export async function POST(request) {
  try {
    const { email, password, nombre, celular, ciudad } = await request.json();

    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son requeridos" },
        { status: 400 }
      );
    }

    // Check rate limit
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `register:${clientIp}`;
    
    const isAllowed = await checkRateLimit(rateLimitKey, 5, 3600); // 5 registrations per hour per IP
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Demasiados intentos de registro. Intenta más tarde." },
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
      const userResult = await handleEmailAuth(email, password, {
        nombre,
        celular,
        ciudad
      });

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

export function GET() { 
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 }); 
}