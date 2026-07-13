require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');
const User = require('./src/models/User');
const InventoryLog = require('./src/models/InventoryLog');

const PORT = 5001;
let server;

// Helper to make HTTP requests
const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('Starting SIBIS API Integration Tests...');

  // 1. Check MongoDB connectivity first
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sibis';
  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('✅ Connected to MongoDB successfully.');
  } catch (err) {
    console.warn('\n⚠️  Could not connect to MongoDB. Skipping full DB integration tests.');
    console.warn('Reason:', err.message);
    console.warn('Ensure MongoDB is installed and running locally to execute full database operations.\n');
    process.exit(0);
  }

  // 2. Start temporary API server
  server = app.listen(PORT, async () => {
    console.log(`Test server listening on port ${PORT}\n`);

    try {
      // Clear out test collections before starting
      await mongoose.connection.db.dropDatabase();

      // Test A: Health endpoint
      console.log('Test 1: GET /health');
      const healthRes = await makeRequest('GET', '/health');
      if (healthRes.status !== 200 || healthRes.body.status !== 'UP') {
        throw new Error(`Health check failed: ${JSON.stringify(healthRes)}`);
      }
      console.log('✅ Health check passed.\n');

      // Test B: Create Supplier
      console.log('Test 2: POST /api/suppliers (Create Supplier)');
      const supplierData = {
        name: 'Superb Wholesale Distributors',
        contactPerson: 'Alice Smith',
        phone: '555-0199',
        email: 'alice@superbwholesale.com',
        address: '789 Logistics Blvd, Suite A',
      };
      const createSupplierRes = await makeRequest('POST', '/api/suppliers', supplierData);
      if (createSupplierRes.status !== 201 || !createSupplierRes.body._id) {
        throw new Error(`Failed to create supplier: ${JSON.stringify(createSupplierRes)}`);
      }
      const supplierId = createSupplierRes.body._id;
      console.log(`✅ Supplier created (ID: ${supplierId}).\n`);

      // Test C: Create Product
      console.log('Test 3: POST /api/products (Create Product)');
      const productData = {
        name: 'Premium Jasmine Rice 5kg',
        sku: 'JR-5KG-01',
        category: 'Grains',
        brand: 'Golden Harvest',
        supplierId: supplierId,
        purchasePrice: 10.00,
        sellingPrice: 14.50,
        currentStock: 5,           // Set to 5 so it triggers low stock (min threshold default is 10)
        minStockThreshold: 10,
      };
      const createProductRes = await makeRequest('POST', '/api/products', productData);
      if (createProductRes.status !== 201 || !createProductRes.body._id) {
        throw new Error(`Failed to create product: ${JSON.stringify(createProductRes)}`);
      }
      const productId = createProductRes.body._id;
      console.log(`✅ Product created (ID: ${productId}).\n`);

      // Test D: Get Products
      console.log('Test 4: GET /api/products (List all products)');
      const listProductsRes = await makeRequest('GET', '/api/products');
      if (listProductsRes.status !== 200 || !Array.isArray(listProductsRes.body) || listProductsRes.body.length !== 1) {
        throw new Error(`Failed to fetch product list: ${JSON.stringify(listProductsRes)}`);
      }
      if (!listProductsRes.body[0].supplierId || listProductsRes.body[0].supplierId.name !== supplierData.name) {
        throw new Error('Mongoose populate for supplierId failed.');
      }
      console.log('✅ Product listing and Supplier population verified.\n');

      // Test E: Low Stock Products query
      console.log('Test 5: GET /api/products/low-stock (Query threshold levels)');
      const lowStockRes = await makeRequest('GET', '/api/products/low-stock');
      if (lowStockRes.status !== 200 || !Array.isArray(lowStockRes.body) || lowStockRes.body.length !== 1) {
        throw new Error(`Failed to fetch low-stock list: ${JSON.stringify(lowStockRes)}`);
      }
      console.log('✅ Low stock detection query verified.\n');

      // Test F: Update Product Stock
      console.log('Test 6: PUT /api/products/:id (Update product details)');
      const updatedRes = await makeRequest('PUT', `/api/products/${productId}`, {
        currentStock: 25, // Refill stock, should no longer be low stock
      });
      if (updatedRes.status !== 200 || updatedRes.body.currentStock !== 25) {
        throw new Error(`Failed to update product: ${JSON.stringify(updatedRes)}`);
      }
      console.log('✅ Product update verified. Re-checking low stock list...');
      const lowStockAfterRes = await makeRequest('GET', '/api/products/low-stock');
      if (lowStockAfterRes.status !== 200 || lowStockAfterRes.body.length !== 0) {
        throw new Error(`Product should have been removed from low stock list: ${JSON.stringify(lowStockAfterRes)}`);
      }
      console.log('✅ Product stock refill successfully removed it from low-stock list.\n');

      // Test G: POS Checkout (Valid transaction)
      console.log('Test 7: POST /api/sales (POS Checkout - Valid transaction)');
      
      // Create a cashier user
      const cashier = await User.create({
        firebaseUid: 'cashier-fb-uid-99',
        name: 'Jane Smith Cashier',
        email: 'jane.cashier@sibis.com',
        role: 'Cashier',
      });
      const cashierId = cashier._id;

      const salePayload = {
        cashierId: cashierId,
        items: [
          {
            productId: productId,
            quantity: 5,
          }
        ],
        paymentMethod: 'Cash',
        paymentStatus: 'Paid',
      };
      
      const createSaleRes = await makeRequest('POST', '/api/sales', salePayload);
      if (createSaleRes.status !== 201 || !createSaleRes.body._id) {
        throw new Error(`Failed to checkout sale: ${JSON.stringify(createSaleRes)}`);
      }
      const saleId = createSaleRes.body._id;
      console.log(`✅ POS checkout completed successfully (Sale ID: ${saleId}).`);

      // Verify product stock decremented
      const checkProductRes = await makeRequest('GET', `/api/products/${productId}`);
      if (checkProductRes.status !== 200 || checkProductRes.body.currentStock !== 20) {
        throw new Error(`Product stock did not decrement correctly: ${JSON.stringify(checkProductRes)}`);
      }
      console.log('✅ Product stock level successfully decremented to 20.');

      // Verify InventoryLog created
      const logs = await InventoryLog.find({ referenceId: saleId });
      if (logs.length !== 1 || logs[0].quantityChanged !== -5) {
        throw new Error(`InventoryLog not recorded correctly: ${JSON.stringify(logs)}`);
      }
      console.log('✅ Inventory log audit entry verified.\n');

      // Test H: POS Checkout (Insufficient stock)
      console.log('Test 8: POST /api/sales (POS Checkout - Insufficient stock)');
      const invalidSalePayload = {
        cashierId: cashierId,
        items: [
          {
            productId: productId,
            quantity: 30, // Exceeds available stock (20)
          }
        ],
        paymentMethod: 'Card',
        paymentStatus: 'Paid',
      };
      const invalidSaleRes = await makeRequest('POST', '/api/sales', invalidSalePayload);
      if (invalidSaleRes.status !== 400 || !invalidSaleRes.body.error) {
        throw new Error(`POS checkout did not reject insufficient stock: ${JSON.stringify(invalidSaleRes)}`);
      }
      console.log('✅ POS checkout successfully rejected due to insufficient stock.\n');

      // Test I: Get Sales List
      console.log('Test 9: GET /api/sales (List all sales transactions)');
      const getSalesRes = await makeRequest('GET', '/api/sales');
      if (getSalesRes.status !== 200 || !Array.isArray(getSalesRes.body) || getSalesRes.body.length !== 1) {
        throw new Error(`Failed to retrieve sales list: ${JSON.stringify(getSalesRes)}`);
      }
      console.log('✅ Sales listing retrieve verified.\n');

      // Test K: Create Purchase Order (Ordered)
      console.log('Test 10: POST /api/purchase-orders (Create Purchase Order)');
      const poPayload = {
        supplierId: supplierId,
        items: [
          {
            productId: productId,
            quantityOrdered: 50,
            purchasePrice: 9.50,
          }
        ],
      };
      const createPORes = await makeRequest('POST', '/api/purchase-orders', poPayload);
      if (createPORes.status !== 201 || !createPORes.body._id) {
        throw new Error(`Failed to create PO: ${JSON.stringify(createPORes)}`);
      }
      const poId = createPORes.body._id;
      console.log(`✅ Purchase Order placed successfully (PO ID: ${poId}).`);

      // Verify product stock is still 20 (Ordered status shouldn't change stock)
      const checkStockBeforeRecvRes = await makeRequest('GET', `/api/products/${productId}`);
      if (checkStockBeforeRecvRes.status !== 200 || checkStockBeforeRecvRes.body.currentStock !== 20) {
        throw new Error(`Product stock changed on order placement: ${JSON.stringify(checkStockBeforeRecvRes)}`);
      }
      console.log('✅ Stock level remained unchanged at 20 while PO is in "Ordered" status.');

      // Test L: Receive Purchase Order
      console.log('Test 11: PUT /api/purchase-orders/:id/status (Receive Purchase Order)');
      const updateStatusRes = await makeRequest('PUT', `/api/purchase-orders/${poId}/status`, {
        status: 'Received',
        performedBy: cashierId,
      });
      if (updateStatusRes.status !== 200 || updateStatusRes.body.status !== 'Received') {
        throw new Error(`Failed to update PO status: ${JSON.stringify(updateStatusRes)}`);
      }
      console.log('✅ PO status transitioned to "Received".');

      // Verify product stock increased to 70 (20 + 50)
      const checkStockAfterRecvRes = await makeRequest('GET', `/api/products/${productId}`);
      if (checkStockAfterRecvRes.status !== 200 || checkStockAfterRecvRes.body.currentStock !== 70) {
        throw new Error(`Product stock did not update correctly after PO receipt: ${JSON.stringify(checkStockAfterRecvRes)}`);
      }
      console.log('✅ Product stock level successfully incremented to 70.');

      // Verify InventoryLog created
      const poLogs = await InventoryLog.find({ referenceId: poId });
      if (poLogs.length !== 1 || poLogs[0].quantityChanged !== 50 || poLogs[0].changeType !== 'Purchase') {
        throw new Error(`InventoryLog not recorded correctly for PO: ${JSON.stringify(poLogs)}`);
      }
      console.log('✅ Purchase order inventory log audit entry verified.\n');

      // Test M: Get Purchase Orders list
      console.log('Test 12: GET /api/purchase-orders (List all POs)');
      const getPOsRes = await makeRequest('GET', '/api/purchase-orders');
      if (getPOsRes.status !== 200 || !Array.isArray(getPOsRes.body) || getPOsRes.body.length !== 1) {
        throw new Error(`Failed to retrieve PO list: ${JSON.stringify(getPOsRes)}`);
      }
      console.log('✅ PO listing retrieve verified.\n');

      // Test N: Delete / Deactivate Supplier
      console.log('Test 13: DELETE /api/suppliers/:id (Deactivate Supplier)');
      const deleteSupplierRes = await makeRequest('DELETE', `/api/suppliers/${supplierId}`);
      if (deleteSupplierRes.status !== 200 || deleteSupplierRes.body.supplier.status !== 'Inactive') {
        throw new Error(`Failed to deactivate supplier: ${JSON.stringify(deleteSupplierRes)}`);
      }
      console.log('✅ Soft-deactivation (Inactive status toggle) of supplier verified.\n');

      console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
      cleanup(0);
    } catch (testError) {
      console.error('❌ Integration Test Failed:', testError);
      cleanup(1);
    }
  });
}

function cleanup(exitCode) {
  if (server) {
    server.close(() => {
      console.log('Test server shut down.');
      mongoose.connection.close().then(() => {
        console.log('Database connection closed.');
        process.exit(exitCode);
      });
    });
  } else {
    process.exit(exitCode);
  }
}

runTests();
