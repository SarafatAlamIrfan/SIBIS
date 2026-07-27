const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU/Barcode is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock level is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    minStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Threshold cannot be negative'],
    },
    expirationDate: {
      type: Date,
    },

    // ─── Discount fields ──────────────────────────────────────────
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'fixed'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative'],
    },
    discountLabel: {
      type: String,
      trim: true,
      default: '',
    },
    discountExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: compute final effective price after discount
productSchema.virtual('effectivePrice').get(function () {
  const now = new Date();
  // If discount has expired, use base selling price
  if (this.discountExpiry && new Date(this.discountExpiry) < now) {
    return this.sellingPrice;
  }
  if (this.discountType === 'percentage' && this.discountValue > 0) {
    const discount = this.sellingPrice * (this.discountValue / 100);
    return Math.max(0, parseFloat((this.sellingPrice - discount).toFixed(2)));
  }
  if (this.discountType === 'fixed' && this.discountValue > 0) {
    return Math.max(0, parseFloat((this.sellingPrice - this.discountValue).toFixed(2)));
  }
  return this.sellingPrice;
});

// Virtual: is discount currently active?
productSchema.virtual('isDiscountActive').get(function () {
  if (this.discountType === 'none' || this.discountValue <= 0) return false;
  if (this.discountExpiry && new Date(this.discountExpiry) < new Date()) return false;
  return true;
});

module.exports = mongoose.model('Product', productSchema);
