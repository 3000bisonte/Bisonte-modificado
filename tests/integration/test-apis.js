// Test script para verificar todas las APIs migradas
const BASE_URL = 'http://localhost:3000/api';

async function testApi(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - ${response.status}`, data.success ? 'SUCCESS' : 'FAILED');
    return { status: response.status, success: data.success, data };
    
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - ERROR:`, error.message);
    return { status: 0, success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Next.js APIs Migration\n');
  console.log('='.repeat(50));
  
  // Test basic endpoints
  console.log('\n📊 Testing System Endpoints:');
  await testApi('/health');
  await testApi('/ping');
  await testApi('/status');
  await testApi('/config');
  await testApi('/metrics');
  
  // Test authentication endpoints
  console.log('\n🔐 Testing Authentication Endpoints:');
  await testApi('/auth/register', 'POST', {
    email: `test_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    nombre: 'Test User'
  });
  
  await testApi('/recuperar', 'POST', {
    email: 'test@example.com'
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 API Tests Completed!');
}

// Run tests if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testApi, runTests };
