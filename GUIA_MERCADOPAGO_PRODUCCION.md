# 💳 Configuración de Mercado Pago para Producción

## 📋 Variables Necesarias

Tu aplicación necesita **3 variables de entorno** para Mercado Pago:

```bash
# Backend (servidor) - SECRETO, NO EXPONER
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Frontend (opcional en backend)
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Frontend (React SDK) - PÚBLICO
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🔑 Paso 1: Obtener Credenciales de Producción

### 1.1 Acceder al Panel de Mercado Pago

1. Ve a: **https://www.mercadopago.com.co/developers/panel**
2. Inicia sesión con tu cuenta de Mercado Pago
3. Si no tienes una aplicación creada, haz clic en **"Crear aplicación"**

### 1.2 Crear/Seleccionar Aplicación

```
Nombre de la aplicación: Bisonte Logística
Modelo de integración: Checkout Pro / Checkout API
Producto/Servicio: Logística / Envíos
```

### 1.3 Obtener Credenciales de PRODUCCIÓN

1. En el panel, selecciona tu aplicación
2. Ve a **"Credenciales"** en el menú lateral
3. Cambia el toggle de **TEST** a **PRODUCCIÓN** ⚠️
4. Verás dos credenciales:

```
✅ Public Key (clave pública):
   APP_USR-xxxxxxxx-xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx
   
✅ Access Token (token de acceso):
   APP_USR-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📝 Paso 2: Configurar Variables de Entorno

### 2.1 Archivo `.env.local` (Desarrollo Local)

Edita tu archivo `.env.local`:

```bash
# MercadoPago - PRODUCCIÓN
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX

# URLs para Mercado Pago
NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN=https://www.bisonteapp.com/mercadopago/status
```

⚠️ **Nota importante**: 
- `MP_ACCESS_TOKEN` es **secreto**, NUNCA lo expongas en el frontend
- `NEXT_PUBLIC_INIT_MERCADOPAGO` es **público**, se usa en el SDK de React
- Normalmente `MP_PUBLIC_KEY` y `NEXT_PUBLIC_INIT_MERCADOPAGO` son **la misma clave pública**

### 2.2 Variables en Vercel (Producción)

1. Ve a tu proyecto en **Vercel Dashboard**
2. Settings → Environment Variables
3. Agrega las siguientes variables:

```bash
Variable: MP_ACCESS_TOKEN
Value: APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX
Environment: Production, Preview (opcional)
```

```bash
Variable: MP_PUBLIC_KEY
Value: APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX
Environment: Production, Preview, Development
```

```bash
Variable: NEXT_PUBLIC_INIT_MERCADOPAGO
Value: APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX
Environment: Production, Preview, Development
```

```bash
Variable: NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN
Value: https://www.bisonteapp.com/mercadopago/status
Environment: Production, Preview
```

4. **Redeploy** tu aplicación para que tome las nuevas variables

## 🔒 Paso 3: Configurar Notificaciones (Webhooks)

Para recibir notificaciones de pagos, necesitas configurar webhooks:

### 3.1 Crear Endpoint de Webhooks

Tu aplicación debería tener un endpoint como:
```
https://www.bisonteapp.com/api/mercadopago/webhook
```

### 3.2 Configurar en Mercado Pago

1. En el panel de Mercado Pago
2. Ve a **"Notificaciones"** o **"Webhooks"**
3. Agrega la URL: `https://www.bisonteapp.com/api/mercadopago/webhook`
4. Selecciona eventos a escuchar:
   - ✅ `payment` - Pagos
   - ✅ `merchant_order` - Órdenes

## 🧪 Paso 4: Probar en Producción

### 4.1 Verificar Integración

```bash
# En tu terminal local
curl https://www.bisonteapp.com/api/mercadopago
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "MercadoPago integration status",
  "configured": true
}
```

### 4.2 Hacer Pago de Prueba REAL

⚠️ **IMPORTANTE**: En producción, los pagos son **REALES** y se cobran dinero real.

Para probar:
1. Usa una tarjeta de débito/crédito **de bajo monto**
2. Haz un envío de prueba con costo mínimo
3. Verifica que el pago se procese correctamente
4. Verifica que aparezca en tu cuenta de Mercado Pago

### 4.3 Tarjetas de Prueba (Solo en modo TEST)

