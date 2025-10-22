/**
 * Script para probar el endpoint de procesamiento de pagos
 * Simula un pago con tarjeta de crédito usando datos de prueba
 */

const PAYMENT_TEST_DATA = {
  // Datos básicos del pago
  transaction_amount: 15000, // $15,000 COP
  payment_method_id: 'visa', // Tarjeta Visa
  installments: 1, // Sin cuotas
  
  // Token de tarjeta de prueba (normalmente viene del Payment Brick)
  // Este es un token de ejemplo, en producción viene del frontend
  token: 'test_card_token_123', // ⚠️ En real viene del Payment Brick
  
  // Datos del pagador
  payer: {
    email: 'test@bisonte.com',
    identification: {
      type: 'CC', // Cédula de ciudadanía
      number: '12345678'
    }
  },
  
  // Información adicional
  description: 'Envío de prueba Bisonte',
  statement_descriptor: 'BISONTE'
};

async function testPaymentEndpoint() {
  try {
    console.log('🧪 Iniciando test del endpoint de pagos...');
    console.log('📋 Datos de prueba:', JSON.stringify(PAYMENT_TEST_DATA, null, 2));
    
    const response = await fetch('http://localhost:3000/api/mercadopago/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(PAYMENT_TEST_DATA)
    });
    
    const result = await response.json();
    
    console.log('\n📤 Status de respuesta:', response.status);
    console.log('📥 Respuesta completa:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ TEST EXITOSO:');
      console.log(`   - Payment ID: ${result.id}`);
      console.log(`   - Estado: ${result.status}`);
      console.log(`   - Detalle: ${result.status_detail}`);
    } else {
      console.log('\n❌ TEST FALLÓ:');
      console.log(`   - Error: ${result.error}`);
      console.log(`   - Detalles: ${result.details || 'N/A'}`);
      
      if (result.help) {
        console.log(`   - Ayuda: ${result.help}`);
      }
    }
    
  } catch (error) {
    console.error('\n💥 Error ejecutando test:', error.message);
  }
}

// También probar el endpoint GET para verificar configuración
async function testGetEndpoint() {
  try {
    console.log('\n🔍 Verificando configuración del endpoint...');
    
    const response = await fetch('http://localhost:3000/api/mercadopago/process-payment', {
      method: 'GET'
    });
    
    const result = await response.json();
    
    console.log('📊 Estado del servicio:', JSON.stringify(result, null, 2));
    
    if (result.configured) {
      console.log('✅ MercadoPago está configurado correctamente');
      console.log(`🌍 Ambiente: ${result.environment}`);
    } else {
      console.log('❌ MercadoPago NO está configurado');
    }
    
  } catch (error) {
    console.error('💥 Error verificando configuración:', error.message);
  }
}

// Ejecutar ambos tests
async function runAllTests() {
  console.log('🚀 INICIANDO TESTS DE MERCADOPAGO\n');
  console.log('=' .repeat(50));
  
  // 1. Verificar configuración
  await testGetEndpoint();
  
  console.log('\n' + '=' .repeat(50));
  
  // 2. Test de pago (esperamos que falle por token inválido, pero debe mostrar que el endpoint funciona)
  await testPaymentEndpoint();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Tests completados');
  console.log('\n💡 NOTA: El test de pago debería fallar con "token inválido" porque');
  console.log('   usamos un token de prueba. Esto es normal y confirma que el');
  console.log('   endpoint está funcionando y validando correctamente.');
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  runAllTests();
}

module.exports = { testPaymentEndpoint, testGetEndpoint, runAllTests };