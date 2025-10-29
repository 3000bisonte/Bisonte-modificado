/**
 * Tests E2E Reales - Sistema de Prevención de Duplicación de Órdenes
 * 
 * Estos tests ejecutan flujos reales en el navegador usando Playwright.
 * Utilizan tarjetas de prueba de MercadoPago en modo sandbox.
 * 
 * REQUISITOS:
 * 1. Servidor Next.js corriendo en http://localhost:3000
 * 2. Variables de entorno configuradas para modo TEST
 * 3. Usuario de prueba registrado
 */

const { test, expect } = require('@playwright/test');

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@bisontelogistica.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123456!';

// Tarjetas de prueba MercadoPago Colombia
const TARJETAS_PRUEBA = {
  // Visa - Aprobada
  VISA_APROBADA: {
    numero: '4509 9535 6623 3704',
    cvv: '123',
    vencimiento: '11/25',
    nombre: 'APRO',
    tipo: 'Visa',
    resultado: 'approved'
  },
  // Mastercard - Aprobada
  MASTERCARD_APROBADA: {
    numero: '5031 7557 3453 0604',
    cvv: '123',
    vencimiento: '11/25',
    nombre: 'APRO',
    tipo: 'Mastercard',
    resultado: 'approved'
  },
  // Visa - Rechazada
  VISA_RECHAZADA: {
    numero: '4509 9535 6623 3704',
    cvv: '123',
    vencimiento: '11/25',
    nombre: 'OXXO',
    tipo: 'Visa',
    resultado: 'rejected'
  },
  // Mastercard - Pendiente
  MASTERCARD_PENDIENTE: {
    numero: '5031 7557 3453 0604',
    cvv: '123',
    vencimiento: '11/25',
    nombre: 'CONT',
    tipo: 'Mastercard',
    resultado: 'pending'
  }
};

// Datos de envío de prueba
const DATOS_ENVIO_PRUEBA = {
  remitente: {
    nombre: 'Juan',
    apellido: 'Pérez',
    cedula: '1234567890',
    telefono: '3001234567',
    celular: '3001234567',
    email: TEST_USER_EMAIL,
    direccionRecogida: 'Calle 100 #10-20, Bogotá',
    ciudadRecogida: '11001' // Bogotá
  },
  destinatario: {
    nombre: 'María',
    apellido: 'González',
    cedula: '0987654321',
    telefono: '3107654321',
    celular: '3107654321',
    direccionEntrega: 'Carrera 15 #85-30, Bogotá',
    ciudadEntrega: '11001' // Bogotá
  },
  paquete: {
    peso: '1',
    largo: '30',
    ancho: '20',
    alto: '10',
    valorDeclarado: '50000'
  }
};

// Helper: Limpiar localStorage y sessionStorage
async function limpiarStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

// Helper: Verificar flags de protección
async function verificarFlagsProteccion(page) {
  return await page.evaluate(() => {
    return {
      envioRegistrado: localStorage.getItem('envioRegistrado'),
      origenPago: sessionStorage.getItem('origenPago'),
      pagoEnProceso: sessionStorage.getItem('pagoEnProceso'),
      ordenesCreadas: localStorage.getItem('ordenesCreadas')
    };
  });
}

