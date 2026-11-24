const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  role: { type: String, enum: ['owner', 'admin', 'technician', 'support', 'accountant', 'receptionist', 'customer'], required: true },
  module: { type: String, required: true },
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { timestamps: true });

permissionSchema.index({ role: 1, module: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
