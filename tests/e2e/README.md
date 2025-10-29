# 🧪 Tests E2E - Sistema de Prevención de Duplicación de Órdenes

## 📋 Descripción

Tests End-to-End (E2E) reales que ejecutan flujos completos de pago en un navegador real usando **Playwright**. Estos tests verifican el funcionamiento del sistema de prevención de duplicación de órdenes con interacciones reales del Payment Brick de MercadoPago.

## ✨ Características

- ✅ **Tests Reales**: Navegador real, clicks reales, formularios reales
- ✅ **Payment Brick Real**: Interacción con el componente de MercadoPago
- ✅ **Tarjetas de Prueba**: Sandbox de MercadoPago (sin cargos reales)
- ✅ **Verificación de Protecciones**: Comprueba flags de localStorage/sessionStorage
- ✅ **Screenshots y Videos**: En caso de fallos
- ✅ **Informes HTML**: Visualización de resultados

## 🧩 Tests Incluidos

### TEST 1: Pago Aprobado con Tarjeta
- ✅ Flujo completo: Cotización → Datos → Pago → Orden creada
- ✅ Verifica que se crea exactamente 1 orden
- ✅ Comprueba flags de protección (envioRegistrado, paymentId)
- ✅ Usa tarjeta Visa aprobada

### TEST 2: Recarga de Página
- ✅ Completa un pago exitoso
- ✅ Recarga la página 3 veces
- ✅ Verifica que NO se crean órdenes duplicadas
- ✅ Comprueba que el flag envioRegistrado bloquea duplicados

### TEST 3: Pago Rechazado
- ✅ Intenta pagar con tarjeta rechazada
- ✅ Verifica que NO se crea ninguna orden
- ✅ Comprueba modal de error
- ✅ Verifica flag de pagoRechazado

### TEST 4: Múltiples Órdenes Consecutivas
- ✅ Crea 2 órdenes diferentes
- ✅ Verifica que el sistema permite órdenes consecutivas
- ✅ Comprueba limpieza de flags entre órdenes
- ✅ Usa diferentes tarjetas (Visa y Mastercard)

## 🚀 Instalación

### 1. Instalar Playwright
```bash
npm install --save-dev @playwright/test playwright
```

### 2. Instalar Navegadores
```bash
npx playwright install chromium
```

### 3. Configurar Variables de Entorno
Copiar `.env.test.example` a `.env.test.local`:
```bash
cp .env.test.example .env.test.local
```

Editar `.env.test.local` con:
- Usuario de prueba
- Credenciales de MercadoPago en modo TEST

## 🎯 Ejecución

### Ejecutar Todos los Tests
```bash
npx playwright test
```

### Ejecutar en Modo Interactivo (UI)
```bash
npx playwright test --ui
```

### Ejecutar un Test Específico
```bash
npx playwright test payment-flow.spec.js
```

### Ver el Navegador (No Headless)
```bash
npx playwright test --headed
```

### Ejecutar con Debugger
```bash
npx playwright test --debug
```

### Generar Informe HTML
```bash
npx playwright show-report
```

## 📊 Resultados

Los tests generan:

1. **Informe HTML**: `playwright-report/index.html`
2. **Screenshots**: `test-results/screenshots/`
3. **Videos**: `test-results/videos/`
4. **Trazas**: `test-results/traces/` (para debugging)

## 🎭 Tarjetas de Prueba

MercadoPago Colombia - Modo Sandbox:

### ✅ Aprobadas
```
Visa:
  Número: 4509 9535 6623 3704
  CVV: 123
  Vencimiento: 11/25
  Nombre: APRO

Mastercard:
  Número: 5031 7557 3453 0604
  CVV: 123
  Vencimiento: 11/25
  Nombre: APRO
```

### ❌ Rechazadas
```
Visa:
  Número: 4509 9535 6623 3704
  CVV: 123
  Vencimiento: 11/25
  Nombre: OXXO
```

### ⏳ Pendientes
```
Mastercard:
  Número: 5031 7557 3453 0604
  CVV: 123
  Vencimiento: 11/25
  Nombre: CONT
```

## 🔧 Configuración

### playwright.config.js

```javascript
{
  // Servidor Next.js automático
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120000
  },
  
  // Modo visual (no headless)
  use: {
    headless: false,
    slowMo: 500  // 500ms entre acciones
  }
}
```

## 🛡️ Verificaciones de Protección

Cada test verifica:

1. **localStorage.envioRegistrado**: Bloquea recargas de página
2. **sessionStorage.origenPago**: Coordina Payment Brick vs PSE
3. **sessionStorage.pagoEnProceso**: Previene clics múltiples
4. **localStorage.ordenesCreadas**: Array de paymentIds procesados

## 📝 Logs del Test

Durante la ejecución verás:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Pago con Tarjeta Aprobada - Crear 1 orden
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Haciendo login...
📊 Órdenes antes: 5
💳 Procesando pago con Visa (approved)...
🛡️ Flags al iniciar pago: {
  origenPago: 'payment_brick',
  pagoEnProceso: 'true',
  timestampPago: '1736290800000'
}
🛡️ Flags después del pago: {
  envioRegistrado: 'true',
  ordenesCreadas: '[{"paymentId":"12345678","timestamp":1736290800000}]'
}
📊 Órdenes después: 6
✅ TEST 1 PASÓ: Se creó exactamente 1 orden
```

## 🚨 Troubleshooting

### El servidor no inicia
```bash
# Iniciar manualmente antes de los tests
npm run dev

# En otra terminal:
npx playwright test --headed
```

### No encuentra el Payment Brick
```bash
# Aumentar timeout de espera
# En el test, buscar:
await page.waitForTimeout(5000); // Aumentar a 10000
```

### Errores de autenticación
```bash
# Verificar usuario de prueba en .env.test.local
# Crear usuario manualmente si es necesario
```

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [MercadoPago Test Cards](https://www.mercadopago.com.co/developers/es/docs/checkout-api/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)

## 🎯 Próximos Tests

- [ ] Test de PSE (redirect externo)
- [ ] Test de Efecty
- [ ] Test de condiciones de carrera (race conditions)
- [ ] Test de timeout de pago (5 minutos)
- [ ] Test de múltiples pestañas simultáneas

---

**Nota**: Estos tests requieren que el servidor Next.js esté corriendo en `http://localhost:3000`. Playwright lo iniciará automáticamente si no está corriendo.
