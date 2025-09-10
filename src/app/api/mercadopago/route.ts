import { NextResponse, type NextRequest } from "next/server";
import { compose, handle, withErrorBoundary, withValidation, withRateLimit } from "@/lib/http";
import { mercadoPagoCreateSchema } from "@/schemas/mercadopago";

// Para propósitos de testing, simulamos MercadoPago
const mockMercadoPago = {
  createPayment: (data: any) => ({
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

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "MercadoPago integration status",
      status: "operational",
      version: "2.0.0",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error en GET /mercadopago:", error);
    return NextResponse.json({
      success: false,
      error: "Error en MercadoPago status",
      details: error?.message ?? String(error)
    }, { status: 500 });
  }
}

export const POST = compose(withRateLimit({ limit: 10, windowSec: 60 }), withValidation(mercadoPagoCreateSchema), handle(), withErrorBoundary())(async (request: NextRequest, { body }) => {
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || '';
  const realIp = (clientIp === "::1" || clientIp === "127.0.0.1") ? "186.86.33.18" : clientIp;
  const paymentData = {
    ...body,
    ip: realIp,
  } as any;

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
