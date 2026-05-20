@echo off
title WL Ops - Cloudflare Tunnel
color 0B

echo.
echo  ============================================================
echo   Well Land Ops - Cloudflare Tunnel
echo  ============================================================
echo.

:: ── Check server is running ───────────────────────────────────────────────────
curl -s http://localhost:8787/api/ai/status >nul 2>&1
if %errorlevel% neq 0 (
  echo  [WARNING] Server doesn't appear to be running on port 8787.
  echo  Start the server first with START.cmd, then re-run this.
  echo.
  pause
  exit /b 1
)
echo  [OK] Server detected on port 8787.
echo.

:: ── Download cloudflared if not present ───────────────────────────────────────
if not exist "%~dp0cloudflared.exe" (
  echo  Downloading Cloudflare Tunnel client (one-time, ~35 MB)...
  powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe'" 2>nul
  if not exist "%~dp0cloudflared.exe" (
    echo  [ERROR] Download failed. Check your internet connection or download manually:
    echo  https://github.com/cloudflare/cloudflared/releases/latest
    echo  Save as cloudflared.exe in this folder.
    pause
    exit /b 1
  )
  echo  [OK] Downloaded.
  echo.
)

:: ── Start tunnel ──────────────────────────────────────────────────────────────
echo  ============================================================
echo   Starting tunnel...
echo.
echo   Your PUBLIC URL will appear below in ~5 seconds.
echo   It looks like:  https://xxxx-xxxx.trycloudflare.com
echo.
echo   Share that URL with anyone — they can access WL Ops
echo   from any device, anywhere, without VPN.
echo.
echo   Keep this window open. Close it to stop public access.
echo  ============================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://localhost:8787

pause
