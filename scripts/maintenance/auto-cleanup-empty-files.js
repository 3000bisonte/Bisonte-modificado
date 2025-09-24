#!/usr/bin/env node

// Script generado automáticamente por empty-file-auditor.js
// Fecha: 2025-09-24T16:12:07.531Z

const fs = require('fs').promises;
const path = require('path');

class AutoCleanup {
  constructor() {
    this.deletedFiles = [];
    this.errors = [];
  }

  async run() {
    console.log('🧹 Iniciando limpieza automática de archivos vacíos...\n');
    
    // Archivos completamente vacíos - ELIMINAR AUTOMÁTICAMENTE
    const emptyFiles = [

    ];

    // Archivos solo con comentarios - REVISAR MANUALMENTE
    const commentOnlyFiles = [
      'next-env.d.ts'
    ];

    // Archivos mínimos - REVISAR MANUALMENTE  
    const minimalFiles = [
      '.env',
      'archive/legacy/netlify-bisonte-api/netlify-bisonte-api/netlify/functions/google.js',
      'archive/legacy/netlify-bisonte-api/netlify-bisonte-api/netlify/functions/health-compact.js',
      'archive/legacy/netlify-bisonte-api/netlify-bisonte-api/netlify/functions/test-simple.js',
      'netlify-bisonte-api/netlify/functions/google.js',
      'netlify-bisonte-api/netlify/functions/health-compact.js',
      'src/types/bisonte-auth-plugin.d.ts',
      'tests/__mocks__/fileMock.js',
      'types/next-auth.d.ts'
    ];

    // Eliminar archivos completamente vacíos
    for (const file of emptyFiles) {
      await this.deleteFile(file, 'EMPTY');
    }

    // Reportar archivos que requieren revisión manual
    if (commentOnlyFiles.length > 0) {
      console.log('\n📋 ARCHIVOS CON SOLO COMENTARIOS (revisar manualmente):');
      commentOnlyFiles.forEach(file => console.log(`   📄 ${file}`));
    }

    if (minimalFiles.length > 0) {
      console.log('\n📝 ARCHIVOS MÍNIMOS (revisar manualmente):');
      minimalFiles.forEach(file => console.log(`   📄 ${file}`));
    }

    this.printSummary();
  }

  async deleteFile(filePath, reason) {
    try {
      const fullPath = path.resolve(filePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      
      this.deletedFiles.push({ file: filePath, reason });
      console.log(`✅ Eliminado (${reason}): ${filePath}`);
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.log(`❌ Error eliminando ${filePath}: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n📊 RESUMEN DE LIMPIEZA');
    console.log('======================');
    console.log(`✅ Archivos eliminados: ${this.deletedFiles.length}`);
    console.log(`❌ Errores: ${this.errors.length}`);
    
    if (this.deletedFiles.length > 0) {
      console.log('\n🗑️ ARCHIVOS ELIMINADOS:');
      this.deletedFiles.forEach(({ file, reason }) => {
        console.log(`   ${reason}: ${file}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORES:');
      this.errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }
  }
}

// Ejecutar limpieza
if (require.main === module) {
  const cleanup = new AutoCleanup();
  cleanup.run().catch(console.error);
}

module.exports = AutoCleanup;
