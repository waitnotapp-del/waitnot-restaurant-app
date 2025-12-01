# 🍽️ Waitnot - AI-Powered Restaurant Ordering Platform

> A modern, full-stack restaurant ordering platform with AI voice assistant, QR code ordering, video reels, and real-time order management.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://waitnot-restaurant-app.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [Voice Assistant](#-voice-assistant)
- [Mobile App](#-mobile-app)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎤 AI Voice Assistant
- **Wake Word Activation**: "Hey Waiter" to start ordering
- **Natural Conversation**: Complete orders through voice commands
- **Dual Input**: Voice OR text input for universal compatibility
- **Auto-Login**: Automatic account creation for seamless ordering
- **Continuous Conversation**: No page refresh needed between responses

### 📱 Mobile-First Design
- **QR Code Ordering**: Scan table QR codes for instant ordering
- **Video Reels**: Instagram-style food reels with order integration
- **Responsive UI**: Optimized for all screen sizes
- **Native APK**: Android app with full offline support
- **Dark Mode**: Beautiful dark theme support

### 🏪 Restaurant Management
- **Dashboard**: Real-time order management
- **Menu Management**: Easy menu item creation and editing
- **Order Tracking**: Live order status updates
- **Analytics**: View ratings, reviews, and order history
- **QR Code Generation**: Unique QR codes for each table

### 💳 Payment Integration
- **Multiple Methods**: UPI, Cash on Delivery, Card payments
- **Razorpay Integration**: Secure online payments
- **Order History**: Complete transaction tracking
- **Payment Status**: Real-time payment confirmation

### 🌐 Multi-Language Support
- English, Hindi, Tamil, Telugu, Kannada, Malayalam
- RTL support for Arabic
- Easy language switching

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Capacitor** - Native mobile app
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.io** - WebSocket server
- **JSON File Storage** - Default data storage
- **Bcrypt** - Password hashing
- **JWT** - Authentication

### AI & Voice
- **Web Speech API** - Browser voice recognition
- **Speech Synthesis API** - Text-to-speech
- **Hugging Face** - AI language processing (optional)

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **GitHub Actions** - CI/CD

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Git
- Android Studio (for APK builds)
- Java JDK 17 (for APK builds)

### Clone Repository
```bash
git clone https://github.com/MuhammedAman113114/waitnot-restaurant-app.git
cd waitnot-restaurant-app
```

### Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Start Development Servers
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

### Access Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

---

## 📦 Installation

### Detailed Setup

#### 1. Backend Setup
```bash
cd server
npm install

# Create .env file (optional)
echo "PORT=5000" > .env
echo "MONGODB_URI=your_mongodb_uri" >> .env
echo "JWT_SECRET=your_jwt_secret" >> .env

# Start server
npm run dev
```

#### 2. Frontend Setup
```bash
cd client
npm install

# Configure API URL (if needed)
# Edit client/src/main.jsx
# Change: axios.defaults.baseURL = 'your_backend_url'

# Start development server
npm run dev
```

#### 3. Build for Production
```bash
# Build frontend
cd client
npm run build

# Build backend (if needed)
cd ../server
npm run build
```

---

## 💻 Usage

### For Customers

#### 1. Browse Restaurants
- Open the app
- Browse available restaurants
- View menus, ratings, and reviews

#### 2. Order via Voice Assistant
```
1. Tap the blue chat button 💬 or red microphone button 🎤
2. Say: "Hey Waiter, I want pizza"
3. Follow the conversation:
   - "Vegetarian or non-vegetarian?"
   - "Vegetarian"
   - "How many?"
   - "Two"
4. Order placed automatically!
```

#### 3. Order via QR Code
```
1. Scan QR code at restaurant table
2. Browse menu
3. Add items to cart
4. Checkout and pay
```

#### 4. Watch Food Reels
```
1. Tap "Reels" in bottom navigation
2. Swipe through food videos
3. Tap "Order Now" on any reel
4. Complete order
```

### For Restaurants

#### 1. Register Restaurant
```
1. Go to /restaurant-login
2. Click "Register"
3. Fill in restaurant details
4. Submit
```

#### 2. Manage Menu
```
1. Login to dashboard
2. Click "Add Menu Item"
3. Enter item details
4. Upload image
5. Save
```

#### 3. Manage Orders
```
1. View incoming orders in real-time
2. Update order status
3. Track payment status
4. View order history
```

#### 4. Generate QR Codes
```
1. Go to "QR Codes" section
2. Enter table number
3. Generate QR code
4. Print and place on table
```

---

## 🎤 Voice Assistant

### Wake Word
- **"Hey Waiter"** - Primary wake word
- **"Hi Waiter"** - Alternative
- **"Hello Waiter"** - Alternative

### Voice Commands
```
"Hey Waiter, I want pizza"
"Hey Waiter, get me a burger"
"Hey Waiter, order biryani"
"Hey Waiter, I need two pizzas"
```

### Text Input (Universal Fallback)
If voice is not supported:
1. Tap the blue chat button 💬
2. Type: "Hey Waiter, I want pizza"
3. Tap "Send Order"
4. Continue conversation via text

### Supported Browsers
- ✅ Chrome (Android/Desktop) - Full voice support
- ✅ Safari (iOS/Mac) - Full voice support
- ✅ Edge (Desktop) - Full voice support
- ✅ Firefox (All) - Text input only
- ✅ All browsers - Text input always available

### Features
- **Continuous Conversation**: No refresh needed
- **Auto-Login**: Automatic account creation
- **Order History**: All orders saved
- **Feedback Loop Prevention**: Smart echo detection
- **Duplicate Prevention**: No repeat processing

---

## 📱 Mobile App

### Build Android APK

#### Prerequisites
- Android Studio installed
- Java JDK 17 installed
- Android SDK configured

#### Build Steps
```bash
# Run the build script
.\build-with-java17.bat

# APK location
client\android\app\build\outputs\apk\debug\app-debug.apk
```

#### Install APK
```
1. Transfer APK to Android device
2. Enable "Install from Unknown Sources"
3. Tap APK file to install
4. Open Waitnot app
```

### Features in APK
- ✅ Native voice recognition
- ✅ Offline menu caching
- ✅ Push notifications
- ✅ Better performance
- ✅ Full feature parity with web

---

## 🌐 Deployment

### Frontend (Vercel)

#### Automatic Deployment
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys from GitHub
# Live at: https://waitnot-restaurant-app.vercel.app
```

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd client
vercel
```

### Backend (Render)

#### Automatic Deployment
```bash
# Push to GitHub
git push origin main

# Render auto-deploys from GitHub
# Live at: https://waitnot-restaurant-app.onrender.com
```

#### Configuration
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node
- **Root Directory**: `server`

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
HUGGINGFACE_API_KEY=your_huggingface_key (optional)
```

#### Frontend
```javascript
// client/src/main.jsx
axios.defaults.baseURL = 'https://your-backend-url.com'
```

---

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123",
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "123 Main St"
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}
```

### Restaurants

#### Get All Restaurants
```http
GET /api/restaurants
```

#### Get Restaurant by ID
```http
GET /api/restaurants/:id
```

#### Create Restaurant (Auth Required)
```http
POST /api/restaurants
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Spice Garden",
  "cuisine": "Indian",
  "rating": 4.5,
  "deliveryTime": "30-40 min",
  "image": "image_url"
}
```

### Orders

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "restaurantId": "restaurant_id",
  "items": [
    {
      "menuItemId": "item_id",
      "name": "Pizza",
      "price": 250,
      "quantity": 2
    }
  ],
  "totalAmount": 500,
  "orderType": "delivery",
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "deliveryAddress": "123 Main St",
  "paymentMethod": "cash",
  "paymentStatus": "pending",
  "userId": "user_id"
}
```

#### Get User Orders
```http
GET /api/users/orders
Authorization: Bearer {token}
```

#### Update Order Status
```http
PATCH /api/orders/:id/status
Content-Type: application/json

