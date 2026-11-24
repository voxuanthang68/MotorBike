const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const Contract = require('../models/Contract');
const Maintenance = require('../models/Maintenance');
const Payment = require('../models/Payment');
const Ticket = require('../models/Ticket');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/motobike_haichau';

const users = [
  { fullName: 'Nguyễn Văn Chủ', email: 'owner@motobike.vn', phone: '0901234567', password: 'Owner@123', role: 'owner', isEmailVerified: true, isActive: true },
  { fullName: 'Trần Thị Admin', email: 'admin@motobike.vn', phone: '0901234568', password: 'Admin@123', role: 'admin', isEmailVerified: true, isActive: true, employeeId: 'NV001' },
  { fullName: 'Lê Văn Tài Xế', email: 'driver@motobike.vn', phone: '0907654321', password: 'Driver@123', role: 'driver', isEmailVerified: true, isActive: true, employeeId: 'TX001' },
  {
    fullName: 'Nguyễn Văn An',
    customerCode: 'KH0001',
    email: 'customer@gmail.com',
    phone: '901234567',
    password: 'Customer@123',
    role: 'customer',
    customerType: 'standard',
    customerTier: 'regular',
    isEmailVerified: true,
    isActive: true,
    cccd: '79201001234',
    drivingLicense: '790123456789',
    drivingLicenseClass: 'B2',
    address: '128 Bạch Đằng, P. Hải Châu 1, Đà Nẵng'
  },
  {
    fullName: 'Trần Thị Bích',
    customerCode: 'KH0002',
    email: 'bich.tran@gmail.com',
    phone: '0912345678',
    password: 'Customer@123',
    role: 'customer',
    customerType: 'walk_in',
    customerTier: 'regular',
    isEmailVerified: true,
    isActive: true,
    cccd: '048200005678',
    drivingLicense: '048123456',
    drivingLicenseClass: 'A1',
    address: 'Khách du lịch Hà Nội lưu trú KS Mường Thanh'
  },
  {
    fullName: 'Lê Hoàng Nam',
    customerCode: 'KH0003',
    email: 'nam.le@gmail.com',
    phone: '0934567890',
    password: 'Customer@123',
    role: 'customer',
    customerType: 'high_risk',
    customerTier: 'regular',
    isBlacklisted: true,
    riskReason: 'Từng quỵt tiền phụ phí quá hạn 2 ngày và làm trầy xước xe không bồi thường',
    isEmailVerified: true,
    isActive: false,
    cccd: '031200009999',
    drivingLicense: '031987654',
    drivingLicenseClass: 'B1',
    address: 'Quận Sơn Trà, Đà Nẵng'
  }
];

