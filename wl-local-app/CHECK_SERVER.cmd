@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ok=$false; try { $r=Invoke-WebRequest -Uri 'http://127.0.0.1:8787/api/db' -UseBasicParsing -TimeoutSec 5; $ok=$r.StatusCode -eq 200 } catch {}; if($ok){Write-Host 'Well Land Local Ops is running at http://127.0.0.1:8787' -ForegroundColor Green}else{Write-Host 'Server is not responding on port 8787. Run START_WL_LOCAL_APP.cmd from the main WL OPS folder.' -ForegroundColor Red}"
pause
