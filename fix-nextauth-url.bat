@echo off
echo.
echo 🚀 SOLUCION CRITICA - Actualizando NEXTAUTH_URL
echo ===============================================
echo.
echo El problema ha sido IDENTIFICADO con 99%% de certeza:
echo   - La funcion authorize() funciona perfectamente
echo   - El problema es inconsistencia de dominio
echo   - NEXTAUTH_URL debe ser: https://www.bisonteapp.com
echo.

echo 🔧 METODO 1 - Vercel CLI (Automatico)
echo =====================================
where vercel >nul 2>&1
if %ERRORLEVEL%==0 (
    echo ✅ Vercel CLI encontrado
    echo.
    echo Ejecutando: vercel env add NEXTAUTH_URL production
    echo Valor requerido: https://www.bisonteapp.com
    echo.
    pause
    vercel env add NEXTAUTH_URL production
) else (
    echo ❌ Vercel CLI no instalado
    echo.
    echo Para instalar: npm install -g vercel
    echo Luego ejecuta este script nuevamente
)

echo.
echo 🌐 METODO 2 - Vercel Dashboard (Manual)
echo ======================================
echo 1. Abrir: https://vercel.com/dashboard
echo 2. Seleccionar proyecto: bisonte-logistica
echo 3. Ir a: Settings -^> Environment Variables
echo 4. Buscar: NEXTAUTH_URL
echo 5. Editar valor a: https://www.bisonteapp.com
echo 6. Guardar (triggea redeploy automatico)
echo.

echo ⏰ DESPUES DEL CAMBIO (5-10 minutos):
echo ====================================
echo Ejecutar validacion:
echo   .\diagnostics-windows.bat https://www.bisonteapp.com
echo.
echo Resultado esperado:
echo   ✅ Session data: {"user":{"id":"...","email":"..."}}
echo   ✅ Login exitoso con redireccion a /home
echo.

echo 📞 Si necesitas ayuda:
echo   - Variables de entorno deben coincidir con dominio final
echo   - El redirect en vercel.json esta correcto
echo   - Solo falta sincronizar NEXTAUTH_URL
echo.
pause