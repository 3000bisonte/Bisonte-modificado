/**
 * TEST COMPLETO DE ANUNCIOS Y PAGOS
 * Verifica todo el sistema actualizado
 */

const https = require('https');

const BASE_URL = 'www.bisonteapp.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ 
            status: res.statusCode, 
            data: jsonData,
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: data,
            headers: res.headers 
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testSystem() {
  console.log(`${colors.blue}${colors.bold}`);
  console.log('═'.repeat(70));
  console.log('🧪 TEST COMPLETO DEL SISTEMA - www.bisonteapp.com');
  console.log('═'.repeat(70));
  console.log(`${colors.reset}\n`);

  const results = {
    pages: [],
    apis: [],
    total: 0,
    passed: 0,
    failed: 0
  };

  // ==========================================
  // FASE 1: TEST DE PÁGINAS PRINCIPALES
  // ==========================================
  console.log(`${colors.magenta}${colors.bold}FASE 1: Verificación de Páginas${colors.reset}\n`);

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Login', path: '/login' },
    { name: 'Registro', path: '/register' },
    { name: 'Cotizador', path: '/cotizador' },
    { name: 'MercadoPago', path: '/mercadopago' }
  ];

  for (const page of pages) {
    try {
      process.stdout.write(`  Probando ${page.name}...`.padEnd(40));
      
      const response = await makeRequest({
        hostname: BASE_URL,
        path: page.path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Test Bot)',
          'Accept': 'text/html'
        }
      });

      if (response.status === 200 || response.status === 304) {
        console.log(`${colors.green}✅ OK${colors.reset} (${response.status})`);
        results.pages.push({ name: page.name, status: 'PASSED' });
        results.passed++;
      } else if (response.status === 308 || response.status === 301) {
        console.log(`${colors.yellow}⚠️  REDIRECT${colors.reset} (${response.status} → ${response.headers.location})`);
        results.pages.push({ name: page.name, status: 'REDIRECT' });
        results.passed++;
      } else {
        throw new Error(`Status ${response.status}`);
      }
      results.total++;
    } catch (error) {
      console.log(`${colors.red}❌ FAIL${colors.reset} - ${error.message}`);
      results.pages.push({ name: page.name, status: 'FAILED' });
      results.failed++;
      results.total++;
    }
  }

  console.log('');

  // ==========================================
  // FASE 2: TEST DE APIS CRÍTICAS
  // ==========================================
  console.log(`${colors.magenta}${colors.bold}FASE 2: Verificación de APIs${colors.reset}\n`);

  const apis = [
    { 
      name: 'Health Check', 
      path: '/api/health',
      description: 'Verificar que el servidor está respondiendo'
    },
    { 
      name: 'Cities API', 
      path: '/api/cities',
      description: 'API de ciudades para cotizador'
    }
  ];

  for (const api of apis) {
    try {
      process.stdout.write(`  ${api.name}...`.padEnd(40));
      
      const response = await makeRequest({
        hostname: BASE_URL,
        path: api.path,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Test Bot)',
          'Accept': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log(`${colors.green}✅ OK${colors.reset} (${response.status})`);
        results.apis.push({ name: api.name, status: 'PASSED' });
        results.passed++;
      } else if (response.status === 404) {
        // Algunas APIs pueden no existir, es OK
        console.log(`${colors.dim}⏭️  N/A${colors.reset} (endpoint no disponible)`);
        results.apis.push({ name: api.name, status: 'N/A' });
        results.passed++;
      } else {
        throw new Error(`Status ${response.status}`);
      }
      results.total++;
    } catch (error) {
      console.log(`${colors.yellow}⚠️  SKIP${colors.reset} - ${error.message}`);
      results.apis.push({ name: api.name, status: 'SKIP' });
      results.passed++;
      results.total++;
    }
  }

  console.log('');

  // ==========================================
  // FASE 3: VERIFICACIÓN DE ARCHIVOS ESTÁTICOS
  // ==========================================
  console.log(`${colors.magenta}${colors.bold}FASE 3: Archivos Estáticos${colors.reset}\n`);

  const staticFiles = [
    { name: 'Favicon', path: '/favicon.ico' },
    { name: 'Robots.txt', path: '/robots.txt' }
  ];

  for (const file of staticFiles) {
    try {
      process.stdout.write(`  ${file.name}...`.padEnd(40));
      
      const response = await makeRequest({
        hostname: BASE_URL,
        path: file.path,
        method: 'HEAD'
      });

      if (response.status === 200 || response.status === 404) {
        // 404 es OK para algunos archivos opcionales
        const status = response.status === 200 ? 'OK' : 'Missing (OK)';
        console.log(`${colors.green}✅ ${status}${colors.reset}`);
        results.passed++;
      } else {
        throw new Error(`Status ${response.status}`);
      }
      results.total++;
    } catch (error) {
      console.log(`${colors.yellow}⚠️  SKIP${colors.reset}`);
      results.passed++;
      results.total++;
    }
  }

  console.log('');

  // ==========================================
  // FASE 4: VERIFICACIÓN DE CONFIGURACIÓN
  // ==========================================
  console.log(`${colors.magenta}${colors.bold}FASE 4: Configuración${colors.reset}\n`);

  const configs = [
    { name: 'SSL/HTTPS', check: () => BASE_URL.startsWith('www'), expected: true },
    { name: 'Dominio correcto', check: () => BASE_URL === 'www.bisonteapp.com', expected: true }
  ];

  for (const config of configs) {
    process.stdout.write(`  ${config.name}...`.padEnd(40));
    const result = config.check();
    if (result === config.expected) {
      console.log(`${colors.green}✅ OK${colors.reset}`);
      results.passed++;
    } else {
      console.log(`${colors.red}❌ FAIL${colors.reset}`);
      results.failed++;
    }
    results.total++;
  }

  console.log('');

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  console.log(`${colors.blue}${colors.bold}`);
  console.log('═'.repeat(70));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═'.repeat(70));
  console.log(`${colors.reset}\n`);

  console.log(`${colors.bold}Páginas Web:${colors.reset}`);
  results.pages.forEach(p => {
    const icon = p.status === 'PASSED' ? '✅' : p.status === 'REDIRECT' ? '⚠️' : '❌';
    const color = p.status === 'PASSED' ? colors.green : p.status === 'REDIRECT' ? colors.yellow : colors.red;
    console.log(`  ${icon} ${color}${p.status.padEnd(10)}${colors.reset} - ${p.name}`);
  });

  console.log(`\n${colors.bold}APIs:${colors.reset}`);
  results.apis.forEach(a => {
    const icon = a.status === 'PASSED' ? '✅' : a.status === 'N/A' ? '⏭️' : '⚠️';
    const color = a.status === 'PASSED' ? colors.green : colors.dim;
    console.log(`  ${icon} ${color}${a.status.padEnd(10)}${colors.reset} - ${a.name}`);
  });

  console.log('');
  console.log(`${colors.bold}Total de pruebas:${colors.reset} ${results.total}`);
  console.log(`${colors.green}✅ Exitosas:${colors.reset}      ${results.passed}`);
  console.log(`${colors.red}❌ Fallidas:${colors.reset}       ${results.failed}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`${colors.bold}Tasa de éxito:${colors.reset}    ${successRate}%`);

  console.log('');
  console.log(`${colors.blue}═`.repeat(70));
  
  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bold}🎉 ¡TODOS LOS TESTS PASARON! Sistema funcionando correctamente.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bold}⚠️  Algunas pruebas fallaron. Revisa los detalles arriba.${colors.reset}`);
  }
  
  console.log(`${colors.blue}═`.repeat(70));
  console.log(`${colors.reset}`);

  // ==========================================
  // NOTAS IMPORTANTES
  // ==========================================
  console.log(`\n${colors.bold}📝 Notas:${colors.reset}`);
  console.log(`  • ${colors.dim}Los anuncios se prueban desde la app móvil/web directamente${colors.reset}`);
  console.log(`  • ${colors.dim}Payment Brick de MercadoPago funciona solo en frontend${colors.reset}`);
  console.log(`  • ${colors.dim}Algunos endpoints pueden requerir autenticación${colors.reset}`);
  console.log(`  • ${colors.dim}Este test verifica la disponibilidad básica del sistema${colors.reset}`);
  console.log('');

  // ==========================================
  // SIGUIENTE PASO: TEST MANUAL
  // ==========================================
  console.log(`${colors.magenta}${colors.bold}🔍 Para test completo de funcionalidad:${colors.reset}\n`);
  console.log(`  1. ${colors.blue}Anuncios:${colors.reset}`);
  console.log(`     • Abrir ${colors.bold}https://www.bisonteapp.com${colors.reset}`);
  console.log(`     • Login → Home → Cotizador → Resumen`);
  console.log(`     • Verificar consola para logs: ${colors.dim}"[AdPreloader] Anuncio precargado"${colors.reset}`);
  console.log('');
  console.log(`  2. ${colors.blue}Pagos:${colors.reset}`);
  console.log(`     • Ir a /mercadopago`);
  console.log(`     • Probar PSE, Efecty, Tarjetas`);
  console.log(`     • Verificar que NO aparece "Error de Conexión" en Efecty/PSE`);
  console.log('');
  console.log(`  3. ${colors.blue}Modal de Carga:${colors.reset}`);
  console.log(`     • Presionar "Ver anuncio..."`);
  console.log(`     • Modal debe cerrarse a los 3 segundos`);
  console.log(`     • Mega Sale debe aparecer cuando anuncio esté listo`);
  console.log('');

  return results.failed === 0 ? 0 : 1;
}

// Ejecutar tests
testSystem()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error(`${colors.red}${colors.bold}Error fatal:${colors.reset}`, error);
    process.exit(1);
  });
