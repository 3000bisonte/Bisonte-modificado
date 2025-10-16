# 🚀 Pasos para Activar Modo Producción en Servidor

**Fecha:** Octubre 16, 2025  
**Estado:** ✅ Configuración Completada - Pendiente Reinicio

---

## ✅ COMPLETADO

1. ✅ **Cambio de ambiente a producción** en `.env.local`
2. ✅ **Public Key actualizada** a credenciales de producción
3. ✅ **Verificación exitosa** con API de Mercado Pago
4. ✅ **PSE confirmado activo** - transferencias bancarias reales
5. ✅ **Efecty confirmado activo** - cupones en tiendas físicas
6. ✅ **7 tipos de tarjetas activas** (5 crédito + 2 débito)

---

## ⏳ PENDIENTE: REINICIAR SERVIDOR

Para que los cambios surtan efecto, necesitas reiniciar tu servidor de desarrollo:

### Opción 1: Si el servidor está corriendo

```powershell
# En la terminal donde está corriendo npm run dev:
# 1. Presiona Ctrl + C para detenerlo
# 2. Espera a que se detenga completamente
# 3. Ejecuta de nuevo:
npm run dev
```

### Opción 2: Si usas Visual Studio Code

```powershell
# En una nueva terminal PowerShell:
npm run dev
```

---

## 🧪 PRUEBA RECOMENDADA ANTES DE PRODUCCIÓN

### Paso 1: Crear cuenta de prueba en Mercado Pago

1. Ve a https://www.mercadopago.com.co
2. Crea una cuenta nueva con email diferente (ejemplo: pruebas+bisonte@gmail.com)
3. No necesitas verificación completa para hacer pagos pequeños

### Paso 2: Hacer compra de prueba

1. Abre tu app en modo producción
2. Crea un envío de prueba (usar bajo costo, ej: $10.000)
3. Selecciona un método de pago:

#### Opción A: Probar con Tarjeta
- Usa una tarjeta prepaga con saldo mínimo ($10.000)
- Completa el pago
- Verifica que se procese correctamente
- Verifica que el envío se registre en "Mis Envíos"

#### Opción B: Probar con PSE
- Selecciona PSE como método de pago
- Elige tu banco (ej: Bancolombia)
- **NO uses tu cuenta bancaria principal** - usa cuenta de pruebas
- Completa el flujo
- Verifica redirección correcta

#### Opción C: Probar con Efecty (sin costo)
- Selecciona Efecty
- Genera el cupón
- Verifica que el cupón tenga:
  * Número de referencia
  * Monto correcto
  * Fecha de vencimiento
- **NO es necesario pagarlo** - solo verifica que se genere

### Paso 3: Verificar en Panel de Mercado Pago

1. Ingresa a https://www.mercadopago.com.co/home
2. Ve a "Actividad" o "Ventas"
3. Busca tu transacción de prueba
4. Verifica que aparezca con el monto correcto
5. Verifica el estado (approved/pending/etc)

### Paso 4: Verificar en tu Admin Panel

1. Ingresa a tu panel de admin: `/admin/envios`
2. Busca el envío de prueba
3. Verifica que tenga:
   - ✅ PaymentId correcto
   - ✅ Estado correcto
   - ✅ Datos del remitente/destinatario
   - ✅ Monto correcto

---

## ⚠️ CHECKLIST ANTES DE ABRIR A USUARIOS

### Configuración:
- [x] MP_ENVIRONMENT=production ✅
- [x] Access Token de producción ✅
- [x] Public Key de producción ✅
- [ ] Servidor reiniciado con nuevas variables
- [ ] Webhooks configurados en MP

### Pruebas:
- [ ] Pago con tarjeta funciona
- [ ] PSE muestra bancos correctamente
- [ ] Efecty genera cupón
- [ ] Envío se registra después de pago
- [ ] Email de confirmación se envía (si aplica)
- [ ] Admin puede ver el envío

### Seguridad:
- [ ] No se guardan datos de tarjeta en logs
- [ ] PaymentId se registra correctamente
- [ ] Estados se actualizan correctamente
- [ ] Errores se manejan apropiadamente

### Documentación:
- [x] CAMBIO_A_PRODUCCION.md creado ✅
- [x] PSE_ESTADO_Y_CONFIGURACION.md actualizado ✅
- [x] METODOS_PAGO_DISPONIBLES.md actualizado ✅
- [ ] Usuarios informados del cambio

---

## 🔧 CONFIGURAR WEBHOOKS (IMPORTANTE)

Los webhooks permiten que Mercado Pago te notifique cuando un pago se confirma (especialmente importante para PSE y Efecty que son asíncronos).

