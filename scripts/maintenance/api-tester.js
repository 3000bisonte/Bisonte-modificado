#!/usr/bin/env node

const fs = require('fs').promises;
const http = require('http');
const https = require('https');
const url = require('url');

class APITester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      results: [],
      errors: [],
      summary: {}
    };
  }

  async runTests() {
    console.log('🧪 Iniciando tests automatizados de APIs...\n');
    
    try {
      // Test basic health checks
      await this.testHealthEndpoints();
      
      // Test auth endpoints
      await this.testAuthEndpoints();
      
      // Test CRUD operations
      await this.testCRUDEndpoints();
      
      // Test error handling
      await this.testErrorHandling();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Error durante los tests:', error);
      this.testResults.errors.push(error.message);
    }

    return this.testResults;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      const urlParts = url.parse(fullUrl);
      const isHttps = urlParts.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlParts.hostname,
        port: urlParts.port || (isHttps ? 443 : 80),
        path: urlParts.path,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BisonteAPI-Tester/1.0',
          ...headers
        },
        timeout: 10000
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = httpModule.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            let parsedData;
            try {
              parsedData = JSON.parse(responseData);
            } catch {
              parsedData = responseData;
            }

            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsedData,
              rawData: responseData
            });
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async testEndpoint(name, method, endpoint, expectedStatus = 200, data = null, headers = {}) {
    const testResult = {
      name,
      method,
      endpoint,
      expectedStatus,
      status: 'RUNNING',
      actualStatus: null,
      responseTime: null,
      error: null,
      warnings: [],
      timestamp: new Date().toISOString()
    };

    console.log(`🔍 Testing ${method} ${endpoint}...`);

    try {
      const startTime = Date.now();
      const response = await this.makeRequest(method, endpoint, data, headers);
      const endTime = Date.now();

      testResult.actualStatus = response.statusCode;
      testResult.responseTime = endTime - startTime;
      testResult.response = response;

      // Validate status code
      if (response.statusCode === expectedStatus) {
        testResult.status = 'PASSED';
        this.testResults.passed++;
        console.log(`   ✅ ${response.statusCode} (${testResult.responseTime}ms)`);
      } else {
        testResult.status = 'FAILED';
        testResult.error = `Expected status ${expectedStatus}, got ${response.statusCode}`;
        this.testResults.failed++;
        console.log(`   ❌ ${response.statusCode} - Expected ${expectedStatus} (${testResult.responseTime}ms)`);
      }

      // Additional validations
      this.validateResponse(testResult, response);

    } catch (error) {
      testResult.status = 'FAILED';
      testResult.error = error.message;
      this.testResults.failed++;
      console.log(`   ❌ ${error.message}`);
    }

    this.testResults.results.push(testResult);
    return testResult;
  }

  validateResponse(testResult, response) {
    // Check response time
    if (testResult.responseTime > 5000) {
      testResult.warnings.push('Slow response time (>5s)');
    }

    // Check content type for JSON endpoints
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/json') && 
        testResult.endpoint.includes('/api/')) {
      testResult.warnings.push('Non-JSON response for API endpoint');
    }

    // Check for security headers
    const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
    const missingHeaders = securityHeaders.filter(header => !response.headers[header]);
    if (missingHeaders.length > 0) {
      testResult.warnings.push(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
  }

  async testHealthEndpoints() {
    console.log('🏥 Testing Health Endpoints...');
    
    // Test common health check endpoints
    await this.testEndpoint('Health Check - Root', 'GET', '/', 200);
    await this.testEndpoint('API Health', 'GET', '/api/health', 200);
    await this.testEndpoint('API Status', 'GET', '/api/status', 200);
    
    console.log('');
  }

  async testAuthEndpoints() {
    console.log('🔐 Testing Authentication Endpoints...');
    
    // Test auth endpoints
    await this.testEndpoint('Auth Error Handler', 'GET', '/api/auth/error', 200);
    await this.testEndpoint('Google GIS Auth', 'GET', '/api/auth/gis', 200);
    
    // Test protected endpoints without auth (should return 401)
    await this.testEndpoint('Admin without Auth', 'GET', '/api/admin', 401);
    
    // Test password endpoints
    await this.testEndpoint('Password Request - No Data', 'POST', '/api/auth/password/request', 400);
    await this.testEndpoint('Password Change - No Data', 'POST', '/api/auth/password/change', 400);
    
    console.log('');
  }

  async testCRUDEndpoints() {
    console.log('📊 Testing CRUD Endpoints...');
    
    // Test various API endpoints found in the audit
    await this.testEndpoint('Users List', 'GET', '/api/users', 200);
    await this.testEndpoint('Clients List', 'GET', '/api/clients', 200);
    await this.testEndpoint('Orders List', 'GET', '/api/orders', 200);
    await this.testEndpoint('Deliveries List', 'GET', '/api/deliveries', 200);
    await this.testEndpoint('Analytics', 'GET', '/api/analytics', 200);
    
    // Test POST endpoints without required data (should return 400)
    await this.testEndpoint('Create User - No Data', 'POST', '/api/users', 400);
    await this.testEndpoint('Create Client - No Data', 'POST', '/api/clients', 400);
    await this.testEndpoint('Create Order - No Data', 'POST', '/api/orders', 400);
    
    console.log('');
  }

  async testErrorHandling() {
    console.log('🛡️ Testing Error Handling...');
    
    // Test non-existent endpoints
    await this.testEndpoint('Non-existent Endpoint', 'GET', '/api/non-existent', 404);
    await this.testEndpoint('Invalid Method', 'DELETE', '/api/auth/error', 405);
    
    // Test malformed data
    await this.testEndpoint('Malformed JSON', 'POST', '/api/users', 400, 'invalid-json');
    
    console.log('');
  }

  generateReport() {
    console.log('📊 REPORTE DE TESTING DE APIs');
    console.log('=============================');
    
    const total = this.testResults.passed + this.testResults.failed + this.testResults.skipped;
    const successRate = total > 0 ? Math.round((this.testResults.passed / total) * 100) : 0;
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`   ✅ Tests Pasados: ${this.testResults.passed}`);
    console.log(`   ❌ Tests Fallidos: ${this.testResults.failed}`);
    console.log(`   ⏭️  Tests Omitidos: ${this.testResults.skipped}`);
    console.log(`   📊 Tasa de Éxito: ${successRate}%`);
    console.log(`   ⏱️  Total: ${total} tests`);

    if (this.testResults.failed > 0) {
      console.log(`\n❌ TESTS FALLIDOS:`);
      this.testResults.results
        .filter(r => r.status === 'FAILED')
        .slice(0, 10)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    // Show warnings
    const testsWithWarnings = this.testResults.results.filter(r => r.warnings.length > 0);
    if (testsWithWarnings.length > 0) {
      console.log(`\n⚠️  ADVERTENCIAS (${testsWithWarnings.length} tests):`);
      testsWithWarnings.slice(0, 5).forEach(test => {
        console.log(`   • ${test.name}:`);
        test.warnings.forEach(warning => {
          console.log(`     - ${warning}`);
        });
      });
    }

    // Performance analysis
    const responseTimes = this.testResults.results
      .filter(r => r.responseTime !== null)
      .map(r => r.responseTime);
    
    if (responseTimes.length > 0) {
      const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log(`\n⏱️  RENDIMIENTO:`);
      console.log(`   📊 Tiempo promedio: ${avgResponseTime}ms`);
      console.log(`   🐌 Tiempo máximo: ${maxResponseTime}ms`);
      
      const slowTests = this.testResults.results
        .filter(r => r.responseTime > 3000)
        .length;
      
      if (slowTests > 0) {
        console.log(`   ⚠️  Tests lentos (>3s): ${slowTests}`);
      }
    }

    console.log(`\n🎯 RECOMENDACIONES:`);
    
    if (successRate < 70) {
      console.log(`   1. 🚨 CRÍTICO: Tasa de éxito muy baja (${successRate}%)`);
      console.log(`      - Revisar y corregir endpoints fallidos`);
      console.log(`      - Implementar validación consistente`);
    }
    
    if (testsWithWarnings.length > total * 0.3) {
      console.log(`   2. ⚠️  ALTO: Muchas advertencias de seguridad`);
      console.log(`      - Implementar headers de seguridad`);
      console.log(`      - Optimizar tiempos de respuesta`);
    }
    
    console.log(`   3. 📋 Próximos pasos:`);
    console.log(`      - Ejecutar tests en servidor de desarrollo: npm run dev`);
    console.log(`      - Implementar tests unitarios con Jest`);
    console.log(`      - Configurar CI/CD para testing automático`);
    console.log(`      - Agregar monitoring de APIs en producción`);

    console.log(`\n✨ TESTING COMPLETADO`);

    this.testResults.summary = {
      total,
      successRate,
      avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
      warningCount: testsWithWarnings.length
    };
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      results: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    const reportPath = `tests/api-test-report-${Date.now()}.json`;
    
    try {
      await fs.mkdir('tests', { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Reporte guardado: ${reportPath}`);
    } catch (error) {
      console.error(`❌ Error guardando reporte: ${error.message}`);
    }
  }
}

// Mock test runner for offline testing
class OfflineAPITester extends APITester {
  async makeRequest(method, endpoint, data = null, headers = {}) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
    
    // Simulate different responses based on endpoint
    if (endpoint === '/') {
      return { statusCode: 200, headers: { 'content-type': 'text/html' }, data: 'OK' };
    }
    
    if (endpoint.includes('/api/auth/')) {
      return { statusCode: 200, headers: { 'content-type': 'application/json' }, data: { status: 'ok' } };
    }
    
    if (endpoint.includes('/api/admin') && !headers.authorization) {
      return { statusCode: 401, headers: { 'content-type': 'application/json' }, data: { error: 'Unauthorized' } };
    }
    
    if (method === 'POST' && !data) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' }, data: { error: 'Bad Request' } };
    }
    
    if (endpoint.includes('non-existent')) {
      return { statusCode: 404, headers: { 'content-type': 'application/json' }, data: { error: 'Not Found' } };
    }
    
    // Default success response
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, data: { status: 'ok', endpoint } };
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new OfflineAPITester(); // Use offline tester for demo
  tester.runTests()
    .then(() => tester.saveReport())
    .catch(console.error);
}

module.exports = { APITester, OfflineAPITester };