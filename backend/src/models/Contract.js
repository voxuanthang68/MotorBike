const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractCode: { type: String, unique: true },
  booking: { type: mongoose.Schema.Types.Mixed, ref: 'Booking', required: false },
  customer: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: false },
  vehicle: { type: mongoose.Schema.Types.Mixed, ref: 'Vehicle', required: false },
  driver: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: false },
  // Customer info at time of contract
  customerInfo: {
    fullName: String,
    birthYear: String,
    cccd: String,
    cccdIssueDate: String,
    cccdIssuePlace: String,
    drivingLicense: String,
    drivingLicenseClass: String,
    licenseExpiryDate: String,
    phone: String,
    address: String,
    tempAddress: String,
    email: String
  },
  // Vehicle info at time of contract
  vehicleInfo: {
    name: { type: String },
    licensePlate: { type: String },
    brand: { type: String },
    model: { type: String },
    type: { type: String },
    color: { type: String },
    engineNumber: { type: String },
    chassisNumber: { type: String }
  },
  // Terms
  startDate: Date,
  endDate: Date,
  actualReturnDate: Date,
  rentalDays: Number,
  rentalType: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
  rentalMonths: Number,
  pricePerDay: Number,
  monthlyPrice: Number,
  totalRentalFee: Number,
  serviceFee: { type: Number, default: 0 },
  accessories: [{ name: String, price: Number }],
  couponCode: String,
  depositAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPayable: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  paymentMethod: String,
  termsAndConditions: { type: String },
  // Signatures
  customerSignature: String, // base64 PNG
  staffSignature: String,    // base64 PNG
  customerSignedAt: Date,
  staffSignedAt: Date,
  signedByStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Handover / Giao xe (Check-in)
  checkInTime: Date,
  checkInOdometer: Number,
  checkInNote: String,
  checkInImages: [{ url: String, caption: String }],
  checkInCustomerSignature: String,
  checkInStaffSignature: String,
  // Return / Trả xe (Check-out)
  checkOutTime: Date,
  checkOutOdometer: Number,
  checkOutNote: String,
  checkOutImages: [{ url: String, caption: String }],
  checkOutCustomerSignature: String,
  checkOutStaffSignature: String,
  // Additional fees
  lateFee: { type: Number, default: 0 },
  damageFee: { type: Number, default: 0 },
  fuelFee: { type: Number, default: 0 },
  // Contract file
  pdfUrl: String,
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_signature', 'pending_approval', 'confirmed', 'active', 'completed', 'terminated', 'cancelled'],
    default: 'draft'
  },
  createdBy: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  notes: String,
}, { timestamps: true });

contractSchema.pre('save', function() {
  if (!this.contractCode) {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 900 + 100);
    this.contractCode = `HD${timestamp}${random}`;
  }
});

module.exports = mongoose.model('Contract', contractSchema);
