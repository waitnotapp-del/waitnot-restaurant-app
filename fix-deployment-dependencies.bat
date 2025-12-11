@echo off
echo 🔧 Fixing Deployment Dependencies...
echo.

echo 📦 Installing missing server dependencies...
cd server
call npm install compression helmet
cd ..

echo 📝 Committing dependency fixes...
git add .
git commit -m "🔧 Fix: Add missing server dependencies for performance middleware

✅ Added Dependencies:
- compression ^1.7.4 - For response compression
- helmet ^7.1.0 - For security headers

🚀 This fixes the deployment error:
- ERR_MODULE_NOT_FOUND: Cannot find package 'compression'
- Enables performance middleware to work properly

The server should now deploy successfully on Render!"

echo 🚀 Pushing to GitHub...
git push origin main

echo ✅ Dependencies fixed and pushed!
echo.
echo 🎯 The deployment should now work correctly.
echo Check Render dashboard for successful deployment.
pause