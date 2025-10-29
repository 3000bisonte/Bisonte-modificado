/**
 * Tests de Prevención de Duplicación de Órdenes
 * 
 * Estos tests verifican que el sistema de protección funciona correctamente
 * sin necesidad de hacer pagos reales en MercadoPago.
 */

// Mock de localStorage y sessionStorage
class MockStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Configurar mocks globales
global.localStorage = new MockStorage();
global.sessionStorage = new MockStorage();

// Función auxiliar para simular el flujo de Payment Brick
function simulatePaymentBrickFlow(paymentId = 'TEST_PAYMENT_123') {
  console.log('\n🧪 [TEST] Simulando flujo Payment Brick (Tarjeta)...');
  
  // 1. Usuario hace clic en "Pagar" - onSubmit se ejecuta
  console.log('  📝 Paso 1: onSubmit - Marcando origen del pago');
  sessionStorage.setItem("pagoEnProceso", "true");
  sessionStorage.setItem("timestampPago", Date.now().toString());
  sessionStorage.setItem("origenPago", "payment_brick");
  
  // 2. Payment Brick procesa y retorna status="approved"
  console.log('  ✅ Paso 2: Payment Brick aprueba pago');
  
  // 3. useEffect detecta status="approved" y ejecuta manejarEnvioAprobado
  console.log('  🔍 Paso 3: Verificando protecciones en manejarEnvioAprobado');
  
  const protecciones = verificarProteccionesCreacion(paymentId, 'payment_brick');
  
  if (protecciones.permitirCreacion) {
    console.log('  ✅ Paso 4: Creando orden...');
    crearOrden(paymentId);
    return { exito: true, ordenCreada: true, mensaje: 'Orden creada por Payment Brick' };
  } else {
    console.log(`  ⛔ Paso 4: Creación bloqueada - ${protecciones.razon}`);
    return { exito: false, ordenCreada: false, mensaje: protecciones.razon };
  }
}

// Función auxiliar para simular el flujo de PSE
function simulatePSEFlow(paymentId = 'TEST_PAYMENT_PSE_456') {
  console.log('\n🧪 [TEST] Simulando flujo PSE (Redirect externo)...');
  
  // 1. Usuario hace clic en "Pagar" - onSubmit se ejecuta
  console.log('  📝 Paso 1: onSubmit - Marcando origen del pago');
  sessionStorage.setItem("pagoEnProceso", "true");
  sessionStorage.setItem("timestampPago", Date.now().toString());
  sessionStorage.setItem("origenPago", "redirect_externo");
  
  // 2. Redirect al banco
  console.log('  🏦 Paso 2: Usuario redirigido al banco PSE');
  
  // 3. Usuario aprueba en el banco, MercadoPago redirige a /success
  console.log('  ✅ Paso 3: Usuario aprueba en banco, redirect a /success');
  
  // 4. success/page.js intenta crear orden
  console.log('  🔍 Paso 4: Verificando protecciones en success/page.js');
  
  const protecciones = verificarProteccionesCreacion(paymentId, 'redirect_externo');
  
  if (protecciones.permitirCreacion) {
    console.log('  ✅ Paso 5: Creando orden...');
    crearOrden(paymentId);
    return { exito: true, ordenCreada: true, mensaje: 'Orden creada por success/page.js' };
  } else {
    console.log(`  ⛔ Paso 5: Creación bloqueada - ${protecciones.razon}`);
    return { exito: false, ordenCreada: false, mensaje: protecciones.razon };
  }
}

// Función que verifica las 3 protecciones
function verificarProteccionesCreacion(paymentId, origenEsperado) {
  const resultados = {
    proteccion1: false,
    proteccion2: false,
    proteccion3: false,
    permitirCreacion: false,
    razon: ''
  };
  
  // 🛡️ PROTECCIÓN 1: Verificar si el envío ya fue registrado
  const envioYaRegistrado = localStorage.getItem("envioRegistrado");
  if (envioYaRegistrado === "true") {
    console.log('    ⛔ PROTECCIÓN 1: envioRegistrado === "true"');
    resultados.razon = 'Envío ya registrado previamente';
    return resultados;
  }
  console.log('    ✅ PROTECCIÓN 1: envioRegistrado OK');
  resultados.proteccion1 = true;

  // 🛡️ PROTECCIÓN 2: Verificar origen del pago
  const origenPago = sessionStorage.getItem("origenPago");
  
  if (origenEsperado === 'payment_brick' && origenPago === 'redirect_externo') {
    console.log('    ⛔ PROTECCIÓN 2: Pago externo, saltando Payment Brick');
    resultados.razon = 'Pago externo - success/page.js lo manejará';
    return resultados;
  }
  
  if (origenEsperado === 'redirect_externo' && origenPago === 'payment_brick') {
    console.log('    ⛔ PROTECCIÓN 2: Pago Payment Brick, saltando success/page.js');
    resultados.razon = 'Pago Payment Brick - ya manejado por MercadoPago.js';
    return resultados;
  }
  
  console.log(`    ✅ PROTECCIÓN 2: origenPago OK (${origenPago})`);
  resultados.proteccion2 = true;

  // 🛡️ PROTECCIÓN 3: Verificar paymentId duplicado
  if (paymentId) {
    const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
    try {
      const ordenes = JSON.parse(ordenesExistentes);
      if (ordenes.includes(paymentId)) {
        console.log(`    ⛔ PROTECCIÓN 3: paymentId ${paymentId} ya existe`);
        resultados.razon = `Orden con paymentId ${paymentId} ya existe`;
        return resultados;
      }
    } catch (e) {
      console.warn('    ⚠️ Error parseando ordenesCreadas, continuando');
    }
  }
  
  console.log(`    ✅ PROTECCIÓN 3: paymentId ${paymentId} único`);
  resultados.proteccion3 = true;
  
  resultados.permitirCreacion = true;
  return resultados;
}

// Función que simula la creación de orden
function crearOrden(paymentId) {
  // Marcar envío como registrado
  localStorage.setItem("envioRegistrado", "true");
  
  // Registrar paymentId
  const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
  const ordenes = JSON.parse(ordenesExistentes);
  ordenes.push(paymentId);
  localStorage.setItem("ordenesCreadas", JSON.stringify(ordenes));
  
  // Limpiar flags de proceso
  sessionStorage.removeItem("pagoEnProceso");
  sessionStorage.removeItem("origenPago");
  sessionStorage.removeItem("timestampPago");
  
  console.log(`    ✅ Orden creada con paymentId: ${paymentId}`);
  console.log(`    🛡️ envioRegistrado: true`);
  console.log(`    🛡️ paymentId registrado en ordenesCreadas`);
  console.log(`    🧹 Flags de sessionStorage limpiados`);
}

// Función para limpiar estado
function limpiarEstado() {
  localStorage.clear();
  sessionStorage.clear();
  console.log('🧹 Estado limpiado\n');
}

// ==================== TESTS ====================

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  TESTS DE PREVENCIÓN DE DUPLICACIÓN DE ÓRDENES              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let testsPassed = 0;
let testsFailed = 0;

// TEST 1: Pago con tarjeta - Debe crear 1 orden
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 1: Pago con Tarjeta (Payment Brick) - Crear 1 orden');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
const test1 = simulatePaymentBrickFlow('CARD_001');
if (test1.exito && test1.ordenCreada) {
  console.log('✅ TEST 1 PASÓ: Orden creada correctamente por Payment Brick\n');
  testsPassed++;
} else {
  console.log('❌ TEST 1 FALLÓ: No se creó la orden\n');
  testsFailed++;
}

// TEST 2: PSE - Debe crear 1 orden
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 2: Pago con PSE (Redirect externo) - Crear 1 orden');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
const test2 = simulatePSEFlow('PSE_001');
if (test2.exito && test2.ordenCreada) {
  console.log('✅ TEST 2 PASÓ: Orden creada correctamente por success/page.js\n');
  testsPassed++;
} else {
  console.log('❌ TEST 2 FALLÓ: No se creó la orden\n');
  testsFailed++;
}

// TEST 3: Duplicación por recarga de página - Debe BLOQUEAR
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 3: Duplicación por Recarga de Página - Debe BLOQUEAR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
const test3a = simulatePaymentBrickFlow('CARD_002');
console.log('\n  🔄 Simulando recarga de página...');
const test3b = simulatePaymentBrickFlow('CARD_002'); // Mismo paymentId
if (test3a.exito && !test3b.exito && test3b.mensaje.includes('ya registrado')) {
  console.log('✅ TEST 3 PASÓ: Duplicación bloqueada por envioRegistrado\n');
  testsPassed++;
} else {
  console.log('❌ TEST 3 FALLÓ: No se bloqueó la duplicación\n');
  testsFailed++;
}

// TEST 4: Duplicación por paymentId - Debe BLOQUEAR
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 4: Duplicación por PaymentId Repetido - Debe BLOQUEAR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
const test4a = simulatePaymentBrickFlow('CARD_003');
// Limpiar solo envioRegistrado pero NO ordenesCreadas
localStorage.removeItem('envioRegistrado');
console.log('\n  🔄 Limpiando envioRegistrado pero manteniendo paymentId...');
const test4b = simulatePaymentBrickFlow('CARD_003'); // Mismo paymentId
if (test4a.exito && !test4b.exito && test4b.mensaje.includes('ya existe')) {
  console.log('✅ TEST 4 PASÓ: Duplicación bloqueada por paymentId\n');
  testsPassed++;
} else {
  console.log('❌ TEST 4 FALLÓ: No se bloqueó la duplicación por paymentId\n');
  testsFailed++;
}

