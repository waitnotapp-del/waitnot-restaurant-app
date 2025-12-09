# 🚀 Render Account Setup - Complete Guide from Beginning

## 📋 Table of Contents
1. [Create Render Account](#1-create-render-account)
2. [Connect GitHub](#2-connect-github)
3. [Deploy Backend (Node.js)](#3-deploy-backend-nodejs)
4. [Deploy Frontend (Static Site)](#4-deploy-frontend-static-site)
5. [Environment Variables](#5-environment-variables)
6. [Database Setup](#6-database-setup)
7. [Custom Domain (Optional)](#7-custom-domain-optional)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Create Render Account

### Step 1.1: Sign Up
1. Go to **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Choose sign-up method:
   - **GitHub** (Recommended - easier integration)
   - **GitLab**
   - **Email**

### Step 1.2: Choose GitHub Sign-Up (Recommended)
1. Click **"Sign up with GitHub"**
2. Authorize Render to access your GitHub account
3. Grant permissions:
   - ✅ Read repository information
   - ✅ Access commit status
   - ✅ Deploy from repositories

### Step 1.3: Verify Email
1. Check your email inbox
2. Click verification link
3. Complete profile setup:
   - Name: Your name
   - Company: Optional
   - Use case: Personal/Business

### Step 1.4: Choose Plan
- **Free Plan** (Perfect for testing):
  - ✅ 750 hours/month free
  - ✅ Automatic HTTPS
  - ✅ Auto-deploy from Git
  - ❌ Services sleep after 15 min inactivity
  - ❌ Slower cold starts

- **Starter Plan** ($7/month):
  - ✅ Always-on services
  - ✅ Faster performance
  - ✅ No sleep time

**For now, select FREE plan** ✅

---

## 2. Connect GitHub

### Step 2.1: Install Render GitHub App
1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect GitHub"**
4. Choose:
   - **All repositories** (easier)
   - OR **Only select repositories** (more secure)

### Step 2.2: Select Your Repository
1. Find your repository: **`waitnot-restaurant-app`**
2. Click **"Connect"**
3. Render will scan your repository

---

## 3. Deploy Backend (Node.js)

### Step 3.1: Create Web Service for Backend
1. Click **"New +"** → **"Web Service"**
2. Select your repository: **`waitnot-restaurant-app`**
3. Click **"Connect"**

### Step 3.2: Configure Backend Service
Fill in the following details:

**Basic Settings:**
```
Name: waitnot-backend
Region: Oregon (US West) or closest to you
Branch: main
Root Directory: server
```

**Build & Deploy:**
```
Runtime: Node
Build Command: npm install
Start Command: node server.js
```

**Instance Type:**
```
Free (for testing)
```

### Step 3.3: Environment Variables
Click **"Advanced"** → **"Add Environment Variable"

Add these variables:

```bash
# Port (Render provides this automatically)
PORT=10000

# MongoDB Connection (if using MongoDB)
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this

# OpenAI API Key (for voice assistant)
OPENAI_API_KEY=your_openai_api_key

# Hugging Face API Key (alternative)
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Node Environment
NODE_ENV=production

# CORS Origin (your frontend URL)
CORS_ORIGIN=https://waitnot-restaurant-app.vercel.app

# Session Secret
SESSION_SECRET=your_session_secret_key
```

### Step 3.4: Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Watch logs for any errors
4. Once deployed, you'll get a URL like:
   ```
   https://waitnot-backend.onrender.com
   ```

### Step 3.5: Test Backend
Open in browser:
```
https://waitnot-backend.onrender.com/api/restaurants
```

Should return JSON data ✅

---

## 4. Deploy Frontend (Static Site)

### Option A: Deploy on Vercel (Recommended for React)

#### Step 4A.1: Create Vercel Account
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

#### Step 4A.2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Select **`waitnot-restaurant-app`**
3. Click **"Import"**

#### Step 4A.3: Configure Project
```
Framework Preset: Create React App
Root Directory: client
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

#### Step 4A.4: Environment Variables
Add in Vercel:
```bash
REACT_APP_API_URL=https://waitnot-backend.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key (optional)
```

#### Step 4A.5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Get URL: `https://waitnot-restaurant-app.vercel.app`

---

### Option B: Deploy Frontend on Render (Alternative)

#### Step 4B.1: Create Static Site
1. In Render Dashboard, click **"New +"**
2. Select **"Static Site"**
3. Connect repository: **`waitnot-restaurant-app`**

#### Step 4B.2: Configure Static Site
```
Name: waitnot-frontend
Branch: main
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: build
```

#### Step 4B.3: Environment Variables
```bash
REACT_APP_API_URL=https://waitnot-backend.onrender.com
```

#### Step 4B.4: Deploy
1. Click **"Create Static Site"**
2. Wait for build (3-5 minutes)
3. Get URL: `https://waitnot-frontend.onrender.com`

---

## 5. Environment Variables

### Backend Environment Variables (.env)

Create these in Render Dashboard → Your Service → Environment:

```bash
# Server Configuration
PORT=10000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/waitnot?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_jwt_secret_min_32_characters_long
SESSION_SECRET=your_session_secret_min_32_characters

# API Keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx

# CORS
CORS_ORIGIN=https://waitnot-restaurant-app.vercel.app

# Payment (if using)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# SMS (if using)
MSG91_AUTH_KEY=your_msg91_key
```

### Frontend Environment Variables

Create `.env.production` in `client/` folder:

```bash
REACT_APP_API_URL=https://waitnot-backend.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 6. Database Setup

### Option A: MongoDB Atlas (Recommended)

#### Step 6.1: Create MongoDB Account
1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"**
3. Sign up with Google/GitHub

#### Step 6.2: Create Cluster
1. Choose **"Shared"** (Free tier)
2. Select **"AWS"** provider
3. Choose region closest to your Render region
4. Cluster name: **`waitnot-cluster`**
5. Click **"Create Cluster"**

#### Step 6.3: Create Database User
1. Go to **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `waitnot_admin`
5. Password: Generate secure password (save it!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

#### Step 6.4: Whitelist IP Address
1. Go to **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This allows Render to connect
4. Click **"Confirm"**

#### Step 6.5: Get Connection String
1. Go to **"Database"** → **"Connect"**
2. Choose **"Connect your application"**
3. Copy connection string:
   ```
   mongodb+srv://waitnot_admin:<password>@waitnot-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `/waitnot`
   ```
   mongodb+srv://waitnot_admin:yourpassword@waitnot-cluster.xxxxx.mongodb.net/waitnot?retryWrites=true&w=majority
   ```

#### Step 6.6: Add to Render
1. Go to Render Dashboard → Backend Service
2. Environment → Add Variable
3. Key: `MONGODB_URI`
4. Value: Your connection string
5. Click **"Save Changes"**
6. Service will auto-redeploy

---

### Option B: Use JSON File Storage (Current Setup)

Your app currently uses JSON files in `server/data/`:
- `restaurants.json`
- `users.json`
- `orders.json`

**Pros:**
- ✅ No database setup needed
- ✅ Works immediately

**Cons:**
- ❌ Data resets on Render free tier restarts
- ❌ Not scalable

**To persist data on Render:**
1. Upgrade to paid plan ($7/month)
2. OR migrate to MongoDB Atlas (free)

---

## 7. Custom Domain (Optional)

### Step 7.1: Buy Domain
Buy from:
- **Namecheap** (cheapest)
- **GoDaddy**
- **Google Domains**

Example: `waitnot.com`

### Step 7.2: Add Domain to Render
1. Go to Render Dashboard → Your Service
2. Click **"Settings"** → **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter: `api.waitnot.com` (for backend)
5. Render will show DNS records

### Step 7.3: Configure DNS
In your domain registrar (Namecheap, etc.):

**For Backend (api.waitnot.com):**
```
Type: CNAME
Name: api
Value: waitnot-backend.onrender.com
TTL: Automatic
```

**For Frontend (www.waitnot.com):**
```
Type: CNAME
Name: www
Value: waitnot-frontend.onrender.com
TTL: Automatic
```

**For Root Domain (waitnot.com):**
```
Type: A
Name: @
Value: 216.24.57.1 (Render's IP)
TTL: Automatic
```

### Step 7.4: Wait for DNS Propagation
- Takes 5 minutes to 48 hours
- Usually works in 15-30 minutes
- Check status: https://dnschecker.org

### Step 7.5: Enable HTTPS
Render automatically provisions SSL certificate (free)

---

## 8. Troubleshooting

### Issue 1: Build Failed
**Error:** `npm install failed`

**Solution:**
1. Check `package.json` exists in root directory
2. Verify Node version compatibility
3. Check build logs for specific error
4. Try locally: `npm install && npm run build`

---

### Issue 2: Service Not Starting
**Error:** `Application failed to respond`

**Solution:**
1. Check start command: `node server.js`
2. Verify `PORT` environment variable is used:
   ```javascript
   const PORT = process.env.PORT || 5000;
   ```
3. Check logs for errors
4. Ensure all dependencies are in `package.json`

---

### Issue 3: CORS Error
**Error:** `Access-Control-Allow-Origin`

**Solution:**
Add to backend `server.js`:
```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

Add environment variable:
```
CORS_ORIGIN=https://waitnot-restaurant-app.vercel.app
```

---

### Issue 4: Database Connection Failed
**Error:** `MongoServerError: Authentication failed`

**Solution:**
1. Check MongoDB username/password
2. Verify IP whitelist (0.0.0.0/0)
3. Check connection string format
4. Test connection locally first

---

### Issue 5: Environment Variables Not Working
**Error:** `undefined` values

**Solution:**
1. Verify variables are added in Render Dashboard
2. Click **"Save Changes"** after adding
3. Service must redeploy after changes
4. Check variable names match exactly (case-sensitive)

---

### Issue 6: Service Sleeping (Free Tier)
**Issue:** First request takes 30+ seconds

**Solution:**
- This is normal on free tier
- Service sleeps after 15 min inactivity
- Upgrade to Starter plan ($7/month) for always-on
- OR use a ping service (UptimeRobot) to keep it awake

---

### Issue 7: API Not Responding
**Error:** `Failed to fetch`

**Solution:**
1. Check backend URL is correct
2. Verify service is running (green status)
3. Test API directly: `https://your-backend.onrender.com/api/restaurants`
4. Check browser console for errors
5. Verify CORS settings

---

## 📊 Deployment Checklist

### Before Deployment:
- [ ] Code pushed to GitHub
- [ ] `package.json` has all dependencies
- [ ] Environment variables documented
- [ ] Database connection string ready
- [ ] API keys obtained (OpenAI, etc.)

### Backend Deployment:
- [ ] Render account created
- [ ] GitHub connected
- [ ] Web service created
- [ ] Environment variables added
- [ ] Build successful
- [ ] Service running (green status)
- [ ] API endpoints responding

### Frontend Deployment:
- [ ] Vercel/Render account created
- [ ] Repository connected
- [ ] Build command configured
- [ ] Environment variables added
- [ ] Build successful
- [ ] Site accessible
- [ ] API calls working

### Post-Deployment:
- [ ] Test all features
- [ ] Check mobile responsiveness
- [ ] Verify database connections
- [ ] Test payment integration
- [ ] Check voice assistant
- [ ] Monitor logs for errors

---

## 🔄 Auto-Deploy Setup

### Enable Auto-Deploy:
1. Go to Render Dashboard → Your Service
2. Settings → **"Auto-Deploy"**
3. Toggle **ON**
4. Choose branch: **`main`**

Now every push to `main` branch automatically deploys! 🚀

---

## 💰 Pricing Summary

### Free Tier:
- **Render Backend:** Free (750 hours/month)
- **Vercel Frontend:** Free (100 GB bandwidth)
- **MongoDB Atlas:** Free (512 MB storage)
- **Total:** $0/month ✅

### Paid Tier (Recommended for Production):
- **Render Starter:** $7/month (always-on)
- **Vercel Pro:** $20/month (optional)
- **MongoDB Atlas:** Free tier sufficient
- **Total:** $7-27/month

---

## 📞 Support Resources

### Render Support:
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### MongoDB Support:
- Docs: https://docs.mongodb.com
- University: https://university.mongodb.com
- Forums: https://www.mongodb.com/community/forums

### Vercel Support:
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord
- Status: https://vercel-status.com

---

## 🎯 Quick Start Commands

### Deploy Backend:
```bash
# In Render Dashboard
Name: waitnot-backend
Root: server
Build: npm install
Start: node server.js
```

### Deploy Frontend:
```bash
# In Vercel Dashboard
Framework: Create React App
Root: client
Build: npm run build
Output: build
```

### Update Environment Variables:
```bash
# Render Dashboard → Service → Environment
# Add each variable, then click "Save Changes"
```

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Backend URL returns JSON: `https://your-backend.onrender.com/api/restaurants`
- ✅ Frontend loads: `https://your-frontend.vercel.app`
- ✅ API calls work (check Network tab)
- ✅ Database connected (no errors in logs)
- ✅ All features functional

---

## 🚀 Next Steps After Deployment

1. **Test Everything:**
   - Create account
   - Browse restaurants
   - Place order
   - Test voice assistant
   - Check payment flow

2. **Monitor Performance:**
   - Check Render logs
   - Monitor response times
   - Watch for errors

3. **Optimize:**
   - Enable caching
   - Compress images
   - Minify code

4. **Scale:**
   - Upgrade to paid tier when needed
   - Add CDN for static assets
   - Implement Redis for caching

---

## 📝 Important URLs to Save

```
Backend API: https://waitnot-backend.onrender.com
Frontend App: https://waitnot-restaurant-app.vercel.app
MongoDB: https://cloud.mongodb.com
Render Dashboard: https://dashboard.render.com
Vercel Dashboard: https://vercel.com/dashboard
GitHub Repo: https://github.com/yourusername/waitnot-restaurant-app
```

---

## ✅ Status

**COMPLETE GUIDE** ✅

You now have everything needed to:
- ✅ Create Render account from scratch
- ✅ Deploy backend Node.js app
- ✅ Deploy frontend React app
- ✅ Configure database
- ✅ Set environment variables
- ✅ Add custom domain
- ✅ Troubleshoot issues

**Your Waitnot app is ready to deploy to production!** 🚀✨
