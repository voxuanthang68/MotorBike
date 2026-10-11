const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['booking', 'payment', 'maintenance', 'ticket', 'system', 'alert'],
    default: 'system'
  },
  isRead: { type: Boolean, default: false },
  link: String,
  data: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
