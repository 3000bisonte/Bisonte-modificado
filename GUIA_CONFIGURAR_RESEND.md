# 🔑 Guía Paso a Paso: Configurar Resend en Vercel

## 📋 Requisitos Previos
- ✅ Cuenta de Vercel (ya la tienes - proyecto Bisonte-modificado)
- 🔲 Cuenta de Resend (vamos a crear/configurar)
- 🔲 Dominio `bisonteapp.com` (para verificar en Resend)

---

## PASO 1: Obtener API Key de Resend

### 1.1 Crear/Iniciar sesión en Resend

1. **Ve a:** https://resend.com
2. **Hacer clic en:** "Sign Up" o "Login"
3. **Opciones de registro:**
   - Con GitHub (recomendado - más rápido)
   - Con Google
   - Con Email

### 1.2 Crear API Key

Una vez dentro del dashboard de Resend:

1. **Ir a:** "API Keys" en el menú lateral
2. **Hacer clic en:** "Create API Key" o "+ New API Key"
3. **Configurar:**
   - **Name:** `Bisonte Logística - Producción`
   - **Permission:** `Full access` o `Sending access`
   - **Domain:** `notificaciones.bisonteapp.com` (si ya lo verificaste)
4. **Hacer clic en:** "Create"
5. **⚠️ IMPORTANTE:** Copiar la API key **AHORA** (solo se muestra una vez)
   - Ejemplo: `re_123abc456def789ghi012jkl345mno678`
   - Guardarla en un lugar seguro temporalmente

---

## PASO 2: Verificar Dominio en Resend

### 2.1 Agregar Dominio

1. **En Resend, ir a:** "Domains" en el menú lateral
2. **Hacer clic en:** "+ Add Domain"
3. **Ingresar:** `notificaciones.bisonteapp.com`
4. **Región:** Seleccionar la más cercana (ej: `us-east-1`)
5. **Hacer clic en:** "Add"

### 2.2 Copiar Registros DNS

Resend mostrará 3 registros DNS que debes agregar:

#### Registro 1: SPF (TXT)
```
Type: TXT
Name: notificaciones.bisonteapp.com (o @)
Value: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### Registro 2: DKIM (TXT)
```
Type: TXT
Name: resend._domainkey.notificaciones.bisonteapp.com
Value: [Valor largo proporcionado por Resend]
TTL: 3600
```

#### Registro 3: DMARC (TXT)
```
Type: TXT
Name: _dmarc.notificaciones.bisonteapp.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@bisonteapp.com
TTL: 3600
```

### 2.3 Agregar Registros en tu Proveedor de DNS

**¿Dónde está tu dominio registrado?**
- GoDaddy
- Namecheap
- Cloudflare
- AWS Route 53
- Otro

**Pasos generales (varía según proveedor):**

1. **Ir al panel de tu proveedor de dominio**
2. **Buscar sección:** "DNS Management" o "Manage DNS" o "DNS Records"
3. **Agregar cada registro TXT** uno por uno con los valores de Resend
4. **Guardar cambios**
5. **Esperar propagación:** 5 minutos - 48 horas (usualmente < 1 hora)

### 2.4 Verificar Dominio en Resend

1. **Volver a Resend** → "Domains"
2. **Esperar que aparezca:** ✅ "Verified" junto al dominio
3. **Si no verifica automáticamente:** Hacer clic en "Verify DNS"

---

## PASO 3: Configurar Variables de Entorno en Vercel

### 3.1 Ir al Proyecto en Vercel

1. **Ve a:** https://vercel.com
2. **Selecciona tu proyecto:** `Bisonte-modificado` (o como se llame)
3. **Ir a:** "Settings" (pestaña superior)
4. **En el menú lateral:** "Environment Variables"

### 3.2 Agregar RESEND_API_KEY

1. **Hacer clic en:** "Add New"
2. **Configurar:**

```
Key (Name): RESEND_API_KEY
Value: [Pegar la API key de Resend aquí]
       Ejemplo: re_123abc456def789ghi012jkl345mno678

Environment: 
☑️ Production
☑️ Preview
☑️ Development
```

3. **Hacer clic en:** "Save"

### 3.3 Agregar EMAIL_FROM (Opcional pero recomendado)

1. **Hacer clic en:** "Add New"
2. **Configurar:**

```
Key (Name): EMAIL_FROM
Value: logistica@notificaciones.bisonteapp.com

Environment: 
☑️ Production
☑️ Preview
☑️ Development
```

3. **Hacer clic en:** "Save"

### 3.4 Variables de Entorno Adicionales (Si las necesitas)

```
NEXT_PUBLIC_SITE_URL
Value: https://tu-dominio-en-vercel.vercel.app
```

---

## PASO 4: Re-deploy en Vercel

Las variables de entorno solo se aplican en nuevos deploys.

### Opción 1: Trigger Manual desde Vercel

1. **En Vercel, ir a:** "Deployments"
2. **Encontrar el último deployment**
3. **Hacer clic en:** "..." (tres puntos)
4. **Seleccionar:** "Redeploy"
5. **Confirmar:** "Redeploy"

### Opción 2: Git Push (Automático)

```bash
# Hacer un cambio mínimo (ejemplo: actualizar README)
echo "Actualizado: $(date)" >> README.md

