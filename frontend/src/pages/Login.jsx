import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  Settings, 
  X,
  Mail,
  Lock,
  Store,
  Shield,
  UserCheck,
  CreditCard,
  Package,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('owner@sibis.com');
  const [password, setPassword] = useState('password123');
  const [mockRole, setMockRole] = useState('Owner');
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  const { login, mockMode } = useAuth();
  const navigate = useNavigate();

  // Theme support
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sibis_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sibis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sibis_theme', 'light');
    }
  }, [darkMode]);

  const handleRoleSelect = (role) => {
    setMockRole(role);
    const emails = {
      'Site Admin': 'admin@sibis.com',
      Owner: 'owner@sibis.com',
      Manager: 'manager@sibis.com',
      Cashier: 'cashier@sibis.com',
      'Inventory Staff': 'inventory@sibis.com',
    };
    setEmail(emails[role] || '');
    setPassword(role === 'Site Admin' ? 'admin123' : 'password123');
    setDevDrawerOpen(false); // Close drawer to focus main form
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'System Admin') {
        navigate('/admin/stores');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const rolesList = [
    {
      name: 'Site Admin',
      icon: Shield,
      color: 'hover:border-purple-500/40 text-purple-650 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/10 border-slate-200 dark:border-slate-800',
      activeColor: 'border-purple-500 ring-2 ring-purple-500/25 bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
      desc: 'Platform Administrator. Controls all registered stores.',
    },
    {
      name: 'Owner',
      icon: Store,
      color: 'hover:border-red-500/40 text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/10 border-slate-200 dark:border-slate-800',
      activeColor: 'border-red-500 ring-2 ring-red-500/25 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400',
      desc: 'Full store owner dashboard control.',
    },
    {
      name: 'Manager',
      icon: UserCheck,
      color: 'hover:border-blue-500/40 text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/10 border-slate-200 dark:border-slate-800',
      activeColor: 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
      desc: 'Purchase logs and suppliers management.',
    },
    {
      name: 'Cashier',
      icon: CreditCard,
      color: 'hover:border-green-500/40 text-emerald-650 dark:text-green-400 bg-emerald-50 dark:bg-emerald-950/10 border-slate-200 dark:border-slate-800',
      activeColor: 'border-green-500 ring-2 ring-green-500/25 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-655 dark:text-green-400',
      desc: 'POS Sales transactions and cashier desk.',
    },
    {
      name: 'Inventory Staff',
      icon: Package,
      color: 'hover:border-amber-500/40 text-amber-650 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/10 border-slate-200 dark:border-slate-800',
      activeColor: 'border-amber-500 ring-2 ring-amber-500/25 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
      desc: 'Stock catalogs and intake logs.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      {/* Floating Animated Mesh Background Blobs */}
      <div className="absolute top-1/6 left-1/6 w-[40rem] h-[40rem] bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-[120px] animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-1/6 right-1/6 w-[35rem] h-[35rem] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[100px] animate-float-delayed pointer-events-none"></div>

      {/* Theme Toggle in Top-Right Corner */}
      <div className="absolute top-6 right-6 z-25">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl transition-all duration-300">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-600 to-violet-650 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Sign in to <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">SIBIS</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            Smart Inventory & Business Decision Support System
          </p>
        </div>

        {error && (
          <div className="mt-6 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-250 px-4 py-3 rounded-2xl text-xs font-bold animate-pulse">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6 text-xs text-slate-605 dark:text-slate-400 font-bold" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition-all font-semibold"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="uppercase tracking-wider block">
                  Password
                </label>
                <a href="#forgot" className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-97"
            >
              <LogIn className="h-4.5 w-4.5 mr-2 text-indigo-200 group-hover:text-white transition-colors" />
              Sign In to Dashboard
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          Protected by SIBIS Security Services
        </div>
      </div>

      {/* Floating Gear Button for Dev Drawer */}
      {mockMode && (
        <button
          onClick={() => setDevDrawerOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl hover:shadow-indigo-500/35 transition-all transform hover:scale-105 active:scale-95 cursor-pointer z-40 flex items-center space-x-2 text-xs font-bold"
        >
          <Settings className="w-5 h-5 animate-spin-slow" />
          <span>Dev Tools</span>
        </button>
      )}

      {/* Dev Side Drawer Overlay */}
      {devDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-fade-in">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setDevDrawerOpen(false)}></div>

          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 shadow-2xl h-full overflow-y-auto flex flex-col justify-between z-10 animate-[slide-in_0.3s_ease-out]">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-black text-slate-850 dark:text-white">Developer Offline Controls</h3>
                </div>
                <button
                  onClick={() => setDevDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed font-semibold">
                No Firebase connection detected. Pick any role card below to instantly inject credentials and verify specific access scopes.
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Bypass Credentials by Role
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  {rolesList.map((role) => {
                    const RoleIcon = role.icon;
                    const isActive = mockRole === role.name;
                    return (
                      <button
                        key={role.name}
                        type="button"
                        onClick={() => handleRoleSelect(role.name)}
                        className={`p-3.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex items-center space-x-4 ${
                          isActive ? role.activeColor : `${role.color} hover:bg-slate-100 dark:hover:bg-slate-800/40`
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-500/10' : 'bg-slate-100 dark:bg-slate-950/60'} text-indigo-600 dark:text-indigo-400`}>
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-xs text-slate-850 dark:text-white">{role.name}</h4>
                            {isActive && <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md">Selected</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">{role.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-8 flex justify-end">
              <button
                onClick={() => setDevDrawerOpen(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-center cursor-pointer text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
