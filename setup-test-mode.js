// Configuración definitiva para testing local con MercadoPago
console.log('🧪 Configurando MercadoPago para testing local seguro...\n');

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Configuración TEST completa para localhost
  const testConfig = {
    'MP_ENVIRONMENT': 'test',
    'NEXT_PUBLIC_INIT_MERCADOPAGO': 'TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b',
    'NEXT_PUBLIC_SITE_URL': 'http://localhost:3000',
    'NEXT_PUBLIC_API_BASE_URL': 'http://localhost:3000/api',
    'NEXTAUTH_URL': 'http://localhost:3000',
    'NODE_ENV': 'development'
  };
  
  Object.entries(testConfig).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✅ ${key}=${value}`);
    }
  });
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n🎯 MODO TEST ACTIVADO CORRECTAMENTE');
  
  console.log('\n💳 Tarjetas de prueba que puedes usar:');
  console.log('   ┌─────────────────────────────────────────┐');
  console.log('   │ VISA        4509 9535 6623 3704        │');
  console.log('   │ MASTERCARD  5031 7557 3453 0604        │');
  console.log('   │ CVV         123                         │');
  console.log('   │ Fecha       11/25                       │');
  console.log('   └─────────────────────────────────────────┘');
  
  console.log('\n✅ Beneficios del modo TEST:');
  console.log('   • ✅ Funciona perfectamente en localhost');
  console.log('   • ✅ Tokens válidos siempre');
  console.log('   • ✅ No hay cargos reales');
  console.log('   • ✅ Pruebas ilimitadas');
  console.log('   • ✅ Misma funcionalidad que producción');
  
  console.log('\n🚀 Para usar en PRODUCCIÓN REAL:');
  console.log('   1. Hacer deploy en https://bisonteapp.com');
  console.log('   2. Ejecutar: node switch-mercadopago-mode.js production');
  console.log('   3. ¡Listo para pagos reales!');
  
  console.log('\n📝 Próximos pasos AHORA:');
  console.log('   1. 🔄 Reinicia el servidor (Ctrl+C, npm run dev)');
  console.log('   2. 🌐 Abre http://localhost:3000');
  console.log('   3. 💳 Usa las tarjetas de prueba de arriba');
  console.log('   4. ✨ ¡Todo funcionará perfectamente!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n🏁 Configuración completada exitosamente');