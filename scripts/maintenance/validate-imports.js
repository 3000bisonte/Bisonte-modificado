#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class ImportValidator {
  constructor() {
    this.rootDir = process.cwd();
    this.tsConfig = null;
    this.pathMappings = new Map();
    this.validationResults = {
      validImports: 0,
      invalidImports: [],
      warnings: [],
      suggestions: []
    };
  }

  async run() {
    console.log('🔍 Validando imports del proyecto...\n');
    
    try {
      await this.loadTsConfig();
      await this.setupPathMappings();
      await this.validateAllImports();
      await this.generateSuggestions();
    } catch (error) {
      console.error('❌ Error durante la validación:', error);
    }

    this.printResults();
  }

  async loadTsConfig() {
    console.log('📋 Cargando configuración de TypeScript...');
    
    try {
      const tsConfigPath = path.join(this.rootDir, 'tsconfig.json');
      const tsConfigContent = await fs.readFile(tsConfigPath, 'utf-8');
      this.tsConfig = JSON.parse(tsConfigContent);
    } catch (error) {
      throw new Error(`No se pudo cargar tsconfig.json: ${error.message}`);
    }
  }

  async setupPathMappings() {
    console.log('🗺️  Configurando mapeo de rutas...');
    
    if (!this.tsConfig?.compilerOptions?.paths) {
      console.warn('⚠️  No se encontraron path mappings en tsconfig.json');
      return;
    }

    const baseUrl = this.tsConfig.compilerOptions.baseUrl || '.';
    const paths = this.tsConfig.compilerOptions.paths;

    for (const [alias, targets] of Object.entries(paths)) {
      const cleanAlias = alias.replace('/*', '');
      const resolvedTargets = targets.map(target => 
        path.resolve(this.rootDir, baseUrl, target.replace('/*', ''))
      );
      
      this.pathMappings.set(cleanAlias, resolvedTargets);
    }

    console.log(`   ✅ ${this.pathMappings.size} alias configurados`);
  }

  async validateAllImports() {
    console.log('🔍 Validando imports en archivos...');
    
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      ignore: [
        'node_modules/**',
        '.next/**',
        'dist/**',
        'build/**',
        '**/*.d.ts'
      ]
    });

    let processedFiles = 0;
    
    for (const file of files) {
      await this.validateFileImports(file);
      processedFiles++;
      
      if (processedFiles % 50 === 0) {
        console.log(`   📄 Procesados ${processedFiles}/${files.length} archivos`);
      }
    }

    console.log(`   ✅ Validación completada: ${files.length} archivos`);
  }

  async validateFileImports(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports = this.extractImports(content);

      for (const importInfo of imports) {
        await this.validateSingleImport(importInfo, filePath);
      }
    } catch (error) {
      this.validationResults.warnings.push({
        file: filePath,
        message: `Error leyendo archivo: ${error.message}`
      });
    }
  }

  extractImports(content) {
    const imports = [];
    
    // Import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        type: 'import',
        path: match[1],
        line: content.substring(0, match.index).split('\n').length,
        fullMatch: match[0]
      });
    }

    // Dynamic imports
    const dynamicImportRegex = /(?:import\(|require\()\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push({
        type: 'dynamic',
        path: match[1],
        line: content.substring(0, match.index).split('\n').length,
        fullMatch: match[0]
      });
    }

    return imports;
  }

  async validateSingleImport(importInfo, filePath) {
    const { path: importPath, line, type } = importInfo;
    
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('@/') && 
        !this.pathMappings.has(importPath.split('/')[0])) {
      this.validationResults.validImports++;
      return;
    }

    const resolvedPath = await this.resolveImportPath(importPath, filePath);
    
    if (!resolvedPath) {
      this.validationResults.invalidImports.push({
        file: filePath,
        line: line,
        import: importPath,
        type: type,
        suggestion: await this.suggestCorrection(importPath, filePath)
      });
    } else {
      this.validationResults.validImports++;
      
      // Check for optimization suggestions
      const suggestion = this.getOptimizationSuggestion(importPath, resolvedPath, filePath);
      if (suggestion) {
        this.validationResults.suggestions.push(suggestion);
      }
    }
  }

  async resolveImportPath(importPath, fromFile) {
    // Handle path aliases
    for (const [alias, targets] of this.pathMappings) {
      if (importPath.startsWith(alias)) {
        const relativePath = importPath.substring(alias.length);
        
        for (const target of targets) {
          const fullPath = path.join(target, relativePath);
          const resolved = await this.checkFileExists(fullPath);
          if (resolved) return resolved;
        }
      }
    }

    // Handle relative imports
    if (importPath.startsWith('.')) {
      const fromDir = path.dirname(fromFile);
      const fullPath = path.resolve(fromDir, importPath);
      return await this.checkFileExists(fullPath);
    }

    return null;
  }

  async checkFileExists(basePath) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    
    // Check exact path
    for (const ext of extensions) {
      try {
        const fullPath = basePath + ext;
        await fs.access(fullPath);
        return fullPath;
      } catch {}
    }

    // Check index files
    for (const ext of extensions) {
      try {
        const indexPath = path.join(basePath, `index${ext}`);
        await fs.access(indexPath);
        return indexPath;
      } catch {}
    }

    return null;
  }

  async suggestCorrection(invalidPath, fromFile) {
    // Try to find similar files
    const pathParts = invalidPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    try {
      const possibleFiles = await glob(`**/*${fileName}*`, {
        ignore: ['node_modules/**', '.next/**', 'dist/**']
      });

      if (possibleFiles.length > 0) {
        return `Archivos similares encontrados: ${possibleFiles.slice(0, 3).join(', ')}`;
      }
    } catch {}

    return 'No se encontraron sugerencias automáticas';
  }

  getOptimizationSuggestion(importPath, resolvedPath, fromFile) {
    // Check if relative import could use alias
    if (importPath.startsWith('../')) {
      const relativeParts = importPath.split('/').filter(part => part === '..').length;
      
      if (relativeParts >= 3) {
        return {
          file: fromFile,
          type: 'optimization',
          message: `Considerar usar alias (@/) en lugar de import relativo profundo: ${importPath}`,
          current: importPath,
          suggested: this.convertToAlias(importPath, fromFile)
        };
      }
    }

    return null;
  }

  convertToAlias(relativePath, fromFile) {
    try {
      const fromDir = path.dirname(fromFile);
      const resolved = path.resolve(fromDir, relativePath);
      const relative = path.relative(this.rootDir, resolved);
      
      // Assume src/ structure
      if (relative.startsWith('src/')) {
        return '@/' + relative.substring(4);
      }
    } catch {}

    return relativePath;
  }

  async generateSuggestions() {
    console.log('💡 Generando sugerencias de mejora...');
    
    // Analizar patrones de imports
    const importPatterns = new Map();
    
    for (const invalid of this.validationResults.invalidImports) {
      const pattern = invalid.import.split('/')[0];
      importPatterns.set(pattern, (importPatterns.get(pattern) || 0) + 1);
    }

    // Sugerir aliases para patrones comunes
    for (const [pattern, count] of importPatterns) {
      if (count >= 5 && !this.pathMappings.has(pattern)) {
        this.validationResults.suggestions.push({
          type: 'alias',
          message: `Considerar crear alias para '${pattern}/*' (usado ${count} veces)`,
          pattern: pattern
        });
      }
    }
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE VALIDACIÓN');
    console.log('============================');
    
    console.log(`\n✅ Imports válidos: ${this.validationResults.validImports}`);
    console.log(`❌ Imports inválidos: ${this.validationResults.invalidImports.length}`);
    console.log(`⚠️  Advertencias: ${this.validationResults.warnings.length}`);
    console.log(`💡 Sugerencias: ${this.validationResults.suggestions.length}`);

    if (this.validationResults.invalidImports.length > 0) {
      console.log('\n❌ IMPORTS INVÁLIDOS:');
      this.validationResults.invalidImports.slice(0, 10).forEach(invalid => {
        console.log(`   📄 ${invalid.file}:${invalid.line}`);
        console.log(`      Import: ${invalid.import}`);
        console.log(`      Sugerencia: ${invalid.suggestion}`);
        console.log('');
      });
      
      if (this.validationResults.invalidImports.length > 10) {
        console.log(`   ... y ${this.validationResults.invalidImports.length - 10} más`);
      }
    }

    if (this.validationResults.suggestions.length > 0) {
      console.log('\n💡 SUGERENCIAS DE OPTIMIZACIÓN:');
      this.validationResults.suggestions.slice(0, 5).forEach(suggestion => {
        console.log(`   ${suggestion.message}`);
        if (suggestion.current && suggestion.suggested) {
          console.log(`      ${suggestion.current} → ${suggestion.suggested}`);
        }
        console.log('');
      });
    }

    if (this.validationResults.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      this.validationResults.warnings.slice(0, 5).forEach(warning => {
        console.log(`   📄 ${warning.file}: ${warning.message}`);
      });
    }

    const totalIssues = this.validationResults.invalidImports.length + 
                       this.validationResults.warnings.length;
    
    if (totalIssues === 0) {
      console.log('\n🎉 ¡Todos los imports son válidos!');
    } else {
      console.log(`\n📋 Total de problemas encontrados: ${totalIssues}`);
      console.log('💡 Revisar y corregir los imports inválidos para mejorar la estabilidad del proyecto.');
    }
  }
}

// Ejecutar el validador
if (require.main === module) {
  const validator = new ImportValidator();
  validator.run().catch(console.error);
}

module.exports = ImportValidator;