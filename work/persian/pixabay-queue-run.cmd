@echo off
rem Double-click launcher for the Pixabay queue runner (milestone 2).
rem Runs work/persian/pixabay-queue.ps1 with pwsh and keeps the window open
rem so any "ACTION NEEDED" message and the final summary stay visible.
rem Extra args (e.g. -Limit 3, -Resume, -DryRun) can be appended via a shortcut.
cd /d "%~dp0"
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0pixabay-queue.ps1" %*
echo.
echo Queue run finished. Press any key to close this window.
pause >nul
