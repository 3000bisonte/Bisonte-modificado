#!/usr/bin/env node

/**
 * Diagnóstico completo del flujo de autenticación - Bisonte
 * 
 * Este script identifica los problemas más comunes en:
 * - Registro de usuarios
 * - Inicio de sesión
 * - Recuperación de contraseña
 * - Configuración de entorno
 */

const fs = require('fs/promises');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message, details = '') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const levelColors = {
    ERROR: colors.red,
    WARN: colors.yellow,
    INFO: colors.blue,
    SUCCESS: colors.green,
    DEBUG: colors.cyan
  };
  
  console.log(
    `${colors.cyan}[${timestamp}]${colors.reset} ` +
    `${levelColors[level] || colors.reset}${level}${colors.reset} ` +
    `${message}${details ? ' ' + details : ''}`
  );
}

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          env[key] = valueParts.join('=');
        }
      }
    });
    return env;
  } catch (error) {
    return null;
  }
}

async function checkEnvironmentConfig() {
  log('INFO', '🔧 Verificando configuración de entorno...');
  
  const envFiles = ['.env', '.env.local', '.env.production'];
  let foundEnv = null;
  
  for (const envFile of envFiles) {
    if (await checkFileExists(envFile)) {
      const env = await readEnvFile(envFile);
      if (env) {
        log('SUCCESS', `✅ Archivo ${envFile} encontrado`);
        foundEnv = { ...foundEnv, ...env };
      }
    } else {
      log('WARN', `⚠️  Archivo ${envFile} no encontrado`);
    }
  }
  
  if (!foundEnv) {
    log('ERROR', '❌ No se encontraron archivos de configuración de entorno');
    return false;
  }
  
  // Variables críticas para autenticación
  const criticalVars = {
    'DATABASE_URL': 'Conexión a base de datos',
    'NEXTAUTH_SECRET': 'Secreto para NextAuth',
    'NEXTAUTH_URL': 'URL base de la aplicación'
  };
  
  const emailVars = {
    'RESEND_API_KEY': 'API key de Resend para correos',
    'EMAIL_FROM': 'Dirección de envío de correos'
  };
  
  let hasErrors = false;
  
  log('INFO', '📋 Variables críticas:');
  Object.entries(criticalVars).forEach(([key, description]) => {
    if (foundEnv[key] && foundEnv[key].trim()) {
      log('SUCCESS', `✅ ${key}`, `- ${description}`);
    } else {
      log('ERROR', `❌ ${key} no configurada`, `- ${description}`);
      hasErrors = true;
    }
  });
  
  log('INFO', '📧 Configuración de correo:');
  Object.entries(emailVars).forEach(([key, description]) => {
    if (foundEnv[key] && foundEnv[key].trim()) {
      log('SUCCESS', `✅ ${key}`, `- ${description}`);
    } else {
      log('WARN', `⚠️  ${key} no configurada`, `- ${description}`);
    }
  });
  
  return !hasErrors;
}

async function checkDatabaseConnection() {
  log('INFO', '🗄️  Verificando esquema de base de datos...');
  
  const schemaPath = 'prisma/schema.prisma';
  if (!(await checkFileExists(schemaPath))) {
    log('ERROR', '❌ Archivo schema.prisma no encontrado');
    return false;
  }
  
  try {
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Verificar modelos críticos
    const requiredModels = ['usuarios', 'passwordReset'];
    const missingModels = [];
    
    requiredModels.forEach(model => {
      if (!schema.includes(`model ${model}`) && !schema.includes(`model ${model.charAt(0).toUpperCase() + model.slice(1)}`)) {
        missingModels.push(model);
      }
    });
    
    if (missingModels.length > 0) {
      log('ERROR', '❌ Modelos faltantes en schema.prisma:', missingModels.join(', '));
      return false;
    }
    
    // Verificar campos críticos en usuario
    const userModelMatch = schema.match(/model usuarios?\s*{[^}]+}/i);
    if (userModelMatch) {
      const userModel = userModelMatch[0];
      const requiredFields = ['email', 'password', 'nombre'];
      const missingFields = requiredFields.filter(field => !userModel.includes(field));
      
      if (missingFields.length > 0) {
        log('WARN', '⚠️  Campos recomendados faltantes en modelo usuarios:', missingFields.join(', '));
      } else {
        log('SUCCESS', '✅ Modelo usuarios tiene campos necesarios');
      }
    }
    
    log('SUCCESS', '✅ Schema de base de datos parece correcto');
    return true;
    
  } catch (error) {
    log('ERROR', '❌ Error leyendo schema.prisma:', error.message);
    return false;
  }
}

