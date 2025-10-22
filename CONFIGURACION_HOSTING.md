# 🚀 CONFIGURACIÓN URGENTE - www.bisonteapp.com

## 🎯 SITUACIÓN ACTUAL
- ✅ **Sitio**: Funcionando en https://www.bisonteapp.com (Status 200)
- ❌ **APIs**: Dando Status 308 (redirecciones) - NECESITAN CONFIGURACIÓN
- ✅ **Código**: Actualizado con URLs correctas
- ✅ **Repository**: Cambios subidos

## ⚡ ACCIÓN INMEDIATA REQUERIDA

### El problema: **Variables de entorno no están configuradas en producción**

Necesitas configurar estas variables EN TU PLATAFORMA DE HOSTING:

### 🔧 VARIABLES CRÍTICAS A CONFIGURAR:

```bash
# BÁSICAS
NODE_ENV=production
RUNTIME_ENV=production

# NEXTAUTH (CRÍTICO)
NEXTAUTH_URL=https://www.bisonteapp.com
NEXTAUTH_SECRET=3f8a9b2e1c7d0f4e6a8b9c2d1e0f3a7b9c2e5f8a1b4d7e0c3f6a9b2e5d8c1f4a7e

# URLs (TODAS CON www.)
NEXT_PUBLIC_SITE_URL=https://www.bisonteapp.com
NEXT_PUBLIC_API_BASE_URL=https://www.bisonteapp.com/api
NEXT_PUBLIC_API_SERVER_URL=https://www.bisonteapp.com
NEXT_PUBLIC_URL_BRICK_STATUS_SCREEN=https://www.bisonteapp.com
NEXT_PUBLIC_API_URL=https://www.bisonteapp.com/api
FALLBACK_API_BASE_URL=https://www.bisonteapp.com/api
BASE_URL=https://www.bisonteapp.com/api
ALLOWED_ORIGINS=https://www.bisonteapp.com,https://bisonteapp.com

# MERCADOPAGO PRODUCCIÓN
MP_ENVIRONMENT=production
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d
MP_ACCESS_TOKEN_PROD=APP_USR-6754222098823398-110217-97f6788cbdb2a80a682e157fab4247bd-2044503317

# GOOGLE OAUTH
GOOGLE_CLIENT_ID=TU-GOOGLE-CLIENT-ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-TU-GOOGLE-CLIENT-SECRET

# BASE DE DATOS
DATABASE_URL=postgresql://usuario:password@host/database?sslmode=require

# EMAIL
RESEND_API_KEY=re_TU-RESEND-API-KEY
EMAIL_FROM=logistica@notificaciones.bisonteapp.com

# ADMOB
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1352045169606160~5443732431
NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-1352045169606160/7908962294
NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-1352045169606160/7029983134
```

## 🔧 CÓMO CONFIGURAR SEGÚN TU PLATAFORMA:

### Si usas **Vercel**:
1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Settings > Environment Variables
4. Agrega TODAS las variables de arriba

### Si usas **Railway**:
1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto  
3. Variables tab
4. Agrega todas las variables

### Si usas **Netlify**:
1. Site settings > Environment variables
2. Agrega todas las variables de arriba

## ⚡ VERIFICACIÓN RÁPIDA

Después de configurar las variables, ejecuta:

```bash
node diagnose-production.js
```

**Resultado esperado:**
- ✅ Status 200 (no 308) en todas las APIs
- ✅ Environment detectado como "production"
- ✅ MercadoPago configurado

## 🚨 GOOGLE OAUTH - ACCIÓN ADICIONAL

Agrega esta URL en Google Cloud Console:
```
https://www.bisonteapp.com/api/auth/callback/google
```

## 📝 CHECKLIST POST-CONFIGURACIÓN

□ Variables de entorno configuradas en hosting
□ Aplicación redesplegada/restarted
□ `node diagnose-production.js` mostrando Status 200
□ Google OAuth callback configurado
□ Pagos MercadoPago funcionando

---

## ⏰ TIEMPO ESTIMADO: 5-10 MINUTOS

Una vez configuradas las variables de entorno:
1. 🔄 Redespliega/reinicia la aplicación
2. ✅ Las APIs funcionarán inmediatamente  
3. ✅ Los errores de CSP desaparecerán
4. ✅ MercadoPago procesará pagos reales

**¡Tu app está 99% lista, solo falta esta configuración! 🚀**