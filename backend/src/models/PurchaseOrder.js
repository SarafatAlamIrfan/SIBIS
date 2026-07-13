const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  quantityOrdered: {
    type: Number,
    required: [true, 'Ordered quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative'],
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      required: [true, 'Purchase order number is required'],
      unique: true,
      trim: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
    },
    items: [poItemSchema],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    status: {
      type: String,
      required: [true, 'PO status is required'],
      enum: {
        values: ['Ordered', 'Received', 'Cancelled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Ordered',
    },
    orderedDate: {
      type: Date,
      default: Date.now,
    },
    receivedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
