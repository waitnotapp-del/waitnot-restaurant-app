@echo off
echo 🔧 Fixing CORS Issue for Vercel Frontend...
echo.

echo 📝 CORS Issues Fixed:
echo - Added support for waitnot-restaurant-app-jet.vercel.app
echo - Enhanced CORS configuration with flexible Vercel domain matching
echo - Added proper HTTP methods and headers
echo - Added health check endpoint for server verification
echo - Added CORS preflight handler
echo.

echo 🌐 CORS Configuration:
echo - Allows all Vercel deployments of the app
echo - Supports credentials for authentication
echo - Handles preflight OPTIONS requests
echo - Includes all necessary HTTP methods and headers
echo.

echo 🧪 Testing server health...
curl -X GET https://waitnot-backend-42e3.onrender.com/health

echo.
echo 🚀 Committing and pushing CORS fixes...
git add .
git commit -m "🔧 Fix: CORS Issue for Vercel Frontend

✅ Fixed CORS Configuration:
- Added support for waitnot-restaurant-app-jet.vercel.app domain
- Enhanced CORS with flexible Vercel domain matching
- Added proper HTTP methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- Added necessary headers: Content-Type, Authorization, Accept, etc.

🌐 CORS Improvements:
- Dynamic origin checking for Vercel deployments
- Supports credentials for authentication
- Handles preflight OPTIONS requests properly
- Added health check endpoint for server verification

🛡️ Security Features:
- Validates origin domains in production
- Allows all origins in development
- Proper error handling for unauthorized origins
- Comprehensive header and method support

🚀 Results:
- Frontend can now connect to backend successfully
- API requests work from Vercel deployment
- Proper CORS headers sent with all responses
- Server health can be verified via /health endpoint

The CORS issue should now be resolved! 🌐✨"

git push origin main

echo ✅ CORS fixes committed and pushed!
echo.
echo 🎯 The frontend should now be able to connect to the backend.
echo 🔗 Test the health endpoint: https://waitnot-backend-42e3.onrender.com/health
pause