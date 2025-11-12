/**
 * Script para crear usuario de prueba con acceso de administrador
 * Para Google Play Console testing
 * 
 * Uso: node create-test-admin.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log('🔧 Creando usuario de prueba con acceso admin...\n');

    const email = 'test@bisonteapp.com';
    const password = 'TestBisonte2024!';
    
    // Generar hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuarios.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('⚠️  Usuario ya existe, actualizando a administrador...');
      
      // Actualizar el usuario existente
      const updatedUser = await prisma.usuarios.update({
        where: { email },
        data: {
          esAdministrador: true,
          emailVerified: true,
          perfilCompleto: true,
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Usuario actualizado exitosamente:');
      console.log(`   📧 Email: ${updatedUser.email}`);
      console.log(`   🔐 Password: ${password}`);
      console.log(`   👑 Admin: ${updatedUser.esAdministrador}`);
      console.log(`   ✓ Email Verificado: ${updatedUser.emailVerified}`);
      console.log(`   ✓ Perfil Completo: ${updatedUser.perfilCompleto}`);
      
    } else {
      console.log('📝 Creando nuevo usuario...');
      
      // Crear el nuevo usuario
      const newUser = await prisma.usuarios.create({
        data: {
          nombre: 'Test Admin',
          celular: '3001234567',
          ciudad: 'Bogotá',
          email,
          password: hashedPassword,
          esAdministrador: true,  // ✅ ES ADMINISTRADOR
          esRecolector: false,
          emailVerified: true,     // Email verificado
          perfilCompleto: true,    // Perfil completo
          tipoDocumento: 'CC',
          numeroDocumento: '1234567890',
          direccionRecogida: 'Calle 123 #45-67',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log('✅ Usuario creado exitosamente:');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   📧 Email: ${newUser.email}`);
      console.log(`   🔐 Password: ${password}`);
      console.log(`   👑 Admin: ${newUser.esAdministrador}`);
      console.log(`   ✓ Email Verificado: ${newUser.emailVerified}`);
      console.log(`   ✓ Perfil Completo: ${newUser.perfilCompleto}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIALES PARA GOOGLE PLAY CONSOLE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Acceso: ADMINISTRADOR (/admin/envios)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar acceso admin
    const adminUsers = await prisma.usuarios.findMany({
      where: { esAdministrador: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        esAdministrador: true,
      },
    });

    console.log(`✅ Total de administradores en el sistema: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.nombre} (${admin.email})`);
    });

  } catch (error) {
    console.error('❌ Error al crear usuario de prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
createTestAdmin()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
