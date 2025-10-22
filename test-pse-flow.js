// Script para probar el endpoint de PSE
console.log('🧪 Probando endpoint de PSE...\n');

// Datos de prueba para PSE
const testData = {
  amount: 50000, // $50,000 COP
  email: 'test@bisonteapp.com',
  document_type: 'CC',
  document_number: '12345678',
  financial_institution: '1040', // Banco Agrario
  description: 'Pago de prueba PSE - Bisonte Logística'
};

console.log('📋 Datos de prueba:', testData);

async function testPSEEndpoint() {
  try {
    console.log('\n🚀 Creando pago PSE...');
    
    const response = await fetch('http://localhost:3000/api/mercadopago/create-pse-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📥 Respuesta del servidor:');
    console.log('   Status:', response.status);
    console.log('   Success:', result.success);
    
    if (result.success) {
      console.log('✅ PSE creado exitosamente:');
      console.log('   Payment ID:', result.payment_id);
      console.log('   Status:', result.status);
      console.log('   Status Detail:', result.status_detail);
      console.log('   External Resource URL:', result.external_resource_url);
      console.log('   Callback URL:', result.callback_url);
      
      // Si obtuvimos una URL externa, simular la verificación
      if (result.payment_id) {
        console.log('\n🔍 Verificando estado del pago...');
        
        const verifyResponse = await fetch(`http://localhost:3000/api/mercadopago/verify-payment/${result.payment_id}`);
        const verifyResult = await verifyResponse.json();
        
        console.log('📊 Estado verificado:');
        console.log('   Success:', verifyResult.success);
        
        if (verifyResult.success) {
          console.log('   Payment Status:', verifyResult.payment.status);
          console.log('   Status Detail:', verifyResult.payment.status_detail);
          console.log('   Amount:', verifyResult.payment.transaction_amount);
        } else {
          console.log('   Error:', verifyResult.error);
        }
      }
      
    } else {
      console.log('❌ Error en PSE:');
      console.log('   Error:', result.error);
      if (result.details) {
        console.log('   Details:', result.details);
      }
      if (result.mercadopago_error) {
        console.log('   MercadoPago Error:', result.mercadopago_error);
      }
    }
    
  } catch (error) {
    console.error('💥 Error en la prueba:', error.message);
  }
}

async function testEndpointConfiguration() {
  try {
    console.log('\n🔧 Verificando configuración del endpoint...');
    
    const response = await fetch('http://localhost:3000/api/mercadopago/create-pse-payment');
    const result = await response.json();
    
    console.log('📋 Configuración:');
    console.log('   Success:', result.success);
    console.log('   Environment:', result.environment);
    console.log('   Configured:', result.configured);
    console.log('   Callback URL:', result.callback_url);
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  await testEndpointConfiguration();
  await testPSEEndpoint();
  
  console.log('\n✅ Pruebas completadas');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Verificar que el servidor esté ejecutándose');
  console.log('   2. Probar en un navegador el flujo completo');
  console.log('   3. Validar el callback después del pago');
}

runTests();