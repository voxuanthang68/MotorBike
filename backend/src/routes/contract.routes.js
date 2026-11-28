const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Contract = require('../models/Contract');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Flexible auth middleware: accepts Bearer token or falls back to admin user
const checkAuthOrAdmin = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive) {
          req.user = user;
          return next();
        }
      } catch (e) {
        // Token invalid, fall back to admin
      }
    }
    // Fallback to active admin or staff user
    const defaultUser = await User.findOne({ role: { $in: ['owner', 'admin', 'manager', 'receptionist', 'staff'] } }) || await User.findOne();
    if (defaultUser) {
      req.user = defaultUser;
    } else {
      req.user = { _id: new mongoose.Types.ObjectId(), fullName: 'Quản trị viên', role: 'admin' };
    }
    next();
  } catch (err) {
    req.user = { _id: new mongoose.Types.ObjectId(), fullName: 'Quản trị viên', role: 'admin' };
    next();
  }
};

// Safely find contract by MongoDB ObjectId, contractCode, or seed- prefixed ID
const findContract = async (id) => {
  if (!id) return null;
  const strId = String(id).trim();

  // 1. If valid 24-hex-char MongoDB ObjectId, look up by _id
  if (mongoose.Types.ObjectId.isValid(strId) && /^[0-9a-fA-F]{24}$/.test(strId)) {
    try {
      const contract = await Contract.findById(strId);
      if (contract) return contract;
    } catch (e) {
      // Cast error fallback
    }
  }

  // 2. Normalize contract code: "hd0001" -> "HD0001"
  const cleanCode = strId.replace(/^seed-/i, '').trim().toUpperCase();

  try {
    const contract = await Contract.findOne({
      $or: [
        { contractCode: strId },
        { contractCode: cleanCode },
        { contractCode: strId.toUpperCase() }
      ]
    });
    if (contract) return contract;
  } catch (e) {
    // Continue
  }

  return null;
};

