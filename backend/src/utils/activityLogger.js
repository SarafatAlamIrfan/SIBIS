const ActivityLog = require('../models/ActivityLog');

/**
 * Helper to log a store activity with member name and role
 */
const logActivity = async ({ storeId, user, actionCategory, actionDescription, details }) => {
  try {
    if (!storeId || !user) return;

    await ActivityLog.create({
      storeId,
      performedBy: user._id,
      userName: user.name || 'Unknown User',
      userRole: user.role || 'Staff',
      actionCategory,
      actionDescription,
      details: details || {},
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
