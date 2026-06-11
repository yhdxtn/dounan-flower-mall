param(
  [string]$MysqlExe = "D:\JAVA\MySQL\mysql-8.0.46-winx64\bin\mysql.exe",
  [string]$User = "root"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $MysqlExe)) {
  throw "mysql.exe not found: $MysqlExe"
}

Set-Location "D:\github\dounan-flower-mall"
Write-Host "You will be asked for the MySQL password twice."
& $MysqlExe -u$User -p -e "source D:/github/dounan-flower-mall/database/schema.sql"
& $MysqlExe -u$User -p -e "source D:/github/dounan-flower-mall/database/seed.sql"
Write-Host "Database initialized: dounan_flower_mall"
