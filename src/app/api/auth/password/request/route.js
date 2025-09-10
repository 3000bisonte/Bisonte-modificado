import { NextResponse } from "next/server";
import { createPasswordRecovery, verifyRecoveryCode, checkRateLimit } from "@/lib/security";
import { updateUserPasswordByEmail } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Request password reset
 * POST /api/auth/password/request
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Check rate limit
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `password_reset:${email}:${clientIp}`;
    
    const isAllowed = await checkRateLimit(rateLimitKey, 3, 3600); // 3 attempts per hour
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta más tarde." },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json(
        { message: "Si el email existe, se enviará un código de recuperación." },
        { status: 200 }
      );
    }

    // Create recovery code
    const recoveryCode = await createPasswordRecovery(user.id);

    // Here you would send the recovery code via email
    // For now, we'll return it (remove in production)
    console.log(`Password recovery code for ${email}: ${recoveryCode}`);

    return NextResponse.json(
      { 
        message: "Si el email existe, se enviará un código de recuperación.",
        // Remove this in production:
        recoveryCode: process.env.NODE_ENV === "development" ? recoveryCode : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in password reset request:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
