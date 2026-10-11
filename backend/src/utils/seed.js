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
  { fullName: 'Lê Văn Kỹ Thuật', email: 'tech@motobike.vn', phone: '0901234569', password: 'Tech@123', role: 'technician', isEmailVerified: true, isActive: true, employeeId: 'NV002' },
  { fullName: 'Phạm Thị Lễ Tân', email: 'receptionist@motobike.vn', phone: '0901234570', password: 'Recep@123', role: 'receptionist', isEmailVerified: true, isActive: true, employeeId: 'NV003' },
  { fullName: 'Hoàng Văn Kế Toán', email: 'accountant@motobike.vn', phone: '0901234571', password: 'Acct@123', role: 'accountant', isEmailVerified: true, isActive: true, employeeId: 'NV004' },
  { fullName: 'Võ Thị Hỗ Trợ', email: 'support@motobike.vn', phone: '0901234572', password: 'Support@123', role: 'support', isEmailVerified: true, isActive: true, employeeId: 'NV005' },
  { fullName: 'Nguyễn Văn Khách', email: 'customer@gmail.com', phone: '0901234573', password: 'Customer@123', role: 'customer', isEmailVerified: true, isActive: true, cccd: '048200001234', drivingLicense: 'A1-480912', address: '128 Bạch Đằng, P. Hải Châu 1, Đà Nẵng' },
];

