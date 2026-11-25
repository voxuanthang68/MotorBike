const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Contract = require('../models/Contract');
const mongoose = require('mongoose');

const COUPONS = {
  WELCOME10: { percent: 10 },
  MONTHLY20: { percent: 20, rentalType: 'monthly' },
  WEEKEND15: { percent: 15 },
};

const notifyStaff = async (notification) => {
  const staff = await User.find({ role: { $ne: 'customer' }, isActive: { $ne: false } }).select('_id');
  if (staff.length) {
    await Notification.insertMany(staff.map(({ _id }) => ({ ...notification, recipient: _id })));
  }
};

const notifyTechnicians = async (notification) => {
  const techs = await User.find({ role: { $in: ['technician', 'admin'] }, isActive: { $ne: false } }).select('_id');
  if (techs.length) {
    await Notification.insertMany(techs.map(({ _id }) => ({ ...notification, recipient: _id })));
  }
};

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
      .populate('customer', 'fullName email phone avatar cccd')
      .populate('vehicle', 'name brand licensePlate mainImage pricePerDay type odometer year engineCC color status')
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
    const { vehicleId, vehicleName, startDate, endDate, pickupLocation, returnLocation, customerNote, accessories, extraServicesTotal = 0, rentalType = 'daily', couponCode, customerName, customerPhone, paymentMethod, bookingSource } = req.body;
    const staffRoles = ['owner', 'admin', 'receptionist', 'support'];
    const isWalkIn = Boolean(req.user && staffRoles.includes(req.user.role) && bookingSource === 'walk_in');

    // Find vehicle by ID or by name
    let vehicle;
    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      vehicle = await Vehicle.findById(vehicleId);
    }
    if (!vehicle && vehicleName) {
      vehicle = await Vehicle.findOne({ name: { $regex: new RegExp(vehicleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } });
    }
    if (!vehicle) {
      vehicle = await Vehicle.findOne({ status: 'available' }) || await Vehicle.findOne({});
    }

    if (!vehicle) return res.status(404).json({ success: false, message: 'Chưa có xe nào trong hệ thống.' });

    let customerId;
    if (req.user && req.user.role === 'customer') {
      customerId = req.user._id;
    } else if (isWalkIn) {
      if (!customerPhone || !customerName) return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên và số điện thoại khách tại quầy.' });
      let walkInCustomer = await User.findOne({ phone: customerPhone, role: 'customer' });
      if (!walkInCustomer) {
        walkInCustomer = await User.create({ fullName: customerName, phone: customerPhone, email: `walkin_${Date.now()}@motobike.vn`, password: 'Customer@123', role: 'customer', isEmailVerified: true });
      } else if (customerName && walkInCustomer.fullName !== customerName) {
        walkInCustomer.fullName = customerName;
        await walkInCustomer.save();
      }
      customerId = walkInCustomer._id;
    } else if (req.user) {
      customerId = req.body.customerId || req.user._id;
    } else {
      let guestUser = await User.findOne({ phone: customerPhone });
      if (!guestUser) {
        guestUser = await User.create({
          fullName: customerName || 'Khách vãng lai',
          phone: customerPhone || '0905123456',
          email: `guest_${Date.now()}@motobike.vn`,
          password: 'Customer@123',
          role: 'customer',
          isEmailVerified: true
        });
      }
      customerId = guestUser._id;
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = endDate ? new Date(endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const diff = Math.max(1, Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)));
    const conflictingBooking = await Booking.findOne({
      vehicle: vehicle._id,
      $or: [
        { status: 'active' },
        { status: { $in: ['pending', 'confirmed'] }, startDate: { $lt: eDate }, endDate: { $gt: sDate } }
      ]
    }).select('bookingCode status startDate endDate');
    if (conflictingBooking) {
      return res.status(409).json({ success: false, message: 'Xe đã có đơn thuê trong khoảng thời gian này và chưa sẵn sàng để đặt.' });
    }
    const normalizedRentalType = rentalType === 'monthly' ? 'monthly' : 'daily';
    const rentalMonths = normalizedRentalType === 'monthly' ? Math.max(1, Math.ceil(diff / 30)) : 0;
    const monthlyPrice = Math.round(vehicle.pricePerDay * 26 * 0.8);
    const rentalBase = normalizedRentalType === 'monthly' ? rentalMonths * monthlyPrice : vehicle.pricePerDay * diff;
    const accessoryTotal = Array.isArray(accessories) ? accessories.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0), 0) : 0;
    const priceBeforeDiscount = rentalBase + Math.max(0, Number(extraServicesTotal) || 0) + accessoryTotal;
    const coupon = COUPONS[String(couponCode || '').trim().toUpperCase()];
    const discountAmount = coupon && (!coupon.rentalType || coupon.rentalType === normalizedRentalType)
      ? Math.round(priceBeforeDiscount * coupon.percent / 100) : 0;

    const booking = await Booking.create({
      customer: customerId,
      vehicle: vehicle._id,
      startDate: sDate,
      endDate: eDate,
      totalDays: diff,
      rentalType: normalizedRentalType,
      rentalMonths,
      monthlyPrice,
      pickupLocation: pickupLocation || 'Sân bay Quốc tế Đà Nẵng',
      returnLocation: returnLocation || '128 Bạch Đằng, Hải Châu',
      pricePerDay: vehicle.pricePerDay,
      deposit: vehicle.deposit || 500000,
      priceBeforeDiscount,
      totalPrice: priceBeforeDiscount,
      discountAmount,
      finalPrice: Math.max(0, priceBeforeDiscount - discountAmount),
      serviceFee: Math.max(0, Number(extraServicesTotal) || 0),
      packageDiscount: normalizedRentalType === 'monthly' ? Math.max(0, vehicle.pricePerDay * 26 * rentalMonths - rentalBase) : 0,
      couponCode: coupon ? String(couponCode).trim().toUpperCase() : undefined,
      customerNote: customerNote || '',
      paymentMethod: paymentMethod || 'cash',
      accessories: Array.isArray(accessories) ? accessories : [],
      bookingSource: isWalkIn ? 'walk_in' : 'online',
      createdBy: req.user?._id,
      status: isWalkIn ? 'confirmed' : 'pending',
      assignedReceptionist: isWalkIn && req.user.role === 'receptionist' ? req.user._id : undefined
    });
    if (isWalkIn) await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'rented' });

    // Online orders need approval. Walk-in orders are created by reception and confirmed at the counter.
    try {
      const notification = {
        title: 'Có đơn thuê xe mới cần duyệt',
        message: `Yêu cầu thuê ${vehicle.name} (${sDate.toLocaleDateString('vi-VN')} - ${eDate.toLocaleDateString('vi-VN')}) đang chờ nhân viên xác nhận.`,
        type: 'booking',
        link: '/dashboard/bookings',
        data: { bookingId: booking._id, status: booking.status }
      };
      if (isWalkIn) {
        await Notification.create({ recipient: customerId, title: 'Đơn thuê tại quầy đã được tạo', message: `Nhân viên đã lập đơn thuê ${vehicle.name} cho bạn và xác nhận tại quầy.`, type: 'booking', link: '/portal', data: { bookingId: booking._id, status: booking.status } });
      } else {
        await Notification.create({ recipient: customerId, ...notification, title: 'Đặt xe thành công - đang chờ duyệt', message: `Yêu cầu thuê ${vehicle.name} đã được ghi nhận. Nhân viên sẽ xác nhận đơn của bạn sớm.`, link: '/portal' });
        await notifyStaff(notification);
      }
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Đặt xe thành công!',
      data: await booking.populate('vehicle', 'name brand licensePlate mainImage pricePerDay')
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
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'reserved' });
    } else if (status === 'active') {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'rented' });
    } else if (status === 'completed' || status === 'cancelled') {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available' });
      await Contract.updateMany({ booking: booking._id }, { status: status === 'completed' ? 'completed' : 'terminated' });
    }
    await booking.save();

    try {
      const statusMessages = {
        confirmed: ['Đơn thuê xe đã được duyệt', 'Đơn thuê xe của bạn đã được nhân viên xác nhận. Vui lòng theo dõi hợp đồng và thanh toán tiền cọc.'],
        cancelled: ['Đơn thuê xe đã bị từ chối/hủy', `Đơn thuê xe đã bị từ chối hoặc hủy${cancelReason ? `: ${cancelReason}` : '.'}`],
        active: ['Đơn thuê xe đang hoạt động', 'Bạn đã nhận xe thành công. Chúc bạn có chuyến đi an toàn.'],
        completed: ['Đơn thuê xe đã hoàn tất', 'Đơn thuê xe đã được hoàn tất. Cảm ơn bạn đã sử dụng dịch vụ.']
      };
      const [title, message] = statusMessages[status] || ['Đơn thuê xe được cập nhật', `Trạng thái đơn thuê đã chuyển sang: ${status}.`];
      await Notification.create({
        recipient: booking.customer,
        title,
        message,
        type: status === 'cancelled' ? 'alert' : 'booking',
        link: '/portal',
        data: { bookingId: booking._id, status }
      });
    } catch (e) {}

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
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chụp hoặc tải ít nhất 1 ảnh tình trạng xe trước khi check-in.' });
    }

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

