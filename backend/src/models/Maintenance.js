const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type: {
    type: String,
    enum: ['routine', 'repair', 'inspection', 'emergency'],
    default: 'routine'
  },
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  scheduledDate: Date,
  startDate: Date,
  completedDate: Date,
  odometerAtMaintenance: Number,
  cost: { type: Number, default: 0 },
  partsReplaced: [{ name: String, cost: Number, quantity: Number }],
  notes: String,
  images: [{ url: String, caption: String }],
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicianSignature: String,
  nextMaintenanceDate: Date,
  nextMaintenanceOdometer: Number,
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
