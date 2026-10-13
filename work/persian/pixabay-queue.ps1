# pixabay-queue.ps1 - run the whole media/music-pixabay/queue.txt UNATTENDED, one track at a time.
#
# For each queue URL it launches sound/tools/fetch_pixabay_track.py (one URL per run) and then POLLs:
#   - every 5 s, up to 10 min, for the <slug>.mp3 download file to appear, or
#   - for a challenge / login wall / unexpected page. The wrapper cannot see inside the page, so it
#     watches the fetch script's output: when the script reports it is waiting for the owner (or the
#     download still has not started after 15 s of waiting), it brings the owner's visible Chrome
#     window to the FOREGROUND, prints and logs "ACTION NEEDED: solve the challenge in Chrome",
#     and keeps polling until the page proceeds or the file appears. It never solves, bypasses or
#     automates any CAPTCHA / bot check / login - that is always done by the owner, by hand.
# A track that times out or errors is logged and SKIPPED; the queue continues. After 5 CONSECUTIVE
# failures the whole run stops. Between tracks it pauses a random 20-40 s (politeness: strictly one
# request at a time, never parallel). Sidecar <slug>.source.json is written per downloaded track.
#
# Usage:
#   pwsh -NoProfile -File work/persian/pixabay-queue.ps1                # whole queue (skips done)
#   pwsh -NoProfile -File work/persian/pixabay-queue.ps1 -Limit 3       # first 3 fetches only
#   pwsh -NoProfile -File work/persian/pixabay-queue.ps1 -Resume        # continue past last OK line
#   pwsh -NoProfile -File work/persian/pixabay-queue.ps1 -DryRun        # print plan, no browser
#
# This wrapper never bypasses, solves or evades CAPTCHA/bot checks and never scrapes or
# bulk-downloads from Pixabay: every download goes through the existing manual helper.

param(
    [int]$Limit = 0,
    [switch]$Resume,
    [switch]$DryRun,
    [string]$Python = "python",
    [string]$QueuePath = "",
    [string]$OutDir = "",
    [string]$LogPath = "",
    [string]$StatePath = ""
)

$ErrorActionPreference = "Stop"
# this script lives in <repo>\work\persian, so the repo root is two levels up
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $QueuePath)  { $QueuePath  = Join-Path $repoRoot "media\music-pixabay\queue.txt" }
if (-not $OutDir)     { $OutDir     = Join-Path $repoRoot "media\music-pixabay" }
if (-not $LogPath)    { $LogPath    = Join-Path $repoRoot "work\persian\pixabay-queue.log" }
if (-not $StatePath)  { $StatePath  = Join-Path $repoRoot "work\persian\pixabay-queue.state" }
$fetchScript = Join-Path $repoRoot "sound\tools\fetch_pixabay_track.py"

$pollIntervalS   = 5      # poll cadence while a track runs
$pollTimeoutS    = 600    # max seconds per track (10 min)
$challengeAfterS = 15     # waiting longer than this with no file => treat as a challenge
$minPauseS       = 20     # polite random pause between tracks
$maxPauseS       = 40
$maxConsecFails  = 5

function Write-Log {
    param([string]$Message)
    $line = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] " + $Message
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
    Write-Host $line
}

function Get-Slug {
    param([string]$Url)
    $last = $Url.TrimEnd("/").Split("/")[-1]
    return (($last.ToLower() -replace "[^a-z0-9]+", "-").Trim("-"))
}

function Get-Author {
    param([string]$SidecarPath)
    if (Test-Path -LiteralPath $SidecarPath) {
        foreach ($l in Get-Content -LiteralPath $SidecarPath -Encoding UTF8) {
            if ($l -match "^artist:\s*(.+)$") { return $Matches[1].Trim() }
        }
    }
    return ""
}

# --- bring the owner's visible Chrome window to the foreground (never type/click anything) ---
if (-not ("Win32.Foreground" -as [type])) {
    Add-Type -Namespace Win32 -Name Foreground -MemberDefinition @"
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool SetForegroundWindow(System.IntPtr hWnd);
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool ShowWindow(System.IntPtr hWnd, int nCmdShow);
"@
}

function Show-ChromeToOwner {
    try {
        $chrome = Get-Process chrome -ErrorAction SilentlyContinue |
                  Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($chrome) {
            [Win32.Foreground]::ShowWindow($chrome.MainWindowHandle, 9) | Out-Null   # SW_RESTORE
            [Win32.Foreground]::SetForegroundWindow($chrome.MainWindowHandle) | Out-Null
            return $true
        }
    } catch { }
    return $false
}

