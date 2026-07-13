import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Sparkles, 
  Lightbulb, 
  TrendingDown 
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch products and low-stock count
        const productsRes = await API.get('/products');
        const lowStockRes = await API.get('/products/low-stock');
        
        // Fetch sales to calculate revenue
        const salesRes = await API.get('/sales');

        // Calculate stats
        const todayStr = new Date().toISOString().slice(0, 10);
        let todaySum = 0;
        let monthlySum = 0;

        salesRes.data.forEach((sale) => {
          const saleDate = new Date(sale.createdAt).toISOString().slice(0, 10);
          if (saleDate === todayStr) {
            todaySum += sale.totalAmount;
          }
          // Assuming simple monthly filter for current month
          const currentMonth = new Date().getMonth();
          const saleMonth = new Date(sale.createdAt).getMonth();
          if (saleMonth === currentMonth) {
            monthlySum += sale.totalAmount;
          }
        });

        setStats({
          todaySales: todaySum,
          monthlyRevenue: monthlySum || todaySum, // fallback to today sum if no other sales
          totalProducts: productsRes.data.length,
          lowStockCount: lowStockRes.data.length,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Standard static AI insights representing SIBIS smart assistant core highlights
  const aiInsights = [
    {
      id: 1,
      type: 'positive',
      message: 'Jasmine Rice sales increased by 15% compared to last week.',
      icon: TrendingUp,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
    },
    {
      id: 2,
      type: 'warning',
      message: 'Fresh Milk is running low and will run out within 3 days based on purchase history velocity.',
      icon: AlertTriangle,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
    },
    {
      id: 3,
      type: 'negative',
      message: 'Chocolate Biscuits have not sold a single unit in the last 30 days. Consider moving them or introducing a promotion.',
      icon: TrendingDown,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
    },
    {
      id: 4,
      type: 'info',
      message: 'Mustard Cooking Oil generated the highest profit margin ($4.50 per unit) this month.',
      icon: DollarSign,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
    }
  ];

  const aiRecommendations = [
    {
      id: 1,
      product: 'Jasmine Rice 5kg',
      currentStock: 15,
      predictedDemand: 40,
      suggestion: 'Current stock is insufficient for next week. Recommended ordering 25 more bags from Superb Wholesale Distributors.',
    },
    {
      id: 2,
      product: 'Organic Honey 500g',
      currentStock: 3,
      predictedDemand: 10,
      suggestion: 'Stock is critically low. Recommended placing a reorder of 8 jars immediately.',
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {currentUser.name}! Here is your business status at a glance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's Sales</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${stats.todaySales.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">${stats.monthlyRevenue.toFixed(2)}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Products</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalProducts}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.lowStockCount}</h3>
          </div>
          <div className={`p-3 rounded-xl ${stats.lowStockCount > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 animate-pulse' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Recommendations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Smart Reorder Recommendations</h2>
          </div>
          <div className="space-y-4">
            {aiRecommendations.map((rec) => (
              <div key={rec.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 dark:bg-slate-950 dark:border-slate-850">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-800 text-sm dark:text-slate-100">{rec.product}</h4>
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded dark:bg-indigo-950 dark:text-indigo-200">
                    AI Predicts Demand: {rec.predictedDemand} units
                  </span>
                </div>
                <div className="flex space-x-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>Current Stock: <strong className="text-rose-500">{rec.currentStock}</strong></span>
                  <span>Target: <strong>{rec.predictedDemand}</strong></span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-400 pl-3">
                  {rec.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Business Insights */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <Lightbulb className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">AI Daily Business Insights</h2>
          </div>
          <div className="space-y-4">
            {aiInsights.map((insight) => {
              const IconComponent = insight.icon;
              return (
                <div key={insight.id} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${insight.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {insight.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
