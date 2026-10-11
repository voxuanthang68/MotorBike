const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d'
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
  return { accessToken, refreshToken };
};

// @POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, cccd, address } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email đã được sử dụng.' });

    const user = await User.create({
      fullName, email, phone, password,
      cccd, address,
      role: 'customer'
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

    const userObj = user.toJSON();

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { user: userObj, accessToken, refreshToken }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Không có refresh token.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ.' });
    }

    const tokens = generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc hết hạn.' });
  }
};

// @POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

// @PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
