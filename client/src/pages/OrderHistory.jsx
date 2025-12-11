import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { App as CapacitorApp } from '@capacitor/app';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchOrders(token);
  }, [navigate]);

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

  const fetchOrders = async (token) => {
    try {
      const { data } = await axios.get('/api/users/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'preparing':
      case 'out-for-delivery':
        return <Clock className="text-blue-500" size={20} />;
      default:
        return <Package className="text-yellow-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'preparing':
      case 'out-for-delivery':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Order History</h1>
            {user && <p className="text-sm text-gray-600 dark:text-gray-400">{user.name} • {user.phone}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No Orders Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start ordering from your favorite restaurants!</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    {/* Order Time - More Prominent */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Ordered: {new Date(order.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      {(order.status === 'completed' || order.status === 'delivered') && order.updatedAt && (
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Completed: {new Date(order.updatedAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Order Type: {order.orderType === 'dine-in' ? `Table ${order.tableNumber}` : 'Delivery'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                    {order.paymentStatus && (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      }`}>
                        {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Items:</h3>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.name} x {item.quantity}</span>
                      <span className="text-gray-700 dark:text-gray-300">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.deliveryAddress && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
