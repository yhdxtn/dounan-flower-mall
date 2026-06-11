$ErrorActionPreference = "Stop"
$env:Path = "D:\dev\node;D:\dev\node\node_modules\.bin;" + $env:Path

Set-Location "D:\github\dounan-flower-mall"

if (!(Test-Path "backend\.env")) {
  Copy-Item "backend\.env.example" "backend\.env"
  Write-Host "Created backend\.env. Please edit DB_PASSWORD if your MySQL password is not 123456."
}

npm run dev