# --- parse the queue into track objects (shared by -DryRun and the real run) ---
if (-not (Test-Path -LiteralPath $QueuePath)) { throw "queue file not found: $QueuePath" }
$tracks = New-Object System.Collections.ArrayList
$idx = 0
foreach ($raw in Get-Content -LiteralPath $QueuePath -Encoding UTF8) {
    $idx++
    $line = $raw.Trim()
    if (-not $line -or $line.StartsWith("#")) { continue }   # blank / comment lines are not listed
    $parts = $line.Split("|")
    $url = $parts[0].Trim()
    $t = [pscustomobject]@{
        Line  = $idx;  Url = $url; Slug = ""; Title = ""; Style = ""; Bpm = ""
        Valid = $false; SkipReason = ""
    }
    if ($parts.Count -gt 1) { $t.Title = $parts[1].Trim() }
    if ($parts.Count -gt 2) { $t.Style = $parts[2].Trim() }
    if ($parts.Count -gt 3) { $t.Bpm   = $parts[3].Trim() }
    if (-not $url.StartsWith("https://pixabay.com/music/")) {
        $t.SkipReason = "not a pixabay track page URL"
    } else {
        $t.Slug  = Get-Slug $url
        $t.Valid = $true
        if (Test-Path -LiteralPath (Join-Path $OutDir ($t.Slug + ".mp3"))) {
            $t.SkipReason = "already downloaded"
        }
    }
    [void]$tracks.Add($t)
}

# -Resume: skip every line up to and including the last line a previous run completed (state file)
$resumeAfter = -1
if ($Resume -and (Test-Path -LiteralPath $StatePath)) {
    foreach ($l in Get-Content -LiteralPath $StatePath -Encoding UTF8) {
        if ($l -match "^(\d+)\t") { $resumeAfter = [int]$Matches[1] }
    }
}
if ($Resume) {
    foreach ($t in $tracks) {
        if ($t.Line -le $resumeAfter -and -not $t.SkipReason) { $t.SkipReason = "resume: line already done" }
    }
}

# ============================= DRY RUN =============================
if ($DryRun) {
    Write-Host ("DryRun: queue " + $QueuePath)
    $limTxt = "all"
    if ($Limit -gt 0) { $limTxt = [string]$Limit }
    Write-Host ("DryRun: out " + $OutDir + "  limit=" + $limTxt + "  resume=" + $Resume)
    $n = 0
    foreach ($t in $tracks) {
        $n++
        $act = "FETCH"
        if ($t.SkipReason) { $act = "SKIP (" + $t.SkipReason + ")" }
        Write-Host ("{0,3}. {1,-45} {2}  | {3} | {4}" -f $n, $t.Slug, $act, $t.Title, $t.Style)
    }
    $fetchN = @($tracks | Where-Object { -not $_.SkipReason }).Count
    Write-Host ("DryRun: " + $tracks.Count + " queue lines, " + $fetchN + " to fetch, " + ($tracks.Count - $fetchN) + " skipped. No browser opened.")
    exit 0
}
# ===================================================================

