import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, HelpCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mockRole, setMockRole] = useState('Owner');
  const [error, setError] = useState('');
  const { login, mockMode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || (!mockMode && !password)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await login(email, password, mockRole);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-600">
            <Key className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Sign in to SIBIS
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Smart Inventory & Business Insight System
          </p>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email-address" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-800 placeholder-slate-500 text-white bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={mockMode ? 'e.g. owner@sibis.com' : 'you@example.com'}
              />
            </div>
            {!mockMode && (
              <div>
                <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-800 placeholder-slate-500 text-white bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            )}

            {mockMode && (
              <div>
                <label htmlFor="mock-role" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Choose Mock User Role
                </label>
                <select
                  id="mock-role"
                  value={mockRole}
                  onChange={(e) => setMockRole(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-800 text-white bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Owner">Owner (Full Admin Access)</option>
                  <option value="Manager">Manager (Billing, Stock, Suppliers)</option>
                  <option value="Cashier">Cashier (POS Checkout only)</option>
                  <option value="Inventory Staff">Inventory Staff (Products & Stock only)</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <LogIn className="h-5 w-5 mr-2 text-indigo-200 group-hover:text-white" />
              {mockMode ? 'Sign In (Mock Mode)' : 'Sign In'}
            </button>
          </div>
        </form>

        {mockMode && (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-start space-x-2">
            <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-200 mb-1">Developer Mode Active</p>
              <p>Firebase client configurations are not detected. Login with any mock email. Select a role above to test permissions and routing restrictions immediately.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
