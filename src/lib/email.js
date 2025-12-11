import 'server-only'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

import { env } from './env'

const ADMIN_EMAIL = env.ADMIN_NOTIFICATION_EMAIL || '3000bisonte@gmail.com'

let cachedResend = null
let cachedSmtpTransport = null

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    return null
  }

  if (!cachedResend) {
    cachedResend = new Resend(env.RESEND_API_KEY)
  }

  return cachedResend
}

function ensureSiteUrl() {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bisonteapp.com'
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function getSmtpTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null
  }

  if (!cachedSmtpTransport) {
    cachedSmtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  }

  return cachedSmtpTransport
}

function normalizeFromAddress() {
  if (!env.EMAIL_FROM) {
    return 'logistica@notificaciones.bisonteapp.com'
  }

  return env.EMAIL_FROM.trim()
}

function formatHtmlEmail({ name, code, resetUrl, expiresMinutes }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Recuperación de contraseña</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px; color:#222">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,0.12)">
      <tr>
        <td style="background:#111827; padding:24px; text-align:center; color:#ffffff">
          <h1 style="margin:0; font-size:20px; letter-spacing:0.4px">Bisonte Logística</h1>
          <p style="margin:8px 0 0 0; font-size:13px; opacity:0.9">Solicitud de recuperación de contraseña</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 16px 0; font-size:15px">Hola ${name || 'cliente'},</p>
          <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación:</p>
          <div style="margin:24px 0; text-align:center">
            <span style="display:inline-block; font-size:32px; letter-spacing:12px; font-weight:700; background:#111827; color:#ffffff; padding:16px 32px; border-radius:12px">${code}</span>
          </div>
          <p style="margin:0 0 16px 0; font-size:14px; color:#6b7280">El código vence en ${expiresMinutes ?? 30} minutos. Si no solicitaste este cambio, ignora este correo.</p>
          <p style="margin:24px 0 0 0; font-size:13px; color:#9ca3af">Equipo de soporte de Bisonte Logística</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function formatTextEmail({ name, code, resetUrl, expiresMinutes }) {
  return `Hola ${name || 'cliente'},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Código de verificación: ${code}
Enlace directo: ${resetUrl}

Este código vencerá en ${expiresMinutes ?? 30} minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.

Equipo de soporte
Bisonte Logística`
}

export async function sendPasswordRecoveryEmail({ to, code, token, expiresAt, name }) {
  const result = {
    attempted: false,
    sent: false,
    id: null,
    previewUrl: null,
    error: null,
    reason: null,
    transport: null,
    transportsTried: [],
  }

  const baseUrl = ensureSiteUrl()
  const normalizedCode = String(code).padStart(6, '0')
  const expiresDate = expiresAt ? new Date(expiresAt) : null
  const expiresMinutes = expiresDate ? Math.max(1, Math.round((expiresDate.getTime() - Date.now()) / 60000)) : undefined
  const resetUrl = `${baseUrl}/recuperar/validar-token?email=${encodeURIComponent(to)}&code=${encodeURIComponent(normalizedCode)}&token=${encodeURIComponent(token)}`

  const resend = getResendClient()
  const smtpTransport = getSmtpTransport()

  const transports = []

  if (resend) {
    transports.push({
      type: 'resend',
      send: async () => {
        const { data, error } = await resend.emails.send({
          from: normalizeFromAddress(),
          to,
          subject: 'Código de recuperación de contraseña',
          html: formatHtmlEmail({ name, code: normalizedCode, resetUrl, expiresMinutes }),
          text: formatTextEmail({ name, code: normalizedCode, resetUrl, expiresMinutes }),
        })

        if (error) {
          throw new Error(error.message || String(error))
        }

        return {
          id: data?.id ?? null,
          previewUrl: data?.previewUrl ?? null,
        }
      },
    })
  }

  if (smtpTransport) {
    transports.push({
      type: 'smtp',
      send: async () => {
        const info = await smtpTransport.sendMail({
          from: normalizeFromAddress(),
          to,
          subject: 'Código de recuperación de contraseña',
          html: formatHtmlEmail({ name, code: normalizedCode, resetUrl, expiresMinutes }),
          text: formatTextEmail({ name, code: normalizedCode, resetUrl, expiresMinutes }),
        })

        return {
          id: info?.messageId ?? null,
          previewUrl: info?.previewUrl ?? null,
        }
      },
    })
  }

  if (transports.length === 0) {
    result.reason = 'no_email_transport_configured'
    return result
  }

  for (const transport of transports) {
    try {
      result.transportsTried.push(transport.type)
      result.attempted = true

      const response = await transport.send()
      result.sent = true
      result.transport = transport.type
      result.id = response.id
      result.previewUrl = response.previewUrl ?? null
      result.reason = null
      result.error = null
      return result
    } catch (err) {
      result.error = err?.message || String(err)
      result.reason = `${transport.type}_error`
    }
  }

  return result
}

/**
 * Envía un email de respuesta del admin al cliente que envió un mensaje de contacto
 * @param {Object} params
 * @param {string} params.to - Email del cliente
 * @param {string} params.clientName - Nombre del cliente
 * @param {string} params.originalMessage - Mensaje original del cliente
 * @param {string} params.response - Respuesta del admin
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendContactResponseEmail({ to, clientName, originalMessage, response }) {
  const result = {
    attempted: false,
    sent: false,
    id: null,
    previewUrl: null,
    error: null,
    reason: null,
    transport: null,
    transportsTried: [],
  }

  const resend = getResendClient()
  const smtpTransport = getSmtpTransport()

  // Formatear HTML del email
  const htmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Respuesta a tu mensaje - Bisonte Logística</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px; color:#222">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,0.12)">
      <tr>
        <td style="background:linear-gradient(135deg, #41e0b3 0%, #2bbd8c 100%); padding:32px; text-align:center; color:#ffffff">
          <h1 style="margin:0; font-size:24px; letter-spacing:0.4px; font-weight:700">Bisonte Logística</h1>
          <p style="margin:8px 0 0 0; font-size:14px; opacity:0.95">Respuesta a tu consulta</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 16px 0; font-size:16px; font-weight:600; color:#111827">Hola ${clientName},</p>
          <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#374151">Gracias por contactarnos. Hemos recibido tu mensaje y queremos responder a tu consulta:</p>
          
          <!-- Mensaje Original -->
          <div style="background:#f9fafb; border-left:4px solid #d1d5db; padding:16px; margin:0 0 24px 0; border-radius:4px">
            <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px">Tu mensaje:</p>
            <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6; font-style:italic">"${originalMessage}"</p>
          </div>
          
          <!-- Respuesta del Admin -->
          <div style="background:#ecfdf5; border-left:4px solid #10b981; padding:16px; margin:0 0 24px 0; border-radius:4px">
            <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#059669; text-transform:uppercase; letter-spacing:0.5px">Nuestra respuesta:</p>
            <p style="margin:0; font-size:15px; color:#111827; line-height:1.7">${response}</p>
          </div>
          
          <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#6b7280">Si tienes alguna otra pregunta, no dudes en responder a este correo o contactarnos nuevamente.</p>
          
          <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0" />
          
          <p style="margin:0 0 8px 0; font-size:14px; color:#111827; font-weight:600">¿Necesitas ayuda adicional?</p>
          <p style="margin:0; font-size:14px; color:#6b7280">📧 Email: <a href="mailto:3000bisonte@gmail.com" style="color:#2563eb">3000bisonte@gmail.com</a></p>
          
          <p style="margin:32px 0 0 0; font-size:13px; color:#9ca3af; text-align:center">Equipo de atención al cliente - Bisonte Logística</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb; padding:24px; text-align:center">
          <p style="margin:0; font-size:12px; color:#9ca3af">Este correo fue enviado porque contactaste a Bisonte Logística.<br/>© ${new Date().getFullYear()} Bisonte Logística. Todos los derechos reservados.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  // Texto plano alternativo
  const textContent = `Hola ${clientName},

Gracias por contactarnos. Hemos recibido tu mensaje y queremos responder a tu consulta:

TU MENSAJE:
"${originalMessage}"

NUESTRA RESPUESTA:
${response}

Si tienes alguna otra pregunta, no dudes en responder a este correo o contactarnos nuevamente.

¿Necesitas ayuda adicional?
Email: 3000bisonte@gmail.com

Equipo de atención al cliente
Bisonte Logística
© ${new Date().getFullYear()} Bisonte Logística. Todos los derechos reservados.`

  const transports = []

  if (resend) {
    transports.push({
      type: 'resend',
      send: async () => {
        const { data, error } = await resend.emails.send({
          from: normalizeFromAddress(),
          to,
          replyTo: ADMIN_EMAIL,
          subject: `Re: Tu mensaje a Bisonte Logística`,
          html: htmlContent,
          text: textContent,
        })

        if (error) {
          throw new Error(error.message || String(error))
        }

        return {
          id: data?.id ?? null,
          previewUrl: data?.previewUrl ?? null,
        }
      },
    })
  }

  if (smtpTransport) {
    transports.push({
      type: 'smtp',
      send: async () => {
        const info = await smtpTransport.sendMail({
          from: normalizeFromAddress(),
          to,
          replyTo: ADMIN_EMAIL,
          subject: `Re: Tu mensaje a Bisonte Logística`,
          html: htmlContent,
          text: textContent,
        })

        return {
          id: info?.messageId ?? null,
          previewUrl: info?.previewUrl ?? null,
        }
      },
    })
  }
  if (transports.length === 0) {
    result.reason = 'no_email_transport_configured'
    return result
  }

  for (const transport of transports) {
    try {
      result.transportsTried.push(transport.type)
      result.attempted = true

      const emailResponse = await transport.send()
      result.sent = true
      result.transport = transport.type
      result.id = emailResponse.id
      result.previewUrl = emailResponse.previewUrl ?? null
      result.reason = null
      result.error = null
      return result
    } catch (err) {
      result.error = err?.message || String(err)
      result.reason = `${transport.type}_error`
    }
  }

  return result
}

/**
 * Envía un email de confirmación de pedido al cliente
 * @param {Object} params
 * @param {string} params.to - Email del cliente
 * @param {string} params.customerName - Nombre del cliente
 * @param {string} params.trackingNumber - Número de guía
 * @param {string} params.origin - Ciudad de origen
 * @param {string} params.destination - Ciudad de destino
 * @param {string} params.recipientName - Nombre del destinatario
 * @param {number} params.totalCost - Costo total del envío
 * @param {string} params.orderDate - Fecha del pedido
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendOrderConfirmationEmail({ 
  to, 
  customerName, 
  trackingNumber, 
  origin, 
  destination, 
  recipientName, 
  totalCost, 
  orderDate 
}) {
  const result = {
    attempted: false,
    sent: false,
    id: null,
    previewUrl: null,
    error: null,
    reason: null,
    transport: null,
    transportsTried: [],
  }

  const resend = getResendClient()
  const smtpTransport = getSmtpTransport()

  const formattedCost = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(totalCost)

  const formattedDate = new Date(orderDate).toLocaleString('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  // Formatear HTML del email
  const htmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Confirmación de pedido - Bisonte Logística</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px; color:#222">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,0.12)">
      <tr>
        <td style="background:linear-gradient(135deg, #41e0b3 0%, #2bbd8c 100%); padding:32px; text-align:center; color:#ffffff">
          <h1 style="margin:0; font-size:24px; letter-spacing:0.4px; font-weight:700">✓ Pedido Confirmado</h1>
          <p style="margin:8px 0 0 0; font-size:14px; opacity:0.95">Tu envío está en proceso</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 16px 0; font-size:16px; font-weight:600; color:#111827">Hola ${customerName},</p>
          <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#374151">¡Gracias por confiar en Bisonte Logística! Tu pedido ha sido recibido exitosamente y está en proceso.</p>
          
          <!-- Número de Guía Destacado -->
          <div style="background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:2px solid #10b981; padding:24px; margin:0 0 24px 0; border-radius:8px; text-align:center">
            <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#059669; text-transform:uppercase; letter-spacing:0.5px">Número de Guía</p>
            <p style="margin:0; font-size:28px; font-weight:700; color:#047857; letter-spacing:1px; font-family:'Courier New', monospace">${trackingNumber}</p>
            <p style="margin:12px 0 0 0; font-size:12px; color:#065f46">Guarda este número para rastrear tu envío</p>
          </div>
          
          <!-- Detalles del Envío -->
          <div style="background:#f9fafb; padding:20px; margin:0 0 24px 0; border-radius:8px; border:1px solid #e5e7eb">
            <h2 style="margin:0 0 16px 0; font-size:16px; color:#111827; font-weight:600">📦 Detalles del envío</h2>
            
            <table style="width:100%; border-collapse:collapse">
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; width:40%">Origen:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500">${origin}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">Destino:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb">${destination}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">Destinatario:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb">${recipientName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">Fecha de solicitud:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb">${formattedDate}</td>
              </tr>
              <tr style="background:#ecfdf5">
                <td style="padding:12px 8px; font-size:15px; color:#047857; font-weight:600; border-top:2px solid #10b981; border-radius:4px">Costo Total:</td>
                <td style="padding:12px 8px; font-size:16px; color:#047857; font-weight:700; border-top:2px solid #10b981; border-radius:4px">${formattedCost}</td>
              </tr>
            </table>
          </div>
          
          <!-- Próximos Pasos -->
          <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:16px; margin:0 0 24px 0; border-radius:4px">
            <p style="margin:0 0 12px 0; font-size:14px; font-weight:600; color:#1e40af">📋 Próximos pasos:</p>
            <ul style="margin:0; padding-left:20px; font-size:14px; color:#1e3a8a; line-height:1.8">
              <li>Tu pedido será procesado en las próximas horas</li>
              <li>Recibirás actualizaciones del estado de tu envío</li>
              <li>Puedes rastrear tu paquete con el número de guía</li>
            </ul>
          </div>
          
          <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0" />
          
          <p style="margin:0 0 8px 0; font-size:14px; color:#111827; font-weight:600">¿Necesitas ayuda?</p>
          <p style="margin:0 0 4px 0; font-size:14px; color:#6b7280">📧 Email: <a href="mailto:3000bisonte@gmail.com" style="color:#2563eb; text-decoration:none">3000bisonte@gmail.com</a></p>
          <p style="margin:0; font-size:14px; color:#6b7280">🌐 Web: <a href="https://www.bisonteapp.com" style="color:#2563eb; text-decoration:none">www.bisonteapp.com</a></p>
          
          <p style="margin:32px 0 0 0; font-size:13px; color:#9ca3af; text-align:center">Gracias por elegir Bisonte Logística - Tu socio de confianza en envíos</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb; padding:24px; text-align:center">
          <p style="margin:0; font-size:12px; color:#9ca3af">Este correo se envió como confirmación de tu pedido.<br/>© ${new Date().getFullYear()} Bisonte Logística. Todos los derechos reservados.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  // Texto plano alternativo
  const textContent = `✓ PEDIDO CONFIRMADO - Bisonte Logística

Hola ${customerName},

¡Gracias por confiar en Bisonte Logística! Tu pedido ha sido recibido exitosamente y está en proceso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NÚMERO DE GUÍA: ${trackingNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Guarda este número para rastrear tu envío.

DETALLES DEL ENVÍO:
• Origen: ${origin}
• Destino: ${destination}
• Destinatario: ${recipientName}
• Fecha de solicitud: ${formattedDate}
• Costo Total: ${formattedCost}

PRÓXIMOS PASOS:
• Tu pedido será procesado en las próximas horas
• Recibirás actualizaciones del estado de tu envío
• Puedes rastrear tu paquete con el número de guía

¿NECESITAS AYUDA?
📧 Email: 3000bisonte@gmail.com
🌐 Web: www.bisonteapp.com

Gracias por elegir Bisonte Logística - Tu socio de confianza en envíos

© ${new Date().getFullYear()} Bisonte Logística. Todos los derechos reservados.`

  const transports = []

  if (resend) {
    transports.push({
      type: 'resend',
      send: async () => {
        const { data, error } = await resend.emails.send({
          from: normalizeFromAddress(),
          to,
          replyTo: ADMIN_EMAIL,
          subject: `✓ Pedido confirmado - Guía #${trackingNumber}`,
          html: htmlContent,
          text: textContent,
        })

        if (error) {
          throw new Error(error.message || String(error))
        }

        return {
          id: data?.id ?? null,
          previewUrl: data?.previewUrl ?? null,
        }
      },
    })
  }

  if (smtpTransport) {
    transports.push({
      type: 'smtp',
      send: async () => {
        const info = await smtpTransport.sendMail({
          from: normalizeFromAddress(),
          to,
          replyTo: ADMIN_EMAIL,
          subject: `✓ Pedido confirmado - Guía #${trackingNumber}`,
          html: htmlContent,
          text: textContent,
        })

        return {
          id: info?.messageId ?? null,
          previewUrl: info?.previewUrl ?? null,
        }
      },
    })
  }

  if (transports.length === 0) {
    result.reason = 'no_email_transport_configured'
    return result
  }

  for (const transport of transports) {
    try {
      result.transportsTried.push(transport.type)
      result.attempted = true

      const emailResponse = await transport.send()
      result.sent = true
      result.transport = transport.type
      result.id = emailResponse.id
      result.previewUrl = emailResponse.previewUrl ?? null
      result.reason = null
      result.error = null
      return result
    } catch (err) {
      result.error = err?.message || String(err)
      result.reason = `${transport.type}_error`
    }
  }

  return result
}

export async function sendAdminShipmentNotificationEmail({
  to = ADMIN_EMAIL,
  customerName,
  customerEmail,
  trackingNumber,
  origin,
  destination,
  recipientName,
  recipientPhone,
  senderName,
  senderPhone,
  totalCost,
  declaredValue,
  weight,
  orderDate,
  paymentId,
  notes,
  metadata = {},
}) {
  const result = {
    attempted: false,
    sent: false,
    id: null,
    previewUrl: null,
    error: null,
    reason: null,
    transport: null,
    transportsTried: [],
    recipients: [],
  }

  const resend = getResendClient()
  const smtpTransport = getSmtpTransport()

  const normalizedTo = to || ADMIN_EMAIL
  const configuredAdminEmails = Array.isArray(env.ADMIN_EMAILS) ? env.ADMIN_EMAILS : []
  const adminRecipients = Array.from(
    new Set(
      [normalizedTo, ADMIN_EMAIL, ...configuredAdminEmails]
        .map((email) => (typeof email === 'string' ? email.trim() : ''))
        .filter((email) => email.length > 0)
    )
  )
  if (adminRecipients.length === 0) {
    adminRecipients.push(ADMIN_EMAIL)
  }
  result.recipients = adminRecipients
  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  })

  const formatCurrency = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return currencyFormatter.format(value)
    }
    return 'Sin datos'
  }

  const formatNumber = (value, suffix = '') => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${value}${suffix}`
    }
    return 'Sin datos'
  }

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleString('es-CO', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : 'Sin datos'

  const subject = trackingNumber
    ? `Nuevo envío solicitado - Guía #${trackingNumber}`
    : 'Nuevo envío solicitado'

  const htmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Nuevo envío solicitado</title>
  </head>
  <body style="font-family: Arial, sans-serif; background:#0f172a; padding:24px; color:#111827;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.2)">
      <tr>
        <td style="background:linear-gradient(135deg, #0f172a 0%, #1f2937 50%, #111827 100%); padding:28px; color:#41e0b3; text-align:center;">
          <h1 style="margin:0; font-size:24px; letter-spacing:0.6px; text-transform:uppercase;">Nuevo envío solicitado</h1>
          <p style="margin:8px 0 0 0; font-size:13px; color:#e2e8f0;">Se registró un nuevo pedido en la plataforma</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px 32px;">
          <p style="margin:0 0 16px 0; font-size:15px; color:#1f2937; line-height:1.6;">Hola equipo,</p>
          <p style="margin:0 0 24px 0; font-size:14px; color:#4b5563; line-height:1.6;">Se ha generado un nuevo envío en Bisonte Logística. A continuación, encontrarás los detalles principales para coordinar la recolección y seguimiento.</p>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:24px;">
            <h2 style="margin:0 0 16px 0; font-size:16px; color:#0f172a;">Resumen</h2>
            <table style="width:100%; border-collapse:collapse; font-size:14px; color:#1f2937;">
              <tr>
                <td style="padding:6px 0; width:45%; color:#64748b;">Cliente:</td>
                <td style="padding:6px 0; font-weight:600;">${customerName || 'Sin datos'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Correo cliente:</td>
                <td style="padding:6px 0;">${customerEmail || 'Sin datos'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Remitente:</td>
                <td style="padding:6px 0;">${senderName || customerName || 'Sin datos'} (${senderPhone || 'Sin teléfono'})</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Destinatario:</td>
                <td style="padding:6px 0;">${recipientName || 'Sin datos'} (${recipientPhone || 'Sin teléfono'})</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Origen → Destino:</td>
                <td style="padding:6px 0;">${origin || 'Sin datos'} → ${destination || 'Sin datos'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Fecha solicitud:</td>
                <td style="padding:6px 0;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Costo total:</td>
                <td style="padding:6px 0;">${formatCurrency(totalCost)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Valor declarado:</td>
                <td style="padding:6px 0;">${formatCurrency(declaredValue)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Peso (kg):</td>
                <td style="padding:6px 0;">${formatNumber(weight, ' kg')}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">ID pago:</td>
                <td style="padding:6px 0;">${paymentId || 'No registrado'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Número de guía:</td>
                <td style="padding:6px 0; font-weight:600; letter-spacing:0.5px;">${trackingNumber || 'Pendiente'}</td>
              </tr>
            </table>
          </div>

          ${notes ? `<div style="padding:18px; background:#fff7ed; border:1px solid #fbd38d; border-radius:10px; margin-bottom:24px;">
              <p style="margin:0 0 4px 0; font-size:13px; text-transform:uppercase; color:#c05621; letter-spacing:0.4px;">Notas del cliente</p>
              <p style="margin:0; font-size:14px; color:#7b341e; line-height:1.6;">${notes}</p>
            </div>` : ''}

          ${Object.keys(metadata || {}).length ? `<div style="padding:16px; background:#1e293b; border-radius:10px; margin-bottom:24px; color:#e2e8f0;">
              <p style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; letter-spacing:0.4px; color:#38bdf8;">Metadata</p>
              <pre style="margin:0; font-size:13px; line-height:1.6; white-space:pre-wrap;">${JSON.stringify(metadata, null, 2)}</pre>
            </div>` : ''}

          <p style="margin:0; font-size:13px; color:#475569;">Responde a este correo para coordinar la recolección o contacta al cliente directamente.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc; padding:20px; text-align:center; color:#475569; font-size:12px;">
          <p style="margin:0;">Este mensaje se envió automáticamente desde Bisonte Logística.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const textContent = `NUEVO ENVÍO SOLICITADO

Cliente: ${customerName || 'Sin datos'}
Correo cliente: ${customerEmail || 'Sin datos'}
Remitente: ${senderName || customerName || 'Sin datos'} (${senderPhone || 'Sin teléfono'})
Destinatario: ${recipientName || 'Sin datos'} (${recipientPhone || 'Sin teléfono'})
Origen → Destino: ${origin || 'Sin datos'} → ${destination || 'Sin datos'}
Fecha solicitud: ${formattedDate}
Costo total: ${formatCurrency(totalCost)}
Valor declarado: ${formatCurrency(declaredValue)}
Peso: ${formatNumber(weight, ' kg')}
ID pago: ${paymentId || 'No registrado'}
Número de guía: ${trackingNumber || 'Pendiente'}

Notas: ${notes || 'Sin notas'}

Metadata: ${JSON.stringify(metadata || {})}
`

  const transports = []

  if (resend) {
    transports.push({
      type: 'resend',
      send: async () => {
        const { data, error } = await resend.emails.send({
          from: normalizeFromAddress(),
          to: adminRecipients,
          replyTo: customerEmail || ADMIN_EMAIL,
          subject,
          html: htmlContent,
          text: textContent,
        })

        if (error) {
          throw new Error(error.message || String(error))
        }

        return {
          id: data?.id ?? null,
          previewUrl: data?.previewUrl ?? null,
        }
      },
    })
  }

  if (smtpTransport) {
    transports.push({
      type: 'smtp',
      send: async () => {
        const info = await smtpTransport.sendMail({
          from: normalizeFromAddress(),
          to: adminRecipients,
          replyTo: customerEmail || ADMIN_EMAIL,
          subject,
          html: htmlContent,
          text: textContent,
        })

        return {
          id: info?.messageId ?? null,
          previewUrl: info?.previewUrl ?? null,
        }
      },
    })
  }

  if (transports.length === 0) {
    result.reason = 'no_email_transport_configured'
    return result
  }

  for (const transport of transports) {
    try {
      result.transportsTried.push(transport.type)
      result.attempted = true

      const emailResponse = await transport.send()
      result.sent = true
      result.transport = transport.type
      result.id = emailResponse.id
      result.previewUrl = emailResponse.previewUrl ?? null
      result.reason = null
      result.error = null
      return result
    } catch (err) {
      result.error = err?.message || String(err)
      result.reason = `${transport.type}_error`
    }
  }

  return result
}
