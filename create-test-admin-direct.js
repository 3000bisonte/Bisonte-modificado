import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log('🔍 Verificando usuario test@bisonteapp.com...\n');
    
    const email = 'test@bisonteapp.com';
    const password = 'TestBisonte2024!';
    
    // Buscar usuario existente
    let user = await prisma.usuarios.findUnique({
      where: { email },
      select: {
        id: true,
        nombre: true,
        email: true,
        esAdministrador: true,
        emailVerified: true,
        perfilCompleto: true,
        password: true,
        createdAt: true
      }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.nombre}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   esAdministrador: ${user.esAdministrador}`);
      console.log(`   emailVerified: ${user.emailVerified}`);
      console.log(`   perfilCompleto: ${user.perfilCompleto}`);
      console.log(`   Tiene password: ${!!user.password}`);
      console.log(`   Creado: ${user.createdAt}\n`);
      
      // Verificar si necesita actualización
      const needsUpdate = !user.esAdministrador || !user.emailVerified || !user.perfilCompleto;
      
      if (needsUpdate) {
        console.log('⚠️  Usuario necesita actualización. Actualizando...\n');
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        user = await prisma.usuarios.update({
          where: { email },
          data: {
            esAdministrador: true,
            emailVerified: true,
            perfilCompleto: true,
            password: hashedPassword,
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Usuario actualizado correctamente\n');
      } else {
        console.log('✅ Usuario ya tiene todos los permisos de administrador\n');
        
        // Actualizar password por si acaso
        console.log('🔄 Actualizando contraseña para asegurar que funciona...\n');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        user = await prisma.usuarios.update({
          where: { email },
          data: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Contraseña actualizada\n');
      }
    } else {
      console.log('⚠️  Usuario no existe. Creando...\n');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      user = await prisma.usuarios.create({
        data: {
          nombre: 'Test Admin',
          celular: '3001234567',
          ciudad: 'Bogotá',
          email,
          password: hashedPassword,
          esAdministrador: true,
          esRecolector: false,
          emailVerified: true,
          perfilCompleto: true,
          tipoDocumento: 'CC',
          numeroDocumento: '1234567890',
          direccionRecogida: 'Calle 123 #45-67',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Usuario creado exitosamente:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   esAdministrador: ${user.esAdministrador}\n`);
    }
    
    // Verificar final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ESTADO FINAL DEL USUARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Email: ${user.email}`);
    console.log(`✅ Password: ${password}`);
    console.log(`✅ Es Administrador: ${user.esAdministrador ? '✓ SÍ' : '✗ NO'}`);
    console.log(`✅ Email Verificado: ${user.emailVerified ? '✓ SÍ' : '✗ NO'}`);
    console.log(`✅ Perfil Completo: ${user.perfilCompleto ? '✓ SÍ' : '✗ NO'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Verificar que el usuario está en el middleware
    const admins = [
      "3000bisonte@gmail.com",
      "bisonteangela@gmail.com", 
      "bisonteoskar@gmail.com",
      "test@bisonteapp.com",
    ];
    
    console.log(`🔐 Usuario en lista de admins del middleware: ${admins.includes(email) ? '✓ SÍ' : '✗ NO'}\n`);
    
    console.log('🎯 Ahora intenta iniciar sesión en www.bisonteapp.com');
    console.log('   Email: test@bisonteapp.com');
    console.log('   Password: TestBisonte2024!\n');
    
    console.log('📱 Para acceder a panel admin: www.bisonteapp.com/admin/envios\n');
    
    // Hacer una consulta final para confirmar
    const finalCheck = await prisma.usuarios.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        esAdministrador: true,
        emailVerified: true,
        perfilCompleto: true
      }
    });
    
    console.log('🔍 Verificación final desde DB:');
    console.log(JSON.stringify(finalCheck, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();
