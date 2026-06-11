$ErrorActionPreference = "Stop"

if (!(Test-Path "D:\dev\nginx\nginx.exe")) {
  throw "Nginx not found at D:\dev\nginx. Run deploy\install-env-d-drive.ps1 first."
}

Copy-Item "D:\github\dounan-flower-mall\deploy\nginx.conf" "D:\dev\nginx\conf\nginx.conf" -Force
Set-Location "D:\dev\nginx"

$running = Get-Process nginx -ErrorAction SilentlyContinue
if ($running) {
  .\nginx.exe -s reload
  Write-Host "Nginx config reloaded: http://localhost:8080"
} else {
  Start-Process -FilePath "D:\dev\nginx\nginx.exe" -WorkingDirectory "D:\dev\nginx" -WindowStyle Hidden
  Write-Host "Nginx started: http://localhost:8080"
}
