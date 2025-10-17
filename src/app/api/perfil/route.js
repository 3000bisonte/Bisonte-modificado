import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET: Obtener perfil del usuario autenticado desde la base de datos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: "No autenticado"
      }, { status: 401 });
    }

    console.log("📥 GET /api/perfil - Usuario:", session.user.email);
    
    // Buscar el usuario en la base de datos
    const usuario = await prisma.usuarios.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        nombre: true,
        celular: true,
        ciudad: true,
        email: true,
        tipoDocumento: true,
        numeroDocumento: true,
        direccionRecogida: true,
        detalleDireccion: true,
        recomendaciones: true,
        nickname: true,
        perfilCompleto: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: "Usuario no encontrado"
      }, { status: 404 });
    }

    // Retornar como array para compatibilidad con código existente
    const perfiles = [usuario];

    console.log("✅ Perfil obtenido desde DB:", { 
      id: usuario.id, 
      nombre: usuario.nombre,
      perfilCompleto: usuario.perfilCompleto 
    });
    
    return NextResponse.json({
      success: true,
      perfiles,
      message: `Perfil obtenido correctamente`
    });
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener perfil",
      details: error.message
    }, { status: 500 });
  }
}

// POST: Actualizar perfil del usuario autenticado en la base de datos
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: "No autenticado"
      }, { status: 401 });
    }

    const body = await request.json();
    
    console.log('📤 POST /api/perfil - Datos recibidos:', {
      email: session.user.email,
      campos: Object.keys(body)
    });

    // Validar que al menos algunos campos vengan completos
    const camposRequeridos = ['nombre', 'celular', 'tipoDocumento', 'numeroDocumento', 'direccionRecogida'];
    const camposCompletos = camposRequeridos.every(campo => 
      body[campo] || body[campo.replace('direccionRecogida', 'direccion')]
    );

    // Actualizar el perfil en la base de datos
    const perfilActualizado = await prisma.usuarios.update({
      where: { email: session.user.email },
      data: {
        nombre: body.nombre || body.nombrePerfil || undefined,
        celular: body.celular || undefined,
        ciudad: body.ciudad || undefined,
        tipoDocumento: body.tipoDocumento || undefined,
        numeroDocumento: body.numeroDocumento || undefined,
        direccionRecogida: body.direccion || body.direccionRecogida || undefined,
        detalleDireccion: body.apartamento || body.detalleDireccion || undefined,
        recomendaciones: body.recomendaciones || undefined,
        nickname: body.nickname || undefined,
        perfilCompleto: camposCompletos,
        updatedAt: new Date()
      },
      select: {
        id: true,
        nombre: true,
        celular: true,
        ciudad: true,
        email: true,
        tipoDocumento: true,
        numeroDocumento: true,
        direccionRecogida: true,
        detalleDireccion: true,
        recomendaciones: true,
        nickname: true,
        perfilCompleto: true,
        updatedAt: true
      }
    });

    console.log("✅ Perfil actualizado en DB:", { 
      id: perfilActualizado.id, 
      nombre: perfilActualizado.nombre,
      perfilCompleto: perfilActualizado.perfilCompleto 
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente en la base de datos',
      perfil: perfilActualizado
    });

  } catch (error) {
    console.error("❌ Error actualizando perfil:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error al actualizar perfil",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
