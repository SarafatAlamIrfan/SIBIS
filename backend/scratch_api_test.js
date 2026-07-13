require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');

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

      // Test G: Delete / Deactivate Supplier
      console.log('Test 7: DELETE /api/suppliers/:id (Deactivate Supplier)');
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
