@echo off
cd /d "%~dp0wl-local-app"
set "NODE_EXE=C:\Users\Ali Musthaq\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_EXE%" (
  echo Bundled Node.js was not found:
  echo %NODE_EXE%
  echo.
  echo Ask Codex to repair the launcher or install Node.js.
  pause
  exit /b 1
)
echo Starting Well Land Local Ops server...
start "Well Land Local Ops Server" cmd /k ""%NODE_EXE%" server.js"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8787
echo.
echo If the browser says it cannot connect, keep the server window open and refresh the browser.
echo To stop the app, close the "Well Land Local Ops Server" window or run STOP_WL_LOCAL_APP.cmd.
