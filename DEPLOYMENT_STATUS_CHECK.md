# 🚀 Deployment Status - Live URLs

## ✅ Your Live Deployments

### Frontend (Vercel):
```
https://waitnot-restaurant-app-jet.vercel.app
```

### Backend (Render):
```
https://waitnot-backend-42e3.onrender.com
```

### Restaurant Login:
```
https://waitnot-restaurant-app-jet.vercel.app/restaurant-login
```

---

## 🔧 Fix Login Issue

### Step 1: Update Frontend API URL

The frontend needs to connect to your backend. Update Vercel environment variable:

**In Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select your project: `waitnot-restaurant-app`
3. Go to **Settings** → **Environment Variables**
4. Update or add:
   ```
   REACT_APP_API_URL=https://waitnot-backend-42e3.onrender.com
   ```
5. Click **Save**
6. Go to **Deployments** → **Redeploy**

### Step 2: Test Backend API

First, let's verify your backend is working:
```
https://waitnot-backend-42e3.onrender.com/api/restaurants
```

This should return JSON data with restaurants.

### Step 3: Default Login Credentials

Try these default restaurant accounts:
```
Email: spice@example.com
Password: password123
```

Or:
```
Email: pizza@test.com  
Password: password123
```

---

## 🧪 Quick Tests

### Test 1: Backend Health Check
Open in browser:
```
https://waitnot-backend-42e3.onrender.com/api/restaurants
```

**Expected:** JSON array with restaurant data  
**If Error:** Backend deployment issue

### Test 2: Login API Test
```bash
curl -X POST https://waitnot-backend-42e3.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"spice@example.com","password":"password123"}'
```

**Expected:** JSON with token  
**If Error:** Authentication issue

### Test 3: Frontend API Connection
1. Open: https://waitnot-restaurant-app-jet.vercel.app
2. Open DevTools (F12) → Console
3. Check for API errors
4. Network tab should show calls to `waitnot-backend-42e3.onrender.com`

---

## 🔄 Backend CORS Fix

If login still fails, update backend CORS settings:

**In your backend code (`server/server.js`):**
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://waitnot-restaurant-app-jet.vercel.app'
  ],
  credentials: true
}));
```

Then redeploy backend on Render.

---

## 📋 Environment Variables Check

### Vercel (Frontend):
```
REACT_APP_API_URL=https://waitnot-backend-42e3.onrender.com
```

### Render (Backend):
```
PORT=10000
JWT_SECRET=e66btfddb5d680c01e4a9975f5ab571f
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_test_RkqqfmhBYvh7c5
RAZORPAY_KEY_SECRET=U7pcwC3yR7T8rKUch0GEkFqc
MSG91_AUTH_KEY=480068AuNZVGZoLD69289ec2P1
```

---

## 🎯 Most Likely Fix

**90% chance the issue is:**
1. Frontend not connecting to correct backend URL
2. Update `REACT_APP_API_URL` in Vercel
3. Redeploy frontend
4. Login should work

---

## ✅ Success Checklist

After fixing:
- [ ] Backend API returns data: `/api/restaurants`
- [ ] Frontend connects to correct backend
- [ ] No CORS errors in browser console
- [ ] Login works with default credentials
- [ ] Restaurant dashboard loads

---

## 🚀 Quick Fix Command

**Update Vercel environment variable to:**
```
REACT_APP_API_URL=https://waitnot-backend-42e3.onrender.com
```

**Then redeploy and test login!** 🎉

---

**Your deployments look good - just need to connect frontend to backend!** ✨