import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, Zap } from 'lucide-react';

export default function QuickStats({ orders }) {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    revenueChange: 0,
    ordersChange: 0,
    peakHour: '',
    topItem: ''
  });

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const calculateStats = () => {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

    // Today's stats
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    // Yesterday's stats for comparison
    const yesterdayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === yesterday);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate changes
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : todayRevenue > 0 ? 100 : 0;
    
    const ordersChange = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1)
      : todayOrders.length > 0 ? 100 : 0;

    // Peak hour
    const hourCounts = {};
    todayOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHour = Object.keys(hourCounts).length > 0
      ? Object.entries(hourCounts).reduce((max, [hour, count]) => 
          count > (hourCounts[max] || 0) ? hour : max, Object.keys(hourCounts)[0])
      : '';

    // Top item today
    const itemCounts = {};
    todayOrders.forEach(order => {
      order.items?.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });
    const topItem = Object.keys(itemCounts).length > 0
      ? Object.entries(itemCounts).reduce((max, [name, count]) => 
          count > (itemCounts[max] || 0) ? name : max, Object.keys(itemCounts)[0])
      : '';

    setStats({
      todayRevenue,
      todayOrders: todayOrders.length,
      avgOrderValue,
      pendingOrders,
      revenueChange: parseFloat(revenueChange),
      ordersChange: parseFloat(ordersChange),
      peakHour: peakHour ? `${peakHour}:00` : 'N/A',
      topItem: topItem || 'N/A'
    });
  };

  const StatCard = ({ icon: Icon, label, value, change, color, subtext }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-4 text-white relative overflow-hidden`}>
      <div className="absolute top-0 right-0 opacity-10">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Icon size={24} />
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-bold ${
              change >= 0 ? 'text-green-200' : 'text-red-200'
            }`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-sm opacity-90 mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtext && (
          <p className="text-xs opacity-75 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={DollarSign}
        label="Today's Revenue"
        value={`₹${stats.todayRevenue.toLocaleString()}`}
        change={stats.revenueChange}
        color="from-green-500 to-green-600"
        subtext="vs yesterday"
      />
      
      <StatCard
        icon={ShoppingBag}
        label="Today's Orders"
        value={stats.todayOrders}
        change={stats.ordersChange}
        color="from-blue-500 to-blue-600"
        subtext={`Avg: ₹${Math.round(stats.avgOrderValue)}`}
      />
      
      <StatCard
        icon={Zap}
        label="Pending Orders"
        value={stats.pendingOrders}
        color="from-orange-500 to-orange-600"
        subtext="Needs attention"
      />
      
      <StatCard
        icon={Clock}
        label="Peak Hour"
        value={stats.peakHour}
        color="from-purple-500 to-purple-600"
        subtext={`Top: ${stats.topItem.substring(0, 15)}${stats.topItem.length > 15 ? '...' : ''}`}
      />
    </div>
  );
}
