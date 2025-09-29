import { validateRequest } from '@/lib/validation';
import { withErrorHandler } from '@/lib/errorHandler';
import { NextResponse } from "next/server";
import prisma from "../../../libs/prisma";

export async function GET() {
  try {
    // Simulate admin dashboard data
    const stats = {
      totalUsuarios: await prisma.usuarios.count().catch(() => 0),
  totalEnvios: await prisma.historial_envio.count().catch(() => 0),
      totalContactos: await prisma.contacto.count().catch(() => 0)
    };

    return NextResponse.json({
      success: true,
      message: "Admin dashboard data",
      data: {
        stats,
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      }
    });
  } catch (error) {
    console.error("Error en GET /admin:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener datos de admin",
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("Admin operation:", data);
    
    return NextResponse.json({
      success: true,
      message: "Admin operation completed",
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error en POST /admin:", error);
    return NextResponse.json({
      success: false,
      error: "Error en operación de admin",
      details: error.message
    }, { status: 500 });
  }
}