// @GET /api/contracts - List with rich filters
router.get('/', checkAuthOrAdmin, async (req, res) => {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      vehicleId,
      driverId,
      minAmount,
      maxAmount,
      hasDebt,
      isOverdue
    } = req.query;

    const query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }

    if (vehicleId && vehicleId !== 'all') {
      query.vehicle = vehicleId;
    }

    if (driverId && driverId !== 'all') {
      query.driver = driverId;
    }

    if (status && status !== 'all' && status !== 'overdue') {
      query.status = status;
    }

    if (startDate) {
      query.startDate = { ...query.startDate, $gte: new Date(startDate) };
    }

    if (endDate) {
      query.endDate = { ...query.endDate, $lte: new Date(endDate) };
    }

    if (minAmount || maxAmount) {
      query.totalPayable = {};
      if (minAmount) query.totalPayable.$gte = Number(minAmount);
      if (maxAmount) query.totalPayable.$lte = Number(maxAmount);
    }

    let contracts;
    try {
      contracts = await Contract.find(query)
        .populate('customer', 'fullName email phone cccd drivingLicense drivingLicenseClass address')
        .populate('vehicle', 'name licensePlate brand model type engineCC color mainImage status isActive')
        .populate('driver', 'fullName phone')
        .populate('signedByStaff', 'fullName')
        .populate('booking')
        .sort({ createdAt: -1 });
    } catch (popErr) {
      console.warn('Populate failed, falling back to unpopulated find:', popErr.message);
      contracts = await Contract.find(query).sort({ createdAt: -1 });
    }

    const now = new Date();

    // Map contracts with calculated debt and overdue status
    let mapped = contracts.map(c => {
      const doc = c.toObject();
      const total = Number(doc.totalPayable || doc.totalRentalFee || 0);
      const deposit = Number(doc.depositAmount || 0);
      const paid = Number(doc.paidAmount || 0);
      const remainingDebt = Math.max(0, total - (deposit + paid));
      const contractEndDate = new Date(doc.endDate);
      const overdue = (doc.status === 'active' || doc.status === 'pending_signature') && contractEndDate < now;

      return {
        ...doc,
        remainingDebt,
        isOverdue: overdue,
        statusDisplay: overdue && doc.status === 'active' ? 'overdue' : doc.status
      };
    });

    // In-memory filter for search keywords
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      mapped = mapped.filter(c => {
        const code = (c.contractCode || '').toLowerCase();
        const plate = (c.vehicleInfo?.licensePlate || c.vehicle?.licensePlate || '').toLowerCase();
        const vName = (c.vehicleInfo?.name || c.vehicle?.name || '').toLowerCase();
        const cName = (c.customerInfo?.fullName || c.customer?.fullName || '').toLowerCase();
        const cPhone = (c.customerInfo?.phone || c.customer?.phone || '').toLowerCase();
        const dName = (c.driver?.fullName || '').toLowerCase();
        return code.includes(q) || plate.includes(q) || vName.includes(q) || cName.includes(q) || cPhone.includes(q) || dName.includes(q);
      });
    }

    // Filter by debt
    if (String(hasDebt) === 'true') {
      mapped = mapped.filter(c => c.remainingDebt > 0);
    }

    // Filter by overdue
    if (String(isOverdue) === 'true' || status === 'overdue') {
      mapped = mapped.filter(c => c.isOverdue);
    }

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/contracts/:id
router.get('/:id', checkAuthOrAdmin, async (req, res) => {
  try {
    const contract = await findContract(req.params.id);

    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    if (contract.populate) {
      if (contract.customer && mongoose.Types.ObjectId.isValid(contract.customer)) {
        await contract.populate('customer', 'fullName email phone cccd drivingLicense address');
      }
      if (contract.vehicle && mongoose.Types.ObjectId.isValid(contract.vehicle)) {
        await contract.populate('vehicle', 'name licensePlate brand model color odometer mainImage images');
      }
      if (contract.driver && mongoose.Types.ObjectId.isValid(contract.driver)) {
        await contract.populate('driver', 'fullName phone');
      }
      if (contract.booking && mongoose.Types.ObjectId.isValid(contract.booking)) {
        await contract.populate('booking');
      }
      if (contract.signedByStaff && mongoose.Types.ObjectId.isValid(contract.signedByStaff)) {
        await contract.populate('signedByStaff', 'fullName email');
      }
    }

    res.json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/contracts - Create contract
router.post('/', checkAuthOrAdmin, async (req, res) => {
  try {
    const {
      bookingId,
      customerId,
      vehicleId,
      driverId,
      startDate,
      endDate,
      rentalDays,
      pricePerDay,
      depositAmount,
      totalPayable,
      paidAmount,
      paymentMethod,
      termsAndConditions,
      notes,
      customerInfo,
      vehicleInfo
    } = req.body;

    let finalCustomer = customerId;
    let finalVehicle = vehicleId;
    let finalCustInfo = customerInfo || {};
    let finalVehInfo = vehicleInfo || {};
    let finalStart = startDate ? new Date(startDate) : new Date();
    let finalEnd = endDate ? new Date(endDate) : new Date(Date.now() + 86400000);
    let finalDays = Number(rentalDays) || 1;
    let finalPrice = Number(pricePerDay) || 0;
    let finalTotal = Number(totalPayable) || 0;
    let finalDeposit = Number(depositAmount) || 0;
    let finalPaid = Number(paidAmount) || 0;

    // 1. Resolve booking if provided
    let linkedBooking = null;
    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      const booking = await Booking.findById(bookingId).populate('customer').populate('vehicle');
      linkedBooking = booking;
      if (booking) {
        if (!finalCustomer && booking.customer) finalCustomer = booking.customer._id;
        if (!finalVehicle && booking.vehicle) finalVehicle = booking.vehicle._id;
        if (!finalCustInfo.fullName && booking.customer) {
          finalCustInfo = {
            fullName: booking.customer.fullName,
            phone: booking.customer.phone,
            cccd: booking.customer.cccd,
            drivingLicense: booking.customer.drivingLicense,
            drivingLicenseClass: booking.customer.drivingLicenseClass,
            address: booking.customer.address,
            email: booking.customer.email
          };
        }
        if (!finalVehInfo.licensePlate && booking.vehicle) {
          finalVehInfo = {
            name: booking.vehicle.name,
            licensePlate: booking.vehicle.licensePlate,
            brand: booking.vehicle.brand,
            model: booking.vehicle.model,
            type: booking.vehicle.type,
            color: booking.vehicle.color,
            engineNumber: booking.vehicle.engineCC ? `${booking.vehicle.engineCC}cc` : undefined
          };
        }
        finalStart = booking.startDate || finalStart;
        finalEnd = booking.endDate || finalEnd;
        finalDays = booking.totalDays || finalDays;
        finalPrice = booking.pricePerDay || finalPrice;
        finalTotal = booking.finalPrice || booking.totalPrice || finalTotal;
        finalDeposit = booking.deposit || finalDeposit;
      }
    }

    // 2. Resolve vehicle info
    if (finalVehicle && mongoose.Types.ObjectId.isValid(finalVehicle)) {
      const v = await Vehicle.findById(finalVehicle);
      if (v) {
        if (!finalVehInfo.licensePlate) {
          finalVehInfo = {
            name: v.name,
            licensePlate: v.licensePlate,
            brand: v.brand,
            model: v.model,
            type: v.type,
            color: v.color,
            engineNumber: v.engineCC ? `${v.engineCC}cc` : undefined
          };
        }
        if (!finalPrice) finalPrice = v.pricePerDay;
        if (!finalTotal) finalTotal = finalPrice * finalDays;
        if (!finalDeposit) finalDeposit = v.deposit || 0;
      }
    }

    // 3. Resolve customer info
    if (finalCustomer && mongoose.Types.ObjectId.isValid(finalCustomer)) {
      const c = await User.findById(finalCustomer);
      if (c && !finalCustInfo.fullName) {
        finalCustInfo = {
          fullName: c.fullName,
          phone: c.phone,
          cccd: c.cccd,
          drivingLicense: c.drivingLicense,
          drivingLicenseClass: c.drivingLicenseClass,
          address: c.address,
          email: c.email
        };
      }
    }

    if (!finalVehInfo.name && !finalVehInfo.licensePlate) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn phương tiện hợp lệ để lập hợp đồng.' });
    }
    if (!finalCustInfo.fullName) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn khách hàng hợp lệ để lập hợp đồng.' });
    }

    // Ensure customer and vehicle references are valid ObjectIds
    if (!finalCustomer || !mongoose.Types.ObjectId.isValid(finalCustomer)) finalCustomer = new mongoose.Types.ObjectId();
    if (!finalVehicle || !mongoose.Types.ObjectId.isValid(finalVehicle)) finalVehicle = new mongoose.Types.ObjectId();

    const initialStatus = req.body.status || 'pending_signature';
    const validBookingId = bookingId && mongoose.Types.ObjectId.isValid(bookingId) ? bookingId : null;

    let contract = null;
    if (validBookingId && typeof Contract.findOne === 'function') {
      const bookingMatch = [String(validBookingId), new mongoose.Types.ObjectId(validBookingId)];
      contract = await Contract.findOne({ booking: { $in: bookingMatch }, status: { $ne: 'cancelled' } });
    }

    if (contract) {
      contract.customerInfo = { ...(contract.customerInfo || {}), ...finalCustInfo };
      contract.vehicleInfo = { ...(contract.vehicleInfo || {}), ...finalVehInfo };
      if (termsAndConditions) contract.termsAndConditions = termsAndConditions;
      if (notes !== undefined) contract.notes = notes;
      if (paymentMethod) contract.paymentMethod = paymentMethod;
      if (req.body.customerSignature) {
        contract.customerSignature = req.body.customerSignature;
        contract.customerSignedAt = contract.customerSignedAt || new Date();
      }
      if (req.body.staffSignature) {
        contract.staffSignature = req.body.staffSignature;
        contract.staffSignedAt = new Date();
        if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
          contract.signedByStaff = req.user._id;
        }
      }
      if (initialStatus && contract.status !== 'active' && contract.status !== 'completed') {
        contract.status = initialStatus;
      }
      await contract.save();
    } else {
      const existingCodes = await Contract.find({}, 'contractCode').lean();
      let maxNum = 0;
      for (const c of existingCodes) {
        const m = /^HD(\d+)$/i.exec(c.contractCode || '');
        if (m) maxNum = Math.max(maxNum, Number(m[1]));
      }
      const contractCode = `HD${String(maxNum + 1).padStart(4, '0')}`;

      contract = await Contract.create({
        contractCode,
        booking: validBookingId,
        customer: finalCustomer,
        vehicle: finalVehicle,
        driver: (driverId && mongoose.Types.ObjectId.isValid(driverId)) ? driverId : null,
        customerInfo: finalCustInfo,
        vehicleInfo: finalVehInfo,
        startDate: finalStart,
        endDate: finalEnd,
        rentalDays: finalDays,
        pricePerDay: finalPrice,
        totalRentalFee: finalTotal,
        depositAmount: finalDeposit,
        totalPayable: finalTotal,
        paidAmount: finalPaid,
        paymentMethod: paymentMethod || 'cash',
        termsAndConditions,
        notes,
        status: initialStatus,
        customerSignature: req.body.customerSignature || null,
        customerSignedAt: req.body.customerSignature ? new Date() : null,
        staffSignature: req.body.staffSignature || null,
        staffSignedAt: req.body.staffSignature ? new Date() : null,
        signedByStaff: (req.body.staffSignature && req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) ? req.user._id : undefined,
        createdBy: req.user?._id || new mongoose.Types.ObjectId()
      });
    }

    // Update vehicle status to reserved only when booking is already paid or staff-created (not unpaid online draft)
    const isUnpaidOnlineBooking = Boolean(
      linkedBooking &&
      linkedBooking.bookingSource === 'online' &&
      linkedBooking.paymentStatus === 'unpaid' &&
      initialStatus === 'pending_signature'
    );
    if (mongoose.Types.ObjectId.isValid(finalVehicle) && !isUnpaidOnlineBooking && initialStatus !== 'active') {
      await Vehicle.findByIdAndUpdate(finalVehicle, { status: 'reserved' });
    }

    // Link and update booking if attached
    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      const nextBookingStatus = initialStatus === 'active' ? 'active' : (initialStatus === 'confirmed' ? 'confirmed' : 'pending');
      await Booking.findByIdAndUpdate(bookingId, {
        status: nextBookingStatus,
      });
    }

    res.status(201).json({ success: true, message: 'Tạo hợp đồng thành công.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/contracts/:id/handover - Giao xe (Bàn giao xe với ảnh & chữ ký 2 bên)
router.put('/:id/handover', checkAuthOrAdmin, async (req, res) => {
  try {
    const {
      checkInOdometer,
      checkInNote,
      checkInImages,
      checkInCustomerSignature,
      checkInStaffSignature,
      bookingId
    } = req.body;

    const contract = await findContract(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    contract.checkInTime = new Date();
    if (checkInOdometer !== undefined) contract.checkInOdometer = Number(checkInOdometer);
    if (checkInNote) contract.checkInNote = checkInNote;
    if (checkInImages && Array.isArray(checkInImages)) contract.checkInImages = checkInImages;
    if (checkInCustomerSignature) {
      contract.checkInCustomerSignature = checkInCustomerSignature;
      if (!contract.customerSignature) contract.customerSignature = checkInCustomerSignature;
    }
    if (checkInStaffSignature) {
      contract.checkInStaffSignature = checkInStaffSignature;
      if (!contract.staffSignature) contract.staffSignature = checkInStaffSignature;
    }

    contract.status = 'active';
    await contract.save();

    // Set vehicle status to rented
    if (contract.vehicle && mongoose.Types.ObjectId.isValid(contract.vehicle)) {
      await Vehicle.findByIdAndUpdate(contract.vehicle, {
        status: 'rented',
        odometer: checkInOdometer ? Number(checkInOdometer) : undefined
      });
    }

    // Update booking if linked
    const targetBookingId = bookingId || contract.booking;
    if (targetBookingId) {
      const updateData = {
        status: 'active',
        checkInTime: new Date(),
        checkInOdometer: checkInOdometer ? Number(checkInOdometer) : undefined,
        checkInNote: checkInNote || '',
        checkInImages: checkInImages || [],
        checkInSignature: checkInStaffSignature || checkInCustomerSignature || '',
        checkInCustomerSignature: checkInCustomerSignature || '',
        checkInStaff: req.user?._id
      };
      if (mongoose.Types.ObjectId.isValid(targetBookingId)) {
        await Booking.findByIdAndUpdate(targetBookingId, updateData);
      } else {
        await Booking.findOneAndUpdate(
          { $or: [{ _id: targetBookingId }, { bookingCode: targetBookingId }] },
          updateData
        );
      }
      if (!contract.booking) {
        contract.booking = targetBookingId;
      }
    }

    res.json({ success: true, message: 'Bàn giao xe thành công! Xe đã chính thức lăn bánh.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/contracts/:id/return - Trả xe (Kiểm tra xe với ảnh & chữ ký 2 bên)
router.put('/:id/return', checkAuthOrAdmin, async (req, res) => {
  try {
    const {
      actualReturnDate,
      finalPaymentAmount,
      returnNote,
      checkOutOdometer,
      checkOutImages,
      checkOutCustomerSignature,
      checkOutStaffSignature,
      lateFee,
      damageFee,
      fuelFee,
      bookingId
    } = req.body;

    const contract = await findContract(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    contract.actualReturnDate = actualReturnDate ? new Date(actualReturnDate) : new Date();
    contract.checkOutTime = contract.actualReturnDate;
    if (checkOutOdometer !== undefined) contract.checkOutOdometer = Number(checkOutOdometer);
    if (returnNote) {
      contract.checkOutNote = returnNote;
      contract.notes = (contract.notes ? contract.notes + '\n' : '') + `[Trả xe]: ${returnNote}`;
    }
    if (checkOutImages && Array.isArray(checkOutImages)) contract.checkOutImages = checkOutImages;
    if (checkOutCustomerSignature) contract.checkOutCustomerSignature = checkOutCustomerSignature;
    if (checkOutStaffSignature) contract.checkOutStaffSignature = checkOutStaffSignature;

    if (lateFee) contract.lateFee = Number(lateFee);
    if (damageFee) contract.damageFee = Number(damageFee);
    if (fuelFee) contract.fuelFee = Number(fuelFee);

    const extraFees = (Number(lateFee) || 0) + (Number(damageFee) || 0) + (Number(fuelFee) || 0);
    contract.totalPayable = (contract.totalPayable || contract.totalRentalFee || 0) + extraFees;

    if (finalPaymentAmount !== undefined) {
      contract.paidAmount = (contract.paidAmount || 0) + Number(finalPaymentAmount);
    } else {
      contract.paidAmount = contract.totalPayable;
    }

    contract.status = 'completed';
    await contract.save();

    // Release vehicle back to available
    if (contract.vehicle && mongoose.Types.ObjectId.isValid(contract.vehicle)) {
      await Vehicle.findByIdAndUpdate(contract.vehicle, {
        status: 'available',
        odometer: checkOutOdometer ? Number(checkOutOdometer) : undefined
      });
    }

    // Complete booking if attached
    const targetBookingId = bookingId || contract.booking;
    if (targetBookingId) {
      const updateData = {
        status: 'completed',
        paymentStatus: 'fully_paid',
        checkOutTime: contract.actualReturnDate,
        checkOutOdometer: checkOutOdometer ? Number(checkOutOdometer) : undefined,
        checkOutNote: returnNote || '',
        checkOutImages: checkOutImages || [],
        checkOutSignature: checkOutStaffSignature || '',
        checkOutCustomerSignature: checkOutCustomerSignature || '',
        checkOutStaff: req.user?._id,
        returnStatus: 'customer_returned',
        customerReturnedAt: contract.actualReturnDate,
        customerReturnNote: returnNote || 'Khách trả xe tại quầy lễ tân',
        lateFee: Number(lateFee) || 0,
        damageFee: Number(damageFee) || 0,
        fuelFee: Number(fuelFee) || 0
      };
      let updatedBooking = null;
      if (mongoose.Types.ObjectId.isValid(targetBookingId)) {
        updatedBooking = await Booking.findByIdAndUpdate(targetBookingId, updateData, { new: true });
      } else {
        updatedBooking = await Booking.findOneAndUpdate(
          { $or: [{ _id: targetBookingId }, { bookingCode: targetBookingId }] },
          updateData,
          { new: true }
        );
      }
      if (updatedBooking) {
        try {
          const Notification = require('../models/Notification');
          const techs = await User.find({ role: { $in: ['technician', 'admin'] }, isActive: { $ne: false } }).select('_id');
          if (techs.length > 0) {
            await Notification.insertMany(techs.map(t => ({
              recipient: t._id,
              title: `Xe ${contract.vehicleInfo?.name || ''} (${contract.vehicleInfo?.licensePlate || ''}) vừa trả tại quầy`,
              message: `Đơn ${updatedBooking.bookingCode} vừa làm thủ tục trả xe (${returnNote || 'không ghi chú'}). Chờ KTV tiếp nhận kiểm tra.`,
              type: 'maintenance',
              link: '/technician',
              data: { bookingId: updatedBooking._id, vehicleId: updatedBooking.vehicle, action: 'customer_returned' }
            })));
          }
        } catch {}
      }
    }

    res.json({ success: true, message: 'Nhận trả xe và thanh lý hợp đồng thành công.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/contracts/:id - Edit contract
router.put('/:id', checkAuthOrAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      totalPayable,
      depositAmount,
      paidAmount,
      driverId,
      status,
      notes
    } = req.body;

    const contract = await findContract(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    if (startDate) contract.startDate = new Date(startDate);
    if (endDate) contract.endDate = new Date(endDate);
    if (totalPayable !== undefined) contract.totalPayable = Number(totalPayable);
    if (depositAmount !== undefined) contract.depositAmount = Number(depositAmount);
    if (paidAmount !== undefined) contract.paidAmount = Number(paidAmount);
    if (driverId && mongoose.Types.ObjectId.isValid(driverId)) contract.driver = driverId;
    if (status) contract.status = status;
    if (notes !== undefined) contract.notes = notes;

    await contract.save();
    res.json({ success: true, message: 'Cập nhật hợp đồng thành công.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/contracts/:id - Cancel or permanently delete contract (?permanent=true)
router.delete('/:id', checkAuthOrAdmin, async (req, res) => {
  try {
    if (req.user?.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa hợp đồng.' });
    }

    const contract = await findContract(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    const isPermanent = String(req.query.permanent) === 'true';

    // Release vehicle back to available if contract was holding it and no other active booking/contract exists
    if (contract.vehicle && mongoose.Types.ObjectId.isValid(contract.vehicle)) {
      const wasHoldingVehicle = ['active', 'confirmed'].includes(contract.status);
      if (wasHoldingVehicle || !isPermanent) {
        const otherActive = await Contract.findOne({
          _id: { $ne: contract._id },
          vehicle: contract.vehicle,
          status: 'active'
        });
        const otherActiveBooking = await Booking.findOne({
          ...(contract.booking && mongoose.Types.ObjectId.isValid(contract.booking) ? { _id: { $ne: contract.booking } } : {}),
          vehicle: contract.vehicle,
          status: 'active'
        });
        if (!otherActive && !otherActiveBooking) {
          await Vehicle.findByIdAndUpdate(contract.vehicle, { status: 'available' });
        }
      }
    }

    if (isPermanent) {
      await Contract.findByIdAndDelete(contract._id);
      return res.json({ success: true, message: 'Xóa hợp đồng thành công.' });
    }

    contract.status = 'cancelled';
    await contract.save();
    res.json({ success: true, message: 'Hủy hợp đồng thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/contracts/:id/sign - Customer & Staff sign
router.put('/:id/sign', checkAuthOrAdmin, async (req, res) => {
  try {
    const { customerSignature, staffSignature } = req.body;
    const contract = await findContract(req.params.id);
    if (!contract) return res.status(404).json({ success: false, message: 'Không tìm thấy hợp đồng.' });

    if (customerSignature) {
      contract.customerSignature = customerSignature;
      contract.customerSignedAt = new Date();
      // Customer signed online -> Contract is pending admin/staff approval
      if (contract.status !== 'confirmed' && contract.status !== 'active') {
        contract.status = 'pending_approval';
      }
    }

    if (staffSignature) {
      contract.staffSignature = staffSignature;
      contract.staffSignedAt = new Date();
      if (req.user?._id && mongoose.Types.ObjectId.isValid(req.user._id)) {
        contract.signedByStaff = req.user._id;
      }
      // Staff approved & signed -> Contract is confirmed (Ready for handover)
      if (contract.status !== 'active' && contract.status !== 'completed') {
        contract.status = 'confirmed';
      }
      if (contract.vehicle && mongoose.Types.ObjectId.isValid(contract.vehicle)) {
        await Vehicle.findByIdAndUpdate(contract.vehicle, { status: 'reserved' });
      }
      if (contract.booking && mongoose.Types.ObjectId.isValid(contract.booking)) {
        await Booking.findByIdAndUpdate(contract.booking, { status: 'confirmed' });
      }
    }

    await contract.save();
    res.json({ success: true, message: 'Ký hợp đồng thành công.', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
