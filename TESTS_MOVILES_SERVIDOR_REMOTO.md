# 🌐 Tests Móviles desde Servidor Remoto

## 📋 Situación Actual

Estás trabajando en un **servidor remoto** (Windows Server) vía Visual Studio Code Remote, pero necesitas ejecutar tests en tu **dispositivo Android local**.

## ❌ Problema

Los tests móviles de Appium requieren:
- Dispositivo Android **físicamente conectado**
- ADB instalado y configurado
- Appium Server con acceso al dispositivo

**En un servidor remoto esto NO funciona** porque el dispositivo Android está en tu máquina local, no en el servidor.

---

## ✅ SOLUCIONES

### Opción 1: Ejecutar Tests desde tu PC Local (RECOMENDADO)

#### Paso 1: Clonar el Repo en tu PC Local

```powershell
# En tu PC local (no en el servidor)
cd C:\proyectos
git clone https://github.com/3000bisonte/Bisonte-modificado.git
cd Bisonte-modificado
npm install
```

#### Paso 2: Configurar Appium en tu PC

```powershell
# Instalar Appium globalmente
npm install -g appium
appium driver install uiautomator2

# Verificar instalación
appium --version
```

#### Paso 3: Conectar tu Dispositivo Android

```powershell
# Conectar via USB y verificar
adb devices

# Deberías ver:
# List of devices attached
# ABC123    device
```

#### Paso 4: Compilar APK

```powershell
# Sincronizar Capacitor
npx cap sync android

# Compilar APK
cd android
gradlew.bat assembleDebug
cd ..

# Instalar en dispositivo
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### Paso 5: Ejecutar Tests

```powershell
# Terminal 1: Iniciar Appium
appium

# Terminal 2: Ejecutar tests
npm run test:mobile
```

---

### Opción 2: Usar BrowserStack/Sauce Labs (Cloud Testing)

Si no puedes ejecutar localmente, usa servicios cloud:

#### A. BrowserStack

```javascript
// wdio.conf.browserstack.js
exports.config = {
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    
    services: ['browserstack'],
    
    capabilities: [{
        'bstack:options': {
            deviceName: 'Samsung Galaxy S21',
            platformVersion: '11.0',
            platformName: 'Android',
        },
        'appium:app': 'bs://tu_app_id',
    }],
    
    // ... resto de config
}
```

```powershell
# Ejecutar
npm run test:mobile:cloud
```

#### B. Sauce Labs

Similar a BrowserStack pero con sus propias credenciales.

---

### Opción 3: Appium Server Remoto (Avanzado)

Configurar Appium en tu PC local y conectar desde el servidor:

#### En tu PC Local:

```powershell
# Iniciar Appium con acceso remoto
appium --address 0.0.0.0 --port 4723 --relaxed-security

# Nota tu IP local, ejemplo: 192.168.1.100
ipconfig
```

#### En el Servidor (wdio.conf.js):

```javascript
exports.config = {
    hostname: '192.168.1.100', // Tu IP local
    port: 4723,
    path: '/wd/hub/',
    
    capabilities: [{
        // ... tu config
    }]
}
```

**⚠️ Requiere red local compartida entre servidor y tu PC**

---

### Opción 4: Tests de Integración en lugar de E2E (Alternativa)

Si los tests móviles E2E son complicados, crea tests de integración API:

```javascript
// tests/integration/mobile-api.test.js
describe('API Integration Tests for Mobile', () => {
    it('should login via API', async () => {
        const response = await fetch('https://www.bisonteapp.com/api/auth/signin', {
            method: 'POST',
            body: JSON.stringify({
                email: 'test@bisontelogistica.com',
                password: 'Test123456!'
            })
        });
        
        expect(response.ok).toBe(true);
    });
    
    it('should create cotización via API', async () => {
        // ... test de API
    });
});
```

---

## 🎯 RECOMENDACIÓN PARA TU CASO

### Solución Híbrida (Mejor para tu situación):

1. **Desarrollo en Servidor**: Continúa programando en VS Code Remote
2. **Tests Móviles Locales**: Ejecuta tests desde tu PC local

#### Workflow:

```powershell
# 1. En el servidor (donde programas)
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 2. En tu PC local (donde pruebas)
git pull origin main
npm install
npm run test:mobile
```

---

## 📝 CONFIGURAR PARA TU CASO

### 1. Actualizar wdio.conf.js para Modo Local

```javascript
// wdio.conf.js
exports.config = {
    // ... config existente
    
    // Agregar flag para modo local
    hostname: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT || '4723'),
    
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': process.env.DEVICE_NAME || 'Android Device',
        'appium:platformVersion': process.env.ANDROID_VERSION || '12.0',
        'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
        // ... resto
    }]
}
```

### 2. Crear .env.local para tu PC

```bash
# .env.mobile.local
APPIUM_HOST=localhost
APPIUM_PORT=4723
DEVICE_NAME=Mi Dispositivo
ANDROID_VERSION=12.0
```

### 3. Script para PC Local

```powershell
# run-mobile-tests-local.bat
@echo off
echo ========================================
echo Tests Moviles - Ejecucion Local
echo ========================================
echo.

