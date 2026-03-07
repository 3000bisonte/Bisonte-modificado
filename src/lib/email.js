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
 * Envía notificación al equipo PQRS cuando un usuario envía un mensaje de contacto
 * @param {Object} params
 * @param {string} params.nombre - Nombre del cliente
 * @param {string} params.correo - Correo del cliente
 * @param {string} params.celular - Celular del cliente
 * @param {string} params.ciudad - Ciudad del cliente
 * @param {string} params.mensaje - Mensaje del cliente
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendContactNotificationEmail({ nombre, correo, celular, ciudad, mensaje }) {
  const PQRS_EMAIL = 'bisontepqrs@gmail.com'
  
  const result = {
    attempted: false,
    sent: false,
    id: null,
    error: null,
    reason: null,
    transport: null,
    transportsTried: [],
  }

  const resend = getResendClient()
  const smtpTransport = getSmtpTransport()

  const fecha = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const htmlContent = `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8" /><title>Nuevo mensaje de contacto</title></head>
  <body style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px; color:#222">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,0.12)">
      <tr>
        <td style="background:linear-gradient(135deg, #41e0b3 0%, #2bbd8c 100%); padding:24px; text-align:center; color:#ffffff">
          <h1 style="margin:0; font-size:20px; font-weight:700">📩 Nuevo Mensaje de Contacto</h1>
          <p style="margin:8px 0 0 0; font-size:13px; opacity:0.95">Bisonte Logística - PQRS</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <p style="margin:0 0 20px 0; font-size:15px; color:#374151">Se ha recibido un nuevo mensaje desde el formulario de contacto de la app:</p>
          
          <div style="background:#f9fafb; padding:20px; border-radius:8px; border:1px solid #e5e7eb; margin:0 0 24px 0">
            <table style="width:100%; border-collapse:collapse">
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; width:30%">👤 Nombre:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500">${nombre || 'No especificado'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">📧 Correo:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb"><a href="mailto:${correo}" style="color:#2563eb">${correo || 'No especificado'}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">📱 Celular:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb">${celular || 'No especificado'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">🏙️ Ciudad:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb">${ciudad || 'No especificada'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; font-size:14px; color:#6b7280; border-top:1px solid #e5e7eb">📅 Fecha:</td>
                <td style="padding:8px 0; font-size:14px; color:#111827; font-weight:500; border-top:1px solid #e5e7eb">${fecha}</td>
              </tr>
            </table>
          </div>
          
          <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:16px; border-radius:4px; margin:0 0 24px 0">
            <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#1e40af; text-transform:uppercase">Mensaje:</p>
            <p style="margin:0; font-size:15px; color:#1e3a8a; line-height:1.6; white-space:pre-wrap">${mensaje || 'Sin mensaje'}</p>
          </div>
          
          <p style="margin:0; font-size:13px; color:#9ca3af; text-align:center">Puedes responder a este contacto desde el panel de administración de Bisonte App.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb; padding:16px; text-align:center">
          <p style="margin:0; font-size:11px; color:#9ca3af">© ${new Date().getFullYear()} Bisonte Logística - Notificación automática</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const textContent = `📩 NUEVO MENSAJE DE CONTACTO - Bisonte Logística

Nombre: ${nombre || 'No especificado'}
Correo: ${correo || 'No especificado'}
Celular: ${celular || 'No especificado'}
Ciudad: ${ciudad || 'No especificada'}
Fecha: ${fecha}

Mensaje:
${mensaje || 'Sin mensaje'}

---
Puedes responder desde el panel de administración.`

  const transports = []

  if (resend) {
    transports.push({
      type: 'resend',
      send: async () => {
        const { data, error } = await resend.emails.send({
          from: normalizeFromAddress(),
          to: PQRS_EMAIL,
          replyTo: correo || undefined,
          subject: `📩 Nuevo mensaje de contacto - ${nombre || 'Usuario'}`,
          html: htmlContent,
          text: textContent,
        })
        if (error) throw new Error(error.message || String(error))
        return { id: data?.id ?? null }
      },
    })
  }

  if (smtpTransport) {
    transports.push({
      type: 'smtp',
      send: async () => {
        const info = await smtpTransport.sendMail({
          from: normalizeFromAddress(),
          to: PQRS_EMAIL,
          replyTo: correo || undefined,
          subject: `📩 Nuevo mensaje de contacto - ${nombre || 'Usuario'}`,
          html: htmlContent,
          text: textContent,
        })
        return { id: info?.messageId ?? null }
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
    timeZone: 'America/Bogota',
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
  senderDetails,
  recipientDetails,
  packageDetails,
  paymentDetails,
  formPayload,
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

  const escapeHtml = (value) => {
    if (value === null || value === undefined) {
      return ''
    }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const formatOptionalString = (value, fallback = 'Sin datos') => {
    if (value === null || value === undefined) {
      return fallback
    }
    const stringValue = typeof value === 'string' ? value.trim() : String(value)
    return stringValue.length > 0 ? stringValue : fallback
  }

  const formatBoolean = (value) => {
    if (value === true) {return 'Sí'}
    if (value === false) {return 'No'}
    return 'Sin datos'
  }

  const formatDocumentValue = (details) => {
    if (!details || typeof details !== 'object') {
      return 'Sin datos'
    }

    const rawTipo = details.tipoDocumento
      ?? details.TipoDocumento
      ?? details.tipo_documento
      ?? details.Tipo_documento
      ?? details.documentoTipo
      ?? details.tipoDoc
      ?? details.tipo_doc

    const rawNumero = details.numeroDocumento
      ?? details.NumeroDocumento
      ?? details.numero_documento
      ?? details.Numero_documento
      ?? details.documento
      ?? details.Documento
      ?? details.numeroId
      ?? details.numero_id
      ?? details.identificacion
      ?? details.Identificacion

    const parts = []

    if (typeof rawTipo === 'string' && rawTipo.trim().length > 0) {
      parts.push(rawTipo.trim())
    }

    if (typeof rawNumero === 'string' && rawNumero.trim().length > 0) {
      parts.push(rawNumero.trim())
    }

    if (parts.length === 0) {
      return 'Sin datos'
    }

    return parts.join(' ')
  }

  const textValue = (value) => formatOptionalString(value)

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
        timeZone: 'America/Bogota',
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : 'Sin datos'

  const subject = trackingNumber
    ? `Nuevo envío solicitado - Guía #${trackingNumber}`
    : 'Nuevo envío solicitado'

  const weightText = packageDetails?.peso !== undefined && packageDetails?.peso !== null
    ? `${packageDetails.peso} kg`
    : formatNumber(weight, ' kg')

  const declaredValueText = packageDetails?.valorDeclarado !== undefined && packageDetails?.valorDeclarado !== null
    ? formatCurrency(packageDetails.valorDeclarado)
    : formatCurrency(declaredValue)

  const montoTotalText = paymentDetails?.montoTotal !== undefined && paymentDetails?.montoTotal !== null
    ? formatCurrency(paymentDetails.montoTotal)
    : 'Sin datos'

  const costoCotizadoText = paymentDetails?.costoCotizado !== undefined && paymentDetails?.costoCotizado !== null
    ? formatCurrency(paymentDetails.costoCotizado)
    : formatCurrency(totalCost)

  const paymentStatusText = paymentDetails?.pagado !== null && paymentDetails?.pagado !== undefined
    ? formatBoolean(paymentDetails.pagado)
    : 'Sin datos'

  const shipmentTypeText = packageDetails?.tipoEnvio !== undefined && packageDetails?.tipoEnvio !== null
    ? formatOptionalString(packageDetails.tipoEnvio)
    : 'Sin datos'

  const senderDocumentText = formatDocumentValue(senderDetails)
  const recipientDocumentText = formatDocumentValue(recipientDetails)

  const renderDetailsSection = (title, rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return ''
    }

    const hasUsefulData = rows.some((row) => {
      if (!row) {return false}
      const rawValue = row.value
      if (rawValue === null || rawValue === undefined) {return false}
      if (typeof rawValue === 'string') {return rawValue.trim().length > 0}
      return true
    })

    if (!hasUsefulData) {
      return ''
    }

    const rowsHtml = rows.map((row) => {
      if (!row) {return ''}
      const label = escapeHtml(row.label ?? '')
      const valueText = formatOptionalString(row.value)
      const value = escapeHtml(valueText)
      return `<tr>
          <td style="padding:6px 0; color:#64748b; width:45%; vertical-align:top;">${label}</td>
          <td style="padding:6px 0; color:#0f172a; font-weight:500;">${value}</td>
        </tr>`
    }).join('')

    return `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin-bottom:18px;">
        <h3 style="margin:0 0 12px 0; font-size:15px; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px;">${escapeHtml(title)}</h3>
        <table style="width:100%; border-collapse:collapse; font-size:14px;">${rowsHtml}</table>
      </div>`
  }

  const senderSectionHtml = renderDetailsSection('Remitente', [
    { label: 'Nombre', value: senderDetails?.nombre ?? senderName },
    { label: 'Teléfono', value: senderDetails?.telefono ?? senderPhone },
    { label: 'Dirección', value: senderDetails?.direccion ?? origin },
    { label: 'Documento', value: senderDocumentText },
  ])

  const recipientSectionHtml = renderDetailsSection('Destinatario', [
    { label: 'Nombre', value: recipientDetails?.nombre ?? recipientName },
    { label: 'Teléfono', value: recipientDetails?.telefono ?? recipientPhone },
    { label: 'Dirección', value: recipientDetails?.direccion ?? destination },
    { label: 'Correo', value: recipientDetails?.email ?? customerEmail },
    { label: 'Documento', value: recipientDocumentText },
  ])

  const packageSectionHtml = renderDetailsSection('Datos del envío', [
    { label: 'Número de guía', value: packageDetails?.numeroGuia ?? trackingNumber },
    { label: 'Estado', value: packageDetails?.estado },
    { label: 'Origen', value: packageDetails?.origen ?? origin },
    { label: 'Destino', value: packageDetails?.destino ?? destination },
    { label: 'Peso', value: weightText },
    { label: 'Dimensiones', value: packageDetails?.dimensiones },
    { label: 'Valor declarado', value: declaredValueText },
    { label: 'Tipo de envío', value: shipmentTypeText },
    { label: 'Notas', value: packageDetails?.notas ?? notes },
  ])

  const paymentSectionHtml = renderDetailsSection('Pago y cotización', [
    { label: 'Método de pago', value: paymentDetails?.metodo },
    { label: 'Pagado', value: paymentStatusText },
    { label: 'Monto total cobrado', value: montoTotalText },
    { label: 'Costo cotizado', value: costoCotizadoText },
    { label: 'ID de pago', value: paymentDetails?.paymentId ?? paymentId },
  ])

  const formPayloadHtml = formPayload
    ? `<div style="background:#0f172a; border-radius:12px; padding:18px; margin-bottom:18px; color:#e2e8f0;">
        <p style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; color:#38bdf8; letter-spacing:0.5px;">Formulario completo (JSON)</p>
        <pre style="margin:0; white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.6; background:#1f2937; padding:12px; border-radius:8px; color:#e2e8f0;">${escapeHtml(JSON.stringify(formPayload, null, 2))}</pre>
      </div>`
    : ''

  const notesHtml = notes
    ? `<div style="padding:18px; background:#fff7ed; border:1px solid #fbd38d; border-radius:10px; margin-bottom:24px;">
          <p style="margin:0 0 4px 0; font-size:13px; text-transform:uppercase; color:#c05621; letter-spacing:0.4px;">Notas del cliente</p>
          <p style="margin:0; font-size:14px; color:#7b341e; line-height:1.6;">${escapeHtml(formatOptionalString(notes, 'Sin notas'))}</p>
        </div>`
    : ''

  const metadataHtml = Object.keys(metadata || {}).length
    ? `<div style="padding:16px; background:#1e293b; border-radius:10px; margin-bottom:24px; color:#e2e8f0;">
        <p style="margin:0 0 8px 0; font-size:13px; text-transform:uppercase; letter-spacing:0.4px; color:#38bdf8;">Metadata</p>
        <pre style="margin:0; font-size:13px; line-height:1.6; white-space:pre-wrap;">${escapeHtml(JSON.stringify(metadata, null, 2))}</pre>
      </div>`
    : ''

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
                <td style="padding:6px 0; font-weight:600;">${escapeHtml(formatOptionalString(customerName))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Correo cliente:</td>
                <td style="padding:6px 0;">${escapeHtml(formatOptionalString(customerEmail))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Remitente:</td>
                <td style="padding:6px 0;">${escapeHtml(formatOptionalString(senderName || customerName))} (${escapeHtml(formatOptionalString(senderPhone, 'Sin teléfono'))})</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Documento remitente:</td>
                <td style="padding:6px 0;">${escapeHtml(senderDocumentText)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Destinatario:</td>
                <td style="padding:6px 0;">${escapeHtml(formatOptionalString(recipientName))} (${escapeHtml(formatOptionalString(recipientPhone, 'Sin teléfono'))})</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Documento destinatario:</td>
                <td style="padding:6px 0;">${escapeHtml(recipientDocumentText)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Origen → Destino:</td>
                <td style="padding:6px 0;">${escapeHtml(formatOptionalString(origin))} → ${escapeHtml(formatOptionalString(destination))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Fecha solicitud:</td>
                <td style="padding:6px 0;">${escapeHtml(formattedDate)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Costo total:</td>
                <td style="padding:6px 0;">${escapeHtml(formatCurrency(totalCost))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Valor declarado:</td>
                <td style="padding:6px 0;">${escapeHtml(formatCurrency(declaredValue))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Peso (kg):</td>
                <td style="padding:6px 0;">${escapeHtml(weightText)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Tipo de envío:</td>
                <td style="padding:6px 0;">${escapeHtml(shipmentTypeText)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">ID pago:</td>
                <td style="padding:6px 0;">${escapeHtml(formatOptionalString(paymentId, 'No registrado'))}</td>
              </tr>
              <tr>
                <td style="padding:6px 0; color:#64748b;">Número de guía:</td>
                <td style="padding:6px 0; font-weight:600; letter-spacing:0.5px;">${escapeHtml(formatOptionalString(trackingNumber, 'Pendiente'))}</td>
              </tr>
            </table>
          </div>

          ${senderSectionHtml}
          ${recipientSectionHtml}
          ${packageSectionHtml}
          ${paymentSectionHtml}
          ${formPayloadHtml}
          ${notesHtml}
          ${metadataHtml}

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

  const textSections = []

  if (senderSectionHtml) {
    textSections.push([
      'REMÍTENTE',
      `Nombre: ${textValue(senderDetails?.nombre ?? senderName)}`,
      `Teléfono: ${textValue(senderDetails?.telefono ?? senderPhone)}`,
      `Dirección: ${textValue(senderDetails?.direccion ?? origin)}`,
      `Documento: ${textValue(senderDocumentText)}`,
    ].join('\n'))
  }

  if (recipientSectionHtml) {
    textSections.push([
      'DESTINATARIO',
      `Nombre: ${textValue(recipientDetails?.nombre ?? recipientName)}`,
      `Teléfono: ${textValue(recipientDetails?.telefono ?? recipientPhone)}`,
      `Dirección: ${textValue(recipientDetails?.direccion ?? destination)}`,
      `Correo: ${textValue(recipientDetails?.email ?? customerEmail)}`,
      `Documento: ${textValue(recipientDocumentText)}`,
    ].join('\n'))
  }

  if (packageSectionHtml) {
    textSections.push([
      'DATOS DEL ENVÍO',
      `Número de guía: ${textValue(packageDetails?.numeroGuia ?? trackingNumber)}`,
      `Estado: ${textValue(packageDetails?.estado)}`,
      `Origen: ${textValue(packageDetails?.origen ?? origin)}`,
      `Destino: ${textValue(packageDetails?.destino ?? destination)}`,
      `Peso: ${textValue(weightText)}`,
      `Dimensiones: ${textValue(packageDetails?.dimensiones)}`,
      `Valor declarado: ${declaredValueText}`,
      `Tipo de envío: ${textValue(shipmentTypeText)}`,
      `Notas: ${textValue(packageDetails?.notas ?? notes)}`,
    ].join('\n'))
  }

  if (paymentSectionHtml) {
    textSections.push([
      'PAGO Y COTIZACIÓN',
      `Método de pago: ${textValue(paymentDetails?.metodo)}`,
      `Pagado: ${paymentStatusText}`,
      `Monto total cobrado: ${montoTotalText}`,
      `Costo cotizado: ${costoCotizadoText}`,
      `ID de pago: ${textValue(paymentDetails?.paymentId ?? paymentId)}`,
    ].join('\n'))
  }

  if (formPayload) {
    textSections.push([
      'FORMULARIO COMPLETO (JSON)',
      JSON.stringify(formPayload, null, 2),
    ].join('\n'))
  }

  const textSectionsBlock = textSections.length ? `\n\n${textSections.join('\n\n')}` : ''

  const textContent = `NUEVO ENVÍO SOLICITADO

Cliente: ${textValue(customerName)}
Correo cliente: ${textValue(customerEmail)}
Remitente: ${textValue(senderName || customerName)} (${textValue(senderPhone)})
Documento remitente: ${textValue(senderDocumentText)}
Destinatario: ${textValue(recipientName)} (${textValue(recipientPhone)})
Documento destinatario: ${textValue(recipientDocumentText)}
Origen → Destino: ${textValue(origin)} → ${textValue(destination)}
Fecha solicitud: ${formattedDate}
Costo total: ${formatCurrency(totalCost)}
Valor declarado: ${formatCurrency(declaredValue)}
Peso: ${weightText}
Tipo de envío: ${textValue(shipmentTypeText)}
ID pago: ${textValue(paymentId || 'No registrado')}
Número de guía: ${textValue(trackingNumber || 'Pendiente')}

Notas: ${textValue(notes || 'Sin notas')}

Metadata: ${JSON.stringify(metadata || {})}${textSectionsBlock}
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
