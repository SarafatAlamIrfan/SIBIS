const mongoose = require('mongoose');

const autoSeedDefaults = async () => {
  try {
    const User = require('../models/User');
    const Store = require('../models/Store');

    // 1. Ensure System Admin exists
    const adminExists = await User.findOne({ email: 'admin@sibis.com' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@sibis.com',
        role: 'System Admin',
        password: 'admin123',
        isActive: true,
      });
      console.log('[Auto-Seed] Default System Admin created: admin@sibis.com / admin123');
    }

    // 2. Ensure Default Demo Store & Owner exist
    const ownerExists = await User.findOne({ email: 'owner@sibis.com' });
    if (!ownerExists) {
      let store = await Store.findOne({ code: 'STR-APEX-101' });
      if (!store) {
        store = await Store.create({
          name: 'Apex Supermarket',
          code: 'STR-APEX-101',
          email: 'contact@apexsupermarket.com',
          phone: '+880 1711-000111',
          address: 'Plot 12, Gulshan Avenue, Dhaka',
          businessType: 'Supermarket & Grocery',
          status: 'Active',
          subscriptionPlan: 'Enterprise',
        });
      }

      const owner = await User.create({
        name: 'OWNER DEMO',
        email: 'owner@sibis.com',
        role: 'Owner',
        storeId: store._id,
        password: 'password123',
        isActive: true,
      });

      store.ownerId = owner._id;
      await store.save();

      await User.create({
        name: 'MANAGER DEMO',
        email: 'manager@sibis.com',
        role: 'Manager',
        storeId: store._id,
        password: 'password123',
        isActive: true,
      });

      await User.create({
        name: 'CASHIER DEMO',
        email: 'cashier@sibis.com',
        role: 'Cashier',
        storeId: store._id,
        password: 'password123',
        isActive: true,
      });

      await User.create({
        name: 'INVENTORY DEMO',
        email: 'inventory@sibis.com',
        role: 'Inventory Staff',
        storeId: store._id,
        password: 'password123',
        isActive: true,
      });

      console.log('[Auto-Seed] Default demo store accounts created for owner, manager, cashier, inventory.');
    }
  } catch (err) {
    console.error('[Auto-Seed Error]', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sibis');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await autoSeedDefaults();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
