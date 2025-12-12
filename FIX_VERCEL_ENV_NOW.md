# 🚨 URGENT: Fix Vercel Environment Variables

## The Problem
Your Vercel deployment is using the **WRONG** backend URL:
- ❌ **Wrong**: `https://waitnot-restaurant-app.onrender.com`
- ✅ **Correct**: `https://waitnot-backend-42e3.onrender.com`

## IMMEDIATE FIX - Do This NOW:

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Click on your project: `waitnot-restaurant-app-jet`

### Step 2: Update Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables** in the left sidebar
3. Find and UPDATE these variables:

```
VITE_API_URL = https://waitnot-backend-42e3.onrender.com
VITE_SOCKET_URL = https://waitnot-backend-42e3.onrender.com
```

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **Redeploy**
4. Check "Use existing Build Cache" = **OFF** (uncheck it)
5. Click **Redeploy**

### Step 4: Clear Browser Cache
After Vercel redeploys (2-3 minutes):
1. Open your app
2. Press **Ctrl+Shift+Delete** to clear cache
3. Press **Ctrl+Shift+R** to hard refresh
4. Check console - should show correct URL

## Alternative: Quick Browser Fix
If you can't wait for Vercel, run this in browser console:

```javascript
// Clear wrong cached URLs
localStorage.removeItem('apiUrl');
localStorage.removeItem('socketUrl');

// Force correct URL
localStorage.setItem('apiUrl', 'https://waitnot-backend-42e3.onrender.com/api');
localStorage.setItem('socketUrl', 'https://waitnot-backend-42e3.onrender.com');

// Reload
location.reload();
```

## Verify Fix
After fix, console should show:
```
API Base URL: https://waitnot-backend-42e3.onrender.com
✅ Correct backend: waitnot-backend-42e3.onrender.com
```

## Why This Happened
- Vercel environment variables were set to wrong URL
- OR the old code was cached
- The code fix has been pushed but Vercel needs to redeploy
