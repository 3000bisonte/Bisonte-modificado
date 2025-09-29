#!/usr/bin/env node
import prisma from '../../src/lib/prisma.js';

async function main() {
  console.log('⚠️  Este script eliminará todos los usuarios registrados en la base de datos.');
  console.log('   Se borrarán PasswordReset, UserSession asociados y se desvincularán historial_envio.');

  const confirmEnv = process.env.NODE_ENV || 'development';
  console.log(`📦 Entorno detectado: ${confirmEnv}`);

  if (process.env.CONFIRM_CLEAR_USERS !== 'YES') {
    console.error('\n❌ Operación abortada: establece la variable de entorno CONFIRM_CLEAR_USERS=YES para continuar.');
    process.exit(1);
  }

  try {
    console.log('\n🧹 Eliminando sesiones activas...');
    const sessions = await prisma.userSession.deleteMany();
    console.log(`   → ${sessions.count} sesiones eliminadas.`);

    console.log('🧹 Eliminando solicitudes de recuperación...');
    const resets = await prisma.passwordReset.deleteMany();
    console.log(`   → ${resets.count} registros eliminados.`);

    console.log('🔄 Desvinculando historial de envíos...');
    const updatedEnvios = await prisma.historial_envio.updateMany({
      data: { usuarioId: null }
    });
    console.log(`   → ${updatedEnvios.count} registros actualizados.`);

    console.log('🗑️  Eliminando usuarios...');
    const deletedUsers = await prisma.usuarios.deleteMany();
    console.log(`   → ${deletedUsers.count} usuarios eliminados.`);

    console.log('\n✅ Limpieza completada.');
  } catch (error) {
    console.error('\n💥 Error durante la limpieza:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
