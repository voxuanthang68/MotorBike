const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Booking = require('../models/Booking');
const Contract = require('../models/Contract');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const RepairOrder = require('../models/RepairOrder');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

const VEHICLE_TYPE_LABELS = {
  scooter: 'Xe tay ga',
  manual: 'Xe số',
  'semi-automatic': 'Xe số bán tự động',
  clutch: 'Xe côn tay',
  sport: 'Xe mô tô thể thao',
  electric: 'Xe máy điện',
};

function populateTicketQuery(query) {
  return query
    .populate('customer', 'fullName phone email avatar cccd drivingLicense drivingLicenseClass address customerTier isBlacklisted')
    .populate({
      path: 'booking',
      select: 'bookingCode status paymentStatus paymentMethod startDate endDate totalDays pricePerDay deposit finalPrice totalPrice vehicle pickupLocation returnLocation rentalType',
      populate: {
        path: 'vehicle',
        select: 'name brand licensePlate model color type engineCC odometer status mainImage images pricePerDay',
      },
    })
    .populate('contract', 'contractCode status startDate endDate rentalDays totalPayable depositAmount paidAmount vehicleInfo')
    .populate('vehicle', 'name brand licensePlate model color type engineCC odometer status mainImage images pricePerDay')
    .populate('linkedRepairOrder', 'code status totalEstimatedCost licensePlate vehicleName proposedSolution createdAt')
    .populate('assignedTo', 'fullName phone role')
    .populate('resolvedBy', 'fullName role')
    .populate('messages.sender', 'fullName phone avatar role');
}

async function notifySupportTeam(payload, excludeUserId) {
  try {
    const staff = await User.find({
      role: { $in: ['support', 'admin', 'owner'] },
      isActive: { $ne: false },
      ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
    }).select('_id');
    if (staff.length > 0) {
      await Notification.insertMany(staff.map((u) => ({ ...payload, recipient: u._id })));
    }
  } catch {}
}

async function notifyTechnicians(payload) {
  try {
    const techs = await User.find({
      role: { $in: ['technician', 'admin'] },
      isActive: { $ne: false },
    }).select('_id');
    if (techs.length > 0) {
      await Notification.insertMany(techs.map((u) => ({ ...payload, recipient: u._id })));
    }
  } catch {}
}

