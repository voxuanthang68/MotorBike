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
    const { bookingId, customerId, type, amount, method, note, referenceNumber } = req.body;

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
        monthlyRevenue,
        todayRevenue: todayRevenue[0]?.total || 0,
        methodBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
