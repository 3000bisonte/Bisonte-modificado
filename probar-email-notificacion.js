// Script para probar el envío de emails de notificación
require('dotenv').config({ path: '.env.local' });

async function probarEmailNotificacion() {
  console.log('\n🧪 PROBANDO SISTEMA DE NOTIFICACIONES POR EMAIL\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Verificar configuración
  console.log('📋 VERIFICANDO CONFIGURACIÓN:\n');
  
  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  
  if (!resendKey) {
    console.error('❌ RESEND_API_KEY no está configurada en .env.local');
    console.log('\n📝 Configura tu API Key de Resend:');
    console.log('   1. Ve a https://resend.com/api-keys');
    console.log('   2. Crea una nueva API Key');
    console.log('   3. Agrégala a .env.local como RESEND_API_KEY=re_...\n');
    return;
  }
  
  console.log(`   ✅ RESEND_API_KEY configurada: ${resendKey.substring(0, 10)}...`);
  console.log(`   ✅ EMAIL_FROM configurado: ${emailFrom}`);
  
  console.log('\n═══════════════════════════════════════════════════\n');
  console.log('📧 ENVIANDO EMAIL DE PRUEBA...\n');
  
  // Importar dinámicamente el servicio
  const { Resend } = require('resend');
  const resend = new Resend(resendKey);
  
  // Datos de prueba
  const envioPrueba = {
    NumeroGuia: 'TEST-' + Date.now(),
    Estado: 'EN_TRANSITO',
    CiudadOrigen: 'Bogotá',
    CiudadDestino: 'Medellín',
    Remitente: JSON.stringify({
      Nombre: 'Juan',
      Apellido: 'Pérez',
      Telefono: '3001234567'
    }),
    Destinatario: JSON.stringify({
      Nombre: 'María',
      Apellido: 'García',
      Telefono: '3009876543'
    })
  };
  
  // Email de prueba (CAMBIA ESTE EMAIL POR EL TUYO)
  const emailPrueba = '3000bisonte@gmail.com'; // ← CAMBIA ESTO
  
  console.log(`   Destinatario: ${emailPrueba}`);
  console.log(`   Número de Guía: ${envioPrueba.NumeroGuia}`);
  console.log(`   Estado: ${envioPrueba.Estado}`);
  
  // Generar HTML del email
  const estadoInfo = {
    emoji: '🚚',
    titulo: 'En Tránsito',
    descripcion: 'Tu envío está en camino hacia su destino.',
    color: '#8B5CF6'
  };
  
  const destinatario = JSON.parse(envioPrueba.Destinatario);
  const remitente = JSON.parse(envioPrueba.Remitente);
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prueba de Email - Bisonte</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, ${estadoInfo.color} 0%, ${estadoInfo.color}dd 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">${estadoInfo.emoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${estadoInfo.titulo}</h1>
              <p style="margin: 12px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                🧪 EMAIL DE PRUEBA - Sistema de Notificaciones
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              
              <div style="background-color: #f9fafb; border-left: 4px solid ${estadoInfo.color}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  ${estadoInfo.descripcion}
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">
                  📋 Detalles del Envío (PRUEBA)
                </h2>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Número de Guía:</strong></td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">${envioPrueba.NumeroGuia}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Estado:</strong></td>
                    <td style="color: ${estadoInfo.color}; font-size: 14px; font-weight: 600; padding: 8px 0;">${estadoInfo.emoji} ${envioPrueba.Estado}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Origen:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${envioPrueba.CiudadOrigen}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Destino:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${envioPrueba.CiudadDestino}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Remitente:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${remitente.Nombre} ${remitente.Apellido}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Destinatario:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${destinatario.Nombre} ${destinatario.Apellido}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background-color: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>✅ ¡Email de prueba enviado exitosamente!</strong><br>
                  Si ves este mensaje, el sistema de notificaciones está funcionando correctamente.
                </p>
              </div>
              
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                <strong>Bisonte - Sistema de Notificaciones</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este es un email de prueba del sistema de notificaciones automáticas.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: emailPrueba,
      subject: `🧪 Prueba - ${estadoInfo.emoji} ${estadoInfo.titulo} - Guía #${envioPrueba.NumeroGuia}`,
      html: htmlContent,
    });
    
    if (error) {
      console.error('\n❌ ERROR AL ENVIAR EMAIL:\n');
      console.error(error);
      console.log('\n📝 POSIBLES CAUSAS:');
      console.log('   • API Key inválida o expirada');
      console.log('   • Dominio de email no verificado en Resend');
      console.log('   • Límite de emails alcanzado (plan gratuito: 100/día)');
      console.log('   • Email destinatario en lista de bloqueo\n');
      return;
    }
    
    console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE!\n');
    console.log(`   📧 Email ID: ${data?.id}`);
    console.log(`   📬 Destinatario: ${emailPrueba}`);
    console.log(`   📨 Estado: Enviado`);
    
    console.log('\n═══════════════════════════════════════════════════\n');
    console.log('🎉 SISTEMA DE NOTIFICACIONES FUNCIONANDO CORRECTAMENTE\n');
    console.log('📝 PRÓXIMOS PASOS:\n');
    console.log('   1. Revisa tu bandeja de entrada');
    console.log('   2. Si no lo ves, revisa spam/correo no deseado');
    console.log('   3. El email debería llegar en menos de 1 minuto\n');
    console.log('💡 NOTA: El sistema enviará emails automáticamente');
    console.log('   cada vez que cambies el estado de un envío desde el admin.\n');
    
  } catch (error) {
    console.error('\n❌ ERROR INESPERADO:\n');
    console.error(error);
    console.log('\n📝 Verifica tu conexión a internet y vuelve a intentar.\n');
  }
}

// Ejecutar prueba
probarEmailNotificacion();
