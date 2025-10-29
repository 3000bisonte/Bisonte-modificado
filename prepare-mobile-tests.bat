@echo off
echo ========================================
echo Preparacion para Tests Moviles E2E
echo ========================================
echo.

REM Step 1: Verificar instalaciones
echo [1/6] Verificando instalaciones...
echo.

REM Java
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo   [X] Java NO instalado
    echo   Descarga desde: https://www.oracle.com/java/technologies/downloads/
    set HAS_ERRORS=1
) else (
    echo   [OK] Java instalado
    java -version
)
echo.

REM Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo   [X] Node.js NO instalado
    set HAS_ERRORS=1
) else (
    echo   [OK] Node.js instalado
    node --version
)
echo.

REM ADB (Android Debug Bridge)
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo   [X] ADB NO encontrado
    echo   Instala Android SDK Platform Tools
    set HAS_ERRORS=1
) else (
    echo   [OK] ADB disponible
    adb version
)
echo.

REM Appium
where appium >nul 2>nul
if %errorlevel% neq 0 (
    echo   [!] Appium NO instalado globalmente
    echo   Instalando Appium...
    npm install -g appium
    echo   Instalando driver UiAutomator2...
    appium driver install uiautomator2
) else (
    echo   [OK] Appium instalado
    appium --version
)
echo.

REM Step 2: Verificar dispositivo conectado
echo [2/6] Verificando dispositivo Android...
echo.

adb devices | findstr /R "device$" >nul 2>nul
if %errorlevel% neq 0 (
    echo   [!] ADVERTENCIA: No se detectaron dispositivos Android
    echo   Por favor:
    echo   1. Conecta tu dispositivo via USB
    echo   2. Activa "Depuracion USB" en el dispositivo
    echo   3. Acepta el prompt de autorizacion en el dispositivo
    echo.
    echo   O inicia un emulador desde Android Studio
    echo.
    set HAS_DEVICE=0
) else (
    echo   [OK] Dispositivo detectado:
    adb devices
    set HAS_DEVICE=1
)
echo.

REM Step 3: Compilar APK de debug
echo [3/6] Compilando APK de debug...
echo.

if not exist "android\app\build.gradle" (
    echo   [!] Proyecto Android no encontrado
    echo   Sincronizando con Capacitor...
    npx cap sync android
)

echo   Compilando APK...
cd android
call gradlew.bat assembleDebug
cd ..

if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo   [OK] APK compilada exitosamente
    dir android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo   [X] Error al compilar APK
    set HAS_ERRORS=1
)
echo.

REM Step 4: Instalar APK en dispositivo
if "%HAS_DEVICE%"=="1" (
    echo [4/6] Instalando APK en dispositivo...
    echo.
    adb install -r android\app\build\outputs\apk\debug\app-debug.apk
    if %errorlevel% equ 0 (
        echo   [OK] APK instalada
    ) else (
        echo   [!] Error al instalar APK
    )
) else (
    echo [4/6] Saltando instalacion (no hay dispositivo)
)
echo.

REM Step 5: Verificar usuario de prueba
echo [5/6] Verificando usuario de prueba...
echo.
echo   Usuario requerido:
echo   Email: test@bisontelogistica.com
echo   Password: Test123456!
echo.
echo   Si no existe, crealo desde:
echo   https://www.bisonteapp.com/register
echo.

REM Step 6: Iniciar Appium Server
echo [6/6] Iniciando Appium Server...
echo.

REM Verificar si Appium ya esta corriendo
netstat -an | findstr "4723.*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo   [OK] Appium Server ya esta corriendo en puerto 4723
) else (
    echo   [!] Appium Server NO esta corriendo
    echo.
    echo   Iniciando Appium Server...
    echo   (Se abrira en una nueva ventana)
    echo.
    start "Appium Server" cmd /k "appium --address 127.0.0.1 --port 4723 --relaxed-security"
    timeout /t 5 /nobreak >nul
    echo   [OK] Appium Server iniciado
)
echo.

REM Resumen
echo ========================================
echo Resumen
echo ========================================
echo.

if defined HAS_ERRORS (
    echo [!] Hay errores que requieren atencion
    echo     Revisa los mensajes arriba
    echo.
) else (
    echo [OK] Preparacion completada exitosamente!
    echo.
    echo Ahora puedes ejecutar los tests:
    echo   npm run test:mobile
    echo.
)

echo Presiona cualquier tecla para continuar...
pause >nul
