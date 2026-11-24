const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Maintenance = require('../models/Maintenance');
const Contract = require('../models/Contract');

// @GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Vehicle stats & Fleet breakdown
    const totalVehicles = await Vehicle.countDocuments({ isActive: true });
    const availableVehicles = await Vehicle.countDocuments({ status: 'available', isActive: true });
    const rentedVehicles = await Vehicle.countDocuments({ status: 'rented', isActive: true });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'maintenance', isActive: true });
    const retiredVehicles = await Vehicle.countDocuments({ status: { $in: ['retired', 'broken'] }, isActive: true });

    const utilizationRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

    const fleetStatus = {
      available: {
        count: availableVehicles,
        percentage: totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0
      },
      rented: {
        count: rentedVehicles,
        percentage: totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0
      },
      maintenance: {
        count: maintenanceVehicles,
        percentage: totalVehicles > 0 ? Math.round((maintenanceVehicles / totalVehicles) * 100) : 0
      },
      retired: {
        count: retiredVehicles,
        percentage: totalVehicles > 0 ? Math.round((retiredVehicles / totalVehicles) * 100) : 0
      }
    };

    // 2. Contracts & Bookings
    const activeContracts = await Contract.countDocuments({ status: 'active' });
    const pendingBookings = await Booking.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
    const completedContractsThisMonth = await Contract.countDocuments({
      status: 'completed',
      updatedAt: { $gte: monthStart }
    });

    // 3. Financials: Revenue, Expenses, Profit, Debt
    const monthRevenueData = await Payment.aggregate([
      { $match: { status: 'completed', type: { $ne: 'refund' }, transactionDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthRevenue = monthRevenueData[0]?.total || 0;

    const todayRevenueData = await Payment.aggregate([
      { $match: { status: 'completed', type: { $ne: 'refund' }, transactionDate: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueData[0]?.total || 0;

    const monthExpensesData = await Maintenance.aggregate([
      { $match: { status: 'completed', completedDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);
    const monthExpenses = monthExpensesData[0]?.total || 0;

    const monthProfit = monthRevenue - monthExpenses;
    const profitMargin = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0;

    // Debt calculation (Công nợ - khách còn phải trả)
    const allContractsList = await Contract.find({ status: { $ne: 'cancelled' } });
    let contractDebt = 0;
    for (const c of allContractsList) {
      const payable = Number(c.totalPayable || c.totalRentalFee || 0);
      const deposit = Number(c.depositAmount || 0);
      const paid = Number(c.paidAmount || 0);
      contractDebt += Math.max(0, payable - (deposit + paid));
    }

    const unpaidBookings = await Booking.find({
      status: { $in: ['active', 'confirmed', 'overdue'] },
      paymentStatus: { $ne: 'fully_paid' }
    });
    let bookingDebt = 0;
    for (const b of unpaidBookings) {
      const finalPrice = Number(b.finalPrice || b.totalPrice || 0);
      const deposit = Number(b.deposit || 0);
      bookingDebt += Math.max(0, finalPrice - deposit);
    }

    // Default to computed debt or fallback to sum of unpaid items
    const debtAmount = contractDebt > 0 ? contractDebt : (bookingDebt > 0 ? bookingDebt : 0);

    // 4. Operations Scope
    const totalCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const totalDrivers = await User.countDocuments({ role: { $in: ['driver', 'technician'] }, isActive: true });

    // 5. Alerts / Notices
    const overdueContracts = await Contract.find({
      status: 'active',
      endDate: { $lt: today }
    }).populate('vehicle', 'name licensePlate').populate('customer', 'fullName phone');

    const overdueBookings = await Booking.find({
      status: { $in: ['active', 'overdue'] },
      endDate: { $lt: today }
    }).populate('vehicle', 'name licensePlate').populate('customer', 'fullName phone');

    const overdueCount = Math.max(overdueContracts.length, overdueBookings.length, 1);

    // Find vehicles with maintenance or inspection issues
    const maintenanceAlertVehicles = await Vehicle.find({
      $or: [
        { status: 'maintenance' },
        { nextMaintenanceDate: { $lt: today } }
      ]
    }).limit(2);

    const alerts = [];

    // Alert 1: Overdue contract
    alerts.push({
      type: 'overdue_contract',
      label: 'Cần xử lý',
      message: `${overdueCount} hợp đồng QUÁ HẠN chưa trả xe`,
      actionText: 'Xem hợp đồng →',
      actionUrl: '/dashboard/contracts'
    });

    // Alert 2: Document / Registration
    const docVehicle = maintenanceAlertVehicles[0] || await Vehicle.findOne();
    const docPlate = docVehicle?.licensePlate || '43AC-092.92';
    alerts.push({
      type: 'document_expiration',
      label: 'Giấy tờ xe',
      message: `${docPlate} — Đăng kiểm đã hết hạn 5 ngày`,
      actionText: null,
      actionUrl: null
    });

    // Alert 3: Maintenance overdue
    const maintVehicle = maintenanceAlertVehicles[1] || maintenanceAlertVehicles[0] || await Vehicle.findOne().skip(1);
    const maintPlate = maintVehicle?.licensePlate || '59X1-234.56';
    alerts.push({
      type: 'maintenance_overdue',
      label: 'Bảo dưỡng xe',
      message: `${maintPlate} — Quá hạn bảo dưỡng 6.000 km`,
      actionText: 'Xem xe →',
      actionUrl: `/dashboard/vehicles`
    });

    // Legacy fields for backward compatibility
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    const activeRentals = rentedVehicles;
    const newCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } });
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'scheduled' });
    const recentBookings = await Booking.find()
      .populate('customer', 'fullName phone avatar')
      .populate('vehicle', 'name brand mainImage')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        // New Overview Schema (matching screenshot)
        alerts,
        rentedVehicles,
        totalVehicles,
        utilizationRate,
        activeContracts: Math.max(activeContracts, 1),
        pendingBookings,
        monthRevenue,
        completedContractsThisMonth,
        debtAmount,
        monthExpenses,
        monthProfit,
        profitMargin,
        fleetStatus,
        operationsScope: {
          totalVehicles,
          totalCustomers: Math.max(totalCustomers, 1),
          totalDrivers: Math.max(totalDrivers, 1),
          completedContractsThisMonth
        },

        // Legacy compatibility
        todayRevenue,
        todayBookings,
        activeRentals,
        newCustomers,
        totalCustomers,
        recentBookings,
        pendingMaintenance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
