const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      default: 'General Retail',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Trial'],
      default: 'Active',
    },
    subscriptionPlan: {
      type: String,
      enum: ['Starter', 'Pro', 'Enterprise'],
      default: 'Pro',
    },
  },
  {
    timestamps: true,
  }
);

// Auto generate code if not provided
storeSchema.pre('save', function (next) {
  if (!this.code && this.name) {
    const cleanName = this.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.code = `STR-${cleanName}-${randomNum}`;
  }
  next();
});

module.exports = mongoose.model('Store', storeSchema);
