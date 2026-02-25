Set-StrictMode -Version Latest
cd 'c:\Users\alfon\Documents\Proyectos\ArisGourmet'

git fetch origin
git checkout -b relocate-src-into-backend

$root = (Get-Location).Path
$srcRoot = Join-Path $root 'src'
if (-not (Test-Path $srcRoot)) {
  Write-Host 'No top-level src found; aborting'
  exit 0
}

Get-ChildItem -Path $srcRoot -Recurse -File | ForEach-Object {
  $full = $_.FullName
  $rel = $full.Substring($srcRoot.Length + 1).TrimStart('\','/')
  $destPath = Join-Path $root (Join-Path 'backend/src' $rel)
  $destDir = Split-Path $destPath
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  if (Test-Path $destPath) { Remove-Item $destPath -Force }
  git mv -- "$full" "$destPath" 2>$null
}

# Stage, commit and push if there are changes
git add -A
cmd /c "git diff --staged --quiet"
if ($LASTEXITCODE -ne 0) {
  git commit -m 'chore: relocate top-level src into backend/src (consolidate project structure)'
  git push origin relocate-src-into-backend
} else {
  Write-Host 'No changes to commit'
}
