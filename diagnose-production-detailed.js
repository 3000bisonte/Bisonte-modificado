/**
 * Diagnóstico detallado de la configuración en producción
 */

const https = require('https');

console.log('🔍 DIAGNÓSTICO DE PRODUCCIÓN - www.bisonteapp.com');
console.log('='.repeat(60));
console.log();

function makeRequest(url, method = 'GET') {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Bisonte-Test/1.0',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: body,
          location: res.headers.location
        });
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.end();
  });
}

async function checkEndpoint(name, url, expectedStatus = 200) {
  console.log(`📍 Probando: ${name}`);
  console.log(`   URL: ${url}`);
  
  const response = await makeRequest(url);
  
  if (response.error) {
    console.log(`   ❌ Error: ${response.error}`);
    return false;
  }
  
  console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
  
  if (response.statusCode === 308 || response.statusCode === 301 || response.statusCode === 302) {
    console.log(`   🔄 REDIRECCIÓN DETECTADA`);
    console.log(`   → Redirige a: ${response.location || 'No especificado'}`);
    console.log(`   ⚠️  PROBLEMA: Variables de entorno NO configuradas`);
    return false;
  }
  
  if (response.statusCode === expectedStatus) {
    console.log(`   ✅ Endpoint funcionando correctamente`);
    return true;
  } else {
    console.log(`   ⚠️  Status inesperado (esperaba ${expectedStatus})`);
    if (response.body && response.body.length < 200) {
      console.log(`   Respuesta: ${response.body}`);
    }
    return false;
  }
}

async function runDiagnostics() {
  console.log('🏥 VERIFICACIÓN DE ENDPOINTS\n');
  
  const tests = [
    {
      name: 'Sitio Principal',
      url: 'https://www.bisonteapp.com',
      expected: 200
    },
    {
      name: 'API Health Check',
      url: 'https://www.bisonteapp.com/api/health',
      expected: 200
    },
    {
      name: 'API Perfil',
      url: 'https://www.bisonteapp.com/api/perfil',
      expected: 401 // Sin auth
    },
    {
      name: 'API MercadoPago Config',
      url: 'https://www.bisonteapp.com/api/mercadopago/config',
      expected: 200
    },
    {
      name: 'API Process Payment',
      url: 'https://www.bisonteapp.com/api/mercadopago/process-payment',
      expected: 405 // GET no permitido, pero debería responder
    },
    {
      name: 'NextAuth Config',
      url: 'https://www.bisonteapp.com/api/auth/providers',
      expected: 200
    }
  ];

  let working = 0;
  let failing = 0;

  for (const test of tests) {
    const result = await checkEndpoint(test.name, test.url, test.expected);
    if (result) {
      working++;
    } else {
      failing++;
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO\n');
  console.log(`✅ Endpoints funcionando: ${working}`);
  console.log(`❌ Endpoints con problemas: ${failing}`);
  console.log();

  if (failing > 0) {
    console.log('🚨 PROBLEMA DETECTADO: Status 308 (Redirect)\n');
    console.log('📋 CAUSA:');
    console.log('   Las variables de entorno NO están configuradas en el hosting');
    console.log('   El servidor está redirigiendo porque falta configuración\n');
    
    console.log('✅ SOLUCIÓN:');
    console.log('   1. Abre tu plataforma de hosting (Vercel/Railway/Netlify)');
    console.log('   2. Ve a Settings > Environment Variables');
    console.log('   3. Agrega TODAS las variables de CONFIGURACION_HOSTING.md');
    console.log('   4. Redespliega la aplicación');
    console.log();
    console.log('📄 Variables críticas a configurar:');
    console.log('   - NODE_ENV=production');
    console.log('   - NEXTAUTH_URL=https://www.bisonteapp.com');
    console.log('   - NEXT_PUBLIC_SITE_URL=https://www.bisonteapp.com');
    console.log('   - MP_ENVIRONMENT=production');
    console.log('   - MP_ACCESS_TOKEN_PROD=<tu-token>');
    console.log('   - DATABASE_URL=<tu-database>');
    console.log('   - ... y todas las demás de CONFIGURACION_HOSTING.md');
    console.log();
  } else {
    console.log('✅ TODOS LOS ENDPOINTS FUNCIONANDO CORRECTAMENTE');
    console.log('   El sistema está listo para procesar pagos\n');
  }

  console.log('📖 Documentación completa: CONFIGURACION_HOSTING.md');
  console.log('💳 Tarjetas de prueba: TARJETAS_PRUEBA_MERCADOPAGO.md');
  console.log('='.repeat(60));
}

runDiagnostics().catch(console.error);
