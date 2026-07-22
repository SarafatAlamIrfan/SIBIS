const Supplier = require('../models/Supplier');

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Public (Will be protected by RBAC in future)
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Supplier name and phone are required' });
    }

    // Determine storeId
    const storeId = req.user?.storeId || req.body.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store reference is required to create a supplier.' });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      storeId,
    });

    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Public
exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json(suppliers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Public
exports.getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Public
exports.updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, status } = req.body;

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { name, contactPerson, phone, email, address, status },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a supplier (soft delete / deactivate)
// @route   DELETE /api/suppliers/:id
// @access  Public
exports.deleteSupplier = async (req, res, next) => {
  try {
    // Soft delete/deactivate supplier to keep historical data intact
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { status: 'Inactive' },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.status(200).json({ message: 'Supplier deactivated successfully', supplier });
  } catch (error) {
    next(error);
  }
};
