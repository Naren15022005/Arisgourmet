Set-StrictMode -Version Latest
Set-Location "$PSScriptRoot"
$env:DB_USER = 'db_admin'
$env:DB_PASSWORD = 'Secr3t'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_NAME = 'arisgourmet'
Write-Host "Running migrations in $PWD using user $env:DB_USER@$env:DB_HOST:$env:DB_PORT"
npm run migrate:run
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
