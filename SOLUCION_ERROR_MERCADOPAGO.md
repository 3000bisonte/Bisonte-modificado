# 🔧 Solución: Error al Procesar Pago en Mercado Pago

## 📋 Problema Identificado

El error "Error interno al procesar el pago" ocurre porque:

1. ❌ **Falta la variable `MP_ENVIRONMENT`** en `.env.local` - El sistema no sabe si usar credenciales de prueba o producción
2. ❌ **Falta `NEXT_PUBLIC_INIT_MERCADOPAGO`** - El Payment Brick no se inicializa correctamente
3. ❌ **Credenciales incorrectas o mal configuradas** - Los tokens de Mercado Pago pueden ser inválidos

## ✅ Solución Completa

### 1. Configurar Variables de Entorno

Necesitas agregar/actualizar estas variables en tu archivo `.env.local`:

```bash
# MercadoPago - Configuración del Ambiente
MP_ENVIRONMENT=test

# MercadoPago - Credenciales de PRUEBA (Sandbox)
MP_ACCESS_TOKEN_TEST=TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b
NEXT_PUBLIC_MP_PUBLIC_KEY_TEST=TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b

# MercadoPago - Credenciales de PRODUCCIÓN
MP_ACCESS_TOKEN_PROD=APP_USR-6754222098823398-110217-97f6788cbdb2a80a682e157fab4247bd-2044503317
NEXT_PUBLIC_MP_PUBLIC_KEY_PROD=APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d

# MercadoPago - Inicialización del Payment Brick
# Debe usar la clave pública correspondiente al ambiente
NEXT_PUBLIC_INIT_MERCADOPAGO=TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b
```

### 2. ¿Cómo Obtener Credenciales Correctas?

#### Para Credenciales de Prueba (TEST):

1. Ve a tu Dashboard de Mercado Pago: https://www.mercadopago.com.co/developers/panel
2. En el menú lateral, selecciona **"Tus integraciones"**
3. Crea una nueva aplicación o selecciona una existente
4. Ve a la sección **"Credenciales de prueba"**
5. Copia:
   - **Access Token de prueba** → Úsalo en `MP_ACCESS_TOKEN_TEST`
   - **Public Key de prueba** → Úsalo en `NEXT_PUBLIC_MP_PUBLIC_KEY_TEST` y `NEXT_PUBLIC_INIT_MERCADOPAGO`

#### Para Credenciales de Producción:

1. Misma ruta que arriba
2. Ve a **"Credenciales de producción"**
3. Copia las credenciales a las variables `_PROD`

⚠️ **IMPORTANTE**: Las credenciales que tienes actualmente pueden ser **inválidas** o de otra cuenta. Asegúrate de obtenerlas directamente de tu cuenta de Mercado Pago.

## 🔍 Verificación Paso a Paso

### Paso 1: Verificar que el Endpoint Funciona

Ejecuta este comando en tu terminal:

```bash
curl http://localhost:3000/api/mercadopago/process-payment
```

Deberías ver una respuesta como:
```json
{
  "success": true,
  "message": "Payment processing endpoint operational",
  "configured": true,
  "environment": "test"
}
```

Si ves `"configured": false`, significa que falta el Access Token.

### Paso 2: Verificar las Variables de Entorno

Crea un archivo temporal `test-env.js` en la raíz del proyecto:

```javascript
console.log('MP_ENVIRONMENT:', process.env.MP_ENVIRONMENT);
console.log('MP_ACCESS_TOKEN_TEST:', process.env.MP_ACCESS_TOKEN_TEST ? '✅ Configurado' : '❌ Falta');
console.log('NEXT_PUBLIC_INIT_MERCADOPAGO:', process.env.NEXT_PUBLIC_INIT_MERCADOPAGO ? '✅ Configurado' : '❌ Falta');
```

Ejecuta: `node test-env.js`

### Paso 3: Reiniciar el Servidor de Desarrollo

Después de modificar `.env.local`, **DEBES REINICIAR** el servidor:

```bash
# Detener el servidor (Ctrl + C)
# Luego reiniciar
npm run dev
```

Las variables de entorno solo se cargan al inicio del servidor.

## 🧪 Probar el Pago

Una vez configurado correctamente:

1. Ve al cotizador y calcula un envío
2. Procede al pago con Mercado Pago
3. Usa una de estas tarjetas de prueba:

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|---------|-----|-------|-----------|
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | ✅ APROBADA |
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | ✅ APROBADA |
| Mastercard | 5031 4332 1540 6351 | 123 | 11/25 | ❌ RECHAZADA |

4. Verifica en la consola del navegador (F12) que veas:
   ```
   💳 Procesando pago con Payment Brick...
   📥 Respuesta del servidor: {...}
   ✅ Pago procesado - ID: XXXXX, Estado: approved
   ```

## 🚨 Errores Comunes y Soluciones

### Error: "Token inválido"
**Causa**: El Access Token es incorrecto o expiró  
**Solución**: Obtén nuevas credenciales desde el panel de Mercado Pago

### Error: "Payment Brick no se inicializa"
**Causa**: Falta `NEXT_PUBLIC_INIT_MERCADOPAGO` o tiene un valor incorrecto  
**Solución**: Asegúrate de usar la **Public Key** (no el Access Token) en esta variable

### Error: "CORS" o "Acceso denegado"
**Causa**: Las credenciales de producción requieren que tu dominio esté autorizado  
**Solución**: En modo de prueba, usa `http://localhost:3000`. En producción, autoriza tu dominio en el panel de MP.

### Error: "Monto inválido"
**Causa**: El monto enviado es 0 o negativo (puede ser por test mode activo)  
**Solución**: Verifica que `testMode.js` tenga `FORCE_FREE_SHIPPING: false` si quieres procesar pagos reales

## 📝 Checklist de Verificación

- [ ] Variable `MP_ENVIRONMENT=test` agregada
- [ ] Variable `NEXT_PUBLIC_INIT_MERCADOPAGO` con la Public Key
- [ ] Credenciales obtenidas directamente del panel de Mercado Pago
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Endpoint GET devuelve `"configured": true`
- [ ] Console del navegador muestra logs sin errores
- [ ] Tarjeta de prueba aprobada correctamente

## 🔄 Cambiar de Prueba a Producción

Cuando estés listo para producción:

1. Cambia `MP_ENVIRONMENT=production` en `.env.local`
2. Actualiza `NEXT_PUBLIC_INIT_MERCADOPAGO` con tu Public Key de producción
3. Reinicia el servidor
4. Prueba con una tarjeta REAL (se hará cargo real)
5. Verifica que los pagos aparezcan en tu cuenta de Mercado Pago

## 📞 Soporte Adicional

Si el problema persiste:

1. Revisa los logs del servidor en la terminal donde corre `npm run dev`
2. Revisa la consola del navegador (F12 → Console)
3. Verifica tu cuenta de Mercado Pago para asegurarte de que no esté bloqueada
4. Contacta al soporte de Mercado Pago: https://www.mercadopago.com.co/developers/es/support

---

**Última actualización**: Octubre 15, 2025
