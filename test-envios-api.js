/**
 * Script de prueba para verificar que la API de envíos funcione correctamente
 * Uso: node test-envios-api.js <email>
 */

const email = process.argv[2] || '3000bisonte@gmail.com';

console.log('🧪 Probando API de Envíos...');
console.log('📧 Email:', email);
console.log('');

async function testEnviosAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/envios/historial?email=${encodeURIComponent(email)}`;
  
  console.log('🌐 URL:', url);
  console.log('');
  
  try {
    console.log('⏳ Consultando API...');
    const response = await fetch(url);
    
    console.log('📊 Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('');
    console.log('✅ Respuesta exitosa!');
    console.log('📦 Total de envíos:', data.length);
    console.log('');
    
    if (data.length > 0) {
      console.log('📋 Detalles de los envíos:');
      console.log('─'.repeat(80));
      data.forEach((envio, index) => {
        console.log(`\n${index + 1}. ${envio.NumeroGuia}`);
        console.log(`   Estado: ${envio.Estado}`);
        console.log(`   Origen: ${envio.Origen}`);
        console.log(`   Destino: ${envio.Destino}`);
        console.log(`   Destinatario: ${envio.Destinatario}`);
        console.log(`   Fecha: ${envio.FechaSolicitud}`);
      });
      console.log('─'.repeat(80));
    } else {
      console.log('ℹ️  No hay envíos registrados para este usuario');
      console.log('💡 Crea un envío desde la app para verlo aquí');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Asegúrate de que:');
    console.error('   1. El servidor esté corriendo (npm run dev)');
    console.error('   2. La base de datos esté configurada');
    console.error('   3. El email sea correcto');
  }
}

testEnviosAPI();
