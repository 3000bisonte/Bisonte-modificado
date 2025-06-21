import prisma from "@/libs/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const destinatarioId = Number(params.id);

  // Validar que el ID sea un número válido
  if (isNaN(destinatarioId)) {
    return NextResponse.json(
      { error: "El ID proporcionado no es válido." },
      { status: 400 }
    );
  }

  const destinatario = await prisma.destinatario.findUnique({
    where: {
      id: destinatarioId,
    },
  });

  console.log("destinatario encontrado:", destinatario);

  return NextResponse.json(destinatario);
}
