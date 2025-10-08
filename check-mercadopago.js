#!/usr/bin/env node

/**
 * Script para verificar la configuración de Mercado Pago
 * Uso: node check-mercadopago.js
 */

const https = require('https');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name, value) {
  const exists = !!value;
  const icon = exists ? '✅' : '❌';
  const status = exists ? 'Configurado' : 'NO configurado';
  const color = exists ? 'green' : 'red';
  
  log(`${icon} ${name}: ${status}`, color);
  
  if (exists && value.length > 10) {
    const preview = `${value.substring(0, 15)}...${value.substring(value.length - 5)}`;
    log(`   Valor: ${preview}`, 'cyan');
  }
  
  return exists;
}

function detectEnvironment(accessToken) {
  if (!accessToken) return 'not_configured';
  if (accessToken.includes('APP_USR')) return 'production';
  if (accessToken.includes('TEST')) return 'test';
  return 'unknown';
}

async function checkMercadoPagoAPI(baseUrl) {
  return new Promise((resolve) => {
    const url = `${baseUrl}/api/mercadopago`;
    
    log(`\n🔍 Verificando endpoint: ${url}`, 'blue');
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          log('✅ Endpoint responde correctamente', 'green');
          log(`   Status: ${json.status}`, 'cyan');
          log(`   Configurado: ${json.configured?.all ? 'Sí' : 'No'}`, json.configured?.all ? 'green' : 'yellow');
          log(`   Ambiente: ${json.environment}`, json.environment === 'production' ? 'green' : 'yellow');
          resolve(json);
        } catch (error) {
          log('❌ Error parseando respuesta JSON', 'red');
          resolve(null);
        }
      });
    }).on('error', (error) => {
      log(`❌ Error conectando: ${error.message}`, 'red');
      resolve(null);
    });
  });
}

async function main() {
  log('═══════════════════════════════════════════════', 'blue');
  log('   🔍 Verificación de Mercado Pago', 'blue');
  log('═══════════════════════════════════════════════', 'blue');
  
  // Verificar variables de entorno locales
  log('\n📋 Variables de Entorno Locales:\n', 'yellow');
  
  const mpAccessToken = process.env.MP_ACCESS_TOKEN;
  const mpPublicKey = process.env.MP_PUBLIC_KEY;
  const mpInitKey = process.env.NEXT_PUBLIC_INIT_MERCADOPAGO;
  const urlBrickStatus = process.env.NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN;
  
  const hasAccessToken = checkEnvVar('MP_ACCESS_TOKEN', mpAccessToken);
  const hasPublicKey = checkEnvVar('MP_PUBLIC_KEY', mpPublicKey);
  const hasInitKey = checkEnvVar('NEXT_PUBLIC_INIT_MERCADOPAGO', mpInitKey);
  checkEnvVar('NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN', urlBrickStatus);
  
  const isFullyConfigured = hasAccessToken && hasPublicKey && hasInitKey;
  
  // Detectar ambiente
  log('\n🌍 Ambiente Detectado:\n', 'yellow');
  const environment = detectEnvironment(mpAccessToken);
  const envIcon = environment === 'production' ? '🚀' : environment === 'test' ? '🧪' : '⚠️';
  const envColor = environment === 'production' ? 'green' : environment === 'test' ? 'yellow' : 'red';
  log(`${envIcon} ${environment.toUpperCase()}`, envColor);
  
  // Resumen
  log('\n📊 Resumen:\n', 'yellow');
  if (isFullyConfigured) {
    log('✅ Mercado Pago está completamente configurado', 'green');
    
    if (environment === 'production') {
      log('✅ Usando credenciales de PRODUCCIÓN', 'green');
      log('⚠️  Los pagos serán REALES y se cobrará dinero real', 'yellow');
    } else if (environment === 'test') {
      log('🧪 Usando credenciales de TEST', 'yellow');
      log('✅ Los pagos son simulados (sin cargo real)', 'green');
    } else {
      log('⚠️  No se pudo detectar el tipo de credenciales', 'yellow');
    }
  } else {
    log('❌ Mercado Pago NO está completamente configurado', 'red');
    log('\n📝 Pasos para configurar:', 'yellow');
    log('1. Ve a: https://www.mercadopago.com.co/developers/panel', 'cyan');
    log('2. Crea o selecciona una aplicación', 'cyan');
    log('3. Obtén las credenciales (TEST o PRODUCCIÓN)', 'cyan');
    log('4. Agrega las variables en tu archivo .env.local', 'cyan');
    log('5. Reinicia el servidor de desarrollo', 'cyan');
  }
  
  // Verificar API si hay URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  if (siteUrl.startsWith('https://')) {
    await checkMercadoPagoAPI(siteUrl);
  } else {
    log('\n💡 Tip: Para verificar el endpoint en producción, ejecuta:', 'yellow');
    log(`   curl https://www.bisonteapp.com/api/mercadopago`, 'cyan');
  }
  
  log('\n═══════════════════════════════════════════════\n', 'blue');
  
  // Exit code
  process.exit(isFullyConfigured ? 0 : 1);
}

main().catch((error) => {
  log(`\n❌ Error ejecutando script: ${error.message}`, 'red');
  process.exit(1);
});
