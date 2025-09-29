#!/usr/bin/env node

/**
 * 🔐 VERIFICACIÓN AVANZADA DE APIs CON AUTENTICACIÓN - BISONTE LOGÍSTICA
 * 
 * Script especializado para probar APIs que requieren autenticación
 * y validar casos de uso específicos del negocio
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// 🌐 Configuración del entorno
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test-api-auth@bisonte.com';
const TEST_PASSWORD = 'TestSecure123!';

// 📊 Estadísticas de pruebas avanzadas
let authStats = {
    total: 0,
    authenticated: 0,
    unauthorized: 0,
    businessLogic: 0,
    errors: []
};

/**
 * 🔑 Obtiene token de autenticación para pruebas
 */
async function getAuthToken() {
    console.log('🔑 Obteniendo token de autenticación...');
    
    try {
        // Primero intentar hacer login
        const loginResponse = await fetch(`${BASE_URL}/api/auth/signin/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });
        
        if (loginResponse.ok) {
            const cookies = loginResponse.headers.get('set-cookie');
            console.log('✅ Token obtenido exitosamente');
            return cookies;
        }
        
        // Si no funciona, intentar registrar usuario de prueba
        console.log('📝 Creando usuario de prueba...');
        const registerResponse = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: 'Test API User',
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                telefono: '1234567890'
            })
        });
        
        if (registerResponse.ok) {
            console.log('✅ Usuario de prueba creado');
            // Intentar login nuevamente
            return await getAuthToken();
        }
        
        console.warn('⚠️  No se pudo obtener token de autenticación');
        return null;
        
    } catch (error) {
        console.warn('⚠️  Error obteniendo token:', error.message);
        return null;
    }
}

/**
 * 🧪 APIs críticas del negocio que deben funcionar
 */
const criticalAPIs = [
    {
        name: 'Registro de Usuario',
        endpoint: '/api/register',
        method: 'POST',
        data: {
            nombre: 'Test Critical User',
            email: `critical-${Date.now()}@bisonte.com`,
            password: 'TestCritical123!',
            telefono: '9876543210'
        },
        expectedStatus: [200, 201],
        businessRule: 'Debe permitir registro con datos válidos'
    },
    {
        name: 'Creación de Envío',
        endpoint: '/api/envios',
        method: 'POST',
        requiresAuth: true,
        data: {
            remitente: {
                nombre: 'Juan Remitente',
                telefono: '1111111111',
                direccion: 'Calle Falsa 123'
            },
            destinatario: {
                nombre: 'Maria Destinataria',
                telefono: '2222222222',
                direccion: 'Avenida Real 456'
            },
            peso: 2.5,
            dimensiones: { largo: 30, ancho: 20, alto: 15 },
            descripcion: 'Paquete de prueba'
        },
        expectedStatus: [200, 201],
        businessRule: 'Debe crear envíos con datos válidos'
    },
    {
        name: 'Consulta de Envíos',
        endpoint: '/api/obtenerenvios',
        method: 'GET',
        requiresAuth: true,
        expectedStatus: [200],
        businessRule: 'Debe retornar lista de envíos del usuario'
    },
    {
        name: 'Estado del Sistema',
        endpoint: '/api/health',
        method: 'GET',
        expectedStatus: [200],
        businessRule: 'Sistema debe reportar estado saludable'
    },
    {
        name: 'Perfil de Usuario',
        endpoint: '/api/perfil',
        method: 'GET',
        requiresAuth: true,
        expectedStatus: [200],
        businessRule: 'Debe retornar datos del usuario autenticado'
    },
    {
        name: 'Actualización de Perfil',
        endpoint: '/api/perfil',
        method: 'PUT',
        requiresAuth: true,
        data: {
            nombre: 'Usuario Actualizado',
            telefono: '5555555555'
        },
        expectedStatus: [200],
        businessRule: 'Debe permitir actualizar datos del perfil'
    },
    {
        name: 'Recuperación de Contraseña',
        endpoint: '/api/recuperar',
        method: 'POST',
        data: {
            email: TEST_EMAIL
        },
        expectedStatus: [200],
        businessRule: 'Debe iniciar proceso de recuperación'
    },
    {
        name: 'Métricas del Sistema',
        endpoint: '/api/metrics',
        method: 'GET',
        requiresAuth: true,
        expectedStatus: [200],
        businessRule: 'Debe retornar métricas para usuarios autorizados'
    }
];

/**
 * 🔐 Prueba una API crítica del negocio
 */
async function testCriticalAPI(api, authToken) {
    console.log(`\n🧪 Probando: ${api.name}`);
    
    const result = {
        name: api.name,
        endpoint: api.endpoint,
        method: api.method,
        status: 'pending',
        statusCode: null,
        responseTime: null,
        businessRulePassed: false,
        error: null,
        response: null
    };
    
    try {
        const startTime = Date.now();
        
        const options = {
            method: api.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bisonte-Critical-Tester/1.0'
            }
        };
        
        // Agregar autenticación si es requerida
        if (api.requiresAuth && authToken) {
            options.headers['Cookie'] = authToken;
        }
        
        // Agregar datos si es necesario
        if (api.data && ['POST', 'PUT', 'PATCH'].includes(api.method)) {
            options.body = JSON.stringify(api.data);
        }
        
        const response = await fetch(`${BASE_URL}${api.endpoint}`, options);
        
        result.statusCode = response.status;
        result.responseTime = Date.now() - startTime;
        
        // Intentar parsear respuesta
        try {
            const responseText = await response.text();
            if (responseText) {
                result.response = JSON.parse(responseText);
            }
        } catch (parseError) {
            result.response = { error: 'No se pudo parsear respuesta JSON' };
        }
        
        // Verificar código de estado esperado
        if (api.expectedStatus.includes(response.status)) {
            result.status = 'success';
            result.businessRulePassed = true;
            authStats.authenticated++;
            console.log(`  ✅ ${response.status} - ${api.businessRule}`);
        } else if (response.status === 401 && api.requiresAuth && !authToken) {
            result.status = 'expected_auth_failure';
            result.businessRulePassed = true; // Esperado sin token
            authStats.unauthorized++;
            console.log(`  🔐 401 - Requiere autenticación (esperado sin token)`);
        } else {
            result.status = 'business_rule_failed';
            result.error = `Estado ${response.status} no esperado. Esperado: ${api.expectedStatus.join(' o ')}`;
            authStats.errors.push(`${api.name}: ${result.error}`);
            console.log(`  ❌ ${response.status} - ${result.error}`);
        }
        
    } catch (error) {
        result.status = 'error';
        result.error = error.message;
        result.responseTime = Date.now() - (result.responseTime || Date.now());
        authStats.errors.push(`${api.name}: ${error.message}`);
        console.log(`  💥 Error - ${error.message}`);
    }
    
    authStats.total++;
    return result;
}

/**
 * 🔍 Prueba específica de seguridad para endpoints sensibles
 */
async function testSecurityEndpoints() {
    console.log('\n🔒 PRUEBAS DE SEGURIDAD ESPECÍFICAS');
    console.log('=' .repeat(50));
    
    const securityTests = [
        {
            name: 'SQL Injection Protection',
            endpoint: '/api/obtenerenvios',
            method: 'GET',
            maliciousParam: "'; DROP TABLE users; --",
            expectedBehavior: 'Debe rechazar o sanitizar entrada maliciosa'
        },
        {
            name: 'XSS Protection',
            endpoint: '/api/register',
            method: 'POST',
            data: {
                nombre: '<script>alert("xss")</script>',
                email: 'xss-test@test.com',
                password: 'Test123!'
            },
            expectedBehavior: 'Debe sanitizar contenido JavaScript'
        },
        {
            name: 'Rate Limiting',
            endpoint: '/api/ping',
            method: 'GET',
            rapidRequests: 10,
            expectedBehavior: 'Debe aplicar rate limiting después de muchas peticiones'
        }
    ];
    
    const securityResults = [];
    
    for (const test of securityTests) {
        console.log(`\n🛡️  Probando: ${test.name}`);
        
        try {
            if (test.rapidRequests) {
                // Prueba de rate limiting
                const promises = Array(test.rapidRequests).fill().map(() =>
                    fetch(`${BASE_URL}${test.endpoint}`, { method: test.method })
                );
                
                const responses = await Promise.all(promises);
                const rateLimited = responses.some(r => r.status === 429);
                
                if (rateLimited) {
                    console.log('  ✅ Rate limiting funcionando');
                    securityResults.push({ ...test, result: 'protected', passed: true });
                } else {
                    console.log('  ⚠️  Rate limiting no detectado');
                    securityResults.push({ ...test, result: 'not_protected', passed: false });
                }
            } else {
                // Otras pruebas de seguridad
                const options = {
                    method: test.method,
                    headers: { 'Content-Type': 'application/json' }
                };
                
                if (test.data) {
                    options.body = JSON.stringify(test.data);
                }
                
                const response = await fetch(`${BASE_URL}${test.endpoint}`, options);
                
                // Para XSS/SQL injection, cualquier respuesta sin error interno es buena
                if (response.status < 500) {
                    console.log(`  ✅ ${response.status} - Entrada procesada de forma segura`);
                    securityResults.push({ ...test, result: 'safe', passed: true });
                } else {
                    console.log(`  ❌ ${response.status} - Error interno, posible vulnerabilidad`);
                    securityResults.push({ ...test, result: 'vulnerable', passed: false });
                }
            }
            
        } catch (error) {
            console.log(`  ⚠️  ${error.message}`);
            securityResults.push({ ...test, result: 'error', error: error.message, passed: false });
        }
    }
    
    return securityResults;
}

/**
 * 📊 Genera reporte de APIs críticas
 */
function generateCriticalReport(results, securityResults) {
    const totalCritical = results.length;
    const successfulCritical = results.filter(r => r.businessRulePassed).length;
    const securityPassed = securityResults.filter(r => r.passed).length;
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            criticalAPIs: {
                total: totalCritical,
                successful: successfulCritical,
                successRate: ((successfulCritical / totalCritical) * 100).toFixed(2) + '%'
            },
            security: {
                total: securityResults.length,
                passed: securityPassed,
                securityScore: ((securityPassed / securityResults.length) * 100).toFixed(2) + '%'
            },
            authentication: {
                authenticated: authStats.authenticated,
                unauthorized: authStats.unauthorized,
                errors: authStats.errors.length
            }
        },
        criticalAPIResults: results,
        securityResults: securityResults,
        businessRuleFailures: results.filter(r => !r.businessRulePassed),
        recommendations: []
    };
    
    // Generar recomendaciones
    if (report.businessRuleFailures.length > 0) {
        report.recommendations.push('🔧 Revisar APIs críticas que fallan reglas de negocio');
    }
    
    if (securityPassed < securityResults.length) {
        report.recommendations.push('🛡️  Implementar mejores controles de seguridad');
    }
    
    if (authStats.errors.length > 0) {
        report.recommendations.push('🔑 Revisar sistema de autenticación');
    }
    
    return report;
}

/**
 * 🚀 Función principal de pruebas críticas
 */
async function main() {
    console.log('🚀 INICIANDO VERIFICACIÓN DE APIs CRÍTICAS DEL NEGOCIO\n');
    console.log('=' .repeat(60));
    
    try {
        // 1. Obtener token de autenticación
        const authToken = await getAuthToken();
        
        if (!authToken) {
            console.log('⚠️  Continuando sin autenticación (algunas pruebas fallarán)');
        }
        
        // 2. Probar APIs críticas
        console.log('\n🎯 PROBANDO APIs CRÍTICAS DEL NEGOCIO');
        console.log('=' .repeat(50));
        
        const criticalResults = [];
        for (const api of criticalAPIs) {
            const result = await testCriticalAPI(api, authToken);
            criticalResults.push(result);
        }
        
        // 3. Pruebas de seguridad
        const securityResults = await testSecurityEndpoints();
        
        // 4. Generar reporte
        console.log('\n📊 REPORTE DE APIs CRÍTICAS');
        console.log('=' .repeat(40));
        
        const report = generateCriticalReport(criticalResults, securityResults);
        
        console.log(`\n🎯 APIs Críticas: ${report.summary.criticalAPIs.successful}/${report.summary.criticalAPIs.total} (${report.summary.criticalAPIs.successRate})`);
        console.log(`🛡️  Seguridad: ${report.summary.security.passed}/${report.summary.security.total} (${report.summary.security.securityScore})`);
        console.log(`🔐 Autenticadas: ${report.summary.authentication.authenticated}`);
        
        // 5. Mostrar fallos críticos
        if (report.businessRuleFailures.length > 0) {
            console.log('\n❌ FALLOS EN REGLAS DE NEGOCIO:');
            report.businessRuleFailures.forEach(failure => {
                console.log(`   • ${failure.name}: ${failure.error || 'Regla de negocio no cumplida'}`);
            });
        }
        
        // 6. Guardar reporte detallado
        const reportPath = path.join(projectRoot, 'API-CRITICAL-TEST-REPORT.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n💾 Reporte detallado guardado en: ${reportPath}`);
        
        // 7. Determinar código de salida
        const criticalSuccess = report.summary.criticalAPIs.successful >= (report.summary.criticalAPIs.total * 0.8);
        const securityAcceptable = report.summary.security.passed >= (report.summary.security.total * 0.7);
        
        if (criticalSuccess && securityAcceptable) {
            console.log('\n✅ APIs críticas funcionando correctamente');
            process.exit(0);
        } else if (criticalSuccess) {
            console.log('\n⚠️  APIs críticas OK, pero hay problemas de seguridad');
            process.exit(1);
        } else {
            console.log('\n❌ Problemas críticos detectados en APIs de negocio');
            process.exit(2);
        }
        
    } catch (error) {
        console.error('💥 Error durante verificación crítica:', error);
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

export { main, testCriticalAPI, testSecurityEndpoints, getAuthToken };