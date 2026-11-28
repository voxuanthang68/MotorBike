const crypto = require('crypto');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const QrPaymentSession = require('../models/QrPaymentSession');

const QR_TTL_SECONDS = 30;

const buildVietQrUrl = (amount, transferContent) => {
  const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
  return `https://img.vietqr.io/image/MB-0905888999-compact2.png?amount=${safeAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=XTBike`;
};

const findQrSession = async (identifier) => {
  if (!identifier) return null;
  const value = String(identifier).trim();
  if (mongoose.Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value)) {
    const byId = await QrPaymentSession.findById(value);
    if (byId) return byId;
  }
  return QrPaymentSession.findOne({ sessionCode: value.toUpperCase() });
};

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

// @POST /api/payments/qr-session - Create a 30s expiring QR payment session
exports.createQrSession = async (req, res) => {
  try {
    let { bookingId, bookingCode, amount, type = 'rental_fee', description } = req.body;
    if (type === 'rental') type = 'rental_fee';

    let booking = null;
    if (bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    } else if (bookingCode) {
      booking = await Booking.findOne({ bookingCode: String(bookingCode).trim() });
    }

    if (bookingId && !booking) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt xe để tạo mã QR.' });
    }

    if (req.user.role === 'customer' && booking && booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo mã thanh toán cho đơn này.' });
    }

    let resolvedAmount = Number(amount);
    if ((!resolvedAmount || resolvedAmount <= 0) && booking) {
      resolvedAmount = type === 'deposit'
        ? Number(booking.deposit || 0)
        : Number(booking.finalPrice || booking.totalPrice || 0);
    }

    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền tạo mã QR không hợp lệ.' });
    }

    const allowedTypes = ['deposit', 'rental_fee', 'late_fee', 'damage_fee', 'refund', 'other'];
    const resolvedType = allowedTypes.includes(type) ? type : 'rental_fee';

    // Invalidate previous active QR sessions for the same booking or ad-hoc user session
    if (booking) {
      await QrPaymentSession.updateMany(
        { booking: booking._id, status: 'active' },
        { $set: { status: 'superseded' } }
      );
    } else {
      await QrPaymentSession.updateMany(
        { createdBy: req.user._id, booking: null, status: 'active' },
        { $set: { status: 'superseded' } }
      );
    }

    const sessionCode = `QR${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const baseLabel = description
      ? String(description).trim().slice(0, 32)
      : `XTBike ${booking?.bookingCode || 'DATXE'}`;
    const transferContent = `${baseLabel} ${sessionCode}`.trim();
    const roundedAmount = Math.round(resolvedAmount);
    const qrUrl = buildVietQrUrl(roundedAmount, transferContent);

    let fallbackQrDataUrl = '';
    try {
      fallbackQrDataUrl = await QRCode.toDataURL(
        `VIETQR|MB|0905888999|XTBike|${roundedAmount}|${transferContent}`,
        { width: 280, margin: 1 }
      );
    } catch {
      fallbackQrDataUrl = '';
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + QR_TTL_SECONDS * 1000);

    const session = await QrPaymentSession.create({
      sessionCode,
      booking: booking ? booking._id : null,
      customer: booking ? booking.customer : req.user._id,
      createdBy: req.user._id,
      type: resolvedType,
      amount: roundedAmount,
      transferContent,
      qrUrl,
      fallbackQrDataUrl,
      status: 'active',
      ttlSeconds: QR_TTL_SECONDS,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: 'Đã tạo mã QR thanh toán mới (hiệu lực 30 giây).',
      data: {
        _id: session._id,
        sessionCode: session.sessionCode,
        booking: session.booking,
        type: session.type,
        amount: session.amount,
        transferContent: session.transferContent,
        qrUrl: session.qrUrl,
        fallbackQrDataUrl: session.fallbackQrDataUrl,
        status: session.status,
        ttlSeconds: session.ttlSeconds,
        expiresAt: session.expiresAt,
        serverTime: now,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/payments/qr-session/:id - Check QR session validity & remaining seconds
exports.getQrSessionStatus = async (req, res) => {
  try {
    const session = await findQrSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, code: 'QR_NOT_FOUND', message: 'Không tìm thấy mã QR thanh toán.' });
    }

    if (req.user.role === 'customer' && session.customer && session.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập mã QR này.' });
    }

    const nowMs = Date.now();
    const expiresMs = new Date(session.expiresAt).getTime();
    if (session.status === 'active' && nowMs > expiresMs) {
      session.status = 'expired';
      await session.save();
    }

    const remainingSeconds = session.status === 'active'
      ? Math.max(0, Math.ceil((expiresMs - nowMs) / 1000))
      : 0;

    res.json({
      success: true,
      data: {
        _id: session._id,
        sessionCode: session.sessionCode,
        status: session.status,
        isExpired: session.status === 'expired' || remainingSeconds === 0,
        remainingSeconds,
        ttlSeconds: session.ttlSeconds,
        expiresAt: session.expiresAt,
        serverTime: new Date(nowMs),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/payments
exports.create = async (req, res) => {
  try {
    let { bookingId, customerId, type, amount, method, paymentMethod, note, notes, referenceNumber, bookingCode, qrSessionId, qrSessionCode } = req.body;
    method = method || paymentMethod || 'bank_transfer';
    note = note || notes || '';
    if (type === 'rental') type = 'rental_fee';

    let activeQrSession = null;
    if (qrSessionId || qrSessionCode) {
      activeQrSession = await findQrSession(qrSessionId || qrSessionCode);
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

      if (!bookingId && activeQrSession.booking) bookingId = activeQrSession.booking;
      if (amount !== undefined && Math.abs(Number(amount) - Number(activeQrSession.amount)) > 1) {
        return res.status(400).json({
          success: false,
          code: 'QR_AMOUNT_MISMATCH',
          message: 'Số tiền thanh toán không khớp với mã QR hiện tại. Vui lòng tạo lại mã QR mới.'
        });
      }
      amount = activeQrSession.amount;
      if (!type) type = activeQrSession.type;
      if (!referenceNumber) referenceNumber = activeQrSession.transferContent;
    }

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
      qrSession: activeQrSession ? activeQrSession._id : undefined,
      collectedBy: req.user._id,
      status: 'completed'
    });

    if (activeQrSession) {
      activeQrSession.status = 'paid';
      activeQrSession.paidAt = new Date();
      activeQrSession.payment = payment._id;
      await activeQrSession.save();
    }

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
