const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingSource: { type: String, enum: ['online', 'walk_in'], default: 'online' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  pickupLocation: { type: String, default: 'Cửa hàng chính' },
  returnLocation: { type: String, default: 'Cửa hàng chính' },
  totalDays: { type: Number },
  rentalType: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
  rentalMonths: { type: Number, default: 0 },
  monthlyPrice: { type: Number, default: 0 },
  pricePerDay: { type: Number },
  totalPrice: { type: Number },
  priceBeforeDiscount: { type: Number },
  serviceFee: { type: Number, default: 0 },
  packageDiscount: { type: Number, default: 0 },
  couponCode: String,
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
    enum: ['cash', 'bank_transfer', 'qr', 'momo', 'vnpay'],
    default: 'cash'
  },
  // Check-in
  checkInTime: Date,
  checkInOdometer: Number,
  checkInNote: String,
  checkInImages: [{ url: String, caption: String }],
  checkInSignature: String, // Staff
  checkInCustomerSignature: String, // Customer
  checkInStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Check-out
  checkOutTime: Date,
  checkOutOdometer: Number,
  checkOutNote: String,
  checkOutImages: [{ url: String, caption: String }],
  checkOutSignature: String, // Staff
  checkOutCustomerSignature: String, // Customer
  checkOutStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Return to technician workflow
  returnStatus: {
    type: String,
    enum: ['not_returned', 'customer_returned', 'tech_accepted', 'inspected'],
    default: 'not_returned'
  },
  customerReturnedAt: Date,
  customerReturnNote: String,
  techAcceptedAt: Date,
  techAcceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Additional charges
  lateFee: { type: Number, default: 0 },
  damageFee: { type: Number, default: 0 },
  fuelFee: { type: Number, default: 0 },
  // Notes
  customerNote: String,
  accessories: [{ name: String, price: Number }],
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
    if (this.priceBeforeDiscount === undefined) {
      const rentalTotal = this.rentalType === 'monthly'
        ? (this.rentalMonths || Math.max(1, Math.ceil(this.totalDays / 30))) * (this.monthlyPrice || 0)
        : this.totalDays * (this.pricePerDay || 0);
      this.totalPrice = rentalTotal + (this.serviceFee || 0);
    } else {
      this.totalPrice = this.priceBeforeDiscount;
    }
    const extraFees = (Number(this.lateFee) || 0) + (Number(this.damageFee) || 0) + (Number(this.fuelFee) || 0);
    this.finalPrice = Math.max(0, this.totalPrice - (this.discountAmount || 0) + extraFees);
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
