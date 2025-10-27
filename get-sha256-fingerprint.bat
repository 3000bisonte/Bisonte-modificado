@echo off
echo ======================================
echo OBTENIENDO SHA-256 FINGERPRINT
echo ======================================
echo.

REM Buscar keytool en las ubicaciones comunes
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
    echo.
    pause
    exit /b 1
)

echo Usando keytool: %KEYTOOL%
echo.

REM Debug keystore (para desarrollo)
echo 1. DEBUG KEYSTORE (Desarrollo/Testing):
echo ----------------------------------------
set "DEBUG_KEYSTORE=%USERPROFILE%\.android\debug.keystore"
if exist "%DEBUG_KEYSTORE%" (
    echo Ubicacion: %DEBUG_KEYSTORE%
    echo.
    "%KEYTOOL%" -list -v -keystore "%DEBUG_KEYSTORE%" -alias androiddebugkey -storepass android -keypass android | findstr /C:"SHA256"
    echo.
) else (
    echo No se encontro debug.keystore
    echo.
)

REM Release keystore (buscar en el proyecto)
echo 2. RELEASE KEYSTORE (Produccion):
echo ----------------------------------------
set "RELEASE_KEYSTORE=android\app\bisonte-release.keystore"
if exist "%RELEASE_KEYSTORE%" (
    echo Ubicacion: %RELEASE_KEYSTORE%
    echo.
    echo Ingresa la contrasena del keystore:
    "%KEYTOOL%" -list -v -keystore "%RELEASE_KEYSTORE%" | findstr /C:"SHA256"
    echo.
) else (
    echo No se encontro keystore de release en android\app\
    echo.
    echo Si tienes un keystore de release, ejecuta manualmente:
    echo keytool -list -v -keystore RUTA_A_TU_KEYSTORE -alias TU_ALIAS
    echo.
)

echo.
echo INSTRUCCIONES:
echo --------------
echo 1. Copia el valor SHA256 que aparece arriba
echo 2. Abre: public\.well-known\assetlinks.json
echo 3. Reemplaza "REEMPLAZAR_CON_TU_SHA256_DE_KEYSTORE" con el valor copiado
echo 4. El formato debe ser: "XX:XX:XX:XX:..." (con dos puntos entre cada par)
echo.
pause
