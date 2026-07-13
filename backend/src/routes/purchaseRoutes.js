const express = require('express');
const router = express.Router();
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
} = require('../controllers/purchaseController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// Owner/Manager only routes
router.use(restrictTo('Owner', 'Manager'));

router.route('/')
  .post(createPurchaseOrder)
  .get(getPurchaseOrders);

router.route('/:id')
  .get(getPurchaseOrderById);

router.route('/:id/status')
  .put(updatePurchaseOrderStatus);

module.exports = router;
