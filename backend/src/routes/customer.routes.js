const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Contract = require('../models/Contract');
const { protect } = require('../middleware/auth');

router.use(protect);

// 1. GET /api/customers - List customers with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      customerType,
      customerTier,
      isBlacklisted,
      hasDebt,
      inactive90Days,
      page = 1,
      limit = 50
    } = req.query;

    const query = { role: 'customer' };

    // Search
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { fullName: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { cccd: { $regex: s, $options: 'i' } },
        { drivingLicense: { $regex: s, $options: 'i' } },
        { customerCode: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
      ];
    }

    // Customer type: standard, walk_in, high_risk
    if (customerType && customerType !== 'all') {
      query.customerType = customerType;
    }

    // Customer tier
    if (customerTier && customerTier !== 'all') {
      query.customerTier = customerTier;
    }

    // Blacklist
    if (isBlacklisted === 'true' || isBlacklisted === true) {
      query.$or = [{ isBlacklisted: true }, { customerType: 'high_risk' }];
    }

    // Inactive > 90 days
    if (inactive90Days === 'true' || inactive90Days === true) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      query.updatedAt = { $lte: ninetyDaysAgo };
    }

    const total = await User.countDocuments(query);
    const customers = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Get contract stats (debt, total rentals) for these customers
    const customerIds = customers.map(c => c._id);
    const contracts = await Contract.find({ customer: { $in: customerIds } }).select('customer totalPayable depositAmount paidAmount status endDate');

    const customerStatsMap = {};
    contracts.forEach(c => {
      const cId = String(c.customer);
      if (!customerStatsMap[cId]) {
        customerStatsMap[cId] = { totalRentals: 0, debtAmount: 0, lastRentalDate: null };
      }
      customerStatsMap[cId].totalRentals += 1;
      const debt = Math.max(0, (c.totalPayable || 0) - ((c.depositAmount || 0) + (c.paidAmount || 0)));
      if (debt > 0 && c.status !== 'cancelled') {
        customerStatsMap[cId].debtAmount += debt;
      }
    });

    let enrichedCustomers = customers.map((c, index) => {
      const cObj = c.toJSON();
      const stats = customerStatsMap[String(c._id)] || { totalRentals: 0, debtAmount: 0 };
      
      // Generate customerCode if missing (e.g. KH0001)
      if (!cObj.customerCode) {
        cObj.customerCode = `KH${String(total - index).padStart(4, '0')}`;
      }

      cObj.totalRentals = stats.totalRentals;
      cObj.debtAmount = stats.debtAmount;
      return cObj;
    });

    // Filter hasDebt if requested
    if (hasDebt === 'true' || hasDebt === true) {
      enrichedCustomers = enrichedCustomers.filter(c => c.debtAmount > 0);
    }

    res.json({
      success: true,
      data: enrichedCustomers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET /api/customers/:id - Single customer details
router.get('/:id', async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    
    // Fetch associated contracts
    const contracts = await Contract.find({ customer: customer._id }).sort({ createdAt: -1 });

    const cObj = customer.toJSON();
    if (!cObj.customerCode) {
      cObj.customerCode = `KH${customer._id.toString().slice(-4).toUpperCase()}`;
    }

    res.json({ success: true, data: { ...cObj, contracts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST /api/customers - Create new customer in admin
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      customerType = 'standard', // 'standard' (Khách hàng), 'walk_in' (Khách vãng lai), 'high_risk' (Khách hàng rủi ro)
      customerTier = 'regular',
      cccd,
      drivingLicense,
      drivingLicenseClass,
      address,
      riskReason,
      notes,
      isBlacklisted
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Họ và tên khách hàng là bắt buộc.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Số điện thoại khách hàng là bắt buộc.' });
    }

    const cleanPhone = phone.trim();
    
    // Generate fallback email if not provided (e.g. for walk-in or phone-only customer)
    let cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    if (!cleanEmail) {
      cleanEmail = `${cleanPhone.replace(/[^0-9]/g, '') || Date.now()}@customer.xtbike.vn`;
    }

    // Check duplicate phone or email
    const existing = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { email: cleanEmail }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Khách hàng với SĐT ${cleanPhone} hoặc Email ${cleanEmail} đã tồn tại trong hệ thống!`
      });
    }

    // Generate unique customerCode: KH + 4 digits
    const count = await User.countDocuments({ role: 'customer' });
    const customerCode = `KH${String(count + 1).padStart(4, '0')}`;

    // Default password for customer
    const password = `XT@${cleanPhone.slice(-4) || '1234'}`;

    const newCustomer = new User({
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password,
      role: 'customer',
      customerCode,
      customerType,
      customerTier,
      isBlacklisted: isBlacklisted || customerType === 'high_risk',
      riskReason: riskReason || '',
      notes: notes || '',
      cccd: cccd || '',
      drivingLicense: drivingLicense || '',
      drivingLicenseClass: drivingLicenseClass || '',
      address: address || '',
      isActive: customerType !== 'high_risk' && !isBlacklisted
    });

    await newCustomer.save();

    res.status(201).json({
      success: true,
      message: 'Tạo khách hàng mới thành công!',
      data: newCustomer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. PUT /api/customers/:id - Update customer details
router.put('/:id', async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      customerType,
      customerTier,
      cccd,
      drivingLicense,
      drivingLicenseClass,
      address,
      riskReason,
      notes,
      isBlacklisted,
      isActive
    } = req.body;

    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    }

    if (fullName) customer.fullName = fullName.trim();
    if (phone) customer.phone = phone.trim();
    if (email) customer.email = email.trim().toLowerCase();
    if (customerType) {
      customer.customerType = customerType;
      if (customerType === 'high_risk') {
        customer.isBlacklisted = true;
      }
    }
    if (customerTier) customer.customerTier = customerTier;
    if (cccd !== undefined) customer.cccd = cccd;
    if (drivingLicense !== undefined) customer.drivingLicense = drivingLicense;
    if (drivingLicenseClass !== undefined) customer.drivingLicenseClass = drivingLicenseClass;
    if (address !== undefined) customer.address = address;
    if (riskReason !== undefined) customer.riskReason = riskReason;
    if (notes !== undefined) customer.notes = notes;
    if (isBlacklisted !== undefined) customer.isBlacklisted = isBlacklisted;
    if (isActive !== undefined) customer.isActive = isActive;

    await customer.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin khách hàng thành công!',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. PUT /api/customers/:id/blacklist - Toggle block / risk status
router.put('/:id/blacklist', async (req, res) => {
  try {
    const { isBlacklisted, riskReason } = req.body;
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    }

    customer.isBlacklisted = isBlacklisted;
    if (isBlacklisted) {
      customer.customerType = 'high_risk';
      customer.riskReason = riskReason || customer.riskReason || 'Cảnh báo rủi ro / Danh sách đen';
      customer.isActive = false;
    } else {
      customer.customerType = 'standard';
      customer.isActive = true;
    }

    await customer.save();

    res.json({
      success: true,
      message: isBlacklisted ? 'Đã chặn và đưa khách hàng vào danh sách rủi ro!' : 'Đã bỏ chặn khách hàng thành công!',
      data: customer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. DELETE /api/customers/:id - Remove customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng.' });
    }

    // Check if customer has active contracts
    const activeContract = await Contract.findOne({
      customer: customer._id,
      status: { $in: ['active', 'pending_signature', 'confirmed'] }
    });

    if (activeContract) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa khách hàng đang có hợp đồng hoạt động hoặc đang thuê xe!'
      });
    }

    await User.deleteOne({ _id: customer._id });

    res.json({
      success: true,
      message: 'Đã xóa khách hàng thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
