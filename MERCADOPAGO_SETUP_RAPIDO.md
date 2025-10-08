# 💳 Mercado Pago - Configuración Rápida para Producción

## 🚀 Pasos Rápidos

### 1️⃣ Obtener Credenciales

```bash
# Ve a: https://www.mercadopago.com.co/developers/panel
# Selecciona tu aplicación
# Cambia de TEST a PRODUCCIÓN
# Copia las 2 credenciales
```

### 2️⃣ Configurar en `.env.local`

Edita el archivo `.env.local` y agrega:

```bash
# MercadoPago PRODUCCIÓN
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXX
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN=https://www.bisonteapp.com/mercadopago/status
```

⚠️ **Importante**: 
- `MP_PUBLIC_KEY` y `NEXT_PUBLIC_INIT_MERCADOPAGO` suelen ser **la misma clave** (Public Key)
- `MP_ACCESS_TOKEN` es diferente (Access Token - secreto)

### 3️⃣ Configurar en Vercel

```bash
# 1. Ve a Vercel Dashboard
# 2. Settings → Environment Variables
# 3. Agrega las 4 variables de arriba
# 4. Environment: Production
# 5. Save
# 6. Redeploy
```

### 4️⃣ Verificar Configuración

```bash
# Local
node check-mercadopago.js

# Producción
curl https://www.bisonteapp.com/api/mercadopago
```

Deberías ver:
```json
{
  "success": true,
  "status": "operational",
  "configured": {
    "all": true
  },
  "environment": "production"
}
```

## ✅ Checklist

- [ ] Credenciales obtenidas de Mercado Pago
- [ ] Variables agregadas en `.env.local`
- [ ] Variables agregadas en Vercel
- [ ] Vercel redeployado
- [ ] Verificación exitosa con script
- [ ] Prueba de pago real (monto bajo)

## 🆘 Problemas Comunes

### "No se carga el formulario de pago"

```bash
# Verifica que NEXT_PUBLIC_INIT_MERCADOPAGO esté configurada
echo $NEXT_PUBLIC_INIT_MERCADOPAGO
# Debe mostrar: APP_USR-xxxx
```

### "Pago rechazado siempre"

- ✅ Verifica que uses credenciales de PRODUCCIÓN (no TEST)
- ✅ Verifica que la tarjeta tenga fondos
- ✅ Verifica métodos de pago habilitados en tu cuenta MP

### "Webhook no funciona"

- ✅ URL debe ser HTTPS (no HTTP)
- ✅ Debe responder 200 OK
- ✅ Verifica en MP Panel → Webhooks → Eventos

## 📚 Documentación Completa

Ver: **`GUIA_MERCADOPAGO_PRODUCCION.md`**

---

**Estado actual**: ⚠️ Variables vacías en `.env.local`  
**Próximo paso**: Obtener credenciales de producción
