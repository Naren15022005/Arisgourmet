Write-Host 'Running restore_main_temp.ps1'
$cur = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $cur"
if ($cur -ne 'main') {
  Write-Host 'Switching to main'
  git switch main
}
$porcelain = git status --porcelain
if ($porcelain) {
  Write-Host 'Stashing local changes'
  git stash push -u -m 'autostash before restore-main'
}
Write-Host 'Generating snapshot file list'
git ls-tree -r --name-only snapshot-full > .\snapshot_file_list.txt
$missingCount = 0
Get-Content .\snapshot_file_list.txt | ForEach-Object {
  $p = $_.Trim()
  if ($p -and -not (Test-Path $p)) {
    $missingCount += 1
    $dir = Split-Path $p -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Write-Host 'Checking out:' $p
    git checkout snapshot-full -- "$p"
  }
}
Write-Host 'Restored count:' $missingCount
if ($missingCount -gt 0) {
  git add -A
  git commit -m 'chore: restore files deleted by git from snapshot-full'
  git push origin HEAD
} else {
  Write-Host 'No missing files to restore'
}
if (git stash list | Select-String 'autostash before restore-main') {
  Write-Host 'Popping stash'
  git stash pop
}
Write-Host 'Done'
