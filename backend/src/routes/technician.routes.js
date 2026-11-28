const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Contract = require('../models/Contract');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const Notification = require('../models/Notification');
const SparePart = require('../models/SparePart');
const ReturnInspection = require('../models/ReturnInspection');
const DamageReport = require('../models/DamageReport');
const RepairOrder = require('../models/RepairOrder');
const { protect, authorize } = require('../middleware/auth');

const DEFAULT_SPARE_PARTS = [
  { code: 'PT-OIL-01', name: 'Nhớt tổng hợp Motul Scooter Expert 10W40 (1L)', category: 'Động cơ & Dầu nhớt', unitPrice: 145000, laborFee: 20000, warranty: 'Định kỳ 2.500 km', stock: 42, compatible: 'Xe tay ga 110cc - 160cc' },
  { code: 'PT-BRK-01', name: 'Má phanh đĩa trước Nissin chính hãng', category: 'Hệ thống phanh', unitPrice: 320000, laborFee: 50000, warranty: '6 tháng', stock: 16, compatible: 'Air Blade, Vision, Winner X, SH' },
  { code: 'PT-BRK-02', name: 'Má phanh sau Honda chính hãng', category: 'Hệ thống phanh', unitPrice: 210000, laborFee: 40000, warranty: '6 tháng', stock: 18, compatible: 'Wave, Sirius, Vision, Air Blade' },
  { code: 'PT-TIR-01', name: 'Lốp không săm IRC / Chengshin 90/90-14', category: 'Lốp & Bánh xe', unitPrice: 540000, laborFee: 60000, warranty: '12 tháng / 10.000 km', stock: 9, compatible: 'Air Blade, Vision, SH Mode' },
  { code: 'PT-MIR-01', name: 'Gương chiếu hậu nguyên bản Honda (Cặp)', category: 'Gương & Dàn áo', unitPrice: 280000, laborFee: 30000, warranty: '3 tháng', stock: 14, compatible: 'Đa dòng xe Honda' },
  { code: 'PT-BDY-01', name: 'Ốp cánh yếm trước chính hãng Honda', category: 'Gương & Dàn áo', unitPrice: 780000, laborFee: 80000, warranty: '6 tháng', stock: 4, compatible: 'Air Blade, Winner X, Vision' },
  { code: 'PT-LGT-01', name: 'Cụm đèn pha LED 2 tầng siêu sáng', category: 'Hệ thống đèn & Còi', unitPrice: 920000, laborFee: 90000, warranty: '12 tháng', stock: 6, compatible: 'Vision, Winner X, Wave' },
  { code: 'PT-LV-01', name: 'Tay phanh nhôm CNC nguyên khối', category: 'Hệ thống phanh', unitPrice: 180000, laborFee: 30000, warranty: '6 tháng', stock: 12, compatible: 'Winner X, Exciter, ADV' },
  { code: 'PT-TRN-01', name: 'Bộ nhông sên dĩa DID Vàng', category: 'Truyền động', unitPrice: 460000, laborFee: 80000, warranty: '10.000 km', stock: 11, compatible: 'Winner X, Exciter, Sirius, Wave' }
];

async function ensureSeededParts() {
  const count = await SparePart.countDocuments();
  if (count === 0) {
    await SparePart.insertMany(DEFAULT_SPARE_PARTS);
  }
}

async function notifyRoleUsers(roles, payload) {
  try {
    const users = await User.find({ role: { $in: roles }, isActive: { $ne: false } }).select('_id');
    if (users.length > 0) {
      await Notification.insertMany(users.map(u => ({ ...payload, recipient: u._id })));
    }
  } catch {}
}

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function resolveImgList(imgs) {
  if (!Array.isArray(imgs)) return [];
  return imgs
    .map(i => (typeof i === 'string' ? i : i?.url))
    .filter(Boolean);
}

function mapPart(p) {
  return {
    id: String(p._id),
    code: p.code,
    name: p.name,
    category: p.category,
    unitPrice: p.unitPrice,
    laborFee: p.laborFee,
    warranty: p.warranty,
    stock: p.stock,
    compatible: p.compatible
  };
}

function mapInspection(doc) {
  return {
    id: String(doc._id),
    inspectionCode: doc.inspectionCode,
    bookingId: String(doc.booking),
    bookingCode: doc.bookingCode,
    isRealBooking: true,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone || '',
    customerIdCard: doc.customerIdCard || '',
    vehicleId: String(doc.vehicle),
    vehicleName: doc.vehicleName,
    licensePlate: doc.licensePlate,
    vehicleImage: doc.vehicleImage || '',
    rentalStartDate: doc.rentalStartDate || '',
    rentalEndDate: doc.rentalEndDate || '',
    returnDate: doc.returnDate || '',
    deliveryOdometer: doc.deliveryOdometer || 0,
    returnOdometer: doc.returnOdometer || 0,
    fuelLevel: doc.fuelLevel ?? 100,
    deliveryImages: doc.deliveryImages || [],
    returnImages: doc.returnImages || [],
    checklist: doc.checklist || [],
    pins: doc.pins || [],
    brakes: doc.brakes !== false,
    tires: doc.tires !== false,
    lightsAndHorn: doc.lightsAndHorn !== false,
    engine: doc.engine !== false,
    mirrorsAndBody: doc.mirrorsAndBody !== false,
    status: doc.status || 'draft',
    notes: doc.notes || '',
    inspectorName: doc.inspectorName || '',
    hasDamageReport: Boolean(doc.hasDamageReport),
    damageReportId: doc.damageReport ? String(doc.damageReport) : undefined
  };
}

