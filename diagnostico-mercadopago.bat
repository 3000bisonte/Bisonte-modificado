@echo off
echo.
echo ====================================
echo   DIAGNOSTICO MERCADO PAGO
echo ====================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado
    echo Por favor instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

echo [1/5] Verificando Node.js...
node --version
echo.

echo [2/5] Verificando archivo .env.local...
if exist ".env.local" (
    echo [OK] Archivo .env.local encontrado
) else (
    echo [ERROR] Archivo .env.local NO encontrado
    echo Crea el archivo .env.local en la raiz del proyecto
    pause
    exit /b 1
)
echo.

echo [3/5] Verificando variables de entorno...
node verify-mercadopago.js
echo.

echo [4/5] Verificando endpoint de pagos...
echo Iniciando servidor temporalmente...
echo NOTA: Si el servidor ya esta corriendo, ignora este paso
echo.
timeout /t 3 >nul

REM Hacer una petición GET al endpoint
curl -s http://localhost:3000/api/mercadopago/process-payment
echo.
echo.

echo [5/5] Verificacion completa
echo.
echo ====================================
echo   PROXIMOS PASOS
echo ====================================
echo.
echo 1. Si ves errores arriba, lee: SOLUCION_ERROR_MERCADOPAGO.md
echo 2. Si todo esta OK, reinicia el servidor:
echo    - Detener: Ctrl + C en la terminal del servidor
echo    - Iniciar: npm run dev
echo 3. Prueba el pago con una tarjeta de prueba
echo.
echo ====================================
echo.

pause