const vehicles = [
  { name: 'Honda Vision 2024 Smartkey', brand: 'Honda', model: 'Vision', year: 2024, licensePlate: '43C1-888.88', color: 'Trắng Đen', type: 'scooter', engineCC: 110, pricePerDay: 130000, deposit: 500000, status: 'available', condition: 'excellent', odometer: 2400, description: 'Honda Vision 2024 khóa thông minh Smartkey, tiết kiệm xăng, cốp rộng tiện lợi.' },
  { name: 'Honda Air Blade 125cc LED', brand: 'Honda', model: 'Air Blade', year: 2023, licensePlate: '43B1-123.45', color: 'Đen Bạc', type: 'scooter', engineCC: 125, pricePerDay: 150000, deposit: 500000, status: 'rented', condition: 'excellent', odometer: 5600, description: 'Xe tay ga Honda Air Blade 125cc máy êm bốc, phanh CBS an toàn đi phố và ngoại ô.' },
  { name: 'Honda Wave Alpha 110cc', brand: 'Honda', model: 'Wave Alpha', year: 2023, licensePlate: '43B4-456.78', color: 'Đỏ Đen', type: 'manual', engineCC: 110, pricePerDay: 90000, deposit: 300000, status: 'available', condition: 'good', odometer: 11500, description: 'Xe số Honda Wave Alpha siêu bền bỉ, tiết kiệm xăng leo dốc Đèo Hải Vân cực tốt.' },
  { name: 'Honda SH Mode 125 ABS', brand: 'Honda', model: 'SH Mode', year: 2024, licensePlate: '43C1-999.99', color: 'Xám Xi Măng', type: 'scooter', engineCC: 125, pricePerDay: 220000, deposit: 1000000, status: 'available', condition: 'excellent', odometer: 1200, description: 'Honda SH Mode cao cấp sang trọng, phanh chống bó cứng ABS an toàn tuyệt đối.' },
  { name: 'Honda Winner X 150 ABS', brand: 'Honda', model: 'Winner X', year: 2023, licensePlate: '43B2-234.56', color: 'Xanh Đen Thể Thao', type: 'clutch', engineCC: 150, pricePerDay: 180000, deposit: 600000, status: 'available', condition: 'excellent', odometer: 4500, description: 'Xe côn tay Honda Winner X 6 số phượt Bán đảo Sơn Trà và cung đường ven biển Đà Nẵng.' },
  { name: 'Yamaha Sirius 115 FI', brand: 'Yamaha', model: 'Sirius FI', year: 2022, licensePlate: '43B5-678.90', color: 'Đen Nhám', type: 'manual', engineCC: 115, pricePerDay: 100000, deposit: 300000, status: 'maintenance', condition: 'good', odometer: 8900, description: 'Yamaha Sirius phun xăng điện tử FI, đang bảo dưỡng thay nhớt và căng xích tại Hải Châu.' },
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
    const receptionist = createdUsers.find(u => u.role === 'receptionist');
    const technician = createdUsers.find(u => u.role === 'technician');
    const support = createdUsers.find(u => u.role === 'support');

    // Create vehicles
    const vehiclesWithOwner = vehicles.map(v => ({ ...v, createdBy: owner._id }));
    const createdVehicles = await Vehicle.insertMany(vehiclesWithOwner);
    console.log(`✅ Created ${createdVehicles.length} vehicles`);

    const rentedVehicle = createdVehicles.find(v => v.status === 'rented');
    const availableVehicle = createdVehicles.find(v => v.status === 'available');

    // Create active booking
    const booking = await Booking.create({
      bookingCode: 'MB-8899',
      customer: customer._id,
      vehicle: rentedVehicle._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      totalDays: 3,
      pricePerDay: rentedVehicle.pricePerDay,
      deposit: rentedVehicle.deposit,
      totalPrice: rentedVehicle.pricePerDay * 3,
      finalPrice: rentedVehicle.pricePerDay * 3,
      pickupLocation: 'Sân bay Quốc tế Đà Nẵng',
      returnLocation: '128 Bạch Đằng, Hải Châu',
      status: 'active',
      checkInTime: new Date(),
      checkInOdometer: 5600,
      checkInNote: 'Bàn giao xe Air Blade sạch sẽ, xăng đầy bình, kèm 2 mũ bảo hiểm và giá đỡ điện thoại',
      assignedReceptionist: receptionist._id
    });
    console.log('✅ Created active sample booking');

    // Create legal e-contract for this booking
    await Contract.create({
      contractNumber: 'HD-8899/MB-HC',
      booking: booking._id,
      customer: customer._id,
      vehicle: rentedVehicle._id,
      customerInfo: {
        fullName: customer.fullName,
        cccd: customer.cccd,
        drivingLicense: customer.drivingLicense,
        phone: customer.phone,
        address: customer.address,
        email: customer.email
      },
      vehicleInfo: {
        name: rentedVehicle.name,
        licensePlate: rentedVehicle.licensePlate,
        brand: rentedVehicle.brand,
        model: rentedVehicle.model,
        color: rentedVehicle.color
      },
      startDate: booking.startDate,
      endDate: booking.endDate,
      rentalDays: 3,
      pricePerDay: rentedVehicle.pricePerDay,
      totalRentalFee: rentedVehicle.pricePerDay * 3,
      depositAmount: rentedVehicle.deposit,
      totalPayable: rentedVehicle.pricePerDay * 3,
      paymentMethod: 'bank_transfer',
      status: 'active',
      termsAndConditions: 'Bên thuê xe cam kết chấp hành nghiêm chỉnh luật an toàn giao thông đường bộ Việt Nam. Chữ ký điện tử có hiệu lực pháp lý.',
      createdBy: receptionist._id
    });
    console.log('✅ Created sample legal e-contract');

    // Create technician maintenance record
    await Maintenance.create({
      vehicle: createdVehicles.find(v => v.status === 'maintenance')._id,
      technician: technician._id,
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
        booking: booking._id,
        customer: customer._id,
        amount: 450000,
        type: 'rental_fee',
        method: 'bank_transfer',
        status: 'completed',
        note: 'Khách thanh toán tiền thuê xe 3 ngày qua VietQR MBBank',
        collectedBy: receptionist._id
      },
      {
        booking: booking._id,
        customer: customer._id,
        amount: 500000,
        type: 'deposit',
        method: 'bank_transfer',
        status: 'completed',
        note: 'Tiền đặt cọc giữ hộ xe Air Blade',
        collectedBy: receptionist._id
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
      assignedTo: support._id,
      messages: [
        { sender: customer._id, content: 'Chào shop, xe mình lốp sau hơi non hơi tại đường Lê Duẩn ạ.' },
        { sender: support._id, content: 'Dạ chào bạn, kỹ thuật viên cứu hộ Hải Châu đang di chuyển đến vị trí của bạn trong 10 phút nhé!' }
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
