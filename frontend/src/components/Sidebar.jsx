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

const Sidebar = ({ isOpen, onClose }) => {
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
      roles: ['System Admin'],
      category: 'ADMINISTRATION'
    },
    {
      name: 'Dashboard Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff'],
      category: 'CONSOLE'
    },
    {
      name: 'POS Billing',
      path: '/pos',
      icon: ShoppingCart,
      roles: ['Owner', 'Manager', 'Cashier'],
      category: 'CONSOLE'
    },
    {
      name: 'Products & Stock',
      path: '/products',
      icon: Package,
      roles: ['Owner', 'Manager', 'Inventory Staff'],
      category: 'CONSOLE'
    },
    {
      name: 'Inventory History',
      path: '/products/inventory-history',
      icon: History,
      roles: ['Owner', 'Manager', 'Inventory Staff'],
      category: 'CONSOLE'
    },
    {
      name: 'Reorder List',
      path: '/reorder-list',
      icon: ListPlus,
      roles: ['Owner', 'Manager', 'Inventory Staff'],
      badge: reorderCount > 0 ? reorderCount : null,
      category: 'CONSOLE'
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      roles: ['Owner', 'Manager', 'Inventory Staff'],
      category: 'CONSOLE'
    },
    {
      name: 'Suppliers',
      path: '/suppliers',
      icon: Truck,
      roles: ['Owner', 'Manager'],
      category: 'MANAGEMENT'
    },
    {
      name: 'Purchase Orders',
      path: '/purchase-orders',
      icon: ClipboardList,
      roles: ['Owner', 'Manager', 'Inventory Staff'],
      category: 'MANAGEMENT'
    },
    {
      name: 'Financial Reports',
      path: '/reports',
      icon: FileText,
      roles: ['Owner', 'Manager'],
      category: 'MANAGEMENT'
    },
    {
      name: 'Staff & Team',
      path: '/staff',
      icon: Users,
      roles: ['Owner', 'Manager'],
      category: 'MANAGEMENT'
    },
    {
      name: 'Store Activity',
      path: '/activity',
      icon: Activity,
      roles: ['Owner', 'Manager', 'System Admin'],
      category: 'MANAGEMENT'
    },
    {
      name: 'Alert Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff'],
      category: 'PERSONAL CENTER'
    },
    {
      name: 'Store Profile',
      path: '/store-profile',
      icon: Building2,
      roles: ['Owner', 'Manager'],
      category: 'PERSONAL CENTER'
    },
    {
      name: 'My Profile',
      path: '/profile',
      icon: User,
      roles: ['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff'],
      category: 'PERSONAL CENTER'
    }
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(role));
  
  // Unique categories in order of appearance
  const categoriesList = ['ADMINISTRATION', 'CONSOLE', 'MANAGEMENT', 'PERSONAL CENTER'];

  return (
    <div className={`fixed top-16 bottom-0 left-0 z-20 w-64 bg-white border-r border-slate-200/60 dark:bg-slate-950 dark:border-slate-900/50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex-1 py-4 pr-3 pl-0 space-y-4 overflow-y-auto custom-scrollbar">
        {categoriesList.map((catName) => {
          const catItems = visibleItems.filter(item => item.category === catName);
          if (catItems.length === 0) return null;

          return (
            <div key={catName} className="space-y-1">
              <div className="px-4 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {catName}
              </div>
              <div className="space-y-0.5">
                {catItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-r-xl rounded-l-none text-[11px] font-black tracking-wide transition-all duration-300 transform active:scale-97 border-l-[3px] ${
                        isActive
                          ? 'bg-indigo-50/70 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-200 border-transparent hover:translate-x-1'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                          isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200/20 dark:border-indigo-500/20'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-900/50 bg-slate-50/30 dark:bg-slate-950/40 text-xs space-y-2">
        {currentUser.storeId?.name && (
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Tenant Store</p>
            <p className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px] truncate flex items-center mt-1.5">
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
