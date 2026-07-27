import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Search,
  ShoppingCart,
  Package,
  ClipboardList,
  Users,
  Building2,
  Store,
  Clock,
  RefreshCw,
  Globe,
  ShieldCheck,
} from 'lucide-react';

const StoreActivity = () => {
  const { currentUser } = useAuth();
  const isSystemAdmin = currentUser?.role === 'System Admin';

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      if (isSystemAdmin) {
        // Admin fetches platform-level log
        const res = await API.get('/admin/platform-logs');
        setActivities(res.data || []);
      } else {
        // Store staff fetches their scoped store log
        const res = await API.get('/users/activity');
        setActivities(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load activity log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [isSystemAdmin]);

  // ─── Store-user config ───────────────────────────────────────
  const storeCategoryIcons = {
    'POS Sale': ShoppingCart,
    'Inventory Stock': Package,
    'Purchase Order': ClipboardList,
    'Staff Management': Users,
    'System Event': Building2,
  };

  const storeCategoryColors = {
    'POS Sale': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    'Inventory Stock': 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
    'Purchase Order': 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
    'Staff Management': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    'System Event': 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  };

  const storeCategories = ['All', 'POS Sale', 'Inventory Stock', 'Purchase Order', 'Staff Management', 'System Event'];

  // ─── Admin platform-log config ───────────────────────────────
  const platformCategoryIcons = {
    'Store Registration': Store,
    'Store Status Change': ShieldCheck,
    'Admin Action': Globe,
    'Platform System': Activity,
  };

  const platformCategoryColors = {
    'Store Registration': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400',
    'Store Status Change': 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    'Admin Action': 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400',
    'Platform System': 'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400',
  };

  const platformCategories = ['All', 'Store Registration', 'Store Status Change', 'Admin Action', 'Platform System'];

  // ─── Active config based on role ─────────────────────────────
  const activeIcons = isSystemAdmin ? platformCategoryIcons : storeCategoryIcons;
  const activeColors = isSystemAdmin ? platformCategoryColors : storeCategoryColors;
  const activeCategories = isSystemAdmin ? platformCategories : storeCategories;

  const filteredActivities = activities.filter((act) => {
    const nameField = isSystemAdmin ? act.actorName : act.userName;
    const descField = act.eventDescription || act.actionDescription || '';
    const roleField = isSystemAdmin ? act.actorRole : act.userRole;
    const catField = isSystemAdmin ? act.eventCategory : act.actionCategory;

    const matchesSearch =
      nameField?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descField.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleField?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.affectedStoreName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || catField === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const roleBadges = {
    Owner: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    Manager: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    Cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    'Inventory Staff': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    'System Admin': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    System: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
              {isSystemAdmin ? <Globe className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {isSystemAdmin ? 'Platform Activity Log' : 'Store Activity Audit Log'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                {isSystemAdmin
                  ? 'Site-wide events — new store registrations, status changes, and admin actions across all stores.'
                  : `Real-time member activity stream for ${currentUser?.storeId?.name || 'your store'} – Track POS sales, inventory updates, and staff actions.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchActivities}
            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold flex items-center space-x-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isSystemAdmin ? 'Search by store name, actor, or description...' : 'Search by member name, description, or role...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto overflow-x-auto max-w-full">
          {activeCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-semibold animate-pulse">
            Loading activity logs...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider">
            No activity logs found for this filter.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6">
            {filteredActivities.map((act) => {
              const catField = isSystemAdmin ? act.eventCategory : act.actionCategory;
              const CategoryIcon = activeIcons[catField] || Activity;
              const colorClass = activeColors[catField] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';
              const nameField = isSystemAdmin ? act.actorName : act.userName;
              const roleField = isSystemAdmin ? act.actorRole : act.userRole;
              const descField = act.eventDescription || act.actionDescription || '';

              const dateStr = new Date(act.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={act._id} className="relative pl-6 group">
                  {/* Timeline Node Bullet */}
                  <div className="absolute -left-[17px] top-1.5 p-1.5 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-full shadow-sm">
                    <CategoryIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <div className="bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 hover:border-indigo-500/30 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Actor Info */}
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-black text-xs border border-indigo-500/20">
                          {nameField ? nameField.charAt(0).toUpperCase() : 'S'}
                        </div>

                        <span className="font-black text-slate-800 dark:text-white text-xs">
                          {nameField || 'System'}
                        </span>

                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md border font-extrabold ${
                            roleBadges[roleField] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {roleField || 'System'}
                        </span>

                        {/* Admin view: show affected store name as a badge */}
                        {isSystemAdmin && act.affectedStoreName && (
                          <span className="text-[9px] px-2 py-0.5 rounded-md border font-extrabold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 flex items-center space-x-1">
                            <Store className="w-2.5 h-2.5 mr-0.5" />
                            {act.affectedStoreName}
                          </span>
                        )}
                      </div>

                      {/* Category Badge & Timestamp */}
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-[9px] px-2.5 py-0.5 rounded-lg border font-black tracking-wider ${colorClass}`}
                        >
                          {catField}
                        </span>

                        <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 pl-9">
                      {descField}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreActivity;
