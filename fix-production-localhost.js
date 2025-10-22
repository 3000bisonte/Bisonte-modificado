// Solución para usar MercadoPago Producción desde localhost
console.log('🔧 Configurador especial: Producción desde localhost\n');

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

function updateForLocalProduction() {
  console.log('🚀 Configurando MercadoPago Producción para localhost...');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Mantener credenciales de producción pero ajustar URLs para localhost
    const changes = {
      // MANTENER credenciales de producción
      'MP_ENVIRONMENT': 'production',
      'MP_ACCESS_TOKEN_PROD': process.env.MP_ACCESS_TOKEN_PROD || 'APP_USR-6754222098823398-110217-97f6788cbdb2a80a682e157fab4247bd-2044503317',
      'NEXT_PUBLIC_MP_PUBLIC_KEY_PROD': process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD || 'APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d',
      
      // PERO usar la clave pública de TEST en el frontend para localhost
      'NEXT_PUBLIC_INIT_MERCADOPAGO': 'TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b',
      
      // URLs para localhost
      'NEXT_PUBLIC_SITE_URL': 'http://localhost:3000',
      'NEXT_PUBLIC_API_BASE_URL': 'http://localhost:3000/api',
      'NEXTAUTH_URL': 'http://localhost:3000',
      
      // NODE_ENV development para activar logs
      'NODE_ENV': 'development'
    };
    
    Object.entries(changes).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
        console.log(`✅ ${key}=${value}`);
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    console.log('\n📝 Configuración actualizada exitosamente');
    
    console.log('\n🎯 CONFIGURACIÓN HÍBRIDA APLICADA:');
    console.log('   • Backend: Credenciales de PRODUCCIÓN');
    console.log('   • Frontend: Clave de TEST (para generar tokens válidos)');
    console.log('   • URLs: localhost para desarrollo');
    
    console.log('\n⚠️ IMPORTANTE:');
    console.log('   • Esta configuración es SOLO para desarrollo');
    console.log('   • Los pagos NO se procesarán realmente');
    console.log('   • Para producción real, despliega en bisonteapp.com');
    
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Reinicia el servidor: Ctrl+C y npm run dev');
    console.log('   2. Recarga la página');
    console.log('   3. Prueba el flujo de pagos');
    console.log('   4. Los tokens se generarán correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateForLocalProduction();