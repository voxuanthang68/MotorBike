const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'customer') query.customer = req.user._id;
    else if (req.user.role === 'support') query.assignedTo = req.user._id;
    const tickets = await Ticket.find(query)
      .populate('customer', 'fullName phone avatar')
      .populate('assignedTo', 'fullName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'fullName phone avatar')
      .populate('assignedTo', 'fullName')
      .populate('messages.sender', 'fullName avatar role');
    if (!ticket) return res.status(404).json({ success: false, message: 'Không tìm thấy ticket.' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', upload.array('attachments', 3), async (req, res) => {
  try {
    const data = {
      ...req.body,
      customer: req.user._id,
      attachments: req.files?.map(f => ({ url: `/uploads/misc/${f.filename}` })) || []
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
    ticket.messages.push({ sender: req.user._id, content: req.body.content });
    if (ticket.status === 'open' && req.user.role !== 'customer') ticket.status = 'in_progress';
    await ticket.save();
    res.json({ success: true, message: 'Đã gửi phản hồi.', data: ticket });
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
