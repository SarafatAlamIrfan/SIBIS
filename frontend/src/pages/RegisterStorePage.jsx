import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  AlertOctagon,
  Sparkles,
  Sun,
  Moon,
  Building2,
  CheckCircle2
} from 'lucide-react';

const RegisterStorePage = () => {
  const { registerStore } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: '',
    businessType: 'General Retail',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    phone: '',
    address: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.storeName || !formData.ownerName || !formData.ownerEmail || !formData.ownerPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await registerStore(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register shop. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      {/* Mesh Background Blobs */}
      <div className="absolute top-1/6 left-1/6 w-[40rem] h-[40rem] bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/6 right-1/6 w-[35rem] h-[35rem] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-25">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl transition-all duration-300 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-600 to-violet-650 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Register Your <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">Shop</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Start managing your inventory, point of sale, suppliers, and AI business analytics.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-250 rounded-2xl text-xs font-bold flex items-center">
            <AlertOctagon className="w-4 h-4 mr-2.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Store Info Group */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Store Details</p>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Store / Business Name *</label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Grocery Supermarket"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Business Type</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                  <option value="Consumer Electronics">Consumer Electronics</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                  <option value="General Retail">General Retail</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="+880 17..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Store Location / Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Dhaka, Bangladesh"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Owner Account Group */}
          <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Owner Account Details</p>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-300 font-bold">Owner Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Owner Name"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Business Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="owner@store.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.ownerPassword}
                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold rounded-2xl text-xs tracking-wider shadow-lg shadow-indigo-600/25 active:scale-98 transition-all flex items-center justify-center cursor-pointer"
          >
            <span>{submitting ? 'Registering Your Shop...' : 'Create Shop & Start Managing'}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-850">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            Already have a registered store?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In to Your Store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterStorePage;
