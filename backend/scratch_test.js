const mongoose = require('mongoose');
const User = require('./src/models/User');
const Supplier = require('./src/models/Supplier');
const Product = require('./src/models/Product');
const Sale = require('./src/models/Sale');
const PurchaseOrder = require('./src/models/PurchaseOrder');
const InventoryLog = require('./src/models/InventoryLog');

async function runValidationTests() {
  console.log('Starting Mongoose Schema Validation Tests...');
  
  try {
    // 1. Test User Schema
    const user = new User({
      firebaseUid: 'fb-user-123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'Cashier'
    });
    await user.validate();
    console.log('✅ User schema validation passed.');

    // 2. Test Supplier Schema
    const supplierId = new mongoose.Types.ObjectId();
    const supplier = new Supplier({
      _id: supplierId,
      name: 'Acme Supplies Ltd.',
      phone: '+1234567890',
      email: 'contact@acme.com',
      address: '123 Supply St, City',
      status: 'Active'
    });
    await supplier.validate();
    console.log('✅ Supplier schema validation passed.');

    // 3. Test Product Schema
    const productId = new mongoose.Types.ObjectId();
    const product = new Product({
      _id: productId,
      name: 'Organic Rice 5kg',
      sku: 'RICE-ORG-005',
      category: 'Groceries',
      supplierId: supplierId,
      purchasePrice: 12.50,
      sellingPrice: 15.99,
      currentStock: 100,
      minStockThreshold: 15
    });
    await product.validate();
    console.log('✅ Product schema validation passed.');

    // 4. Test Sale Schema
    const cashierId = new mongoose.Types.ObjectId();
    const sale = new Sale({
      invoiceNumber: 'INV-20260713-0001',
      cashierId: cashierId,
      items: [
        {
          productId: productId,
          quantity: 2,
          priceAtSale: 15.99,
          purchasePriceAtSale: 12.50
        }
      ],
      totalAmount: 31.98,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid'
    });
    await sale.validate();
    console.log('✅ Sale schema validation passed.');

    // 5. Test PurchaseOrder Schema
    const purchaseOrder = new PurchaseOrder({
      poNumber: 'PO-20260713-0001',
      supplierId: supplierId,
      items: [
        {
          productId: productId,
          quantityOrdered: 50,
          purchasePrice: 12.00
        }
      ],
      totalAmount: 600.00,
      status: 'Ordered'
    });
    await purchaseOrder.validate();
    console.log('✅ PurchaseOrder schema validation passed.');

    // 6. Test InventoryLog Schema
    const inventoryLog = new InventoryLog({
      productId: productId,
      changeType: 'Sale',
      quantityChanged: -2,
      previousStock: 100,
      newStock: 98,
      referenceId: new mongoose.Types.ObjectId(),
      performedBy: cashierId,
      notes: 'POS Sale transaction'
    });
    await inventoryLog.validate();
    console.log('✅ InventoryLog schema validation passed.');

    console.log('\n🎉 All schema validation tests successfully passed! 🎉');
  } catch (error) {
    console.error('❌ Validation Test Failed:', error);
    process.exit(1);
  }
}

runValidationTests();
