import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeSelector from './ThemeSelector';
import API from '../services/api';
import { LogOut, User, Sun, Moon, Bell, BarChart3, Menu, X as CloseIcon } from 'lucide-react';

const Navbar = ({ darkMode: propsDarkMode, toggleDarkMode: propsToggleDarkMode, onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const { darkMode: ctxDarkMode, toggleMode } = useTheme();
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const darkMode = propsDarkMode !== undefined ? propsDarkMode : ctxDarkMode;
  const handleToggle = propsToggleDarkMode || toggleMode;

  // Typewriter brand title animation
  const storeName = currentUser?.storeId?.name || 'Retail Store';
  const fullText = `${storeName} by SIBIS`;
  const [charCount, setCharCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const handleType = () => {
      if (!isDeleting) {
        if (charCount < fullText.length) {
          setCharCount((prev) => prev + 1);
        } else {
          // Pause at fully typed state
          timer = setTimeout(() => setIsDeleting(true), 2500);
          return;
        }
      } else {
        if (charCount > 0) {
          setCharCount((prev) => prev - 1);
        } else {
          // Pause at fully cleared state
          timer = setTimeout(() => setIsDeleting(false), 800);
          return;
        }
      }
      
      const speed = isDeleting ? 40 : 100;
      timer = setTimeout(handleType, speed);
    };

    timer = setTimeout(handleType, isDeleting ? 40 : 100);
    return () => clearTimeout(timer);
  }, [charCount, isDeleting, fullText]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (!currentUser) return;
        // System Admin has no store — never show store alerts in badge
        if (currentUser.role === 'System Admin') {
          setActiveAlertsCount(0);
          return;
        }
        const [lowStockRes, expiringRes] = await Promise.all([
          API.get('/products/low-stock'),
          API.get('/products/expiring')
        ]);
        
        const readAlerts = JSON.parse(localStorage.getItem('sibis_read_alerts') || '[]');
        const activeStock = (lowStockRes.data || []).filter(p => !readAlerts.includes(`stock-${p._id}`));
        const activeExpiring = (expiringRes.data || []).filter(p => !readAlerts.includes(`expire-${p._id}`));
        
        setActiveAlertsCount(activeStock.length + activeExpiring.length);
      } catch (err) {
        console.warn('Navbar alerts load failed:', err.message);
      }
    };
    
    fetchAlerts();
    
    // Listen to custom updates from Notifications page
    window.addEventListener('alerts_updated', fetchAlerts);
    window.addEventListener('storage', fetchAlerts);
    
    const interval = setInterval(fetchAlerts, 5000);
    return () => {
      window.removeEventListener('alerts_updated', fetchAlerts);
      window.removeEventListener('storage', fetchAlerts);
      clearInterval(interval);
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!currentUser) return null;

  const roleBadges = {
    'System Admin': 'bg-purple-50 text-purple-700 border-purple-200/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    'Site Admin': 'bg-purple-50 text-purple-700 border-purple-200/30 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/50',
    Owner: 'bg-rose-50 text-rose-700 border-rose-200/30 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    Manager: 'bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    Cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200/30 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
    'Inventory Staff': 'bg-amber-50 text-amber-700 border-amber-200/30 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
  };

  const badgeClass = roleBadges[currentUser.role] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <header className="h-16 bg-white/80 border-b border-slate-200/50 backdrop-blur-md fixed top-0 right-0 left-0 z-30 flex items-center justify-between px-4 sm:px-8 shadow-xs dark:bg-slate-900/80 dark:border-slate-800/60 transition-all duration-300">
      <div className="flex items-center space-x-2">
        {/* Mobile Hamburger toggle button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer border border-slate-200/40 dark:border-slate-700/40 focus:outline-none transition-all active:scale-95 mr-1"
          aria-label="Toggle Navigation Sidebar"
        >
          {isSidebarOpen ? <CloseIcon className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
        </button>

        <Link
          to="/dashboard"
          className="flex items-center hover:opacity-90 transition-opacity cursor-pointer group mr-6"
          title="Go to Dashboard Overview"
        >
          <div className="p-1.5 rounded-lg shadow-md mr-2.5 group-hover:scale-105 transition-transform duration-200 bg-indigo-600">
            <BarChart3 className="w-4.5 h-4.5 text-white animate-pulse" />
          </div>
          <span className="text-xs sm:text-base font-black tracking-widest uppercase flex items-center whitespace-nowrap">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              {fullText.slice(0, Math.min(charCount, storeName.length))}
            </span>
            {charCount > storeName.length && (
              <span className="text-slate-400 dark:text-slate-500 ml-1.5">
                {fullText.slice(storeName.length, charCount)}
              </span>
            )}
            <span className="w-0.5 h-3 sm:h-4 bg-indigo-500 dark:bg-indigo-400 ml-0.5 animate-pulse"></span>
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4 relative">
        {/* Notifications Bell Icon */}
        <Link
          to="/notifications"
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 relative mr-1"
          title="View alert notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          )}
        </Link>

        {/* Mobile-only profile toggle button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200/40 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/20 text-slate-500 hover:text-indigo-600 hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer lg:hidden transition-all duration-200 overflow-hidden"
          title="Open profile menu"
        >
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-4.5 h-4.5 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <>
            <div 
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-xs lg:hidden"
            />
            <div className="absolute right-0 top-14 w-72 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 rounded-3xl p-5 shadow-xl z-50 flex flex-col space-y-4 lg:hidden animate-[fade-in-up_0.15s_ease-out_1]">
              {/* User Details */}
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-extrabold text-slate-800 dark:text-white text-xs truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">
                    {currentUser.email}
                  </span>
                  <div className="mt-1">
                    <span className={`inline-block text-[8px] px-2 py-0.5 rounded-md border font-extrabold shadow-sm ${badgeClass}`}>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Links / Settings */}
              <div className="space-y-3.5">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile settings</span>
                </Link>
                
                <div className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Choose Theme</span>
                  <ThemeSelector />
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-rose-50/50 hover:bg-rose-50 text-rose-600 border border-rose-200/20 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 cursor-pointer dark:bg-rose-950/20 dark:hover:bg-rose-950/30 dark:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </>
        )}

        {/* Desktop-only items */}
        <div className="hidden lg:flex items-center space-x-3 sm:space-x-4">
          {/* Interactive Theme Palette Selector Dropdown */}
          <ThemeSelector />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <div className="flex items-center space-x-4">
            {/* Clickable Profile Pill */}
            <Link
              to="/profile"
              className="flex items-center space-x-3 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/30"
              title="Click to view & edit your profile"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 flex items-center justify-center flex-shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-slate-655 dark:text-slate-300 group-hover:text-indigo-600 transition-colors" />
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-bold text-slate-800 text-xs dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                  {currentUser.email}
                </span>
              </div>
              <span className={`hidden sm:inline-block text-[9px] px-2 py-0.5 rounded-md border font-extrabold shadow-sm ${badgeClass}`}>
                {currentUser.role}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center text-xs font-black text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors duration-150 cursor-pointer py-2 px-3 rounded-xl hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-250/20"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
