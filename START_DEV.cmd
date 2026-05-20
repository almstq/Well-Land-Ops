@echo off
title WL Ops - Dev Mode
color 0E

echo.
echo  Well Land Ops - DEV MODE (hot reload)
echo  Two windows will open: backend + frontend dev server
echo.

:: ── Start backend in new window ──────────────────────────────────────
start "WL Ops Backend :8787" cmd /k "cd /d "%~dp0wl-local-app" && node --watch server.js"

:: ── Wait a moment for backend to start ──────────────────────────────
timeout /t 3 /nobreak >nul

:: ── Start Vite dev server in new window ─────────────────────────────
start "WL Ops Frontend :5173" cmd /k "cd /d "%~dp0wl-ops-frontend" && npm run dev"

timeout /t 3 /nobreak >nul

:: ── Open browser ─────────────────────────────────────────────────────
start http://localhost:5173

echo  [OK] Dev servers launched.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8787
echo.
pause
