const express = require('express');
const router = express.Router();
const {
  getAllStores,
  createStore,
  toggleStoreStatus,
  getPlatformStats,
  getPlatformLogs,
  getStaffLogs,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Route endpoints for System Admin store management
router.get('/stores', protect, getAllStores);
router.post('/stores', protect, createStore);
router.put('/stores/:id/status', protect, toggleStoreStatus);
router.get('/stats', protect, getPlatformStats);

// Platform activity log — System Admin only
router.get('/platform-logs', protect, restrictTo('System Admin'), getPlatformLogs);

// Staff create/delete logs across all stores — System Admin only
router.get('/staff-logs', protect, restrictTo('System Admin'), getStaffLogs);

module.exports = router;
