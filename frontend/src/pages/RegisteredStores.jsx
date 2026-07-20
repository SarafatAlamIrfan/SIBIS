import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Package,
  TrendingUp,
  Users,
  Store as StoreIcon,
  X,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const RegisteredStores = () => {
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State for creating store
  const [formData, setFormData] = useState({
    name: '',
    businessType: 'General Retail',
    subscriptionPlan: 'Pro',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: 'password123',
    phone: '',
    address: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storesRes, statsRes] = await Promise.all([
        API.get('/admin/stores'),
        API.get('/admin/stats'),
      ]);
      setStores(storesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to load registered stores data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (storeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
      await API.put(`/admin/stores/${storeId}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to update store status:', err);
      alert('Failed to update store status.');
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      await API.post('/admin/stores', formData);
      setModalOpen(false);
      setFormData({
        name: '',
        businessType: 'General Retail',
        subscriptionPlan: 'Pro',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: 'password123',
        phone: '',
        address: '',
      });
      fetchData();
    } catch (err) {
      console.error('Failed to create store:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to create store account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.ownerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.ownerId?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || store.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Registered Stores & SaaS Tenants
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Global Platform Administrator Console – Manage all registered shops, tenant owners, and platform health.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs tracking-wider shadow-lg shadow-indigo-600/20 active:scale-97 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Store</span>
          </button>
        </div>
      </div>

      {/* Global SaaS Platform Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Registered Stores</span>
            <StoreIcon className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-850 dark:text-white">{stats.totalStores}</p>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {stats.activeStores} Active Tenants
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Platform Products Catalog</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-850 dark:text-white">{stats.totalProducts}</p>
          <span className="text-[10px] text-purple-600 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-500/20">
            Across all stores
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Platform Sales Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-850 dark:text-white">৳{(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <span className="text-[10px] text-slate-400 font-bold">
            {stats.totalSalesCount || 0} Total POS Transactions
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-3xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">System Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-850 dark:text-white">{stats.totalUsers}</p>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-500/20">
            Owners, Managers & Staff
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores, codes, owners, or emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          {['All', 'Active', 'Suspended'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Registered Stores Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-150 dark:border-slate-850">
              <tr>
                <th className="px-6 py-4">Store / Shop Name</th>
                <th className="px-6 py-4">Business Type</th>
                <th className="px-6 py-4">Store Owner</th>
                <th className="px-6 py-4 text-right">Products</th>
                <th className="px-6 py-4 text-right">Sales Volume</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 font-semibold animate-pulse">
                    Loading registered stores list...
                  </td>
                </tr>
              ) : filteredStores.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider">
                    No stores found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <StoreIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-850 dark:text-white text-sm">{store.name}</p>
                          <span className="font-mono text-[10px] text-indigo-500 font-bold">{store.code || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold">
                        {store.businessType || 'Retail'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {store.ownerId ? (
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{store.ownerId.name}</p>
                          <p className="text-[10px] text-slate-400">{store.ownerId.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Owner Assigned</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                      {store.productCount || 0} items
                    </td>

                    <td className="px-6 py-4 text-right font-black text-slate-850 dark:text-white">
                      ৳{(store.totalVolume || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[9px] px-2.5 py-1 rounded-lg border font-black tracking-wide ${
                          store.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400'
                        }`}
                      >
                        {store.status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(store._id, store.status)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                          store.status === 'Active'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                        }`}
                      >
                        {store.status === 'Active' ? 'Suspend Store' : 'Activate Store'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Store Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-white">Register New Shop / Store</h3>
                  <p className="text-xs text-slate-400">Set up a new tenant business and assign its store owner account.</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Store / Business Name *</label>
                <div className="relative">
                  <StoreIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Madina Supermarket"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                    <option value="General Retail">General Retail</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">SaaS Plan</label>
                  <select
                    value={formData.subscriptionPlan}
                    onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Starter">Starter Plan</option>
                    <option value="Pro">Pro Business Plan</option>
                    <option value="Enterprise">Enterprise Plan</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-3 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Store Owner Account Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">Owner Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Owner Name"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300">Owner Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="owner@store.com"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Default Login Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Password"
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="+880 17..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 dark:text-slate-300">Address / Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Dhaka, Bangladesh"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl text-center cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-98 transition-all flex items-center justify-center"
                >
                  {submitting ? 'Creating Store...' : 'Create Store & Owner Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredStores;
