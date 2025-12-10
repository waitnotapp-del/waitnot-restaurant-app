import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, QrCode, LogOut, Film, Eye, Heart, X, CreditCard, Moon, Sun, BarChart3, ShoppingBag, Users, Package, DollarSign, TrendingUp, MapPin } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import BillModal from '../components/BillModal';
import RestaurantAnalytics from '../components/RestaurantAnalytics';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import AnalyticsExport from '../components/AnalyticsExport';
import OrderNotifications from '../components/OrderNotifications';
import QuickStats from '../components/QuickStats';
import PaymentSettingsTab from '../components/PaymentSettingsTab';
import RestaurantLocationSettings from '../components/RestaurantLocationSettings';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reels, setReels] = useState([]);
  const [activeTab, setActiveTab] = useState('delivery');
  const [orderSubTab, setOrderSubTab] = useState('delivery');
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showReelForm, setShowReelForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingReel, setEditingReel] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('restaurantDarkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [menuForm, setMenuForm] = useState({
    name: '', price: '', category: 'Starters', description: '', isVeg: true, image: ''
  });
  const [reelForm, setReelForm] = useState({
    videoUrl: '', dishName: '', price: '', menuItemId: ''
  });
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'upload'
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadMethod, setImageUploadMethod] = useState('url'); // 'url' or 'upload'
  const [imageFile, setImageFile] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);

  // Theme toggle effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('restaurantDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    // CRITICAL: Check both localStorage AND sessionStorage
    // sessionStorage is tab-specific and won't be affected by other tabs
    let restaurantId = sessionStorage.getItem('restaurantId');
    let restaurantToken = sessionStorage.getItem('restaurantToken');
    
    // If not in sessionStorage, get from localStorage and save to sessionStorage
    if (!restaurantId || !restaurantToken) {
      restaurantId = localStorage.getItem('restaurantId');
      restaurantToken = localStorage.getItem('restaurantToken');
      
      if (restaurantId && restaurantToken) {
        // Save to sessionStorage for this tab
        sessionStorage.setItem('restaurantId', restaurantId);
        sessionStorage.setItem('restaurantToken', restaurantToken);
        console.log('💾 Saved to sessionStorage for tab protection');
      }
    }
    
    console.log('=== Restaurant Dashboard Loading ===');
    console.log('Restaurant ID from sessionStorage:', restaurantId);
    console.log('Restaurant Token exists:', !!restaurantToken);
    
    if (!restaurantId || !restaurantToken) {
      console.log('No restaurant credentials found, redirecting to login');
      navigate('/restaurant-login');
      return;
    }

    // CRITICAL: Store the restaurant ID in a ref to prevent any changes
    const lockedRestaurantId = restaurantId;
    console.log('🔒 LOCKED Restaurant ID:', lockedRestaurantId);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    console.log('Fetching data for restaurant:', lockedRestaurantId);
    fetchRestaurant(lockedRestaurantId);
    fetchOrders(lockedRestaurantId);
    fetchReels(lockedRestaurantId);

    // Use production Socket.IO URL
    const socketUrl = localStorage.getItem('socketUrl') || 'https://waitnot-restaurant-app.onrender.com';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    // CRITICAL: Use the locked restaurant ID for socket connection
    console.log('🔌 Joining Socket.IO room for restaurant:', lockedRestaurantId);
    socket.emit('join-restaurant', lockedRestaurantId);
    
    socket.on('new-order', (order) => {
      console.log('New order received:', order);
      setOrders(prev => [order, ...prev]);
      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('New Order!', {
          body: `Order from ${order.customerName}`,
          icon: '/waitnotflogo.png'
        });
      }
    });

    socket.on('order-updated', (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => socket.disconnect();
  }, []);

  const fetchRestaurant = async (id) => {
    try {
      console.log('=== Fetching Restaurant Data ===');
      console.log('Restaurant ID:', id);
      const { data } = await axios.get(`/api/restaurants/${id}`);
      console.log('✓ Restaurant fetched:', data.name, '(ID:', data._id, ')');
      
      // CRITICAL: Verify the fetched restaurant matches the requested ID
      if (data._id !== id) {
        console.error('🚨 CRITICAL ERROR: Restaurant ID mismatch!');
        console.error('Requested ID:', id);
        console.error('Received ID:', data._id);
        console.error('Received Name:', data.name);
        console.error('This should NEVER happen - possible backend issue');
        
        // Don't set the restaurant - redirect to login instead
        localStorage.removeItem('restaurantId');
        localStorage.removeItem('restaurantToken');
        alert('Session error detected. Please login again.');
        navigate('/restaurant-login');
        return;
      }
      
      setRestaurant(data);
      
      // Double-check localStorage hasn't been corrupted
      const storedId = localStorage.getItem('restaurantId');
      if (storedId !== data._id) {
        console.warn('⚠️ localStorage was corrupted!');
        console.warn('Stored ID:', storedId);
        console.warn('Correct ID:', data._id);
        console.warn('Restoring correct ID...');
        localStorage.setItem('restaurantId', data._id);
      }
      
      console.log('=== Data Isolation Check ===');
      console.log('Current Restaurant:', data.name);
      console.log('Restaurant ID:', data._id);
      console.log('All data will be filtered for this restaurant only');
    } catch (error) {
      console.error('❌ Error fetching restaurant:', error);
      // If restaurant not found, redirect to login
      if (error.response?.status === 404) {
        console.error('Restaurant not found, clearing credentials');
        localStorage.removeItem('restaurantId');
        localStorage.removeItem('restaurantToken');
        navigate('/restaurant-login');
      }
    }
  };

  const fetchOrders = async (id) => {
    try {
      console.log('Fetching orders for restaurant:', id);
      const { data } = await axios.get(`/api/orders/restaurant/${id}`);
      
      // Verify all orders belong to this restaurant
      const validOrders = data.filter(order => order.restaurantId === id);
      if (validOrders.length !== data.length) {
        console.warn('⚠️ Data isolation issue: Some orders did not belong to this restaurant');
        console.warn('Expected restaurant:', id);
        console.warn('Total orders received:', data.length);
        console.warn('Valid orders:', validOrders.length);
      }
      
      console.log('Orders fetched:', validOrders.length, 'orders');
      setOrders(validOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchReels = async (restaurantId) => {
    try {
      console.log('Fetching reels for restaurant:', restaurantId);
      // Fetch only reels for this specific restaurant
      const { data } = await axios.get(`/api/reels?restaurantId=${restaurantId}`);
      console.log('Restaurant reels fetched:', data.length, 'reels');
      setReels(data);
    } catch (error) {
      console.error('Error fetching reels:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status });
      // Update local state immediately without refresh
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status } : order
        )
      );
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    }
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      if (editingItem) {
        await axios.put(`/api/restaurants/${restaurantId}/menu/${editingItem._id}`, menuForm);
      } else {
        await axios.post(`/api/restaurants/${restaurantId}/menu`, menuForm);
      }
      fetchRestaurant(restaurantId);
      setShowMenuForm(false);
      setEditingItem(null);
      setMenuForm({ name: '', price: '', category: 'Starters', description: '', isVeg: true });
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const deleteMenuItem = async (menuId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      await axios.delete(`/api/restaurants/${restaurantId}/menu/${menuId}`);
      fetchRestaurant(restaurantId);
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (max 2MB for images)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file is too large. Maximum size is 2MB.\n\nTip: Compress your image at tinypng.com or use a smaller image.');
        return;
      }
      
      setImageFile(file);
      
      // Convert to base64 and preview
      const reader = new FileReader();
      reader.onload = () => {
        setMenuForm({...menuForm, image: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        alert('Please select a video file');
        return;
      }
      
      // Check file size (max 5MB for base64 storage to avoid 413 error)
      if (file.size > 5 * 1024 * 1024) {
        alert('Video file is too large. Maximum size is 5MB for upload.\n\nFor larger videos:\n1. Upload to YouTube/Vimeo\n2. Use "Video URL" option instead\n3. Or compress your video first');
        return;
      }
      
      setVideoFile(file);
      
      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      setReelForm({...reelForm, videoUrl: localUrl});
    }
  };

  const uploadVideoFile = async (file) => {
    // Convert video to base64 for storage (for demo purposes)
    // In production, upload to cloud storage like AWS S3, Cloudinary, etc.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      };
      
      reader.onload = () => {
        resolve(reader.result); // Returns base64 data URL
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleReelSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      
      // Validate required fields
      if (!reelForm.menuItemId) {
        alert('Please select a menu item');
        return;
      }

      // Show loading message for video uploads
      if (uploadMethod === 'upload' && videoFile && !editingReel) {
        console.log('Starting video upload, this may take a moment...');
      }
      
      let videoUrl = reelForm.videoUrl;

      // If uploading a file, handle the upload
      if (uploadMethod === 'upload' && videoFile && !editingReel) {
        setUploadProgress(0);
        try {
          videoUrl = await uploadVideoFile(videoFile);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          alert('Failed to process video file. Please try again or use Video URL option.');
          return;
        }
      }

      // Validate video URL
      if (!videoUrl) {
        alert('Please provide a video URL or upload a video file');
        return;
      }

      const reelData = {
        videoUrl,
        dishName: reelForm.dishName,
        price: Number(reelForm.price),
        menuItemId: reelForm.menuItemId,
        restaurantId
      };

      console.log('Submitting reel data:', reelData);

      let response;
      if (editingReel) {
        response = await axios.put(`/api/reels/${editingReel._id}`, reelData, {
          timeout: 120000 // 2 minutes for video uploads
        });
      } else {
        response = await axios.post('/api/reels', reelData, {
          timeout: 120000 // 2 minutes for video uploads
        });
      }
      
      console.log('Reel saved:', response.data);
      
      await fetchReels(restaurantId);
      setShowReelForm(false);
      setEditingReel(null);
      setReelForm({ videoUrl: '', dishName: '', price: '', menuItemId: '' });
      setVideoFile(null);
      setUploadProgress(0);
      setUploadMethod('url');
      alert('Reel saved successfully!');
    } catch (error) {
      console.error('Error saving reel:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      
      // Special handling for 413 error (payload too large)
      if (error.response?.status === 413 || errorMessage.includes('413')) {
        errorMessage = 'Video file is too large!\n\n' +
                      'Solutions:\n' +
                      '1. Use "Video URL" option instead (recommended)\n' +
                      '2. Compress your video to under 5MB\n' +
                      '3. Upload to YouTube and use the video URL\n\n' +
                      'See VIDEO_GUIDE.md for detailed instructions.';
      }
      
      alert(`Failed to save reel: ${errorMessage}`);
    }
  };

  const deleteReel = async (reelId) => {
    if (!window.confirm('Delete this reel?')) return;
    try {
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      console.log('Deleting reel:', reelId);
      const response = await axios.delete(`/api/reels/${reelId}`);
      console.log('Delete response:', response.data);
      await fetchReels(restaurantId);
      alert('Reel deleted successfully!');
    } catch (error) {
      console.error('Error deleting reel:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to delete reel: ${errorMessage}`);
    }
  };

  const addTable = async () => {
    try {
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      const newTableCount = (restaurant.tables || 0) + 1;
      
      console.log('Adding table:', { restaurantId, newTableCount });
      
      const response = await axios.patch(`/api/restaurants/${restaurantId}/tables`, {
        tables: newTableCount
      });
      
      console.log('Table added response:', response.data);
      
      await fetchRestaurant(restaurantId);
      alert(`Table ${newTableCount} added successfully!`);
    } catch (error) {
      console.error('Error adding table:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to add table: ${errorMsg}`);
    }
  };

  const deleteTable = async (tableNum) => {
    if (!window.confirm(`Delete Table ${tableNum}? This will remove the last table and its QR code.`)) {
      return;
    }
    
    try {
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      const newTableCount = Math.max(0, (restaurant.tables || 0) - 1);
      
      console.log('Deleting table:', { restaurantId, tableNum, newTableCount });
      
      const response = await axios.patch(`/api/restaurants/${restaurantId}/tables`, {
        tables: newTableCount
      });
      
      console.log('Table deleted response:', response.data);
      
      await fetchRestaurant(restaurantId);
      alert('Table deleted successfully!');
    } catch (error) {
      console.error('Error deleting table:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to delete table: ${errorMsg}`);
    }
  };

  const downloadQRCode = async (tableNum, qrUrl) => {
    try {
      // Get the QR code image
      const imgElement = document.querySelector(`#qr-table-${tableNum} img`);
      if (!imgElement) {
        alert('QR code not found. Please try again.');
        return;
      }

      // Create a canvas to draw the QR code with labels
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size (larger for print quality)
      const qrSize = 400;
      const padding = 60;
      canvas.width = qrSize + (padding * 2);
      canvas.height = qrSize + (padding * 3);
      
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load and draw QR code
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      
      qrImage.onload = () => {
        // Draw QR code in center
        ctx.drawImage(qrImage, padding, padding + 40, qrSize, qrSize);
        
        // Add restaurant name at top
        ctx.fillStyle = 'black';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(restaurant.name, canvas.width / 2, 40);
        
        // Add table number at bottom
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`Table ${tableNum}`, canvas.width / 2, qrSize + padding + 80);
        
        // Add "Scan to Order" text
        ctx.font = '20px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('Scan to Order', canvas.width / 2, qrSize + padding + 115);
        
        // Download the canvas as PNG
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${restaurant.name.replace(/\s+/g, '-')}-Table-${tableNum}-QR.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        });
      };
      
      qrImage.onerror = () => {
        alert('Failed to load QR code. Please try again.');
      };
      
      // Use the API URL to generate QR code
      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&margin=20`;
      
    } catch (error) {
      console.error('Error downloading QR code:', error);
      alert('Failed to download QR code. Please try again.');
    }
  };

  const generateBillForTable = async (tableNumber, tableOrders, totalAmount) => {
    // Create bill summary
    const allItems = {};
    tableOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.name;
        if (allItems[key]) {
          allItems[key].quantity += item.quantity;
          allItems[key].total += item.price * item.quantity;
        } else {
          allItems[key] = {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          };
        }
      });
    });

    const firstOrder = tableOrders[0];
    const subtotal = totalAmount;
    const tax = 0; // Can add tax calculation if needed
    
    // Calculate payment breakdown
    const paidOnline = tableOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    const pendingCash = tableOrders
      .filter(o => o.paymentStatus === 'pending')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Create payment details array
    const paymentDetails = [];
    if (paidOnline > 0) {
      paymentDetails.push({
        method: 'Online Payment (Razorpay)',
        amount: paidOnline,
        status: 'paid'
      });
    }
    if (pendingCash > 0) {
      paymentDetails.push({
        method: 'Cash Payment',
        amount: pendingCash,
        status: 'pending'
      });
    }
    
    // Create bill data
    const billData = {
      restaurant: {
        name: restaurant.name,
        address: restaurant.address || '',
        phone: restaurant.phone || ''
      },
      tableNumber,
      customer: {
        name: firstOrder.customerName,
        phone: firstOrder.customerPhone
      },
      items: Object.values(allItems),
      subtotal,
      tax,
      total: totalAmount,
      date: new Date().toLocaleString(),
      billNumber: `BILL-${Date.now()}`,
      paymentDetails, // Array of payment methods used
      paidOnline,
      pendingCash
    };

    // Show bill modal
    setCurrentBill(billData);
    setShowBillModal(true);
    
    try {
      // Mark all orders as completed
      for (const order of tableOrders) {
        if (order.status !== 'completed') {
          await updateOrderStatus(order._id, 'completed');
        }
      }

      // Clear the customer session for this table
      const sessionKey = `table_session_${restaurant._id}_${tableNumber}`;
      localStorage.removeItem(sessionKey);
      
      // Refresh orders
      // CRITICAL: Use sessionStorage (tab-specific) not localStorage
      const restaurantId = sessionStorage.getItem('restaurantId') || localStorage.getItem('restaurantId');
      await fetchOrders(restaurantId);
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Failed to generate bill');
    }
  };

  const logout = () => {
    localStorage.removeItem('restaurantToken');
    localStorage.removeItem('restaurantId');
    sessionStorage.removeItem('restaurantToken');
    sessionStorage.removeItem('restaurantId');
    console.log('🚪 Logged out - cleared both localStorage and sessionStorage');
    navigate('/restaurant-login');
  };

  if (!restaurant) return <div className="text-center py-12">Loading...</div>;

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    'out-for-delivery': 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  // Filter orders based on type
  const deliveryOrders = orders.filter(order => order.orderType === 'delivery');
  const dineInOrders = orders.filter(order => order.orderType === 'dine-in');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black pb-8">
      {/* Enhanced Header */}
      <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-b-4 border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Restaurant Info */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-gradient-to-br from-primary to-red-600 items-center justify-center text-white font-bold text-xl shadow-lg">
                {restaurant.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
                  {restaurant.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-300">
                  ⭐ {restaurant.rating} • {restaurant.cuisine}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <OrderNotifications orders={orders} />
              <button 
                onClick={toggleTheme} 
                className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 text-gray-300 hover:text-white hover:scale-105 transition-all shadow-lg border border-gray-600"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={logout} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white hover:scale-105 hover:shadow-xl transition-all shadow-lg font-medium border border-red-500"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <QuickStats orders={orders} />

        {/* Enhanced Tab Navigation */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-2xl shadow-2xl p-2 mb-6 overflow-x-auto border border-gray-700">
          <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'delivery' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <span className="hidden sm:inline">Delivery Orders</span>
            <span className="sm:hidden">Delivery</span>
          </button>
          <button
            onClick={() => setActiveTab('dine-in')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'dine-in' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Table Orders</span>
            <span className="sm:hidden">Tables</span>
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'menu' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'reels' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            Reels
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'qr' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">QR Codes</span>
            <span className="sm:hidden">QR</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'history' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">Order History</span>
            <span className="sm:hidden">History</span>
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'payment' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Payment
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'analytics' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <BarChart3 size={18} className="inline mr-1 sm:mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap text-sm sm:text-base ${
              activeTab === 'location' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <MapPin size={18} className="inline mr-1 sm:mr-2" />
            Location
          </button>
        </div>
        </div>

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <RestaurantAnalytics orders={orders} restaurant={restaurant} />
            <AdvancedAnalytics orders={orders} restaurant={restaurant} />
            <AnalyticsExport 
              orders={orders} 
              restaurant={restaurant}
              analytics={{
                topItems: [],
                ordersByStatus: {},
                revenueByDay: []
              }}
            />
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Orders */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingBag size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{deliveryOrders.length}</p>
                    <p className="text-sm opacity-90">Delivery Orders</p>
                  </div>
                </div>
              </div>

              {/* Pending Orders */}
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Package size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{deliveryOrders.filter(o => o.status === 'pending').length}</p>
                    <p className="text-sm opacity-90">Pending</p>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">₹{deliveryOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}</p>
                    <p className="text-sm opacity-90">Revenue</p>
                  </div>
                </div>
              </div>

              {/* Completed Orders */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{deliveryOrders.filter(o => o.status === 'delivered').length}</p>
                    <p className="text-sm opacity-90">Completed</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Home Delivery Orders</h2>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Total: {deliveryOrders.length} orders</p>
            </div>
            {deliveryOrders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      🚚 Delivery Order
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{order.customerName} • {order.customerPhone}</p>
                    {order.deliveryAddress && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📍 {order.deliveryAddress}</p>
                    )}
                    {/* Order Time */}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        🕐 Ordered: {new Date(order.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                      {(order.status === 'completed' || order.status === 'delivered') && order.updatedAt && (
                        <p className="text-xs text-green-600 font-semibold">
                          ✅ Completed: {new Date(order.updatedAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      )}
                    </div>
                    {/* Payment Status */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending Payment'}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          via {order.paymentMethod === 'razorpay' ? 'Online' : order.paymentMethod.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{order.totalAmount}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                      Start Preparing
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'out-for-delivery')}
                      className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600"
                    >
                      Out for Delivery
                    </button>
                  )}
                  {order.status === 'out-for-delivery' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'delivered')}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                    >
                      Mark Delivered
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'completed')}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
            {deliveryOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-300">No delivery orders yet</div>
            )}
          </div>
        )}

        {activeTab === 'dine-in' && (
          <div className="space-y-6">
            {/* Quick Stats Cards for Dine-in */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tables */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Users size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{dineInOrders.length}</p>
                    <p className="text-sm opacity-90">Table Orders</p>
                  </div>
                </div>
              </div>

              {/* Active Tables */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Package size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{dineInOrders.filter(o => o.status === 'preparing').length}</p>
                    <p className="text-sm opacity-90">Preparing</p>
                  </div>
                </div>
              </div>

              {/* Table Revenue */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">₹{dineInOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}</p>
                    <p className="text-sm opacity-90">Revenue</p>
                  </div>
                </div>
              </div>

              {/* Completed Tables */}
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp size={32} className="opacity-80" />
                  <div className="text-right">
                    <p className="text-3xl font-bold">{dineInOrders.filter(o => o.status === 'completed').length}</p>
                    <p className="text-sm opacity-90">Completed</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">Dine-In / Table Orders</h2>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Total: {dineInOrders.length} orders</p>
            </div>
            
            {/* Group orders by table - only show active orders (not completed) */}
            {Object.entries(
              dineInOrders
                .filter(order => order.status !== 'completed')
                .reduce((acc, order) => {
                  const tableNum = order.tableNumber;
                  if (!acc[tableNum]) acc[tableNum] = [];
                  acc[tableNum].push(order);
                  return acc;
                }, {})
            ).map(([tableNum, tableOrders]) => {
              // Combine all items from all orders
              const combinedItems = {};
              tableOrders.forEach(order => {
                order.items.forEach(item => {
                  const key = item.name;
                  if (combinedItems[key]) {
                    combinedItems[key].quantity += item.quantity;
                    combinedItems[key].total += item.price * item.quantity;
                  } else {
                    combinedItems[key] = {
                      name: item.name,
                      price: item.price,
                      quantity: item.quantity,
                      total: item.price * item.quantity
                    };
                  }
                });
              });
              
              const tableTotal = tableOrders.reduce((sum, order) => sum + order.totalAmount, 0);
              const firstOrder = tableOrders[0];
              
              return (
                <div key={tableNum} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-4 sm:p-6 mb-4">
                  {/* Table Header */}
                  <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-purple-200">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        🍽️ Table {tableNum}
                      </h3>
                      <p className="text-sm text-gray-600">{tableOrders.length} order(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-primary">₹{tableTotal}</p>
                    </div>
                  </div>

                  {/* Combined Bill */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{firstOrder.customerName} • {firstOrder.customerPhone}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{new Date(firstOrder.createdAt).toLocaleTimeString()}</p>
                      {/* Payment Status for Table */}
                      <div className="flex items-center gap-2 mt-2">
                        {tableOrders.some(o => o.paymentStatus === 'paid') ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Paid
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                            ⏳ Pending Payment
                          </span>
                        )}
                        {firstOrder.paymentMethod && (
                          <span className="text-xs text-gray-500 dark:text-gray-300">
                            via {firstOrder.paymentMethod === 'razorpay' ? 'Online' : firstOrder.paymentMethod.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      {Object.values(combinedItems).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>₹{item.total}</span>
                        </div>
                      ))}
                      <div className="border-t-2 mt-3 pt-3 flex justify-between font-bold text-lg">
                        <span>Subtotal</span>
                        <span className="text-primary">₹{tableTotal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Bill Button for Table */}
                  <div className="mt-4 pt-4 border-t-2 border-purple-200">
                    <button
                      onClick={() => generateBillForTable(tableNum, tableOrders, tableTotal)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                    >
                      📄 Generate Final Bill - ₹{tableTotal}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {dineInOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-300">No table orders yet</div>
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div>
            <button
              onClick={() => setShowMenuForm(true)}
              className="mb-4 sm:mb-6 bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              Add Menu Item
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {restaurant.menu.map((item) => (
                <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  {/* Item Image */}
                  {item.image && (
                    <div className="h-32 bg-gray-100">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 dark:text-white">{item.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setMenuForm(item);
                            setShowMenuForm(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">₹{item.price}</span>
                      <span className="text-sm text-gray-600">{item.category}</span>
                    </div>
                    <div className="mt-2">
                      {item.isVeg ? (
                        <span className="text-green-600 text-sm">🌱 Veg</span>
                      ) : (
                        <span className="text-red-600 text-sm">🍖 Non-Veg</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showMenuForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                    {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                  </h2>
                  <form onSubmit={handleMenuSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        required
                        value={menuForm.name}
                        onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Price</label>
                      <input
                        type="number"
                        required
                        value={menuForm.price}
                        onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Category</label>
                      <select
                        value={menuForm.category}
                        onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option>Starters</option>
                        <option>Main Course</option>
                        <option>Desserts</option>
                        <option>Drinks</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">Description</label>
                      <textarea
                        value={menuForm.description}
                        onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="3"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold">Image</label>
                      
                      {/* Upload Method Selection */}
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="url"
                            checked={imageUploadMethod === 'url'}
                            onChange={(e) => setImageUploadMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Image URL</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="upload"
                            checked={imageUploadMethod === 'upload'}
                            onChange={(e) => setImageUploadMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Upload Image</span>
                        </label>
                      </div>

                      {/* Image URL Input */}
                      {imageUploadMethod === 'url' && (
                        <div>
                          <input
                            type="url"
                            value={menuForm.image}
                            onChange={(e) => setMenuForm({...menuForm, image: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="https://example.com/image.jpg"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: Use image hosting services like Imgur, Cloudinary, or direct URLs
                          </p>
                        </div>
                      )}

                      {/* Image File Upload */}
                      {imageUploadMethod === 'upload' && (
                        <div>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                              id="image-upload"
                            />
                            <label htmlFor="image-upload" className="cursor-pointer">
                              {imageFile ? (
                                <div>
                                  <p className="text-green-600 font-semibold mb-1">✓ {imageFile.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-300">
                                    {(imageFile.size / 1024).toFixed(2)} KB
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setImageFile(null);
                                      setMenuForm({...menuForm, image: ''});
                                    }}
                                    className="text-xs text-red-500 hover:underline mt-2"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="text-4xl mb-2">📷</div>
                                  <p className="text-gray-700 font-semibold mb-1">
                                    Click to upload image
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-300">
                                    JPG, PNG, WebP (Max 2MB)
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Tip: Use square images (1:1 ratio) for best results
                          </p>
                        </div>
                      )}

                      {/* Image Preview */}
                      {menuForm.image && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 mb-1">Preview:</p>
                          <img 
                            src={menuForm.image} 
                            alt="Preview" 
                            className="w-full h-40 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={menuForm.isVeg}
                          onChange={(e) => setMenuForm({...menuForm, isVeg: e.target.checked})}
                        />
                        <span className="text-gray-700 dark:text-gray-300">Vegetarian</span>
                      </label>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenuForm(false);
                          setEditingItem(null);
                          setMenuForm({ name: '', price: '', category: 'Starters', description: '', isVeg: true, image: '' });
                          setImageFile(null);
                          setImageUploadMethod('url');
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-red-600"
                      >
                        {editingItem ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reels' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>📱 Live Updates:</strong> Reels you add, edit, or delete here will instantly appear on the customer-facing Reels page.
              </p>
              <p className="text-xs text-blue-700 mb-2">
                <strong>📹 Video Format:</strong> Use vertical videos (9:16 aspect ratio) for best results - like Instagram or TikTok reels.
              </p>
              <p className="text-xs text-blue-700">
                <strong>💾 Video Storage:</strong> Upload files up to 5MB, or use Video URL for larger files. Recommended: Host videos on YouTube/Vimeo and use the URL.
              </p>
            </div>
            
            {restaurant.menu.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Please add menu items first before creating reels. Go to the <strong>Menu</strong> tab to add dishes.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowReelForm(true)}
                className="mb-4 sm:mb-6 bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                Add Reel
              </button>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {reels.map((reel) => (
                <div key={reel._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Vertical Video Preview - 9:16 aspect ratio */}
                  <div className="relative bg-gray-900 aspect-[9/16]">
                    {reel.videoUrl ? (
                      <video 
                        src={reel.videoUrl} 
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={48} className="text-gray-400" />
                      </div>
                    )}
                    
                    {/* Action Buttons Overlay */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setEditingReel(reel);
                          setReelForm({
                            videoUrl: reel.videoUrl,
                            dishName: reel.dishName,
                            price: reel.price,
                            menuItemId: reel.menuItemId || ''
                          });
                          setShowReelForm(true);
                        }}
                        className="bg-white bg-opacity-90 p-2 rounded-full text-blue-500 hover:bg-opacity-100 shadow-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteReel(reel._id)}
                        className="bg-white bg-opacity-90 p-2 rounded-full text-red-500 hover:bg-opacity-100 shadow-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Stats Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <h3 className="font-bold text-white text-sm mb-1">{reel.dishName}</h3>
                      <p className="text-accent font-bold text-lg">₹{reel.price}</p>
                      <div className="flex items-center gap-3 text-xs text-white mt-2">
                        <div className="flex items-center gap-1">
                          <Eye size={14} />
                          <span>{reel.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart size={14} />
                          <span>{reel.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reels.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-300">
                <Film size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No reels yet. Create your first food reel!</p>
              </div>
            )}

            {showReelForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                    {editingReel ? 'Edit Reel' : 'Add Reel'}
                  </h2>
                  <form onSubmit={handleReelSubmit} className="space-y-4">
                    {/* Upload Method Selection */}
                    <div>
                      <label className="block text-gray-700 mb-3 font-semibold">Choose Upload Method</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="url"
                            checked={uploadMethod === 'url'}
                            onChange={(e) => setUploadMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Video URL</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="upload"
                            checked={uploadMethod === 'upload'}
                            onChange={(e) => setUploadMethod(e.target.value)}
                            className="w-4 h-4"
                            disabled={editingReel}
                          />
                          <span className={editingReel ? 'text-gray-400' : 'text-gray-700'}>
                            Upload Video {editingReel && '(disabled for edit)'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Video URL Input */}
                    {uploadMethod === 'url' && (
                      <div>
                        <label className="block text-gray-700 mb-2">Video URL</label>
                        <input
                          type="url"
                          required
                          value={reelForm.videoUrl}
                          onChange={(e) => setReelForm({...reelForm, videoUrl: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://example.com/video.mp4"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          📹 Use vertical video (9:16 ratio) - Direct URL to mp4, webm, etc.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Tip: Record in portrait mode on your phone for best results
                        </p>
                      </div>
                    )}

                    {/* Video File Upload */}
                    {uploadMethod === 'upload' && (
                      <div>
                        <label className="block text-gray-700 mb-2">Upload Video File</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            className="hidden"
                            id="video-upload"
                            required={!videoFile}
                          />
                          <label htmlFor="video-upload" className="cursor-pointer">
                            <Film size={48} className="mx-auto text-gray-400 mb-2" />
                            {videoFile ? (
                              <div>
                                <p className="text-green-600 font-semibold mb-1">✓ {videoFile.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVideoFile(null);
                                    setReelForm({...reelForm, videoUrl: ''});
                                  }}
                                  className="text-xs text-red-500 hover:underline mt-2"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-700 font-semibold mb-1">
                                  Click to upload video
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                  MP4, WebM, MOV (Max 5MB)
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                  ⚠️ For larger videos, use Video URL option
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  💡 Compress videos at: <a href="https://www.freeconvert.com/video-compressor" target="_blank" className="underline">freeconvert.com</a>
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          📹 Use vertical video (9:16 ratio) for best results
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Tip: Record in portrait mode on your phone
                        </p>
                        
                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Uploading...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Video Preview */}
                    {reelForm.videoUrl && (
                      <div>
                        <label className="block text-gray-700 mb-2">Preview</label>
                        <div className="bg-gray-900 rounded-lg overflow-hidden aspect-[9/16] max-w-[200px] mx-auto">
                          <video 
                            src={reelForm.videoUrl} 
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-gray-700 mb-2">Select Menu Item</label>
                      <select
                        required
                        value={reelForm.menuItemId}
                        onChange={(e) => {
                          const selectedItem = restaurant.menu.find(item => item._id === e.target.value);
                          if (selectedItem) {
                            setReelForm({
                              ...reelForm,
                              menuItemId: selectedItem._id,
                              dishName: selectedItem.name,
                              price: selectedItem.price
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Choose a dish from your menu --</option>
                        {restaurant.menu.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name} - ₹{item.price} ({item.category})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 The reel will be linked to this menu item
                      </p>
                    </div>
                    
                    {/* Display selected dish details */}
                    {reelForm.dishName && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Selected Dish:</strong> {reelForm.dishName}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Price:</strong> ₹{reelForm.price}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReelForm(false);
                          setEditingReel(null);
                          setReelForm({ videoUrl: '', dishName: '', price: '', menuItemId: '' });
                          setVideoFile(null);
                          setUploadProgress(0);
                          setUploadMethod('url');
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-red-600"
                      >
                        {editingReel ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'qr' && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>📱 Scan to Order:</strong> Customers can scan these QR codes to order directly from their table without waiting for a waiter.
              </p>
              <p className="text-xs text-blue-700">
                💡 Print these QR codes and place them on each table. You can right-click and save each QR code image.
              </p>
            </div>

            <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                Table QR Codes ({restaurant.tables || 0} tables)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('Current restaurant:', restaurant);
                    console.log('Restaurant ID:', localStorage.getItem('restaurantId'));
                    console.log('Current tables:', restaurant.tables);
                    alert(`Restaurant ID: ${localStorage.getItem('restaurantId')}\nCurrent tables: ${restaurant.tables}`);
                  }}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 text-sm"
                  title="Debug Info"
                >
                  🐛 Debug
                </button>
                <button
                  onClick={addTable}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Plus size={18} />
                  Add Table
                </button>
              </div>
            </div>
            {restaurant.tables === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-gray-500 mb-4">No tables added yet</p>
                <button
                  onClick={addTable}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-600"
                >
                  Add Your First Table
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: restaurant.tables || 0 }, (_, i) => i + 1).map((tableNum) => {
                  const qrUrl = `${window.location.origin}/qr/${restaurant._id}/${tableNum}`;
                  return (
                    <div key={tableNum} className="bg-white rounded-lg shadow-md p-4 text-center relative">
                      {/* Delete Button */}
                      {tableNum === restaurant.tables && (
                        <button
                          onClick={() => deleteTable(tableNum)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          title="Delete this table"
                        >
                          <X size={16} />
                        </button>
                      )}
                      
                      <div id={`qr-table-${tableNum}`} className="bg-white p-3 rounded-lg mb-3 inline-block border-2 border-gray-200">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&margin=10`}
                          alt={`QR Code for Table ${tableNum}`}
                          className="w-[150px] h-[150px]"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <p className="font-bold text-gray-800 text-lg mb-2">Table {tableNum}</p>
                      <p className="text-xs text-gray-500 mb-2">Scan to order</p>
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline block mb-2"
                      >
                        Test Link
                      </a>
                      <button
                        onClick={() => downloadQRCode(tableNum, qrUrl)}
                        className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-600 w-full"
                      >
                        📥 Download QR
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">📜 Order History</h2>
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                Completed orders: {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
            
            {/* Group completed orders by table/session */}
            {(() => {
              const completedOrders = orders.filter(order => order.status === 'completed');
              
              // Group dine-in orders by table and completion time (within 1 minute = same bill)
              const groupedOrders = [];
              const processedIds = new Set();
              
              completedOrders.forEach(order => {
                if (processedIds.has(order._id)) return;
                
                if (order.orderType === 'dine-in') {
                  // Find all orders from same table completed around the same time
                  const relatedOrders = completedOrders.filter(o => 
                    o.orderType === 'dine-in' &&
                    o.tableNumber === order.tableNumber &&
                    Math.abs(new Date(o.updatedAt) - new Date(order.updatedAt)) < 60000 // Within 1 minute
                  );
                  
                  relatedOrders.forEach(o => processedIds.add(o._id));
                  groupedOrders.push(relatedOrders);
                } else {
                  // Delivery orders are individual
                  processedIds.add(order._id);
                  groupedOrders.push([order]);
                }
              });
              
              return groupedOrders.map((orderGroup, groupIdx) => {
                const firstOrder = orderGroup[0];
                const isDineIn = firstOrder.orderType === 'dine-in';
                
                // Combine items if multiple orders
                const combinedItems = {};
                let totalAmount = 0;
                
                orderGroup.forEach(order => {
                  totalAmount += order.totalAmount;
                  order.items.forEach(item => {
                    const key = item.name;
                    if (combinedItems[key]) {
                      combinedItems[key].quantity += item.quantity;
                      combinedItems[key].total += item.price * item.quantity;
                    } else {
                      combinedItems[key] = {
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity
                      };
                    }
                  });
                });
                
                return (
                  <div key={groupIdx} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                          {isDineIn ? `🍽️ Table ${firstOrder.tableNumber}` : '🚚 Delivery'}
                        </h3>
                        <p className="text-sm text-gray-600">{firstOrder.customerName} • {firstOrder.customerPhone}</p>
                        {firstOrder.deliveryAddress && (
                          <p className="text-sm text-gray-600 mt-1">📍 {firstOrder.deliveryAddress}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(firstOrder.updatedAt).toLocaleString()}
                        </p>
                        {orderGroup.length > 1 && (
                          <p className="text-xs text-blue-600 mt-1">
                            Combined from {orderGroup.length} orders
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 dark:text-white">
                        Completed
                      </span>
                    </div>

                    <div className="mb-4">
                      {Object.values(combinedItems).map((item, idx) => (
                        <div key={idx} className="flex justify-between py-1">
                          <span>{item.name} x {item.quantity}</span>
                          <span>₹{item.total}</span>
                        </div>
                      ))}
                      <div className="border-t-2 mt-3 pt-3 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">₹{totalAmount}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 border-t pt-2">
                      Payment: {firstOrder.paymentMethod?.toUpperCase()} • {firstOrder.paymentStatus}
                    </div>
                  </div>
                );
              });
            })()} 
            
            {orders.filter(o => o.status === 'completed').length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-300">No completed orders yet</div>
            )}
          </div>
        )}

        {activeTab === 'payment' && (
          <PaymentSettingsTab restaurant={restaurant} setRestaurant={setRestaurant} />
        )}

        {activeTab === 'location' && (
          <RestaurantLocationSettings 
            restaurant={restaurant}
            onSave={async (locationData) => {
              try {
                const token = localStorage.getItem('restaurantToken');
                const response = await axios.patch(
                  `/api/restaurants/${restaurant._id}/location-settings`,
                  locationData,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setRestaurant(response.data);
                // Location settings saved - success will be shown in the component UI
              } catch (error) {
                console.error('Error saving location:', error);
                throw error;
              }
            }}
          />
        )}
      </div>

      {/* Bill Modal */}
      <BillModal 
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        billData={currentBill}
      />
    </div>
  );
}
