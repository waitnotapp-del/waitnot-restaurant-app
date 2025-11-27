import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, X, Plus, Minus, CreditCard, Smartphone, MapPin, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    paymentMethod: 'upi'
  });
  const [showPayment, setShowPayment] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== currentIndex) {
        // Pause and reset previous video to beginning
        const prevVideo = videoRefs.current[reels[currentIndex]?._id];
        if (prevVideo) {
          prevVideo.pause();
          prevVideo.currentTime = 0; // Reset to beginning
        }
        
        setCurrentIndex(newIndex);
        setIsPaused(false);
        
        if (reels[newIndex]) {
          incrementView(reels[newIndex]._id);
          // Reset and play new video from beginning
          const newVideo = videoRefs.current[reels[newIndex]._id];
          if (newVideo) {
            newVideo.currentTime = 0; // Start from beginning
            newVideo.play();
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentIndex, reels]);

  // Toggle play/pause on video click
  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[reels[currentIndex]?._id];
    if (currentVideo) {
      if (isPaused) {
        currentVideo.play();
        setIsPaused(false);
      } else {
        currentVideo.pause();
        setIsPaused(true);
      }
    }
  };

  const fetchReels = async () => {
    try {
      const { data } = await axios.get('/api/reels');
      setReels(data);
    } catch (error) {
      console.error('Error fetching reels:', error);
    }
  };

  const incrementView = async (reelId) => {
    try {
      await axios.patch(`/api/reels/${reelId}/view`);
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  const handleLike = async (reelId) => {
    try {
      await axios.patch(`/api/reels/${reelId}/like`);
      setReels(reels.map(r => 
        r._id === reelId ? { ...r, likes: r.likes + 1 } : r
      ));
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  const openOrderModal = (reel) => {
    setSelectedReel(reel);
    setQuantity(1);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setShowPayment(false);
    setSelectedReel(null);
    setQuantity(1);
    setOrderForm({
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      paymentMethod: 'upi'
    });
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    try {
      const orderData = {
        restaurantId: selectedReel.restaurantId._id,
        items: [{
          menuItemId: selectedReel._id,
          name: selectedReel.dishName,
          price: selectedReel.price,
          quantity: quantity
        }],
        totalAmount: selectedReel.price * quantity,
        orderType: 'delivery',
        ...orderForm,
        paymentStatus: 'paid'
      };

      await axios.post('/api/orders', orderData);
      alert('Order placed successfully! 🎉');
      closeOrderModal();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
        >
          <X size={24} />
        </button>
      </div>

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className="h-screen w-screen snap-start relative flex items-center justify-center"
          >
            {/* Video Background */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black cursor-pointer"
              onClick={togglePlayPause}
            >
              {reel.videoUrl ? (
                <video
                  ref={(el) => videoRefs.current[reel._id] = el}
                  src={reel.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay={index === currentIndex}
                  loop
                  muted={isMuted}
                  playsInline
                  controls={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white text-6xl">🍔</div>
                </div>
              )}
              
              {/* Pause Indicator */}
              {isPaused && index === currentIndex && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-50 rounded-full p-6">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">{reel.dishName}</h2>
              <p className="text-3xl font-bold text-accent mb-2">₹{reel.price}</p>
              
              {reel.restaurantId && (
                <p className="text-lg mb-4">
                  {reel.restaurantId.name} • ⭐ {reel.restaurantId.rating}
                </p>
              )}

              <button
                onClick={() => openOrderModal(reel)}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <ShoppingBag size={20} />
                Order Now
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col gap-6">
              <button
                onClick={() => handleLike(reel._id)}
                className="flex flex-col items-center text-white"
              >
                <div className="bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-70">
                  <Heart size={28} fill="white" />
                </div>
                <span className="text-sm mt-1">{reel.likes}</span>
              </button>

              <div className="flex flex-col items-center text-white">
                <div className="bg-black bg-opacity-50 p-3 rounded-full">
                  <span className="text-xl">👁️</span>
                </div>
                <span className="text-sm mt-1">{reel.views}</span>
              </div>
            </div>
          </div>
        ))}

        {reels.length === 0 && (
          <div className="h-screen flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-2xl mb-4">No reels available</p>
              <button
                onClick={() => navigate('/')}
                className="bg-primary px-6 py-3 rounded-lg hover:bg-red-600"
              >
                Go Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedReel && (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-700 shadow-2xl">
            {!showPayment ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Quick Order</h2>
                  <button onClick={closeOrderModal} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                {/* Dish Info */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">{selectedReel.dishName}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">{selectedReel.restaurantId.name}</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedReel.price}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3 transition-colors">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold w-12 text-center text-gray-800 dark:text-white transition-colors">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Order Form */}
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">Name</label>
                    <input
                      type="text"
                      required
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">Phone</label>
                    <input
                      type="tel"
                      required
                      value={orderForm.customerPhone}
                      onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 flex items-center gap-2 transition-colors">
                      <MapPin size={18} />
                      Delivery Address
                    </label>
                    <textarea
                      required
                      value={orderForm.deliveryAddress}
                      onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      rows="3"
                      placeholder="Enter your delivery address"
                    />
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Subtotal</span>
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹{selectedReel.price * quantity}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Delivery Fee</span>
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹40</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Taxes (5%)</span>
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹{Math.round((selectedReel.price * quantity) * 0.05)}</span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between items-center transition-colors">
                      <span className="text-lg font-bold text-gray-800 dark:text-white transition-colors">Total</span>
                      <span className="text-xl font-bold text-primary">
                        ₹{selectedReel.price * quantity + 40 + Math.round((selectedReel.price * quantity) * 0.05)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold text-lg transition-colors shadow-md"
                  >
                    Proceed to Payment
                  </button>
                </form>
              </div>
            ) : (
              /* Payment Screen */
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Payment</h2>
                  <button onClick={closeOrderModal} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">Total Amount</p>
                  <p className="text-3xl font-bold text-primary">
                    ₹{selectedReel.price * quantity + 40 + Math.round((selectedReel.price * quantity) * 0.05)}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-700">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={orderForm.paymentMethod === 'upi'}
                      onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                      className="accent-primary"
                    />
                    <Smartphone size={24} className="text-primary" />
                    <span className="font-semibold text-gray-800 dark:text-white transition-colors">UPI Payment</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-700">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={orderForm.paymentMethod === 'card'}
                      onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                      className="accent-primary"
                    />
                    <CreditCard size={24} className="text-primary" />
                    <span className="font-semibold text-gray-800 dark:text-white transition-colors">Card Payment</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