REM Verificar dispositivo
echo [1/3] Verificando dispositivo Android...
adb devices | findstr "device$" >nul
if %errorlevel% neq 0 (
    echo [X] No hay dispositivo conectado
    echo     Por favor conecta tu dispositivo Android
    pause
    exit /b 1
)
echo [OK] Dispositivo detectado

REM Iniciar Appium
echo.
echo [2/3] Iniciando Appium Server...
start "Appium" cmd /k "appium --address localhost --port 4723 --relaxed-security"
timeout /t 5 /nobreak >nul
echo [OK] Appium iniciado

REM Ejecutar tests
echo.
echo [3/3] Ejecutando tests...
npm run test:mobile

echo.
echo ========================================
echo Tests Completados
echo ========================================
pause
```

---

## 🔧 Troubleshooting para Servidor Remoto

### Error: "No dispositivo conectado"

```powershell
# En tu servidor remoto, esto NO funcionará:
adb devices  # Vacío o no disponible

# SOLUCIÓN: Ejecutar desde PC local
```

### Error: "Appium no puede conectar"

```powershell
# El servidor remoto no tiene acceso al dispositivo USB
# SOLUCIÓN: Usar Opción 1 (PC Local) u Opción 2 (Cloud)
```

### Error: "APK no encontrada"

```powershell
# Si compilas en el servidor pero pruebas local:
# 1. Compilar en servidor
cd android; gradlew.bat assembleDebug; cd ..

# 2. Copiar APK a tu PC local (via Git o descarga)
# 3. Actualizar path en wdio.conf.js local
```

---

## 📊 Comparación de Opciones

| Opción | Complejidad | Costo | Realismo | Velocidad |
|--------|-------------|-------|----------|-----------|
| **1. PC Local** | 🟢 Baja | Gratis | ⭐⭐⭐⭐⭐ | ⚡ Rápido |
| **2. BrowserStack** | 🟡 Media | $$ | ⭐⭐⭐⭐ | 🐢 Lento |
| **3. Appium Remoto** | 🔴 Alta | Gratis | ⭐⭐⭐⭐⭐ | ⚡ Rápido |
| **4. Tests API** | 🟢 Baja | Gratis | ⭐⭐⭐ | ⚡⚡ Muy Rápido |

---

## ✅ PLAN RECOMENDADO

### Para tu caso específico:

**DÍA A DÍA:**
1. Programa en el servidor (VS Code Remote)
2. Commit y push cambios
3. Pull en tu PC local
4. Ejecuta tests móviles en tu PC

**CONFIGURACIÓN:**
```powershell
# En servidor: Solo código
# En PC local: Código + Tests móviles + Dispositivo Android
```

**BENEFICIOS:**
- ✅ No necesitas configurar ADB en el servidor
- ✅ Dispositivo Android en tu PC local
- ✅ Tests rápidos y reales
- ✅ Sin costo adicional

---

## 🚀 PRÓXIMOS PASOS

1. **Decide qué opción usar** (recomiendo Opción 1: PC Local)
2. **Configura el entorno local** en tu PC
3. **Prueba con:** `npm run test:mobile`

¿Quieres que te ayude a configurar alguna de estas opciones?
