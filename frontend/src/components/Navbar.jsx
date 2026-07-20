import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Sun, Moon } from 'lucide-react';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const { currentUser, logout, mockMode } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!currentUser) return null;

  const roleBadges = {
    'System Admin': 'bg-purple-50 text-purple-700 border-purple-250/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    'Site Admin': 'bg-purple-50 text-purple-700 border-purple-250/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    Owner: 'bg-rose-50 text-rose-700 border-rose-250/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    Manager: 'bg-blue-50 text-blue-700 border-blue-250/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    Cashier: 'bg-emerald-50 text-emerald-700 border-emerald-250/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    'Inventory Staff': 'bg-amber-50 text-amber-700 border-amber-250/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  };

  const badgeClass = roleBadges[currentUser.role] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <header className="h-16 bg-white/80 border-b border-slate-200/50 backdrop-blur-md fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-8 shadow-sm dark:bg-slate-900/80 dark:border-slate-800/60 transition-all duration-300">
      <div className="flex items-center space-x-2">
        {mockMode && (
          <span className="bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 text-[10px] px-2.5 py-1 rounded-full border border-purple-250/40 font-extrabold tracking-wider dark:from-purple-950/30 dark:to-indigo-950/30 dark:text-purple-300 dark:border-purple-900/50 shadow-sm animate-pulse">
            DEV MOCK ENVIRONMENT
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {/* Light / Dark Toggle Switch */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? (
            <Sun className="w-4.5 h-4.5 text-amber-500 animate-spin-slow" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-slate-700" />
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 dark:bg-slate-950 dark:border-slate-850">
              <User className="w-4.5 h-4.5 text-slate-650 dark:text-slate-355" />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-bold text-slate-805 text-xs dark:text-slate-100 leading-none">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{currentUser.email}</span>
            </div>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ml-2 shadow-sm ${badgeClass}`}>
              {currentUser.role}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors duration-150 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
