const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

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
    const filter = {};
    if (req.user && req.user.storeId) {
      filter.storeId = req.user.storeId;
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
    const filter = {
      $expr: { $lte: ['$currentStock', '$minStockThreshold'] },
    };
    if (req.user && req.user.storeId) {
      filter.storeId = req.user.storeId;
    }

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
