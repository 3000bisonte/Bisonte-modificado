# Script para Preparar Build de Play Store
# Bisonte Logística - Versión 1.0.5

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   BISONTE LOGÍSTICA - PLAY STORE   " -ForegroundColor Cyan
Write-Host "   Preparación de Build v1.0.5      " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Paso 1: Verificando configuración..." -ForegroundColor Yellow

# Verificar Node.js
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no encontrado. Instálalo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar Java
$javaVersion = java -version 2>&1 | Select-String "version"
if ($javaVersion) {
    Write-Host "✅ Java detectado: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Java no encontrado. Se necesita para firmar el AAB" -ForegroundColor Yellow
    Write-Host "   Descarga desde: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
}

# Verificar archivo de configuración
if (Test-Path "capacitor.config.json") {
    Write-Host "✅ capacitor.config.json encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ capacitor.config.json no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Paso 2: Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencias instaladas" -ForegroundColor Green

Write-Host ""
Write-Host "🏗️  Paso 3: Compilando aplicación web..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en la compilación" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Compilación exitosa" -ForegroundColor Green

Write-Host ""
Write-Host "📱 Paso 4: Sincronizando con Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error sincronizando Capacitor" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Sincronización completada" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ✅ PREPARACIÓN COMPLETADA         " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  GENERAR KEYSTORE (si no lo tienes):" -ForegroundColor Cyan
Write-Host "   cd android\app" -ForegroundColor White
Write-Host "   keytool -genkeypair -v -storetype PKCS12 -keystore bisonte-release-key.keystore -alias bisonte-key -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  CONFIGURAR gradle.properties:" -ForegroundColor Cyan
Write-Host "   Editar: android\gradle.properties" -ForegroundColor White
Write-Host "   Agregar:" -ForegroundColor White
Write-Host "   MYAPP_UPLOAD_STORE_FILE=bisonte-release-key.keystore" -ForegroundColor Gray
Write-Host "   MYAPP_UPLOAD_STORE_PASSWORD=tu_password" -ForegroundColor Gray
Write-Host "   MYAPP_UPLOAD_KEY_ALIAS=bisonte-key" -ForegroundColor Gray
Write-Host "   MYAPP_UPLOAD_KEY_PASSWORD=tu_password" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  GENERAR AAB con Android Studio:" -ForegroundColor Cyan
Write-Host "   npx cap open android" -ForegroundColor White
Write-Host "   Build → Generate Signed Bundle / APK → Android App Bundle" -ForegroundColor White
Write-Host ""

Write-Host "   O desde terminal:" -ForegroundColor Cyan
Write-Host "   cd android" -ForegroundColor White
Write-Host "   .\gradlew bundleRelease" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  SUBIR A PLAY STORE:" -ForegroundColor Cyan
Write-Host "   https://play.google.com/console" -ForegroundColor White
Write-Host "   Archivo: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
Write-Host ""

Write-Host "📖 Consulta GUIA_PLAY_STORE_COMPLETA.md para más detalles" -ForegroundColor Yellow
Write-Host ""
Write-Host "¡Éxito con tu publicación! 🚀" -ForegroundColor Green
