import { NextResponse, type NextRequest } from "next/server";

import { compose, handle, withErrorBoundary, withValidation, withRateLimit } from "@/lib/http";
import { mercadoPagoCreateSchema } from "@/schemas/mercadopago";

interface PaymentData {
  transaction_amount: number;
  payment_method_id?: string;
  description?: string;
  installments?: number;
  payer: {
    email: string;
    entity_type?: string;
    identification?: {
      type?: string;
      number?: string;
    };
  };
}

interface MercadoPagoConfig {
  environment: "production" | "test";
  accessToken: string;
  publicKey?: string;
  baseUrl: string;
}

const resolveMercadoPagoConfig = (): MercadoPagoConfig => {
  const envFlag = (process.env.MP_ENVIRONMENT ?? "test").toLowerCase();
  const environment: "production" | "test" = envFlag === "production" ? "production" : "test";

  const accessToken =
    environment === "production"
      ? process.env.MP_ACCESS_TOKEN_PROD ?? process.env.MP_ACCESS_TOKEN ?? ""
      : process.env.MP_ACCESS_TOKEN_TEST ?? process.env.MP_ACCESS_TOKEN ?? "";

  const publicKey =
    environment === "production"
      ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD ?? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? ""
      : process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST ?? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

  return {
    environment,
    accessToken,
    publicKey,
    baseUrl: "https://api.mercadopago.com",
  };
};

const createPreferencePayload = (data: PaymentData, origin: string) => {
  const descriptor = process.env.MP_STATEMENT_DESCRIPTOR ?? "BISONTE";
  const notificationUrl =
    process.env.MP_WEBHOOK_URL ?? `${origin.replace(/\/$/, "")}/api/mercadopago/webhook`;

  return {
    items: [
      {
        title: data.description || "Envío Bisonte",
        quantity: 1,
        currency_id: process.env.MP_CURRENCY ?? "COP",
        unit_price: Number(data.transaction_amount),
      },
    ],
    payer: {
      email: data.payer.email,
      entity_type: data.payer.entity_type ?? undefined,
      identification: data.payer.identification,
    },
    payment_methods: data.payment_method_id
      ? { default_payment_method_id: data.payment_method_id }
      : undefined,
    installments: data.installments ?? 1,
    statement_descriptor: descriptor,
    back_urls: {
      success:
        process.env.MP_BACK_URL_SUCCESS ?? `${origin.replace(/\/$/, "")}/pagos/mercadopago/success`,
      failure:
        process.env.MP_BACK_URL_FAILURE ?? `${origin.replace(/\/$/, "")}/pagos/mercadopago/failure`,
      pending:
        process.env.MP_BACK_URL_PENDING ?? `${origin.replace(/\/$/, "")}/pagos/mercadopago/pending`,
    },
    auto_return: "approved",
    metadata: {
      project: "bisonte-logistica",
      createdAt: new Date().toISOString(),
      origin,
    },
    notification_url: notificationUrl,
  };
};

const ensurePreferenceResponse = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respuesta inválida de Mercado Pago");
  }

  const data = payload as Record<string, unknown>;
  const id = typeof data.id === "string" ? data.id : undefined;
  const initPoint = typeof data.init_point === "string" ? data.init_point : undefined;
  const sandboxInitPoint =
    typeof data.sandbox_init_point === "string" ? data.sandbox_init_point : undefined;

  if (!id) {
    throw new Error("Mercado Pago respondió sin identificador de preferencia");
  }

  return {
    id,
    init_point: initPoint,
    sandbox_init_point: sandboxInitPoint,
    raw: data,
  };
};

export function GET() {
  try {
    const { accessToken, publicKey, environment } = resolveMercadoPagoConfig();
    const mpInitKey = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;

    const isConfigured = Boolean(accessToken && publicKey);
    const isProduction = environment === "production";
    const isTest = environment === "test";

    return NextResponse.json({
      success: true,
      message: "MercadoPago integration status",
      status: isConfigured ? "operational" : "not_configured",
      configured: {
        accessToken: !!accessToken,
        publicKey: !!publicKey,
        initKey: !!mpInitKey,
        all: isConfigured
      },
      environment: isProduction ? "production" : isTest ? "test" : "unknown",
      version: "2.0.0",
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      error: "Error en MercadoPago status",
      details: errorMessage
    }, { status: 500 });
  }
}

export const POST = compose(
  withRateLimit({ limit: 10, windowSec: 60 }),
  withValidation(mercadoPagoCreateSchema),
  handle(),
  withErrorBoundary()
)(async (request: NextRequest, context: { body?: unknown }) => {
  const parsedBody = mercadoPagoCreateSchema.parse(context.body ?? {});
  const body: PaymentData = {
    transaction_amount: parsedBody.transaction_amount,
    payment_method_id: parsedBody.payment_method_id,
    description: parsedBody.description,
    installments: parsedBody.installments,
    payer: {
      email: parsedBody.payer.email,
      entity_type: parsedBody.payer.entity_type,
      identification: parsedBody.payer.identification,
    },
  };
  const { accessToken, environment, baseUrl } = resolveMercadoPagoConfig();

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        error: "Mercado Pago no está configurado",
        details: "Falta MP_ACCESS_TOKEN en las variables de entorno",
      },
      { status: 500 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://bisonte-logistica.vercel.app";

  const preferencePayload = createPreferencePayload(body, origin);

  const mpResponse = await fetch(`${baseUrl}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencePayload),
  });

  const jsonPayload = (await mpResponse.json()) as unknown;

  if (!mpResponse.ok) {
    console.error("❌ Mercado Pago error:", jsonPayload);
    return NextResponse.json(
      {
        success: false,
        error: "Error creando preferencia en Mercado Pago",
        details: jsonPayload,
      },
      { status: 502 }
    );
  }

  const preference = ensurePreferenceResponse(jsonPayload);
  const initPoint =
    environment === "production"
      ? preference.init_point ?? preference.sandbox_init_point
      : preference.sandbox_init_point ?? preference.init_point;

  return NextResponse.json({
    success: true,
    environment,
    preference_id: preference.id,
    init_point: initPoint,
    sandbox_init_point: preference.sandbox_init_point,
    public_key:
      environment === "production"
        ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD ?? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? null
        : process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST ?? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? null,
    message: "Preferencia Mercado Pago creada correctamente",
    payload: preferencePayload,
    timestamp: new Date().toISOString(),
  });
});
