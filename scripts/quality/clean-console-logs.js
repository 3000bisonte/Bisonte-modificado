#!/usr/bin/env node

/**
 * Script para limpiar console.log innecesarios
 * Mantiene console.error y console.warn para debugging
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.{js,ts,tsx}',
  '**/*.spec.{js,ts,tsx}',
];

const ALLOWED_CONSOLE_METHODS = ['error', 'warn', 'info'];

function shouldKeepConsoleLog(line) {
  // Mantener comentarios que explican por qué hay un console.log
  if (line.match(/\/\/.*(TODO|FIXME|NOTE|DEBUG).*console/i)) {
    return true;
  }

  // Mantener console.error, console.warn, console.info
  for (const method of ALLOWED_CONSOLE_METHODS) {
    if (line.includes(`console.${method}`)) {
      return true;
    }
  }

  // Mantener logs en archivos de configuración críticos
  const criticalFilePatterns = [
    '/scripts/',
    '/config/',
    '/next.config',
    '/jest.config',
  ];

  return false;
}

function cleanConsoleLogsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  let removedCount = 0;

  const cleanedLines = lines.map((line, index) => {
    // Detectar console.log simples
    if (line.match(/^\s*console\.log\(/)) {
      if (!shouldKeepConsoleLog(line)) {
        modified = true;
        removedCount++;
        return line.replace(/^(\s*)console\.log\(.*\);?\s*$/, '$1// Removed console.log');
      }
    }

    // Detectar console.log embebidos (más complejo)
    if (line.includes('console.log(') && !shouldKeepConsoleLog(line)) {
      const cleaned = line.replace(/console\.log\([^)]*\);?\s*/g, '');
      if (cleaned !== line) {
        modified = true;
        removedCount++;
        return cleaned;
      }
    }

    return line;
  });

  if (modified) {
    const cleanedContent = cleanedLines.join('\n');
    fs.writeFileSync(filePath, cleanedContent, 'utf8');
    console.log(`✅ ${filePath}: Removed ${removedCount} console.log statements`);
    return removedCount;
  }

  return 0;
}

function main() {
  console.log('🧹 Iniciando limpieza de console.log innecesarios...\n');

  const patterns = [
    'src/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
  ];

  let totalRemoved = 0;
  let filesModified = 0;

  patterns.forEach((pattern) => {
    const files = glob.sync(pattern, {
      ignore: EXCLUDED_PATTERNS,
      absolute: true,
    });

    files.forEach((file) => {
      const removed = cleanConsoleLogsInFile(file);
      if (removed > 0) {
        totalRemoved += removed;
        filesModified++;
      }
    });
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   Archivos modificados: ${filesModified}`);
  console.log(`   Console.log removidos: ${totalRemoved}`);
  console.log(`\n✅ Limpieza completada`);

  if (filesModified > 0) {
    console.log(`\n⚠️  Recuerda revisar los cambios antes de commitear`);
    process.exit(0);
  } else {
    console.log(`\n✨ No se encontraron console.log para limpiar`);
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanConsoleLogsInFile, shouldKeepConsoleLog };
