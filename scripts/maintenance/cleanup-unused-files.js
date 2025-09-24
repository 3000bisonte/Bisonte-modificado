#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class ProjectCleaner {
  constructor() {
    this.rootDir = process.cwd();
    this.cleanupReport = {
      unusedFiles: [],
      brokenImports: [],
      duplicateFiles: [],
      emptyDirectories: [],
      cleanedFiles: [],
      errors: []
    };
  }

  async run() {
    console.log('🧹 Iniciando limpieza del proyecto...\n');
    
    try {
      await this.findUnusedFiles();
      await this.findBrokenImports();
      await this.findDuplicateFiles();
      await this.findEmptyDirectories();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
      this.cleanupReport.errors.push(error.message);
    }

    this.printReport();
  }

  async findUnusedFiles() {
    console.log('🔍 Buscando archivos no utilizados...');
    
    const allFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/stories/**'
      ]
    });

    const potentialUnusedFiles = [];

    for (const file of allFiles) {
      const isUsed = await this.isFileUsed(file);
      if (!isUsed) {
        potentialUnusedFiles.push(file);
      }
    }

    this.cleanupReport.unusedFiles = potentialUnusedFiles;
  }

  async isFileUsed(filePath) {
    const fileName = path.parse(filePath).name;
    const fileNameWithoutExt = fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
    
    // Buscar referencias al archivo
    const searchPatterns = [
      `import.*from.*['"].*${fileNameWithoutExt}['"]`,
      `import.*['"].*${filePath.replace(/\\/g, '/')}['"]`,
      `require\\(['"].*${fileNameWithoutExt}['"]\\)`,
      `dynamic\\(.*['"].*${fileNameWithoutExt}['"]`,
    ];

    try {
      const allFiles = await glob('**/*.{ts,tsx,js,jsx,json}', {
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
      });

      for (const file of allFiles) {
        if (file === filePath) continue;
        
        const content = await fs.readFile(file, 'utf-8');
        
        for (const pattern of searchPatterns) {
          if (new RegExp(pattern).test(content)) {
            return true;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Error verificando uso de ${filePath}:`, error.message);
      return true; // Asumir que está en uso si hay error
    }

    return false;
  }

  async findBrokenImports() {
    console.log('🔗 Buscando imports rotos...');
    
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
    });

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          
          // Skip npm packages
          if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
            continue;
          }

          const resolvedPath = await this.resolveImportPath(importPath, file);
          if (!resolvedPath) {
            this.cleanupReport.brokenImports.push({
              file,
              import: importPath,
              line: content.substring(0, match.index).split('\n').length
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error leyendo ${file}:`, error.message);
      }
    }
  }

  async resolveImportPath(importPath, fromFile) {
    const fromDir = path.dirname(fromFile);
    let resolvedPath;

    if (importPath.startsWith('@/')) {
      // Handle path aliases
      const aliasPath = importPath.replace('@/', 'src/');
      resolvedPath = path.resolve(this.rootDir, aliasPath);
    } else if (importPath.startsWith('.')) {
      // Handle relative imports
      resolvedPath = path.resolve(fromDir, importPath);
    } else {
      return true; // External package
    }

    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    
    for (const ext of extensions) {
      try {
        const fullPath = resolvedPath + ext;
        await fs.access(fullPath);
        return fullPath;
      } catch {}
    }

    // Try index files
    for (const ext of extensions) {
      try {
        const indexPath = path.join(resolvedPath, `index${ext}`);
        await fs.access(indexPath);
        return indexPath;
      } catch {}
    }

    return null;
  }

  async findDuplicateFiles() {
    console.log('📋 Buscando archivos duplicados...');
    
    const files = await glob('**/*.{ts,tsx,js,jsx,json,md}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
    });

    const fileHashes = new Map();

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const hash = require('crypto').createHash('md5').update(content).digest('hex');
        
        if (fileHashes.has(hash)) {
          this.cleanupReport.duplicateFiles.push({
            original: fileHashes.get(hash),
            duplicate: file
          });
        } else {
          fileHashes.set(hash, file);
        }
      } catch (error) {
        console.warn(`⚠️  Error procesando ${file}:`, error.message);
      }
    }
  }

  async findEmptyDirectories() {
    console.log('📁 Buscando directorios vacíos...');
    
    const dirs = await glob('**/*//', {
      ignore: ['node_modules/**', '.next/**', '.git/**']
    });

    for (const dir of dirs) {
      try {
        const entries = await fs.readdir(dir);
        if (entries.length === 0) {
          this.cleanupReport.emptyDirectories.push(dir);
        }
      } catch (error) {
        console.warn(`⚠️  Error leyendo directorio ${dir}:`, error.message);
      }
    }
  }

  async generateReport() {
    const reportPath = path.join(this.rootDir, 'cleanup-report.json');
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        unusedFiles: this.cleanupReport.unusedFiles.length,
        brokenImports: this.cleanupReport.brokenImports.length,
        duplicateFiles: this.cleanupReport.duplicateFiles.length,
        emptyDirectories: this.cleanupReport.emptyDirectories.length
      },
      details: this.cleanupReport
    };

    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📋 Reporte guardado en: ${reportPath}`);
  }

  printReport() {
    console.log('\n📊 REPORTE DE LIMPIEZA');
    console.log('========================');
    
    console.log(`\n📄 Archivos potencialmente no usados: ${this.cleanupReport.unusedFiles.length}`);
    if (this.cleanupReport.unusedFiles.length > 0) {
      this.cleanupReport.unusedFiles.slice(0, 5).forEach(file => 
        console.log(`   - ${file}`)
      );
      if (this.cleanupReport.unusedFiles.length > 5) {
        console.log(`   ... y ${this.cleanupReport.unusedFiles.length - 5} más`);
      }
    }

    console.log(`\n🔗 Imports rotos: ${this.cleanupReport.brokenImports.length}`);
    if (this.cleanupReport.brokenImports.length > 0) {
      this.cleanupReport.brokenImports.slice(0, 5).forEach(item => 
        console.log(`   - ${item.file}:${item.line} → ${item.import}`)
      );
      if (this.cleanupReport.brokenImports.length > 5) {
        console.log(`   ... y ${this.cleanupReport.brokenImports.length - 5} más`);
      }
    }

    console.log(`\n📋 Archivos duplicados: ${this.cleanupReport.duplicateFiles.length}`);
    if (this.cleanupReport.duplicateFiles.length > 0) {
      this.cleanupReport.duplicateFiles.slice(0, 3).forEach(item => 
        console.log(`   - ${item.original} = ${item.duplicate}`)
      );
    }

    console.log(`\n📁 Directorios vacíos: ${this.cleanupReport.emptyDirectories.length}`);
    if (this.cleanupReport.emptyDirectories.length > 0) {
      this.cleanupReport.emptyDirectories.slice(0, 5).forEach(dir => 
        console.log(`   - ${dir}`)
      );
    }

    if (this.cleanupReport.errors.length > 0) {
      console.log(`\n❌ Errores encontrados: ${this.cleanupReport.errors.length}`);
      this.cleanupReport.errors.forEach(error => 
        console.log(`   - ${error}`)
      );
    }

    console.log('\n✨ Limpieza completada!');
    console.log('💡 Revisar el archivo cleanup-report.json para más detalles.');
  }
}

// Ejecutar el limpiador
if (require.main === module) {
  const cleaner = new ProjectCleaner();
  cleaner.run().catch(console.error);
}

module.exports = ProjectCleaner;