import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { auth, googleProvider, signInWithPopup } from '../config/firebase';

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

  // Google Login / Registration Handler (Triggers Google Auth Popup)
  const loginWithGoogle = async (manualUserData = null) => {
    setLoading(true);
    try {
      let googleUserData = manualUserData;

      if (!googleUserData) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;
          googleUserData = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            googleId: firebaseUser.uid,
            avatar: firebaseUser.photoURL || '',
          };
        } catch (popupErr) {
          console.warn('Firebase popup error:', popupErr.code, popupErr.message);
          if (popupErr.code === 'auth/popup-closed-by-user') {
            throw new Error('Google Sign-In popup was closed before completing.');
          }
          if (popupErr.code === 'auth/unauthorized-domain') {
            throw new Error('Please add sibis-bd.netlify.app to Firebase Console > Authentication > Settings > Authorized domains.');
          }
          if (
            popupErr.code === 'auth/api-key-not-valid' ||
            popupErr.code === 'auth/invalid-api-key' ||
            popupErr.message?.includes('api-key-not-valid')
          ) {
            // Prompt fallback for instant testing when real Firebase API Key is not set in Netlify env
            const emailInput = prompt(
              '⚠️ Firebase API Key is not configured in Netlify environment.\n\nTo test Google Sign-in immediately, enter your Google email:',
              'owner@gmail.com'
            );
            if (!emailInput) {
              throw new Error('Google authentication cancelled.');
            }
            const formattedName = emailInput.split('@')[0].replace(/[._]/g, ' ');
            const name = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
            googleUserData = {
              email: emailInput.toLowerCase().trim(),
              name,
              googleId: `google_${Date.now()}`,
              avatar: '',
            };
          } else {
            throw new Error(popupErr.message || 'Google Popup Sign-in failed.');
          }
        }
      }

      const response = await API.post('/users/google-auth', googleUserData);
      const { token, user } = response.data;
      localStorage.setItem('sibis_token', token);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Failed Google authentication:', err.message);
      throw new Error(err.message || 'Google authentication failed.');
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

