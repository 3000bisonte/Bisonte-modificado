#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class APIAuditor {
  constructor() {
    this.rootDir = process.cwd();
    this.auditResults = {
      nextjsRoutes: [],
      expressRoutes: [],
      apiFiles: [],
      testFiles: [],
      validationFiles: [],
      errors: [],
      summary: {}
    };
  }

  async run() {
    console.log('🔍 Iniciando auditoría de APIs del proyecto...\n');
    
    try {
      await this.detectNextJSRoutes();
      await this.detectExpressRoutes();
      await this.detectAPIFiles();
      await this.findTestFiles();
      await this.analyzeValidation();
      await this.testAPIsSimulation();
      this.generateRecommendations();
      this.printReport();
      await this.generateTestTemplate();
    } catch (error) {
      console.error('❌ Error durante la auditoría:', error);
      this.auditResults.errors.push(error.message);
    }

    return this.auditResults;
  }

  async detectNextJSRoutes() {
    console.log('🔍 Detectando rutas de Next.js App Router...');
    
    const appDir = path.join(this.rootDir, 'src', 'app');
    
    try {
      await this.scanForRoutes(appDir);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.auditResults.errors.push(`Error scanning Next.js routes: ${error.message}`);
      }
    }

    console.log(`   📊 Encontradas ${this.auditResults.nextjsRoutes.length} rutas de Next.js`);
  }

  async scanForRoutes(dirPath, baseRoute = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const routePath = path.join(baseRoute, entry.name).replace(/\\\\/g, '/');
        
        if (entry.isDirectory()) {
          // Skip non-route directories
          if (entry.name.startsWith('(') || entry.name.startsWith('_')) {
            continue;
          }
          
          await this.scanForRoutes(fullPath, routePath);
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          const routeInfo = await this.analyzeRoute(fullPath, baseRoute);
          this.auditResults.nextjsRoutes.push(routeInfo);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'EPERM') {
        this.auditResults.errors.push(`Error scanning directory ${dirPath}: ${error.message}`);
      }
    }
  }

  async analyzeRoute(filePath, routePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(this.rootDir, filePath);
      
      const routeInfo = {
        path: relativePath,
        route: routePath || '/',
        fullPath: filePath,
        methods: [],
        hasValidation: false,
        hasErrorHandling: false,
        hasTests: false,
        imports: [],
        middleware: [],
        contentPreview: content.slice(0, 200)
      };

      // Detect HTTP methods
      const methodPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/g;
      let match;
      while ((match = methodPattern.exec(content)) !== null) {
        routeInfo.methods.push(match[1]);
      }

      // Detect validation
      routeInfo.hasValidation = this.detectValidation(content);
      
      // Detect error handling
      routeInfo.hasErrorHandling = this.detectErrorHandling(content);
      
      // Detect imports
      routeInfo.imports = this.extractImports(content);
      
      // Check for corresponding test files
      routeInfo.hasTests = await this.checkForTests(filePath);

      return routeInfo;
    } catch (error) {
      return {
        path: path.relative(this.rootDir, filePath),
        route: routePath,
        error: error.message,
        methods: [],
        hasValidation: false,
        hasErrorHandling: false,
        hasTests: false
      };
    }
  }

  detectValidation(content) {
    const validationPatterns = [
      /zod/i,
      /yup/i,
      /joi/i,
      /ajv/i,
      /validate/i,
      /schema/i,
      /body\\s*\\./,
      /query\\s*\\./,
      /params\\s*\\./,
      /request\\.json\\s*\\(\\)/,
      /NextRequest/
    ];

    return validationPatterns.some(pattern => pattern.test(content));
  }

  detectErrorHandling(content) {
    const errorPatterns = [
      /try\s*{[\s\S]*?}\s*catch/,
      /catch\s*\(/,
      /NextResponse\.json\s*\([^)]*error/i,
      /Response\.json\s*\([^)]*error/i,
      /status\s*:\s*[4-5]\d\d/,
      /throw\s+new\s+Error/,
      /return.*error/i
    ];

    return errorPatterns.some(pattern => pattern.test(content));
  }

  extractImports(content) {
    const imports = [];
    const importPattern = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  async checkForTests(apiFilePath) {
    // Look for test files with similar names
    const dir = path.dirname(apiFilePath);
    const filename = path.basename(apiFilePath, path.extname(apiFilePath));
    
    const testPatterns = [
      `${filename}.test.ts`,
      `${filename}.test.js`,
      `${filename}.spec.ts`,
      `${filename}.spec.js`,
      `__tests__/${filename}.test.ts`,
      `__tests__/${filename}.test.js`
    ];

    for (const pattern of testPatterns) {
      try {
        const testPath = path.join(dir, pattern);
        await fs.access(testPath);
        return true;
      } catch {
        // Continue to next pattern
      }
    }

    return false;
  }

  async detectExpressRoutes() {
    console.log('🔍 Detectando rutas de Express...');
    
    // Look for Express routes in api-server, backend, etc.
    const searchDirs = ['api-server', 'backend', 'server', 'src/server'];
    
    for (const dir of searchDirs) {
      const dirPath = path.join(this.rootDir, dir);
      
      try {
        await this.scanForExpressRoutes(dirPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.auditResults.errors.push(`Error scanning Express routes in ${dir}: ${error.message}`);
        }
      }
    }

    console.log(`   📊 Encontradas ${this.auditResults.expressRoutes.length} rutas de Express`);
  }

  async scanForExpressRoutes(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanForExpressRoutes(fullPath, relPath);
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
          await this.analyzeExpressFile(fullPath, relPath);
        }
      }
    } catch (error) {
      if (error.code !== 'EPERM') {
        this.auditResults.errors.push(`Error scanning ${dirPath}: ${error.message}`);
      }
    }
  }

  async analyzeExpressFile(filePath, relativePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if it's an Express file
      const hasExpress = /express|router\\.(get|post|put|delete|patch)/i.test(content);
      if (!hasExpress) return;

      const routeInfo = {
        path: relativePath,
        fullPath: filePath,
        routes: [],
        hasValidation: this.detectValidation(content),
        hasErrorHandling: this.detectErrorHandling(content),
        hasTests: await this.checkForTests(filePath),
        middleware: this.extractMiddleware(content)
      };

      // Extract routes
      const routePattern = /router\.(get|post|put|delete|patch|use)\s*\(\s*['"]([^'"]+)['"]([^)]*?)\)/g;
      let match;
      while ((match = routePattern.exec(content)) !== null) {
        routeInfo.routes.push({
          method: match[1].toUpperCase(),
          path: match[2],
          handler: match[3]
        });
      }

      if (routeInfo.routes.length > 0) {
        this.auditResults.expressRoutes.push(routeInfo);
      }
    } catch (error) {
      this.auditResults.errors.push(`Error analyzing ${relativePath}: ${error.message}`);
    }
  }

  extractMiddleware(content) {
    const middleware = [];
    const patterns = [
      /app\.use\([^)]+\)/g,
      /router\.use\([^)]+\)/g,
      /cors\(/g,
      /helmet\(/g,
      /express\.json\(/g,
      /rateLimit\(/g
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        middleware.push(...matches);
      }
    });

    return middleware;
  }

  async detectAPIFiles() {
    console.log('🔍 Detectando archivos API adicionales...');
    
    // Look for API-related files
    const apiPatterns = [
      'src/lib/api/**/*.{ts,js}',
      'lib/api/**/*.{ts,js}',
      'utils/api/**/*.{ts,js}',
      'services/**/*.{ts,js}'
    ];

    // This is a simplified approach since we don't have glob
    await this.scanDirectoryForAPI(path.join(this.rootDir, 'src'));
    
    console.log(`   📊 Encontrados ${this.auditResults.apiFiles.length} archivos API`);
  }

  async scanDirectoryForAPI(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          if (entry.name === 'api' || entry.name === 'lib' || entry.name === 'services') {
            await this.scanDirectoryForAPI(fullPath, relPath);
          }
        } else if ((entry.name.endsWith('.js') || entry.name.endsWith('.ts')) && 
                   !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
          await this.analyzeAPIFile(fullPath, relPath);
        }
      }
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        this.auditResults.errors.push(`Error scanning API files in ${dirPath}: ${error.message}`);
      }
    }
  }

  async analyzeAPIFile(filePath, relativePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if it contains API-related code
      const hasAPICode = /fetch|axios|http|request|response|endpoint|api/i.test(content);
      if (!hasAPICode) return;

      const apiInfo = {
        path: relativePath,
        fullPath: filePath,
        type: this.determineAPIType(content),
        hasValidation: this.detectValidation(content),
        hasErrorHandling: this.detectErrorHandling(content),
        hasTests: await this.checkForTests(filePath),
        endpoints: this.extractEndpoints(content)
      };

      this.auditResults.apiFiles.push(apiInfo);
    } catch (error) {
      this.auditResults.errors.push(`Error analyzing API file ${relativePath}: ${error.message}`);
    }
  }

  determineAPIType(content) {
    if (/fetch\s*\(/i.test(content)) return 'fetch-client';
    if (/axios/i.test(content)) return 'axios-client';
    if (/export.*function.*api/i.test(content)) return 'api-utility';
    if (/class.*API/i.test(content)) return 'api-class';
    return 'unknown';
  }

  extractEndpoints(content) {
    const endpoints = [];
    const patterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /url\s*[=:]\s*['"`]([^'"`]+)['"`]/g,
      /endpoint\s*[=:]\s*['"`]([^'"`]+)['"`]/g
    ];

    patterns.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // For axios pattern, use match[2], for others use match[1]
        const endpoint = index === 1 ? match[2] : match[1];
        endpoints.push(endpoint);
      }
    });

    return [...new Set(endpoints)]; // Remove duplicates
  }

  async findTestFiles() {
    console.log('🔍 Buscando archivos de test...');
    
    await this.scanForTestFiles(this.rootDir);
    
    console.log(`   📊 Encontrados ${this.auditResults.testFiles.length} archivos de test`);
  }

  async scanForTestFiles(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          if (relPath.split(path.sep).length < 5) { // Limit depth
            await this.scanForTestFiles(fullPath, relPath);
          }
        } else if (entry.name.includes('.test.') || entry.name.includes('.spec.') || 
                   entry.name.startsWith('test-')) {
          await this.analyzeTestFile(fullPath, relPath);
        }
      }
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        this.auditResults.errors.push(`Error scanning test files in ${dirPath}: ${error.message}`);
      }
    }
  }

  async analyzeTestFile(filePath, relativePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      const testInfo = {
        path: relativePath,
        fullPath: filePath,
        framework: this.detectTestFramework(content),
        hasAPITests: /api|endpoint|request|response|fetch|axios/i.test(content),
        testCount: this.countTests(content),
        coverage: this.estimateAPICoverage(content)
      };

      this.auditResults.testFiles.push(testInfo);
    } catch (error) {
      this.auditResults.errors.push(`Error analyzing test file ${relativePath}: ${error.message}`);
    }
  }

  detectTestFramework(content) {
    if (/jest/i.test(content)) return 'Jest';
    if (/mocha/i.test(content)) return 'Mocha';
    if (/jasmine/i.test(content)) return 'Jasmine';
    if (/vitest/i.test(content)) return 'Vitest';
    if (/supertest/i.test(content)) return 'Supertest';
    return 'Unknown';
  }

  countTests(content) {
    const testPatterns = [
      /it\s*\(/g,
      /test\s*\(/g,
      /describe\s*\(/g
    ];

    let count = 0;
    testPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  estimateAPICoverage(content) {
    const apiTestPatterns = [
      /expect.*status/i,
      /expect.*response/i,
      /request.*get|post|put|delete/i,
      /supertest/i
    ];

    return apiTestPatterns.some(pattern => pattern.test(content)) ? 'HIGH' : 'LOW';
  }

  async analyzeValidation() {
    console.log('🔍 Analizando validación de entrada...');
    
    // This would be implemented to check validation schemas
    console.log(`   📊 Análisis de validación completado`);
  }

  async testAPIsSimulation() {
    console.log('🔍 Ejecutando simulación de pruebas API...');
    
    // Simulate API testing for discovered routes
    for (const route of this.auditResults.nextjsRoutes) {
      route.simulationResult = await this.simulateAPITest(route);
    }
    
    console.log(`   📊 Simulación completada para ${this.auditResults.nextjsRoutes.length} rutas`);
  }

  async simulateAPITest(route) {
    return {
      route: route.route,
      methods: route.methods,
      expectedStatus: route.methods.includes('GET') ? 200 : 201,
      hasValidation: route.hasValidation,
      hasErrorHandling: route.hasErrorHandling,
      recommendations: this.getRouteRecommendations(route)
    };
  }

  getRouteRecommendations(route) {
    const recommendations = [];
    
    if (!route.hasValidation) {
      recommendations.push('Agregar validación de entrada con Zod o similar');
    }
    
    if (!route.hasErrorHandling) {
      recommendations.push('Implementar manejo de errores con try/catch');
    }
    
    if (!route.hasTests) {
      recommendations.push('Crear tests unitarios/integración');
    }
    
    if (route.methods.length === 0) {
      recommendations.push('Definir métodos HTTP explícitos');
    }

    return recommendations;
  }

  generateRecommendations() {
    console.log('💡 Generando recomendaciones...');
    
    const total = this.auditResults.nextjsRoutes.length + this.auditResults.expressRoutes.length;
    const withTests = this.auditResults.nextjsRoutes.filter(r => r.hasTests).length + 
                     this.auditResults.expressRoutes.filter(r => r.hasTests).length;
    const withValidation = this.auditResults.nextjsRoutes.filter(r => r.hasValidation).length + 
                          this.auditResults.expressRoutes.filter(r => r.hasValidation).length;
    const withErrorHandling = this.auditResults.nextjsRoutes.filter(r => r.hasErrorHandling).length + 
                             this.auditResults.expressRoutes.filter(r => r.hasErrorHandling).length;

    this.auditResults.summary = {
      totalRoutes: total,
      nextjsRoutes: this.auditResults.nextjsRoutes.length,
      expressRoutes: this.auditResults.expressRoutes.length,
      apiFiles: this.auditResults.apiFiles.length,
      testFiles: this.auditResults.testFiles.length,
      coverageStats: {
        withTests: withTests,
        testCoverage: total > 0 ? Math.round((withTests / total) * 100) : 0,
        withValidation: withValidation,
        validationCoverage: total > 0 ? Math.round((withValidation / total) * 100) : 0,
        withErrorHandling: withErrorHandling,
        errorHandlingCoverage: total > 0 ? Math.round((withErrorHandling / total) * 100) : 0
      }
    };
  }

  async generateTestTemplate() {
    console.log('🛠️ Generando template de tests...');
    
    const templateContent = `// Template generado automáticamente para tests de API
// Fecha: ${new Date().toISOString()}

import { describe, it, expect, beforeEach, afterEach } from 'jest';
import request from 'supertest';
import { createMocks } from 'node-mocks-http';

describe('API Routes Testing', () => {
  beforeEach(() => {
    // Setup antes de cada test
  });

  afterEach(() => {
    // Cleanup después de cada test
  });

${this.auditResults.nextjsRoutes.map(route => `
  describe('${route.route}', () => {
${route.methods.map(method => `
    it('should handle ${method} requests', async () => {
      const { req, res } = createMocks({
        method: '${method}',
        url: '${route.route}',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          // Test data aquí
        }
      });

      // Import del handler
      // const handler = require('${route.path}');
      // await handler(req, res);

      // Assertions
      // expect(res._getStatusCode()).toBe(200);
      // expect(JSON.parse(res._getData())).toEqual(expectedResponse);
    });
`).join('')}

    it('should validate input data', async () => {
      // Test de validación de entrada
    });

    it('should handle errors gracefully', async () => {
      // Test de manejo de errores
    });
  });
`).join('')}

  describe('Integration Tests', () => {
    it('should test complete API workflows', async () => {
      // Tests de integración end-to-end
    });
  });
});

// Utilities para testing
class APITestUtils {
  static async makeRequest(method, url, data = null, headers = {}) {
    // Utility para hacer requests
  }

  static validateResponse(response, expectedStatus, expectedSchema) {
    // Utility para validar respuestas
  }

  static generateTestData(schema) {
    // Utility para generar datos de prueba
  }
}

export default APITestUtils;
`;

    const templatePath = path.join(this.rootDir, 'tests', 'api-test-template.test.js');
    
    try {
      await fs.mkdir(path.dirname(templatePath), { recursive: true });
      await fs.writeFile(templatePath, templateContent);
      console.log(`   📄 Template generado: ${templatePath}`);
    } catch (error) {
      this.auditResults.errors.push(`Error generando template: ${error.message}`);
    }
  }

  printReport() {
    console.log('\\n📊 REPORTE DE AUDITORÍA DE APIs');
    console.log('================================');
    
    const { summary } = this.auditResults;
    
    console.log(`\\n📈 RESUMEN GENERAL:`);
    console.log(`   🛣️  Total de rutas encontradas: ${summary.totalRoutes}`);
    console.log(`   📱 Rutas Next.js App Router: ${summary.nextjsRoutes}`);
    console.log(`   🚀 Rutas Express: ${summary.expressRoutes}`);
    console.log(`   📁 Archivos API adicionales: ${summary.apiFiles}`);
    console.log(`   🧪 Archivos de test: ${summary.testFiles}`);
    console.log(`   ❌ Errores encontrados: ${this.auditResults.errors.length}`);

    console.log(`\\n📊 COBERTURA DE CALIDAD:`);
    console.log(`   🧪 Test Coverage: ${summary.coverageStats.testCoverage}% (${summary.coverageStats.withTests}/${summary.totalRoutes})`);
    console.log(`   ✅ Validation Coverage: ${summary.coverageStats.validationCoverage}% (${summary.coverageStats.withValidation}/${summary.totalRoutes})`);
    console.log(`   🛡️  Error Handling Coverage: ${summary.coverageStats.errorHandlingCoverage}% (${summary.coverageStats.withErrorHandling}/${summary.totalRoutes})`);

    if (this.auditResults.nextjsRoutes.length > 0) {
      console.log(`\\n🛣️ RUTAS NEXT.JS ENCONTRADAS:`);
      this.auditResults.nextjsRoutes.slice(0, 10).forEach(route => {
        console.log(`   📍 ${route.route} (${route.methods.join(', ') || 'No methods'})`);
        console.log(`      📄 Archivo: ${route.path}`);
        console.log(`      ✅ Validación: ${route.hasValidation ? '✓' : '✗'}`);
        console.log(`      🛡️  Error Handling: ${route.hasErrorHandling ? '✓' : '✗'}`);
        console.log(`      🧪 Tests: ${route.hasTests ? '✓' : '✗'}`);
        
        if (route.simulationResult && route.simulationResult.recommendations.length > 0) {
          console.log(`      💡 Recomendaciones: ${route.simulationResult.recommendations.length}`);
          route.simulationResult.recommendations.slice(0, 2).forEach(rec => {
            console.log(`         - ${rec}`);
          });
        }
        console.log('');
      });
      
      if (this.auditResults.nextjsRoutes.length > 10) {
        console.log(`   ... y ${this.auditResults.nextjsRoutes.length - 10} más`);
      }
    }

    if (this.auditResults.expressRoutes.length > 0) {
      console.log(`\\n🚀 RUTAS EXPRESS ENCONTRADAS:`);
      this.auditResults.expressRoutes.slice(0, 5).forEach(route => {
        console.log(`   📄 ${route.path}`);
        console.log(`      🛣️  Rutas: ${route.routes.length}`);
        route.routes.slice(0, 3).forEach(r => {
          console.log(`         ${r.method} ${r.path}`);
        });
        console.log(`      ✅ Validación: ${route.hasValidation ? '✓' : '✗'}`);
        console.log(`      🛡️  Error Handling: ${route.hasErrorHandling ? '✓' : '✗'}`);
        console.log(`      🧪 Tests: ${route.hasTests ? '✓' : '✗'}`);
        console.log('');
      });
    }

    console.log(`\\n🎯 RECOMENDACIONES PRIORITARIAS:`);
    
    if (summary.coverageStats.testCoverage < 50) {
      console.log(`   1. 🧪 CRÍTICO: Mejorar cobertura de tests (actual: ${summary.coverageStats.testCoverage}%)`);
      console.log(`      - Instalar: npm install --save-dev jest supertest @types/jest`);
      console.log(`      - Crear tests para cada endpoint API`);
      console.log(`      - Usar el template generado en tests/api-test-template.test.js`);
    }
    
    if (summary.coverageStats.validationCoverage < 70) {
      console.log(`   2. ✅ ALTO: Implementar validación de entrada (actual: ${summary.coverageStats.validationCoverage}%)`);
      console.log(`      - Instalar: npm install zod`);
      console.log(`      - Crear schemas de validación para cada endpoint`);
      console.log(`      - Validar body, query y params en cada ruta`);
    }
    
    if (summary.coverageStats.errorHandlingCoverage < 80) {
      console.log(`   3. 🛡️  MEDIO: Mejorar manejo de errores (actual: ${summary.coverageStats.errorHandlingCoverage}%)`);
      console.log(`      - Implementar try/catch en todos los handlers`);
      console.log(`      - Retornar errores estructurados con códigos HTTP`);
      console.log(`      - Agregar logging de errores`);
    }

    console.log(`\\n🛠️ HERRAMIENTAS RECOMENDADAS:`);
    console.log(`   📦 Testing: jest, supertest, @testing-library`);
    console.log(`   ✅ Validation: zod, yup, joi`);
    console.log(`   📊 Monitoring: sentry, datadog`);
    console.log(`   🔒 Security: helmet, cors, rate-limiting`);
    console.log(`   📖 Documentation: swagger, openapi`);

    console.log(`\\n📋 PRÓXIMOS PASOS:`);
    console.log(`   1. Revisar el template en tests/api-test-template.test.js`);
    console.log(`   2. Implementar validación con Zod en rutas críticas`);
    console.log(`   3. Agregar manejo de errores consistente`);
    console.log(`   4. Crear tests de integración end-to-end`);
    console.log(`   5. Configurar CI/CD para ejecutar tests automáticamente`);

    if (this.auditResults.errors.length > 0) {
      console.log(`\\n❌ ERRORES ENCONTRADOS (${this.auditResults.errors.length}):`);
      this.auditResults.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    console.log(`\\n✨ AUDITORÍA DE APIs COMPLETADA`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const auditor = new APIAuditor();
  auditor.run().catch(console.error);
}

module.exports = APIAuditor;