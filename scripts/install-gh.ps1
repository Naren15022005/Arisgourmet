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

$version = $null

try {
    $releasePage = Invoke-WebRequest -Uri $latestReleaseUrl -UseBasicParsing

    # Prefer the resolved URL after redirects (usually ends in /releases/tag/vX.Y.Z)
    try {
        $resolved = $releasePage.BaseResponse.ResponseUri.AbsoluteUri
        $m = [regex]::Match($resolved, '/releases/tag/v(?<ver>\d+\.\d+\.\d+)')
        if ($m.Success) {
            $version = $m.Groups['ver'].Value
        }
    } catch {
        # ignore
    }

    if (-not $version) {
        $content = $releasePage.Content
        $m2 = [regex]::Match($content, '/releases/tag/v(?<ver>\d+\.\d+\.\d+)')
        if ($m2.Success) {
            $version = $m2.Groups['ver'].Value
        }
    }
} catch {
    # We'll fall back to other download methods below
}

if (-not $version) {
    throw "Could not resolve latest gh version from $latestReleaseUrl"
}

$downloadUrl = "https://github.com/cli/cli/releases/download/v$version/gh_$version`_windows_amd64.msi"
Write-Host "Resolved version: v$version"
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
$proc = Start-Process -FilePath msiexec.exe -ArgumentList '/i', $msi, '/qn', '/norestart' -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Host "MSI installation failed with exit code $($proc.ExitCode). Will try ZIP fallback."
}

# Refresh PATH in this session so `gh` can be found immediately
$machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
if ($machinePath -and $userPath) {
    $env:Path = "$machinePath;$userPath"
}

Write-Host 'Verifying gh installation'
if (Get-Command gh -ErrorAction SilentlyContinue) {
    gh --version
    Write-Host 'gh installation script finished'
    exit 0
}

Write-Host 'gh not found after MSI install; trying ZIP install (no admin required)'
$zip = Join-Path $env:TEMP 'gh.zip'
$zipUrl = "https://github.com/cli/cli/releases/download/v$version/gh_$version`_windows_amd64.zip"
Write-Host "Downloading gh ZIP to $zip"

try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zip -UseBasicParsing
} catch {
    Write-Host 'Invoke-WebRequest failed; trying BITS...'
    try {
        Start-BitsTransfer -Source $zipUrl -Destination $zip
    } catch {
        Write-Host 'BITS failed; trying curl.exe...'
        $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
        if (-not $curl) {
            throw
        }
        & $curl.Source -L $zipUrl -o $zip
    }
}

$destRoot = Join-Path $env:LOCALAPPDATA 'Programs\gh'
$dest = Join-Path $destRoot $version
New-Item -ItemType Directory -Path $dest -Force | Out-Null

Write-Host "Extracting to $dest"
try {
    Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
} catch {
    throw "Failed to extract $zip to $dest"
}

$ghExe = Get-ChildItem -Path $dest -Recurse -Filter gh.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ghExe) {
    throw "ZIP extracted but gh.exe not found under $dest"
}

$ghBinDir = $ghExe.Directory.FullName
Write-Host "Found gh.exe at $($ghExe.FullName)"
Write-Host "Adding to PATH for this session: $ghBinDir"
$env:Path = "$ghBinDir;$env:Path"

& $ghExe.FullName --version

Write-Host 'gh installation script finished'
