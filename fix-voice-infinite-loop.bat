@echo off
echo 🔧 Fixing Voice Assistant Infinite Loop...
echo.

echo 📦 Installing dependencies...
cd client
call npm install

echo 🏗️ Building client with fixes...
call npm run build

echo ✅ Voice Assistant infinite loop fix complete!
echo.
echo 🎯 Changes made:
echo - Added isRecognitionRunning state to prevent multiple instances
echo - Added recognitionAttempts counter to limit retry attempts
echo - Improved error handling for "already started" errors
echo - Added proper cleanup and state management
echo - Increased delays between restart attempts
echo.
echo 🚀 The voice assistant should now work without infinite loops!
pause