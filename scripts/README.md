# 📋 Scripts de Automatización - Bisonte Logística

> **Colección completa de scripts para desarrollo, testing, deploy y mantenimiento**

## 🗂️ Estructura de Scripts

```
scripts/
├── 🏗️ build/              # Scripts de construcción y prebuild
├── 🚀 deploy/             # Scripts de deployment y producción  
├── 🔧 maintenance/        # Scripts de mantenimiento y diagnóstico
├── 🧪 testing/            # Scripts de testing y validación
├── ✅ verify/             # Scripts de verificación
└── 🔐 auth/               # Scripts específicos de autenticación
```

---

## 🏗️ **Build Scripts**

### `prebuild-verify.js`
**Propósito:** Verificar que todos los archivos críticos estén presentes antes del build  
**Uso:** `node scripts/build/prebuild-verify.js`  
**Cuándo:** Automáticamente en `npm run prebuild`

### `prebuild-env-check.js`  
**Propósito:** Validar variables de entorno requeridas antes del build  
**Uso:** `node scripts/build/prebuild-env-check.js`  
**Cuándo:** Automáticamente en `npm run prebuild`

---

## 🚀 **Deploy Scripts**

### `deploy-netlify.ps1` / `deploy-netlify.sh`
**Propósito:** Automatizar deploy completo a Netlify  
**Uso:** `./scripts/deploy/deploy-netlify.ps1` (Windows) o `./scripts/deploy/deploy-netlify.sh` (Unix)  
**Cuándo:** Deploy manual a Netlify

### `monitor-bisonteapp-production.js`
**Propósito:** Monitorear el estado de la aplicación en producción  
**Uso:** `node scripts/deploy/monitor-bisonteapp-production.js`  
**Cuándo:** Post-deploy y monitoreo continuo

### `monitor-deployment.js`
**Propósito:** Monitorear proceso de deployment en tiempo real  
**Uso:** `node scripts/deploy/monitor-deployment.js`  
**Cuándo:** Durante procesos de deploy

### `post-deploy-test.js`
**Propósito:** Ejecutar tests de verificación post-deployment  
**Uso:** `node scripts/deploy/post-deploy-test.js`  
**Cuándo:** Inmediatamente después de cada deploy

### `verify-production-deployment.js`
**Propósito:** Verificar que el deployment de producción esté funcionando correctamente  
**Uso:** `node scripts/deploy/verify-production-deployment.js`  
**Cuándo:** Validación final de deploy

---

## 🔧 **Maintenance Scripts**

### `analyze-auth.js`
**Propósito:** Analizar el estado actual del sistema de autenticación  
**Uso:** `node scripts/maintenance/analyze-auth.js`  
**Cuándo:** Diagnóstico de problemas de auth

### `diagnose-auth.js`
**Propósito:** Diagnóstico profundo de problemas de autenticación  
**Uso:** `node scripts/maintenance/diagnose-auth.js`  
**Cuándo:** Troubleshooting de auth

### `deep-home-diagnosis.js`
**Propósito:** Diagnóstico completo del estado de la aplicación  
**Uso:** `node scripts/maintenance/deep-home-diagnosis.js`  
**Cuándo:** Análisis general de health

### `diagnostico-completo.js`
**Propósito:** Diagnóstico integral del sistema  
**Uso:** `node scripts/maintenance/diagnostico-completo.js`  
**Cuándo:** Análisis completo de sistema

### `fix-remaining-urls.js`
**Propósito:** Corregir URLs que quedaron pendientes en migraciones  
**Uso:** `node scripts/maintenance/fix-remaining-urls.js`  
**Cuándo:** Post-migración de URLs

### `update-all-urls.js`
**Propósito:** Actualizar todas las URLs del sistema  
**Uso:** `node scripts/maintenance/update-all-urls.js`  
**Cuándo:** Migraciones de dominio

### `update-imports-post-migration.js`
**Propósito:** Actualizar imports después de reestructuraciones  
**Uso:** `node scripts/maintenance/update-imports-post-migration.js`  
**Cuándo:** Post-refactoring estructural

---

## 🧪 **Testing Scripts**

### `test-api-fix.js`
**Propósito:** Testar correcciones específicas de API  
**Uso:** `node scripts/testing/test-api-fix.js`  
**Cuándo:** Después de fixes de API

### `test-backend-api.js`
**Propósito:** Testing completo del backend y APIs  
**Uso:** `node scripts/testing/test-backend-api.js`  
**Cuándo:** Validación de backend

### `test-endpoints.mjs`
**Propósito:** Testing de todos los endpoints de la aplicación  
**Uso:** `node scripts/testing/test-endpoints.mjs`  
**Cuándo:** Validación de endpoints

