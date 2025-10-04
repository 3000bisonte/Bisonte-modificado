#!/usr/bin/env node

/**
 * Script de diagnóstico simplificado para Windows
 * Evita problemas de variables de entorno con espacios
 */

const BASE_URL = process.argv[2] || 'https://bisonteapp.com';

console.log(`🔍  Diagnóstico de autenticación Bisonte`);
console.log(`   Base URL: ${BASE_URL}`);

// Validar URL
try {
  new URL(BASE_URL);
} catch (error) {
  console.error(`❌ URL inválida: ${BASE_URL}`);
  process.exit(1);
}

// Importar y ejecutar el diagnóstico principal
process.env.BASE_URL = BASE_URL;
require('./run.js');