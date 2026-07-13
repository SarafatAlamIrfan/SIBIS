const express = require('express');
const router = express.Router();
const {
  syncUser,
  getProfile,
  getUsers,
  updateUser,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/sync', syncUser);

// Protected endpoints
router.use(protect);

router.get('/profile', getProfile);

// Owner/Manager only endpoints
router.route('/')
  .get(restrictTo('Owner', 'Manager'), getUsers);

router.route('/:id')
  .put(restrictTo('Owner', 'Manager'), updateUser);

module.exports = router;