### `test-refresh-flow.js`
**Propósito:** Testar el flujo de refresh de tokens  
**Uso:** `node scripts/testing/test-refresh-flow.js`  
**Cuándo:** Testing de auth flows

### `test-session.js`
**Propósito:** Testar funcionalidad de sesiones  
**Uso:** `node scripts/testing/test-session.js`  
**Cuándo:** Validación de sesiones

---

## ✅ **Verify Scripts**

### `verify-all-endpoints.js`
**Propósito:** Verificar que todos los endpoints estén respondiendo  
**Uso:** `node scripts/verify/verify-all-endpoints.js`  
**Cuándo:** Health check completo

### `verify-functions.js`
**Propósito:** Verificar funciones serverless  
**Uso:** `node scripts/verify/verify-functions.js`  
**Cuándo:** Validación de functions

### `verify-idtoken.js`
**Propósito:** Verificar validación de ID tokens  
**Uso:** `node scripts/verify/verify-idtoken.js`  
**Cuándo:** Validación de tokens

### `verify-webview-auth.js`
**Propósito:** Verificar autenticación en WebView  
**Uso:** `node scripts/verify/verify-webview-auth.js`  
**Cuándo:** Testing de WebView

---

## 🔐 **Auth Scripts**

### `auth-status.js`
**Propósito:** Verificar estado del sistema de autenticación  
**Uso:** `node scripts/auth/auth-status.js`  
**Cuándo:** Monitoreo de auth

### `fix-webview-auth.js`
**Propósito:** Corregir problemas de autenticación en WebView  
**Uso:** `node scripts/auth/fix-webview-auth.js`  
**Cuándo:** Fixes específicos de WebView

### `gen-jwt.js`
**Propósito:** Generar JWTs para testing  
**Uso:** `node scripts/auth/gen-jwt.js`  
**Cuándo:** Testing y desarrollo

---

## 🛠️ **Utilidades PowerShell**

### `call-session.ps1`
**Propósito:** Utilidad PowerShell para testing de sesiones  
**Uso:** `.\scripts\call-session.ps1`  
**Plataforma:** Windows PowerShell

### `cleanup-duplicates.ps1`
**Propósito:** Limpiar archivos duplicados  
**Uso:** `.\scripts\cleanup-duplicates.ps1`  
**Plataforma:** Windows PowerShell

### `isolate-legacy-frontend.ps1`
**Propósito:** Aislar frontend legacy para migración  
**Uso:** `.\scripts\isolate-legacy-frontend.ps1`  
**Plataforma:** Windows PowerShell

### `refactor-structure.ps1`
**Propósito:** Scripts de refactoring estructural  
**Uso:** `.\scripts\refactor-structure.ps1`  
**Plataforma:** Windows PowerShell

---

## 🚀 **Scripts de Uso Común**

### **Para Desarrolladores**
```bash
# Verificar health general
node scripts/verify/verify-all-endpoints.js

# Diagnosticar problemas
node scripts/maintenance/diagnostico-completo.js

# Testing completo
node scripts/testing/test-endpoints.mjs
```

### **Para Deploy**
```bash  
# Pre-deploy validation
node scripts/build/prebuild-verify.js

# Deploy a Netlify
./scripts/deploy/deploy-netlify.sh

# Post-deploy verification
node scripts/deploy/post-deploy-test.js
```

### **Para Troubleshooting**
```bash
# Diagnóstico de auth
node scripts/maintenance/diagnose-auth.js

# Análisis completo
node scripts/maintenance/deep-home-diagnosis.js

# Fix de URLs
node scripts/maintenance/fix-remaining-urls.js
```

---

## ⚙️ **Configuración de Scripts**

### **Variables de Entorno Requeridas**
- `NODE_ENV` - Entorno de ejecución
- `DATABASE_URL` - URL de base de datos  
- `NEXTAUTH_URL` - URL base de la aplicación
- `NEXTAUTH_SECRET` - Secret para NextAuth

### **Dependencias**
- Node.js >= 18.0.0
- npm o yarn
- PowerShell (para scripts .ps1)

---

## 📋 **Mantenimiento**

### **Agregar Nuevo Script**
1. Crear archivo en carpeta apropiada
2. Documentar propósito y uso aquí
3. Agregar a package.json si es necesario
4. Testar funcionamiento

### **Deprecar Script**
1. Mover a `/archive` si es necesario
2. Remover de documentación
3. Actualizar dependencias en package.json

---

*Documentación de scripts generada automáticamente - Última actualización: 24/09/2025*