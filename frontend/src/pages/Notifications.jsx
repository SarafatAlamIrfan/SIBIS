import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  Bell, 
  AlertTriangle, 
  Trash2, 
  RefreshCw, 
  ChevronRight, 
  Clock, 
  ArrowRight,
  TrendingDown,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [expiringAlerts, setExpiringAlerts] = useState([]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [lowStockRes, expiringRes] = await Promise.all([
        API.get('/products/low-stock'),
        API.get('/products/expiring')
      ]);
      setStockAlerts(lowStockRes.data || []);
      setExpiringAlerts(expiringRes.data || []);
    } catch (err) {
      console.error('Failed to load alert notification updates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const alertsList = [
    ...stockAlerts.map(p => ({
      id: `stock-${p._id}`,
      type: p.currentStock <= 0 ? 'critical' : 'warning',
      title: p.currentStock <= 0 ? `${p.name} is completely out of stock!` : `${p.name} stock level is low`,
      desc: p.currentStock <= 0 
        ? `Customer POS transactions for this product are blocked. Reorder from supplier immediately.`
        : `Current stock: ${p.currentStock} units. Minimum threshold level is ${p.minStockThreshold} units.`,
      actionLabel: p.currentStock <= 0 ? 'Reorder immediately' : 'Add to reorder list',
      actionPath: '/products',
      icon: AlertTriangle,
      color: p.currentStock <= 0 
        ? 'text-rose-500 bg-rose-500/10 border-rose-500/25 dark:text-rose-455' 
        : 'text-amber-500 bg-amber-500/10 border-amber-500/25 dark:text-amber-455',
      time: p.updatedAt
    })),
    ...expiringAlerts.map(p => {
      const daysLeft = Math.ceil((new Date(p.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
      const isExpired = daysLeft <= 0;
      return {
        id: `expire-${p._id}`,
        type: isExpired ? 'critical' : 'info',
        title: isExpired ? `${p.name} has expired!` : `${p.name} is expiring soon`,
        desc: isExpired
          ? `Product passed its expiration date on ${new Date(p.expirationDate).toLocaleDateString()}. Dispose of stock.`
          : `Expiring in ${daysLeft} days (on ${new Date(p.expirationDate).toLocaleDateString()}). Consider a discount promotion.`,
        actionLabel: isExpired ? 'Audit stock levels' : 'Suggest promotion',
        actionPath: '/dashboard',
        icon: Clock,
        color: isExpired
          ? 'text-rose-500 bg-rose-500/10 border-rose-500/25 dark:text-rose-455'
          : 'text-indigo-500 bg-indigo-500/10 border-indigo-500/25 dark:text-indigo-400',
        time: p.expirationDate
      };
    })
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  return (
    <div className="space-y-8 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Bell className="w-6 h-6 animate-[swing_1.5s_ease-in-out_infinite]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Notifications & Alerts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Real-time system notices – track stockout blocks, low inventory, and product expirations.
            </p>
          </div>
        </div>

        <button
          onClick={loadAlerts}
          className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-600/10 cursor-pointer print:hidden transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Notices</span>
        </button>
      </div>

      {/* Stream */}
      <div className="max-w-3xl space-y-4">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-semibold animate-pulse">
            Loading real-time notifications...
          </div>
        ) : alertsList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-3xl text-center space-y-3 shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 inline-block rounded-full border border-slate-100 dark:border-slate-850">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-extrabold text-slate-700 dark:text-slate-350 text-sm uppercase">No Active Alerts</p>
            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
              Excellent! All store stock levels are healthy, and no products are close to expiration.
            </p>
          </div>
        ) : (
          alertsList.map((alert) => {
            const Icon = alert.icon;
            return (
              <div 
                key={alert.id}
                className={`p-5 rounded-3xl border flex items-start space-x-4 bg-white dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all duration-300 ${
                  alert.type === 'critical' 
                    ? 'border-rose-500/20 hover:border-rose-500/40' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                {/* Visual Icon indicator */}
                <div className={`p-2.5 rounded-2xl border ${alert.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text Description */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-slate-800 dark:text-white text-sm">
                      {alert.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2">
                      {alert.type === 'critical' ? 'Urgent Action' : 'Notice'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {alert.desc}
                  </p>
                  
                  {/* CTA link button */}
                  <div className="pt-2">
                    <button
                      onClick={() => navigate(alert.actionPath)}
                      className="text-[11px] font-black text-indigo-500 hover:text-indigo-650 flex items-center cursor-pointer transition-colors group"
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
