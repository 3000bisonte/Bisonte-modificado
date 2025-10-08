import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("perfil-get");
    
    // Simular obtención de perfiles
    const perfiles = [
      {
        id: 1,
        nombre: 'Test User Profile',
        celular: '1234567890',
        ciudad: 'Test City',
        email: 'test@testapi.com',
        tipoDocumento: 'CC',
        numeroDocumento: '12345678',
        direccionRecogida: 'Test Address',
        createdAt: new Date().toISOString()
      }
    ];

    console.log("perfil-get", perfiles);
    
    return NextResponse.json({
      success: true,
      perfiles,
      message: `${perfiles.length} perfiles obtenidos`
    });
  } catch (error) {
    console.error("Error obteniendo perfiles:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener perfil",
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('POST /api/perfil - Datos recibidos:', body);

    // Simular actualización de perfil
    const perfilActualizado = {
      id: Date.now(),
      nombre: body.nombrePerfil || body.nombre || 'Usuario Actualizado',
      celular: body.celular || '1234567890',
      email: body.correo || body.email || 'test@example.com',
      tipoDocumento: body.tipoDocumento || 'CC',
      numeroDocumento: body.numeroDocumento || '12345678',
      ciudad: body.ciudad || 'Ciudad Test',
      direccionRecogida: body.direccionRecogida || 'Dirección actualizada',
      detalleDireccion: body.detalleDireccion || 'Detalle actualizado',
      recomendaciones: body.recomendaciones || 'Sin recomendaciones',
      nickname: body.nickname || 'usuario',
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      perfil: perfilActualizado
    });

  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Error interno del servidor",
        details: error.message 
      },
      { status: 500 }
    );
  }
}
