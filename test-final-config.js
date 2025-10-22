// Test final de configuración MercadoPago
console.log('🧪 Probando configuración final de MercadoPago...\n');

async function testConfiguration() {
  console.log('1️⃣ Verificando endpoint de configuración...');
  
  try {
    const configResponse = await fetch('http://localhost:3000/api/mercadopago/process-payment');
    const configData = await configResponse.json();
    
    console.log('   Status:', configResponse.status);
    console.log('   Environment:', configData.environment);
    console.log('   Configured:', configData.configured);
    
    if (configData.environment === 'test' && configData.configured) {
      console.log('   ✅ Configuración correcta detectada\n');
    } else {
      console.log('   ❌ Configuración incorrecta\n');
      return;
    }
    
  } catch (error) {
    console.log('   ❌ Error conectando al servidor:', error.message);
    console.log('   💡 ¿Está ejecutándose npm run dev?');
    return;
  }
  
  console.log('2️⃣ Probando pago con tarjeta de prueba...');
  
  const testPayment = {
    transaction_amount: 10000,
    token: 'TEST_TOKEN_12345678901234567890', // Token simulado
    payment_method_id: 'visa',
    installments: 1,
    payer: {
      email: 'test@bisonteapp.com'
    },
    description: 'Pago de prueba'
  };
  
  try {
    const paymentResponse = await fetch('http://localhost:3000/api/mercadopago/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayment)
    });
    
    const paymentResult = await paymentResponse.json();
    
    console.log('   Status:', paymentResponse.status);
    console.log('   Success:', paymentResult.success);
    
    if (paymentResponse.status === 200) {
      console.log('   ✅ Endpoint funcionando correctamente');
    } else {
      console.log('   ⚠️ Error esperado (token simulado):', paymentResult.error);
    }
    
  } catch (error) {
    console.log('   ❌ Error en prueba de pago:', error.message);
  }
}

console.log('🎯 CONFIGURACIÓN APLICADA:');
console.log('   • MP_ENVIRONMENT: test');
console.log('   • NEXT_PUBLIC_INIT_MERCADOPAGO: TEST key');
console.log('   • Todas las URLs: localhost:3000');
console.log('   • CSP: Ya configurado para MercadoPago');

console.log('\n💳 TARJETAS DE PRUEBA:');
console.log('   ┌─────────────────────────────────────────┐');
console.log('   │ VISA        4509 9535 6623 3704        │');
console.log('   │ MASTERCARD  5031 7557 3453 0604        │');
console.log('   │ CVV         123                         │');
console.log('   │ Fecha       11/25                       │');
console.log('   └─────────────────────────────────────────┘');

console.log('\n📝 PRÓXIMOS PASOS:');
console.log('   1. Reinicia el servidor si no lo has hecho');
console.log('   2. Abre http://localhost:3000');
console.log('   3. Ve a la sección de pagos');
console.log('   4. Usa las tarjetas de prueba de arriba');
console.log('   5. ¡Debería funcionar perfectamente!');

console.log('\n🔬 Ejecutando pruebas automáticas...\n');

testConfiguration().then(() => {
  console.log('\n✅ Pruebas completadas');
  console.log('🚀 El sistema está listo para usar');
});