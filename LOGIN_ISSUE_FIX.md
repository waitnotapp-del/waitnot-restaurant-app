# 🔐 Restaurant Login Issue - Troubleshooting Guide

## ❌ Issue Identified

**Problem:** Restaurant login shows "Invalid credentials" even with correct credentials

**Console Errors:** Multiple 401 Unauthorized API requests

**Root Cause:** Backend API connection or authentication issues

---

## 🔍 Diagnosis from Console Errors

Looking at your browser console, I can see:
- ✅ Frontend deployed successfully
- ❌ API requests failing with 401 status
- ❌ Backend connection issues

**Error Pattern:**
```
POST /api/auth/login - 401 Unauthorized
```

---

## 🎯 Possible Causes & Solutions

### 1. Backend Not Running
**Check:** Is your Render backend service running?

**Solution:**
1. Go to: https://dashboard.render.com
2. Check your backend service status
3. If stopped, click "Manual Deploy"
4. Wait for deployment to complete

### 2. Wrong API URL in Frontend
**Check:** Frontend trying to connect to wrong backend URL

**Solution:**
Update Vercel environment variable:
```
REACT_APP_API_URL=https://your-actual-backend-url.onrender.com
```

### 3. CORS Issues
**Check:** Backend not allowing frontend domain

**Solution:**
Update backend CORS settings in `server/server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://waitnot-restaurant-app.vercel.app',
    'https://waitnot-restaurant-app-jet.vercel.app'
  ],
  credentials: true
}));
```

### 4. Database/Authentication Issues
**Check:** Backend authentication logic

**Solution:**
Check if default restaurant credentials exist in database.

---

## 🔧 Quick Fix Steps

### Step 1: Verify Backend Status
1. Go to your Render dashboard
2. Check if backend service is "Live" (green)
3. If not, redeploy the service

### Step 2: Test Backend API Directly
Open in browser:
```
https://your-backend-url.onrender.com/api/restaurants
```

Should return JSON data. If not, backend has issues.

### Step 3: Check Frontend API URL
In Vercel dashboard:
1. Go to Project Settings
2. Environment Variables
3. Verify `REACT_APP_API_URL` is correct
4. Redeploy if changed

### Step 4: Test Default Credentials
Try these default restaurant credentials:
```
Email: pizza@test.com
Password: password123
```

Or:
```
Email: spice@example.com  
Password: password123
```

---

## 🧪 Testing Steps

### 1. Test Backend Health
```bash
curl https://your-backend-url.onrender.com/api/restaurants
```

### 2. Test Login Endpoint
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pizza@test.com","password":"password123"}'
```

### 3. Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try login
4. Check if API calls are going to correct URL

---

## 🔄 Backend Deployment Fix

If backend is not working, redeploy with correct settings:

### Render Configuration:
```
Repository: waitnotapp-del/waitnot-restaurant-app
Root Directory: server
Build Command: npm install
Start Command: node server.js
```

### Environment Variables:
```
PORT=10000
JWT_SECRET=e66btfddb5d680c01e4a9975f5ab571f
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_test_RkqqfmhBYvh7c5
RAZORPAY_KEY_SECRET=U7pcwC3yR7T8rKUch0GEkFqc
MSG91_AUTH_KEY=480068AuNZVGZoLD69289ec2P1
```

---

## 🎯 Default Restaurant Accounts

Your backend should have these default restaurants:

### Restaurant 1:
```
Name: Spice Garden
Email: spice@example.com
Password: password123
```

### Restaurant 2:
```
Name: Pizza Palace  
Email: pizza@test.com
Password: password123
```

### Restaurant 3:
```
Name: Burger Barn
Email: burger@test.com
Password: password123
```

---

## 🔍 Debug Checklist

### Frontend Issues:
- [ ] Vercel deployment successful
- [ ] Environment variables set correctly
- [ ] API URL pointing to correct backend
- [ ] No console errors (except API calls)

### Backend Issues:
- [ ] Render service running (green status)
- [ ] Build completed successfully
- [ ] Environment variables configured
- [ ] API endpoints responding
- [ ] Database seeded with default data

### Network Issues:
- [ ] CORS configured correctly
- [ ] API calls reaching backend
- [ ] No firewall blocking requests
- [ ] SSL certificates valid

---

## 🚀 Quick Resolution

### Most Likely Fix:
1. **Check your Render backend URL**
2. **Update Vercel environment variable:**
   ```
   REACT_APP_API_URL=https://your-correct-backend-url.onrender.com
   ```
3. **Redeploy Vercel frontend**
4. **Test login again**

### If Backend is Down:
1. **Go to Render dashboard**
2. **Find your backend service**
3. **Click "Manual Deploy"**
4. **Wait for deployment**
5. **Test API endpoint**

---

## 📞 Emergency Backup Plan

If you can't fix the backend quickly:

### Option 1: Use Local Backend
```bash
cd server
npm install
npm start
```

Then update frontend to use:
```
REACT_APP_API_URL=http://localhost:5000
```

### Option 2: Redeploy Everything
1. Create new Render service
2. Deploy backend fresh
3. Update frontend API URL
4. Redeploy frontend

---

## ✅ Success Indicators

Login will work when:
- ✅ Backend service shows "Live" status
- ✅ API endpoint returns data: `/api/restaurants`
- ✅ Frontend connects to correct backend URL
- ✅ No CORS errors in console
- ✅ Default restaurant accounts exist

---

## 🎯 Most Common Solution

**90% of the time, this fixes it:**

1. **Check Render backend status** - Is it running?
2. **Verify API URL in Vercel** - Is it correct?
3. **Test backend directly** - Does `/api/restaurants` work?
4. **Use default credentials** - `pizza@test.com` / `password123`

**The issue is likely backend connectivity, not the credentials themselves!** 🔧

---

**Check your Render backend first - that's usually where the problem is!** 🚀