<#
One-line install of persian-arts on a fresh machine (after git clone):  pwsh -File install.ps1   (Windows PowerShell 5 also works for the prerequisites)
  -DryRun  print the plan only          -Check  only run pa doctor + assets-check + install-skill --check      -NoSkill  skip user-level skill install
Idempotent and non-interactive: every prerequisite that exists is skipped ("already installed"). System packages are only installed when missing.
Needs: git, node >= 20 (LTS), python >= 3.12, ffmpeg + ffprobe, PowerShell 7 (pa.ps1); openssl optional. Log: work/persian/_install/install.log (ignored).
Manual after install: git remote auth (SSH key), optional API keys (.freesound.env/.jamendo.env), PA_VAULT_PASS for client material.
#>
param([switch]$DryRun, [switch]$Check, [switch]$NoSkill)
$ErrorActionPreference = 'Continue'
$Root = $PSScriptRoot; Set-Location $Root
$Log = Join-Path $Root 'work/persian/_install/install.log'; New-Item -ItemType Directory -Force (Split-Path $Log) | Out-Null
function Say($m) { Write-Host $m; Add-Content $Log ("{0} {1}" -f (Get-Date -Format s), $m) }
function Have($c) { return [bool](Get-Command $c -ErrorAction SilentlyContinue) }
$IsWin = ($env:OS -eq 'Windows_NT'); $IsMac = (-not $IsWin) -and ((uname) -eq 'Darwin')
$pm = if ($IsWin) { if (Have winget) { 'winget' } elseif (Have choco) { 'choco' } else { $null } } elseif ($IsMac) { if (Have brew) { 'brew' } else { $null } } else { if (Have apt-get) { 'apt' } elseif (Have dnf) { 'dnf' } else { $null } }
Say "persian-arts install: OS=$(if ($IsWin) {'windows'} elseif ($IsMac) {'macos'} else {'linux'}) package-manager=$pm root=$Root dryrun=$DryRun check=$Check"
$Pkg = @{
  git    = @{ cmd = 'git';    winget = 'Git.Git'; choco = 'git'; brew = 'git'; apt = 'git'; dnf = 'git' }
  node   = @{ cmd = 'node';   winget = 'OpenJS.NodeJS.LTS'; choco = 'nodejs-lts'; brew = 'node@22'; apt = 'nodejs npm'; dnf = 'nodejs npm' }
  python = @{ cmd = 'python'; winget = 'Python.Python.3.12'; choco = 'python312'; brew = 'python@3.12'; apt = 'python3 python3-venv python3-pip'; dnf = 'python3 python3-pip' }
  ffmpeg = @{ cmd = 'ffmpeg'; winget = 'Gyan.FFmpeg'; choco = 'ffmpeg'; brew = 'ffmpeg'; apt = 'ffmpeg'; dnf = 'ffmpeg' }
  pwsh   = @{ cmd = 'pwsh';   winget = 'Microsoft.PowerShell'; choco = 'powershell-core'; brew = 'powershell'; apt = 'powershell'; dnf = 'powershell' }
  openssl= @{ cmd = 'openssl'; optional = $true; winget = 'ShiningLight.OpenSSL.Light'; choco = 'openssl'; brew = 'openssl'; apt = 'openssl'; dnf = 'openssl' }
}
if (-not $Check) {
  foreach ($k in 'git', 'node', 'python', 'ffmpeg', 'pwsh', 'openssl') {
    $p = $Pkg[$k]; $c = $p.cmd; if ($k -eq 'python' -and -not (Have python) -and (Have python3)) { $c = 'python3' }
    if (Have $c) { Say "  [skip] $k already installed ($c)"; continue }
    if (-not $pm) { Say "  [WARN] $k missing and no package manager found: install $k manually"; continue }
    $arg = $p[$pm]
    $line = switch ($pm) { 'winget' { "winget install --id $arg -e --silent --accept-package-agreements --accept-source-agreements" } 'choco' { "choco install $arg -y --no-progress" } 'brew' { "brew install $arg" } 'apt' { "sudo apt-get install -y $arg" } 'dnf' { "sudo dnf install -y $arg" } }
    if ($DryRun) { Say "  [dry-run] would run: $line" } else { Say "  [install] $line"; Invoke-Expression $line *>> $Log }
  }
}
$node = if (Have node) { 'node' } else { $null }
if (-not $node) { Say 'node missing: install it (or rerun after the package manager finished and open a new shell), then rerun install.ps1'; exit 1 }
$pa = Join-Path $Root 'work/persian/tools/portable/pa-portable.mjs'
if ($DryRun) {
  Say '  [dry-run] plan: bootstrap (venvs from requirements-pa.txt, npm ci, Remotion browser, fonts copy, .env from examples, kit verify), install-skill --user + --agents, doctor'
  & node $pa bootstrap --dry-run; exit 0
}
if ($Check) { & node $pa doctor; $rc = $LASTEXITCODE; & node $pa install-skill --check; exit $rc }
& node $pa bootstrap *>&1 | Tee-Object -FilePath $Log -Append
if (-not $NoSkill) { & node $pa install-skill --user *>&1 | Tee-Object -FilePath $Log -Append; & node $pa install-skill --agents *>&1 | Tee-Object -FilePath $Log -Append }
Say 'done. Open Claude Code in this folder (or any project) and use /persian-arts. Manual only: git SSH auth, optional API keys, PA_VAULT_PASS.'
