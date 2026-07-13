const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const InventoryLog = require('../models/InventoryLog');
const User = require('../models/User');

// @desc    Create a new Purchase Order
// @route   POST /api/purchase-orders
// @access  Public (Will be restricted by RBAC)
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, items } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Supplier ID and a list of items are required.' });
    }

    // 1. Verify Supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    // 2. Validate products and calculate total amount
    let totalAmount = 0;
    const poItems = [];

    for (const item of items) {
      const { productId, quantityOrdered, purchasePrice } = item;

      if (!productId || !quantityOrdered || quantityOrdered <= 0 || purchasePrice < 0) {
        return res.status(400).json({ error: 'Invalid product details, quantity, or price in PO.' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${productId} not found.` });
      }

      totalAmount += purchasePrice * quantityOrdered;

      poItems.push({
        productId,
        quantityOrdered,
        purchasePrice,
      });
    }

    // 3. Generate unique PO number: PO-YYYYMMDD-Random
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${dateStr}-${randomSuffix}`;

    // 4. Save Purchase Order
    const purchaseOrder = await PurchaseOrder.create({
      poNumber,
      supplierId,
      items: poItems,
      totalAmount,
      status: 'Ordered',
    });

    res.status(201).json(purchaseOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Purchase Orders
// @route   GET /api/purchase-orders
// @access  Public
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('supplierId', 'name contactPerson phone')
      .populate('items.productId', 'name sku category');
    res.status(200).json(purchaseOrders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Purchase Order by ID
// @route   GET /api/purchase-orders/:id
// @access  Public
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('supplierId', 'name contactPerson phone')
      .populate('items.productId', 'name sku category');

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    res.status(200).json(purchaseOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Purchase Order status (Receive or Cancel PO)
// @route   PUT /api/purchase-orders/:id/status
// @access  Public
exports.updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status, performedBy } = req.body;

    if (!status || !['Received', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Choose "Received" or "Cancelled".' });
    }

    if (!performedBy) {
      return res.status(400).json({ error: 'User reference (performedBy) is required to update PO status.' });
    }

    // 1. Verify User exists
    const user = await User.findById(performedBy);
    if (!user) {
      return res.status(404).json({ error: 'Performing user not found.' });
    }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    // 2. Validate current status is 'Ordered'
    if (purchaseOrder.status !== 'Ordered') {
      return res.status(400).json({
        error: `Cannot update a Purchase Order that is already marked as "${purchaseOrder.status}".`,
      });
    }

    // 3. Process status change
    if (status === 'Received') {
      // Loop through items and update stocks and write inventory logs
      for (const item of purchaseOrder.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          const prevStock = product.currentStock;
          const newStock = prevStock + item.quantityOrdered;

          // Update stock and update latest purchasePrice
          product.currentStock = newStock;
          product.purchasePrice = item.purchasePrice;
          await product.save();

          // Create Inventory Log
          await InventoryLog.create({
            productId: product._id,
            changeType: 'Purchase',
            quantityChanged: item.quantityOrdered,
            previousStock: prevStock,
            newStock: newStock,
            referenceId: purchaseOrder._id,
            performedBy: performedBy,
            notes: `Received PO: ${purchaseOrder.poNumber}`,
          });
        }
      }
      purchaseOrder.receivedDate = Date.now();
    }

    purchaseOrder.status = status;
    await purchaseOrder.save();

    const updatedPO = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('supplierId', 'name contactPerson phone')
      .populate('items.productId', 'name sku category');

    res.status(200).json(updatedPO);
  } catch (error) {
    next(error);
  }
};
