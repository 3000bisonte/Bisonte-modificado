@echo off
echo ============================================================
echo  Limpieza de Build Android
echo ============================================================
echo.
echo Este script limpia los archivos compilados de Android
echo para forzar una recompilacion completa
echo.
echo ============================================================
echo.

echo [1/3] Limpiando carpeta build de Android...
if exist android\build (
    rmdir /s /q android\build
    echo [OK] Carpeta android\build eliminada
) else (
    echo [OK] android\build no existe
)

echo [2/3] Limpiando carpeta build de app...
if exist android\app\build (
    rmdir /s /q android\app\build
    echo [OK] Carpeta android\app\build eliminada
) else (
    echo [OK] android\app\build no existe
)

echo [3/3] Limpiando cache de Gradle...
if exist android\.gradle (
    rmdir /s /q android\.gradle
    echo [OK] Cache de Gradle eliminada
) else (
    echo [OK] Cache de Gradle no existe
)

echo.
echo ============================================================
echo  LIMPIEZA COMPLETADA
echo ============================================================
echo.
echo Ahora puedes ejecutar: .\run-mobile-tests-local.bat
echo.
pause
