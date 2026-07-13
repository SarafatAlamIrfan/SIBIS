require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');
const User = require('./src/models/User');
const InventoryLog = require('./src/models/InventoryLog');

const PORT = 5001;
let server;

// Helper to make HTTP requests
const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
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
  console.log('Starting SIBIS API Integration & RBAC Tests...');

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

  // 2. Define Mock User Headers
  const ownerHeaders = {
    'x-mock-uid': 'fb-uid-owner-100',
    'x-mock-email': 'owner@sibis.com',
    'x-mock-name': 'Owner User',
    'x-mock-role': 'Owner'
  };

  const cashierHeaders = {
    'x-mock-uid': 'fb-uid-cashier-200',
    'x-mock-email': 'cashier@sibis.com',
    'x-mock-name': 'Cashier User',
    'x-mock-role': 'Cashier'
  };

  const inventoryStaffHeaders = {
    'x-mock-uid': 'fb-uid-inventory-300',
    'x-mock-email': 'inventory@sibis.com',
    'x-mock-name': 'Inventory Staff User',
    'x-mock-role': 'Inventory Staff'
  };

  // 3. Start temporary API server
  server = app.listen(PORT, async () => {
    console.log(`Test server listening on port ${PORT}\n`);

    try {
      // Clear out test collections before starting
      await mongoose.connection.db.dropDatabase();

      // Test A: Health endpoint (no auth needed)
      console.log('Test 1: GET /health (Public)');
      const healthRes = await makeRequest('GET', '/health');
      if (healthRes.status !== 200 || healthRes.body.status !== 'UP') {
        throw new Error(`Health check failed: ${JSON.stringify(healthRes)}`);
      }
      console.log('✅ Health check passed.\n');

      // Test B: Auth protection check
      console.log('Test 2: GET /api/products without credentials (Should reject 401)');
      const unauthRes = await makeRequest('GET', '/api/products');
      if (unauthRes.status !== 401) {
        throw new Error(`Endpoint should have rejected unauthorized request: ${JSON.stringify(unauthRes)}`);
      }
      console.log('✅ Auth rejection verified.\n');

      // Test C: Sync User (Bootstraps first user as Owner)
      console.log('Test 3: POST /api/users/sync (Bootstrap first user as Owner)');
      const syncOwnerRes = await makeRequest('POST', '/api/users/sync', {
        firebaseUid: ownerHeaders['x-mock-uid'],
        name: ownerHeaders['x-mock-name'],
        email: ownerHeaders['x-mock-email'],
        role: 'Owner'
      });
      if (syncOwnerRes.status !== 201 || syncOwnerRes.body.role !== 'Owner') {
        throw new Error(`Failed to bootstrap Owner user: ${JSON.stringify(syncOwnerRes)}`);
      }
      console.log('✅ Owner bootstrap verified.\n');

      // Sync other users
      console.log('Syncing helper Cashier & Inventory Staff profiles...');
      const syncCashierRes = await makeRequest('POST', '/api/users/sync', {
        firebaseUid: cashierHeaders['x-mock-uid'],
        name: cashierHeaders['x-mock-name'],
        email: cashierHeaders['x-mock-email'],
        role: 'Cashier'
      });
      const syncInventoryRes = await makeRequest('POST', '/api/users/sync', {
        firebaseUid: inventoryStaffHeaders['x-mock-uid'],
        name: inventoryStaffHeaders['x-mock-name'],
        email: inventoryStaffHeaders['x-mock-email'],
        role: 'Inventory Staff'
      });
      const cashierId = syncCashierRes.body._id;
      const inventoryId = syncInventoryRes.body._id;
      console.log('✅ Cashier and Inventory Staff user profiles synced successfully.\n');

      // Test D: RBAC Create Supplier
      console.log('Test 4: POST /api/suppliers as Cashier (Should reject 403)');
      const supplierData = {
        name: 'Superb Wholesale Distributors',
        contactPerson: 'Alice Smith',
        phone: '555-0199',
        email: 'alice@superbwholesale.com',
        address: '789 Logistics Blvd, Suite A',
      };
      const rejectSupplierRes = await makeRequest('POST', '/api/suppliers', supplierData, cashierHeaders);
      if (rejectSupplierRes.status !== 403) {
        throw new Error(`Cashier should not have permissions to create supplier: ${JSON.stringify(rejectSupplierRes)}`);
      }
      console.log('✅ Supplier creation forbidden for Cashier (as expected).');

      console.log('Test 5: POST /api/suppliers as Owner (Should succeed 201)');
      const createSupplierRes = await makeRequest('POST', '/api/suppliers', supplierData, ownerHeaders);
      if (createSupplierRes.status !== 201) {
        throw new Error(`Owner failed to create supplier: ${JSON.stringify(createSupplierRes)}`);
      }
      const supplierId = createSupplierRes.body._id;
      console.log('✅ Supplier successfully created by Owner.\n');

      // Test E: RBAC Create Product
      console.log('Test 6: POST /api/products as Cashier (Should reject 403)');
      const productData = {
        name: 'Premium Jasmine Rice 5kg',
        sku: 'JR-5KG-01',
        category: 'Grains',
        brand: 'Golden Harvest',
        supplierId: supplierId,
        purchasePrice: 10.00,
        sellingPrice: 14.50,
        currentStock: 25,
        minStockThreshold: 10,
      };
      const rejectProductRes = await makeRequest('POST', '/api/products', productData, cashierHeaders);
      if (rejectProductRes.status !== 403) {
        throw new Error(`Cashier should not have permissions to create product: ${JSON.stringify(rejectProductRes)}`);
      }
      console.log('✅ Product creation forbidden for Cashier (as expected).');

      console.log('Test 7: POST /api/products as Inventory Staff (Should succeed 201)');
      const createProductRes = await makeRequest('POST', '/api/products', productData, inventoryStaffHeaders);
      if (createProductRes.status !== 201) {
        throw new Error(`Inventory Staff failed to create product: ${JSON.stringify(createProductRes)}`);
      }
      const productId = createProductRes.body._id;
      console.log('✅ Product successfully created by Inventory Staff.\n');

      // Test F: RBAC POS Checkout
      console.log('Test 8: POST /api/sales as Inventory Staff (Should reject 403)');
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
      const rejectSaleRes = await makeRequest('POST', '/api/sales', salePayload, inventoryStaffHeaders);
      if (rejectSaleRes.status !== 403) {
        throw new Error(`Inventory Staff should not have POS checkout permission: ${JSON.stringify(rejectSaleRes)}`);
      }
      console.log('✅ POS checkout forbidden for Inventory Staff (as expected).');

      console.log('Test 9: POST /api/sales as Cashier (Should succeed 201)');
      const createSaleRes = await makeRequest('POST', '/api/sales', salePayload, cashierHeaders);
      if (createSaleRes.status !== 201) {
        throw new Error(`Cashier failed to process valid checkout: ${JSON.stringify(createSaleRes)}`);
      }
      const saleId = createSaleRes.body._id;
      console.log('✅ POS checkout successfully completed by Cashier.');

      // Check stock levels decremented to 20
      const checkProductRes = await makeRequest('GET', `/api/products/${productId}`, null, cashierHeaders);
      if (checkProductRes.body.currentStock !== 20) {
        throw new Error(`Stock level was not decremented correctly: ${JSON.stringify(checkProductRes)}`);
      }
      console.log('✅ Stock level successfully reduced to 20.\n');

      // Test G: RBAC Purchase Orders
      console.log('Test 10: POST /api/purchase-orders as Cashier (Should reject 403)');
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
      const rejectPORes = await makeRequest('POST', '/api/purchase-orders', poPayload, cashierHeaders);
      if (rejectPORes.status !== 403) {
        throw new Error(`Cashier should not have PO creation permission: ${JSON.stringify(rejectPORes)}`);
      }
      console.log('✅ PO placement forbidden for Cashier (as expected).');

      console.log('Test 11: POST /api/purchase-orders as Owner (Should succeed 201)');
      const createPORes = await makeRequest('POST', '/api/purchase-orders', poPayload, ownerHeaders);
      if (createPORes.status !== 201) {
        throw new Error(`Owner failed to place PO: ${JSON.stringify(createPORes)}`);
      }
      const poId = createPORes.body._id;
      console.log('✅ PO successfully created by Owner.');

      // Receive PO (requires Owner/Manager)
      console.log('Test 12: PUT /api/purchase-orders/:id/status as Owner (Should succeed 200)');
      const updateStatusRes = await makeRequest('PUT', `/api/purchase-orders/${poId}/status`, {
        status: 'Received',
        performedBy: ownerHeaders['x-mock-uid'] === 'fb-uid-owner-100' ? syncOwnerRes.body._id : syncOwnerRes.body._id,
      }, ownerHeaders);
      if (updateStatusRes.status !== 200 || updateStatusRes.body.status !== 'Received') {
        throw new Error(`Owner failed to mark PO as Received: ${JSON.stringify(updateStatusRes)}`);
      }
      console.log('✅ PO marked "Received" by Owner.');

      // Verify stock level increased to 70
      const checkStockRes = await makeRequest('GET', `/api/products/${productId}`, null, cashierHeaders);
      if (checkStockRes.body.currentStock !== 70) {
        throw new Error(`Stock level was not incremented correctly: ${JSON.stringify(checkStockRes)}`);
      }
      console.log('✅ Product stock level successfully incremented to 70.\n');

      console.log('🎉 ALL INTEGRATION & RBAC TESTS PASSED SUCCESSFULLY! 🎉');
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
