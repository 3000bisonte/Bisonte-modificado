import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

const db = new PrismaClient();

console.log('🔍 Database Connectivity Check');
console.log('DATABASE_URL fragment:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'NOT_FOUND');

(async () => {
  try {
    console.log('🔗 Attempting database connection...');
    
    // Test basic connectivity
    const result = await db.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
    console.log('✅ Database connection successful!');
    console.log('📊 Test query result:', result);
    
    // Test if main tables exist
    try {
      const userCount = await db.usuarios.count();
      console.log(`👥 Users table accessible, count: ${userCount}`);
    } catch (e) {
      console.log('⚠️ Users table issue:', e.message.slice(0, 100));
    }
    
    try {
      const enviosCount = await db.historialEnvio.count();
      console.log(`📦 HistorialEnvio table accessible, count: ${enviosCount}`);
    } catch (e) {
      console.log('⚠️ HistorialEnvio table issue:', e.message.slice(0, 100));
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('HOST:5432')) {
      console.log('\n🚨 DIAGNOSIS: URL contains placeholder "HOST:5432"');
      console.log('   Check your .env and .env.local files for placeholder values');
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.log('\n🚨 DIAGNOSIS: Network/DNS issue');
      console.log('   - Check internet connection');
      console.log('   - Verify database host is correct');
      console.log('   - Check firewall settings');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🚨 DIAGNOSIS: Authentication issue');
      console.log('   - Verify username and password');
      console.log('   - Check if database user exists');
    }
  } finally {
    await db.$disconnect();
    console.log('🔌 Database connection closed');
  }
})();