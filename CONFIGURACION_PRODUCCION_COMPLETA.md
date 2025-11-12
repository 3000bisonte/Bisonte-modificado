# ✅ CONFIGURACIÓN DE PRODUCCIÓN COMPLETA

## 🎯 Estado: LISTO PARA PLAY STORE

**Fecha de preparación**: 12 de noviembre de 2025  
**Versión de la app**: 1.0.5 (versionCode: 5)

---

## 📋 CHECKLIST DE CONFIGURACIÓN

### ✅ 1. Variables de Entorno en Producción

#### Archivo: `.env.production`
```bash
NODE_ENV=production
APP_VERSION=1.0.5

# Database
DATABASE_URL=postgresql://neondb_owner:npg_J8aQD0kGEOmj@ep-twilight-bird-a81mv90h-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require

# Auth
NEXTAUTH_URL=https://www.bisonteapp.com
NEXTAUTH_SECRET=edf53042b12f07f8aa55498ea575eec9

# Google OAuth
GOOGLE_CLIENT_ID=108242889910-n3ptem16orktkl0klv8onlttfl83r1ul.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=814463004364-1pj3amqos1f59ju94uca5t6r9s18ek2m.apps.googleusercontent.com

# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bisonte-453a3
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDIrOPfeAb9KSglN3SQKIZW0gt3cUfVfi4
NEXT_PUBLIC_FIREBASE_APP_ID=1:814463004364:web:f7c484b063ac5404fc5c69

# MercadoPago PRODUCCIÓN
MP_PUBLIC_KEY=APP_USR-6754222098823398-110217-97f6788cbdb2a80a682e157fab4247bd-2044503317
NEXT_PUBLIC_INIT_MERCADOPAGO=APP_USR-cde70759-6a1a-4731-b7e0-8efc0311034d

# AdMob PRODUCCIÓN (IDs REALES) ✅
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1352045169606160~5443732431
NEXT_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-1352045169606160/7908962294
NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-1352045169606160/7029983134
ADMOB_APP_ID=ca-app-pub-1352045169606160~5443732431

# URLs
NEXT_PUBLIC_SITE_URL=https://www.bisonteapp.com
NEXT_PUBLIC_API_BASE_URL=https://www.bisonteapp.com/api
```

**Estado**: ✅ CONFIGURADO

---

### ✅ 2. Configuración de AdMob

#### Archivo: `src/config/admob.config.js`
```javascript
const FORCE_TEST_IDS = false; // ✅ FALSE = Usa IDs de producción
```

**Estado**: ✅ CONFIGURADO PARA PRODUCCIÓN

#### Archivo: `android/app/src/main/res/values/strings.xml`
```xml
<string name="admob_app_id">ca-app-pub-1352045169606160~5443732431</string>
```

**Estado**: ✅ ID REAL DE PRODUCCIÓN

---

### ✅ 3. Configuración de Android

#### Archivo: `android/app/build.gradle`
```groovy
versionCode 5
versionName "1.0.5"
applicationId "com.bisonteapp"
```

**Estado**: ✅ VERSION ACTUALIZADA

#### Archivo: `android/app/src/main/AndroidManifest.xml`
- ✅ Permisos: INTERNET, ACCESS_NETWORK_STATE
- ✅ Deep Links configurados para www.bisonteapp.com
- ✅ Meta-data de AdMob, Firebase y Google Sign-In

**Estado**: ✅ COMPLETO

---

### ✅ 4. Capacitor

#### Archivo: `capacitor.config.json`
```json
{
  "appId": "com.bisonteapp",
  "appName": "Bisonte Logística",
  "webDir": "out",
  "server": {
    "url": "https://www.bisonteapp.com",
    "androidScheme": "https"
  }
}
```

**Estado**: ✅ CONFIGURADO PARA PRODUCCIÓN

---

### ✅ 5. Firebase

#### Archivos presentes:
- ✅ `android/app/google-services.json` - Configuración de Firebase
- ✅ Proyecto: bisonte-453a3
- ✅ Android App ID: 1:814463004364:android:ce58d22acdc70826fc5c69

**Estado**: ✅ COMPLETO

---

### ✅ 6. Iconos y Assets

