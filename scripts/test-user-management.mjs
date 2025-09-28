// Script de prueba para verificar el manejo correcto de usuarios
// Simula diferentes escenarios de registro y autenticación

import prisma from '../src/lib/prisma.js';
import { handleGoogleAuth, handleEmailAuth, cleanupDuplicateUsers } from '../src/lib/userManager.js';

async function runTests() {
  console.log('🔍 INICIANDO PRUEBAS DE MANEJO DE USUARIOS\n');
  
  try {
    // Test 1: Registro nuevo con email/password
    console.log('📝 Test 1: Nuevo usuario con email/password');
    const testEmail = 'test-user-' + Date.now() + '@example.com';
    
    const newUser = await handleEmailAuth(testEmail, 'testpassword123', {
      nombre: 'Usuario Test',
      celular: '1234567890',
      ciudad: 'Test City'
    });
    
    console.log(`✅ Usuario creado: ${newUser.name} (${newUser.email}) - Método: ${newUser.method}`);
    
    // Test 2: Intentar crear el mismo usuario otra vez (debería actualizar)
    console.log('\n🔄 Test 2: Intentar duplicate user (debería actualizar)');
    
    const duplicateAttempt = await handleEmailAuth(testEmail, 'newpassword456', {
      nombre: 'Usuario Test Actualizado',
      celular: '0987654321'
    });
    
    console.log(`✅ Usuario actualizado: ${duplicateAttempt.name} (${duplicateAttempt.email})`);
    
    // Test 3: Simular autenticación Google para el mismo email
    console.log('\n🌐 Test 3: Google auth para email existente');
    
    const googleAuth = await handleGoogleAuth({
      email: testEmail,
      name: 'Usuario desde Google',
      picture: 'https://example.com/picture.jpg',
      email_verified: true
    });
    
    console.log(`✅ Google auth: ${googleAuth.name} (${googleAuth.email}) - Método: ${googleAuth.method}`);
    
    // Test 4: Verificar estado final del usuario
    console.log('\n📊 Test 4: Verificar estado final');
    
    const finalUser = await prisma.usuarios.findUnique({
      where: { email: testEmail }
    });
    
    console.log('Estado final del usuario:');
    console.log(`- ID: ${finalUser.id}`);
    console.log(`- Nombre: ${finalUser.nombre}`);
    console.log(`- Email: ${finalUser.email}`);
    console.log(`- Tiene password: ${finalUser.password ? 'Sí' : 'No'}`);
    console.log(`- Email verificado: ${finalUser.emailVerified}`);
    console.log(`- Último login: ${finalUser.lastLoginAt}`);
    console.log(`- Celular: ${finalUser.celular || 'No especificado'}`);
    console.log(`- Ciudad: ${finalUser.ciudad || 'No especificada'}`);
    
    // Test 5: Estadísticas generales
    console.log('\n📈 Test 5: Estadísticas generales de usuarios');
    
    const stats = await prisma.usuarios.aggregate({
      _count: {
        id: true
      }
    });
    
    const withPassword = await prisma.usuarios.count({
      where: {
        password: {
          not: null
        }
      }
    });
    
    const withoutPassword = stats._count.id - withPassword;
    const verified = await prisma.usuarios.count({
      where: { emailVerified: true }
    });
    
    console.log(`📊 Total usuarios: ${stats._count.id}`);
    console.log(`🔐 Con password: ${withPassword}`);
    console.log(`🌐 Solo Google: ${withoutPassword}`);
    console.log(`✅ Verificados: ${verified}`);
    
    // Test 6: Verificar duplicados
    console.log('\n🔍 Test 6: Verificar duplicados existentes');
    
    const duplicateCheck = await cleanupDuplicateUsers(true); // Modo simulación
    console.log(`🧹 Duplicados encontrados - Mantenidos: ${duplicateCheck.kept}, Eliminar: ${duplicateCheck.cleaned}`);
    
    // Cleanup: Eliminar usuario de prueba
    await prisma.usuarios.delete({
      where: { email: testEmail }
    });
    console.log(`\n🗑️ Usuario de prueba eliminado: ${testEmail}`);
    
  } catch (error) {
    console.error('❌ Error en pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para verificar integridad de datos actuales
async function verifyDataIntegrity() {
  console.log('\n🔒 VERIFICANDO INTEGRIDAD DE DATOS ACTUALES\n');
  
  try {
    // Buscar posibles problemas
    const issues = {
      emptyEmails: 0,
      emptyNames: 0,
      unverifiedGoogleUsers: 0,
      usersWithoutLoginDate: 0
    };
    
    // Verificar emails vacíos
    const emptyEmails = await prisma.usuarios.count({
      where: {
        OR: [
          { email: null },
          { email: '' }
        ]
      }
    });
    issues.emptyEmails = emptyEmails;
    
    // Verificar nombres vacíos
    const emptyNames = await prisma.usuarios.count({
      where: {
        OR: [
          { nombre: null },
          { nombre: '' }
        ]
      }
    });
    issues.emptyNames = emptyNames;
    
    // Usuarios sin fecha de último login
    const noLoginDate = await prisma.usuarios.count({
      where: { lastLoginAt: null }
    });
    issues.usersWithoutLoginDate = noLoginDate;
    
    // Usuarios que pueden ser de Google pero no verificados
    const possibleGoogleUnverified = await prisma.usuarios.count({
      where: {
        AND: [
          { password: null },
          { emailVerified: false }
        ]
      }
    });
    issues.unverifiedGoogleUsers = possibleGoogleUnverified;
    
    console.log('🔍 Reporte de integridad:');
    console.log(`- Emails vacíos: ${issues.emptyEmails}`);
    console.log(`- Nombres vacíos: ${issues.emptyNames}`);
    console.log(`- Sin fecha login: ${issues.usersWithoutLoginDate}`);
    console.log(`- Google no verificados: ${issues.unverifiedGoogleUsers}`);
    
    const hasIssues = Object.values(issues).some(count => count > 0);
    
    if (!hasIssues) {
      console.log('✅ No se encontraron problemas de integridad');
    } else {
      console.log('⚠️ Se encontraron algunos problemas que pueden requerir atención');
    }
    
    return issues;
    
  } catch (error) {
    console.error('❌ Error verificando integridad:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Ejecutando verificación completa de usuarios...\n');
  
  Promise.all([
    runTests(),
    verifyDataIntegrity()
  ]).then(() => {
    console.log('\n✅ Verificación completa finalizada');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Error en verificación:', error);
    process.exit(1);
  });
}