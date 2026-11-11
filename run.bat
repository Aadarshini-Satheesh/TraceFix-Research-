@echo off
title TraceFix Research - Launcher
color 0B

echo ===============================================================================
echo     TRACEFIX RESEARCH - EVIDENCE-DRIVEN AI DEBUGGING & CAUSAL VERIFICATION
echo ===============================================================================
echo.
echo [1/3] Enforcing strict E: drive environment and temporary caches...
set "PROJECT_ROOT=E:\Projects\TraceFix-Research"
set "TEMP=%PROJECT_ROOT%\.cache\temp"
set "TMP=%PROJECT_ROOT%\.cache\temp"
set "PIP_CACHE_DIR=%PROJECT_ROOT%\.cache\pip"
set "PYTHONPATH=%PROJECT_ROOT%\backend"

if not exist "%TEMP%" mkdir "%TEMP%"
if not exist "%PIP_CACHE_DIR%" mkdir "%PIP_CACHE_DIR%"

echo [2/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "TraceFix Backend Server" cmd /k "cd /d %PROJECT_ROOT%\backend && set TEMP=%TEMP% && set TMP=%TMP% && %PROJECT_ROOT%\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [3/3] Starting Vite Frontend on http://localhost:5173 ...
start "TraceFix Frontend Web" cmd /k "cd /d %PROJECT_ROOT%\frontend && set TEMP=%TEMP% && set TMP=%TMP% && npm run dev"

echo.
echo Application services launched successfully!
echo - Backend API Docs:   http://127.0.0.1:8000/docs
echo - Frontend Dashboard: http://localhost:5173
echo.
echo Opening TraceFix Research in your default browser...
timeout /t 3 >nul
start http://localhost:5173

echo.
echo ===============================================================================
echo Servers are running in the opened terminal windows. Press any key to exit launcher.
echo ===============================================================================
pause >nul
