import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Resend } from 'resend';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        usuarioExiste: false, 
        error: 'Email requerido' 
      }, { status: 400 });
    }

    console.log('🔍 Buscando usuario con email:', email);

    // ✅ USAR PRISMA en lugar de SQL directo
    const usuario = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!usuario) {
      console.log('⚠️ Usuario no encontrado:', email);
      // Por seguridad, siempre responder que se envió el email
      return NextResponse.json({ 
        usuarioExiste: false,
        message: "Si el correo está registrado, recibirás un mensaje para recuperar tu contraseña."
      });
    }

    console.log('👤 Usuario encontrado:', usuario.id);

    // ✅ GENERAR TOKEN usando los campos correctos del schema
    const token = crypto.randomInt(100000, 999999).toString(); // 6 dígitos
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // ✅ GUARDAR TOKEN usando los nombres correctos de tu schema
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: {
        token: token,        // ✅ Usar 'token' no 'reset_token'
        tokenFecha: tokenExpiry // ✅ Usar 'tokenFecha' no 'reset_token_expires'
      }
    });

    console.log('🔑 Token generado y guardado:', token);

    // ✅ ENVIAR EMAIL con configuración mejorada
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY no configurada');
        // Continuar sin fallar para testing
      } else {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: 'Bisonte Logística <logistica@notificaciones.bisonteapp.com>', // ✅ Usar dominio verificado
          to: [email],
          subject: 'Código de recuperación de contraseña - Bisonte Logística',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #41e0b3, #2bbd8c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Bisonte Logística</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Código de recuperación</h2>
                
                <p style="color: #666; line-height: 1.6; text-align: center;">
                  Hola <strong>${usuario.nombre || 'Usuario'}</strong>,
                </p>
                
                <p style="color: #666; line-height: 1.6; text-align: center;">
                  Tu código de recuperación de contraseña es:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="display: inline-block; background: #41e0b3; color: white; padding: 20px 40px; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
                    ${token}
                  </div>
                </div>
                
                <p style="color: #666; line-height: 1.6; text-align: center; font-size: 14px;">
                  Este código es válido por <strong>10 minutos</strong>.<br>
                  Si no solicitaste este código, puedes ignorar este mensaje.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2024 Bisonte Logística. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `
Hola ${usuario.nombre || 'Usuario'},

Tu código de recuperación de contraseña es: ${token}

Este código es válido por 10 minutos. Si no solicitaste este código, ignora este mensaje.

¡Gracias!
Equipo Bisonte Logística
          `
        });

        console.log('📧 Email enviado exitosamente a:', email);
      }
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
      // No fallar la API si el email falla
    }

    return NextResponse.json({ 
      usuarioExiste: true,
      message: "Si el correo está registrado, recibirás un código para recuperar tu contraseña."
    });

  } catch (error) {
    console.error('❌ Error en API recuperar:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return NextResponse.json({ 
      usuarioExiste: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error de servidor'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}