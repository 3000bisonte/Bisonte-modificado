Param(
  [switch]$DryRun
)

# Removes .js files when a .ts or .tsx version exists next to them in src/app/** (routes and pages)
Write-Host "Scanning for duplicate JS files..."

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$appPath = Join-Path $projectRoot 'src\app'

$duplicates = @()

Get-ChildItem -Path $appPath -Recurse -File -Include route.js, page.js | ForEach-Object {
  $jsFile = $_.FullName
  $tsFile = $jsFile -replace '\.js$', '.ts'
  $tsxFile = $jsFile -replace '\.js$', '.tsx'
  if (Test-Path $tsFile -or Test-Path $tsxFile) {
    $duplicates += $jsFile
  }
}

if ($duplicates.Count -eq 0) {
  Write-Host "No duplicate .js files found." -ForegroundColor Green
  exit 0
}

Write-Host "Found $($duplicates.Count) duplicate .js files:"
$duplicates | ForEach-Object { Write-Host " - $_" }

if ($DryRun) {
  Write-Host "DryRun: not deleting files." -ForegroundColor Yellow
  exit 0
}

Write-Host "Deleting duplicate .js files..." -ForegroundColor Yellow
$duplicates | ForEach-Object {
  Remove-Item -Force $_
}

Write-Host "Done."
