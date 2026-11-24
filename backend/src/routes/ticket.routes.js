const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'support' && req.query.assignedOnly === 'true') {
      query.assignedTo = req.user._id;
    }
    const tickets = await Ticket.find(query)
      .populate('customer', 'fullName phone avatar')
      .populate('assignedTo', 'fullName phone')
      .populate('messages.sender', 'fullName phone avatar role')
      .sort({ lastMessageAt: -1, createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'fullName phone avatar')
      .populate('assignedTo', 'fullName phone')
      .populate('messages.sender', 'fullName phone avatar role');
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', upload.array('attachments', 3), async (req, res) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const data = {
      ...req.body,
      customer: isCustomer ? req.user._id : (req.body.customerId || req.user._id),
      attachments: req.files?.map(f => ({ url: `/uploads/misc/${f.filename}` })) || [],
      hasUnreadCustomerMessage: isCustomer,
      hasUnreadStaffMessage: !isCustomer,
      lastMessageAt: new Date(),
      lastSenderRole: req.user.role,
    };
    const ticket = await Ticket.create(data);
    res.status(201).json({ success: true, message: 'Gửi ticket thành công.', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/reply', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    
    // Process attachments if any (array of strings: URLs or base64 data)
    let attachments = [];
    if (Array.isArray(req.body.attachments)) {
      attachments = req.body.attachments.filter(Boolean);
    } else if (req.body.attachment) {
      attachments = [req.body.attachment];
    } else if (req.body.image) {
      attachments = [req.body.image];
    }

    const isCustomer = req.user.role === 'customer';

    ticket.messages.push({
      sender: req.user._id,
      content: req.body.content || '',
      attachments: attachments,
      createdAt: new Date()
    });

    ticket.lastMessageAt = new Date();
    ticket.lastSenderRole = req.user.role;

    if (isCustomer) {
      ticket.hasUnreadCustomerMessage = true;
      ticket.hasUnreadStaffMessage = false;
    } else {
      ticket.hasUnreadStaffMessage = true;
      ticket.hasUnreadCustomerMessage = false;
      if (ticket.status === 'open') {
        ticket.status = 'in_progress';
      }
    }

    await ticket.save();

    // Create Notification in background
    try {
      if (isCustomer && ticket.customer) {
        // Notify assigned staff or system
        const staffId = ticket.assignedTo || null;
        if (staffId) {
          await Notification.create({
            recipient: staffId,
            title: '💬 Khách hàng nhắn tin mới',
            message: `Khách hàng vừa phản hồi về sự cố #${ticket.ticketCode || ticket._id.toString().slice(-6)}: "${(req.body.content || 'Gửi ảnh').slice(0, 60)}"`,
            type: 'ticket',
            link: '/dashboard/tickets'
          });
        }
      } else if (!isCustomer && ticket.customer) {
        // Notify customer
        await Notification.create({
          recipient: ticket.customer,
          title: '💬 Đội cứu hộ đã phản hồi',
          message: `Nhân viên vừa trả lời sự cố của bạn: "${(req.body.content || 'Gửi ảnh').slice(0, 60)}"`,
          type: 'ticket',
          link: '/portal'
        });
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customer', 'fullName phone avatar')
      .populate('assignedTo', 'fullName phone')
      .populate('messages.sender', 'fullName phone avatar role');

    res.json({ success: true, message: 'Đã gửi phản hồi.', data: populatedTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.put('/:id', authorize('owner', 'admin', 'support'), async (req, res) => {
  try {
    const { status, assignedTo, resolution } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (resolution) { updateData.resolution = resolution; updateData.resolvedAt = new Date(); updateData.resolvedBy = req.user._id; }
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
