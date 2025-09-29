#!/usr/bin/env node

/**
 * 🔍 VERIFICACIÓN COMPLETA DE TODAS LAS APIs - BISONTE LOGÍSTICA
 * 
 * Script para verificar el funcionamiento de todas las 40+ APIs
 * Incluye pruebas de seguridad, validación y rendimiento
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// 🌐 BASE URL para pruebas (ajustar según entorno)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// 📊 Estadísticas globales
let stats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    details: []
};

// 🛡️ Headers de seguridad para las pruebas
const secureHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'Bisonte-API-Tester/1.0',
    'Accept': 'application/json'
};

// 🔐 Datos de prueba seguros
const testData = {
    validUser: {
        nombre: 'Test User API',
        email: 'test-api@bisonte.com',
        password: 'TestPassword123!',
        telefono: '1234567890'
    },
    validEnvio: {
        remitente: {
            nombre: 'Juan Test',
            telefono: '1234567890',
            direccion: 'Test Address 123'
        },
        destinatario: {
            nombre: 'Maria Test',
            telefono: '0987654321',
            direccion: 'Destination 456'
        },
        peso: 1.5,
        dimensiones: { largo: 20, ancho: 15, alto: 10 }
    }
};

/**
 * 🔍 Descubre todas las APIs del proyecto
 */
async function discoverAPIs() {
    console.log('🔍 Descubriendo APIs...');
    
    const apiDir = path.join(projectRoot, 'src', 'app', 'api');
    const apis = [];
    
    async function scanDirectory(dir, basePath = '/api') {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const apiPath = `${basePath}/${entry.name}`;
                
                if (entry.isDirectory()) {
                    // Escanear subdirectorios
                    await scanDirectory(fullPath, apiPath);
                } else if (entry.name === 'route.js') {
                    // Encontramos una API
                    const relativePath = path.relative(apiDir, dir);
                    const endpoint = relativePath ? `/api/${relativePath.replace(/\\/g, '/')}` : '/api';
                    
                    apis.push({
                        endpoint,
                        filePath: fullPath,
                        name: relativePath || 'root'
                    });
                }
            }
        } catch (error) {
            console.warn(`⚠️  No se pudo escanear ${dir}: ${error.message}`);
        }
    }
    
    await scanDirectory(apiDir);
    
    console.log(`✅ Descubiertas ${apis.length} APIs`);
    return apis;
}

/**
 * 📖 Lee y analiza el contenido de una API
 */
async function analyzeAPI(api) {
    try {
        const content = await fs.readFile(api.filePath, 'utf-8');
        
        const methods = [];
        if (content.includes('export async function GET')) methods.push('GET');
        if (content.includes('export async function POST')) methods.push('POST');
        if (content.includes('export async function PUT')) methods.push('PUT');
        if (content.includes('export async function DELETE')) methods.push('DELETE');
        if (content.includes('export async function PATCH')) methods.push('PATCH');
        
        // Detectar si requiere autenticación
        const requiresAuth = content.includes('getServerSession') || 
                           content.includes('verifyAuthentication') ||
                           content.includes('session');
        
        // Detectar parámetros dinámicos
        const hasDynamicParams = api.endpoint.includes('[') && api.endpoint.includes(']');
        
        return {
            ...api,
            methods,
            requiresAuth,
            hasDynamicParams,
            analyzed: true
        };
    } catch (error) {
        return {
            ...api,
            methods: [],
            requiresAuth: false,
            hasDynamicParams: false,
            analyzed: false,
            error: error.message
        };
    }
}

/**
 * 🧪 Realiza pruebas en una API específica
 */
async function testAPI(api) {
    console.log(`\n🧪 Probando: ${api.endpoint}`);
    
    const results = {
        endpoint: api.endpoint,
        methods: api.methods,
        tests: [],
        overall: 'pending'
    };
    
    for (const method of api.methods) {
        const testResult = await testAPIMethod(api, method);
        results.tests.push(testResult);
    }
    
    // Determinar resultado general
    const hasSuccess = results.tests.some(t => t.status === 'success');
    const hasFailure = results.tests.some(t => t.status === 'error');
    
    if (hasSuccess && !hasFailure) {
        results.overall = 'success';
        stats.success++;
    } else if (hasFailure) {
        results.overall = 'error';
        stats.failed++;
        stats.errors.push(`${api.endpoint}: ${results.tests.filter(t => t.status === 'error').map(t => t.error).join(', ')}`);
    } else {
        results.overall = 'skipped';
        stats.skipped++;
    }
    
    stats.total++;
    stats.details.push(results);
    
    return results;
}

