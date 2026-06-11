$ErrorActionPreference = "Stop"
$env:Path = "D:\dev\node;D:\dev\node\node_modules\.bin;" + $env:Path

Set-Location "D:\github\dounan-flower-mall"

if (!(Test-Path "backend\.env")) {
  Copy-Item "backend\.env.example" "backend\.env"
  Write-Host "Created backend\.env. Please edit DB_PASSWORD before starting production."
}

New-Item -ItemType Directory -Force -Path "D:\github\dounan-flower-mall\logs" | Out-Null
npm run build
pm2.cmd start deploy\pm2.ecosystem.config.cjs
pm2.cmd save

Write-Host "Backend is managed by PM2. Run 'pm2.cmd logs dounan-api' to view logs."
