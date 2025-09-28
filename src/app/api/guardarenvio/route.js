import { NextResponse } from "next/server";
import { compose, handle, withErrorBoundary, withValidation, withRateLimit } from "@/lib/http";
import { guardarEnvioSchema } from "@/schemas/guardarenvio";

export const dynamic = 'force-dynamic';

export async function GET() {
  // Simple status endpoint for this route
  return NextResponse.json({
    success: true,
    message: "Guardar envío endpoint disponible",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
}

export const POST = compose(withRateLimit({ limit: 10, windowSec: 60 }), withValidation(guardarEnvioSchema), handle(), withErrorBoundary())(async (_req, { body }) => {
  const { remitente, destinatario, detalles = {} } = body;
  const envio = {
    id: Date.now(),
    numeroGuia: `GUIA-${Math.floor(Math.random() * 1e6)}`,
    remitente: { ...remitente },
    destinatario: { ...destinatario },
    detalles: {
      descripcion: detalles.descripcion || "",
      peso: detalles.peso || "",
      valor: detalles.valor ?? 0,
    },
    createdAt: new Date().toISOString(),
  };
  return NextResponse.json({ success: true, message: "Envío guardado exitosamente (simulado)", envio }, { status: 201 });
});
