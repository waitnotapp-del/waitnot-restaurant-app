# Fix API URL for Local Development

## Issue
The app is trying to connect to production URL instead of local development server.

## Solution Applied
1. Updated `client/src/main.jsx` to use `http://localhost:5000/api` as default
2. Need to clear localStorage to remove cached production URL

## Steps to Complete the Fix

### Option 1: Clear Browser Storage (Recommended)
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Find "Local Storage" → "http://localhost:3000"
4. Delete the `apiUrl` key
5. Refresh the page

### Option 2: Run JavaScript in Console
1. Open browser console (F12)
2. Run: `localStorage.removeItem('apiUrl'); location.reload();`

### Option 3: Manual Override
1. Go to app settings in the UI
2. Change API URL to: `http://localhost:5000`
3. Save settings

## Verification
After clearing localStorage, check the console logs:
- Should show: `API Base URL: http://localhost:5000`
- Should NOT show: `waitnot-restaurant-app.onrender.com`

## Test the Location Settings
1. Login to restaurant dashboard
2. Go to Location tab
3. Fill in location details
4. Click Save - should work without 404 error

The fix ensures the app connects to your local development server instead of production.