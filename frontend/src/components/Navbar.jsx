import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout, mockMode } = useAuth();

  if (!currentUser) return null;

  const roleBadges = {
    Owner: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900',
    Manager: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900',
    Cashier: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900',
    'Inventory Staff': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900',
  };

  const badgeClass = roleBadges[currentUser.role] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-8 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center space-x-2">
        {mockMode && (
          <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full border border-purple-200 font-semibold tracking-wide animate-pulse dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900">
            DEV MOCK MODE
          </span>
        )}
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-2 rounded-full border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="flex flex-col text-right">
            <span className="font-semibold text-slate-800 text-sm dark:text-slate-100">{currentUser.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</span>
          </div>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ml-2 ${badgeClass}`}>
            {currentUser.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center text-sm font-medium text-slate-600 hover:text-red-600 transition-colors duration-150 cursor-pointer dark:text-slate-300 dark:hover:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