const vehicles = [
  { name: 'Toyota Vios', brand: 'Toyota', model: 'Vios', year: 2023, licensePlate: '51K-123.45', color: 'Trắng', type: 'scooter', engineCC: 1500, pricePerDay: 800000, deposit: 2000000, status: 'available', condition: 'excellent', odometer: 15000, description: 'Toyota Vios số tự động, máy êm tiết kiệm nhiên liệu.' },
  { name: 'Honda Vision 2024 Smartkey', brand: 'Honda', model: 'Vision', year: 2024, licensePlate: '43AC-092.92', color: 'Trắng Đen', type: 'scooter', engineCC: 110, pricePerDay: 130000, deposit: 500000, status: 'available', condition: 'good', odometer: 8400, description: 'Honda Vision khóa Smartkey, đăng kiểm cần gia hạn.' },
  { name: 'Yamaha Sirius 115 FI', brand: 'Yamaha', model: 'Sirius FI', year: 2022, licensePlate: '59X1-234.56', color: 'Đen Nhám', type: 'manual', engineCC: 115, pricePerDay: 100000, deposit: 300000, status: 'maintenance', condition: 'good', odometer: 26000, description: 'Yamaha Sirius quá hạn bảo dưỡng 6.000 km đang bảo dưỡng xích và phanh.' },
  { name: 'Honda Air Blade 125cc LED', brand: 'Honda', model: 'Air Blade', year: 2023, licensePlate: '43B1-123.45', color: 'Đen Bạc', type: 'scooter', engineCC: 125, pricePerDay: 150000, deposit: 500000, status: 'available', condition: 'excellent', odometer: 5600, description: 'Xe tay ga Honda Air Blade 125cc máy êm bốc, phanh CBS an toàn.' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear collections
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Booking.deleteMany({});
    await Contract.deleteMany({});
    await Maintenance.deleteMany({});
    await Payment.deleteMany({});
    await Ticket.deleteMany({});
    console.log('🗑️  Cleared existing collections');

    // Create users (password hashed via pre-save hook)
    const createdUsers = [];
    for (const uData of users) {
      const user = await User.create(uData);
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    const owner = createdUsers.find(u => u.role === 'owner');
    const customer = createdUsers.find(u => u.role === 'customer');
    const admin = createdUsers.find(u => u.role === 'admin');
    const driver = createdUsers.find(u => u.role === 'driver');

    // Create vehicles
    const vehiclesWithOwner = vehicles.map(v => ({ ...v, createdBy: owner._id }));
    const createdVehicles = await Vehicle.insertMany(vehiclesWithOwner);
    console.log(`✅ Created ${createdVehicles.length} vehicles`);

    const viosVehicle = createdVehicles.find(v => v.licensePlate === '51K-123.45') || createdVehicles[0];

    // Create contract HD0002 (Đã trả, tổng tiền 140.000, còn lại 140.000)
    await Contract.create({
      contractCode: 'HD0002',
      customer: customer._id,
      vehicle: viosVehicle._id,
      driver: driver?._id,
      customerInfo: {
        fullName: customer.fullName,
        cccd: customer.cccd,
        drivingLicense: customer.drivingLicense,
        phone: customer.phone,
        address: customer.address,
        email: customer.email
      },
      vehicleInfo: {
        name: viosVehicle.name,
        licensePlate: viosVehicle.licensePlate,
        brand: viosVehicle.brand,
        model: viosVehicle.model,
        color: viosVehicle.color
      },
      startDate: new Date('2026-08-29T18:00:00'),
      endDate: new Date('2026-08-29T18:11:00'),
      actualReturnDate: new Date('2026-08-29T18:11:00'),
      rentalDays: 1,
      pricePerDay: 140000,
      totalRentalFee: 140000,
      depositAmount: 0,
      totalPayable: 140000,
      paidAmount: 0,
      paymentMethod: 'bank_transfer',
      status: 'completed',
      termsAndConditions: 'Bên thuê xe cam kết chấp hành nghiêm chỉnh luật giao thông đường bộ Việt Nam.',
      createdBy: admin._id
    });

    // Create contract HD0001 (Đang thuê, Quá hạn, tổng tiền 1.600.000, còn lại 1.600.000)
    await Contract.create({
      contractCode: 'HD0001',
      customer: customer._id,
      vehicle: viosVehicle._id,
      driver: driver?._id,
      customerInfo: {
        fullName: customer.fullName,
        cccd: customer.cccd,
        drivingLicense: customer.drivingLicense,
        phone: customer.phone,
        address: customer.address,
        email: customer.email
      },
      vehicleInfo: {
        name: viosVehicle.name,
        licensePlate: viosVehicle.licensePlate,
        brand: viosVehicle.brand,
        model: viosVehicle.model,
        color: viosVehicle.color
      },
      startDate: new Date('2026-08-25T00:00:00'),
      endDate: new Date('2026-08-26T10:00:00'),
      rentalDays: 2,
      pricePerDay: 800000,
      totalRentalFee: 1600000,
      depositAmount: 0,
      totalPayable: 1600000,
      paidAmount: 0,
      paymentMethod: 'bank_transfer',
      status: 'active',
      termsAndConditions: 'Bên thuê xe cam kết chấp hành nghiêm chỉnh luật giao thông đường bộ Việt Nam.',
      createdBy: admin._id
    });
    console.log('✅ Created sample contracts HD0001 & HD0002');

    // Create technician maintenance record
    await Maintenance.create({
      vehicle: createdVehicles.find(v => v.status === 'maintenance')._id,
      technician: admin._id,
      title: 'Bảo dưỡng định kỳ 9.000km xe Sirius',
      type: 'routine',
      status: 'in_progress',
      odometerAtMaintenance: 8900,
      cost: 150000,
      description: 'Bảo dưỡng định kỳ 9.000km: Thay nhớt Motul Scooter, kiểm tra bố phanh trước/sau, vệ sinh lọc gió.',
      scheduledDate: new Date()
    });
    console.log('✅ Created sample technician inspection');

    // Create payment transactions
    await Payment.create([
      {
        customer: customer._id,
        amount: 450000,
        type: 'rental_fee',
        method: 'bank_transfer',
        status: 'completed',
        note: 'Khách thanh toán tiền thuê xe qua VietQR MBBank',
        collectedBy: admin._id
      }
    ]);
    console.log('✅ Created sample payments');

    // Create support rescue ticket
    await Ticket.create({
      customer: customer._id,
      subject: 'Cần hỗ trợ bơm lốp tại ngã tư Lê Duẩn - Nguyễn Thị Minh Khai',
      description: 'Lốp sau xe có dấu hiệu mềm khi qua cầu quay Sông Hàn, nhờ đội cứu hộ Hải Châu kiểm tra giúp trong 15 phút.',
      priority: 'high',
      category: 'vehicle_issue',
      status: 'in_progress',
      assignedTo: admin._id,
      messages: [
        { sender: customer._id, content: 'Chào shop, xe mình lốp sau hơi non hơi tại đường Lê Duẩn ạ.' },
        { sender: admin._id, content: 'Dạ chào bạn, kỹ thuật viên cứu hộ Hải Châu đang di chuyển đến vị trí của bạn trong 10 phút nhé!' }
      ]
    });
    console.log('✅ Created sample support ticket');

    console.log('\n🎉 Seed completed successfully!');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('📋 TÀI KHOẢN MẪU ĐỂ ĐĂNG NHẬP (Mật khẩu chung hoặc theo mẫu):');
    users.forEach(u => console.log(`  ${u.role.padEnd(12)} : ${u.email.padEnd(26)} | Mật khẩu: ${u.password}`));
    console.log('══════════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