function mapDamageReport(doc) {
  return {
    id: String(doc._id),
    code: doc.code,
    inspectionId: doc.inspection ? String(doc.inspection) : undefined,
    bookingCode: doc.bookingCode,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone || '',
    vehicleId: String(doc.vehicle),
    vehicleName: doc.vehicleName,
    licensePlate: doc.licensePlate,
    reportedAt: doc.reportedAt || nowStamp(),
    inspectorName: doc.inspectorName || '',
    positions: doc.positions || [],
    overallSeverity: doc.overallSeverity || 'medium',
    notes: doc.notes || '',
    status: doc.status || 'confirmed',
    repairId: doc.repairOrder ? String(doc.repairOrder) : undefined,
    customerAgreedSignature: Boolean(doc.customerAgreedSignature)
  };
}

function mapRepair(doc) {
  return {
    id: String(doc._id),
    code: doc.code,
    damageReportId: doc.damageReport ? String(doc.damageReport) : undefined,
    damageReportCode: doc.damageReportCode,
    bookingCode: doc.bookingCode || '',
    vehicleId: String(doc.vehicle),
    vehicleCode: doc.vehicleCode,
    vehicleName: doc.vehicleName,
    licensePlate: doc.licensePlate,
    vehicleOdo: doc.vehicleOdo || 0,
    vehicleType: doc.vehicleType,
    vehicleColor: doc.vehicleColor,
    vehicleImage: doc.vehicleImage,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone || '',
    issueSummary: doc.issueSummary || '',
    proposedSolution: doc.proposedSolution,
    parts: doc.parts || [],
    totalPartsPrice: doc.totalPartsPrice || 0,
    totalLaborFee: doc.totalLaborFee || 0,
    totalEstimatedCost: doc.totalEstimatedCost || 0,
    actualCost: doc.actualCost,
    status: doc.status || 'waiting_quote',
    progressPercent: doc.progressPercent ?? 10,
    customerFeedbackDate: doc.customerFeedbackDate,
    customerFeedbackNote: doc.customerFeedbackNote,
    technicianName: doc.technicianName || '',
    technicianNotes: doc.technicianNotes,
    damageItems: doc.damageItems || [],
    beforePhotos: doc.beforePhotos || [],
    afterPhotos: doc.afterPhotos || [],
    replacementPhotos: doc.replacementPhotos || [],
    completionNotes: doc.completionNotes,
    logs: doc.logs || [],
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 16).replace('T', ' ') : nowStamp(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString().slice(0, 16).replace('T', ' ') : undefined,
    completedAt: doc.completedAt
  };
}

/**
 * Compute bookings that have genuinely been returned by a customer and are eligible
 * for technician return acceptance/inspection.
 * Unreturned rentals (pending, confirmed, active with not_returned, cancelled) are excluded.
 */
