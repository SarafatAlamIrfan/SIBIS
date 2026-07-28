import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { auth, googleProvider, signInWithRedirect, getRedirectResult } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockMode] = useState(import.meta.env.DEV); // Only true during local vite dev server, false in production
  const [googleRedirectUser, setGoogleRedirectUser] = useState(null);
  const [redirectError, setRedirectError] = useState(null);

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
    const initializeAuth = async () => {
      let hasLoggedInFromRedirect = false;
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const firebaseUser = result.user;
          const googleUserData = {
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            googleId: firebaseUser.uid,
            avatar: firebaseUser.photoURL || '',
          };

          const response = await API.post('/users/google-auth', googleUserData);
          if (response.data?.isNewUser) {
            setGoogleRedirectUser({
              email: response.data.email,
              name: response.data.name,
              googleId: response.data.googleId,
              avatar: response.data.avatar,
            });
          } else {
            const { token, user } = response.data;
            if (token) {
              localStorage.setItem('sibis_token', token);
              setCurrentUser(user);
              hasLoggedInFromRedirect = true;
            }
          }
        }
      } catch (err) {
        console.error('Failed to handle Google redirect sign-in:', err);
        setRedirectError(err.message || 'Google redirect authentication failed.');
      }

      if (!hasLoggedInFromRedirect) {
        const token = localStorage.getItem('sibis_token');
        if (token) {
          try {
            await loadProfile();
          } catch (err) {
            console.error('Failed to load profile on mount:', err);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
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

  // Google Login / Registration Handler (Triggers Google Auth Redirect)
  const loginWithGoogle = async (manualUserData = null) => {
    setLoading(true);
    try {
      let googleUserData = manualUserData;

      if (!googleUserData) {
        try {
          await signInWithRedirect(auth, googleProvider);
          // Page redirects, execution halts here.
          return;
        } catch (redirectErr) {
          console.warn('Firebase redirect error:', redirectErr.code, redirectErr.message);
          if (
            redirectErr.code === 'auth/api-key-not-valid' ||
            redirectErr.code === 'auth/invalid-api-key' ||
            redirectErr.message?.includes('api-key-not-valid')
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
            throw new Error(redirectErr.message || 'Google Redirect Sign-in failed.');
          }
        }
      }

      const response = await API.post('/users/google-auth', googleUserData);
      if (response.data?.isNewUser) {
        return response.data;
      }

      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('sibis_token', token);
        setCurrentUser(user);
      }
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

  const clearGoogleRedirectUser = () => {
    setGoogleRedirectUser(null);
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
    googleRedirectUser,
    clearGoogleRedirectUser,
    redirectError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

