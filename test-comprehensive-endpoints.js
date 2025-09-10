#!/usr/bin/env node

// COMPREHENSIVE API ENDPOINT TESTING SCRIPT - 30+ ENDPOINTS
const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

// Comprehensive test suite with all available endpoints
const testSuites = {
  
  // === SYSTEM ENDPOINTS === //
  system: [
    { path: '/health', method: 'GET', description: 'Health check endpoint' },
    { path: '/ping', method: 'GET', description: 'Ping connectivity test' },
    { path: '/status', method: 'GET', description: 'System status information' },
    { path: '/config', method: 'GET', description: 'Application configuration' },
    { path: '/metrics', method: 'GET', description: 'System performance metrics' }
  ],

  // === AUTHENTICATION ENDPOINTS === //
  authentication: [
    {
      path: '/auth/register',
      method: 'POST',
      description: 'New user registration (NextAuth)',
      body: {
        email: `test_nextauth_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        nombre: 'NextAuth Test User',
        celular: '1234567890',
        ciudad: 'Test City NextAuth'
      }
    },
    {
      path: '/register',
      method: 'POST',
      description: 'Legacy user registration endpoint',
      body: {
        email: `test_legacy_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        nombre: 'Legacy Test User',
        celular: '0987654321',
        ciudad: 'Legacy Test City'
      }
    },
    {
      path: '/recuperar',
      method: 'POST',
      description: 'Password recovery request',
      body: {
        email: 'recovery@example.com'
      }
    },
    {
      path: '/auth/password',
      method: 'GET',
      description: 'Password management endpoint'
    }
  ],

  // === USER MANAGEMENT ENDPOINTS === //
  users: [
    { path: '/usuarios', method: 'GET', description: 'Get all users' },
    { path: '/perfil', method: 'GET', description: 'User profile information' },
    {
      path: '/perfil',
      method: 'POST',
      description: 'Update user profile',
      body: {
        nombre: 'Updated Name',
        celular: '1111111111',
        ciudad: 'Updated City'
      }
    }
  ],

  // === SHIPPING ENDPOINTS === //
  shipping: [
    { path: '/envios', method: 'GET', description: 'Get all shipments' },
    { path: '/obtenerenvios', method: 'GET', description: 'Alternative shipments endpoint' },
    {
      path: '/guardarenvio',
      method: 'POST',
      description: 'Save new shipment',
      body: {
        remitente: {
          nombre: 'Test Sender',
          celular: '1234567890',
          ciudad: 'Origin City'
        },
        destinatario: {
          nombre: 'Test Recipient',
          celular: '0987654321',
          ciudad: 'Destination City'
        },
        detalles: {
          descripcion: 'Test package',
          peso: '1kg',
          valor: 50000
        }
      }
    },
    {
      path: '/notificar-envio',
      method: 'POST',
      description: 'Send shipment notification',
      body: {
        envioId: 1,
        mensaje: 'Test notification message'
      }
    }
  ],

  // === CONTACT & COMMUNICATION === //
  contact: [
    { path: '/contacto', method: 'GET', description: 'Get contact messages' },
    {
      path: '/contacto',
      method: 'POST',
      description: 'Submit contact form',
      body: {
        nombre: 'Test Contact',
        email: 'contact@example.com',
        celular: '1234567890',
        mensaje: 'This is a test contact message'
      }
    },
    {
      path: '/send',
      method: 'POST',
      description: 'Send general message/email',
      body: {
        to: 'recipient@example.com',
        subject: 'Test Email',
        message: 'This is a test email message'
      }
    }
  ],

  // === ADDRESS MANAGEMENT === //
  addresses: [
    { path: '/remitente', method: 'GET', description: 'Get sender addresses' },
    {
      path: '/remitente',
      method: 'POST',
      description: 'Add sender address',
      body: {
        nombre: 'Test Sender Address',
        direccion: '123 Test Street',
        ciudad: 'Test City',
        telefono: '1234567890'
      }
    },
    { path: '/destinatario', method: 'GET', description: 'Get recipient addresses' },
    {
      path: '/destinatario',
      method: 'POST',
      description: 'Add recipient address',
      body: {
        nombre: 'Test Recipient Address',
        direccion: '456 Test Avenue',
        ciudad: 'Destination City',
        telefono: '0987654321'
      }
    }
  ],

  // === PAYMENT INTEGRATION === //
  payments: [
    { path: '/mercadopago', method: 'GET', description: 'MercadoPago integration status' },
    {
      path: '/mercadopago',
      method: 'POST',
      description: 'Process MercadoPago payment',
      body: {
        amount: 50000,
        description: 'Test payment for shipping',
        payerEmail: 'test@example.com'
      }
    }
  ],

  // === ADMIN ENDPOINTS === //
  admin: [
    { path: '/admin', method: 'GET', description: 'Admin dashboard data' },
    {
      path: '/admin',
      method: 'POST',
      description: 'Admin operation',
      body: {
        action: 'test_admin_action',
        data: { test: true }
      }
    }
  ],

  // === NEXTAUTH INTEGRATION === //
  nextauth: [
    { path: '/auth/nextauth-simulation', method: 'GET', description: 'NextAuth.js handler simulation' },
    { path: '/auth/error', method: 'GET', description: 'NextAuth.js error handler' },
    { path: '/auth/gis', method: 'GET', description: 'Google Identity Services integration' },
    { path: '/auth/_log', method: 'GET', description: 'Authentication logs' }
  ]
};

