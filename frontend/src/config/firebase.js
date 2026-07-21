import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBjgtfCkpbeq5Dq0tQQkIPwAw5Rw4cSZrs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sibis-bd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sibis-bd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sibis-bd.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '762879897283',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:762879897283:web:0a34bee070c167bef93c76',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-C08XFJLSL6',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, googleProvider, signInWithPopup };
