# 📊 Análisis Completo del Flujo de Pago - MercadoPago

**Fecha:** ${new Date().toISOString().split('T')[0]}  
**Estado:** ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

---

## 🔍 1. CONFIGURACIÓN ACTUAL

### ✅ Variables de Entorno (.env.local)
```bash
MP_ENVIRONMENT=production
MP_ACCESS_TOKEN_PROD=APP_USR-6754222098823398-110217-97f6788cbdb2a80a682e157fab4247bd-2044503317
NEXT_PUBLIC_MP_PUBLIC_KEY_PROD=APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d
```

**Estado:** ✅ Credenciales de producción configuradas correctamente

### ✅ Back URLs Configuradas
```typescript
// src/app/api/mercadopago/route.ts (líneas 68-76)
back_urls: {
  success: `${origin}/pagos/mercadopago/success`,
  failure: `${origin}/pagos/mercadopago/failure`,
  pending: `${origin}/pagos/mercadopago/pending`,
},
auto_return: "approved"
```

**Estado:** ✅ URLs de retorno correctamente configuradas

---

## 🔄 2. FLUJOS DE PAGO IDENTIFICADOS

### A. Flujo Payment Brick (Tarjetas, crédito/débito)
```
Usuario completa formulario
  ↓
MercadoPago.js crea preferencia
  ↓
Payment Brick procesa pago
  ↓
onSubmit recibe resultado
  ↓
si status === "approved":
  manejarEnvioAprobado() ← CREA ORDEN AQUÍ
  ↓
Redirect a /misenvios
```

**Archivo:** `src/components/MercadoPago.js`
**Creación de orden:** Línea 505-655 (`manejarEnvioAprobado`)
**Trigger:** Línea 691 (useEffect cuando status === "approved")

### B. Flujo PSE / Efecty (Pagos externos con redirect)
```
Usuario completa formulario
  ↓
MercadoPago.js crea preferencia
  ↓
Payment Brick redirige a banco/PSE
  ↓
Usuario completa pago en sitio externo
  ↓
MercadoPago redirige a /pagos/mercadopago/success
  ↓
success/page.js detecta llegada
  ↓
crearEnvio() ← CREA ORDEN AQUÍ
  ↓
Redirect a /misenvios
```

**Archivo:** `src/app/pagos/mercadopago/success/page.js`
**Creación de orden:** Línea 32-150 (`crearEnvio`)
**Trigger:** Línea 186 (useEffect al montar componente)

---

## 🚨 3. PROBLEMAS CRÍTICOS IDENTIFICADOS

### ❌ Problema 1: DUPLICACIÓN DE ÓRDENES (CRÍTICO)

**Descripción:**  
Existen **DOS puntos de creación de órdenes** que pueden ejecutarse para el mismo pago:

1. **MercadoPago.js** (línea 691): 
   ```javascript
   if (status === "approved") {
     void manejarEnvioAprobado(); // ← CREA ORDEN
   }
   ```

2. **success/page.js** (línea 32):
   ```javascript
   const crearEnvio = async () => {
     // ← CREA ORDEN
   }
   ```

**Escenario de duplicación:**
```
1. Usuario paga con tarjeta
2. Payment Brick aprueba → status = "approved"
3. MercadoPago.js ejecuta manejarEnvioAprobado() → ORDEN #1 CREADA
4. Browser intenta redirect a /success (puede fallar por timing)
5. Si redirect funciona, success/page.js crea ORDEN #2
   RESULTADO: 2 ÓRDENES CON MISMO PAGO
```

**Evidencia:**
- **MercadoPago.js** línea 505: No verifica si ya existe orden con ese `paymentId`
- **success/page.js** línea 23: Solo verifica flag `envioRegistrado` pero no `paymentId`
- Ambos usan `localStorage.getItem("envioRegistrado")` pero pueden ejecutarse en paralelo

### ❌ Problema 2: DETECCIÓN DE REDIRECT EXTERNO INCORRECTA

**Código problemático (MercadoPago.js línea 700):**
```javascript
const vinoDesdeRedirect = window.location.pathname.includes("/pagos/mercadopago");
if (vinoDesdeRedirect) {
  console.log("🔄 Usuario vino desde redirect. La página /success manejará el registro.");
  return; // ← NO EJECUTA EN PAYMENT BRICK
}
```

**Problema:**  
Este código está en `MercadoPago.js` que se renderiza en `/pago`, NO en `/pagos/mercadopago/success`. Por lo tanto:
- `window.location.pathname` será `/pago`
- La condición NUNCA será verdadera
- **El código NO previene ejecución en redirects externos**

