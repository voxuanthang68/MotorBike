const User = require('../models/User');

// @GET /api/users - All users (admin/owner)
exports.getAll = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/users/:id
exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/users - Create staff (admin/owner)
exports.create = async (req, res) => {
  try {
    const { fullName, email, phone, password, role, employeeId, department } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email đã tồn tại.' });

    const user = await User.create({
      fullName, email, phone, password, role,
      employeeId, department,
      joinDate: new Date(),
      isEmailVerified: true
    });
    res.status(201).json({ success: true, message: 'Tạo tài khoản thành công.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/users/:id
exports.update = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    res.json({ success: true, message: 'Cập nhật thành công.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/users/:id (soft delete)
exports.remove = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    res.json({ success: true, message: 'Tài khoản đã bị vô hiệu hóa.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/users/profile - Update own profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ['fullName', 'phone', 'address', 'avatar', 'cccd', 'cccdFrontImage', 'cccdBackImage', 'drivingLicense', 'drivingLicenseClass', 'drivingLicenseFrontImage', 'drivingLicenseBackImage'];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });
    if (req.file) updateData.avatar = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
