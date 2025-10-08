import { NextResponse, type NextRequest } from "next/server";

interface NotificationData {
  remitente?: { email?: string };
  destinatario?: { email?: string };
  cotizador?: unknown;
  fecha?: string;
  envioId?: string | number;
  mensaje?: string;
}

export function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Notificación endpoint disponible",
      status: "operational",
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener notificaciones",
      details: errorMessage
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as NotificationData;
    const { destinatario, envioId } = data;

    return NextResponse.json({
      success: true,
      message: "Notificación enviada exitosamente (simulado)",
      data: {
        to: destinatario?.email || '3000bisonte@gmail.com',
        subject: 'Nuevo envío realizado',
        envioId: envioId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Error al enviar notificación",
      details: errorMessage
    }, { status: 500 });
  }
}
