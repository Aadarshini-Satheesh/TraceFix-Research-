@echo off
title TraceFix Research - Setup Installer
color 0A

echo ===============================================================================
echo     TRACEFIX RESEARCH - ENVIRONMENT SETUP (STRICT E: DRIVE ISOLATION)
echo ===============================================================================
echo.

set "PROJECT_ROOT=E:\Projects\TraceFix-Research"
set "TEMP=%PROJECT_ROOT%\.cache\temp"
set "TMP=%PROJECT_ROOT%\.cache\temp"
set "PIP_CACHE_DIR=%PROJECT_ROOT%\.cache\pip"

echo [1/4] Ensuring directories exist on E: drive...
if not exist "%TEMP%" mkdir "%TEMP%"
if not exist "%PIP_CACHE_DIR%" mkdir "%PIP_CACHE_DIR%"
if not exist "%PROJECT_ROOT%\.cache\npm" mkdir "%PROJECT_ROOT%\.cache\npm"
if not exist "%PROJECT_ROOT%\.cache\sandbox_runs" mkdir "%PROJECT_ROOT%\.cache\sandbox_runs"

echo [2/4] Initializing Python Virtual Environment...
if not exist "%PROJECT_ROOT%\backend\venv" (
    python -m venv "%PROJECT_ROOT%\backend\venv"
)

echo [3/4] Installing Python dependencies (cached on E:)...
call "%PROJECT_ROOT%\backend\venv\Scripts\pip.exe" install --cache-dir "%PIP_CACHE_DIR%" -r "%PROJECT_ROOT%\backend\requirements.txt"

echo [4/4] Installing Frontend NPM packages (cached on E:)...
cd /d "%PROJECT_ROOT%\frontend"
call npm install --cache "%PROJECT_ROOT%\.cache\npm"

echo.
echo ===============================================================================
echo Setup completed successfully! All caches and dependencies isolated on E: drive.
echo Run 'run.bat' to launch the complete research platform.
echo ===============================================================================
pause
