import { NextResponse } from "next/server";
import { Client } from "pg";
import bcrypt from "bcryptjs";

// Permite registro aunque algunos campos estén vacíos (excepto email y password)
export async function POST(req) {
  const { nombre, celular, ciudad, email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
  }

  // Conexión a PostgreSQL (ajusta los datos según tu Neon)
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

    // Verifica si el usuario ya existe
    const res = await client.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (res.rows.length > 0) {
      await client.end();
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    // Encripta la contraseña
    const hash = await bcrypt.hash(password, 10);

    // Inserta el usuario, dejando campos vacíos si no se envían
    await client.query(
      `INSERT INTO usuarios (nombre, celular, ciudad, email, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nombre || null,
        celular || null,
        ciudad || null,
        email,
        hash,
      ]
    );
    await client.end();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error de conexión con la base de datos", detalle: error.message }, { status: 500 });
  }
}