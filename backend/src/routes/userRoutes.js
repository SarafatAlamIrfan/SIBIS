const express = require('express');
const router = express.Router();

const {
  syncUser,
  registerUser,
  registerStore,
  checkEmail,
  sendVerificationOtp,
  verifyOtp,
  loginUser,
  getProfile,
  getStoreStaff,
  createStaff,
  toggleStaffStatus,
  deleteStaff,
  changePassword,
  updateProfile,
  getStoreActivity,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/sync', syncUser);
router.post('/register', registerUser);
router.post('/register-store', registerStore);
router.post('/check-email', checkEmail);
router.post('/send-verification-otp', sendVerificationOtp);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);

// Protected endpoints
router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.put('/change-password', changePassword);
router.get('/activity', restrictTo('System Admin', 'Owner', 'Manager'), getStoreActivity);

// Staff management endpoints (Store Owner & Manager)
router.route('/staff')
  .get(restrictTo('System Admin', 'Owner', 'Manager'), getStoreStaff)
  .post(restrictTo('System Admin', 'Owner', 'Manager'), createStaff);

router.route('/staff/:id/status')
  .put(restrictTo('System Admin', 'Owner'), toggleStaffStatus);

router.route('/staff/:id')
  .delete(restrictTo('System Admin', 'Owner'), deleteStaff);

module.exports = router;
