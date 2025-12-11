@echo off
echo 🤖 Setting up OpenAI Integration for WaitNot AI Assistant
echo.

echo 📝 Step 1: Checking if .env file exists...
if exist "server\.env" (
    echo ✅ .env file found
) else (
    echo ⚠️ .env file not found, copying from .env.example...
    copy "server\.env.example" "server\.env"
    echo ✅ .env file created
)

echo.
echo 📝 Step 2: Installing required dependencies...
cd server
call npm install axios dotenv
cd ..

echo.
echo 📝 Step 3: Environment Configuration
echo.
echo 🔑 Your OpenRouter API Key: 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
echo 🤖 Model: openai/gpt-oss-120b:free
echo 🌐 Provider: https://openrouter.ai/
echo.

echo 📝 Step 4: Adding API key to .env file...
echo # OpenRouter AI Configuration >> server\.env
echo OPENROUTER_API_KEY=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 >> server\.env
echo OPENROUTER_MODEL=openai/gpt-oss-120b:free >> server\.env
echo OPENROUTER_BASE_URL=https://openrouter.ai/api/v1 >> server\.env

echo.
echo ✅ OpenAI Integration Setup Complete!
echo.
echo 🚀 Next steps:
echo    1. Restart your server: npm run dev
echo    2. Test the integration: node test-openai-integration.js
echo    3. Try asking the AI Assistant: "I want pizza" or "Hello"
echo.
echo 💡 Features enabled:
echo    • Intelligent food recommendations
echo    • Natural conversation flow
echo    • Context-aware responses
echo    • Restaurant-specific suggestions
echo    • Fallback support for reliability
echo.
pause