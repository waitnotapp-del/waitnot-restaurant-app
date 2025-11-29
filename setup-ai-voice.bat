@echo off
echo ========================================
echo Setting Up AI Voice Assistant
echo ========================================
echo.

echo [1/3] Installing server dependencies...
cd server
call npm install axios express-rate-limit
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo [2/3] Checking environment configuration...
if not exist .env (
    echo [WARNING] .env file not found
    echo Please create .env file with:
    echo OPENROUTER_API_KEY=your_key_here
    echo USE_AI_PROCESSING=true
    echo.
    pause
) else (
    echo [OK] .env file exists
)
echo.

echo [3/3] Testing server...
echo Starting server for 5 seconds...
timeout /t 5 /nobreak
echo.

cd ..
echo ========================================
echo AI Voice Assistant Setup Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Get OpenRouter API key from https://openrouter.ai/
echo 2. Add to server/.env: OPENROUTER_API_KEY=your_key_here
echo 3. Set USE_AI_PROCESSING=true in server/.env
echo 4. Restart server: cd server ^&^& npm start
echo 5. Test voice assistant in the app!
echo.
echo DOCUMENTATION:
echo - AI_VOICE_ASSISTANT_INTEGRATION.md
echo - VOICE_ASSISTANT_FEATURE.md
echo.
pause
