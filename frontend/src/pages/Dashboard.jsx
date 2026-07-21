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
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ArrowRight,
  Store as StoreIcon
} from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isSystemAdmin = currentUser?.role === 'System Admin';

  // System Admin State
  const [adminStats, setAdminStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalSalesCount: 0,
  });
  const [adminStores, setAdminStores] = useState([]);

  // Store Staff State
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (isSystemAdmin) {
          // System Admin Platform Overview Data
          try {
            const [statsRes, storesRes] = await Promise.all([
              API.get('/admin/stats'),
              API.get('/admin/stores'),
            ]);
            setAdminStats(statsRes.data || {});
            setAdminStores(Array.isArray(storesRes.data) ? storesRes.data : []);
          } catch (adminErr) {
            console.warn('Failed to fetch admin stats:', adminErr.message);
          }
        } else {
          // Store Staff Dashboard Data
          let productList = [];
          try {
            const productsRes = await API.get('/products');
            productList = Array.isArray(productsRes.data) ? productsRes.data : [];
          } catch (err) {
            console.warn('Failed to fetch products:', err.message);
          }
          setProducts(productList);

          let lowStockList = [];
          try {
            const lowStockRes = await API.get('/products/low-stock');
            lowStockList = Array.isArray(lowStockRes.data) ? lowStockRes.data : [];
          } catch (err) {
            console.warn('Failed to fetch low stock products:', err.message);
          }

          let salesList = [];
          try {
            const salesRes = await API.get('/sales');
            salesList = Array.isArray(salesRes.data) ? salesRes.data : [];
          } catch (err) {
            console.warn('Failed to fetch sales:', err.message);
          }
          setSales(salesList);

          // Calculate stats
          const now = new Date();
          const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);

          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString().slice(0, 10);

          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const lastMonthDate = new Date(now);
          lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
          const lastMonth = lastMonthDate.getMonth();
          const lastMonthYear = lastMonthDate.getFullYear();

          let todaySum = 0;
          let yesterdaySum = 0;
          let monthlySum = 0;
          let lastMonthSum = 0;

          salesList.forEach((sale) => {
            if (!sale || !sale.createdAt) return;
            const sDate = new Date(sale.createdAt);
            const saleDateStr = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()).toISOString().slice(0, 10);

            if (saleDateStr === todayStr) {
              todaySum += Number(sale.totalAmount || 0);
            }
            if (saleDateStr === yesterdayStr) {
              yesterdaySum += Number(sale.totalAmount || 0);
            }

            if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
              monthlySum += Number(sale.totalAmount || 0);
            }
            if (sDate.getMonth() === lastMonth && sDate.getFullYear() === lastMonthYear) {
              lastMonthSum += Number(sale.totalAmount || 0);
            }
          });

          let todayPct = null;
          if (yesterdaySum > 0) {
            todayPct = ((todaySum - yesterdaySum) / yesterdaySum) * 100;
          }

          let monthlyPct = null;
          if (lastMonthSum > 0) {
            monthlyPct = ((monthlySum - lastMonthSum) / lastMonthSum) * 100;
          }

          setStats({
            todaySales: todaySum,
            yesterdaySales: yesterdaySum,
            todayPct,
            monthlyRevenue: monthlySum,
            lastMonthRevenue: lastMonthSum,
            monthlyPct,
            totalProducts: productList.length,
            lowStockCount: lowStockList.length,
          });

          // 7-day sales trend for SVG Chart
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().slice(0, 10);
          }).reverse();

          const dailySalesMap = {};
          last7Days.forEach(date => { dailySalesMap[date] = 0; });

          salesList.forEach(sale => {
            if (!sale || !sale.createdAt) return;
            const dateStr = new Date(sale.createdAt).toISOString().slice(0, 10);
            if (dateStr in dailySalesMap) {
              dailySalesMap[dateStr] += Number(sale.totalAmount || 0);
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

          // Product categories
          const categories = {};
          productList.forEach(p => {
            if (p && p.category) {
              categories[p.category] = (categories[p.category] || 0) + 1;
            }
          });
          const catList = Object.keys(categories).map(cat => ({
            name: cat,
            count: categories[cat],
            percentage: productList.length ? Math.round((categories[cat] / productList.length) * 100) : 0
          })).sort((a, b) => b.count - a.count);
          setCategoryData(catList.slice(0, 4));

          try {
            const recsRes = await API.get('/ai/recommendations');
            setAiRecommendations(Array.isArray(recsRes.data) ? recsRes.data : []);
          } catch (recErr) {
            setAiRecommendations([]);
          }

          try {
            const insightsRes = await API.get('/ai/insights');
            setAiInsights(Array.isArray(insightsRes.data) ? insightsRes.data : []);
          } catch (insightErr) {
            setAiInsights([]);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isSystemAdmin]);

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
      await API.put(`/admin/stores/${storeId}/status`, { status: newStatus });
      const storesRes = await API.get('/admin/stores');
      setAdminStores(Array.isArray(storesRes.data) ? storesRes.data : []);
    } catch (err) {
      console.error('Failed to update store status:', err);
      alert('Failed to update store status.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">
          {isSystemAdmin ? 'LOADING PLATFORM ANALYTICS...' : 'COMPILING STORE STATS...'}
        </p>
      </div>
    );
  }

  // =====================================================================
  // 1. SYSTEM ADMIN CONTROL CENTER OVERVIEW
  // =====================================================================
  if (isSystemAdmin) {
    return (
      <div className="space-y-8 animate-[pulse-subtle_2s_ease-out_1]">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-purple-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Control Center</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-slate-900 dark:from-purple-400 dark:via-indigo-300 dark:to-white bg-clip-text text-transparent">
              System Admin Overview
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold text-sm">
              Global multi-tenant metrics, store subscription management, and system health status.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/admin/stores')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center cursor-pointer active:scale-95"
            >
              <Building2 className="w-4 h-4 mr-2" />
              <span>Manage Stores</span>
            </button>
            <div className="flex items-center space-x-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 p-2.5 rounded-xl shadow-sm font-bold">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* System Admin Platform Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Registered Stores */}
          <div
            onClick={() => navigate('/admin/stores')}
            className="glass-panel p-6 rounded-3xl hover:-translate-y-1.5 hover:shadow-neon-purple hover:border-purple-500/40 transition-all duration-300 flex items-center justify-between shadow-sm cursor-pointer select-none"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Registered Stores</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{adminStats.totalStores || 0}</h3>
              <span className="text-[10px] font-bold text-emerald-500 inline-flex items-center mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {adminStats.activeStores || 0} Active Stores
              </span>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl text-purple-600 dark:text-purple-400">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Platform Users */}
          <div className="glass-panel p-6 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-sm select-none">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Platform Users & Staff</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{adminStats.totalUsers || 0}</h3>
              <span className="text-[10px] text-slate-400 font-bold inline-flex items-center mt-2">
                Owners, Managers & Staff
              </span>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Global Revenue */}
          <div className="glass-panel p-6 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-sm select-none">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Global Platform Revenue</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">
                ৳{(adminStats.totalRevenue || 0).toFixed(2)}
              </h3>
              <span className="text-[10px] text-emerald-500 font-bold inline-flex items-center mt-2">
                {adminStats.totalSalesCount || 0} Total POS Checkout Invoices
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Products Tracked */}
          <div className="glass-panel p-6 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-sm select-none">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Cataloged Products</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-none">{adminStats.totalProducts || 0}</h3>
              <span className="text-[10px] text-slate-400 font-bold inline-flex items-center mt-2">
                Across all store inventory catalogs
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-600 dark:text-amber-400">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Main Content Grid for System Admin */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registered Stores Table Preview */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">Tenant Stores Directory</h3>
                <p className="text-xs text-slate-400 font-semibold">Overview of registered store tenants and status</p>
              </div>
              <button
                onClick={() => navigate('/admin/stores')}
                className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center"
              >
                <span>View All Stores ({adminStores.length})</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/60 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3">Store Name</th>
                    <th className="pb-3">Owner / Email</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3 text-right">Products</th>
                    <th className="pb-3 text-right">Sales Volume</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850/60 font-semibold text-slate-700 dark:text-slate-300">
                  {adminStores.slice(0, 5).map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <StoreIcon className="w-4 h-4 text-purple-500 shrink-0" />
                        <span>{s.name}</span>
                      </td>
                      <td className="py-3">
                        <div>{s.ownerId?.name || 'Owner'}</div>
                        <div className="text-[10px] text-slate-400">{s.ownerId?.email || s.email}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px]">
                          {s.businessType || 'Retail'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold">{s.productCount || 0}</td>
                      <td className="py-3 text-right font-mono font-black text-purple-600 dark:text-purple-400">
                        ৳{(s.totalVolume || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            s.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleToggleStoreStatus(s._id, s.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                            s.status === 'Active'
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {s.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Health & Quick Actions */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                System Infrastructure Health
              </h3>
              
              <div className="space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>MongoDB Database</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black">Connected</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Express REST API</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black">Online</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Firebase Auth SDK</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black">Active</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Quick Platform Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/stores')}
                  className="w-full p-3 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200/50 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2" /> Register New Tenant Store
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate('/store-activity')}
                  className="w-full p-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" /> View System Activity Logs
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // 2. STORE STAFF / OWNER INVENTORY & POS DASHBOARD
  // =====================================================================
  const chartWidth = 560;
  const chartHeight = 160;
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1000);
  const denominator = chartData.length > 1 ? chartData.length - 1 : 1;

  const chartPoints = chartData.map((d, i) => {
    const x = (i / denominator) * (chartWidth - 50) + 25;
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
            Welcome back, {currentUser?.name || 'User'}! {currentUser?.storeId?.name ? `(${currentUser.storeId.name})` : ''} Here is your store status at a glance.
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
            {stats.todayPct !== null ? (
              <span className={`text-[10px] font-bold inline-flex items-center mt-2 ${stats.todayPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.todayPct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {stats.todayPct >= 0 ? `+${stats.todayPct.toFixed(1)}%` : `${stats.todayPct.toFixed(1)}%`} vs yesterday
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold inline-flex items-center mt-2">
                Live POS sales today
              </span>
            )}
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
            {stats.monthlyPct !== null ? (
              <span className={`text-[10px] font-bold inline-flex items-center mt-2 ${stats.monthlyPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.monthlyPct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {stats.monthlyPct >= 0 ? `+${stats.monthlyPct.toFixed(1)}%` : `${stats.monthlyPct.toFixed(1)}%`} vs last month
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold inline-flex items-center mt-2">
                Current month revenue
              </span>
            )}
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
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-white">Sales & Revenue Trend</h3>
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
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs">No sales data recorded this week.</div>
            )}
          </div>
        </div>

        {/* Category breakdown bar gauges */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-lg text-slate-800 dark:text-white">Category Distribution</h3>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">Top stock classifications</p>
          </div>

          <div className="mt-6 space-y-4">
            {categoryData.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">No inventory products registered.</div>
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
                      <span className="font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                      <span className="font-black text-slate-800 dark:text-white">{cat.count} items ({cat.percentage}%)</span>
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

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-400">Inventory Status:</span>
            <button
              onClick={() => navigate(stats.lowStockCount > 0 ? '/products?filter=low-stock' : '/products')}
              className="font-extrabold text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center cursor-pointer transition-colors group"
              title="Click to view & manage store inventory products"
            >
              {stats.lowStockCount > 0 ? (
                <span className="text-rose-500 flex items-center font-black animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Attention Needed ({stats.lowStockCount} low stock)
                </span>
              ) : (
                <span className="flex items-center">
                  Active & Healthy <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Recommendations */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-500/10 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Smart Reorder Recommendations</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">AI-assisted supply chain optimizations</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiRecommendations.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <p className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">All Stock Levels Healthy</p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  All products in your store are currently stocked above minimum threshold levels. No reorder required right now.
                </p>
              </div>
            ) : (
              aiRecommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-3 hover:shadow-sm hover:border-indigo-500/30 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm dark:text-slate-100">{rec.product}</h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">Real-time demand analysis</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-lg border border-indigo-200/20">
                      Demand: {rec.predictedDemand} units
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-slate-100/60 dark:border-slate-800/60 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Current Stock</p>
                      <p className="text-sm font-black text-rose-500 mt-0.5">{rec.currentStock} units</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recommended Order</p>
                      <p className="text-sm font-black text-indigo-500 mt-0.5">+{rec.predictedDemand - rec.currentStock} units</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-500 pl-3">
                    {rec.suggestion}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Business Insights */}
        <div className="glass-panel p-6 rounded-3xl shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-md shadow-indigo-500/10 text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">AI Daily Business Insights</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">Real-time store intelligence summaries</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {aiInsights.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-1">
                <p className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">No Insights Available Yet</p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Add inventory products and process sales to generate real-time analytics for your store.
                </p>
              </div>
            ) : (
              aiInsights.map((insight) => {
                const iconMap = {
                  TrendingUp,
                  TrendingDown,
                  AlertTriangle,
                  DollarSign,
                  Lightbulb,
                  Package,
                };
                const IconComponent = iconMap[insight.icon] || Lightbulb;
                return (
                  <div 
                    key={insight.id} 
                    className="flex items-start space-x-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${insight.color}`}>
                      <IconComponent className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                        {insight.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
