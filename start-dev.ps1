param(
  [switch]$Stop
)

[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
chcp 65001 > $null

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $projectRoot ".dev-pids.json"

function Resolve-NpmCmd {
  $candidates = @(
    (Join-Path $env:ProgramFiles "nodejs\npm.cmd"),
    (Join-Path ${env:ProgramFiles(x86)} "nodejs\npm.cmd"),
    (Join-Path $env:LOCALAPPDATA "Programs\nodejs\npm.cmd")
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  throw "No se encontró npm.cmd. Verifica instalación de Node.js."
}

function Start-DevProcess {
  param(
    [string]$Name,
    [string]$WorkingDir,
    [string]$NpmCmd,
    [string]$Script
  )

  $proc = Start-Process -FilePath $NpmCmd `
    -ArgumentList "run", $Script `
    -WorkingDirectory $WorkingDir `
    -PassThru `
    -WindowStyle Normal

  return [PSCustomObject]@{
    name = $Name
    pid = $proc.Id
    dir = $WorkingDir
    script = $Script
  }
}

function Stop-DevProcesses {
  param([string]$PidFilePath)

  if (-not (Test-Path $PidFilePath)) {
    Write-Host "No hay procesos registrados en .dev-pids.json"
    return
  }

  $content = Get-Content $PidFilePath -Raw
  if ([string]::IsNullOrWhiteSpace($content)) {
    Remove-Item $PidFilePath -Force -ErrorAction SilentlyContinue
    Write-Host "Archivo de PIDs vacío, limpiado."
    return
  }

  $processes = $content | ConvertFrom-Json

  foreach ($proc in $processes) {
    try {
      Stop-Process -Id $proc.pid -Force -ErrorAction Stop
      Write-Host "Detenido $($proc.name) (PID $($proc.pid))"
    }
    catch {
      Write-Host "No se pudo detener PID $($proc.pid) (quizá ya no existe)."
    }
  }

  Remove-Item $PidFilePath -Force -ErrorAction SilentlyContinue
  Write-Host "Procesos de desarrollo detenidos."
}

if ($Stop) {
  Stop-DevProcesses -PidFilePath $pidFile
  exit 0
}

try {
  $npmCmd = Resolve-NpmCmd
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}

# Asegurar que node.exe está en PATH (necesario cuando PS hereda PATH sin nodejs)
$nodejsDir = Split-Path $npmCmd -Parent
if ($env:PATH -notlike "*$nodejsDir*") {
  $env:PATH = "$nodejsDir;" + $env:PATH
}

$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

if (-not (Test-Path $backendDir)) {
  Write-Error "No existe carpeta backend en $backendDir"
  exit 1
}

if (-not (Test-Path $frontendDir)) {
  Write-Error "No existe carpeta frontend en $frontendDir"
  exit 1
}

$started = @()

try {
  $started += Start-DevProcess -Name "backend" -WorkingDir $backendDir -NpmCmd $npmCmd -Script "dev"
  $started += Start-DevProcess -Name "frontend" -WorkingDir $frontendDir -NpmCmd $npmCmd -Script "dev"

  $started | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8

  Write-Host "Servicios iniciados:"
  foreach ($svc in $started) {
    Write-Host "- $($svc.name) | PID $($svc.pid) | $($svc.dir)"
  }

  Write-Host ""
  Write-Host "Para detener ambos:"
  Write-Host "powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Stop"
}
catch {
  Write-Error "Error iniciando servicios: $($_.Exception.Message)"
  if ($started.Count -gt 0) {
    foreach ($svc in $started) {
      Stop-Process -Id $svc.pid -Force -ErrorAction SilentlyContinue
    }
  }
  exit 1
}
