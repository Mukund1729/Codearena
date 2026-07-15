$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$services = @(
  @{ Name = 'API Gateway'; Path = 'services/api-gateway'; Command = 'npm run dev' },
  @{ Name = 'Submission Service'; Path = 'services/submission-service'; Command = 'npm run dev' },
  @{ Name = 'WebSocket Service'; Path = 'services/websocket-service'; Command = 'npm run dev' },
  @{ Name = 'AI Review Service'; Path = 'services/ai-review-service'; Command = 'npm run dev' },
  @{ Name = 'Problem Service'; Path = 'services/problem-service'; Command = 'mvn spring-boot:run' },
  @{ Name = 'Execution Service'; Path = 'services/execution-service'; Command = 'mvn spring-boot:run' },
  @{ Name = 'Contest Service'; Path = 'services/contest-service'; Command = 'mvn spring-boot:run' },
  @{ Name = 'Frontend'; Path = 'frontend'; Command = 'npm run dev' }
)

$pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwshCommand) {
  $shellPath = $pwshCommand.Source
} else {
  $powershellCommand = Get-Command powershell -ErrorAction SilentlyContinue
  if ($powershellCommand) {
    $shellPath = $powershellCommand.Source
  } else {
    $shellPath = $null
  }
}

foreach ($service in $services) {
  $fullPath = Join-Path $root $service.Path
  if (-not (Test-Path $fullPath)) {
    Write-Host "Skipping $($service.Name): missing path $fullPath" -ForegroundColor Yellow
    continue
  }

  if (-not $shellPath) {
    Write-Host "Unable to locate pwsh or powershell to launch services." -ForegroundColor Red
    break
  }

  Start-Process $shellPath -ArgumentList '-NoExit', '-Command', "Set-Location '$fullPath'; Write-Host 'Starting $($service.Name)'; $($service.Command)" -WorkingDirectory $root
}

Write-Host 'All services launched. Check each terminal window for startup logs.' -ForegroundColor Green
