const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');

// @GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Vehicle stats
    const vehicleStats = await Vehicle.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Booking stats
    const bookingStats = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const activeRentals = await Booking.countDocuments({ status: 'active' });

    // Revenue
    const todayRevenue = await Payment.aggregate([
      { $match: { status: 'completed', type: { $ne: 'refund' }, transactionDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthRevenue = await Payment.aggregate([
      { $match: { status: 'completed', type: { $ne: 'refund' }, transactionDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Monthly revenue chart (last 6 months)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const monthlyChart = await Payment.aggregate([
      { $match: { status: 'completed', type: { $ne: 'refund' }, transactionDate: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { year: { $year: '$transactionDate' }, month: { $month: '$transactionDate' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // New customers this month
    const newCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: monthStart }
    });

    const totalCustomers = await User.countDocuments({ role: 'customer', isActive: true });

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('customer', 'fullName phone avatar')
      .populate('vehicle', 'name brand mainImage')
      .sort({ createdAt: -1 })
      .limit(5);

    // Pending maintenance
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'scheduled' });

    // Upcoming returns (next 24 hours)
    const upcomingReturns = await Booking.find({
      status: 'active',
      endDate: { $gte: today, $lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    }).populate('customer', 'fullName phone').populate('vehicle', 'name licensePlate');

    res.json({
      success: true,
      data: {
        vehicleStats,
        bookingStats,
        todayBookings,
        activeRentals,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        monthlyChart,
        newCustomers,
        totalCustomers,
        recentBookings,
        pendingMaintenance,
        upcomingReturns
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
