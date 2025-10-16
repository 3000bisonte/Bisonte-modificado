require('dotenv').config({ path: '.env.local' });

const accessToken = process.env.MP_ACCESS_TOKEN_TEST;

console.log('\n🔍 VERIFICANDO PSE EN MERCADO PAGO...\n');

fetch('https://api.mercadopago.com/v1/payment_methods', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(response => response.json())
.then(data => {
  const pse = data.find(method => method.id === 'pse');
  
  console.log('═══════════════════════════════════════════════');
  console.log('            ESTADO DE PSE');
  console.log('═══════════════════════════════════════════════\n');
  
  if (pse) {
    console.log('✅ PSE ESTÁ DISPONIBLE en tu cuenta de Mercado Pago\n');
    console.log('📊 DETALLES:\n');
    console.log(`   ID: ${pse.id}`);
    console.log(`   Nombre: ${pse.name}`);
    console.log(`   Estado: ${pse.status}`);
    console.log(`   Tipo de pago: ${pse.payment_type_id}`);
    console.log(`   Monto mínimo: $${pse.min_allowed_amount?.toLocaleString('es-CO') || 'N/A'}`);
    console.log(`   Monto máximo: $${pse.max_allowed_amount?.toLocaleString('es-CO') || 'N/A'}`);
    console.log(`   Tiempo de acreditación: ${pse.accreditation_time || 'N/A'} minutos`);
    
    console.log('\n⚠️  IMPORTANTE:\n');
    console.log('   • PSE solo funciona en modo PRODUCCIÓN');
    console.log('   • En modo TEST no procesa pagos reales');
    console.log('   • El usuario verá la opción pero debe usar tarjetas de prueba');
    
    console.log('\n📝 PARA USAR PSE EN PRODUCCIÓN:\n');
    console.log('   1. Cambiar MP_ENVIRONMENT=production en .env.local');
    console.log('   2. Usar MP_ACCESS_TOKEN_PROD en lugar de TEST');
    console.log('   3. Verificar que tu cuenta MP esté certificada para PSE');
    
  } else {
    console.log('❌ PSE NO ESTÁ DISPONIBLE\n');
    console.log('📝 POSIBLES RAZONES:\n');
    console.log('   • Tu cuenta de Mercado Pago no tiene PSE habilitado');
    console.log('   • Necesitas contactar a Mercado Pago para activarlo');
    console.log('   • Requieres certificación adicional para medios de pago bancarios');
    
    console.log('\n💼 CÓMO SOLICITAR PSE:\n');
    console.log('   1. Ingresa a tu cuenta de Mercado Pago');
    console.log('   2. Ve a Configuración → Medios de pago');
    console.log('   3. Solicita activación de PSE');
    console.log('   4. Completa el proceso de certificación');
    console.log('\n   Contacto MP: https://www.mercadopago.com.co/ayuda/');
  }
  
  console.log('\n═══════════════════════════════════════════════\n');
  
  // Mostrar TODOS los métodos disponibles
  console.log('📋 TODOS LOS MÉTODOS DE PAGO DISPONIBLES:\n');
  
  const grouped = {
    credit_card: [],
    debit_card: [],
    bank_transfer: [],
    ticket: [],
    digital_wallet: [],
    otros: []
  };
  
  data.forEach(method => {
    if (method.payment_type_id === 'credit_card') {
      grouped.credit_card.push(method);
    } else if (method.payment_type_id === 'debit_card') {
      grouped.debit_card.push(method);
    } else if (method.payment_type_id === 'bank_transfer') {
      grouped.bank_transfer.push(method);
    } else if (method.payment_type_id === 'ticket') {
      grouped.ticket.push(method);
    } else if (method.payment_type_id === 'digital_wallet') {
      grouped.digital_wallet.push(method);
    } else {
      grouped.otros.push(method);
    }
  });
  
  console.log(`💳 Tarjetas de Crédito (${grouped.credit_card.length}):`);
  grouped.credit_card.forEach(m => console.log(`   ✅ ${m.name} (${m.id})`));
  
  console.log(`\n💳 Tarjetas de Débito (${grouped.debit_card.length}):`);
  grouped.debit_card.forEach(m => console.log(`   ✅ ${m.name} (${m.id})`));
  
  console.log(`\n🏦 Transferencias Bancarias (${grouped.bank_transfer.length}):`);
  if (grouped.bank_transfer.length > 0) {
    grouped.bank_transfer.forEach(m => console.log(`   ✅ ${m.name} (${m.id})`));
  } else {
    console.log(`   ❌ Ninguna disponible`);
  }
  
  console.log(`\n🎫 Pago en Efectivo (${grouped.ticket.length}):`);
  if (grouped.ticket.length > 0) {
    grouped.ticket.forEach(m => console.log(`   ✅ ${m.name} (${m.id})`));
  } else {
    console.log(`   ❌ Ninguna disponible`);
  }
  
  console.log(`\n📱 Billeteras Digitales (${grouped.digital_wallet.length}):`);
  if (grouped.digital_wallet.length > 0) {
    grouped.digital_wallet.forEach(m => console.log(`   ✅ ${m.name} (${m.id})`));
  } else {
    console.log(`   ❌ Ninguna disponible (Nequi, DaviPlata requieren activación)`);
  }
  
  console.log(`\n📊 TOTAL: ${data.length} métodos de pago disponibles\n`);
})
.catch(error => {
  console.error('❌ Error al consultar Mercado Pago:', error.message);
  console.error('\n📝 Verifica que tu Access Token sea válido en .env.local');
});
