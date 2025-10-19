/**
 * 🧹 Script de Limpieza para Producción
 * 
 * Remueve console.log innecesarios manteniendo console.error y console.warn
 * Ejecutar antes de build final para Play Store
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directorios a procesar
const DIRS_TO_CLEAN = [
  'src/app/**/*.{js,jsx,ts,tsx}',
  'src/components/**/*.{js,jsx,ts,tsx}',
  'src/lib/**/*.{js,jsx,ts,tsx}',
  'src/hooks/**/*.{js,jsx,ts,tsx}',
  'src/services/**/*.{js,jsx,ts,tsx}',
  'src/utils/**/*.{js,jsx,ts,tsx}'
];

// Directorios a excluir
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/tests/**',
  '**/test/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/logger.js', // Mantener archivo de logging
  '**/errorHandler.ts' // Mantener manejo de errores
];

let filesProcessed = 0;
let logsRemoved = 0;

/**
 * Verifica si una línea debe mantenerse
 */
function shouldKeepLine(line) {
  // Mantener console.error y console.warn
  if (line.includes('console.error') || line.includes('console.warn')) {
    return true;
  }
  
  // Mantener logs con comentarios TODO/FIXME/DEBUG
  if (line.match(/\/\/.*(TODO|FIXME|NOTE|DEBUG).*console/i)) {
    return true;
  }
  
  // Mantener si NO es un console.log
  if (!line.includes('console.log')) {
    return true;
  }
  
  // Es un console.log sin comentario especial, remover
  return false;
}

/**
 * Procesa un archivo
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let removedInFile = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (shouldKeepLine(line)) {
        newLines.push(line);
      } else {
        // Línea removida
        removedInFile++;
        logsRemoved++;
        
        // Si la línea solo contiene el console.log, no agregar línea vacía
        if (line.trim() !== '') {
          // Comentar en lugar de remover para debugging
          // newLines.push(`// ${line.trim()} // REMOVED IN PRODUCTION`);
        }
      }
    }

    // Solo escribir si hubo cambios
    if (removedInFile > 0) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      console.log(`✅ ${path.relative(process.cwd(), filePath)} - Removidos ${removedInFile} logs`);
      filesProcessed++;
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Main
 */
console.log('🧹 Iniciando limpieza de console.logs para producción...\n');

DIRS_TO_CLEAN.forEach(pattern => {
  const files = glob.sync(pattern, {
    ignore: EXCLUDE_PATTERNS,
    cwd: process.cwd()
  });

  files.forEach(file => {
    processFile(path.resolve(process.cwd(), file));
  });
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Limpieza completada!`);
console.log(`📁 Archivos procesados: ${filesProcessed}`);
console.log(`🗑️  Console.logs removidos: ${logsRemoved}`);
console.log('='.repeat(60));

if (logsRemoved > 0) {
  console.log('\n⚠️  IMPORTANTE:');
  console.log('1. Revisa que la app siga funcionando correctamente');
  console.log('2. Haz commit de los cambios antes de build final');
  console.log('3. Los console.error y console.warn se mantuvieron para debugging');
}
