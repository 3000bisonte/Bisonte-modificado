#!/usr/bin/env node

/**
 * 🔍 ANÁLISIS DE CONFIGURACIÓN DE DEPLOYMENT
 * Verifica si hay conflictos entre Vercel y Netlify
 */

console.log('🔍 ANÁLISIS DE CONFIGURACIÓN DE DEPLOYMENT');
console.log('=========================================\n');

// Verificar archivos de configuración de deployment
const fs = require('fs');

const deploymentFiles = [
  { name: 'vercel.json', path: 'vercel.json' },
  { name: 'netlify.toml', path: 'netlify.toml' },
  { name: '_redirects (Netlify)', path: 'netlify/_redirects' },
  { name: 'netlify functions', path: 'netlify-bisonte-api' }
];

console.log('📋 ARCHIVOS DE DEPLOYMENT ENCONTRADOS:');
deploymentFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  console.log(`   ${exists ? '✅' : '❌'} ${file.name}: ${exists ? 'Presente' : 'No encontrado'}`);
  
  if (exists && file.path === 'vercel.json') {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const config = JSON.parse(content);
      console.log(`      📄 Configuración Vercel:`);
      if (config.redirects) {
        console.log(`         - Redirects: ${config.redirects.length} reglas`);
      }
      if (config.routes) {
        console.log(`         - Routes: ${config.routes.length} rutas`);
      }
    } catch (error) {
      console.log(`      ❌ Error leyendo vercel.json: ${error.message}`);
    }
  }
  
  if (exists && file.path === 'netlify.toml') {
    console.log(`      📄 Netlify configurado además de Vercel`);
  }
});

console.log('\n🌐 ANÁLISIS DE URLs EN .env.production:');

// Leer .env.production
function parseEnvFile(filePath) {
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
  
  return variables;
}

const prodEnv = parseEnvFile('.env.production');

const urlVars = [
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SITE_URL', 
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_API_SERVER_URL',
  'BASE_URL',
  'FALLBACK_API_BASE_URL'
];

let hasNetlifyUrls = false;
let hasVercelUrls = false;

urlVars.forEach(varName => {
  const value = prodEnv[varName] || 'NO DEFINIDA';
  console.log(`   🔗 ${varName}: ${value}`);
  
  if (value.includes('netlify.app')) {
    hasNetlifyUrls = true;
    console.log(`      🚨 NETLIFY URL DETECTADA`);
  }
  if (value.includes('vercel.app') || value.includes('bisonteapp.com')) {
    hasVercelUrls = true;
  }
});

console.log('\n🚨 DIAGNÓSTICO DE CONFLICTOS:');
console.log('============================');

if (hasNetlifyUrls && hasVercelUrls) {
  console.log('❌ CONFLICTO DETECTADO:');
  console.log('   - Algunas URLs apuntan a Netlify');
  console.log('   - Otras URLs apuntan a Vercel/bisonteapp.com');
  console.log('   - Esto puede causar problemas de routing de APIs');
} else if (hasNetlifyUrls) {
  console.log('⚠️  CONFIGURACIÓN NETLIFY:');
  console.log('   - Las URLs apuntan principalmente a Netlify');
  console.log('   - Pero tienes vercel.json configurado');
} else if (hasVercelUrls) {
  console.log('✅ CONFIGURACIÓN VERCEL:');
  console.log('   - Las URLs apuntan a Vercel/bisonteapp.com');
  console.log('   - Configuración consistente');
} else {
  console.log('❓ CONFIGURACIÓN INCIERTA');
}

console.log('\n💡 RECOMENDACIONES ESPECÍFICAS:');
console.log('==============================');

console.log('\n🎯 PARA DEPLOYMENT EN VERCEL (Recomendado):');
console.log('   1. Todas las URLs deben apuntar a www.bisonteapp.com');
console.log('   2. NEXT_PUBLIC_API_SERVER_URL debe estar vacía o apuntar a Vercel');
console.log('   3. Usar solo vercel.json para configuración');

console.log('\n🎯 PARA DEPLOYMENT EN NETLIFY:');
console.log('   1. Todas las URLs deben apuntar a *.netlify.app');
console.log('   2. Usar netlify.toml en lugar de vercel.json');
console.log('   3. Configurar functions correctamente');

// Verificar si hay funciones de Netlify
if (fs.existsSync('netlify-bisonte-api')) {
  console.log('\n📁 FUNCIONES DE NETLIFY DETECTADAS:');
  try {
    const files = fs.readdirSync('netlify-bisonte-api');
    console.log(`   - ${files.length} archivos en netlify-bisonte-api/`);
    console.log('   - Estas pueden estar conflictando con rutas de Vercel');
  } catch (error) {
    console.log('   - Error leyendo directorio netlify-bisonte-api');
  }
}

console.log('\n🔧 ACCIÓN RECOMENDADA INMEDIATA:');
console.log('===============================');

if (prodEnv.NEXT_PUBLIC_API_SERVER_URL && prodEnv.NEXT_PUBLIC_API_SERVER_URL.includes('netlify')) {
  console.log('🚨 CRÍTICO: Cambiar NEXT_PUBLIC_API_SERVER_URL');
  console.log('   Desde: ' + prodEnv.NEXT_PUBLIC_API_SERVER_URL);
  console.log('   A: "" (vacía) o https://www.bisonteapp.com/api');
} else {
  console.log('✅ NEXT_PUBLIC_API_SERVER_URL no conflictúa');
}

console.log('\n⚡ ESTO PUEDE SER LA CAUSA DEL PROBLEMA DE AUTH:');
console.log('- Si las APIs van a Netlify pero NextAuth está en Vercel');
console.log('- Las cookies no se compartirán entre dominios diferentes');
console.log('- La autenticación fallará silenciosamente');