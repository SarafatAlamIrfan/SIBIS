import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, Truck, ClipboardList, BarChart3 } from 'lucide-react';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) return null;

  const role = currentUser.role;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Owner', 'Manager', 'Cashier', 'Inventory Staff']
    },
    {
      name: 'POS Billing',
      path: '/pos',
      icon: ShoppingCart,
      roles: ['Owner', 'Manager', 'Cashier']
    },
    {
      name: 'Products & Stock',
      path: '/products',
      icon: Package,
      roles: ['Owner', 'Manager', 'Inventory Staff']
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      icon: Truck,
      roles: ['Owner', 'Manager']
    },
    {
      name: 'Purchase Orders',
      path: '/purchase-orders',
      icon: ClipboardList,
      roles: ['Owner', 'Manager']
    }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="fixed inset-y-0 left-0 z-20 w-64 bg-slate-900 border-r border-slate-800/60 dark:bg-slate-950/80 dark:border-slate-900/50 backdrop-blur-xl flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/40 dark:border-slate-900/50 bg-slate-950/20 backdrop-blur-sm">
        <div className="p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg shadow-md shadow-indigo-500/10 mr-3">
          <BarChart3 className="w-5 h-5 text-white animate-[pulse-subtle_2s_infinite]" />
        </div>
        <span className="text-lg font-black tracking-widest bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
          SIBIS
        </span>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 transform active:scale-97 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-500/40 dark:from-indigo-500 dark:to-violet-650'
                  : 'text-slate-400 hover:bg-slate-800/20 hover:text-slate-100 hover:translate-x-1.5 border border-transparent'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
