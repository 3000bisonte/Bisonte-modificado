@echo off
REM Script para ejecutar diagnósticos de autenticación en Windows
REM Uso: diagnostics-windows.bat [url]

echo.
echo 🔍 Ejecutando diagnosticos de autenticacion Bisonte...
echo.

REM Configurar URL de producción
if "%1"=="" (
    set PRODUCTION_URL=https://bisonteapp.com
    echo 🌐 Usando URL por defecto: https://bisonteapp.com
) else (
    set PRODUCTION_URL=%1
    echo 🌐 Usando URL especificada: %1
)

echo.
echo ========================================
echo 1. ANALISIS COMPLETO LOCAL
echo ========================================
call npm run diagnostics:analyze

echo.
echo ========================================  
echo 2. TEST DE PRODUCCION
echo ========================================
set PRODUCTION_URL=%PRODUCTION_URL% && call npm run diagnostics:production

echo.
echo ========================================
echo 3. TEST DE AUTENTICACION EN VIVO  
echo ========================================
node scripts/diagnostics/auth/run-simple.js %PRODUCTION_URL%

echo.
echo ✅ Diagnosticos completados
echo 📋 Revisa los archivos generados para mas detalles:
echo    - AUTH_DIAGNOSTIC_REPORT.md
echo    - PRODUCTION_AUTH_TROUBLESHOOTING.md
echo.
pause