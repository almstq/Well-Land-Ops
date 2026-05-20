@echo off
title WL Ops - First-Time Setup
color 0B
echo.
echo  ============================================================
echo   Well Land Ops v2.0 - First-Time Setup
echo  ============================================================
echo.

:: ── 1. Check Node.js ──────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js is not installed!
  echo  Download from: https://nodejs.org/  (LTS version)
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js %NODE_VER% found.

:: ── 2. Check PostgreSQL ─────────────────────────────────────────────
where psql >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo  [WARNING] psql not found in PATH.
  echo  Make sure PostgreSQL is installed and psql is in your PATH.
  echo  Download: https://www.postgresql.org/download/windows/
  echo.
  echo  If PostgreSQL IS installed, add its bin folder to PATH:
  echo    e.g. C:\Program Files\PostgreSQL\16\bin
  echo.
  pause
)

:: ── 3. Create database ──────────────────────────────────────────────
echo.
echo  [STEP 1/4] Creating PostgreSQL database...
echo  You may be prompted for your postgres password.
echo.
psql -U postgres -c "CREATE DATABASE wl_ops;" 2>nul
if %errorlevel% equ 0 (
  echo  [OK] Database 'wl_ops' created.
) else (
  echo  [INFO] Database may already exist - continuing...
)

:: ── 4. Install backend deps ─────────────────────────────────────────
echo.
echo  [STEP 2/4] Installing backend dependencies...
cd /d "%~dp0wl-local-app"
call npm install
if %errorlevel% neq 0 (
  echo  [ERROR] Backend npm install failed.
  pause
  exit /b 1
)
echo  [OK] Backend dependencies installed.

:: ── 5. Create .env if not exists ───────────────────────────────────
if not exist ".env" (
  echo.
  echo  [STEP 3a/4] Creating .env from template...
  copy ".env.example" ".env"
  echo.
  echo  !! IMPORTANT: Edit wl-local-app\.env and set:
  echo     DB_PASSWORD=your_postgres_password
  echo     JWT_SECRET=a_long_random_string
  echo.
  echo  Press any key after editing .env to continue setup...
  pause
)

:: ── 6. Create DB schema ─────────────────────────────────────────────
echo.
echo  [STEP 3/4] Creating database schema...
node db/schema.js
if %errorlevel% neq 0 (
  echo  [ERROR] Schema creation failed. Check .env DB settings.
  pause
  exit /b 1
)
echo  [OK] Schema created.

:: ── 7. Migrate data ─────────────────────────────────────────────────
if exist "data\db.json" (
  echo.
  echo  [OPTIONAL] Existing db.json found. Migrate to PostgreSQL? (Y/N)
  set /p MIGRATE=
  if /i "%MIGRATE%"=="Y" (
    node db/migrate.js
    echo  [OK] Data migrated.
    node db/seedUsers.js
    echo  [OK] User accounts created.
  )
) else (
  echo.
  echo  [STEP 4a/4] Seeding admin user...
  node db/seedUsers.js
)

:: ── 8. Install frontend deps ────────────────────────────────────────
echo.
echo  [STEP 4/4] Installing frontend dependencies...
cd /d "%~dp0wl-ops-frontend"
call npm install
if %errorlevel% neq 0 (
  echo  [ERROR] Frontend npm install failed.
  pause
  exit /b 1
)
echo  [OK] Frontend dependencies installed.

:: ── Done ─────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   Setup complete!
echo  ============================================================
echo.
echo  Next steps:
echo   1. Start the app:  double-click START.cmd
echo   2. Open browser:   http://localhost:8787
echo   3. Login:          admin / wlops2025
echo.
echo  CHANGE THE DEFAULT PASSWORD on first login!
echo.
pause
