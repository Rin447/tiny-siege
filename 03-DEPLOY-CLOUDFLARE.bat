@echo off
cd /d "%~dp0"
echo This project deploys the worker: tiny-siege (create or update)
echo It is NOT the wavelength worker dark-mode-0e8f.
call npm.cmd run whoami
if errorlevel 1 goto :done
choice /c YN /m "Is this the correct Cloudflare account? Deploy tiny-siege"
if errorlevel 2 goto :done
call npm.cmd run check
if errorlevel 1 goto :done
call npm.cmd test
if errorlevel 1 goto :done
call npm.cmd run deploy
:done
pause
