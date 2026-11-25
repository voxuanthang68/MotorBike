'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  LayoutGrid,
  Bike,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Package,
  CalendarClock,
  History,
  BarChart2,
  Bell,
  UserCircle,
  Users,
  Search,
  RefreshCw,
  LogOut,
  Menu,
  X,
  Plus,
  Eye,
  Camera,
  FileText,
  FileWarning,
  Printer,
  Download,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight,
  Gauge,
  Check,
  Star,
  Calendar
} from 'lucide-react';
import ReturnInspectionWorkspace from './ReturnInspectionWorkspace';
import RepairManagementWorkspace from './RepairManagementWorkspace';
import UserManagementWorkspace from './UserManagementWorkspace';
import {
  MonthlyWorkBarChart,
  VehicleStatusDonutChart,
  CostTrendLineChart,
  MonthlyChartDatum
} from './TechnicianCharts';
import {
  ReturnInspectionItem,
  DamagePosition,
  DamageReportItem,
  RepairPartLine,
  RepairItem,
  PartItem,
  SAMPLE_PHOTOS,
  createDefaultChecklist
} from './types';

// ==========================================
// 1. LOCAL INTERFACES & CONSTANTS
// ==========================================
export interface VehicleItem {
  _id: string;
  code?: string;
  name: string;
  licensePlate: string;
  brand: string;
  model?: string;
  type: string;
  color?: string;
  status: 'available' | 'rented' | 'maintenance' | 'repairing' | 'broken' | 'retired' | 'reserved';
  image?: string;
  gallery?: string[];
  year?: number;
  engineCC?: number;
  odometer?: number;
  condition?: string;
  techNote?: string;
  location?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  nextMaintenanceOdo?: number;
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
  notes?: string;
  nextMaintenanceDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description?: string;
  time: string;
  unread: boolean;
  type: 'inspection' | 'damage' | 'repair' | 'maintenance' | 'system';
  targetTab?: TabId;
}

type TabId =
  | 'home'
  | 'vehicles'
  | 'return_inspection'
  | 'damage_management'
  | 'repair_management'
  | 'parts_management'
  | 'maintenance'
  | 'history'
  | 'reports'
  | 'notifications'
  | 'profile'
  | 'user_management';

const INITIAL_PARTS_CATALOG: PartItem[] = [
  { id: 'p1', code: 'PT-OIL-01', name: 'Dầu nhớt Motul Scooter Expert LE 10W40 (0.8L)', category: 'Dầu nhớt', unitPrice: 120000, laborFee: 20000, warranty: '1.500 km', stock: 45, compatible: 'Xe ga (Vision, AirBlade, SH, Lead)' },
  { id: 'p2', code: 'PT-OIL-02', name: 'Dầu nhớt Castrol Power1 4T 10W40 (1.0L)', category: 'Dầu nhớt', unitPrice: 135000, laborFee: 20000, warranty: '1.500 km', stock: 32, compatible: 'Xe số & Côn tay (Wave, Exciter, Winner)' },
  { id: 'p3', code: 'PT-BRK-01', name: 'Má phanh đĩa trước Nissin chính hãng Honda', category: 'Hệ thống phanh', unitPrice: 180000, laborFee: 30000, warranty: '6 tháng', stock: 24, compatible: 'AirBlade, Vision, Lead, SH' },
  { id: 'p4', code: 'PT-BRK-02', name: 'Bộ má phanh đùm/cơ sau Honda OEM', category: 'Hệ thống phanh', unitPrice: 110000, laborFee: 30000, warranty: '6 tháng', stock: 28, compatible: 'Wave Alpha, Future, Blade, Vision' },
  { id: 'p5', code: 'PT-TIR-01', name: 'Lốp không săm Michelin City Extra (Trước 80/90-14)', category: 'Lốp & Bánh xe', unitPrice: 460000, laborFee: 40000, warranty: '12 tháng', stock: 15, compatible: 'Vision, Air Blade, Vario' },
  { id: 'p6', code: 'PT-TIR-02', name: 'Lốp không săm Michelin City Extra (Sau 90/90-14)', category: 'Lốp & Bánh xe', unitPrice: 520000, laborFee: 40000, warranty: '12 tháng', stock: 6, compatible: 'Vision, Air Blade, Vario' },
  { id: 'p7', code: 'PT-BAT-01', name: 'Bình ắc quy khô GS GTZ5S (12V-3.5Ah)', category: 'Hệ thống điện', unitPrice: 380000, laborFee: 20000, warranty: '9 tháng', stock: 20, compatible: 'Xe ga & Xe số phổ thông' },
  { id: 'p8', code: 'PT-SPK-01', name: 'Bugi chân dài NGK Iridium CPR8EAIX-9', category: 'Động cơ & Đánh lửa', unitPrice: 95000, laborFee: 15000, warranty: '15.000 km', stock: 35, compatible: 'PGM-FI Fi Phun xăng điện tử' },
  { id: 'p9', code: 'PT-BEL-01', name: 'Dây Curoa truyền động Bando Honda chính hãng', category: 'Truyền động', unitPrice: 280000, laborFee: 50000, warranty: '12 tháng (15.000 km)', stock: 14, compatible: 'Air Blade 125/160, Lead 125, SH' },
  { id: 'p10', code: 'PT-CHN-01', name: 'Nhông sên dĩa phốt cao su O-Ring DID 428HD', category: 'Truyền động', unitPrice: 380000, laborFee: 45000, warranty: '12 tháng', stock: 9, compatible: 'Exciter 155, Winner X, Raider 150' },
  { id: 'p11', code: 'PT-MIR-01', name: 'Gương chiếu hậu nguyên bản Honda (Cặp)', category: 'Dàn ngoài', unitPrice: 150000, laborFee: 15000, warranty: '6 tháng', stock: 25, compatible: 'Các dòng xe Honda' },
  { id: 'p12', code: 'PT-BDY-01', name: 'Ốp yếm trước dàn áo chính hãng Honda', category: 'Dàn áo & Nhựa', unitPrice: 780000, laborFee: 80000, warranty: '12 tháng', stock: 4, compatible: 'Air Blade, Vision, Winner X' },
  { id: 'p13', code: 'PT-LGT-01', name: 'Cụm chóa đèn pha LED 2 tầng siêu sáng', category: 'Hệ thống đèn', unitPrice: 550000, laborFee: 50000, warranty: '12 tháng', stock: 7, compatible: 'Exciter, Winner X, Air Blade' }
];

const FALLBACK_VEHICLES: VehicleItem[] = [
  {
    _id: 'v-1',
    code: 'MR-DN-001',
    name: 'Honda Air Blade 160 ABS',
    brand: 'Honda',
    color: 'Xám đen nhám',
    licensePlate: '43C1-892.45',
    type: 'Xe tay ga',
    year: 2024,
    engineCC: 160,
    odometer: 14820,
    nextMaintenanceOdo: 16820,
    status: 'broken',
    lastMaintenanceDate: '2026-11-25',
    techNote: 'Khách vừa trả tại quầy Bạch Đằng, phản ánh phanh trước hơi kêu.',
    image: SAMPLE_PHOTOS.cleanFront,
    gallery: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.newPartInstalled]
  },
  {
    _id: 'v-2',
    code: 'MR-DN-002',
    name: 'Honda Winner X 150 ABS',
    brand: 'Honda',
    color: 'Đỏ đen thể thao',
    licensePlate: '43D1-654.12',
    type: 'Xe côn tay',
    year: 2024,
    engineCC: 150,
    odometer: 19340,
    nextMaintenanceOdo: 21000,
    status: 'repairing',
    lastMaintenanceDate: '2026-10-05',
    techNote: 'Đang thay cánh yếm trước phải và má phanh đĩa theo phiếu PSC-2026-014.',
    image: SAMPLE_PHOTOS.cleanRear,
    gallery: [SAMPLE_PHOTOS.cleanRear, SAMPLE_PHOTOS.damageScratched]
  },
  {
    _id: 'v-3',
    code: 'MR-DN-003',
    name: 'Honda ADV 160 ABS Touring',
    brand: 'Honda',
    color: 'Xanh đậm nhám',
    licensePlate: '43A1-045.88',
    type: 'Xe tay ga',
    year: 2025,
    engineCC: 160,
    odometer: 9650,
    nextMaintenanceOdo: 12000,
    status: 'available',
    lastMaintenanceDate: '2026-10-28',
    techNote: 'Đã nghiệm thu hoàn tất, xe sạch đẹp đạt chuẩn giao khách.',
    image: SAMPLE_PHOTOS.adventureSide,
    gallery: [SAMPLE_PHOTOS.adventureSide, SAMPLE_PHOTOS.repairedPerfect]
  },
  {
    _id: 'v-4',
    code: 'MR-DN-004',
    name: 'Yamaha NVX 155 VVA',
    brand: 'Yamaha',
    color: 'Xám titan',
    licensePlate: '43E1-712.09',
    type: 'Xe tay ga',
    year: 2024,
    engineCC: 155,
    odometer: 21800,
    nextMaintenanceOdo: 23500,
    status: 'available',
    lastMaintenanceDate: '2026-11-25',
    techNote: 'Vừa thay nhớt Motul và kiểm tra áp suất lốp đạt chuẩn.',
    image: SAMPLE_PHOTOS.cleanFront,
    gallery: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.cleanRear]
  },
  {
    _id: 'v-5',
    code: 'MR-DN-005',
    name: 'Yamaha Exciter 155 VVA',
    brand: 'Yamaha',
    color: 'Đỏ đen GP',
    licensePlate: '43C1-530.77',
    type: 'Xe côn tay',
    year: 2024,
    engineCC: 155,
    odometer: 11420,
    nextMaintenanceOdo: 13500,
    status: 'available',
    lastMaintenanceDate: '2026-11-15',
    techNote: 'Nhông sên dĩa vừa cân chỉnh êm ái.',
    image: SAMPLE_PHOTOS.cleanRear,
    gallery: [SAMPLE_PHOTOS.cleanRear, SAMPLE_PHOTOS.newPartInstalled]
  },
  {
    _id: 'v-6',
    code: 'MR-DN-006',
    name: 'Honda CB150X Adventure',
    brand: 'Honda',
    color: 'Xanh quân đội',
    licensePlate: '43A1-118.62',
    type: 'Moto PKL',
    year: 2024,
    engineCC: 150,
    odometer: 16210,
    nextMaintenanceOdo: 18000,
    status: 'broken',
    lastMaintenanceDate: '2026-11-25',
    techNote: 'Khách vừa trả xe (KT-2026-042), cần kiểm tra lốp sau non hơi và lỏng chân gương phải.',
    image: SAMPLE_PHOTOS.adventureSide,
    gallery: [SAMPLE_PHOTOS.adventureSide, SAMPLE_PHOTOS.cleanFront]
  },
  {
    _id: 'v-7',
    code: 'MR-DN-007',
    name: 'Honda Vision 2026 Smartkey',
    brand: 'Honda',
    color: 'Trắng ngọc trai',
    licensePlate: '43E1-737.37',
    type: 'Xe tay ga',
    year: 2026,
    engineCC: 110,
    odometer: 12540,
    nextMaintenanceOdo: 14500,
    status: 'rented',
    lastMaintenanceDate: '2026-11-05',
    techNote: 'Xe đang được kiểm tra tổng thể sau khi hoàn tất bảo dưỡng.',
    image: SAMPLE_PHOTOS.cleanFront,
    gallery: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.repairedPerfect]
  },
  {
    _id: 'v-8',
    code: 'MR-DN-008',
    name: 'Honda Wave RSX 110 FI',
    brand: 'Honda',
    color: 'Đỏ đen',
    licensePlate: '43D1-409.33',
    type: 'Xe số',
    year: 2024,
    engineCC: 110,
    odometer: 27400,
    nextMaintenanceOdo: 29000,
    status: 'maintenance',
    lastMaintenanceDate: '2026-11-20',
    techNote: 'Chờ thay nhớt định kỳ và kiểm tra thắng đùm.',
    image: SAMPLE_PHOTOS.cleanRear,
    gallery: [SAMPLE_PHOTOS.cleanRear, SAMPLE_PHOTOS.cleanFront]
  }
];

const FALLBACK_MAINTENANCES: MaintenanceRecord[] = [
  { _id: 'm-1', vehicle: { _id: 'v-2', name: 'Honda CB150X Adventure', licensePlate: '43A1-118.62' }, technician: { fullName: 'Nguyễn Minh Quân' }, type: 'Định kỳ 5.000 km', title: 'Bảo dưỡng định kỳ 5.000 km (Thay nhớt + Lọc gió)', status: 'in_progress', scheduledDate: '2026-11-25', odometerAtMaintenance: 16210, cost: 350000, notes: 'Kiểm tra thêm xích tải và áp suất lốp.' },
  { _id: 'm-2', vehicle: { _id: 'v-1', name: 'Honda Air Blade 160 ABS', licensePlate: '43C1-892.45' }, technician: { fullName: 'Trần Đình Huy' }, type: 'Thay nhớt & Kiểm tra phanh', title: 'Kiểm tra tổng quát trước cao điểm cuối tuần', status: 'scheduled', scheduledDate: '2026-11-26', odometerAtMaintenance: 14820, cost: 220000, notes: 'Kiểm tra má phanh ABS trước sau.' },
  { _id: 'm-3', vehicle: { _id: 'v-4', name: 'Honda Vision 2026 Smartkey', licensePlate: '43E1-737.37' }, technician: { fullName: 'Lê Minh Tuấn' }, type: 'Bảo dưỡng định kỳ 3.000 km', title: 'Vệ sinh nồi côn & Thay dầu hộp số', status: 'scheduled', scheduledDate: '2026-11-27', odometerAtMaintenance: 12540, cost: 280000, notes: 'Xe đang chuẩn bị cho đơn thuê dài ngày.' },
  { _id: 'm-4', vehicle: { _id: 'v-5', name: 'Honda ADV 160 ABS Touring', licensePlate: '43A1-045.88' }, technician: { fullName: 'Nguyễn Minh Quân' }, type: 'Kiểm tra sau sửa chữa', title: 'Bảo dưỡng tổng thể & Thay nhớt Motul', status: 'completed', scheduledDate: '2026-11-24', completedDate: '2026-11-24', odometerAtMaintenance: 11200, cost: 320000, notes: 'Xe vận hành mượt mà, đạt chuẩn bàn giao.' }
];

const CHART_DATA_6M: MonthlyChartDatum[] = [
  { label: '06/26', inspections: 18, maintenance: 9, repairs: 4, cost: 4200000 },
  { label: '07/26', inspections: 22, maintenance: 11, repairs: 6, cost: 5800000 },
  { label: '08/26', inspections: 26, maintenance: 12, repairs: 5, cost: 5100000 },
  { label: '09/26', inspections: 20, maintenance: 10, repairs: 4, cost: 4600000 },
  { label: '10/26', inspections: 29, maintenance: 14, repairs: 7, cost: 7200000 },
  { label: '11/26', inspections: 24, maintenance: 12, repairs: 5, cost: 5010000 }
];

