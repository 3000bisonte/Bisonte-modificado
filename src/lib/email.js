import 'server-only'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

import { env } from './env'

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
  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
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
          <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6">También puedes continuar desde este enlace:</p>
          <p style="text-align:center; margin:24px 0">
            <a href="${resetUrl}" style="display:inline-block; background:#2563eb; color:#ffffff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600">Restablecer contraseña</a>
          </p>
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
          replyTo: '3000bisonte@gmail.com',
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
          replyTo: '3000bisonte@gmail.com',
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
