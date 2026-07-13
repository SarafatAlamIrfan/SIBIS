const User = require('../models/User');

// @desc    Register or Sync a user from Firebase to MongoDB
// @route   POST /api/users/sync
// @access  Public (Self signup / Initial bootstrap / Admin creation)
exports.syncUser = async (req, res, next) => {
  try {
    const { firebaseUid, name, email, role } = req.body;

    if (!firebaseUid || !name || !email) {
      return res.status(400).json({ error: 'firebaseUid, name, and email are required.' });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(200).json(user);
    }

    // Bootstrap check: If this is the very first user in the system, automatically assign the Owner role
    const totalUsers = await User.countDocuments();
    let assignedRole = role || 'Inventory Staff';

    if (totalUsers === 0) {
      assignedRole = 'Owner';
      console.log(`[Bootstrap] No users found. Auto-assigning "Owner" role to the first user: ${email}`);
    } else {
      // If it's not the first user, creating a user requires an authenticated user who is Owner or Manager
      // Unless they are self-registering as a basic role. For safety in a closed POS system, we restrict creation to Owners/Managers.
      // E.g. Owner/Manager creates employee accounts. Let's enforce that in the route.
    }

    user = await User.create({
      firebaseUid,
      name,
      email,
      role: assignedRole,
    });

    res.status(201).json(user);
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