// Helper: Login
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_USER_EMAIL);
  await page.fill('input[type="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

// Helper: Llenar formulario de cotización
async function llenarFormularioCotizacion(page) {
  await page.goto(`${BASE_URL}/cotizador`);
  
  // Peso y dimensiones
  await page.fill('input[name="peso"]', DATOS_ENVIO_PRUEBA.paquete.peso);
  await page.fill('input[name="largo"]', DATOS_ENVIO_PRUEBA.paquete.largo);
  await page.fill('input[name="ancho"]', DATOS_ENVIO_PRUEBA.paquete.ancho);
  await page.fill('input[name="alto"]', DATOS_ENVIO_PRUEBA.paquete.alto);
  await page.fill('input[name="valorDeclarado"]', DATOS_ENVIO_PRUEBA.paquete.valorDeclarado);
  
  // Ciudades
  await page.selectOption('select[name="ciudadOrigen"]', DATOS_ENVIO_PRUEBA.remitente.ciudadRecogida);
  await page.selectOption('select[name="ciudadDestino"]', DATOS_ENVIO_PRUEBA.destinatario.ciudadEntrega);
  
  // Cotizar
  await page.click('button:has-text("Cotizar")');
  await page.waitForTimeout(2000); // Esperar cálculo
}

// Helper: Llenar datos de remitente
async function llenarDatosRemitente(page) {
  await page.click('button:has-text("Siguiente")');
  await page.waitForTimeout(1000);
  
  await page.fill('input[name="nombre"]', DATOS_ENVIO_PRUEBA.remitente.nombre);
  await page.fill('input[name="apellido"]', DATOS_ENVIO_PRUEBA.remitente.apellido);
  await page.fill('input[name="cedula"]', DATOS_ENVIO_PRUEBA.remitente.cedula);
  await page.fill('input[name="telefono"]', DATOS_ENVIO_PRUEBA.remitente.telefono);
  await page.fill('input[name="direccionRecogida"]', DATOS_ENVIO_PRUEBA.remitente.direccionRecogida);
  
  await page.click('button:has-text("Siguiente")');
  await page.waitForTimeout(1000);
}

// Helper: Llenar datos de destinatario
async function llenarDatosDestinatario(page) {
  await page.fill('input[name="nombre"]', DATOS_ENVIO_PRUEBA.destinatario.nombre);
  await page.fill('input[name="apellido"]', DATOS_ENVIO_PRUEBA.destinatario.apellido);
  await page.fill('input[name="cedula"]', DATOS_ENVIO_PRUEBA.destinatario.cedula);
  await page.fill('input[name="telefono"]', DATOS_ENVIO_PRUEBA.destinatario.telefono);
  await page.fill('input[name="direccionEntrega"]', DATOS_ENVIO_PRUEBA.destinatario.direccionEntrega);
  
  await page.click('button:has-text("Ver Resumen")');
  await page.waitForURL(`${BASE_URL}/resumen`, { timeout: 5000 });
}

// Helper: Procesar pago con tarjeta
async function procesarPagoTarjeta(page, tarjeta) {
  console.log(`  💳 Procesando pago con ${tarjeta.tipo} (${tarjeta.resultado})...`);
  
  // Ir a página de pago
  await page.click('button:has-text("Pagar")');
  await page.waitForURL(`${BASE_URL}/mercadopago`, { timeout: 5000 });
  await page.waitForTimeout(3000); // Esperar carga del Payment Brick
  
  // Verificar que se marcó el origen como payment_brick
  const flagsInicio = await verificarFlagsProteccion(page);
  console.log(`  🛡️ Flags al iniciar pago:`, flagsInicio);
  
  // Buscar el iframe del Payment Brick
  const paymentFrame = page.frameLocator('iframe[name*="mercadopago"]').first();
  
  // Llenar datos de la tarjeta
  await paymentFrame.locator('input[name="cardNumber"]').fill(tarjeta.numero);
  await paymentFrame.locator('input[name="cardholderName"]').fill(tarjeta.nombre);
  await paymentFrame.locator('input[name="cardExpirationDate"]').fill(tarjeta.vencimiento);
  await paymentFrame.locator('input[name="securityCode"]').fill(tarjeta.cvv);
  
  // Email y documento
  await paymentFrame.locator('input[name="email"]').fill(TEST_USER_EMAIL);
  await paymentFrame.locator('select[name="identificationType"]').selectOption('CC');
  await paymentFrame.locator('input[name="identificationNumber"]').fill('12345678');
  
  // Click en pagar
  await paymentFrame.locator('button:has-text("Pagar")').click();
  
  // Esperar procesamiento
  await page.waitForTimeout(5000);
}

// ==================== TESTS ====================

test.describe('Sistema de Prevención de Duplicación de Órdenes - E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpiar storage antes de cada test
    await limpiarStorage(page);
    
    // Login
    console.log('\n🔐 Haciendo login...');
    await login(page);
  });

  test('TEST 1: Pago aprobado con tarjeta crea exactamente 1 orden', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Pago con Tarjeta Aprobada - Crear 1 orden');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Llenar formulario completo
    await llenarFormularioCotizacion(page);
    await llenarDatosRemitente(page);
    await llenarDatosDestinatario(page);
    
    // Contar órdenes antes
    await page.goto(`${BASE_URL}/misenvios`);
    const ordenesAntes = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  📊 Órdenes antes: ${ordenesAntes}`);
    
    // Volver al resumen y pagar
    await page.goto(`${BASE_URL}/resumen`);
    await procesarPagoTarjeta(page, TARJETAS_PRUEBA.VISA_APROBADA);
    
    // Esperar redirect a /misenvios
    await page.waitForURL(`${BASE_URL}/misenvios`, { timeout: 10000 });
    
    // Verificar flags de protección
    const flags = await verificarFlagsProteccion(page);
    console.log(`  🛡️ Flags después del pago:`, flags);
    
    // Contar órdenes después
    await page.waitForTimeout(2000);
    const ordenesDespues = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  📊 Órdenes después: ${ordenesDespues}`);
    
    // Verificaciones
    expect(ordenesDespues - ordenesAntes).toBe(1);
    expect(flags.envioRegistrado).toBe('true');
    expect(flags.ordenesCreadas).toContain('payment_id'); // Debe tener un paymentId registrado
    
    console.log('  ✅ TEST 1 PASÓ: Se creó exactamente 1 orden\n');
  });

  test('TEST 2: Recarga de página después de pago NO crea orden duplicada', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Recarga de Página - NO duplicar');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Llenar formulario y pagar
    await llenarFormularioCotizacion(page);
    await llenarDatosRemitente(page);
    await llenarDatosDestinatario(page);
    await procesarPagoTarjeta(page, TARJETAS_PRUEBA.MASTERCARD_APROBADA);
    
    // Esperar en /misenvios
    await page.waitForURL(`${BASE_URL}/misenvios`, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const ordenesAntes = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  📊 Órdenes antes de recargar: ${ordenesAntes}`);
    
    // Recargar la página 3 veces
    console.log('  🔄 Recargando página 3 veces...');
    await page.reload();
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForTimeout(1000);
    
    const ordenesDespues = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  📊 Órdenes después de recargar: ${ordenesDespues}`);
    
    // Verificar que NO se crearon órdenes adicionales
    expect(ordenesDespues).toBe(ordenesAntes);
    
    console.log('  ✅ TEST 2 PASÓ: NO se crearon órdenes duplicadas\n');
  });

  test('TEST 3: Pago rechazado NO crea orden', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Pago Rechazado - NO crear orden');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Llenar formulario
    await llenarFormularioCotizacion(page);
    await llenarDatosRemitente(page);
    await llenarDatosDestinatario(page);
    
    // Contar órdenes antes
    await page.goto(`${BASE_URL}/misenvios`);
    const ordenesAntes = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  📊 Órdenes antes: ${ordenesAntes}`);
    
    // Volver al resumen y pagar con tarjeta rechazada
    await page.goto(`${BASE_URL}/resumen`);
    await procesarPagoTarjeta(page, TARJETAS_PRUEBA.VISA_RECHAZADA);
    
    // Esperar modal de error
    await page.waitForSelector('text=Pago Rechazado', { timeout: 10000 });
    console.log('  ❌ Modal de pago rechazado mostrado');
    
    // Esperar redirect a /resumen
    await page.waitForURL(`${BASE_URL}/resumen`, { timeout: 10000 });
    
    // Verificar flags
    const flags = await page.evaluate(() => {
      return {
        pagoRechazado: localStorage.getItem('pagoRechazado'),
        envioRegistrado: localStorage.getItem('envioRegistrado')
      };
    });
    
    console.log(`  🛡️ Flags:`, flags);
    
    // Ir a mis envíos y verificar que NO se creó orden
    await page.goto(`${BASE_URL}/misenvios`);
    await page.waitForTimeout(2000);
    const ordenesDespues = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  📊 Órdenes después: ${ordenesDespues}`);
    
    // Verificar
    expect(ordenesDespues).toBe(ordenesAntes);
    expect(flags.pagoRechazado).toBe('true');
    expect(flags.envioRegistrado).toBeNull();
    
    console.log('  ✅ TEST 3 PASÓ: NO se creó orden con pago rechazado\n');
  });

  test('TEST 4: Múltiples órdenes consecutivas funcionan correctamente', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: Múltiples Órdenes Consecutivas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const ordenesIniciales = await page.goto(`${BASE_URL}/misenvios`).then(() =>
      page.locator('[data-testid="orden-item"]').count()
    );
    
    console.log(`  📊 Órdenes iniciales: ${ordenesIniciales}`);
    
    // Crear ORDEN 1
    console.log('\n  📦 Creando ORDEN 1...');
    await llenarFormularioCotizacion(page);
    await llenarDatosRemitente(page);
    await llenarDatosDestinatario(page);
    await procesarPagoTarjeta(page, TARJETAS_PRUEBA.VISA_APROBADA);
    await page.waitForURL(`${BASE_URL}/misenvios`, { timeout: 10000 });
    await page.waitForTimeout(3000); // Esperar limpieza de flags (2s)
    
    const despuesOrden1 = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  ✅ ORDEN 1 creada. Total: ${despuesOrden1}`);
    
    // Crear ORDEN 2
    console.log('\n  📦 Creando ORDEN 2...');
    await llenarFormularioCotizacion(page);
    await llenarDatosRemitente(page);
    await llenarDatosDestinatario(page);
    await procesarPagoTarjeta(page, TARJETAS_PRUEBA.MASTERCARD_APROBADA);
    await page.waitForURL(`${BASE_URL}/misenvios`, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const despuesOrden2 = await page.locator('[data-testid="orden-item"]').count();
    console.log(`  ✅ ORDEN 2 creada. Total: ${despuesOrden2}`);
    
    // Verificar
    expect(despuesOrden1 - ordenesIniciales).toBe(1);
    expect(despuesOrden2 - despuesOrden1).toBe(1);
    expect(despuesOrden2 - ordenesIniciales).toBe(2);
    
    console.log('  ✅ TEST 4 PASÓ: Se crearon 2 órdenes consecutivas correctamente\n');
  });
});

// Configuración de Playwright
module.exports = {
  timeout: 60000, // 1 minuto por test
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  }
};
