import { NextRequest, NextResponse } from 'next/server';

// Configuración de MercadoPago
const MERCADOPAGO_CONFIG = {
  access_token: process.env.MP_ENVIRONMENT === 'production' 
    ? process.env.MP_ACCESS_TOKEN_PROD 
    : process.env.MP_ACCESS_TOKEN_TEST,
  environment: process.env.MP_ENVIRONMENT || 'test'
};

export async function POST(request: NextRequest) {
  try {
    console.log('🏦 Iniciando creación de pago PSE...');
    
    const body = await request.json();
    console.log('📋 Datos recibidos para PSE:', body);
    
    const { 
      amount, 
      email, 
      document_type, 
      document_number, 
      financial_institution = '1040', // Banco por defecto
      order_id,
      description = 'Pago Bisonte Logística'
    } = body;

    // Validaciones
    if (!amount || !email || !document_type || !document_number) {
      return NextResponse.json({
        success: false,
        error: 'Datos requeridos: amount, email, document_type, document_number'
      }, { status: 400 });
    }

    // Obtener IP del cliente
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = forwardedFor?.split(',')[0] || realIP || '127.0.0.1';
    
    console.log('🌐 IP del cliente:', clientIP);
    console.log('🌍 Ambiente:', MERCADOPAGO_CONFIG.environment);

    // Determinar entity_type basado en el tipo de documento
    const getEntityType = (docType: string) => {
      return docType === 'NIT' ? 'association' : 'individual';
    };

    // Construir payload para PSE
    const paymentData: any = {
      transaction_amount: Number(amount),
      description: description,
      payment_method_id: 'pse',
      payer: {
        email: email,
        identification: {
          type: document_type, // 'CC', 'CE', 'NIT', etc.
          number: document_number
        },
        entity_type: getEntityType(document_type)
      },
      additional_info: {
        ip_address: clientIP
      },
      callback_url: `${process.env.NEXTAUTH_URL}/mercadopago/pse-callback`,
      notification_url: `${process.env.NEXTAUTH_URL}/api/mercadopago/webhook`
    };

    // Agregar institución financiera si se proporciona
    if (financial_institution) {
      paymentData.transaction_details = {
        financial_institution: financial_institution
      };
    }

    // Agregar order_id si se proporciona
    if (order_id) {
      paymentData.external_reference = order_id;
    }

    console.log('📤 Enviando pago PSE a MercadoPago...');
    console.log('🔑 Access Token:', MERCADOPAGO_CONFIG.access_token?.substring(0, 20) + '...');

    // Crear pago en MercadoPago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_CONFIG.access_token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('📥 Respuesta de MercadoPago:', {
      status: response.status,
      paymentId: result.id,
      paymentStatus: result.status,
      statusDetail: result.status_detail
    });

    if (!response.ok) {
      console.error('❌ Error en MercadoPago:', result);
      return NextResponse.json({
        success: false,
        error: 'Error al procesar pago PSE',
        details: result.message || 'Error desconocido',
        mercadopago_error: result
      }, { status: 400 });
    }

    // Extraer URL externa para redirigir al banco
    const external_resource_url = result.transaction_details?.external_resource_url;
    
    if (!external_resource_url) {
      console.error('❌ No se recibió external_resource_url');
      return NextResponse.json({
        success: false,
        error: 'No se pudo obtener la URL del banco',
        payment_result: result
      }, { status: 400 });
    }

    console.log('✅ PSE creado exitosamente');
    console.log('🔗 URL del banco:', external_resource_url);

    return NextResponse.json({
      success: true,
      payment_id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      external_resource_url: external_resource_url,
      callback_url: paymentData.callback_url,
      message: 'Pago PSE creado. Redirigir al usuario al banco.'
    });

  } catch (error) {
    console.error('💥 Error crítico en PSE:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}

// GET para verificar configuración
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint PSE operativo',
    environment: MERCADOPAGO_CONFIG.environment,
    callback_url: `${process.env.NEXTAUTH_URL}/mercadopago/pse-callback`,
    configured: !!MERCADOPAGO_CONFIG.access_token
  });
}