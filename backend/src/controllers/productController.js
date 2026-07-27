const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const InventoryLog = require('../models/InventoryLog');

// @desc    Create a new product
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      category,
      brand,
      supplierId,
      purchasePrice,
      sellingPrice,
      currentStock,
      minStockThreshold,
      expirationDate,
    } = req.body;

    // Check if supplier exists
    const supplierExists = await Supplier.findById(supplierId);
    if (!supplierExists) {
      return res.status(404).json({ error: 'Supplier not found. Product must have a valid supplier.' });
    }

    // Determine storeId
    const storeId = req.user?.storeId || req.body.storeId;
    if (!storeId) {
      return res.status(400).json({ error: 'Store reference is required to create a product.' });
    }

    const product = await Product.create({
      name,
      sku,
      description,
      category,
      brand,
      storeId,
      supplierId,
      purchasePrice,
      sellingPrice,
      currentStock,
      minStockThreshold,
      expirationDate,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    // System Admin has no store context — return empty list
    if (req.user && req.user.role === 'System Admin') {
      return res.status(200).json([]);
    }
    const filter = {};
    if (req.user && req.user.storeId) {
      filter.storeId = req.user.storeId;
    } else {
      // No storeId and not admin — reject to prevent data leak
      return res.status(403).json({ error: 'User is not assigned to any store.' });
    }
    const products = await Product.find(filter).populate('supplierId', 'name contactPerson phone');
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get products with low stock level
// @route   GET /api/products/low-stock
// @access  Public
exports.getLowStockProducts = async (req, res, next) => {
  try {
    // System Admin has no store context — no store notifications
    if (req.user && req.user.role === 'System Admin') {
      return res.status(200).json([]);
    }

    if (!req.user || !req.user.storeId) {
      return res.status(403).json({ error: 'User is not assigned to any store.' });
    }

    const filter = {
      storeId: req.user.storeId,
      $expr: { $lte: ['$currentStock', '$minStockThreshold'] },
    };

    const products = await Product.find(filter).populate('supplierId', 'name contactPerson phone');
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplierId', 'name contactPerson phone');
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Public
exports.updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      category,
      brand,
      supplierId,
      purchasePrice,
      sellingPrice,
      currentStock,
      minStockThreshold,
      expirationDate,
    } = req.body;

    if (supplierId) {
      const supplierExists = await Supplier.findById(supplierId);
      if (!supplierExists) {
        return res.status(442).json({ error: 'Invalid Supplier ID reference' });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        sku,
        description,
        category,
        brand,
        supplierId,
        purchasePrice,
        sellingPrice,
        currentStock,
        minStockThreshold,
        expirationDate,
      },
      { new: true, runValidators: true }
    ).populate('supplierId', 'name contactPerson phone');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Public
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully', product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory history log
// @route   GET /api/products/inventory-history
// @access  Private
exports.getInventoryHistory = async (req, res, next) => {
  try {
    // System Admin sees all inventory history across all stores
    const filter = {};
    if (req.user && req.user.role !== 'System Admin') {
      if (!req.user.storeId) {
        return res.status(403).json({ error: 'User is not assigned to any store.' });
      }
      filter.storeId = req.user.storeId;
    }
    const history = await InventoryLog.find(filter)
      .populate('productId', 'name sku category')
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get products expiring within 30 days
// @route   GET /api/products/expiring
// @access  Private
exports.getExpiringProducts = async (req, res, next) => {
  try {
    // System Admin has no store context — no store notifications
    if (req.user && req.user.role === 'System Admin') {
      return res.status(200).json([]);
    }

    if (!req.user || !req.user.storeId) {
      return res.status(403).json({ error: 'User is not assigned to any store.' });
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const filter = {
      storeId: req.user.storeId,
      expirationDate: {
        $exists: true,
        $ne: null,
        $lte: thirtyDaysFromNow
      }
    };

    const products = await Product.find(filter)
      .populate('supplierId', 'name contactPerson phone')
      .sort({ expirationDate: 1 });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Set or clear discount on a product
// @route   PUT /api/products/:id/discount
// @access  Private (Owner, Manager)
exports.setProductDiscount = async (req, res, next) => {
  try {
    const { discountType, discountValue, discountLabel, discountExpiry } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Store isolation
    if (req.user.role !== 'System Admin' && product.storeId?.toString() !== req.user.storeId?._id?.toString()) {
      return res.status(403).json({ error: 'Unauthorized to modify products from another store.' });
    }

    const validTypes = ['none', 'percentage', 'fixed'];
    if (!validTypes.includes(discountType)) {
      return res.status(400).json({ error: 'Invalid discount type. Use none, percentage, or fixed.' });
    }

    if (discountType !== 'none') {
      const val = parseFloat(discountValue);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json({ error: 'Discount value must be a positive number.' });
      }
      if (discountType === 'percentage' && val > 100) {
        return res.status(400).json({ error: 'Percentage discount cannot exceed 100%.' });
      }
      if (discountType === 'fixed' && val >= product.sellingPrice) {
        return res.status(400).json({ error: 'Fixed discount cannot be greater than or equal to the selling price.' });
      }
    }

    product.discountType = discountType;
    product.discountValue = discountType === 'none' ? 0 : parseFloat(discountValue);
    product.discountLabel = discountType === 'none' ? '' : (discountLabel || '').trim();
    product.discountExpiry = discountType === 'none' ? null : (discountExpiry ? new Date(discountExpiry) : null);

    await product.save();

    // Audit log
    const logActivity = require('../utils/activityLogger');
    const discountSummary = discountType === 'none'
      ? `discount removed from "${product.name}"`
      : `${discountType === 'percentage' ? discountValue + '%' : '৳' + discountValue} discount applied to "${product.name}"${discountLabel ? ` (${discountLabel})` : ''}`;

    await logActivity({
      storeId: product.storeId,
      user: req.user,
      actionCategory: 'Inventory Stock',
      actionDescription: `${req.user.name} ${discountSummary}`,
    });

    const updated = await Product.findById(product._id).populate('supplierId', 'name contactPerson phone');
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};
