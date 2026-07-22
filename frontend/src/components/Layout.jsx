import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatBot from './AIChatBot';

const Layout = () => {
  const { currentUser, loading } = useAuth();
  const { darkMode, toggleMode, currentThemeObj } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: currentThemeObj.primaryColor, borderTopColor: 'transparent' }}
          ></div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Syncing profile details...</p>
        </div>
      </div>
    );
  }

  // Redirect to Home landing page if user session does not exist
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Sidebar />
      <div className="pl-64 min-h-screen flex flex-col">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleMode} />
        <main className="flex-1 p-8 pt-24 overflow-auto animate-[pulse-subtle_2s_ease-out_1]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <AIChatBot />
    </div>
  );
};

export default Layout;
