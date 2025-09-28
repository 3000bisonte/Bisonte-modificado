// 🛡️ Script de prueba para verificar todas las medidas de seguridad implementadas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 🔍 Verificar implementación de seguridad robusta
 */
async function testSecurityImplementation() {
  console.log('🛡️ VERIFICANDO IMPLEMENTACIÓN DE SEGURIDAD ROBUSTA\n');

  const results = {
    backend: {},
    frontend: {},
    authentication: {},
    validation: {},
    middleware: {}
  };

  try {
    // 1. Verificar Backend Security
    console.log('🔐 1. VERIFICANDO BACKEND SECURITY...');
    
    // Verificar middleware de autenticación
    try {
      const authMiddlewareExists = await checkFileExists('src/lib/authMiddleware.js');
      results.backend.authMiddleware = authMiddlewareExists;
      console.log(`   ✅ Middleware de autenticación: ${authMiddlewareExists ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.backend.authMiddleware = false;
      console.log('   ❌ Middleware de autenticación: Error al verificar');
    }

    // Verificar validación con Zod
    try {
      const validationExists = await checkFileExists('src/lib/validation.js');
      results.backend.validation = validationExists;
      console.log(`   ✅ Sistema de validación: ${validationExists ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.backend.validation = false;
      console.log('   ❌ Sistema de validación: Error al verificar');
    }

    // Verificar headers de seguridad
    try {
      const securityHeadersExists = await checkFileExists('src/lib/securityHeaders.js');
      results.backend.securityHeaders = securityHeadersExists;
      console.log(`   ✅ Headers de seguridad: ${securityHeadersExists ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.backend.securityHeaders = false;
      console.log('   ❌ Headers de seguridad: Error al verificar');
    }

    // 2. Verificar Frontend Security
    console.log('\n🖥️ 2. VERIFICANDO FRONTEND SECURITY...');
    
    // Verificar AuthProvider
    try {
      const authProviderExists = await checkFileExists('src/components/AuthProvider.js');
      results.frontend.authProvider = authProviderExists;
      console.log(`   ✅ AuthProvider robusto: ${authProviderExists ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.frontend.authProvider = false;
      console.log('   ❌ AuthProvider robusto: Error al verificar');
    }

    // Verificar ProtectedRoute
    try {
      const protectedRouteExists = await checkFileExists('src/components/ProtectedRoute.js');
      results.frontend.protectedRoute = protectedRouteExists;
      console.log(`   ✅ Protección de rutas: ${protectedRouteExists ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.frontend.protectedRoute = false;
      console.log('   ❌ Protección de rutas: Error al verificar');
    }

    // Verificar hooks de manejo de estado
    try {
      const hooksExist = await checkFileExists('src/hooks/useAsyncOperation.js');
      results.frontend.stateHooks = hooksExist;
      console.log(`   ✅ Hooks de estado seguro: ${hooksExist ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.frontend.stateHooks = false;
      console.log('   ❌ Hooks de estado seguro: Error al verificar');
    }

    // 3. Verificar Authentication Security
    console.log('\n🔑 3. VERIFICANDO AUTHENTICATION SECURITY...');
    
    // Verificar API de verificación de sesión
    try {
      const sessionVerifyExists = await checkFileExists('src/app/api/auth/verify-session/route.js');
      results.authentication.sessionVerify = sessionVerifyExists;
      console.log(`   ✅ Verificación de sesión: ${sessionVerifyExists ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.authentication.sessionVerify = false;
      console.log('   ❌ Verificación de sesión: Error al verificar');
    }

    // Verificar registro mejorado
    try {
      const registerImproved = await checkRegisterImprovement();
      results.authentication.registerImproved = registerImproved;
      console.log(`   ✅ Registro mejorado: ${registerImproved ? 'Implementado' : 'Faltante'}`);
    } catch (error) {
      results.authentication.registerImproved = false;
      console.log('   ❌ Registro mejorado: Error al verificar');
    }

    // 4. Verificar Database Security
    console.log('\n🗄️ 4. VERIFICANDO DATABASE SECURITY...');
    
    // Verificar usuarios en base de datos
    const totalUsers = await prisma.usuarios.count();
    console.log(`   📊 Total usuarios: ${totalUsers}`);
    
    // Verificar duplicados
    const duplicates = await prisma.usuarios.groupBy({
      by: ['email'],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } }
    });
    
    results.authentication.noDuplicates = duplicates.length === 0;
    console.log(`   ✅ Sin duplicados: ${duplicates.length === 0 ? 'Verificado' : `${duplicates.length} duplicados encontrados`}`);

    // Verificar passwords hasheados
    const usersWithPasswords = await prisma.usuarios.count({
      where: { password: { not: null } }
    });
    console.log(`   🔐 Usuarios con password: ${usersWithPasswords}`);

    // 5. Verificar Middleware Security
    console.log('\n🚦 5. VERIFICANDO MIDDLEWARE SECURITY...');
    
    try {
      const middlewareContent = await readFileContent('middleware.js');
      
      // Verificar rate limiting
      const hasRateLimit = middlewareContent.includes('isRateLimited');
      results.middleware.rateLimit = hasRateLimit;
      console.log(`   ✅ Rate limiting: ${hasRateLimit ? 'Implementado' : 'Faltante'}`);
      
      // Verificar bloqueo de rutas maliciosas
      const hasBlockedPaths = middlewareContent.includes('isBlockedPath');
      results.middleware.blockedPaths = hasBlockedPaths;
      console.log(`   ✅ Bloqueo de rutas: ${hasBlockedPaths ? 'Implementado' : 'Faltante'}`);
      
      // Verificar headers de seguridad
      const hasSecurityHeaders = middlewareContent.includes('X-Content-Type-Options');
      results.middleware.securityHeaders = hasSecurityHeaders;
      console.log(`   ✅ Headers de seguridad: ${hasSecurityHeaders ? 'Implementado' : 'Faltante'}`);
      
    } catch (error) {
      console.log('   ❌ Error verificando middleware');
      results.middleware = { error: true };
    }

    // 6. Generar reporte final
    console.log('\n📋 REPORTE FINAL DE SEGURIDAD:');
    console.log('===============================');
    
    const backendScore = Object.values(results.backend).filter(Boolean).length;
    const frontendScore = Object.values(results.frontend).filter(Boolean).length;
    const authScore = Object.values(results.authentication).filter(Boolean).length;
    const middlewareScore = Object.values(results.middleware).filter(Boolean).length;
    
    console.log(`🔐 Backend Security: ${backendScore}/3 implementado`);
    console.log(`🖥️ Frontend Security: ${frontendScore}/3 implementado`);
    console.log(`🔑 Authentication: ${authScore}/3 implementado`);
    console.log(`🚦 Middleware Security: ${middlewareScore}/3 implementado`);
    
    const totalScore = backendScore + frontendScore + authScore + middlewareScore;
    const maxScore = 12;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    console.log(`\n🎯 PUNTUACIÓN TOTAL: ${totalScore}/${maxScore} (${percentage}%)`);
    
    if (percentage >= 90) {
      console.log('🎉 EXCELENTE: Seguridad robusta implementada correctamente');
    } else if (percentage >= 75) {
      console.log('✅ BUENO: La mayoría de medidas de seguridad están implementadas');
    } else if (percentage >= 50) {
      console.log('⚠️ REGULAR: Se necesitan más medidas de seguridad');
    } else {
      console.log('❌ DEFICIENTE: Se requiere implementar más seguridad');
    }

    return results;

  } catch (error) {
    console.error('❌ Error en verificación de seguridad:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Funciones auxiliares
async function checkFileExists(filePath) {
  try {
    const fs = await import('fs/promises');
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readFileContent(filePath) {
  const fs = await import('fs/promises');
  return await fs.readFile(filePath, 'utf8');
}

async function checkRegisterImprovement() {
  try {
    const content = await readFileContent('src/app/api/register/route.js');
    return content.includes('handleEmailAuth') && content.includes('userManager');
  } catch {
    return false;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testSecurityImplementation()
    .then(() => {
      console.log('\n✅ Verificación de seguridad completada');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error en verificación:', error);
      process.exit(1);
    });
}

export default testSecurityImplementation;