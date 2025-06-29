import nodemailer from "nodemailer";

export async function POST(req) {
  const { remitente, destinatario, cotizador, fecha } = await req.json();

  // Configura tu transporte de correo (usa variables de entorno en producción)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // tu correo
      pass: process.env.EMAIL_PASS, // tu contraseña o app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "yesicacausado71@gmail.com", // Cambia por el correo que debe recibir la notificación
    subject: "Nuevo envío realizado",
    text: `
      Se ha realizado un nuevo envío:
      Remitente: ${remitente?.nombre}
      Destinatario: ${destinatario?.nombre}
      Ciudad destino: ${cotizador?.ciudadDestino}
      Fecha: ${fecha}
      Total: $${cotizador?.costoTotal}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}