async function checkAuthFiles() {
  log('INFO', '📁 Verificando archivos de autenticación...');
  
  const authFiles = [
    'src/lib/auth.js',
    'src/lib/security.js',
    'src/lib/userManager.js',
    'src/app/api/register/route.js',
    'src/app/api/auth/password/request/route.js',
    'src/app/register/page.js',
    'src/app/registro-exitoso/page.js'
  ];
  
  let allFilesExist = true;
  
  for (const filePath of authFiles) {
    if (await checkFileExists(filePath)) {
      log('SUCCESS', `✅ ${filePath}`);
    } else {
      log('ERROR', `❌ ${filePath} no encontrado`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

async function checkPackageJson() {
  log('INFO', '📦 Verificando dependencias...');
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    
    const requiredDeps = [
      'next-auth',
      'bcryptjs',
      '@prisma/client',
      'prisma',
      'resend'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length > 0) {
      log('ERROR', '❌ Dependencias faltantes:', missingDeps.join(', '));
      log('INFO', '💡 Instala con: npm install ' + missingDeps.join(' '));
      return false;
    }
    
    log('SUCCESS', '✅ Todas las dependencias necesarias están presentes');
    
    // Verificar script de diagnósticos
    if (packageJson.scripts?.['diagnostics:auth']) {
      log('SUCCESS', '✅ Script de diagnósticos disponible: npm run diagnostics:auth');
    } else {
      log('WARN', '⚠️  Script de diagnósticos no configurado');
    }
    
    return true;
    
  } catch (error) {
    log('ERROR', '❌ Error leyendo package.json:', error.message);
    return false;
  }
}

async function analyzeCommonIssues() {
  log('INFO', '🔍 Analizando problemas comunes...');
  
  const issues = [];
  
  // 1. Verificar imports en archivos de autenticación
  try {
    const authFile = await fs.readFile('src/lib/auth.js', 'utf8');
    
    if (authFile.includes('import prisma from "./prisma"') && !authFile.includes('import prisma from "./prisma.js"')) {
      issues.push({
        type: 'IMPORT_ERROR',
        file: 'src/lib/auth.js',
        description: 'Import de Prisma puede tener problemas de extensión',
        solution: 'Usar import prisma from "./prisma.js" o verificar configuración de módulos'
      });
    }
    
    if (!authFile.includes('server-only')) {
      issues.push({
        type: 'SECURITY_WARNING',
        file: 'src/lib/auth.js',
        description: 'Archivo de autenticación no marca server-only',
        solution: 'Agregar import "server-only" al inicio del archivo'
      });
    }
  } catch (error) {
    // Archivo no existe, ya reportado antes
  }
  
  // 2. Verificar configuración de registro
  try {
    const registerFile = await fs.readFile('src/app/register/page.js', 'utf8');
    
    if (!registerFile.includes('localStorage.setItem("passwordRegistro"')) {
      issues.push({
        type: 'FLOW_ERROR',
        file: 'src/app/register/page.js',
        description: 'El registro no guarda credenciales en localStorage',
        solution: 'Verificar que se guarde passwordRegistro para auto-login'
      });
    }
    
    if (!registerFile.includes('router.push("/registro-exitoso")')) {
      issues.push({
        type: 'NAVIGATION_ERROR',
        file: 'src/app/register/page.js',
        description: 'Falta redirección a página de éxito',
        solution: 'Agregar redirección a /registro-exitoso después del registro'
      });
    }
  } catch (error) {
    // Archivo no existe
  }
  
  // 3. Verificar página de registro exitoso
  try {
    const successFile = await fs.readFile('src/app/registro-exitoso/page.js', 'utf8');
    
    if (!successFile.includes('signIn("credentials"')) {
      issues.push({
        type: 'AUTO_LOGIN_ERROR',
        file: 'src/app/registro-exitoso/page.js',
        description: 'Auto-login no implementado correctamente',
        solution: 'Usar signIn de next-auth con redirect: false'
      });
    }
  } catch (error) {
    // Archivo no existe
  }
  
  return issues;
}

async function generateSolutionReport(issues) {
  log('INFO', '📋 Generando reporte de soluciones...');
  
  const reportPath = 'AUTH_DIAGNOSTIC_REPORT.md';
  
  let report = `# Reporte de Diagnóstico de Autenticación
Generado: ${new Date().toLocaleString('es-CO')}

## Problemas Identificados

`;

  if (issues.length === 0) {
    report += '✅ No se encontraron problemas específicos en el análisis estático.\n\n';
  } else {
    issues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.type}
**Archivo:** \`${issue.file}\`
**Descripción:** ${issue.description}
**Solución:** ${issue.solution}

`;
    });
  }

  report += `## Checklist de Verificación Manual

### 1. Registro de Usuario
- [ ] El formulario valida todos los campos correctamente
- [ ] La API \`/api/register\` responde con status 201 para registros exitosos
- [ ] Las contraseñas se hashean correctamente con bcrypt
- [ ] Los datos se guardan en la tabla \`usuarios\` de la base de datos
- [ ] Se guarda el email, nombre y password en localStorage tras registro exitoso
- [ ] Redirecciona a \`/registro-exitoso\` después del registro

### 2. Auto-login Post-registro  
- [ ] La página \`/registro-exitoso\` lee los datos de localStorage
- [ ] Llama a \`signIn("credentials", {redirect: false})\` con las credenciales
- [ ] Maneja errores de login gracefully
- [ ] Redirecciona a \`/home\` solo después de login exitoso
- [ ] Limpia localStorage después de login exitoso

### 3. Inicio de Sesión Manual
- [ ] La página de login usa NextAuth correctamente
- [ ] Las credenciales se validan contra la base de datos
- [ ] Las contraseñas se comparan con \`bcrypt.compare()\`
- [ ] Los errores de autenticación se muestran claramente
- [ ] La sesión se establece correctamente tras login exitoso

### 4. Recuperación de Contraseña
- [ ] El endpoint \`/api/auth/password/request\` existe y funciona
- [ ] Se genera un token/código de recuperación válido  
- [ ] El token se guarda en la tabla \`passwordReset\`
- [ ] El correo se envía usando Resend o SMTP fallback
- [ ] El correo llega a la bandeja de entrada (no spam)
- [ ] El enlace/código en el correo es válido

### 5. Variables de Entorno (Producción)
- [ ] \`DATABASE_URL\` apunta a la base de datos correcta
- [ ] \`NEXTAUTH_URL\` es la URL exacta del dominio en producción
- [ ] \`NEXTAUTH_SECRET\` es un string seguro único
- [ ] \`RESEND_API_KEY\` es válida y activa
- [ ] \`EMAIL_FROM\` es un email verificado en Resend

## Comandos de Diagnóstico

\`\`\`bash
# Verificar conexión de base de datos
npx prisma db pull

# Regenerar cliente Prisma
npx prisma generate

# Verificar migraciones
npx prisma migrate status

# Ejecutar diagnóstico automatizado
npm run diagnostics:auth

# Verificar build de producción
npm run build
\`\`\`

## Errores Comunes y Soluciones

### "Usuario o contraseña incorrectos" (Después de registro exitoso)
1. Verificar que la contraseña se hashea en el registro
2. Verificar que se usa \`bcrypt.compare()\` en el login
3. Revisar que el email se normaliza (\`toLowerCase()\`) en ambos flujos
4. Confirmar que los datos se guardaron en la base de datos

### "Redirección a login en lugar de home"
1. Verificar que \`signIn()\` se llama con \`redirect: false\`
2. Confirmar que se verifica \`result.ok\` antes de redirigir
3. Asegurar que las credenciales en localStorage son correctas
4. Revisar logs de NextAuth para errores de autenticación

### "Correo de recuperación no llega"
1. Verificar que \`RESEND_API_KEY\` es válida
2. Confirmar que \`EMAIL_FROM\` está verificado en Resend
3. Revisar logs del servidor para errores de envío
4. Verificar que el dominio no está en lista negra
5. Probar con SMTP fallback si Resend falla

### Errores de Import/Build
1. Verificar extensiones \`.js\` en imports relativos
2. Confirmar que archivos server-side tienen \`import 'server-only'\`
3. Revisar que todas las dependencias están instaladas
4. Verificar configuración de ESLint y TypeScript

## Próximos Pasos Recomendados

1. **Ejecutar diagnóstico automatizado**: \`npm run diagnostics:auth\`
2. **Revisar logs del servidor** durante registro y login
3. **Probar en entorno de desarrollo** primero
4. **Verificar configuración en producción** (Vercel/Netlify)
5. **Monitorear bases de datos** para confirmar persistencia de datos
`;

  await fs.writeFile(reportPath, report, 'utf8');
  log('SUCCESS', `✅ Reporte guardado en ${reportPath}`);
}

