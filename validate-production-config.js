// Script para validar la configuración de producción
const fs = require('fs');
const path = require('path');

console.log('🔍 Validando configuración de producción...\n');

// Leer archivo .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extraer valores importantes
const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1] : null;
};

const config = {
  MP_ENVIRONMENT: getEnvValue('MP_ENVIRONMENT'),
  MP_ACCESS_TOKEN_PROD: getEnvValue('MP_ACCESS_TOKEN_PROD'),
  NEXT_PUBLIC_MP_PUBLIC_KEY_PROD: getEnvValue('NEXT_PUBLIC_MP_PUBLIC_KEY_PROD'),
  NEXT_PUBLIC_INIT_MERCADOPAGO: getEnvValue('NEXT_PUBLIC_INIT_MERCADOPAGO'),
  NODE_ENV: getEnvValue('NODE_ENV'),
  NEXTAUTH_URL: getEnvValue('NEXTAUTH_URL'),
  NEXT_PUBLIC_SITE_URL: getEnvValue('NEXT_PUBLIC_SITE_URL'),
  BASE_URL: getEnvValue('BASE_URL')
};

console.log('📋 Configuración actual:');
console.log('─'.repeat(50));

// Validar MercadoPago
console.log('💳 MercadoPago:');
console.log(`   Ambiente: ${config.MP_ENVIRONMENT}`);
console.log(`   Token de acceso (prod): ${config.MP_ACCESS_TOKEN_PROD ? '✅ Configurado' : '❌ Faltante'}`);
console.log(`   Clave pública (prod): ${config.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD ? '✅ Configurada' : '❌ Faltante'}`);
console.log(`   Inicialización: ${config.NEXT_PUBLIC_INIT_MERCADOPAGO}`);

const isUsingProductionKey = config.NEXT_PUBLIC_INIT_MERCADOPAGO === config.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD;
console.log(`   Usando clave de producción: ${isUsingProductionKey ? '✅ Sí' : '❌ No'}`);

console.log('\n🌐 URLs y Dominio:');
console.log(`   NODE_ENV: ${config.NODE_ENV}`);
console.log(`   NEXTAUTH_URL: ${config.NEXTAUTH_URL}`);
console.log(`   NEXT_PUBLIC_SITE_URL: ${config.NEXT_PUBLIC_SITE_URL}`);
console.log(`   BASE_URL: ${config.BASE_URL}`);

// Validaciones críticas
console.log('\n🔍 Validaciones críticas:');
const validations = [
  {
    name: 'Ambiente de MercadoPago es producción',
    passed: config.MP_ENVIRONMENT === 'production'
  },
  {
    name: 'Credenciales de producción están configuradas',
    passed: config.MP_ACCESS_TOKEN_PROD && config.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD
  },
  {
    name: 'Se está usando la clave pública de producción',
    passed: isUsingProductionKey
  },
  {
    name: 'URLs apuntan a producción (bisonteapp.com)',
    passed: config.NEXTAUTH_URL.includes('bisonteapp.com') && config.NEXT_PUBLIC_SITE_URL.includes('bisonteapp.com')
  },
  {
    name: 'NODE_ENV está en producción',
    passed: config.NODE_ENV === 'production'
  }
];

validations.forEach(validation => {
  const status = validation.passed ? '✅' : '❌';
  console.log(`   ${status} ${validation.name}`);
});

const allPassed = validations.every(v => v.passed);
console.log(`\n${allPassed ? '🎉' : '⚠️'} Estado general: ${allPassed ? 'LISTO PARA PRODUCCIÓN' : 'NECESITA CORRECCIONES'}`);

if (!allPassed) {
  console.log('\n📝 Acciones requeridas:');
  validations.filter(v => !v.passed).forEach(v => {
    console.log(`   • ${v.name}`);
  });
}

console.log('\n─'.repeat(50));
console.log('✅ Validación completada');