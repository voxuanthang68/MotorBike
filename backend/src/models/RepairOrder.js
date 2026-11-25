const mongoose = require('mongoose');

const repairOrderSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  damageReport: { type: mongoose.Schema.Types.ObjectId, ref: 'DamageReport' },
  damageReportCode: String,
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookingCode: { type: String, default: '' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleCode: String,
  vehicleName: { type: String, required: true },
  licensePlate: { type: String, required: true },
  vehicleOdo: { type: Number, default: 0 },
  vehicleType: String,
  vehicleColor: String,
  vehicleImage: String,
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  issueSummary: { type: String, default: '' },
  proposedSolution: { type: String, required: true },
  parts: [mongoose.Schema.Types.Mixed],
  totalPartsPrice: { type: Number, default: 0 },
  totalLaborFee: { type: Number, default: 0 },
  totalEstimatedCost: { type: Number, default: 0 },
  actualCost: Number,
  status: {
    type: String,
    enum: [
      'waiting_quote',
      'waiting_approval',
      'customer_approved',
      'in_progress',
      'waiting_acceptance',
      'completed',
      'customer_rejected'
    ],
    default: 'waiting_quote'
  },
  progressPercent: { type: Number, default: 10 },
  customerFeedbackDate: String,
  customerFeedbackNote: String,
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianName: { type: String, default: '' },
  technicianNotes: { type: String, default: '' },
  damageItems: [mongoose.Schema.Types.Mixed],
  beforePhotos: [String],
  afterPhotos: [String],
  replacementPhotos: [String],
  completionNotes: String,
  logs: [mongoose.Schema.Types.Mixed],
  stockDeducted: { type: Boolean, default: false },
  completedAt: String
}, { timestamps: true });

module.exports = mongoose.model('RepairOrder', repairOrderSchema);
