// ==========================================
// MOCK DATA - Technician Portal
// XTMotoBike Đà Nẵng
// ==========================================

export const MOCK_VEHICLES = [
  { _id: 'v1', code: 'XE-001', name: 'Honda SH 160i', brand: 'Honda', licensePlate: '43B1-12345', type: 'Xe tay ga', odometer: 15200, status: 'available', condition: 'Tốt', lastMaintenance: '2025-04-01', nextMaintenance: '2025-07-01', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=80&fit=crop', year: 2023, engineCC: 160 },
  { _id: 'v2', code: 'XE-002', name: 'Yamaha Exciter 155', brand: 'Yamaha', licensePlate: '43B1-67890', type: 'Xe số', odometer: 22100, status: 'rented', condition: 'Tốt', lastMaintenance: '2025-03-15', nextMaintenance: '2025-06-15', image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=120&h=80&fit=crop', year: 2022, engineCC: 155 },
  { _id: 'v3', code: 'XE-003', name: 'Honda CBR150R', brand: 'Honda', licensePlate: '43B1-11111', type: 'Xe thể thao', odometer: 8900, status: 'maintenance', condition: 'Cần bảo dưỡng', lastMaintenance: '2025-01-10', nextMaintenance: '2025-04-10', image: 'https://images.unsplash.com/photo-1558618047-f4a03f5f4f74?w=120&h=80&fit=crop', year: 2023, engineCC: 150 },
  { _id: 'v4', code: 'XE-004', name: 'Suzuki Raider R150', brand: 'Suzuki', licensePlate: '43B1-22222', type: 'Xe số', odometer: 31500, status: 'broken', condition: 'Hư hỏng', lastMaintenance: '2025-02-20', nextMaintenance: '2025-05-20', image: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=120&h=80&fit=crop', year: 2021, engineCC: 150 },
  { _id: 'v5', code: 'XE-005', name: 'Honda Wave Alpha', brand: 'Honda', licensePlate: '43B1-33333', type: 'Xe số', odometer: 42000, status: 'available', condition: 'Tốt', lastMaintenance: '2025-04-05', nextMaintenance: '2025-07-05', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=80&fit=crop', year: 2020, engineCC: 110 },
  { _id: 'v6', code: 'XE-006', name: 'Yamaha Grande 125', brand: 'Yamaha', licensePlate: '43B1-44444', type: 'Xe tay ga', odometer: 18700, status: 'rented', condition: 'Tốt', lastMaintenance: '2025-03-28', nextMaintenance: '2025-06-28', image: 'https://images.unsplash.com/photo-1558618047-f4a03f5f4f74?w=120&h=80&fit=crop', year: 2022, engineCC: 125 },
];

export const MOCK_MAINTENANCE = [
  { _id: 'm1', code: 'BD-001', vehicleId: 'v2', vehicleName: 'Yamaha Exciter 155', licensePlate: '43B1-67890', type: 'Bảo dưỡng định kỳ (5.000km)', scheduledDate: '2025-04-24', technician: 'Nguyễn Văn Minh', status: 'in_progress', cost: 350000, notes: 'Thay nhớt, lọc gió, kiểm tra phanh', items: ['Thay nhớt máy', 'Thay lọc gió', 'Kiểm tra phanh', 'Kiểm tra lốp'] },
  { _id: 'm2', code: 'BD-002', vehicleId: 'v5', vehicleName: 'Honda Wave Alpha', licensePlate: '43B1-33333', type: 'Kiểm tra tổng quát', scheduledDate: '2025-04-25', technician: 'Trần Đình Huy', status: 'scheduled', cost: 150000, notes: 'Kiểm tra định kỳ 3 tháng', items: ['Kiểm tra phanh', 'Kiểm tra đèn', 'Kiểm tra lốp'] },
  { _id: 'm3', code: 'BD-003', vehicleId: 'v1', vehicleName: 'Honda SH 160i', licensePlate: '43B1-12345', type: 'Thay dầu nhớt', scheduledDate: '2025-04-26', technician: 'Nguyễn Văn Minh', status: 'scheduled', cost: 180000, notes: 'Thay nhớt định kỳ 3000km', items: ['Thay nhớt máy', 'Kiểm tra tổng thể'] },
  { _id: 'm4', code: 'BD-004', vehicleId: 'v6', vehicleName: 'Yamaha Grande 125', licensePlate: '43B1-44444', type: 'Kiểm tra phanh, lốp', scheduledDate: '2025-04-27', technician: 'Lê Minh Tuấn', status: 'scheduled', cost: 200000, notes: 'Kiểm tra hệ thống phanh và lốp', items: ['Kiểm tra phanh trước', 'Kiểm tra phanh sau', 'Kiểm tra lốp trước', 'Kiểm tra lốp sau'] },
  { _id: 'm5', code: 'BD-005', vehicleId: 'v3', vehicleName: 'Honda CBR150R', licensePlate: '43B1-11111', type: 'Bảo dưỡng định kỳ (10.000km)', scheduledDate: '2025-04-20', technician: 'Nguyễn Văn Minh', status: 'completed', cost: 650000, notes: 'Thay nhớt, bugi, lọc gió, kiểm tra toàn bộ', items: ['Thay nhớt máy', 'Thay bugi', 'Thay lọc gió', 'Kiểm tra phanh', 'Căn chỉnh xích'] },
];

export const MOCK_REPAIRS = [
  { _id: 'r1', code: 'SC-001', vehicleId: 'v4', vehicleName: 'Suzuki Raider R150', licensePlate: '43B1-22222', issue: 'Hư hỏng hệ thống phanh', description: 'Phanh trước bị mòn, phanh sau bị kẹt. Xe không thể vận hành an toàn.', status: 'in_progress', priority: 'high', reportedDate: '2025-04-22', technician: 'Trần Đình Huy', estimatedCost: 850000, actualCost: 0, parts: [{ name: 'Má phanh trước', qty: 2, price: 150000 }, { name: 'Má phanh sau', qty: 2, price: 120000 }, { name: 'Dây phanh', qty: 1, price: 80000 }], notes: 'Cần thay toàn bộ hệ thống phanh' },
  { _id: 'r2', code: 'SC-002', vehicleId: 'v3', vehicleName: 'Honda CBR150R', licensePlate: '43B1-11111', issue: 'Rò rỉ nhớt động cơ', description: 'Nhớt bị rò từ phớt chắn dầu. Mức nhớt giảm nhanh.', status: 'waiting_parts', priority: 'medium', reportedDate: '2025-04-21', technician: 'Lê Minh Tuấn', estimatedCost: 450000, actualCost: 0, parts: [{ name: 'Phớt chắn dầu', qty: 2, price: 85000 }, { name: 'Nhớt động cơ 10W-40', qty: 1, price: 180000 }], notes: 'Chờ nhập phớt chắn dầu' },
  { _id: 'r3', code: 'SC-003', vehicleId: 'v6', vehicleName: 'Yamaha Grande 125', licensePlate: '43B1-44444', issue: 'Thay lốp xe', description: 'Lốp sau bị mòn trơn, cần thay ngay.', status: 'completed', priority: 'low', reportedDate: '2025-04-19', technician: 'Nguyễn Văn Minh', estimatedCost: 320000, actualCost: 320000, parts: [{ name: 'Lốp xe sau 100/80-14', qty: 1, price: 280000 }], notes: 'Đã hoàn thành, xe hoạt động bình thường' },
];

export const MOCK_INSPECTIONS = [
  { _id: 'i1', code: 'KT-001', vehicleId: 'v2', vehicleName: 'Yamaha Exciter 155', licensePlate: '43B1-67890', bookingCode: 'DH-028', customer: 'Nguyễn Thị Lan', returnDate: '2025-04-24 10:30', technician: 'Nguyễn Văn Minh', status: 'in_progress', overallResult: 'has_damage', items: { engine: 'ok', brakes: 'damage', tires: 'ok', lights: 'ok', mirrors: 'damage', body: 'damage' }, damages: ['Gương trái bị vỡ', 'Phanh trước bị yếu', 'Trầy xước sườn trái'], beforePhotos: [], afterPhotos: [], estimatedCost: 650000 },
  { _id: 'i2', code: 'KT-002', vehicleId: 'v1', vehicleName: 'Honda SH 160i', licensePlate: '43B1-12345', bookingCode: 'DH-025', customer: 'Trần Minh Khoa', returnDate: '2025-04-23 15:00', technician: 'Trần Đình Huy', status: 'completed', overallResult: 'passed', items: { engine: 'ok', brakes: 'ok', tires: 'ok', lights: 'ok', mirrors: 'ok', body: 'ok' }, damages: [], beforePhotos: [], afterPhotos: [], estimatedCost: 0 },
];

export const MOCK_PARTS = [
  { _id: 'p1', code: 'PT-001', name: 'Nhớt động cơ 10W-40 (1L)', category: 'Nhớt & Dầu', brand: 'Motul', unit: 'Chai', price: 185000, stock: 24, minStock: 10, status: 'in_stock' },
  { _id: 'p2', code: 'PT-002', name: 'Lọc gió Honda Wave', category: 'Lọc', brand: 'Honda', unit: 'Cái', price: 45000, stock: 15, minStock: 5, status: 'in_stock' },
  { _id: 'p3', code: 'PT-003', name: 'Má phanh trước (Bộ)', category: 'Phanh', brand: 'Ferodo', unit: 'Bộ', price: 150000, stock: 8, minStock: 5, status: 'in_stock' },
  { _id: 'p4', code: 'PT-004', name: 'Má phanh sau (Bộ)', category: 'Phanh', brand: 'Ferodo', unit: 'Bộ', price: 120000, stock: 6, minStock: 5, status: 'in_stock' },
  { _id: 'p5', code: 'PT-005', name: 'Bugi NGK CR8E', category: 'Điện', brand: 'NGK', unit: 'Cái', price: 35000, stock: 20, minStock: 10, status: 'in_stock' },
  { _id: 'p6', code: 'PT-006', name: 'Lốp xe 100/80-14 Michelin', category: 'Lốp', brand: 'Michelin', unit: 'Cái', price: 580000, stock: 4, minStock: 4, status: 'low_stock' },
  { _id: 'p7', code: 'PT-007', name: 'Dây phanh trước', category: 'Phanh', brand: 'OEM', unit: 'Cái', price: 80000, stock: 0, minStock: 3, status: 'out_of_stock' },
  { _id: 'p8', code: 'PT-008', name: 'Phớt chắn dầu', category: 'Động cơ', brand: 'OEM', unit: 'Cái', price: 85000, stock: 2, minStock: 4, status: 'low_stock' },
  { _id: 'p9', code: 'PT-009', name: 'Lọc nhớt Honda', category: 'Lọc', brand: 'Honda', unit: 'Cái', price: 55000, stock: 12, minStock: 6, status: 'in_stock' },
  { _id: 'p10', code: 'PT-010', name: 'Xích cam Yamaha', category: 'Động cơ', brand: 'Yamaha', unit: 'Cái', price: 220000, stock: 3, minStock: 2, status: 'in_stock' },
  { _id: 'p11', code: 'PT-011', name: 'Bóng đèn pha LED', category: 'Điện', brand: 'Philips', unit: 'Cái', price: 95000, stock: 10, minStock: 5, status: 'in_stock' },
  { _id: 'p12', code: 'PT-012', name: 'Gương chiếu hậu trái', category: 'Ngoại thất', brand: 'OEM', unit: 'Cái', price: 180000, stock: 5, minStock: 2, status: 'in_stock' },
];

export const MOCK_NOTIFICATIONS = [
  { _id: 'n1', type: 'return', title: 'Đơn thuê #DH028 vừa được trả xe', message: 'Khách hàng Nguyễn Thị Lan vừa trả xe Yamaha Exciter 155. Cần kiểm tra ngay.', time: '10:30', date: '2025-04-24', isRead: false, priority: 'high' },
  { _id: 'n2', type: 'maintenance', title: 'Xe Honda CBR150R cần bảo dưỡng gấp', message: 'Xe CBR150R đã quá 500km so với mốc bảo dưỡng định kỳ. Cần lên lịch ngay.', time: '09:15', date: '2025-04-24', isRead: false, priority: 'medium' },
  { _id: 'n3', type: 'schedule', title: 'Lịch bảo dưỡng đã được cập nhật', message: 'Quản lý đã thêm 2 lịch bảo dưỡng mới vào tuần sau.', time: '08:20', date: '2025-04-24', isRead: true, priority: 'low' },
  { _id: 'n4', type: 'repair', title: 'Phụ tùng đã về: Phớt chắn dầu Honda', message: 'Phụ tùng đặt hàng cho xe CBR150R đã về kho. Có thể tiến hành sửa chữa.', time: '16:45', date: '2025-04-23', isRead: true, priority: 'medium' },
  { _id: 'n5', type: 'return', title: 'Đơn thuê #DH025 vừa được trả xe', message: 'Khách hàng Trần Minh Khoa vừa trả xe Honda SH 160i. Xe trong tình trạng tốt.', time: '15:00', date: '2025-04-23', isRead: true, priority: 'low' },
];

export const CHART_DATA_MONTHLY = [
  { month: 'T11/2024', 'Bảo dưỡng': 8, 'Sửa chữa': 4, 'Kiểm tra': 12 },
  { month: 'T12/2024', 'Bảo dưỡng': 10, 'Sửa chữa': 6, 'Kiểm tra': 15 },
  { month: 'T1/2025', 'Bảo dưỡng': 7, 'Sửa chữa': 3, 'Kiểm tra': 10 },
  { month: 'T2/2025', 'Bảo dưỡng': 9, 'Sửa chữa': 5, 'Kiểm tra': 14 },
  { month: 'T3/2025', 'Bảo dưỡng': 12, 'Sửa chữa': 7, 'Kiểm tra': 18 },
  { month: 'T4/2025', 'Bảo dưỡng': 6, 'Sửa chữa': 4, 'Kiểm tra': 11 },
];

export const CHART_DATA_VEHICLE_STATUS = [
  { name: 'Hoạt động tốt', value: 56, color: '#16A34A' },
  { name: 'Đang sửa chữa', value: 8, color: '#DC2626' },
  { name: 'Bảo dưỡng', value: 12, color: '#D97706' },
  { name: 'Không hoạt động', value: 2, color: '#64748B' },
];

export const CHART_DATA_COST = [
  { month: 'T11/2024', 'Chi phí': 4500000 },
  { month: 'T12/2024', 'Chi phí': 6200000 },
  { month: 'T1/2025', 'Chi phí': 3800000 },
  { month: 'T2/2025', 'Chi phí': 5100000 },
  { month: 'T3/2025', 'Chi phí': 7300000 },
  { month: 'T4/2025', 'Chi phí': 4900000 },
];
