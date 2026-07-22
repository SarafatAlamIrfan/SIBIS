import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  ClipboardList, 
  ListPlus, 
  Building2, 
  Users, 
  Activity, 
  User, 
  BarChart3, 
  Palette,
  History,
  Calendar,
  FileText,
  Bell 
} from 'lucide-react';

const Sidebar = () => {
  const { currentUser } = useAuth();
  const { currentThemeObj } = useTheme();
  const location = useLocation();
  const [reorderCount, setReorderCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const list = JSON.parse(localStorage.getItem('sibis_reorder_list') || '[]');
      setReorderCount(list.length);
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  if (!currentUser) return null;

  const role = currentUser.role;

  const menuItems = [
    {
      name: 'Registered Stores',
      path: '/admin/stores',
      icon: Building2,
      roles: ['System Admin']
    },
    {
      name: 'Dashboard Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff']
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
      name: 'Inventory History',
      path: '/products/inventory-history',
      icon: History,
      roles: ['Owner', 'Manager', 'Inventory Staff']
    },
    {
      name: 'Reorder List',
      path: '/reorder-list',
      icon: ListPlus,
      roles: ['Owner', 'Manager', 'Inventory Staff'],
      badge: reorderCount > 0 ? reorderCount : null
    },
    {
      name: 'Operations Calendar',
      path: '/calendar',
      icon: Calendar,
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
    },
    {
      name: 'Financial Reports',
      path: '/reports',
      icon: FileText,
      roles: ['Owner', 'Manager']
    },
    {
      name: 'Staff & Team',
      path: '/staff',
      icon: Users,
      roles: ['Owner', 'Manager']
    },
    {
      name: 'Store Activity',
      path: '/activity',
      icon: Activity,
      roles: ['Owner', 'Manager', 'System Admin']
    },
    {
      name: 'Alert Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff']
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: User,
      roles: ['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff']
    }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="fixed inset-y-0 left-0 z-20 w-64 bg-slate-900 border-r border-slate-800/60 dark:bg-slate-950/80 dark:border-slate-900/50 backdrop-blur-xl flex flex-col transition-all duration-300">
      <Link
        to="/dashboard"
        className="h-16 flex items-center px-6 border-b border-slate-800/40 dark:border-slate-900/50 bg-slate-950/20 backdrop-blur-sm hover:bg-slate-800/30 transition-all cursor-pointer group"
        title="Go to Dashboard Overview"
      >
        <div
          className="p-1.5 rounded-lg shadow-md mr-3 group-hover:scale-105 transition-transform duration-200"
          style={{ backgroundColor: currentThemeObj.primaryColor }}
        >
          <BarChart3 className="w-5 h-5 text-white animate-[pulse-subtle_2s_infinite]" />
        </div>
        <span
          className={`text-lg font-black tracking-widest bg-gradient-to-r ${currentThemeObj.darkGradient} bg-clip-text text-transparent group-hover:opacity-90 transition-opacity`}
        >
          SIBIS
        </span>
      </Link>

      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 transform active:scale-97 ${
                isActive
                  ? 'text-white shadow-lg border border-white/20'
                  : 'text-slate-400 hover:bg-slate-800/20 hover:text-slate-100 hover:translate-x-1.5 border border-transparent'
              }`}
              style={
                isActive
                  ? { backgroundColor: currentThemeObj.primaryColor }
                  : {}
              }
            >
              <div className="flex items-center">
                <Icon className={`w-4.5 h-4.5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-white text-slate-900' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/40 bg-slate-950/40 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Active Theme</span>
          <span className="flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
            <Palette className="w-3 h-3 mr-1" style={{ color: currentThemeObj.primaryColor }} />
            {currentThemeObj.name.split(' ')[0]}
          </span>
        </div>

        {currentUser.storeId?.name && (
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Active Tenant Store</p>
            <p className="font-extrabold text-white text-xs truncate flex items-center mt-0.5">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {currentUser.storeId.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
