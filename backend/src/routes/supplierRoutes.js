const express = require('express');
const router = express.Router();
const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');

router.route('/')
  .post(createSupplier)
  .get(getSuppliers);

router.route('/:id')
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

module.exports = router;
