/**
 * TEST DE MÉTODOS DE PAGO - Efecty y Tarjetas
 * Verifica que ambos métodos funcionen correctamente
 */

const https = require('https');

const BASE_URL = 'www.bisonteapp.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testPaymentMethods() {
  console.log(`${colors.blue}${colors.bold}`);
  console.log('💳 TEST DE MÉTODOS DE PAGO');
  console.log('═'.repeat(60));
  console.log(`${colors.reset}\n`);

  const results = [];

  // ==========================================
  // TEST 1: Efecty (Pago en efectivo)
  // ==========================================
  console.log(`${colors.bold}1. 💵 Efecty - Pago en Efectivo${colors.reset}`);
  try {
    const efectyPayment = {
      transaction_amount: 50000,
      payment_method_id: 'efecty',
      payer: {
        email: 'test@bisonteapp.com',
        identification: {
          type: 'CC',
          number: '12345678'
        }
      },
      description: 'Test Efecty',
      external_reference: `TEST-EFECTY-${Date.now()}`
    };

    const postData = JSON.stringify(efectyPayment);
    
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (response.status === 200 || response.status === 201) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - Efecty funciona correctamente`);
      console.log(`   ${colors.blue}ℹ  Payment ID:${colors.reset} ${response.data.id || 'N/A'}`);
      console.log(`   ${colors.blue}ℹ  Estado:${colors.reset} ${response.data.status || 'N/A'}`);
      results.push({ method: 'Efecty', status: 'PASSED' });
    } else {
      throw new Error(`Status ${response.status}: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.push({ method: 'Efecty', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 2: Tarjeta VISA (Simulación)
  // ==========================================
  console.log(`${colors.bold}2. 💳 VISA - Tarjeta de Crédito${colors.reset}`);
  console.log(`   ${colors.yellow}ℹ  NOTA:${colors.reset} Las tarjetas requieren token generado en frontend`);
  console.log(`   ${colors.yellow}ℹ  NOTA:${colors.reset} Este test verifica que el endpoint acepta el formato correcto`);
  
  try {
    // Simular request con estructura correcta (sin token real)
    const cardPayment = {
      transaction_amount: 50000,
      token: 'dummy_token_for_testing', // Token ficticio
      payment_method_id: 'visa',
      installments: 1,
      payer: {
        email: 'test@bisonteapp.com'
      },
      description: 'Test VISA'
    };

    const postData = JSON.stringify(cardPayment);
    
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    // Esperamos error de token inválido (400), no error de validación (502)
    if (response.status === 400 && response.data.details && response.data.details.cause) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - Endpoint acepta formato de tarjeta`);
      console.log(`   ${colors.blue}ℹ  Error esperado:${colors.reset} Token inválido (correcto)`);
      results.push({ method: 'VISA', status: 'PASSED' });
    } else if (response.status === 502 || response.status === 500) {
      throw new Error(`Validación falló - Status ${response.status}`);
    } else {
      console.log(`   ${colors.yellow}⚠️  PARTIAL${colors.reset} - Status ${response.status}`);
      console.log(`   ${colors.blue}ℹ  Respuesta:${colors.reset} ${JSON.stringify(response.data).slice(0, 100)}...`);
      results.push({ method: 'VISA', status: 'PARTIAL' });
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.push({ method: 'VISA', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 3: PSE (Verificación)
  // ==========================================
  console.log(`${colors.bold}3. 🏦 PSE - Transferencia Bancaria${colors.reset}`);
  try {
    const psePayment = {
      transaction_amount: 50000,
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
        financial_institution: '1040'
      },
      callback_url: 'https://www.bisonteapp.com/pago-exitoso',
      description: 'Test PSE'
    };

    const postData = JSON.stringify(psePayment);
    
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/mercadopago/process-payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, postData);

    if (response.status === 200 || response.status === 201) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - PSE funciona correctamente`);
      console.log(`   ${colors.blue}ℹ  Payment ID:${colors.reset} ${response.data.id || 'N/A'}`);
      console.log(`   ${colors.blue}ℹ  Estado:${colors.reset} ${response.data.status || 'N/A'}`);
      results.push({ method: 'PSE', status: 'PASSED' });
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.push({ method: 'PSE', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // RESUMEN
  // ==========================================
  console.log(`${colors.blue}${colors.bold}`);
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(60));
  console.log(`${colors.reset}\n`);

  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
    const color = result.status === 'PASSED' ? colors.green : result.status === 'PARTIAL' ? colors.yellow : colors.red;
    console.log(`${icon} ${color}${result.status}${colors.reset} - ${result.method}`);
  });

  const passed = results.filter(r => r.status === 'PASSED').length;
  const total = results.length;

  console.log(`\n${colors.bold}Total:${colors.reset} ${passed}/${total} métodos funcionando`);
  
  if (passed === total) {
    console.log(`\n${colors.green}${colors.bold}🎉 ¡TODOS LOS MÉTODOS DE PAGO FUNCIONAN!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Algunos métodos requieren verificación${colors.reset}\n`);
  }

  console.log('═'.repeat(60));
  console.log('');
}

// Ejecutar tests
testPaymentMethods().catch(error => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
