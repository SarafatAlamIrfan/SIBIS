const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-key-change-in-production', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// @desc    Register or Sync a user (adapted to support password hashing)
// @route   POST /api/users/sync
// @access  Public
exports.syncUser = async (req, res, next) => {
  try {
    const { firebaseUid, name, email, role, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    // Check if user already exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // For compatibility: sync firebaseUid if it changed and was provided
      let modified = false;
      if (firebaseUid && user.firebaseUid !== firebaseUid) {
        user.firebaseUid = firebaseUid;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
      return res.status(200).json(user);
    }

    // Bootstrap check: If this is the very first user in the system, automatically assign the Owner role
    const totalUsers = await User.countDocuments();
    let assignedRole = role || 'Inventory Staff';

    if (totalUsers === 0) {
      assignedRole = 'Owner';
      console.log(`[Bootstrap] No users found. Auto-assigning "Owner" role to the first user: ${email}`);
    }

    const defaultPassword = password || 'password123';

    user = await User.create({
      firebaseUid,
      name,
      email: email.toLowerCase(),
      role: assignedRole,
      password: defaultPassword,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const emailLower = email.toLowerCase();
    let userExists = await User.findOne({ email: emailLower });

    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Bootstrap check
    const totalUsers = await User.countDocuments();
    let assignedRole = role || 'Inventory Staff';

    if (totalUsers === 0) {
      assignedRole = 'Owner';
      console.log(`[Bootstrap] Auto-assigning "Owner" role to first user: ${emailLower}`);
    }

    const user = await User.create({
      name,
      email: emailLower,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Shop & Store Owner account
// @route   POST /api/users/register-store
// @access  Public
exports.registerStore = async (req, res, next) => {
  try {
    const { storeName, businessType, phone, address, ownerName, ownerEmail, ownerPassword } = req.body;

    if (!storeName || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ error: 'Store name, owner name, email, and password are required.' });
    }

    const emailLower = ownerEmail.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'An account already exists with this email address.' });
    }

    // 1. Create the Store record
    const Store = require('../models/Store');
    const store = new Store({
      name: storeName,
      email: emailLower,
      phone: phone || '',
      address: address || '',
      businessType: businessType || 'General Retail',
      status: 'Active',
      subscriptionPlan: 'Pro',
    });
    await store.save();

    // 2. Create the Owner user account
    const user = new User({
      name: ownerName,
      email: emailLower,
      password: ownerPassword,
      role: 'Owner',
      storeId: store._id,
    });
    await user.save();

    // Link ownerId to store
    store.ownerId = user._id;
    await store.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: {
          _id: store._id,
          name: store.name,
          code: store.code,
          businessType: store.businessType,
          status: store.status,
        },
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/users/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User profile has been deactivated.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    const populatedUser = await User.findById(user._id).populate('storeId', 'name code businessType status');

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: populatedUser.storeId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private (Authenticated)
exports.getProfile = async (req, res, next) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/users
// @access  Private (Owner, Manager only)
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile or role
// @route   PUT /api/users/:id
// @access  Private (Owner, Manager only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, role, isActive } = req.body;

    // Prevent changing your own role to prevent lockout
    if (req.user._id.toString() === req.params.id && role && role !== req.user.role) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role, isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