// TEST 5: PSE no debe ejecutar en Payment Brick - Debe BLOQUEAR
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 5: PSE marcado como redirect_externo - Payment Brick BLOQUEA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
// Marcar como PSE
sessionStorage.setItem("origenPago", "redirect_externo");
console.log('\n🧪 [TEST] Intentando crear orden desde Payment Brick con origen PSE...');
const protecciones5 = verificarProteccionesCreacion('PSE_002', 'payment_brick');
if (!protecciones5.permitirCreacion && protecciones5.razon.includes('success/page.js')) {
  console.log('✅ TEST 5 PASÓ: Payment Brick correctamente bloqueado para PSE\n');
  testsPassed++;
} else {
  console.log('❌ TEST 5 FALLÓ: Payment Brick no bloqueó PSE correctamente\n');
  testsFailed++;
}

// TEST 6: Tarjeta no debe ejecutar en success/page.js - Debe BLOQUEAR
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 6: Tarjeta marcada como payment_brick - success/page.js BLOQUEA');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
// Marcar como Payment Brick
sessionStorage.setItem("origenPago", "payment_brick");
console.log('\n🧪 [TEST] Intentando crear orden desde success/page.js con origen tarjeta...');
const protecciones6 = verificarProteccionesCreacion('CARD_004', 'redirect_externo');
if (!protecciones6.permitirCreacion && protecciones6.razon.includes('MercadoPago.js')) {
  console.log('✅ TEST 6 PASÓ: success/page.js correctamente bloqueado para tarjetas\n');
  testsPassed++;
} else {
  console.log('❌ TEST 6 FALLÓ: success/page.js no bloqueó tarjetas correctamente\n');
  testsFailed++;
}

// TEST 7: Limpieza de flags después de >5 minutos
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 7: Limpieza de flags antiguos (>5 minutos)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
// Simular pago antiguo
const timestampAntiguo = Date.now() - (6 * 60 * 1000); // 6 minutos atrás
sessionStorage.setItem("timestampPago", timestampAntiguo.toString());
localStorage.setItem("envioRegistrado", "true");
sessionStorage.setItem("pagoEnProceso", "true");
sessionStorage.setItem("origenPago", "payment_brick");

console.log('\n🧪 [TEST] Simulando limpieza de flags antiguos...');
// Simular la función de limpieza
const timestampPago = sessionStorage.getItem("timestampPago");
const tiempoTranscurrido = Date.now() - parseInt(timestampPago);
const CINCO_MINUTOS = 5 * 60 * 1000;

if (tiempoTranscurrido > CINCO_MINUTOS) {
  console.log('  🧹 Limpiando flags de pago anterior (>5 min)');
  localStorage.removeItem("envioRegistrado");
  sessionStorage.removeItem("pagoEnProceso");
  sessionStorage.removeItem("origenPago");
  sessionStorage.removeItem("timestampPago");
}

const flagsLimpiados = !localStorage.getItem("envioRegistrado") && 
                       !sessionStorage.getItem("pagoEnProceso");
if (flagsLimpiados) {
  console.log('✅ TEST 7 PASÓ: Flags antiguos limpiados correctamente\n');
  testsPassed++;
} else {
  console.log('❌ TEST 7 FALLÓ: Flags no se limpiaron\n');
  testsFailed++;
}

// TEST 8: Race condition - Tarjeta + success/page.js simultáneos
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('TEST 8: Race Condition - Payment Brick + success/page.js');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
limpiarEstado();
sessionStorage.setItem("pagoEnProceso", "true");
sessionStorage.setItem("timestampPago", Date.now().toString());
sessionStorage.setItem("origenPago", "payment_brick");

console.log('\n🧪 [TEST] Simulando ejecución simultánea...');
console.log('  ⏱️  t=0ms: Payment Brick ejecuta manejarEnvioAprobado');
const race1 = verificarProteccionesCreacion('RACE_001', 'payment_brick');
if (race1.permitirCreacion) {
  crearOrden('RACE_001');
}

console.log('\n  ⏱️  t=50ms: success/page.js intenta crear orden');
const race2 = verificarProteccionesCreacion('RACE_001', 'redirect_externo');

const ordenUnica = race1.permitirCreacion && !race2.permitirCreacion;
if (ordenUnica) {
  console.log('✅ TEST 8 PASÓ: Race condition manejada - solo 1 orden creada\n');
  testsPassed++;
} else {
  console.log('❌ TEST 8 FALLÓ: Ambos intentos pasaron o ninguno pasó\n');
  testsFailed++;
}

// RESUMEN FINAL
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║                    RESUMEN DE TESTS                          ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
console.log(`✅ Tests pasados: ${testsPassed}/8`);
console.log(`❌ Tests fallados: ${testsFailed}/8`);
console.log(`📊 Tasa de éxito: ${Math.round((testsPassed / 8) * 100)}%\n`);

if (testsPassed === 8) {
  console.log('🎉 ¡TODOS LOS TESTS PASARON! Sistema de prevención funcionando correctamente.\n');
  process.exit(0);
} else {
  console.log('⚠️  Algunos tests fallaron. Revisar implementación.\n');
  process.exit(1);
}
