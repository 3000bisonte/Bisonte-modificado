import { NextResponse } from 'next/server';

/**
 * 🧪 ENDPOINT DE PRUEBA - Simula un pago exitoso de MercadoPago
 * 
 * Este endpoint se usa para probar el flujo de creación de envíos
 * sin necesitar una tarjeta real de MercadoPago.
 * 
 * ⚠️ SOLO PARA DESARROLLO/TESTING - Desactivar en producción
 */

export async function POST(request) {
  try {
    console.log("🧪 [TEST] Simulando pago exitoso...");

    // Simular respuesta de MercadoPago
    const mockPaymentResponse = {
      id: `TEST-${Date.now()}`,
      status: "approved",
      status_detail: "accredited",
      transaction_amount: 15000,
      payment_method_id: "visa",
      payment_type_id: "credit_card",
      date_approved: new Date().toISOString(),
      date_created: new Date().toISOString(),
    };

    console.log("✅ [TEST] Pago simulado creado:", mockPaymentResponse);

    return NextResponse.json(
      {
        success: true,
        message: "Pago de prueba exitoso",
        payment: mockPaymentResponse,
        status: "approved",
        paymentId: mockPaymentResponse.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [TEST] Error en simulación de pago:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error en simulación de pago",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET para verificar que el endpoint está disponible
export async function GET() {
  return NextResponse.json({
    message: "🧪 Endpoint de prueba de pago - disponible",
    usage: "POST /api/test-payment-success para simular un pago exitoso",
  });
}
