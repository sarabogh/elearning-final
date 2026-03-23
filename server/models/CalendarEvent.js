const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  startAt: {
    type: Date,
    required: true
  },
  endAt: {
    type: Date,
    default: null
  },
  color: {
    type: String,
    default: '#2f855a'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

calendarEventSchema.index({ user: 1, startAt: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
