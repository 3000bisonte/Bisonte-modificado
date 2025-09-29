#!/usr/bin/env node
import prisma from '../src/lib/prisma.js';

async function main() {
  console.log('\n🔍 Checking Prisma database connection...');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('✅ Connection successful! Result:', result);

    const counts = await Promise.allSettled([
      prisma.usuarios.count(),
      prisma.historial_envio.count(),
    ]);

    const [usuariosCount, enviosCount] = counts;

    if (usuariosCount.status === 'fulfilled') {
      console.log(`• usuarios table accessible (rows: ${usuariosCount.value})`);
    } else {
      console.log('• usuarios table warning:', usuariosCount.reason?.message || usuariosCount.reason);
    }

    if (enviosCount.status === 'fulfilled') {
      console.log(`• historial_envio table accessible (rows: ${enviosCount.value})`);
    } else {
      console.log('• historial_envio table warning:', enviosCount.reason?.message || enviosCount.reason);
    }

    console.log('\nAll good!');
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    if (error.code) {
      console.error(`Prisma error code: ${error.code}`);
    }
    console.error('\nMost common fixes:');
    console.error('  • Verify DATABASE_URL credentials (user, password, host, database).');
    console.error('  • Ensure the database allows connections from your IP (if hosted).');
    console.error('  • Rotate credentials if you recently regenerated passwords.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Unexpected failure:', err);
  process.exit(1);
});
