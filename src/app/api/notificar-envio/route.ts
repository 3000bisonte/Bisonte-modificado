import { NextResponse, type NextRequest } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Notificación endpoint disponible",
      status: "operational",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error en GET /notificar-envio:", error);
    return NextResponse.json({
      success: false,
      error: "Error al obtener notificaciones",
      details: error?.message ?? String(error)
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { remitente, destinatario, cotizador, fecha, envioId, mensaje } = await req.json();

    // Simulate email sending for testing purposes
    console.log("Notification request:", {
      remitente,
      destinatario,
      cotizador,
      fecha,
      envioId,
      mensaje
    });

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
  } catch (error: any) {
    console.error("Error al enviar notificación:", error);
    return NextResponse.json({
      success: false,
      error: "Error al enviar notificación",
      details: error?.message ?? String(error)
    }, { status: 500 });
  }
}
