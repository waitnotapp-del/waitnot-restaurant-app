@echo off
echo ========================================
echo Checking Server Status
echo ========================================
echo.

echo [1] Checking Backend Server...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/api/restaurants' -TimeoutSec 5; Write-Host '✅ Backend is running!' -ForegroundColor Green; Write-Host '   Restaurants found:' $response.Count; } catch { Write-Host '❌ Backend not running' -ForegroundColor Red; Write-Host '   Run: .\start-server-only.bat'; }"

echo.
echo [2] Checking Frontend Server...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5 -UseBasicParsing; Write-Host '✅ Frontend is running!' -ForegroundColor Green; Write-Host '   Status:' $response.StatusCode; } catch { Write-Host '❌ Frontend not running' -ForegroundColor Red; Write-Host '   Run: .\start-client-only.bat'; }"

echo.
echo ========================================
echo.
echo If both are running, open: http://localhost:3000
echo.
pause
