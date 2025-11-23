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

    console.log("📥 GET /api/perfil - Buscando usuario:", session.user.email);
    console.log("📥 Sesión completa:", {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      emailVerified: session.user.emailVerified
    });
    
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

    console.log("📥 Usuario encontrado en DB:", usuario ? {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      perfilCompleto: usuario.perfilCompleto,
      tienePerfilVacio: !usuario.nombre && !usuario.celular && !usuario.ciudad
    } : "❌ NO ENCONTRADO");

    if (!usuario) {
      // ⚠️ CASO ANORMAL: El usuario tiene sesión pero no existe en DB
      // Esto NO debería suceder si handleGoogleAuth funcionó correctamente
      console.error("⚠️⚠️⚠️ PROBLEMA: Usuario no encontrado en DB para email:", session.user.email);
      console.error("⚠️ Esto indica que handleGoogleAuth falló o no se ejecutó");
      console.error("⚠️ session.user.id desde JWT:", session.user.id);
      
      const perfilVacio = {
        id: null,
        nombre: session.user.name || "",
        celular: null,
        ciudad: null,
        email: session.user.email,
        tipoDocumento: null,
        numeroDocumento: null,
        direccionRecogida: null,
        detalleDireccion: null,
        recomendaciones: null,
        nickname: session.user.name || null,
        perfilCompleto: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return NextResponse.json({
        success: true,
        perfiles: [perfilVacio],
        message: "Perfil vacío - completa tus datos",
        isNewUser: true
      });
    }

    // Usuario encontrado en DB - retornar su perfil (aunque esté vacío)
    const perfiles = [usuario];
    
    const esPerfilVacio = !usuario.nombre && !usuario.celular && !usuario.ciudad && 
                          !usuario.tipoDocumento && !usuario.numeroDocumento;

    console.log("✅ Perfil obtenido desde DB:", { 
      id: usuario.id, 
      email: usuario.email,
      nombre: usuario.nombre || "(vacío)",
      perfilCompleto: usuario.perfilCompleto,
      esPerfilVacio
    });
    
    return NextResponse.json({
      success: true,
      perfiles,
      message: esPerfilVacio 
        ? "Usuario registrado - completa tu perfil" 
        : "Perfil obtenido correctamente",
      isNewUser: esPerfilVacio
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

    // Verificar si el usuario existe antes de actualizar
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email: session.user.email }
    });

    let perfilActualizado;

    if (!usuarioExistente) {
      // ✅ NUEVO: Si el usuario no existe (caso excepcional), crearlo
      console.log("⚠️ Usuario no encontrado en DB, creando nuevo registro para:", session.user.email);
      
      perfilActualizado = await prisma.usuarios.create({
        data: {
          email: session.user.email,
          nombre: body.nombre || body.nombrePerfil || session.user.name || "",
          celular: body.celular || null,
          ciudad: body.ciudad || null,
          tipoDocumento: body.tipoDocumento || null,
          numeroDocumento: body.numeroDocumento || null,
          direccionRecogida: body.direccion || body.direccionRecogida || null,
          detalleDireccion: body.apartamento || body.detalleDireccion || null,
          recomendaciones: body.recomendaciones || null,
          nickname: body.nickname || session.user.name || null,
          perfilCompleto: camposCompletos,
          emailVerified: true, // Usuario ya autenticado
          createdAt: new Date(),
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
      
      console.log("✅ Nuevo perfil creado en DB:", { 
        id: perfilActualizado.id, 
        nombre: perfilActualizado.nombre 
      });
    } else {
      // Actualizar el perfil existente en la base de datos
      perfilActualizado = await prisma.usuarios.update({
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
    }

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
