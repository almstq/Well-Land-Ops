@echo off
title WL Ops - Stopping
color 0C

echo  Stopping WL Ops processes...
taskkill /f /fi "WINDOWTITLE eq WL Ops*" >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo  [OK] All Node.js processes stopped.
timeout /t 2 /nobreak >nul
