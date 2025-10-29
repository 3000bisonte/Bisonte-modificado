# 🧪 GUÍA COMPLETA: TESTS E2E REALES

## 📖 Resumen

Has implementado un sistema completo de prevención de duplicación de órdenes. Ahora tienes **tests E2E reales** que verifican su funcionamiento usando:

- ✅ **Playwright**: Automatización de navegador REAL
- ✅ **Payment Brick de MercadoPago**: Componente REAL
- ✅ **Tarjetas de prueba**: Modo Sandbox (SIN cargos reales)
- ✅ **Verificación de protecciones**: Comprueba flags en el navegador

---

## 🎯 PASO 1: Preparación (SOLO UNA VEZ)

### 1.1. Crear Usuario de Prueba

**IMPORTANTE**: Antes de ejecutar los tests, necesitas crear un usuario de prueba:

1. Inicia tu aplicación: `npm run dev`
2. Ve a: http://localhost:3000/register
3. Crea un usuario con estos datos:
   - Email: `test@bisontelogistica.com`
   - Contraseña: `Test123456!`
   - Completa el registro

### 1.2. Verificar `.env.test.local`

Ya está creado con:
```bash
TEST_USER_EMAIL=test@bisontelogistica.com
TEST_USER_PASSWORD=Test123456!
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-... (credenciales de prueba)
```

### 1.3. Navegadores de Playwright

Ya instalados ✅

---

## 🚀 PASO 2: Ejecutar los Tests

### Opción A: Ejecutar con Script (RECOMENDADO)

```bash
.\run-tests-e2e.bat
```

Este script:
1. Verifica configuración
2. Inicia Playwright
3. Abre un navegador REAL (modo headed)
4. Ejecuta los 4 tests
5. Genera informe HTML

### Opción B: Comando Manual

```bash
npx playwright test --headed
```

### Opción C: Modo Interactivo (UI)

```bash
npx playwright test --ui
```

Esto abre una interfaz gráfica donde puedes:
- Ver cada test
- Ejecutarlos uno por uno
- Ver screenshots en tiempo real
- Debuggear paso a paso

---

## 📊 PASO 3: Ver los Resultados

### Durante la Ejecución

