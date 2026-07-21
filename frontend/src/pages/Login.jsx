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
  Moon,
  AlertOctagon,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('owner@sibis.com');
  const [password, setPassword] = useState('password123');
  const [mockRole, setMockRole] = useState('Owner');
  const [devDrawerOpen, setDevDrawerOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotDemoOtp, setForgotDemoOtp] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const { login, loginWithGoogle, sendForgotPasswordOtp, resetPasswordWithOtp, mockMode } = useAuth();
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
    setDevDrawerOpen(false);
  };

  // Google Sign In Handler (Triggers Google Auth Popup Window)
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const res = await loginWithGoogle();
      if (res?.isNewUser) {
        navigate('/register');
        return;
      }

      if (res?.role === 'System Admin') {
        navigate('/admin/stores');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Google Popup authentication failed.');
    }
  };

  // Forgot Password: Request OTP Code
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotSubmitting(true);
    try {
      const res = await sendForgotPasswordOtp(forgotEmail.trim());
      setForgotDemoOtp(res.otp || '');
      setForgotSuccess(`Verification code sent to ${forgotEmail.trim()}`);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset code.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  // Forgot Password: Verify OTP & Change Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please verify your new password.');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await resetPasswordWithOtp({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });

      alert(res.message || 'Password reset successfully!');
      setEmail(forgotEmail.trim());
      setPassword(newPassword);
      setForgotModalOpen(false);
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setForgotDemoOtp('');
    } catch (err) {
      setForgotError(err.message || 'Failed to reset password.');
    } finally {
      setForgotSubmitting(false);
    }
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
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-600/20">
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
          <div className="mt-6 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 px-4 py-3 rounded-2xl text-xs font-bold animate-pulse">
            {error}
          </div>
        )}

        {/* Continue with Google Button */}
        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-4 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs tracking-wide shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-3 active:scale-98"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white/80 dark:bg-slate-900/70 px-3 text-[10px] font-black uppercase text-slate-400 shrink-0">
              Or Sign In with Email
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          </div>
        </div>

        <form className="mt-4 space-y-6 text-xs text-slate-600 dark:text-slate-400 font-bold" onSubmit={handleSubmit}>
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
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || '');
                    setForgotStep(1);
                    setForgotError('');
                    setForgotSuccess('');
                    setForgotModalOpen(true);
                  }}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
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
              className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs tracking-wider shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transform active:scale-97 transition-all flex items-center justify-center cursor-pointer"
            >
              <LogIn className="h-4.5 w-4.5 mr-2 text-white" />
              <span>Sign In to Dashboard</span>
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

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {forgotStep === 1 ? 'Forgot Password' : 'Reset Your Password'}
                </h3>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-200 rounded-2xl text-xs font-bold flex items-center">
                <AlertOctagon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Step 1: Send Reset Code */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetCode} className="space-y-4 text-xs font-bold">
                <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Enter your registered account email address. We will generate and send a 6-digit verification code to reset your password.
                </p>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Account Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="owner@sibis.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs tracking-wider shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center transition-all"
                >
                  <span>{forgotSubmitting ? 'Sending Code...' : 'Send Verification Code'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP & Reset Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs font-bold">
                {/* Developer Demo Banner */}
                {forgotDemoOtp && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block mb-1">
                      Developer Demo Testing Code
                    </span>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest font-mono">
                      {forgotDemoOtp}
                    </p>
                    <button
                      type="button"
                      onClick={() => setForgotOtp(forgotDemoOtp)}
                      className="text-[10px] text-indigo-600 underline font-bold mt-1 cursor-pointer"
                    >
                      Auto-fill Code
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">6-Digit Verification Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 text-center text-xl font-mono font-black tracking-[0.4em] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer text-[11px]"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-xl text-xs tracking-wider shadow-md shadow-indigo-600/20 cursor-pointer flex items-center transition-all"
                  >
                    <span>{forgotSubmitting ? 'Resetting Password...' : 'Reset Password'}</span>
                    <ShieldCheck className="w-4 h-4 ml-1.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
