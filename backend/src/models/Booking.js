const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  pickupLocation: { type: String, default: 'Cửa hàng chính' },
  returnLocation: { type: String, default: 'Cửa hàng chính' },
  totalDays: { type: Number },
  pricePerDay: { type: Number },
  totalPrice: { type: Number },
  deposit: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  finalPrice: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'overdue'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'deposit_paid', 'fully_paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'momo', 'vnpay'],
    default: 'cash'
  },
  // Check-in
  checkInTime: Date,
  checkInOdometer: Number,
  checkInNote: String,
  checkInImages: [{ url: String, caption: String }],
  checkInSignature: String, // base64
  checkInStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Check-out
  checkOutTime: Date,
  checkOutOdometer: Number,
  checkOutNote: String,
  checkOutImages: [{ url: String, caption: String }],
  checkOutSignature: String,
  checkOutStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Additional charges
  lateFee: { type: Number, default: 0 },
  damageFee: { type: Number, default: 0 },
  fuelFee: { type: Number, default: 0 },
  // Notes
  customerNote: String,
  staffNote: String,
  // Assigned staff
  assignedReceptionist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

bookingSchema.pre('save', function() {
  if (!this.bookingCode) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingCode = `BK${timestamp}${random}`;
  }
  if (this.startDate && this.endDate) {
    const diff = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
    this.totalDays = Math.ceil(diff) || 1;
    this.totalPrice = this.totalDays * (this.pricePerDay || 0);
    this.finalPrice = this.totalPrice - (this.discountAmount || 0);
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