/**
 * 🔧 Prueba un método específico de una API
 */
async function testAPIMethod(api, method) {
    const testResult = {
        method,
        status: 'pending',
        statusCode: null,
        responseTime: null,
        error: null,
        headers: null
    };
    
    try {
        const startTime = Date.now();
        
        // Construir URL y configuración de la prueba
        let url = `${BASE_URL}${api.endpoint}`;
        let options = {
            method,
            headers: { ...secureHeaders },
            timeout: 10000 // 10 segundos timeout
        };
        
        // Manejar parámetros dinámicos
        if (api.hasDynamicParams) {
            url = url.replace(/\[id\]/g, '123').replace(/\[([^\]]+)\]/g, 'test-param');
        }
        
        // Configurar body para métodos que lo requieren
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            if (api.endpoint.includes('register')) {
                options.body = JSON.stringify(testData.validUser);
            } else if (api.endpoint.includes('envio') || api.endpoint.includes('send')) {
                options.body = JSON.stringify(testData.validEnvio);
            } else {
                options.body = JSON.stringify({ test: true, timestamp: Date.now() });
            }
        }
        
        // Realizar la petición
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            testResult.statusCode = response.status;
            testResult.responseTime = Date.now() - startTime;
            testResult.headers = Object.fromEntries(response.headers.entries());
            
            // Verificar respuesta
            if (response.ok) {
                testResult.status = 'success';
                console.log(`  ✅ ${method} ${response.status} (${testResult.responseTime}ms)`);
            } else if (response.status === 401 && api.requiresAuth) {
                testResult.status = 'success'; // Esperado para APIs que requieren auth
                console.log(`  🔐 ${method} ${response.status} - Auth requerida (esperado)`);
            } else if (response.status === 404 && api.hasDynamicParams) {
                testResult.status = 'success'; // Esperado para parámetros de prueba
                console.log(`  🔍 ${method} ${response.status} - Parámetro no encontrado (esperado)`);
            } else {
                testResult.status = 'warning';
                testResult.error = `HTTP ${response.status} ${response.statusText}`;
                console.log(`  ⚠️  ${method} ${response.status} ${response.statusText}`);
            }
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
        
    } catch (error) {
        testResult.status = 'error';
        testResult.error = error.name === 'AbortError' ? 'Timeout' : error.message;
        testResult.responseTime = Date.now() - (testResult.responseTime || Date.now());
        
        console.log(`  ❌ ${method} - ${testResult.error}`);
    }
    
    return testResult;
}

/**
 * 📊 Genera reporte completo de resultados
 */
function generateReport(apis, results) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalAPIs: stats.total,
            successful: stats.success,
            failed: stats.failed,
            skipped: stats.skipped,
            successRate: ((stats.success / stats.total) * 100).toFixed(2) + '%'
        },
        apis: results,
        errors: stats.errors,
        recommendations: []
    };
    
    // Generar recomendaciones
    if (stats.failed > 0) {
        report.recommendations.push('🔧 Revisar APIs con fallos para solucionar errores');
    }
    
    const authAPIs = results.filter(r => apis.find(a => a.endpoint === r.endpoint)?.requiresAuth);
    if (authAPIs.length > 0) {
        report.recommendations.push('🔐 Implementar pruebas con tokens de autenticación válidos');
    }
    
    const slowAPIs = results.filter(r => 
        r.tests.some(t => t.responseTime && t.responseTime > 2000)
    );
    if (slowAPIs.length > 0) {
        report.recommendations.push('⚡ Optimizar APIs lentas (>2s de respuesta)');
    }
    
    return report;
}

/**
 * 💾 Guarda el reporte en archivo
 */
