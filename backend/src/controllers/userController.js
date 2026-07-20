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

// In-memory store for email verification OTP codes (expires in 10 mins)
const otpStore = new Map();

// @desc    Check email validity and availability
// @route   POST /api/users/check-email
// @access  Public
exports.checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.', available: false, valid: false });
    }

    const emailLower = email.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });

    if (existingUser) {
      return res.status(200).json({
        available: false,
        valid: true,
        message: 'This email address is already registered in SIBIS.',
      });
    }

    res.status(200).json({
      available: true,
      valid: true,
      message: 'Email address is valid and available.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send 6-digit Email Verification OTP
// @route   POST /api/users/send-verification-otp
// @access  Public
exports.sendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const emailLower = email.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'This email address is already registered.' });
    }

    // Generate 6-digit OTP (random 6 digits)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(emailLower, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      verified: false,
    });

    console.log(`[Email Verification] OTP generated for ${emailLower}: ${otpCode}`);

    res.status(200).json({
      message: `Verification code sent to ${emailLower}`,
      otp: otpCode, // Provided in response for easy developer / demo testing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit OTP Code
// @route   POST /api/users/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const emailLower = email.toLowerCase();
    const record = otpStore.get(emailLower);

    if (!record) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(emailLower);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (record.code !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Mark as verified
    otpStore.set(emailLower, { ...record, verified: true });

    res.status(200).json({
      verified: true,
      message: 'Email address verified successfully!',
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
    const { storeName, businessType, phone, address, ownerName, ownerEmail, ownerPassword, otp } = req.body;

    if (!storeName || !ownerName || !ownerEmail || !ownerPassword) {
      return res.status(400).json({ error: 'Store name, owner name, email, and password are required.' });
    }

    const emailLower = ownerEmail.toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: 'An account already exists with this email address.' });
    }

    // Verify OTP if provided or checked in otpStore
    const otpRecord = otpStore.get(emailLower);
    if (otp) {
      if (!otpRecord || otpRecord.code !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid email verification code.' });
      }
    } else if (otpRecord && !otpRecord.verified) {
      return res.status(400).json({ error: 'Please verify your email address before registering.' });
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

    // Clean up OTP store
    otpStore.delete(emailLower);

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

    const emailLower = email.toLowerCase();
    // Search all user accounts registered with this email address
    const candidateUsers = await User.find({ email: emailLower }).select('+password');

    if (!candidateUsers || candidateUsers.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let user = null;
    for (const candidate of candidateUsers) {
      if (candidate.isActive) {
        const isMatch = await candidate.matchPassword(password);
        if (isMatch) {
          user = candidate;
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password or account deactivated.' });
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

// @desc    Get all staff members for the current store
// @route   GET /api/users/staff
// @access  Private (Owner, Manager only)
exports.getStoreStaff = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'System Admin') {
      filter.storeId = req.user.storeId;
    }
    const staffList = await User.find(filter).populate('storeId', 'name code');
    res.status(200).json(staffList);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Manager, Cashier, or Inventory Staff member for store
// @route   POST /api/users/staff
// @access  Private (Owner, Manager only)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, role, email, password } = req.body;

    if (!name || !role || !password) {
      return res.status(400).json({ error: 'Name, role, and password are required for new staff.' });
    }

    const validRoles = ['Manager', 'Cashier', 'Inventory Staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Default to store owner's email if not specified
    const staffEmail = email ? email.toLowerCase().trim() : req.user.email.toLowerCase();
    const storeId = req.user.storeId;

    if (!storeId && req.user.role !== 'System Admin') {
      return res.status(400).json({ error: 'Your account is not linked to a store.' });
    }

    const newStaff = new User({
      name,
      email: staffEmail,
      password,
      role,
      storeId: storeId || req.body.storeId,
    });

    await newStaff.save();

    await logActivity({
      storeId: storeId || req.body.storeId,
      user: req.user,
      actionCategory: 'Staff Management',
      actionDescription: `Created new ${role} account for "${name}" (${staffEmail})`,
      details: { staffName: name, role, email: staffEmail },
    });

    res.status(201).json({
      message: `${role} account created successfully!`,
      staff: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        isActive: newStaff.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle active/inactive status of a staff member
// @route   PUT /api/users/staff/:id/status
// @access  Private (Owner only)
exports.toggleStaffStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const staffUser = await User.findById(req.params.id);

    if (!staffUser) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (req.user.role !== 'System Admin' && staffUser.storeId?.toString() !== req.user.storeId?._id?.toString()) {
      return res.status(403).json({ error: 'Unauthorized to modify staff of another store.' });
    }

    staffUser.isActive = typeof isActive === 'boolean' ? isActive : !staffUser.isActive;
    await staffUser.save();

    res.status(200).json(staffUser);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a staff member account
// @route   DELETE /api/users/staff/:id
// @access  Private (Owner only)
exports.deleteStaff = async (req, res, next) => {
  try {
    const staffUser = await User.findById(req.params.id);

    if (!staffUser) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (staffUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot delete your own owner account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await logActivity({
      storeId: staffUser.storeId,
      user: req.user,
      actionCategory: 'Staff Management',
      actionDescription: `Removed staff member account "${staffUser.name}" (${staffUser.role})`,
    });

    res.status(200).json({ message: 'Staff member account deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change current logged-in user password
// @route   PUT /api/users/change-password
// @access  Private (All authenticated staff & owners)
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      storeId: user.storeId,
      user,
      actionCategory: 'Staff Management',
      actionDescription: `${user.name} (${user.role}) changed their account password.`,
    });

    res.status(200).json({ message: 'Password updated successfully!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current logged-in user profile (name, avatar, phone, bio)
// @route   PUT /api/users/profile
// @access  Private (Authenticated)
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, phone, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();

    await user.save();

    const populatedUser = await User.findById(user._id).populate('storeId', 'name code businessType status');

    await logActivity({
      storeId: user.storeId,
      user,
      actionCategory: 'Staff Management',
      actionDescription: `${user.name} (${user.role}) updated their profile details`,
    });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      bio: user.bio,
      storeId: populatedUser.storeId,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get store activity audit logs
// @route   GET /api/users/activity
// @access  Private (Owner, Manager, System Admin)
exports.getStoreActivity = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'System Admin') {
      filter.storeId = req.user.storeId;
    }

    const ActivityLog = require('../models/ActivityLog');
    const activities = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(300);

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

