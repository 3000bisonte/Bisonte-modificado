/**
 * Script de Verificación de Mercado Pago
 * Ejecuta: node verify-mercadopago.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Verificando Configuración de Mercado Pago...\n');

const checks = [];

// 1. Verificar MP_ENVIRONMENT
const mpEnvironment = process.env.MP_ENVIRONMENT;
if (mpEnvironment) {
  if (mpEnvironment === 'test' || mpEnvironment === 'production') {
    checks.push({ name: 'MP_ENVIRONMENT', status: '✅', value: mpEnvironment });
  } else {
    checks.push({ name: 'MP_ENVIRONMENT', status: '⚠️', value: `${mpEnvironment} (debe ser 'test' o 'production')` });
  }
} else {
  checks.push({ name: 'MP_ENVIRONMENT', status: '❌', value: 'No configurado' });
}

// 2. Verificar Access Tokens
const testToken = process.env.MP_ACCESS_TOKEN_TEST;
const prodToken = process.env.MP_ACCESS_TOKEN_PROD;

if (testToken && testToken.startsWith('TEST-')) {
  checks.push({ name: 'MP_ACCESS_TOKEN_TEST', status: '✅', value: `${testToken.substring(0, 20)}...` });
} else {
  checks.push({ name: 'MP_ACCESS_TOKEN_TEST', status: '❌', value: testToken || 'No configurado' });
}

if (prodToken && prodToken.startsWith('APP_USR-')) {
  checks.push({ name: 'MP_ACCESS_TOKEN_PROD', status: '✅', value: `${prodToken.substring(0, 20)}...` });
} else {
  checks.push({ name: 'MP_ACCESS_TOKEN_PROD', status: '⚠️', value: prodToken || 'No configurado' });
}

// 3. Verificar Public Keys
const testPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST;
const prodPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD;

if (testPublicKey && testPublicKey.startsWith('TEST-')) {
  checks.push({ name: 'NEXT_PUBLIC_MP_PUBLIC_KEY_TEST', status: '✅', value: `${testPublicKey.substring(0, 20)}...` });
} else {
  checks.push({ name: 'NEXT_PUBLIC_MP_PUBLIC_KEY_TEST', status: '❌', value: testPublicKey || 'No configurado' });
}

if (prodPublicKey && prodPublicKey.startsWith('APP_USR-')) {
  checks.push({ name: 'NEXT_PUBLIC_MP_PUBLIC_KEY_PROD', status: '✅', value: `${prodPublicKey.substring(0, 20)}...` });
} else {
  checks.push({ name: 'NEXT_PUBLIC_MP_PUBLIC_KEY_PROD', status: '⚠️', value: prodPublicKey || 'No configurado' });
}

// 4. Verificar NEXT_PUBLIC_INIT_MERCADOPAGO
const initMercadoPago = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;
if (initMercadoPago) {
  const isTest = initMercadoPago.startsWith('TEST-');
  const isProd = initMercadoPago.startsWith('APP_USR-');
  
  if (isTest || isProd) {
    const expectedKey = mpEnvironment === 'test' ? testPublicKey : prodPublicKey;
    if (initMercadoPago === expectedKey) {
      checks.push({ name: 'NEXT_PUBLIC_INIT_MERCADOPAGO', status: '✅', value: `Coincide con ${mpEnvironment}` });
    } else {
      checks.push({ name: 'NEXT_PUBLIC_INIT_MERCADOPAGO', status: '⚠️', value: `No coincide con el ambiente ${mpEnvironment}` });
    }
  } else {
    checks.push({ name: 'NEXT_PUBLIC_INIT_MERCADOPAGO', status: '❌', value: 'Formato inválido' });
  }
} else {
  checks.push({ name: 'NEXT_PUBLIC_INIT_MERCADOPAGO', status: '❌', value: 'No configurado' });
}

// Mostrar resultados
console.log('📋 Resultados de la Verificación:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
  console.log(`   → ${check.value}\n`);
});

// Resumen
const hasErrors = checks.some(c => c.status === '❌');
const hasWarnings = checks.some(c => c.status === '⚠️');

console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('\n❌ ERROR: Hay configuraciones faltantes o incorrectas.');
  console.log('\n📝 Acciones requeridas:');
  console.log('   1. Verifica tu archivo .env.local');
  console.log('   2. Obtén las credenciales correctas desde:');
  console.log('      https://www.mercadopago.com.co/developers/panel');
  console.log('   3. Reinicia el servidor después de actualizar .env.local');
  console.log('\n📄 Lee el archivo SOLUCION_ERROR_MERCADOPAGO.md para más detalles.\n');
} else if (hasWarnings) {
  console.log('\n⚠️  ADVERTENCIA: Algunas configuraciones opcionales no están completas.');
  console.log('   Esto puede ser normal si solo usas el modo de prueba.\n');
} else {
  console.log('\n✅ ÉXITO: ¡Todas las configuraciones de Mercado Pago están correctas!');
  console.log('\n🚀 Próximos pasos:');
  console.log('   1. Asegúrate de que el servidor esté corriendo: npm run dev');
  console.log('   2. Prueba el pago con una tarjeta de prueba');
  console.log('   3. Verifica los logs en la consola del navegador (F12)\n');
}
console.log('='.repeat(60) + '\n');

// Verificar conexión con la API de Mercado Pago
console.log('🌐 Verificando conexión con Mercado Pago API...\n');

const token = mpEnvironment === 'test' ? testToken : prodToken;

if (token) {
  // Hacer una petición simple para verificar el token
  fetch('https://api.mercadopago.com/v1/payment_methods', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (response.ok) {
        console.log('✅ Conexión exitosa con Mercado Pago API');
        console.log('✅ El Access Token es válido\n');
        return response.json();
      } else {
        console.log('❌ Error al conectar con Mercado Pago API');
        console.log(`   Status: ${response.status}`);
        console.log('   Posible causa: Access Token inválido o expirado\n');
        console.log('🔧 Solución: Obtén nuevas credenciales desde:');
        console.log('   https://www.mercadopago.com.co/developers/panel\n');
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .then(data => {
      console.log(`📊 Métodos de pago disponibles: ${data.length}`);
      const creditCards = data.filter(pm => pm.payment_type_id === 'credit_card');
      console.log(`💳 Tarjetas de crédito soportadas: ${creditCards.length}\n`);
    })
    .catch(error => {
      console.error('❌ Error de conexión:', error.message);
      console.log('\n📝 Verifica:');
      console.log('   1. Tu conexión a internet');
      console.log('   2. Que las credenciales sean correctas');
      console.log('   3. Que tu cuenta de Mercado Pago esté activa\n');
    });
} else {
  console.log('⚠️  No se puede verificar la conexión: Falta el Access Token\n');
}
