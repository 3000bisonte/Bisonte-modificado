import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
  const destinatarioId = Number(params.id);

  if (Number.isNaN(destinatarioId)) {
    return NextResponse.json(
      { success: false, error: "El ID proporcionado no es válido." },
      { status: 400 }
    );
  }

  const destinatarioSimulado = {
    id: destinatarioId,
    nombre: "Destinatario Simulado",
    ciudad: "Medellín",
    telefono: "3010000000",
    direccion: "Calle 123 #45-67",
    documento: "0000000000",
    email: `destinatario.${destinatarioId}@bisonte.test`,
    actualizadoEn: new Date().toISOString()
  };

  return NextResponse.json({ success: true, destinatario: destinatarioSimulado });
}