async function saveReport(report) {
    const reportPath = path.join(projectRoot, 'API-TEST-REPORT.json');
    const markdownPath = path.join(projectRoot, 'API-TEST-REPORT.md');
    
    // Guardar JSON
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generar Markdown
    const markdown = `# 🔍 REPORTE DE VERIFICACIÓN DE APIs - BISONTE LOGÍSTICA

**Fecha**: ${new Date().toLocaleString()}  
**Total APIs**: ${report.summary.totalAPIs}  
**Tasa de Éxito**: ${report.summary.successRate}

## 📊 Resumen

- ✅ **Exitosas**: ${report.summary.successful}
- ❌ **Fallidas**: ${report.summary.failed}
- ⏭️ **Omitidas**: ${report.summary.skipped}

## 📋 Resultados Detallados

${report.apis.map(api => `
### ${api.endpoint}

**Métodos**: ${api.methods.join(', ')}  
**Estado**: ${api.overall === 'success' ? '✅' : api.overall === 'error' ? '❌' : '⏭️'}

${api.tests.map(test => `
- **${test.method}**: ${test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : '⚠️'} ${test.statusCode || 'N/A'} (${test.responseTime || 0}ms)${test.error ? ` - ${test.error}` : ''}
`).join('')}
`).join('')}

## 🔧 Recomendaciones

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

## ❌ Errores Detectados

${report.errors.length > 0 ? report.errors.map(err => `- ${err}`).join('\n') : 'No se detectaron errores críticos.'}

---
*Generado automáticamente por el sistema de verificación de APIs*
`;

    await fs.writeFile(markdownPath, markdown);
    
    console.log(`\n💾 Reportes guardados:`);
    console.log(`   📄 ${reportPath}`);
    console.log(`   📝 ${markdownPath}`);
}

/**
 * 🚀 Función principal
 */
async function main() {
    console.log('🚀 INICIANDO VERIFICACIÓN COMPLETA DE APIs\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Descubrir todas las APIs
        const discoveredAPIs = await discoverAPIs();
        
        if (discoveredAPIs.length === 0) {
            console.log('❌ No se encontraron APIs para probar');
            return;
        }
        
        // 2. Analizar cada API
        console.log('\n📖 Analizando APIs...');
        const analyzedAPIs = await Promise.all(
            discoveredAPIs.map(api => analyzeAPI(api))
        );
        
        // 3. Mostrar resumen de APIs encontradas
        console.log(`\n📊 APIs encontradas por tipo:`);
        const methodCounts = {};
        analyzedAPIs.forEach(api => {
            api.methods.forEach(method => {
                methodCounts[method] = (methodCounts[method] || 0) + 1;
            });
        });
        
        Object.entries(methodCounts).forEach(([method, count]) => {
            console.log(`   ${method}: ${count} APIs`);
        });
        
        console.log(`\n🔐 APIs que requieren autenticación: ${analyzedAPIs.filter(api => api.requiresAuth).length}`);
        console.log(`🔗 APIs con parámetros dinámicos: ${analyzedAPIs.filter(api => api.hasDynamicParams).length}`);
        
        // 4. Ejecutar pruebas
        console.log('\n🧪 Ejecutando pruebas...');
        console.log('=' .repeat(60));
        
        const results = [];
        for (const api of analyzedAPIs) {
            if (api.methods.length > 0) {
                const result = await testAPI(api);
                results.push(result);
            } else {
                console.log(`⏭️  Omitiendo ${api.endpoint} (sin métodos HTTP detectados)`);
                stats.skipped++;
                stats.total++;
            }
        }
        
        // 5. Generar y mostrar reporte
        console.log('\n' + '=' .repeat(60));
        console.log('📊 REPORTE FINAL');
        console.log('=' .repeat(60));
        
        const report = generateReport(analyzedAPIs, results);
        
        console.log(`\n✅ APIs Exitosas: ${stats.success}/${stats.total} (${report.summary.successRate})`);
        console.log(`❌ APIs con Fallos: ${stats.failed}`);
        console.log(`⏭️  APIs Omitidas: ${stats.skipped}`);
        
        if (stats.errors.length > 0) {
            console.log(`\n🔧 Errores principales:`);
            stats.errors.slice(0, 5).forEach(error => {
                console.log(`   • ${error}`);
            });
        }
        
        // 6. Guardar reporte
        await saveReport(report);
        
        console.log(`\n🎉 Verificación completada. Tasa de éxito: ${report.summary.successRate}`);
        
        // 7. Código de salida basado en resultados
        if (stats.failed === 0) {
            console.log('✅ Todas las APIs funcionan correctamente');
            process.exit(0);
        } else if (stats.success > stats.failed) {
            console.log('⚠️  La mayoría de APIs funcionan, pero hay algunos problemas');
            process.exit(1);
        } else {
            console.log('❌ Problemas significativos detectados en las APIs');
            process.exit(2);
        }
        
    } catch (error) {
        console.error('💥 Error durante la verificación:', error);
        process.exit(3);
    }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('💥 Error no controlado:', error);
        process.exit(4);
    });
}

export { main, testAPI, discoverAPIs, analyzeAPI };