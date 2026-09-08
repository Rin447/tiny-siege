@echo off
cd /d "%~dp0"
call npm.cmd run login
if errorlevel 1 goto :done
call npm.cmd run whoami
:done
pause
