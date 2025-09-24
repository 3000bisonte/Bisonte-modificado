#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class ConfigurationValidator {
  constructor() {
    this.rootDir = process.cwd();
    this.validationResults = {
      configFiles: [],
      pathAliases: [],
      scripts: [],
      dependencies: [],
      errors: [],
      warnings: [],
      success: []
    };
  }

  async run() {
    console.log('🔍 Validando configuración del proyecto...\n');
    
    try {
      await this.validateConfigFiles();
      await this.validatePathAliases();
      await this.validatePackageScripts();
      await this.validateDependencies();
      await this.validateProjectStructure();
    } catch (error) {
      console.error('❌ Error durante la validación:', error);
      this.validationResults.errors.push(error.message);
    }

    this.printResults();
    return this.validationResults.errors.length === 0;
  }

  async validateConfigFiles() {
    console.log('📋 Validando archivos de configuración...');
    
    const requiredConfigs = [
      { file: 'tsconfig.json', desc: 'Configuración principal de TypeScript' },
      { file: 'config/build/tsconfig.base.json', desc: 'Configuración base de TypeScript' },
      { file: '.eslintrc.js', desc: 'Configuración principal de ESLint' },
      { file: 'config/build/.eslintrc.base.json', desc: 'Configuración base de ESLint' },
      { file: '.prettierrc', desc: 'Configuración principal de Prettier' },
      { file: 'config/build/.prettierrc.json', desc: 'Configuración base de Prettier' },
      { file: 'next.config.js', desc: 'Configuración de Next.js' },
      { file: 'tailwind.config.js', desc: 'Configuración de Tailwind CSS' },
      { file: 'package.json', desc: 'Configuración de npm/package' }
    ];

    for (const config of requiredConfigs) {
      try {
        await fs.access(path.join(this.rootDir, config.file));
        this.validationResults.configFiles.push({
          file: config.file,
          status: 'exists',
          desc: config.desc
        });
        this.validationResults.success.push(`✅ ${config.desc} encontrada`);
      } catch {
        this.validationResults.configFiles.push({
          file: config.file,
          status: 'missing',
          desc: config.desc
        });
        this.validationResults.errors.push(`❌ Falta ${config.desc}: ${config.file}`);
      }
    }
  }

  async validatePathAliases() {
    console.log('🗺️  Validando path aliases...');
    
    try {
      const tsConfigPath = path.join(this.rootDir, 'tsconfig.json');
      const tsConfig = JSON.parse(await fs.readFile(tsConfigPath, 'utf-8'));
      
      const expectedAliases = [
        '@/*',
        '@/app/*',
        '@/components/*',
        '@/ui/*',
        '@/lib/*',
        '@/services/*',
        '@/hooks/*',
        '@/config/*',
        '@/types/*',
        '@/mobile/*',
        '@/native/*',
        '@/public/*'
      ];

      const configuredPaths = Object.keys(tsConfig.compilerOptions?.paths || {});
      
      for (const alias of expectedAliases) {
        if (configuredPaths.includes(alias)) {
          this.validationResults.pathAliases.push({
            alias,
            status: 'configured',
            target: tsConfig.compilerOptions.paths[alias][0]
          });
          this.validationResults.success.push(`✅ Path alias ${alias} configurado`);
        } else {
          this.validationResults.pathAliases.push({
            alias,
            status: 'missing'
          });
          this.validationResults.warnings.push(`⚠️  Path alias ${alias} no configurado`);
        }
      }
    } catch (error) {
      this.validationResults.errors.push(`❌ Error validando path aliases: ${error.message}`);
    }
  }

  async validatePackageScripts() {
    console.log('🛠️  Validando scripts de npm...');
    
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      
      const expectedScripts = [
        'dev',
        'build',
        'start',
        'lint',
        'lint:fix',
        'format',
        'type-check',
        'maintenance:cleanup',
        'maintenance:validate-imports',
        'quality:check',
        'quality:fix'
      ];

      const configuredScripts = Object.keys(packageJson.scripts || {});
      
      for (const script of expectedScripts) {
        if (configuredScripts.includes(script)) {
          this.validationResults.scripts.push({
            script,
            status: 'configured',
            command: packageJson.scripts[script]
          });
          this.validationResults.success.push(`✅ Script ${script} configurado`);
        } else {
          this.validationResults.scripts.push({
            script,
            status: 'missing'
          });
          this.validationResults.warnings.push(`⚠️  Script ${script} no configurado`);
        }
      }
    } catch (error) {
      this.validationResults.errors.push(`❌ Error validando scripts: ${error.message}`);
    }
  }

  async validateDependencies() {
    console.log('📦 Validando dependencias...');
    
    try {
      const packagePath = path.join(this.rootDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      
      const requiredDeps = {
        dependencies: [
          'next',
          'react',
          'react-dom',
          '@prisma/client',
          'next-auth',
          'zod'
        ],
        devDependencies: [
          'typescript',
          'eslint',
          'prettier',
          '@typescript-eslint/parser',
          '@typescript-eslint/eslint-plugin',
          'eslint-config-prettier',
          'eslint-plugin-security',
          'tailwindcss',
          'autoprefixer',
          'postcss'
        ]
      };

      for (const [type, deps] of Object.entries(requiredDeps)) {
        const installed = Object.keys(packageJson[type] || {});
        
        for (const dep of deps) {
          if (installed.includes(dep)) {
            this.validationResults.dependencies.push({
              name: dep,
              type,
              status: 'installed',
              version: packageJson[type][dep]
            });
            this.validationResults.success.push(`✅ ${dep} instalado`);
          } else {
            this.validationResults.dependencies.push({
              name: dep,
              type,
              status: 'missing'
            });
            this.validationResults.warnings.push(`⚠️  ${dep} no instalado en ${type}`);
          }
        }
      }
    } catch (error) {
      this.validationResults.errors.push(`❌ Error validando dependencias: ${error.message}`);
    }
  }

  async validateProjectStructure() {
    console.log('📁 Validando estructura del proyecto...');
    
    const requiredDirs = [
      'src',
      'src/app',
      'src/components',
      'src/lib',
      'config',
      'config/build',
      'docs',
      'docs/architecture',
      'scripts',
      'scripts/maintenance',
      'scripts/build',
      'scripts/deploy'
    ];

    for (const dir of requiredDirs) {
      try {
        const dirPath = path.join(this.rootDir, dir);
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory()) {
          this.validationResults.success.push(`✅ Directorio ${dir} existe`);
        }
      } catch {
        this.validationResults.warnings.push(`⚠️  Directorio ${dir} no encontrado`);
      }
    }
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE VALIDACIÓN');
    console.log('============================');
    
    const totalChecks = this.validationResults.success.length + 
                       this.validationResults.warnings.length + 
                       this.validationResults.errors.length;
    
    console.log(`\n✅ Configuraciones exitosas: ${this.validationResults.success.length}`);
    console.log(`⚠️  Advertencias: ${this.validationResults.warnings.length}`);
    console.log(`❌ Errores: ${this.validationResults.errors.length}`);
    console.log(`📊 Total verificaciones: ${totalChecks}`);

    if (this.validationResults.errors.length > 0) {
      console.log('\n❌ ERRORES CRÍTICOS:');
      this.validationResults.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }

    if (this.validationResults.warnings.length > 0) {
      console.log('\n⚠️  ADVERTENCIAS:');
      this.validationResults.warnings.slice(0, 10).forEach(warning => {
        console.log(`   ${warning}`);
      });
      if (this.validationResults.warnings.length > 10) {
        console.log(`   ... y ${this.validationResults.warnings.length - 10} más`);
      }
    }

    // Resumen de configuración
    console.log('\n📋 RESUMEN DE CONFIGURACIÓN:');
    console.log(`   📄 Archivos de configuración: ${this.validationResults.configFiles.filter(f => f.status === 'exists').length}/${this.validationResults.configFiles.length}`);
    console.log(`   🗺️  Path aliases: ${this.validationResults.pathAliases.filter(p => p.status === 'configured').length}/${this.validationResults.pathAliases.length}`);
    console.log(`   🛠️  Scripts npm: ${this.validationResults.scripts.filter(s => s.status === 'configured').length}/${this.validationResults.scripts.length}`);
    console.log(`   📦 Dependencias: ${this.validationResults.dependencies.filter(d => d.status === 'installed').length}/${this.validationResults.dependencies.length}`);

    if (this.validationResults.errors.length === 0) {
      console.log('\n🎉 ¡CONFIGURACIÓN VÁLIDA!');
      console.log('💡 El proyecto está correctamente configurado para desarrollo.');
      console.log('🚀 Puedes ejecutar "npm run dev" para iniciar el desarrollo.');
    } else {
      console.log('\n🔧 CONFIGURACIÓN INCOMPLETA');
      console.log('💡 Corregir los errores críticos antes de continuar.');
    }

    // Sugerencias de próximos pasos
    console.log('\n📝 PRÓXIMOS PASOS SUGERIDOS:');
    console.log('   1. Ejecutar "npm install" para instalar dependencias faltantes');
    console.log('   2. Ejecutar "npm run quality:check" para verificar calidad de código');
    console.log('   3. Ejecutar "npm run maintenance:all" para limpieza del proyecto');
    console.log('   4. Revisar la documentación en docs/architecture/README.md');
  }
}

// Ejecutar el validador
if (require.main === module) {
  const validator = new ConfigurationValidator();
  validator.run().catch(console.error);
}

module.exports = ConfigurationValidator;