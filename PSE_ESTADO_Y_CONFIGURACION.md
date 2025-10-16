# 🏦 PSE - Estado y Configuración en Bisonte App

**Fecha de verificación:** Octubre 16, 2025  
**Estado:** ✅ **PSE ESTÁ ACTIVO** en tu cuenta de Mercado Pago

---

## ✅ RESUMEN EJECUTIVO

**PSE SÍ ESTÁ DISPONIBLE** en tu cuenta de Mercado Pago y **NO necesitas solicitar activación**.

### 📊 Detalles de PSE:

| Aspecto | Valor |
|---------|-------|
| **Estado** | ✅ Activo (`active`) |
| **ID** | `pse` |
| **Tipo** | Transferencia Bancaria (`bank_transfer`) |
| **Monto Mínimo** | $1.600 COP |
| **Monto Máximo** | $340.000.000 COP |
| **Tiempo Acreditación** | 30 minutos |

---

## ⚠️ IMPORTANTE: Modo TEST vs PRODUCCIÓN

### 🧪 **Modo TEST (Actual)**

```env
MP_ENVIRONMENT=test
MP_ACCESS_TOKEN_TEST=TEST-6754222098823398-...
```

**Estado de PSE en TEST:**
- ✅ PSE aparece como opción en Payment Brick
- ❌ **NO procesa pagos reales**
- ❌ Solo acepta tarjetas de prueba
- 🎯 Ideal para desarrollo y testing

**Qué pasa cuando usuario selecciona PSE en TEST:**
```
1. Payment Brick muestra PSE como opción
2. Usuario hace clic en PSE
3. Se redirige a página de simulación de banco
4. Transacción se marca como "aprobada" automáticamente
5. NO se debita dinero real
```

### 🚀 **Modo PRODUCCIÓN**

```env
MP_ENVIRONMENT=production
MP_ACCESS_TOKEN_PROD=APP-XXXXXXXXX... (tu token de producción)
```

**Estado de PSE en PRODUCCIÓN:**
- ✅ PSE funciona completamente
- ✅ Procesa pagos REALES
- ✅ Conecta con bancos reales (Bancolombia, Davivienda, etc.)
- ✅ Cobra comisiones de Mercado Pago
- ✅ Acreditación en ~30 minutos

**Flujo real de PSE en producción:**
```
1. Usuario selecciona PSE en Payment Brick
2. Selecciona su banco (Bancolombia, Davivienda, BBVA, etc.)
3. Se redirige a página del banco
4. Ingresa sus credenciales bancarias
5. Confirma el pago
6. Banco procesa y notifica a Mercado Pago
7. Mercado Pago notifica a tu app (webhook)
8. Pago acreditado en ~30 minutos
```

---

## 🎯 TU IMPLEMENTACIÓN ACTUAL

### ✅ **Payment Brick** incluye PSE automáticamente

Tu componente `MercadoPago.js` usa **Payment Brick**, que incluye PSE de forma nativa:

```javascript
// src/components/MercadoPago.js
const initialization = {
  amount: parseFloat(amount),
  // Payment Brick automáticamente muestra PSE si:
  // 1. Está disponible en tu cuenta MP (✅ SI)
  // 2. El monto está dentro del rango permitido (✅ $1.600 - $340.000.000)
  // 3. El usuario está en Colombia (✅ detecta automáticamente)
};

const customization = {
  paymentMethods: {
    // Si no especificas nada, muestra TODOS los métodos disponibles
    // Incluye: Tarjetas + PSE + Efecty
  }
};
```

### 🔍 **Cómo se ve PSE en Payment Brick**

```
┌─────────────────────────────────────┐
│  💳 Tarjeta de crédito/débito      │
│  🏦 PSE - Transferencia bancaria   │ ← Aparece aquí
│  🎫 Efecty - Pago en efectivo      │
└─────────────────────────────────────┘
```

Cuando usuario selecciona PSE:
```
1. Se expande selector de bancos
2. Usuario elige su banco (Bancolombia, Davivienda, etc.)
3. Payment Brick genera el payment_method_id = "pse"
4. Tu backend recibe el token y procesa con MP API
```

---

## 🔄 CAMBIAR A PRODUCCIÓN PARA USAR PSE

### Paso 1: Obtener credenciales de PRODUCCIÓN

1. Ingresa a: https://www.mercadopago.com.co/developers/panel
2. Ve a "Tus integraciones"
3. Selecciona tu aplicación
4. Copia las credenciales de **PRODUCCIÓN**:
   - Access Token (APP-XXXXXXXXX...)
   - Public Key (APP-XXXXXXXXX...)

### Paso 2: Actualizar `.env.local`

