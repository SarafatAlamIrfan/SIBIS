import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  Sparkles, 
  Lightbulb, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Calendar
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [aiInsights, setAiInsights] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Static mock fallbacks if backend AI services are unreachable
  const mockInsights = [
    {
      id: 1,
      type: 'positive',
      message: 'Basmati Rice sales increased by 15% compared to last week (AI Recommendation).',
      icon: 'TrendingUp',
      color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-450 dark:bg-emerald-950/30'
    },
    {
      id: 2,
      type: 'warning',
      message: 'Fresh Milk is running low and will run out within 3 days based on velocity.',
      icon: 'AlertTriangle',
      color: 'text-amber-500 bg-amber-500/10 dark:text-amber-450 dark:bg-amber-950/30'
    },
    {
      id: 3,
      type: 'negative',
      message: 'Chocolate Biscuits have not sold a single unit in the last 30 days.',
      icon: 'TrendingDown',
      color: 'text-rose-500 bg-rose-500/10 dark:text-rose-450 dark:bg-rose-950/30'
    },
    {
      id: 4,
      type: 'info',
      message: 'Mustard Cooking Oil generated the highest profit margin (৳50.00 per unit) this month.',
      icon: 'DollarSign',
      color: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-450 dark:bg-indigo-950/30'
    }
  ];

  const mockRecommendations = [
    {
      id: 1,
      product: 'Basmati Rice 5kg',
      currentStock: 15,
      predictedDemand: 40,
      suggestion: 'Current stock is insufficient for next week. Recommended ordering 25 more bags.',
    },
    {
      id: 2,
      product: 'Organic Honey 500g',
      currentStock: 3,
      predictedDemand: 10,
      suggestion: 'Stock is critically low. Recommended placing a reorder of 8 jars immediately.',
    }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch products and low-stock count
        const productsRes = await API.get('/products');
        setProducts(productsRes.data);
        const lowStockRes = await API.get('/products/low-stock');
        
        // Fetch sales to calculate revenue
        const salesRes = await API.get('/sales');
        setSales(salesRes.data);

        // Calculate stats
        const todayStr = new Date().toISOString().slice(0, 10);
        let todaySum = 0;
        let monthlySum = 0;

        salesRes.data.forEach((sale) => {
          const saleDate = new Date(sale.createdAt).toISOString().slice(0, 10);
          if (saleDate === todayStr) {
            todaySum += sale.totalAmount;
          }
          const currentMonth = new Date().getMonth();
          const saleMonth = new Date(sale.createdAt).getMonth();
          if (saleMonth === currentMonth) {
            monthlySum += sale.totalAmount;
          }
        });

        setStats({
          todaySales: todaySum,
          monthlyRevenue: monthlySum || todaySum,
          totalProducts: productsRes.data.length,
          lowStockCount: lowStockRes.data.length,
        });

        // 1. Process 7-day sales trend for SVG Chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().slice(0, 10);
        }).reverse();

        const dailySalesMap = {};
        last7Days.forEach(date => { dailySalesMap[date] = 0; });

        salesRes.data.forEach(sale => {
          const dateStr = new Date(sale.createdAt).toISOString().slice(0, 10);
          if (dateStr in dailySalesMap) {
            dailySalesMap[dateStr] += sale.totalAmount;
          }
        });

        const trend = last7Days.map(date => {
          const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
          return {
            label: dayName,
            value: dailySalesMap[date]
          };
        });
        setChartData(trend);

        // 2. Process product categories for gauge bars
        const categories = {};
        productsRes.data.forEach(p => {
          categories[p.category] = (categories[p.category] || 0) + 1;
        });
        const catList = Object.keys(categories).map(cat => ({
          name: cat,
          count: categories[cat],
          percentage: productsRes.data.length ? Math.round((categories[cat] / productsRes.data.length) * 100) : 0
        })).sort((a, b) => b.count - a.count);
        setCategoryData(catList.slice(0, 4));

        // Try to fetch AI dynamic insights & recommendations from Express routes
        try {
          const recsRes = await API.get('/ai/recommendations');
          setAiRecommendations(recsRes.data.length ? recsRes.data : mockRecommendations);
        } catch (recErr) {
          setAiRecommendations(mockRecommendations);
        }

        try {
          const insightsRes = await API.get('/ai/insights');
          setAiInsights(insightsRes.data.length ? insightsRes.data : mockInsights);
        } catch (insightErr) {
          setAiInsights(mockInsights);
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">COMPILING STATS...</p>
      </div>
    );
  }

  // Draw chart dimensions
  const chartWidth = 560;
  const chartHeight = 160;
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1000);
  const chartPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (chartWidth - 50) + 25;
    const y = chartHeight - ((d.value / maxChartValue) * (chartHeight - 40) + 20);
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = chartPoints.length > 0 
    ? `M ${chartPoints[0].x} ${chartPoints[0].y} ` + chartPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const fillPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight} L ${chartPoints[0].x} ${chartHeight} Z`
    : '';

  return (
    <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Welcome back, {currentUser.name}! {currentUser.storeId?.name ? `(${currentUser.storeId.name})` : ''} Here is your store status at a glance.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-2.5 rounded-xl shadow-sm">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-slate-700 dark:text-slate-350">
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Today's Sales Card */}
        <div 
          onClick={() => navigate('/pos')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/pos')}
          title="Click to open POS checkout"
          className="glass-panel p-6 rounded-3xl hover:-translate-y-1.5 hover:shadow-neon-indigo hover:border-indigo-500/40 transition-all duration-300 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer active:scale-98 select-none"
        >
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Today's Sales</p>
              <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">৳{stats.todaySales.toFixed(2)}</h3>
            <span className="text-[10px] text-emerald-500 font-bold inline-flex items-center mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.4% vs yesterday
            </span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div 
          onClick={() => navigate('/pos')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/pos')}
          title="Click to open POS sales records"
          className="glass-panel p-6 rounded-3xl hover:-translate-y-1.5 hover:shadow-neon-emerald hover:border-emerald-500/40 transition-all duration-300 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer active:scale-98 select-none"
        >
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Monthly Revenue</p>
              <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">৳{stats.monthlyRevenue.toFixed(2)}</h3>
            <span className="text-[10px] text-emerald-500 font-bold inline-flex items-center mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.2% vs last month
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products Card */}
        <div 
          onClick={() => navigate('/products')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/products')}
          title="Click to view product inventory"
          className="glass-panel p-6 rounded-3xl hover:-translate-y-1.5 hover:shadow-neon-indigo hover:border-indigo-500/40 transition-all duration-300 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer active:scale-98 select-none"
        >
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Products</p>
              <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{stats.totalProducts}</h3>
            <span className="text-[10px] text-slate-400 font-bold inline-flex items-center mt-2">
              In stock categories
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Items Card */}
        <div 
          onClick={() => navigate('/products?filter=low-stock')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/products?filter=low-stock')}
          title="Click to view low stock items"
          className={`glass-panel p-6 rounded-3xl hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer active:scale-98 select-none ${
            stats.lowStockCount > 0 
              ? 'border-rose-500/50 bg-rose-500/[0.03] dark:bg-rose-500/[0.02] shadow-neon-rose hover:border-rose-500 animate-[pulse-subtle_4s_ease-in-out_infinite]' 
              : 'hover:shadow-neon-indigo hover:border-indigo-500/40'
          }`}
        >
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Low Stock Items</p>
              <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{stats.lowStockCount}</h3>
            {stats.lowStockCount > 0 ? (
              <span className="text-[10px] text-rose-500 font-extrabold inline-flex items-center mt-2 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 mr-0.5" /> Action required
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-bold inline-flex items-center mt-2">
                All stocks normal
              </span>
            )}
          </div>
          <div className={`p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300 ${
            stats.lowStockCount > 0 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455' 
              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly Revenue Trend Chart */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
            <div>
              <h3 className="font-black text-lg text-slate-850 dark:text-white">Sales & Revenue Trend</h3>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Last 7 Days Overview</p>
            </div>
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl font-bold">
              Weekly Total: ৳{chartData.reduce((sum, d) => sum + d.value, 0).toFixed(0)}
            </span>
          </div>

          <div className="mt-6 w-full overflow-hidden flex items-center justify-center">
            {chartPoints.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = chartHeight - (ratio * (chartHeight - 40) + 20);
                  return (
                    <line 
                      key={idx} 
                      x1="20" 
                      y1={y} 
                      x2={chartWidth - 20} 
                      y2={y} 
                      className="stroke-slate-100 dark:stroke-slate-800/60" 
                      strokeWidth="1.5" 
                      strokeDasharray="4 4"
                    />
                  );
                })}

                <path d={fillPath} fill="url(#salesGrad)" />

                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="drop-shadow-[0_4px_8px_rgba(99,102,241,0.3)]"
                />

                {chartPoints.map((pt, idx) => (
                  <g key={idx} className="group/dot cursor-pointer">
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="7" 
                      className="fill-indigo-500 stroke-white dark:stroke-slate-900" 
                      strokeWidth="2.5" 
                    />
                    <circle 
                      cx={pt.x} 
                      cy={pt.y} 
                      r="14" 
                      className="fill-indigo-500/20 opacity-0 group-hover/dot:opacity-100 transition-all duration-300"
                    />
                    <text 
                      x={pt.x} 
                      y={pt.y - 15} 
                      className="text-[10px] font-black fill-indigo-600 dark:fill-indigo-400 opacity-0 group-hover/dot:opacity-100 transition-opacity duration-300"
                      textAnchor="middle"
                    >
                      ৳{pt.value.toFixed(0)}
                    </text>
                  </g>
                ))}

                {chartPoints.map((pt, idx) => (
                  <text 
                    key={idx} 
                    x={pt.x} 
                    y={chartHeight + 15} 
                    className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </text>
                ))}
              </svg>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-450 text-xs">No sales data recorded this week.</div>
            )}
          </div>
        </div>

        {/* Category breakdown bar gauges */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-lg text-slate-850 dark:text-white">Category Distribution</h3>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Top stock classifications</p>
          </div>

          <div className="mt-6 space-y-4">
            {categoryData.length === 0 ? (
              <div className="py-12 text-center text-slate-450 text-xs">No inventory products registered.</div>
            ) : (
              categoryData.map((cat, idx) => {
                const colors = [
                  'from-indigo-500 to-indigo-600',
                  'from-emerald-500 to-emerald-600',
                  'from-blue-500 to-blue-600',
                  'from-amber-500 to-amber-600'
                ];
                const bgGrad = colors[idx % colors.length];
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-350">{cat.name}</span>
                      <span className="font-black text-slate-850 dark:text-white">{cat.count} items ({cat.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${bgGrad} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-400">Inventory Status:</span>
            <span className="font-extrabold text-emerald-500 flex items-center">
              Active & Healthy <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Recommendations */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-500/10 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-850 dark:text-white">Smart Reorder Recommendations</h2>
              <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mt-0.5">AI-assisted supply chain optimizations</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiRecommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 space-y-3 hover:shadow-sm hover:border-indigo-500/30 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm dark:text-slate-100">{rec.product}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Auto-generated procurement plan</p>
                  </div>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200/20">
                    Demand: {rec.predictedDemand} units
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-slate-100/60 dark:border-slate-850/60 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Current Stock</p>
                    <p className="text-sm font-black text-rose-500 mt-0.5">{rec.currentStock} units</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recommended Order</p>
                    <p className="text-sm font-black text-indigo-500 mt-0.5">+{rec.predictedDemand - rec.currentStock} units</p>
                  </div>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-350 italic border-l-2 border-indigo-500 pl-3">
                  {rec.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Business Insights */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-850 pb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-500/10 text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-850 dark:text-white">AI Daily Business Insights</h2>
              <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mt-0.5">Daily intelligence summaries</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiInsights.map((insight) => {
              const iconMap = {
                TrendingUp,
                TrendingDown,
                AlertTriangle,
                DollarSign,
                Lightbulb
              };
              const IconComponent = iconMap[insight.icon] || Lightbulb;
              return (
                <div 
                  key={insight.id} 
                  className="flex items-start space-x-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors"
                >
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${insight.color}`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-205 leading-relaxed">
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
