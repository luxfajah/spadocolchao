$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logsDir = Join-Path $projectRoot "tmp"
$stdoutLog = Join-Path $logsDir "shortcut-launch.log"
$stderrLog = Join-Path $logsDir "shortcut-launch.err.log"
$launcherLog = Join-Path $logsDir "shortcut-orchestrator.log"
$healthUrl = "http://127.0.0.1:3000/login"
$browserUrl = "http://localhost:3000/login"
$startTimeoutSeconds = 240
$pollIntervalSeconds = 3

if (-not (Test-Path -LiteralPath $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir | Out-Null
}

function Write-LauncherLog {
  param(
    [string]$Message
  )

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -LiteralPath $launcherLog -Value "[$timestamp] $Message"
}

function Test-SystemReady {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 8
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
  } catch {
    return $false
  }
}

function Get-ProjectServerProcess {
  return Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -eq "node.exe" -and
      $_.CommandLine -like "*Spa do Colchão*" -and
      $_.CommandLine -like "*next*"
    } |
    Select-Object -First 1
}

function Start-SystemHidden {
  $existingProcess = Get-ProjectServerProcess
  if ($existingProcess) {
    Write-LauncherLog "Servidor do projeto ja esta em execucao; aguardando a porta 3000 responder."
    return
  }

  $command = "npm.cmd run dev 1>> `"$stdoutLog`" 2>> `"$stderrLog`""
  Write-LauncherLog "Servidor offline; iniciando npm run dev em segundo plano."
  Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", $command `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden | Out-Null
}

if (-not (Test-SystemReady)) {
  Start-SystemHidden

  $deadline = (Get-Date).AddSeconds($startTimeoutSeconds)
  Write-LauncherLog "Aguardando o sistema ficar pronto em http://localhost:3000/login."
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $pollIntervalSeconds
    if (Test-SystemReady) {
      Write-LauncherLog "Sistema respondeu com sucesso na porta 3000."
      break
    }
  }
} else {
  Write-LauncherLog "Sistema ja estava online na porta 3000."
}

if (Test-SystemReady) {
  Write-LauncherLog "Abrindo o navegador padrao."
  Start-Process $browserUrl | Out-Null
} else {
  Write-LauncherLog "Tempo limite atingido antes do sistema responder."
}
