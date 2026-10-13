@echo off
title BDBMS — Stopping All Servers
color 0E

echo =====================================================================
echo    Stopping BDBMS Servers (Ports 3001 and 5173)...
echo =====================================================================
echo.

powershell -NoProfile -Command ^
  "Get-NetTCPConnection -LocalPort 3001, 5173 -ErrorAction SilentlyContinue | ForEach-Object { if ($_.OwningProcess -gt 0) { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host ('[STOPPED] PID ' + $_.OwningProcess + ' on port ' + $_.LocalPort) } }"

echo.
echo All BDBMS servers stopped.
echo =====================================================================
pause
