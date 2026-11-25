const mongoose = require('mongoose');

const sparePartSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, default: 'Phụ tùng chung' },
  unitPrice: { type: Number, required: true, default: 0 },
  laborFee: { type: Number, default: 0 },
  warranty: { type: String, default: '6 tháng' },
  stock: { type: Number, default: 0 },
  compatible: { type: String, default: 'Đa dòng xe' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SparePart', sparePartSchema);
