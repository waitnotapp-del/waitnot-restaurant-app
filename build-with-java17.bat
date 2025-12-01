@echo off
echo ========================================
echo WaitNot APK Build (Java 17)
echo ========================================
echo.

REM Find Java 17 installation
set JAVA17_PATH=
for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set JAVA17_PATH=%%i

if "%JAVA17_PATH%"=="" (
    echo [ERROR] Java 17 not found!
    echo.
    echo Please install Java 17 from:
    echo https://adoptium.net/temurin/releases/?version=17
    echo.
    echo Or run: choco install temurin17 -y
    echo.
    pause
    exit /b 1
)

echo [INFO] Found Java 17 at: %JAVA17_PATH%
set JAVA_HOME=%JAVA17_PATH%
set PATH=%JAVA_HOME%\bin;%PATH%

REM Set Android SDK path
set ANDROID_HOME=C:\Users\ASUS\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin;%PATH%

echo [INFO] Using JAVA_HOME: %JAVA_HOME%
echo [INFO] Using ANDROID_HOME: %ANDROID_HOME%
echo.

REM Verify Java version
echo Checking Java version...
java -version
if %errorlevel% neq 0 (
    echo [ERROR] Java not working!
    pause
    exit /b 1
)
echo.

REM Check Android SDK
echo Checking Android SDK...
if exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo [OK] Android SDK found
) else (
    echo [ERROR] Android SDK not found!
    echo Please install Android Studio first.
    echo Download from: https://developer.android.com/studio
    pause
    exit /b 1
)
echo.

echo ========================================
echo Building APK...
echo ========================================
echo.

cd client

echo Step 1: Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] React build failed!
    pause
    exit /b 1
)
echo [OK] React app built
echo.

echo Step 2: Syncing Capacitor...
call npx cap sync
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b 1
)
echo [OK] Capacitor synced
echo.

echo Step 3: Building Android APK...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] APK build failed!
    echo.
    echo Try running: gradlew.bat clean
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! APK Built Successfully!
echo ========================================
echo.
echo APK Location:
echo %cd%\app\build\outputs\apk\debug\app-debug.apk
echo.
echo File size:
dir app\build\outputs\apk\debug\app-debug.apk | find "app-debug.apk"
echo.
echo Next steps:
echo 1. Copy APK to your phone
echo 2. Make sure phone is on same WiFi (172.27.96.100)
echo 3. Start backend: cd server ^&^& npm run dev
echo 4. Install and test APK on phone
echo.
pause
