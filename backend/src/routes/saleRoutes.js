const express = require('express');
const router = express.Router();
const {
  checkoutSale,
  getSales,
  getSaleById,
} = require('../controllers/saleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
  .post(restrictTo('Owner', 'Manager', 'Cashier'), checkoutSale)
  .get(restrictTo('Owner', 'Manager', 'Cashier'), getSales);

router.route('/:id')
  .get(restrictTo('Owner', 'Manager', 'Cashier'), getSaleById);

module.exports = router;
