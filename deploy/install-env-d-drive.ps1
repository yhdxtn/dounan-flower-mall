param(
  [string]$NodeZipUrl = "https://nodejs.org/dist/v20.15.1/node-v20.15.1-win-x64.zip",
  [string]$NginxZipUrl = "https://nginx.org/download/nginx-1.26.1.zip"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "D:\dev" | Out-Null
New-Item -ItemType Directory -Force -Path "D:\dev\downloads" | Out-Null

function Expand-ZipToFolder {
  param(
    [string]$Url,
    [string]$ZipPath,
    [string]$TargetParent,
    [string]$FinalPath
  )

  if (!(Test-Path $ZipPath)) {
    Invoke-WebRequest -Uri $Url -OutFile $ZipPath
  }

  $temp = Join-Path $TargetParent "_extract_temp"
  if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
  New-Item -ItemType Directory -Force -Path $temp | Out-Null
  Expand-Archive -Path $ZipPath -DestinationPath $temp -Force
  $inner = Get-ChildItem $temp | Select-Object -First 1
  if (Test-Path $FinalPath) { Remove-Item -Recurse -Force $FinalPath }
  Move-Item -Path $inner.FullName -Destination $FinalPath
  Remove-Item -Recurse -Force $temp
}

Expand-ZipToFolder `
  -Url $NodeZipUrl `
  -ZipPath "D:\dev\downloads\node.zip" `
  -TargetParent "D:\dev" `
  -FinalPath "D:\dev\node"

Expand-ZipToFolder `
  -Url $NginxZipUrl `
  -ZipPath "D:\dev\downloads\nginx.zip" `
  -TargetParent "D:\dev" `
  -FinalPath "D:\dev\nginx"

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathsToAdd = @("D:\dev\node", "D:\dev\nginx")
foreach ($path in $pathsToAdd) {
  if ($userPath -notlike "*$path*") {
    $userPath = "$userPath;$path"
  }
}
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")

Write-Host "Node and Nginx installed under D:\dev."
Write-Host "Open a new PowerShell window, then run: node -v; npm -v; nginx -v"
