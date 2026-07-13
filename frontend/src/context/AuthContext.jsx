import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import API from '../services/api';

const AuthContext = createContext(null);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase configuration keys are provided
const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

let auth = null;
if (isFirebaseConfigured) {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  auth = getAuth();
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(!isFirebaseConfigured);

  // Sync user profile from MongoDB backend using the Firebase ID token or Mock headers
  const syncProfile = async () => {
    try {
      const response = await API.get('/users/profile');
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to sync user profile from backend:', error.message);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    if (!mockMode && auth) {
      // 1. Firebase Auth listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            localStorage.setItem('sibis_token', token);
            await syncProfile();
          } catch (err) {
            console.error('Firebase token retrieval error:', err);
            setCurrentUser(null);
          }
        } else {
          localStorage.removeItem('sibis_token');
          setCurrentUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // 2. Dev Mock mode listener
      const mockUid = localStorage.getItem('sibis_mock_uid');
      if (mockUid) {
        syncProfile().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [mockMode]);

  // Login handler supporting mock developer roles or real Firebase accounts
  const login = async (email, password, mockRole = 'Owner') => {
    if (!mockMode && auth) {
      // Real Firebase Login
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      // Mock Developer Login
      setLoading(true);
      const mockUid = `mock-uid-${email.replace(/[@.]/g, '-')}`;
      
      localStorage.setItem('sibis_mock_uid', mockUid);
      localStorage.setItem('sibis_mock_email', email);
      localStorage.setItem('sibis_mock_name', email.split('@')[0].toUpperCase());
      localStorage.setItem('sibis_mock_role', mockRole);

      try {
        // Sync user creation to MongoDB (via public /sync route)
        await API.post('/users/sync', {
          firebaseUid: mockUid,
          email,
          name: email.split('@')[0].toUpperCase(),
          role: mockRole,
        });
        await syncProfile();
      } catch (err) {
        console.error('Failed to sync mock user to database:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    }
  };

  // Logout handler
  const logout = async () => {
    if (!mockMode && auth) {
      await firebaseSignOut(auth);
      localStorage.removeItem('sibis_token');
    } else {
      localStorage.removeItem('sibis_mock_uid');
      localStorage.removeItem('sibis_mock_email');
      localStorage.removeItem('sibis_mock_name');
      localStorage.removeItem('sibis_mock_role');
    }
    setCurrentUser(null);
  };

  const toggleMockMode = (enable) => {
    if (enable && isFirebaseConfigured) {
      setMockMode(true);
      logout();
    } else if (!enable && isFirebaseConfigured) {
      setMockMode(false);
      logout();
    }
  };

  const value = {
    currentUser,
    loading,
    mockMode,
    isFirebaseConfigured,
    login,
    logout,
    toggleMockMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