if (-not (Test-Path -LiteralPath $fetchScript)) { throw "fetch script not found: $fetchScript" }
if (-not (Get-Command $Python -ErrorAction SilentlyContinue)) { throw "python not found on PATH: $Python" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$env:PYTHONIOENCODING = "utf-8"   # fetch script prints Persian text; keep redirected logs clean

$fetched = 0; $skipped = 0; $failed = 0; $consecFails = 0
$first = $true
$anyFail = $false

Write-Log ("=== pixabay-queue run start (Limit=" + $Limit + " Resume=" + $Resume + ") ===")

foreach ($t in $tracks) {
    if ($t.SkipReason) {
        $skipped++
        Write-Log ("SKIP line=" + $t.Line + " " + $t.SkipReason + ": " + $t.Slug)
        continue
    }
    if ($Limit -gt 0 -and $fetched -ge $Limit) { Write-Log ("LIMIT reached; stopping before line " + $t.Line); break }

    if (-not $first) {
        $pause = Get-Random -Minimum $minPauseS -Maximum ($maxPauseS + 1)
        Write-Log ("  politeness pause " + $pause + " s ...")
        Start-Sleep -Seconds $pause
    }
    $first = $false

    $slug = $t.Slug
    $mp3Path = Join-Path $OutDir ($slug + ".mp3")
    $outLog  = Join-Path $env:TEMP ("pixabay-fetch-" + $slug + ".out.log")
    $errLog  = Join-Path $env:TEMP ("pixabay-fetch-" + $slug + ".err.log")
    Remove-Item -LiteralPath $outLog -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $errLog -ErrorAction SilentlyContinue

    Write-Log ("START line=" + $t.Line + " slug=" + $slug + " " + $t.Url)

    # one URL per fetch-script run; the visible Chrome window it opens is the owner's Chrome
    $proc = Start-Process -FilePath $Python `
        -ArgumentList @("`"$fetchScript`"", "--out", "`"$OutDir`"", "--allow-in-repo", "--timeout", "$pollTimeoutS", "`"$($t.Url)`"") `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog `
        -NoNewWindow -PassThru

    $deadline    = (Get-Date).AddSeconds($pollTimeoutS)
    $markerSeen  = $false
    $markerTime  = $null
    $actionShown = $false
    $ok = $false

    while ($true) {
        Start-Sleep -Seconds $pollIntervalS

        if (Test-Path -LiteralPath $mp3Path) {
            # the download file appeared; give the script a moment to finish and write its sidecar
            $waited = 0
            while (-not $proc.HasExited -and $waited -lt 60) { Start-Sleep -Seconds 2; $waited += 2 }
            $ok = $true; break
        }
        if ($proc.HasExited) { break }
        if ((Get-Date) -gt $deadline) {
            Write-Log ("  poll timeout after " + $pollTimeoutS + " s; stopping the fetch process for " + $slug)
            try { $proc.Kill($true) } catch { try { $proc.Kill() } catch { } }
            Start-Sleep -Seconds 2
            break
        }

        # challenge / login-wall / unexpected-page detection from the helper's own output
        $tail = ""
        try { $tail = (Get-Content -LiteralPath $outLog -Tail 15 -ErrorAction Stop) -join "`n" } catch { }
        if ($tail -match "solve it by hand|Waiting for you|click Download|download did not start") {
            if (-not $markerSeen) { $markerSeen = $true; $markerTime = Get-Date }
            $waitingLong = ((Get-Date) - $markerTime).TotalSeconds -gt $challengeAfterS
            if (-not $actionShown -and ($waitingLong -or $tail -match "click Download yourself")) {
                $actionShown = $true
                $front = Show-ChromeToOwner
                $msg = "ACTION NEEDED: solve the challenge in Chrome"
                if (-not $front) { $msg = $msg + " (could not raise the Chrome window automatically - click it on the taskbar)" }
                Write-Log $msg
                Write-Host ""
                Write-Host ("#### " + $msg + " ####")
                Write-Host ""
            }
        }
    }

    if ($ok -and (Test-Path -LiteralPath $mp3Path)) {
        $fetched++; $consecFails = 0
        $author = Get-Author (Join-Path $OutDir ($slug + ".txt"))
        $meta = New-Object PSObject
        $meta | Add-Member -NotePropertyName "source_page_url"      -NotePropertyValue $t.Url
        $meta | Add-Member -NotePropertyName "licence"              -NotePropertyValue "Pixabay Content License"
        $meta | Add-Member -NotePropertyName "licence_url"          -NotePropertyValue "https://pixabay.com/service/license-summary/"
        $meta | Add-Member -NotePropertyName "attribution_required" -NotePropertyValue $false
        $meta | Add-Member -NotePropertyName "author"               -NotePropertyValue $author
        $meta | Add-Member -NotePropertyName "download_date"        -NotePropertyValue (Get-Date -Format "yyyy-MM-dd")
        $meta | Add-Member -NotePropertyName "title"                -NotePropertyValue $t.Title
        $meta | Add-Member -NotePropertyName "style"                -NotePropertyValue $t.Style
        $meta | Add-Member -NotePropertyName "claimed_bpm"          -NotePropertyValue $t.Bpm
        $meta | Add-Member -NotePropertyName "notes"                -NotePropertyValue "fetched manually via sound/tools/fetch_pixabay_track.py in the owner's own Chrome; confirm licence before publishing"
        $jsonPath = Join-Path $OutDir ($slug + ".source.json")
        $meta | ConvertTo-Json | Set-Content -LiteralPath $jsonPath -Encoding UTF8
        Write-Log ("OK slug=" + $slug + " -> " + $jsonPath)
        Set-Content -LiteralPath $StatePath -Value ($t.Line.ToString() + "`t" + $slug) -Encoding UTF8
    } else {
        $failed++; $consecFails++; $anyFail = $true
        $why = "timeout after " + $pollTimeoutS + "s"
        if ($proc.HasExited) { $why = "exit=" + $proc.ExitCode }
        Write-Log ("FAIL slug=" + $slug + " (" + $why + "); skipping and continuing")
        try {
            $errTxt = (Get-Content -LiteralPath $errLog -Tail 3 -ErrorAction Stop) -join " | "
            if ($errTxt) { Write-Log ("  stderr: " + $errTxt) }
        } catch { }
        if ($consecFails -ge $maxConsecFails) {
            Write-Log ("STOP: " + $maxConsecFails + " consecutive failures; aborting the run for safety.")
            break
        }
    }
}

Write-Log ("=== run done: fetched=" + $fetched + " skipped=" + $skipped + " failed=" + $failed + " ===")
if ($anyFail) { exit 1 } else { exit 0 }
