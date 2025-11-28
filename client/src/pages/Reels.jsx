import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, X, Plus, Minus, Wallet, Smartphone, MapPin, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import { initiateRazorpayPayment } from '../components/RazorpayPayment';
import { App as CapacitorApp } from '@capacitor/app';

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
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchReels();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', (data) => {
      // Always navigate to home, don't use default back behavior
      window.location.href = '/';
    });

    return () => {
      backButtonListener.remove();
    };
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
      setIsLoading(true);
      const { data } = await axios.get('/api/reels');
      setReels(data);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setIsLoading(false);
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
      const finalTotal = selectedReel.price * quantity + 40 + Math.round((selectedReel.price * quantity) * 0.05);
      
      if (finalTotal <= 0) {
        alert('Invalid order total');
        return;
      }
      
      // If UPI/Online payment, use Razorpay
      if (orderForm.paymentMethod === 'upi') {
        initiateRazorpayPayment({
          amount: finalTotal,
          name: selectedReel.restaurantId.name,
          description: `Order: ${selectedReel.dishName}`,
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          onSuccess: async (response) => {
            console.log('Payment successful:', response);
            
            // Create order with paid status
            const orderData = {
              restaurantId: selectedReel.restaurantId._id,
              items: [{
                menuItemId: selectedReel._id,
                name: selectedReel.dishName,
                price: selectedReel.price,
                quantity: quantity
              }],
              totalAmount: finalTotal,
              orderType: 'delivery',
              ...orderForm,
              paymentStatus: 'paid',
              paymentMethod: 'razorpay',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id
            };

            await axios.post('/api/orders', orderData);
            alert('Order placed successfully! Payment confirmed. 🎉');
            closeOrderModal();
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            alert('Payment failed or cancelled. Please try again.');
          }
        });
      } else {
        // Cash on Delivery
        const orderData = {
          restaurantId: selectedReel.restaurantId._id,
          items: [{
            menuItemId: selectedReel._id,
            name: selectedReel.dishName,
            price: selectedReel.price,
            quantity: quantity
          }],
          totalAmount: finalTotal,
          orderType: 'delivery',
          ...orderForm,
          paymentStatus: 'pending'
        };

        await axios.post('/api/orders', orderData);
        alert('Order placed successfully! Pay cash on delivery. 🎉');
        closeOrderModal();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      {/* Loading Animation */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="relative text-center">
            {/* Animated Food Icons Carousel */}
            <div className="text-8xl mb-6">
              <div className="animate-bounce inline-block">🍔</div>
            </div>
            
            {/* Pulsing Circle Loader */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-3 rounded-full border-4 border-red-400 border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            
            {/* Loading Text with Gradient */}
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-400 to-primary text-2xl font-bold animate-pulse">
              Loading Delicious Reels...
            </p>
            
            {/* Subtitle */}
            <p className="text-gray-400 text-sm mt-2">Get ready for amazing food content</p>
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 pointer-events-auto transition-all"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/');
          }}
          className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 pointer-events-auto transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory hide-scrollbar"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className="w-full h-full flex-shrink-0 snap-start snap-always relative"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            {/* Video Background */}
            <div 
              className="absolute inset-0 w-full h-full bg-gradient-to-b from-gray-900 to-black"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
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
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 text-white pointer-events-none">
              <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{reel.dishName}</h2>
              <p className="text-3xl font-bold text-primary mb-2 drop-shadow-lg">₹{reel.price}</p>
              
              {reel.restaurantId && (
                <p className="text-lg mb-4 drop-shadow-lg">
                  {reel.restaurantId.name} • ⭐ {reel.restaurantId.rating}
                </p>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openOrderModal(reel);
                }}
                className="bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-red-600 transition-all transform hover:scale-105 flex items-center gap-2 pointer-events-auto shadow-2xl"
              >
                <ShoppingBag size={22} />
                Order Now
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-40 flex flex-col gap-6 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(reel._id);
                }}
                className="flex flex-col items-center text-white pointer-events-auto transition-transform hover:scale-110"
              >
                <div className="bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-70 backdrop-blur-sm">
                  <Heart size={28} fill="white" />
                </div>
                <span className="text-sm mt-1 font-semibold drop-shadow-lg">{reel.likes}</span>
              </button>

              <div className="flex flex-col items-center text-white">
                <div className="bg-black bg-opacity-50 p-3 rounded-full backdrop-blur-sm">
                  <span className="text-xl">👁️</span>
                </div>
                <span className="text-sm mt-1 font-semibold drop-shadow-lg">{reel.views}</span>
              </div>
            </div>
          </div>
        ))}

        {reels.length === 0 && !isLoading && (
          <div className="h-screen flex items-center justify-center text-white bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="text-center px-6">
              <div className="text-7xl mb-6 animate-bounce">🎬</div>
              <p className="text-3xl font-bold mb-2">No Reels Available</p>
              <p className="text-gray-400 mb-8 text-lg">Check back later for delicious content!</p>
              <button
                onClick={() => navigate('/')}
                className="bg-primary px-8 py-4 rounded-full hover:bg-red-600 font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
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
                      value="cash"
                      checked={orderForm.paymentMethod === 'cash'}
                      onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                      className="accent-primary"
                    />
                    <Wallet size={24} className="text-primary" />
                    <span className="font-semibold text-gray-800 dark:text-white transition-colors">Cash on Delivery</span>
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
