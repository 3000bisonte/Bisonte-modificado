import { NextResponse, type NextRequest } from "next/server";

import { compose, handle, withErrorBoundary, withValidation, withRateLimit } from "@/lib/http";

/**
 * Endpoint para procesar pagos directamente con Mercado Pago Payment Brick
 * Este endpoint recibe los datos del formulario de pago (tarjeta) y procesa el pago
 */

interface PaymentFormData {
  transaction_amount: number;
  token: string;
  payment_method_id: string;
  installments: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  description?: string;
  statement_descriptor?: string;
}

interface MercadoPagoConfig {
  environment: "production" | "test";
  accessToken: string;
  baseUrl: string;
}

const resolveMercadoPagoConfig = (): MercadoPagoConfig => {
  const envFlag = (process.env.MP_ENVIRONMENT ?? "test").toLowerCase();
  const environment: "production" | "test" = envFlag === "production" ? "production" : "test";

  const accessToken =
    environment === "production"
      ? process.env.MP_ACCESS_TOKEN_PROD ?? process.env.MP_ACCESS_TOKEN ?? ""
      : process.env.MP_ACCESS_TOKEN_TEST ?? process.env.MP_ACCESS_TOKEN ?? "";

  return {
    environment,
    accessToken,
    baseUrl: "https://api.mercadopago.com",
  };
};

// Schema de validación simple (puedes mejorarlo con zod si quieres)
const validatePaymentData = (data: unknown): PaymentFormData => {
  if (!data || typeof data !== "object") {
    throw new Error("Datos de pago inválidos");
  }

  const payment = data as Record<string, unknown>;

  // Validación de monto
  if (!payment.transaction_amount || typeof payment.transaction_amount !== "number") {
    throw new Error("Monto de transacción inválido o faltante");
  }
  
  // Validar que el monto sea positivo
  if (payment.transaction_amount <= 0) {
    throw new Error("El monto de la transacción debe ser mayor a cero");
  }
  
  // Validar límites razonables de monto
  if (payment.transaction_amount > 50000000) {
    throw new Error("El monto de la transacción excede el límite permitido");
  }

  // Validación de método de pago
  if (!payment.payment_method_id || typeof payment.payment_method_id !== "string") {
    throw new Error("Método de pago inválido o faltante");
  }
  
  // Validar que el payment_method_id no esté vacío
  if (payment.payment_method_id.trim().length === 0) {
    throw new Error("El método de pago no puede estar vacío");
  }

  // ⚠️ PSE y métodos en efectivo NO envían token, solo tarjetas lo requieren
  const isPSE = payment.payment_method_id === 'pse';
  const isCashPayment = ['efecty', 'puntored', 'bancolombia', 'gana', 'pago_efectivo'].includes(payment.payment_method_id as string);
  const isCardPayment = !isPSE && !isCashPayment;
  
  if (isCardPayment && (!payment.token || typeof payment.token !== "string")) {
    throw new Error("Token de pago inválido - requerido para tarjetas");
  }

  if (!payment.payer || typeof payment.payer !== "object") {
    throw new Error("Datos del pagador inválidos");
  }

  const payer = payment.payer as Record<string, unknown>;
  if (!payer.email || typeof payer.email !== "string") {
    throw new Error("Email del pagador inválido");
  }

  return {
    transaction_amount: payment.transaction_amount,
    token: (payment.token as string) || "", // PSE no tiene token
    payment_method_id: payment.payment_method_id,
    installments: typeof payment.installments === "number" ? payment.installments : 1,
    payer: {
      email: payer.email,
      identification: payer.identification as { type: string; number: string } | undefined,
    },
    description: typeof payment.description === "string" ? payment.description : "Envío Bisonte",
    statement_descriptor: typeof payment.statement_descriptor === "string" 
      ? payment.statement_descriptor 
      : process.env.MP_STATEMENT_DESCRIPTOR ?? "BISONTE",
  };
};