### ❌ Problema 3: LIMPIEZA DE localStorage INCOMPLETA

**En éxito (MercadoPago.js línea 648-651):**
```javascript
localStorage.removeItem("formCotizador");
localStorage.removeItem("cotizacion");
localStorage.removeItem("formRemitente");
localStorage.removeItem("formDestinatario");
```

**Problema:** NO limpia:
- `envioRegistrado` (queda permanentemente)
- `pagoEnProceso` (no existe actualmente)
- `pagoPendiente` / `pagoRechazado` (pueden quedar de intentos anteriores)

**En error:** NO hay limpieza, datos quedan en localStorage indefinidamente

### ❌ Problema 4: RACE CONDITION EN TARJETAS

**Flujo problemático:**
```
Payment Brick aprueba pago
  ↓ (casi simultáneo)
  ├─ MercadoPago.js setStatus("approved") → useEffect → crea orden
  └─ Payment Brick redirect a /success → success/page.js → crea orden

RESULTADO: Ambos ejecutan en paralelo, flag envioRegistrado 
          se setea en ambos pero DESPUÉS de iniciar creación
```

**Timing crítico:**
1. `status` cambia a "approved" (t=0ms)
2. `useEffect` detecta cambio (t=10ms)
3. `manejarEnvioAprobado()` inicia (t=20ms)
4. `localStorage.setItem("envioRegistrado")` ejecuta DENTRO de manejarEnvioAprobado (t=100ms)
5. Redirect a /success puede ocurrir en t=50ms
6. `success/page.js` verifica flag en t=60ms → aún no está seteado
7. **AMBOS crean órdenes**

---

## ✅ 4. PROTECCIONES ACTUALES

### Protección #1: Flag `envioRegistrado`
```javascript
// MercadoPago.js línea 508
const envioYaRegistrado = localStorage.getItem("envioRegistrado");
if (envioYaRegistrado === "true") {
  console.log("⚠️ Envío ya registrado previamente...");
  return;
}

// success/page.js línea 23
const envioYaRegistrado = localStorage.getItem("envioRegistrado");
if (envioYaRegistrado === "true") {
  console.log("⚠️ Envío ya registrado previamente...");
  return;
}
```

**Efectividad:** 🟡 Parcial
- ✅ Previene re-creación si usuario recarga página
- ❌ NO previene ejecución paralela (race condition)
- ❌ NO se limpia nunca (queda permanente)

### Protección #2: Verificación de redirect (DEFECTUOSA)
```javascript
// MercadoPago.js línea 700
const vinoDesdeRedirect = window.location.pathname.includes("/pagos/mercadopago");
if (vinoDesdeRedirect) {
  return; // ← NUNCA SE EJECUTA (pathname es /pago)
}
```

**Efectividad:** ❌ Inefectiva
- La condición nunca es verdadera en el contexto actual

---

## 🎯 5. SOLUCIÓN PROPUESTA

### Estrategia de Prevención de Duplicados

**Principio:** Usar `sessionStorage` + `paymentId` único para coordinar creación

#### Modificación 1: onSubmit en MercadoPago.js

```javascript
// ANTES de llamar brickController.getFormData()
const onSubmit = async () => {
  return new Promise((resolve, reject) => {
    // 🛡️ PROTECCIÓN: Marcar que un pago está en proceso
    sessionStorage.setItem("pagoEnProceso", "true");
    sessionStorage.setItem("timestampPago", Date.now().toString());
    
    brickController
      .getFormData()
      .then((formData) => {
        const isPSE = formData.payment_method_id === 'pse';
        const isEfecty = formData.payment_method_id === 'efecty';
        
        // 🏦 Para métodos externos, NO crear orden aquí
        if (isPSE || isEfecty) {
          console.log("🏦 Pago externo - success/page.js manejará creación");
          sessionStorage.setItem("origenPago", "redirect_externo");
          // El redirect ocurrirá automáticamente
          return;
        }
        
        // Para tarjetas, marcar origen
        sessionStorage.setItem("origenPago", "payment_brick");
        
        // ... resto del código existente
      });
  });
};
```

#### Modificación 2: manejarEnvioAprobado en MercadoPago.js