Si quieres seguir probando sin cobrar, mantén las credenciales de **TEST**:

```
Tarjeta APROBADA:
  Número: 5031 7557 3453 0604
  CVV: 123
  Fecha: 11/25
  Nombre: APRO

Tarjeta RECHAZADA:
  Número: 5031 4332 1540 6351
  CVV: 123
  Fecha: 11/25
  Nombre: OTHE
```

## 📊 Paso 5: Monitorear Pagos

### 5.1 Dashboard de Mercado Pago

- Ve a: https://www.mercadopago.com.co/activities
- Verás todos los pagos procesados
- Estado de cada transacción
- Comisiones cobradas

### 5.2 Comisiones de Mercado Pago (Colombia)

| Método de Pago | Comisión |
|----------------|----------|
| Tarjeta de crédito | ~2.99% + $800 COP |
| PSE | ~2.49% + $800 COP |
| Efectivo | ~2.99% + $800 COP |

⚠️ Las comisiones pueden variar, verifica en: https://www.mercadopago.com.co/costs-section

## 🔐 Seguridad

### ✅ Buenas Prácticas

1. **NUNCA** expongas `MP_ACCESS_TOKEN` en el frontend
2. **Valida** las notificaciones de webhook con firma HMAC
3. **Verifica** el estado del pago en el servidor antes de confirmar envío
4. **Registra** todas las transacciones en tu base de datos
5. **Maneja** errores y reintentos de pago

### 🚨 Checklist de Seguridad

- [ ] `MP_ACCESS_TOKEN` está en variables de entorno del servidor
- [ ] Webhook valida la firma de Mercado Pago
- [ ] Se verifica el estado del pago antes de confirmar orden
- [ ] Los montos se validan en el servidor (no confiar en frontend)
- [ ] Se registran logs de todas las transacciones
- [ ] Se manejan pagos pendientes, rechazados y reembolsos

## 📄 Archivos Involucrados

### Backend
```
src/app/api/mercadopago/route.ts       - Estado de integración
src/app/api/mercadopago/webhook/route.ts (crear) - Recibir notificaciones
src/schemas/mercadopago.ts              - Validación de datos
```

### Frontend
```
src/components/MercadoPago.js           - Componente de pago
src/app/mercadopago/page.js             - Página de pago
src/styles/mercadopago.css              - Estilos
```

### Configuración
```
.env.local                              - Variables locales
vercel.json                             - Config de Vercel (si aplica)
```

## 🆘 Troubleshooting

### Problema: "No se carga el SDK de Mercado Pago"

**Solución**:
```bash
# Verifica que la variable esté configurada
echo $NEXT_PUBLIC_INIT_MERCADOPAGO

# Debe ser APP_USR-xxxx, NO estar vacía
```

### Problema: "Pago rechazado siempre"

**Causas posibles**:
1. Estás usando credenciales de TEST con tarjetas reales
2. La tarjeta no tiene fondos
3. El banco rechaza transacciones internacionales
4. Falta activar métodos de pago en tu cuenta

**Solución**: Verifica en el panel de Mercado Pago → Configuración → Métodos de pago

### Problema: "No llegan notificaciones de webhook"

**Solución**:
1. Verifica que la URL sea HTTPS (no HTTP)
2. Endpoint debe responder 200 OK
3. Verifica logs en Mercado Pago → Webhooks → Eventos

## 📞 Soporte

- **Documentación oficial**: https://www.mercadopago.com.co/developers/es/docs
- **Foro de desarrolladores**: https://www.mercadopago.com.co/developers/es/community
- **Soporte técnico**: developers@mercadopago.com

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Credenciales de PRODUCCIÓN configuradas en Vercel
- [ ] `NEXT_PUBLIC_INIT_MERCADOPAGO` es la clave pública (APP_USR-xxx)
- [ ] Webhook configurado y funcionando
- [ ] Prueba con pago real de monto bajo
- [ ] Verifica que el pago aparezca en tu cuenta de Mercado Pago
- [ ] Confirma que el envío se registra correctamente
- [ ] Manejo de errores implementado
- [ ] Logs de transacciones funcionando

---

**Estado**: 📝 Pendiente de configuración  
**Próximo paso**: Obtener credenciales de producción de Mercado Pago
