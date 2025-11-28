import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Wallet, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import { initiateRazorpayPayment } from '../components/RazorpayPayment';

export default function Checkout() {
  const { cart, restaurant, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('delivery');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    paymentMethod: 'upi'
  });
  const [showPayment, setShowPayment] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    try {
      const finalTotal = total + 40 + Math.round(total * 0.05);
      
      if (finalTotal <= 0) {
        alert('Invalid order total');
        return;
      }
      
      // If UPI/Online payment, use Razorpay
      if (formData.paymentMethod === 'upi') {
        initiateRazorpayPayment({
          amount: finalTotal,
          name: restaurant.name,
          description: `Order from ${restaurant.name}`,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          onSuccess: async (response) => {
            console.log('Payment successful:', response);
            
            // Create order with paid status
            const orderData = {
              restaurantId: restaurant._id,
              items: cart.map(item => ({
                menuItemId: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
              })),
              totalAmount: finalTotal,
              orderType: 'delivery',
              ...formData,
              paymentStatus: 'paid',
              paymentMethod: 'razorpay',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id
            };

            await axios.post('/api/orders', orderData);
            alert('Order placed successfully! Payment confirmed.');
            clearCart();
            navigate('/');
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            alert('Payment failed or cancelled. Please try again.');
          }
        });
      } else {
        // Cash on Delivery
        const orderData = {
          restaurantId: restaurant._id,
          items: cart.map(item => ({
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          totalAmount: finalTotal,
          orderType: 'delivery',
          ...formData,
          paymentStatus: 'pending'
        };

        await axios.post('/api/orders', orderData);
        alert('Order placed successfully! Pay cash on delivery.');
        clearCart();
        navigate('/');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4">Your cart is empty</h2>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-600 text-sm sm:text-base transition-colors"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6 sm:mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sm:p-6 mb-4 sm:mb-6 border border-transparent dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
              Order from {restaurant?.name}
            </h2>
            
            {cart.map((item) => (
              <div key={item._id} className="flex items-center gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{item.name}</h3>
                  <p className="text-primary font-bold">₹{item.price}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors"
                  >
                    -
                  </button>
                  <span className="font-semibold text-gray-800 dark:text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Order Details Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sm:p-6 border border-transparent dark:border-gray-700 transition-colors">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4 transition-colors">Order Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 transition-colors">Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 transition-colors">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 transition-colors">Delivery Address</label>
                <textarea
                  required
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  rows="3"
                  placeholder="Enter your delivery address"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold transition-colors shadow-md"
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sm:p-6 lg:sticky lg:top-24 border border-transparent dark:border-gray-700 transition-colors">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4 transition-colors">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors">Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors">Delivery Fee</span>
                <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹40</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400 transition-colors">Taxes</span>
                <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹{Math.round(total * 0.05)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-lg font-bold transition-colors">
                <span className="text-gray-800 dark:text-white">Total</span>
                <span className="text-primary">
                  ₹{total + 40 + Math.round(total * 0.05)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white transition-colors">Payment</h2>
              <button 
                onClick={() => setShowPayment(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Total Amount</p>
              <p className="text-3xl font-bold text-primary">₹{total + 40 + Math.round(total * 0.05)}</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-700">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="accent-primary"
                />
                <Smartphone size={24} className="text-primary" />
                <span className="font-semibold text-gray-800 dark:text-white transition-colors">UPI Payment</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-700">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="accent-primary"
                />
                <Wallet size={24} className="text-primary" />
                <span className="font-semibold text-gray-800 dark:text-white transition-colors">Cash on Delivery</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-red-600"
              >
                Pay ₹{total + 40 + Math.round(total * 0.05)}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
