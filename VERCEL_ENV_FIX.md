# 🔧 Vercel Environment Variable Fix

## Problem
The deployed frontend is still using the wrong backend URL, causing 404 errors for location settings.

## Solution
Set the correct environment variable in Vercel dashboard.

## Steps to Fix

### 1. Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find your project: `waitnot-restaurant-app`
3. Click on the project

### 2. Set Environment Variable
1. Go to **Settings** tab
2. Click **Environment Variables**
3. Add/Update this variable:

```
Name: VITE_API_URL
Value: https://waitnot-backend-42e3.onrender.com
```

### 3. Redeploy
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for deployment to complete

## Alternative: Manual Redeploy Trigger

If you can't access Vercel dashboard, push any small change to trigger redeploy:

```bash
git commit --allow-empty -m "Trigger redeploy with correct backend URL"
git push origin main
```

## Immediate Browser Fix

While waiting for redeploy, use this in browser console (F12):

```javascript
// Fix API URL immediately
localStorage.setItem('apiUrl', 'https://waitnot-backend-42e3.onrender.com/api');
axios.defaults.baseURL = 'https://waitnot-backend-42e3.onrender.com';

// Intercept and redirect wrong API calls
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('waitnot-restaurant-app.onrender.com')) {
    url = url.replace('waitnot-restaurant-app.onrender.com', 'waitnot-backend-42e3.onrender.com');
  }
  return originalFetch.call(this, url, options);
};

console.log('✅ API calls will now go to correct backend');
```

## Expected Result
After applying the fix:
- Location settings save successfully
- No more 404 errors
- All API calls go to correct backend: `https://waitnot-backend-42e3.onrender.com`