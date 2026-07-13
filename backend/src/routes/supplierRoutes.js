const express = require('express');
const router = express.Router();
const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/')
  .post(restrictTo('Owner', 'Manager'), createSupplier)
  .get(getSuppliers);

router.route('/:id')
  .get(getSupplierById)
  .put(restrictTo('Owner', 'Manager'), updateSupplier)
  .delete(restrictTo('Owner', 'Manager'), deleteSupplier);

module.exports = router;
