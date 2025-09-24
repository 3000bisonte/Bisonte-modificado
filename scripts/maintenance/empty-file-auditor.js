#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class EmptyFileAuditor {
  constructor() {
    this.rootDir = process.cwd();
    this.auditResults = {
      emptyFiles: [],
      commentOnlyFiles: [],
      minimalFiles: [],
      errors: [],
      summary: {}
    };
    
    // Directorios a ignorar
    this.ignoreDirs = new Set([
      'node_modules', '.git', '.next', 'out', 'dist', 'build', 
      '.gradle', 'target', 'coverage', '.nyc_output',
      'android', 'ios'
    ]);

    // Extensiones a analizar
    this.targetExtensions = new Set([
      '.js', '.ts', '.jsx', '.tsx',
      '.json', '.md', '.yml', '.yaml',
      '.css', '.scss', '.html',
      '.txt', '.xml', '.env', '.gitignore',
      '.eslintrc', '.prettierrc'
    ]);
  }

  async run() {
    console.log('🔍 Iniciando auditoría de archivos vacíos...\n');
    
    try {
      await this.scanDirectory(this.rootDir);
      this.generateRecommendations();
      this.printReport();
      await this.generateCleanupScript();
    } catch (error) {
      console.error('❌ Error durante la auditoría:', error);
      this.auditResults.errors.push(error.message);
    }

    return this.auditResults;
  }

  async scanDirectory(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip ignored directories
          if (this.ignoreDirs.has(entry.name) || entry.name.startsWith('.') && entry.name !== '.env') {
            continue;
          }
          
          // Skip very deep nested directories to avoid Android build issues
          if (relPath.split(path.sep).length > 6) {
            continue;
          }
          
          await this.scanDirectory(fullPath, relPath);
        } else if (entry.isFile()) {
          await this.analyzeFile(fullPath, relPath);
        }
      }
    } catch (error) {
      if (error.code !== 'EPERM' && error.code !== 'ENOENT') {
        this.auditResults.errors.push(`Error scanning ${relativePath}: ${error.message}`);
      }
    }
  }

  async analyzeFile(fullPath, relativePath) {
    try {
      const ext = path.extname(relativePath).toLowerCase();
      
      // Only analyze target extensions
      if (!this.targetExtensions.has(ext) && !relativePath.includes('.env')) {
        return;
      }

      const stats = await fs.stat(fullPath);
      
      // Skip very large files
      if (stats.size > 1024 * 1024) { // 1MB
        return;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      
      const analysis = {
        path: relativePath.replace(/\\/g, '/'), // Normalize path separators
        fullPath: fullPath,
        size: stats.size,
        lines: content.split('\n').length,
        extension: ext,
        isEmpty: this.isEmpty(content),
        isCommentOnly: this.isCommentOnly(content, ext),
        isMinimal: this.isMinimal(content, ext),
        contentPreview: this.getPreview(content)
      };

      if (analysis.isEmpty) {
        this.auditResults.emptyFiles.push(analysis);
      } else if (analysis.isCommentOnly) {
        this.auditResults.commentOnlyFiles.push(analysis);
      } else if (analysis.isMinimal) {
        this.auditResults.minimalFiles.push(analysis);
      }
      
    } catch (error) {
      // Skip binary files or files with encoding issues
      if (error.code !== 'EISDIR') {
        this.auditResults.errors.push(`Error analyzing ${relativePath}: ${error.message}`);
      }
    }
  }

  isEmpty(content) {
    return content.trim().length === 0;
  }

  isCommentOnly(content, extension) {
    const trimmed = content.trim();
    if (trimmed.length === 0) return false;
    
    const lines = trimmed.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      let isComment = false;
      
      // JavaScript/TypeScript/CSS comments
      if (extension === '.js' || extension === '.ts' || extension === '.jsx' || 
          extension === '.tsx' || extension === '.css' || extension === '.scss') {
        isComment = line.startsWith('//') || line.startsWith('/*') || 
                   line.endsWith('*/') || (line.startsWith('/*') && line.endsWith('*/'));
      }
      
      // HTML comments
      else if (extension === '.html' || extension === '.xml') {
        isComment = line.startsWith('<!--') || line.endsWith('-->') ||
                   (line.startsWith('<!--') && line.endsWith('-->'));
      }
      
      // YAML/Shell comments
      else if (extension === '.yml' || extension === '.yaml' || extension === '.env') {
        isComment = line.startsWith('#');
      }
      
      // JSON (technically no comments, but some tools allow #)
      else if (extension === '.json') {
        isComment = line.startsWith('#') || line.startsWith('//');
      }
      
      // Markdown (all content is valid, but check for empty headers)
      else if (extension === '.md') {
        isComment = line.startsWith('#') && line.trim() === '#'.repeat(line.indexOf(' ') > 0 ? line.indexOf(' ') : line.length);
      }
      
      if (!isComment) {
        return false;
      }
    }
    
    return true;
  }

  isMinimal(content, extension) {
    const trimmed = content.trim();
    
    // Very short files
    if (trimmed.length < 10) return true;
    
    // Files with very few meaningful lines
    const meaningfulLines = trimmed.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'))
      .length;
    
    if (meaningfulLines <= 1) return true;
    
    // Check for common minimal patterns
    const minimalPatterns = [
      /^export\s*\{\s*\}\s*;?\s*$/m, // Empty export
      /^module\.exports\s*=\s*\{\s*\}\s*;?\s*$/m, // Empty module.exports
      /^\{\s*\}\s*$/m, // Empty JSON object
      /^\[\s*\]\s*$/m, // Empty JSON array
      /^#\s*TODO\s*$/mi, // Just a TODO comment
      /^\/\*\*?\s*\*\/$/m, // Empty comment block
    ];

    return minimalPatterns.some(pattern => pattern.test(trimmed));
  }

  getPreview(content) {
    const preview = content.replace(/\s+/g, ' ').slice(0, 80);
    return preview.length < content.length ? preview + '...' : preview;
  }

  generateRecommendations() {
    console.log('💡 Generando recomendaciones...');
    
    // Group by extension
    const byExtension = {};
    
    [...this.auditResults.emptyFiles, 
     ...this.auditResults.commentOnlyFiles, 
     ...this.auditResults.minimalFiles].forEach(file => {
      const ext = file.extension || 'no-extension';
      if (!byExtension[ext]) byExtension[ext] = [];
      byExtension[ext].push(file);
    });

    this.auditResults.summary = {
      totalEmpty: this.auditResults.emptyFiles.length,
      totalCommentOnly: this.auditResults.commentOnlyFiles.length,
      totalMinimal: this.auditResults.minimalFiles.length,
      byExtension: byExtension,
      recommendations: this.getRecommendations(byExtension)
    };
  }

  getRecommendations(byExtension) {
    const recommendations = [];

    for (const [ext, files] of Object.entries(byExtension)) {
      const count = files.length;
      
      switch (ext) {
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
          recommendations.push({
            type: 'JavaScript/TypeScript',
            extension: ext,
            action: count > 5 ? 'DELETE_BATCH' : 'REVIEW',
            priority: 'HIGH',
            reason: 'Archivos JS/TS vacíos pueden indicar stubs incompletos o errores de generación',
            files: files,
            suggestion: count > 5 ? 
              'Eliminar en lote - probablemente archivos generados por error' :
              'Revisar individualmente - pueden ser stubs importantes'
          });
          break;

        case '.json':
          recommendations.push({
            type: 'JSON Configuration',
            extension: ext,
            action: 'REVIEW',
            priority: 'MEDIUM',
            reason: 'Archivos JSON vacíos pueden ser configuraciones pendientes',
            files: files,
            suggestion: 'Verificar si son configuraciones requeridas o eliminar'
          });
          break;

        case '.md':
          recommendations.push({
            type: 'Markdown Documentation',
            extension: ext,
            action: 'COMPLETE',
            priority: 'MEDIUM',
            reason: 'Documentación vacía reduce la calidad del proyecto',
            files: files,
            suggestion: 'Completar documentación o crear templates básicos'
          });
          break;

        case '.css':
        case '.scss':
          recommendations.push({
            type: 'Stylesheets',
            extension: ext,
            action: 'DELETE',
            priority: 'LOW',
            reason: 'Archivos de estilos vacíos son innecesarios',
            files: files,
            suggestion: 'Eliminar archivos vacíos'
          });
          break;

        case '.env':
          recommendations.push({
            type: 'Environment Variables',
            extension: ext,
            action: 'COMPLETE',
            priority: 'HIGH',
            reason: 'Archivos .env vacíos pueden causar problemas de configuración',
            files: files,
            suggestion: 'Agregar variables requeridas o crear .env.example'
          });
          break;

        default:
          recommendations.push({
            type: `Other Files (${ext})`,
            extension: ext,
            action: 'REVIEW',
            priority: 'LOW',
            reason: 'Revisar manualmente la necesidad',
            files: files,
            suggestion: 'Evaluar caso por caso'
          });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  async generateCleanupScript() {
    console.log('🛠️ Generando script de limpieza...');
    
    const scriptContent = `#!/usr/bin/env node

// Script generado automáticamente por empty-file-auditor.js
// Fecha: ${new Date().toISOString()}

const fs = require('fs').promises;
const path = require('path');

class AutoCleanup {
  constructor() {
    this.deletedFiles = [];
    this.errors = [];
  }

  async run() {
    console.log('🧹 Iniciando limpieza automática de archivos vacíos...\\n');
    
    // Archivos completamente vacíos - ELIMINAR AUTOMÁTICAMENTE
    const emptyFiles = [
${this.auditResults.emptyFiles.map(f => `      '${f.path}'`).join(',\n')}
    ];

    // Archivos solo con comentarios - REVISAR MANUALMENTE
    const commentOnlyFiles = [
${this.auditResults.commentOnlyFiles.map(f => `      '${f.path}'`).join(',\n')}
    ];

    // Archivos mínimos - REVISAR MANUALMENTE  
    const minimalFiles = [
${this.auditResults.minimalFiles.map(f => `      '${f.path}'`).join(',\n')}
    ];

    // Eliminar archivos completamente vacíos
    for (const file of emptyFiles) {
      await this.deleteFile(file, 'EMPTY');
    }

    // Reportar archivos que requieren revisión manual
    if (commentOnlyFiles.length > 0) {
      console.log('\\n📋 ARCHIVOS CON SOLO COMENTARIOS (revisar manualmente):');
      commentOnlyFiles.forEach(file => console.log(\`   📄 \${file}\`));
    }

    if (minimalFiles.length > 0) {
      console.log('\\n📝 ARCHIVOS MÍNIMOS (revisar manualmente):');
      minimalFiles.forEach(file => console.log(\`   📄 \${file}\`));
    }

    this.printSummary();
  }

  async deleteFile(filePath, reason) {
    try {
      const fullPath = path.resolve(filePath);
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      
      this.deletedFiles.push({ file: filePath, reason });
      console.log(\`✅ Eliminado (\${reason}): \${filePath}\`);
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.log(\`❌ Error eliminando \${filePath}: \${error.message}\`);
    }
  }

  printSummary() {
    console.log('\\n📊 RESUMEN DE LIMPIEZA');
    console.log('======================');
    console.log(\`✅ Archivos eliminados: \${this.deletedFiles.length}\`);
    console.log(\`❌ Errores: \${this.errors.length}\`);
    
    if (this.deletedFiles.length > 0) {
      console.log('\\n🗑️ ARCHIVOS ELIMINADOS:');
      this.deletedFiles.forEach(({ file, reason }) => {
        console.log(\`   \${reason}: \${file}\`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\\n❌ ERRORES:');
      this.errors.forEach(({ file, error }) => {
        console.log(\`   \${file}: \${error}\`);
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
`;

    const scriptPath = path.join(this.rootDir, 'scripts', 'maintenance', 'auto-cleanup-empty-files.js');
    await fs.writeFile(scriptPath, scriptContent);
    console.log(`   📄 Script generado: ${scriptPath}`);
  }

  printReport() {
    console.log('\n📊 REPORTE DE AUDITORÍA DE ARCHIVOS VACÍOS');
    console.log('=============================================');
    
    const { summary } = this.auditResults;
    
    console.log(`\n📈 RESUMEN GENERAL:`);
    console.log(`   📄 Archivos completamente vacíos: ${summary.totalEmpty}`);
    console.log(`   💬 Archivos solo con comentarios: ${summary.totalCommentOnly}`);
    console.log(`   📝 Archivos mínimos (< 10 chars o 1 línea): ${summary.totalMinimal}`);
    console.log(`   ❌ Errores encontrados: ${this.auditResults.errors.length}`);
    console.log(`   📊 Total de problemas: ${summary.totalEmpty + summary.totalCommentOnly + summary.totalMinimal}`);

    if (summary.totalEmpty > 0) {
      console.log(`\n🗂️ ARCHIVOS COMPLETAMENTE VACÍOS (${summary.totalEmpty}):`);
      this.auditResults.emptyFiles.slice(0, 10).forEach(file => {
        console.log(`   📄 ${file.path} (${file.size} bytes)`);
      });
      if (this.auditResults.emptyFiles.length > 10) {
        console.log(`   ... y ${this.auditResults.emptyFiles.length - 10} más`);
      }
    }

    if (summary.totalCommentOnly > 0) {
      console.log(`\n💬 ARCHIVOS SOLO CON COMENTARIOS (${summary.totalCommentOnly}):`);
      this.auditResults.commentOnlyFiles.slice(0, 5).forEach(file => {
        console.log(`   📄 ${file.path} (${file.lines} líneas)`);
        console.log(`      Preview: "${file.contentPreview}"`);
      });
      if (this.auditResults.commentOnlyFiles.length > 5) {
        console.log(`   ... y ${this.auditResults.commentOnlyFiles.length - 5} más`);
      }
    }

    if (summary.totalMinimal > 0) {
      console.log(`\n📝 ARCHIVOS MÍNIMOS (${summary.totalMinimal}):`);
      this.auditResults.minimalFiles.slice(0, 5).forEach(file => {
        console.log(`   📄 ${file.path} (${file.size} bytes)`);
        console.log(`      Preview: "${file.contentPreview}"`);
      });
      if (this.auditResults.minimalFiles.length > 5) {
        console.log(`   ... y ${this.auditResults.minimalFiles.length - 5} más`);
      }
    }

    console.log(`\n🎯 RECOMENDACIONES POR PRIORIDAD:`);
    summary.recommendations.forEach((rec, index) => {
      console.log(`\n   ${index + 1}. 📁 ${rec.type} - Prioridad: ${rec.priority}`);
      console.log(`      🎯 Acción recomendada: ${rec.action}`);
      console.log(`      💡 Razón: ${rec.reason}`);
      console.log(`      🔧 Sugerencia: ${rec.suggestion}`);
      console.log(`      📊 Archivos afectados: ${rec.files.length}`);
      
      if (rec.files.length <= 3) {
        rec.files.forEach(file => console.log(`         - ${file.path}`));
      } else {
        rec.files.slice(0, 2).forEach(file => console.log(`         - ${file.path}`));
        console.log(`         ... y ${rec.files.length - 2} más`);
      }
    });

    console.log(`\n🛠️ PRÓXIMOS PASOS:`);
    console.log(`   1. Ejecutar: node scripts/maintenance/auto-cleanup-empty-files.js`);
    console.log(`   2. Revisar archivos con comentarios y contenido mínimo`);
    console.log(`   3. Establecer reglas de ESLint para prevenir archivos vacíos`);
    console.log(`   4. Añadir hooks de pre-commit para validación`);

    if (this.auditResults.errors.length > 0) {
      console.log(`\n❌ ERRORES ENCONTRADOS (${this.auditResults.errors.length}):`);
      this.auditResults.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error}`);
      });
      if (this.auditResults.errors.length > 5) {
        console.log(`   ... y ${this.auditResults.errors.length - 5} más`);
      }
    }

    console.log(`\n✨ AUDITORÍA COMPLETADA`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const auditor = new EmptyFileAuditor();
  auditor.run().catch(console.error);
}

module.exports = EmptyFileAuditor;

// Export para uso como módulo
module.exports = EmptyFileAuditor;

// Ejecutar si es llamado directamente
if (require.main === module) {
  const auditor = new EmptyFileAuditor();
  auditor.run().catch(console.error);
}