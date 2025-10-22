// Script de diagnóstico para MercadoPago en producción
console.log('🔍 Diagnosticando configuración de MercadoPago en producción...\n');

// Función para probar endpoint
async function testEndpoint(url, data = null) {
  try {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      status: response.status,
      success: response.ok,
      data: result
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runDiagnostics() {
  console.log('🧪 Probando endpoints de MercadoPago...\n');
  
  // 1. Probar endpoint process-payment (GET para ver configuración)
  console.log('1️⃣ Probando /api/mercadopago/process-payment (GET)...');
  const processPaymentGet = await testEndpoint('http://localhost:3000/api/mercadopago/process-payment');
  console.log('   Status:', processPaymentGet.status);
  console.log('   Success:', processPaymentGet.success);
  console.log('   Response:', JSON.stringify(processPaymentGet.data, null, 2));
  console.log('');
  
  // 2. Probar endpoint create-pse-payment (GET para ver configuración)
  console.log('2️⃣ Probando /api/mercadopago/create-pse-payment (GET)...');
  const psePaymentGet = await testEndpoint('http://localhost:3000/api/mercadopago/create-pse-payment');
  console.log('   Status:', psePaymentGet.status);
  console.log('   Success:', psePaymentGet.success);
  console.log('   Response:', JSON.stringify(psePaymentGet.data, null, 2));
  console.log('');
  
  // 3. Probar process-payment con datos de tarjeta de prueba
  console.log('3️⃣ Probando /api/mercadopago/process-payment (POST) con datos de tarjeta...');
  const cardPaymentData = {
    transaction_amount: 10000,
    token: "TEST_TOKEN_12345",
    payment_method_id: "visa",
    installments: 1,
    payer: {
      email: "test@bisonteapp.com"
    },
    description: "Pago de prueba - Diagnóstico"
  };
  
  const processPaymentPost = await testEndpoint('http://localhost:3000/api/mercadopago/process-payment', cardPaymentData);
  console.log('   Status:', processPaymentPost.status);
  console.log('   Success:', processPaymentPost.success);
  console.log('   Response:', JSON.stringify(processPaymentPost.data, null, 2));
  console.log('');
  
  // 4. Diagnóstico de variables de entorno
  console.log('4️⃣ Verificando variables de entorno...');
  
  // Simular el endpoint para ver qué variables se están leyendo
  const envTest = await testEndpoint('http://localhost:3000/api/mercadopago/process-payment');
  if (envTest.data && envTest.data.error && envTest.data.error.includes('configurado')) {
    console.log('❌ ERROR DE CONFIGURACIÓN DETECTADO');
    console.log('   El endpoint no puede encontrar las credenciales de producción');
    
    console.log('\n📋 Recomendaciones:');
    console.log('   1. Verificar que las variables estén correctamente definidas en .env.local');
    console.log('   2. Reiniciar el servidor Next.js (npm run dev)');
    console.log('   3. Verificar que MP_ENVIRONMENT=production');
    console.log('   4. Verificar que MP_ACCESS_TOKEN_PROD tenga el valor correcto');
  }
  
  console.log('\n✅ Diagnóstico completado');
}

// Ejecutar diagnóstico
runDiagnostics();