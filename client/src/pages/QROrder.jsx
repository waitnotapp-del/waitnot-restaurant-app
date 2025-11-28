import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Minus, Wallet, Smartphone, CheckCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { initiateRazorpayPayment } from '../components/RazorpayPayment';

export default function QROrder() {
  const { restaurantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    fetchRestaurant();
    loadSavedCustomerInfo();
  }, [restaurantId, tableNumber]);

  const loadSavedCustomerInfo = () => {
    // Load saved customer info for this table
    const sessionKey = `table_session_${restaurantId}_${tableNumber}`;
    const savedSession = localStorage.getItem(sessionKey);
    
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Check if session is still active (not older than 24 hours)
        const sessionAge = Date.now() - session.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxAge) {
          setCustomerInfo({
            name: session.name || '',
            phone: session.phone || ''
          });
          console.log('Loaded saved customer info:', session.name);
        } else {
          // Session expired, clear it
          localStorage.removeItem(sessionKey);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    }
  };

  const saveCustomerInfo = (name, phone) => {
    const sessionKey = `table_session_${restaurantId}_${tableNumber}`;
    const session = {
      name,
      phone,
      timestamp: Date.now()
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
  };

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(`/api/restaurants/${restaurantId}`);
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(i => i._id === item._id);
    if (existing) {
      setCart(cart.map(i => 
        i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity === 0) {
      setCart(cart.filter(i => i._id !== itemId));
    } else {
      setCart(cart.map(i => i._id === itemId ? { ...i, quantity } : i));
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = async () => {
    try {
      // Save customer info for future orders
      saveCustomerInfo(customerInfo.name, customerInfo.phone);
      
      // Validate customer info
      if (!customerInfo.name || !customerInfo.phone) {
        alert('Please enter your name and phone number');
        return;
      }
      
      // Debug: Show cart details
      const cartDetails = cart.map(item => `${item.name}: ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}`).join('\n');
      console.log('Cart items:', cart);
      console.log('Cart details:\n', cartDetails);
      console.log('Total amount:', total);
      
      // Show debug alert
      alert(`DEBUG INFO:\nCart Items: ${cart.length}\n${cartDetails}\n\nTotal: ₹${total}`);
      
      if (!total || total <= 0) {
        alert('Cart is empty or invalid. Total: ₹' + total);
        return;
      }
      
      // If UPI/Online payment, use Razorpay
      if (paymentMethod === 'upi') {
        initiateRazorpayPayment({
          amount: total,
          name: restaurant.name,
          description: `Table ${tableNumber} - ${restaurant.name}`,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          onSuccess: async (response) => {
            console.log('Payment successful:', response);
            
            // Create order with paid status
            const orderData = {
              restaurantId,
              tableNumber: parseInt(tableNumber),
              items: cart.map(item => ({
                menuItemId: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              totalAmount: total,
              orderType: 'dine-in',
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
              paymentStatus: 'paid',
              paymentMethod: 'razorpay',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id
            };

            await axios.post('/api/orders', orderData);
            setOrderPlaced(true);
            setTimeout(() => {
              setOrderPlaced(false);
              setCart([]);
              setShowCheckout(false);
            }, 2000);
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            alert('Payment failed or cancelled. Please try again.');
          }
        });
      } else {
        // Cash Payment
        const orderData = {
          restaurantId,
          tableNumber: parseInt(tableNumber),
          items: cart.map(item => ({
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: total,
          orderType: 'dine-in',
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          paymentStatus: 'pending',
          paymentMethod
        };

        await axios.post('/api/orders', orderData);
        setOrderPlaced(true);
        setTimeout(() => {
          setOrderPlaced(false);
          setCart([]);
          setShowCheckout(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    }
  };

  if (!restaurant) return <div className="text-center py-12">Loading...</div>;

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle size={80} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-4">Your food will be served shortly</p>
          <p className="text-sm text-gray-500">Table {tableNumber}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary text-white p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:text-gray-200 mb-2 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Home</span>
          </button>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-sm">Table {tableNumber}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Menu */}
        {!showCheckout ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
              {restaurant.menu.map((item) => {
                const quantity = cart.find(i => i._id === item._id)?.quantity || 0;
                
                return (
                  <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Item Image */}
                    <div className="h-40 bg-gradient-to-r from-accent to-secondary flex items-center justify-center relative">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-3xl">🍽️</span>
                      )}
                      {item.isVeg && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded">
                          <span className="text-sm">🌱</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-lg font-bold text-primary mt-2">₹{item.price}</p>
                    </div>
                    
                    <div className="px-4 pb-4">
                      {quantity === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-red-600"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center justify-between bg-primary text-white rounded-lg p-2">
                          <button
                            onClick={() => updateQuantity(item._id, quantity - 1)}
                            className="p-1 hover:bg-red-600 rounded"
                          >
                            <Minus size={20} />
                          </button>
                          <span className="font-bold">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, quantity + 1)}
                            className="p-1 hover:bg-red-600 rounded"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{cart.length} items</p>
                    <p className="text-xl font-bold text-primary">₹{total}</p>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-red-600 font-semibold"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Checkout */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h2>
            
            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Your Order</h3>
              {cart.map((item) => (
                <div key={item._id} className="flex justify-between py-2 border-b">
                  <span>{item.name} x {item.quantity}</span>
                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Payment Method</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <Smartphone size={24} className="text-primary" />
                  <span>UPI Payment</span>
                </label>
                <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-primary">
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <Wallet size={24} className="text-primary" />
                  <span>Cash Payment</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={placeOrder}
                disabled={!customerInfo.name || !customerInfo.phone}
                className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
