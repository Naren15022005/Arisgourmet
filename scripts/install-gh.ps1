Set-StrictMode -Off
$ErrorActionPreference = 'Stop'

Write-Host 'Installing GitHub CLI (gh)'

# PowerShell 5.1 often fails TLS negotiation to GitHub unless TLS 1.2 is enabled.
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
    # ignore
}

if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host 'Found winget — installing via winget'
    winget install --id GitHub.cli -e --accept-package-agreements --accept-source-agreements
    exit $LASTEXITCODE
}

if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host 'Found Chocolatey — installing via choco'
    choco install gh -y
    exit $LASTEXITCODE
}

$msi = Join-Path $env:TEMP 'gh.msi'
Write-Host "Downloading gh MSI to $msi"

Write-Host 'Resolving latest Windows amd64 MSI asset URL'
$latestReleaseUrl = 'https://github.com/cli/cli/releases/latest'
$downloadUrl = $null

try {
    $releasePage = Invoke-WebRequest -Uri $latestReleaseUrl -UseBasicParsing
    $content = $releasePage.Content

    $abs = [regex]::Match($content, '(?<url>https://github\.com/cli/cli/releases/download/v[^\"\s]+/gh_[^\"\s]+_windows_amd64\.msi)')
    if ($abs.Success) {
        $downloadUrl = $abs.Groups['url'].Value
    } else {
        $rel = [regex]::Match($content, 'href=\"(?<href>/cli/cli/releases/download/v[^\"]+/gh_[^\"]+_windows_amd64\.msi)\"')
        if ($rel.Success) {
            $downloadUrl = 'https://github.com' + $rel.Groups['href'].Value
        }
    }
} catch {
    # We'll fall back to other download methods below
}

if (-not $downloadUrl) {
    throw "Could not resolve MSI download URL from $latestReleaseUrl"
}

Write-Host "Resolved MSI URL: $downloadUrl"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $msi -UseBasicParsing
} catch {
    Write-Host 'Invoke-WebRequest failed; trying BITS...'
    try {
        Start-BitsTransfer -Source $downloadUrl -Destination $msi
    } catch {
        Write-Host 'BITS failed; trying curl.exe...'
        $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
        if (-not $curl) {
            throw
        }
        & $curl.Source -L $downloadUrl -o $msi
    }
}

$msiItem = Get-Item -LiteralPath $msi
if ($msiItem.Length -lt 1000000) {
    $snippet = ''
    try {
        $snippet = (Get-Content -LiteralPath $msi -TotalCount 5 -ErrorAction SilentlyContinue) -join "`n"
    } catch {
        # ignore
    }
    throw "Downloaded MSI looks too small ($($msiItem.Length) bytes). Content preview:`n$snippet"
}

Write-Host 'Installing MSI (msiexec)'
Start-Process -FilePath msiexec.exe -ArgumentList '/i', $msi, '/qn', '/norestart' -Wait

# Refresh PATH in this session so `gh` can be found immediately
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
if ($machinePath -and $userPath) {
    $env:Path = "$machinePath;$userPath"
}

Write-Host 'Verifying gh installation'
gh --version

Write-Host 'gh installation script finished'
