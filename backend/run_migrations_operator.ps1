param(
    [string]$DbHost = 'localhost',
    [string]$DbPort = '3306',
    [string]$DbName = 'arisgourmet'
)

Write-Host "--- Run canonical migrations (operator) ---"

$dbUser = Read-Host "DB user (must have CREATE/ALTER privileges)"
$dbPassword = Read-Host -AsSecureString "DB password"
$plainPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

if (-not (Test-Path ..\backups)) { New-Item -ItemType Directory -Path ..\backups | Out-Null }

$backupPath = "..\backups\pre_migration_$((Get-Date).ToString('yyyyMMdd_HHmmss')).sql"
Write-Host "Optional: create a mysqldump backup to $backupPath"
$doBackup = Read-Host "Run mysqldump backup first? (y/N)"
if ($doBackup -eq 'y' -or $doBackup -eq 'Y') {
    if (Get-Command mysqldump -ErrorAction SilentlyContinue) {
        Write-Host "Running mysqldump..."
        & mysqldump.exe -u $dbUser -p$plainPass -h $DbHost -P $DbPort $DbName > $backupPath
        if ($LASTEXITCODE -ne 0) { Write-Error "mysqldump failed (exit $LASTEXITCODE). Aborting."; exit 1 }
        Write-Host "Backup created: $backupPath"
    } else {
        Write-Warning "mysqldump not found in PATH. Skipping backup."
    }
}

Push-Location ..\backend

Write-Host "Setting environment variables and running migrations..."
$env:DB_USER = $dbUser
$env:DB_PASSWORD = $plainPass
$env:DB_HOST = $DbHost
$env:DB_PORT = $DbPort
$env:DB_NAME = $DbName

Write-Host "Installing dependencies (if needed). This may take a moment..."
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

Write-Host "Done. If validation output shows missing_distributed_tables or errors, investigate and restore backup if necessary."
