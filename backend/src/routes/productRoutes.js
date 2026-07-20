const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.route('/low-stock')
  .get(getLowStockProducts);

router.route('/')
  .post(restrictTo('Owner', 'Manager', 'Inventory Staff'), createProduct)
  .get(getProducts);

router.route('/:id')
  .get(getProductById)
  .put(restrictTo('Owner', 'Manager', 'Inventory Staff'), updateProduct)
  .delete(restrictTo('Owner', 'Manager'), deleteProduct);

module.exports = router;
