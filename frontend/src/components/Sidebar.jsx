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
    <div className="fixed inset-y-0 left-0 z-20 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <BarChart3 className="w-8 h-8 text-indigo-400 mr-3" />
        <span className="text-xl font-bold tracking-wider text-white">SIBIS</span>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