async function main() {
  console.clear();
  log('INFO', '🚀 Iniciando diagnóstico completo del flujo de autenticación...\n');
  
  const results = {
    environment: await checkEnvironmentConfig(),
    database: await checkDatabaseConnection(),
    authFiles: await checkAuthFiles(),
    dependencies: await checkPackageJson()
  };
  
  console.log(''); // Línea en blanco
  
  const issues = await analyzeCommonIssues();
  await generateSolutionReport(issues);
  
  console.log(''); // Línea en blanco
  log('INFO', '📊 Resumen del diagnóstico:');
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    const label = {
      environment: 'Configuración de entorno',
      database: 'Schema de base de datos', 
      authFiles: 'Archivos de autenticación',
      dependencies: 'Dependencias del proyecto'
    }[check];
    
    log(passed ? 'SUCCESS' : 'ERROR', `${status} ${label}`);
  });
  
  const overallSuccess = Object.values(results).every(Boolean);
  
  console.log(''); // Línea en blanco
  if (overallSuccess) {
    log('SUCCESS', '🎉 Configuración base parece estar correcta');
    log('INFO', '💡 Si sigues teniendo problemas, revisa AUTH_DIAGNOSTIC_REPORT.md');
    log('INFO', '🔧 Ejecuta: npm run diagnostics:auth para pruebas en vivo');
  } else {
    log('ERROR', '❌ Se encontraron problemas de configuración');
    log('INFO', '📖 Revisa AUTH_DIAGNOSTIC_REPORT.md para soluciones detalladas');
  }
  
  if (issues.length > 0) {
    console.log(''); 
    log('WARN', `⚠️  Se identificaron ${issues.length} problemas potenciales en el código`);
    issues.forEach(issue => {
      log('WARN', `   • ${issue.type}: ${issue.description}`);
    });
  }
}

// Ejecutar diagnóstico
main().catch(error => {
  log('ERROR', '💥 Error fatal en diagnóstico:', error.message);
  if (process.env.DEBUG) {
    console.error(error);
  }
  process.exit(1);
});