# 📱 Guía Completa: Tests E2E en App Móvil Android

## 🎯 Objetivo

Ejecutar tests automatizados E2E en tu app móvil Android real, probando el flujo completo de login, cotización y pago directamente en tu dispositivo.

---

## 📋 REQUISITOS PREVIOS

### 1. Hardware y Software

✅ **Dispositivo Android** (físico o emulador)
- Android 7.0 o superior
- Depuración USB activada (para dispositivo físico)
- Conectado via USB o WiFi

✅ **En tu PC:**
- Node.js instalado
- Android SDK instalado (Android Studio)
- Java JDK 8 o superior
- Appium Desktop o Appium CLI

### 2. Verificar Instalaciones

```powershell
# Java
java -version

# Node.js
node --version

# Android SDK (adb)
adb version

# Appium (después de instalarlo)
appium --version
```

---

## 🚀 PASO 1: Instalar Appium

### Opción A: Appium Desktop (RECOMENDADO para principiantes)

1. Descargar desde: https://github.com/appium/appium-desktop/releases
2. Instalar el .exe para Windows
3. Abrir Appium Desktop
4. Click en "Start Server" (puerto 4723)

### Opción B: Appium CLI

```powershell
# Instalar Appium globalmente
npm install -g appium

# Instalar driver de Android
appium driver install uiautomator2

# Verificar instalación
appium driver list
```

---

## 🔧 PASO 2: Configurar Dispositivo Android

### Para Dispositivo Físico:

1. **Activar Opciones de Desarrollador:**
   - Ve a Configuración > Acerca del teléfono
   - Toca 7 veces en "Número de compilación"

2. **Activar Depuración USB:**
   - Ve a Configuración > Opciones de desarrollador
   - Activa "Depuración USB"

3. **Conectar por USB:**
   ```powershell
   # Verifica que tu dispositivo se detecta
   adb devices
   
   # Deberías ver algo como:
   # List of devices attached
   # ABC123XYZ    device
   ```

### Para Emulador Android:

1. Abrir Android Studio
2. Tools > AVD Manager
3. Crear o iniciar un emulador
4. Verificar: `adb devices`

---

## 📦 PASO 3: Compilar APK de Debug

```powershell
# En la raíz del proyecto

# 1. Sincronizar código con Capacitor
npx cap sync android

# 2. Compilar APK de debug
cd android
./gradlew assembleDebug

# En Windows, usa:
gradlew.bat assembleDebug
```

La APK se generará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎮 PASO 4: Instalar Dependencias de Testing

Ya están instaladas en tu proyecto:

```json
{
  "devDependencies": {
    "appium": "^2.x",
    "@wdio/cli": "^8.x",
    "@wdio/local-runner": "^8.x",
    "@wdio/mocha-framework": "^8.x",
    "@wdio/spec-reporter": "^8.x",
    "@wdio/appium-service": "^8.x",
    "webdriverio": "^8.x"
  }
}
```

---

## ▶️ PASO 5: Ejecutar Tests

### Preparación:

1. **Iniciar Appium Server:**
   ```powershell
   # Si usas Appium CLI
   appium
   
   # O simplemente abre Appium Desktop y click "Start Server"
   ```

2. **Verificar conexión del dispositivo:**
   ```powershell
   adb devices
   ```

3. **Instalar la APK en el dispositivo:**
   ```powershell
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Ejecutar Tests:

```powershell
# Ejecutar todos los tests móviles
npm run test:mobile

# O con WebdriverIO directamente
npx wdio run wdio.conf.js
```

---

## 📊 Qué Verás Durante los Tests

```
🚀 Iniciando Tests E2E en Dispositivo Android
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 Dispositivo: Android
📦 App: com.bisonteapp
🔢 Versión Android: 12.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 1: Login con Email/Contraseña
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Cambiando a contexto WebView...
📋 Contextos disponibles: [ 'NATIVE_APP', 'WEBVIEW_com.bisonteapp' ]
✅ Contexto cambiado a: WEBVIEW_com.bisonteapp
⏳ Esperando formulario de login...
📧 Buscando campo de email...
✅ Campo de email encontrado
✍️ Ingresando email...
🔐 Buscando campo de contraseña...
✅ Campo de contraseña encontrado
✍️ Ingresando contraseña...
👆 Buscando botón de login...
✅ Botón de login encontrado
🚀 Haciendo click en Iniciar Sesión...
⏳ Esperando redirección...
📍 URL actual: https://www.bisonteapp.com/home
✅ Login exitoso - Usuario autenticado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST 2: Crear Cotización de Envío
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ En página de cotizador
⚖️ Ingresando peso del paquete...
📏 Ingresando dimensiones...
💰 Ingresando valor declarado...
🏙️ Seleccionando ciudades...
🔍 Buscando botón de cotizar...
✅ Botón de cotizar encontrado
👆 Haciendo click en Cotizar...
⏳ Esperando resultados de cotización...
✅ Cotización creada exitosamente

