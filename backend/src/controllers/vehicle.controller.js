const Vehicle = require('../models/Vehicle');
const qrcode = require('qrcode');

// @GET /api/vehicles
exports.getAll = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 12, minPrice, maxPrice } = req.query;
    const query = { isActive: true };
    if (status) query.status = status;
    if (type) query.type = type;
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const stats = await Vehicle.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: vehicles,
      stats,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/vehicles/:id
exports.getById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('createdBy', 'fullName');
    if (!vehicle) return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/vehicles
exports.create = async (req, res) => {
  try {
    const vehicleData = { ...req.body, createdBy: req.user._id };
    if (req.files && req.files.length > 0) {
      vehicleData.images = req.files.map((f, i) => ({
        url: `/uploads/vehicles/${f.filename}`,
        caption: req.body[`caption_${i}`] || ''
      }));
      vehicleData.mainImage = vehicleData.images[0].url;
    }

    const vehicle = await Vehicle.create(vehicleData);
    
    // Generate QR code
    const qrData = `${process.env.FRONTEND_URL}/vehicles/${vehicle._id}`;
    const qrCodeUrl = await qrcode.toDataURL(qrData);
    vehicle.qrCode = qrCodeUrl;
    await vehicle.save();

    res.status(201).json({ success: true, message: 'Thêm xe thành công.', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/vehicles/:id
exports.update = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f, i) => ({
        url: `/uploads/vehicles/${f.filename}`,
        caption: req.body[`caption_${i}`] || ''
      }));
      updateData.$push = { images: { $each: newImages } };
      delete updateData.images;
    }

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
    res.json({ success: true, message: 'Cập nhật xe thành công.', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/vehicles/:id (soft delete)
exports.remove = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
    res.json({ success: true, message: 'Đã xóa xe.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/vehicles/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
    res.json({ success: true, message: 'Cập nhật trạng thái xe thành công.', data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
