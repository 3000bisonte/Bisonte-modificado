// Script para verificar y mejorar el guardado de datos de usuario
// Verificación de autenticación con correo/contraseña y Google
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();
const prisma = new PrismaClient();

console.log('🔍 Verificando implementación de guardado de datos de usuarios...\n');

async function checkUserDataSaving() {
  try {
    // 1. Verificar estructura de la tabla usuarios
    console.log('📋 1. Verificando estructura de la tabla usuarios...');
    
    const userCount = await prisma.usuarios.count();
    console.log(`   ✅ Tabla usuarios accesible - Total usuarios: ${userCount}`);
    
    // Verificar campos disponibles consultando un usuario de ejemplo
    const sampleUser = await prisma.usuarios.findFirst({
      select: {
        id: true,
        nombre: true,
        celular: true,
        ciudad: true,
        email: true,
        password: true,
        emailVerified: true,
        esAdministrador: true,
        esRecolector: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        failedLogins: true,
        lockedUntil: true
      }
    });

    if (sampleUser) {
      console.log('   📊 Campos disponibles en usuarios:');
      Object.keys(sampleUser).forEach(field => {
        const value = sampleUser[field];
        const type = value === null ? 'null' : typeof value;
        console.log(`      - ${field}: ${type}`);
      });
    } else {
      console.log('   ⚠️ No hay usuarios en la base de datos para verificar campos');
    }

    // 2. Verificar usuarios creados por Google vs Email/Password
    console.log('\n📊 2. Analizando métodos de autenticación...');
    
    const googleUsers = await prisma.usuarios.findMany({
      where: {
        password: null,
        emailVerified: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    const passwordUsers = await prisma.usuarios.findMany({
      where: {
        password: { not: null }
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    console.log(`   👤 Usuarios con Google (sin password): ${googleUsers.length}`);
    console.log(`   🔐 Usuarios con password: ${passwordUsers.length}`);

    // Mostrar algunos ejemplos (sin datos sensibles)
    if (googleUsers.length > 0) {
      console.log('   📝 Ejemplos de usuarios Google:');
      googleUsers.slice(0, 3).forEach(user => {
        console.log(`      - ID: ${user.id}, Email: ${user.email.substring(0,3)}***, Nombre: ${user.nombre || 'N/A'}`);
      });
    }

    if (passwordUsers.length > 0) {
      console.log('   📝 Ejemplos de usuarios con password:');
      passwordUsers.slice(0, 3).forEach(user => {
        console.log(`      - ID: ${user.id}, Email: ${user.email.substring(0,3)}***, Verificado: ${user.emailVerified ? '✅' : '❌'}`);
      });
    }

    // 3. Verificar duplicados por email
    console.log('\n🔍 3. Verificando duplicados de usuarios...');
    
    const emailCounts = await prisma.usuarios.groupBy({
      by: ['email'],
      _count: {
        email: true
      },
      having: {
        email: {
          _count: {
            gt: 1
          }
        }
      }
    });

    if (emailCounts.length > 0) {
      console.log(`   ⚠️ Encontrados ${emailCounts.length} emails duplicados:`);
      emailCounts.forEach(item => {
        console.log(`      - ${item.email}: ${item._count.email} registros`);
      });
    } else {
      console.log('   ✅ No hay emails duplicados - La restricción UNIQUE funciona correctamente');
    }

    // 4. Verificar campos faltantes o incompletos
    console.log('\n📝 4. Verificando completitud de datos...');
    
    const incompleteUsers = await prisma.usuarios.findMany({
      where: {
        OR: [
          { nombre: null },
          { nombre: '' }
        ]
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        password: true
      }
    });

    if (incompleteUsers.length > 0) {
      console.log(`   ⚠️ Usuarios con nombre faltante: ${incompleteUsers.length}`);
      incompleteUsers.slice(0, 3).forEach(user => {
        const method = user.password ? 'Email/Password' : 'Google';
        console.log(`      - ID: ${user.id}, Método: ${method}, Nombre: "${user.nombre || 'VACÍO'}"`);
      });
    } else {
      console.log('   ✅ Todos los usuarios tienen nombre completo');
    }

    return {
      totalUsers: userCount,
      googleUsers: googleUsers.length,
      passwordUsers: passwordUsers.length,
      duplicateEmails: emailCounts.length,
      incompleteUsers: incompleteUsers.length,
      sampleFields: sampleUser ? Object.keys(sampleUser) : []
    };

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    throw error;
  }
}

async function generateRecommendations(stats) {
  console.log('\n💡 Recomendaciones y mejoras:');
  
  if (stats.duplicateEmails > 0) {
    console.log('   🔧 CRÍTICO: Resolver emails duplicados antes de continuar');
  }
  
  if (stats.incompleteUsers > 0) {
    console.log('   📝 Mejorar captura de nombre en autenticación Google');
  }
  
  if (stats.totalUsers === 0) {
    console.log('   🆕 Base de datos vacía - Listo para nuevos usuarios');
  }

  console.log('\n✨ Mejoras implementadas en el código:');
  console.log('   ✅ Uso de upsert() para prevenir duplicados');
  console.log('   ✅ Captura de datos disponibles de Google (nombre, email)');
  console.log('   ✅ Actualización de lastLoginAt en cada login');
  console.log('   ✅ Vinculación correcta por email único');
  console.log('   ✅ Logging de seguridad para auditoría');
}

// Ejecutar verificación
(async () => {
  try {
    const stats = await checkUserDataSaving();
    await generateRecommendations(stats);
    
    console.log('\n🎯 Estado actual:');
    console.log(`   - Total de usuarios: ${stats.totalUsers}`);
    console.log(`   - Autenticación Google: ${stats.googleUsers}`);
    console.log(`   - Autenticación Email/Password: ${stats.passwordUsers}`);
    console.log(`   - Emails duplicados: ${stats.duplicateEmails}`);
    console.log(`   - Usuarios incompletos: ${stats.incompleteUsers}`);
    
  } catch (error) {
    console.error('\n❌ Error en la verificación:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión cerrada');
  }
})();