... (continúa con todos los tests)
```

---

## 🧪 Tests Incluidos

### ✅ TEST 1: Login con Credenciales
- Abre la app
- Cambia a contexto WebView
- Llena email: test@bisontelogistica.com
- Llena contraseña: Test123456!
- Click en "Iniciar Sesión"
- Verifica redirección a /home

### ✅ TEST 2: Crear Cotización
- Navega al cotizador
- Llena peso, dimensiones, valor declarado
- Selecciona ciudades origen/destino
- Click en "Cotizar"
- Verifica resultados

### ✅ TEST 3: Flujo Completo hasta Pago
- Llena datos de remitente
- Llena datos de destinatario
- Ve al resumen
- Click en "Pagar"
- Verifica que llega a página de MercadoPago

### ✅ TEST 4: Sistema Anti-Duplicación
- Verifica flags en localStorage:
  - `envioRegistrado`
  - `ordenesCreadas`
  - `origenPago`
- Confirma que existen los mecanismos de protección

### ✅ TEST 5: Logout
- Busca botón de perfil/menú
- Click en "Cerrar sesión"
- Verifica redirección a /login

---

## 🔧 Configuración Avanzada

### Modificar Dispositivo en `wdio.conf.js`:

```javascript
capabilities: [{
    platformName: 'Android',
    'appium:deviceName': 'Tu Dispositivo', // Nombre personalizado
    'appium:platformVersion': '13.0', // Tu versión de Android
    'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
    'appium:appPackage': 'com.bisonteapp',
    'appium:appActivity': '.MainActivity',
    'appium:automationName': 'UiAutomator2',
    'appium:autoGrantPermissions': true,
}]
```

### Ver Logs en Tiempo Real:

```powershell
# En otra terminal, ver logs del dispositivo
adb logcat | findstr "bisonteapp"
```

---

## 🛠️ Troubleshooting

### ❌ Error: "Could not find 'adb'"

**Solución:**
```powershell
# Añadir Android SDK a PATH
# Editar variables de entorno:
# ANDROID_HOME = C:\Users\TuUsuario\AppData\Local\Android\Sdk
# PATH += %ANDROID_HOME%\platform-tools
```

### ❌ Error: "Appium server not running"

**Solución:**
```powershell
# Iniciar Appium en otra terminal
appium

# O abrir Appium Desktop y click "Start Server"
```

### ❌ Error: "Unable to find element"

**Solución:**
- Aumenta los timeouts en `wdio.conf.js`:
  ```javascript
  waitforTimeout: 60000, // 60 segundos
  ```
- Verifica que cambiaste al contexto WEBVIEW:
  ```javascript
  const contexts = await driver.getContexts();
  await driver.switchContext(contexts[1]);
  ```

### ❌ Error: "APK not found"

**Solución:**
```powershell
# Recompilar APK
cd android
gradlew.bat assembleDebug

# Verificar que existe
dir app\build\outputs\apk\debug\app-debug.apk
```

### ❌ La app no carga el WebView

**Solución:**
- Verifica que `capacitor.config.json` tenga la URL correcta:
  ```json
  {
    "server": {
      "url": "https://www.bisonteapp.com"
    }
  }
  ```
- Asegúrate de tener internet en el dispositivo

---

## 📸 Capturas de Pantalla Durante Tests

Los tests capturan screenshots automáticamente en:
```
tests/mobile/logs/screenshots/
```

Puedes añadir capturas manuales en los tests:
```javascript
await driver.saveScreenshot('./screenshot.png');
```

---

## 🎯 Comandos Útiles

```powershell
# Ver dispositivos conectados
adb devices

# Obtener info del dispositivo
adb shell getprop ro.build.version.release  # Versión Android
adb shell getprop ro.product.model          # Modelo

# Instalar APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Desinstalar app
adb uninstall com.bisonteapp

# Ver logs en tiempo real
adb logcat

# Reiniciar adb (si hay problemas)
adb kill-server
adb start-server

# Tomar screenshot desde adb
adb shell screencap /sdcard/screen.png
adb pull /sdcard/screen.png

# Ver actividad actual
adb shell dumpsys window | findstr mCurrentFocus
```

---

## 🚀 Integración Continua (Opcional)

Para ejecutar tests en CI/CD con emuladores:

```yaml
# .github/workflows/mobile-tests.yml
name: Mobile E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest # macOS tiene mejor soporte para emuladores
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
      
      - name: Run Appium
        run: |
          npm install -g appium
          appium driver install uiautomator2
          appium &
      
      - name: Run E2E Tests
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 29
          script: npm run test:mobile
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: tests/mobile/logs/
```

---

## 📚 Recursos Adicionales

- [Appium Documentation](https://appium.io/docs/en/latest/)
- [WebdriverIO Docs](https://webdriver.io/)
- [Android Debug Bridge (adb)](https://developer.android.com/studio/command-line/adb)
- [Capacitor Android](https://capacitorjs.com/docs/android)

---

## ✅ Checklist Pre-Ejecución

Antes de ejecutar los tests, verifica:

- [ ] Appium Server corriendo (puerto 4723)
- [ ] Dispositivo Android conectado (`adb devices` muestra tu dispositivo)
- [ ] APK compilada en `android/app/build/outputs/apk/debug/app-debug.apk`
- [ ] APK instalada en el dispositivo
- [ ] Usuario de prueba creado: test@bisontelogistica.com
- [ ] Dispositivo con conexión a internet
- [ ] Depuración USB activada

---

## 🎉 ¡Listo!

Ahora ejecuta:

```powershell
npm run test:mobile
```

Y verás tu app ejecutando los tests automáticamente en tu dispositivo Android! 📱✨

---

**Fecha:** Octubre 29, 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Listo para usar
