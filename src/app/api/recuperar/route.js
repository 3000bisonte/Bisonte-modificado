import { NextResponse } from "next/server";
import { createPasswordRecovery, checkRateLimit, getClientIP, getClientUserAgent } from "../../../lib/security";
import { sendPasswordRecoveryEmail } from "../../../lib/email";
import prisma from "../../../libs/prisma";

/**
 * Request password reset
 * POST /api/recuperar
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

  // Check rate limit (3 attempts per hour per email+IP)
  const clientIp = getClientIP(request);
  const identifier = `${email}:${clientIp}`;
  const rateLimit = await checkRateLimit(identifier, "password_reset", 3, 60 * 60 * 1000);
    if (!rateLimit?.allowed) {
      return NextResponse.json(
        {
          error: "Demasiados intentos. Intenta más tarde.",
          retryInMinutes: rateLimit?.resetIn ?? null
        },
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
        { success: true, issued: true, message: "Si el email existe, se enviará un código de recuperación.", expiresInMinutes: 15 },
        { status: 200 }
      );
    }

  // Create recovery code and token tied to email/IP/UA
  const userAgent = getClientUserAgent(request);
  const { code, token, expiresAt } = await createPasswordRecovery(email, clientIp, userAgent);

    const emailDelivery = await sendPasswordRecoveryEmail({
      to: email,
      code,
      token,
      expiresAt,
      name: user.nombre || user.email,
    });

    if (!emailDelivery.sent) {
      console.warn("[PasswordReset] Email delivery skipped or failed", {
        email,
        reason: emailDelivery.reason,
        error: emailDelivery.error,
      });
    }

    const responseBody = {
      success: true,
      issued: true,
      message: "Si el email existe, se enviará un código de recuperación.",
      expiresInMinutes: 30,
    };

    if (process.env.NODE_ENV !== "production") {
      Object.assign(responseBody, {
        recoveryCode: code,
        recoveryToken: token,
        expiresAt,
        emailDelivery,
      });
    }

    return NextResponse.json(responseBody, { status: 200 });

  } catch (error) {
    console.error("Error in password reset request:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export function GET() { 
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 }); 
}