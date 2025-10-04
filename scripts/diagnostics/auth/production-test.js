#!/usr/bin/env node

/**
 * Diagnóstico específico para problemas de producción
 * Identifica issues comunes que causan fallas en registro, login y recuperación
 */

const fetch = require('node:fetch').default || global.fetch;

const BASE_URL = process.env.PRODUCTION_URL || process.env.VERCEL_URL || 'https://bisonteapp.com';

console.log(`🔍 Diagnóstico de producción para: ${BASE_URL}`);

async function testRegistrationAPI() {
  console.log('\n📝 Probando API de registro...');
  
  const testUser = {
    nombre: 'Test User',
    celular: '+573001234567',
    ciudad: 'Bogotá',
    email: `test+${Date.now()}@bisonteapp.com`,
    password: 'TestPassword123!'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, data);
    
    if (response.status === 201) {
      console.log('✅ Registro funcionando correctamente');
      return testUser;
    } else {
      console.log('❌ Error en registro:', data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error de conexión en registro:', error.message);
    return null;
  }
}

async function testLoginAPI(credentials) {
  if (!credentials) return;
  
  console.log('\n🔐 Probando flujo de login...');
  
  try {
    // 1. Obtener CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ CSRF token obtenido');
    
    // 2. Intentar login
    const loginParams = new URLSearchParams();
    loginParams.set('csrfToken', csrfToken);
    loginParams.set('email', credentials.email);
    loginParams.set('password', credentials.password);
    loginParams.set('callbackUrl', `${BASE_URL}/home`);
    loginParams.set('json', 'true');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: loginParams.toString(),
      redirect: 'manual'
    });
    
    console.log(`Login status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      const result = await loginResponse.json();
      console.log('Login result:', result);
      
      if (result.url && !result.error) {
        console.log('✅ Login exitoso');
      } else {
        console.log('❌ Error en credenciales:', result.error);
      }
    } else if ([302, 303].includes(loginResponse.status)) {
      const location = loginResponse.headers.get('location');
      console.log('Redirect to:', location);
      
      if (location.includes('/home')) {
        console.log('✅ Login exitoso (redirect a home)');
      } else if (location.includes('error=')) {
        console.log('❌ Error en login (redirect a error)');
      }
    }
  } catch (error) {
    console.log('❌ Error en login:', error.message);
  }
}

async function testPasswordRecovery(email) {
  if (!email) return;
  
  console.log('\n📧 Probando recuperación de contraseña...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/password/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', data);
    
    if (response.status === 200) {
      console.log('✅ API de recuperación responde correctamente');
      
      if (data.recoveryCode && data.recoveryToken) {
        console.log('🔧 Modo desarrollo: códigos visibles');
        console.log(`Código: ${data.recoveryCode}`);
      }
      
      if (data.emailDelivery) {
        if (data.emailDelivery.sent) {
          console.log('✅ Email enviado correctamente');
        } else {
          console.log('❌ Error enviando email:', data.emailDelivery.error);
        }
      }
    } else {
      console.log('❌ Error en recuperación:', data.error);
    }
  } catch (error) {
    console.log('❌ Error de conexión en recuperación:', error.message);
  }
}

async function testHealthEndpoints() {
  console.log('\n🏥 Verificando endpoints de salud...');
  
  const endpoints = [
    '/api/health',
    '/api/auth/session',
    '/api/auth/providers'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      
      console.log(`${endpoint}: ${response.status} ${isJson ? '(JSON)' : '(Non-JSON)'}`);
      
      if (response.status === 200 && isJson) {
        const data = await response.json();
        if (endpoint === '/api/auth/providers') {
          const providers = Object.keys(data);
          console.log(`  Providers: ${providers.join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`${endpoint}: ❌ ${error.message}`);
    }
  }
}

async function analyzeCommonProductionIssues() {
  console.log('\n🔍 Analizando problemas comunes de producción...');
  
  // Test CORS
  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'OPTIONS'
    });
    console.log(`CORS preflight: ${response.status}`);
  } catch (error) {
    console.log('❌ CORS preflight failed:', error.message);
  }
  
  // Test if API returns HTML instead of JSON (common misconfiguration)
  try {
    const response = await fetch(`${BASE_URL}/api/register`);
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('text/html')) {
      console.log('⚠️  API devuelve HTML en lugar de JSON - posible problema de routing');
    } else if (contentType?.includes('application/json')) {
      console.log('✅ API devuelve JSON correctamente');
    }
  } catch (error) {
    console.log('❌ Error verificando content-type:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico de producción...\n');
  
  await testHealthEndpoints();
  await analyzeCommonProductionIssues();
  
  const testUser = await testRegistrationAPI();
  await testLoginAPI(testUser);
  await testPasswordRecovery(testUser?.email);
  
  console.log('\n📋 Diagnóstico completo. Revisar logs para identificar problemas específicos.');
  
  console.log('\n💡 Si el registro funciona pero el login falla:');
  console.log('   1. Verificar que las contraseñas se hashean correctamente');
  console.log('   2. Revisar que NextAuth está configurado con la misma base de datos');
  console.log('   3. Confirmar que NEXTAUTH_URL coincide con el dominio actual');
  
  console.log('\n💡 Si los correos no llegan:');
  console.log('   1. Verificar RESEND_API_KEY en variables de entorno');
  console.log('   2. Confirmar que EMAIL_FROM está verificado en Resend');
  console.log('   3. Revisar logs del servidor para errores específicos');
}

main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});