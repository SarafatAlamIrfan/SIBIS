const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    changeType: {
      type: String,
      required: [true, 'Change type is required'],
      enum: {
        values: ['Sale', 'Purchase', 'Stock In', 'Stock Out', 'Manual Adjustment'],
        message: '{VALUE} is not a valid inventory change type',
      },
    },
    quantityChanged: {
      type: Number,
      required: [true, 'Quantity changed is required'],
    },
    previousStock: {
      type: Number,
      required: [true, 'Previous stock level is required'],
      min: [0, 'Previous stock cannot be negative'],
    },
    newStock: {
      type: Number,
      required: [true, 'New stock level is required'],
      min: [0, 'New stock cannot be negative'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false, // Inventory log is immutable history, no updatedAt needed
    },
  }
);

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
