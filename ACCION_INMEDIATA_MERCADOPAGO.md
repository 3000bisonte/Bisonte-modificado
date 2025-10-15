# 🚨 ACCIÓN INMEDIATA REQUERIDA - Error de Mercado Pago

## ⚡ Pasos Rápidos para Solucionar

### 📍 PASO 1: Ejecutar Diagnóstico
```powershell
# En la terminal de PowerShell, ejecuta:
.\diagnostico-mercadopago.bat
```

Este script te dirá exactamente qué está mal.

### 📍 PASO 2: Verificar si el servidor está corriendo

**SI EL SERVIDOR NO ESTÁ CORRIENDO:**
```powershell
npm run dev
```

**SI EL SERVIDOR YA ESTÁ CORRIENDO:**
Necesitas reiniciarlo para que cargue las nuevas variables:
1. Presiona `Ctrl + C` en la terminal donde corre el servidor
2. Ejecuta nuevamente: `npm run dev`

### 📍 PASO 3: Verificar el Endpoint

Abre tu navegador y ve a:
```
http://localhost:3000/api/mercadopago/process-payment
```

**✅ Si ves esto (BUENO):**
```json
{
  "success": true,
  "configured": true,
  "environment": "test"
}
```

**❌ Si ves esto (MALO):**
```json
{
  "success": true,
  "configured": false
}
```

### 📍 PASO 4: Si "configured": false

Significa que tus credenciales son **inválidas** o no están configuradas. Necesitas:

1. **Ve al Panel de Mercado Pago:**
   https://www.mercadopago.com.co/developers/panel

2. **Crea o selecciona tu aplicación**

3. **Ve a "Credenciales de prueba"**

4. **Copia tus credenciales REALES:**
   - Access Token de prueba
   - Public Key de prueba

5. **Actualiza `.env.local`:**
   ```bash
   MP_ACCESS_TOKEN_TEST=TU_TOKEN_AQUI
   NEXT_PUBLIC_MP_PUBLIC_KEY_TEST=TU_PUBLIC_KEY_AQUI
   NEXT_PUBLIC_INIT_MERCADOPAGO=TU_PUBLIC_KEY_AQUI
   ```

6. **REINICIA EL SERVIDOR** (importante!)

### 📍 PASO 5: Probar el Pago

1. Ve a tu app: http://localhost:3000
2. Calcula un envío en el cotizador
3. Procede al pago
4. Usa una tarjeta de prueba:
   ```
   Número: 5031 7557 3453 0604
   CVV: 123
   Fecha: 11/25
   Nombre: APRO (o cualquiera)
   ```

5. Verifica en la consola del navegador (F12) que veas:
   ```
   ✅ Pago procesado - ID: 123456, Estado: approved
   ```

## 🔍 Debugging

### Ver logs del servidor:
Mira la terminal donde corre `npm run dev`. Deberías ver:
```
💳 Procesando pago con Mercado Pago...
🌍 Ambiente: test
🔑 Access Token: TEST-213842d0...
✅ Pago procesado - ID: 123456
```

### Ver logs del navegador:
Presiona F12 en tu navegador → Pestaña "Console"

### Errores Comunes:

| Error | Causa | Solución |
|-------|-------|----------|
| "configured": false | Access Token faltante | Agrega MP_ACCESS_TOKEN_TEST en .env.local |
| HTTP 401 | Token inválido | Obtén nuevas credenciales de MP |
| "Payment Brick no se inicializa" | INIT_MERCADOPAGO incorrecto | Debe ser la Public Key, no el Access Token |
| Variables no se cargan | Servidor no reiniciado | Reinicia con Ctrl+C y npm run dev |

## 📞 ¿Aún no funciona?

1. **Lee el archivo completo:** `SOLUCION_ERROR_MERCADOPAGO.md`
2. **Ejecuta el verificador:** `node verify-mercadopago.js`
3. **Revisa los logs** en la terminal del servidor y la consola del navegador
4. **Verifica tu cuenta de Mercado Pago** esté activa y sin restricciones

## ✅ Checklist Final

- [ ] Archivo `.env.local` tiene MP_ENVIRONMENT=test
- [ ] MP_ACCESS_TOKEN_TEST está configurado (empieza con TEST-)
- [ ] NEXT_PUBLIC_INIT_MERCADOPAGO está configurado (misma que la public key)
- [ ] Servidor reiniciado después de cambiar .env.local
- [ ] Endpoint GET retorna "configured": true
- [ ] Tarjeta de prueba procesa correctamente
- [ ] Logs muestran "✅ Pago procesado"

---

**Última actualización:** Octubre 15, 2025  
**Commit:** de49bc4
