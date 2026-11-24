const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketCode: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['vehicle_issue', 'rescue', 'breakdown', 'payment', 'service', 'complaint', 'extension', 'deposit', 'general', 'other'],
    default: 'vehicle_issue'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  attachments: [{ url: String }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    attachments: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  hasUnreadCustomerMessage: { type: Boolean, default: false },
  hasUnreadStaffMessage: { type: Boolean, default: false },
  lastMessageAt: { type: Date, default: Date.now },
  lastSenderRole: { type: String, default: 'customer' },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
}, { timestamps: true });

ticketSchema.pre('save', function() {
  if (!this.ticketCode) {
    const timestamp = Date.now().toString().slice(-6);
    this.ticketCode = `TK${timestamp}`;
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
