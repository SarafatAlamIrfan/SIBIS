import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import {
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  AlertOctagon,
  Sparkles,
  Sun,
  Moon,
  Building2,
  CheckCircle2,
  XCircle,
  KeyRound,
  RefreshCw,
  Edit3,
  ShieldCheck
} from 'lucide-react';

const RegisterStorePage = () => {
  const { registerStore, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Step Control: 1 = Fill Registration Details, 2 = Verify Email OTP
  const [step, setStep] = useState(1);

  // Google Sign In Handler (Triggers Google Auth Popup Window)
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google Popup authentication failed.');
    }
  };

  const [formData, setFormData] = useState({
    storeName: '',
    businessType: 'General Retail',
    customBusinessType: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });

  // Email Validation & Availability State
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    valid: null,
    available: null,
    message: '',
  });

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [demoOtpBanner, setDemoOtpBanner] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Real-time Email Validity & Availability Check
  const handleEmailBlur = async () => {
    const email = formData.ownerEmail.trim();
    if (!email) {
      setEmailStatus({ checking: false, valid: null, available: null, message: '' });
      return;
    }

    setEmailStatus({ checking: true, valid: null, available: null, message: 'Checking email...' });
    try {
      const res = await API.post('/users/check-email', { email });
      setEmailStatus({
        checking: false,
        valid: res.data.valid,
        available: res.data.available,
        message: res.data.message,
      });
    } catch (err) {
      setEmailStatus({
        checking: false,
        valid: false,
        available: false,
        message: err.response?.data?.error || 'Invalid email format.',
      });
    }
  };

  // Step 1: Handle Send OTP and proceed to Verification Step
  const handleProceedToVerification = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Check required fields
    if (!formData.storeName || !formData.ownerName || !formData.ownerEmail || !formData.ownerPassword) {
      setError('Please fill in all required fields marked with *.');
      return;
    }

    // 2. Custom Business Type validation if "Others" is selected
    if (formData.businessType === 'Others' && !formData.customBusinessType.trim()) {
      setError('Please specify your custom business type.');
      return;
    }

    // 3. Password Confirmation Validation
    if (formData.ownerPassword !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match. Please verify your password.');
      return;
    }

    if (formData.ownerPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // 4. Email Availability Check
    if (emailStatus.available === false) {
      setError('This email address is already registered in SIBIS. Please use a different email or sign in.');
      return;
    }

    // Send Verification OTP Code
    setOtpSending(true);
    try {
      const res = await API.post('/users/send-verification-otp', { email: formData.ownerEmail });
      setDemoOtpBanner(res.data.otp || '');
      setStep(2); // Move to OTP step
      setResendCountdown(30);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setError('');
    setOtpSending(true);
    try {
      const res = await API.post('/users/send-verification-otp', { email: formData.ownerEmail });
      setDemoOtpBanner(res.data.otp || '');
      setResendCountdown(30);
      alert(`New verification code sent to ${formData.ownerEmail}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code.');
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: Verify OTP & Complete Store Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setOtpVerifying(true);
    try {
      // 1. Verify OTP
      await API.post('/users/verify-otp', { email: formData.ownerEmail, otp: otpCode });

      // 2. Finalize Store & Owner Registration
      const finalBusinessType =
        formData.businessType === 'Others' ? formData.customBusinessType.trim() : formData.businessType;

      await registerStore({
        storeName: formData.storeName,
        businessType: finalBusinessType,
        phone: formData.phone,
        address: formData.address,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPassword: formData.ownerPassword,
        otp: otpCode,
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please check the code and try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12 transition-colors duration-300">
      {/* Mesh Background Blobs */}
      <div className="absolute top-1/6 left-1/6 w-[40rem] h-[40rem] bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/6 right-1/6 w-[35rem] h-[35rem] bg-purple-500/5 dark:bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-25">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-95"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl transition-all duration-300 space-y-6">
        {/* Registration Stepper Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-indigo-600 to-violet-650 rounded-2xl shadow-lg shadow-indigo-600/20">
            {step === 1 ? <Building2 className="h-8 w-8 text-white" /> : <ShieldCheck className="h-8 w-8 text-white" />}
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {step === 1 ? (
              <>
                Register Your <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">Shop</span>
              </>
            ) : (
              <>
                Email <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">Verification</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {step === 1
              ? 'Start managing your inventory, POS, suppliers, and multi-tenant AI analytics.'
              : `We have sent a 6-digit security verification code to ${formData.ownerEmail}`}
          </p>

          {/* Step indicator bar */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            <span className={`h-2 rounded-full transition-all ${step === 1 ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}></span>
            <span className={`h-2 rounded-full transition-all ${step === 2 ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}></span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-250 rounded-2xl text-xs font-bold flex items-center">
            <AlertOctagon className="w-4 h-4 mr-2.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Registration Form Details */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Continue with Google Button */}
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

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              <span className="bg-white/80 dark:bg-slate-900/70 px-3 text-[10px] font-black uppercase text-slate-400 shrink-0">
                Or Register with Email (Verification Code Required)
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            </div>

            <form onSubmit={handleProceedToVerification} className="space-y-4 text-xs font-semibold">
              {/* Store Info Group */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Store Details</p>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Store / Business Name *</label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Madina Supermarket"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Business Type *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                    <option value="Consumer Electronics">Consumer Electronics</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                    <option value="General Retail">General Retail</option>
                    <option value="Others">Others (Specify below)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="+880 17..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Input for "Others" Business Type */}
              {formData.businessType === 'Others' && (
                <div className="space-y-1 animate-[fade-in_0.2s_ease-out]">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Specify Custom Business Type *</label>
                  <div className="relative">
                    <Edit3 className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pet Store, Hardware Shop, Book Store..."
                      value={formData.customBusinessType}
                      onChange={(e) => setFormData({ ...formData, customBusinessType: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Store Location / Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Dhaka, Bangladesh"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Owner Account Group */}
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Owner Account & Security</p>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300 font-bold">Owner Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Owner Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Email Input with Live Check */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Business Email Address *</label>
                  {emailStatus.checking && <span className="text-[10px] text-slate-400 animate-pulse">Checking availability...</span>}
                  {emailStatus.available === true && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Email valid & available
                    </span>
                  )}
                  {emailStatus.available === false && (
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold flex items-center">
                      <XCircle className="w-3 h-3 mr-1" /> Email already registered
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="owner@store.com"
                    value={formData.ownerEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, ownerEmail: e.target.value });
                      setEmailStatus({ checking: false, valid: null, available: null, message: '' });
                    }}
                    onBlur={handleEmailBlur}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:ring-2 font-semibold ${
                      emailStatus.available === false
                        ? 'border-rose-400 focus:ring-rose-500'
                        : emailStatus.available === true
                        ? 'border-emerald-400 focus:ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Password & Password Confirmation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300 font-bold">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-700 dark:text-slate-300 font-bold">Confirm Password *</label>
                    {formData.confirmPassword && (
                      <span
                        className={`text-[10px] font-extrabold flex items-center ${
                          formData.ownerPassword === formData.confirmPassword
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formData.ownerPassword === formData.confirmPassword ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Match
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" /> Mismatch
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border rounded-xl focus:ring-2 font-semibold ${
                        formData.confirmPassword
                          ? formData.ownerPassword === formData.confirmPassword
                            ? 'border-emerald-400 focus:ring-emerald-500'
                            : 'border-rose-400 focus:ring-rose-500'
                          : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={otpSending}
              className="w-full py-4 mt-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs tracking-wider shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transform active:scale-98 transition-all flex items-center justify-center cursor-pointer"
            >
              <span>{otpSending ? 'Sending Verification Code...' : 'Verify Email & Continue'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>
        </div>
      )}

        {/* STEP 2: Email Verification OTP Screen */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-6 animate-[fade-in_0.3s_ease-out]">
            {/* Developer Demo Testing Banner */}
            {demoOtpBanner && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block mb-1">
                  Developer / Demo Testing Code
                </span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest font-mono">
                  {demoOtpBanner}
                </p>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtpBanner)}
                  className="text-[10px] text-indigo-600 underline font-bold mt-1 cursor-pointer"
                >
                  Auto-fill Code
                </button>
              </div>
            )}

            <div className="space-y-2 text-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative max-w-xs mx-auto">
                <KeyRound className="w-5 h-5 text-indigo-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3.5 text-center text-2xl font-mono font-black tracking-[0.5em] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                ← Back to Edit Details
              </button>

              <button
                type="button"
                disabled={resendCountdown > 0 || otpSending}
                onClick={handleResendOtp}
                className={`flex items-center cursor-pointer ${
                  resendCountdown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-indigo-600 dark:text-indigo-400 hover:underline'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${otpSending ? 'animate-spin' : ''}`} />
                {resendCountdown > 0 ? `Resend Code (${resendCountdown}s)` : 'Resend Code'}
              </button>
            </div>

            <button
              type="submit"
              disabled={otpVerifying}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black rounded-2xl text-xs tracking-wider shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transform active:scale-98 transition-all flex items-center justify-center cursor-pointer"
            >
              <span>{otpVerifying ? 'Verifying & Registering Shop...' : 'Verify Code & Complete Registration'}</span>
              <ShieldCheck className="w-4 h-4 ml-2" />
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-850">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            Already have a registered store?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In to Your Store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterStorePage;
