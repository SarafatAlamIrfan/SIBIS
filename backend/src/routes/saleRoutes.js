const express = require('express');
const router = express.Router();
const {
  checkoutSale,
  getSales,
  getSaleById,
} = require('../controllers/saleController');

router.route('/')
  .post(checkoutSale)
  .get(getSales);

router.route('/:id')
  .get(getSaleById);

module.exports = router;
