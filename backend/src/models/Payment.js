const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentCode: { type: String, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['deposit', 'rental_fee', 'late_fee', 'damage_fee', 'refund', 'other'],
    required: true
  },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'qr', 'momo', 'vnpay', 'zalo_pay'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  note: String,
  referenceNumber: String, // Bank transfer reference
  qrSession: { type: mongoose.Schema.Types.ObjectId, ref: 'QrPaymentSession' },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transactionDate: { type: Date, default: Date.now },
}, { timestamps: true });

paymentSchema.pre('save', function() {
  if (!this.paymentCode) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    this.paymentCode = `TT${timestamp}${random}`;
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
