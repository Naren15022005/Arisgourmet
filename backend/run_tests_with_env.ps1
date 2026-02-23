Set-StrictMode -Version Latest
Set-Location "$PSScriptRoot"
$env:DB_USER = 'db_admin'
$env:DB_PASSWORD = 'Secr3t'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3306'
$env:DB_NAME = 'arisgourmet'
$env:REDIS_URL = 'redis://127.0.0.1:6379'
Write-Host "Running tests in $PWD using DB $env:DB_USER@$env:DB_HOST:$env:DB_PORT"
npm test --silent
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
