@echo off
title BDBMS — Blood Donation & Blood Bank Management System
color 0C

echo =====================================================================
echo    BDBMS — Blood Donation & Blood Bank Management System
echo    College SPM Innovative Project Launcher
echo =====================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if backend node_modules exist
if not exist "%~dp0backend\node_modules\" (
    echo [INFO] Installing backend dependencies...
    cd /d "%~dp0backend"
    call npm install
)

:: Check if frontend node_modules exist
if not exist "%~dp0frontend\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%~dp0frontend"
    call npm install
)

echo.
echo [1/3] Starting Backend Server (Express + SQLite on port 3001)...
start "BDBMS Backend (Port 3001)" cmd /k "cd /d "%~dp0backend" && echo Starting Backend... && npm run dev"

echo [2/3] Waiting for backend initialization...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Client (Vite + React on port 5173)...
start "BDBMS Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && echo Starting Frontend... && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo =====================================================================
echo    BDBMS IS NOW RUNNING LIVE!
echo =====================================================================
echo.
echo    Frontend URL: http://localhost:5173/
echo    Backend Health: http://localhost:3001/api/health
echo.
echo    Demo Accounts (Password for all: Admin@123 or password123):
echo      - Administrator: admin@bdbms.com
echo      - Staff Operator: staff@bdbms.com
echo      - Hospital: apollo@hospital.com
echo      - Donor: donor@bdbms.com
echo.
echo    To stop all servers, run: stop-all.bat
echo =====================================================================
echo.

:: Automatically open default browser to frontend
start http://localhost:5173/

pause
