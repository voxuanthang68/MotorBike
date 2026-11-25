'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  Wrench,
  Bike,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  Eye,
  Check,
  Menu,
  X,
  Plus,
  RefreshCw,
  Gauge,
  Phone,
  ShieldCheck,
  Filter,
  Camera,
  ClipboardCheck,
  User,
  Download,
  Printer,
  Package,
  DollarSign,
  Trash2,
  FileWarning,
  Send,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

// ==========================================
// 1. DATA INTERFACES & DEFINITIONS
// ==========================================

export interface VehicleItem {
  _id: string;
  name: string;
  licensePlate: string;
  brand: string;
  model?: string;
  type: string;
  status: 'available' | 'rented' | 'maintenance' | 'broken' | 'retired' | 'reserved';
  image?: string;
  year?: number;
  engineCC?: number;
  odometer?: number;
  condition?: string;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  createdAt?: string;
}

export interface MaintenanceRecord {
  _id: string;
  vehicle: any;
  technician?: any;
  type: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: string;
  completedDate?: string;
  odometerAtMaintenance?: number;
  cost?: number;
  partsReplaced?: Array<{ name: string; cost: number; quantity: number }>;
  notes?: string;
  beforeImage?: string;
  afterImage?: string;
  nextMaintenanceDate?: string;
}

// 1. Kiểm tra xe khi trả
export interface ReturnInspectionItem {
  id: string;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerIdCard: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  rentalStartDate: string;
  rentalEndDate: string;
  returnDate: string;
  deliveryOdometer: number;
  returnOdometer: number;
  // Đối chiếu ảnh trước và sau khi thuê
  deliveryImages: string[];
  returnImages: string[];
  // Tiêu chí kiểm tra an toàn
  brakes: boolean;
  tires: boolean;
  lightsAndHorn: boolean;
  engine: boolean;
  mirrorsAndBody: boolean;
  status: 'pending_inspection' | 'passed' | 'damaged';
  notes: string;
  inspectorName: string;
  hasDamageReport?: boolean;
  damageReportId?: string;
}

// 2. Vị trí và Biên bản hư hỏng
export interface DamagePosition {
  id: string;
  position: string; // VD: Dàn áo yếm trước, Đèn pha LED, Gương chiếu hậu, Ống xả bô, Mâm xe, Tay thắng
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  photo?: string;
  suggestedAction: 'repair' | 'replace';
  suggestedPartName?: string;
}

export interface DamageReportItem {
  id: string;
  code: string; // VD: BBHD-2611-001
  inspectionId?: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  reportedAt: string;
  inspectorName: string;
  positions: DamagePosition[];
  overallSeverity: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  status: 'draft' | 'confirmed' | 'repair_proposed';
  repairId?: string;
  customerAgreedSignature?: boolean;
}

// 3. Phiếu sửa chữa & Báo giá
export interface RepairPartLine {
  partId: string;
  partCode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  laborFee: number;
  total: number;
  isActualUsed?: boolean;
}

export interface RepairItem {
  id: string;
  code: string; // VD: SC-2611-001
  damageReportId?: string;
  damageReportCode?: string;
  bookingCode: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  customerName: string;
  customerPhone: string;
  issueSummary: string;
  proposedSolution: string;
  parts: RepairPartLine[];
  totalPartsPrice: number;
  totalLaborFee: number;
  estimatedCost: number;
  actualCost?: number;
  // Quy trình trạng thái:
  // 1. Chờ duyệt báo giá -> 2. Khách duyệt/từ chối -> 3. Đang sửa -> 4. Hoàn thành
  status: 'waiting_approval' | 'customer_approved' | 'customer_rejected' | 'in_progress' | 'completed';
  progressPercent: number;
  customerFeedbackDate?: string;
  customerFeedbackNote?: string;
  technicianName: string;
  // Ảnh minh chứng trước và sau
  beforePhotos: string[];
  afterPhotos: string[];
  replacementPhotos: string[];
  completionNotes?: string;
  createdAt: string;
  completedAt?: string;
}

// 4. Phụ tùng chính hãng
export interface PartItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unitPrice: number;
  laborFee: number;
  warranty: string;
  stock: number;
  compatible: string;
}

export interface AppNotification {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'inspection' | 'damage' | 'repair' | 'maintenance' | 'system';
}

// Danh mục phụ tùng xe máy chính hãng
const PARTS_CATALOG: PartItem[] = [
  { id: 'p1', code: 'PT-OIL-01', name: 'Dầu nhớt Motul Scooter Expert LE 10W40 (0.8L)', category: 'Dầu nhớt', unitPrice: 120000, laborFee: 20000, warranty: '1.500 km', stock: 45, compatible: 'Xe ga (Vision, AirBlade, SH, Lead)' },
  { id: 'p2', code: 'PT-OIL-02', name: 'Dầu nhớt Castrol Power1 4T 10W40 (1.0L)', category: 'Dầu nhớt', unitPrice: 135000, laborFee: 20000, warranty: '1.500 km', stock: 32, compatible: 'Xe số & Côn tay (Wave, Exciter, Winner)' },
  { id: 'p3', code: 'PT-BRK-01', name: 'Má phanh đĩa trước Nissin chính hãng Honda', category: 'Hệ thống phanh', unitPrice: 180000, laborFee: 30000, warranty: '6 tháng', stock: 24, compatible: 'AirBlade, Vision, Lead, SH' },
  { id: 'p4', code: 'PT-BRK-02', name: 'Bộ má phanh đùm/cơ sau Honda OEM', category: 'Hệ thống phanh', unitPrice: 110000, laborFee: 30000, warranty: '6 tháng', stock: 28, compatible: 'Wave Alpha, Future, Blade, Vision' },
  { id: 'p5', code: 'PT-TIR-01', name: 'Lốp không săm Michelin City Extra (Trước 80/90-14)', category: 'Lốp & Bánh xe', unitPrice: 460000, laborFee: 40000, warranty: '12 tháng', stock: 15, compatible: 'Vision, Air Blade, Vario' },
  { id: 'p6', code: 'PT-TIR-02', name: 'Lốp không săm Michelin City Extra (Sau 90/90-14)', category: 'Lốp & Bánh xe', unitPrice: 520000, laborFee: 40000, warranty: '12 tháng', stock: 12, compatible: 'Vision, Air Blade, Vario' },
  { id: 'p7', code: 'PT-BAT-01', name: 'Bình ắc quy khô GS GTZ5S (12V-3.5Ah)', category: 'Hệ thống điện', unitPrice: 380000, laborFee: 20000, warranty: '9 tháng', stock: 20, compatible: 'Xe ga & Xe số phổ thông' },
  { id: 'p8', code: 'PT-SPK-01', name: 'Bugi chân dài NGK Iridium CPR8EAIX-9', category: 'Động cơ & Đánh lửa', unitPrice: 95000, laborFee: 15000, warranty: '15.000 km', stock: 35, compatible: 'PGM-FI Fi Phun xăng điện tử' },
  { id: 'p9', code: 'PT-BEL-01', name: 'Dây Curoa truyền động Bando Honda chính hãng', category: 'Truyền động', unitPrice: 280000, laborFee: 50000, warranty: '12 tháng (15.000 km)', stock: 14, compatible: 'Air Blade 125/160, Lead 125, SH' },
  { id: 'p10', code: 'PT-CHN-01', name: 'Nhông sên dĩa phốt cao su O-Ring DID 428HD', category: 'Truyền động', unitPrice: 380000, laborFee: 45000, warranty: '12 tháng', stock: 16, compatible: 'Exciter 155, Winner X, Raider 150' },
  { id: 'p11', code: 'PT-MIR-01', name: 'Gương chiếu hậu nguyên bản Honda (Cặp)', category: 'Dàn ngoài', unitPrice: 150000, laborFee: 15000, warranty: '6 tháng', stock: 25, compatible: 'Các dòng xe Honda' },
  { id: 'p12', code: 'PT-BDY-01', name: 'Ốp yếm trước dàn áo chính hãng Honda Vision', category: 'Dàn áo & Nhựa', unitPrice: 420000, laborFee: 60000, warranty: '12 tháng', stock: 8, compatible: 'Honda Vision 2023-2026' },
  { id: 'p13', code: 'PT-LGT-01', name: 'Cụm chóa đèn pha LED 2 tầng siêu sáng', category: 'Hệ thống đèn', unitPrice: 550000, laborFee: 50000, warranty: '12 tháng', stock: 9, compatible: 'Exciter, Winner X, Air Blade' }
];

// Ảnh mẫu thực tế cho quy trình kiểm tra đối chứng
const SAMPLE_PHOTOS = {
  cleanFront: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  cleanRear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
  damageScratched: 'https://images.unsplash.com/photo-1571216332002-282dce467b32?auto=format&fit=crop&w=600&q=80',
  damageBrokenLight: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80',
  repairedPerfect: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=600&q=80',
  newPartInstalled: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80'
};

// ==========================================
// 2. MAIN TECHNICIAN DASHBOARD COMPONENT
// ==========================================

