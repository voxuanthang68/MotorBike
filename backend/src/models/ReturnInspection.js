const mongoose = require('mongoose');

const returnInspectionSchema = new mongoose.Schema({
  inspectionCode: { type: String, required: true, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  bookingCode: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  customerIdCard: { type: String, default: '' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  vehicleName: { type: String, required: true },
  licensePlate: { type: String, required: true },
  vehicleImage: String,
  rentalStartDate: String,
  rentalEndDate: String,
  returnDate: String,
  deliveryOdometer: { type: Number, default: 0 },
  returnOdometer: { type: Number, default: 0 },
  fuelLevel: { type: Number, default: 100 },
  deliveryImages: [String],
  returnImages: [String],
  checklist: [mongoose.Schema.Types.Mixed],
  pins: [mongoose.Schema.Types.Mixed],
  brakes: { type: Boolean, default: true },
  tires: { type: Boolean, default: true },
  lightsAndHorn: { type: Boolean, default: true },
  engine: { type: Boolean, default: true },
  mirrorsAndBody: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['draft', 'pending_inspection', 'passed', 'damaged'],
    default: 'draft'
  },
  notes: { type: String, default: '' },
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspectorName: { type: String, default: '' },
  hasDamageReport: { type: Boolean, default: false },
  damageReport: { type: mongoose.Schema.Types.ObjectId, ref: 'DamageReport' }
}, { timestamps: true });

module.exports = mongoose.model('ReturnInspection', returnInspectionSchema);
