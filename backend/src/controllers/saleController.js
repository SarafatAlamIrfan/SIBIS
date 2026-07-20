const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

// @desc    Checkout a sale (process POS transaction)
// @route   POST /api/sales
// @access  Public (Will be protected by RBAC)
exports.checkoutSale = async (req, res, next) => {
  try {
    const { cashierId, items, paymentMethod, paymentStatus } = req.body;

    if (!cashierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cashier ID and a list of items are required.' });
    }

    // 1. Verify Cashier exists
    const cashier = await User.findById(cashierId);
    if (!cashier) {
      return res.status(404).json({ error: 'Cashier user not found.' });
    }

    // 2. Fetch and validate all products in the cart
    const validatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Invalid product details or quantity in cart.' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${productId} not found.` });
      }

      // Check stock levels
      if (product.currentStock < quantity) {
        return res.status(400).json({
          error: `Insufficient stock for product "${product.name}". Available: ${product.currentStock}, Requested: ${quantity}`,
        });
      }

      // Calculate total for this item
      const itemTotal = product.sellingPrice * quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: product._id,
        quantity,
        priceAtSale: product.sellingPrice,
        purchasePriceAtSale: product.purchasePrice,
        // Keep reference to the actual Mongoose document to update stock later
        productDoc: product,
      });
    }

    // 3. Generate unique invoice number: INV-YYYYMMDD-Random
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    // 4. Perform updates & logging
    const saleItems = validatedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      priceAtSale: item.priceAtSale,
      purchasePriceAtSale: item.purchasePriceAtSale,
    }));

    // Create the Sale
    const sale = await Sale.create({
      invoiceNumber,
      cashierId,
      storeId: cashier.storeId || req.user?.storeId,
      items: saleItems,
      totalAmount,
      paymentMethod,
      paymentStatus,
    });

const logActivity = require('../utils/activityLogger');

    // Update stocks and write Inventory Logs
    for (const item of validatedItems) {
      const product = item.productDoc;
      const prevStock = product.currentStock;
      const newStock = prevStock - item.quantity;

      // Update product stock in DB
      product.currentStock = newStock;
      await product.save();

      // Create Inventory Log
      await InventoryLog.create({
        productId: product._id,
        storeId: storeId || cashier.storeId,
        changeType: 'Sale',
        quantityChanged: -item.quantity,
        previousStock: prevStock,
        newStock: newStock,
        referenceId: sale._id,
        performedBy: cashierId,
        notes: `POS checkout: ${invoiceNumber}`,
      });
    }

    // Record Store Activity Log with member name & role
    await logActivity({
      storeId: storeId || cashier.storeId,
      user: req.user || cashier,
      actionCategory: 'POS Sale',
      actionDescription: `Processed POS Sale Invoice #${invoiceNumber} for ৳${totalAmount.toFixed(2)} (${validatedItems.length} items)`,
      details: { invoiceNumber, totalAmount, paymentMethod },
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sales transactions for the active store
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user && req.user.storeId && req.user.role !== 'System Admin') {
      filter.storeId = req.user.storeId;
    }

    const sales = await Sale.find(filter)
      .populate('cashierId', 'name email role')
      .populate('items.productId', 'name sku category')
      .sort({ createdAt: -1 });

    res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Public
exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashierId', 'name email role')
      .populate('items.productId', 'name sku category');
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale record not found' });
    }
    
    res.status(200).json(sale);
  } catch (error) {
    next(error);
  }
};
