const mongoose = require('mongoose');

const platformLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorName: {
      type: String,
      trim: true,
      default: 'System',
    },
    actorRole: {
      type: String,
      trim: true,
      default: 'System',
    },
    eventCategory: {
      type: String,
      required: [true, 'Event category is required'],
      enum: {
        values: [
          'Store Registration',
          'Store Status Change',
          'Admin Action',
          'Platform System',
        ],
        message: '{VALUE} is not a valid platform event category',
      },
    },
    eventDescription: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    // Optional reference to the affected store
    affectedStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    affectedStoreName: {
      type: String,
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

module.exports = mongoose.model('PlatformLog', platformLogSchema);
