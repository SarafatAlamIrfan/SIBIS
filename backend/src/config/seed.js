const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const InventoryLog = require('../models/InventoryLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sibis';

// Helper to generate dates over the last 30 days
const getRandomDateInPast30Days = () => {
  const today = new Date();
  const pastDays = Math.floor(Math.random() * 30); // 0 to 29 days ago
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
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Sale.deleteMany({}),
      InventoryLog.deleteMany({}),
    ]);
    console.log('Collections cleared.');

    // 1. Create Default Owner User if not present
    let owner = await User.findOne({ role: 'Owner' });
    if (!owner) {
      console.log('Creating default Owner account...');
      owner = await User.create({
        firebaseUid: 'mock-uid-owner-sibis-com',
        name: 'OWNER DEMO',
        email: 'owner@sibis.com',
        role: 'Owner',
      });
    }

    // 2. Create Suppliers
    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.insertMany([
      {
        name: 'Pran-RFL Distributor Dhaka',
        contactPerson: 'Mahbubur Rahman',
        phone: '+880 1711-234567',
        email: 'mahbub@pranrfl.com',
        address: '105 Pragati Sarani, Middle Badda, Dhaka 1212',
        status: 'Active',
      },
      {
        name: 'Aarong Dairy Supply',
        contactPerson: 'Sarafat Alam',
        phone: '+880 1819-987654',
        email: 'supply@aarongdairy.com',
        address: 'BRAC Centre, 75 Mohakhali C/A, Dhaka 1212',
        status: 'Active',
      },
      {
        name: 'Akij Food & Beverage Ltd',
        contactPerson: 'Imtiaz Hossain',
        phone: '+880 1911-456789',
        email: 'imtiaz@akij.net',
        address: 'Akij House, 198 Bir Uttam Mir Shawkat Sarak, Gulshan-Link Road, Tejgaon, Dhaka 1208',
        status: 'Active',
      },
      {
        name: 'Chashi Rice & Grain Mills',
        contactPerson: 'Rashedul Islam',
        phone: '+880 1511-321765',
        email: 'sales@chashirice.com',
        address: 'House 42, Road 11, Banani, Dhaka 1213',
        status: 'Active',
      },
    ]);
    console.log(`Seeded ${suppliers.length} suppliers.`);

    // Map supplier IDs
    const superbId = suppliers[0]._id;
    const dairyId = suppliers[1]._id;
    const snackId = suppliers[2]._id;
    const grainId = suppliers[3]._id;

    // 3. Create Products
    console.log('Seeding Products...');
    const productsData = [
      {
        name: 'Basmati Rice 5kg',
        sku: 'RICE-BAS-5KG',
        description: 'Premium long grain aged fragrant Basmati Rice.',
        category: 'Grains',
        brand: 'Golden Harvest',
        supplierId: grainId,
        purchasePrice: 480.00,
        sellingPrice: 550.00,
        currentStock: 12,
        minStockThreshold: 15, // Below threshold
      },
      {
        name: 'Organic Honey 500g',
        sku: 'HONEY-ORG-500G',
        description: '100% pure organic wildflower honey.',
        category: 'Grocery',
        brand: 'Nature Choice',
        supplierId: superbId,
        purchasePrice: 400.00,
        sellingPrice: 520.00,
        currentStock: 4,
        minStockThreshold: 8, // Below threshold
      },
      {
        name: 'Fresh Whole Milk 1L',
        sku: 'MILK-WHL-1L',
        description: 'Pasteurized homogenized whole cow milk.',
        category: 'Dairy',
        brand: 'Green pasture',
        supplierId: dairyId,
        purchasePrice: 75.00,
        sellingPrice: 90.00,
        currentStock: 3,
        minStockThreshold: 15, // Critically low!
      },
      {
        name: 'Greek Yogurt 500g',
        sku: 'YOG-GRK-500G',
        description: 'Creamy high-protein plain Greek yogurt.',
        category: 'Dairy',
        brand: 'DairyLand',
        supplierId: dairyId,
        purchasePrice: 150.00,
        sellingPrice: 200.00,
        currentStock: 25,
        minStockThreshold: 8,
      },
      {
        name: 'Chocolate Chip Cookies 200g',
        sku: 'COOKIE-CHO-200G',
        description: 'Double chocolate chip crunchy cookies.',
        category: 'Snacks',
        brand: 'BakeHouse',
        supplierId: snackId,
        purchasePrice: 100.00,
        sellingPrice: 140.00,
        currentStock: 32,
        minStockThreshold: 10,
      },
      {
        name: 'Mustard Cooking Oil 1L',
        sku: 'OIL-MUS-1L',
        description: 'Cold-pressed pure mustard seed oil.',
        category: 'Grocery',
        brand: 'PureDrop',
        supplierId: superbId,
        purchasePrice: 190.00,
        sellingPrice: 240.00,
        currentStock: 18,
        minStockThreshold: 10,
      },
      {
        name: 'Energy Drink 250ml',
        sku: 'BEV-ENG-250ML',
        description: 'Taurine and caffeine infused energy booster.',
        category: 'Beverages',
        brand: 'HyperCharge',
        supplierId: snackId,
        purchasePrice: 140.00,
        sellingPrice: 180.00,
        currentStock: 7,
        minStockThreshold: 15, // Below threshold
      },
      {
        name: 'Sparkling Water 500ml',
        sku: 'BEV-SPK-500ML',
        description: 'Zero calorie unsweetened carbonated water.',
        category: 'Beverages',
        brand: 'AquaFizz',
        supplierId: snackId,
        purchasePrice: 30.00,
        sellingPrice: 45.00,
        currentStock: 65,
        minStockThreshold: 20,
      },
      {
        name: 'Chocolate Biscuits 100g',
        sku: 'BIS-CHO-100G',
        description: 'Chocolate cream-filled sweet biscuits.',
        category: 'Snacks',
        brand: 'SnackCo',
        supplierId: snackId,
        purchasePrice: 35.00,
        sellingPrice: 50.00,
        currentStock: 40,
        minStockThreshold: 15, // No sales in past 30 days!
      }
    ];

    const products = await Product.insertMany(productsData);
    console.log(`Seeded ${products.length} products.`);

    // 4. Create Historical Sales (for demand forecasting trends)
    console.log('Seeding 100+ historical sales logs over past 30 days...');
    const salesData = [];
    const logsData = [];

    // Exclude Chocolate Biscuits from sales to test the slow-moving stock insight!
    const activeProducts = products.filter(p => p.sku !== 'BIS-CHO-100G');

    for (let i = 0; i < 110; i++) {
      const saleDate = getRandomDateInPast35Days(i); // helper spreads them chronologically
      
      // Determine items in this sale (1 to 3 products)
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...activeProducts].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, itemCount);
      
      let totalAmount = 0;
      const items = [];

      selected.forEach(prod => {
        // Average purchase quantity per transaction
        const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 units
        const price = prod.sellingPrice;
        const profit = (prod.sellingPrice - prod.purchasePrice) * quantity;
        
        totalAmount += price * quantity;
        items.push({
          productId: prod._id,
          quantity,
          priceAtSale: price,
          purchasePriceAtSale: prod.purchasePrice,
          profitMargin: prod.sellingPrice - prod.purchasePrice,
        });

        // Add to historical inventory log
        logsData.push({
          productId: prod._id,
          changeType: 'Sale',
          quantityChanged: -quantity,
          previousStock: prod.currentStock + quantity,
          newStock: prod.currentStock,
          performedBy: owner._id,
          remarks: `System Seeded Transaction Log ${i}`,
          createdAt: saleDate,
        });
      });

      salesData.push({
        cashierId: owner._id,
        items,
        totalAmount,
        paymentMethod: ['Cash', 'Card', 'Mobile Pay'][Math.floor(Math.random() * 3)],
        paymentStatus: 'Paid',
        invoiceNumber: `INV-2026-${1000 + i}`,
        createdAt: saleDate,
      });
    }

    const sales = await Sale.insertMany(salesData);
    console.log(`Seeded ${sales.length} historical sales.`);
    
    const logs = await InventoryLog.insertMany(logsData);
    console.log(`Seeded ${logs.length} inventory logs.`);

    console.log('\n==========================================');
    console.log('🎉 Database seeding completed successfully! 🎉');
    console.log('==========================================');

  } catch (error) {
    console.error('Seeding process failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Spread dates chronologically over past 30 days
const getRandomDateInPast35Days = (index) => {
  const today = new Date();
  // Linearly distribute dates based on index to ensure balanced sales trends
  const dayOffset = Math.floor((110 - index) * 0.3); // spreads up to ~33 days ago
  const hours = Math.floor(Math.random() * 12) + 8; // Business hours 8 AM - 8 PM
  const minutes = Math.floor(Math.random() * 60);

  const date = new Date(today);
  date.setDate(today.getDate() - dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

seed();
