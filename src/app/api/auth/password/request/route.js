import { NextResponse } from "next/server";

import { sendPasswordRecoveryEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
import { createPasswordRecovery, checkRateLimit } from "@/lib/security";

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
    const userAgent = request.headers.get("user-agent") || "unknown";
    const rateLimitKey = `password_reset:${email}:${clientIp}`;

    const rateLimit = await checkRateLimit(rateLimitKey, "password_reset", 3, 60 * 60 * 1000); // 3 attempts per hour
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
        { message: "Si el email existe, se enviará un código de recuperación." },
        { status: 200 }
      );
    }

    // Create recovery code
    const recoveryData = await createPasswordRecovery(email, clientIp, userAgent);

    const emailDelivery = await sendPasswordRecoveryEmail({
      to: email,
      code: recoveryData.code,
      token: recoveryData.token,
      expiresAt: recoveryData.expiresAt,
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
      message: "Si el email existe, se enviará un código de recuperación.",
    };

    if (process.env.NODE_ENV !== "production") {
      Object.assign(responseBody, {
        recoveryCode: recoveryData.code,
        recoveryToken: recoveryData.token,
        expiresAt: recoveryData.expiresAt,
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
