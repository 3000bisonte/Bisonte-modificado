@echo off
REM ====================================================================
REM Script para ejecutar tests móviles desde PC LOCAL
REM (NO usar en servidor remoto)
REM ====================================================================

echo.
echo ============================================================
echo  Tests Moviles E2E - Ejecucion Local
echo ============================================================
echo.
echo  Este script debe ejecutarse en tu PC LOCAL, NO en servidor
echo  Requisitos:
echo    - Dispositivo Android conectado via USB
echo    - Depuracion USB activada
echo    - APK compilada
echo.
echo ============================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo [ERROR] No se encuentra package.json
    echo         Asegurate de estar en la raiz del proyecto
    pause
    exit /b 1
)

REM Paso 1: Verificar ADB
echo [1/5] Verificando ADB...
where adb >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] ADB NO encontrado
    echo     Instala Android SDK Platform Tools
    echo     https://developer.android.com/studio/releases/platform-tools
    pause
    exit /b 1
)
echo [OK] ADB disponible
echo.

REM Paso 2: Verificar dispositivo conectado
echo [2/5] Verificando dispositivo Android...
adb devices | findstr /R "device$" >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] NO hay dispositivo Android conectado
    echo.
    echo     Por favor:
    echo     1. Conecta tu dispositivo via USB
    echo     2. Activa "Depuracion USB"
    echo     3. Acepta el dialogo de autorizacion
    echo     4. Ejecuta: adb devices
    echo.
    pause
    exit /b 1
)
echo [OK] Dispositivo detectado:
adb devices
echo.

REM Paso 3: Verificar APK
echo [3/5] Verificando APK...
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo [!] APK no encontrada
    echo     Compilando APK...
    cd android
    call gradlew.bat assembleDebug
    cd ..
    
    if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
        echo [X] Error al compilar APK
        pause
        exit /b 1
    )
)
echo [OK] APK encontrada
dir android\app\build\outputs\apk\debug\app-debug.apk
echo.

REM Paso 4: Instalar APK en dispositivo
echo [4/5] Instalando APK en dispositivo...
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
if %errorlevel% equ 0 (
    echo [OK] APK instalada exitosamente
) else (
    echo [!] Error al instalar APK (puede que ya este instalada)
)
echo.

REM Paso 5: Verificar Appium
echo [5/5] Verificando Appium...
where appium >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Appium NO instalado globalmente
    echo     Instalando...
    npm install -g appium
    appium driver install uiautomator2
)
echo [OK] Appium disponible
echo.

REM Verificar si Appium ya esta corriendo
echo Verificando si Appium esta corriendo...
netstat -an | findstr "4723.*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Appium ya esta corriendo en puerto 4723
    set APPIUM_RUNNING=1
) else (
    echo [!] Appium NO esta corriendo
    echo     Iniciando Appium Server...
    start "Appium Server" cmd /k "appium --address localhost --port 4723 --relaxed-security"
    timeout /t 5 /nobreak >nul
    echo [OK] Appium Server iniciado en nueva ventana
    set APPIUM_RUNNING=0
)
echo.

REM Ejecutar tests
echo ============================================================
echo  Ejecutando Tests Moviles...
echo ============================================================
echo.
echo  Veras tu dispositivo ejecutando los tests automaticamente
echo  Los logs apareceran aqui en la terminal
echo.
echo ============================================================
echo.

REM Configurar variable de entorno para no auto-start Appium
set APPIUM_NO_START=true

npm run test:mobile

REM Resultado
echo.
echo ============================================================
echo  Tests Completados
echo ============================================================
echo.

if %APPIUM_RUNNING% equ 0 (
    echo [i] Appium Server sigue corriendo en otra ventana
    echo     Cierra la ventana manualmente cuando termines
)

echo.
pause
