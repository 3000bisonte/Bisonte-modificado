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

    const normalizeString = (value: unknown) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
      }
      if (value === null || value === undefined) {
        return undefined;
      }
      const strValue = String(value);
      return strValue.trim().length > 0 ? strValue.trim() : undefined;
    };

    const pickFirst = (...candidates: Array<unknown>) => {
      for (const candidate of candidates) {
        const normalized = normalizeString(candidate);
        if (normalized !== undefined) {
          return normalized;
        }
      }
      return undefined;
    };

    const costNormalized = normalizeNumber(
      cotizador?.costoTotal
        ?? (data as Record<string, unknown>)?.costoTotal
        ?? (data as Record<string, unknown>)?.valor_total
    );

    const declaredNormalized = normalizeNumber(
      cotizador?.valorDeclarado
        ?? (data as Record<string, unknown>)?.ValorDeclarado
        ?? (data as Record<string, unknown>)?.valor_declarado
    );

    const weightNormalized = normalizeNumber(
      cotizador?.pesoTotal
        ?? cotizador?.peso
        ?? (data as Record<string, unknown>)?.Peso
    );

    const senderDetails = {
      nombre: pickFirst(remitente?.nombre, remitente?.Nombre),
      telefono: pickFirst(remitente?.telefono, remitente?.Telefono),
      direccion: pickFirst(
        (remitente as Record<string, unknown> | undefined)?.direccionRecogida,
        (remitente as Record<string, unknown> | undefined)?.DireccionRecogida,
        (remitente as Record<string, unknown> | undefined)?.direccion,
        (remitente as Record<string, unknown> | undefined)?.Direccion,
        cotizador?.origen,
        (data as Record<string, unknown>)?.Origen,
      ),
    };

    const recipientDetails = {
      nombre: pickFirst(destinatario?.nombre, destinatario?.Nombre),
      telefono: pickFirst(destinatario?.telefono, destinatario?.Telefono),
      direccion: pickFirst(
        (destinatario as Record<string, unknown> | undefined)?.direccionEntrega,
        (destinatario as Record<string, unknown> | undefined)?.DireccionEntrega,
        (destinatario as Record<string, unknown> | undefined)?.direccion,
        (destinatario as Record<string, unknown> | undefined)?.Direccion,
        cotizador?.destino,
        (data as Record<string, unknown>)?.Destino,
      ),
      email: pickFirst(destinatario?.correo, destinatario?.Correo),
    };

    const packageDetails = {
      numeroGuia: pickFirst((data as Record<string, unknown>)?.NumeroGuia),
      estado: pickFirst((data as Record<string, unknown>)?.Estado, (data as Record<string, unknown>)?.estado),
      origen: pickFirst(cotizador?.origen, (data as Record<string, unknown>)?.Origen),
      destino: pickFirst(cotizador?.destino, (data as Record<string, unknown>)?.Destino),
      peso: weightNormalized,
      dimensiones: pickFirst((data as Record<string, unknown>)?.Dimensiones, (data as Record<string, unknown>)?.dimensiones),
      valorDeclarado: declaredNormalized,
      notas: mensaje || cotizador?.notas || cotizador?.observaciones,
    };

    const rawMetodoPago = (data as Record<string, unknown>)?.metodoPago;
    const rawMetodo = (data as Record<string, unknown>)?.metodo;
    const rawPagado = (data as Record<string, unknown>)?.pagado;
    const rawPaymentId = (data as Record<string, unknown>)?.paymentId;

    const paymentDetails = {
      metodo: pickFirst(
        rawMetodoPago,
        rawMetodo,
        (cotizador as Record<string, unknown> | undefined)?.metodo
      ),
      pagado: typeof rawPagado === 'boolean' ? rawPagado : undefined,
      montoTotal: costNormalized,
      costoCotizado: costNormalized,
      paymentId: normalizeString(rawPaymentId),
    };

    const knownKeys = new Set([
      'remitente',
      'destinatario',
      'cotizador',
      'fecha',
      'envioId',
      'mensaje',
      'NumeroGuia',
      'Origen',
      'Destino',
      'costoTotal',
      'valor_total',
      'valorDeclarado',
      'ValorDeclarado',
      'valor_declarado',
      'Peso',
      'metodoPago',
      'metodo',
      'pagado',
      'paymentId',
      'Dimensiones',
      'dimensiones',
      'Estado',
      'estado',
    ]);

    const extras = Object.fromEntries(
      Object.entries(data as Record<string, unknown>).filter(([key]) => !knownKeys.has(key))
    );

    const formPayload = {
      remitente,
      destinatario,
      cotizador,
      fecha,
      envioId,
      mensaje,
      extras: Object.keys(extras).length ? extras : undefined,
    };

    const adminEmailResult = await sendAdminShipmentNotificationEmail({
      customerName: pickFirst(remitente?.nombre, remitente?.Nombre) || 'Cliente',
      customerEmail: pickFirst(remitente?.email, remitente?.Email, remitente?.correo, remitente?.Correo),
      trackingNumber: pickFirst((data as Record<string, unknown>)?.NumeroGuia),
      origin: packageDetails.origen,
      destination: packageDetails.destino,
      recipientName: pickFirst(destinatario?.nombre, destinatario?.Nombre) || 'Destinatario',
      recipientPhone: recipientDetails.telefono,
      senderName: pickFirst(remitente?.nombre, remitente?.Nombre) || 'Cliente',
      senderPhone: senderDetails.telefono,
      totalCost: costNormalized,
      declaredValue: declaredNormalized,
      weight: weightNormalized,
      orderDate: fecha || new Date().toISOString(),
      paymentId: paymentDetails.paymentId,
      notes: packageDetails.notas,
      senderDetails,
      recipientDetails,
      packageDetails,
      paymentDetails,
      formPayload,
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