async function getEligibleReturnedBookings() {
  const [bookings, existingInspections] = await Promise.all([
    Booking.find({ status: { $ne: 'cancelled' } })
      .populate('customer', 'fullName phone email cccd drivingLicense address')
      .populate('vehicle', 'name brand licensePlate type odometer mainImage images year engineCC color status isActive')
      .sort({ customerReturnedAt: -1, checkOutTime: -1, updatedAt: -1 }),
    ReturnInspection.find({}, 'booking').lean()
  ]);

  const inspectedBookingIds = new Set(existingInspections.map(i => String(i.booking)));
  const activeUnreturnedVehicleIds = new Set();

  for (const b of bookings) {
    if (b.status === 'active' && b.returnStatus !== 'customer_returned' && b.vehicle && b.vehicle.isActive !== false) {
      activeUnreturnedVehicleIds.add(String(b.vehicle._id || b.vehicle));
    }
  }

  const eligible = [];
  const seenVehicleIds = new Set();

  for (const b of bookings) {
    if (!b.vehicle || b.vehicle.isActive === false) continue;
    const bid = String(b._id);
    const vid = String(b.vehicle._id || b.vehicle);

    // Inspect at most the single most recent booking per physical vehicle
    if (seenVehicleIds.has(vid)) continue;
    seenVehicleIds.add(vid);

    if (inspectedBookingIds.has(bid)) continue;
    if (b.returnStatus === 'tech_accepted' || b.returnStatus === 'inspected') continue;
    if (activeUnreturnedVehicleIds.has(vid)) continue;

    // Strictly require a real customer/counter return awaiting technical acceptance
    if (b.returnStatus === 'customer_returned') {
      eligible.push({ booking: b, returnSource: 'customer_returned' });
    }
  }

  if (eligible.length === 0) return [];

  const bookingIds = eligible.map(item => item.booking._id);
  const contracts = await Contract.find({ booking: { $in: bookingIds } })
    .select('booking checkInImages checkOutImages checkInOdometer checkOutOdometer checkOutTime actualReturnDate')
    .lean();
  const contractByBooking = new Map();
  for (const c of contracts) {
    contractByBooking.set(String(c.booking), c);
  }

  return eligible.map(({ booking: b, returnSource }) => {
    const c = contractByBooking.get(String(b._id));
    const checkInImgs = resolveImgList(b.checkInImages?.length ? b.checkInImages : c?.checkInImages);
    const checkOutImgs = resolveImgList(b.checkOutImages?.length ? b.checkOutImages : c?.checkOutImages);
    const returnTime = b.customerReturnedAt || b.checkOutTime || c?.checkOutTime || c?.actualReturnDate;
    return {
      _id: String(b._id),
      bookingCode: b.bookingCode || String(b._id).slice(-8).toUpperCase(),
      status: b.status,
      returnStatus: b.returnStatus || 'not_returned',
      returnSource,
      customerReturnedAt: returnTime,
      customerReturnNote: b.customerReturnNote || b.checkOutNote || '',
      startDate: b.startDate,
      endDate: b.endDate,
      checkInOdometer: Number(b.checkInOdometer || c?.checkInOdometer || b.vehicle?.odometer || 0),
      checkOutOdometer: Number(b.checkOutOdometer || c?.checkOutOdometer || b.vehicle?.odometer || 0),
      checkInImages: checkInImgs,
      checkOutImages: checkOutImgs,
      customer: b.customer ? {
        _id: String(b.customer._id),
        fullName: b.customer.fullName,
        phone: b.customer.phone || '',
        email: b.customer.email || '',
        cccd: b.customer.cccd || '',
        address: b.customer.address || ''
      } : { fullName: 'Khách thuê xe', phone: '' },
      vehicle: {
        _id: String(b.vehicle._id),
        name: b.vehicle.name,
        brand: b.vehicle.brand,
        licensePlate: b.vehicle.licensePlate,
        type: b.vehicle.type,
        odometer: b.vehicle.odometer || 0,
        mainImage: b.vehicle.mainImage || b.vehicle.images?.[0]?.url || '',
        status: b.vehicle.status
      }
    };
  });
}

router.use(protect);

