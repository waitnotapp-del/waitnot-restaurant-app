@echo off
echo ========================================
echo Building APK with QR Scanner Feature
echo ========================================
echo.

echo Step 1: Installing dependencies...
cd client
call npm install
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building React app...
call npm run build
if errorlevel 1 (
    echo Failed to build React app
    pause
    exit /b 1
)

echo.
echo Step 3: Syncing with Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo Failed to sync with Capacitor
    pause
    exit /b 1
)

echo.
echo Step 4: Building APK...
cd android
call gradlew assembleDebug
if errorlevel 1 (
    echo Failed to build APK
    cd ..
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! APK built with QR Scanner
echo ========================================
echo.
echo APK Location:
echo client\android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo New Features:
echo - Scan QR codes from Home page
echo - Scan QR codes from Bottom Navigation
echo - Automatic redirect to restaurant menu
echo - Beautiful scanning animation
echo.
pause
