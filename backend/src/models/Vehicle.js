const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  licensePlate: { type: String, required: true, unique: true, uppercase: true },
  color: { type: String, required: true },
  type: {
    type: String,
    enum: ['scooter', 'semi-automatic', 'manual', 'sport', 'electric', 'clutch'],
    default: 'scooter'
  },
  engineCC: { type: Number },
  pricePerDay: { type: Number, required: true },
  pricePerHour: { type: Number },
  deposit: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'broken', 'retired'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  odometer: { type: Number, default: 0 },
  fuelType: {
    type: String,
    enum: ['gasoline', 'electric', 'hybrid'],
    default: 'gasoline'
  },
  images: [{ 
    url: String, 
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  mainImage: { type: String },
  description: { type: String },
  features: [String],
  qrCode: { type: String },
  location: { type: String, default: 'Kho chính' },
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