export default function TechnicianPortalPage() {
  const router = useRouter();
  const { user, logout, initialize } = useAuthStore();
  
  // 11 MENU CHÍNH THỨC CỦA NHÂN VIÊN KỸ THUẬT
  const [activeTab, setActiveTab] = useState<
    | 'home'                // 1. Dashboard
    | 'vehicles'            // 2. Quản lý xe
    | 'return_inspection'   // 3. Kiểm tra xe khi trả
    | 'damage_management'   // 4. Quản lý hư hỏng
    | 'repair_management'   // 5. Quản lý sửa chữa
    | 'parts_management'    // 6. Quản lý phụ tùng
    | 'maintenance'         // 7. Quản lý bảo dưỡng
    | 'history'             // 8. Lịch sử kỹ thuật
    | 'reports'             // 9. Báo cáo thống kê
    | 'notifications'       // 10. Thông báo
    | 'profile'             // 11. Tài khoản cá nhân
  >('home');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Database States
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);

  // 1. Dữ liệu Kiểm tra xe khi trả
  const [returnInspections, setReturnInspections] = useState<ReturnInspectionItem[]>([
    {
      id: 'ins-01',
      bookingId: 'bk-101',
      bookingCode: 'DH-202611-028',
      customerName: 'Trần Văn Hoàng',
      customerPhone: '0912 345 678',
      customerIdCard: '048096001234',
      vehicleId: 'v-1',
      vehicleName: 'Honda Vision 2026',
      licensePlate: '43E1-737.37',
      rentalStartDate: '22/11/2026 09:00',
      rentalEndDate: '25/11/2026 12:00',
      returnDate: '25/11/2026 11:30',
      deliveryOdometer: 12200,
      returnOdometer: 12540,
      deliveryImages: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.cleanRear],
      returnImages: [SAMPLE_PHOTOS.damageScratched, SAMPLE_PHOTOS.damageBrokenLight],
      brakes: true,
      tires: true,
      lightsAndHorn: false,
      engine: true,
      mirrorsAndBody: false,
      status: 'damaged',
      notes: 'Khách bị va quẹt nhẹ: Trầy xước dàn áo yếm phải và nứt viền chóa đèn pha.',
      inspectorName: 'Nguyễn Văn Minh',
      hasDamageReport: true,
      damageReportId: 'dmg-01'
    },
    {
      id: 'ins-02',
      bookingId: 'bk-102',
      bookingCode: 'DH-202611-032',
      customerName: 'Lê Thị Thu Thảo',
      customerPhone: '0905 888 999',
      customerIdCard: '048198005678',
      vehicleId: 'v-2',
      vehicleName: 'Honda Air Blade 125cc',
      licensePlate: '43B1-123.45',
      rentalStartDate: '24/11/2026 08:00',
      rentalEndDate: '25/11/2026 14:00',
      returnDate: '25/11/2026 13:45',
      deliveryOdometer: 24500,
      returnOdometer: 24620,
      deliveryImages: [SAMPLE_PHOTOS.cleanFront],
      returnImages: [SAMPLE_PHOTOS.cleanRear],
      brakes: true,
      tires: true,
      lightsAndHorn: true,
      engine: true,
      mirrorsAndBody: true,
      status: 'passed',
      notes: 'Xe nguyên vẹn, đầy đủ xăng, không trầy xước, bàn giao hoàn tất.',
      inspectorName: 'Nguyễn Văn Minh',
      hasDamageReport: false
    }
  ]);

  // 2. Dữ liệu Quản lý hư hỏng
  const [damageReports, setDamageReports] = useState<DamageReportItem[]>([
    {
      id: 'dmg-01',
      code: 'BBHD-2611-001',
      inspectionId: 'ins-01',
      bookingCode: 'DH-202611-028',
      customerName: 'Trần Văn Hoàng',
      customerPhone: '0912 345 678',
      vehicleId: 'v-1',
      vehicleName: 'Honda Vision 2026',
      licensePlate: '43E1-737.37',
      reportedAt: '25/11/2026 11:45',
      inspectorName: 'Nguyễn Văn Minh',
      positions: [
        {
          id: 'pos-1',
          position: 'Dàn áo yếm trước bên phải',
          severity: 'medium',
          description: 'Trầy xước sâu 15cm, tróc sơn lót do cọ xát với tường đá',
          photo: SAMPLE_PHOTOS.damageScratched,
          suggestedAction: 'repair',
          suggestedPartName: 'Sơn dặm & đánh bóng dàn áo'
        },
        {
          id: 'pos-2',
          position: 'Cụm đèn pha LED trước',
          severity: 'high',
          description: 'Nứt chân bắt chóa đèn và vỡ nhẹ viền mica góc trái',
          photo: SAMPLE_PHOTOS.damageBrokenLight,
          suggestedAction: 'replace',
          suggestedPartName: 'Cụm chóa đèn pha LED 2 tầng siêu sáng'
        }
      ],
      overallSeverity: 'high',
      notes: 'Khách hàng xác nhận va quẹt tại bãi xe chùa Linh Ứng. Đồng ý xem xét phương án sửa chữa.',
      status: 'repair_proposed',
      repairId: 'rep-01',
      customerAgreedSignature: true
    }
  ]);

  // 3. Dữ liệu Quản lý sửa chữa
  const [repairs, setRepairs] = useState<RepairItem[]>([
    {
      id: 'rep-01',
      code: 'SC-2611-001',
      damageReportId: 'dmg-01',
      damageReportCode: 'BBHD-2611-001',
      bookingCode: 'DH-202611-028',
      vehicleId: 'v-1',
      vehicleName: 'Honda Vision 2026',
      licensePlate: '43E1-737.37',
      customerName: 'Trần Văn Hoàng',
      customerPhone: '0912 345 678',
      issueSummary: 'Nứt chóa đèn pha LED & trầy xước dàn áo yếm phải',
      proposedSolution: 'Thay cụm đèn pha LED chính hãng mới, hàn chốt nhựa và sơn phục hồi yếm trước',
      parts: [
        {
          partId: 'p13',
          partCode: 'PT-LGT-01',
          name: 'Cụm chóa đèn pha LED 2 tầng siêu sáng',
          quantity: 1,
          unitPrice: 550000,
          laborFee: 50000,
          total: 600000,
          isActualUsed: true
        },
        {
          partId: 'p12',
          partCode: 'PT-BDY-01',
          name: 'Công hàn pát nhựa và sơn sấy phục hồi yếm trước',
          quantity: 1,
          unitPrice: 180000,
          laborFee: 50000,
          total: 230000,
          isActualUsed: true
        }
      ],
      totalPartsPrice: 730000,
      totalLaborFee: 100000,
      totalEstimatedCost: 830000,
      actualCost: 830000,
      status: 'in_progress', // Đang sửa chữa sau khi khách đồng ý
      progressPercent: 70,
      customerFeedbackDate: '25/11/2026 12:15',
      customerFeedbackNote: 'Khách đã duyệt báo giá qua điện thoại và đồng ý cấn trừ tiền cọc.',
      technicianName: 'Nguyễn Văn Minh',
      beforePhotos: [SAMPLE_PHOTOS.damageScratched, SAMPLE_PHOTOS.damageBrokenLight],
      afterPhotos: [SAMPLE_PHOTOS.repairedPerfect],
      replacementPhotos: [SAMPLE_PHOTOS.newPartInstalled],
      createdAt: '25/11/2026 12:00'
    },
    {
      id: 'rep-02',
      code: 'SC-2611-002',
      bookingCode: 'DH-202611-019',
      vehicleId: 'v-3',
      vehicleName: 'Yamaha Exciter 155',
      licensePlate: '43B2-234.56',
      customerName: 'Võ Minh Quân',
      customerPhone: '0935 123 456',
      issueSummary: 'Mòn má phanh đĩa sau và dão xích truyền động',
      proposedSolution: 'Thay bộ nhông sên dĩa phốt DID và thay má phanh Nissin',
      parts: [
        {
          partId: 'p10',
          partCode: 'PT-CHN-01',
          name: 'Nhông sên dĩa phốt cao su O-Ring DID 428HD',
          quantity: 1,
          unitPrice: 380000,
          laborFee: 45000,
          total: 425000,
          isActualUsed: true
        },
        {
          partId: 'p3',
          partCode: 'PT-BRK-01',
          name: 'Má phanh đĩa trước Nissin chính hãng Honda',
          quantity: 1,
          unitPrice: 180000,
          laborFee: 30000,
          total: 210000,
          isActualUsed: true
        }
      ],
      totalPartsPrice: 560000,
      totalLaborFee: 75000,
      totalEstimatedCost: 635000,
      actualCost: 635000,
      status: 'completed',
      progressPercent: 100,
      customerFeedbackDate: '24/11/2026 15:30',
      customerFeedbackNote: 'Đồng ý sửa chữa bảo dưỡng.',
      technicianName: 'Nguyễn Văn Minh',
      beforePhotos: [SAMPLE_PHOTOS.damageScratched],
      afterPhotos: [SAMPLE_PHOTOS.repairedPerfect],
      replacementPhotos: [SAMPLE_PHOTOS.newPartInstalled],
      completionNotes: 'Đã thay xích sên DID căng chuẩn 20mm, đĩa phanh mượt, đã chạy thử êm ái.',
      createdAt: '24/11/2026 15:00',
      completedAt: '25/11/2026 09:30'
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'nt-1', title: 'Khách Trần Văn Hoàng vừa trả xe #43E1-737.37 cần kiểm tra', time: '15 phút trước', unread: true, type: 'inspection' },
    { id: 'nt-2', title: 'Biên bản hư hỏng #BBHD-2611-001 đã được khách đồng ý báo giá', time: '1 giờ trước', unread: true, type: 'damage' },
    { id: 'nt-3', title: 'Phiếu sửa chữa #SC-2611-002 đã hoàn tất nghiệm thu', time: 'Hôm nay 09:30', unread: false, type: 'repair' },
    { id: 'nt-4', title: 'Nhắc nhở: Lịch bảo dưỡng định kỳ xe Honda Vision đến hạn', time: 'Hôm qua', unread: false, type: 'maintenance' }
  ]);

  // Profile Form States
  const [profName, setProfName] = useState(user?.fullName || 'Nguyễn Văn Minh');
  const [profPhone, setProfPhone] = useState(user?.phone || '0905 999 888');
  const [profEmail, setProfEmail] = useState(user?.email || 'technician@motobike.vn');
  const [profOldPass, setProfOldPass] = useState('');
  const [profNewPass, setProfNewPass] = useState('');

  // Modals & Popups
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<ReturnInspectionItem | null>(null);
  const [showCreateDamageReportModal, setShowCreateDamageReportModal] = useState<ReturnInspectionItem | null>(null);
  const [selectedDamageReportDetail, setSelectedDamageReportDetail] = useState<DamageReportItem | null>(null);
  const [showCreateRepairModal, setShowCreateRepairModal] = useState<DamageReportItem | null>(null);
  const [selectedRepairDetail, setSelectedRepairDetail] = useState<RepairItem | null>(null);
  const [showCompleteRepairModal, setShowCompleteRepairModal] = useState<RepairItem | null>(null);
  const [showPhotoCompareModal, setShowPhotoCompareModal] = useState<{
    title: string;
    subtitle: string;
    beforeImgs: string[];
    afterImgs: string[];
    notes?: string;
  } | null>(null);

  // Form State: Tạo kiểm tra xe khi trả mới
  const [newInsBookingCode, setNewInsBookingCode] = useState('DH-202611-040');
  const [newInsCustName, setNewInsCustName] = useState('Đỗ Minh Tiến');
  const [newInsCustPhone, setNewInsCustPhone] = useState('0987 654 321');
  const [newInsVehicleId, setNewInsVehicleId] = useState('');
  const [newInsOdo, setNewInsOdo] = useState(13400);
  const [newInsBrakes, setNewInsBrakes] = useState(true);
  const [newInsTires, setNewInsTires] = useState(true);
  const [newInsLights, setNewInsLights] = useState(true);
  const [newInsEngine, setNewInsEngine] = useState(true);
  const [newInsBody, setNewInsBody] = useState(true);
  const [newInsStatus, setNewInsStatus] = useState<'passed' | 'damaged'>('passed');
  const [newInsNotes, setNewInsNotes] = useState('');
  const [newInsBeforeImg, setNewInsBeforeImg] = useState<string>(SAMPLE_PHOTOS.cleanFront);
  const [newInsAfterImg, setNewInsAfterImg] = useState<string>(SAMPLE_PHOTOS.cleanRear);

  // Form State: Tạo biên bản hư hỏng
  const [dmgPositionsList, setDmgPositionsList] = useState<DamagePosition[]>([
    {
      id: 'p-init-1',
      position: 'Dàn áo yếm trước bên phải',
      severity: 'medium',
      description: 'Cọ quẹt trầy xước sâu',
      photo: SAMPLE_PHOTOS.damageScratched,
      suggestedAction: 'repair',
      suggestedPartName: 'Sơn dặm phục hồi'
    }
  ]);
  const [dmgNotes, setDmgNotes] = useState('');
  const [dmgOverallSeverity, setDmgOverallSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Form State: Tạo đề xuất sửa chữa & báo giá
  const [repSelectedParts, setRepSelectedParts] = useState<{ partId: string; quantity: number }[]>([]);
  const [repSolutionText, setRepSolutionText] = useState('');

  // Form State: Hoàn thành sửa chữa nghiệm thu
  const [compActualCost, setCompActualCost] = useState<number>(0);
  const [compNotes, setCompNotes] = useState('');
  const [compAfterPhoto, setCompAfterPhoto] = useState<string>(SAMPLE_PHOTOS.repairedPerfect);
  const [compPartPhoto, setCompPartPhoto] = useState<string>(SAMPLE_PHOTOS.newPartInstalled);

  // Load Real Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, mRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/maintenance')
      ]);
      if (vRes.data?.data) {
        setVehicles(vRes.data.data);
        if (!newInsVehicleId && vRes.data.data.length > 0) {
          setNewInsVehicleId(vRes.data.data[0]._id);
        }
      }
      if (mRes.data?.data) {
        setMaintenances(mRes.data.data);
      }
    } catch (err) {
      try {
        const pubRes = await api.get('/vehicles/public');
        if (pubRes.data?.data) {
          setVehicles(pubRes.data.data);
          if (!newInsVehicleId && pubRes.data.data.length > 0) {
            setNewInsVehicleId(pubRes.data.data[0]._id);
          }
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
    loadData();
  }, []);

  // Dashboard Metrics
  const stats = useMemo(() => {
    const totalVehicles = vehicles.length || 10;
    const pendingInspections = returnInspections.filter(i => i.status === 'pending_inspection').length;
    const damagedVehicles = returnInspections.filter(i => i.status === 'damaged').length;
    const activeRepairs = repairs.filter(r => r.status === 'in_progress' || r.status === 'waiting_approval').length;
    const completedRepairs = repairs.filter(r => r.status === 'completed').length;
    const totalDamageCost = repairs.reduce((acc, r) => acc + (r.actualCost || r.totalEstimatedCost || 0), 0);

    return {
      totalVehicles,
      pendingInspections,
      damagedVehicles,
      activeRepairs,
      completedRepairs,
      totalDamageCost
    };
  }, [vehicles, returnInspections, repairs]);

  // Live calculation for repair quote in modal
  const modalQuoteCalc = useMemo(() => {
    let partsPrice = 0;
    let laborPrice = 0;
    const lines = repSelectedParts.map(item => {
      const p = PARTS_CATALOG.find(x => x.id === item.partId);
      if (!p) return null;
      const pTotal = p.unitPrice * item.quantity;
      const lTotal = p.laborFee * item.quantity;
      partsPrice += pTotal;
      laborPrice += lTotal;
      return {
        ...p,
        quantity: item.quantity,
        total: pTotal + lTotal
      };
    }).filter(Boolean);

    return {
      lines,
      partsPrice,
      laborPrice,
      grandTotal: partsPrice + laborPrice
    };
  }, [repSelectedParts]);

  // ==========================================
  // 3. EVENT HANDLERS & WORKFLOW LINKING
  // ==========================================

  // 3.1. Lưu phiếu kiểm tra trả xe
  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find(v => v._id === newInsVehicleId);
    const newId = `ins-${Date.now()}`;
    const newRecord: ReturnInspectionItem = {
      id: newId,
      bookingId: `bk-${Date.now()}`,
      bookingCode: newInsBookingCode,
      customerName: newInsCustName,
      customerPhone: newInsCustPhone,
      customerIdCard: '048096009999',
      vehicleId: veh?._id || 'v-gen',
      vehicleName: veh?.name || 'Honda Vision',
      licensePlate: veh?.licensePlate || '43C1-999.99',
      rentalStartDate: '23/11/2026 08:00',
      rentalEndDate: '25/11/2026 14:00',
      returnDate: new Date().toLocaleString('vi-VN'),
      deliveryOdometer: newInsOdo - 120,
      returnOdometer: newInsOdo,
      deliveryImages: [newInsBeforeImg],
      returnImages: [newInsAfterImg],
      brakes: newInsBrakes,
      tires: newInsTires,
      lightsAndHorn: newInsLights,
      engine: newInsEngine,
      mirrorsAndBody: newInsBody,
      status: newInsStatus,
      notes: newInsNotes || (newInsStatus === 'passed' ? 'Xe nguyên vẹn, bàn giao tốt' : 'Phát hiện trầy xước cần xử lý'),
      inspectorName: user?.fullName || 'Nguyễn Văn Minh',
      hasDamageReport: false
    };

    setReturnInspections([newRecord, ...returnInspections]);
    setShowNewInspectionModal(false);

    if (newInsStatus === 'damaged') {
      toast.success('Đã lưu phiếu kiểm tra! Xe có hư hỏng, đang mở Biên bản hư hỏng...');
      // Tự động kích hoạt quy trình liên kết: Mở modal tạo biên bản hư hỏng ngay!
      setShowCreateDamageReportModal(newRecord);
    } else {
      toast.success('Đã hoàn tất tiếp nhận xe an toàn!');
    }
  };

  // 3.2. Lưu Biên bản hư hỏng
  const handleSaveDamageReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateDamageReportModal) return;

    const ins = showCreateDamageReportModal;
    const newDmgId = `dmg-${Date.now()}`;
    const newCode = `BBHD-${Date.now().toString().slice(-6)}`;

    const newReport: DamageReportItem = {
      id: newDmgId,
      code: newCode,
      inspectionId: ins.id,
      bookingCode: ins.bookingCode,
      customerName: ins.customerName,
      customerPhone: ins.customerPhone,
      vehicleId: ins.vehicleId,
      vehicleName: ins.vehicleName,
      licensePlate: ins.licensePlate,
      reportedAt: new Date().toLocaleString('vi-VN'),
      inspectorName: user?.fullName || 'Nguyễn Văn Minh',
      positions: dmgPositionsList,
      overallSeverity: dmgOverallSeverity,
      notes: dmgNotes || 'Khách hàng đã ký xác nhận biên bản ghi nhận hiện trạng hư hỏng tại quầy.',
      status: 'confirmed',
      customerAgreedSignature: true
    };

    // Cập nhật liên kết trong returnInspections
    setReturnInspections(prev => prev.map(i => i.id === ins.id ? { ...i, hasDamageReport: true, damageReportId: newDmgId } : i));
    setDamageReports([newReport, ...damageReports]);
    setShowCreateDamageReportModal(null);
    toast.success(`Đã lập Biên bản hư hỏng ${newCode}! Bạn có thể chuyển sang lập Phiếu sửa chữa.`);
  };

  // 3.3. Tạo Phiếu sửa chữa & Báo giá từ Biên bản hư hỏng
  const handleSaveRepairOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateRepairModal) return;

    const dmg = showCreateRepairModal;
    const newRepId = `rep-${Date.now()}`;
    const newCode = `SC-${Date.now().toString().slice(-6)}`;

    const partsLines: RepairPartLine[] = modalQuoteCalc.lines.map((l: any) => ({
      partId: l.id,
      partCode: l.code,
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      laborFee: l.laborFee,
      total: l.total,
      isActualUsed: true
    }));

    const newRepair: RepairItem = {
      id: newRepId,
      code: newCode,
      damageReportId: dmg.id,
      damageReportCode: dmg.code,
      bookingCode: dmg.bookingCode,
      vehicleId: dmg.vehicleId,
      vehicleName: dmg.vehicleName,
      licensePlate: dmg.licensePlate,
      customerName: dmg.customerName,
      customerPhone: dmg.customerPhone,
      issueSummary: dmg.positions.map(p => `${p.position}: ${p.description}`).join('; '),
      proposedSolution: repSolutionText || 'Thay thế phụ tùng mới chính hãng và phục hồi vị trí hư hỏng',
      parts: partsLines,
      totalPartsPrice: modalQuoteCalc.partsPrice,
      totalLaborFee: modalQuoteCalc.laborPrice,
      totalEstimatedCost: modalQuoteCalc.grandTotal,
      status: 'waiting_approval',
      progressPercent: 0,
      technicianName: user?.fullName || 'Nguyễn Văn Minh',
      beforePhotos: dmg.positions.map(p => p.photo || SAMPLE_PHOTOS.damageScratched),
      afterPhotos: [],
      replacementPhotos: [],
      createdAt: new Date().toLocaleString('vi-VN')
    };

    // Cập nhật trạng thái biên bản hư hỏng
    setDamageReports(prev => prev.map(d => d.id === dmg.id ? { ...d, status: 'repair_proposed', repairId: newRepId } : d));
    setRepairs([newRepair, ...repairs]);
    setShowCreateRepairModal(null);
    setRepSelectedParts([]);
    setRepSolutionText('');
    toast.success(`Đã lập Phiếu sửa chữa & Báo giá ${newCode} (${modalQuoteCalc.grandTotal.toLocaleString()}đ) gửi khách xác nhận!`);
    setActiveTab('repair_management');
  };

  // 3.4. Khách hàng duyệt / từ chối sửa chữa
  const handleCustomerConfirmRepair = (repairId: string, approved: boolean) => {
    setRepairs(prev => prev.map(r => {
      if (r.id === repairId) {
        return {
          ...r,
          status: approved ? 'customer_approved' : 'customer_rejected',
          customerFeedbackDate: new Date().toLocaleString('vi-VN'),
          customerFeedbackNote: approved ? 'Khách hàng đã ký duyệt phương án và chi phí sửa chữa.' : 'Khách từ chối sửa chữa tại cửa hàng, chọn giải quyết bồi thường riêng.'
        };
      }
      return r;
    }));
    toast.success(approved ? 'Khách hàng ĐÃ ĐỒNG Ý sửa chữa! Sẵn sàng tiến hành thi công.' : 'Đã ghi nhận khách hàng TỪ CHỐI sửa chữa.');
  };

  // 3.5. Tiến hành sửa chữa
  const handleStartRepairing = (repairId: string) => {
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: 'in_progress', progressPercent: 30 } : r));
    toast.success('Đã tiếp nhận và bắt đầu thực hiện sửa chữa xe!');
  };

  // 3.6. Nghiệm thu & Cập nhật kết quả sửa chữa (kèm ảnh Trước/Sau)
  const handleCompleteRepairOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCompleteRepairModal) return;

    const rep = showCompleteRepairModal;
    setRepairs(prev => prev.map(r => {
      if (r.id === rep.id) {
        return {
          ...r,
          status: 'completed',
          progressPercent: 100,
          actualCost: compActualCost || r.totalEstimatedCost,
          afterPhotos: [compAfterPhoto || SAMPLE_PHOTOS.repairedPerfect],
          replacementPhotos: [compPartPhoto || SAMPLE_PHOTOS.newPartInstalled],
          completionNotes: compNotes || 'Đã sửa chữa hoàn thiện, thay phụ tùng chính hãng, cân chỉnh phanh lốp, xe chạy êm ái an toàn.',
          completedAt: new Date().toLocaleString('vi-VN')
        };
      }
      return r;
    }));

    // Cập nhật trạng thái xe sang 'available'
    setVehicles(prev => prev.map(v => v._id === rep.vehicleId ? { ...v, status: 'available' } : v));

    setShowCompleteRepairModal(null);
    setCompNotes('');
    toast.success(`Nghiệm thu thành công Phiếu sửa chữa #${rep.code}! Xe ${rep.licensePlate} đã sẵn sàng phục vụ.`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'inherit' }}>
      
      {/* ========================================================
          1. SIDEBAR (11 DANH MỤC CHÍNH THỨC CỦA NHÂN VIÊN KỸ THUẬT)
          ======================================================== */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '74px',
          background: '#0f172a',
          color: '#ffffff',
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #1e293b',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0
        }}
      >
        <div style={{ overflowY: 'auto', paddingBottom: '10px' }}>
          {/* Logo & Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(37,99,235,0.35)', flexShrink: 0 }}>
              <Wrench size={20} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 900, fontSize: '15px', color: '#ffffff' }}>
                  XTMoto<span style={{ color: '#38bdf8' }}>Tech</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Hệ Thống Kỹ Thuật & Sửa Chữa
                </div>
              </div>
            )}
          </div>

          {/* Menu 11 Chức năng chính thức */}
          <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'home' ? '#2563eb' : 'transparent',
                color: activeTab === 'home' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'home' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Gauge size={18} />
              {sidebarOpen && <span>1. Dashboard</span>}
            </button>

            {/* 2. Quản lý xe */}
            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'vehicles' ? '#2563eb' : 'transparent',
                color: activeTab === 'vehicles' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'vehicles' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Bike size={18} />
              {sidebarOpen && <span>2. Quản lý xe ({vehicles.length})</span>}
            </button>

            {/* NHÓM QUY TRÌNH LIÊN KẾT 3-4-5 */}
            <div style={{ margin: '8px 0 4px', padding: '0 8px', fontSize: '10.5px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {sidebarOpen ? 'Quy trình Trả xe & Sửa chữa' : '•••'}
            </div>

            {/* 3. Kiểm tra xe khi trả */}
            <button
              type="button"
              onClick={() => setActiveTab('return_inspection')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'return_inspection' ? '#2563eb' : 'rgba(37,99,235,0.06)',
                color: activeTab === 'return_inspection' ? '#ffffff' : '#93c5fd',
                fontWeight: activeTab === 'return_inspection' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ClipboardCheck size={18} />
                {sidebarOpen && <span>3. Kiểm tra xe khi trả</span>}
              </div>
              {sidebarOpen && (
                <span style={{ background: '#38bdf8', color: '#0f172a', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                  {returnInspections.length}
                </span>
              )}
            </button>

            {/* 4. Quản lý hư hỏng */}
            <button
              type="button"
              onClick={() => setActiveTab('damage_management')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'damage_management' ? '#2563eb' : 'rgba(239,68,68,0.08)',
                color: activeTab === 'damage_management' ? '#ffffff' : '#fca5a5',
                fontWeight: activeTab === 'damage_management' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileWarning size={18} />
                {sidebarOpen && <span>4. Quản lý hư hỏng</span>}
              </div>
              {sidebarOpen && (
                <span style={{ background: '#ef4444', color: '#ffffff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                  {damageReports.length}
                </span>
              )}
            </button>

            {/* 5. Quản lý sửa chữa */}
            <button
              type="button"
              onClick={() => setActiveTab('repair_management')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'repair_management' ? '#2563eb' : 'rgba(245,158,11,0.08)',
                color: activeTab === 'repair_management' ? '#ffffff' : '#fcd34d',
                fontWeight: activeTab === 'repair_management' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={18} />
                {sidebarOpen && <span>5. Quản lý sửa chữa</span>}
              </div>
              {sidebarOpen && (
                <span style={{ background: '#f59e0b', color: '#0f172a', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                  {repairs.filter(r => r.status !== 'completed').length}
                </span>
              )}
            </button>

            {/* 6. Quản lý phụ tùng */}
            <button
              type="button"
              onClick={() => setActiveTab('parts_management')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'parts_management' ? '#2563eb' : 'transparent',
                color: activeTab === 'parts_management' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'parts_management' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Package size={18} />
              {sidebarOpen && <span>6. Quản lý phụ tùng</span>}
            </button>

            {/* 7. Quản lý bảo dưỡng */}
            <button
              type="button"
              onClick={() => setActiveTab('maintenance')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'maintenance' ? '#2563eb' : 'transparent',
                color: activeTab === 'maintenance' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'maintenance' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Wrench size={18} />
              {sidebarOpen && <span>7. Quản lý bảo dưỡng</span>}
            </button>

            {/* 8. Lịch sử kỹ thuật */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'history' ? '#2563eb' : 'transparent',
                color: activeTab === 'history' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'history' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <History size={18} />
              {sidebarOpen && <span>8. Lịch sử kỹ thuật</span>}
            </button>

            {/* 9. Báo cáo thống kê */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'reports' ? '#2563eb' : 'transparent',
                color: activeTab === 'reports' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'reports' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <FileText size={18} />
              {sidebarOpen && <span>9. Báo cáo thống kê</span>}
            </button>

            {/* 10. Thông báo */}
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'notifications' ? '#2563eb' : 'transparent',
                color: activeTab === 'notifications' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'notifications' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={18} />
                {sidebarOpen && <span>10. Thông báo</span>}
              </div>
              {sidebarOpen && (
                <span style={{ background: '#ef4444', color: '#ffffff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
            </button>

            {/* 11. Tài khoản cá nhân */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'profile' ? '#2563eb' : 'transparent',
                color: activeTab === 'profile' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'profile' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <User size={18} />
              {sidebarOpen && <span>11. Tài khoản cá nhân</span>}
            </button>

          </nav>
        </div>

        {/* Footer User */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '13px' }}>
              KT
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>{user?.fullName || 'Nguyễn Văn Minh'}</div>
                <div style={{ fontSize: '11px', color: '#60a5fa' }}>Kỹ thuật viên trưởng</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { logout(); router.push('/login'); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
          >
            <LogOut size={14} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header */}
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569' }}>
              <Menu size={20} />
            </button>
            <div style={{ position: 'relative', width: '340px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm biển số, mã đơn thuê, mã sửa chữa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" onClick={loadData} title="Tải lại dữ liệu" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCw size={15} color="#475569" className={loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={() => setActiveTab('notifications')} style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={16} color="#475569" />
              {notifications.some(n => n.unread) && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              )}
            </button>
            <div onClick={() => setActiveTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                NV
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{user?.fullName || 'Nguyễn Văn Minh'}</div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Container */}
        <main style={{ padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                {activeTab === 'home' && '1. Dashboard Kỹ Thuật Viên'}
                {activeTab === 'vehicles' && '2. Quản Lý Đội Xe'}
                {activeTab === 'return_inspection' && '3. Kiểm Tra Xe Khi Khách Trả (Đối chiếu Trước & Sau)'}
                {activeTab === 'damage_management' && '4. Quản Lý Hư Hỏng & Biên Bản Kiểm Tra'}
                {activeTab === 'repair_management' && '5. Quản Lý Sửa Chữa (Báo giá, Xác nhận & Nghiệm thu)'}
                {activeTab === 'parts_management' && '6. Quản Lý Phụ Tùng Thay Thế'}
                {activeTab === 'maintenance' && '7. Quản Lý Lịch Bảo Dưỡng Định Kỳ'}
                {activeTab === 'history' && '8. Lịch Sử Kỹ Thuật (Kiểm tra, Hư hỏng, Sửa chữa)'}
                {activeTab === 'reports' && '9. Báo Cáo Thống Kê Hiệu Suất & Chi Phí'}
                {activeTab === 'notifications' && '10. Trung Tâm Thông Báo Kỹ Thuật'}
                {activeTab === 'profile' && '11. Quản Lý Tài Khoản Cá Nhân'}
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Quy trình thống nhất: Kiểm tra khi trả xe &rarr; Lập biên bản hư hỏng &rarr; Đề xuất báo giá sửa chữa &rarr; Khách duyệt &rarr; Thi công nghiệm thu ảnh đối chứng
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowNewInspectionModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
              >
                <ClipboardCheck size={16} />
                <span>+ Tiếp nhận kiểm tra trả xe</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('damage_management')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: '#ffffff', border: 'none', padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}
              >
                <FileWarning size={16} />
                <span>Biên bản hư hỏng ({damageReports.length})</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              TAB 1: DASHBOARD (THEO DÕI TỔNG QUAN)
              ======================================================== */}
          {activeTab === 'home' && (
            <>
              {/* 5 Thống kê tổng quan */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '22px' }}>
                <div onClick={() => setActiveTab('vehicles')} style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng xe phân công</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px' }}>{stats.totalVehicles}</div>
                  <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>🛵 Toàn bộ đội xe</div>
                </div>

                <div onClick={() => setActiveTab('return_inspection')} style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Xe vừa trả cần kiểm tra</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#ea580c', margin: '4px 0 2px' }}>{returnInspections.length}</div>
                  <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700 }}>📸 Chụp ảnh đối chứng</div>
                </div>

                <div onClick={() => setActiveTab('damage_management')} style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Biên bản hư hỏng</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', margin: '4px 0 2px' }}>{damageReports.length}</div>
                  <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>⚠️ Chờ lên báo giá</div>
                </div>

                <div onClick={() => setActiveTab('repair_management')} style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Phiếu đang sửa chữa</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', margin: '4px 0 2px' }}>{stats.activeRepairs}</div>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>🛠️ Đang thi công</div>
                </div>

                <div onClick={() => setActiveTab('history')} style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Đã hoàn tất nghiệm thu</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', margin: '4px 0 2px' }}>{stats.completedRepairs}</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>✓ Sẵn sàng xuất bến</div>
                </div>
              </div>

              {/* Sơ đồ quy trình liên kết 3 bước */}
              <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderRadius: '16px', padding: '20px 24px', color: '#ffffff', marginBottom: '22px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#38bdf8" />
                    <span>Quy trình Xử lý Hư hỏng & Bồi thường Khách hàng Khép kín</span>
                  </div>
                  <span style={{ fontSize: '11.5px', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Tiêu chuẩn XTMotoBike
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800 }}>BƯỚC 1</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>3. Tiếp nhận trả xe</div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>Đối chiếu ảnh giao xe vs ảnh trả xe, kiểm tra 5 tiêu chí kỹ thuật.</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 800 }}>BƯỚC 2</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>4. Ghi nhận hư hỏng</div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>Chụp ảnh cận cảnh từng vị trí hỏng, lập biên bản có khách ký xác nhận.</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>BƯỚC 3</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>5. Báo giá & Khách duyệt</div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>Chọn phụ tùng từ kho, tính chi phí, gửi khách xác nhận đồng ý sửa.</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: 800 }}>BƯỚC 4</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>6. Thi công & Nghiệm thu</div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>Thay phụ tùng, chụp ảnh hoàn thiện, lưu vết đối chứng lịch sử.</div>
                  </div>
                </div>
              </div>

              {/* Bảng danh sách công việc cần xử lý ngay */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    Danh sách xe trả phát sinh hư hỏng cần xử lý gấp
                  </div>
                  <button type="button" onClick={() => setActiveTab('return_inspection')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    Xem tất cả ({returnInspections.length}) &rarr;
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {returnInspections.map(ins => (
                    <div key={ins.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: ins.status === 'damaged' ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ins.status === 'damaged' ? '#dc2626' : '#16a34a' }}>
                          {ins.status === 'damaged' ? <FileWarning size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                            {ins.vehicleName} • <span style={{ color: '#2563eb' }}>{ins.licensePlate}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Đơn: <strong>{ins.bookingCode}</strong> • Khách: {ins.customerName} ({ins.customerPhone}) • Trả lúc: {ins.returnDate}
                          </div>
                          <div style={{ fontSize: '11.5px', color: ins.status === 'damaged' ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                            {ins.notes}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedInspectionForDetail(ins)}
                          style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                        >
                          Xem đối chiếu ảnh
                        </button>
                        {ins.status === 'damaged' && !ins.hasDamageReport && (
                          <button
                            type="button"
                            onClick={() => setShowCreateDamageReportModal(ins)}
                            style={{ padding: '6px 12px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Lập biên bản hư hỏng
                          </button>
                        )}
                        {ins.hasDamageReport && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('damage_management')}
                            style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Xem biên bản
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              TAB 2: QUẢN LÝ XE
              ======================================================== */}
          {activeTab === 'vehicles' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Danh sách xe & Tình trạng kỹ thuật
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Theo dõi số Odo, lịch bảo dưỡng và trạng thái hoạt động thực tế của từng xe
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Mã xe</th>
                      <th style={{ padding: '12px' }}>Tên xe & Hãng</th>
                      <th style={{ padding: '12px' }}>Biển số</th>
                      <th style={{ padding: '12px' }}>Loại xe</th>
                      <th style={{ padding: '12px' }}>Số km (Odo)</th>
                      <th style={{ padding: '12px' }}>Tình trạng kỹ thuật</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles
                      .filter(v => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(veh => (
                        <tr key={veh._id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#64748b' }}>#{veh._id.slice(-6).toUpperCase()}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{veh.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{veh.brand} ({veh.year || 2024})</div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>{veh.licensePlate}</td>
                          <td style={{ padding: '12px', color: '#475569' }}>{veh.type}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>{(veh.odometer || 12000).toLocaleString()} km</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: veh.status === 'available' ? '#f0fdf4' : veh.status === 'rented' ? '#eff6ff' : veh.status === 'broken' ? '#fee2e2' : '#fef3c7',
                              color: veh.status === 'available' ? '#16a34a' : veh.status === 'rented' ? '#2563eb' : veh.status === 'broken' ? '#dc2626' : '#b45309'
                            }}>
                              {veh.status === 'available' && '✓ Sẵn sàng'}
                              {veh.status === 'rented' && '🛵 Đang cho thuê'}
                              {veh.status === 'broken' && '⚠️ Đang hư hỏng'}
                              {veh.status === 'maintenance' && '🔧 Đang bảo dưỡng'}
                              {veh.status === 'reserved' && '⏳ Đã đặt trước'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setNewInsVehicleId(veh._id);
                                setShowNewInspectionModal(true);
                              }}
                              style={{ padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Tiếp nhận kiểm tra
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: KIỂM TRA XE KHI TRẢ (RETURN INSPECTION)
              ======================================================== */}
          {activeTab === 'return_inspection' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Tiếp nhận xe sau khi khách trả & Đối chiếu tình trạng trước - sau
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Kiểm tra tổng thể 5 bộ phận kỹ thuật, chụp ảnh đối chứng đơn thuê và lập biên bản nếu phát sinh lỗi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewInspectionModal(true)}
                  style={{ padding: '8px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} />
                  <span>Tiếp nhận xe mới trả</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '16px' }}>
                {returnInspections.map(ins => (
                  <div key={ins.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>Đơn: {ins.bookingCode}</span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: ins.status === 'passed' ? '#dcfce7' : '#fee2e2',
                          color: ins.status === 'passed' ? '#16a34a' : '#dc2626'
                        }}>
                          {ins.status === 'passed' ? '✓ Đạt yêu cầu' : '⚠️ Có hư hỏng'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                        {ins.vehicleName} ({ins.licensePlate})
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                        Khách: <strong>{ins.customerName}</strong> ({ins.customerPhone}) • Odo trả: {ins.returnOdometer.toLocaleString()} km
                      </div>

                      {/* 5 Tiêu chuẩn kiểm tra */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                        <div>{ins.brakes ? '✅' : '❌'} Phanh trước & sau</div>
                        <div>{ins.tires ? '✅' : '❌'} Lốp xe & áp suất</div>
                        <div>{ins.lightsAndHorn ? '✅' : '❌'} Đèn chiếu & còi</div>
                        <div>{ins.engine ? '✅' : '❌'} Động cơ vận hành</div>
                        <div style={{ gridColumn: 'span 2' }}>{ins.mirrorsAndBody ? '✅' : '❌'} Gương & dàn áo bên ngoài</div>
                      </div>

                      {/* 2 Khung ảnh đối chứng Trước vs Sau */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          <img src={ins.deliveryImages[0] || SAMPLE_PHOTOS.cleanFront} alt="Trước thuê" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(15,23,42,0.75)', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px', textAlign: 'center' }}>
                            📸 Ảnh lúc bàn giao
                          </div>
                        </div>

                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          <img src={ins.returnImages[0] || SAMPLE_PHOTOS.damageScratched} alt="Khi trả" style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: ins.status === 'damaged' ? 'rgba(220,38,38,0.85)' : 'rgba(22,163,74,0.85)', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px', textAlign: 'center' }}>
                            {ins.status === 'damaged' ? '⚠️ Ảnh khi khách trả' : '✓ Xe sạch đẹp'}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '8px' }}>
                        "{ins.notes}"
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowPhotoCompareModal({
                          title: `Đối chiếu hình ảnh: ${ins.vehicleName} (${ins.licensePlate})`,
                          subtitle: `Đơn thuê: ${ins.bookingCode} • Khách hàng: ${ins.customerName} (${ins.customerPhone})`,
                          beforeImgs: ins.deliveryImages,
                          afterImgs: ins.returnImages,
                          notes: ins.notes
                        })}
                        style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Camera size={14} />
                        <span>Phóng to đối chiếu</span>
                      </button>

                      {ins.status === 'damaged' && !ins.hasDamageReport && (
                        <button
                          type="button"
                          onClick={() => setShowCreateDamageReportModal(ins)}
                          style={{ padding: '6px 12px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Lập biên bản hư hỏng
                        </button>
                      )}

                      {ins.hasDamageReport && (
                        <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 800 }}>
                          ✓ Đã lập biên bản hư hỏng
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: QUẢN LÝ HƯ HỎNG (DAMAGE MANAGEMENT)
              ======================================================== */}
          {activeTab === 'damage_management' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Quản lý biên bản hư hỏng & Vị trí thiệt hại chi tiết
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Ghi nhận từng bộ phận hư hại, mức độ, ảnh chi tiết và xác định phụ tùng cần thay thế
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {damageReports.map(dmg => (
                  <div key={dmg.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#dc2626' }}>{dmg.code}</span>
                          <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            Mức độ: {dmg.overallSeverity.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Đơn thuê: <strong>{dmg.bookingCode}</strong>
                          </span>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                          Xe: {dmg.vehicleName} • Biển số: <span style={{ color: '#2563eb' }}>{dmg.licensePlate}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Khách hàng: <strong>{dmg.customerName}</strong> ({dmg.customerPhone}) • Kỹ thuật viên lập: {dmg.inspectorName} ({dmg.reportedAt})
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {dmg.status === 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => setShowCreateRepairModal(dmg)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
                          >
                            <Wrench size={15} />
                            <span>Lập đề xuất sửa chữa & Báo giá</span>
                          </button>
                        )}
                        {dmg.status === 'repair_proposed' && (
                          <span style={{ padding: '6px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '8px', fontSize: '12px', fontWeight: 800 }}>
                            ✓ Đã tạo phiếu sửa chữa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chi tiết từng vị trí hư hỏng */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                      {dmg.positions.map((pos, pIdx) => (
                        <div key={pos.id || pIdx} style={{ background: '#ffffff', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
                          {pos.photo && (
                            <img src={pos.photo} alt={pos.position} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{pos.position}</div>
                            <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, margin: '2px 0' }}>
                              Mức độ: {pos.severity} • {pos.suggestedAction === 'replace' ? 'Đề xuất thay mới' : 'Sửa chữa phục hồi'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.4 }}>{pos.description}</div>
                            {pos.suggestedPartName && (
                              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, marginTop: '4px' }}>
                                Linh kiện: {pos.suggestedPartName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong>Ghi chú biên bản:</strong> "{dmg.notes}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: QUẢN LÝ SỬA CHỮA (REPAIR MANAGEMENT)
              ======================================================== */}
          {activeTab === 'repair_management' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Quy trình sửa chữa: Báo giá &rarr; Khách duyệt &rarr; Thực hiện &rarr; Nghiệm thu
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Theo dõi trạng thái duyệt của khách hàng, cập nhật phụ tùng sử dụng và lưu hình ảnh hoàn tất
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {repairs.map(rep => (
                  <div key={rep.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#2563eb' }}>{rep.code}</span>
                          {rep.damageReportCode && (
                            <span style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              Từ BB: {rep.damageReportCode}
                            </span>
                          )}
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: rep.status === 'completed' ? '#dcfce7' : rep.status === 'in_progress' ? '#eff6ff' : rep.status === 'customer_approved' ? '#fef3c7' : rep.status === 'customer_rejected' ? '#fee2e2' : '#f1f5f9',
                            color: rep.status === 'completed' ? '#16a34a' : rep.status === 'in_progress' ? '#2563eb' : rep.status === 'customer_approved' ? '#b45309' : rep.status === 'customer_rejected' ? '#dc2626' : '#64748b'
                          }}>
                            {rep.status === 'waiting_approval' && '1. Chờ khách duyệt báo giá'}
                            {rep.status === 'customer_approved' && '2. Khách ĐÃ ĐỒNG Ý sửa'}
                            {rep.status === 'customer_rejected' && '2. Khách TỪ CHỐI sửa'}
                            {rep.status === 'in_progress' && '3. Đang tiến hành sửa chữa'}
                            {rep.status === 'completed' && '4. Đã hoàn thành nghiệm thu'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                          {rep.vehicleName} • Biển số: <span style={{ color: '#2563eb' }}>{rep.licensePlate}</span>
                        </h3>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Khách hàng: <strong>{rep.customerName}</strong> ({rep.customerPhone}) • Thợ phụ trách: {rep.technicianName}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                          {(rep.actualCost || rep.totalEstimatedCost).toLocaleString('vi-VN')}đ
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#16a34a' }}>
                          Linh kiện: {rep.totalPartsPrice.toLocaleString()}đ + Công: {rep.totalLaborFee.toLocaleString()}đ
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                      <strong>Vấn đề hư hỏng:</strong> {rep.issueSummary}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#0284c7', marginBottom: '12px' }}>
                      <strong>Phương án xử lý:</strong> {rep.proposedSolution}
                    </div>

                    {/* Danh sách linh kiện đã chọn */}
                    <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                        Phụ tùng thay thế đã bóc tách:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {rep.parts.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                            <span>• {p.name} (x{p.quantity})</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.total.toLocaleString()}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tiến độ và hình ảnh đối chứng */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      {/* Cột tiến độ */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                          <span>Tiến độ thực hiện:</span>
                          <span>{rep.progressPercent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${rep.progressPercent}%`, height: '100%', background: rep.status === 'completed' ? '#16a34a' : '#2563eb' }} />
                        </div>
                        {rep.customerFeedbackNote && (
                          <div style={{ fontSize: '11.5px', color: '#0f172a', background: '#eff6ff', padding: '6px 10px', borderRadius: '6px', marginTop: '8px' }}>
                            💬 {rep.customerFeedbackNote} ({rep.customerFeedbackDate})
                          </div>
                        )}
                        {rep.completionNotes && (
                          <div style={{ fontSize: '11.5px', color: '#16a34a', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', marginTop: '6px' }}>
                            ✓ {rep.completionNotes}
                          </div>
                        )}
                      </div>

                      {/* Cột ảnh đối chứng Trước vs Sau */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {rep.beforePhotos.length > 0 && (
                          <div style={{ flex: 1, position: 'relative', borderRadius: '6px', overflow: 'hidden', height: '85px' }}>
                            <img src={rep.beforePhotos[0]} alt="Trước sửa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', textAlign: 'center', padding: '2px' }}>
                              Trước khi sửa
                            </span>
                          </div>
                        )}
                        {rep.afterPhotos.length > 0 ? (
                          <div style={{ flex: 1, position: 'relative', borderRadius: '6px', overflow: 'hidden', height: '85px' }}>
                            <img src={rep.afterPhotos[0]} alt="Sau sửa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(22,163,74,0.8)', color: '#fff', fontSize: '9px', textAlign: 'center', padding: '2px' }}>
                              Sau khi xong
                            </span>
                          </div>
                        ) : (
                          <div style={{ flex: 1, height: '85px', border: '1px dashed #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#94a3b8' }}>
                            Chờ ảnh sau sửa
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bộ nút hành động theo từng bước */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', flexWrap: 'wrap' }}>
                      {/* Nút gửi báo giá / in báo giá */}
                      <button
                        type="button"
                        onClick={() => {
                          toast.success('Đã gửi báo giá qua Zalo/SMS cho khách hàng!');
                          window.print();
                        }}
                        style={{ padding: '7px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={14} />
                        <span>In / Gửi báo giá</span>
                      </button>

                      {/* Bước 4: Khách duyệt hoặc từ chối */}
                      {rep.status === 'waiting_approval' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCustomerConfirmRepair(rep.id, true)}
                            style={{ padding: '7px 14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ThumbsUp size={14} />
                            <span>Khách đồng ý sửa chữa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomerConfirmRepair(rep.id, false)}
                            style={{ padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ThumbsDown size={14} />
                            <span>Khách từ chối</span>
                          </button>
                        </>
                      )}

                      {/* Bước 5: Bắt đầu thực hiện sửa chữa */}
                      {rep.status === 'customer_approved' && (
                        <button
                          type="button"
                          onClick={() => handleStartRepairing(rep.id)}
                          style={{ padding: '7px 16px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Wrench size={14} />
                          <span>Bắt đầu tiến hành sửa chữa</span>
                        </button>
                      )}

                      {/* Bước 6: Nghiệm thu & Chụp ảnh sau khi xong */}
                      {rep.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompActualCost(rep.totalEstimatedCost);
                            setShowCompleteRepairModal(rep);
                          }}
                          style={{ padding: '7px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Camera size={14} />
                          <span>Cập nhật kết quả & Nghiệm thu xe</span>
                        </button>
                      )}

                      {/* Phóng to so sánh ảnh đối chứng */}
                      <button
                        type="button"
                        onClick={() => setShowPhotoCompareModal({
                          title: `Đối chứng sửa chữa: ${rep.code} - ${rep.vehicleName}`,
                          subtitle: `Khách hàng: ${rep.customerName} • Chi phí: ${(rep.actualCost || rep.totalEstimatedCost).toLocaleString()}đ`,
                          beforeImgs: rep.beforePhotos,
                          afterImgs: rep.afterPhotos.length > 0 ? rep.afterPhotos : [SAMPLE_PHOTOS.repairedPerfect],
                          notes: rep.completionNotes || rep.proposedSolution
                        })}
                        style={{ marginLeft: 'auto', padding: '7px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Xem ảnh đối chứng Trước & Sau
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: QUẢN LÝ PHỤ TÙNG (PARTS MANAGEMENT)
              ======================================================== */}
          {activeTab === 'parts_management' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Kho phụ tùng chính hãng & Đơn giá thay thế niêm yết
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Tra cứu giá linh kiện, tiền công thợ, thời hạn bảo hành và số lượng tồn kho phục vụ báo giá
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Mã phụ tùng</th>
                      <th style={{ padding: '12px' }}>Tên linh kiện</th>
                      <th style={{ padding: '12px' }}>Nhóm</th>
                      <th style={{ padding: '12px' }}>Giá phụ tùng</th>
                      <th style={{ padding: '12px' }}>Tiền công lắp</th>
                      <th style={{ padding: '12px' }}>Bảo hành</th>
                      <th style={{ padding: '12px' }}>Tồn kho</th>
                      <th style={{ padding: '12px' }}>Tương thích</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PARTS_CATALOG.map(pt => (
                      <tr key={pt.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>{pt.code}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{pt.name}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{pt.category}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{pt.unitPrice.toLocaleString()}đ</td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{pt.laborFee.toLocaleString()}đ</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                            {pt.warranty}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 800, color: pt.stock < 15 ? '#ea580c' : '#16a34a' }}>
                          {pt.stock} cái
                        </td>
                        <td style={{ padding: '12px', fontSize: '11.5px', color: '#64748b' }}>{pt.compatible}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 7: QUẢN LÝ BẢO DƯỠNG (MAINTENANCE)
              ======================================================== */}
          {activeTab === 'maintenance' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Theo dõi & Thực hiện bảo dưỡng định kỳ
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Quản lý lịch thay nhớt, bảo dưỡng nồi, phanh và kiểm tra xe định kỳ 1.500km - 5.000km
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Mã phiếu</th>
                      <th style={{ padding: '12px' }}>Xe bảo dưỡng</th>
                      <th style={{ padding: '12px' }}>Hạng mục</th>
                      <th style={{ padding: '12px' }}>Kỹ thuật viên</th>
                      <th style={{ padding: '12px' }}>Chi phí</th>
                      <th style={{ padding: '12px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.map(m => (
                      <tr key={m._id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>BD#{m._id.slice(-6).toUpperCase()}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{m.vehicle?.name || 'Xe Máy'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{m.vehicle?.licensePlate || '43-ĐN'}</div>
                        </td>
                        <td style={{ padding: '12px', color: '#334155', fontWeight: 600 }}>{m.title}</td>
                        <td style={{ padding: '12px', color: '#475569' }}>{m.technician?.fullName || user?.fullName || 'Nguyễn Văn Minh'}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{(m.cost || 150000).toLocaleString()}đ</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, background: m.status === 'completed' ? '#dcfce7' : '#eff6ff', color: m.status === 'completed' ? '#16a34a' : '#2563eb' }}>
                            {m.status === 'completed' ? '✓ Hoàn thành' : 'Đang xử lý'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: LỊCH SỬ KỸ THUẬT (HISTORY)
              ======================================================== */}
          {activeTab === 'history' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Tra cứu toàn bộ hồ sơ lịch sử kiểm tra, hư hỏng & sửa chữa
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Lưu vết đồng bộ từ đơn thuê &rarr; ảnh chụp đối chứng &rarr; phụ tùng thay thế &rarr; chi phí
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Thời gian</th>
                      <th style={{ padding: '12px' }}>Đơn thuê & Xe</th>
                      <th style={{ padding: '12px' }}>Hạng mục thực hiện</th>
                      <th style={{ padding: '12px' }}>Kỹ thuật viên</th>
                      <th style={{ padding: '12px' }}>Chi phí</th>
                      <th style={{ padding: '12px' }}>Ảnh đối chứng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairs.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{r.completedAt || r.createdAt}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.vehicleName} ({r.licensePlate})</div>
                          <div style={{ fontSize: '11px', color: '#2563eb' }}>Đơn: {r.bookingCode} • Khách: {r.customerName}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.issueSummary}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Phụ tùng: {r.parts.map(p => p.name).join(', ')}</div>
                        </td>
                        <td style={{ padding: '12px', color: '#475569' }}>{r.technicianName}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>{(r.actualCost || r.totalEstimatedCost).toLocaleString()}đ</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            type="button"
                            onClick={() => setShowPhotoCompareModal({
                              title: `Đối chứng sửa chữa: ${r.code}`,
                              subtitle: `Xe ${r.vehicleName} (${r.licensePlate}) • Đơn: ${r.bookingCode}`,
                              beforeImgs: r.beforePhotos,
                              afterImgs: r.afterPhotos.length > 0 ? r.afterPhotos : [SAMPLE_PHOTOS.repairedPerfect],
                              notes: r.completionNotes || r.proposedSolution
                            })}
                            style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Xem ảnh đối chứng
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 9: BÁO CÁO THỐNG KÊ (REPORTS)
              ======================================================== */}
          {activeTab === 'reports' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Báo cáo thống kê hiệu suất kỹ thuật & chi phí bồi thường
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Tổng hợp số lượt kiểm tra, số vụ hư hỏng phát sinh và doanh thu phụ tùng thay thế
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => toast.success('Đang xuất file Excel...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    <Download size={15} />
                    <span>Xuất báo cáo Excel</span>
                  </button>
                  <button type="button" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    <Printer size={15} />
                    <span>In báo cáo</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Lượt kiểm tra xe trả</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{returnInspections.length} lượt</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>100% có ảnh đối chứng</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Vụ hư hỏng phát sinh</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>{damageReports.length} vụ</div>
                  <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>Đã lập biên bản</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Sửa chữa hoàn thành</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>{stats.completedRepairs} phiếu</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Khách hàng đồng ý 100%</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng chi phí bồi thường</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{stats.totalDamageCost.toLocaleString()}đ</div>
                  <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>Đã thu & cấn trừ cọc</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 10: THÔNG BÁO (NOTIFICATIONS)
              ======================================================== */}
          {activeTab === 'notifications' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Trung tâm thông báo kỹ thuật</h2>
                <button
                  type="button"
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                    toast.success('Đã đánh dấu tất cả là đã đọc');
                  }}
                  style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', background: n.unread ? '#eff6ff' : '#f8fafc', border: n.unread ? '1px solid #bfdbfe' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: n.unread ? '#2563eb' : '#94a3b8', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: n.unread ? 800 : 600, color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{n.time}</div>
                      </div>
                    </div>
                    {n.unread && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 11: TÀI KHOẢN CÁ NHÂN (PROFILE)
              ======================================================== */}
          {activeTab === 'profile' && (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Hồ sơ tài khoản Kỹ thuật viên</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <form onSubmit={e => { e.preventDefault(); toast.success('Đã lưu thông tin tài khoản!'); }} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Thông tin liên hệ</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                      <input type="text" value={profName} onChange={e => setProfName(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                      <input type="text" value={profPhone} onChange={e => setProfPhone(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input type="email" value={profEmail} onChange={e => setProfEmail(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <button type="submit" style={{ padding: '9px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
                      Lưu thông tin cá nhân
                    </button>
                  </div>
                </form>

                <form onSubmit={e => { e.preventDefault(); toast.success('Đã đổi mật khẩu thành công!'); setProfOldPass(''); setProfNewPass(''); }} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Đổi mật khẩu</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mật khẩu hiện tại</label>
                      <input type="password" value={profOldPass} onChange={e => setProfOldPass(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mật khẩu mới</label>
                      <input type="password" value={profNewPass} onChange={e => setProfNewPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <button type="submit" style={{ padding: '9px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
                      Cập nhật mật khẩu mới
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================
          MODAL 1: TIẾP NHẬN & KIỂM TRA XE KHI KHÁCH TRẢ
          ======================================================== */}
      {showNewInspectionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }} onClick={() => setShowNewInspectionModal(false)}>
          <form onSubmit={handleSaveInspection} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardCheck size={20} color="#2563eb" />
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  1. Tiếp nhận và kiểm tra xe sau khi khách trả
                </h3>
              </div>
              <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mã đơn thuê</label>
                  <input type="text" value={newInsBookingCode} onChange={e => setNewInsBookingCode(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Họ tên khách hàng</label>
                  <input type="text" value={newInsCustName} onChange={e => setNewInsCustName(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Chọn xe trả</label>
                  <select value={newInsVehicleId} onChange={e => setNewInsVehicleId(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Số km Odo khi trả</label>
                  <input type="number" value={newInsOdo} onChange={e => setNewInsOdo(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              {/* 5 Hạng mục kiểm tra an toàn */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Kiểm tra tổng thể tình trạng xe:</label>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newInsBrakes} onChange={e => setNewInsBrakes(e.target.checked)} />
                    <span>Hệ thống phanh trước và sau (độ bám, má phanh không kẹt)</span>
                  </label>
                  <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newInsTires} onChange={e => setNewInsTires(e.target.checked)} />
                    <span>Lốp xe & áp suất bánh (không thủng đinh, gai lốp tốt)</span>
                  </label>
                  <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newInsLights} onChange={e => setNewInsLights(e.target.checked)} />
                    <span>Đèn pha LED, xi nhan và còi xe hoạt động bình thường</span>
                  </label>
                  <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newInsEngine} onChange={e => setNewInsEngine(e.target.checked)} />
                    <span>Động cơ nổ êm, không gõ máy, không chảy nhớt</span>
                  </label>
                  <label style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newInsBody} onChange={e => setNewInsBody(e.target.checked)} />
                    <span>Gương chiếu hậu, yên xe, dàn áo nguyên vẹn không trầy móp</span>
                  </label>
                </div>
              </div>

              {/* Ảnh đối chiếu Trước vs Sau */}
              <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', marginBottom: '6px' }}>
                  📸 Ảnh đối chiếu: Lúc bàn giao vs Lúc nhận xe trả
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Ảnh lúc giao:</span>
                    <img src={newInsBeforeImg} alt="Before" style={{ width: '100%', height: '70px', borderRadius: '6px', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Ảnh khi trả xe:</span>
                    <img src={newInsAfterImg} alt="After" style={{ width: '100%', height: '70px', borderRadius: '6px', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>

              {/* Kết quả kiểm tra */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '4px' }}>Kết luận sau khi kiểm tra:</label>
                <select value={newInsStatus} onChange={e => setNewInsStatus(e.target.value as any)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800, color: newInsStatus === 'passed' ? '#16a34a' : '#dc2626' }}>
                  <option value="passed">✓ Xe đạt yêu cầu (Hoàn tất trả xe, xe sẵn sàng)</option>
                  <option value="damaged">⚠️ Xe có hư hỏng / trầy xước (Cần lập biên bản hư hỏng)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mô tả chi tiết / Ghi chú</label>
                <textarea rows={2} value={newInsNotes} onChange={e => setNewInsNotes(e.target.value)} placeholder="Nhập ghi chú hiện trạng xe..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 18px', background: newInsStatus === 'damaged' ? '#dc2626' : '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}>
                {newInsStatus === 'damaged' ? 'Lưu & Lập biên bản hư hỏng &rarr;' : 'Hoàn tất tiếp nhận xe'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 2: LẬP BIÊN BẢN HƯ HỎNG (TỪ KIỂM TRA TRẢ XE)
          ======================================================== */}
      {showCreateDamageReportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '16px' }} onClick={() => setShowCreateDamageReportModal(null)}>
          <form onSubmit={handleSaveDamageReport} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileWarning size={22} color="#dc2626" />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    2. Lập biên bản kiểm tra & ghi nhận hư hỏng
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Đơn: {showCreateDamageReportModal.bookingCode} • Xe: {showCreateDamageReportModal.vehicleName} ({showCreateDamageReportModal.licensePlate})
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreateDamageReportModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {/* Danh sách từng vị trí hư hỏng */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Danh sách vị trí hư hỏng chi tiết:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDmgPositionsList([
                        ...dmgPositionsList,
                        {
                          id: `p-${Date.now()}`,
                          position: 'Cụm đèn pha trước',
                          severity: 'medium',
                          description: 'Nứt chân đế bắt ốc',
                          photo: SAMPLE_PHOTOS.damageBrokenLight,
                          suggestedAction: 'replace',
                          suggestedPartName: 'Cụm đèn pha LED'
                        }
                      ]);
                    }}
                    style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Thêm vị trí hư hỏng
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dmgPositionsList.map((pos, idx) => (
                    <div key={pos.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626' }}>Vị trí #{idx + 1}</span>
                        {dmgPositionsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDmgPositionsList(dmgPositionsList.filter(p => p.id !== pos.id))}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}
                          >
                            Xóa
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#475569', display: 'block' }}>Vị trí hư hỏng</label>
                          <select
                            value={pos.position}
                            onChange={e => {
                              const val = e.target.value;
                              setDmgPositionsList(dmgPositionsList.map(p => p.id === pos.id ? { ...p, position: val } : p));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          >
                            <option value="Dàn áo yếm trước bên phải">Dàn áo yếm trước bên phải</option>
                            <option value="Dàn áo yếm trước bên trái">Dàn áo yếm trước bên trái</option>
                            <option value="Cụm đèn pha LED trước">Cụm đèn pha LED trước</option>
                            <option value="Gương chiếu hậu phải">Gương chiếu hậu phải</option>
                            <option value="Ống xả bô & ốp bô">Ống xả bô & ốp bô</option>
                            <option value="Tay thắng / tay côn">Tay thắng / tay côn</option>
                            <option value="Mâm vành xe trước">Mâm vành xe trước</option>
                            <option value="Dè chắn bùn sau">Dè chắn bùn sau</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#475569', display: 'block' }}>Mức độ hư hại</label>
                          <select
                            value={pos.severity}
                            onChange={e => {
                              const val = e.target.value as any;
                              setDmgPositionsList(dmgPositionsList.map(p => p.id === pos.id ? { ...p, severity: val } : p));
                            }}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                          >
                            <option value="low">Nhẹ (Trầy xước bề mặt)</option>
                            <option value="medium">Trung bình (Vỡ nứt nhẹ/móp)</option>
                            <option value="high">Nặng (Hỏng cụm linh kiện)</option>
                            <option value="critical">Nghiêm trọng (Mất an toàn)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#475569', display: 'block' }}>Mô tả chi tiết vết hư hỏng</label>
                        <input
                          type="text"
                          value={pos.description}
                          onChange={e => {
                            const val = e.target.value;
                            setDmgPositionsList(dmgPositionsList.map(p => p.id === pos.id ? { ...p, description: val } : p));
                          }}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mức độ thiệt hại tổng thể</label>
                <select value={dmgOverallSeverity} onChange={e => setDmgOverallSeverity(e.target.value as any)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 800 }}>
                  <option value="low">Mức độ Thấp (Có thể khắc phục nhanh)</option>
                  <option value="medium">Mức độ Trung bình (Cần sơn/thay 1 linh kiện nhỏ)</option>
                  <option value="high">Mức độ Nặng (Cần thay thế cụm linh kiện chính hãng)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Ý kiến khách hàng & Ghi chú</label>
                <textarea rows={2} value={dmgNotes} onChange={e => setDmgNotes(e.target.value)} placeholder="Khách hàng xác nhận va chạm, đồng ý xem xét chi phí sửa chữa..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreateDamageReportModal(null)} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 18px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}>
                Xác nhận & Lưu biên bản hư hỏng
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 3: ĐỀ XUẤT SỬA CHỮA & LẬP BÁO GIÁ CHO KHÁCH DUYỆT
          ======================================================== */}
      {showCreateRepairModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }} onClick={() => setShowCreateRepairModal(null)}>
          <form onSubmit={handleSaveRepairOrder} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={22} color="#2563eb" />
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    3. Đề xuất sửa chữa & Lập báo giá phụ tùng
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Theo Biên bản: {showCreateRepairModal.code} • Xe: {showCreateRepairModal.vehicleName} ({showCreateRepairModal.licensePlate})
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreateRepairModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Phương án sửa chữa đề xuất</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thay cụm đèn pha LED chính hãng, hàn pát nhựa và sơn sấy yếm trước..."
                  value={repSolutionText}
                  onChange={e => setRepSolutionText(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Tích chọn phụ tùng từ kho */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Lựa chọn phụ tùng thay thế từ kho chính hãng:
                </label>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px' }}>
                  {PARTS_CATALOG.map(p => {
                    const isSelected = repSelectedParts.some(x => x.partId === p.id);
                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', background: isSelected ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f1f5f9' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setRepSelectedParts(repSelectedParts.filter(x => x.partId !== p.id));
                              } else {
                                setRepSelectedParts([...repSelectedParts, { partId: p.id, quantity: 1 }]);
                              }
                            }}
                          />
                          <div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({p.code})</span>
                          </div>
                        </label>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                          {p.unitPrice.toLocaleString()}đ <span style={{ fontSize: '10.5px', color: '#64748b' }}>(+công {p.laborFee.toLocaleString()}đ)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bảng tính tổng tiền báo giá */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', marginBottom: '4px' }}>
                  <span>Tiền phụ tùng:</span>
                  <span style={{ fontWeight: 700 }}>{modalQuoteCalc.partsPrice.toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#64748b', marginBottom: '6px' }}>
                  <span>Tiền công kỹ thuật:</span>
                  <span style={{ fontWeight: 700 }}>{modalQuoteCalc.laborPrice.toLocaleString()}đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <span>TỔNG CHI PHÍ BÁO GIÁ:</span>
                  <span style={{ color: '#2563eb' }}>{modalQuoteCalc.grandTotal.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreateRepairModal(null)} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}>
                Lập báo giá & Gửi khách hàng xác nhận &rarr;
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 4: NGHIỆM THU & CẬP NHẬT KẾT QUẢ SỬA CHỮA (BƯỚC 6)
          ======================================================== */}
      {showCompleteRepairModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }} onClick={() => setShowCompleteRepairModal(null)}>
          <form onSubmit={handleCompleteRepairOrder} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} color="#16a34a" />
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  6. Cập nhật kết quả sửa chữa & Nghiệm thu xe
                </h3>
              </div>
              <button type="button" onClick={() => setShowCompleteRepairModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px' }}>
                <div><strong>Mã phiếu:</strong> {showCompleteRepairModal.code} • <strong>Xe:</strong> {showCompleteRepairModal.vehicleName} ({showCompleteRepairModal.licensePlate})</div>
                <div><strong>Khách hàng:</strong> {showCompleteRepairModal.customerName} ({showCompleteRepairModal.customerPhone})</div>
              </div>

              {/* Chụp ảnh phụ tùng mới & Ảnh vị trí xe sau khi sửa */}
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                  Ảnh minh chứng sau khi hoàn thành sửa chữa (Bắt buộc đối chứng):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '2px' }}>1. Ảnh phụ tùng mới đã lắp:</span>
                    <img src={compPartPhoto} alt="New Part" style={{ width: '100%', height: '110px', borderRadius: '6px', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#475569', display: 'block', marginBottom: '2px' }}>2. Ảnh vị trí xe sau khi hoàn tất:</span>
                    <img src={compAfterPhoto} alt="After Repaired" style={{ width: '100%', height: '110px', borderRadius: '6px', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Chi phí thực tế phát sinh (đ)</label>
                <input
                  type="number"
                  value={compActualCost}
                  onChange={e => setCompActualCost(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Ghi chú nghiệm thu & Đánh giá an toàn</label>
                <textarea
                  rows={2}
                  value={compNotes}
                  onChange={e => setCompNotes(e.target.value)}
                  placeholder="Xe đã nổ máy êm, phanh nhạy, không rò rỉ, sẵn sàng tiếp tục cho thuê..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCompleteRepairModal(null)} style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 20px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}>
                Xác nhận hoàn thành & Nghiệm thu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 5: PHÓNG TO SO SÁNH ĐỐI CHỨNG ẢNH TRƯỚC & SAU
          ======================================================== */}
      {showPhotoCompareModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 130, padding: '20px' }} onClick={() => setShowPhotoCompareModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '860px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>{showPhotoCompareModal.title}</h3>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>{showPhotoCompareModal.subtitle}</div>
              </div>
              <button type="button" onClick={() => setShowPhotoCompareModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* TRƯỚC */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #cbd5e1' }}>
                <div style={{ background: '#1e293b', color: '#ffffff', padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
                  📸 ẢNH TRƯỚC (HIỆN TRẠNG / LÚC BÀN GIAO)
                </div>
                <img src={showPhotoCompareModal.beforeImgs[0] || SAMPLE_PHOTOS.cleanFront} alt="Before" style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
              </div>

              {/* SAU */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #86efac' }}>
                <div style={{ background: '#16a34a', color: '#ffffff', padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
                  ✓ ẢNH SAU (KHI TRẢ XE / SAU KHI SỬA HOÀN TẤT)
                </div>
                <img src={showPhotoCompareModal.afterImgs[0] || SAMPLE_PHOTOS.repairedPerfect} alt="After" style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
              </div>
            </div>

            {showPhotoCompareModal.notes && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                <strong>Ghi chú đối chứng:</strong> "{showPhotoCompareModal.notes}"
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPhotoCompareModal(null)} style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Đóng đối chứng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: CHI TIẾT KIỂM TRA XE KHI TRẢ
          ======================================================== */}
      {selectedInspectionForDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }} onClick={() => setSelectedInspectionForDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Chi tiết phiếu kiểm tra đơn #{selectedInspectionForDetail.bookingCode}
              </h3>
              <button type="button" onClick={() => setSelectedInspectionForDetail(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '14px' }}>
              <div><strong>Xe:</strong> {selectedInspectionForDetail.vehicleName} (<span style={{ color: '#2563eb' }}>{selectedInspectionForDetail.licensePlate}</span>)</div>
              <div><strong>Khách hàng:</strong> {selectedInspectionForDetail.customerName} ({selectedInspectionForDetail.customerPhone})</div>
              <div><strong>Số km Odo:</strong> Giao {selectedInspectionForDetail.deliveryOdometer.toLocaleString()} km &rarr; Trả {selectedInspectionForDetail.returnOdometer.toLocaleString()} km</div>
            </div>

            {/* Ảnh đối chiếu */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img src={selectedInspectionForDetail.deliveryImages[0] || SAMPLE_PHOTOS.cleanFront} alt="Delivery" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <div style={{ padding: '4px', background: '#1e293b', color: '#fff', fontSize: '11px', textAlign: 'center', fontWeight: 700 }}>Ảnh lúc giao xe</div>
              </div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <img src={selectedInspectionForDetail.returnImages[0] || SAMPLE_PHOTOS.damageScratched} alt="Return" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                <div style={{ padding: '4px', background: selectedInspectionForDetail.status === 'damaged' ? '#dc2626' : '#16a34a', color: '#fff', fontSize: '11px', textAlign: 'center', fontWeight: 700 }}>
                  {selectedInspectionForDetail.status === 'damaged' ? 'Ảnh lúc nhận xe trả (Hư hại)' : 'Ảnh lúc nhận xe trả (Đạt)'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '16px' }}>
              <strong>Ghi chú kiểm tra:</strong> "{selectedInspectionForDetail.notes}"
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {selectedInspectionForDetail.status === 'damaged' && !selectedInspectionForDetail.hasDamageReport && (
                <button
                  type="button"
                  onClick={() => {
                    const ins = selectedInspectionForDetail;
                    setSelectedInspectionForDetail(null);
                    setShowCreateDamageReportModal(ins);
                  }}
                  style={{ padding: '8px 16px', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Lập biên bản hư hỏng
                </button>
              )}
              <button type="button" onClick={() => setSelectedInspectionForDetail(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
