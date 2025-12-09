# 🔐 Restaurant Login Credentials

## Restaurant Dashboard Login

### Access URL:
```
https://waitnot-restaurant-app.vercel.app/restaurant-login
```

---

## 🏪 Available Restaurants

### 1. **Spice Garden** (Indian Cuisine)
- **Email**: `spice@test.com`
- **Password**: `password123`
- **Restaurant ID**: `midc8u7tc3cqndc1r26`
- **Cuisine**: Indian, North Indian, Tandoor
- **Tables**: 10

---

### 2. **Pizza Paradise** (Italian Cuisine)
- **Email**: `pizza@test.com`
- **Password**: `password123`
- **Restaurant ID**: `midc8u9d91l99mo7yxq`
- **Cuisine**: Italian, Pizza
- **Tables**: 8

---

### 3. **Burger Hub** (American Cuisine)
- **Email**: `burger@test.com`
- **Password**: `password123`
- **Restaurant ID**: `midc8uax60xh1mcd1d`
- **Cuisine**: American, Burgers
- **Tables**: 6

---

## 📱 How to Login

### Web Dashboard:
1. Go to: https://waitnot-restaurant-app.vercel.app/restaurant-login
2. Enter email and password
3. Click "Login"

### Features After Login:
- ✅ View and manage orders
- ✅ Add/edit menu items
- ✅ Upload food reels
- ✅ Generate QR codes for tables
- ✅ View analytics and reports
- ✅ Manage payment settings

---

## 🔑 Default Password

All test restaurants use the same password for easy testing:
```
password123
```

---

## 🆕 Create New Restaurant

If you want to create a new restaurant account:

1. Go to: https://waitnot-restaurant-app.vercel.app/restaurant-login
2. Click **"Register"**
3. Fill in:
   - Restaurant Name
   - Email
   - Password
   - Phone
   - Address
4. Click **"Register"**

---

## 🧪 Testing Data Isolation

### Test Scenario:
1. **Browser 1**: Login to Spice Garden
2. **Browser 2**: Login to Pizza Paradise
3. **Verify**: Each sees only their own data

### What to Check:
- ✅ Orders are separate
- ✅ Reels are separate
- ✅ Menu items are separate
- ✅ Analytics are separate
- ✅ No cross-restaurant data

---

## 🔒 Security Notes

### Production Recommendations:
1. **Change default passwords** immediately
2. **Use strong passwords** (min 12 characters)
3. **Enable 2FA** (if implemented)
4. **Regular password rotation**
5. **Monitor login activity**

### Password Requirements:
- Minimum 8 characters
- Mix of letters and numbers recommended
- Special characters supported

---

## 🆘 Troubleshooting

### Can't Login?
1. **Check email spelling** (case-sensitive)
2. **Verify password** (no spaces)
3. **Clear browser cache**
4. **Try incognito mode**
5. **Check internet connection**

### Forgot Password?
Currently, password reset is not implemented. Contact admin or:
1. Register a new account
2. Or check database directly

---

## 📊 Restaurant Details

### Spice Garden:
- **Rating**: 4.5 ⭐
- **Delivery Time**: 30-40 min
- **Menu Items**: 4+ items
- **Specialties**: Paneer Tikka, Chicken Biryani, Dal Makhani

### Pizza Paradise:
- **Rating**: 4.8 ⭐
- **Delivery Time**: 25-35 min
- **Menu Items**: 5+ items
- **Specialties**: Margherita, Pepperoni, Veggie Supreme

### Burger Hub:
- **Rating**: 4.6 ⭐
- **Delivery Time**: 20-30 min
- **Menu Items**: 6+ items
- **Specialties**: Classic Burger, Cheese Burger, Veggie Burger

---

## 🔄 Session Management

### Session Duration:
- **Token Expiry**: 7 days
- **Auto-logout**: After 7 days of inactivity
- **Remember Me**: Enabled by default

### Logout:
- Click **"Logout"** button in dashboard
- Clears both localStorage and sessionStorage
- Redirects to login page

---

## 🌐 API Endpoints

### Login:
```
POST /api/auth/login
Body: { email, password }
```

### Register:
```
POST /api/auth/register
Body: { email, password, name, phone, address }
```

---

## 📝 Quick Reference

| Restaurant | Email | Password | ID |
|------------|-------|----------|-----|
| Spice Garden | spice@test.com | password123 | midc8u7tc3cqndc1r26 |
| Pizza Paradise | pizza@test.com | password123 | midc8u9d91l99mo7yxq |
| Burger Hub | burger@test.com | password123 | midc8uax60xh1mcd1d |

---

## ✅ Status

**All credentials are active and working!** ✅

Test them at: https://waitnot-restaurant-app.vercel.app/restaurant-login

---

**Need help?** Check the documentation or open an issue on GitHub.
