// 🌐 DIAGNÓSTICO DE PRODUCCIÓN - BISONTEAPP.COM
// Prueba directamente el sitio de producción para diagnosticar problemas

const https = require('https');
const fs = require('fs');

const PRODUCTION_URL = 'https://www.bisonteapp.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

console.log('🌐 DIAGNÓSTICO DE PRODUCCIÓN - BISONTE APP');
console.log('=' .repeat(60));
console.log(`🎯 Probando sitio DESPLEGADO: ${PRODUCTION_URL}`);
console.log('');

async function testProductionEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const url = `${PRODUCTION_URL}${path}`;
    console.log(`${method} ${url}`);
    
    const options = {
      method,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    };

    if (data && method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: json,
            headers: res.headers
          });
        } catch {
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message,
        data: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        success: false,
        error: 'Request timeout',
        data: null
      });
    });

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runProductionDiagnostic() {
  console.log('🧪 1. PROBANDO CONECTIVIDAD BÁSICA...\n');
  
  // Test básico del sitio
  const siteTest = await testProductionEndpoint('/');
  console.log(`   Status: ${siteTest.status}`);
  console.log(`   Success: ${siteTest.success ? '✅' : '❌'}`);
  if (!siteTest.success) {
    console.log(`   Error: ${siteTest.error || 'Sin respuesta del servidor'}`);
    if (siteTest.status === 0) {
      console.log('   💡 El sitio parece no estar disponible o no está desplegado aún');
      console.log('   📝 Asegúrate de que bisonteapp.com esté desplegado y funcionando');
      return;
    }
  }
  console.log('');

  console.log('💳 2. PROBANDO ENDPOINTS DE MERCADOPAGO...\n');
  
  // Test process-payment GET
  const processPaymentGet = await testProductionEndpoint('/api/mercadopago/process-payment');
  console.log('   📊 /api/mercadopago/process-payment (GET)');
  console.log(`      Status: ${processPaymentGet.status}`);
  console.log(`      Success: ${processPaymentGet.success ? '✅' : '❌'}`);
  if (processPaymentGet.data) {
    console.log(`      Environment: ${processPaymentGet.data.environment || 'No detectado'}`);
    console.log(`      Configured: ${processPaymentGet.data.configured || 'No detectado'}`);
  }
  console.log('');

  // Test PSE endpoint
  const pseGet = await testProductionEndpoint('/api/mercadopago/create-pse-payment');
  console.log('   🏦 /api/mercadopago/create-pse-payment (GET)');
  console.log(`      Status: ${pseGet.status}`);
  console.log(`      Success: ${pseGet.success ? '✅' : '❌'}`);
  console.log('');

  // Test payment POST con datos simulados
  const testPaymentData = {
    transaction_amount: 10000,
    token: 'PRODUCTION_TEST_TOKEN',
    payment_method_id: 'visa',
    installments: 1,
    payer: {
      email: 'test@bisonteapp.com'
    },
    description: 'Pago de prueba - diagnóstico'
  };

  console.log('   💰 /api/mercadopago/process-payment (POST) - Prueba');
  const processPaymentPost = await testProductionEndpoint('/api/mercadopago/process-payment', 'POST', testPaymentData);
  console.log(`      Status: ${processPaymentPost.status}`);
  console.log(`      Success: ${processPaymentPost.success ? '✅' : '❌'}`);
  if (processPaymentPost.data && processPaymentPost.data.error) {
    console.log(`      Error: ${processPaymentPost.data.error}`);
  }
  console.log('');

  console.log('🔐 3. PROBANDO AUTENTICACIÓN...\n');
  
  // Test NextAuth
  const authTest = await testProductionEndpoint('/api/auth/session');
  console.log('   🔑 /api/auth/session');
  console.log(`      Status: ${authTest.status}`);
  console.log(`      Success: ${authTest.success ? '✅' : '❌'}`);
  console.log('');

  // Test Google OAuth config
  const googleAuthTest = await testProductionEndpoint('/api/auth/providers');
  console.log('   🌐 /api/auth/providers (Google OAuth)');
  console.log(`      Status: ${googleAuthTest.status}`);
  console.log(`      Success: ${googleAuthTest.success ? '✅' : '❌'}`);
  console.log('');

  console.log('=' .repeat(60));
  console.log('📊 RESUMEN DEL DIAGNÓSTICO');
  console.log('=' .repeat(60));

  if (siteTest.success) {
    console.log('✅ Sitio web accesible');
  } else {
    console.log('❌ Sitio web no accesible - CRÍTICO');
    console.log('   🔧 Acciones necesarias:');
    console.log('   • Desplegar la aplicación en tu plataforma (Vercel, Railway, etc.)');
    console.log('   • Configurar el dominio bisonteapp.com');
    console.log('   • Verificar que las variables de entorno estén configuradas');
  }

  if (processPaymentGet.success && processPaymentGet.data?.configured) {
    console.log('✅ API de MercadoPago configurada');
  } else {
    console.log('❌ API de MercadoPago con problemas');
    console.log('   🔧 Posibles causas:');
    console.log('   • Variables de entorno no configuradas en producción');
    console.log('   • Credenciales de producción incorrectas');
    console.log('   • Error en la configuración del servidor');
  }

  console.log('');
  console.log('📝 SIGUIENTES PASOS:');
  if (!siteTest.success) {
    console.log('   1. 🚀 Despliega la aplicación en tu plataforma');
    console.log('   2. ⚙️  Configura todas las variables de entorno');
    console.log('   3. 🌐 Apunta bisonteapp.com a tu hosting');
    console.log('   4. 🔄 Ejecuta este diagnóstico nuevamente');
  } else {
    console.log('   1. ✅ El sitio está funcionando');
    console.log('   2. 🔍 Revisa errores específicos arriba');
    console.log('   3. ⚙️  Ajusta configuración según sea necesario');
  }
  
  console.log('');
  console.log('🔗 URLs importantes:');
  console.log(`   • Sitio: ${PRODUCTION_URL}`);
  console.log(`   • Admin: ${PRODUCTION_URL}/admin`);
  console.log(`   • Pagos: ${PRODUCTION_URL}/cotizador`);
  console.log(`   • API Health: ${PRODUCTION_URL}/api/health`);
  console.log(`   • MercadoPago Test: ${PRODUCTION_URL}/api/mercadopago/process-payment`);
}

console.log('⏳ Iniciando diagnóstico...\n');
runProductionDiagnostic().catch(console.error);