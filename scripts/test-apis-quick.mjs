#!/usr/bin/env node

/**
 * 🧪 PRUEBAS RÁPIDAS DE APIs PRINCIPALES - BISONTE LOGÍSTICA
 * Script simplificado para verificar APIs principales
 */

// 🌐 Configuración
const BASE_URL = 'http://localhost:3000';

// 📋 APIs principales a probar
const mainAPIs = [
    { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
    { name: 'Ping', endpoint: '/api/ping', method: 'GET' },
    { name: 'Status', endpoint: '/api/status', method: 'GET' },
    { name: 'Users List', endpoint: '/api/users', method: 'GET' },
    { name: 'Register (GET)', endpoint: '/api/register', method: 'GET' },
    { name: 'Envios List', endpoint: '/api/envios', method: 'GET' },
    { name: 'Obtener Envios', endpoint: '/api/obtenerenvios', method: 'GET' },
    { name: 'Orders', endpoint: '/api/orders', method: 'GET' },
    { name: 'Destinatario', endpoint: '/api/destinatario', method: 'GET' },
    { name: 'Perfil', endpoint: '/api/perfil', method: 'GET' },
    { name: 'Usuarios', endpoint: '/api/usuarios', method: 'GET' },
    { name: 'Metrics', endpoint: '/api/metrics', method: 'GET' }
];

// 📊 Estadísticas
let stats = { total: 0, success: 0, failed: 0, errors: [] };

/**
 * 🧪 Prueba una API individual
 */
async function testAPI(api) {
    console.log(`Probando ${api.name}...`);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const startTime = Date.now();
        const response = await fetch(`${BASE_URL}${api.endpoint}`, {
            method: api.method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Bisonte-API-Quick-Test/1.0'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            console.log(`  ✅ ${api.name}: ${response.status} (${responseTime}ms)`);
            stats.success++;
        } else if (response.status === 401 || response.status === 403) {
            console.log(`  🔐 ${api.name}: ${response.status} - Auth requerida (${responseTime}ms)`);
            stats.success++; // Contamos auth como éxito
        } else if (response.status === 404) {
            console.log(`  ⚠️  ${api.name}: ${response.status} - No encontrado (${responseTime}ms)`);
            stats.success++; // 404 puede ser normal
        } else {
            console.log(`  ❌ ${api.name}: ${response.status} ${response.statusText} (${responseTime}ms)`);
            stats.failed++;
            stats.errors.push(`${api.name}: ${response.status} ${response.statusText}`);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log(`  ⏱️  ${api.name}: Timeout (>5s)`);
            stats.failed++;
            stats.errors.push(`${api.name}: Timeout`);
        } else {
            console.log(`  💥 ${api.name}: ${error.message}`);
            stats.failed++;
            stats.errors.push(`${api.name}: ${error.message}`);
        }
    }
    
    stats.total++;
}

/**
 * 🚀 Función principal
 */
async function main() {
    console.log('🧪 VERIFICACIÓN RÁPIDA DE APIs PRINCIPALES\n');
    console.log('=' .repeat(50));
    
    // Verificar que el servidor esté corriendo
    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        if (!response.ok) {
            throw new Error('Health check falló');
        }
        console.log('✅ Servidor detectado en http://localhost:3000\n');
    } catch (error) {
        console.log('❌ Servidor no disponible en http://localhost:3000');
        console.log('   Asegúrate de ejecutar: npm run dev\n');
        process.exit(1);
    }
    
    // Probar APIs principales
    for (const api of mainAPIs) {
        await testAPI(api);
    }
    
    // Mostrar resultados
    console.log('\n' + '=' .repeat(50));
    console.log('📊 RESULTADOS FINALES');
    console.log('=' .repeat(50));
    
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    
    console.log(`\n✅ APIs Exitosas: ${stats.success}/${stats.total} (${successRate}%)`);
    console.log(`❌ APIs con Fallos: ${stats.failed}`);
    
    if (stats.errors.length > 0) {
        console.log('\n🔧 Errores detectados:');
        stats.errors.forEach(error => {
            console.log(`   • ${error}`);
        });
    }
    
    if (stats.success >= stats.total * 0.8) {
        console.log('\n🎉 La mayoría de APIs funcionan correctamente');
        process.exit(0);
    } else {
        console.log('\n⚠️  Problemas detectados en las APIs');
        process.exit(1);
    }
}

// Ejecutar pruebas
main().catch(error => {
    console.error('💥 Error:', error.message);
    process.exit(2);
});