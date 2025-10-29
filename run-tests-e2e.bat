@echo off
echo ========================================
echo Tests E2E - Sistema de Prevención de Duplicación
echo ========================================
echo.

REM Cargar variables de entorno de prueba
if exist .env.test.local (
    echo ✅ Cargando .env.test.local...
    for /f "usebackq delims=" %%a in (".env.test.local") do (
        set "%%a"
    )
) else (
    echo ❌ ERROR: No se encontró .env.test.local
    echo.
    echo Por favor, crea el archivo .env.test.local con:
    echo   - TEST_USER_EMAIL
    echo   - TEST_USER_PASSWORD
    echo   - Credenciales de MercadoPago en modo TEST
    echo.
    pause
    exit /b 1
)

echo.
echo 📋 Verificando configuración...
echo   - Usuario de prueba: %TEST_USER_EMAIL%
echo   - URL base: %BASE_URL%
echo   - MercadoPago: Modo TEST (Sandbox)
echo.

REM Verificar que el servidor Next.js NO esté corriendo
echo 🔍 Verificando servidor Next.js...
netstat -an | find "3000" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ⚠️  ADVERTENCIA: El servidor Next.js ya está corriendo en el puerto 3000
    echo    Playwright lo usará en lugar de iniciar uno nuevo.
    echo.
) else (
    echo ✅ Puerto 3000 disponible. Playwright iniciará el servidor.
    echo.
)

echo 🚀 Iniciando tests E2E...
echo.

REM Ejecutar tests
npx playwright test --headed

echo.
echo ========================================
echo Tests completados
echo ========================================
echo.
echo Para ver el informe HTML, ejecuta:
echo   npx playwright show-report
echo.
pause
