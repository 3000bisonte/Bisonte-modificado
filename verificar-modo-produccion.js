require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DE PRODUCCIÓN...\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Verificar variables de entorno
const environment = process.env.MP_ENVIRONMENT;
const accessToken = environment === 'production' 
  ? process.env.MP_ACCESS_TOKEN_PROD 
  : process.env.MP_ACCESS_TOKEN_TEST;
const publicKey = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;

console.log('📊 CONFIGURACIÓN ACTUAL:\n');
console.log(`   Ambiente: ${environment || '❌ NO CONFIGURADO'}`);
console.log(`   Access Token: ${accessToken ? accessToken.substring(0, 20) + '...' : '❌ NO ENCONTRADO'}`);
console.log(`   Public Key: ${publicKey ? publicKey.substring(0, 20) + '...' : '❌ NO ENCONTRADO'}`);

// Validar ambiente
console.log('\n═══════════════════════════════════════════════════════════════\n');
console.log('✅ VALIDACIÓN DE AMBIENTE:\n');

if (environment === 'production') {
  console.log('   ✅ MP_ENVIRONMENT está en PRODUCCIÓN');
  
  if (accessToken && accessToken.startsWith('APP_USR')) {
    console.log('   ✅ Access Token es de PRODUCCIÓN (empieza con APP_USR)');
  } else if (accessToken && accessToken.startsWith('TEST-')) {
    console.log('   ❌ ERROR: Access Token es de TEST pero ambiente es PRODUCCIÓN');
    console.log('   📝 Verifica tu .env.local');
  }
  
  if (publicKey && publicKey.startsWith('APP_USR')) {
    console.log('   ✅ Public Key es de PRODUCCIÓN (empieza con APP_USR)');
  } else if (publicKey && publicKey.startsWith('TEST-')) {
    console.log('   ❌ ERROR: Public Key es de TEST pero ambiente es PRODUCCIÓN');
    console.log('   📝 Verifica NEXT_PUBLIC_INIT_MERCADOPAGO en .env.local');
  }
  
} else if (environment === 'test') {
  console.log('   ⚠️  MP_ENVIRONMENT está en TEST (modo desarrollo)');
  console.log('   📝 Cambia a "production" para pagos reales');
  
  if (accessToken && accessToken.startsWith('TEST-')) {
    console.log('   ✅ Access Token es de TEST (correcto para desarrollo)');
  }
  
  if (publicKey && publicKey.startsWith('TEST-')) {
    console.log('   ✅ Public Key es de TEST (correcto para desarrollo)');
  }
  
} else {
  console.log('   ❌ MP_ENVIRONMENT no está configurado');
  console.log('   📝 Debe ser "test" o "production"');
}

// Verificar con API de Mercado Pago
console.log('\n═══════════════════════════════════════════════════════════════\n');
console.log('🔗 VERIFICANDO CONEXIÓN CON MERCADO PAGO...\n');

fetch('https://api.mercadopago.com/v1/payment_methods', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.then(data => {
  console.log('   ✅ Conexión exitosa con Mercado Pago API\n');
  console.log(`   📊 Métodos de pago disponibles: ${data.length}\n`);
  
  // Verificar PSE
  const pse = data.find(m => m.id === 'pse');
  const efecty = data.find(m => m.id === 'efecty');
  const tarjetas = data.filter(m => m.payment_type_id === 'credit_card' || m.payment_type_id === 'debit_card');
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('💳 MÉTODOS DE PAGO ACTIVOS:\n');
  
  console.log(`   💳 Tarjetas: ${tarjetas.length} tipos`);
  tarjetas.forEach(t => console.log(`      • ${t.name} (${t.id})`));
  
  if (pse) {
    console.log(`\n   🏦 PSE: ✅ ACTIVO`);
    console.log(`      • Estado: ${pse.status}`);
    console.log(`      • Min: $${pse.min_allowed_amount?.toLocaleString('es-CO')}`);
    console.log(`      • Max: $${pse.max_allowed_amount?.toLocaleString('es-CO')}`);
  } else {
    console.log(`\n   🏦 PSE: ❌ NO DISPONIBLE`);
  }
  
  if (efecty) {
    console.log(`\n   🎫 Efecty: ✅ ACTIVO`);
    console.log(`      • Estado: ${efecty.status}`);
  } else {
    console.log(`\n   🎫 Efecty: ❌ NO DISPONIBLE`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  
  // Resumen final
  if (environment === 'production') {
    console.log('🚀 RESUMEN: MODO PRODUCCIÓN ACTIVO\n');
    console.log('   ⚠️  IMPORTANTE:\n');
    console.log('   • Los pagos procesados serán REALES');
    console.log('   • Se cobrará dinero de las cuentas de usuarios');
    console.log('   • Mercado Pago cobrará comisiones por cada transacción');
    console.log('   • PSE funcionará con bancos reales');
    console.log('   • Efecty generará cupones reales\n');
    console.log('   ✅ Métodos activos:');
    console.log(`      • ${tarjetas.length} tipos de tarjetas`);
    if (pse) console.log('      • PSE (transferencias bancarias)');
    if (efecty) console.log('      • Efecty (pago en efectivo)');
    console.log('\n   📝 RECOMENDACIÓN:');
    console.log('   1. Reinicia el servidor: npm run dev');
    console.log('   2. Haz una prueba con tu propia cuenta MP');
    console.log('   3. Verifica que el flujo completo funcione');
    console.log('   4. Configura webhooks en tu panel de MP\n');
    
  } else {
    console.log('🧪 RESUMEN: MODO TEST/DESARROLLO ACTIVO\n');
    console.log('   ℹ️  Información:\n');
    console.log('   • Solo tarjetas de prueba funcionarán');
    console.log('   • NO se procesarán pagos reales');
    console.log('   • PSE y Efecty solo simulan transacciones');
    console.log('   • Ideal para desarrollo y testing\n');
    console.log('   💡 Para activar pagos reales:');
    console.log('   1. Cambia MP_ENVIRONMENT=production en .env.local');
    console.log('   2. Actualiza NEXT_PUBLIC_INIT_MERCADOPAGO con tu Public Key de producción');
    console.log('   3. Reinicia el servidor\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
})
.catch(error => {
  console.error('   ❌ Error al conectar con Mercado Pago:', error.message);
  console.error('\n   📝 Posibles causas:');
  console.error('   • Access Token inválido');
  console.error('   • Credenciales incorrectas en .env.local');
  console.error('   • Problema de conexión a internet');
  console.error('   • API de Mercado Pago temporalmente no disponible\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
});
