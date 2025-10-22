import { NextRequest, NextResponse } from 'next/server';

// Configuración de MercadoPago
const MERCADOPAGO_CONFIG = {
  access_token: process.env.MP_ENVIRONMENT === 'production' 
    ? process.env.MP_ACCESS_TOKEN_PROD 
    : process.env.MP_ACCESS_TOKEN_TEST,
  environment: process.env.MP_ENVIRONMENT || 'test'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    console.log('🔍 Verificando pago PSE:', paymentId);
    console.log('🌍 Ambiente:', MERCADOPAGO_CONFIG.environment);

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: 'ID de pago requerido'
      }, { status: 400 });
    }

    // Consultar el estado del pago en MercadoPago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_CONFIG.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ Error al consultar MercadoPago:', response.status);
      return NextResponse.json({
        success: false,
        error: 'Error al consultar el estado del pago',
        status: response.status
      }, { status: 400 });
    }

    const payment = await response.json();
    console.log('📥 Estado del pago:', {
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      amount: payment.transaction_amount
    });

    // Mapear estados para respuesta consistente
    const statusMapping = {
      'approved': 'approved',
      'pending': 'pending',
      'authorized': 'pending',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'charged_back'
    };

    const normalizedStatus = statusMapping[payment.status] || payment.status;

    // Información adicional según el estado
    let additionalInfo = {};
    
    if (payment.status === 'pending') {
      additionalInfo = {
        estimated_processing_time: '1-3 días hábiles',
        next_steps: 'El banco está procesando tu transferencia. Recibirás una confirmación cuando se complete.'
      };
    }

    if (payment.status === 'approved') {
      additionalInfo = {
        approval_date: payment.date_approved,
        authorization_code: payment.authorization_code
      };
    }

    if (payment.status === 'rejected') {
      additionalInfo = {
        rejection_reason: payment.status_detail,
        can_retry: true
      };
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: normalizedStatus,
        original_status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        currency_id: payment.currency_id,
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        payment_method_id: payment.payment_method_id,
        payment_type_id: payment.payment_type_id,
        external_reference: payment.external_reference,
        description: payment.description,
        ...additionalInfo
      }
    });

  } catch (error) {
    console.error('💥 Error crítico en verificación PSE:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}