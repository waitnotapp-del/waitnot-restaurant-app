# 🚨 URGENT: Location Settings 404 Fix

## The Problem
Your frontend is still calling the wrong backend URL:
- ❌ **Wrong**: `https://waitnot-restaurant-app.onrender.com`
- ✅ **Correct**: `https://waitnot-backend-42e3.onrender.com`

## 🔧 IMMEDIATE FIX (Do This Now)

### Step 1: Browser Console Fix
1. Open your frontend: `https://waitnot-restaurant-app-jet.vercel.app`
2. Press **F12** to open browser console
3. Paste and run this code:

```javascript
// IMMEDIATE FIX - Run this in browser console
console.log('🔧 Applying urgent location settings fix...');

// Fix API URLs
const CORRECT_BACKEND = 'https://waitnot-backend-42e3.onrender.com';
localStorage.setItem('apiUrl', CORRECT_BACKEND + '/api');
localStorage.setItem('socketUrl', CORRECT_BACKEND);

// Update axios if available
if (typeof axios !== 'undefined') {
  axios.defaults.baseURL = CORRECT_BACKEND;
}

// Intercept and redirect wrong API calls
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('waitnot-restaurant-app.onrender.com')) {
    url = url.replace('waitnot-restaurant-app.onrender.com', 'waitnot-backend-42e3.onrender.com');
    console.log('🔄 Redirected to correct backend:', url);
  }
  return originalFetch.call(this, url, options);
};

// Test connection
fetch(CORRECT_BACKEND + '/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend connected:', d))
  .catch(e => console.error('❌ Backend error:', e));

console.log('✅ Fix applied! Try location settings now.');
```

### Step 2: Test Location Settings
1. Go to Restaurant Dashboard → Location tab
2. Try saving location settings
3. Should work without 404 error

## 🚀 PERMANENT FIX (For Future)

### Option 1: Vercel Environment Variable
1. Go to https://vercel.com/dashboard
2. Find your project: `waitnot-restaurant-app`
3. Settings → Environment Variables
4. Add: `VITE_API_URL` = `https://waitnot-backend-42e3.onrender.com`
5. Redeploy

### Option 2: Trigger Redeploy
The code has been updated. Push any change to trigger redeploy:

```bash
git add .
git commit -m "Fix backend URL configuration"
git push origin main
```

## 🧪 Test Backend Directly

Verify your backend is working:

```bash
# Test health
curl https://waitnot-backend-42e3.onrender.com/health

# Test restaurants
curl https://waitnot-backend-42e3.onrender.com/api/restaurants

# Test location settings
curl -X PATCH https://waitnot-backend-42e3.onrender.com/api/restaurants/midc8u9d91l99mo7yxq/location-settings \
  -H "Content-Type: application/json" \
  -d '{"latitude":12.343706,"longitude":76.618138,"deliveryRadiusKm":5}'
```

## ✅ Expected Result

After the browser console fix:
- Location settings save successfully
- No more 404 errors
- API calls go to correct backend
- Restaurant delivery zones work

## 🆘 If Still Not Working

1. Check browser console for errors
2. Verify backend is awake (first request may take 30-60 seconds)
3. Try refreshing page after running the fix script
4. Check Network tab in DevTools to see actual request URLs

**The browser console fix should work immediately!** 🎯