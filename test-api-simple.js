#!/usr/bin/env node

// Simple API tester for our migrated endpoints
const https = require('http');

const BASE_URL = 'http://localhost:3000/api';

const endpoints = [
  { path: '/health', method: 'GET' },
  { path: '/ping', method: 'GET' },
  { path: '/status', method: 'GET' },
  { path: '/config', method: 'GET' },
  { path: '/metrics', method: 'GET' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint.path}`;
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: parsed.success,
            endpoint: endpoint.path,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            success: false,
            endpoint: endpoint.path,
            error: 'Parse error',
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        endpoint: endpoint.path,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({
        endpoint: endpoint.path,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Migrated APIs');
  console.log('='.repeat(40));
  
  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${endpoint.method} ${endpoint.path} - ${result.status} - ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - ERROR: ${error.error}`);
    }
  }
  
  console.log('\n' + '='.repeat(40));
  console.log('✨ Test completed!');
}

runTests().catch(console.error);
