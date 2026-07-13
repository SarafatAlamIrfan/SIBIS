const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('       SIBIS WorkSpace Health & Integrity Check       ');
console.log('====================================================\n');

let status = true;

const checkFile = (filePath) => {
  const absolutePath = path.resolve(filePath);
  if (fs.existsSync(absolutePath)) {
    console.log(`✅ File Found: ${filePath}`);
    return true;
  } else {
    console.error(`❌ File MISSING: ${filePath}`);
    status = false;
    return false;
  }
};

// 1. Verify Backend File Integrity
console.log('--- 🛡️ Checking Backend Component Integrity ---');
const backendFiles = [
  'backend/package.json',
  'backend/src/index.js',
  'backend/src/app.js',
  'backend/src/config/db.js',
  'backend/src/config/firebase.js',
  'backend/src/middleware/authMiddleware.js',
  'backend/src/models/User.js',
  'backend/src/models/Product.js',
  'backend/src/models/Supplier.js',
  'backend/src/models/Sale.js',
  'backend/src/models/PurchaseOrder.js',
  'backend/src/models/InventoryLog.js',
  'backend/src/controllers/productController.js',
  'backend/src/controllers/supplierController.js',
  'backend/src/controllers/saleController.js',
  'backend/src/controllers/purchaseController.js',
  'backend/src/controllers/userController.js',
  'backend/src/routes/productRoutes.js',
  'backend/src/routes/supplierRoutes.js',
  'backend/src/routes/saleRoutes.js',
  'backend/src/routes/purchaseRoutes.js',
  'backend/src/routes/userRoutes.js',
];
backendFiles.forEach(checkFile);
console.log('');

// 2. Verify Frontend File Integrity
console.log('--- 🎨 Checking Frontend Component Integrity ---');
const frontendFiles = [
  'frontend/package.json',
  'frontend/vite.config.js',
  'frontend/index.html',
  'frontend/src/main.jsx',
  'frontend/src/App.jsx',
  'frontend/src/index.css',
  'frontend/src/services/api.js',
  'frontend/src/context/AuthContext.jsx',
  'frontend/src/components/Layout.jsx',
  'frontend/src/components/Sidebar.jsx',
  'frontend/src/components/Navbar.jsx',
  'frontend/src/pages/Login.jsx',
  'frontend/src/pages/Dashboard.jsx',
  'frontend/src/pages/POS.jsx',
  'frontend/src/pages/Products.jsx',
  'frontend/src/pages/Suppliers.jsx',
  'frontend/src/pages/PurchaseOrders.jsx',
  'frontend/src/pages/NotAuthorized.jsx',
];
frontendFiles.forEach(checkFile);
console.log('');

// 3. Compile & Run local tests
if (status) {
  console.log('--- 🧪 Running Database Schema Offline Validations ---');
  try {
    const testOutput = execSync('node scratch_test.js', { cwd: path.resolve('backend') });
    console.log(testOutput.toString());
  } catch (error) {
    console.error('❌ Mongoose schema offline validation failed.');
    console.error(error.message);
    status = false;
  }
  
  console.log('--- 🧪 Running API Integration Offline Check ---');
  try {
    const apiTestOutput = execSync('node scratch_api_test.js', { cwd: path.resolve('backend') });
    console.log(apiTestOutput.toString());
  } catch (error) {
    console.error('❌ API integration offline check failed.');
    console.error(error.message);
    status = false;
  }

  console.log('--- 🧪 Running Frontend Production Build Check ---');
  try {
    const buildOutput = execSync('npm run build', { cwd: path.resolve('frontend') });
    console.log('✅ Frontend production build check passed successfully.');
    console.log(buildOutput.toString().split('\n').filter(line => line.includes('dist/')).join('\n'));
  } catch (error) {
    console.error('❌ Frontend build compilation failed.');
    console.error(error.message);
    status = false;
  }
}

console.log('\n====================================================');
if (status) {
  console.log('🎉 workspace status: HEALTHY! All checks passed. 🎉');
} else {
  console.error('🚨 workspace status: UNHEALTHY! Please resolve missing files or compile issues. 🚨');
}
console.log('====================================================');
