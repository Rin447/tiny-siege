@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 or newer is required.
  echo For CPU practice only, open PLAY-OFFLINE.html instead.
  pause
  exit /b 1
)
echo Open http://localhost:3000 in your browser.
echo Keep this window open. Ctrl+C stops the server.
node server/dev.mjs
pause
