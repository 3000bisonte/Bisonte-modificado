/**
 * Script para probar métodos de pago en PRODUCCIÓN
 * Prueba tarjetas de crédito, débito y PSE
 */

const https = require('https');

// Configuración de producción
const PRODUCTION_URL = 'https://www.bisonteapp.com';
const MP_PUBLIC_KEY = 'APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d';

console.log('🚀 INICIANDO PRUEBAS DE PAGOS EN PRODUCCIÓN');
console.log('================================================\n');

// Función para hacer request HTTPS
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test 1: Verificar que el endpoint de pagos está disponible
async function testPaymentEndpoint() {
  console.log('📡 Test 1: Verificando endpoint de pagos...');
  
  try {
    const options = {
      hostname: 'www.bisonteapp.com',
      path: '/api/mercadopago/process-payment',
      method: 'OPTIONS',
      headers: {
        'Origin': PRODUCTION_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const response = await makeRequest(options);
    
    if (response.statusCode === 200 || response.statusCode === 204) {
      console.log('✅ Endpoint de pagos disponible');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   CORS: ${response.headers['access-control-allow-origin'] || 'No configurado'}\n`);
      return true;
    } else {
      console.log(`⚠️  Status inesperado: ${response.statusCode}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    return false;
  }
}

// Test 2: Probar tarjeta VISA aprobada (simulación)
async function testVisaApproved() {
  console.log('💳 Test 2: Probando tarjeta VISA aprobada...');
  console.log('   Tarjeta: 4013 5406 8274 6260');
  
  const paymentData = {
    transaction_amount: 50000,
    token: 'test_token_visa_approved',
    description: 'Test - Envío Bisonte',
    installments: 1,
    payment_method_id: 'visa',
    payer: {
      email: 'test@bisonteapp.com',
      identification: {
        type: 'CC',
        number: '12345678'
      }
    }
  };

  try {
    const options = {
      hostname: 'www.bisonteapp.com',
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': PRODUCTION_URL
      }
    };

    const response = await makeRequest(options, paymentData);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.body) {
      if (response.body.success) {
        console.log('   ✅ Pago procesado exitosamente');
        console.log(`   ID: ${response.body.id || 'N/A'}`);
        console.log(`   Estado: ${response.body.status || 'N/A'}\n`);
      } else {
        console.log('   ⚠️  Respuesta del servidor:');
        console.log(`   ${JSON.stringify(response.body, null, 2)}\n`);
      }
    } else {
      console.log('   ⚠️  Sin respuesta del cuerpo\n');
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

// Test 3: Probar tarjeta MASTERCARD aprobada (simulación)
async function testMastercardApproved() {
  console.log('💳 Test 3: Probando tarjeta MASTERCARD aprobada...');
  console.log('   Tarjeta: 5031 7557 3453 0604');
  
  const paymentData = {
    transaction_amount: 50000,
    token: 'test_token_master_approved',
    description: 'Test - Envío Bisonte',
    installments: 1,
    payment_method_id: 'master',
    payer: {
      email: 'test@bisonteapp.com',
      identification: {
        type: 'CC',
        number: '12345678'
      }
    }
  };

  try {
    const options = {
      hostname: 'www.bisonteapp.com',
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': PRODUCTION_URL
      }
    };

    const response = await makeRequest(options, paymentData);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.body) {
      if (response.body.success) {
        console.log('   ✅ Pago procesado exitosamente');
        console.log(`   ID: ${response.body.id || 'N/A'}`);
        console.log(`   Estado: ${response.body.status || 'N/A'}\n`);
      } else {
        console.log('   ⚠️  Respuesta del servidor:');
        console.log(`   ${JSON.stringify(response.body, null, 2)}\n`);
      }
    } else {
      console.log('   ⚠️  Sin respuesta del cuerpo\n');
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

// Test 4: Probar PSE (simulación)
async function testPSE() {
  console.log('🏦 Test 4: Probando PSE...');
  console.log('   Banco: Banco de Bogotá');
  
  const paymentData = {
    transaction_amount: 50000,
    description: 'Test - Envío Bisonte PSE',
    payment_method_id: 'pse',
    payer: {
      email: 'test@bisonteapp.com',
      identification: {
        type: 'CC',
        number: '12345678'
      },
      entity_type: 'individual'
    },
    transaction_details: {
      financial_institution: '1040' // Banco de Bogotá
    },
    callback_url: `${PRODUCTION_URL}/payment-status`,
    notification_url: `${PRODUCTION_URL}/api/mercadopago/webhook`
  };

  try {
    const options = {
      hostname: 'www.bisonteapp.com',
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': PRODUCTION_URL
      }
    };

    const response = await makeRequest(options, paymentData);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.body) {
      if (response.body.success) {
        console.log('   ✅ PSE iniciado exitosamente');
        console.log(`   ID: ${response.body.id || 'N/A'}`);
        console.log(`   Estado: ${response.body.status || 'N/A'}`);
        if (response.body.external_resource_url) {
          console.log(`   URL PSE: ${response.body.external_resource_url}`);
        }
        console.log();
      } else {
        console.log('   ⚠️  Respuesta del servidor:');
        console.log(`   ${JSON.stringify(response.body, null, 2)}\n`);
      }
    } else {
      console.log('   ⚠️  Sin respuesta del cuerpo\n');
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

// Test 5: Verificar configuración de MercadoPago
async function testMercadoPagoConfig() {
  console.log('⚙️  Test 5: Verificando configuración de MercadoPago...');
  
  try {
    const options = {
      hostname: 'www.bisonteapp.com',
      path: '/api/mercadopago/config',
      method: 'GET',
      headers: {
        'Origin': PRODUCTION_URL
      }
    };

    const response = await makeRequest(options);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200 && response.body) {
      console.log('   ✅ Configuración disponible');
      console.log(`   Public Key: ${response.body.publicKey ? '✓ Configurada' : '✗ No configurada'}`);
      console.log(`   Ambiente: ${response.body.environment || 'N/A'}\n`);
    } else {
      console.log('   ⚠️  Endpoint de configuración no disponible\n');
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

// Test 6: Probar tarjeta rechazada
async function testCardRejected() {
  console.log('💳 Test 6: Probando tarjeta rechazada...');
  console.log('   Tarjeta: 4013 5406 8274 6269');
  
  const paymentData = {
    transaction_amount: 50000,
    token: 'test_token_visa_rejected',
    description: 'Test - Envío Bisonte (Rechazo)',
    installments: 1,
    payment_method_id: 'visa',
    payer: {
      email: 'test@bisonteapp.com',
      identification: {
        type: 'CC',
        number: '12345678'
      }
    }
  };

  try {
    const options = {
      hostname: 'www.bisonteapp.com',
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': PRODUCTION_URL
      }
    };

    const response = await makeRequest(options, paymentData);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.body) {
      if (!response.body.success || response.body.status === 'rejected') {
        console.log('   ✅ Rechazo manejado correctamente');
        console.log(`   Razón: ${response.body.status_detail || response.body.error || 'N/A'}\n`);
      } else {
        console.log('   ⚠️  Respuesta inesperada:');
        console.log(`   ${JSON.stringify(response.body, null, 2)}\n`);
      }
    } else {
      console.log('   ⚠️  Sin respuesta del cuerpo\n');
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return null;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log(`Probando en: ${PRODUCTION_URL}`);
  console.log(`Public Key: ${MP_PUBLIC_KEY}\n`);
  console.log('================================================\n');

  const results = {
    endpoint: await testPaymentEndpoint(),
    config: await testMercadoPagoConfig(),
    visaApproved: await testVisaApproved(),
    mastercardApproved: await testMastercardApproved(),
    pse: await testPSE(),
    cardRejected: await testCardRejected()
  };

  console.log('================================================');
  console.log('📊 RESUMEN DE PRUEBAS\n');
  
  let passed = 0;
  let failed = 0;
  
  Object.entries(results).forEach(([test, result]) => {
    if (result && (result.statusCode === 200 || result.statusCode === 201 || result === true)) {
      console.log(`✅ ${test}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${test}: FAILED`);
      failed++;
    }
  });
  
  console.log(`\n📈 Total: ${passed} pasadas, ${failed} fallidas`);
  console.log('================================================\n');

  console.log('💡 NOTAS IMPORTANTES:');
  console.log('   - Estos son tests de conectividad y estructura');
  console.log('   - Para pruebas reales, usa las tarjetas de prueba en la app');
  console.log('   - Tarjetas de prueba en: TARJETAS_PRUEBA_MERCADOPAGO.md');
  console.log('   - Los tokens reales se generan en el frontend con MP SDK\n');
}

// Ejecutar
runAllTests().catch(console.error);