// @PUT /api/bookings/:id/customer-return - Customer confirms vehicle return (enables technician acceptance)
exports.customerReturn = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicle', 'name licensePlate odometer')
      .populate('customer', 'fullName phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn thuê xe.' });

    if (req.user.role === 'customer' && String(booking.customer?._id || booking.customer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền trả đơn thuê này.' });
    }

    if (booking.status === 'cancelled' || booking.status === 'pending' || booking.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Đơn thuê chưa được giao xe, không thể thực hiện trả xe.' });
    }

    if (booking.returnStatus === 'customer_returned' || booking.returnStatus === 'tech_accepted' || booking.returnStatus === 'inspected') {
      return res.status(400).json({ success: false, message: 'Đơn thuê này đã được ghi nhận trả xe trước đó.' });
    }

    const note = req.body?.note || req.body?.customerReturnNote || 'Khách hàng xác nhận đã trả xe chờ kỹ thuật viên kiểm tra.';
    booking.returnStatus = 'customer_returned';
    booking.customerReturnedAt = new Date();
    booking.customerReturnNote = note;
    if (req.body?.checkOutOdometer !== undefined) {
      booking.checkOutOdometer = Number(req.body.checkOutOdometer);
    }
    await booking.save();

    if (booking.vehicle?._id) {
      await Vehicle.findByIdAndUpdate(booking.vehicle._id, { status: 'maintenance' });
    }

    await notifyTechnicians({
      title: `Khách ${booking.customer?.fullName || 'thuê xe'} vừa trả xe ${booking.vehicle?.name || ''} (${booking.vehicle?.licensePlate || ''})`,
      message: `Đơn ${booking.bookingCode}: "${note}". Vui lòng tiếp nhận và kiểm tra 8 hạng mục kỹ thuật.`,
      type: 'maintenance',
      link: '/technician',
      data: { bookingId: booking._id, vehicleId: booking.vehicle?._id, action: 'customer_returned' }
    });

    try {
      await Notification.create({
        recipient: booking.customer?._id || booking.customer,
        title: 'Đã gửi yêu cầu trả xe thành công',
        message: `Xe ${booking.vehicle?.name} (${booking.vehicle?.licensePlate}) đang chờ kỹ thuật viên tiếp nhận kiểm tra.`,
        type: 'booking',
        link: '/portal',
        data: { bookingId: booking._id, returnStatus: booking.returnStatus }
      });
    } catch {}

    res.json({ success: true, message: 'Đã xác nhận trả xe! Kỹ thuật viên sẽ tiếp nhận kiểm tra xe ngay.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/bookings/:id/checkout
exports.checkOut = async (req, res) => {
  try {
    const { checkOutOdometer, checkOutNote, checkOutSignature, lateFee, damageFee, fuelFee } = req.body;
    const booking = await Booking.findById(req.params.id).populate('vehicle customer');
    if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt xe.' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng chụp hoặc tải ít nhất 1 ảnh tình trạng xe trước khi check-out.' });
    }

    booking.checkOutTime = new Date();
    booking.checkOutOdometer = checkOutOdometer;
    booking.checkOutNote = checkOutNote;
    booking.checkOutSignature = checkOutSignature;
    booking.checkOutStaff = req.user._id;
    booking.lateFee = lateFee || 0;
    booking.damageFee = damageFee || 0;
    booking.fuelFee = fuelFee || 0;
    booking.status = 'completed';
    if (!booking.returnStatus || booking.returnStatus === 'not_returned') {
      booking.returnStatus = 'customer_returned';
      booking.customerReturnedAt = booking.checkOutTime;
      booking.customerReturnNote = checkOutNote || 'Khách trả xe tại quầy lễ tân';
    }

    if (req.files) {
      booking.checkOutImages = req.files.map(f => ({
        url: `/uploads/bookings/${f.filename}`,
        caption: 'Check-out'
      }));
    }

    await booking.save();
    await Vehicle.findByIdAndUpdate(booking.vehicle?._id || booking.vehicle, { 
      status: 'available',
      odometer: checkOutOdometer 
    });
    await Contract.updateMany({ booking: booking._id }, { status: 'completed' });

    await notifyTechnicians({
      title: `Xe ${booking.vehicle?.name || ''} (${booking.vehicle?.licensePlate || ''}) vừa trả tại quầy`,
      message: `Đơn ${booking.bookingCode} (KH: ${booking.customer?.fullName || 'Khách'}) đã check-out và sẵn sàng chờ KTV tiếp nhận kiểm tra.`,
      type: 'maintenance',
      link: '/technician',
      data: { bookingId: booking._id, vehicleId: booking.vehicle?._id, action: 'customer_returned' }
    });

    res.json({ success: true, message: 'Check-out thành công.', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
