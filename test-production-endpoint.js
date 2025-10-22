// Test endpoint de producción
console.log('🧪 Probando endpoint en modo producción...');

fetch('http://localhost:3000/api/mercadopago/process-payment')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Respuesta del endpoint:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.environment === 'production') {
      console.log('🎉 El sistema está ejecutándose en modo PRODUCCIÓN');
    } else {
      console.log('⚠️ El sistema NO está en modo producción:', data.environment);
    }
  })
  .catch(error => {
    console.log('❌ Error al conectar con el endpoint:', error.message);
    console.log('   Asegúrate de que el servidor esté ejecutándose en localhost:3000');
  });