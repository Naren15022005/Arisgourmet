Write-Host 'Restore paths from snapshot_file_list.txt into working tree (snapshot-full)'
$file = Join-Path $PSScriptRoot '..\snapshot_file_list.txt'
if (-not (Test-Path $file)) { Write-Host "Missing $file"; exit 1 }
$lines = Get-Content $file
$cnt = 0
foreach ($line in $lines) {
  $p = $line.Trim()
  if (-not $p) { continue }
  # create parent dir if needed
  $dir = Split-Path $p -Parent
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Write-Host "Restoring: $p"
  try {
    git checkout snapshot-full -- "$p" 2>$null
  } catch {
    Write-Host "Warning restoring $p"
    Write-Host $_.ToString()
  }
  $cnt += 1
}
Write-Host "Done restoring $cnt paths. Staging and committing if changes present."
# stage and commit
git add -A
# use cmd to check staged diff quietly
cmd /c "git diff --staged --quiet"
if ($LASTEXITCODE -ne 0) {
  git commit -m "restore: restore files from snapshot_file_list.txt (snapshot-full)"
  git push origin HEAD
} else {
  Write-Host 'No staged changes to commit.'
}
Write-Host 'Finished.'
