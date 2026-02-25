Write-Host 'Counting tracked node_modules and showing latest commits'
$c = git ls-files | Select-String 'node_modules' | Measure-Object
Write-Host "Tracked node_modules count: $($c.Count)"
Write-Host ''
git log --oneline -5