# Commit y push
git add .
git commit -m "chore: Trigger redeploy con variables de Resend"
git push origin main
```

### Opción 3: Vercel CLI

```bash
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## PASO 5: Verificar que Funciona

### 5.1 Test desde el Panel Admin

1. **Ir a tu sitio en producción**
2. **Login como admin**
3. **Ir a:** `/admin/contactos`
4. **Seleccionar un mensaje** (o crear uno de prueba primero)
5. **Hacer clic en:** "Responder"
6. **Escribir respuesta de prueba**
7. **Enviar**

### 5.2 Verificar Email Recibido

1. **Revisar bandeja del cliente** (el email usado en el mensaje de contacto)
2. **Verificar:**
   - ✅ Email llegó
   - ✅ Remitente: `logistica@notificaciones.bisonteapp.com`
   - ✅ Diseño se ve correctamente
   - ✅ Botones funcionan

### 5.3 Ver Logs en Resend

1. **En Resend, ir a:** "Emails" o "Logs"
2. **Verificar:**
   - Email enviado aparece en la lista
   - Status: "Delivered" (✅)
   - Si hay error: Ver detalles para debuggear

### 5.4 Ver Logs en Vercel

1. **En Vercel, ir a:** Tu proyecto → "Logs"
2. **Buscar:** `📧 Resultado envío email:`
3. **Verificar:** `{ sent: true, transport: 'resend', id: '...' }`

---

## 🔍 Troubleshooting

### Error: "no_email_transport_configured"

**Causa:** La variable RESEND_API_KEY no está configurada o no es válida.

**Solución:**
1. Verificar que la variable existe en Vercel → Settings → Environment Variables
2. Verificar que el valor es correcto (copiar/pegar de nuevo)
3. Re-deploy el proyecto

### Error: "Domain not verified"

**Causa:** El dominio no está verificado en Resend.

**Solución:**
1. Ir a Resend → Domains
2. Verificar registros DNS
3. Usar herramienta de verificación: https://mxtoolbox.com/SuperTool.aspx
4. Esperar más tiempo (hasta 48h)

**Alternativa temporal:**
Usar dominio de prueba de Resend:
```
EMAIL_FROM=onboarding@resend.dev
```

### Error: "Invalid API key"

**Causa:** La API key es incorrecta o expiró.

**Solución:**
1. Crear nueva API key en Resend
2. Actualizar en Vercel
3. Re-deploy

### Email va a SPAM

**Causa:** Falta configuración DNS completa.

**Solución:**
1. Verificar los 3 registros DNS (SPF, DKIM, DMARC)
2. Usar herramienta: https://www.mail-tester.com/
3. Calentar el dominio (enviar pocos emails al inicio)

---

## 📊 Checklist Final

Verifica que completaste todos los pasos:

- [ ] ✅ Cuenta de Resend creada
- [ ] ✅ API Key de Resend generada y copiada
- [ ] ✅ Dominio `notificaciones.bisonteapp.com` agregado en Resend
- [ ] ✅ Registros DNS (SPF, DKIM, DMARC) configurados
- [ ] ✅ Dominio verificado en Resend (✅ aparece)
- [ ] ✅ Variable `RESEND_API_KEY` agregada en Vercel
- [ ] ✅ Variable `EMAIL_FROM` agregada en Vercel (opcional)
- [ ] ✅ Proyecto re-deployado en Vercel
- [ ] ✅ Test de envío de email exitoso
- [ ] ✅ Email recibido en bandeja (no en spam)

---

## 🎯 Resumen de Configuración Final

### En Resend:
```
Domain: notificaciones.bisonteapp.com [Verified ✅]
API Key: re_xxxxxxxxxxxxxxxxxxxxx [Active ✅]
```

### En Vercel (Environment Variables):
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=logistica@notificaciones.bisonteapp.com
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

### En tu Proveedor DNS:
```
TXT @ "v=spf1 include:amazonses.com ~all"
TXT resend._domainkey.[valor de Resend]
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@bisonteapp.com"
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema:

1. **Ver logs de Vercel:** Proyecto → Logs → Buscar errores
2. **Ver logs de Resend:** Emails → Ver detalles del envío
3. **Documentación de Resend:** https://resend.com/docs
4. **Soporte de Resend:** support@resend.com

---

## 🚀 Próximos Pasos Recomendados

Una vez todo funcione:

1. **Configurar límites:** En Resend, configura rate limits si es necesario
2. **Monitorear envíos:** Revisar dashboard de Resend regularmente
3. **Configurar webhooks:** Para recibir notificaciones de bounces/complaints
4. **Calentar dominio:** Enviar emails gradualmente al principio
5. **Revisar analytics:** Ver tasas de apertura y clics en Resend

---

**Última actualización:** Octubre 8, 2025  
**Estado:** Guía completa y verificada
