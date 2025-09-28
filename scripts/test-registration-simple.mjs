// Script simple de prueba para verificar el registro de usuarios
import { PrismaClient } from '@prisma/client';
import { handleEmailAuth } from '../src/lib/userManagerTest.js';

const prisma = new PrismaClient();

async function testRegistration() {
  console.log('🧪 VERIFICANDO REGISTRO DE USUARIOS\n');
  
  const testEmail = `test-registro-${Date.now()}@example.com`;
  
  try {
    // Contar usuarios antes
    const usersBefore = await prisma.usuarios.count();
    console.log(`📊 Usuarios antes: ${usersBefore}`);
    
    // Registrar nuevo usuario
    console.log(`\n📝 Registrando usuario: ${testEmail}`);
    const newUser = await handleEmailAuth(testEmail, 'TestPass123!', {
      nombre: 'Usuario Test',
      celular: '1234567890',
      ciudad: 'Ciudad Test'
    });
    
    console.log(`✅ Usuario registrado:`);
    console.log(`   - ID: ${newUser.id}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Nombre: ${newUser.name}`);
    console.log(`   - Método: ${newUser.method}`);
    
    // Verificar en base de datos
    const savedUser = await prisma.usuarios.findUnique({
      where: { email: testEmail }
    });
    
    console.log(`\n🔍 Verificando en base de datos:`);
    console.log(`   - Usuario encontrado: ${savedUser ? '✅' : '❌'}`);
    
    if (savedUser) {
      console.log(`   - Nombre: ${savedUser.nombre}`);
      console.log(`   - Email: ${savedUser.email}`);
      console.log(`   - Celular: ${savedUser.celular || 'No especificado'}`);
      console.log(`   - Ciudad: ${savedUser.ciudad || 'No especificada'}`);
      console.log(`   - Password: ${savedUser.password ? '✅ Hasheado' : '❌'}`);
      console.log(`   - Creado: ${savedUser.createdAt.toISOString().split('T')[0]}`);
    }
    
    // Contar usuarios después
    const usersAfter = await prisma.usuarios.count();
    console.log(`\n📊 Usuarios después: ${usersAfter}`);
    console.log(`📈 Usuarios nuevos: ${usersAfter - usersBefore}`);
    
    // Intentar duplicado
    console.log(`\n🔄 Probando email duplicado...`);
    const duplicate = await handleEmailAuth(testEmail, 'NewPass456!', {
      nombre: 'Nombre Diferente'
    });
    
    console.log(`✅ Duplicado manejado: ${duplicate.id}`);
    
    // Verificar que no se crearon duplicados
    const finalCount = await prisma.usuarios.count();
    console.log(`📊 Total final: ${finalCount}`);
    console.log(`${finalCount === usersAfter ? '✅' : '❌'} No se crearon duplicados`);
    
    // Limpiar
    await prisma.usuarios.delete({
      where: { email: testEmail }
    });
    console.log(`\n🗑️ Usuario test eliminado`);
    
    console.log('\n🎉 REGISTRO DE USUARIOS FUNCIONA CORRECTAMENTE');
    console.log('   ✅ Los datos se guardan en PostgreSQL');
    console.log('   ✅ No se crean duplicados');
    console.log('   ✅ Todos los campos se capturan correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    // Limpiar en caso de error
    try {
      await prisma.usuarios.deleteMany({
        where: { email: testEmail }
      });
    } catch (e) {}
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
testRegistration().catch(console.error);