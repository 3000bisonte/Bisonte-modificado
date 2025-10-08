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
