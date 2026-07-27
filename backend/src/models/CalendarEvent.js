const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    type: {
      type: String,
      enum: ['custom', 'expiry', 'holiday', 'weather', 'reorder'],
      default: 'custom',
    },
    color: {
      type: String,
      default: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 hover:bg-indigo-500/20 dark:text-indigo-400',
    },
    googleEventId: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