Verás en la terminal:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Pago con Tarjeta Aprobada - Crear 1 orden
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Haciendo login...
📊 Órdenes antes: 5
💳 Procesando pago con Visa (approved)...
🛡️ Flags al iniciar pago: {
  origenPago: 'payment_brick',
  pagoEnProceso: 'true'
}
📊 Órdenes después: 6
✅ TEST 1 PASÓ: Se creó exactamente 1 orden
```

### Informe HTML

```bash
npx playwright show-report
```

Abre un navegador con:
- ✅ Tests pasados/fallidos
- 📸 Screenshots
- 🎥 Videos (solo en fallos)
- 📝 Logs detallados

---

## 🎭 TESTS INCLUIDOS

### ✅ TEST 1: Pago Aprobado con Tarjeta
**Qué verifica:**
- Flujo completo de pago funciona
- Se crea exactamente 1 orden
- Flags de protección se setean correctamente
- `envioRegistrado = true`
- `ordenesCreadas` contiene el paymentId

**Tarjeta usada:** Visa aprobada (4509 9535 6623 3704)

---

### ✅ TEST 2: Recarga de Página NO Duplica
**Qué verifica:**
- Después de pago exitoso, recarga página 3 veces
- NO se crean órdenes duplicadas
- Flag `envioRegistrado` bloquea duplicados

**Tarjeta usada:** Mastercard aprobada (5031 7557 3453 0604)

---

### ✅ TEST 3: Pago Rechazado NO Crea Orden
**Qué verifica:**
- Tarjeta rechazada muestra modal de error
- NO se crea ninguna orden
- Flag `pagoRechazado = true`
- Redirect a /resumen

**Tarjeta usada:** Visa rechazada (nombre: OXXO)

---

### ✅ TEST 4: Múltiples Órdenes Consecutivas
**Qué verifica:**
- Sistema permite crear 2 órdenes diferentes
- Flags se limpian correctamente entre órdenes
- Cada orden es independiente

**Tarjetas usadas:** Visa + Mastercard aprobadas

---

## 🛡️ Protecciones Verificadas

Cada test comprueba las protecciones implementadas:

| Protección | Propósito | Dónde se verifica |
|-----------|-----------|-------------------|
| `localStorage.envioRegistrado` | Bloquea recargas de página | TEST 2 |
| `sessionStorage.origenPago` | Coordina Payment Brick vs PSE | TEST 1 |
| `sessionStorage.pagoEnProceso` | Previene clics múltiples | TEST 1 |
| `localStorage.ordenesCreadas` | Array de paymentIds | TEST 1, 4 |
| Limpieza automática (2s) | Permite nuevas órdenes | TEST 4 |

---

## 🎥 Qué Verás en el Navegador

Al ejecutar los tests verás:

1. **Login automático**
   - Se abre http://localhost:3000/login
   - Se llena email y contraseña
   - Click en "Iniciar Sesión"

2. **Cotizador**
   - Se llenan peso, dimensiones, ciudades
   - Click en "Cotizar"

3. **Formulario de envío**
   - Datos de remitente
   - Datos de destinatario
   - Click en "Ver Resumen"

4. **Payment Brick**
   - Aparece el formulario de pago de MercadoPago
   - Se llena automáticamente la tarjeta
   - Click en "Pagar"
   - Procesamiento...
   - ✅ Redirect a /misenvios

5. **Verificación**
   - Cuenta las órdenes creadas
   - Comprueba flags en DevTools

---

## 🔧 Troubleshooting

### ❌ Error: "Usuario no encontrado"

**Solución:** Crea el usuario de prueba (ver PASO 1.1)

### ❌ Error: "Timeout waiting for Payment Brick"

**Solución:** 
1. Verifica que `.env.test.local` tenga las credenciales TEST correctas
2. Aumenta el timeout en `payment-flow.spec.js` línea 170:
   ```javascript
   await page.waitForTimeout(5000); // Cambiar a 10000
   ```

### ❌ Error: "Port 3000 already in use"

**Solución:** 
- Detén el servidor Next.js si está corriendo
- O cambia el puerto en `playwright.config.js`

### ❌ Tests fallan aleatoriamente

**Solución:**
1. Ejecuta en modo NO headless: `npx playwright test --headed`
2. Activa slow motion en `playwright.config.js`:
   ```javascript
   slowMo: 1000 // 1 segundo entre acciones
   ```

---

## 📈 Interpretación de Resultados

### ✅ TODOS LOS TESTS PASAN (4/4)

**Significa:**
- Sistema de prevención funciona correctamente
- NO hay duplicación de órdenes
- Flags se setean y limpian correctamente
- Flujo de pago completo funciona

### ❌ ALGUNOS TESTS FALLAN

**Revisa:**
1. Screenshots en `test-results/screenshots/`
2. Videos en `test-results/videos/`
3. Logs en la consola

---

## 🎯 Comandos Útiles

```bash
# Ver todos los tests sin ejecutar
npx playwright test --list

# Ejecutar solo TEST 1
npx playwright test -g "Pago aprobado con tarjeta"

# Ejecutar en modo debug (pausa en cada paso)
npx playwright test --debug

# Generar código de test grabando acciones
npx playwright codegen http://localhost:3000

# Ver informe de última ejecución
npx playwright show-report
```

---

## 📚 Archivos Creados

```
tests/
└── e2e/
    ├── payment-flow.spec.js     ← Tests E2E
    └── README.md                ← Documentación técnica

playwright.config.js             ← Configuración de Playwright
.env.test.local                  ← Variables de entorno TEST
.env.test.example               ← Plantilla
run-tests-e2e.bat               ← Script de ejecución
GUIA_TESTS_E2E.md               ← Esta guía
```

---

## 🎉 Próximos Pasos

1. ✅ **Ejecuta los tests ahora:** `.\run-tests-e2e.bat`
2. ✅ **Verifica que pasen:** Deberías ver 4/4 tests ✅
3. ✅ **Revisa el informe HTML:** `npx playwright show-report`
4. ✅ **Integra en CI/CD:** GitHub Actions, GitLab CI, etc.

---

## 💡 Tips

- **Modo headed** (`--headed`): Te permite VER el navegador ejecutando los tests
- **Slow motion** (`slowMo: 500`): Ralentiza las acciones para verlas mejor
- **UI mode** (`--ui`): Interfaz gráfica para debuggear tests
- **Debug mode** (`--debug`): Pausa en cada paso

---

## 🆘 Soporte

Si los tests fallan:

1. Lee el error en la consola
2. Revisa el screenshot del fallo
3. Verifica que el usuario de prueba existe
4. Comprueba que las credenciales TEST estén en `.env.test.local`
5. Ejecuta en modo debug: `npx playwright test --debug`

---

**¡Ahora tienes tests E2E REALES que verifican que NO se crean órdenes duplicadas!** 🎉
