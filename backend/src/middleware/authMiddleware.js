const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes & authenticate user via JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication token is required.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-in-production');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token.', details: err.message });
    }

    // Look up the user in MongoDB
    const user = await User.findById(decoded.id).populate('storeId', 'name code businessType status');

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