// @GET /api/tickets/workspace/context - Reference context for Support Operations Dashboard
router.get('/workspace/context', authorize('owner', 'admin', 'support', 'receptionist'), async (req, res) => {
  try {
    const [customers, bookings, allVehicles, supportStaff, contracts, repairOrders] = await Promise.all([
      User.find({ role: 'customer', isActive: { $ne: false } })
        .select('fullName phone email cccd drivingLicense drivingLicenseClass address customerTier isBlacklisted')
        .sort({ createdAt: -1 })
        .limit(120),
      Booking.find({ status: { $in: ['active', 'confirmed', 'pending', 'overdue', 'completed'] } })
        .populate('customer', 'fullName phone cccd drivingLicense drivingLicenseClass address')
        .populate('vehicle', 'name brand licensePlate model color type engineCC odometer status mainImage images pricePerDay')
        .sort({ createdAt: -1 })
        .limit(120),
      Vehicle.find({ isActive: { $ne: false } })
        .select('name brand licensePlate model color type engineCC odometer status mainImage images pricePerDay deposit')
        .sort({ name: 1 }),
      User.find({ role: { $in: ['support', 'admin', 'owner'] }, isActive: { $ne: false } })
        .select('fullName phone role')
        .sort({ role: 1, fullName: 1 }),
      Contract.find({ status: { $nin: ['cancelled', 'terminated'] } })
        .select('contractCode booking status startDate endDate rentalDays totalRentalFee totalPayable depositAmount paidAmount customerInfo vehicleInfo')
        .sort({ createdAt: -1 })
        .limit(120),
      RepairOrder.find()
        .select('code booking bookingCode vehicle vehicleName licensePlate customerName customerPhone issueSummary proposedSolution totalEstimatedCost status progressPercent technicianName createdAt')
        .sort({ createdAt: -1 })
        .limit(80),
    ]);

    const availableVehicles = (allVehicles || []).filter((v) => v.status === 'available');

    res.json({
      success: true,
      data: {
        customers,
        bookings,
        availableVehicles,
        allVehicles,
        supportStaff,
        contracts,
        repairOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tickets - List tickets with filtering + live KPI summary
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search, assignedOnly } = req.query;
    const baseQuery = {};

    if (req.user.role === 'customer') {
      baseQuery.customer = req.user._id;
    } else if (assignedOnly === 'true') {
      baseQuery.assignedTo = req.user._id;
    }

    const filterQuery = { ...baseQuery };
    if (status && status !== 'all') filterQuery.status = status;
    if (priority && priority !== 'all') filterQuery.priority = priority;
    if (category && category !== 'all') filterQuery.category = category;

    let tickets = await populateTicketQuery(
      Ticket.find(filterQuery).sort({ lastMessageAt: -1, createdAt: -1 })
    );

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      tickets = tickets.filter((t) => {
        const code = (t.ticketCode || '').toLowerCase();
        const shortId = String(t._id || '').slice(-6).toLowerCase();
        const subj = (t.subject || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const custName = (t.customer?.fullName || '').toLowerCase();
        const custPhone = (t.customer?.phone || '').toLowerCase();
        const plate = (t.vehicle?.licensePlate || t.booking?.vehicle?.licensePlate || '').toLowerCase();
        const bookingCode = (t.booking?.bookingCode || '').toLowerCase();
        return (
          code.includes(q) ||
          shortId.includes(q) ||
          subj.includes(q) ||
          desc.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          plate.includes(q) ||
          bookingCode.includes(q)
        );
      });
    }

    const allForSummary = await Ticket.find(baseQuery).select('status priority hasUnreadCustomerMessage').lean();
    const summary = {
      all: allForSummary.length,
      open: allForSummary.filter((t) => t.status === 'open').length,
      in_progress: allForSummary.filter((t) => t.status === 'in_progress').length,
      resolved: allForSummary.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      urgent: allForSummary.filter((t) => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length,
      unread: allForSummary.filter((t) => t.hasUnreadCustomerMessage).length,
    };

    res.json({ success: true, data: tickets, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    }
    const ticket = await populateTicketQuery(Ticket.findById(req.params.id));
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    if (req.user.role === 'customer' && String(ticket.customer?._id || ticket.customer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem phiếu hỗ trợ này.' });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tickets - Create support/rescue ticket with automatic booking/vehicle/contract linking
router.post('/', upload.array('attachments', 3), async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const subject = String(req.body.subject || '').trim();
    const description = String(req.body.description || '').trim();
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và mô tả sự cố.' });
    }

    let resolvedCustomerId = isCustomer ? req.user._id : req.body.customerId;
    let resolvedBookingId = req.body.bookingId && mongoose.Types.ObjectId.isValid(req.body.bookingId) ? req.body.bookingId : undefined;
    let resolvedVehicleId = req.body.vehicleId && mongoose.Types.ObjectId.isValid(req.body.vehicleId) ? req.body.vehicleId : undefined;
    let resolvedContractId = req.body.contractId && mongoose.Types.ObjectId.isValid(req.body.contractId) ? req.body.contractId : undefined;

    if (resolvedBookingId) {
      const booking = await Booking.findById(resolvedBookingId).select('customer vehicle');
      if (booking) {
        if (!isCustomer && !resolvedCustomerId && booking.customer) resolvedCustomerId = booking.customer;
        if (!resolvedVehicleId && booking.vehicle) resolvedVehicleId = booking.vehicle;
        if (!resolvedContractId) {
          const linkedContract = await Contract.findOne({
            booking: { $in: [String(booking._id), booking._id] },
            status: { $ne: 'cancelled' },
          }).select('_id');
          if (linkedContract) resolvedContractId = linkedContract._id;
        }
      }
    } else if (isCustomer) {
      const activeBooking = await Booking.findOne({
        customer: req.user._id,
        status: { $in: ['active', 'confirmed', 'overdue'] },
      })
        .sort({ startDate: -1 })
        .select('_id vehicle');
      if (activeBooking) {
        resolvedBookingId = activeBooking._id;
        resolvedVehicleId = resolvedVehicleId || activeBooking.vehicle;
        const linkedContract = await Contract.findOne({
          booking: { $in: [String(activeBooking._id), activeBooking._id] },
          status: { $ne: 'cancelled' },
        }).select('_id');
        if (linkedContract) resolvedContractId = linkedContract._id;
      }
    }

    if (!isCustomer && (!resolvedCustomerId || !mongoose.Types.ObjectId.isValid(resolvedCustomerId))) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn khách hàng hoặc đơn đặt xe liên quan.' });
    }

    const data = {
      customer: resolvedCustomerId,
      booking: resolvedBookingId,
      contract: resolvedContractId,
      vehicle: resolvedVehicleId,
      subject,
      description,
      locationText: req.body.locationText ? String(req.body.locationText).trim() : '',
      category: req.body.category || 'vehicle_issue',
      priority: req.body.priority || 'medium',
      status: !isCustomer && req.body.assignToMe ? 'in_progress' : 'open',
      assignedTo: !isCustomer && req.body.assignToMe ? req.user._id : undefined,
      attachments: req.files?.map((f) => ({ url: `/uploads/misc/${f.filename}` })) || [],
      hasUnreadCustomerMessage: isCustomer,
      hasUnreadStaffMessage: !isCustomer,
      lastMessageAt: new Date(),
      lastSenderRole: req.user.role,
      actionLogs: [
        {
          action: 'created',
          detail: isCustomer ? 'Khách hàng gửi yêu cầu hỗ trợ' : 'Nhân viên hỗ trợ tiếp nhận & tạo phiếu qua hotline/quầy',
          actorName: req.user.fullName || 'Người dùng',
          actorRole: req.user.role,
          createdAt: new Date(),
        },
      ],
    };

    const ticket = await Ticket.create(data);
    const populated = await populateTicketQuery(Ticket.findById(ticket._id));

    if (isCustomer) {
      await notifySupportTeam(
        {
          title: ticket.priority === 'urgent' ? '🚨 Yêu cầu cứu hộ KHẨN CẤP mới' : '🎫 Yêu cầu hỗ trợ khách hàng mới',
          message: `#${ticket.ticketCode}: ${subject}`,
          type: 'ticket',
          link: '/support',
          data: { ticketId: ticket._id },
        },
        req.user._id
      );
    }

    res.status(201).json({ success: true, message: 'Gửi phiếu hỗ trợ thành công.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tickets/:id/reply
router.post('/:id/reply', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    let attachments = [];
    if (Array.isArray(req.body.attachments)) {
      attachments = req.body.attachments.filter(Boolean);
    } else if (req.body.attachment) {
      attachments = [req.body.attachment];
    } else if (req.body.image) {
      attachments = [req.body.image];
    }

    const isCustomer = req.user.role === 'customer';
    const content = String(req.body.content || '').trim();
    if (!content && attachments.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung hoặc đính kèm ảnh.' });
    }

    ticket.messages.push({
      sender: req.user._id,
      content,
      attachments,
      createdAt: new Date(),
    });

    ticket.lastMessageAt = new Date();
    ticket.lastSenderRole = req.user.role;

    if (isCustomer) {
      ticket.hasUnreadCustomerMessage = true;
      ticket.hasUnreadStaffMessage = false;
    } else {
      ticket.hasUnreadStaffMessage = true;
      ticket.hasUnreadCustomerMessage = false;
      if (!ticket.assignedTo) ticket.assignedTo = req.user._id;
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    }

    await ticket.save();

    try {
      if (isCustomer) {
        if (ticket.assignedTo) {
          await Notification.create({
            recipient: ticket.assignedTo,
            title: '💬 Khách hàng nhắn tin mới',
            message: `Phiếu #${ticket.ticketCode || String(ticket._id).slice(-6)}: "${(content || 'Gửi ảnh').slice(0, 60)}"`,
            type: 'ticket',
            link: '/support',
          });
        } else {
          await notifySupportTeam({
            title: '💬 Khách hàng nhắn tin hỗ trợ',
            message: `Phiếu #${ticket.ticketCode || String(ticket._id).slice(-6)}: "${(content || 'Gửi ảnh').slice(0, 60)}"`,
            type: 'ticket',
            link: '/support',
          });
        }
      } else if (ticket.customer) {
        await Notification.create({
          recipient: ticket.customer,
          title: '💬 Nhân viên hỗ trợ đã phản hồi',
          message: `Phản hồi phiếu #${ticket.ticketCode || ''}: "${(content || 'Gửi ảnh').slice(0, 60)}"`,
          type: 'ticket',
          link: '/portal',
        });
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    const populatedTicket = await populateTicketQuery(Ticket.findById(ticket._id));
    res.json({ success: true, message: 'Đã gửi phản hồi.', data: populatedTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/tickets/:id/mark-read
router.put('/:id/mark-read', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    if (req.user.role === 'customer') {
      ticket.hasUnreadStaffMessage = false;
    } else {
      ticket.hasUnreadCustomerMessage = false;
    }
    await ticket.save();
    res.json({ success: true, message: 'Đã đánh dấu đã đọc.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/tickets/:id/assign - Claim or assign support staff
router.put('/:id/assign', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    const targetStaffId = req.body.assignedTo && mongoose.Types.ObjectId.isValid(req.body.assignedTo)
      ? req.body.assignedTo
      : req.user._id;
    const staffUser = await User.findById(targetStaffId).select('fullName role');
    if (!staffUser) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên được phân công.' });

    ticket.assignedTo = staffUser._id;
    if (ticket.status === 'open') ticket.status = 'in_progress';
    ticket.actionLogs.push({
      action: 'assigned',
      detail: `Phân công xử lý cho ${staffUser.fullName}`,
      actorName: req.user.fullName || 'Hỗ trợ viên',
      actorRole: req.user.role,
      createdAt: new Date(),
    });
    await ticket.save();

    const populated = await populateTicketQuery(Ticket.findById(ticket._id));
    res.json({ success: true, message: `Đã giao phiếu cho ${staffUser.fullName}.`, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tickets/:id/link-context - Link or update booking/contract/vehicle/location/priority on ticket
router.post('/:id/link-context', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    const { bookingId, vehicleId, contractId, priority, category, locationText } = req.body;
    const changes = [];

    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      const b = await Booking.findById(bookingId).select('bookingCode customer vehicle');
      if (!b) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe.' });
      ticket.booking = b._id;
      if (!ticket.customer && b.customer) ticket.customer = b.customer;
      if (b.vehicle && !vehicleId) ticket.vehicle = b.vehicle;
      if (!contractId) {
        const c = await Contract.findOne({
          booking: { $in: [String(b._id), b._id] },
          status: { $ne: 'cancelled' },
        }).select('_id contractCode');
        if (c) ticket.contract = c._id;
      }
      changes.push(`Đơn ${b.bookingCode}`);
    }

    if (vehicleId && mongoose.Types.ObjectId.isValid(vehicleId)) {
      const v = await Vehicle.findById(vehicleId).select('licensePlate name');
      if (v) {
        ticket.vehicle = v._id;
        changes.push(`Xe ${v.licensePlate}`);
      }
    }

    if (contractId && mongoose.Types.ObjectId.isValid(contractId)) {
      ticket.contract = contractId;
    }

    if (priority) ticket.priority = priority;
    if (category) ticket.category = category;
    if (locationText !== undefined) ticket.locationText = String(locationText).trim();

    ticket.actionLogs.push({
      action: 'linked',
      detail: changes.length ? `Liên kết hồ sơ: ${changes.join(', ')}` : 'Cập nhật phân loại / vị trí sự cố',
      actorName: req.user.fullName || 'Hỗ trợ viên',
      actorRole: req.user.role,
      createdAt: new Date(),
    });

    await ticket.save();
    const populated = await populateTicketQuery(Ticket.findById(ticket._id));
    res.json({ success: true, message: 'Đã cập nhật thông tin liên kết cho phiếu hỗ trợ.', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tickets/:id/dispatch-repair - Escalate vehicle issue directly to Technician Portal (RepairOrder)
router.post('/:id/dispatch-repair', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const ticket = await populateTicketQuery(Ticket.findById(req.params.id));
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    const targetVehId = req.body.vehicleId || ticket.vehicle?._id || ticket.booking?.vehicle?._id;
    if (!targetVehId || !mongoose.Types.ObjectId.isValid(targetVehId)) {
      return res.status(400).json({ success: false, message: 'Vui lòng liên kết xe cho phiếu trước khi chuyển bộ phận kỹ thuật.' });
    }

    const veh = await Vehicle.findById(targetVehId);
    if (!veh) return res.status(404).json({ success: false, message: 'Không tìm thấy phương tiện.' });

    const issueSummary = String(req.body.issueSummary || ticket.subject || '').trim();
    const proposedSolution = String(req.body.proposedSolution || ticket.description || 'Kiểm tra & cứu hộ khắc phục sự cố theo yêu cầu hỗ trợ').trim();
    const nextVehStatus = req.body.markBroken ? 'broken' : 'maintenance';

    const count = await RepairOrder.countDocuments();
    const code = `PSC-2026-${String(count + 1).padStart(3, '0')}-${String(Date.now()).slice(-2)}`;
    const repairOrder = await RepairOrder.create({
      code,
      booking: ticket.booking?._id,
      bookingCode: ticket.booking?.bookingCode || `Ticket #${ticket.ticketCode}`,
      vehicle: veh._id,
      vehicleCode: `MR-DN-${String(veh._id).slice(-3).toUpperCase()}`,
      vehicleName: veh.name,
      licensePlate: veh.licensePlate,
      vehicleOdo: veh.odometer || 0,
      vehicleType: veh.type,
      vehicleColor: veh.color,
      vehicleImage: veh.mainImage || veh.images?.[0]?.url || '',
      customer: ticket.customer?._id,
      customerName: ticket.customer?.fullName || 'Khách thuê xe',
      customerPhone: ticket.customer?.phone || '',
      issueSummary,
      proposedSolution,
      status: 'waiting_quote',
      progressPercent: 10,
      technicianNotes: `Điều phối từ Hỗ trợ viên (${req.user.fullName}) - Ticket #${ticket.ticketCode}${ticket.locationText ? ` • Vị trí: ${ticket.locationText}` : ''}`,
      logs: [
        {
          id: `log-${Date.now()}`,
          title: `Chuyển từ Ticket hỗ trợ #${ticket.ticketCode}`,
          note: issueSummary,
          actor: req.user.fullName || 'Hỗ trợ viên',
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        },
      ],
    });

    await Vehicle.findByIdAndUpdate(veh._id, {
      status: nextVehStatus,
      techNote: `Sự cố từ Ticket #${ticket.ticketCode}: ${issueSummary}`,
    });

    ticket.vehicle = veh._id;
    ticket.linkedRepairOrder = repairOrder._id;
    ticket.rescueStatus = 'dispatched';
    ticket.status = 'in_progress';
    if (!ticket.assignedTo) ticket.assignedTo = req.user._id;
    ticket.actionLogs.push({
      action: 'dispatched_repair',
      detail: `Chuyển kỹ thuật xử lý xe ${veh.licensePlate} (Phiếu sửa chữa ${code})`,
      actorName: req.user.fullName || 'Hỗ trợ viên',
      actorRole: req.user.role,
      createdAt: new Date(),
    });
    ticket.messages.push({
      sender: req.user._id,
      content: `🔧 Đã tiếp nhận cứu hộ & tạo phiếu sửa chữa ${code} cho xe ${veh.licensePlate}. Bộ phận Kỹ thuật đang xử lý.`,
      createdAt: new Date(),
    });
    ticket.hasUnreadStaffMessage = true;
    ticket.lastMessageAt = new Date();
    ticket.lastSenderRole = req.user.role;
    await ticket.save();

    await notifyTechnicians({
      title: `🔧 Yêu cầu cứu hộ / sửa xe mới (${veh.licensePlate})`,
      message: `Hỗ trợ viên vừa chuyển Ticket #${ticket.ticketCode} (${issueSummary}) sang phiếu sửa ${code}.`,
      type: 'maintenance',
      link: '/technician',
      data: { repairOrderId: repairOrder._id, ticketId: ticket._id },
    });

    if (ticket.customer?._id) {
      await Notification.create({
        recipient: ticket.customer._id,
        title: `🚑 Đội cứu hộ / kỹ thuật đã tiếp nhận xe ${veh.licensePlate}`,
        message: `Phiếu hỗ trợ #${ticket.ticketCode} đã điều phối kỹ thuật viên (Mã kiểm tra: ${code}).`,
        type: 'ticket',
        link: '/portal',
      });
    }

    const populated = await populateTicketQuery(Ticket.findById(ticket._id));
    res.status(201).json({
      success: true,
      message: `Đã chuyển phiếu sửa ${code} sang bộ phận Kỹ thuật!`,
      data: { ticket: populated, repairOrder },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tickets/:id/swap-vehicle - Swap broken vehicle with an available bike on Booking + Contract
router.post('/:id/swap-vehicle', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const ticket = await populateTicketQuery(Ticket.findById(req.params.id));
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    const { newVehicleId, oldVehicleStatus = 'maintenance', note, createRepairOrder = true } = req.body;
    if (!newVehicleId || !mongoose.Types.ObjectId.isValid(newVehicleId)) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn xe thay thế hợp lệ.' });
    }

    const bookingId = req.body.bookingId || ticket.booking?._id;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Ticket chưa gắn với đơn đặt xe đang thuê nào.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || !['active', 'confirmed', 'overdue'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ đổi xe cho đơn đang hoạt động hoặc đã xác nhận.' });
    }

    const newVehicle = await Vehicle.findById(newVehicleId);
    if (!newVehicle || newVehicle.isActive === false) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe thay thế.' });
    }
    if (String(newVehicle._id) === String(booking.vehicle)) {
      return res.status(400).json({ success: false, message: 'Xe thay thế trùng với xe khách đang sử dụng.' });
    }
    if (newVehicle.status !== 'available') {
      return res.status(409).json({ success: false, message: `Xe ${newVehicle.licensePlate} hiện không ở trạng thái sẵn sàng (${newVehicle.status}).` });
    }

    const oldVehicle = await Vehicle.findById(booking.vehicle);
    const oldPlate = oldVehicle?.licensePlate || 'Xe cũ';

    if (oldVehicle) {
      oldVehicle.status = oldVehicleStatus === 'broken' ? 'broken' : 'maintenance';
      oldVehicle.techNote = `Đổi xe cho khách từ Ticket #${ticket.ticketCode}${note ? `: ${note}` : ''}`;
      await oldVehicle.save();
    }

    newVehicle.status = booking.status === 'active' || booking.status === 'overdue' ? 'rented' : 'reserved';
    await newVehicle.save();

    booking.vehicle = newVehicle._id;
    booking.staffNote = `${booking.staffNote ? `${booking.staffNote} | ` : ''}Đổi xe ${oldPlate} → ${newVehicle.licensePlate} (Ticket #${ticket.ticketCode})`;
    await booking.save();

    const translatedType = VEHICLE_TYPE_LABELS[newVehicle.type] || newVehicle.type || '';
    const updatedVehInfo = {
      name: newVehicle.name,
      licensePlate: newVehicle.licensePlate,
      brand: newVehicle.brand,
      model: newVehicle.model || newVehicle.name,
      type: translatedType || newVehicle.type,
      color: newVehicle.color,
      engineNumber: newVehicle.engineCC ? `${newVehicle.engineCC}cc` : undefined,
    };

    const linkedContract = ticket.contract?._id
      ? await Contract.findById(ticket.contract._id)
      : await Contract.findOne({ booking: { $in: [String(booking._id), booking._id] }, status: { $ne: 'cancelled' } });

    if (linkedContract) {
      linkedContract.vehicle = newVehicle._id;
      linkedContract.vehicleInfo = { ...(linkedContract.vehicleInfo || {}), ...updatedVehInfo };
      linkedContract.notes = `${linkedContract.notes ? `${linkedContract.notes} | ` : ''}Đổi từ xe ${oldPlate} sang ${newVehicle.licensePlate} theo Ticket #${ticket.ticketCode}`;
      await linkedContract.save();
    }

    let createdRepair = null;
    if (createRepairOrder && oldVehicle) {
      const count = await RepairOrder.countDocuments();
      const repairCode = `PSC-2026-${String(count + 1).padStart(3, '0')}-${String(Date.now()).slice(-2)}`;
      createdRepair = await RepairOrder.create({
        code: repairCode,
        booking: booking._id,
        bookingCode: booking.bookingCode,
        vehicle: oldVehicle._id,
        vehicleCode: `MR-DN-${String(oldVehicle._id).slice(-3).toUpperCase()}`,
        vehicleName: oldVehicle.name,
        licensePlate: oldVehicle.licensePlate,
        vehicleOdo: oldVehicle.odometer || 0,
        vehicleType: oldVehicle.type,
        vehicleColor: oldVehicle.color,
        vehicleImage: oldVehicle.mainImage || '',
        customer: booking.customer,
        customerName: ticket.customer?.fullName || 'Khách thuê xe',
        customerPhone: ticket.customer?.phone || '',
        issueSummary: note || ticket.subject || `Sự cố phát sinh khi đang thuê (đã đổi sang ${newVehicle.licensePlate})`,
        proposedSolution: 'Kiểm tra tổng quát và khắc phục sự cố sau khi đổi xe cho khách',
        status: 'waiting_quote',
        progressPercent: 10,
      });
      ticket.linkedRepairOrder = createdRepair._id;
    }

    ticket.booking = booking._id;
    if (linkedContract) ticket.contract = linkedContract._id;
    ticket.vehicle = newVehicle._id;
    ticket.rescueStatus = 'swapped_vehicle';
    ticket.status = 'in_progress';
    if (!ticket.assignedTo) ticket.assignedTo = req.user._id;
    ticket.actionLogs.push({
      action: 'swapped_vehicle',
      detail: `Đổi xe ${oldPlate} → ${newVehicle.licensePlate} (${newVehicle.name})${createdRepair ? ` • Đã tạo phiếu sửa ${createdRepair.code} cho xe cũ` : ''}`,
      actorName: req.user.fullName || 'Hỗ trợ viên',
      actorRole: req.user.role,
      createdAt: new Date(),
    });
    ticket.messages.push({
      sender: req.user._id,
      content: `🔄 Đã hoàn tất đổi xe khẩn cấp cho đơn ${booking.bookingCode}: từ ${oldPlate} sang xe ${newVehicle.name} (${newVehicle.licensePlate}).`,
      createdAt: new Date(),
    });
    ticket.hasUnreadStaffMessage = true;
    ticket.lastMessageAt = new Date();
    ticket.lastSenderRole = req.user.role;
    await ticket.save();

    if (ticket.customer?._id) {
      await Notification.create({
        recipient: ticket.customer._id,
        title: `🔄 Đã đổi xe sang ${newVehicle.licensePlate}`,
        message: `Đơn ${booking.bookingCode} đã được cập nhật sang xe ${newVehicle.name} (${newVehicle.licensePlate}).`,
        type: 'booking',
        link: '/portal',
      });
    }
    if (createdRepair) {
      await notifyTechnicians({
        title: `🔧 Xe ${oldPlate} vừa được đổi về để kiểm tra sửa chữa`,
        message: `Hỗ trợ viên đã đổi xe cho đơn ${booking.bookingCode} và lập phiếu ${createdRepair.code}.`,
        type: 'maintenance',
        link: '/technician',
      });
    }

    const populated = await populateTicketQuery(Ticket.findById(ticket._id));
    res.json({
      success: true,
      message: `Đã đổi sang xe ${newVehicle.licensePlate} thành công!`,
      data: { ticket: populated, repairOrder: createdRepair },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/tickets/:id/extend-rental - Extend booking & contract dates cleanly with conflict validation
router.post('/:id/extend-rental', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const ticket = await populateTicketQuery(Ticket.findById(req.params.id));
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    const { newEndDate, note } = req.body;
    const bookingId = req.body.bookingId || ticket.booking?._id;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: 'Ticket chưa liên kết với đơn thuê xe để gia hạn.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking || ['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Đơn thuê không ở trạng thái có thể gia hạn.' });
    }

    const parsedNewEnd = newEndDate ? new Date(newEndDate) : null;
    const currentEnd = new Date(booking.endDate);
    if (!parsedNewEnd || Number.isNaN(parsedNewEnd.getTime()) || parsedNewEnd <= currentEnd) {
      return res.status(400).json({ success: false, message: 'Ngày trả xe mới phải sau ngày trả hiện tại.' });
    }

    const conflicting = await Booking.findOne({
      _id: { $ne: booking._id },
      vehicle: booking.vehicle,
      status: { $in: ['active', 'confirmed'] },
      startDate: { $lt: parsedNewEnd },
      endDate: { $gt: currentEnd },
    }).select('bookingCode startDate endDate');

    if (conflicting) {
      return res.status(409).json({
        success: false,
        message: `Xe đã có lịch đặt kế tiếp (${conflicting.bookingCode}) trong khoảng thời gian gia hạn.`,
      });
    }

    const start = new Date(booking.startDate);
    const oldDays = Math.max(1, Number(booking.totalDays || Math.ceil((currentEnd - start) / 86400000)));
    const newTotalDays = Math.max(oldDays + 1, Math.ceil((parsedNewEnd - start) / 86400000));
    const extraDays = Math.max(1, newTotalDays - oldDays);
    const dailyRate = Number(booking.pricePerDay || 0);
    const extraFee = extraDays * dailyRate;

    booking.endDate = parsedNewEnd;
    booking.totalDays = newTotalDays;
    booking.priceBeforeDiscount = Number(booking.priceBeforeDiscount ?? booking.totalPrice ?? 0) + extraFee;
    booking.totalPrice = booking.priceBeforeDiscount;
    booking.finalPrice = Math.max(0, Number(booking.finalPrice || 0) + extraFee);
    booking.staffNote = `${booking.staffNote ? `${booking.staffNote} | ` : ''}Gia hạn thêm ${extraDays} ngày (+${extraFee.toLocaleString('vi-VN')}đ) qua Ticket #${ticket.ticketCode}`;
    await booking.save();

    const linkedContract = ticket.contract?._id
      ? await Contract.findById(ticket.contract._id)
      : await Contract.findOne({ booking: { $in: [String(booking._id), booking._id] }, status: { $ne: 'cancelled' } });

    if (linkedContract) {
      linkedContract.endDate = parsedNewEnd;
      linkedContract.rentalDays = newTotalDays;
      linkedContract.totalRentalFee = Number(linkedContract.totalRentalFee || 0) + extraFee;
      linkedContract.totalPayable = Number(linkedContract.totalPayable || 0) + extraFee;
      linkedContract.notes = `${linkedContract.notes ? `${linkedContract.notes} | ` : ''}Gia hạn đến ${parsedNewEnd.toLocaleDateString('vi-VN')} (+${extraFee.toLocaleString('vi-VN')}đ)`;
      await linkedContract.save();
    }

    ticket.booking = booking._id;
    if (linkedContract) ticket.contract = linkedContract._id;
    ticket.rescueStatus = 'extended';
    ticket.status = 'in_progress';
    if (!ticket.assignedTo) ticket.assignedTo = req.user._id;
    ticket.actionLogs.push({
      action: 'extended_rental',
      detail: `Gia hạn đơn ${booking.bookingCode} thêm ${extraDays} ngày đến ${parsedNewEnd.toLocaleString('vi-VN')} (+${extraFee.toLocaleString('vi-VN')} đ)`,
      actorName: req.user.fullName || 'Hỗ trợ viên',
      actorRole: req.user.role,
      createdAt: new Date(),
    });
    ticket.messages.push({
      sender: req.user._id,
      content: `📅 Đã gia hạn đơn ${booking.bookingCode} đến ${parsedNewEnd.toLocaleString('vi-VN')} (thêm ${extraDays} ngày, phụ thu ${extraFee.toLocaleString('vi-VN')} đ).${note ? ` Ghi chú: ${note}` : ''}`,
      createdAt: new Date(),
    });
    ticket.hasUnreadStaffMessage = true;
    ticket.lastMessageAt = new Date();
    ticket.lastSenderRole = req.user.role;
    await ticket.save();

    if (ticket.customer?._id) {
      await Notification.create({
        recipient: ticket.customer._id,
        title: `📅 Gia hạn thuê xe thành công (${booking.bookingCode})`,
        message: `Đơn thuê của bạn đã được gia hạn đến ${parsedNewEnd.toLocaleDateString('vi-VN')} (+${extraFee.toLocaleString('vi-VN')} đ).`,
        type: 'booking',
        link: '/portal',
      });
    }

    const populated = await populateTicketQuery(Ticket.findById(ticket._id));
    res.json({
      success: true,
      message: `Đã gia hạn đơn thêm ${extraDays} ngày (+${extraFee.toLocaleString('vi-VN')} đ)!`,
      data: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/tickets/:id - Update ticket status, assignment, priority, resolution
router.put('/:id', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });

    const { status, assignedTo, priority, resolution } = req.body;
    const prevStatus = ticket.status;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) ticket.assignedTo = assignedTo;

    if (resolution !== undefined) {
      ticket.resolution = String(resolution).trim();
    }
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = ticket.resolvedAt || new Date();
      ticket.resolvedBy = req.user._id;
      ticket.hasUnreadCustomerMessage = false;
    }

    if (status && status !== prevStatus) {
      ticket.actionLogs.push({
        action: 'status_changed',
        detail: `Chuyển trạng thái từ "${prevStatus}" sang "${status}"${resolution ? ` (${resolution})` : ''}`,
        actorName: req.user.fullName || 'Hỗ trợ viên',
        actorRole: req.user.role,
        createdAt: new Date(),
      });
    }

    await ticket.save();

    if (status === 'resolved' && prevStatus !== 'resolved' && ticket.customer) {
      try {
        await Notification.create({
          recipient: ticket.customer,
          title: `✅ Yêu cầu hỗ trợ #${ticket.ticketCode || ''} đã được giải quyết`,
          message: ticket.resolution || 'Nhân viên hỗ trợ đã hoàn tất xử lý yêu cầu của bạn.',
          type: 'ticket',
          link: '/portal',
        });
      } catch {}
    }

    const populated = await populateTicketQuery(Ticket.findById(ticket._id));
    res.json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
