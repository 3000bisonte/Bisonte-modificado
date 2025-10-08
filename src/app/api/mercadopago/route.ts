import { NextResponse, type NextRequest } from "next/server";

import { compose, handle, withErrorBoundary, withValidation, withRateLimit } from "@/lib/http";
import { mercadoPagoCreateSchema } from "@/schemas/mercadopago";

interface PaymentData {
  transaction_amount: number;
  payment_method_id?: string;
  payer: unknown;
}

// Para propósitos de testing, simulamos MercadoPago
const mockMercadoPago = {
  createPayment: (data: PaymentData) => ({
    id: 'payment_' + Date.now(),
    status: 'approved',
    transaction_amount: data.transaction_amount,
    payment_method_id: data.payment_method_id || 'visa',
    payer: data.payer,
    date_created: new Date().toISOString(),
    date_approved: new Date().toISOString(),
    point_of_interaction: {
      transaction_data: {
        qr_code: 'mock_qr_code_123',
        qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    }
  })
};

export function GET() {
  try {
    // 🔍 Verificar configuración de Mercado Pago
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    const mpPublicKey = process.env.MP_PUBLIC_KEY;
    const mpInitKey = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;
    
    const isConfigured = !!(mpAccessToken && mpPublicKey && mpInitKey);
    const isProduction = mpAccessToken?.includes('APP_USR') || false;
    const isTest = mpAccessToken?.includes('TEST') || false;
    
    return NextResponse.json({
      success: true,
      message: "MercadoPago integration status",
      status: isConfigured ? "operational" : "not_configured",
      configured: {
        accessToken: !!mpAccessToken,
        publicKey: !!mpPublicKey,
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

interface ContextWithBody {
  body?: PaymentData;
}

export const POST = compose(withRateLimit({ limit: 10, windowSec: 60 }), withValidation(mercadoPagoCreateSchema), handle(), withErrorBoundary())(async (request: NextRequest, context: ContextWithBody) => {
  const body = context.body || {} as PaymentData;
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || '';
  const realIp = (clientIp === "::1" || clientIp === "127.0.0.1") ? "186.86.33.18" : clientIp;
  const paymentData: PaymentData & { ip: string } = {
    ...body,
    ip: realIp,
  };

  // Simulate async processing
  await Promise.resolve();
  const paymentResponse = mockMercadoPago.createPayment(paymentData);

  return NextResponse.json({
    success: true,
    payment: {
      id: paymentResponse.id,
      status: paymentResponse.status,
      transaction_amount: paymentResponse.transaction_amount,
      payment_method_id: paymentResponse.payment_method_id,
      date_created: paymentResponse.date_created,
      date_approved: paymentResponse.date_approved,
      point_of_interaction: paymentResponse.point_of_interaction
    },
    back_urls: {
      success: "http://bisonte-modificado.vercel.app/feedback",
      failure: "http://bisonte-modificado.vercel.app/failure",
      pending: "http://bisonte-modificado.vercel.app/pending",
    },
    notification_url: "https://example.com/webhook",
    message: "Pago procesado exitosamente (simulado)",
    timestamp: new Date().toISOString()
  });
});
