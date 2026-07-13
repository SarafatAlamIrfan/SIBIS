const { admin, isInitialized } = require('../config/firebase');
const User = require('../models/User');

// Middleware to protect routes & authenticate user via Firebase (with development mock fallback)
exports.protect = async (req, res, next) => {
  try {
    let token;
    let firebaseUid;
    let mockEmail;
    let mockName;

    // Check for authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (isInitialized) {
      if (!token) {
        return res.status(401).json({ error: 'Authentication token is required.' });
      }
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired authentication token.', details: err.message });
      }
    } else {
      // Firebase not initialized - fallback to Mock Auth in local development
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ error: 'Firebase Auth service is not initialized in production.' });
      }

      firebaseUid = req.headers['x-mock-uid'];
      mockEmail = req.headers['x-mock-email'] || 'dev.user@sibis.com';
      mockName = req.headers['x-mock-name'] || 'Dev User';

      if (!firebaseUid) {
        return res.status(401).json({
          error: 'Authentication failed. Firebase Admin SDK is offline and no mock header ("x-mock-uid") was provided.',
        });
      }
    }

    // Look up the user in MongoDB
    let user = await User.findOne({ firebaseUid });

    // If Firebase is offline, auto-create mock user in DB if requested
    if (!user && !isInitialized && process.env.NODE_ENV !== 'production') {
      const mockRole = req.headers['x-mock-role'] || 'Owner';
      user = await User.create({
        firebaseUid,
        email: mockEmail,
        name: mockName,
        role: mockRole,
      });
      console.log(`[Dev Mode] Auto-created mock user in DB: ${user.name} (${user.role})`);
    }

    if (!user) {
      return res.status(401).json({ error: 'Authorized token verified, but user profile was not found in SIBIS database.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User profile has been deactivated.' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to restrict endpoint access based on roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const currentRole = req.user ? req.user.role : 'None';
      return res.status(403).json({
        error: `Forbidden. Your role "${currentRole}" does not have permissions to perform this action.`,
      });
    }
    next();
  };
};
