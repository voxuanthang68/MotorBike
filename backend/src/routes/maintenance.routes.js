const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

// GET all
router.get('/', async (req, res) => {
  try {
    const { vehicleId, status, type, page = 1, limit = 10 } = req.query;
    const query = {};
    if (vehicleId) query.vehicle = vehicleId;
    if (status) query.status = status;
    if (type) query.type = type;

    const records = await Maintenance.find(query)
      .populate('vehicle', 'name licensePlate brand isActive')
      .populate('technician', 'fullName phone')
      .sort({ scheduledDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const activeRecords = records.filter(r => !r.vehicle || r.vehicle.isActive !== false);

    res.json({ success: true, data: activeRecords, pagination: { total: activeRecords.length, page: Number(page), pages: Math.ceil(activeRecords.length / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE
router.post('/', authorize('owner', 'admin', 'technician'), upload.array('images', 5), async (req, res) => {
  try {
    const data = {
      ...req.body,
      technician: req.user._id,
      title: req.body.title || 'Phiếu kiểm tra an toàn kỹ thuật',
      odometerAtMaintenance: req.body.odometerAtMaintenance || req.body.odometer || 0
    };
    if (req.files?.length > 0) {
      data.images = req.files.map(f => ({ url: `/uploads/maintenance/${f.filename}`, caption: '' }));
    }
    const record = await Maintenance.create(data);
    if (data.status === 'in_progress' || data.status === 'scheduled') {
      await Vehicle.findByIdAndUpdate(data.vehicle, { status: 'maintenance' });
    }
    res.status(201).json({ success: true, message: 'Tạo lịch bảo trì thành công.', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE
router.put('/:id', authorize('owner', 'admin', 'technician'), upload.array('images', 5), async (req, res) => {
  try {
    const { technicianSignature, ...updateData } = req.body;
    if (technicianSignature) updateData.technicianSignature = technicianSignature;
    if (req.files?.length > 0) {
      updateData.$push = { images: { $each: req.files.map(f => ({ url: `/uploads/maintenance/${f.filename}`, caption: '' })) } };
    }
    if (updateData.status === 'completed') {
      updateData.completedDate = new Date();
      const record = await Maintenance.findById(req.params.id);
      if (record) {
        await Vehicle.findByIdAndUpdate(record.vehicle, { 
          status: 'available',
          lastMaintenanceDate: new Date(),
          nextMaintenanceDate: updateData.nextMaintenanceDate 
        });
      }
    }
    const record = await Maintenance.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, message: 'Cập nhật bảo trì thành công.', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
