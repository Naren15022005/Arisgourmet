Write-Host 'Bringing frontend into main (overwrite)'
git fetch origin
Write-Host 'Checking out main'
git checkout main
git pull origin main
$bk = 'backup-before-frontend-' + (Get-Date -Format 'yyyyMMddHHmmss')
Write-Host "Creating backup branch: $bk"
git branch $bk
git push -u origin $bk
Write-Host 'Ensuring local frontend branch exists (fetch if needed)'
if (-not (git show-ref --verify --quiet refs/heads/frontend)) {
  git fetch origin frontend:frontend
}
Write-Host 'Copying files from frontend into working tree (overwrite)'
git checkout frontend -- .
Write-Host 'Staging changes'
git add -A
Write-Host 'Checking for staged changes'
cmd /c 'git diff --staged --quiet'
if ($LASTEXITCODE -ne 0) {
  git commit -m "restore: copy files from branch 'frontend' into main (overwrite)"
  Write-Host 'Committed restore; pushing to origin/main'
  git push origin main
} else {
  Write-Host 'No staged changes to commit'
}
Write-Host 'Done'
