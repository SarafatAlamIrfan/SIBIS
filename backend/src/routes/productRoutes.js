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

router.route('/')
  .post(createProduct)
  .get(getProducts);

router.route('/low-stock')
  .get(getLowStockProducts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
