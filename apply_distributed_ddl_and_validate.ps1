Set-StrictMode -Off
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Applying distributed DDL via Docker..."
$h = $env:DB_HOST
$p = $env:DB_PORT
$u = $env:DB_ADMIN_USER
$pw = $env:DB_ADMIN_PASS
$db = $env:DB_NAME
try {
  Get-Content .\infra\ddls\create_distributed_tables.sql -Raw | docker run --rm -i mysql:8 mysql -h$h -P$p -u$u -p$pw $db
  $ddlExit = $LASTEXITCODE
} catch {
  Write-Error "Failed to execute docker/mysql: $_"
  exit 1
}
if ($ddlExit -ne 0) {
  Write-Error "DDL step exited with code $ddlExit"
  exit $ddlExit
}

Write-Host "Running phase validation..."
$conn = "mysql://$($env:DB_ADMIN_USER):$($env:DB_ADMIN_PASS)@$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME)"
node backend/scripts/run_sql_url.js $conn sql/phase_validation.sql
$valExit = $LASTEXITCODE
if ($valExit -ne 0) { Write-Error "Validation script failed with exit code $valExit"; exit $valExit }

Write-Host "Done."
