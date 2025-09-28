import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const correo = searchParams.get("correo");

  const perfilesSimulados = [
    {
      id: 1,
      nombre: "Perfil QA",
      correo: "qa.perfil@bisonte.test",
      ciudad: "Bogotá",
      celular: "3111111111",
      creadoEn: new Date().toISOString()
    }
  ];

  const resultado = correo
    ? perfilesSimulados.filter((perfil) => perfil.correo.toLowerCase() === correo.toLowerCase())
    : perfilesSimulados;

  return NextResponse.json({ success: true, data: resultado, total: resultado.length });
}