// Customer endpoints for viewing and confirming/rejecting repair quotes on their bookings
router.get('/my-repairs', async (req, res) => {
  try {
    const customerBookings = await Booking.find({ customer: req.user._id }).select('_id bookingCode').lean();
    const bookingIds = customerBookings.map(b => b._id);
    const bookingCodes = customerBookings.map(b => b.bookingCode).filter(Boolean);
    const repairs = await RepairOrder.find({
      $or: [
        { customer: req.user._id },
        { booking: { $in: bookingIds } },
        { bookingCode: { $in: bookingCodes } }
      ]
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: repairs.map(mapRepair) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/repairs/:id/customer-feedback', async (req, res) => {
  try {
    const { approved, note } = req.body;
    const repair = await RepairOrder.findById(req.params.id);
    if (!repair) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu sửa chữa.' });

    if (req.user.role === 'customer') {
      const booking = repair.booking ? await Booking.findById(repair.booking) : null;
      const isOwner =
        (repair.customer && String(repair.customer) === String(req.user._id)) ||
        (booking && String(booking.customer) === String(req.user._id));
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Không có quyền phản hồi phiếu này.' });
      }
    }

    const ts = nowStamp();
    repair.status = approved ? 'customer_approved' : 'customer_rejected';
    repair.progressPercent = approved ? 40 : 0;
    repair.customerFeedbackDate = ts;
    repair.customerFeedbackNote = note || (approved ? 'Khách hàng xác nhận đồng ý báo giá.' : 'Khách hàng từ chối sửa chữa.');
    repair.logs = [
      ...(repair.logs || []),
      {
        id: `log-${Date.now()}`,
        title: approved ? 'Khách hàng đồng ý báo giá sửa chữa' : 'Khách hàng từ chối sửa chữa',
        note: repair.customerFeedbackNote,
        actor: req.user.fullName,
        timestamp: ts
      }
    ];
    await repair.save();

    await notifyRoleUsers(['technician', 'admin'], {
      title: approved ? `Khách đã duyệt báo giá ${repair.code}` : `Khách từ chối phiếu ${repair.code}`,
      message: `${req.user.fullName} phản hồi phiếu ${repair.code} (${repair.licensePlate}): ${repair.customerFeedbackNote}`,
      type: approved ? 'maintenance' : 'alert',
      link: '/technician',
      data: { repairId: repair._id }
    });

    res.json({ success: true, message: 'Đã ghi nhận phản hồi báo giá.', data: mapRepair(repair) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Technician & Staff endpoints below
router.use(authorize('owner', 'admin', 'technician'));

// Consolidated overview for Technician Portal
router.get('/overview', async (req, res) => {
  try {
    await ensureSeededParts();
    const [inspections, damageReports, repairs, parts, returnedBookings] = await Promise.all([
      ReturnInspection.find().sort({ createdAt: -1 }),
      DamageReport.find().sort({ createdAt: -1 }),
      RepairOrder.find().sort({ createdAt: -1 }),
      SparePart.find({ isActive: true }).sort({ code: 1 }),
      getEligibleReturnedBookings()
    ]);

    res.json({
      success: true,
      data: {
        inspections: inspections.map(mapInspection),
        damageReports: damageReports.map(mapDamageReport),
        repairs: repairs.map(mapRepair),
        parts: parts.map(mapPart),
        returnedBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Eligible returned bookings only (strictly customer-returned vehicles)
router.get('/returned-bookings', async (req, res) => {
  try {
    const data = await getEligibleReturnedBookings();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Real customers & technicians list derived from MongoDB User + Booking + RepairOrder + Maintenance
router.get('/users', async (req, res) => {
  try {
    const [customerUsers, techUsers, bookings, repairs, maints, damageReports] = await Promise.all([
      User.find({ role: 'customer', isActive: { $ne: false } }).select('-password').sort({ createdAt: -1 }).lean(),
      User.find({ role: 'technician', isActive: { $ne: false } }).select('-password').sort({ createdAt: -1 }).lean(),
      Booking.find().select('customer status finalPrice paymentStatus vehicle startDate').lean(),
      RepairOrder.find().select('technician technicianName status customer customerName').lean(),
      Maintenance.find().select('technician status').lean(),
      DamageReport.find().select('customerName overallSeverity code').lean()
    ]);

    const bookingStatsByCust = new Map();
    for (const b of bookings) {
      const cid = String(b.customer);
      const curr = bookingStatsByCust.get(cid) || { totalRentals: 0, debtAmount: 0 };
      if (b.status !== 'cancelled') curr.totalRentals += 1;
      if (b.status === 'overdue' && b.paymentStatus !== 'fully_paid') {
        curr.debtAmount += Number(b.finalPrice || 0);
      }
      bookingStatsByCust.set(cid, curr);
    }

    const dmgByCustomerName = new Map();
    for (const d of damageReports) {
      if (d.customerName) dmgByCustomerName.set(d.customerName, d);
    }

    const customers = customerUsers.map(u => {
      const stats = bookingStatsByCust.get(String(u._id)) || { totalRentals: 0, debtAmount: 0 };
      const dmg = dmgByCustomerName.get(u.fullName);
      const hasRisk = Boolean(dmg && (dmg.overallSeverity === 'high' || dmg.overallSeverity === 'critical'));
      return {
        _id: String(u._id),
        customerCode: `KH${String(u._id).slice(-4).toUpperCase()}`,
        fullName: u.fullName,
        phone: u.phone || 'Chưa cập nhật',
        email: u.email,
        cccd: u.cccd || '',
        drivingLicense: u.drivingLicense || '',
        drivingLicenseClass: u.drivingLicenseClass || 'A1',
        customerType: hasRisk ? 'high_risk' : (u.email?.startsWith('walkin_') || u.email?.startsWith('guest_')) ? 'walk_in' : 'standard',
        customerTier: stats.totalRentals >= 5 ? 'vip' : 'regular',
        address: u.address || 'Hải Châu, Đà Nẵng',
        isBlacklisted: hasRisk,
        riskReason: dmg ? `Ghi nhận biên bản ${dmg.code} (mức ${dmg.overallSeverity})` : undefined,
        notes: `Tổng ${stats.totalRentals} lượt thuê xe tại hệ thống.`,
        debtAmount: stats.debtAmount,
        totalRentals: stats.totalRentals,
        isRealRecord: true,
        createdAt: u.createdAt
      };
    });

    const technicians = techUsers.map((t, idx) => {
      const activeRepairs = repairs.filter(
        r => (String(r.technician) === String(t._id) || r.technicianName === t.fullName) && r.status !== 'completed' && r.status !== 'customer_rejected'
      ).length;
      const activeMaints = maints.filter(
        m => String(m.technician) === String(t._id) && (m.status === 'scheduled' || m.status === 'in_progress')
      ).length;
      const completedRepairs = repairs.filter(
        r => (String(r.technician) === String(t._id) || r.technicianName === t.fullName) && r.status === 'completed'
      ).length;
      const completedMaints = maints.filter(
        m => String(m.technician) === String(t._id) && m.status === 'completed'
      ).length;

      return {
        id: String(t._id),
        code: t.employeeId || `KTV-${String(idx + 1).padStart(3, '0')}`,
        fullName: t.fullName,
        roleTitle: idx === 0 ? 'Nhân viên Kỹ thuật trưởng' : 'Kỹ thuật viên bảo trì & sửa chữa',
        phone: t.phone || '',
        email: t.email,
        specialty: 'Kiểm định xe trả, Phanh ABS, Động cơ & Điện',
        shift: 'Ca hành chính (07:30 - 17:30)',
        activeJobs: activeRepairs + activeMaints,
        completedJobs: completedRepairs + completedMaints,
        status: activeRepairs + activeMaints > 2 ? 'busy' : 'online'
      };
    });

    res.json({ success: true, data: { customers, technicians } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Customer directly from Technician User Management
router.post('/customers', async (req, res) => {
  try {
    const { fullName, phone, email, cccd, drivingLicense, address } = req.body;
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên và số điện thoại khách hàng.' });
    }
    const existing = await User.findOne({ $or: [{ phone }, ...(email ? [{ email }] : [])] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Khách hàng với SĐT hoặc email này đã tồn tại.' });
    }
    const created = await User.create({
      fullName,
      phone,
      email: email || `cust_${Date.now()}@motobike.vn`,
      password: 'Customer@123',
      role: 'customer',
      cccd,
      drivingLicense,
      address: address || 'Hải Châu, Đà Nẵng',
      isEmailVerified: true
    });
    res.status(201).json({
      success: true,
      message: 'Đã thêm khách hàng mới vào hệ thống.',
      data: {
        _id: String(created._id),
        customerCode: `KH${String(created._id).slice(-4).toUpperCase()}`,
        fullName: created.fullName,
        phone: created.phone,
        email: created.email,
        cccd: created.cccd || '',
        drivingLicense: created.drivingLicense || '',
        drivingLicenseClass: 'A1',
        customerType: 'standard',
        customerTier: 'regular',
        address: created.address,
        isBlacklisted: false,
        debtAmount: 0,
        totalRentals: 0,
        isRealRecord: true,
        createdAt: created.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Customer User record
router.put('/customers/:id', async (req, res) => {
  try {
    const { fullName, phone, email, cccd, drivingLicense, drivingLicenseClass, address } = req.body;
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'customer' },
      {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(cccd !== undefined ? { cccd } : {}),
        ...(drivingLicense !== undefined ? { drivingLicense } : {}),
        ...(drivingLicenseClass !== undefined ? { drivingLicenseClass } : {}),
        ...(address !== undefined ? { address } : {})
      },
      { new: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    res.json({ success: true, message: 'Đã cập nhật thông tin khách hàng.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Accept returned vehicle & create ReturnInspection (ENFORCES customer return gating!)
router.post('/inspections', async (req, res) => {
  try {
    const {
      bookingId,
      deliveryOdometer,
      returnOdometer,
      fuelLevel,
      deliveryImages,
      returnImages,
      checklist,
      pins,
      brakes,
      tires,
      lightsAndHorn,
      engine,
      mirrorsAndBody,
      notes
    } = req.body;

    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được tiếp nhận xe từ đơn thuê thực tế đã được khách hàng trả xe!'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('customer', 'fullName phone cccd')
      .populate('vehicle');

    if (!booking || !booking.vehicle) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn thuê xe hoặc phương tiện.' });
    }

    const duplicate = await ReturnInspection.findOne({ booking: booking._id });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Đơn trả xe này đã được tiếp nhận kiểm tra trước đó.' });
    }

    // Strict check: only accept bookings where the customer has actually returned the vehicle
    const hasCounterCheckout = booking.status === 'completed' && Boolean(booking.checkOutTime);
    const hasExplicitCustomerReturn = booking.returnStatus === 'customer_returned';

    if (!hasExplicitCustomerReturn && !hasCounterCheckout) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tiếp nhận: Khách hàng chưa thực hiện trả xe cho đơn thuê này!'
      });
    }

    if (!hasExplicitCustomerReturn) {
      const newerActiveBooking = await Booking.findOne({
        _id: { $ne: booking._id },
        vehicle: booking.vehicle._id,
        status: 'active',
        returnStatus: { $ne: 'customer_returned' }
      });
      if (newerActiveBooking) {
        return res.status(400).json({
          success: false,
          message: 'Không thể tiếp nhận: Xe này hiện đang cho khách khác thuê chưa trả!'
        });
      }
    }

    const count = await ReturnInspection.countDocuments();
    const inspectionCode = `KT-2026-${String(count + 1).padStart(3, '0')}-${String(Date.now()).slice(-3)}`;

    const contract = await Contract.findOne({ booking: booking._id })
      .select('checkInImages checkOutImages checkInOdometer checkOutOdometer')
      .lean();

    const defaultDelivImgs = resolveImgList(booking.checkInImages?.length ? booking.checkInImages : contract?.checkInImages);
    const defaultRetImgs = resolveImgList(booking.checkOutImages?.length ? booking.checkOutImages : contract?.checkOutImages);
    const vehFallbackImg = booking.vehicle.mainImage || booking.vehicle.images?.[0]?.url || '';

    const doc = await ReturnInspection.create({
      inspectionCode,
      booking: booking._id,
      bookingCode: booking.bookingCode || String(booking._id).slice(-8).toUpperCase(),
      customer: booking.customer?._id,
      customerName: booking.customer?.fullName || 'Khách thuê xe',
      customerPhone: booking.customer?.phone || '',
      customerIdCard: booking.customer?.cccd || '',
      vehicle: booking.vehicle._id,
      vehicleName: booking.vehicle.name,
      licensePlate: booking.vehicle.licensePlate,
      vehicleImage: vehFallbackImg,
      rentalStartDate: booking.startDate ? new Date(booking.startDate).toISOString().slice(0, 16).replace('T', ' ') : '',
      rentalEndDate: booking.endDate ? new Date(booking.endDate).toISOString().slice(0, 16).replace('T', ' ') : '',
      returnDate: nowStamp(),
      deliveryOdometer: Number(deliveryOdometer ?? booking.checkInOdometer ?? booking.vehicle.odometer ?? 0),
      returnOdometer: Number(returnOdometer ?? booking.checkOutOdometer ?? booking.vehicle.odometer ?? 0),
      fuelLevel: Number(fuelLevel ?? 100),
      deliveryImages: Array.isArray(deliveryImages) && deliveryImages.length > 0 ? deliveryImages : (defaultDelivImgs.length > 0 ? defaultDelivImgs : (vehFallbackImg ? [vehFallbackImg] : [])),
      returnImages: Array.isArray(returnImages) && returnImages.length > 0 ? returnImages : (defaultRetImgs.length > 0 ? defaultRetImgs : (vehFallbackImg ? [vehFallbackImg] : [])),
      checklist: Array.isArray(checklist) ? checklist : [],
      pins: Array.isArray(pins) ? pins : [],
      brakes: brakes !== false,
      tires: tires !== false,
      lightsAndHorn: lightsAndHorn !== false,
      engine: engine !== false,
      mirrorsAndBody: mirrorsAndBody !== false,
      status: 'draft',
      notes: notes || booking.customerReturnNote || booking.checkOutNote || 'Đã tiếp nhận xe khách trả để kiểm tra 8 hạng mục.',
      inspector: req.user._id,
      inspectorName: req.user.fullName
    });

    booking.returnStatus = 'tech_accepted';
    booking.techAcceptedAt = new Date();
    booking.techAcceptedBy = req.user._id;
    booking.assignedTechnician = req.user._id;
    await booking.save();

    // Mark any older duplicate un-inspected returns on the same physical vehicle as superseded
    await Booking.updateMany(
      { _id: { $ne: booking._id }, vehicle: booking.vehicle._id, returnStatus: 'customer_returned' },
      { returnStatus: 'inspected' }
    );

    await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
      status: 'maintenance',
      odometer: Math.max(booking.vehicle.odometer || 0, doc.returnOdometer || 0)
    });

    res.status(201).json({ success: true, message: `Đã tiếp nhận phiếu ${inspectionCode}!`, data: mapInspection(doc) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update / Confirm Return Inspection
router.put('/inspections/:id', async (req, res) => {
  try {
    const doc = await ReturnInspection.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu kiểm tra.' });

    const updatable = [
      'returnOdometer', 'fuelLevel', 'deliveryImages', 'returnImages',
      'checklist', 'pins', 'brakes', 'tires', 'lightsAndHorn',
      'engine', 'mirrorsAndBody', 'status', 'notes'
    ];
    for (const key of updatable) {
      if (req.body[key] !== undefined) doc[key] = req.body[key];
    }
    await doc.save();

    if (doc.status === 'passed') {
      await Booking.findByIdAndUpdate(doc.booking, {
        returnStatus: 'inspected',
        checkOutOdometer: doc.returnOdometer
      });
      await Vehicle.findByIdAndUpdate(doc.vehicle, {
        status: 'available',
        odometer: doc.returnOdometer
      });
    } else if (doc.status === 'damaged') {
      await Booking.findByIdAndUpdate(doc.booking, {
        returnStatus: 'inspected',
        checkOutOdometer: doc.returnOdometer
      });
      await Vehicle.findByIdAndUpdate(doc.vehicle, {
        status: 'broken',
        odometer: doc.returnOdometer
      });
    }

    res.json({ success: true, message: 'Đã cập nhật phiếu kiểm tra.', data: mapInspection(doc) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Damage Report from Return Inspection
router.post('/damage-reports', async (req, res) => {
  try {
    const { inspectionId, positions, overallSeverity, notes, customerAgreedSignature } = req.body;
    const ins = inspectionId ? await ReturnInspection.findById(inspectionId) : null;
    if (!ins) {
      return res.status(400).json({ success: false, message: 'Biên bản hư hỏng phải gắn với một phiếu kiểm tra trả xe thực tế.' });
    }

    const count = await DamageReport.countDocuments();
    const code = `BBHH-2026-${String(count + 1).padStart(3, '0')}`;

    const report = await DamageReport.create({
      code,
      inspection: ins._id,
      booking: ins.booking,
      bookingCode: ins.bookingCode,
      customerName: ins.customerName,
      customerPhone: ins.customerPhone,
      vehicle: ins.vehicle,
      vehicleName: ins.vehicleName,
      licensePlate: ins.licensePlate,
      reportedAt: nowStamp(),
      inspector: req.user._id,
      inspectorName: req.user.fullName,
      positions: Array.isArray(positions) ? positions : [],
      overallSeverity: overallSeverity || 'medium',
      notes: notes || ins.notes,
      status: 'confirmed',
      customerAgreedSignature: customerAgreedSignature !== false
    });

    ins.status = 'damaged';
    ins.hasDamageReport = true;
    ins.damageReport = report._id;
    await ins.save();

    await Vehicle.findByIdAndUpdate(ins.vehicle, { status: 'broken' });

    await notifyRoleUsers(['owner', 'admin', 'receptionist'], {
      title: `Phát hiện hư hỏng ${code} (${ins.licensePlate})`,
      message: `KTV ${req.user.fullName} lập biên bản hư hỏng cho xe ${ins.vehicleName} (Đơn ${ins.bookingCode}).`,
      type: 'alert',
      link: '/dashboard/bookings',
      data: { damageReportId: report._id, vehicleId: ins.vehicle }
    });

    res.status(201).json({ success: true, message: `Đã lập biên bản ${code}!`, data: mapDamageReport(report) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Repair Order (from DamageReport or directly for a real Vehicle)
router.post('/repairs', async (req, res) => {
  try {
    const {
      damageReportId,
      vehicleId,
      bookingCode,
      customerName,
      customerPhone,
      issueSummary,
      proposedSolution,
      parts,
      totalPartsPrice,
      totalLaborFee,
      totalEstimatedCost,
      status,
      technicianNotes,
      damageItems,
      beforePhotos
    } = req.body;

    let dmg = null;
    if (damageReportId && mongoose.Types.ObjectId.isValid(damageReportId)) {
      dmg = await DamageReport.findById(damageReportId);
    }

    const targetVehId = dmg?.vehicle || vehicleId;
    if (!targetVehId || !mongoose.Types.ObjectId.isValid(targetVehId)) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn xe hợp lệ trong hệ thống.' });
    }
    const veh = await Vehicle.findById(targetVehId);
    if (!veh) return res.status(404).json({ success: false, message: 'Không tìm thấy phương tiện.' });

    const booking = bookingCode
      ? await Booking.findOne({ bookingCode }).select('_id customer')
      : dmg?.booking
      ? await Booking.findById(dmg.booking).select('_id customer')
      : null;

    const count = await RepairOrder.countDocuments();
    const code = `PSC-2026-${String(count + 1).padStart(3, '0')}-${String(Date.now()).slice(-2)}`;
    const ts = nowStamp();

    const rep = await RepairOrder.create({
      code,
      damageReport: dmg?._id,
      damageReportCode: dmg?.code,
      booking: booking?._id || dmg?.booking,
      bookingCode: dmg?.bookingCode || bookingCode || 'Bảo trì nội bộ',
      vehicle: veh._id,
      vehicleCode: `MR-DN-${String(veh._id).slice(-3).toUpperCase()}`,
      vehicleName: veh.name,
      licensePlate: veh.licensePlate,
      vehicleOdo: veh.odometer || 0,
      vehicleType: veh.type,
      vehicleColor: veh.color,
      vehicleImage: veh.mainImage || veh.images?.[0]?.url || '',
      customer: booking?.customer,
      customerName: dmg?.customerName || customerName || 'Xe nội bộ / Bảo trì',
      customerPhone: dmg?.customerPhone || customerPhone || '',
      issueSummary: issueSummary || dmg?.positions?.map(p => `${p.position}: ${p.description}`).join('; ') || proposedSolution,
      proposedSolution: proposedSolution || 'Kiểm tra và khắc phục hư hỏng kỹ thuật',
      parts: Array.isArray(parts) ? parts : [],
      totalPartsPrice: Number(totalPartsPrice || 0),
      totalLaborFee: Number(totalLaborFee || 0),
      totalEstimatedCost: Number(totalEstimatedCost || 0),
      status: status || (dmg ? 'waiting_approval' : 'waiting_quote'),
      progressPercent: dmg ? 25 : 10,
      technician: req.user._id,
      technicianName: req.user.fullName,
      technicianNotes: technicianNotes || '',
      damageItems: Array.isArray(damageItems) ? damageItems : [],
      beforePhotos: Array.isArray(beforePhotos) ? beforePhotos : [],
      logs: [{
        id: `log-${Date.now()}`,
        title: dmg ? `Tạo phiếu ${code} từ ${dmg.code}` : `Tạo mới phiếu sửa chữa ${code}`,
        note: proposedSolution,
        actor: req.user.fullName,
        timestamp: ts
      }]
    });

    if (dmg) {
      dmg.status = 'repair_proposed';
      dmg.repairOrder = rep._id;
      await dmg.save();
    }

    await Vehicle.findByIdAndUpdate(veh._id, { status: 'maintenance' });

    if (booking?.customer && rep.status === 'waiting_approval') {
      await Notification.create({
        recipient: booking.customer,
        title: `Báo giá sửa chữa ${code} (${veh.licensePlate})`,
        message: `Kỹ thuật viên đề xuất phương án sửa chữa (${rep.totalEstimatedCost.toLocaleString('vi-VN')} đ). Vui lòng xác nhận.`,
        type: 'maintenance',
        link: '/portal',
        data: { repairId: rep._id, bookingId: booking._id }
      });
    }

    res.status(201).json({ success: true, message: `Đã tạo phiếu sửa chữa ${code}!`, data: mapRepair(rep) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Repair Order workflow (Quote, Approval, Progress, Actual Parts, Completion)
router.put('/repairs/:id', async (req, res) => {
  try {
    const rep = await RepairOrder.findById(req.params.id);
    if (!rep) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu sửa chữa.' });

    const prevStatus = rep.status;
    const fields = [
      'proposedSolution', 'parts', 'totalPartsPrice', 'totalLaborFee', 'totalEstimatedCost',
      'actualCost', 'status', 'progressPercent', 'customerFeedbackDate', 'customerFeedbackNote',
      'technicianNotes', 'damageItems', 'beforePhotos', 'afterPhotos', 'replacementPhotos',
      'completionNotes', 'logs', 'completedAt'
    ];
    for (const f of fields) {
      if (req.body[f] !== undefined) rep[f] = req.body[f];
    }

    if (req.body.status === 'waiting_approval' && prevStatus !== 'waiting_approval' && rep.customer) {
      try {
        await Notification.create({
          recipient: rep.customer,
          title: `Báo giá sửa chữa ${rep.code} (${rep.licensePlate})`,
          message: `Tổng chi phí dự kiến: ${(rep.totalEstimatedCost || 0).toLocaleString('vi-VN')} đ. Vui lòng kiểm tra và xác nhận.`,
          type: 'maintenance',
          link: '/portal',
          data: { repairId: rep._id }
        });
      } catch {}
    }

    if (req.body.status === 'in_progress') {
      await Vehicle.findByIdAndUpdate(rep.vehicle, { status: 'maintenance' });
    }

    if (req.body.status === 'completed' && prevStatus !== 'completed') {
      rep.completedAt = rep.completedAt || nowStamp();
      // Deduct real spare part stock from SparePart collection once
      if (!rep.stockDeducted && Array.isArray(rep.parts)) {
        for (const line of rep.parts) {
          if (line.partId && mongoose.Types.ObjectId.isValid(line.partId)) {
            await SparePart.findByIdAndUpdate(line.partId, {
              $inc: { stock: -Math.max(1, Number(line.quantity || 1)) }
            });
          } else if (line.partCode) {
            await SparePart.findOneAndUpdate(
              { code: line.partCode },
              { $inc: { stock: -Math.max(1, Number(line.quantity || 1)) } }
            );
          }
        }
        rep.stockDeducted = true;
      }

      await Vehicle.findByIdAndUpdate(rep.vehicle, {
        status: 'available',
        lastMaintenanceDate: new Date()
      });

      await notifyRoleUsers(['owner', 'admin', 'receptionist'], {
        title: `Hoàn thành sửa chữa ${rep.code} (${rep.licensePlate})`,
        message: `Xe ${rep.vehicleName} đã được KTV ${req.user.fullName} nghiệm thu hoàn tất và chuyển về Sẵn sàng.`,
        type: 'maintenance',
        link: '/dashboard/vehicles',
        data: { repairId: rep._id, vehicleId: rep.vehicle }
      });
    }

    await rep.save();
    res.json({ success: true, message: 'Đã cập nhật phiếu sửa chữa.', data: mapRepair(rep) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Spare Parts CRUD
router.post('/parts', async (req, res) => {
  try {
    const { code, name, category, unitPrice, laborFee, warranty, stock, compatible } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên phụ tùng.' });
    const count = await SparePart.countDocuments();
    const partCode = code?.trim() || `PT-NEW-${String(count + 1).padStart(2, '0')}`;
    const created = await SparePart.create({
      code: partCode,
      name: name.trim(),
      category: category || 'Phụ tùng chung',
      unitPrice: Number(unitPrice || 0),
      laborFee: Number(laborFee || 0),
      warranty: warranty || '6 tháng',
      stock: Number(stock || 0),
      compatible: compatible || 'Đa dòng xe'
    });
    res.status(201).json({ success: true, message: 'Đã thêm phụ tùng mới vào kho!', data: mapPart(created) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
