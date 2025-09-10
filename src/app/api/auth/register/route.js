import { NextResponse } from "next/server";
import { validatePasswordStrength } from "@/lib/security";
import { createUser } from "@/lib/auth";
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

  // Check if user already exists
  const existingUser = await prisma.usuarios.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return err(traceId, 409, "El usuario ya existe");
  }

  // Create user
  const newUser = await createUser({ email, password, nombre, celular, ciudad });

  return ok(traceId, {
    message: "Usuario registrado exitosamente",
    user: { id: newUser.id, email: newUser.email, nombre: newUser.nombre },
  }, { status: 201 });
});
