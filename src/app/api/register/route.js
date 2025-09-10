import { NextResponse } from "next/server";
import { checkRateLimit, validatePasswordStrength } from "../../../lib/security";
import { createUser } from "../../../lib/auth";
import prisma from "../../../libs/prisma";

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

    // Check if user already exists
    const existingUser = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 409 }
      );
    }

    // Create user
    const newUser = await createUser({
      email,
      password,
      nombre,
      celular,
      ciudad
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Usuario registrado exitosamente",
        user: {
          id: newUser.id,
          email: newUser.email,
          nombre: newUser.nombre
        }
      },
      { status: 201 }
    );

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