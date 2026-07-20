const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    userRole: {
      type: String,
      required: [true, 'User role is required'],
      trim: true,
    },
    actionCategory: {
      type: String,
      required: [true, 'Action category is required'],
      enum: {
        values: ['POS Sale', 'Inventory Stock', 'Purchase Order', 'Staff Management', 'System Event'],
        message: '{VALUE} is not a valid action category',
      },
    },
    actionDescription: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
