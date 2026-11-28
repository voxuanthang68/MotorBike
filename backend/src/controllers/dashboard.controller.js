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
    const totalVehicles = await Vehicle.countDocuments({ isActive: { $ne: false } });
    const availableVehicles = await Vehicle.countDocuments({ status: 'available', isActive: { $ne: false } });
    const rentedVehicles = await Vehicle.countDocuments({ status: 'rented', isActive: { $ne: false } });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: 'maintenance', isActive: { $ne: false } });
    const retiredVehicles = await Vehicle.countDocuments({ status: { $in: ['retired', 'broken'] }, isActive: { $ne: false } });

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

    // 2. Contracts & Bookings (real counts on active fleet, never forced >= 1)
    const [activeContractDocs, pendingBookingDocs] = await Promise.all([
      Contract.find({ status: 'active' }).populate('vehicle', 'isActive').lean(),
      Booking.find({ status: { $in: ['pending', 'confirmed'] } }).populate('vehicle', 'isActive').lean()
    ]);
    const activeContracts = activeContractDocs.filter(c => !c.vehicle || c.vehicle.isActive !== false).length;
    const pendingBookings = pendingBookingDocs.filter(b => !b.vehicle || b.vehicle.isActive !== false).length;
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

    // 5. Real Alerts / Notices (only emitted when real issues exist on active vehicles/contracts)
    const [rawOverdueContracts, rawOverdueBookings, activeFleetIssues, activeMaintSchedules] = await Promise.all([
      Contract.find({
        status: 'active',
        endDate: { $lt: today },
        actualReturnDate: { $in: [null, undefined] }
      }).populate('vehicle', 'name licensePlate isActive').populate('booking', 'status'),
      Booking.find({
        status: { $in: ['active', 'overdue'] },
        endDate: { $lt: today }
      }).populate('vehicle', 'name licensePlate isActive'),
      Vehicle.find({
        isActive: true,
        $or: [
          { status: { $in: ['maintenance', 'broken'] } },
          { nextMaintenanceDate: { $lt: today } }
        ]
      }).lean(),
      Maintenance.find({
        status: { $in: ['scheduled', 'in_progress'] },
        scheduledDate: { $lt: today }
      }).populate('vehicle', 'name licensePlate isActive').lean()
    ]);

    const realOverdueContracts = rawOverdueContracts.filter(c =>
      (!c.vehicle || c.vehicle.isActive !== false) &&
      (!c.booking || !['completed', 'cancelled'].includes(c.booking.status))
    );
    const linkedBookingIds = new Set(realOverdueContracts.map(c => c.booking?._id ? String(c.booking._id) : '').filter(Boolean));
    const realOverdueBookings = rawOverdueBookings.filter(b =>
      (!b.vehicle || b.vehicle.isActive !== false) &&
      !linkedBookingIds.has(String(b._id))
    );
    const overdueCount = realOverdueContracts.length + realOverdueBookings.length;

    const alerts = [];

    if (overdueCount > 0) {
      alerts.push({
        type: 'overdue_contract',
        label: 'Cần xử lý',
        message: `${overdueCount} hợp đồng QUÁ HẠN chưa trả xe`,
        actionText: 'Xem hợp đồng →',
        actionUrl: '/dashboard/contracts'
      });
    }

    const alertedPlates = new Set();
    for (const v of activeFleetIssues) {
      if (!v.licensePlate || alertedPlates.has(v.licensePlate)) continue;
      alertedPlates.add(v.licensePlate);
      if (v.status === 'broken') {
        alerts.push({
          type: 'maintenance_overdue',
          label: 'Xe đang hư hỏng',
          message: `${v.licensePlate} (${v.name}) đang báo hư hỏng cần xử lý kỹ thuật`,
          actionText: 'Xem xe →',
          actionUrl: '/dashboard/vehicles'
        });
      } else if (v.status === 'maintenance') {
        alerts.push({
          type: 'maintenance_overdue',
          label: 'Bảo dưỡng xe',
          message: `${v.licensePlate} (${v.name}) đang trong trạng thái bảo dưỡng`,
          actionText: 'Xem xe →',
          actionUrl: '/dashboard/vehicles'
        });
      } else if (v.nextMaintenanceDate && new Date(v.nextMaintenanceDate) < today) {
        const overdueDays = Math.max(1, Math.floor((today.getTime() - new Date(v.nextMaintenanceDate).getTime()) / 86400000));
        alerts.push({
          type: 'maintenance_overdue',
          label: 'Bảo dưỡng xe',
          message: `${v.licensePlate} (${v.name}) — Quá hạn lịch bảo dưỡng ${overdueDays} ngày`,
          actionText: 'Xem xe →',
          actionUrl: '/dashboard/vehicles'
        });
      }
    }

    for (const m of activeMaintSchedules) {
      if (!m.vehicle || m.vehicle.isActive === false) continue;
      if (alertedPlates.has(m.vehicle.licensePlate)) continue;
      alertedPlates.add(m.vehicle.licensePlate);
      const overdueDays = Math.max(1, Math.floor((today.getTime() - new Date(m.scheduledDate).getTime()) / 86400000));
      alerts.push({
        type: 'maintenance_overdue',
        label: 'Lịch bảo dưỡng',
        message: `${m.vehicle.licensePlate} (${m.vehicle.name}) — Phiếu "${m.title}" quá hạn ${overdueDays} ngày`,
        actionText: 'Xem bảo dưỡng →',
        actionUrl: '/dashboard/maintenance'
      });
    }

    // Legacy fields for backward compatibility
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    const activeRentals = rentedVehicles;
    const newCustomers = await User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } });
    const scheduledMaints = await Maintenance.find({ status: 'scheduled' }).populate('vehicle', 'isActive').lean();
    const pendingMaintenance = scheduledMaints.filter(m => !m.vehicle || m.vehicle.isActive !== false).length;
    const recentBookings = await Booking.find()
      .populate('customer', 'fullName phone avatar')
      .populate('vehicle', 'name brand mainImage')
      .sort({ createdAt: -1 })
      .limit(5);

    const isOwner = Boolean(req.user && req.user.role === 'owner');

    res.json({
      success: true,
      data: {
        // Permission flag
        canViewRevenue: isOwner,

        // Real Overview Schema
        alerts,
        rentedVehicles,
        totalVehicles,
        utilizationRate,
        activeContracts,
        pendingBookings,
        // Revenue strictly restricted to owner
        monthRevenue: isOwner ? monthRevenue : null,
        completedContractsThisMonth,
        debtAmount: isOwner ? debtAmount : null,
        monthExpenses: isOwner ? monthExpenses : null,
        monthProfit: isOwner ? monthProfit : null,
        profitMargin: isOwner ? profitMargin : null,
        fleetStatus,
        operationsScope: {
          totalVehicles,
          totalCustomers,
          totalDrivers,
          completedContractsThisMonth
        },

        // Legacy compatibility
        todayRevenue: isOwner ? todayRevenue : null,
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
