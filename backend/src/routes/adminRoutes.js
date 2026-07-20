const express = require('express');
const router = express.Router();
const {
  getAllStores,
  createStore,
  toggleStoreStatus,
  getPlatformStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Route endpoints for System Admin store management
router.get('/stores', protect, getAllStores);
router.post('/stores', protect, createStore);
router.put('/stores/:id/status', protect, toggleStoreStatus);
router.get('/stats', protect, getPlatformStats);

module.exports = router;
