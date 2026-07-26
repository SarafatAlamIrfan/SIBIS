import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';
import {
  Building2,
  Phone,
  MapPin,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Award,
  Calendar,
  Lock,
  User,
  Mail
} from 'lucide-react';

const StoreProfile = () => {
  const { currentUser } = useAuth();
  const { currentThemeObj } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    businessType: 'General Retail',
  });

  const isEditable = currentUser?.role === 'Owner' || currentUser?.role === 'System Admin';

  const fetchStoreProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/store-profile');
      setStoreInfo(res.data);
      setFormData({
        name: res.data.name || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        city: res.data.city || '',
        country: res.data.country || '',
        businessType: res.data.businessType || 'General Retail',
      });
    } catch (err) {
      console.error('Failed to load store profile:', err);
      setMessage({ type: 'error', text: 'Failed to retrieve store profile data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isEditable) return;

    setMessage({ type: '', text: '' });

    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Store Name is required.' });
      return;
    }
    if (!formData.city.trim() || !formData.country.trim()) {
      setMessage({ type: 'error', text: 'City and Country are mandatory fields.' });
      return;
    }

    setSaving(true);
    try {
      const res = await API.put('/users/store-profile', formData);
      setStoreInfo(res.data.store);
      setMessage({ type: 'success', text: 'Store profile details saved successfully!' });
    } catch (err) {
      console.error('Failed to save store profile:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update store profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 dark:text-slate-500 font-semibold text-xs tracking-wider animate-pulse">
          RETRIEVING STORE PROFILE...
        </p>
      </div>
    );
  }

  const planColors = {
    Starter: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-350 dark:border-slate-800',
    Pro: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50',
    Enterprise: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Store Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-xs relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: currentThemeObj.primaryColor }}
        ></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 rounded-3xl flex items-center justify-center flex-shrink-0 relative shadow-inner">
            <Building2 className="w-14 h-14" style={{ color: currentThemeObj.primaryColor }} />
            <span className="absolute -bottom-1.5 bg-emerald-550 text-white p-1 rounded-full shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-550" />
            </span>
          </div>

          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {storeInfo?.name}
                </h1>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{storeInfo?.code}</p>
              </div>

              <div className="flex items-center justify-center md:justify-end space-x-2">
                <span
                  className={`text-xs px-3.5 py-1 rounded-xl border font-black tracking-wide ${
                    planColors[storeInfo?.subscriptionPlan] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {storeInfo?.subscriptionPlan} Subscription
                </span>
                
                <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-extrabold flex items-center border border-emerald-500/20">
                  Active Shop
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-1.5 text-slate-400" />
                <span>{storeInfo?.city}, {storeInfo?.country}</span>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                <span>Registered: {new Date(storeInfo?.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Store Profile Form Editor */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Store Profile Settings</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage public store contact, localization, and categorization</p>
            </div>
            {!isEditable && (
              <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg flex items-center dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50">
                <Lock className="w-3 h-3 mr-1" /> View Only
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs font-semibold">
            {message.text && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center border ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-350'
                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-350'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-350 font-bold">Store / Business Name *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={!isEditable}
                  placeholder="Store Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold disabled:bg-slate-100/70 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Contact Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={!isEditable}
                    placeholder="+880 1700-000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold disabled:bg-slate-100/70 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Business Category *</label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    disabled={!isEditable}
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold disabled:bg-slate-100/70 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed"
                  >
                    <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                    <option value="General Retail">General Retail</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 dark:text-slate-350 font-bold">Physical Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 animate-bounce-slow" />
                <input
                  type="text"
                  disabled={!isEditable}
                  placeholder="Street Address, Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold disabled:bg-slate-100/70 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">City *</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={!isEditable}
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold disabled:bg-slate-100/70 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-350 font-bold">Country *</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={!isEditable}
                    placeholder="Country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold disabled:bg-slate-100/70 dark:disabled:bg-slate-900/40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {isEditable && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-6 py-3 bg-indigo-650 hover:bg-indigo-550 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center space-x-2 transition-all active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving changes...' : 'Save Store Details'}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Side: Tenant Owner & Info Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              Tenant Ownership
            </h3>
            
            <div className="space-y-4 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Owner Name</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{storeInfo?.ownerId?.name || 'Unassigned'}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Contact Email</span>
                  <span className="text-slate-800 dark:text-slate-100 font-bold">{storeInfo?.ownerId?.email || storeInfo?.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
              SaaS Subscription Details
            </h3>
            
            <div className="space-y-3 font-semibold text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
              <div className="flex items-center space-x-2">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                <span className="text-slate-800 dark:text-slate-200 font-black">Plan Level: {storeInfo?.subscriptionPlan}</span>
              </div>
              <p>
                Your SaaS tenant is configured on the **{storeInfo?.subscriptionPlan || 'Pro'}** billing tier, which grants you access to platform POS checkouts, inventory auditing, multi-staff access controls, and contextual AI insights.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 text-[10px] font-bold text-slate-500">
                To upgrade subscription limits or adjust billing options, contact the SIBIS Platform Administrator at admin@sibis.com.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
