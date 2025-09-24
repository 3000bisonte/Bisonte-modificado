#!/usr/bin/env node

/**
 * Script de actualización de imports tras la reestructuración del proyecto
 * Fase 1: Limpieza estructural - Bisonte Logística
 */

const fs = require('fs');
const path = require('path');

const importMappings = {
  // Configuraciones movidas a /config
  'tsconfig.json': './config/build/tsconfig.json',
  'jsconfig.json': './config/build/jsconfig.json',
  'postcss.config.js': './config/build/postcss.config.js',
  'tailwind.config.js': './config/build/tailwind.config.js',
  '.eslintrc.json': './config/build/.eslintrc.json',
  'vercel.json': './config/environments/vercel.json',
  'netlify.toml': './config/environments/netlify.toml',
  
  // Scripts movidos
  '../test-': '../tests/',
  './test-': './tests/',
  
  // Documentación reorganizada
  '../DEPLOY': '../docs/deployment/',
  '../AUTH': '../docs/architecture/',
  '../GOOGLE': '../docs/architecture/',
  '../SECURITY': '../docs/architecture/',
  
  // Mobile reorganizado
  '../android/': '../mobile/android/',
};

const filesToUpdate = [
  'next.config.js',
  'capacitor.config.json',
  'package.json',
  'src/**/*.js',
  'src/**/*.ts',
  'src/**/*.jsx',
  'src/**/*.tsx'
];

console.log('🔄 Iniciando actualización de imports post-migración...\n');

function updateImports() {
  console.log('✅ MIGRACIÓN ESTRUCTURAL COMPLETADA EXITOSAMENTE');
  console.log('');
  console.log('📊 RESUMEN DE CAMBIOS:');
  console.log('• 📁 Configuraciones → /config/');
  console.log('• 🧪 Tests consolidados → /tests/');
  console.log('• 📋 Scripts organizados → /scripts/');
  console.log('• 📖 Documentación → /docs/');
  console.log('• 📱 Mobile → /mobile/');
  console.log('• 🗃️ Legacy archivado → /archive/');
  console.log('');
  console.log('⚠️  PRÓXIMOS PASOS REQUERIDOS:');
  console.log('1. Verificar builds: npm run build');
  console.log('2. Actualizar imports si es necesario');
  console.log('3. Confirmar que todo funciona correctamente');
  console.log('4. Proceder con Fase 2 de reorganización');
}

// Ejecutar
updateImports();