import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForGoogleAuthPopup',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sibis-bd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sibis-bd',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sibis-bd.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108800000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:108800000000:web:1234567890abcdef',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { auth, googleProvider, signInWithPopup };
