import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatBot from './AIChatBot';

const Layout = () => {
  const { currentUser, loading } = useAuth();
  const { darkMode, toggleMode, currentThemeObj } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar automatically on navigation/route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 flex flex-col">
      <Navbar 
        darkMode={darkMode} 
        toggleDarkMode={toggleMode} 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 pt-16 relative">
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-15 lg:hidden transition-opacity duration-300"
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 pl-0 lg:pl-64 flex flex-col min-h-[calc(100vh-4rem)]">
          <main className="flex-1 p-4 sm:p-8 bg-white dark:bg-slate-900/45 rounded-none lg:rounded-tl-[32px] lg:border-t lg:border-l border-slate-200/50 dark:border-slate-800/30 shadow-xs overflow-auto animate-[pulse-subtle_2s_ease-out_1]">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <AIChatBot />
    </div>
  );
};

export default Layout;
