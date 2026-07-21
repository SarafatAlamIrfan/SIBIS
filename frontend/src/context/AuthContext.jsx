import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockMode] = useState(true); // Keep developer options enabled locally

  // Sync user profile from MongoDB backend using the local storage JWT
  const loadProfile = async () => {
    try {
      const response = await API.get('/users/profile');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to load user profile from backend:', error.message);
      localStorage.removeItem('sibis_token');
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('sibis_token');
    if (token) {
      loadProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login handler supporting standard email/password authentication
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await API.post('/users/login', {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('sibis_token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Failed to log in:', err.response?.data?.error || err.message);
      throw new Error(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Register New Shop Store & Owner handler
  const registerStore = async (storeData) => {
    setLoading(true);
    try {
      const response = await API.post('/users/register-store', storeData);
      const { token, user } = response.data;
      localStorage.setItem('sibis_token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Failed to register store:', err.response?.data?.error || err.message);
      throw new Error(err.response?.data?.error || 'Store registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Update User Profile (Name, Avatar, Phone, Bio)
  const updateUserProfile = async (profileData) => {
    try {
      const response = await API.put('/users/profile', profileData);
      setCurrentUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to update profile:', err.response?.data?.error || err.message);
      throw new Error(err.response?.data?.error || 'Profile update failed.');
    }
  };

  // Google Login / Registration Handler
  const loginWithGoogle = async (googleUserData) => {
    setLoading(true);
    try {
      const response = await API.post('/users/google-auth', googleUserData);
      const { token, user } = response.data;
      localStorage.setItem('sibis_token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Failed Google authentication:', err.response?.data?.error || err.message);
      throw new Error(err.response?.data?.error || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Send Password Reset OTP
  const sendForgotPasswordOtp = async (email) => {
    try {
      const response = await API.post('/users/forgot-password', { email });
      return response.data;
    } catch (err) {
      console.error('Failed to send reset code:', err.response?.data?.error || err.message);
      throw new Error(err.response?.data?.error || 'Failed to send password reset code.');
    }
  };

  // Reset Password with OTP Code
  const resetPasswordWithOtp = async ({ email, otp, newPassword }) => {
    try {
      const response = await API.post('/users/reset-password', { email, otp, newPassword });
      return response.data;
    } catch (err) {
      console.error('Failed to reset password:', err.response?.data?.error || err.message);
      throw new Error(err.response?.data?.error || 'Password reset failed.');
    }
  };

  // Logout handler
  const logout = async () => {
    localStorage.removeItem('sibis_token');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    mockMode,
    isFirebaseConfigured: false,
    login,
    registerStore,
    loginWithGoogle,
    sendForgotPasswordOtp,
    resetPasswordWithOtp,
    updateUserProfile,
    logout,
    toggleMockMode: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

