@echo off
setlocal enabledelayedexpansion

set "PROJECT=F:\takht-order"
set "TXTFILE=%PROJECT%\public\tunnel.txt"
set "LOGFILE=%PROJECT%\tunnel.log"
set "CF=C:\Program Files (x86)\cloudflared\cloudflared.exe"

if not exist "%PROJECT%\public" (
  echo پوشه public پیدا نشد
  pause
  exit /b
)

echo Starting tunnel...
echo. > "%LOGFILE%"

start "Cloudflare Tunnel" /min cmd /c ""%CF%" tunnel --url http://localhost:3000 > "%LOGFILE%" 2>&1"

echo منتظر دریافت لینک تونل...
timeout /t 5 /nobreak >nul

powershell -NoProfile -Command ^
  "$log = Get-Content '%LOGFILE%' -Raw; " ^
  "$m = [regex]::Match($log, 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com'); " ^
  "if($m.Success){ Set-Content -Path '%TXTFILE%' -Value $m.Value -NoNewline; Write-Host 'Tunnel URL saved:' $m.Value } else { Write-Host 'Tunnel URL not found yet' }"

echo.
echo tunnel.txt بروزرسانی شد.
pause