// Enhanced styling and colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

function colorize(text, color, bright = false) {
  const prefix = bright ? colors.bright : '';
  return `${prefix}${colors[color]}${text}${colors.reset}`;
}

function getStatusIcon(success, status) {
  if (success) return colorize('✅', 'green');
  if (status >= 400 && status < 500) return colorize('⚠️ ', 'yellow');
  if (status >= 500) return colorize('❌', 'red');
  return colorize('❓', 'blue');
}

function getMethodColor(method) {
  switch (method) {
    case 'GET': return 'blue';
    case 'POST': return 'yellow';
    case 'PUT': return 'magenta';
    case 'DELETE': return 'red';
    default: return 'white';
  }
}

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint.path}`;
    const postData = endpoint.body ? JSON.stringify(endpoint.body) : null;
    
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bisonte-Comprehensive-Tester/2.0',
        'Accept': 'application/json'
      },
      timeout: 15000
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const startTime = Date.now();
    
    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        let parsedData = {};
        let parseError = null;

        try {
          parsedData = data ? JSON.parse(data) : {};
        } catch (e) {
          parseError = e.message;
          parsedData = { rawResponse: data.substring(0, 200) };
        }

        resolve({
          status: res.statusCode,
          success: !parseError && res.statusCode < 400 && parsedData.success !== false,
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          data: parsedData,
          responseTime,
          parseError,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        error: 'Request timeout (15s)',
        responseTime: Date.now() - startTime
      });
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testSuite(suiteName, endpoints) {
  const suiteColors = {
    system: 'green',
    authentication: 'blue',
    users: 'cyan',
    shipping: 'yellow',
    contact: 'magenta',
    addresses: 'white',
    payments: 'green',
    admin: 'red',
    nextauth: 'blue'
  };

  const suiteColor = suiteColors[suiteName] || 'white';
  
  console.log(`\n${colorize(`📂 ${suiteName.toUpperCase()} ENDPOINTS`, suiteColor, true)}`);
  console.log(colorize('─'.repeat(80), 'dim'));
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint);
      
      const statusIcon = getStatusIcon(result.success, result.status);
      const methodColor = getMethodColor(endpoint.method);
      const statusColor = result.status < 300 ? 'green' : (result.status < 400 ? 'yellow' : 'red');
      
      console.log(
        `${statusIcon} ${colorize(endpoint.method.padEnd(4), methodColor)} ${endpoint.path.padEnd(25)} ` +
        `${colorize(result.status.toString(), statusColor)} ${endpoint.description} ` +
        `${colorize(`(${result.responseTime}ms)`, 'cyan')}`
      );
      
      // Show additional info for errors or important responses
      if (!result.success) {
        if (result.parseError) {
          console.log(`   ${colorize(`⚠️  Parse Error: ${result.parseError}`, 'yellow')}`);
        }
        if (result.data.error) {
          console.log(`   ${colorize(`❌ Error: ${result.data.error}`, 'red')}`);
        }
      } else if (result.data.message) {
        console.log(`   ${colorize(`💬 ${result.data.message}`, 'cyan')}`);
      }
      
      result.success ? passed++ : failed++;
      results.push(result);
      
    } catch (error) {
      failed++;
      console.log(
        `${colorize('💥', 'red')} ${colorize(endpoint.method.padEnd(4), 'red')} ${endpoint.path.padEnd(25)} ` +
        `${colorize('ERROR', 'red')} ${endpoint.description} ` +
        `${colorize(`(${error.responseTime || 0}ms)`, 'red')}`
      );
      console.log(`   ${colorize(`💥 Exception: ${error.error}`, 'red')}`);
      
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        success: false,
        error: error.error
      });
    }
    
    // Small delay between requests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  return { passed, failed, results, suiteName };
}

async function runComprehensiveTests() {
  const startTime = Date.now();
  
  // Header
  console.clear();
  console.log(colorize('🚀 BISONTE COMPREHENSIVE API TEST SUITE', 'green', true));
  console.log(colorize('Testing 30+ migrated and legacy endpoints', 'cyan'));
  console.log(colorize('═'.repeat(80), 'blue'));
  console.log(`${colorize('🌐 Base URL:', 'white', true)} ${colorize(BASE_URL, 'cyan')}`);
  console.log(`${colorize('🕐 Started:', 'white', true)} ${colorize(new Date().toISOString(), 'cyan')}`);
  console.log(`${colorize('🧪 Test Suites:', 'white', true)} ${colorize(Object.keys(testSuites).length, 'yellow')}`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalEndpoints = 0;
  const suiteResults = [];
  
  // Count total endpoints
  Object.values(testSuites).forEach(suite => {
    totalEndpoints += suite.length;
  });
  
  console.log(`${colorize('📊 Total Endpoints:', 'white', true)} ${colorize(totalEndpoints, 'yellow')}`);
  
  // Run all test suites
  for (const [suiteName, endpoints] of Object.entries(testSuites)) {
    const results = await testSuite(suiteName, endpoints);
    totalPassed += results.passed;
    totalFailed += results.failed;
    suiteResults.push(results);
  }
  
  const totalTime = Date.now() - startTime;
  
  // Final Summary
  console.log('\n' + colorize('═'.repeat(80), 'blue'));
  console.log(colorize('📊 COMPREHENSIVE TEST SUMMARY', 'green', true));
  console.log(colorize('─'.repeat(80), 'dim'));
  
  // Overall stats
  console.log(`${colorize('✅ Total Passed:', 'green', true)} ${colorize(totalPassed, 'green')}`);
  console.log(`${colorize('❌ Total Failed:', 'red', true)} ${colorize(totalFailed, 'red')}`);
  console.log(`${colorize('📈 Total Tests:', 'blue', true)} ${colorize(totalPassed + totalFailed, 'blue')}`);
  console.log(`${colorize('📊 Success Rate:', 'cyan', true)} ${colorize(Math.round((totalPassed / (totalPassed + totalFailed)) * 100), 'cyan')}%`);
  console.log(`${colorize('⏱️  Total Time:', 'yellow', true)} ${colorize(Math.round(totalTime / 1000), 'yellow')}s`);
  
  // Suite breakdown
  console.log(`\n${colorize('📋 SUITE BREAKDOWN:', 'white', true)}`);
  suiteResults.forEach(suite => {
    const successRate = Math.round((suite.passed / (suite.passed + suite.failed)) * 100);
    const statusIcon = successRate === 100 ? '🟢' : successRate >= 50 ? '🟡' : '🔴';
    console.log(
      `${statusIcon} ${colorize(suite.suiteName.padEnd(15), 'white')} ` +
      `${colorize(`${suite.passed}/${suite.passed + suite.failed}`, 'cyan')} ` +
      `${colorize(`(${successRate}%)`, successRate === 100 ? 'green' : successRate >= 50 ? 'yellow' : 'red')}`
    );
  });
  
  // Final status
  if (totalFailed === 0) {
    console.log(`\n${colorize('🎉 ALL TESTS PASSED! API MIGRATION 100% SUCCESSFUL!', 'green', true)}`);
    console.log(colorize('✨ Ready for production deployment!', 'cyan'));
  } else if (totalPassed > totalFailed) {
    console.log(`\n${colorize('⚠️  MOSTLY SUCCESSFUL with some issues to address', 'yellow', true)}`);
    console.log(colorize('🔧 Check failed endpoints above for details', 'yellow'));
  } else {
    console.log(`\n${colorize('❌ SIGNIFICANT ISSUES DETECTED', 'red', true)}`);
    console.log(colorize('🚨 Review and fix critical endpoints before deployment', 'red'));
  }
  
  console.log('\n' + colorize('═'.repeat(80), 'blue'));
  console.log(colorize('✨ Comprehensive test suite completed!', 'green', true));
  
  return {
    totalPassed,
    totalFailed,
    totalEndpoints,
    successRate: Math.round((totalPassed / (totalPassed + totalFailed)) * 100),
    totalTime,
    suiteResults
  };
}

// Main execution
if (require.main === module) {
  (async () => {
    try {
      const results = await runComprehensiveTests();
      
      // Exit with appropriate code
      const exitCode = results.totalFailed === 0 ? 0 : 1;
      process.exit(exitCode);
      
    } catch (error) {
      console.error(colorize(`\n💥 Test suite crashed: ${error.message}`, 'red', true));
      console.error(colorize(error.stack, 'red'));
      process.exit(2);
    }
  })();
}

module.exports = { 
  runComprehensiveTests, 
  testSuites, 
  makeRequest,
  colors,
  colorize 
};
