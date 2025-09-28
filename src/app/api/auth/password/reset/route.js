import { NextResponse } from "next/server";
import { verifyRecoveryCode, validatePasswordStrength, checkRateLimit } from "@/lib/security";
import { updateUserPasswordByEmail } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Reset password with recovery code
 * POST /api/auth/password/reset
 */
export async function POST(request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, código y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Check rate limit
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `password_reset_verify:${email}:${clientIp}`;
    
    const rateLimit = await checkRateLimit(rateLimitKey, "password_reset_verify", 5, 60 * 60 * 1000); // 5 attempts per hour
    if (!rateLimit?.allowed) {
      return NextResponse.json(
        {
          error: "Demasiados intentos. Intenta más tarde.",
          retryInMinutes: rateLimit?.resetIn ?? null
        },
        { status: 429 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "La contraseña no cumple los requisitos", details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verify recovery code
    const recovery = await verifyRecoveryCode(email, code);
    if (!recovery) {
      return NextResponse.json(
        { error: "Código de recuperación inválido o expirado" },
        { status: 400 }
      );
    }

    // Update password
    const success = await updateUserPasswordByEmail(email, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: "Error al actualizar la contraseña" },
        { status: 500 }
      );
    }

    // Clean up recovery codes for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in password reset:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
