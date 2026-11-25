const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  inspection: { type: mongoose.Schema.Types.ObjectId, ref: 'ReturnInspection' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  bookingCode: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleName: { type: String, required: true },
  licensePlate: { type: String, required: true },
  reportedAt: String,
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspectorName: { type: String, default: '' },
  positions: [mongoose.Schema.Types.Mixed],
  overallSeverity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'repair_proposed'],
    default: 'confirmed'
  },
  repairOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairOrder' },
  customerAgreedSignature: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DamageReport', damageReportSchema);
