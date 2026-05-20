@echo off
title WL Ops - Starting...
color 0A

echo.
echo  ============================================================
echo   Well Land Ops v2.0 - Starting
echo  ============================================================
echo.

:: ── Build frontend (production mode) ────────────────────────────────
echo  [1/2] Building frontend...
cd /d "%~dp0wl-ops-frontend"
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
  echo  [WARNING] Frontend build failed. Running in dev mode instead.
  set USE_DEV=1
) else (
  echo  [OK] Frontend built.
)

:: ── Start backend ────────────────────────────────────────────────────
echo  [2/2] Starting backend server...
cd /d "%~dp0wl-local-app"

if not exist ".env" (
  echo  [ERROR] .env file not found! Run SETUP.cmd first.
  pause
  exit /b 1
)

echo.
echo  Server starting at http://localhost:8787
echo  (keep this window open)
echo.

:: Start backend in foreground
node server.js

pause
