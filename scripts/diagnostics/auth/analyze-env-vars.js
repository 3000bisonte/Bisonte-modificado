#!/usr/bin/env node

/**
 * 🔍 ANÁLISIS CRÍTICO DE VARIABLES DE ENTORNO
 * Identifica inconsistencias entre archivos .env y producción
 */

console.log('🔍 ANÁLISIS CRÍTICO DE VARIABLES DE ENTORNO');
console.log('===========================================\n');

const fs = require('fs');
const path = require('path');

// Función para leer y parsear archivo .env
function parseEnvFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, variables: {} };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const variables = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        variables[key.trim()] = value;
      }
    });
    
    return { exists: true, variables };
  } catch (error) {
    return { exists: false, error: error.message, variables: {} };
  }
}

// Archivos a verificar
const envFiles = [
  { path: '.env', name: 'Base (.env)' },
  { path: '.env.local', name: 'Local (.env.local)' },
  { path: '.env.production', name: 'Production (.env.production)' }
];

console.log('📋 ANÁLISIS DE ARCHIVOS DE ENTORNO:');
console.log('===================================\n');

const allVariables = {};

envFiles.forEach(envFile => {
  console.log(`📄 ${envFile.name}:`);
  const result = parseEnvFile(envFile.path);
  
  if (!result.exists) {
    console.log(`   ❌ Archivo no existe${result.error ? `: ${result.error}` : ''}`);
    return;
  }
  
  console.log(`   ✅ Archivo encontrado`);
  
  // Variables críticas para NextAuth
  const criticalVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET', 
    'NODE_ENV',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_API_BASE_URL'
  ];
  
  criticalVars.forEach(varName => {
    const value = result.variables[varName];
    if (value) {
      console.log(`   🔑 ${varName}: ${value}`);
      
      // Almacenar para comparación
      if (!allVariables[varName]) {
        allVariables[varName] = {};
      }
      allVariables[varName][envFile.name] = value;
    } else {
      console.log(`   ⚠️  ${varName}: NO DEFINIDA`);
    }
  });
  
  console.log('');
});

console.log('🚨 ANÁLISIS DE INCONSISTENCIAS:');
console.log('==============================\n');

let foundInconsistencies = false;

Object.keys(allVariables).forEach(varName => {
  const values = allVariables[varName];
  const uniqueValues = [...new Set(Object.values(values))];
  
  if (uniqueValues.length > 1) {
    foundInconsistencies = true;
    console.log(`❌ INCONSISTENCIA EN ${varName}:`);
    Object.entries(values).forEach(([file, value]) => {
      console.log(`   📄 ${file}: ${value}`);
    });
    console.log('');
  } else {
    console.log(`✅ ${varName}: Consistente (${uniqueValues[0]})`);
  }
});

if (!foundInconsistencies) {
  console.log('✅ No se encontraron inconsistencias en los archivos locales');
}

console.log('\n🔍 DIAGNÓSTICO ESPECÍFICO DEL PROBLEMA:');
console.log('======================================\n');

// Verificar el problema específico
const productionNextAuthUrl = allVariables['NEXTAUTH_URL']?.['.env.production'] || 'NO DEFINIDA';
console.log(`📋 NEXTAUTH_URL en .env.production: ${productionNextAuthUrl}`);

if (productionNextAuthUrl === 'https://bisonteapp.com') {
  console.log('🚨 PROBLEMA IDENTIFICADO:');
  console.log('   ❌ NEXTAUTH_URL apunta a: bisonteapp.com');
  console.log('   ❌ vercel.json redirige a: www.bisonteapp.com');
  console.log('   ❌ Hay una INCONSISTENCIA DE DOMINIO');
} else if (productionNextAuthUrl === 'https://www.bisonteapp.com') {
  console.log('✅ NEXTAUTH_URL parece correcto en archivo local');
  console.log('⚠️  Pero puede haber diferencia con Vercel Dashboard');
} else {
  console.log('❓ NEXTAUTH_URL tiene valor inesperado');
}

console.log('\n🔧 SOLUCIONES PRIORITARIAS:');
console.log('==========================\n');

console.log('🎯 OPCIÓN A - ACTUALIZAR .env.production Y VERCEL:');
console.log('1. Actualizar .env.production localmente:');
console.log('   NEXTAUTH_URL=https://www.bisonteapp.com');
console.log('2. Actualizar en Vercel Dashboard:');
console.log('   Settings → Environment Variables → NEXTAUTH_URL');
console.log('3. Redeploy para aplicar cambios');
console.log('');

console.log('🎯 OPCIÓN B - ELIMINAR REDIRECTS:');
console.log('1. Modificar vercel.json para NO redirigir dominios');
console.log('2. Mantener NEXTAUTH_URL=https://bisonteapp.com');
console.log('3. Usar solo un dominio (sin www)');
console.log('');

console.log('⚡ VERIFICACIÓN POST-CAMBIO:');
console.log('   node scripts/diagnostics/auth/deep-analysis.js');
console.log('   Resultado esperado: Session data con usuario válido');

// Crear script de corrección automática
console.log('\n🤖 GENERANDO SCRIPT DE CORRECCIÓN...');

const fixScript = `
# 🔧 Script de corrección automática
# Ejecutar después de decidir la opción

# OPCIÓN A: Actualizar a www.bisonteapp.com
# sed -i 's|NEXTAUTH_URL=https://bisonteapp.com|NEXTAUTH_URL=https://www.bisonteapp.com|g' .env.production

# OPCIÓN B: Actualizar URLs públicas para consistencia
# sed -i 's|NEXT_PUBLIC_SITE_URL=https://bisonteapp.com|NEXT_PUBLIC_SITE_URL=https://www.bisonteapp.com|g' .env.production
# sed -i 's|NEXT_PUBLIC_API_BASE_URL=https://bisonteapp.com/api|NEXT_PUBLIC_API_BASE_URL=https://www.bisonteapp.com/api|g' .env.production
`;

fs.writeFileSync('fix-env-inconsistency.sh', fixScript);
console.log('✅ Script guardado en: fix-env-inconsistency.sh');

console.log('\n📊 RESUMEN FINAL:');
console.log('================');
console.log('🔍 Problema: Inconsistencia entre NEXTAUTH_URL y dominio de redirects');
console.log('🎯 Causa: vercel.json redirige a www pero NextAuth espera sin www');
console.log('⚡ Solución: Sincronizar ambos valores (preferible usar www)');
console.log('🕒 Tiempo: 5 minutos + redeploy');