#!/usr/bin/env node

/**
 * 🔧 REPARACIÓN RÁPIDA DE APIs - BISONTE LOGÍSTICA
 * Script para validar y probar APIs básicas sin autenticación compleja
 */

const BASE_URL = 'http://localhost:3000';

const basicAPIs = [
    { name: 'Health', endpoint: '/api/health', expected: 200 },
    { name: 'Ping', endpoint: '/api/ping', expected: 200 },
    { name: 'Status', endpoint: '/api/status', expected: 200 },
    { name: 'Metrics', endpoint: '/api/metrics', expected: 200 }
];

async function testBasicAPI(api) {
    try {
        console.log(`Testing ${api.name}...`);
        const response = await fetch(`${BASE_URL}${api.endpoint}`);
        const status = response.status;
        
        if (status === api.expected) {
            console.log(`  ✅ ${api.name}: ${status} OK`);
            return true;
        } else {
            const text = await response.text();
            console.log(`  ❌ ${api.name}: ${status} - ${text.substring(0, 100)}`);
            return false;
        }
    } catch (error) {
        console.log(`  💥 ${api.name}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🔧 VERIFICACIÓN BÁSICA DE APIs SIN AUTENTICACIÓN\n');
    
    let passed = 0;
    let total = basicAPIs.length;
    
    for (const api of basicAPIs) {
        const result = await testBasicAPI(api);
        if (result) passed++;
    }
    
    console.log(`\n📊 Resultado: ${passed}/${total} APIs básicas funcionando`);
    
    if (passed === total) {
        console.log('✅ APIs básicas funcionan correctamente');
        
        // Ahora probar APIs problemáticas una por una
        console.log('\n🔍 Probando APIs problemáticas...');
        
        const problematicAPIs = [
            '/api/users',
            '/api/envios', 
            '/api/obtenerenvios',
            '/api/orders',
            '/api/usuarios'
        ];
        
        for (const endpoint of problematicAPIs) {
            try {
                console.log(`Testing ${endpoint}...`);
                const response = await fetch(`${BASE_URL}${endpoint}`);
                console.log(`  Status: ${response.status}`);
                
                if (response.status >= 500) {
                    const text = await response.text();
                    console.log(`  Error: ${text.substring(0, 200)}`);
                }
            } catch (error) {
                console.log(`  Error: ${error.message}`);
            }
        }
    }
}

main().catch(console.error);