const express = require('express');
const router = express.Router();
const {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
} = require('../controllers/purchaseController');

router.route('/')
  .post(createPurchaseOrder)
  .get(getPurchaseOrders);

router.route('/:id')
  .get(getPurchaseOrderById);

router.route('/:id/status')
  .put(updatePurchaseOrderStatus);

module.exports = router;
