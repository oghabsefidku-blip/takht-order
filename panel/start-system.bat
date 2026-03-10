@echo off
title Takht System Starter

echo Starting Server...

start "SERVER" cmd /k "cd /d F:\takht-order && node server.js"

timeout /t 3 /nobreak >nul

echo Starting Tunnel...

start "TUNNEL" cmd /k "cloudflared tunnel --url http://localhost:3000"

exit