const admin = require('firebase-admin');

let firebaseApp = null;
let isInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isInitialized = true;
    console.log('Firebase Admin SDK initialized successfully via inline service account env.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin via process.env.FIREBASE_SERVICE_ACCOUNT:', error.message);
  }
} else if (process.env.FIREBASE_CREDENTIALS_PATH) {
  try {
    const serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isInitialized = true;
    console.log(`Firebase Admin SDK initialized via credential file path: ${process.env.FIREBASE_CREDENTIALS_PATH}`);
  } catch (error) {
    console.error(`Failed to load Firebase credentials from path ${process.env.FIREBASE_CREDENTIALS_PATH}:`, error.message);
  }
} else {
  console.warn('⚠️  Firebase credentials not found. Backend will fall back to mock authentication headers for local development.');
}

module.exports = {
  admin,
  firebaseApp,
  isInitialized,
};
