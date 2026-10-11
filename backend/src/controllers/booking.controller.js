const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

// @GET /api/bookings
exports.getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search, startDate, endDate, customerId } = req.query;
    const query = {};

    // Customers only see own bookings
    if (req.user.role === 'customer') query.customer = req.user._id;
    else if (customerId) query.customer = customerId;

    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    if (search) query.bookingCode = { $regex: search, $options: 'i' };

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customer', 'fullName email phone avatar')
      .populate('vehicle', 'name brand licensePlate mainImage pricePerDay')
      .populate('assignedReceptionist', 'fullName')
      .populate('assignedTechnician', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/bookings/:id
exports.getById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'fullName email phone avatar cccd drivingLicense address')
      .populate('vehicle')
      .populate('assignedReceptionist', 'fullName email phone')
      .populate('assignedTechnician', 'fullName email phone')
      .populate('checkInStaff', 'fullName')
      .populate('checkOutStaff', 'fullName');

    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt xe.' });

    // Customer can only see own booking
    if (req.user.role === 'customer' && booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem đặt xe này.' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/bookings - Create booking
exports.create = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate, pickupLocation, returnLocation, customerNote, paymentMethod } = req.body;

    // Check vehicle availability
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Không tìm thấy xe.' });
    if (vehicle.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Xe không khả dụng trong thời gian này.' });
    }

    // Check overlapping bookings
    const conflicting = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(endDate) } }
      ]
    });
    if (conflicting) {
      return res.status(400).json({ success: false, message: 'Xe đã được đặt trong khoảng thời gian này.' });
    }

    const customerId = req.user.role === 'customer' ? req.user._id : req.body.customerId;

    const booking = await Booking.create({
      customer: customerId,
      vehicle: vehicleId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pickupLocation,
      returnLocation,
      pricePerDay: vehicle.pricePerDay,
      deposit: vehicle.deposit,
      customerNote,
      paymentMethod,
      assignedReceptionist: req.user.role === 'receptionist' ? req.user._id : undefined,
      status: req.user.role === 'customer' ? 'pending' : 'confirmed'
    });

    // Notify staff
    await Notification.create({
      recipient: customerId,
      title: 'Đặt xe thành công!',
      message: `Yêu cầu thuê xe ${vehicle.name} từ ${new Date(startDate).toLocaleDateString('vi-VN')} đến ${new Date(endDate).toLocaleDateString('vi-VN')} đã được ghi nhận.`,
      type: 'booking',
      link: `/bookings/${booking._id}`
    });

    res.status(201).json({
      success: true,
      message: 'Đặt xe thành công!',
      data: await booking.populate('vehicle', 'name brand licensePlate mainImage')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/bookings/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt xe.' });

    booking.status = status;
    if (cancelReason) {
      booking.cancelReason = cancelReason;
      booking.cancelledBy = req.user._id;
    }
    if (status === 'confirmed') {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'rented' });
    }
    if (status === 'completed' || status === 'cancelled') {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available' });
    }
    await booking.save();

    res.json({ success: true, message: 'Cập nhật trạng thái thành công.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/bookings/:id/checkin
exports.checkIn = async (req, res) => {
  try {
    const { checkInOdometer, checkInNote, checkInSignature } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt xe.' });

    booking.checkInTime = new Date();
    booking.checkInOdometer = checkInOdometer;
    booking.checkInNote = checkInNote;
    booking.checkInSignature = checkInSignature;
    booking.checkInStaff = req.user._id;
    booking.status = 'active';

    if (req.files) {
      booking.checkInImages = req.files.map(f => ({
        url: `/uploads/bookings/${f.filename}`,
        caption: 'Check-in'
      }));
    }

    await booking.save();
    await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'rented' });

    res.json({ success: true, message: 'Check-in thành công.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/bookings/:id/checkout
exports.checkOut = async (req, res) => {
  try {
    const { checkOutOdometer, checkOutNote, checkOutSignature, lateFee, damageFee, fuelFee } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt xe.' });

    booking.checkOutTime = new Date();
    booking.checkOutOdometer = checkOutOdometer;
    booking.checkOutNote = checkOutNote;
    booking.checkOutSignature = checkOutSignature;
    booking.checkOutStaff = req.user._id;
    booking.lateFee = lateFee || 0;
    booking.damageFee = damageFee || 0;
    booking.fuelFee = fuelFee || 0;
    booking.status = 'completed';

    if (req.files) {
      booking.checkOutImages = req.files.map(f => ({
        url: `/uploads/bookings/${f.filename}`,
        caption: 'Check-out'
      }));
    }

    await booking.save();
    await Vehicle.findByIdAndUpdate(booking.vehicle, { 
      status: 'available',
      odometer: checkOutOdometer 
    });

    res.json({ success: true, message: 'Check-out thành công.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
