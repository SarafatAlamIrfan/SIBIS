const express = require('express');
const router = express.Router();
const {
  syncUser,
  registerUser,
  registerStore,
  loginUser,
  getProfile,
  getUsers,
  updateUser,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/sync', syncUser);
router.post('/register', registerUser);
router.post('/register-store', registerStore);
router.post('/login', loginUser);

// Protected endpoints
router.use(protect);


router.get('/profile', getProfile);

// Owner/Manager only endpoints
router.route('/')
  .get(restrictTo('Owner', 'Manager'), getUsers);

router.route('/:id')
  .put(restrictTo('Owner', 'Manager'), updateUser);

module.exports = router;
