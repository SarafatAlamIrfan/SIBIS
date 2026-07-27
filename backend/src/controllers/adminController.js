const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const PlatformLog = require('../models/PlatformLog');
const ActivityLog = require('../models/ActivityLog');

// Helper: write a platform-level log entry
const logPlatformEvent = async ({ actor, eventCategory, eventDescription, affectedStore, details }) => {
  try {
    await PlatformLog.create({
      performedBy: actor?._id || null,
      actorName: actor?.name || 'System',
      actorRole: actor?.role || 'System',
      eventCategory,
      eventDescription,
      affectedStoreId: affectedStore?._id || null,
      affectedStoreName: affectedStore?.name || null,
      details: details || {},
    });
  } catch (err) {
    console.error('[PlatformLog] Failed to write platform log:', err.message);
  }
};

// @desc    Get all registered stores with aggregate metrics
// @route   GET /api/admin/stores
// @access  Private (System Admin)
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate('ownerId', 'name email phone role')
      .sort({ createdAt: -1 });

    // Enhance store objects with product counts & total sales metrics
    const enhancedStores = await Promise.all(
      stores.map(async (store) => {
        const productCount = await Product.countDocuments({ storeId: store._id });
        const salesData = await Sale.aggregate([
          { $match: { storeId: store._id } },
          { $group: { _id: null, totalVolume: { $sum: '$totalAmount' }, salesCount: { $sum: 1 } } },
        ]);

        const totalVolume = salesData.length > 0 ? salesData[0].totalVolume : 0;
        const salesCount = salesData.length > 0 ? salesData[0].salesCount : 0;

        return {
          ...store.toObject(),
          productCount,
          salesCount,
          totalVolume,
        };
      })
    );

    res.status(200).json(enhancedStores);
  } catch (error) {
    console.error('Error fetching stores:', error.message);
    res.status(500).json({ error: 'Failed to fetch registered stores.' });
  }
};

// @desc    Register a new store and owner account
// @route   POST /api/admin/stores
// @access  Private (System Admin)
const createStore = async (req, res) => {
  try {
    const { name, ownerName, ownerEmail, ownerPassword, phone, address, city, country, businessType, subscriptionPlan } = req.body;

    if (!name || !ownerEmail || !ownerPassword || !ownerName || !city || !country) {
      return res.status(400).json({ error: 'Store name, owner name, owner email, password, city, and country are required.' });
    }

    // Check if user email already exists
    const existingUser = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Owner email address is already registered.' });
    }

    // Create the Store first
    const store = new Store({
      name,
      email: ownerEmail.toLowerCase(),
      phone: phone || '',
      address: address || '',
      city: city.trim(),
      country: country.trim(),
      businessType: businessType || 'General Retail',
      subscriptionPlan: subscriptionPlan || 'Pro',
      status: 'Active',
    });

    await store.save();

    // Create the Owner User account linked to the Store
    const ownerUser = new User({
      name: ownerName,
      email: ownerEmail.toLowerCase(),
      password: ownerPassword,
      role: 'Owner',
      storeId: store._id,
    });

    await ownerUser.save();

    // Update store ownerId reference
    store.ownerId = ownerUser._id;
    await store.save();

    // Log platform event: new store registered by admin
    await logPlatformEvent({
      actor: req.user,
      eventCategory: 'Store Registration',
      eventDescription: `Admin registered new store "${name}" for owner ${ownerName} (${ownerEmail}) in ${city}, ${country}`,
      affectedStore: store,
      details: { ownerName, ownerEmail, city, country, businessType, subscriptionPlan },
    });

    const populatedStore = await Store.findById(store._id).populate('ownerId', 'name email phone role');

    res.status(201).json({
      message: 'Store & Owner account created successfully.',
      store: {
        ...populatedStore.toObject(),
        productCount: 0,
        salesCount: 0,
        totalVolume: 0,
      },
    });
  } catch (error) {
    console.error('Error creating store:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create new store.' });
  }
};

// @desc    Toggle Store Active/Suspended Status
// @route   PUT /api/admin/stores/:id/status
// @access  Private (System Admin)
const toggleStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const previousStatus = store.status;

    if (status && ['Active', 'Suspended', 'Trial'].includes(status)) {
      store.status = status;
    } else {
      store.status = store.status === 'Active' ? 'Suspended' : 'Active';
    }

    await store.save();

    // Log platform event: store status changed
    await logPlatformEvent({
      actor: req.user,
      eventCategory: 'Store Status Change',
      eventDescription: `Store "${store.name}" status changed from ${previousStatus} → ${store.status}`,
      affectedStore: store,
      details: { previousStatus, newStatus: store.status },
    });

    res.status(200).json({
      message: `Store status updated to ${store.status}`,
      store,
    });
  } catch (error) {
    console.error('Error updating store status:', error.message);
    res.status(500).json({ error: 'Failed to update store status.' });
  }
};

// @desc    Get Platform-wide Analytics & Stats
// @route   GET /api/admin/stats
// @access  Private (System Admin)
const getPlatformStats = async (req, res) => {
  try {
    const totalStores = await Store.countDocuments();
    const activeStores = await Store.countDocuments({ status: 'Active' });
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    const salesAggregate = await Sale.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalSales: { $sum: 1 } } },
    ]);

    const totalRevenue = salesAggregate.length > 0 ? salesAggregate[0].totalRevenue : 0;
    const totalSalesCount = salesAggregate.length > 0 ? salesAggregate[0].totalSales : 0;

    res.status(200).json({
      totalStores,
      activeStores,
      totalProducts,
      totalUsers,
      totalRevenue,
      totalSalesCount,
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch platform stats.' });
  }
};

// @desc    Get platform-level activity log (admin only)
// @route   GET /api/admin/platform-logs
// @access  Private (System Admin)
const getPlatformLogs = async (req, res) => {
  try {
    const logs = await PlatformLog.find()
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching platform logs:', error.message);
    res.status(500).json({ error: 'Failed to fetch platform activity logs.' });
  }
};

// @desc    Get ALL staff create/delete logs across all stores (admin only)
// @route   GET /api/admin/staff-logs
// @access  Private (System Admin)
const getStaffLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ actionCategory: 'Staff Management' })
      .populate('storeId', 'name code city')
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching staff logs:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff activity logs.' });
  }
};

module.exports = {
  getAllStores,
  createStore,
  toggleStoreStatus,
  getPlatformStats,
  getPlatformLogs,
  getStaffLogs,
};
