import { NextResponse } from "next/server";

import { updateUserPasswordByEmail } from "../../../../lib/auth";
import { verifyRecoveryCode, validatePasswordStrength, checkRateLimit, getClientIP } from "../../../../lib/security";
import prisma from "../../../../libs/prisma";

/**
 * Validate recovery token and reset password
 * POST /api/recuperar/validar-token
 */
export async function POST(request) {
  try {
  const { email, code, newPassword } = await request.json();

  if (!email || !code || !newPassword) {
      return NextResponse.json(
    { ok: false, error: "Email, código y nueva contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Check rate limit
  const clientIp = getClientIP(request);
  const identifier = `${email}:${clientIp}`;
  const rateLimit = await checkRateLimit(identifier, "password_reset_verify", 5, 60 * 60 * 1000);
    if (!rateLimit?.allowed) {
      return NextResponse.json(
        {
          ok: false,
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
        { ok: false, error: "La contraseña no cumple los requisitos", details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

  // Verify recovery code using email + 6-digit code
  const recovery = await verifyRecoveryCode(email, code);
  if (!recovery) {
      return NextResponse.json(
        { ok: false, error: "Código de recuperación inválido o expirado" },
        { status: 400 }
      );
    }

    // Update password
    const success = await updateUserPasswordByEmail(email, newPassword);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Error al actualizar la contraseña" },
        { status: 500 }
      );
    }

  // Clean up recovery codes for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json(
      { ok: true, reset: true, message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in password reset validation:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export function GET() { 
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 }); 
}