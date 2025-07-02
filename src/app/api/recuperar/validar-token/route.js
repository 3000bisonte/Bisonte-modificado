import { NextResponse } from "next/server";
import { Client } from "pg";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { email, token, newPassword } = await req.json();

  if (!email || !token || !newPassword) {
    return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
  }

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ ok: false, error: "Correo electrónico inválido" }, { status: 400 });
  }

  // Validación de token (6 dígitos)
  if (!/^\d{6}$/.test(token)) {
    return NextResponse.json({ ok: false, error: "El código debe tener 6 dígitos" }, { status: 400 });
  }

  // Validación de contraseña segura
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return NextResponse.json({
      ok: false,
      error: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial."
    }, { status: 400 });
  }

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
    const res = await client.query(
      "SELECT reset_token, reset_token_expires FROM usuarios WHERE email = $1",
      [email]
    );

    if (res.rows.length === 0) {
      await client.end();
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 400 });
    }

    if (
      res.rows[0].reset_token !== token ||
      !res.rows[0].reset_token_expires ||
      new Date(res.rows[0].reset_token_expires) < new Date()
    ) {
      await client.end();
      return NextResponse.json({ ok: false, error: "Token inválido o expirado" }, { status: 400 });
    }

    // Hashea la nueva contraseña
    const hash = await bcrypt.hash(newPassword, 10);

    // Actualiza la contraseña y elimina el token
    await client.query(
      "UPDATE usuarios SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE email = $2",
      [hash, email]
    );

    await client.end();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Error de conexión" }, { status: 500 });
  }
}