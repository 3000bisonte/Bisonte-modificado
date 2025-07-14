import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email, token, newPassword } = await request.json();

    console.log('🔧 Validando token y cambiando contraseña:', { email, token: token?.substring(0, 3) + '***' });

    // Validaciones básicas
    if (!email || !token || !newPassword) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Datos incompletos' 
      }, { status: 400 });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Correo electrónico inválido' 
      }, { status: 400 });
    }

    // Validación de token (6 dígitos)
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'El código debe tener 6 dígitos' 
      }, { status: 400 });
    }

    // Validación de contraseña segura
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.' 
      }, { status: 400 });
    }

    // ✅ BUSCAR USUARIO con token válido usando Prisma
    const usuario = await prisma.usuarios.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        token: token,
        tokenFecha: {
          gt: new Date() // Token no expirado
        }
      }
    });

    if (!usuario) {
      console.log('❌ Usuario no encontrado o token inválido/expirado');
      return NextResponse.json({ 
        ok: false, 
        error: 'Usuario no encontrado o código inválido/expirado' 
      }, { status: 400 });
    }

    console.log('👤 Usuario válido encontrado:', usuario.email);

    // ✅ HASHEAR nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // ✅ ACTUALIZAR contraseña y limpiar token
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: usuario.id },
      data: {
        password: hashedPassword,
        token: null,           // ✅ Limpiar token
        tokenFecha: null       // ✅ Limpiar fecha de expiración
      }
    });

    console.log('✅ Contraseña actualizada exitosamente para:', usuarioActualizado.email);

    return NextResponse.json({ 
      ok: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en validar-token:', error);
    return NextResponse.json({ 
      ok: false, 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error de conexión'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}