```javascript
const manejarEnvioAprobado = useCallback(async () => {
  // 🛡️ PROTECCIÓN 1: Verificar flag de envío registrado
  const envioYaRegistrado = localStorage.getItem("envioRegistrado");
  if (envioYaRegistrado === "true") {
    console.log("⚠️ Envío ya registrado previamente.");
    return;
  }

  // 🛡️ PROTECCIÓN 2: Solo ejecutar si el pago se inició desde Payment Brick
  const origenPago = sessionStorage.getItem("origenPago");
  if (origenPago === "redirect_externo") {
    console.log("🏦 Pago externo - success/page.js lo manejará");
    return;
  }

  // 🛡️ PROTECCIÓN 3: Verificar que paymentId no esté duplicado
  if (paymentId) {
    const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
    const ordenes = JSON.parse(ordenesExistentes);
    if (ordenes.includes(paymentId)) {
      console.log("⚠️ Orden con este paymentId ya existe");
      return;
    }
  }

  // ✅ PROCEDER con creación
  try {
    // ... código existente de creación ...
    
    // Después de creación exitosa:
    localStorage.setItem("envioRegistrado", "true");
    
    // Registrar paymentId para evitar duplicados
    if (paymentId) {
      const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
      const ordenes = JSON.parse(ordenesExistentes);
      ordenes.push(paymentId);
      localStorage.setItem("ordenesCreadas", JSON.stringify(ordenes));
    }
    
    // Limpiar flags de proceso
    sessionStorage.removeItem("pagoEnProceso");
    sessionStorage.removeItem("origenPago");
    
  } catch (error) {
    console.error("Error:", error);
    sessionStorage.removeItem("pagoEnProceso");
  }
}, [paymentId, ...]);
```

#### Modificación 3: useEffect en MercadoPago.js

```javascript
useEffect(() => {
  console.log("🔍 Estado del pago actualizado:", status);
  
  // 🛡️ PROTECCIÓN: No procesar si el envío ya fue registrado
  const envioYaRegistrado = localStorage.getItem("envioRegistrado");
  if (envioYaRegistrado === "true") {
    console.log("⚠️ Envío ya registrado.");
    return;
  }

  // 🛡️ PROTECCIÓN: Solo ejecutar para Payment Brick
  const origenPago = sessionStorage.getItem("origenPago");
  if (origenPago === "redirect_externo") {
    console.log("🏦 Pago externo - saltando ejecución");
    return;
  }
  
  // ✅ SOLO registrar envío cuando el pago es APROBADO
  if (status === "approved") {
    console.log(`✅ Pago APROBADO - Registrando envío`);
    void manejarEnvioAprobado();
  }
  // ... resto del código existente para pending/rejected ...
}, [status, manejarEnvioAprobado]);
```

#### Modificación 4: crearEnvio en success/page.js

```javascript
const crearEnvio = async () => {
  console.log("✅ [Success Page] Usuario llegó desde pago exitoso");
  
  // 🛡️ PROTECCIÓN 1: Verificar flag de envío registrado
  const envioYaRegistrado = localStorage.getItem("envioRegistrado");
  if (envioYaRegistrado === "true") {
    console.log("⚠️ Envío ya registrado. Redirigiendo...");
    router.replace("/misenvios");
    return;
  }

  // 🛡️ PROTECCIÓN 2: Verificar origen del pago
  const origenPago = sessionStorage.getItem("origenPago");
  if (origenPago === "payment_brick") {
    console.log("💳 Pago de Payment Brick ya manejado. Redirigiendo...");
    router.replace("/misenvios");
    return;
  }

  // 🛡️ PROTECCIÓN 3: Verificar paymentId duplicado
  const paymentId = searchParams.get("payment_id");
  if (paymentId) {
    const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
    const ordenes = JSON.parse(ordenesExistentes);
    if (ordenes.includes(paymentId)) {
      console.log("⚠️ Orden con este paymentId ya existe");
      router.replace("/misenvios");
      return;
    }
  }

  try {
    // ... código existente de creación ...
    
    // Después de creación exitosa:
    localStorage.setItem("envioRegistrado", "true");
    
    // Registrar paymentId
    if (paymentId) {
      const ordenesExistentes = localStorage.getItem("ordenesCreadas") || "[]";
      const ordenes = JSON.parse(ordenesExistentes);
      ordenes.push(paymentId);
      localStorage.setItem("ordenesCreadas", JSON.stringify(ordenes));
    }
    
    // Limpiar flags
    sessionStorage.removeItem("pagoEnProceso");
    sessionStorage.removeItem("origenPago");
    
    // ... redirect a /misenvios ...
  } catch (error) {
    console.error("Error:", error);
    sessionStorage.removeItem("pagoEnProceso");
  }
};
```

#### Modificación 5: Limpieza en nueva sesión de pago

**Agregar al inicio de MercadoPago.js (useEffect inicial):**

