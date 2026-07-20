const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const Store = require('../models/Store');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const InventoryLog = require('../models/InventoryLog');
const PurchaseOrder = require('../models/PurchaseOrder');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sibis';

// Helper to generate dates over the last 30 days
const getRandomDateInPast30Days = () => {
  const today = new Date();
  const pastDays = Math.floor(Math.random() * 30);
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  
  const date = new Date(today);
  date.setDate(today.getDate() - pastDays);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const seed = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing development collections
    console.log('Clearing existing collections...');
    await Promise.all([
      Store.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Sale.deleteMany({}),
      InventoryLog.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('Collections cleared.');

    // 1. Create Default Stores
    console.log('Seeding Stores...');
    const apexStore = await Store.create({
      name: 'Apex Supermarket',
      code: 'STR-APEX-101',
      email: 'contact@apexsupermarket.com',
      phone: '+880 1711-000111',
      address: 'Plot 12, Gulshan Avenue, Dhaka',
      businessType: 'Supermarket & Grocery',
      status: 'Active',
      subscriptionPlan: 'Enterprise',
    });

    const metroStore = await Store.create({
      name: 'Metro Electronics & Gadgets',
      code: 'STR-METR-202',
      email: 'sales@metroelectronics.com',
      phone: '+880 1819-222333',
      address: 'Level 4, Jamuna Future Park, Dhaka',
      businessType: 'Consumer Electronics',
      status: 'Active',
      subscriptionPlan: 'Pro',
    });

    console.log('Seeded Stores: Apex Supermarket and Metro Electronics.');

    // 2. Create Users (System Admin, Store Owners, Staff)
    console.log('Seeding Users...');
    const sysAdmin = await User.create({
      firebaseUid: 'mock-uid-admin-sibis-com',
      name: 'SYSTEM ADMIN',
      email: 'admin@sibis.com',
      role: 'System Admin',
      password: 'admin123',
    });

    const owner = await User.create({
      firebaseUid: 'mock-uid-owner-sibis-com',
      name: 'OWNER DEMO',
      email: 'owner@sibis.com',
      role: 'Owner',
      storeId: apexStore._id,
      password: 'password123',
    });

    const manager = await User.create({
      firebaseUid: 'mock-uid-manager-sibis-com',
      name: 'MANAGER DEMO',
      email: 'manager@sibis.com',
      role: 'Manager',
      storeId: apexStore._id,
      password: 'password123',
    });

    const cashier = await User.create({
      firebaseUid: 'mock-uid-cashier-sibis-com',
      name: 'CASHIER DEMO',
      email: 'cashier@sibis.com',
      role: 'Cashier',
      storeId: apexStore._id,
      password: 'password123',
    });

    await User.create({
      firebaseUid: 'mock-uid-inventory-sibis-com',
      name: 'INVENTORY DEMO',
      email: 'inventory@sibis.com',
      role: 'Inventory Staff',
      storeId: apexStore._id,
      password: 'password123',
    });

    // Metro Store Owner
    const metroOwner = await User.create({
      firebaseUid: 'mock-uid-metro-owner',
      name: 'METRO OWNER',
      email: 'metro.owner@sibis.com',
      role: 'Owner',
      storeId: metroStore._id,
      password: 'password123',
    });

    // Link ownerId to stores
    apexStore.ownerId = owner._id;
    await apexStore.save();

    metroStore.ownerId = metroOwner._id;
    await metroStore.save();

    // 3. Create Suppliers for Apex Store
    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Pran-RFL Distributor Dhaka',
        storeId: apexStore._id,
        contactPerson: 'Mahbubur Rahman',
        phone: '+880 1711-234567',
        email: 'mahbub@pranrfl.com',
        address: '105 Pragati Sarani, Middle Badda, Dhaka 1212',
        status: 'Active',
      },
      {
        name: 'Aarong Dairy Supply',
        storeId: apexStore._id,
        contactPerson: 'Sarafat Alam',
        phone: '+880 1819-987654',
        email: 'supply@aarongdairy.com',
        address: 'BRAC Centre, 75 Mohakhali C/A, Dhaka 1212',
        status: 'Active',
      },
      {
        name: 'Akij Food & Beverage Ltd',
        storeId: apexStore._id,
        contactPerson: 'Imtiaz Hossain',
        phone: '+880 1911-456789',
        email: 'imtiaz@akij.net',
        address: 'Akij House, Tejgaon, Dhaka 1208',
        status: 'Active',
      },
      {
        name: 'Chashi Rice & Grain Mills',
        storeId: apexStore._id,
        contactPerson: 'Rashedul Islam',
        phone: '+880 1511-321765',
        email: 'sales@chashirice.com',
        address: 'Banani, Dhaka 1213',
        status: 'Active',
      },
    ]);

    const superbId = suppliers[0]._id;
    const dairyId = suppliers[1]._id;
    const snackId = suppliers[2]._id;
    const grainId = suppliers[3]._id;

    // 4. Create Products for Apex Store
    console.log('Seeding Products for Apex Supermarket...');
    const productsData = [
      {
        name: 'Basmati Rice 5kg',
        sku: 'RICE-BAS-5KG',
        description: 'Premium long grain aged fragrant Basmati Rice.',
        category: 'Grains',
        brand: 'Golden Harvest',
        storeId: apexStore._id,
        supplierId: grainId,
        purchasePrice: 480.00,
        sellingPrice: 550.00,
        currentStock: 12,
        minStockThreshold: 15,
      },
      {
        name: 'Full Cream Milk Powder 1kg',
        sku: 'DAIRY-MILK-1KG',
        description: 'Rich pasteurized full cream milk powder.',
        category: 'Dairy',
        brand: 'Aarong Dairy',
        storeId: apexStore._id,
        supplierId: dairyId,
        purchasePrice: 650.00,
        sellingPrice: 720.00,
        currentStock: 45,
        minStockThreshold: 10,
      },
      {
        name: 'Chocolate Biscuits 200g',
        sku: 'SNACK-CHOC-200G',
        description: 'Crunchy chocolate cream biscuits.',
        category: 'Snacks',
        brand: 'Pran',
        storeId: apexStore._id,
        supplierId: superbId,
        purchasePrice: 40.00,
        sellingPrice: 50.00,
        currentStock: 80,
        minStockThreshold: 20,
      },
      {
        name: 'Mango Juice 1L',
        sku: 'BEV-MANGO-1L',
        description: 'Natural fresh mango pulp nectar beverage.',
        category: 'Beverages',
        brand: 'Akij Frutika',
        storeId: apexStore._id,
        supplierId: snackId,
        purchasePrice: 90.00,
        sellingPrice: 110.00,
        currentStock: 6,
        minStockThreshold: 12,
      },
    ];

    const createdProducts = await Product.insertMany(productsData);

    // Seed a couple products for Metro Store
    const metroSupplier = await Supplier.create({
      name: 'Sony-Smart Bangladesh',
      storeId: metroStore._id,
      contactPerson: 'Kazi Nazmul',
      phone: '+880 1711-998877',
      email: 'sales@smartbd.com',
      address: 'IDB Bhaban, Agargaon, Dhaka',
    });

    await Product.create({
      name: 'Smart 55 Inch 4K Android TV',
      sku: 'TV-55-4K-SMART',
      description: 'Ultra HD 4K Android Smart TV',
      category: 'Electronics',
      brand: 'Smart LED',
      storeId: metroStore._id,
      supplierId: metroSupplier._id,
      purchasePrice: 42000.00,
      sellingPrice: 49900.00,
      currentStock: 8,
      minStockThreshold: 3,
    });

    // 5. Seed Historical Sales
    console.log('Seeding Historical Sales...');
    const salesList = [];
    for (let i = 1; i <= 25; i++) {
      const saleDate = getRandomDateInPast30Days();
      const product = createdProducts[i % createdProducts.length];
      const qty = Math.floor(Math.random() * 3) + 1;
      const total = product.sellingPrice * qty;

      salesList.push({
        invoiceNumber: `INV-2026-${1000 + i}`,
        storeId: apexStore._id,
        cashierId: cashier._id,
        items: [
          {
            productId: product._id,
            quantity: qty,
            priceAtSale: product.sellingPrice,
            purchasePriceAtSale: product.purchasePrice,
          },
        ],
        totalAmount: total,
        paymentMethod: i % 2 === 0 ? 'Cash' : 'Card',
        paymentStatus: 'Paid',
        createdAt: saleDate,
        updatedAt: saleDate,
      });
    }

    await Sale.insertMany(salesList);
    console.log('Seeded 25 historical sales for Apex Supermarket.');

    console.log('=====================================================');
    console.log('Database Seeding Completed Successfully!');
    console.log('SYSTEM ADMIN: admin@sibis.com / admin123');
    console.log('STORE OWNER (Apex): owner@sibis.com / password123');
    console.log('STORE OWNER (Metro): metro.owner@sibis.com / password123');
    console.log('=====================================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seed();
