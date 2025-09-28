# 📱 CONSTRUCCIÓN APK ANDROID - Guía Completa

## 🚀 **Método 1: Android Studio (Recomendado)**

### **Pasos en Android Studio:**
1. **Android Studio se está abriendo** automáticamente
2. **Esperar** a que termine de cargar el proyecto
3. **Build Menu** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. **Esperar** la construcción (2-5 minutos)
5. **Buscar APK** en: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🛠️ **Método 2: Línea de comandos (si resuelves JAVA_HOME)**

```powershell
# Si tienes Android Studio instalado:
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# O si tienes JDK instalado:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Entonces construir:
cd android
.\gradlew assembleDebug
```

## 📦 **Método 3: APK directo con Capacitor**

```powershell
# Intentar de nuevo después de configurar JAVA_HOME
npx cap build android
```

## 🎯 **Ubicación del APK generado:**

Una vez construido, el APK estará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📋 **Información del APK:**

- **Package Name**: `com.bisonteapp`
- **Version**: Según package.json
- **Signed**: Debug keystore (para testing)
- **Size**: ~10-20 MB (aproximado)

## 🔧 **Si hay errores en Android Studio:**

1. **Sync Project**: File → Sync Project with Gradle Files
2. **Clean Project**: Build → Clean Project
3. **Rebuild**: Build → Rebuild Project
4. **Verificar**: Que google-services.json esté en `android/app/`

## 📱 **Testing del APK:**

```powershell
# Instalar en dispositivo conectado
adb install android/app/build/outputs/apk/debug/app-debug.apk

# O copiar APK a dispositivo y instalar manualmente
```

## ✅ **Verificaciones finales:**

- ✅ Google Auth configurado
- ✅ Firebase integrado
- ✅ Client IDs configurados
- ✅ AndroidManifest.xml completo
- ✅ Capacitor plugins incluidos

**Android Studio está construyendo el APK. Espera a que termine y verifica la ubicación del archivo.**