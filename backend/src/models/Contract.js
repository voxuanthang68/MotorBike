const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractCode: { type: String, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  // Customer info at time of contract
  customerInfo: {
    fullName: String,
    cccd: String,
    drivingLicense: String,
    phone: String,
    address: String,
    email: String
  },
  // Vehicle info at time of contract
  vehicleInfo: {
    name: String,
    licensePlate: String,
    brand: String,
    model: String,
    color: String
  },
  // Terms
  startDate: Date,
  endDate: Date,
  rentalDays: Number,
  pricePerDay: Number,
  totalRentalFee: Number,
  depositAmount: Number,
  discountAmount: { type: Number, default: 0 },
  totalPayable: Number,
  paymentMethod: String,
  termsAndConditions: { type: String },
  // Signatures
  customerSignature: String, // base64 PNG
  staffSignature: String,    // base64 PNG
  customerSignedAt: Date,
  staffSignedAt: Date,
  signedByStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Contract file
  pdfUrl: String,
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'active', 'completed', 'terminated'],
    default: 'draft'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
}, { timestamps: true });

contractSchema.pre('save', function() {
  if (!this.contractCode) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    this.contractCode = `HD${timestamp}${random}`;
  }
});

module.exports = mongoose.model('Contract', contractSchema);
