const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const qrcode = require('qrcode');

// @GET /api/vehicles
exports.getAll = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 12, minPrice, maxPrice } = req.query;
    const baseQuery = { isActive: { $ne: false } };
    if (type) baseQuery.type = type;
    if (minPrice || maxPrice) {
      baseQuery.pricePerDay = {};
      if (minPrice) baseQuery.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) baseQuery.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } }
      ];
    }

    const query = { ...baseQuery };
    if (status) query.status = status;

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const bookingSummaries = await Booking.aggregate([
      {
        $match: {
          $or: [
            { status: 'active' },
            { status: 'confirmed', endDate: { $gte: new Date() } },
            {
              status: 'pending',
              endDate: { $gte: new Date() },
              $or: [
                { bookingSource: { $ne: 'online' } },
                { paymentStatus: { $in: ['deposit_paid', 'fully_paid'] } }
              ]
            }
          ]
        }
      },
      { $group: {
        _id: '$vehicle',
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        booked: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      } }
    ]);
    const bookingMap = new Map(bookingSummaries.map(item => [String(item._id), item]));
    const enrichedVehicles = vehicles.map(vehicle => {
      const summary = bookingMap.get(String(vehicle._id));
      let availability = 'available';
      if (vehicle.status === 'rented' || summary?.active > 0) availability = 'rented';
      else if (summary?.pending > 0) availability = 'pending_confirmation';
      else if (summary?.booked > 0) availability = 'booked';
      else if (vehicle.status !== 'available') availability = vehicle.status;
      return { ...vehicle.toObject(), availability, bookingSummary: summary || { pending: 0, booked: 0, active: 0 } };
    });

    const stats = await Vehicle.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: enrichedVehicles,
      stats,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public catalog availability: customers only receive vehicles that can be safely offered for booking.
exports.getPublicCatalog = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: { $ne: false } }).select('_id name brand model year type engineCC pricePerDay pricePerMonth deposit description location images mainImage licensePlate status');
    const summaries = await Booking.aggregate([
      {
        $match: {
          $or: [
            { status: 'active' },
            { status: 'confirmed', endDate: { $gte: new Date() } },
            {
              status: 'pending',
              endDate: { $gte: new Date() },
              $or: [
                { bookingSource: { $ne: 'online' } },
                { paymentStatus: { $in: ['deposit_paid', 'fully_paid'] } }
              ]
            }
          ]
        }
      },
      { $group: { _id: '$vehicle', pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }, booked: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } }
    ]);
    const summaryMap = new Map(summaries.map(item => [String(item._id), item]));
    const data = vehicles.map(vehicle => {
      const summary = summaryMap.get(String(vehicle._id));
      const availability = vehicle.status === 'rented' || summary?.active > 0 ? 'rented' : summary?.pending > 0 ? 'pending_confirmation' : summary?.booked > 0 ? 'booked' : vehicle.status;
      return { ...vehicle.toObject(), availability };
    });
    res.json({ success: true, data, updatedAt: new Date() });
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
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng thêm ít nhất một hình ảnh xe.' });
    }
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
