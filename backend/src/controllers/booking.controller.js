const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Contract = require('../models/Contract');
const Payment = require('../models/Payment');
const QrPaymentSession = require('../models/QrPaymentSession');
const mongoose = require('mongoose');

const COUPONS = {
  WELCOME10: { percent: 10 },
  MONTHLY20: { percent: 20, rentalType: 'monthly' },
  WEEKEND15: { percent: 15 },
};

const resolveActiveVehicle = async (vehicleId, vehicleName) => {
  let vehicle = null;
  if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
    vehicle = await Vehicle.findOne({ _id: vehicleId, isActive: { $ne: false } });
  }
  if (!vehicle && vehicleName) {
    vehicle = await Vehicle.findOne({
      isActive: { $ne: false },
      name: { $regex: new RegExp(vehicleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });
  }
  if (!vehicle) {
    vehicle = await Vehicle.findOne({ status: 'available', isActive: { $ne: false } }) || await Vehicle.findOne({ isActive: { $ne: false } });
  }
  return vehicle;
};

const findConflictingBooking = async (vehicleId, sDate, eDate) => {
  return Booking.findOne({
    vehicle: vehicleId,
    $or: [
      { status: 'active' },
      { status: 'confirmed', startDate: { $lt: eDate }, endDate: { $gt: sDate } },
      {
        status: 'pending',
        startDate: { $lt: eDate },
        endDate: { $gt: sDate },
        $or: [
          { bookingSource: { $ne: 'online' } },
          { paymentStatus: { $in: ['deposit_paid', 'fully_paid'] } }
        ]
      }
    ]
  }).select('bookingCode status paymentStatus startDate endDate');
};

const computeBookingPricing = ({ vehicle, startDate, endDate, rentalType = 'daily', accessories, extraServicesTotal = 0, couponCode }) => {
  const sDate = startDate ? new Date(startDate) : new Date();
  const eDate = endDate ? new Date(endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const diff = Math.max(1, Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)));
  const normalizedRentalType = rentalType === 'monthly' ? 'monthly' : 'daily';
  const rentalMonths = normalizedRentalType === 'monthly' ? Math.max(1, Math.ceil(diff / 30)) : 0;
  const monthlyPrice = Math.round(vehicle.pricePerDay * 26 * 0.8);
  const rentalBase = normalizedRentalType === 'monthly' ? rentalMonths * monthlyPrice : vehicle.pricePerDay * diff;
  const accessoryTotal = Array.isArray(accessories)
    ? accessories.reduce((sum, item) => sum + Math.max(0, Number(item.price) || 0), 0)
    : 0;
  const serviceFee = Math.max(0, Number(extraServicesTotal) || 0);
  const priceBeforeDiscount = rentalBase + serviceFee + accessoryTotal;
  const normalizedCouponCode = String(couponCode || '').trim().toUpperCase();
  const coupon = COUPONS[normalizedCouponCode];
  const discountAmount = coupon && (!coupon.rentalType || coupon.rentalType === normalizedRentalType)
    ? Math.round(priceBeforeDiscount * coupon.percent / 100)
    : 0;
  const finalPrice = Math.max(0, priceBeforeDiscount - discountAmount);
  const onlineDeposit = Math.max(20000, Math.round(finalPrice * 0.1));
  const packageDiscount = normalizedRentalType === 'monthly' ? Math.max(0, vehicle.pricePerDay * 26 * rentalMonths - rentalBase) : 0;

  return {
    sDate,
    eDate,
    diff,
    normalizedRentalType,
    rentalMonths,
    monthlyPrice,
    rentalBase,
    accessoryTotal,
    serviceFee,
    priceBeforeDiscount,
    coupon,
    couponCode: coupon ? normalizedCouponCode : undefined,
    discountAmount,
    finalPrice,
    onlineDeposit,
    packageDiscount,
  };
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
      .populate('customer', 'fullName email phone avatar cccd drivingLicense drivingLicenseClass address')
      .populate('vehicle', 'name brand model licensePlate mainImage pricePerDay type odometer year engineCC color status isActive')
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

// @POST /api/bookings/check-availability - Validate availability without creating a booking draft
exports.checkAvailability = async (req, res) => {
  try {
    const { vehicleId, vehicleName, startDate, endDate } = req.body;
    const vehicle = await resolveActiveVehicle(vehicleId, vehicleName);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Chưa có xe đang hoạt động nào trong hệ thống.' });
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const eDate = endDate ? new Date(endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const conflictingBooking = await findConflictingBooking(vehicle._id, sDate, eDate);
    if (conflictingBooking) {
      return res.status(409).json({ success: false, message: 'Xe đã có đơn thuê trong khoảng thời gian này và chưa sẵn sàng để đặt.' });
    }

    res.json({
      success: true,
      available: true,
      data: {
        vehicle: {
          _id: vehicle._id,
          name: vehicle.name,
          brand: vehicle.brand,
          licensePlate: vehicle.licensePlate,
          pricePerDay: vehicle.pricePerDay,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/bookings/checkout - Atomic online booking + contract + paid QR session
exports.checkout = async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleName,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      customerNote,
      accessories,
      extraServicesTotal = 0,
      rentalType = 'daily',
      couponCode,
      customerSignature,
      termsAndConditions,
      qrSessionId,
      qrSessionCode,
      paymentType = 'rental_fee',
      amount,
    } = req.body;

    if (!qrSessionId && !qrSessionCode) {
      return res.status(400).json({
        success: false,
        code: 'QR_REQUIRED',
        message: 'Vui lòng quét mã QR thanh toán trước khi hoàn tất đặt xe.'
      });
    }

    const sessionIdVal = String(qrSessionId || qrSessionCode).trim();
    const activeQrSession = (mongoose.Types.ObjectId.isValid(sessionIdVal) && /^[0-9a-fA-F]{24}$/.test(sessionIdVal))
      ? await QrPaymentSession.findById(sessionIdVal)
      : await QrPaymentSession.findOne({ sessionCode: sessionIdVal.toUpperCase() });

    if (!activeQrSession) {
      return res.status(404).json({
        success: false,
        code: 'QR_NOT_FOUND',
        message: 'Không tìm thấy mã QR thanh toán. Vui lòng tạo lại mã QR mới.'
      });
    }
    if (req.user.role === 'customer' && activeQrSession.customer && activeQrSession.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sử dụng mã QR thanh toán này.' });
    }
    if (activeQrSession.status === 'paid') {
      return res.status(400).json({
        success: false,
        code: 'QR_ALREADY_PAID',
        message: 'Mã QR này đã được xác nhận thanh toán trước đó.'
      });
    }
    if (activeQrSession.status === 'superseded') {
      return res.status(400).json({
        success: false,
        code: 'QR_SUPERSEDED',
        message: 'Mã QR này đã hết hiệu lực do mã mới đã được tạo. Vui lòng quét mã QR mới.'
      });
    }
    if (activeQrSession.status === 'expired' || Date.now() > new Date(activeQrSession.expiresAt).getTime()) {
      if (activeQrSession.status !== 'expired') {
        activeQrSession.status = 'expired';
        await activeQrSession.save();
      }
      return res.status(400).json({
        success: false,
        code: 'QR_EXPIRED',
        message: 'Mã QR thanh toán đã hết hiệu lực (quá 30 giây). Vui lòng tạo lại mã QR mới.'
      });
    }
    if (amount !== undefined && Math.abs(Number(amount) - Number(activeQrSession.amount)) > 1) {
      return res.status(400).json({
        success: false,
        code: 'QR_AMOUNT_MISMATCH',
        message: 'Số tiền thanh toán không khớp với mã QR hiện tại. Vui lòng tạo lại mã QR mới.'
      });
    }

    const vehicle = await resolveActiveVehicle(vehicleId, vehicleName);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Chưa có xe đang hoạt động nào trong hệ thống.' });
    }

    const pricing = computeBookingPricing({
      vehicle,
      startDate,
      endDate,
      rentalType,
      accessories,
      extraServicesTotal,
      couponCode,
    });

    const conflictingBooking = await findConflictingBooking(vehicle._id, pricing.sDate, pricing.eDate);
    if (conflictingBooking) {
      return res.status(409).json({ success: false, message: 'Xe đã có đơn thuê trong khoảng thời gian này và chưa sẵn sàng để đặt.' });
    }

    const resolvedPaymentType = paymentType === 'deposit' || activeQrSession.type === 'deposit' ? 'deposit' : 'rental_fee';
    const paidAmountValue = Number(activeQrSession.amount);
    const paymentStatus = paidAmountValue >= pricing.finalPrice ? 'fully_paid' : 'deposit_paid';

    const booking = await Booking.create({
      customer: req.user._id,
      vehicle: vehicle._id,
      startDate: pricing.sDate,
      endDate: pricing.eDate,
      totalDays: pricing.diff,
      rentalType: pricing.normalizedRentalType,
      rentalMonths: pricing.rentalMonths,
      monthlyPrice: pricing.monthlyPrice,
      pickupLocation: pickupLocation || 'Sân bay Quốc tế Đà Nẵng',
      returnLocation: returnLocation || '128 Bạch Đằng, Hải Châu',
      pricePerDay: vehicle.pricePerDay,
      deposit: pricing.onlineDeposit,
      priceBeforeDiscount: pricing.priceBeforeDiscount,
      totalPrice: pricing.priceBeforeDiscount,
      discountAmount: pricing.discountAmount,
      finalPrice: pricing.finalPrice,
      serviceFee: pricing.serviceFee,
      packageDiscount: pricing.packageDiscount,
      couponCode: pricing.couponCode,
      customerNote: customerNote || '',
      paymentMethod: 'qr',
      paymentStatus,
      accessories: Array.isArray(accessories) ? accessories : [],
      bookingSource: 'online',
      createdBy: req.user._id,
      status: 'pending',
    });

    // Generate next HDxxxx contract code
    const existingCodes = await Contract.find({}, 'contractCode').lean();
    let maxNum = 0;
    for (const c of existingCodes) {
      const m = /^HD(\d+)$/i.exec(c.contractCode || '');
      if (m) maxNum = Math.max(maxNum, Number(m[1]));
    }
    const contractCode = `HD${String(maxNum + 1).padStart(4, '0')}`;

    const contract = await Contract.create({
      contractCode,
      booking: booking._id,
      customer: req.user._id,
      vehicle: vehicle._id,
      customerInfo: {
        fullName: req.user.fullName,
        phone: req.user.phone,
        cccd: req.user.cccd,
        drivingLicense: req.user.drivingLicense,
        drivingLicenseClass: req.user.drivingLicenseClass,
        address: req.user.address,
        email: req.user.email,
      },
      vehicleInfo: {
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        brand: vehicle.brand,
        model: vehicle.model,
        type: vehicle.type,
        color: vehicle.color,
        engineNumber: vehicle.engineCC ? `${vehicle.engineCC}cc` : undefined,
      },
      startDate: pricing.sDate,
      endDate: pricing.eDate,
      rentalDays: pricing.diff,
      rentalType: pricing.normalizedRentalType,
      rentalMonths: pricing.rentalMonths,
      pricePerDay: vehicle.pricePerDay,
      monthlyPrice: pricing.monthlyPrice,
      totalRentalFee: pricing.finalPrice,
      serviceFee: pricing.serviceFee,
      accessories: Array.isArray(accessories) ? accessories : [],
      couponCode: pricing.couponCode,
      discountAmount: pricing.discountAmount,
      depositAmount: pricing.onlineDeposit,
      totalPayable: pricing.finalPrice,
      paidAmount: resolvedPaymentType === 'rental_fee' ? paidAmountValue : 0,
      paymentMethod: 'qr',
      termsAndConditions,
      status: customerSignature ? 'pending_approval' : 'pending_signature',
      customerSignature: customerSignature || null,
      customerSignedAt: customerSignature ? new Date() : null,
      createdBy: req.user._id,
    });

    const payment = await Payment.create({
      booking: booking._id,
      customer: req.user._id,
      type: resolvedPaymentType,
      amount: paidAmountValue,
      method: 'qr',
      note: `Thanh toán ${resolvedPaymentType === 'rental_fee' ? 'toàn bộ (gồm phụ kiện)' : 'cọc'} đơn ${booking.bookingCode} (${activeQrSession.sessionCode})`,
      referenceNumber: activeQrSession.transferContent,
      qrSession: activeQrSession._id,
      collectedBy: req.user._id,
      status: 'completed',
    });

    activeQrSession.status = 'paid';
    activeQrSession.paidAt = new Date();
    activeQrSession.booking = booking._id;
    activeQrSession.payment = payment._id;
    await activeQrSession.save();

    await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'reserved' });

    try {
      const notification = {
        title: 'Có đơn thuê xe mới đã thanh toán cần duyệt',
        message: `Đơn ${booking.bookingCode} thuê ${vehicle.name} (${pricing.sDate.toLocaleDateString('vi-VN')} - ${pricing.eDate.toLocaleDateString('vi-VN')}) đã thanh toán ${paidAmountValue.toLocaleString('vi-VN')} đ và đang chờ xác nhận.`,
        type: 'booking',
        link: '/dashboard/bookings',
        data: { bookingId: booking._id, status: booking.status },
      };
      await Notification.create({
        recipient: req.user._id,
        title: 'Đặt xe & thanh toán thành công - đang chờ duyệt',
        message: `Đơn ${booking.bookingCode} thuê ${vehicle.name} đã ghi nhận thanh toán. Nhân viên sẽ xác nhận đơn của bạn sớm.`,
        type: 'booking',
        link: '/portal',
        data: { bookingId: booking._id, status: booking.status },
      });
      await notifyStaff(notification);
    } catch {}

    const populatedBooking = await booking.populate('vehicle', 'name brand licensePlate mainImage pricePerDay');
    res.status(201).json({
      success: true,
      message: 'Đặt xe và thanh toán thành công!',
      data: {
        booking: populatedBooking,
        contract,
        payment,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/bookings - Create booking
exports.create = async (req, res) => {
  try {
    const {
      vehicleId,
      vehicleName,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      customerNote,
      staffNote,
      accessories,
      extraServicesTotal = 0,
      rentalType = 'daily',
      couponCode,
      customerId: bodyCustomerId,
      customerName,
      customerPhone,
      customerCccd,
      customerLicense,
      customerLicenseClass,
      customerAddress,
      paymentMethod,
      paymentStatus: bodyPaymentStatus,
      deposit: bodyDeposit,
      bookingSource,
    } = req.body;
    const staffRoles = ['owner', 'admin', 'receptionist', 'support'];
    const isWalkIn = Boolean(req.user && staffRoles.includes(req.user.role) && bookingSource === 'walk_in');

    // Find vehicle by ID or by name (active fleet only)
    const vehicle = await resolveActiveVehicle(vehicleId, vehicleName);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Chưa có xe đang hoạt động nào trong hệ thống.' });

    let customerId;
    if (req.user && req.user.role === 'customer') {
      customerId = req.user._id;
    } else if (isWalkIn) {
      if (bodyCustomerId && mongoose.Types.ObjectId.isValid(bodyCustomerId)) {
        const existingCust = await User.findById(bodyCustomerId);
        if (!existingCust) {
          return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng đã chọn.' });
        }
        let dirty = false;
        if (customerCccd && existingCust.cccd !== customerCccd) { existingCust.cccd = customerCccd; dirty = true; }
        if (customerLicense && existingCust.drivingLicense !== customerLicense) { existingCust.drivingLicense = customerLicense; dirty = true; }
        if (customerLicenseClass && existingCust.drivingLicenseClass !== customerLicenseClass) { existingCust.drivingLicenseClass = customerLicenseClass; dirty = true; }
        if (customerAddress && existingCust.address !== customerAddress) { existingCust.address = customerAddress; dirty = true; }
        if (dirty) await existingCust.save();
        customerId = existingCust._id;
      } else {
        if (!customerPhone || !customerName) {
          return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên và số điện thoại khách tại quầy.' });
        }
        const trimmedPhone = String(customerPhone).trim();
        const trimmedName = String(customerName).trim();
        let walkInCustomer = await User.findOne({ phone: trimmedPhone, role: 'customer' });
        if (!walkInCustomer) {
          walkInCustomer = await User.create({
            fullName: trimmedName,
            phone: trimmedPhone,
            cccd: customerCccd ? String(customerCccd).trim() : undefined,
            drivingLicense: customerLicense ? String(customerLicense).trim() : undefined,
            drivingLicenseClass: customerLicenseClass ? String(customerLicenseClass).trim() : undefined,
            address: customerAddress ? String(customerAddress).trim() : undefined,
            email: `walkin_${Date.now()}@motobike.vn`,
            password: 'Customer@123',
            role: 'customer',
            isEmailVerified: true,
          });
        } else {
          if (trimmedName && walkInCustomer.fullName !== trimmedName) walkInCustomer.fullName = trimmedName;
          if (customerCccd) walkInCustomer.cccd = String(customerCccd).trim();
          if (customerLicense) walkInCustomer.drivingLicense = String(customerLicense).trim();
          if (customerLicenseClass) walkInCustomer.drivingLicenseClass = String(customerLicenseClass).trim();
          if (customerAddress) walkInCustomer.address = String(customerAddress).trim();
          await walkInCustomer.save();
        }
        customerId = walkInCustomer._id;
      }
    } else if (req.user) {
      customerId = bodyCustomerId || req.user._id;
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

    const pricing = computeBookingPricing({ vehicle, startDate, endDate, rentalType, accessories, extraServicesTotal, couponCode });
    if (Number.isNaN(pricing.sDate.getTime()) || Number.isNaN(pricing.eDate.getTime()) || pricing.eDate <= pricing.sDate) {
      return res.status(400).json({ success: false, message: 'Thời gian nhận xe và trả xe không hợp lệ.' });
    }

    const conflictingBooking = await findConflictingBooking(vehicle._id, pricing.sDate, pricing.eDate);
    if (conflictingBooking) {
      return res.status(409).json({ success: false, message: 'Xe đã có đơn thuê trong khoảng thời gian này và chưa sẵn sàng để đặt.' });
    }

    const resolvedDeposit = isWalkIn && bodyDeposit !== undefined
      ? Math.max(0, Number(bodyDeposit) || 0)
      : (vehicle.deposit || 500000);
    const allowedPayStatuses = ['unpaid', 'deposit_paid', 'fully_paid'];
    const resolvedPaymentStatus = isWalkIn && allowedPayStatuses.includes(bodyPaymentStatus) ? bodyPaymentStatus : 'unpaid';
    const resolvedMethod = paymentMethod || 'cash';

    const booking = await Booking.create({
      customer: customerId,
      vehicle: vehicle._id,
      startDate: pricing.sDate,
      endDate: pricing.eDate,
      totalDays: pricing.diff,
      rentalType: pricing.normalizedRentalType,
      rentalMonths: pricing.rentalMonths,
      monthlyPrice: pricing.monthlyPrice,
      pickupLocation: pickupLocation || (isWalkIn ? '128 Bạch Đằng, Hải Châu (Tại cửa hàng)' : 'Sân bay Quốc tế Đà Nẵng'),
      returnLocation: returnLocation || '128 Bạch Đằng, Hải Châu',
      pricePerDay: vehicle.pricePerDay,
      deposit: resolvedDeposit,
      priceBeforeDiscount: pricing.priceBeforeDiscount,
      totalPrice: pricing.priceBeforeDiscount,
      discountAmount: pricing.discountAmount,
      finalPrice: pricing.finalPrice,
      serviceFee: pricing.serviceFee,
      packageDiscount: pricing.packageDiscount,
      couponCode: pricing.couponCode,
      customerNote: customerNote || '',
      staffNote: staffNote || '',
      paymentMethod: resolvedMethod,
      paymentStatus: resolvedPaymentStatus,
      accessories: Array.isArray(accessories) ? accessories : [],
      bookingSource: isWalkIn ? 'walk_in' : 'online',
      createdBy: req.user?._id,
      status: isWalkIn ? 'confirmed' : 'pending',
      assignedReceptionist: isWalkIn && req.user.role === 'receptionist' ? req.user._id : undefined
    });
    if (isWalkIn) {
      await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'reserved' });
      if (resolvedPaymentStatus === 'deposit_paid' || resolvedPaymentStatus === 'fully_paid') {
        const payAmount = resolvedPaymentStatus === 'fully_paid' ? pricing.finalPrice : resolvedDeposit;
        if (payAmount > 0) {
          await Payment.create({
            booking: booking._id,
            customer: customerId,
            type: resolvedPaymentStatus === 'fully_paid' ? 'rental_fee' : 'deposit',
            amount: payAmount,
            method: resolvedMethod,
            note: `Thu tiền tại quầy (${resolvedPaymentStatus === 'fully_paid' ? 'trọn gói' : 'tiền cọc'}) đơn ${booking.bookingCode}`,
            collectedBy: req.user?._id,
            status: 'completed',
          });
        }
      }
    }

    // Online orders need approval. Walk-in orders are created by reception and confirmed at the counter.
    try {
      const notification = {
        title: 'Có đơn thuê xe mới cần duyệt',
        message: `Yêu cầu thuê ${vehicle.name} (${pricing.sDate.toLocaleDateString('vi-VN')} - ${pricing.eDate.toLocaleDateString('vi-VN')}) đang chờ nhân viên xác nhận.`,
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

    await booking.populate('vehicle', 'name brand model licensePlate mainImage pricePerDay type engineCC color');
    await booking.populate('customer', 'fullName email phone cccd drivingLicense drivingLicenseClass address');

    res.status(201).json({
      success: true,
      message: 'Đặt xe thành công!',
      data: booking
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
      const now = new Date();
      if (status === 'completed') {
        booking.checkOutTime = booking.checkOutTime || now;
        if (!booking.returnStatus || booking.returnStatus === 'not_returned') {
          booking.returnStatus = 'customer_returned';
          booking.customerReturnedAt = booking.checkOutTime;
          booking.customerReturnNote = req.body?.note || 'Hoàn tất trả xe tại quầy';
        }
        await Contract.updateMany(
          { booking: booking._id },
          { status: 'completed', actualReturnDate: booking.checkOutTime, checkOutTime: booking.checkOutTime }
        );
      } else {
        await Contract.updateMany({ booking: booking._id }, { status: 'terminated' });
      }
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
    await Contract.updateMany(
      { booking: booking._id },
      { status: 'completed', actualReturnDate: booking.checkOutTime, checkOutTime: booking.checkOutTime }
    );

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
