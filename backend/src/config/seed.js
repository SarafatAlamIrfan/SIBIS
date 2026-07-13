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
        name: 'Superb Wholesale Distributors',
        contactPerson: 'Sarah Jenkins',
        phone: '+1 (555) 123-4567',
        email: 'sarah@superbdistributors.com',
        address: '100 Distribution Way, Sector 4, Metro City',
        status: 'Active',
      },
      {
        name: 'Fresh Dairy Cooperatives',
        contactPerson: 'David Miller',
        phone: '+1 (555) 987-6543',
        email: 'david@freshdairy.org',
        address: '45 Pasture Lane, Green Valley',
        status: 'Active',
      },
      {
        name: 'Snack & Beverage Traders',
        contactPerson: 'Alex Carter',
        phone: '+1 (555) 456-7890',
        email: 'sales@snackbevtraders.com',
        address: '78 Logistics Blvd, Port Area',
        status: 'Active',
      },
      {
        name: 'Premium Rice & Grain Growers',
        contactPerson: 'Rajesh Kumar',
        phone: '+1 (555) 321-7654',
        email: 'rajesh@premiumgrains.com',
        address: '12 Paddy Field Road, Agricultural Zone',
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
        name: 'Jasmine Rice 5kg',
        sku: 'RICE-JAS-5KG',
        description: 'Premium long grain fragrant Jasmine Rice.',
        category: 'Grains',
        brand: 'Golden Harvest',
        supplierId: grainId,
        purchasePrice: 10.00,
        sellingPrice: 15.00,
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
        purchasePrice: 6.50,
        sellingPrice: 11.00,
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
        purchasePrice: 1.80,
        sellingPrice: 3.20,
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
        purchasePrice: 2.50,
        sellingPrice: 4.80,
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
        purchasePrice: 1.10,
        sellingPrice: 2.50,
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
        purchasePrice: 4.00,
        sellingPrice: 9.50, // High profit margin: $5.50
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
        purchasePrice: 1.20,
        sellingPrice: 3.00,
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
        purchasePrice: 0.60,
        sellingPrice: 1.80,
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
        purchasePrice: 0.50,
        sellingPrice: 1.20,
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
