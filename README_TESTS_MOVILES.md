# ⚠️ IMPORTANTE: Tests Móviles desde Servidor Remoto

## 🎯 Tu Situación

Estás trabajando en **VS Code conectado a un servidor remoto** (Windows Server), pero necesitas ejecutar tests móviles en tu **dispositivo Android local**.

---

## ❌ EL PROBLEMA

```
Servidor Remoto (donde programas)
    ↓
VS Code Remote
    ↓
NO tiene acceso a tu dispositivo Android
    ↓
ERROR: ECONNREFUSED ❌
```

**Los tests móviles NO pueden ejecutarse en el servidor** porque:
- Tu dispositivo Android está conectado a tu PC, no al servidor
- ADB no puede "ver" dispositivos USB remotos
- Appium necesita conexión directa con el dispositivo

---

## ✅ LA SOLUCIÓN

### Opción 1: Ejecutar Tests desde tu PC Local (RECOMENDADO)

#### Workflow Simple:

```
1. PROGRAMAR en Servidor
   ↓
2. Git PUSH
   ↓
3. Git PULL en tu PC local
   ↓
4. EJECUTAR tests móviles en PC local
```

#### Pasos Detallados:

**EN EL SERVIDOR (donde programas):**
```powershell
# Hacer cambios en el código
# ...

# Commit y push
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

**EN TU PC LOCAL (donde pruebas):**
```powershell
# 1. Clonar repo (solo primera vez)
cd C:\proyectos
git clone https://github.com/3000bisonte/Bisonte-modificado.git
cd Bisonte-modificado
npm install

# 2. Actualizar código
git pull origin main
npm install  # Por si hay nuevas dependencias

# 3. Conectar dispositivo Android via USB

# 4. Ejecutar tests
.\run-mobile-tests-local.bat
```

---

### Opción 2: Usar BrowserStack App Automate (Cloud Testing)

Si no quieres configurar nada local, usa un servicio cloud:

#### 1. Crear cuenta en BrowserStack
- Visita: https://www.browserstack.com/app-automate
- Plan gratuito disponible para probar

#### 2. Subir tu APK

```powershell
# Compilar APK en el servidor
cd android
gradlew.bat assembleDebug
cd ..

# Subir a BrowserStack (desde el servidor está bien)
curl -u "USERNAME:ACCESS_KEY" \
  -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
  -F "file=@android/app/build/outputs/apk/debug/app-debug.apk"
```

#### 3. Configurar tests para BrowserStack

```javascript
// wdio.conf.browserstack.js
exports.config = {
    user: process.env.BROWSERSTACK_USERNAME,
    key: process.env.BROWSERSTACK_ACCESS_KEY,
    
    hostname: 'hub-cloud.browserstack.com',
    
    capabilities: [{
        'bstack:options': {
            deviceName: 'Samsung Galaxy S21',
            osVersion: '11.0',
            projectName: 'Bisonte Logística',
            buildName: 'Tests E2E Móviles',
        },
        'appium:app': 'bs://tu_app_id_de_browserstack',
    }],
    
    services: ['browserstack']
}
```

#### 4. Ejecutar tests en BrowserStack

```powershell
# Desde el SERVIDOR (funciona porque es cloud)
npm install --save-dev @wdio/browserstack-service
npm run test:mobile:cloud
```

**VENTAJA:** Funciona desde el servidor, sin necesidad de dispositivo local.
**DESVENTAJA:** Cuesta dinero (después del trial gratuito).

---

## 🔧 CONFIGURACIÓN RECOMENDADA PARA TI

### En el Servidor (donde programas):

```
bisonte-logistica-main/
├── src/                    ← Tu código
├── tests/
│   ├── e2e/               ← Tests web (Playwright)
│   └── mobile/            ← Tests móviles (no ejecutar aquí)
├── package.json
└── README.md
```

**Qué hacer en el servidor:**
- ✅ Programar
- ✅ Ejecutar `npm run dev`
- ✅ Ejecutar tests web: `npm run test:e2e`
- ❌ NO ejecutar `npm run test:mobile`

### En tu PC Local:

```
C:\proyectos\Bisonte-modificado/
├── android/
│   └── app/build/outputs/apk/debug/app-debug.apk
├── tests/mobile/
└── run-mobile-tests-local.bat ← USAR ESTE
```

**Qué hacer en tu PC:**
- ✅ Conectar dispositivo Android via USB
- ✅ `git pull` para obtener últimos cambios
- ✅ Ejecutar `.\run-mobile-tests-local.bat`
- ✅ Ver tests ejecutándose en tu dispositivo

---

## 📋 CHECKLIST: Primera Configuración Local

### En tu PC Local (solo una vez):

- [ ] **1. Instalar Git**
  ```powershell
  # Descargar desde: https://git-scm.com/
  git --version
  ```

- [ ] **2. Instalar Node.js**
  ```powershell
  # Descargar desde: https://nodejs.org/
  node --version
  ```

- [ ] **3. Instalar Android SDK**
  ```powershell
  # Descargar Android Studio o solo Platform Tools
  # https://developer.android.com/studio
  adb version
  ```

- [ ] **4. Instalar Java JDK**
  ```powershell
  # Descargar desde: https://www.oracle.com/java/technologies/downloads/
  java -version
  ```

- [ ] **5. Clonar Repositorio**
  ```powershell
  cd C:\proyectos
  git clone https://github.com/3000bisonte/Bisonte-modificado.git
  cd Bisonte-modificado
  ```

- [ ] **6. Instalar Dependencias**
  ```powershell
  npm install
  ```

- [ ] **7. Instalar Appium**
  ```powershell
  npm install -g appium
  appium driver install uiautomator2
  ```

- [ ] **8. Configurar Dispositivo Android**
  - Activar "Opciones de desarrollador"
  - Activar "Depuración USB"
  - Conectar via USB
  - Aceptar diálogo de autorización

- [ ] **9. Verificar Dispositivo**
  ```powershell
  adb devices
  # Debería mostrar tu dispositivo
  ```

- [ ] **10. Ejecutar Tests**
  ```powershell
  .\run-mobile-tests-local.bat
  ```

---

## 🎯 WORKFLOW DÍA A DÍA

### Cuando quieras probar nuevos cambios:

#### EN EL SERVIDOR:
```powershell
# 1. Hacer cambios en el código
# 2. Guardar archivos
# 3. Commit y push
git add .
git commit -m "fix: corregir login"
git push origin main
```

#### EN TU PC LOCAL:
```powershell
# 1. Actualizar código
cd C:\proyectos\Bisonte-modificado
git pull origin main