### Paso 1: Crear endpoint de webhook

**Ya deberías tener:** `src/app/api/mercadopago/webhook/route.ts`

Si no existe, créalo con:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log del webhook
    console.log('🔔 Webhook recibido:', body);
    
    // Procesar según el tipo
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      // Aquí actualizas el estado del envío
      // basado en el PaymentId
      
      console.log('💳 Pago actualizado:', paymentId);
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
```

### Paso 2: Configurar en Mercado Pago

1. Ve a: https://www.mercadopago.com.co/developers/panel
2. Selecciona tu aplicación
3. Ve a "Webhooks" en el menú lateral
4. Agrega nueva URL:
   ```
   URL: https://tudominio.com/api/mercadopago/webhook
   Eventos: payment, merchant_order
   ```

### Paso 3: Probar Webhook

```powershell
# Simular webhook en local:
curl -X POST http://localhost:3000/api/mercadopago/webhook `
  -H "Content-Type: application/json" `
  -d '{"type":"payment","data":{"id":"123456"}}'
```

---

## 📊 MONITOREAR TRANSACCIONES

### Panel de Mercado Pago

Accede regularmente a:
- **URL:** https://www.mercadopago.com.co/home
- **Actividad:** Ver todas las transacciones
- **Reportes:** Descargar estados de cuenta
- **Configuración:** Gestionar liberación de dinero

### En tu Base de Datos

```sql
-- Ver envíos con pagos en las últimas 24 horas
SELECT 
  NumeroGuia,
  Estado,
  PaymentId,
  CostoTotal,
  FechaSolicitud
FROM historial_envio
WHERE FechaSolicitud >= NOW() - INTERVAL 24 HOUR
  AND PaymentId IS NOT NULL
ORDER BY FechaSolicitud DESC;
```

---

## 🆘 QUÉ HACER SI ALGO SALE MAL

### Problema: Pago aprobado pero envío no se registra

**Solución:**
1. Busca el PaymentId en logs del servidor
2. Busca en base de datos si existe el envío
3. Si no existe, créalo manualmente desde admin
4. Verifica el endpoint `/api/orders`

### Problema: PSE no muestra bancos

**Solución:**
1. Verifica que MP_ENVIRONMENT=production
2. Limpia caché del navegador
3. Verifica Public Key en Payment Brick
4. Revisa console del navegador para errores

### Problema: Usuario reporta que le cobraron pero no tiene envío

**Solución:**
1. Busca la transacción en MP Panel por email/monto
2. Obtén el PaymentId
3. Busca en tu BD con ese PaymentId
4. Si no existe, crea el envío manualmente
5. Si existe, notifica al usuario

### Emergencia: Necesito volver a modo TEST

```powershell
# Edita .env.local:
MP_ENVIRONMENT=test
NEXT_PUBLIC_INIT_MERCADOPAGO=TEST-213842d0-1f3c-4a61-87a1-c2220adbb15b

# Reinicia servidor:
# Ctrl+C
npm run dev
```

---

## 📞 CONTACTOS DE SOPORTE

### Mercado Pago Colombia:
- **Teléfono:** 01 8000 514 513
- **Email:** soporte@mercadopago.com.co
- **Chat:** https://www.mercadopago.com.co/ayuda
- **Horario:** Lunes a Viernes 8am - 8pm

### Soporte Técnico Bisonte:
- **Email:** 3000bisonte@gmail.com
- **Panel Admin:** https://tudominio.com/admin/envios

---

## ✅ RESUMEN FINAL

| Aspecto | Estado |
|---------|--------|
| Configuración | ✅ Completada |
| Verificación API | ✅ Exitosa |
| PSE | ✅ Activo |
| Efecty | ✅ Activo |
| Tarjetas | ✅ 7 tipos activos |
| Servidor | ⏳ Pendiente reiniciar |
| Pruebas | ⏳ Pendiente realizar |
| Webhooks | ⏳ Pendiente configurar |
| Producción | ⏳ Pendiente lanzar |

---

## 🎯 PRÓXIMOS PASOS

1. **AHORA:** Reinicia el servidor
2. **HOY:** Haz pruebas con cuenta de prueba
3. **HOY:** Configura webhooks
4. **MAÑANA:** Prueba con usuarios beta (si aplica)
5. **PRÓXIMA SEMANA:** Lanzamiento completo

---

**¿Listo para reiniciar el servidor?**

Ejecuta en tu terminal:
```powershell
npm run dev
```

🎉 **¡Tu app ya está lista para procesar pagos reales!**
