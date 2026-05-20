@echo off
title WL Ops - Starting...
color 0A

echo.
echo  ============================================================
echo   Well Land Ops v2.0 - Starting
echo  ============================================================
echo.

:: ── Stop any old server on 8787 ──────────────────────────────────────
echo  Stopping any existing server on port 8787...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8787 "') do (
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── Build frontend (production mode) ─────────────────────────────────
echo  [1/2] Building frontend...
cd /d "%~dp0wl-ops-frontend"
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
  echo  [WARNING] Frontend build failed.
) else (
  echo  [OK] Frontend built.
)

:: ── Start backend ─────────────────────────────────────────────────────
echo  [2/2] Starting backend server...
cd /d "%~dp0wl-local-app"

if not exist ".env" (
  echo  [ERROR] .env not found. Run SETUP.cmd first.
  pause
  exit /b 1
)

echo.
echo  ============================================================
echo   Well Land Ops is running at http://localhost:8787
echo   Local network:              http://[your-ip]:8787
echo   Login: admin / wlops2025
echo  ============================================================
echo  (keep this window open — close it to stop)
echo.

node server.js

pause
