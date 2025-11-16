# Script para redimensionar capturas de teléfono a formato de tableta
# Para Google Play Store

Add-Type -AssemblyName System.Drawing

Write-Host "🎨 Redimensionador de Capturas para Tabletas" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar carpeta de origen
$sourceFolder = Read-Host "Ingresa la ruta completa de la carpeta con las capturas de teléfono"

if (-not (Test-Path $sourceFolder)) {
    Write-Host "❌ Error: La carpeta no existe" -ForegroundColor Red
    exit
}

# Crear carpetas de destino
$tablet7Folder = Join-Path $sourceFolder "tablet-7inch"
$tablet10Folder = Join-Path $sourceFolder "tablet-10inch"

New-Item -ItemType Directory -Force -Path $tablet7Folder | Out-Null
New-Item -ItemType Directory -Force -Path $tablet10Folder | Out-Null

Write-Host "✅ Carpetas creadas:" -ForegroundColor Green
Write-Host "   📁 $tablet7Folder" -ForegroundColor Gray
Write-Host "   📁 $tablet10Folder" -ForegroundColor Gray
Write-Host ""

# Obtener archivos de imagen
$imageFiles = Get-ChildItem -Path $sourceFolder -Include *.png,*.jpg,*.jpeg -File

if ($imageFiles.Count -eq 0) {
    Write-Host "❌ No se encontraron imágenes PNG o JPG en la carpeta" -ForegroundColor Red
    exit
}

Write-Host "📱 Encontradas $($imageFiles.Count) capturas de teléfono" -ForegroundColor Yellow
Write-Host ""

$processedCount = 0

foreach ($file in $imageFiles) {
    Write-Host "🔄 Procesando: $($file.Name)" -ForegroundColor White
    
    try {
        # Cargar imagen original
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        
        # Determinar si es portrait o landscape
        $isPortrait = $img.Height -gt $img.Width
        
        # ============================================
        # TABLETA 7 PULGADAS
        # ============================================
        if ($isPortrait) {
            # Portrait: 800 x 1280
            $width7 = 800
            $height7 = 1280
        } else {
            # Landscape: 1280 x 800
            $width7 = 1280
            $height7 = 800
        }
        
        $newImg7 = New-Object System.Drawing.Bitmap($width7, $height7)
        $graphics7 = [System.Drawing.Graphics]::FromImage($newImg7)
        $graphics7.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics7.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics7.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics7.DrawImage($img, 0, 0, $width7, $height7)
        
        # Guardar con el mismo nombre
        $output7Path = Join-Path $tablet7Folder $file.Name
        $newImg7.Save($output7Path, [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics7.Dispose()
        $newImg7.Dispose()
        
        Write-Host "   ✓ Tableta 7'': $($width7)x$($height7)px" -ForegroundColor Green
        
        # ============================================
        # TABLETA 10 PULGADAS
        # ============================================
        if ($isPortrait) {
            # Portrait: 1200 x 1920
            $width10 = 1200
            $height10 = 1920
        } else {
            # Landscape: 1920 x 1200
            $width10 = 1920
            $height10 = 1200
        }
        
        $newImg10 = New-Object System.Drawing.Bitmap($width10, $height10)
        $graphics10 = [System.Drawing.Graphics]::FromImage($newImg10)
        $graphics10.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics10.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics10.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics10.DrawImage($img, 0, 0, $width10, $height10)
        
        # Guardar con el mismo nombre
        $output10Path = Join-Path $tablet10Folder $file.Name
        $newImg10.Save($output10Path, [System.Drawing.Imaging.ImageFormat]::Png)
        $graphics10.Dispose()
        $newImg10.Dispose()
        
        Write-Host "   ✓ Tableta 10'': $($width10)x$($height10)px" -ForegroundColor Green
        
        # Limpiar
        $img.Dispose()
        
        $processedCount++
        Write-Host ""
        
    } catch {
        Write-Host "   ❌ Error procesando $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor Yellow
Write-Host "   - Imágenes procesadas: $processedCount" -ForegroundColor White
Write-Host "   - Tableta 7'': $tablet7Folder" -ForegroundColor White
Write-Host "   - Tableta 10'': $tablet10Folder" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Ahora puedes subir las imágenes de cada carpeta a Google Play Console" -ForegroundColor Cyan
Write-Host ""

# Abrir carpetas en el explorador
Write-Host "¿Deseas abrir las carpetas en el explorador? (S/N): " -NoNewline
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Start-Process explorer.exe -ArgumentList $tablet7Folder
    Start-Process explorer.exe -ArgumentList $tablet10Folder
    Write-Host "✅ Carpetas abiertas" -ForegroundColor Green
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
