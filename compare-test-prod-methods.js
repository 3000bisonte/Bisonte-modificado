/**
 * Script para comparar métodos de pago en TEST vs PRODUCCIÓN
 * Ejecuta: node compare-test-prod-methods.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Comparando Métodos de Pago: TEST vs PRODUCCIÓN\n');
console.log('='.repeat(70) + '\n');

const testToken = process.env.MP_ACCESS_TOKEN_TEST;
const prodToken = process.env.MP_ACCESS_TOKEN_PROD;

async function fetchPaymentMethods(token, environment) {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error al consultar ${environment}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('📊 Obteniendo métodos de pago...\n');

  // Obtener métodos de TEST
  console.log('🧪 Consultando ambiente TEST...');
  const testMethods = await fetchPaymentMethods(testToken, 'TEST');
  
  // Obtener métodos de PRODUCCIÓN
  console.log('🚀 Consultando ambiente PRODUCCIÓN...');
  const prodMethods = await fetchPaymentMethods(prodToken, 'PRODUCCIÓN');

  if (!testMethods || !prodMethods) {
    console.error('\n❌ No se pudieron obtener los métodos de pago');
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log('📈 COMPARACIÓN DE MÉTODOS');
  console.log('='.repeat(70) + '\n');

  // Crear mapas por ID
  const testMap = new Map(testMethods.map(m => [m.id, m]));
  const prodMap = new Map(prodMethods.map(m => [m.id, m]));

  // Encontrar métodos únicos de cada ambiente
  const onlyInTest = [...testMap.keys()].filter(id => !prodMap.has(id));
  const onlyInProd = [...prodMap.keys()].filter(id => !testMap.has(id));
  const inBoth = [...testMap.keys()].filter(id => prodMap.has(id));

  console.log('📊 ESTADÍSTICAS:\n');
  console.log(`TEST:       ${testMethods.length} métodos`);
  console.log(`PRODUCCIÓN: ${prodMethods.length} métodos`);
  console.log(`En ambos:   ${inBoth.length} métodos`);
  console.log(`Solo TEST:  ${onlyInTest.length} métodos`);
  console.log(`Solo PROD:  ${onlyInProd.length} métodos\n`);

  // Métodos disponibles en ambos
  if (inBoth.length > 0) {
    console.log('✅ DISPONIBLES EN AMBOS AMBIENTES:\n');
    inBoth.forEach(id => {
      const method = testMap.get(id);
      console.log(`   • ${method.name.padEnd(30)} (${id}) - ${method.payment_type_id}`);
    });
    console.log('');
  }

  // Métodos solo en TEST
  if (onlyInTest.length > 0) {
    console.log('🧪 SOLO EN TEST:\n');
    onlyInTest.forEach(id => {
      const method = testMap.get(id);
      console.log(`   • ${method.name.padEnd(30)} (${id}) - ${method.payment_type_id}`);
    });
    console.log('');
  }

  // Métodos solo en PRODUCCIÓN (LOS MÁS IMPORTANTES)
  if (onlyInProd.length > 0) {
    console.log('🚀 NUEVOS MÉTODOS DISPONIBLES EN PRODUCCIÓN:\n');
    onlyInProd.forEach(id => {
      const method = prodMap.get(id);
      const icon = method.payment_type_id === 'digital_wallet' ? '📱' 
                 : method.payment_type_id === 'ticket' ? '🎫'
                 : method.payment_type_id === 'bank_transfer' ? '🏦' : '💳';
      console.log(`   ${icon} ${method.name.padEnd(30)} (${id}) - ${method.payment_type_id}`);
    });
    console.log('');
  }

  // Agrupar métodos de PRODUCCIÓN por tipo
  const prodGrouped = {
    credit_card: [],
    debit_card: [],
    ticket: [],
    bank_transfer: [],
    digital_wallet: [],
    prepaid_card: [],
    other: []
  };

  prodMethods.forEach(method => {
    const type = method.payment_type_id || 'other';
    if (prodGrouped[type]) {
      prodGrouped[type].push(method);
    } else {
      prodGrouped.other.push(method);
    }
  });

  console.log('='.repeat(70));
  console.log('🚀 DETALLE DE MÉTODOS EN PRODUCCIÓN');
  console.log('='.repeat(70) + '\n');

  // Billeteras digitales en producción
  console.log('📱 BILLETERAS DIGITALES EN PRODUCCIÓN:\n');
  if (prodGrouped.digital_wallet.length > 0) {
    prodGrouped.digital_wallet.forEach(method => {
      console.log(`   ✅ ${method.name} (${method.id})`);
      console.log(`      Status: ${method.status}`);
      console.log(`      Min: ${method.min_allowed_amount || 'N/A'}`);
      console.log(`      Max: ${method.max_allowed_amount || 'N/A'}`);
    });
  } else {
    console.log('   ❌ No hay billeteras digitales disponibles');
    console.log('   💡 Para habilitar Nequi, DaviPlata, contacta a Mercado Pago');
  }
  console.log('');

  // Efectivo en producción
  console.log('🎫 EFECTIVO/TICKETS EN PRODUCCIÓN:\n');
  if (prodGrouped.ticket.length > 0) {
    prodGrouped.ticket.forEach(method => {
      console.log(`   ✅ ${method.name} (${method.id})`);
      console.log(`      Status: ${method.status}`);
    });
  } else {
    console.log('   ❌ No hay métodos de efectivo disponibles');
  }
  console.log('');

  // Transferencias en producción
  console.log('🏦 TRANSFERENCIAS BANCARIAS EN PRODUCCIÓN:\n');
  if (prodGrouped.bank_transfer.length > 0) {
    prodGrouped.bank_transfer.forEach(method => {
      console.log(`   ✅ ${method.name} (${method.id})`);
      console.log(`      Status: ${method.status}`);
    });
  } else {
    console.log('   ❌ No hay transferencias bancarias disponibles');
  }
  console.log('');

  // Verificar métodos específicos que el usuario quiere
  console.log('='.repeat(70));
  console.log('🔍 VERIFICANDO MÉTODOS ESPECÍFICOS SOLICITADOS');
  console.log('='.repeat(70) + '\n');

  const requestedMethods = [
    { id: 'nequi', name: 'Nequi', type: 'Billetera Digital' },
    { id: 'daviplata', name: 'DaviPlata', type: 'Billetera Digital' },
    { id: 'baloto', name: 'Baloto', type: 'Efectivo' },
    { id: 'via_baloto', name: 'Vía Baloto', type: 'Efectivo' },
    { id: 'su_red', name: 'Su Red', type: 'Efectivo' },
    { id: 'puntored', name: 'PuntoRed', type: 'Efectivo' },
  ];

  requestedMethods.forEach(requested => {
    const inTest = testMap.has(requested.id);
    const inProd = prodMap.has(requested.id);
    
    if (inProd) {
      const method = prodMap.get(requested.id);
      console.log(`✅ ${requested.name.padEnd(20)} → DISPONIBLE en PRODUCCIÓN (${method.status})`);
    } else if (inTest) {
      console.log(`⚠️  ${requested.name.padEnd(20)} → Solo en TEST (no funciona en producción)`);
    } else {
      console.log(`❌ ${requested.name.padEnd(20)} → NO DISPONIBLE en ningún ambiente`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('💡 CONCLUSIONES Y RECOMENDACIONES');
  console.log('='.repeat(70) + '\n');

  const hasProdWallets = prodGrouped.digital_wallet.length > 0;
  const hasProdTickets = prodGrouped.ticket.length > 0;

  if (!hasProdWallets) {
    console.log('❌ BILLETERAS DIGITALES NO DISPONIBLES\n');
    console.log('   Para habilitar Nequi, DaviPlata u otras billeteras:');
    console.log('   1. Contacta a Mercado Pago Colombia');
    console.log('   2. Solicita activación de billeteras digitales');
    console.log('   3. Puede requerir acuerdo comercial adicional');
    console.log('   4. Proceso puede tardar 1-2 semanas\n');
    console.log('   📞 Contacto: https://www.mercadopago.com.co/ayuda/contacto\n');
  }

  if (hasProdTickets) {
    console.log('✅ EFECTIVO DISPONIBLE\n');
    console.log(`   Tienes ${prodGrouped.ticket.length} métodos de pago en efectivo habilitados`);
    console.log('   Estos funcionan en modo PRODUCCIÓN\n');
  }

  // Guardar reporte comparativo
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    test: {
      total: testMethods.length,
      methods: testMethods.map(m => ({ id: m.id, name: m.name, type: m.payment_type_id })),
    },
    production: {
      total: prodMethods.length,
      methods: prodMethods.map(m => ({ id: m.id, name: m.name, type: m.payment_type_id })),
    },
    comparison: {
      in_both: inBoth,
      only_test: onlyInTest,
      only_prod: onlyInProd,
    },
    digital_wallets_available: hasProdWallets,
    requested_methods_status: requestedMethods.map(r => ({
      ...r,
      available_test: testMap.has(r.id),
      available_prod: prodMap.has(r.id),
    })),
  };

  fs.writeFileSync('test-vs-prod-comparison.json', JSON.stringify(report, null, 2));
  console.log('📄 Reporte comparativo guardado en: test-vs-prod-comparison.json\n');
}

main().catch(console.error);
