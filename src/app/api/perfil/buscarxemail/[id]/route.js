import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const correo = decodeURIComponent(params.id);

  const perfilSimulado = {
    id: 101,
    nombre: "Perfil Simulado",
    correo,
    ciudad: "Bogotá",
    celular: "3000000000",
    creadoEn: new Date().toISOString()
  };

  return NextResponse.json({ success: true, perfil: perfilSimulado });
}