```env
# Cambiar de TEST a PRODUCTION
MP_ENVIRONMENT=production

# Reemplazar tokens TEST por PROD
MP_ACCESS_TOKEN_PROD=APP-XXXXXXXXX...  # Tu token real
NEXT_PUBLIC_MP_PUBLIC_KEY_PROD=APP-XXXXXXXXX...  # Tu public key real

# Asegúrate de tener ambos (TEST y PROD) para poder cambiar fácilmente
MP_ACCESS_TOKEN_TEST=TEST-6754222098823398-...
NEXT_PUBLIC_MP_PUBLIC_KEY_TEST=TEST-213842d0-...
```

### Paso 3: Actualizar tu código para usar ambiente dinámico

Tu código ya debería estar usando:

```javascript
// src/app/api/mercadopago/process-payment/route.ts
const accessToken = process.env.MP_ENVIRONMENT === 'production'
  ? process.env.MP_ACCESS_TOKEN_PROD
  : process.env.MP_ACCESS_TOKEN_TEST;

// src/components/MercadoPago.js
const publicKey = process.env.NEXT_PUBLIC_MP_ENVIRONMENT === 'production'
  ? process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD
  : process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_TEST;
```

### Paso 4: Reiniciar servidor

```powershell
# Detener servidor (Ctrl+C)
# Reiniciar
npm run dev
```

### Paso 5: Probar PSE

1. Crear envío
2. Llegar a pago
3. Seleccionar PSE
4. Probar con cuenta bancaria real

---

## 📊 COMPARACIÓN: ¿Cuándo usar cada modo?

| Situación | Modo a usar | PSE funciona | Cobro real |
|-----------|-------------|--------------|------------|
| **Desarrollo local** | TEST | ❌ Solo simulación | No |
| **Testing en staging** | TEST | ❌ Solo simulación | No |
| **Demo para cliente** | TEST | ❌ Solo simulación | No |
| **Producción en Vercel** | PRODUCTION | ✅ Completamente | **SÍ** |
| **Testing de integración** | TEST | ❌ Solo simulación | No |

---

## 🎯 RECOMENDACIÓN FINAL

### Para TU caso específico:

**SI QUIERES QUE LOS USUARIOS PAGUEN CON PSE:**

1. ✅ **PSE ya está activo** - No necesitas contactar a Mercado Pago
2. ⚠️ **Debes cambiar a modo PRODUCCIÓN**
3. 🔧 **Obtén tus credenciales de producción**
4. 🚀 **Deploy con MP_ENVIRONMENT=production**

**SI QUIERES SEGUIR EN MODO PRUEBA (TEST):**

- PSE aparecerá pero solo simulará pagos
- No se cobrarán transacciones reales
- Útil para desarrollo y testing

---

## ❓ PREGUNTAS FRECUENTES

### ¿PSE cobra comisiones adicionales?

Sí, Mercado Pago cobra una comisión por transacción PSE:
- **Comisión**: ~4% + IVA (verificar con MP)
- **Tiempo de acreditación**: 30 minutos
- **La comisión la absorbe el vendedor (tú)**

### ¿Los usuarios ven el costo de PSE?

No, Payment Brick muestra PSE como opción gratuita para el usuario. Las comisiones las pagas tú a Mercado Pago.

### ¿Puedo desactivar PSE?

Sí, puedes filtrar métodos de pago en Payment Brick:

```javascript
const customization = {
  paymentMethods: {
    excluded_payment_types: [
      { id: 'bank_transfer' } // Desactiva PSE
    ]
  }
};
```

### ¿PSE es seguro?

✅ Sí, completamente seguro:
- No guardas datos bancarios del usuario
- El usuario paga directo en página del banco
- Mercado Pago maneja toda la seguridad
- Certificado PCI-DSS

---

## 📝 RESUMEN EJECUTIVO

| Pregunta | Respuesta |
|----------|-----------|
| **¿PSE está activo?** | ✅ SÍ |
| **¿Necesito activarlo?** | ❌ NO |
| **¿Funciona en TEST?** | ⚠️ Solo simulación |
| **¿Funciona en PRODUCCIÓN?** | ✅ SÍ, completamente |
| **¿Qué debo hacer?** | Cambiar a modo PRODUCCIÓN cuando estés listo |

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **PSE verificado y activo**
2. ⏳ **Pendiente:** Cambiar a modo PRODUCCIÓN
3. ⏳ **Pendiente:** Obtener credenciales PROD de Mercado Pago
4. ⏳ **Pendiente:** Testing con banco real

---

**Documentado por:** Sistema de Auditoría Bisonte  
**Archivo de verificación:** `verificar-pse.js`  
**Última actualización:** Octubre 16, 2025
