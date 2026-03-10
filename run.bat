@echo off

start cmd /k "cd /d f:\takht && node server.js"

start cmd /k "cloudflared tunnel --url http://localhost:3000"

exit