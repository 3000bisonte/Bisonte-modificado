import { NextResponse } from "next/server";
import { Client } from "pg";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ usuarioExiste: false }, { status: 400 });
  }

  // Conexión a PostgreSQL (igual que en tu registro)
  const client = new Client({
    host: "ep-twilight-bird-a81mv90h-pooler.eastus2.azure.neon.tech",
    user: "neondb_owner",
    password: "npg_J8aQD0kGEOmj",
    database: "neondb",
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, nombre FROM usuarios WHERE email = $1", [email]);

    if (res.rows.length > 0) {
      // Genera un token seguro y fecha de expiración (ej: 10 minutos)
      const token = crypto.randomInt(100000, 999999).toString(); // Token de 6 dígitos
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Guarda el token y expiración en la base de datos
      await client.query(
        "UPDATE usuarios SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
        [token, expires, email]
      );

      // Envía el token por correo
      const resend = new Resend(process.env.RESEND_API_KEY);
      console.log("Enviando correo de recuperación a:", email);
      console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "OK" : "NO KEY");
      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: '3000bisonte@gmail.com',
          subject: 'Código de recuperación de contraseña',
          text: `
Hola ${res.rows[0].nombre},

Tu código de recuperación de contraseña es: ${token}

Este código es válido por 10 minutos. Si no solicitaste este código, ignora este mensaje.

¡Gracias!
          `,
        });
        console.log("Correo enviado correctamente a:", email);
      } catch (sendError) {
        console.error("Error al enviar el correo:", sendError);
      }

      await client.end();
      return NextResponse.json({ usuarioExiste: true }, { status: 200 });
    } else {
      await client.end();
      return NextResponse.json({ usuarioExiste: false }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ usuarioExiste: false, error: "Error de conexión" }, { status: 500 });
  }
}