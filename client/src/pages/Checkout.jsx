import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CreditCard, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

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
      const orderData = {
        restaurantId: restaurant._id,
        items: cart.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        orderType,
        ...formData,
        paymentStatus: 'paid'
      };

      await axios.post('/api/orders', orderData);
      alert('Order placed successfully!');
      clearCart();
      navigate('/');
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
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Order Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Order Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="delivery"
                      checked={orderType === 'delivery'}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="mr-2"
                    />
                    Delivery
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="dine-in"
                      checked={orderType === 'dine-in'}
                      onChange={(e) => setOrderType(e.target.value)}
                      className="mr-2"
                    />
                    Dine-in
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-gray-700 mb-2">Delivery Address</label>
                  <textarea
                    required
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold"
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold">₹{orderType === 'delivery' ? 40 : 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span className="font-semibold">₹{Math.round(total * 0.05)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  ₹{total + (orderType === 'delivery' ? 40 : 0) + Math.round(total * 0.05)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Payment</h2>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                />
                <Smartphone size={24} className="text-primary" />
                <span className="font-semibold">UPI Payment</span>
              </label>
              
              <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                />
                <CreditCard size={24} className="text-primary" />
                <span className="font-semibold">Card Payment</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-red-600"
              >
                Pay ₹{total + (orderType === 'delivery' ? 40 : 0) + Math.round(total * 0.05)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
