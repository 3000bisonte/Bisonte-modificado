import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions, updateUserPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { validatePasswordStrength, verifyPassword } from "@/lib/security";

/**
 * Change password for authenticated user
 * POST /api/auth/password/change
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Contraseña actual y nueva son requeridas" },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: "La nueva contraseña no cumple los requisitos", details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Find user and verify current password
    const user = await prisma.usuarios.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { id: true, password: true }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { error: "Contraseña actual incorrecta" },
        { status: 400 }
      );
    }

    // Update password
    const success = await updateUserPassword(user.id, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: "Error al actualizar la contraseña" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in password change:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
