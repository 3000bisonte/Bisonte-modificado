import { NextResponse, type NextRequest } from "next/server";

import { sendAdminShipmentNotificationEmail } from "@/lib/email";

interface NotificationPersona {
  email?: string;
  nombre?: string;
  Nombre?: string;
  telefono?: string;
  Telefono?: string;
  correo?: string;
  Correo?: string;
  [key: string]: unknown;
}

interface NotificationCotizador {
  origen?: string;
  destino?: string;
  costoTotal?: number | string;
  valorDeclarado?: number | string;
  valor_declarado?: number | string;
  valor_total?: number | string;
  pesoTotal?: number | string;
  peso?: number | string;
  notas?: string;
  observaciones?: string;
  [key: string]: unknown;
}

interface NotificationData {
  remitente?: NotificationPersona;
  destinatario?: NotificationPersona;
  cotizador?: NotificationCotizador;
  fecha?: string;
  envioId?: string | number;
  mensaje?: string;
  NumeroGuia?: string;
  Origen?: string;
  Destino?: string;
  costoTotal?: number | string;
  ValorDeclarado?: number | string;
  Peso?: number | string;
  paymentId?: string;
  [key: string]: unknown;
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
    const { remitente, destinatario, envioId, fecha, cotizador, mensaje } = data;

    const normalizeNumber = (value: unknown) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value.replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const adminEmailResult = await sendAdminShipmentNotificationEmail({
      customerName: remitente?.nombre || remitente?.Nombre || 'Cliente',
      customerEmail: remitente?.email || remitente?.Email || remitente?.correo || remitente?.Correo || undefined,
      trackingNumber: (data as Record<string, unknown>)?.NumeroGuia as string | undefined,
      origin: cotizador?.origen || (data as Record<string, unknown>)?.Origen as string | undefined,
      destination: cotizador?.destino || (data as Record<string, unknown>)?.Destino as string | undefined,
      recipientName: destinatario?.nombre || destinatario?.Nombre || 'Destinatario',
      recipientPhone: destinatario?.telefono || destinatario?.Telefono || undefined,
      senderName: remitente?.nombre || remitente?.Nombre || 'Cliente',
      senderPhone: remitente?.telefono || remitente?.Telefono || undefined,
      totalCost: normalizeNumber(cotizador?.costoTotal ?? (data as Record<string, unknown>)?.costoTotal),
      declaredValue: normalizeNumber(cotizador?.valorDeclarado ?? (data as Record<string, unknown>)?.ValorDeclarado),
      weight: normalizeNumber(cotizador?.pesoTotal ?? cotizador?.peso ?? (data as Record<string, unknown>)?.Peso),
      orderDate: fecha || new Date().toISOString(),
      paymentId: (data as Record<string, unknown>)?.paymentId as string | undefined,
      notes: mensaje || cotizador?.notas || cotizador?.observaciones || undefined,
      metadata: {
        envioId,
        source: "notificar-envio",
      },
    });

    return NextResponse.json({
      success: adminEmailResult.sent,
      message: adminEmailResult.sent ? "Notificación enviada exitosamente" : "No se pudo enviar la notificación",
      transport: adminEmailResult.transport,
      reason: adminEmailResult.reason,
      error: adminEmailResult.error,
      emailId: adminEmailResult.id,
      recipients: adminEmailResult.recipients,
      transportsTried: adminEmailResult.transportsTried,
      envioId,
      timestamp: new Date().toISOString(),
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
