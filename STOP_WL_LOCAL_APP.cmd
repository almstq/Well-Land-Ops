@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8787" ^| findstr "LISTENING"') do (
  taskkill /PID %%a /F
)
echo Well Land Local Ops server stopped if it was running.
pause
