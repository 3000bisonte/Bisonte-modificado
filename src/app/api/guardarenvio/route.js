import { NextResponse } from "next/server";
import prisma from "@/libs/prisma";
// export async function GET() {
//   const remitentes = await prisma.remitente.findMany();
//   console.log(remitentes);
//   return NextResponse.json("obteniendo remitente");
// }
export async function POST(request) {
  const { numeroGuia, paymentId, origen, destino, nombreCompleto, DestinatarioId, perfilId } =
    await request.json();
  //console.log(data);
  const newRemitente = await prisma.historialEnvio.create({
    data: {
      NumeroGuia: numeroGuia,
      paymentId: String(paymentId),
      Origen: origen,
      Destino: destino,
      Destinatario: nombreCompleto,
      Estado: "RECOLECCION_PENDIENTE",
      FechaSolicitud: new Date(),
      DestinatarioId,
      PerfilId: perfilId,
    },
  });
  return NextResponse.json(newRemitente);
}