// ==========================================
// 2. MAIN TECHNICIAN PORTAL PAGE
// ==========================================
export default function TechnicianPortalPage() {
  const router = useRouter();
  const { user, logout, initialize } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Core States
  const [vehicles, setVehicles] = useState<VehicleItem[]>(FALLBACK_VEHICLES);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>(FALLBACK_MAINTENANCES);
  const [partsCatalog, setPartsCatalog] = useState<PartItem[]>(INITIAL_PARTS_CATALOG);
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [selectedRealBookingId, setSelectedRealBookingId] = useState('');
  const [activeInspectionId, setActiveInspectionId] = useState('ins-042');
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  // Filter States for various tabs
  const [vehLocalSearch, setVehLocalSearch] = useState('');
  const [vehStatusFilter, setVehStatusFilter] = useState<string>('all');
  const [vehTypeFilter, setVehTypeFilter] = useState<string>('all');
  const [vehPage, setVehPage] = useState(1);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<VehicleItem | null>(null);

  const [dmgFilter, setDmgFilter] = useState<'all' | 'confirmed' | 'repair_proposed'>('all');

  const [partCatFilter, setPartCatFilter] = useState<string>('all');
  const [partViewMode, setPartViewMode] = useState<'table' | 'grid'>('table');
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartCategory, setNewPartCategory] = useState('Động cơ & Đánh lửa');
  const [newPartPrice, setNewPartPrice] = useState(150000);
  const [newPartLabor, setNewPartLabor] = useState(30000);
  const [newPartStock, setNewPartStock] = useState(10);

  const [maintStatusFilter, setMaintStatusFilter] = useState<string>('all');
  const [selectedMaintDetail, setSelectedMaintDetail] = useState<MaintenanceRecord | null>(null);
  const [showNewMaintModal, setShowNewMaintModal] = useState(false);
  const [newMaintVehId, setNewMaintVehId] = useState('');
  const [newMaintTitle, setNewMaintTitle] = useState('Bảo dưỡng định kỳ 5.000 km');
  const [newMaintDate, setNewMaintDate] = useState('2026-11-28');
  const [newMaintCost, setNewMaintCost] = useState(250000);
  const [newMaintNotes, setNewMaintNotes] = useState('');

  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'inspection' | 'damage' | 'repair' | 'maintenance'>('all');
  const [historyVehicleFilter, setHistoryVehicleFilter] = useState<string>('all');
  const [reportPeriod, setReportPeriod] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Return Inspections
  const [returnInspections, setReturnInspections] = useState<ReturnInspectionItem[]>([
    {
      id: 'ins-041',
      inspectionCode: 'KT-2026-041',
      bookingId: 'bk-315',
      bookingCode: 'HD-DN-2026-315',
      customerName: 'Trần Quốc Khánh',
      customerPhone: '0905 412 889',
      customerIdCard: '048096005678',
      vehicleId: 'v-1',
      vehicleName: 'Honda Air Blade 160 ABS',
      licensePlate: '43C1-892.45',
      vehicleImage: SAMPLE_PHOTOS.cleanFront,
      rentalStartDate: '2026-11-22 09:00',
      rentalEndDate: '2026-11-25 09:00',
      returnDate: '2026-11-25 08:50',
      deliveryOdometer: 14680,
      returnOdometer: 14820,
      fuelLevel: 95,
      deliveryImages: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.cleanRear],
      returnImages: [SAMPLE_PHOTOS.cleanRear],
      checklist: createDefaultChecklist(),
      pins: [],
      brakes: true,
      tires: true,
      lightsAndHorn: true,
      engine: true,
      mirrorsAndBody: true,
      status: 'passed',
      notes: 'Xe nguyên vẹn, đầy đủ xăng, không trầy xước, bàn giao hoàn tất.',
      inspectorName: 'Nguyễn Minh Quân',
      hasDamageReport: false
    },
    {
      id: 'ins-042',
      inspectionCode: 'KT-2026-042',
      bookingId: 'bk-318',
      bookingCode: 'HD-DN-2026-318',
      customerName: 'Lê Thảo Nguyên',
      customerPhone: '0983 511 042',
      customerIdCard: '048198004321',
      vehicleId: 'v-2',
      vehicleName: 'Honda CB150X Adventure',
      licensePlate: '43A1-118.62',
      vehicleImage: SAMPLE_PHOTOS.adventureSide,
      rentalStartDate: '2026-11-23 08:00',
      rentalEndDate: '2026-11-25 12:00',
      returnDate: '2026-11-25 11:05',
      deliveryOdometer: 15890,
      returnOdometer: 16210,
      fuelLevel: 90,
      deliveryImages: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.cleanRear],
      returnImages: [SAMPLE_PHOTOS.adventureSide],
      checklist: createDefaultChecklist({
        tires: {
          status: 'check',
          damageLocation: 'Lốp sau hơi non',
          damageSeverity: 'medium',
          note: 'Lốp sau hơi non, cần kiểm tra có dính đinh không.'
        },
        mirrors: {
          status: 'check',
          damageLocation: 'Chân gương chiếu hậu phải',
          damageSeverity: 'medium',
          note: 'Chân gương phải lỏng ốc, cần siết lại hoặc thay gioăng.'
        }
      }),
      pins: [
        {
          id: 'pin-init-1',
          x: 52,
          y: 66,
          label: 'Lốp hơi non, vết trầy yếm phải',
          severity: 'medium'
        }
      ],
      brakes: true,
      tires: false,
      lightsAndHorn: true,
      engine: true,
      mirrorsAndBody: false,
      status: 'draft',
      notes: 'Khách báo xe chạy đèo Hải Vân ổn, lốp sau hơi non và chân gương phải lỏng nhẹ.',
      inspectorName: 'Nguyễn Minh Quân',
      hasDamageReport: false
    },
    {
      id: 'ins-01',
      inspectionCode: 'KT-2026-040',
      bookingId: 'bk-101',
      bookingCode: 'DH-202611-028',
      customerName: 'Trần Văn Hoàng',
      customerPhone: '0912 345 678',
      customerIdCard: '048096001234',
      vehicleId: 'v-4',
      vehicleName: 'Honda Vision 2026 Smartkey',
      licensePlate: '43E1-737.37',
      vehicleImage: SAMPLE_PHOTOS.cleanFront,
      rentalStartDate: '2026-11-22 09:00',
      rentalEndDate: '2026-11-25 12:00',
      returnDate: '2026-11-25 11:30',
      deliveryOdometer: 12200,
      returnOdometer: 12540,
      fuelLevel: 75,
      deliveryImages: [SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.cleanRear],
      returnImages: [SAMPLE_PHOTOS.damageScratched, SAMPLE_PHOTOS.damageBrokenLight],
      checklist: createDefaultChecklist({
        lights: {
          status: 'damage',
          damageLocation: 'Cụm đèn pha LED trước',
          damageSeverity: 'high',
          note: 'Nứt chân bắt chóa đèn và vỡ nhẹ viền mica góc trái',
          photos: [SAMPLE_PHOTOS.damageBrokenLight]
        },
        body: {
          status: 'damage',
          damageLocation: 'Dàn áo yếm trước bên phải',
          damageSeverity: 'medium',
          note: 'Trầy xước sâu 15cm, tróc sơn lót do cọ xát với tường đá',
          photos: [SAMPLE_PHOTOS.damageScratched]
        }
      }),
      pins: [
        { id: 'pin-vis-1', x: 38, y: 42, label: 'Nứt chóa đèn pha LED', severity: 'high' },
        { id: 'pin-vis-2', x: 64, y: 58, label: 'Trầy xước yếm phải 15cm', severity: 'medium' }
      ],
      brakes: true,
      tires: true,
      lightsAndHorn: false,
      engine: true,
      mirrorsAndBody: false,
      status: 'damaged',
      notes: 'Khách bị va quẹt nhẹ: Trầy xước dàn áo yếm phải và nứt viền chóa đèn pha.',
      inspectorName: 'Nguyễn Minh Quân',
      hasDamageReport: true,
      damageReportId: 'dmg-01'
    }
  ]);

  // Damage Reports
  const [damageReports, setDamageReports] = useState<DamageReportItem[]>([
    {
      id: 'dmg-01',
      code: 'BBHH-2026-023',
      inspectionId: 'ins-042',
      bookingCode: 'HD-DN-2026-318',
      customerName: 'Lê Thảo Nguyên',
      customerPhone: '0983 511 042',
      vehicleId: 'v-2',
      vehicleName: 'Honda CB150X Adventure',
      licensePlate: '43A1-118.62',
      reportedAt: '2026-11-25 16:45',
      inspectorName: 'Nguyễn Minh Quân',
      positions: [
        {
          id: 'pos-1',
          position: 'Lốp sau & Vành xe',
          severity: 'medium',
          description: 'Lốp hơi non hơi nghi dính đinh nhỏ, cần kiểm tra vá ép nhiệt hoặc thay van',
          photo: SAMPLE_PHOTOS.adventureSide,
          suggestedAction: 'repair',
          suggestedPartName: 'Kiểm tra lốp & bơm chuẩn 2.25 kg'
        },
        {
          id: 'pos-2',
          position: 'Chân gương chiếu hậu phải',
          severity: 'medium',
          description: 'Lỏng chân ren bắt gương và xước nhẹ mặt vỏ gương',
          photo: SAMPLE_PHOTOS.damageScratched,
          suggestedAction: 'replace',
          suggestedPartName: 'Gương chiếu hậu nguyên bản Honda'
        }
      ],
      overallSeverity: 'medium',
      notes: 'Khách hàng xác nhận kiểm tra cùng KTV, đồng ý lập phương án xử lý.',
      status: 'repair_proposed',
      repairId: 'rep-020',
      customerAgreedSignature: true
    },
    {
      id: 'dmg-02',
      code: 'BBHH-2026-022',
      inspectionId: 'ins-01',
      bookingCode: 'DH-202611-028',
      customerName: 'Trần Văn Hoàng',
      customerPhone: '0912 345 678',
      vehicleId: 'v-4',
      vehicleName: 'Honda Vision 2026 Smartkey',
      licensePlate: '43E1-737.37',
      reportedAt: '2026-11-25 11:45',
      inspectorName: 'Nguyễn Minh Quân',
      positions: [
        {
          id: 'pos-21',
          position: 'Dàn áo yếm trước bên phải',
          severity: 'medium',
          description: 'Trầy xước sâu 15cm, tróc sơn lót do cọ xát với tường đá',
          photo: SAMPLE_PHOTOS.damageScratched,
          suggestedAction: 'repair',
          suggestedPartName: 'Sơn dặm & đánh bóng dàn áo'
        },
        {
          id: 'pos-22',
          position: 'Cụm đèn pha LED trước',
          severity: 'high',
          description: 'Nứt chân bắt chóa đèn và vỡ nhẹ viền mica góc trái',
          photo: SAMPLE_PHOTOS.damageBrokenLight,
          suggestedAction: 'replace',
          suggestedPartName: 'Cụm chóa đèn pha LED 2 tầng siêu sáng'
        }
      ],
      overallSeverity: 'high',
      notes: 'Khách đã ký biên bản hiện trạng khi trả xe.',
      status: 'confirmed',
      customerAgreedSignature: true
    }
  ]);

  // Repair Orders
  const [repairs, setRepairs] = useState<RepairItem[]>([
    {
      id: 'rep-020',
      code: 'PSC-2026-020',
      damageReportId: 'dmg-01',
      damageReportCode: 'BBHH-2026-023',
      bookingCode: 'HD-DN-2026-318',
      vehicleId: 'v-2',
      vehicleCode: 'MR-DN-002',
      vehicleName: 'Honda CB150X Adventure',
      licensePlate: '43A1-118.62',
      vehicleOdo: 16210,
      vehicleType: 'Xe côn tay',
      vehicleColor: 'Đen nhám',
      vehicleImage: SAMPLE_PHOTOS.adventureSide,
      customerName: 'Lê Thảo Nguyên',
      customerPhone: '0983 511 042',
      issueSummary: 'Kiểm tra lốp xe hơi non và chân gương phải lỏng ốc',
      proposedSolution: 'Khắc phục các hạng mục theo BBHH-2026-023: Kiểm tra lốp xe, Kiểm tra đèn & gương',
      parts: [
        {
          partId: 'p11',
          partCode: 'PT-MIR-01',
          name: 'Gương chiếu hậu nguyên bản Honda (Cặp)',
          actionMethod: 'Thay mới chính hãng',
          quantity: 1,
          unitPrice: 780000,
          laborFee: 150000,
          total: 780000,
          isActualUsed: false
        }
      ],
      totalPartsPrice: 780000,
      totalLaborFee: 150000,
      totalEstimatedCost: 930000,
      status: 'customer_approved',
      progressPercent: 40,
      customerFeedbackDate: '2026-11-25 17:02',
      customerFeedbackNote: 'Khách hàng đã xác nhận đồng ý phương án và chi phí báo giá.',
      technicianName: 'Nguyễn Minh Quân',
      damageItems: [
        {
          id: 'di-020-1',
          title: 'Kiểm tra lốp & chân gương',
          severity: 'medium',
          actionLabel: 'Sửa chữa / thay thế',
          location: 'Lốp sau & Chân gương phải',
          description: 'Khắc phục các hạng mục theo BBHH-2026-023: vá/bơm lốp chuẩn áp suất và thay chân gương.',
          beforePhotos: [SAMPLE_PHOTOS.adventureSide],
          newPartPhotos: [],
          afterPhotos: []
        }
      ],
      beforePhotos: [SAMPLE_PHOTOS.adventureSide],
      afterPhotos: [],
      replacementPhotos: [],
      createdAt: '2026-11-25 16:59',
      updatedAt: '2026-11-25 17:02'
    },
    {
      id: 'rep-014',
      code: 'PSC-2026-014',
      bookingCode: 'HD-DN-2026-278',
      vehicleId: 'v-3',
      vehicleCode: 'MR-DN-003',
      vehicleName: 'Honda Winner X 150 ABS',
      licensePlate: '43D1-654.12',
      vehicleOdo: 18400,
      vehicleType: 'Xe côn tay',
      vehicleColor: 'Đỏ đen',
      vehicleImage: SAMPLE_PHOTOS.cleanRear,
      customerName: 'Đặng Tuấn Anh',
      customerPhone: '0935 777 666',
      issueSummary: 'Vỡ cánh yếm trước phải, cong tay phanh và mòn má phanh',
      proposedSolution: 'Thay mới cánh yếm trước phải chính hãng, thay tay phanh nhôm và cặp má phanh đĩa',
      parts: [
        { partId: 'p12', partCode: 'PT-BDY-01', name: 'Cánh yếm trước phải chính hãng', actionMethod: 'Thay mới chính hãng', quantity: 1, unitPrice: 780000, laborFee: 80000, total: 780000, isActualUsed: true },
        { partId: 'p3', partCode: 'PT-BRK-01', name: 'Má phanh đĩa trước Nissin', actionMethod: 'Thay mới chính hãng', quantity: 1, unitPrice: 320000, laborFee: 50000, total: 320000, isActualUsed: true },
        { partId: 'p11', partCode: 'PT-LV-01', name: 'Tay phanh nhôm CNC', actionMethod: 'Thay mới', quantity: 1, unitPrice: 180000, laborFee: 20000, total: 180000, isActualUsed: true }
      ],
      totalPartsPrice: 1280000,
      totalLaborFee: 150000,
      totalEstimatedCost: 1430000,
      actualCost: 1430000,
      status: 'in_progress',
      progressPercent: 70,
      customerFeedbackDate: '2026-11-22 16:30',
      customerFeedbackNote: 'Khách đã duyệt báo giá qua điện thoại và đồng ý cấn trừ cọc.',
      technicianName: 'Nguyễn Minh Quân',
      damageItems: [
        {
          id: 'di-014-1',
          title: 'Dàn áo trước phải & Tay phanh',
          severity: 'high',
          actionLabel: 'Thay mới chính hãng',
          location: 'Yếm phải & cụm phanh trước',
          description: 'Thay mới cánh yếm trước phải chính hãng, thay tay phanh nhôm và cặp má phanh đĩa.',
          beforePhotos: [SAMPLE_PHOTOS.damageScratched],
          newPartPhotos: [SAMPLE_PHOTOS.newPartInstalled],
          afterPhotos: []
        }
      ],
      beforePhotos: [SAMPLE_PHOTOS.damageScratched],
      afterPhotos: [],
      replacementPhotos: [SAMPLE_PHOTOS.newPartInstalled],
      createdAt: '2026-11-22 16:00'
    },
    {
      id: 'rep-015',
      code: 'PSC-2026-015',
      bookingCode: 'HD-DN-2026-295',
      vehicleId: 'v-5',
      vehicleCode: 'MR-DN-004',
      vehicleName: 'Honda ADV 160 ABS Touring',
      licensePlate: '43A1-045.88',
      vehicleOdo: 11200,
      vehicleType: 'Xe tay ga Touring',
      vehicleColor: 'Đen nhám',
      vehicleImage: SAMPLE_PHOTOS.adventureSide,
      customerName: 'Phạm Hoàng Minh',
      customerPhone: '0905 334 221',
      issueSummary: 'Trầy xước ốp cánh yếm trước trái, gãy tay phanh và vỡ gương',
      proposedSolution: 'Thay mới ốp cánh yếm trước trái chính hãng, thay tay phanh trái và gương chiếu hậu',
      parts: [
        { partId: 'p12', partCode: 'PT-BDY-02', name: 'Ốp cánh yếm trước trái ADV 160', actionMethod: 'Thay mới chính hãng', quantity: 1, unitPrice: 1250000, laborFee: 100000, total: 1250000, isActualUsed: true },
        { partId: 'p11', partCode: 'PT-MIR-01', name: 'Gương chiếu hậu ADV Touring', actionMethod: 'Thay mới', quantity: 1, unitPrice: 480000, laborFee: 50000, total: 480000, isActualUsed: true },
        { partId: 'p3', partCode: 'PT-LV-02', name: 'Tay phanh trái chính hãng', actionMethod: 'Thay mới', quantity: 1, unitPrice: 250000, laborFee: 50000, total: 250000, isActualUsed: true }
      ],
      totalPartsPrice: 1980000,
      totalLaborFee: 200000,
      totalEstimatedCost: 2180000,
      actualCost: 2180000,
      status: 'completed',
      progressPercent: 100,
      customerFeedbackDate: '2026-11-24 17:30',
      customerFeedbackNote: 'Khách đồng ý bồi thường đầy đủ.',
      technicianName: 'Nguyễn Minh Quân',
      beforePhotos: [SAMPLE_PHOTOS.damageScratched, SAMPLE_PHOTOS.damageBrokenLight],
      afterPhotos: [SAMPLE_PHOTOS.repairedPerfect],
      replacementPhotos: [SAMPLE_PHOTOS.newPartInstalled],
      completionNotes: 'Đã thay hoàn thiện 3 phụ tùng chính hãng và test chạy thử ổn định.',
      createdAt: '2026-11-24 17:10',
      completedAt: '2026-11-25 10:15'
    },
    {
      id: 'rep-011',
      code: 'PSC-2026-011',
      bookingCode: 'HD-DN-2026-240',
      vehicleId: 'v-6',
      vehicleCode: 'MR-DN-005',
      vehicleName: 'Yamaha Exciter 155 VVA',
      licensePlate: '43C1-530.77',
      vehicleOdo: 19600,
      vehicleType: 'Xe côn tay',
      vehicleColor: 'Xanh GP',
      vehicleImage: SAMPLE_PHOTOS.cleanRear,
      customerName: 'Võ Thị Thanh Hà',
      customerPhone: '0935 123 456',
      issueSummary: 'Gãy gương chiếu hậu phải và lệch cần số',
      proposedSolution: 'Thay mới gương chiếu hậu phải chính hãng và căn chỉnh cần số.',
      parts: [
        { partId: 'p11', partCode: 'PT-MIR-02', name: 'Gương chiếu hậu Yamaha chính hãng', actionMethod: 'Thay mới chính hãng', quantity: 1, unitPrice: 240000, laborFee: 80000, total: 240000, isActualUsed: true }
      ],
      totalPartsPrice: 240000,
      totalLaborFee: 80000,
      totalEstimatedCost: 320000,
      actualCost: 320000,
      status: 'completed',
      progressPercent: 100,
      customerFeedbackDate: '2026-11-14 15:20',
      customerFeedbackNote: 'Đồng ý sửa chữa bảo dưỡng.',
      technicianName: 'Nguyễn Minh Quân',
      beforePhotos: [SAMPLE_PHOTOS.damageScratched],
      afterPhotos: [SAMPLE_PHOTOS.repairedPerfect],
      replacementPhotos: [SAMPLE_PHOTOS.newPartInstalled],
      completionNotes: 'Đã lắp gương mới và cân chỉnh cần số mượt mà.',
      createdAt: '2026-11-14 15:00',
      completedAt: '2026-11-14 17:00'
    },
    {
      id: 'rep-013',
      code: 'PSC-2026-013',
      bookingCode: 'HD-DN-2026-261',
      vehicleId: 'v-4',
      vehicleCode: 'MR-DN-006',
      vehicleName: 'Honda Wave RSX 110 FI',
      licensePlate: '43D1-409.33',
      vehicleOdo: 27400,
      vehicleType: 'Xe số',
      vehicleColor: 'Đỏ đen',
      vehicleImage: SAMPLE_PHOTOS.cleanFront,
      customerName: 'Bùi Văn Hải',
      customerPhone: '0914 667 889',
      issueSummary: 'Trầy xước nhẹ chắn bùn trước',
      proposedSolution: 'Đề xuất sơn dặm lại mảng trầy nhỏ ở chắn bùn trước.',
      parts: [],
      totalPartsPrice: 0,
      totalLaborFee: 150000,
      totalEstimatedCost: 150000,
      status: 'customer_rejected',
      progressPercent: 0,
      customerFeedbackDate: '2026-11-20 11:45',
      customerFeedbackNote: 'Khách chọn cấn trừ trực tiếp tiền sơn 150.000đ vào cọc, không cần sửa ngay.',
      technicianName: 'Nguyễn Minh Quân',
      beforePhotos: [SAMPLE_PHOTOS.damageScratched],
      afterPhotos: [],
      replacementPhotos: [],
      createdAt: '2026-11-20 11:20'
    }
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'nt-1', title: 'Khách Lê Thảo Nguyên vừa trả xe Honda CB150X (43A1-118.62) cần kiểm tra', description: 'Phiếu KT-2026-042 đang lưu nháp, còn 2 mục cần kiểm tra thêm.', time: '15 phút trước', unread: true, type: 'inspection', targetTab: 'return_inspection' },
    { id: 'nt-2', title: 'Phiếu PSC-2026-020 đã được khách xác nhận báo giá 930.000 đ', description: 'Khách Lê Thảo Nguyên đồng ý thay gương và xử lý lốp sau.', time: '32 phút trước', unread: true, type: 'repair', targetTab: 'repair_management' },
    { id: 'nt-3', title: 'Biên bản BBHH-2026-022 (43E1-737.37) đang chờ lập báo giá sửa chữa', description: 'Hư hỏng đèn pha LED và trầy xước dàn áo yếm phải.', time: '1 giờ trước', unread: true, type: 'damage', targetTab: 'damage_management' },
    { id: 'nt-4', title: 'Xe Honda Winner X (43D1-654.12) đang thi công sửa chữa đạt 70%', description: 'Đã thay yếm trước và tay phanh, đang chờ chụp ảnh nghiệm thu.', time: '2 giờ trước', unread: true, type: 'repair', targetTab: 'repair_management' },
    { id: 'nt-5', title: 'Cảnh báo tồn kho: Ốp yếm trước Honda chỉ còn 4 cái', description: 'Nên đề xuất nhập thêm 10 cái vào kho phụ tùng.', time: '3 giờ trước', unread: true, type: 'system', targetTab: 'parts_management' },
    { id: 'nt-6', title: 'Lịch bảo dưỡng định kỳ Honda Air Blade (43C1-892.45) ngày mai', description: 'Kiểm tra tổng quát và má phanh ABS.', time: 'Hôm nay 09:30', unread: true, type: 'maintenance', targetTab: 'maintenance' },
    { id: 'nt-7', title: 'Phiếu sửa chữa PSC-2026-015 (ADV 160) đã nghiệm thu hoàn thành', description: 'Xe đã chuyển về trạng thái Sẵn sàng cho thuê.', time: 'Hôm nay 08:15', unread: true, type: 'repair', targetTab: 'history' },
    { id: 'nt-8', title: 'Nhắc nhở kiểm tra định kỳ đội xe cuối tháng 11/2026', description: 'Còn 2 xe đến mốc bảo dưỡng 5.000 km.', time: 'Hôm qua', unread: true, type: 'maintenance', targetTab: 'maintenance' }
  ]);

  // Profile Form States
  const [profName, setProfName] = useState(user?.fullName || 'Nguyễn Minh Quân');
  const [profPhone, setProfPhone] = useState(user?.phone || '0905 999 888');
  const [profEmail, setProfEmail] = useState(user?.email || 'technician@motobike.vn');
  const [profOldPass, setProfOldPass] = useState('');
  const [profNewPass, setProfNewPass] = useState('');

  // Shared Modals
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<ReturnInspectionItem | null>(null);
  const [showCreateDamageReportModal, setShowCreateDamageReportModal] = useState<ReturnInspectionItem | null>(null);
  const [showCreateRepairModal, setShowCreateRepairModal] = useState<DamageReportItem | null>(null);
  const [showPhotoCompareModal, setShowPhotoCompareModal] = useState<{
    title: string;
    subtitle: string;
    beforeImgs: string[];
    afterImgs: string[];
    notes?: string;
  } | null>(null);

  // New Inspection Modal Form States
  const [newInsBookingCode, setNewInsBookingCode] = useState('HD-DN-2026-322');
  const [newInsCustName, setNewInsCustName] = useState('Đỗ Minh Tiến');
  const [newInsCustPhone, setNewInsCustPhone] = useState('0987 654 321');
  const [newInsVehicleId, setNewInsVehicleId] = useState('');
  const [newInsDeliveryOdo, setNewInsDeliveryOdo] = useState(13200);
  const [newInsOdo, setNewInsOdo] = useState(13400);
  const [newInsFuelLevel, setNewInsFuelLevel] = useState(90);
  const [newInsBrakes, setNewInsBrakes] = useState(true);
  const [newInsTires, setNewInsTires] = useState(true);
  const [newInsLights, setNewInsLights] = useState(true);
  const [newInsEngine, setNewInsEngine] = useState(true);
  const [newInsBody, setNewInsBody] = useState(true);
  const [newInsStatus, setNewInsStatus] = useState<'passed' | 'damaged'>('passed');
  const [newInsNotes, setNewInsNotes] = useState('');

  // Damage Report Modal States
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

  // Create Repair Quote Modal (from BBHH)
  const [repSelectedParts, setRepSelectedParts] = useState<{ partId: string; quantity: number }[]>([]);
  const [repSolutionText, setRepSolutionText] = useState('');

  const displayTechName = user?.fullName || profName || 'Nguyễn Minh Quân';

  // Load Real Data from MongoDB backend (gracefully preserving fallback when backend list is empty)
  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, mRes, bRes] = await Promise.allSettled([
        api.get('/vehicles'),
        api.get('/maintenance'),
        api.get('/bookings?limit=25')
      ]);

      if (vRes.status === 'fulfilled' && Array.isArray(vRes.value.data?.data) && vRes.value.data.data.length > 0) {
        setVehicles(vRes.value.data.data);
        if (!newInsVehicleId) setNewInsVehicleId(vRes.value.data.data[0]._id);
      } else {
        try {
          const pubRes = await api.get('/vehicles/public');
          if (Array.isArray(pubRes.data?.data) && pubRes.data.data.length > 0) {
            setVehicles(pubRes.data.data);
            if (!newInsVehicleId) setNewInsVehicleId(pubRes.data.data[0]._id);
          }
        } catch {}
      }

      if (mRes.status === 'fulfilled' && Array.isArray(mRes.value.data?.data) && mRes.value.data.data.length > 0) {
        setMaintenances(mRes.value.data.data);
      }
      if (bRes.status === 'fulfilled' && Array.isArray(bRes.value.data?.data)) {
        setRealBookings(bRes.value.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
    loadData();
  }, []);

  // Computed Metrics
  const activeRepairsCount = repairs.filter(
    r => r.status !== 'completed' && r.status !== 'customer_rejected'
  ).length;
  const unreadNotifsCount = notifications.filter(n => n.unread).length;

  const stats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const needInspection = returnInspections.filter(
      i => i.status === 'draft' || i.status === 'pending_inspection' || i.status === 'damaged'
    ).length;
    const repairingCount = activeRepairsCount;
    const maintainingCount = maintenances.filter(m => m.status === 'in_progress' || m.status === 'scheduled').length;
    const completedTotal =
      repairs.filter(r => r.status === 'completed').length +
      maintenances.filter(m => m.status === 'completed').length +
      returnInspections.filter(i => i.status === 'passed').length;
    const totalDamageCost = repairs.reduce(
      (acc, r) => acc + (r.actualCost || r.totalEstimatedCost || 0),
      0
    );
    return {
      totalVehicles,
      needInspection,
      repairingCount,
      maintainingCount,
      completedTotal,
      totalDamageCost
    };
  }, [vehicles, returnInspections, activeRepairsCount, maintenances, repairs]);

  const modalQuoteCalc = useMemo(() => {
    let partsPrice = 0;
    let laborPrice = 0;
    const lines = repSelectedParts
      .map(item => {
        const p = partsCatalog.find(x => x.id === item.partId);
        if (!p) return null;
        const pTotal = p.unitPrice * item.quantity;
        const lTotal = p.laborFee * item.quantity;
        partsPrice += pTotal;
        laborPrice += lTotal;
        return { ...p, quantity: item.quantity, total: pTotal + lTotal };
      })
      .filter(Boolean);

    return {
      lines,
      partsPrice,
      laborPrice,
      grandTotal: partsPrice + laborPrice
    };
  }, [repSelectedParts, partsCatalog]);

  // ==========================================
  // 3. EVENT HANDLERS
  // ==========================================
  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find(v => v._id === newInsVehicleId) || vehicles[0];
    const selectedBk = realBookings.find(b => b._id === selectedRealBookingId);
    const newId = `ins-${Date.now()}`;
    const newCode = `KT-2026-0${returnInspections.length + 43}`;

    const checklist = createDefaultChecklist({
      brakes: newInsBrakes ? undefined : { status: 'damage', damageLocation: 'Hệ thống phanh', note: 'Cần kiểm tra má phanh.' },
      tires: newInsTires ? undefined : { status: 'check', damageLocation: 'Lốp xe', note: 'Lốp non hơi hoặc mòn.' },
      lights: newInsLights ? undefined : { status: 'damage', damageLocation: 'Đèn pha / Còi', note: 'Kiểm tra hệ thống chiếu sáng.' },
      engine: newInsEngine ? undefined : { status: 'damage', damageLocation: 'Động cơ', note: 'Tiếng máy không đều.' },
      body: newInsBody ? undefined : { status: 'damage', damageLocation: 'Dàn áo / Gương', note: 'Phát hiện trầy xước.' }
    });

    const backendImgBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const deliveryImgs = selectedBk?.checkInImages?.length
      ? selectedBk.checkInImages.map((img: any) =>
          img.url?.startsWith('http') ? img.url : `${backendImgBase}${img.url}`
        )
      : [SAMPLE_PHOTOS.cleanFront];

    const newRecord: ReturnInspectionItem = {
      id: newId,
      inspectionCode: newCode,
      bookingId: selectedBk?._id || `bk-${Date.now()}`,
      bookingCode: newInsBookingCode,
      isRealBooking: Boolean(selectedBk),
      customerName: newInsCustName,
      customerPhone: newInsCustPhone,
      customerIdCard: selectedBk?.customer?.cccd || '048096009999',
      vehicleId: veh?._id || 'v-gen',
      vehicleName: veh?.name || 'Honda Vision',
      licensePlate: veh?.licensePlate || '43C1-999.99',
      vehicleImage: veh?.image || SAMPLE_PHOTOS.cleanFront,
      rentalStartDate: selectedBk?.startDate
        ? new Date(selectedBk.startDate).toISOString().slice(0, 16).replace('T', ' ')
        : '2026-11-23 08:00',
      rentalEndDate: selectedBk?.endDate
        ? new Date(selectedBk.endDate).toISOString().slice(0, 16).replace('T', ' ')
        : '2026-11-25 14:00',
      returnDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      deliveryOdometer: newInsDeliveryOdo,
      returnOdometer: newInsOdo,
      fuelLevel: newInsFuelLevel,
      deliveryImages: deliveryImgs,
      returnImages: [veh?.image || SAMPLE_PHOTOS.cleanRear],
      checklist,
      pins: [],
      brakes: newInsBrakes,
      tires: newInsTires,
      lightsAndHorn: newInsLights,
      engine: newInsEngine,
      mirrorsAndBody: newInsBody,
      status: 'draft',
      notes: newInsNotes || 'Đang kiểm tra 8 hạng mục kỹ thuật khi khách trả xe.',
      inspectorName: displayTechName,
      hasDamageReport: false
    };

    setReturnInspections(prev => [newRecord, ...prev]);
    setActiveInspectionId(newId);
    setActiveTab('return_inspection');
    setShowNewInspectionModal(false);
    setSelectedRealBookingId('');
    toast.success(`Đã tiếp nhận phiếu ${newCode}!`);
  };

  const handleUpdateInspection = (updated: ReturnInspectionItem) => {
    setReturnInspections(prev => prev.map(item => (item.id === updated.id ? updated : item)));
  };

  const handleConfirmInspection = async (ins: ReturnInspectionItem) => {
    const damageItems = ins.checklist.filter(c => c.status === 'damage');
    const checkItems = ins.checklist.filter(c => c.status === 'check');
    const finalStatus: ReturnInspectionItem['status'] = damageItems.length > 0 ? 'damaged' : 'passed';

    handleUpdateInspection({ ...ins, status: finalStatus });

    setVehicles(prev =>
      prev.map(v =>
        v._id === ins.vehicleId
          ? { ...v, odometer: ins.returnOdometer, status: finalStatus === 'passed' ? 'available' : 'broken' }
          : v
      )
    );

    if (ins.isRealBooking && ins.vehicleId && !ins.vehicleId.startsWith('v-')) {
      try {
        await api.put(`/vehicles/${ins.vehicleId}`, {
          odometer: ins.returnOdometer,
          status: finalStatus === 'passed' ? 'available' : 'broken'
        });
      } catch {}
    }

    if (finalStatus === 'passed') {
      toast.success(
        checkItems.length > 0
          ? `Đã xác nhận ${ins.inspectionCode} (lưu ý ${checkItems.length} mục kiểm tra thêm).`
          : `Đã xác nhận ĐẠT cho xe ${ins.licensePlate}!`
      );
    } else {
      toast.error(`Phát hiện ${damageItems.length} hư hỏng! Hãy bấm "Lập biên bản hư hỏng".`);
    }
  };

  const handleOpenDamageReportFromInspection = (ins: ReturnInspectionItem) => {
    const fromChecklist: DamagePosition[] = ins.checklist
      .filter(c => c.status === 'damage' || c.status === 'check')
      .map((c, idx) => ({
        id: `pos-chk-${c.id}-${Date.now()}-${idx}`,
        position: c.damageLocation.trim() || c.title,
        severity: c.damageSeverity,
        description: c.note || c.title,
        photo: c.photos[0] || ins.returnImages[0] || SAMPLE_PHOTOS.damageScratched,
        suggestedAction: c.damageSeverity === 'high' ? 'replace' : 'repair',
        suggestedPartName: c.damageSeverity === 'high' ? `Thay mới (${c.damageLocation || c.title})` : 'Sửa chữa / căn chỉnh'
      }));

    const fromPins: DamagePosition[] = ins.pins.map((pin, idx) => ({
      id: `pos-pin-${pin.id}-${idx}`,
      position: pin.label,
      severity: pin.severity,
      description: `Vị trí ghim #${idx + 1} trên xe`,
      photo: ins.returnImages[0] || SAMPLE_PHOTOS.damageScratched,
      suggestedAction: pin.severity === 'high' ? 'replace' : 'repair',
      suggestedPartName: pin.severity === 'high' ? 'Thay linh kiện mới' : 'Khắc phục / sơn dặm'
    }));

    const combined = [...fromChecklist, ...fromPins];
    if (combined.length === 0) {
      combined.push({
        id: `p-init-${Date.now()}`,
        position: 'Dàn áo yếm trước bên phải',
        severity: 'medium',
        description: ins.notes || 'Phát hiện trầy xước khi trả xe',
        photo: ins.returnImages[0] || SAMPLE_PHOTOS.damageScratched,
        suggestedAction: 'repair',
        suggestedPartName: 'Sơn dặm phục hồi'
      });
    }

    const updatedIns: ReturnInspectionItem = { ...ins, status: 'damaged' };
    handleUpdateInspection(updatedIns);
    setDmgPositionsList(combined);
    setDmgOverallSeverity(combined.some(p => p.severity === 'high') ? 'high' : 'medium');
    setDmgNotes(ins.notes || 'Khách hàng xác nhận các vị trí hư hỏng phát hiện khi trả xe.');
    setShowCreateDamageReportModal(updatedIns);
  };

  const handleSaveDamageReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateDamageReportModal) return;

    const ins = showCreateDamageReportModal;
    const newDmgId = `dmg-${Date.now()}`;
    const newCode = `BBHH-2026-0${damageReports.length + 24}`;

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
      reportedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      inspectorName: displayTechName,
      positions: dmgPositionsList,
      overallSeverity: dmgOverallSeverity,
      notes: dmgNotes || 'Khách hàng đã ký xác nhận biên bản hư hỏng.',
      status: 'confirmed',
      customerAgreedSignature: true
    };

    setReturnInspections(prev =>
      prev.map(i => (i.id === ins.id ? { ...i, hasDamageReport: true, damageReportId: newDmgId } : i))
    );
    setDamageReports(prev => [newReport, ...prev]);
    setShowCreateDamageReportModal(null);
    toast.success(`Đã lập Biên bản hư hỏng ${newCode}!`);
  };

  const handleSaveRepairOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateRepairModal) return;

    const dmg = showCreateRepairModal;
    const newRepId = `rep-${Date.now()}`;
    const newCode = `PSC-2026-0${repairs.length + 21}`;

    const partsLines: RepairPartLine[] = modalQuoteCalc.lines.map((l: any) => ({
      partId: l.id,
      partCode: l.code,
      name: l.name,
      actionMethod: 'Thay mới chính hãng',
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      laborFee: l.laborFee,
      total: l.unitPrice * l.quantity,
      isActualUsed: false
    }));

    const vehObj = vehicles.find(v => v._id === dmg.vehicleId);
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');

    const newRepair: RepairItem = {
      id: newRepId,
      code: newCode,
      damageReportId: dmg.id,
      damageReportCode: dmg.code,
      bookingCode: dmg.bookingCode,
      vehicleId: dmg.vehicleId,
      vehicleName: dmg.vehicleName,
      licensePlate: dmg.licensePlate,
      vehicleOdo: vehObj?.odometer || 14500,
      vehicleType: vehObj?.type || 'Xe tay ga',
      vehicleImage: vehObj?.image || SAMPLE_PHOTOS.cleanFront,
      customerName: dmg.customerName,
      customerPhone: dmg.customerPhone,
      issueSummary: dmg.positions.map(p => `${p.position}: ${p.description}`).join('; '),
      proposedSolution: repSolutionText || 'Thay thế phụ tùng mới chính hãng và phục hồi vị trí hư hỏng',
      parts: partsLines,
      totalPartsPrice: partsLines.reduce((s, p) => s + p.total, 0),
      totalLaborFee: modalQuoteCalc.laborPrice || 150000,
      totalEstimatedCost:
        partsLines.reduce((s, p) => s + p.total, 0) + (modalQuoteCalc.laborPrice || 150000),
      status: 'waiting_approval',
      progressPercent: 25,
      technicianName: displayTechName,
      damageItems: dmg.positions.map(p => ({
        id: p.id,
        title: p.position,
        severity: p.severity,
        actionLabel: p.suggestedAction === 'replace' ? 'Thay mới chính hãng' : 'Sửa chữa / phục hồi',
        location: p.position,
        description: p.description,
        beforePhotos: p.photo ? [p.photo] : [],
        newPartPhotos: [],
        afterPhotos: []
      })),
      beforePhotos: dmg.positions.map(p => p.photo || SAMPLE_PHOTOS.damageScratched),
      afterPhotos: [],
      replacementPhotos: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          title: `Tạo phiếu sửa chữa ${newCode} từ ${dmg.code}`,
          note: repSolutionText || 'Lập phương án báo giá gửi khách hàng',
          actor: displayTechName,
          timestamp: ts
        }
      ],
      createdAt: ts,
      updatedAt: ts
    };

    setDamageReports(prev =>
      prev.map(d => (d.id === dmg.id ? { ...d, status: 'repair_proposed', repairId: newRepId } : d))
    );
    setRepairs(prev => [newRepair, ...prev]);
    setSelectedRepairId(newRepId);
    setShowCreateRepairModal(null);
    setRepSelectedParts([]);
    setRepSolutionText('');
    setActiveTab('repair_management');
    toast.success(`Đã tạo phiếu sửa chữa ${newCode} từ ${dmg.code}!`);
  };

  const handleUpdateVehicleStatus = async (veh: VehicleItem, newStatus: VehicleItem['status']) => {
    setVehicles(prev => prev.map(v => (v._id === veh._id ? { ...v, status: newStatus } : v)));
    if (selectedVehicleDetail?._id === veh._id) {
      setSelectedVehicleDetail({ ...selectedVehicleDetail, status: newStatus });
    }
    if (!veh._id.startsWith('v-')) {
      const apiStatus =
        newStatus === 'repairing'
          ? 'broken'
          : newStatus === 'reserved'
          ? 'rented'
          : newStatus;
      try {
        await api.put(`/vehicles/${veh._id}`, { status: apiStatus });
      } catch {}
    }
    toast.success(`Đã cập nhật trạng thái xe ${veh.licensePlate}!`);
  };

  const handleExportCsvReport = () => {
    const rows = [
      ['Tháng', 'Kiểm tra trả xe', 'Bảo dưỡng', 'Sửa chữa', 'Chi phí (VND)'],
      ...CHART_DATA_6M.map(d => [d.label, d.inspections, d.maintenance, d.repairs, d.cost])
    ];
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BaoCao_KyThuat_MotoRent.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất file Excel (.csv) thành công!');
  };

  // ==========================================
  // SIDEBAR MENU (11 OFFICIAL ITEMS MATCHING SCREENSHOT)
  // ==========================================
  const SIDEBAR_ITEMS: Array<{
    id: TabId;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: 'home', label: 'Dashboard', icon: LayoutGrid },
    { id: 'vehicles', label: 'Quản lý xe', icon: Bike },
    { id: 'return_inspection', label: 'Kiểm tra xe khi trả', icon: ClipboardCheck },
    { id: 'damage_management', label: 'Quản lý hư hỏng', icon: AlertTriangle },
    { id: 'repair_management', label: 'Quản lý sửa chữa', icon: Wrench, badge: activeRepairsCount },
    { id: 'parts_management', label: 'Quản lý phụ tùng', icon: Package },
    { id: 'maintenance', label: 'Quản lý bảo dưỡng', icon: CalendarClock },
    { id: 'history', label: 'Lịch sử kỹ thuật', icon: History },
    { id: 'reports', label: 'Báo cáo thống kê', icon: BarChart2 },
    { id: 'notifications', label: 'Thông báo', icon: Bell, badge: unreadNotifsCount },
    { id: 'profile', label: 'Tài khoản cá nhân', icon: UserCircle }
  ];

  // Unified History Records (for Tab 8)
  const unifiedHistory = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      kind: 'inspection' | 'damage' | 'repair' | 'maintenance';
      code: string;
      vehicleName: string;
      licensePlate: string;
      title: string;
      actor: string;
      cost?: number;
      statusLabel: string;
      statusBg: string;
      statusColor: string;
      beforeImgs: string[];
      afterImgs: string[];
    }> = [];

    returnInspections.forEach(ins => {
      list.push({
        id: ins.id,
        date: ins.returnDate,
        kind: 'inspection',
        code: ins.inspectionCode,
        vehicleName: ins.vehicleName,
        licensePlate: ins.licensePlate,
        title: `Kiểm tra trả xe (Đơn ${ins.bookingCode} • KH ${ins.customerName})`,
        actor: ins.inspectorName,
        statusLabel: ins.status === 'passed' ? 'Đạt yêu cầu' : ins.status === 'damaged' ? 'Phát hiện hư hỏng' : 'Đang lưu nháp',
        statusBg: ins.status === 'passed' ? '#f0fdf4' : ins.status === 'damaged' ? '#fef2f2' : '#f1f5f9',
        statusColor: ins.status === 'passed' ? '#16a34a' : ins.status === 'damaged' ? '#dc2626' : '#475569',
        beforeImgs: ins.deliveryImages,
        afterImgs: [...ins.returnImages, ...ins.checklist.flatMap(c => c.photos)]
      });
    });

    damageReports.forEach(d => {
      list.push({
        id: d.id,
        date: d.reportedAt,
        kind: 'damage',
        code: d.code,
        vehicleName: d.vehicleName,
        licensePlate: d.licensePlate,
        title: `Biên bản hư hỏng (${d.positions.length} vị trí • ${d.customerName})`,
        actor: d.inspectorName,
        statusLabel: d.status === 'repair_proposed' ? 'Đã lập phiếu sửa' : 'Đã xác nhận',
        statusBg: d.status === 'repair_proposed' ? '#eff6ff' : '#fef2f2',
        statusColor: d.status === 'repair_proposed' ? '#2563eb' : '#dc2626',
        beforeImgs: d.positions.map(p => p.photo || SAMPLE_PHOTOS.damageScratched),
        afterImgs: []
      });
    });

    repairs.forEach(r => {
      list.push({
        id: r.id,
        date: r.completedAt || r.createdAt,
        kind: 'repair',
        code: r.code,
        vehicleName: r.vehicleName,
        licensePlate: r.licensePlate,
        title: r.proposedSolution,
        actor: r.technicianName,
        cost: r.actualCost || r.totalEstimatedCost,
        statusLabel: r.status === 'completed' ? 'Đã hoàn thành' : r.status === 'customer_rejected' ? 'Khách từ chối' : 'Đang xử lý',
        statusBg: r.status === 'completed' ? '#f0fdf4' : r.status === 'customer_rejected' ? '#fef2f2' : '#eff6ff',
        statusColor: r.status === 'completed' ? '#16a34a' : r.status === 'customer_rejected' ? '#dc2626' : '#2563eb',
        beforeImgs: r.beforePhotos,
        afterImgs: r.afterPhotos
      });
    });

    maintenances.forEach(m => {
      list.push({
        id: m._id,
        date: m.completedDate || m.scheduledDate || '2026-11-25',
        kind: 'maintenance',
        code: `BD-${m._id.slice(-4).toUpperCase()}`,
        vehicleName: m.vehicle?.name || 'Xe máy',
        licensePlate: m.vehicle?.licensePlate || '43-ĐN',
        title: m.title,
        actor: m.technician?.fullName || displayTechName,
        cost: m.cost || 250000,
        statusLabel: m.status === 'completed' ? 'Hoàn thành' : m.status === 'in_progress' ? 'Đang thực hiện' : 'Đã lên lịch',
        statusBg: m.status === 'completed' ? '#f0fdf4' : '#fefce8',
        statusColor: m.status === 'completed' ? '#16a34a' : '#a16207',
        beforeImgs: [SAMPLE_PHOTOS.cleanFront],
        afterImgs: [SAMPLE_PHOTOS.repairedPerfect]
      });
    });

    return list.filter(item => {
      const matchKind = historyTypeFilter === 'all' || item.kind === historyTypeFilter;
      const matchVeh = historyVehicleFilter === 'all' || item.vehicleName === historyVehicleFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQ =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.vehicleName.toLowerCase().includes(q) ||
        item.licensePlate.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q);
      return matchKind && matchVeh && matchQ;
    });
  }, [returnInspections, damageReports, repairs, maintenances, historyTypeFilter, historyVehicleFilter, searchQuery, displayTechName]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ========================================================
          1. SIDEBAR (#1E293B — CHÍNH XÁC THEO SCREENSHOT)
          ======================================================== */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '74px',
          background: '#1E293B',
          color: '#ffffff',
          transition: 'width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0
        }}
      >
        <div style={{ overflowY: 'auto', paddingBottom: '12px' }}>
          {/* Brand Logo */}
          <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                flexShrink: 0
              }}
            >
              <Wrench size={19} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 900, fontSize: '15.5px', color: '#ffffff', letterSpacing: '-0.2px' }}>
                  MotoRent <span style={{ color: '#60a5fa' }}>Tech</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Xưởng Kỹ Thuật Đà Nẵng</div>
              </div>
            )}
          </div>

          {/* Section Heading matching Screenshot */}
          <div
            style={{
              padding: sidebarOpen ? '18px 18px 8px' : '14px 10px 6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textAlign: sidebarOpen ? 'left' : 'center'
            }}
          >
            {sidebarOpen ? 'PHÂN HỆ NHÂN VIÊN KỸ THUẬT' : '•••'}
          </div>

          {/* 11 Clean Official Menu Items */}
          <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {SIDEBAR_ITEMS.map(item => {
              const IconComp = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'profile' && activeTab === 'user_management');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'repair_management') setSelectedRepairId(null);
                    setActiveTab(item.id);
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#2563EB' : 'transparent',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <IconComp size={18} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.85 }} />
                    {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                  </div>

                  {sidebarOpen && typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.22)' : '#0f172a',
                        color: '#e2e8f0',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        minWidth: '22px',
                        textAlign: 'center'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '12.5px', flexShrink: 0 }}>
              MQ
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayTechName}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Nhân viên Kỹ thuật trưởng</div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              background: 'rgba(239,68,68,0.12)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <LogOut size={14} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN WORKSPACE CONTAINER
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '9px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              <Menu size={18} />
            </button>

            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm biển số xe (43C1...), mã phiếu sửa, biên bản hư hỏng, phụ tùng..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 14px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '12.5px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('user_management')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '9px',
                border: activeTab === 'user_management' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: activeTab === 'user_management' ? '#eff6ff' : '#ffffff',
                color: activeTab === 'user_management' ? '#2563eb' : '#334155',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Quản lý người dùng & Khách hàng"
            >
              <Users size={15} />
              <span>Người dùng & KH</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              title="Làm mới dữ liệu"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} color="#475569" className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              style={{
                position: 'relative',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Bell size={16} color="#475569" />
              {unreadNotifsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '999px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px'
                  }}
                >
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            <div
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                cursor: 'pointer',
                paddingLeft: '10px',
                borderLeft: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#2563EB',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '12px'
                }}
              >
                MQ
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{displayTechName}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Nhân viên Kỹ thuật trưởng</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ padding: '24px 26px', maxWidth: '1460px', width: '100%', margin: '0 auto' }}>
          {/* ========================================================
              TAB 1: DASHBOARD (TRANG TỔNG QUAN)
              ======================================================== */}
          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Dashboard Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                    Dashboard Nhân viên Kỹ thuật
                  </h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Theo dõi tình trạng đội xe, kiểm tra trả xe, xử lý hư hỏng và tiến độ sửa chữa tại Hải Châu, Đà Nẵng
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowNewInspectionModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: '#2563EB',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <Plus size={16} />
                    <span>Tiếp nhận kiểm tra trả xe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('repair_management')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '9px 14px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Wrench size={15} color="#2563EB" />
                    <span>Phiếu sửa chữa ({activeRepairsCount})</span>
                  </button>
                </div>
              </div>

              {/* 6 KPI Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '14px' }}>
                {[
                  { tab: 'vehicles' as TabId, title: 'Tổng xe phân công', value: stats.totalVehicles, sub: 'Đang theo dõi kỹ thuật', icon: Bike, iconBg: '#eff6ff', iconColor: '#2563eb' },
                  { tab: 'return_inspection' as TabId, title: 'Xe cần kiểm tra', value: stats.needInspection, sub: 'Mới trả / Đang lưu nháp', icon: ClipboardCheck, iconBg: '#fff7ed', iconColor: '#d97706' },
                  { tab: 'repair_management' as TabId, title: 'Đang sửa chữa', value: stats.repairingCount, sub: 'Phiếu PSC đang xử lý', icon: Wrench, iconBg: '#fef2f2', iconColor: '#dc2626' },
                  { tab: 'maintenance' as TabId, title: 'Đang bảo dưỡng', value: stats.maintainingCount, sub: 'Theo lịch định kỳ', icon: CalendarClock, iconBg: '#fefce8', iconColor: '#ca8a04' },
                  { tab: 'history' as TabId, title: 'Công việc hoàn thành', value: stats.completedTotal, sub: 'Đã nghiệm thu an toàn', icon: CheckCircle2, iconBg: '#f0fdf4', iconColor: '#16a34a' },
                  { tab: 'notifications' as TabId, title: 'Thông báo chưa đọc', value: unreadNotifsCount, sub: 'Cập nhật mới nhất', icon: Bell, iconBg: '#f5f3ff', iconColor: '#7c3aed' }
                ].map(card => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      onClick={() => setActiveTab(card.tab)}
                      style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)'
                      }}
                    >
                      <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: card.iconBg, color: card.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{card.title}</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>{card.value}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{card.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Thống kê công việc kỹ thuật
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>6 tháng gần nhất (Kiểm tra, Bảo dưỡng, Sửa chữa)</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('reports')}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Xem báo cáo →
                    </button>
                  </div>
                  <MonthlyWorkBarChart data={CHART_DATA_6M} />
                </div>

                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Tình trạng xe trong kho
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Cập nhật trực tiếp theo đội xe phân công</div>
                    </div>
                  </div>
                  <VehicleStatusDonutChart
                    segments={[
                      { label: 'Sẵn sàng cho thuê', value: vehicles.filter(v => v.status === 'available').length, color: '#16a34a' },
                      { label: 'Đang cho thuê', value: vehicles.filter(v => v.status === 'rented').length, color: '#2563eb' },
                      { label: 'Đang bảo dưỡng', value: vehicles.filter(v => v.status === 'maintenance').length, color: '#d97706' },
                      { label: 'Đang sửa / Hư hỏng', value: vehicles.filter(v => v.status === 'broken' || v.status === 'repairing').length, color: '#dc2626' }
                    ]}
                  />
                </div>
              </div>

              {/* Middle Row: Maintenance & Notifications */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                {/* Upcoming maintenance */}
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Lịch bảo dưỡng sắp tới</h3>
                    <button type="button" onClick={() => setActiveTab('maintenance')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      Xem tất cả →
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {maintenances.slice(0, 4).map(m => (
                      <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            {m.vehicle?.name || 'Xe máy'} • <span style={{ color: '#2563eb' }}>{m.vehicle?.licensePlate || '43-ĐN'}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{m.title}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>{m.scheduledDate || '2026-11-26'}</div>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: m.status === 'completed' ? '#f0fdf4' : m.status === 'in_progress' ? '#eff6ff' : '#fefce8', color: m.status === 'completed' ? '#16a34a' : m.status === 'in_progress' ? '#2563eb' : '#a16207' }}>
                            {m.status === 'completed' ? 'Hoàn thành' : m.status === 'in_progress' ? 'Đang làm' : 'Đã lên lịch'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Notifications */}
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Thông báo & yêu cầu mới</h3>
                    <button type="button" onClick={() => setActiveTab('notifications')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      Xem tất cả →
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.slice(0, 4).map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotifications(prev => prev.map(x => (x.id === n.id ? { ...x, unread: false } : x)));
                          if (n.targetTab) setActiveTab(n.targetTab);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: n.unread ? '#eff6ff' : '#f8fafc',
                          border: n.unread ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>{n.title}</span>
                          <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{n.time}</span>
                        </div>
                        {n.description && <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{n.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Return Inspections Table */}
              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Xe vừa trả & Công việc kỹ thuật cần xử lý
                  </h3>
                  <button type="button" onClick={() => setActiveTab('return_inspection')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    Mở màn hình Kiểm tra xe ({returnInspections.length}) →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {returnInspections.map(ins => (
                    <div key={ins.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '11px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={ins.vehicleImage || SAMPLE_PHOTOS.cleanFront}
                          alt={ins.vehicleName}
                          style={{ width: '48px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                        />
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                            {ins.inspectionCode} • {ins.vehicleName} (<span style={{ color: '#2563eb' }}>{ins.licensePlate}</span>)
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Đơn: <strong>{ins.bookingCode}</strong> • KH: {ins.customerName} • Trả: {ins.returnDate}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInspectionId(ins.id);
                            setActiveTab('return_inspection');
                          }}
                          style={{ padding: '6px 12px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mở phiếu kiểm tra
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedInspectionForDetail(ins)}
                          style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '7px', fontSize: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                        >
                          Đối chiếu ảnh
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: QUẢN LÝ XE (VEHICLES — ĐÚNG THEO 2 SCREENSHOT MẪU)
              ======================================================== */}
          {activeTab === 'vehicles' && (() => {
            const q = (vehLocalSearch || searchQuery).trim().toLowerCase();
            const filteredVehicles = vehicles.filter(v => {
              const codeStr = (v.code || `MR-DN-${v._id.slice(-3).toUpperCase()}`).toLowerCase();
              const matchQ =
                !q ||
                v.name.toLowerCase().includes(q) ||
                v.licensePlate.toLowerCase().includes(q) ||
                codeStr.includes(q);
              const matchS = vehStatusFilter === 'all' || v.status === vehStatusFilter;
              const matchT = vehTypeFilter === 'all' || v.type === vehTypeFilter;
              return matchQ && matchS && matchT;
            });
            const PER_PAGE = 6;
            const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PER_PAGE));
            const safeVehPage = Math.min(vehPage, totalPages);
            const pagedVehicles = filteredVehicles.slice((safeVehPage - 1) * PER_PAGE, safeVehPage * PER_PAGE);

            const getVehBadge = (st: VehicleItem['status']) => {
              switch (st) {
                case 'broken':
                  return { label: '⚠ Có hư hỏng', bg: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
                case 'repairing':
                  return { label: '🔧 Đang sửa chữa', bg: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
                case 'maintenance':
                  return { label: '🛠 Đang bảo dưỡng', bg: '#fefce8', color: '#a16207', border: '1px solid #fde68a' };
                case 'rented':
                  return { label: '🛵 Đang cho thuê', bg: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' };
                case 'reserved':
                  return { label: '⏳ Đã đặt trước', bg: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' };
                case 'available':
                default:
                  return { label: '✓ Sẵn sàng', bg: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
              }
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                    Quản lý xe
                  </h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Danh sách phương tiện thuộc chi nhánh Hải Châu, Đà Nẵng và tình trạng kỹ thuật hiện tại.
                  </p>
                </div>

                {/* Filter Card */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(240px, 1.8fr) minmax(160px, 1fr) minmax(160px, 1fr)',
                    gap: '12px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={vehLocalSearch}
                      onChange={e => {
                        setVehLocalSearch(e.target.value);
                        setVehPage(1);
                      }}
                      placeholder="Tìm theo mã xe, tên xe, biển số 43..."
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '9px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <select
                    value={vehTypeFilter}
                    onChange={e => {
                      setVehTypeFilter(e.target.value);
                      setVehPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '9px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <option value="all">Tất cả loại xe</option>
                    {[...new Set(vehicles.map(v => v.type))].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <select
                    value={vehStatusFilter}
                    onChange={e => {
                      setVehStatusFilter(e.target.value);
                      setVehPage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '9px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      background: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 600
                    }}
                  >
                    <option value="all">Tất cả tình trạng</option>
                    <option value="available">Sẵn sàng</option>
                    <option value="broken">Có hư hỏng</option>
                    <option value="repairing">Đang sửa chữa</option>
                    <option value="maintenance">Đang bảo dưỡng</option>
                    <option value="rented">Đang cho thuê</option>
                  </select>
                </div>

                {/* Table Card */}
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                          <th style={{ padding: '12px 16px' }}>Hình ảnh xe</th>
                          <th style={{ padding: '12px 14px' }}>Mã xe</th>
                          <th style={{ padding: '12px 14px' }}>Tên xe</th>
                          <th style={{ padding: '12px 14px' }}>Biển số</th>
                          <th style={{ padding: '12px 14px' }}>Loại xe</th>
                          <th style={{ padding: '12px 14px' }}>Số kilomet</th>
                          <th style={{ padding: '12px 14px' }}>Tình trạng kỹ thuật</th>
                          <th style={{ padding: '12px 14px' }}>Bảo dưỡng gần nhất</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedVehicles.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                              Không tìm thấy phương tiện phù hợp.
                            </td>
                          </tr>
                        ) : (
                          pagedVehicles.map((veh, idx) => {
                            const vehCode = veh.code || `MR-DN-${String((safeVehPage - 1) * PER_PAGE + idx + 1).padStart(3, '0')}`;
                            const badge = getVehBadge(veh.status);
                            return (
                              <tr key={veh._id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                                <td style={{ padding: '12px 16px' }}>
                                  <img
                                    src={veh.image || SAMPLE_PHOTOS.cleanFront}
                                    alt={veh.name}
                                    style={{ width: '56px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', display: 'block' }}
                                  />
                                </td>
                                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a', fontSize: '12.5px' }}>
                                  {vehCode}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{veh.name}</div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                                    {veh.color || 'Tiêu chuẩn'} • Đời {veh.year || 2024}
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                                  {veh.licensePlate}
                                </td>
                                <td style={{ padding: '12px 14px', color: '#334155' }}>{veh.type}</td>
                                <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>
                                  {(veh.odometer || 12000).toLocaleString('vi-VN')} km
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '4px 10px',
                                      borderRadius: '999px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      background: badge.bg,
                                      color: badge.color,
                                      border: badge.border,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', fontSize: '12.5px', color: '#475569', fontFamily: 'monospace' }}>
                                  {veh.lastMaintenanceDate || '2026-11-25'}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedVehicleDetail({ ...veh, code: vehCode })}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 10px',
                                        background: '#ffffff',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <Eye size={13} />
                                      <span>Chi tiết</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setHistoryVehicleFilter(veh.name);
                                        setActiveTab('history');
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 10px',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <History size={13} />
                                      <span>Lịch sử KT</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '12.5px',
                      color: '#64748b',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <span>
                      Hiển thị{' '}
                      <strong>
                        {filteredVehicles.length === 0 ? 0 : (safeVehPage - 1) * PER_PAGE + 1}–
                        {Math.min(safeVehPage * PER_PAGE, filteredVehicles.length)}
                      </strong>{' '}
                      trong tổng số <strong>{filteredVehicles.length}</strong> bản ghi
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={safeVehPage <= 1}
                        onClick={() => setVehPage(p => Math.max(1, p - 1))}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '7px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: safeVehPage <= 1 ? '#cbd5e1' : '#334155',
                          fontSize: '12px',
                          cursor: safeVehPage <= 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ‹ Trước
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setVehPage(pNum)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '7px',
                            border: safeVehPage === pNum ? 'none' : '1px solid #e2e8f0',
                            background: safeVehPage === pNum ? '#2563eb' : '#ffffff',
                            color: safeVehPage === pNum ? '#ffffff' : '#334155',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {pNum}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={safeVehPage >= totalPages}
                        onClick={() => setVehPage(p => Math.min(totalPages, p + 1))}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '7px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: safeVehPage >= totalPages ? '#cbd5e1' : '#334155',
                          fontSize: '12px',
                          cursor: safeVehPage >= totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Sau ›
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================
              TAB 3: KIỂM TRA XE KHI TRẢ
              ======================================================== */}
          {activeTab === 'return_inspection' && (
            <ReturnInspectionWorkspace
              inspections={returnInspections}
              activeInspectionId={activeInspectionId}
              onSelectInspection={setActiveInspectionId}
              onUpdateInspection={handleUpdateInspection}
              onOpenNewModal={() => setShowNewInspectionModal(true)}
              onOpenPhotoCompare={payload => setShowPhotoCompareModal(payload)}
              onConfirmInspection={handleConfirmInspection}
              onOpenDamageReport={handleOpenDamageReportFromInspection}
              searchQuery={searchQuery}
            />
          )}

          {/* ========================================================
              TAB 4: QUẢN LÝ HƯ HỎNG
              ======================================================== */}
          {activeTab === 'damage_management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Quản lý hư hỏng & Biên bản</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Ghi nhận vị trí hư hại, mức độ ảnh hưởng và chuyển lập đề xuất báo giá sửa chữa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fallbackIns = returnInspections.find(i => i.id === activeInspectionId) || returnInspections[0];
                    if (fallbackIns) handleOpenDamageReportFromInspection(fallbackIns);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Plus size={15} />
                  <span>Lập biên bản từ phiếu kiểm tra</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `Tất cả (${damageReports.length})` },
                  { key: 'confirmed', label: `Chờ lập báo giá (${damageReports.filter(d => d.status === 'confirmed').length})` },
                  { key: 'repair_proposed', label: `Đã tạo phiếu sửa (${damageReports.filter(d => d.status === 'repair_proposed').length})` }
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setDmgFilter(t.key as any)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: dmgFilter === t.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: dmgFilter === t.key ? '#2563eb' : '#ffffff',
                      color: dmgFilter === t.key ? '#ffffff' : '#334155',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {damageReports
                  .filter(d => dmgFilter === 'all' || d.status === dmgFilter)
                  .map(dmg => (
                    <div key={dmg.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', background: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14.5px', fontWeight: 900, color: '#dc2626', fontFamily: 'monospace' }}>{dmg.code}</span>
                            <span style={{ fontSize: '11.5px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                              Mức độ: {dmg.overallSeverity === 'high' ? 'Nặng' : dmg.overallSeverity === 'low' ? 'Nhẹ' : 'Trung bình'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Đơn thuê: <strong style={{ color: '#2563eb' }}>{dmg.bookingCode}</strong>
                            </span>
                          </div>
                          <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                            {dmg.vehicleName} • <span style={{ color: '#2563eb', fontFamily: 'monospace' }}>{dmg.licensePlate}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Khách hàng: <strong>{dmg.customerName}</strong> ({dmg.customerPhone}) • KTV: {dmg.inspectorName} ({dmg.reportedAt})
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setShowPhotoCompareModal({
                                title: `Ảnh hiện trạng hư hỏng ${dmg.code}`,
                                subtitle: `${dmg.vehicleName} (${dmg.licensePlate}) • KH: ${dmg.customerName}`,
                                beforeImgs: [SAMPLE_PHOTOS.cleanFront],
                                afterImgs: dmg.positions.map(p => p.photo || SAMPLE_PHOTOS.damageScratched),
                                notes: dmg.notes
                              })
                            }
                            style={{ padding: '7px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <Camera size={13} />
                            <span>Xem ảnh đối chứng</span>
                          </button>

                          {dmg.status === 'confirmed' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRepSolutionText(dmg.positions.map(p => p.description).join('; '));
                                setShowCreateRepairModal(dmg);
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              <Wrench size={14} />
                              <span>Lập đề xuất sửa chữa & Báo giá</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (dmg.repairId) setSelectedRepairId(dmg.repairId);
                                setActiveTab('repair_management');
                              }}
                              style={{ padding: '7px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              ✓ Xem phiếu sửa chữa →
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        {dmg.positions.map((pos, idx) => (
                          <div key={pos.id || idx} style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
                            {pos.photo && <img src={pos.photo} alt={pos.position} style={{ width: '76px', height: '76px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{pos.position}</div>
                              <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: 700, margin: '2px 0' }}>
                                Mức độ: {pos.severity === 'high' ? 'Nặng' : pos.severity === 'low' ? 'Nhẹ' : 'Trung bình'} • {pos.suggestedAction === 'replace' ? 'Đề xuất thay mới' : 'Sửa chữa phục hồi'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569' }}>{pos.description}</div>
                              {pos.suggestedPartName && (
                                <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: 700, marginTop: '4px' }}>
                                  Đề xuất: {pos.suggestedPartName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <strong>Ghi chú biên bản:</strong> {dmg.notes}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: QUẢN LÝ SỬA CHỮA
              ======================================================== */}
          {activeTab === 'repair_management' && (
            <RepairManagementWorkspace
              repairs={repairs}
              selectedRepairId={selectedRepairId}
              onSelectRepairId={setSelectedRepairId}
              onUpdateRepair={updated => setRepairs(prev => prev.map(r => (r.id === updated.id ? updated : r)))}
              onCreateRepair={created => setRepairs(prev => [created, ...prev])}
              vehicles={vehicles}
              partsCatalog={partsCatalog}
              inspectorName={displayTechName}
              onCompleteVehicleAvailable={vehId =>
                setVehicles(prev => prev.map(v => (v._id === vehId ? { ...v, status: 'available' } : v)))
              }
              searchQuery={searchQuery}
            />
          )}

          {/* ========================================================
              TAB 6: QUẢN LÝ PHỤ TÙNG
              ======================================================== */}
          {activeTab === 'parts_management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Quản lý phụ tùng thay thế</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Tra cứu tồn kho linh kiện chính hãng, đơn giá niêm yết, tiền công lắp đặt và bảo hành
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPartViewMode(m => (m === 'table' ? 'grid' : 'table'))}
                    style={{ padding: '8px 14px', borderRadius: '9px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {partViewMode === 'table' ? 'Xem dạng lưới' : 'Xem dạng bảng'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPartModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '9px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus size={15} />
                    <span>Thêm phụ tùng</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng mã linh kiện</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{partsCatalog.length}</div>
                </div>
                <div style={{ background: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0', padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: '#15803d' }}>Đủ tồn kho</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>{partsCatalog.filter(p => p.stock >= 10).length}</div>
                </div>
                <div style={{ background: '#fff7ed', borderRadius: '14px', border: '1px solid #fed7aa', padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: '#c2410c' }}>Sắp hết (dưới 10 cái)</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#ea580c', marginTop: '2px' }}>{partsCatalog.filter(p => p.stock < 10).length}</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select value={partCatFilter} onChange={e => setPartCatFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff', fontWeight: 600 }}>
                  <option value="all">Tất cả nhóm phụ tùng</option>
                  {[...new Set(partsCatalog.map(p => p.category))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {partViewMode === 'table' ? (
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                          <th style={{ padding: '12px 16px' }}>Mã PT</th>
                          <th style={{ padding: '12px 16px' }}>Tên linh kiện</th>
                          <th style={{ padding: '12px 16px' }}>Nhóm</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Giá phụ tùng</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Công lắp</th>
                          <th style={{ padding: '12px 16px' }}>Bảo hành</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tồn kho</th>
                          <th style={{ padding: '12px 16px' }}>Tương thích</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partsCatalog
                          .filter(p => {
                            const q = searchQuery.trim().toLowerCase();
                            const matchQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                            const matchC = partCatFilter === 'all' || p.category === partCatFilter;
                            return matchQ && matchC;
                          })
                          .map(pt => (
                            <tr key={pt.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>{pt.code}</td>
                              <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{pt.name}</td>
                              <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px' }}>{pt.category}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{pt.unitPrice.toLocaleString('vi-VN')} đ</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>{pt.laborFee.toLocaleString('vi-VN')} đ</td>
                              <td style={{ padding: '12px 16px' }}>
                                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>{pt.warranty}</span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: pt.stock < 10 ? '#ea580c' : '#16a34a' }}>{pt.stock} cái</td>
                              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{pt.compatible}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                  {partsCatalog
                    .filter(p => partCatFilter === 'all' || p.category === partCatFilter)
                    .map(pt => (
                      <div key={pt.id} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                        <div style={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>{pt.code} • {pt.category}</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px' }}>{pt.name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                          <strong style={{ color: '#2563eb' }}>{pt.unitPrice.toLocaleString('vi-VN')} đ</strong>
                          <span style={{ fontWeight: 700, color: pt.stock < 10 ? '#ea580c' : '#16a34a' }}>Tồn: {pt.stock}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>Tương thích: {pt.compatible}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 7: QUẢN LÝ BẢO DƯỠNG
              ======================================================== */}
          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Quản lý bảo dưỡng định kỳ</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Theo dõi lịch bảo dưỡng, tiếp nhận công việc và cập nhật hoàn thành</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newMaintVehId && vehicles[0]) setNewMaintVehId(vehicles[0]._id);
                    setShowNewMaintModal(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Plus size={15} />
                  <span>Tạo lịch bảo dưỡng</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'scheduled', label: 'Đã lên lịch' },
                  { key: 'in_progress', label: 'Đang thực hiện' },
                  { key: 'completed', label: 'Hoàn thành' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMaintStatusFilter(opt.key)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: maintStatusFilter === opt.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: maintStatusFilter === opt.key ? '#2563eb' : '#ffffff',
                      color: maintStatusFilter === opt.key ? '#ffffff' : '#334155',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                        <th style={{ padding: '12px 16px' }}>Mã phiếu</th>
                        <th style={{ padding: '12px 16px' }}>Xe bảo dưỡng</th>
                        <th style={{ padding: '12px 16px' }}>Hạng mục</th>
                        <th style={{ padding: '12px 16px' }}>Ngày thực hiện</th>
                        <th style={{ padding: '12px 16px' }}>Kỹ thuật viên</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Chi phí</th>
                        <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenances
                        .filter(m => maintStatusFilter === 'all' || m.status === maintStatusFilter)
                        .map(m => (
                          <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>BD#{m._id.slice(-4).toUpperCase()}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{m.vehicle?.name || 'Xe máy'}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>{m.vehicle?.licensePlate || '43-ĐN'}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>{m.title}</td>
                            <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{m.scheduledDate || '2026-11-25'}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{m.technician?.fullName || displayTechName}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{(m.cost || 200000).toLocaleString('vi-VN')} đ</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700, background: m.status === 'completed' ? '#f0fdf4' : m.status === 'in_progress' ? '#eff6ff' : '#fefce8', color: m.status === 'completed' ? '#16a34a' : m.status === 'in_progress' ? '#2563eb' : '#a16207' }}>
                                {m.status === 'completed' ? 'Hoàn thành' : m.status === 'in_progress' ? 'Đang thực hiện' : 'Đã lên lịch'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button type="button" onClick={() => setSelectedMaintDetail(m)} style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                  Chi tiết
                                </button>
                                {m.status === 'scheduled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMaintenances(prev => prev.map(x => (x._id === m._id ? { ...x, status: 'in_progress' } : x)));
                                      toast.success('Đã tiếp nhận bảo dưỡng!');
                                    }}
                                    style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Tiếp nhận
                                  </button>
                                )}
                                {m.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMaintenances(prev => prev.map(x => (x._id === m._id ? { ...x, status: 'completed', completedDate: '2026-11-25' } : x)));
                                      toast.success('Đã hoàn thành bảo dưỡng!');
                                    }}
                                    style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Hoàn thành
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: LỊCH SỬ KỸ THUẬT
              ======================================================== */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Lịch sử kỹ thuật tổng hợp</h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Tra cứu toàn bộ hồ sơ kiểm tra trả xe, biên bản hư hỏng, sửa chữa và bảo dưỡng kèm ảnh đối chứng
                </p>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'inspection', label: 'Kiểm tra trả xe' },
                    { key: 'damage', label: 'Hư hỏng' },
                    { key: 'repair', label: 'Sửa chữa' },
                    { key: 'maintenance', label: 'Bảo dưỡng' }
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setHistoryTypeFilter(opt.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: historyTypeFilter === opt.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: historyTypeFilter === opt.key ? '#2563eb' : '#ffffff',
                        color: historyTypeFilter === opt.key ? '#ffffff' : '#334155',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <select value={historyVehicleFilter} onChange={e => setHistoryVehicleFilter(e.target.value)} style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}>
                  <option value="all">Tất cả phương tiện</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v.name}>{v.name} ({v.licensePlate})</option>
                  ))}
                </select>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                        <th style={{ padding: '12px 16px' }}>Mã / Thời gian</th>
                        <th style={{ padding: '12px 16px' }}>Phương tiện</th>
                        <th style={{ padding: '12px 16px' }}>Nội dung công việc</th>
                        <th style={{ padding: '12px 16px' }}>Phụ trách</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Chi phí</th>
                        <th style={{ padding: '12px 16px' }}>Kết quả</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Đối chứng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unifiedHistory.map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>{h.code}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>{h.date}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.vehicleName}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>{h.licensePlate}</div>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#334155', maxWidth: '320px' }}>{h.title}</td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{h.actor}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {h.cost ? `${h.cost.toLocaleString('vi-VN')} đ` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 700, background: h.statusBg, color: h.statusColor }}>
                              {h.statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setShowPhotoCompareModal({
                                  title: `Ảnh đối chứng ${h.code} — ${h.vehicleName}`,
                                  subtitle: `Biển số: ${h.licensePlate} • ${h.title}`,
                                  beforeImgs: h.beforeImgs.length > 0 ? h.beforeImgs : [SAMPLE_PHOTOS.cleanFront],
                                  afterImgs: h.afterImgs.length > 0 ? h.afterImgs : [SAMPLE_PHOTOS.repairedPerfect],
                                  notes: h.title
                                })
                              }
                              style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Xem ảnh
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 9: BÁO CÁO THỐNG KÊ
              ======================================================== */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Báo cáo thống kê kỹ thuật</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Thống kê số lượt kiểm tra, chi phí bảo dưỡng & sửa chữa, tỷ lệ xử lý hư hỏng
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleExportCsvReport}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '9px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Download size={14} />
                    <span>Xuất Excel (.csv)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '9px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Printer size={14} />
                    <span>In báo cáo</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { key: '1m', label: 'Tháng này' },
                  { key: '3m', label: '3 tháng gần nhất' },
                  { key: '6m', label: '6 tháng gần nhất' },
                  { key: '12m', label: 'Cả năm' }
                ].map(p => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setReportPeriod(p.key as any)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: reportPeriod === p.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: reportPeriod === p.key ? '#2563eb' : '#ffffff',
                      color: reportPeriod === p.key ? '#ffffff' : '#334155',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng lượt kiểm tra (6T)</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                    {CHART_DATA_6M.reduce((s, d) => s + d.inspections, 0)} lượt
                  </div>
                </div>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Biên bản hư hỏng hiện tại</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>{damageReports.length} vụ</div>
                </div>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Phiếu sửa chữa hoàn thành</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                    {repairs.filter(r => r.status === 'completed').length} / {repairs.length}
                  </div>
                </div>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Tổng giá trị sửa chữa tháng</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>
                    {stats.totalDamageCost.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Số lượng công việc theo tháng</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>Kiểm tra trả xe, Bảo dưỡng, Sửa chữa</p>
                  <MonthlyWorkBarChart data={reportPeriod === '3m' ? CHART_DATA_6M.slice(-3) : CHART_DATA_6M} />
                </div>

                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Biến động chi phí sửa chữa & phụ tùng</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>Đơn vị tính: Triệu VNĐ</p>
                  <CostTrendLineChart data={reportPeriod === '3m' ? CHART_DATA_6M.slice(-3) : CHART_DATA_6M} />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 10: THÔNG BÁO
              ======================================================== */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Thông báo kỹ thuật</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Bạn có {unreadNotifsCount} thông báo chưa đọc</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNotifFilter(f => (f === 'all' ? 'unread' : 'all'))}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {notifFilter === 'all' ? 'Chỉ hiện chưa đọc' : 'Hiện tất cả'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
                    }}
                    style={{ padding: '7px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications
                  .filter(n => notifFilter === 'all' || n.unread)
                  .map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifications(prev => prev.map(x => (x.id === n.id ? { ...x, unread: false } : x)));
                        if (n.targetTab) setActiveTab(n.targetTab);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: n.unread ? '#eff6ff' : '#ffffff',
                        border: n.unread ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: n.unread ? '#2563eb' : '#f1f5f9', color: n.unread ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Bell size={17} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: n.unread ? 800 : 600, color: '#0f172a' }}>{n.title}</div>
                          {n.description && <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{n.description}</div>}
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{n.time}</div>
                        </div>
                      </div>
                      {n.unread && <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 11: TÀI KHOẢN CÁ NHÂN
              ======================================================== */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Tài khoản cá nhân</h1>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Quản lý thông tin kỹ thuật viên, mật khẩu và hiệu suất công việc</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('user_management')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Users size={15} />
                  <span>Mở Quản lý người dùng & Khách hàng →</span>
                </button>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ height: '74px', background: 'linear-gradient(135deg, #2563eb, #1e293b)' }} />
                <div style={{ padding: '0 24px 20px', display: 'flex', alignItems: 'center', gap: '16px', marginTop: '-28px', flexWrap: 'wrap' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#2563eb', color: '#ffffff', border: '4px solid #ffffff', boxShadow: '0 4px 12px rgba(15,23,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px' }}>
                    MQ
                  </div>
                  <div style={{ paddingTop: '28px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{displayTechName}</div>
                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>Nhân viên Kỹ thuật trưởng • Chi nhánh Hải Châu, Đà Nẵng</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    try {
                      await api.put('/users/profile', { fullName: profName, phone: profPhone });
                    } catch {}
                    toast.success('Đã cập nhật thông tin cá nhân!');
                  }}
                  style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>Thông tin liên hệ</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                      <input type="text" value={profName} onChange={e => setProfName(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                      <input type="text" value={profPhone} onChange={e => setProfPhone(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input type="email" value={profEmail} onChange={e => setProfEmail(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <button type="submit" style={{ padding: '9px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
                      Lưu thông tin cá nhân
                    </button>
                  </div>
                </form>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    toast.success('Đã cập nhật mật khẩu mới!');
                    setProfOldPass('');
                    setProfNewPass('');
                  }}
                  style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>Đổi mật khẩu</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mật khẩu hiện tại</label>
                      <input type="password" value={profOldPass} onChange={e => setProfOldPass(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mật khẩu mới</label>
                      <input type="password" value={profNewPass} onChange={e => setProfNewPass(e.target.value)} placeholder="Tối thiểu 6 ký tự" required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                    </div>
                    <button type="submit" style={{ padding: '9px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}>
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
              QUẢN LÝ NGƯỜI DÙNG & KHÁCH HÀNG (HEADER / PROFILE ACCESSIBLE)
              ======================================================== */}
          {activeTab === 'user_management' && (
            <UserManagementWorkspace
              inspections={returnInspections}
              repairs={repairs}
              inspectorName={displayTechName}
              inspectorEmail={user?.email}
              searchQuery={searchQuery}
              onJumpToInspection={insId => {
                setActiveInspectionId(insId);
                setActiveTab('return_inspection');
              }}
              onJumpToRepair={repId => {
                setSelectedRepairId(repId);
                setActiveTab('repair_management');
              }}
            />
          )}
        </main>
      </div>

      {/* ========================================================
          MODAL 1: TIẾP NHẬN KIỂM TRA TRẢ XE MỚI
          ======================================================== */}
      {showNewInspectionModal && (
        <div onClick={() => setShowNewInspectionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <form onSubmit={handleSaveInspection} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Tiếp nhận xe trả mới</h3>
              <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {realBookings.length > 0 && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 12px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#1d4ed8', display: 'block', marginBottom: '5px' }}>Chọn nhanh đơn thuê từ hệ thống:</label>
                  <select
                    value={selectedRealBookingId}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedRealBookingId(id);
                      const bk = realBookings.find(b => b._id === id);
                      if (bk) {
                        setNewInsBookingCode(bk.bookingCode || bk._id.slice(-8).toUpperCase());
                        setNewInsCustName(bk.customer?.fullName || 'Khách thuê xe');
                        setNewInsCustPhone(bk.customer?.phone || '0905 000 000');
                        if (bk.vehicle?._id) setNewInsVehicleId(bk.vehicle._id);
                        const startOdo = Number(bk.checkInOdometer || bk.vehicle?.odometer || 12000);
                        setNewInsDeliveryOdo(startOdo);
                        setNewInsOdo(startOdo + 95);
                      }
                    }}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #93c5fd', fontSize: '12.5px', background: '#ffffff' }}
                  >
                    <option value="">-- Nhập thủ công --</option>
                    {realBookings.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.bookingCode} • {b.vehicle?.name || 'Xe máy'} ({b.vehicle?.licensePlate || '43-ĐN'}) • KH: {b.customer?.fullName || 'Khách'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mã đơn thuê *</label>
                  <input type="text" required value={newInsBookingCode} onChange={e => setNewInsBookingCode(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Họ tên khách hàng *</label>
                  <input type="text" required value={newInsCustName} onChange={e => setNewInsCustName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Chọn xe</label>
                  <select value={newInsVehicleId || vehicles[0]?._id} onChange={e => setNewInsVehicleId(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}>
                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                  <input type="text" value={newInsCustPhone} onChange={e => setNewInsCustPhone(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Odo lúc giao</label>
                  <input type="number" value={newInsDeliveryOdo} onChange={e => setNewInsDeliveryOdo(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Odo khi trả</label>
                  <input type="number" value={newInsOdo} onChange={e => setNewInsOdo(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Nhiên liệu (%)</label>
                  <input type="number" min={0} max={100} value={newInsFuelLevel} onChange={e => setNewInsFuelLevel(Math.min(100, Math.max(0, Number(e.target.value))))} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Ghi chú nhận xe</label>
                <textarea rows={2} value={newInsNotes} onChange={e => setNewInsNotes(e.target.value)} placeholder="Tình trạng ban đầu khi nhận xe từ khách..." style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Tạo phiếu kiểm tra 8 hạng mục</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 2: LẬP BIÊN BẢN HƯ HỎNG
          ======================================================== */}
      {showCreateDamageReportModal && (
        <div onClick={() => setShowCreateDamageReportModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <form onSubmit={handleSaveDamageReport} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '660px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Lập biên bản kiểm tra & ghi nhận hư hỏng</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Đơn: {showCreateDamageReportModal.bookingCode} • {showCreateDamageReportModal.vehicleName} ({showCreateDamageReportModal.licensePlate})
                </div>
              </div>
              <button type="button" onClick={() => setShowCreateDamageReportModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Vị trí hư hỏng ({dmgPositionsList.length})</span>
                <button
                  type="button"
                  onClick={() => setDmgPositionsList([...dmgPositionsList, { id: `pos-${Date.now()}`, position: 'Cụm đèn pha trước', severity: 'medium', description: 'Nứt nhẹ viền mica', photo: SAMPLE_PHOTOS.damageBrokenLight, suggestedAction: 'replace', suggestedPartName: 'Cụm đèn pha LED' }])}
                  style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Thêm vị trí
                </button>
              </div>

              {dmgPositionsList.map((pos, idx) => (
                <div key={pos.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626' }}>Vị trí #{idx + 1}</span>
                    {dmgPositionsList.length > 1 && (
                      <button type="button" onClick={() => setDmgPositionsList(dmgPositionsList.filter(p => p.id !== pos.id))} style={{ border: 'none', background: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer' }}>Xóa</button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                    <input type="text" value={pos.position} onChange={e => setDmgPositionsList(dmgPositionsList.map(p => (p.id === pos.id ? { ...p, position: e.target.value } : p)))} style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }} />
                    <select value={pos.severity} onChange={e => setDmgPositionsList(dmgPositionsList.map(p => (p.id === pos.id ? { ...p, severity: e.target.value as any } : p)))} style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}>
                      <option value="low">Nhẹ</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Nặng</option>
                    </select>
                  </div>
                  <input type="text" value={pos.description} onChange={e => setDmgPositionsList(dmgPositionsList.map(p => (p.id === pos.id ? { ...p, description: e.target.value } : p)))} style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }} />
                </div>
              ))}

              <textarea rows={2} value={dmgNotes} onChange={e => setDmgNotes(e.target.value)} placeholder="Ý kiến khách hàng và ghi chú biên bản..." style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowCreateDamageReportModal(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Lưu biên bản hư hỏng</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 3: LẬP PHIẾU SỬA CHỮA TỪ BIÊN BẢN HƯ HỎNG
          ======================================================== */}
      {showCreateRepairModal && (
        <div onClick={() => setShowCreateRepairModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <form onSubmit={handleSaveRepairOrder} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Lập đề xuất sửa chữa & báo giá</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Từ {showCreateRepairModal.code} • {showCreateRepairModal.vehicleName} ({showCreateRepairModal.licensePlate})</div>
              </div>
              <button type="button" onClick={() => setShowCreateRepairModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" required value={repSolutionText} onChange={e => setRepSolutionText(e.target.value)} placeholder="Phương án sửa chữa đề xuất..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />

              <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px' }}>
                {partsCatalog.map(p => {
                  const isSel = repSelectedParts.some(x => x.partId === p.id);
                  return (
                    <label key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '7px', background: isSel ? '#eff6ff' : 'transparent', cursor: 'pointer', fontSize: '12.5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() =>
                            setRepSelectedParts(isSel ? repSelectedParts.filter(x => x.partId !== p.id) : [...repSelectedParts, { partId: p.id, quantity: 1 }])
                          }
                        />
                        <strong>{p.name}</strong>
                      </span>
                      <span style={{ fontWeight: 700, color: '#2563eb' }}>{p.unitPrice.toLocaleString('vi-VN')} đ</span>
                    </label>
                  );
                })}
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Tổng báo giá dự kiến (kèm công thợ):</span>
                <strong style={{ fontSize: '17px', color: '#2563eb' }}>
                  {(modalQuoteCalc.partsPrice + (modalQuoteCalc.laborPrice || 150000)).toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setShowCreateRepairModal(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Tạo phiếu sửa chữa →</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 4: SO SÁNH ẢNH ĐỐI CHỨNG
          ======================================================== */}
      {showPhotoCompareModal && (
        <div onClick={() => setShowPhotoCompareModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 130, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '860px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{showPhotoCompareModal.title}</h3>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>{showPhotoCompareModal.subtitle}</div>
              </div>
              <button type="button" onClick={() => setShowPhotoCompareModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #cbd5e1', background: '#f8fafc' }}>
                <div style={{ background: '#1e293b', color: '#ffffff', padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
                  ẢNH TRƯỚC ({showPhotoCompareModal.beforeImgs.length || 1} ảnh)
                </div>
                <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: showPhotoCompareModal.beforeImgs.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  {(showPhotoCompareModal.beforeImgs.length > 0 ? showPhotoCompareModal.beforeImgs : [SAMPLE_PHOTOS.cleanFront]).map((src, i) => (
                    <img key={i} src={src} alt="Before" style={{ width: '100%', height: showPhotoCompareModal.beforeImgs.length > 1 ? '145px' : '250px', objectFit: 'cover', borderRadius: '8px' }} />
                  ))}
                </div>
              </div>

              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #86efac', background: '#f0fdf4' }}>
                <div style={{ background: '#16a34a', color: '#ffffff', padding: '8px', fontSize: '12px', fontWeight: 800, textAlign: 'center' }}>
                  ẢNH SAU ({showPhotoCompareModal.afterImgs.length || 1} ảnh)
                </div>
                <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: showPhotoCompareModal.afterImgs.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  {(showPhotoCompareModal.afterImgs.length > 0 ? showPhotoCompareModal.afterImgs : [SAMPLE_PHOTOS.repairedPerfect]).map((src, i) => (
                    <img key={i} src={src} alt="After" style={{ width: '100%', height: showPhotoCompareModal.afterImgs.length > 1 ? '145px' : '250px', objectFit: 'cover', borderRadius: '8px' }} />
                  ))}
                </div>
              </div>
            </div>

            {showPhotoCompareModal.notes && (
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', color: '#334155', marginBottom: '12px' }}>
                <strong>Ghi chú:</strong> {showPhotoCompareModal.notes}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPhotoCompareModal(null)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: CHI TIẾT PHIẾU KIỂM TRA
          ======================================================== */}
      {selectedInspectionForDetail && (
        <div onClick={() => setSelectedInspectionForDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Chi tiết phiếu {selectedInspectionForDetail.inspectionCode} ({selectedInspectionForDetail.bookingCode})
              </h3>
              <button type="button" onClick={() => setSelectedInspectionForDetail(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '14px' }}>
              <div><strong>Xe:</strong> {selectedInspectionForDetail.vehicleName} (<span style={{ color: '#2563eb' }}>{selectedInspectionForDetail.licensePlate}</span>)</div>
              <div><strong>Khách hàng:</strong> {selectedInspectionForDetail.customerName} ({selectedInspectionForDetail.customerPhone})</div>
              <div><strong>ODO:</strong> {selectedInspectionForDetail.deliveryOdometer.toLocaleString('vi-VN')} → {selectedInspectionForDetail.returnOdometer.toLocaleString('vi-VN')} km</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <img src={selectedInspectionForDetail.deliveryImages[0] || SAMPLE_PHOTOS.cleanFront} alt="Before" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
              <img src={selectedInspectionForDetail.returnImages[0] || SAMPLE_PHOTOS.cleanRear} alt="After" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
            </div>

            <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '14px' }}>
              <strong>Ghi chú:</strong> {selectedInspectionForDetail.notes}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const id = selectedInspectionForDetail.id;
                  setSelectedInspectionForDetail(null);
                  setActiveInspectionId(id);
                  setActiveTab('return_inspection');
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Mở trong workspace 8 hạng mục
              </button>
              <button type="button" onClick={() => setSelectedInspectionForDetail(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: CHI TIẾT XE & CẬP NHẬT TRẠNG THÁI (ĐÚNG SCREENSHOT 2)
          ======================================================== */}
      {selectedVehicleDetail && (() => {
        const veh = selectedVehicleDetail;
        const vehCode = veh.code || `MR-DN-${veh._id.slice(-3).toUpperCase()}`;
        const galleryImgs =
          veh.gallery && veh.gallery.length > 0
            ? veh.gallery
            : [veh.image || SAMPLE_PHOTOS.cleanFront, SAMPLE_PHOTOS.newPartInstalled];
        const nextMaintOdo = veh.nextMaintenanceOdo || (veh.odometer || 12000) + 2000;

        return (
          <div
            onClick={() => setSelectedVehicleDetail(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 120,
              padding: '16px'
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '24px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {veh.name} ({veh.licensePlate})
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px', fontFamily: 'monospace' }}>
                    Mã phương tiện: {vehCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicleDetail(null)}
                  style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 2-Column Image + Specs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '18px',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '180px' }}>
                  <img
                    src={veh.image || SAMPLE_PHOTOS.cleanFront}
                    alt={veh.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Loại xe / Phân khối</span>
                    <strong style={{ color: '#0f172a' }}>{veh.type} ({veh.engineCC || 150}cc)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Màu sắc / Đời xe</span>
                    <strong style={{ color: '#0f172a' }}>{veh.color || 'Tiêu chuẩn'} • {veh.year || 2024}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>ODO hiện tại</span>
                    <strong style={{ color: '#0f172a' }}>{(veh.odometer || 12000).toLocaleString('vi-VN')} km</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Bảo dưỡng gần nhất</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{veh.lastMaintenanceDate || '2026-11-25'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Mốc bảo dưỡng kế</span>
                    <strong style={{ color: '#2563eb' }}>{nextMaintOdo.toLocaleString('vi-VN')} km</strong>
                  </div>
                </div>
              </div>

              {/* Quick Status Update Card */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '14px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                    Cập nhật trạng thái kỹ thuật nhanh
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Trạng thái sẽ đồng bộ tức thì sang toàn bộ phân hệ
                  </div>
                </div>
                <select
                  value={veh.status}
                  onChange={e => handleUpdateVehicleStatus(veh, e.target.value as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '9px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="available">Sẵn sàng</option>
                  <option value="broken">Có hư hỏng</option>
                  <option value="repairing">Đang sửa chữa</option>
                  <option value="maintenance">Đang bảo dưỡng</option>
                  <option value="rented">Đang cho thuê</option>
                </select>
              </div>

              {/* Yellow Tech Note Banner */}
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  color: '#92400e',
                  marginBottom: '16px'
                }}
              >
                <strong>Ghi chú kỹ thuật:</strong>{' '}
                {veh.techNote || 'Xe hoạt động ổn định, không có ghi nhận bất thường.'}
              </div>

              {/* Gallery Section */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                    ẢNH HIỆN TRẠNG CHUẨN BÀN GIAO ({galleryImgs.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoCompareModal({
                        title: `Thư viện ảnh xe ${veh.name} (${veh.licensePlate})`,
                        subtitle: `Mã xe: ${vehCode} • ODO: ${(veh.odometer || 12000).toLocaleString('vi-VN')} km`,
                        beforeImgs: galleryImgs,
                        afterImgs: galleryImgs,
                        notes: veh.techNote
                      });
                    }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Camera size={13} />
                    <span>Phóng to thư viện</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {galleryImgs.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${veh.name} #${i + 1}`}
                      onClick={() =>
                        setShowPhotoCompareModal({
                          title: `Thư viện ảnh xe ${veh.name} (${veh.licensePlate})`,
                          subtitle: `Mã xe: ${vehCode}`,
                          beforeImgs: galleryImgs,
                          afterImgs: galleryImgs,
                          notes: veh.techNote
                        })
                      }
                      style={{
                        width: '100%',
                        height: '120px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryVehicleFilter(veh.name);
                    setSelectedVehicleDetail(null);
                    setActiveTab('history');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '9px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <History size={14} />
                  <span>Xem lịch sử kỹ thuật</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVehicleDetail(null)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          MODAL 7: THÊM PHỤ TÙNG MỚI
          ======================================================== */}
      {showAddPartModal && (
        <div onClick={() => setShowAddPartModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              const newItem: PartItem = {
                id: `p-${Date.now()}`,
                code: newPartCode.trim() || `PT-NEW-${partsCatalog.length + 1}`,
                name: newPartName.trim(),
                category: newPartCategory,
                unitPrice: newPartPrice,
                laborFee: newPartLabor,
                warranty: '6 tháng',
                stock: newPartStock,
                compatible: 'Đa dòng xe'
              };
              setPartsCatalog(prev => [newItem, ...prev]);
              setShowAddPartModal(false);
              setNewPartCode('');
              setNewPartName('');
              toast.success('Đã thêm phụ tùng mới vào kho!');
            }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '500px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Thêm phụ tùng vào kho</h3>
              <button type="button" onClick={() => setShowAddPartModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="text" value={newPartCode} onChange={e => setNewPartCode(e.target.value)} placeholder="Mã PT (VD: PT-ELC-01)" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              <input type="text" required value={newPartName} onChange={e => setNewPartName(e.target.value)} placeholder="Tên linh kiện *" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              <select value={newPartCategory} onChange={e => setNewPartCategory(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}>
                <option value="Động cơ & Đánh lửa">Động cơ & Đánh lửa</option>
                <option value="Hệ thống phanh">Hệ thống phanh</option>
                <option value="Dàn áo & Nhựa">Dàn áo & Nhựa</option>
                <option value="Hệ thống đèn">Hệ thống đèn</option>
                <option value="Lốp & Bánh xe">Lốp & Bánh xe</option>
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <input type="number" value={newPartPrice} onChange={e => setNewPartPrice(Number(e.target.value))} placeholder="Giá bán" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }} />
                <input type="number" value={newPartLabor} onChange={e => setNewPartLabor(Number(e.target.value))} placeholder="Công lắp" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }} />
                <input type="number" value={newPartStock} onChange={e => setNewPartStock(Number(e.target.value))} placeholder="Số lượng" style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button type="button" onClick={() => setShowAddPartModal(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Lưu phụ tùng</button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL 8: TẠO & XEM CHI TIẾT BẢO DƯỠNG
          ======================================================== */}
      {showNewMaintModal && (
        <div onClick={() => setShowNewMaintModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              const veh = vehicles.find(v => v._id === newMaintVehId) || vehicles[0];
              const created: MaintenanceRecord = {
                _id: `m-${Date.now()}`,
                vehicle: { _id: veh._id, name: veh.name, licensePlate: veh.licensePlate },
                technician: { fullName: displayTechName },
                type: 'Định kỳ',
                title: newMaintTitle,
                status: 'scheduled',
                scheduledDate: newMaintDate,
                cost: newMaintCost,
                notes: newMaintNotes
              };
              setMaintenances(prev => [created, ...prev]);
              setShowNewMaintModal(false);
              toast.success('Đã tạo lịch bảo dưỡng mới!');
            }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '500px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Tạo lịch bảo dưỡng mới</h3>
              <button type="button" onClick={() => setShowNewMaintModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select value={newMaintVehId || vehicles[0]?._id} onChange={e => setNewMaintVehId(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}>
                {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>)}
              </select>
              <input type="text" required value={newMaintTitle} onChange={e => setNewMaintTitle(e.target.value)} placeholder="Hạng mục bảo dưỡng" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input type="date" value={newMaintDate} onChange={e => setNewMaintDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                <input type="number" value={newMaintCost} onChange={e => setNewMaintCost(Number(e.target.value))} placeholder="Chi phí dự kiến" style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>
              <textarea rows={2} value={newMaintNotes} onChange={e => setNewMaintNotes(e.target.value)} placeholder="Ghi chú..." style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button type="button" onClick={() => setShowNewMaintModal(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
              <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Lưu lịch bảo dưỡng</button>
            </div>
          </form>
        </div>
      )}

      {selectedMaintDetail && (
        <div onClick={() => setSelectedMaintDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Phiếu bảo dưỡng BD#{selectedMaintDetail._id.slice(-4).toUpperCase()}</h3>
              <button type="button" onClick={() => setSelectedMaintDetail(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <div><strong>Xe:</strong> {selectedMaintDetail.vehicle?.name} ({selectedMaintDetail.vehicle?.licensePlate})</div>
              <div><strong>Hạng mục:</strong> {selectedMaintDetail.title}</div>
              <div><strong>Ngày thực hiện:</strong> {selectedMaintDetail.scheduledDate}</div>
              <div><strong>Chi phí:</strong> {(selectedMaintDetail.cost || 0).toLocaleString('vi-VN')} đ</div>
              <div><strong>Ghi chú:</strong> {selectedMaintDetail.notes || 'Không có'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedMaintDetail(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
