const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  priceAtSale: {
    type: Number,
    required: [true, 'Price at sale is required'],
    min: [0, 'Price cannot be negative'],
  },
  purchasePriceAtSale: {
    type: Number,
    required: [true, 'Purchase price at sale is required'],
    min: [0, 'Purchase price cannot be negative'],
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
    },
    cashierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cashier reference is required'],
    },
    items: [saleItemSchema],
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['Cash', 'Card', 'Mobile Pay', 'Split'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['Paid', 'Pending'],
        message: '{VALUE} is not a valid payment status',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sale', saleSchema);