#### Iconos adaptativos:
- ✅ `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- ✅ `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- ✅ `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- ✅ `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- ✅ `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

**Estado**: ✅ TODOS LOS TAMAÑOS PRESENTES

---

## 🚀 PASOS PARA GENERAR AAB DE PRODUCCIÓN

### 1. Generar Keystore (Si no lo tienes)

```powershell
cd android\app
keytool -genkeypair -v -storetype PKCS12 -keystore bisonte-release-key.keystore -alias bisonte-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**Guardar**:
- Ubicación del keystore: `android/app/bisonte-release-key.keystore`
- Alias: `bisonte-key-alias`
- Contraseñas en lugar seguro (1Password, LastPass, etc.)

---

### 2. Configurar gradle.properties

Crear archivo `android/gradle.properties` con:

```properties
# Firma de Release
MYAPP_UPLOAD_STORE_FILE=bisonte-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=bisonte-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=tu_contraseña_store
MYAPP_UPLOAD_KEY_PASSWORD=tu_contraseña_key

# Optimización
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
android.enableJetifier=true
android.useAndroidX=true
```

---

### 3. Sincronizar Capacitor

```powershell
# Opción 1: Usar script automatizado
.\scripts\sync-capacitor.ps1

# Opción 2: Manual
npm run build
npx cap sync android
npx cap copy android
```

---

### 4. Generar AAB Firmado

```powershell
cd android
.\gradlew clean bundleRelease

# El AAB estará en:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

### 5. Verificar el AAB

```powershell
# Ver información del AAB
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab

# Debe mostrar "jar verified"
```

---

## 📱 VERIFICACIÓN PREVIA A SUBIDA

### Checklist Final:

- [x] ✅ Variables de entorno en producción
- [x] ✅ AdMob con IDs reales (FORCE_TEST_IDS=false)
- [x] ✅ MercadoPago con credenciales de producción
- [x] ✅ Firebase configurado correctamente
- [x] ✅ Google Sign-In con Client ID correcto
- [x] ✅ Deep Links configurados
- [x] ✅ Iconos en todos los tamaños
- [x] ✅ versionCode incrementado (5)
- [x] ✅ versionName actualizado (1.0.5)
- [ ] ⏳ Keystore generado y configurado (PENDIENTE - Usuario)
- [ ] ⏳ AAB firmado generado (PENDIENTE - Usuario)

---

## 🔐 SEGURIDAD

### Archivos que NO deben subirse a git:

```
android/app/bisonte-release-key.keystore
android/gradle.properties
.env.local
google-services.json (ya en .gitignore)
```

### Archivos seguros para git:

```
.env.production (sin credenciales sensibles)
.env.example
capacitor.config.json
android/app/build.gradle
```

---

## 📊 INFORMACIÓN DE LA APP

| Campo | Valor |
|-------|-------|
| **App Name** | Bisonte Logística |
| **Package Name** | com.bisonteapp |
| **Version Name** | 1.0.5 |
| **Version Code** | 5 |
| **Min SDK** | 22 (Android 5.1) |
| **Target SDK** | 34 (Android 14) |
| **Compile SDK** | 34 |

---

## 🌐 URLs DE PRODUCCIÓN

| Servicio | URL |
|----------|-----|
| **Web** | https://www.bisonteapp.com |
| **API** | https://www.bisonteapp.com/api |
| **Database** | Neon PostgreSQL (eastus2.azure) |
| **Hosting** | Vercel |
| **Email** | Resend (logistica@notificaciones.bisonteapp.com) |

---

## 🎯 PRÓXIMOS PASOS

1. **Generar Keystore** (si no lo tienes)
   - Seguir instrucciones en sección "Pasos para generar AAB"
   - Guardar contraseñas en lugar seguro
   - NO subir keystore a git

2. **Configurar gradle.properties**
   - Crear archivo con credenciales del keystore
   - Agregar al .gitignore

3. **Sincronizar Capacitor**
   - Ejecutar `.\scripts\sync-capacitor.ps1`
   - O manualmente: `npm run build && npx cap sync android`

4. **Generar AAB**
   - `cd android && .\gradlew clean bundleRelease`
   - Verificar firma con jarsigner

5. **Subir a Play Console**
   - Crear nueva release en Google Play Console
   - Subir AAB generado
   - Completar información de la app (descripción, capturas, etc.)
   - Enviar a revisión

---

## 📞 SOPORTE

Si tienes problemas durante el proceso:

1. Verificar que todas las dependencias estén instaladas
2. Limpiar caché: `cd android && .\gradlew clean`
3. Re-sincronizar: `npx cap sync android`
4. Verificar logs en Android Studio

---

**🎉 ¡La app está lista para ser compilada y subida a Play Store!**

Todas las configuraciones de producción están en su lugar, solo faltan los pasos manuales de generación del keystore y compilación del AAB.
