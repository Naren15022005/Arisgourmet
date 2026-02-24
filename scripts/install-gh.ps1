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

$downloadUrl = 'https://github.com/cli/cli/releases/latest/download/gh-windows-amd64.msi'

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

Write-Host 'Installing MSI (msiexec)'
Start-Process -FilePath msiexec.exe -ArgumentList '/i', $msi, '/qn', '/norestart' -Wait

Write-Host 'Verifying gh installation'
gh --version

Write-Host 'gh installation script finished'
