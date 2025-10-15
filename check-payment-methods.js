/**
 * Script para verificar métodos de pago disponibles en Mercado Pago
 * Ejecuta: node check-payment-methods.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n💳 Verificando Métodos de Pago Disponibles en Mercado Pago...\n');

const mpEnvironment = process.env.MP_ENVIRONMENT || 'test';
const token = mpEnvironment === 'test' 
  ? process.env.MP_ACCESS_TOKEN_TEST 
  : process.env.MP_ACCESS_TOKEN_PROD;

if (!token) {
  console.error('❌ Error: No se encontró el Access Token');
  process.exit(1);
}

console.log(`🌍 Ambiente: ${mpEnvironment}`);
console.log(`🔑 Token: ${token.substring(0, 20)}...\n`);
console.log('⏳ Consultando API de Mercado Pago...\n');

fetch('https://api.mercadopago.com/v1/payment_methods', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ Respuesta recibida exitosamente\n');
    console.log('='.repeat(70));
    console.log('📊 RESUMEN DE MÉTODOS DE PAGO DISPONIBLES');
    console.log('='.repeat(70) + '\n');

    // Agrupar por tipo de pago
    const grouped = {
      credit_card: [],
      debit_card: [],
      ticket: [],
      bank_transfer: [],
      atm: [],
      digital_currency: [],
      digital_wallet: [],
      prepaid_card: [],
      other: []
    };

    data.forEach(method => {
      const type = method.payment_type_id || 'other';
      if (grouped[type]) {
        grouped[type].push(method);
      } else {
        grouped.other.push(method);
      }
    });

    // Mostrar tarjetas de crédito
    console.log('💳 TARJETAS DE CRÉDITO:');
    if (grouped.credit_card.length > 0) {
      grouped.credit_card.forEach(method => {
        console.log(`   ✅ ${method.name} (${method.id})`);
        console.log(`      - Min: ${method.min_allowed_amount || 'N/A'}`);
        console.log(`      - Max: ${method.max_allowed_amount || 'N/A'}`);
        console.log(`      - Cuotas: ${method.settings?.[0]?.installments?.max_allowed_installments || 'N/A'}`);
      });
    } else {
      console.log('   ❌ No hay tarjetas de crédito disponibles');
    }
    console.log('');

    // Mostrar tarjetas de débito
    console.log('💳 TARJETAS DE DÉBITO:');
    if (grouped.debit_card.length > 0) {
      grouped.debit_card.forEach(method => {
        console.log(`   ✅ ${method.name} (${method.id})`);
      });
    } else {
      console.log('   ❌ No hay tarjetas de débito disponibles');
    }
    console.log('');

    // Mostrar efectivo/tickets
    console.log('🎫 EFECTIVO (Puntos de pago):');
    if (grouped.ticket.length > 0) {
      grouped.ticket.forEach(method => {
        console.log(`   ✅ ${method.name} (${method.id})`);
      });
    } else {
      console.log('   ❌ No hay pagos en efectivo disponibles');
    }
    console.log('');

    // Mostrar transferencias bancarias
    console.log('🏦 TRANSFERENCIAS BANCARIAS:');
    if (grouped.bank_transfer.length > 0) {
      grouped.bank_transfer.forEach(method => {
        console.log(`   ✅ ${method.name} (${method.id})`);
      });
    } else {
      console.log('   ❌ No hay transferencias bancarias disponibles');
    }
    console.log('');

    // Mostrar PSE
    console.log('💰 PSE (Débito Online):');
    const pseMethod = data.find(m => m.id === 'pse');
    if (pseMethod) {
      console.log(`   ✅ ${pseMethod.name} (${pseMethod.id})`);
      console.log(`      - Tipo: ${pseMethod.payment_type_id}`);
      console.log(`      - Status: ${pseMethod.status}`);
    } else {
      console.log('   ❌ PSE no está disponible');
    }
    console.log('');

    // Mostrar billeteras digitales
    console.log('📱 BILLETERAS DIGITALES:');
    if (grouped.digital_wallet.length > 0) {
      grouped.digital_wallet.forEach(method => {
        console.log(`   ✅ ${method.name} (${method.id})`);
      });
    } else {
      console.log('   ❌ No hay billeteras digitales disponibles');
    }
    console.log('');

    // Mostrar otros métodos
    if (grouped.other.length > 0) {
      console.log('🔧 OTROS MÉTODOS:');
      grouped.other.forEach(method => {
        console.log(`   ⚠️  ${method.name} (${method.id}) - Tipo: ${method.payment_type_id}`);
      });
      console.log('');
    }

    // Resumen final
    console.log('='.repeat(70));
    console.log('📈 ESTADÍSTICAS:');
    console.log('='.repeat(70));
    console.log(`Total de métodos: ${data.length}`);
    console.log(`Tarjetas de crédito: ${grouped.credit_card.length}`);
    console.log(`Tarjetas de débito: ${grouped.debit_card.length}`);
    console.log(`Efectivo/Tickets: ${grouped.ticket.length}`);
    console.log(`Transferencias: ${grouped.bank_transfer.length}`);
    console.log(`Billeteras digitales: ${grouped.digital_wallet.length}`);
    console.log(`PSE: ${pseMethod ? '1' : '0'}`);
    console.log('='.repeat(70) + '\n');

    // Métodos comunes que podrían NO estar disponibles
    console.log('🔍 VERIFICANDO MÉTODOS COMUNES DE COLOMBIA:\n');

    const commonMethods = [
      { id: 'master', name: 'Mastercard', type: 'credit_card' },
      { id: 'visa', name: 'Visa', type: 'credit_card' },
      { id: 'amex', name: 'American Express', type: 'credit_card' },
      { id: 'diners', name: 'Diners Club', type: 'credit_card' },
      { id: 'pse', name: 'PSE', type: 'bank_transfer' },
      { id: 'efecty', name: 'Efecty', type: 'ticket' },
      { id: 'baloto', name: 'Baloto', type: 'ticket' },
      { id: 'davivienda', name: 'Davivienda', type: 'ticket' },
      { id: 'nequi', name: 'Nequi', type: 'digital_wallet' },
      { id: 'daviplata', name: 'DaviPlata', type: 'digital_wallet' },
    ];

    commonMethods.forEach(common => {
      const found = data.find(m => m.id === common.id);
      if (found) {
        console.log(`✅ ${common.name.padEnd(20)} → Disponible (${found.status})`);
      } else {
        console.log(`❌ ${common.name.padEnd(20)} → NO disponible`);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log('💡 NOTAS IMPORTANTES:');
    console.log('='.repeat(70));
    console.log('• En modo TEST solo están disponibles tarjetas de crédito/débito');
    console.log('• PSE, efectivo y billeteras digitales solo funcionan en PRODUCCIÓN');
    console.log('• Para habilitar más métodos, cambia a: MP_ENVIRONMENT=production');
    console.log('• Payment Brick (tu implementación actual) soporta tarjetas automáticamente');
    console.log('='.repeat(70) + '\n');

    // Guardar resultados en archivo
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      environment: mpEnvironment,
      total_methods: data.length,
      methods: data.map(m => ({
        id: m.id,
        name: m.name,
        type: m.payment_type_id,
        status: m.status,
        min_amount: m.min_allowed_amount,
        max_amount: m.max_allowed_amount,
      })),
      summary: {
        credit_cards: grouped.credit_card.length,
        debit_cards: grouped.debit_card.length,
        cash: grouped.ticket.length,
        transfers: grouped.bank_transfer.length,
        digital_wallets: grouped.digital_wallet.length,
      }
    };

    fs.writeFileSync('payment-methods-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Reporte completo guardado en: payment-methods-report.json\n');

  })
  .catch(error => {
    console.error('❌ Error al consultar métodos de pago:', error.message);
    console.log('\n📝 Verifica:');
    console.log('   1. Tu conexión a internet');
    console.log('   2. Que el Access Token sea válido');
    console.log('   3. Que tu cuenta de Mercado Pago esté activa\n');
    process.exit(1);
  });
