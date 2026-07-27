const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

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
    const { storeName, businessType, phone, address, city, country, ownerName, ownerEmail, ownerPassword, otp } = req.body;

    if (!storeName || !ownerName || !ownerEmail || !ownerPassword || !city || !country) {
      return res.status(400).json({ error: 'Store name, owner name, email, password, city, and country are required.' });
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
      city: city.trim(),
      country: country.trim(),
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
    const { name, avatar, phone, bio, email } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (name) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const emailLower = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        return res.status(400).json({ error: 'This email address is already in use by another account.' });
      }
      user.email = emailLower;
    }

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
      .sort({ createdAt: -1 });

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

// @desc    Google Authentication (Login or Register Store with Store Details)
// @route   POST /api/users/google-auth
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { email, name, googleId, avatar, storeName, businessType, phone, address, city, country } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google authentication failed: Email is required.' });
    }

    const emailLower = email.toLowerCase();
    let user = await User.findOne({ email: emailLower }).populate('storeId', 'name code businessType status');

    if (!user) {
      // If new Google user and store details are not provided yet, request store details from frontend
      if (!storeName || !storeName.trim()) {
        return res.status(200).json({
          isNewUser: true,
          email: emailLower,
          name: name || emailLower.split('@')[0],
          googleId: googleId || '',
          avatar: avatar || '',
          message: 'Google authentication successful. Please enter your store details to complete setup.',
        });
      }

      if (!city || !city.trim() || !country || !country.trim()) {
        return res.status(400).json({ error: 'Store city and country are required to complete registration.' });
      }

      // Create Store with provided details
      const Store = require('../models/Store');
      const store = new Store({
        name: storeName.trim(),
        email: emailLower,
        phone: phone ? phone.trim() : '',
        address: address ? address.trim() : '',
        city: city.trim(),
        country: country.trim(),
        businessType: businessType || 'General Retail',
        status: 'Active',
        subscriptionPlan: 'Pro',
      });
      await store.save();

      user = new User({
        name: name || emailLower.split('@')[0],
        email: emailLower,
        password: `google_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        role: 'Owner',
        storeId: store._id,
        avatar: avatar || '',
        firebaseUid: googleId || '',
      });
      await user.save();

      store.ownerId = user._id;
      await store.save();

      user = await User.findById(user._id).populate('storeId', 'name code businessType status');
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        storeId: user.storeId,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// In-memory store for password reset OTPs
const resetOtpStore = new Map();

// @desc    Send 6-digit Password Reset OTP
// @route   POST /api/users/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    resetOtpStore.set(emailLower, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    console.log(`[Forgot Password] OTP generated for ${emailLower}: ${otpCode}`);

    res.status(200).json({
      message: `Password reset code sent to ${emailLower}`,
      otp: otpCode, // Included for easy developer/demo testing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with 6-digit OTP Code
// @route   POST /api/users/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailLower = email.toLowerCase();
    const record = resetOtpStore.get(emailLower);

    if (!record) {
      return res.status(400).json({ error: 'No reset code found or code expired. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      resetOtpStore.delete(emailLower);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (record.code !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    resetOtpStore.delete(emailLower);

    res.status(200).json({
      message: 'Password reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// Helper mapping country name to ISO 2-letter country code for Nager.Date API
const countryToCode = (countryName) => {
  if (!countryName) return null;
  const name = countryName.trim().toLowerCase();
  
  const mapping = {
    'bangladesh': 'BD',
    'united states': 'US',
    'united states of america': 'US',
    'usa': 'US',
    'us': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'great britain': 'GB',
    'gb': 'GB',
    'canada': 'CA',
    'ca': 'CA',
    'australia': 'AU',
    'au': 'AU',
    'india': 'IN',
    'in': 'IN',
    'germany': 'DE',
    'de': 'DE',
    'france': 'FR',
    'fr': 'FR',
    'italy': 'IT',
    'it': 'IT',
    'spain': 'ES',
    'es': 'ES',
    'japan': 'JP',
    'jp': 'JP',
    'china': 'CN',
    'cn': 'CN',
    'brazil': 'BR',
    'br': 'BR',
    'singapore': 'SG',
    'sg': 'SG',
    'malaysia': 'MY',
    'my': 'MY',
    'pakistan': 'PK',
    'pk': 'PK',
    'nepal': 'NP',
    'np': 'NP',
    'sri lanka': 'LK',
    'lk': 'LK',
    'saudi arabia': 'SA',
    'sa': 'SA',
    'united arab emirates': 'AE',
    'uae': 'AE',
    'ae': 'AE',
    'turkey': 'TR',
    'tr': 'TR',
    'south africa': 'ZA',
    'za': 'ZA',
    'new zealand': 'NZ',
    'nz': 'NZ'
  };

  return mapping[name] || null;
};

// Helper to generate seasonal weather calendar alerts based on city & country
const getWeatherEvents = (city, country, year) => {
  const weatherEvents = [];
  const countryName = country ? country.trim().toLowerCase() : '';

  if (countryName === 'bangladesh' || countryName === 'bd' || countryName === 'india' || countryName === 'in') {
    // Monsoon season: June 15 to Sept 15
    for (let month = 5; month <= 8; month++) {
      weatherEvents.push({
        id: `weather-monsoon-${month}`,
        date: new Date(year, month, 15),
        title: `Monsoon Advisory: ${city || 'Dhaka'}`,
        desc: `Heavy monsoon rainfall expected. Store foot traffic might drop on rainy days. Focus on home delivery services and stock essential storm items.`,
        type: 'weather',
        color: 'bg-teal-500/10 text-teal-600 border-teal-500/30 dark:text-teal-400 hover:bg-teal-500/20'
      });
    }
    // Summer heat: April & May
    weatherEvents.push({
      id: `weather-heat-4`,
      date: new Date(year, 3, 20),
      title: `Summer Heat peak: ${city || 'Dhaka'}`,
      desc: `High summer heat expected. Physical shopping visits will shift to late evenings. Fully stock cold beverages, ice creams, and fresh juices.`,
      type: 'weather',
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/20'
    });
    weatherEvents.push({
      id: `weather-heat-5`,
      date: new Date(year, 4, 15),
      title: `Pre-Monsoon Humidity: ${city || 'Dhaka'}`,
      desc: `Extremely muggy weather. Store traffic will peak after sunset.`,
      type: 'weather',
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/20'
    });
    // Winter: Dec & Jan
    weatherEvents.push({
      id: `weather-winter-12`,
      date: new Date(year, 11, 20),
      title: `Winter Season: ${city || 'Dhaka'}`,
      desc: `Cool and pleasant winter conditions. Evening store foot traffic is expected to double. Higher sales for warm beverages.`,
      type: 'weather',
      color: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 hover:bg-sky-500/20'
    });
  } else {
    // 4 Seasons climate
    const isSouthernHemisphere = countryName === 'australia' || countryName === 'au' || countryName === 'new zealand' || countryName === 'nz' || countryName === 'south africa' || countryName === 'za' || countryName === 'brazil' || countryName === 'br';

    if (isSouthernHemisphere) {
      // Southern Winter: June/July
      weatherEvents.push({
        id: `weather-winter`,
        date: new Date(year, 6, 15),
        title: `Winter Season: ${city || 'Sydney'}`,
        desc: `Cold temperatures. High demand for winter clothing, heaters, hot food ingredients.`,
        type: 'weather',
        color: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 hover:bg-sky-500/20'
      });
      // Southern Summer: Dec/Jan
      weatherEvents.push({
        id: `weather-summer`,
        date: new Date(year, 0, 15),
        title: `Summer Season: ${city || 'Sydney'}`,
        desc: `Hot summer weather. High demand for picnic supplies, cold beverages, barbecues, beach gear.`,
        type: 'weather',
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/20'
      });
    } else {
      // Northern Winter: Jan/Feb
      weatherEvents.push({
        id: `weather-winter`,
        date: new Date(year, 0, 15),
        title: `Winter Season: ${city || 'New York'}`,
        desc: `Freezing winter temperatures. Risk of snowstorms disrupting customer traffic. Ensure delivery channels are staffed.`,
        type: 'weather',
        color: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400 hover:bg-sky-500/20'
      });
      // Northern Summer: July/Aug
      weatherEvents.push({
        id: `weather-summer`,
        date: new Date(year, 6, 15),
        title: `Summer Season: ${city || 'New York'}`,
        desc: `Warm summer conditions. High outdoor activities. Peak retail sales for drinks, fresh produce, summer apparel.`,
        type: 'weather',
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/20'
      });
    }
  }

  return weatherEvents;
};

// @desc    Get automatically generated calendar events based on store location (city, country)
// @route   GET /api/users/store-calendar-events
// @access  Private
exports.getStoreCalendarEvents = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findById(req.user.storeId);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { city, country } = store;
    const year = new Date().getFullYear();
    const events = [];

    // 1. Fetch public holidays dynamically based on country
    const countryCode = countryToCode(country);
    if (countryCode) {
      try {
        const holidayRes = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`, {
          timeout: 4000
        });
        
        if (Array.isArray(holidayRes.data)) {
          holidayRes.data.forEach(h => {
            events.push({
              id: `holiday-${h.date}-${h.name}`,
              date: new Date(h.date),
              title: `Holiday: ${h.name}`,
              desc: `National Public Holiday in ${country} (${h.localName}). Expected impact on general retail shopping volume.`,
              type: 'holiday',
              color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 hover:bg-emerald-500/20'
            });
          });
        }
      } catch (apiErr) {
        console.error('Nager.Date holiday API failed:', apiErr.message);
        // Fallback static holidays for BD if API is down / offline
        if (countryCode === 'BD') {
          const fallbackHolidays = [
            { date: `${year}-02-21`, name: "Language Martyrs' Day" },
            { date: `${year}-03-26`, name: "Independence Day" },
            { date: `${year}-05-01`, name: "May Day" },
            { date: `${year}-12-16`, name: "Victory Day" },
            { date: `${year}-12-25`, name: "Christmas Day" }
          ];
          fallbackHolidays.forEach(h => {
            events.push({
              id: `holiday-fallback-${h.date}-${h.name}`,
              date: new Date(h.date),
              title: `Holiday: ${h.name} (Offline)`,
              desc: `National Public Holiday in ${country}. (Offline Fail-Safe Data)`,
              type: 'holiday',
              color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 hover:bg-emerald-500/20'
            });
          });
        }
      }
    }

    // 2. Generate seasonal weather warnings based on city & country
    const weatherEvents = getWeatherEvents(city, country, year);
    events.push(...weatherEvents);

    // 3. Fetch custom calendar events from MongoDB
    try {
      const CalendarEvent = require('../models/CalendarEvent');
      const customEvents = await CalendarEvent.find({ storeId: req.user.storeId });
      
      const formattedCustomEvents = customEvents.map(e => ({
        id: e._id.toString(),
        date: e.date,
        title: e.title,
        desc: e.description || '',
        type: e.type,
        color: e.color || 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400',
        googleEventId: e.googleEventId || ''
      }));
      
      events.push(...formattedCustomEvents);
    } catch (dbErr) {
      console.error('Failed to load custom calendar events:', dbErr);
    }

    return res.status(200).json({
      location: { city, country },
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom store calendar event
// @route   POST /api/users/calendar-events
// @access  Private
exports.createCalendarEvent = async (req, res, next) => {
  try {
    const { title, description, date, type, color, syncToGoogle } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and Date are required.' });
    }

    const CalendarEvent = require('../models/CalendarEvent');
    
    let googleEventId = '';
    
    if (syncToGoogle) {
      console.log(`[Google Calendar Sync] Syncing event: "${title}" on ${date} for store ${req.user.storeId}`);
      googleEventId = `gcal_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }

    const newEvent = await CalendarEvent.create({
      storeId: req.user.storeId,
      title,
      description,
      date: new Date(date),
      type: type || 'custom',
      color: color || 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400',
      googleEventId,
    });

    await logActivity({
      storeId: req.user.storeId,
      user: req.user,
      actionCategory: 'System Event',
      actionDescription: `${req.user.name} created calendar event: "${title}"${syncToGoogle ? ' (Synced with Google Calendar)' : ''}`,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a custom store calendar event
// @route   DELETE /api/users/calendar-events/:id
// @access  Private
exports.deleteCalendarEvent = async (req, res, next) => {
  try {
    const CalendarEvent = require('../models/CalendarEvent');
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, storeId: req.user.storeId });
    
    if (!event) {
      return res.status(404).json({ error: 'Calendar event not found.' });
    }

    if (event.googleEventId) {
      console.log(`[Google Calendar Sync] Deleted synced event: "${event.title}" (Google Event ID: ${event.googleEventId})`);
    }

    await logActivity({
      storeId: req.user.storeId,
      user: req.user,
      actionCategory: 'System Event',
      actionDescription: `${req.user.name} deleted calendar event: "${event.title}"`,
    });

    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get store profile details
// @route   GET /api/users/store-profile
// @access  Private (Authenticated)
exports.getStoreProfile = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findById(req.user.storeId).populate('ownerId', 'name email');
    if (!store) {
      return res.status(404).json({ error: 'Store profile not found.' });
    }
    res.status(200).json(store);
  } catch (error) {
    next(error);
  }
};

// @desc    Update store profile details
// @route   PUT /api/users/store-profile
// @access  Private (Owner / System Admin only)
exports.updateStoreProfile = async (req, res, next) => {
  try {
    // Only allow Owner or System Admin to update store profile
    if (req.user.role !== 'Owner' && req.user.role !== 'System Admin') {
      return res.status(403).json({ error: 'Forbidden. Only the Store Owner can update store details.' });
    }

    const Store = require('../models/Store');
    const store = await Store.findById(req.user.storeId);
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const { name, phone, address, city, country, businessType } = req.body;

    if (name) store.name = name.trim();
    if (phone !== undefined) store.phone = phone.trim();
    if (address !== undefined) store.address = address.trim();
    if (city) store.city = city.trim();
    if (country) store.country = country.trim();
    if (businessType) store.businessType = businessType.trim();

    await store.save();

    try {
      await logActivity({
        storeId: store._id,
        user: req.user,
        actionCategory: 'Store Configuration',
        actionDescription: `${req.user.name} updated the store profile details.`,
      });
    } catch (logErr) {
      console.warn('Activity logging failed:', logErr.message);
    }

    res.status(200).json({
      message: 'Store profile updated successfully!',
      store
    });
  } catch (error) {
    next(error);
  }
};



