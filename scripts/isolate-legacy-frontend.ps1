Param(
  [switch]$DryRun
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$legacyPath = Join-Path $projectRoot 'frontend'
$isolatedPath = Join-Path $projectRoot '_legacy_frontend'

if (-not (Test-Path $legacyPath)) {
  Write-Host "No 'frontend' folder found. Nothing to do." -ForegroundColor Green
  exit 0
}

if (Test-Path $isolatedPath) {
  Write-Host "'_legacy_frontend' already exists. Consider removing or archiving one of them." -ForegroundColor Yellow
  exit 0
}

Write-Host "Will rename 'frontend' -> '_legacy_frontend' to avoid App Router collisions."
if ($DryRun) { Write-Host "DryRun: not renaming."; exit 0 }

Rename-Item -Path $legacyPath -NewName '_legacy_frontend'
Write-Host "Done."
