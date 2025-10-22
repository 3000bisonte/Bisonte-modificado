# 🧪 GUÍA DE PRUEBA: PSE en Modo Producción

**Fecha:** 22 de Octubre, 2025  
**Estado del Servidor:** ✅ Corriendo en http://localhost:3000  
**Modo:** 🟢 PRODUCCIÓN

---

## ✅ Configuración Confirmada

```
MP_ENVIRONMENT = production
MP_ACCESS_TOKEN_PROD = APP_USR-6754222098823398-110217-***
NEXT_PUBLIC_INIT_MERCADOPAGO = APP_USR-cde70759-***
NEXTAUTH_URL = https://www.bisonteapp.com
```

---

## 🧪 Pasos para Probar PSE

### Paso 1: Abrir la App de Pagos

1. Abre tu navegador
2. Ve a: **http://localhost:3000**
3. Navega a la página de pagos (donde está el Payment Brick)

### Paso 2: Abrir la Consola del Desarrollador

**Importante:** Debes tener la consola abierta para ver los logs

- **Chrome/Edge:** Presiona `F12` o `Ctrl + Shift + I`
- **Firefox:** Presiona `F12`
- Selecciona la pestaña **"Console"**

### Paso 3: Realizar un Pago con PSE

1. **Selecciona PSE** como método de pago
   - Debe aparecer el icono de banco 🏦
   
2. **Elige un banco** de la lista desplegable
   - Bancolombia
   - Banco de Bogotá
   - Davivienda
   - BBVA
   - Cualquier otro

3. **Completa los datos requeridos:**
   - Email
   - Tipo de persona (Natural/Jurídica)
   - Documento de identidad

4. **Presiona "Pagar"**

### Paso 4: Revisar los Logs en la Consola

Deberías ver algo como esto en la consola del navegador:

```javascript
💳 Procesando pago con Payment Brick...
📋 Datos del formulario (completos): {
  "payment_method_id": "pse",
  "transaction_amount": 50000,
  "transaction_details": {
    "financial_institution": "1022"  // ← Código del banco
  },
  "payer": {
    "email": "usuario@ejemplo.com",
    "entity_type": "individual",
    "identification": {
      "type": "CC",
      "number": "123456789"
    }
  },
  "token": "...",
  ...
}
📋 Resumen: {
  amount: 50000,
  method: "pse",
  isPSE: true,
  hasFinancialInstitution: true  // ← Debe ser true
}
```

**En el servidor (Terminal):**

```
💳 Iniciando procesamiento de pago con Mercado Pago...
📋 Datos recibidos del Payment Brick: {
  amount: 50000,
  method: 'pse',
  installments: 1,
  email: 'usuario@ejemplo.com'
}
🌍 Ambiente: production
🔑 Access Token: APP_USR-67542220988...
🏦 Detectado pago PSE - Agregando campos adicionales...
🏦 Datos PSE agregados: {
  financial_institution: '1022',
  callback_url: 'https://www.bisonteapp.com/mercadopago/statusbrick',
  entity_type: 'individual'
}
📤 Enviando pago a Mercado Pago API...
```

---

## ✅ Resultado Esperado

### Si Todo Sale Bien:

```
📥 Respuesta de Mercado Pago: {
  status: 200,
  paymentId: 123456789,
  paymentStatus: 'pending',  // PSE requiere aprobación del banco
  statusDetail: 'pending_waiting_transfer'
}
✅ Pago procesado - ID: 123456789, Estado: pending
```

**Luego:**
- Serás redirigido al sitio del banco
- Completarás el pago en el portal bancario
- El banco te redirigirá de vuelta a: `https://www.bisonteapp.com/mercadopago/statusbrick`
- Se mostrará el estado final del pago

---

## ❌ Posibles Errores y Soluciones

### Error 1: "financial_institution is required"

**Significa:** Payment Brick no está enviando el código del banco

**Logs que verás:**
```javascript
📋 Resumen: {
  hasFinancialInstitution: false  // ← Problema aquí
}
```

**Solución:**
1. Verifica que seleccionaste un banco de la lista
2. Asegúrate de completar todos los campos del formulario PSE
3. Si persiste, el Payment Brick puede tener un problema de configuración

### Error 2: "callback_url is required"

**Significa:** No se está enviando la URL de retorno

**Ya está solucionado automáticamente** en el endpoint. Si ves este error:

**Solución:**
1. Verifica que `NEXTAUTH_URL` esté configurado en `.env.local`
2. Debería ser: `https://www.bisonteapp.com`

### Error 3: "entity_type is required"

**Significa:** Falta el tipo de persona (natural/jurídica)

**Ya está solucionado automáticamente** en el endpoint. Si ves este error:

**Solución:**
- Payment Brick debería enviarlo automáticamente
- Verifica que completaste el campo "Tipo de persona" en el formulario

### Error 4: Status 401 - "Unauthorized"

**Significa:** El Access Token es inválido

**Solución:**
1. Verifica en `.env.local`:
   ```bash
   MP_ACCESS_TOKEN_PROD=APP_USR-6754222098823398-110217-***
   ```
2. Asegúrate que empiece con `APP_USR-`
3. Reinicia el servidor: `npm run dev`

### Error 5: Status 400 - "Bad Request"

**Significa:** Datos inválidos o incompletos

**Revisa en los logs:**
```javascript
❌ Respuesta completa: {
  "message": "invalid parameter",
  "error": "bad_request",
  "cause": [
    {
      "code": "invalid_parameter",
      "description": "..."  // ← Detalle del error
    }
  ]
}
```

**Solución:**
- Lee el campo `description` para ver qué dato falta o es inválido
- Verifica que todos los campos estén completos

---

## 🔍 Checklist de Depuración

Antes de probar, verifica:

- [ ] ✅ Servidor corriendo (`npm run dev`)
- [ ] ✅ Consola del navegador abierta (F12)
- [ ] ✅ `MP_ENVIRONMENT=production` en `.env.local`
- [ ] ✅ `NEXTAUTH_URL=https://www.bisonteapp.com` en `.env.local`
- [ ] ✅ Página de pagos cargada correctamente
- [ ] ✅ Payment Brick visible en la página
- [ ] ✅ Opción PSE disponible en Payment Brick

Durante la prueba:

- [ ] Banco seleccionado de la lista
- [ ] Email ingresado
- [ ] Tipo de persona seleccionado
- [ ] Documento de identidad ingresado
- [ ] Logs visibles en consola del navegador
- [ ] Logs visibles en terminal del servidor

---

## 📊 Flujo Completo PSE

```
1. Usuario selecciona PSE
   ↓
2. Payment Brick muestra formulario PSE
   ↓
3. Usuario completa datos y presiona "Pagar"
   ↓
4. Frontend: onSubmit() envía datos a /api/mercadopago/process-payment
   ↓
5. Backend: Detecta PSE y agrega campos adicionales
   ↓
6. Backend: Envía a MercadoPago API /v1/payments
   ↓
7. MercadoPago responde con:
   - status: "pending"
   - status_detail: "pending_waiting_transfer"
   - external_resource_url: "https://banco.com/pse/..."
   ↓
8. Usuario es redirigido al banco
   ↓
9. Usuario completa pago en portal bancario
   ↓
10. Banco redirige a: callback_url
   ↓
11. StatusBrick muestra resultado final
```

---

## 💡 Tips Importantes

1. **PSE es asíncrono:** El pago no se aprueba inmediatamente
   - Estado inicial: `pending`
   - Después del banco: `approved` o `rejected`

2. **Redirección obligatoria:** PSE siempre redirige al banco
   - No se puede pagar sin salir de tu app
   - Es el flujo estándar de PSE

3. **Callback URL:** Asegúrate que esté configurado
   - Se usa para volver a tu app después del pago
   - Debe ser HTTPS en producción

4. **Testing en producción:** PSE no funciona en modo TEST
   - Debes estar en modo `production`
   - Usa bancos reales (no hay sandbox para PSE)

---

## 📞 Soporte

Si después de seguir esta guía aún tienes problemas:

1. **Copia los logs completos** de la consola del navegador
2. **Copia los logs** del terminal del servidor
3. **Toma screenshot** del error si lo hay
4. **Comparte** toda esta información

---

## ✅ Estado Actual

```
✅ Servidor corriendo: http://localhost:3000
✅ Modo PRODUCCIÓN activado
✅ Access Token válido
✅ Endpoint PSE mejorado
✅ Logs de debugging habilitados
✅ Callback URL configurado
```

---

**¡LISTO PARA PROBAR PSE!** 🚀

Abre http://localhost:3000 y sigue los pasos de la Sección "🧪 Pasos para Probar PSE"
