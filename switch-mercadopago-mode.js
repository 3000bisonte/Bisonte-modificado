// Script para alternar entre modo test y producción
console.log('🔧 Configurador de MercadoPago - Test vs Producción\n');

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

function updateEnvFile(changes) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    Object.entries(changes).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`✅ Actualizado: ${key}=${value}`);
      } else {
        console.log(`⚠️ No encontrado: ${key}`);
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('📝 Archivo .env.local actualizado');
  } catch (error) {
    console.error('❌ Error actualizando .env.local:', error.message);
  }
}

function getCurrentMode() {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const mpEnvironment = envContent.match(/^MP_ENVIRONMENT=(.*)$/m)?.[1];
    return mpEnvironment || 'unknown';
  } catch (error) {
    return 'error';
  }
}

function switchToTestMode() {
  console.log('🧪 Cambiando a modo TEST...');
  
  const changes = {
    'MP_ENVIRONMENT': 'test',
    'NEXT_PUBLIC_INIT_MERCADOPAGO': 'TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b',
    'NEXT_PUBLIC_SITE_URL': 'http://localhost:3000',
    'NEXT_PUBLIC_API_BASE_URL': 'http://localhost:3000/api',
    'NEXT_PUBLIC_API_SERVER_URL': 'http://localhost:3000',
    'NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN': 'http://localhost:3000',
    'NEXT_PUBLIC_API_URL': 'http://localhost:3000/api',
    'FALLBACK_API_BASE_URL': 'http://localhost:3000/api',
    'BASE_URL': 'http://localhost:3000/api',
    'NODE_ENV': 'development'
  };
  
  updateEnvFile(changes);
  
  console.log('\n✅ MODO TEST ACTIVADO');
  console.log('💳 Ahora puedes usar tarjetas de prueba:');
  console.log('   • Visa: 4509 9535 6623 3704');
  console.log('   • Mastercard: 5031 7557 3453 0604');
  console.log('   • CVV: 123');
  console.log('   • Fecha: 11/25');
}

function switchToProductionMode() {
  console.log('🚀 Cambiando a modo PRODUCCIÓN...');
  
  const changes = {
    'MP_ENVIRONMENT': 'production',
    'NEXT_PUBLIC_INIT_MERCADOPAGO': 'APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d',
    'NEXT_PUBLIC_SITE_URL': 'https://www.bisonteapp.com',
    'NEXT_PUBLIC_API_BASE_URL': 'https://www.bisonteapp.com/api',
    'NEXT_PUBLIC_API_SERVER_URL': 'https://www.bisonteapp.com',
    'NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN': 'https://www.bisonteapp.com',
    'NEXT_PUBLIC_API_URL': 'https://www.bisonteapp.com/api',
    'FALLBACK_API_BASE_URL': 'https://www.bisonteapp.com/api',
    'BASE_URL': 'https://www.bisonteapp.com/api',
    'NODE_ENV': 'production'
  };
  
  updateEnvFile(changes);
  
  console.log('\n✅ MODO PRODUCCIÓN ACTIVADO');
  console.log('⚠️ IMPORTANTE: Para que funcione correctamente:');
  console.log('   • Debes acceder desde: https://www.bisonteapp.com');
  console.log('   • NO funcionará desde localhost en modo producción');
  console.log('   • Usa tarjetas reales (se cobrarán)');
}

// Detectar modo actual
const currentMode = getCurrentMode();
console.log(`📊 Modo actual: ${currentMode.toUpperCase()}\n`);

// Obtener argumento de línea de comandos
const mode = process.argv[2];

if (mode === 'test') {
  switchToTestMode();
} else if (mode === 'prod' || mode === 'production') {
  switchToProductionMode();
} else {
  console.log('📋 USO:');
  console.log('   node switch-mercadopago-mode.js test        # Cambiar a modo test');
  console.log('   node switch-mercadopago-mode.js production  # Cambiar a modo producción');
  console.log('');
  console.log('💡 RECOMENDACIÓN ACTUAL:');
  
  if (currentMode === 'production') {
    console.log('   🧪 Usa modo TEST para probar en localhost:');
    console.log('   node switch-mercadopago-mode.js test');
  } else {
    console.log('   🚀 Usa modo PRODUCCIÓN para deploy real:');
    console.log('   node switch-mercadopago-mode.js production');
  }
}

console.log('\n📝 Después del cambio:');
console.log('   1. Reinicia el servidor (npm run dev)');
console.log('   2. Recarga la página en el navegador');
console.log('   3. Prueba los pagos');