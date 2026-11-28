const mongoose = require('mongoose');

const qrPaymentSessionSchema = new mongoose.Schema({
  sessionCode: { type: String, unique: true, required: true, index: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['deposit', 'rental_fee', 'late_fee', 'damage_fee', 'refund', 'other'],
    default: 'rental_fee'
  },
  amount: { type: Number, required: true, min: 1 },
  transferContent: { type: String, required: true },
  qrUrl: { type: String, required: true },
  fallbackQrDataUrl: { type: String },
  status: {
    type: String,
    enum: ['active', 'expired', 'paid', 'superseded'],
    default: 'active'
  },
  ttlSeconds: { type: Number, default: 30 },
  expiresAt: { type: Date, required: true },
  paidAt: { type: Date },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

module.exports = mongoose.model('QrPaymentSession', qrPaymentSessionSchema);

