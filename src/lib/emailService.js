// Servicio de notificaciones por email usando Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'logistica@notificaciones.bisonteapp.com';

// Mapeo de estados a información descriptiva
const ESTADO_INFO = {
  'EN_BODEGA': {
    emoji: '📦',
    titulo: 'Envío Registrado',
    descripcion: 'Tu envío ha sido registrado y está en nuestra bodega esperando ser procesado.',
    color: '#3B82F6'
  },
  'PENDIENTE_RECOGIDA': {
    emoji: '🏃',
    titulo: 'Pendiente de Recogida',
    descripcion: 'Tu envío está programado para ser recogido en la dirección indicada.',
    color: '#F59E0B'
  },
  'EN_TRANSITO': {
    emoji: '🚚',
    titulo: 'En Tránsito',
    descripcion: 'Tu envío está en camino hacia su destino.',
    color: '#8B5CF6'
  },
  'EN_DISTRIBUCION': {
    emoji: '🚛',
    titulo: 'En Distribución',
    descripcion: 'Tu envío está en el centro de distribución local y será entregado pronto.',
    color: '#EC4899'
  },
  'ENTREGADO': {
    emoji: '✅',
    titulo: '¡Entregado Exitosamente!',
    descripcion: 'Tu envío ha sido entregado en la dirección de destino.',
    color: '#10B981'
  },
  'DEVUELTO_ORIGEN': {
    emoji: '↩️',
    titulo: 'Devuelto al Origen',
    descripcion: 'El envío ha sido devuelto a la dirección de origen.',
    color: '#6B7280'
  },
  'ENVIO_CANCELADO': {
    emoji: '❌',
    titulo: 'Envío Cancelado',
    descripcion: 'El envío ha sido cancelado.',
    color: '#EF4444'
  },
  'EN_ESPERA': {
    emoji: '⏳',
    titulo: 'En Espera',
    descripcion: 'Tu envío está en espera de procesamiento.',
    color: '#F59E0B'
  }
};

/**
 * Genera el HTML del email de notificación de estado
 */
function generarHTMLEmail(envio, estadoInfo) {
  const destinatario = typeof envio.Destinatario === 'string' 
    ? JSON.parse(envio.Destinatario) 
    : envio.Destinatario;
  
  const remitente = typeof envio.Remitente === 'string' 
    ? JSON.parse(envio.Remitente) 
    : envio.Remitente;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Actualización de Envío - Bisonte</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${estadoInfo.color} 0%, ${estadoInfo.color}dd 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 16px;">${estadoInfo.emoji}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${estadoInfo.titulo}</h1>
            </td>
          </tr>
          
          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Mensaje de Estado -->
              <div style="background-color: #f9fafb; border-left: 4px solid ${estadoInfo.color}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  ${estadoInfo.descripcion}
                </p>
              </div>
              
              <!-- Información del Envío -->
              <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
                  📋 Detalles del Envío
                </h2>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Número de Guía:</strong></td>
                    <td style="color: #111827; font-size: 14px; font-weight: 600; padding: 8px 0;">${envio.NumeroGuia}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Estado Actual:</strong></td>
                    <td style="color: ${estadoInfo.color}; font-size: 14px; font-weight: 600; padding: 8px 0;">${estadoInfo.emoji} ${envio.Estado.replace(/_/g, ' ')}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Origen:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${envio.CiudadOrigen || 'Bogotá'}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Destino:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${envio.CiudadDestino}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Remitente:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${remitente?.Nombre || ''} ${remitente?.Apellido || ''}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; font-size: 14px; padding: 8px 0;"><strong>Destinatario:</strong></td>
                    <td style="color: #111827; font-size: 14px; padding: 8px 0;">${destinatario?.Nombre || ''} ${destinatario?.Apellido || ''}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Botón de Acción -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.bisonteapp.com/misenvios" 
                   style="display: inline-block; background-color: ${estadoInfo.color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Ver Detalles Completos
                </a>
              </div>
              
              <!-- Información Adicional -->
              ${envio.Estado === 'EN_TRANSITO' || envio.Estado === 'EN_DISTRIBUCION' ? `
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>💡 Consejo:</strong> Ten tu documento de identidad a la mano para recibir el envío.
                </p>
              </div>
              ` : ''}
              
              ${envio.Estado === 'ENTREGADO' ? `
              <div style="background-color: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  <strong>🎉 ¡Gracias por usar Bisonte!</strong> Esperamos que tu experiencia haya sido excelente.
                </p>
              </div>
              ` : ''}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                <strong>Bisonte - Logística Confiable</strong>
              </p>
              <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 13px;">
                ¿Tienes preguntas? Contáctanos:
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                📧 soporte@bisonteapp.com | 📱 +57 300 123 4567
              </p>
              <p style="margin: 16px 0 0 0; color: #d1d5db; font-size: 12px;">
                Este es un correo automático, por favor no responder directamente.
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
}

/**
 * Envía email de notificación de cambio de estado
 */
export async function enviarNotificacionEstado(envio, emailUsuario) {
  try {
    // Validar configuración de Resend
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Email no enviado.');
      return { success: false, error: 'Email service not configured' };
    }

    // Obtener información del estado
    const estadoInfo = ESTADO_INFO[envio.Estado] || {
      emoji: '📦',
      titulo: 'Actualización de Envío',
      descripcion: `Tu envío ha cambiado al estado: ${envio.Estado}`,
      color: '#3B82F6'
    };

    // Generar HTML
    const htmlContent = generarHTMLEmail(envio, estadoInfo);

    // Enviar email
    console.log(`📧 Enviando email de notificación a: ${emailUsuario}`);
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailUsuario,
      subject: `${estadoInfo.emoji} ${estadoInfo.titulo} - Guía #${envio.NumeroGuia}`,
      html: htmlContent,
    });

    if (error) {
      console.error('❌ Error al enviar email:', error);
      return { success: false, error };
    }

    console.log(`✅ Email enviado exitosamente. ID: ${data?.id}`);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error inesperado al enviar email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Versión de texto plano del email (fallback)
 */
export function generarTextoPlanoEmail(envio, estadoInfo) {
  const destinatario = typeof envio.Destinatario === 'string' 
    ? JSON.parse(envio.Destinatario) 
    : envio.Destinatario;
  
  const remitente = typeof envio.Remitente === 'string' 
    ? JSON.parse(envio.Remitente) 
    : envio.Remitente;

  return `
${estadoInfo.emoji} ${estadoInfo.titulo}

${estadoInfo.descripcion}

DETALLES DEL ENVÍO
==================
Número de Guía: ${envio.NumeroGuia}
Estado Actual: ${envio.Estado.replace(/_/g, ' ')}
Origen: ${envio.CiudadOrigen || 'Bogotá'}
Destino: ${envio.CiudadDestino}
Remitente: ${remitente?.Nombre || ''} ${remitente?.Apellido || ''}
Destinatario: ${destinatario?.Nombre || ''} ${destinatario?.Apellido || ''}

Ver detalles completos en: https://www.bisonteapp.com/misenvios

---
Bisonte - Logística Confiable
soporte@bisonteapp.com | +57 300 123 4567
  `;
}

export default { enviarNotificacionEstado, generarHTMLEmail, generarTextoPlanoEmail };