{
  "status": "preparing"
}
```

### Voice Assistant

#### Process Voice Command
```http
POST /api/voice/process
Content-Type: application/json

{
  "command": "I want pizza",
  "restaurantId": "restaurant_id",
  "tableNumber": "5"
}
```

### Reels

#### Get All Reels
```http
GET /api/reels
```

#### Create Reel (Auth Required)
```http
POST /api/reels
Authorization: Bearer {token}
Content-Type: application/json

{
  "dishName": "Margherita Pizza",
  "price": 250,
  "videoUrl": "video_url",
  "restaurantId": "restaurant_id"
}
```

---

## 🎨 Customization

### Branding
Edit `client/src/index.css` for colors:
```css
:root {
  --primary: #ef4444; /* Red */
  --secondary: #3b82f6; /* Blue */
}
```

### Logo
Replace `client/public/logo.png` with your logo.

### App Name
Edit `client/index.html`:
```html
<title>Your Restaurant Name</title>
```

---

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Test Voice Assistant
```bash
# Open browser console
# Enable verbose logging
localStorage.setItem('debug', 'true')

# Test voice commands
"Hey Waiter, I want pizza"
```

---

## 🐛 Troubleshooting

### Voice Assistant Not Working
1. Check browser compatibility (Chrome/Safari recommended)
2. Ensure HTTPS connection
3. Grant microphone permissions
4. Try text input fallback (blue chat button)

### Orders Not Showing in History
1. Ensure user is logged in
2. Check browser console for errors
3. Verify backend connection
4. Clear localStorage and re-login

### APK Build Fails
1. Check Java version: `java -version` (should be 17)
2. Verify Android SDK path
3. Run `.\build-with-java17.bat`
4. Check build logs for errors

### Backend Connection Issues
1. Verify backend is running
2. Check API URL in `client/src/main.jsx`
3. Ensure CORS is enabled
4. Check network tab in browser

---

## 📖 Documentation

- [Voice Assistant Guide](UNIVERSAL_VOICE_ASSISTANT_GUIDE.md)
- [Quick Start Guide](VOICE_ASSISTANT_QUICK_START.md)
- [APK Build Guide](APK_BUILD_COMPLETE_GUIDE.md)
- [Deployment Guide](DEPLOY_COMPLETE_WEBSITE.md)
- [Testing Guide](TEST_VOICE_ASSISTANT_NOW.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Mohammed Aman** - *Initial work* - [MuhammedAman113114](https://github.com/MuhammedAman113114)

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Vercel for hosting
- Render for backend hosting
- Capacitor for mobile app framework
- All contributors and testers

---

## 📞 Support

For support, email support@waitnot.com or open an issue on GitHub.

---

## 🔗 Links

- **Live Demo**: https://waitnot-restaurant-app.vercel.app
- **GitHub**: https://github.com/MuhammedAman113114/waitnot-restaurant-app
- **Documentation**: [View Docs](docs/)

---

## 📊 Project Stats

- **Total Lines of Code**: 50,000+
- **Components**: 30+
- **API Endpoints**: 25+
- **Supported Languages**: 7
- **Mobile Platforms**: Android (iOS coming soon)

---

## 🎯 Roadmap

- [ ] iOS App
- [ ] Payment Gateway Integration (Stripe)
- [ ] Restaurant Analytics Dashboard
- [ ] Customer Loyalty Program
- [ ] Table Reservation System
- [ ] Multi-Restaurant Chains Support
- [ ] Delivery Tracking
- [ ] Push Notifications
- [ ] Social Media Integration
- [ ] Advanced AI Recommendations

---

## ⭐ Star History

If you find this project useful, please consider giving it a star on GitHub!

---

**Made with ❤️ by Mohammed Aman**

**Happy Ordering! 🍕🍔🍜**