export async function POST(request: NextRequest) {
  try {
    console.log("💳 Iniciando procesamiento de pago con Mercado Pago...");

    const body = await request.json();
    console.log("📋 Datos recibidos del Payment Brick:", {
      amount: body.transaction_amount,
      method: body.payment_method_id,
      installments: body.installments,
      email: body.payer?.email,
      hasToken: !!body.token,
      tokenPreview: body.token ? body.token.substring(0, 20) + '...' : 'NO TOKEN',
    });

    // Obtener IP del cliente para cumplir requisitos de MercadoPago
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     '127.0.0.1';
    
    console.log("🌐 IP del cliente:", clientIP);

    // Validar datos - capturar errores de validación para retornar 400
    let paymentData: PaymentFormData;
    try {
      paymentData = validatePaymentData(body);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
      console.error("❌ Error de validación:", errorMessage);
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: "Los datos de pago no cumplen con los requisitos",
        },
        { status: 400 }
      );
    }

    const { accessToken, environment, baseUrl } = resolveMercadoPagoConfig();

    if (!accessToken) {
      console.error("❌ Mercado Pago no está configurado - Falta access token");
      console.error("❌ MP_ENVIRONMENT:", process.env.MP_ENVIRONMENT);
      console.error("❌ Variables disponibles:", {
        MP_ACCESS_TOKEN_TEST: process.env.MP_ACCESS_TOKEN_TEST ? '✅ Configurado' : '❌ Falta',
        MP_ACCESS_TOKEN_PROD: process.env.MP_ACCESS_TOKEN_PROD ? '✅ Configurado' : '❌ Falta',
      });
      return NextResponse.json(
        {
          success: false,
          error: "Mercado Pago no está configurado correctamente",
          details: `Falta el Access Token para el ambiente: ${environment}. Verifica las variables MP_ACCESS_TOKEN_TEST o MP_ACCESS_TOKEN_PROD en .env.local`,
          help: "Lee el archivo SOLUCION_ERROR_MERCADOPAGO.md para obtener las credenciales correctas",
        },
        { status: 500 }
      );
    }

    console.log(`🌍 Ambiente: ${environment}`);
    console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);

    // Preparar el payload para la API of Payments
    const paymentPayload: Record<string, unknown> = {
      transaction_amount: paymentData.transaction_amount,
      payment_method_id: paymentData.payment_method_id,
      installments: paymentData.installments,
      payer: {
        email: paymentData.payer.email,
        identification: paymentData.payer.identification,
      },
      description: paymentData.description,
      statement_descriptor: paymentData.statement_descriptor,
      external_reference: `BISONTE-${Date.now()}`,
      notification_url: process.env.MP_WEBHOOK_URL,
      // ✅ Agregar información adicional requerida por MercadoPago
      additional_info: {
        ip_address: clientIP,
        items: [
          {
            id: "ENVIO_BISONTE",
            title: paymentData.description || "Servicio de envío",
            description: "Servicio de logística y envío",
            category_id: "services",
            quantity: 1,
            unit_price: paymentData.transaction_amount,
          }
        ]
      },
      metadata: {
        project: "bisonte-logistica",
        environment,
        createdAt: new Date().toISOString(),
        client_ip: clientIP,
      },
    };

    // Solo agregar token para tarjetas (no para PSE ni pagos en efectivo)
    const isCashMethod = ['efecty', 'puntored', 'bancolombia', 'gana', 'pago_efectivo'].includes(paymentData.payment_method_id);
    const isPSEMethod = paymentData.payment_method_id === 'pse';
    
    if (!isPSEMethod && !isCashMethod && paymentData.token) {
      paymentPayload.token = paymentData.token;
      console.log("🔑 Token agregado para tarjeta:", paymentData.token.substring(0, 20) + '...');
    } else if (!isPSEMethod && !isCashMethod) {
      console.log("⚠️  ADVERTENCIA: Pago con tarjeta sin token - esto causará error");
    } else if (isCashMethod) {
      console.log("💵 Pago en efectivo detectado:", paymentData.payment_method_id);
      console.log("ℹ️  No se requiere token para pagos en efectivo");
    }

    // 🏦 PSE requiere campos adicionales específicos
    if (paymentData.payment_method_id === 'pse') {
      console.log('🏦 Detectado pago PSE - Agregando campos adicionales...');
      
      // PSE requiere estos campos obligatorios
      const psePayload = body as Record<string, unknown>;
      const pseTransactionDetails = psePayload.transaction_details as Record<string, unknown> | undefined;
      
      paymentPayload.transaction_details = {
        financial_institution: (pseTransactionDetails?.financial_institution as string) || 
                              (psePayload.financial_institution as string),
      };
      
      // ✅ CORRECCIÓN: Redirigir a /pagos/mercadopago/success para que cree el envío
      paymentPayload.callback_url = (psePayload.callback_url as string) || 
                                    `${process.env.NEXTAUTH_URL}/pagos/mercadopago/success`;
      
      // Agregar entity_type si está disponible (individual o association)
      if (psePayload.payer && typeof psePayload.payer === 'object') {
        const payerData = psePayload.payer as Record<string, unknown>;
        if (payerData.entity_type) {
          (paymentPayload.payer as Record<string, unknown>).entity_type = payerData.entity_type;
        }
      }
      
      const pseTransactionDetailsResult = paymentPayload.transaction_details as Record<string, unknown>;
      console.log('🏦 Datos PSE agregados:', {
        financial_institution: pseTransactionDetailsResult.financial_institution,
        callback_url: paymentPayload.callback_url,
        entity_type: (paymentPayload.payer as Record<string, unknown>)?.entity_type,
      });
    }

    console.log("📤 Enviando pago a Mercado Pago API...");

    // Llamar a la API de Payments de Mercado Pago
    const mpResponse = await fetch(`${baseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentResult = (await mpResponse.json()) as Record<string, unknown>;

    console.log("📥 Respuesta de Mercado Pago:", {
      status: mpResponse.status,
      paymentId: paymentResult.id,
      paymentStatus: paymentResult.status,
      statusDetail: paymentResult.status_detail,
    });

    // Si Mercado Pago retorna error
    if (!mpResponse.ok) {
      console.error("❌ Error de Mercado Pago API - Status:", mpResponse.status);
      console.error("❌ Respuesta completa:", JSON.stringify(paymentResult, null, 2));
      
      // Extraer mensaje de error más descriptivo
      let errorMessage = "Error al procesar el pago";
      let userFriendlyMessage = "";

      if (typeof paymentResult.message === "string") {
        errorMessage = paymentResult.message;
      } else if (typeof paymentResult.error === "string") {
        errorMessage = paymentResult.error;
      }

      // Mensajes amigables según el tipo de error
      if (mpResponse.status === 401) {
        userFriendlyMessage = "Error de autenticación con Mercado Pago. Las credenciales son inválidas.";
        console.error("💡 Solución: Verifica que tu Access Token sea correcto en .env.local");
      } else if (mpResponse.status === 400) {
        userFriendlyMessage = "Los datos de la tarjeta son inválidos o incompletos.";
      } else if (mpResponse.status === 403) {
        userFriendlyMessage = "No tienes permisos para realizar pagos. Verifica tu cuenta de Mercado Pago.";
      } else if (mpResponse.status >= 500) {
        userFriendlyMessage = "Mercado Pago está experimentando problemas. Intenta nuevamente en unos minutos.";
      }

      return NextResponse.json(
        {
          success: false,
          error: userFriendlyMessage || errorMessage,
          details: paymentResult,
          status: paymentResult.status,
          status_detail: paymentResult.status_detail,
          httpStatus: mpResponse.status,
          help: mpResponse.status === 401 
            ? "Lee SOLUCION_ERROR_MERCADOPAGO.md para obtener credenciales válidas"
            : undefined,
        },
        { status: 502 }
      );
    }

    // Extraer información del pago exitoso
    const paymentId = typeof paymentResult.id === "number" ? paymentResult.id : null;
    const status = typeof paymentResult.status === "string" ? paymentResult.status : "unknown";
    const statusDetail = typeof paymentResult.status_detail === "string" ? paymentResult.status_detail : "";

    console.log(`✅ Pago procesado - ID: ${paymentId}, Estado: ${status}, Detalle: ${statusDetail}`);

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      id: paymentId,
      status: status,
      status_detail: statusDetail,
      message: status === "approved" 
        ? "Pago aprobado exitosamente" 
        : status === "in_process" 
        ? "Pago en proceso de aprobación" 
        : "Pago rechazado",
      payment: {
        id: paymentId,
        status: status,
        status_detail: statusDetail,
        transaction_amount: paymentResult.transaction_amount,
        payment_method_id: paymentResult.payment_method_id,
        date_created: paymentResult.date_created,
        date_approved: paymentResult.date_approved,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error procesando pago:", errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: "Error interno al procesar el pago",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar el estado del servicio
export function GET() {
  const { accessToken, environment } = resolveMercadoPagoConfig();
  
  return NextResponse.json({
    success: true,
    message: "Payment processing endpoint operational",
    configured: !!accessToken,
    environment: environment,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
