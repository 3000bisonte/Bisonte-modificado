# 🔗 Configuración de Deep Links para MercadoPago

## 📋 Problema Resuelto
Cuando el usuario hacía un pago con PSE y MercadoPago redirigía de vuelta, se abría el navegador web en lugar de la app móvil.

## ✅ Solución Implementada

### 1. **Archivos Modificados**

#### `android/app/src/main/AndroidManifest.xml`
Se agregaron **Intent Filters** para capturar URLs de redirección:

```xml
<!-- Deep Links para capturar redirecciones de MercadoPago -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" />
    <data android:host="www.bisonteapp.com" />
    <data android:pathPrefix="/resumen" />
</intent-filter>

<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" />
    <data android:host="www.bisonteapp.com" />
    <data android:pathPrefix="/misenvios" />
</intent-filter>

<!-- Deep Link scheme personalizado como fallback -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="bisonteapp" />
</intent-filter>
```

#### `capacitor.config.json`
Se agregó configuración de deep links:

```json
{
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "App": {
      "deepLinkSchemes": ["bisonteapp"]
    }
  }
}
```

#### `public/.well-known/assetlinks.json`
Se agregó configuración para la app de Capacitor (requiere SHA-256).

---

## 🔧 Pasos para Completar la Configuración

### **Paso 1: Obtener el SHA-256 Fingerprint**

Ejecuta el script que generé:

```powershell
.\get-sha256-fingerprint.bat
```

O manualmente con este comando:

```powershell
# Para debug keystore (desarrollo)
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# Para release keystore (producción)
keytool -list -v -keystore RUTA_A_TU_KEYSTORE -alias TU_ALIAS
```

**Busca la línea que dice:**
```
SHA256: XX:XX:XX:XX:XX:...
```

### **Paso 2: Actualizar assetlinks.json**

1. Abre: `public/.well-known/assetlinks.json`
2. Busca: `"REEMPLAZAR_CON_TU_SHA256_DE_KEYSTORE"`
3. Reemplaza con el valor SHA256 que obtuviste

**Ejemplo:**
```json
{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.bisonteapp",
    "sha256_cert_fingerprints": [
      "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5"
    ]
  }
}
```

### **Paso 3: Sincronizar Capacitor**

```bash
npm run build
npx cap sync android
```

### **Paso 4: Reconstruir la App**

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

O desde Android Studio: **Build > Rebuild Project**

---

## 🧪 Cómo Probar

### **Opción 1: Usando ADB**

```bash
# Probar deep link de resumen
adb shell am start -W -a android.intent.action.VIEW -d "https://www.bisonteapp.com/resumen?payment=pending" com.bisonteapp

# Probar deep link de mis envíos
adb shell am start -W -a android.intent.action.VIEW -d "https://www.bisonteapp.com/misenvios?payment=success" com.bisonteapp

# Probar scheme personalizado
adb shell am start -W -a android.intent.action.VIEW -d "bisonteapp://resumen" com.bisonteapp
```

### **Opción 2: Flujo Real de PSE**

1. Abre la app en tu dispositivo
2. Crea un envío
3. Selecciona PSE como método de pago
4. Click en "Ir al banco"
5. Completa el pago (o cancela)
6. **Verifica que vuelva a la app** (no al navegador)

---

## 🔍 Verificar Deep Links Configurados

### **En el Dispositivo Android:**

1. Ajustes > Apps > Bisonte Logística
2. Abrir por defecto / Abrir enlaces
3. Deberías ver: `www.bisonteapp.com`
4. Estado: "Verificado"

### **Desde Línea de Comandos:**

```bash
# Ver deep links verificados
adb shell pm get-app-links com.bisonteapp

# Ver dominios verificados
adb shell pm get-app-links --user 0 com.bisonteapp
```

---

## 📱 URLs que la App Capturará

✅ `https://www.bisonteapp.com/resumen?payment=failure`  
✅ `https://www.bisonteapp.com/resumen?payment=pending`  
✅ `https://www.bisonteapp.com/misenvios?payment=success`  
✅ `bisonteapp://cualquier-ruta` (scheme personalizado)

---

## 🐛 Solución de Problemas

### **Problema: La app no se abre, va al navegador**

**Solución:**
1. Verifica que el SHA-256 en `assetlinks.json` sea correcto
2. Asegúrate de que el archivo esté accesible en:  
   `https://www.bisonteapp.com/.well-known/assetlinks.json`
3. Limpia la caché de verificación de Android:
   ```bash
   adb shell pm clear com.android.vending
   ```

### **Problema: "No se puede verificar el dominio"**

**Solución:**
1. Verifica que el dominio esté accesible por HTTPS
2. Asegúrate de que `assetlinks.json` tenga el formato correcto (JSON válido)
3. Usa la herramienta de Google para validar:  
   https://developers.google.com/digital-asset-links/tools/generator

### **Problema: Intent Filter no funciona**

**Solución:**
1. Verifica que `android:autoVerify="true"` esté presente
2. Asegúrate de que `android:exported="true"` esté en la actividad
3. Reconstruye completamente la app (no solo instalar)

---

## 📚 Recursos Adicionales

- [Android App Links](https://developer.android.com/training/app-links)
- [Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [MercadoPago Back URLs](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/checkout-customization/user-interface/redirection)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)

---

## ✅ Checklist de Implementación

- [x] Agregar Intent Filters en AndroidManifest.xml
- [x] Configurar androidScheme en capacitor.config.json
- [x] Agregar deep link schemes en plugins.App
- [x] Actualizar assetlinks.json con package_name
- [ ] **Obtener y agregar SHA-256 fingerprint** ⚠️ PENDIENTE
- [ ] Deploy del assetlinks.json actualizado
- [ ] Sincronizar Capacitor (`npx cap sync android`)
- [ ] Reconstruir la app
- [ ] Probar con ADB
- [ ] Probar flujo real de PSE
- [ ] Verificar en configuración del dispositivo

---

## 🎯 Resultado Esperado

Después de completar estos pasos:

1. ✅ Usuario hace pago con PSE
2. ✅ Click "Ir al banco"
3. ✅ Se abre el navegador/app del banco
4. ✅ Usuario completa/cancela el pago
5. ✅ **LA APP SE ABRE AUTOMÁTICAMENTE** (no el navegador)
6. ✅ Se muestra el modal correspondiente (éxito/pendiente/error)
7. ✅ Usuario continúa en la app sin interrupciones

---

**Última actualización:** 27 de octubre de 2025
