param(
    [Parameter(Mandatory=$true)][string]$DbUser,
    [Parameter(Mandatory=$true)][string]$DbPassword,
    [string]$DbHost = 'localhost',
    [string]$DbPort = '3306',
    [string]$DbName = 'arisgourmet',
    [switch]$Backup
)

Write-Host "Run canonical migrations (non-interactive)"

if ($Backup) {
    if (-not (Test-Path ..\backups)) { New-Item -ItemType Directory -Path ..\backups | Out-Null }
    $backupPath = "..\backups\pre_migration_$((Get-Date).ToString('yyyyMMdd_HHmmss')).sql"
    if (Get-Command mysqldump -ErrorAction SilentlyContinue) {
        Write-Host "Running mysqldump backup to $backupPath"
        & mysqldump.exe -u $DbUser -p$DbPassword -h $DbHost -P $DbPort $DbName > $backupPath
        if ($LASTEXITCODE -ne 0) { Write-Error "mysqldump failed (exit $LASTEXITCODE). Aborting."; exit 1 }
        Write-Host "Backup created: $backupPath"
    } else {
        Write-Warning "mysqldump not found in PATH. Skipping backup."
    }
}

Push-Location ..\backend

Write-Host "Setting environment variables and running migrations..."
$env:DB_USER = $DbUser
$env:DB_PASSWORD = $DbPassword
$env:DB_HOST = $DbHost
$env:DB_PORT = $DbPort
$env:DB_NAME = $DbName

if (-not (Test-Path node_modules)) { npm ci }

Write-Host "Running: npm run migrate:run"
npm run migrate:run
$migrateExit = $LASTEXITCODE
if ($migrateExit -ne 0) { Write-Error "Migrations failed with exit code $migrateExit"; Pop-Location; exit $migrateExit }

Write-Host "Migration runner finished. Verifying schema..."
$conn = "mysql://$($env:DB_USER):$($env:DB_PASSWORD)@$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME)"
Pop-Location

Write-Host "Executing phase validation query"
node scripts/run_sql_url.js $conn sql/phase_validation.sql

Write-Host "Done."
