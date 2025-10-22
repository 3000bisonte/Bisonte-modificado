# 🏦 SOLUCIÓN: Error con PSE en MercadoPago

## 🔍 Problema Identificado

Cuando intentas pagar con PSE y seleccionas un banco, obtienes un error. Esto sucede porque **PSE requiere datos adicionales específicos** que el Payment Brick debe enviar.

---

## ✅ Solución Implementada

He actualizado el código para:

### 1. **Endpoint `/api/mercadopago/process-payment/route.ts`**

Ahora detecta automáticamente cuando el método de pago es PSE y agrega los campos obligatorios:

```typescript
// 🏦 PSE requiere campos adicionales específicos
if (paymentData.payment_method_id === 'pse') {
  console.log('🏦 Detectado pago PSE - Agregando campos adicionales...');
  
  paymentPayload.transaction_details = {
    financial_institution: financial_institution_code, // Código del banco
  };
  
  paymentPayload.callback_url = callback_url; // URL de retorno
  paymentPayload.payer.entity_type = 'individual'; // O 'association'
}
```

### 2. **Componente `MercadoPago.js`**

Agregué logs detallados para ver exactamente qué datos envía Payment Brick:

```javascript
console.log("📋 Datos del formulario (completos):", JSON.stringify(formData, null, 2));
console.log("📋 Resumen:", {
  isPSE: formData.payment_method_id === 'pse',
  hasFinancialInstitution: !!formData.transaction_details?.financial_institution,
});
```

---

## 🧪 Cómo Probar la Solución

### Paso 1: Reiniciar el Servidor

```bash
# Detener el servidor actual (Ctrl+C)
# Reiniciar
npm run dev
```

### Paso 2: Intentar un Pago con PSE

1. Ve a tu app de pagos
2. Selecciona **PSE** como método de pago
3. Elige cualquier banco de la lista
4. Completa los datos requeridos
5. Presiona "Pagar"

### Paso 3: Revisar los Logs en la Consola

Deberías ver algo como esto:

```
💳 Procesando pago con Payment Brick...
📋 Datos del formulario (completos): {
  "payment_method_id": "pse",
  "transaction_details": {
    "financial_institution": "1022"  // ← Código del banco
  },
  "payer": {
    "email": "user@example.com",
    "entity_type": "individual"
  },
  ...
}
🏦 Detectado pago PSE - Agregando campos adicionales...
🏦 Datos PSE agregados: {
  financial_institution: "1022",
  callback_url: "https://www.bisonteapp.com/mercadopago/statusbrick",
  entity_type: "individual"
}
```

---

## 🐛 Si Aún Ves Errores

### Error: "financial_institution is required"

**Causa:** Payment Brick no está enviando el código del banco

**Solución:**
```javascript
// En MercadoPago.js, verifica que initialization incluya:
initialization: {
  amount: montoTotal,
  payer: {
    email: email,
    entity_type: 'individual', // O 'association' para empresas
  }
}
```

### Error: "callback_url is required"

**Causa:** No se está enviando la URL de retorno para PSE

**Solución:** Ya implementada en `route.ts` (línea ~163):
```typescript
paymentPayload.callback_url = `${process.env.NEXTAUTH_URL}/mercadopago/statusbrick`;
```

Verifica que `NEXTAUTH_URL` esté configurada en `.env.local`:
```bash
NEXTAUTH_URL=https://www.bisonteapp.com
```

### Error: "entity_type is required"

**Causa:** PSE necesita saber si es persona natural o jurídica

**Solución:** Ya implementada. El endpoint ahora incluye:
```typescript
(paymentPayload.payer as Record<string, unknown>).entity_type = 
  payerData.entity_type || 'individual';
```

---

## 📋 Datos Requeridos por PSE

| Campo | Descripción | Valor | Obligatorio |
|-------|-------------|-------|-------------|
| `payment_method_id` | Método de pago | `"pse"` | ✅ Sí |
| `transaction_details.financial_institution` | Código del banco | Ej: `"1022"` (Bancolombia) | ✅ Sí |
| `payer.email` | Email del pagador | Email válido | ✅ Sí |
| `payer.entity_type` | Tipo de entidad | `"individual"` o `"association"` | ✅ Sí |
| `payer.identification` | Identificación | `{ type: "CC", number: "123456" }` | ✅ Sí |
| `callback_url` | URL de retorno | `https://...` | ✅ Sí |
| `transaction_amount` | Monto | Número > 0 | ✅ Sí |

---

## 🏦 Códigos de Bancos PSE (Referencia)

| Banco | Código |
|-------|--------|
| Bancolombia | 1022 |
| Banco de Bogotá | 1001 |
| Davivienda | 1051 |
| BBVA Colombia | 1013 |
| Banco Popular | 1002 |
| Banco de Occidente | 1023 |
| AV Villas | 1052 |
| Banco Agrario | 1040 |

---

## 🔧 Configuración Actual

### Variables de Entorno (.env.local)

```bash
# MercadoPago - Producción
MP_ENVIRONMENT=production
MP_ACCESS_TOKEN_PROD=APP_USR-6754222098823398-110217-***
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d

# URL Base
NEXTAUTH_URL=https://www.bisonteapp.com
```

### Endpoint de Callback

PSE redirige al usuario después del pago a:
```
https://www.bisonteapp.com/mercadopago/statusbrick
```

Esta página ya existe en `src/app/mercadopago/statusbrick/page.js`

---

## 📊 Flujo Completo de Pago PSE

```
1. Usuario selecciona PSE
   ↓
2. Payment Brick muestra lista de bancos
   ↓
3. Usuario elige banco (ej: Bancolombia)
   ↓
4. Payment Brick genera formData con:
   - payment_method_id: "pse"
   - transaction_details.financial_institution: "1022"
   - payer.entity_type: "individual"
   ↓
5. onSubmit envía datos a /api/mercadopago/process-payment
   ↓
6. Endpoint detecta PSE y agrega campos obligatorios
   ↓
7. Se envía a MercadoPago API
   ↓
8. MercadoPago redirige al banco
   ↓
9. Usuario completa pago en el banco
   ↓
10. Banco redirige a callback_url
   ↓
11. StatusBrick muestra resultado
```

---

## ✅ Checklist de Verificación

- [x] Endpoint actualizado con soporte PSE
- [x] Logs agregados para debugging
- [x] callback_url configurado
- [x] NEXTAUTH_URL en .env.local
- [x] StatusBrick page existe
- [ ] Probar pago PSE en desarrollo
- [ ] Verificar logs en consola
- [ ] Probar pago PSE en producción

---

## 🚀 Próximos Pasos

1. **Reinicia el servidor:** `npm run dev`
2. **Intenta un pago PSE**
3. **Revisa los logs** en la consola del navegador
4. **Si ves errores**, copia el mensaje completo y revisa esta guía

---

## 📞 Soporte

Si después de implementar estos cambios sigues teniendo problemas:

1. **Copia los logs completos** de la consola
2. **Toma screenshot** del error
3. **Verifica** que `NEXTAUTH_URL` esté configurado
4. **Confirma** que estás en modo PRODUCCIÓN (PSE no funciona en TEST)

---

**Última actualización:** 22 de Octubre, 2025
**Estado:** ✅ Solución implementada - Listo para pruebas
