@echo off
echo ======================================
echo CREAR KEYSTORE DE RELEASE
echo ======================================
echo.

REM Buscar keytool
set "KEYTOOL="
if exist "%JAVA_HOME%\bin\keytool.exe" (
    set "KEYTOOL=%JAVA_HOME%\bin\keytool.exe"
) else if exist "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" (
    set "KEYTOOL=C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
) else if exist "C:\Program Files\Java\jdk*\bin\keytool.exe" (
    for /d %%i in ("C:\Program Files\Java\jdk*") do (
        set "KEYTOOL=%%i\bin\keytool.exe"
        goto found
    )
)

:found
if "%KEYTOOL%"=="" (
    echo ERROR: No se encontro keytool.
    echo Asegurate de tener Java JDK o Android Studio instalado.
    pause
    exit /b 1
)

echo Usando keytool: %KEYTOOL%
echo.

set "KEYSTORE_PATH=android\app\bisonte-release-key.jks"
set "ALIAS=bisonteRelease"
set "PASSWORD=BisonteApp2024!"

echo VERIFICANDO SI YA EXISTE EL KEYSTORE...
if exist "%KEYSTORE_PATH%" (
    echo.
    echo ========================================
    echo EL KEYSTORE YA EXISTE!
    echo ========================================
    echo Ubicacion: %KEYSTORE_PATH%
    echo.
    echo Obteniendo SHA-256 fingerprint...
    echo.
    "%KEYTOOL%" -list -v -keystore "%KEYSTORE_PATH%" -alias %ALIAS% -storepass %PASSWORD% -keypass %PASSWORD% | findstr /C:"SHA256"
    echo.
    echo COPIA EL SHA256 DE ARRIBA y actualizalo en:
    echo public\.well-known\assetlinks.json
    echo.
    echo Busca: "AGREGAR_SHA256_DE_RELEASE_KEYSTORE_AQUI"
    echo Reemplaza con el valor SHA256 copiado
    echo.
    pause
    exit /b 0
)

echo El keystore NO existe. Creando nuevo keystore...
echo.

REM Crear directorio si no existe
if not exist "android\app" mkdir "android\app"

echo CREANDO KEYSTORE DE RELEASE...
echo.
echo Datos que se usaran:
echo   - Archivo: %KEYSTORE_PATH%
echo   - Alias: %ALIAS%
echo   - Password: %PASSWORD%
echo   - Nombre: Bisonte Logistica
echo   - Organizacion: Bisonte App
echo   - Ciudad: Bogota
echo   - Pais: CO
echo.

"%KEYTOOL%" -genkeypair -v ^
  -storetype JKS ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000 ^
  -storepass %PASSWORD% ^
  -keypass %PASSWORD% ^
  -alias %ALIAS% ^
  -keystore "%KEYSTORE_PATH%" ^
  -dname "CN=Bisonte Logistica, O=Bisonte App, L=Bogota, C=CO"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo KEYSTORE CREADO EXITOSAMENTE!
    echo ========================================
    echo Ubicacion: %KEYSTORE_PATH%
    echo.
    echo Obteniendo SHA-256 fingerprint...
    echo.
    "%KEYTOOL%" -list -v -keystore "%KEYSTORE_PATH%" -alias %ALIAS% -storepass %PASSWORD% -keypass %PASSWORD% | findstr /C:"SHA256"
    echo.
    echo INSTRUCCIONES:
    echo 1. COPIA EL SHA256 DE ARRIBA
    echo 2. Abre: public\.well-known\assetlinks.json
    echo 3. Busca: "AGREGAR_SHA256_DE_RELEASE_KEYSTORE_AQUI"
    echo 4. Reemplaza con el valor SHA256 copiado
    echo 5. Guarda el archivo y haz commit
    echo.
    echo IMPORTANTE: Guarda este keystore en un lugar seguro!
    echo Si lo pierdes, no podras actualizar la app en Google Play.
    echo.
) else (
    echo.
    echo ERROR: No se pudo crear el keystore
    echo.
)

pause
