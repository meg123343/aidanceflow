@echo off
setlocal
cd /d "%~dp0\.."
start "aidance-api" cmd /k npm.cmd run dev:api
start "aidance-web" cmd /k npm.cmd run dev
echo Started AIDanceFlow API and web dev servers.
echo Web: http://localhost:3000
echo API: http://localhost:8787/api/health
