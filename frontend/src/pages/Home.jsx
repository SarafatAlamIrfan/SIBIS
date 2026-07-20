import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WireArtBackground from '../components/WireArtBackground';
import {
  Store,
  ArrowRight,
  ShieldCheck,
  Layers,
  Activity,
  ShoppingBag,
  Sun,
  Moon,
  Sparkles,
  TrendingUp,
  Package,
  Users
} from 'lucide-react';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Theme support
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sibis_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sibis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sibis_theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Floating Animated Mesh Background Blobs */}
      <div className="absolute top-1/10 left-1/4 w-[45rem] h-[45rem] bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-[140px] animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-1/10 right-1/4 w-[40rem] h-[40rem] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[120px] animate-float-delayed pointer-events-none"></div>

      {/* Header Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md border-b border-slate-200/55 dark:border-slate-900/55 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3.5 group cursor-pointer" title="SIBIS Home">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/10 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">SIBIS</span>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Auth CTA */}
            {currentUser ? (
              <Link
                to="/dashboard"
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/15 cursor-pointer flex items-center transition-all transform active:scale-97"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/15 cursor-pointer flex items-center transition-all transform active:scale-97"
                >
                  Register Shop
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 bg-indigo-500/10 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider mb-6 animate-pulse border border-indigo-500/10">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SIBIS</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl text-slate-900 dark:text-white">
          Smart Inventory & Business{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">
            Insight System
          </span>
        </h1>

        <p className="mt-6 text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed font-semibold">
          SIBIS streamlines inventory tracking, supplier procurement schedules, and high-speed POS checkouts inside a single, unified glassmorphic enterprise dashboard.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to={currentUser ? "/dashboard" : "/register"}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs tracking-wider shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transform active:scale-97 transition-all flex items-center justify-center cursor-pointer"
          >
            {currentUser ? 'Explore Dashboard' : 'Get Started & Register Shop'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs tracking-wider border border-slate-200 dark:border-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          >
            Learn Core Features
          </a>
        </div>

        {/* Animated Wire Art Supermarket & Logistics Background */}
        <WireArtBackground />

        {/* Breathtaking CSS Browser Mockup Section */}
        <div className="mt-16 w-full max-w-5xl rounded-3xl overflow-hidden glass-panel border border-slate-200/50 dark:border-slate-800/50 shadow-2xl relative group bg-white/20 dark:bg-slate-900/10 p-2 md:p-3 animate-[pulse-subtle_3s_ease-out_infinite]">
          {/* Browser Window Header */}
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100/55 dark:bg-slate-950/40 rounded-t-2xl border-b border-slate-200/20 dark:border-slate-800/20">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 pl-4">sibis-intelligence-panel.app</span>
          </div>
          {/* Mock Layout */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 md:p-6 rounded-b-2xl grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="md:col-span-2 space-y-4">
              <div className="h-44 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/20 dark:border-slate-800/20 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">7-Day Sales Trend</span>
                  <span className="text-[9px] bg-emerald-550/10 text-emerald-500 font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">Live</span>
                </div>
                {/* SVG trend line preview */}
                <svg className="w-full h-24 mt-2" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradient-hero" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 25 Q 20 5 40 18 T 80 8 T 100 5" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                  <path d="M 0 25 Q 20 5 40 18 T 80 8 T 100 5 L 100 30 L 0 30 Z" fill="url(#gradient-hero)" />
                </svg>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/20 p-4 rounded-2xl flex flex-col justify-between h-24">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Sales</span>
                  <span className="text-xl font-black">৳145,230.00</span>
                  <span className="text-[9px] text-emerald-550 font-bold">+12.4% vs last week</span>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/20 p-4 rounded-2xl flex flex-col justify-between h-24">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Stock Alerts</span>
                  <span className="text-xl font-black text-rose-500 animate-pulse">3 Items Low</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Immediate reorder required</span>
                </div>
              </div>
            </div>
            <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/20 p-4 rounded-2xl flex flex-col justify-between h-72">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Recommendations</span>
              <div className="space-y-3.5 my-auto">
                <div className="p-3 bg-indigo-50 dark:bg-slate-950/50 rounded-xl border border-indigo-100/10">
                  <p className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400">📈 Stock Optimization Alert</p>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">Basmati Rice sales grew by 15%. Order 25 more bags to prevent depletion.</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-slate-950/50 rounded-xl border border-amber-100/10">
                  <p className="text-[10px] font-bold text-amber-655 dark:text-amber-405">⚠️ Slow-Moving Stock</p>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">Chocolate Biscuits have zero sales in 30 days. Avoid re-ordering.</p>
                </div>
              </div>
              <button disabled className="w-full py-2.5 bg-indigo-600/10 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold rounded-xl border border-indigo-500/10">
                AI Diagnostics Active
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-slate-200/40 dark:border-slate-900/40 bg-slate-50/50 dark:bg-slate-950/30 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Core Functional Workspaces</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-semibold">
              Unifying every business department inside SIBIS's responsive ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Fast POS Checkout</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                High-speed cart adding, realtime stock safety gauges, and custom digital receipt layout previews for rapid operations.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Catalog Management</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Dynamic category sorting pills, visual stock safety lines, detailed item edit drawers, and custom stock metrics.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Suppliers Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                Dhaka-based supplier listings, direct vendor status triggers, quick profile action panels, and clean coordinates.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-3xl shadow-sm space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">AI Business Insights</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                7-day sales curve trendlines, donut metric summary gauges, slow-moving alerts, and automated reorder demand suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200/40 dark:border-slate-900/40 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold bg-white/20 dark:bg-slate-950/10">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-center space-x-2.5">
            <div className="p-1 bg-indigo-600 rounded-lg text-white">
              <Store className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white">SIBIS Platform</span>
          </div>
          <p>© {new Date().getFullYear()} Smart Inventory & Business Insight System. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