# 2. Conectar dispositivo Android (si no está conectado)

# 3. Ejecutar tests
.\run-mobile-tests-local.bat

# 4. Ver tests en tu dispositivo ✨
```

---

## 📊 COMPARACIÓN DE OPCIONES

| Aspecto | Opción 1:<br>PC Local | Opción 2:<br>BrowserStack |
|---------|---------------------|------------------------|
| **Costo** | 🆓 Gratis | 💰 $30-100/mes |
| **Setup inicial** | 🟡 30 minutos | 🟢 10 minutos |
| **Requiere dispositivo** | ✅ Sí (tu Android) | ❌ No |
| **Velocidad tests** | ⚡ Rápido (1-2 min) | 🐢 Lento (3-5 min) |
| **Realismo** | ⭐⭐⭐⭐⭐ Tu dispositivo real | ⭐⭐⭐⭐ Dispositivo cloud |
| **Ejecución desde** | PC local | Servidor remoto |
| **Complejidad** | 🟡 Media | 🟢 Baja |

**RECOMENDACIÓN:** Usa **Opción 1** (PC Local) si tienes dispositivo Android. Es gratis y más rápido.

---

## 🚨 ERROR QUE VISTE

```
ERROR: ECONNREFUSED when running "http://127.0.0.1:4723/wd/hub/session"
```

**Qué significa:**
- Appium se inició en el servidor
- Pero no pudo conectar con ningún dispositivo Android
- Porque el dispositivo está en tu PC, no en el servidor

**Solución:**
- NO ejecutar tests móviles en el servidor
- Ejecutar en tu PC local con el script: `.\run-mobile-tests-local.bat`

---

## 📞 NECESITAS AYUDA?

### Si tienes problemas configurando tu PC local:

1. **Lee:** `GUIA_TESTS_MOBILE.md` - Sección de troubleshooting
2. **Verifica:** Que ADB detecta tu dispositivo: `adb devices`
3. **Revisa:** Que Appium está instalado: `appium --version`
4. **Comprueba:** Que la APK existe en: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## ✅ RESUMEN

**LO QUE DEBES HACER:**

1. ✅ Continúa programando en el servidor (VS Code Remote)
2. ✅ Haz commit y push de tus cambios
3. ✅ En tu PC local:
   - Pull de los cambios
   - Conecta dispositivo Android
   - Ejecuta `.\run-mobile-tests-local.bat`
4. ✅ Disfruta viendo los tests en tu dispositivo 📱

**LO QUE NO DEBES HACER:**

- ❌ NO ejecutar `npm run test:mobile` en el servidor
- ❌ NO intentar conectar dispositivos USB al servidor remoto
- ❌ NO instalar ADB en el servidor (no lo necesitas)

---

**Tu próximo paso:** Configurar tu PC local siguiendo el checklist de arriba.

¿Necesitas ayuda con algún paso específico?
