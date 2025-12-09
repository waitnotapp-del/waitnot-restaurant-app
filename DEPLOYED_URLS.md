# 🌐 Deployed URLs - Waitnot Restaurant App

## ✅ Live Production URLs

### Backend API (Render)
```
https://waitnot-backend.onrender.com
```

**API Endpoints:**
- Restaurants: `https://waitnot-backend.onrender.com/api/restaurants`
- Orders: `https://waitnot-backend.onrender.com/api/orders`
- Users: `https://waitnot-backend.onrender.com/api/users`
- Auth: `https://waitnot-backend.onrender.com/api/auth`
- Payment: `https://waitnot-backend.onrender.com/api/payment`
- Voice: `https://waitnot-backend.onrender.com/api/voice`
- Reels: `https://waitnot-backend.onrender.com/api/reels`
- Reviews: `https://waitnot-backend.onrender.com/api/reviews`

### Frontend App (Vercel)
```
https://waitnot-restaurant-app.vercel.app
```

---

## 🔧 Environment Variables Configured

### Backend (Render)
- ✅ **FRONTEND** = `https://waitnot-restaurant-app.vercel.app`
- ✅ **JWT_SECRET** = `e66btfddb5d680c01e4a9975f5ab571f`
- ✅ **PORT** = `10000`
- ✅ **RAZORPAY_KEY_ID** = (configured)
- ✅ **RAZORPAY_KEY_SECRET** = (configured)
- ✅ **MSG91_AUTH_KEY** = (configured)

### Frontend (Vercel)
- ✅ **REACT_APP_API_URL** = `https://waitnot-backend.onrender.com`

---

## 📱 Mobile App Configuration

### Current APK Backend URL
The mobile app is configured to use:
```
https://waitnot-backend.onrender.com/api
```

This is set in `client/src/config.js`

---

## 🧪 Testing Your Deployment

### 1. Test Backend API
Open in browser:
```
https://waitnot-backend.onrender.com/api/restaurants
```

Should return JSON with restaurant data ✅

### 2. Test Frontend
Open in browser:
```
https://waitnot-restaurant-app.vercel.app
```

Should load the app ✅

### 3. Test API Connection
1. Open frontend app
2. Open browser DevTools (F12)
3. Go to Network tab
4. Browse restaurants
5. Check if API calls are successful (Status 200)

---

## ⚠️ Important Notes

### Render Free Tier Limitations:
- ⏰ **Service sleeps after 15 minutes** of inactivity
- 🐌 **First request takes 30-60 seconds** to wake up
- 💾 **Data may reset** on service restart (using JSON files)
- 🔄 **750 hours/month free** (enough for testing)

### Solutions:
1. **Upgrade to Starter Plan** ($7/month) - Always on, no sleep
2. **Use Uptime Monitor** - Ping service every 10 minutes to keep awake
3. **Migrate to MongoDB** - Persist data across restarts

---

## 🔄 Keep Service Awake (Free Tier)

### Option 1: UptimeRobot (Recommended)
1. Sign up: https://uptimerobot.com (Free)
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `https://waitnot-backend.onrender.com/api/restaurants`
   - Interval: 5 minutes
3. Service will stay awake 24/7 ✅

### Option 2: Cron-Job.org
1. Sign up: https://cron-job.org (Free)
2. Create Cronjob:
   - URL: `https://waitnot-backend.onrender.com/api/restaurants`
   - Interval: Every 10 minutes
3. Enable job ✅

### Option 3: GitHub Actions (Advanced)
Create `.github/workflows/keep-alive.yml`:
```yaml
name: Keep Render Service Awake
on:
  schedule:
    - cron: '*/10 * * * *' # Every 10 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl https://waitnot-backend.onrender.com/api/restaurants
```

---

## 📊 Monitoring & Logs

### Render Dashboard
- View Logs: https://dashboard.render.com
- Monitor Performance
- Check Deployment Status
- View Error Logs

### Vercel Dashboard
- View Deployments: https://vercel.com/dashboard
- Check Build Logs
- Monitor Analytics
- View Function Logs

---

## 🔐 Security Checklist

- ✅ HTTPS enabled (automatic)
- ✅ JWT_SECRET is secure (32+ characters)
- ✅ API keys not exposed in frontend
- ✅ CORS configured (if needed)
- ⚠️ Consider rate limiting for production
- ⚠️ Add input validation
- ⚠️ Implement request logging

---

## 🚀 Deployment Workflow

### When You Push to GitHub:
1. **Backend (Render):**
   - Auto-detects changes in `server/` folder
   - Runs `npm install`
   - Starts with `node server.js`
   - Deploys in ~2-3 minutes

2. **Frontend (Vercel):**
   - Auto-detects changes in `client/` folder
   - Runs `npm install && npm run build`
   - Deploys static files
   - Deploys in ~2-3 minutes

### Manual Deploy:
- **Render:** Dashboard → Service → Manual Deploy
- **Vercel:** Dashboard → Project → Redeploy

---

## 📱 Update Mobile App

### To use production backend in APK:
1. Backend URL is already configured in `client/src/config.js`
2. Rebuild APK:
   ```bash
   cd client
   npm run build
   cd android
   ./gradlew assembleRelease
   ```
3. APK will use production backend automatically ✅

---

## 🐛 Troubleshooting

### Backend not responding:
1. Check Render dashboard - service running?
2. Check logs for errors
3. Verify environment variables
4. Test API directly in browser

### Frontend can't connect to backend:
1. Check browser console for errors
2. Verify API_URL in config.js
3. Check CORS settings
4. Test backend URL directly

### Service sleeping too often:
1. Set up UptimeRobot (free)
2. Or upgrade to Starter plan ($7/month)

### Data lost after restart:
1. This is normal with JSON file storage on free tier
2. Migrate to MongoDB Atlas (free)
3. Or upgrade to paid Render plan

---

## 📞 Quick Links

- **Backend Dashboard:** https://dashboard.render.com
- **Frontend Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/MuhammedAman113114/waitnot-restaurant-app
- **Backend API:** https://waitnot-backend.onrender.com
- **Frontend App:** https://waitnot-restaurant-app.vercel.app

---

## ✅ Status

**FULLY DEPLOYED** ✅

- ✅ Backend running on Render
- ✅ Frontend running on Vercel
- ✅ Environment variables configured
- ✅ API endpoints working
- ✅ Mobile app configured
- ✅ Auto-deploy enabled

**Your Waitnot app is live and accessible worldwide!** 🌍🚀
