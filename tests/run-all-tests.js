/**
 * 🧪 Script para ejecutar todos los tests
 * Ejecuta tests de APIs, E2E y servicios de seguridad
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 INICIANDO SUITE COMPLETA DE TESTS\n');
console.log('=' .repeat(60));

const testSuites = [
  {
    name: '📝 Tests de API - Registro',
    command: 'npx jest tests/api/register.test.js --verbose',
    critical: true
  },
  {
    name: '🔐 Tests de API - Autenticación',
    command: 'npx jest tests/api/auth.test.js --verbose',
    critical: true
  },
  {
    name: '💳 Tests de API - MercadoPago',
    command: 'npx jest tests/api/mercadopago.test.js --verbose',
    critical: true
  },
  {
    name: '📦 Tests de API - Envíos',
    command: 'npx jest tests/api/envios.test.js --verbose',
    critical: false
  },
  {
    name: '🔒 Tests de Servicios de Seguridad',
    command: 'npx jest tests/unit/security-services.test.js --verbose',
    critical: true
  },
  {
    name: '🎯 Tests E2E - Flujo Completo',
    command: 'npx jest tests/e2e/complete-flow.test.js --verbose --testTimeout=30000',
    critical: true
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedSuites = 0;

async function runTest(suite, index) {
  return new Promise((resolve) => {
    console.log(`\n[${index + 1}/${testSuites.length}] ${suite.name}`);
    console.log('-'.repeat(60));

    const startTime = Date.now();
    const process = exec(suite.command, { maxBuffer: 1024 * 1024 * 10 });

    let output = '';

    process.stdout.on('data', (data) => {
      output += data;
      process.stdout.write(data);
    });

    process.stderr.on('data', (data) => {
      output += data;
      process.stderr.write(data);
    });

    process.on('exit', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Parsear resultados del output
      const testsMatch = output.match(/Tests:\s+(\d+)\s+passed.*?(\d+)\s+total/);
      if (testsMatch) {
        const passed = parseInt(testsMatch[1]);
        const total = parseInt(testsMatch[2]);
        totalTests += total;
        passedTests += passed;
        failedTests += (total - passed);
      }

      if (code === 0) {
        console.log(`✅ ${suite.name} - COMPLETADO (${duration}s)`);
      } else {
        console.log(`❌ ${suite.name} - FALLIDO (${duration}s)`);
        if (suite.critical) {
          console.log(`⚠️ Este test es CRÍTICO - revisa los errores`);
        }
      }

      resolve({ success: code === 0, suite, duration });
    });

    process.on('error', (error) => {
      console.log(`❌ Error ejecutando ${suite.name}:`, error.message);
      skippedSuites++;
      resolve({ success: false, suite, duration: 0, error });
    });
  });
}

async function runAllTests() {
  const results = [];

  for (let i = 0; i < testSuites.length; i++) {
    const result = await runTest(testSuites[i], i);
    results.push(result);
  }

  // Resumen final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(60));
  console.log(`Total de tests ejecutados: ${totalTests}`);
  console.log(`✅ Tests pasados: ${passedTests}`);
  console.log(`❌ Tests fallidos: ${failedTests}`);
  console.log(`⏭️ Suites omitidos: ${skippedSuites}`);

  const totalDuration = results.reduce((sum, r) => sum + parseFloat(r.duration || 0), 0).toFixed(2);
  console.log(`⏱️ Duración total: ${totalDuration}s`);

  console.log('\n' + '='.repeat(60));
  console.log('📋 DETALLES POR SUITE:');
  console.log('='.repeat(60));

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const critical = result.suite.critical ? '🔥' : '  ';
    console.log(`${icon} ${critical} [${index + 1}] ${result.suite.name} (${result.duration}s)`);
  });

  // Verificar tests críticos
  const criticalFailed = results.filter(r => !r.success && r.suite.critical);
  if (criticalFailed.length > 0) {
    console.log('\n⚠️ ADVERTENCIA: Tests críticos fallaron:');
    criticalFailed.forEach(r => {
      console.log(`  - ${r.suite.name}`);
    });
    console.log('\n🔧 Acción requerida: Revisa los errores antes de deployar');
  }

  // Generar reporte
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedSuites,
      duration: totalDuration
    },
    suites: results.map(r => ({
      name: r.suite.name,
      success: r.success,
      critical: r.suite.critical,
      duration: r.duration
    }))
  };

  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);

  // Exit code
  const hasFailures = failedTests > 0 || criticalFailed.length > 0;
  console.log(`\n${hasFailures ? '❌' : '✅'} Tests ${hasFailures ? 'FALLIDOS' : 'COMPLETADOS'}`);
  
  process.exit(hasFailures ? 1 : 0);
}

// Verificar que el servidor esté corriendo
console.log('🔍 Verificando servidor...');
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
console.log(`📡 API URL: ${apiUrl}`);
console.log('⚠️ Asegúrate de que el servidor esté corriendo antes de ejecutar tests\n');

// Dar tiempo para revisar
setTimeout(() => {
  runAllTests().catch(error => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  });
}, 2000);
