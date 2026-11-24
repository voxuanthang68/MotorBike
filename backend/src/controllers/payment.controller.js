const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// @GET /api/payments
exports.getAll = async (req, res) => {
  try {
    const { type, method, status, page = 1, limit = 10, startDate, endDate } = req.query;
    const query = {};
    if (type) query.type = type;
    if (method) query.method = method;
    if (status) query.status = status;
    if (req.user.role === 'customer') query.customer = req.user._id;
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('booking', 'bookingCode startDate endDate')
      .populate('customer', 'fullName phone')
      .populate('collectedBy', 'fullName')
      .sort({ transactionDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Summary stats
    const stats = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: payments, stats, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/payments
exports.create = async (req, res) => {
  try {
    let { bookingId, customerId, type, amount, method, paymentMethod, note, notes, referenceNumber, bookingCode } = req.body;
    method = method || paymentMethod || 'bank_transfer';
    note = note || notes || '';
    if (type === 'rental') type = 'rental_fee';

    if (!bookingId && bookingCode) {
      const foundBooking = await Booking.findOne({ bookingCode: bookingCode.trim() });
      if (foundBooking) {
        bookingId = foundBooking._id;
        if (!customerId) customerId = foundBooking.customer;
      }
    }

    if (req.user.role === 'customer') {
      const booking = await Booking.findById(bookingId);
      if (!booking || booking.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán cho đơn này.' });
      }
      if (!['deposit', 'rental_fee'].includes(type) || !['vnpay', 'momo', 'bank_transfer', 'qr', 'cash'].includes(method)) {
        return res.status(400).json({ success: false, message: 'Thông tin thanh toán không hợp lệ.' });
      }
    }

    const payment = await Payment.create({
      booking: bookingId,
      customer: customerId || req.user._id,
      type, amount, method, note, referenceNumber,
      collectedBy: req.user._id,
      status: 'completed'
    });

    // Update booking payment status
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        const totalPaid = await Payment.aggregate([
          { $match: { booking: booking._id, status: 'completed', type: { $ne: 'refund' } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const paid = totalPaid[0]?.total || 0;
        if (paid >= booking.finalPrice) booking.paymentStatus = 'fully_paid';
        else if (paid >= booking.deposit) booking.paymentStatus = 'deposit_paid';
        await booking.save();
      }
    }

    res.status(201).json({ success: true, message: 'Ghi nhận thanh toán thành công.', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/payments/summary - Revenue summary for accountant
exports.getSummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    const matchStage = { status: 'completed', type: { $ne: 'refund' } };

    // KPI overall totals
    const typeStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const typeMap = Object.fromEntries(typeStats.map(s => [s._id, s.total]));
    const totalRevenue = typeMap['rental_fee'] || 0;
    const totalDeposit = typeMap['deposit'] || 0;
    const totalRefund = typeMap['refund'] || 0;
    const totalFees = (typeMap['damage_fee'] || 0) + (typeMap['late_fee'] || 0) + (typeMap['fuel_fee'] || 0);

    const monthlyRevenue = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRevenue = await Payment.aggregate([
      { $match: { ...matchStage, transactionDate: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const methodBreakdown = await Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalDeposit,
        totalRefund,
        totalFees,
        monthlyRevenue,
        todayRevenue: todayRevenue[0]?.total || 0,
        methodBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