```javascript
useEffect(() => {
  // Limpiar flags cuando el usuario vuelve a /pago para un nuevo envío
  const limpiarFlagsAnteriores = () => {
    // Solo limpiar si pasaron más de 5 minutos del último pago
    const timestampPago = sessionStorage.getItem("timestampPago");
    if (timestampPago) {
      const tiempoTranscurrido = Date.now() - parseInt(timestampPago);
      const CINCO_MINUTOS = 5 * 60 * 1000;
      
      if (tiempoTranscurrido > CINCO_MINUTOS) {
        console.log("🧹 Limpiando flags de pago anterior (>5 min)");
        localStorage.removeItem("envioRegistrado");
        sessionStorage.removeItem("pagoEnProceso");
        sessionStorage.removeItem("origenPago");
        sessionStorage.removeItem("timestampPago");
      }
    }
  };
  
  limpiarFlagsAnteriores();
}, []);
```

---

## 📋 6. PLAN DE TESTING

### Test 1: Pago con Tarjeta (Payment Brick)
**Objetivo:** Verificar que se crea UNA sola orden

**Pasos:**
1. Ir a `/pago`
2. Completar formulario
3. Usar tarjeta de prueba MercadoPago
4. Verificar en consola: `origenPago = "payment_brick"`
5. Verificar creación de orden en `MercadoPago.js`
6. Verificar que `success/page.js` NO crea orden
7. Confirmar redirect a `/misenvios`
8. Verificar en DB que existe UNA sola orden

**Resultado esperado:** ✅ 1 orden creada

### Test 2: Pago con PSE (Redirect externo)
**Objetivo:** Verificar que solo `success/page.js` crea orden

**Pasos:**
1. Ir a `/pago`
2. Completar formulario
3. Seleccionar PSE
4. Verificar en consola: `origenPago = "redirect_externo"`
5. Confirmar redirect a banco de prueba
6. Completar pago en banco
7. Verificar redirect a `/pagos/mercadopago/success`
8. Verificar que `MercadoPago.js` NO ejecuta
9. Verificar que `success/page.js` crea orden
10. Confirmar redirect a `/misenvios`

**Resultado esperado:** ✅ 1 orden creada

### Test 3: Pago Rechazado
**Objetivo:** Verificar que NO se crea orden

**Pasos:**
1. Usar tarjeta rechazada de prueba
2. Verificar modal de error
3. Verificar redirect a `/resumen`
4. Confirmar que NO existe orden en DB

**Resultado esperado:** ✅ 0 órdenes creadas

### Test 4: Duplicación Intencional
**Objetivo:** Intentar forzar duplicación

**Pasos:**
1. Pagar con tarjeta
2. Inmediatamente después de aprobar, abrir DevTools
3. Ejecutar manualmente: `window.location.href = '/pagos/mercadopago/success?payment_id=TEST123&status=approved'`
4. Verificar que `success/page.js` detecta duplicado
5. Confirmar que solo existe 1 orden en DB

**Resultado esperado:** ✅ 1 orden creada (duplicado bloqueado)

---

## 🎯 7. CRITERIOS DE ÉXITO

- ✅ Cada pago crea EXACTAMENTE 1 orden
- ✅ PSE/externos solo crean en `success/page.js`
- ✅ Tarjetas solo crean en `MercadoPago.js`
- ✅ Pagos rechazados NO crean órdenes
- ✅ `localStorage` se limpia después de éxito
- ✅ Flags de sesión se limpian correctamente
- ✅ No hay race conditions
- ✅ Deep linking funciona correctamente

---

## 📝 8. PRÓXIMOS PASOS

1. ✅ Revisión completa del flujo (COMPLETADO)
2. ⏳ Implementar correcciones propuestas
3. ⏳ Testing exhaustivo con todos los métodos
4. ⏳ Validar en ambiente de staging
5. ⏳ Deploy a producción
6. ⏳ Monitoreo post-deploy

---

## 🔗 REFERENCIAS

**Archivos clave:**
- `src/components/MercadoPago.js` (981 líneas)
- `src/app/pagos/mercadopago/success/page.js` (230 líneas)
- `src/app/api/mercadopago/route.ts` (219 líneas)
- `.env.local` (configuración MP)

**Documentación MercadoPago:**
- [Payment Brick](https://www.mercadopago.com.co/developers/es/docs/checkout-bricks/payment-brick)
- [PSE en Colombia](https://www.mercadopago.com.co/developers/es/docs/checkout-api/integration-configuration/pse)
- [Webhooks](https://www.mercadopago.com.co/developers/es/docs/checkout-api/webhooks)
