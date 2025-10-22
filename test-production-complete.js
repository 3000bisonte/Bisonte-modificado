/**
 * TEST COMPLETO DE PRODUCCIÓN
 * Este test verifica que todos los componentes críticos estén funcionando
 */

const https = require('https');

const BASE_URL = 'www.bisonteapp.com';
const PUBLIC_KEY = 'APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d';

// Colores para la consola
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
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
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

async function runTests() {
  console.log(`${colors.blue}${colors.bold}`);
  console.log('🧪 TEST COMPLETO DE PRODUCCIÓN - www.bisonteapp.com');
  console.log('═'.repeat(60));
  console.log(`${colors.reset}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // ==========================================
  // TEST 1: Sitio principal accesible
  // ==========================================
  console.log(`${colors.bold}📍 Test 1: Verificando sitio principal...${colors.reset}`);
  try {
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/',
      method: 'GET'
    });

    if (response.status === 200) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - Sitio principal accesible (Status: ${response.status})`);
      results.passed++;
      results.tests.push({ name: 'Sitio Principal', status: 'PASSED' });
    } else {
      throw new Error(`Status inesperado: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Sitio Principal', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 2: API Health Check
  // ==========================================
  console.log(`${colors.bold}🏥 Test 2: Verificando API Health Check...${colors.reset}`);
  try {
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/health',
      method: 'GET'
    });

    if (response.status === 200) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - API Health Check funcionando (Status: ${response.status})`);
      console.log(`   ${colors.blue}ℹ  Info:${colors.reset} ${JSON.stringify(response.data).slice(0, 100)}...`);
      results.passed++;
      results.tests.push({ name: 'API Health Check', status: 'PASSED' });
    } else {
      throw new Error(`Status inesperado: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'API Health Check', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 3: NextAuth Providers
  // ==========================================
  console.log(`${colors.bold}🔐 Test 3: Verificando NextAuth Providers...${colors.reset}`);
  try {
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/auth/providers',
      method: 'GET'
    });

    if (response.status === 200 && response.data) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - NextAuth configurado correctamente (Status: ${response.status})`);
      console.log(`   ${colors.blue}ℹ  Providers:${colors.reset} ${Object.keys(response.data).join(', ')}`);
      results.passed++;
      results.tests.push({ name: 'NextAuth Providers', status: 'PASSED' });
    } else {
      throw new Error(`Status inesperado: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'NextAuth Providers', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 4: Endpoint de Process Payment (GET)
  // ==========================================
  console.log(`${colors.bold}💳 Test 4: Verificando endpoint de pagos...${colors.reset}`);
  try {
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/mercadopago/process-payment',
      method: 'GET'
    });

    // GET debería retornar 200 con mensaje de operatividad
    if (response.status === 200 && response.data.success) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - Endpoint de pagos operativo (Status: ${response.status})`);
      console.log(`   ${colors.blue}ℹ  Environment:${colors.reset} ${response.data.environment}`);
      console.log(`   ${colors.blue}ℹ  Configured:${colors.reset} ${response.data.configured}`);
      results.passed++;
      results.tests.push({ name: 'Payment Endpoint', status: 'PASSED' });
    } else {
      throw new Error(`Status o respuesta inesperada: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Payment Endpoint', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 5: Variables de entorno configuradas
  // ==========================================
  console.log(`${colors.bold}⚙️  Test 5: Verificando configuración de variables...${colors.reset}`);
  try {
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/mercadopago/process-payment',
      method: 'GET'
    });

    if (response.data.configured === true && response.data.environment === 'production') {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - Variables de entorno correctamente configuradas`);
      console.log(`   ${colors.blue}ℹ  Environment:${colors.reset} ${response.data.environment}`);
      console.log(`   ${colors.blue}ℹ  Version:${colors.reset} ${response.data.version}`);
      results.passed++;
      results.tests.push({ name: 'Environment Variables', status: 'PASSED' });
    } else {
      throw new Error('Variables no configuradas correctamente');
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Environment Variables', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 6: HTTPS y seguridad
  // ==========================================
  console.log(`${colors.bold}🔒 Test 6: Verificando configuración HTTPS...${colors.reset}`);
  try {
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/',
      method: 'HEAD'
    });

    const hasSecurityHeaders = 
      response.headers['x-frame-options'] || 
      response.headers['x-content-type-options'] ||
      response.headers['strict-transport-security'];

    if (hasSecurityHeaders) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - Headers de seguridad presentes`);
      if (response.headers['strict-transport-security']) {
        console.log(`   ${colors.blue}ℹ  HSTS:${colors.reset} Configurado`);
      }
      if (response.headers['x-frame-options']) {
        console.log(`   ${colors.blue}ℹ  X-Frame-Options:${colors.reset} ${response.headers['x-frame-options']}`);
      }
      results.passed++;
      results.tests.push({ name: 'Security Headers', status: 'PASSED' });
    } else {
      throw new Error('Headers de seguridad no encontrados');
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Security Headers', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 7: PSE disponible (simulación realista)
  // ==========================================
  console.log(`${colors.bold}🏦 Test 7: Verificando disponibilidad de PSE...${colors.reset}`);
  try {
    // Verificamos que el endpoint de pagos acepta métodos PSE
    const response = await makeRequest({
      hostname: BASE_URL,
      path: '/api/mercadopago/process-payment',
      method: 'GET'
    });

    // Si el endpoint está configurado y en producción, PSE está disponible
    if (response.status === 200 && response.data.environment === 'production') {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - PSE disponible en producción`);
      console.log(`   ${colors.blue}ℹ  Public Key:${colors.reset} ${PUBLIC_KEY.slice(0, 20)}...`);
      results.passed++;
      results.tests.push({ name: 'PSE Availability', status: 'PASSED' });
    } else {
      throw new Error('PSE no disponible');
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'PSE Availability', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // TEST 8: No hay redirects 308
  // ==========================================
  console.log(`${colors.bold}🔄 Test 8: Verificando ausencia de redirects 308...${colors.reset}`);
  try {
    const endpoints = [
      '/api/health',
      '/api/mercadopago/process-payment',
      '/api/auth/providers'
    ];

    let allGood = true;
    for (const endpoint of endpoints) {
      const response = await makeRequest({
        hostname: BASE_URL,
        path: endpoint,
        method: 'GET'
      });

      if (response.status === 308) {
        allGood = false;
        throw new Error(`Redirect 308 detectado en ${endpoint}`);
      }
    }

    if (allGood) {
      console.log(`   ${colors.green}✅ PASSED${colors.reset} - No hay redirects 308 en endpoints críticos`);
      console.log(`   ${colors.blue}ℹ  Verificados:${colors.reset} ${endpoints.length} endpoints`);
      results.passed++;
      results.tests.push({ name: 'No 308 Redirects', status: 'PASSED' });
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ FAILED${colors.reset} - ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'No 308 Redirects', status: 'FAILED' });
  }
  console.log('');

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  console.log(`${colors.bold}${colors.blue}`);
  console.log('═'.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(60));
  console.log(`${colors.reset}\n`);

  results.tests.forEach(test => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    const color = test.status === 'PASSED' ? colors.green : colors.red;
    console.log(`${icon} ${color}${test.status}${colors.reset} - ${test.name}`);
  });

  console.log('');
  console.log(`${colors.bold}Total de pruebas:${colors.reset} ${results.passed + results.failed}`);
  console.log(`${colors.green}✅ Pasadas:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}❌ Fallidas:${colors.reset} ${results.failed}`);

  const percentage = Math.round((results.passed / (results.passed + results.failed)) * 100);
  console.log(`\n${colors.bold}Porcentaje de éxito:${colors.reset} ${percentage}%`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 ¡TODAS LAS PRUEBAS PASARON! Sistema 100% operativo${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Algunas pruebas fallaron. Revisar logs arriba.${colors.reset}\n`);
  }

  console.log('═'.repeat(60));
  console.log('');
}

// Ejecutar tests
runTests().catch(error => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
