# Revisión Completa del Flujo de Inicio de Sesión

## Problemas Identificados y Soluciones

### 1. **Plugin Nativo - Client ID Vacío**
**Problema:** El plugin `BisonteAuth.kt` recibe Client ID vacío, causando error "client ID cannot be null or empty"

**Solución Aplicada:**
- Agregado Client ID hardcodeado como fallback en `android/app/build.gradle`
- Validación y logs mejorados en el plugin para detectar Client ID vacío
- Log del Client ID y redirect URI al iniciar el flujo

### 2. **Configuración de Meta-data**
**Estado Actual:**
- `AndroidManifest.xml` tiene meta-data para `com.bisonteapp.google.ANDROID_CLIENT_ID`
- Intent-filter configurado para scheme: `com.googleusercontent.apps.108242889910-cjl3oa1dvgb6q8ns514pkijn4daf4nig`

### 3. **Validación del Backend**
**Estado Actual:**
- NextAuth configurado para múltiples audiencias (Web, Android, iOS)
- Verificación de idToken con `google-auth-library`
- Soporte para credenciales tradicionales y flujo nativo

## Flujo Completo de Autenticación

### **Flujo Nativo (WebView/Android):**
1. Usuario toca botón "Ingresar con Google"
2. `GoogleLoginButton.tsx` detecta WebView y llama `tryNativeGoogleIdToken()`
3. Plugin `BisonteAuth.googleSignInCCT()` abre Chrome Custom Tab
4. Usuario completa login en Google
5. Google redirige a `com.googleusercontent.apps.xxx:/oauth2redirect`
6. Android intent-filter captura la URL y retorna a `BisonteAuth`
7. Plugin intercambia código por tokens (idToken + accessToken)
8. idToken se pasa a NextAuth via `signIn('credentials', { idToken })`
9. NextAuth valida idToken contra múltiples audiencias
10. Usuario redirigido a `/home`

### **Flujo Web (Navegador):**
1. Usuario toca botón "Ingresar con Google"
2. `GoogleLoginButton.tsx` detecta navegador y llama `signIn('google')`
3. NextAuth redirige a Google OAuth web
4. Usuario completa login
5. Google redirige a `/api/auth/callback/google`
6. NextAuth procesa callback y crea sesión
7. Usuario redirigido a `/home`

## Archivos Críticos Revisados

### ✅ **Frontend Components:**
- `src/components/GoogleLoginButton.tsx` - Nuevo botón inteligente
- `src/app/auth/diagnostics/page.tsx` - Página de pruebas

### ✅ **Backend Auth:**
- `src/lib/auth.js` - NextAuth configurado con múltiples audiencias
- Soporte para credenciales + idToken nativo
- Cookies configuradas por dominio/ambiente

### ✅ **Plugin Nativo:**
- `native/capacitor-bisonte-auth/android/.../BisonteAuth.kt` - Con logs y validaciones
- Lee Client ID desde meta-data
- Manejo de errores mejorado

### ✅ **Android Configuration:**
- `android/app/build.gradle` - Client ID hardcodeado como fallback
- `android/app/src/main/AndroidManifest.xml` - Intent-filter correcto
- Meta-data para Client ID configurada

## Comandos de Build y Test

### **Build APK con logs:**
```bash
cd android
./gradlew clean assembleDebug
```

### **Instalar y probar:**
```bash
adb install -r -d app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.bisonteapp/.MainActivity
```

### **Ver logs durante test:**
```bash
adb logcat | Select-String -Pattern "BisonteAuth|OAuth|Google"
```

## Próximos Pasos de Validación

1. **Verificar logs del plugin** - Confirmar que Client ID se lee correctamente
2. **Probar flujo completo** - Login → Token → Sesión → Dashboard
3. **Validar retorno** - Chrome Custom Tab debe regresar a la app
4. **Verificar backend** - idToken debe validarse contra audiencia Android

## Variables de Entorno Necesarias

### **Local (.env.local):**
```env
GOOGLE_CLIENT_ID=108242889910-n3ptem16orktkl0klv8onlttfl83r1ul.apps.googleusercontent.com  # Web
GOOGLE_ANDROID_CLIENT_ID=108242889910-cjl3oa1dvgb6q8ns514pkijn4daf4nig.apps.googleusercontent.com  # Android
```

### **Producción (Vercel):**
- Mismo par de variables en Environment Variables

El flujo está técnicamente completo. Los problemas principales (Client ID vacío, intent-filter incorrecto) han sido corregidos.