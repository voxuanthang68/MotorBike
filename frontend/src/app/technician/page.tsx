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
  Headphones,
  Settings,
  Search,
  Bell,
  Sun,
  LogOut,
  ChevronRight,
  Eye,
  Check,
  Menu,
  ChevronDown,
  HelpCircle,
  Play,
  X,
  Plus,
  RefreshCw,
  Fuel,
  Gauge,
  Phone,
  MessageCircle,
  ShieldCheck,
  Filter,
  Camera,
  ClipboardCheck,
  User,
  Key,
  Download,
  Printer,
  ChevronLeft,
  Package,
  Layers,
  DollarSign,
  Sparkles,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

interface VehicleItem {
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

interface MaintenanceRecord {
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
  images?: Array<{ url: string; caption?: string }>;
  beforeImage?: string;
  afterImage?: string;
  nextMaintenanceDate?: string;
}

interface RepairRequest {
  id: string;
  code: string;
  vehicleName: string;
  licensePlate: string;
  issue: string;
  cause?: string;
  solution?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'waiting_parts' | 'completed' | 'unfixable';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  partsUsed: string[];
  reportedAt: string;
  beforeImage?: string;
  afterImage?: string;
  completedAt?: string;
}

interface VehicleCheckRecord {
  id: string;
  checkCode: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  odometer: number;
  checkedAt: string;
  checkType: 'pre_rental' | 'post_rental' | 'routine';
  brakes: boolean;
  tires: boolean;
  lightsAndHorn: boolean;
  engine: boolean;
  mirrorsAndBody: boolean;
  notes: string;
  result: 'passed' | 'need_maintenance' | 'need_repair' | 'unfit_for_rent';
  inspectorName: string;
  beforeImage?: string;
  afterImage?: string;
}

interface AppNotification {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'maintenance' | 'repair' | 'task' | 'overdue';
}

// Danh mục phụ tùng chính hãng phục vụ báo giá & thay thế
interface PartItem {
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

// Bản ghi lịch sử phụ tùng đã thay thế của từng xe
interface ReplacedPartHistory {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  replacedAt: string;
  partName: string;
  partCode: string;
  quantity: number;
  unitPrice: number;
  laborFee: number;
  total: number;
  technician: string;
  reason: string;
  warrantyUntil: string;
  beforeImage?: string;
  afterImage?: string;
}

const PARTS_CATALOG: PartItem[] = [
  { id: 'p1', code: 'PT-OIL-01', name: 'Dầu nhớt Motul Scooter Expert LE 10W40 (0.8L)', category: 'Dầu nhớt & Dung dịch', unitPrice: 120000, laborFee: 20000, warranty: '1.500 km', stock: 45, compatible: 'Xe ga (Vision, AirBlade, SH, Lead)' },
  { id: 'p2', code: 'PT-OIL-02', name: 'Dầu nhớt Castrol Power1 4T 10W40 (1.0L)', category: 'Dầu nhớt & Dung dịch', unitPrice: 135000, laborFee: 20000, warranty: '1.500 km', stock: 32, compatible: 'Xe số & Côn tay (Wave, Exciter, Winner)' },
  { id: 'p3', code: 'PT-OIL-03', name: 'Nước làm mát tản nhiệt động cơ Motul Coolant', category: 'Dầu nhớt & Dung dịch', unitPrice: 85000, laborFee: 25000, warranty: '10.000 km', stock: 18, compatible: 'Các dòng xe làm mát két nước' },
  { id: 'p4', code: 'PT-BRK-01', name: 'Má phanh đĩa trước Nissin chính hãng Honda', category: 'Hệ thống phanh', unitPrice: 180000, laborFee: 30000, warranty: '6 tháng', stock: 24, compatible: 'AirBlade, Vision, Lead, SH' },
  { id: 'p5', code: 'PT-BRK-02', name: 'Bộ má phanh đùm/cơ sau Honda OEM', category: 'Hệ thống phanh', unitPrice: 110000, laborFee: 30000, warranty: '6 tháng', stock: 28, compatible: 'Wave Alpha, Future, Blade, Vision' },
  { id: 'p6', code: 'PT-TIR-01', name: 'Lốp không săm Michelin City Extra (Trước 80/90-14)', category: 'Lốp & Bánh xe', unitPrice: 460000, laborFee: 40000, warranty: '12 tháng', stock: 15, compatible: 'Vision, Air Blade, Vario' },
  { id: 'p7', code: 'PT-TIR-02', name: 'Lốp không săm Michelin City Extra (Sau 90/90-14)', category: 'Lốp & Bánh xe', unitPrice: 520000, laborFee: 40000, warranty: '12 tháng', stock: 12, compatible: 'Vision, Air Blade, Vario' },
  { id: 'p8', code: 'PT-BAT-01', name: 'Bình ắc quy khô GS GTZ5S (12V-3.5Ah)', category: 'Hệ thống điện & Đề', unitPrice: 380000, laborFee: 20000, warranty: '9 tháng', stock: 20, compatible: 'Xe ga & Xe số phổ thông' },
  { id: 'p9', code: 'PT-SPK-01', name: 'Bugi chân dài NGK Iridium CPR8EAIX-9', category: 'Đánh lửa & Động cơ', unitPrice: 95000, laborFee: 15000, warranty: '15.000 km', stock: 35, compatible: 'Các dòng xe phun xăng điện tử PGM-FI' },
  { id: 'p10', code: 'PT-BEL-01', name: 'Dây Curoa truyền động Bando Honda chính hãng', category: 'Truyền động', unitPrice: 280000, laborFee: 50000, warranty: '12 tháng (15.000 km)', stock: 14, compatible: 'Air Blade 125/160, Lead 125, SH' },
  { id: 'p11', code: 'PT-CHN-01', name: 'Nhông sên dĩa phốt cao su O-Ring DID 428HD', category: 'Truyền động', unitPrice: 380000, laborFee: 45000, warranty: '12 tháng', stock: 16, compatible: 'Exciter 155, Winner X, Raider 150' },
  { id: 'p12', code: 'PT-AIR-01', name: 'Tấm lọc gió động cơ zin chống bụi Honda', category: 'Hút khí & Lọc gió', unitPrice: 75000, laborFee: 15000, warranty: '8.000 km', stock: 40, compatible: 'Toàn bộ xe ga Honda' },
  { id: 'p13', code: 'PT-LGT-01', name: 'Bóng đèn pha LED 2 tầng siêu sáng chân H4', category: 'Hệ thống đèn', unitPrice: 240000, laborFee: 25000, warranty: '12 tháng', stock: 11, compatible: 'Wave, Exciter, Siruis' }
];

// Ảnh mẫu mặc định cho minh chứng đối chứng (Before & After)
const SAMPLE_PROOF_IMAGES = {
  brakeBefore: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  brakeAfter: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
  tireBefore: 'https://images.unsplash.com/photo-1571216332002-282dce467b32?auto=format&fit=crop&w=600&q=80',
  tireAfter: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80',
  cleanBefore: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  cleanAfter: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=600&q=80'
};

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const { user, logout, initialize } = useAuthStore();
  
  // 10 Tabs: Added 'parts' for Phụ tùng & Báo giá thay thế
  const [activeTab, setActiveTab] = useState<
    'home' | 'vehicles' | 'maintenance' | 'repairs' | 'inspection' | 'parts' | 'history' | 'reports' | 'notifications' | 'profile'
  >('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Maintenance Sub-tab
  const [maintSubTab, setMaintSubTab] = useState<'schedule' | 'upcoming'>('schedule');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicleStatus, setFilterVehicleStatus] = useState<string>('all');
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');

  // Real Database States
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Module 2.4: Repairs State with Before & After proof photos
  const [repairs, setRepairs] = useState<RepairRequest[]>([
    {
      id: 'rp-1',
      code: 'SC001',
      vehicleName: 'Honda Vision 2024',
      licensePlate: '43C1-888.88',
      issue: 'Khó đề nổ buổi sáng, ắc quy yếu, chập chờn đồng hồ điện tử',
      cause: 'Ắc quy bị chai sau 18 tháng sử dụng, dòng điện khởi động < 9.5V',
      solution: 'Thay mới bình ắc quy khô GS GTZ5S (12V-3.5Ah) chính hãng',
      status: 'in_progress',
      priority: 'high',
      estimatedCost: 400000,
      partsUsed: ['Bình ắc quy khô GS GTZ5S (12V-3.5Ah)'],
      reportedAt: '25/11/2026 08:30',
      beforeImage: SAMPLE_PROOF_IMAGES.brakeBefore,
      afterImage: SAMPLE_PROOF_IMAGES.brakeAfter
    },
    {
      id: 'rp-2',
      code: 'SC002',
      vehicleName: 'Yamaha Exciter 155',
      licensePlate: '43B2-234.56',
      issue: 'Chùng xích kêu lạch cạch và trượt má phanh sau khi phanh gấp',
      cause: 'Xích dão quá cỡ tăng xích, má phanh mòn sát đế kim loại',
      solution: 'Thay bộ sên phốt DID 428HD và thay má phanh đĩa Nissin',
      status: 'waiting_parts',
      priority: 'medium',
      estimatedCost: 635000,
      partsUsed: ['Nhông sên dĩa phốt cao su O-Ring DID 428HD', 'Má phanh đĩa trước Nissin'],
      reportedAt: '24/11/2026 14:15',
      beforeImage: SAMPLE_PROOF_IMAGES.tireBefore
    },
    {
      id: 'rp-3',
      code: 'SC003',
      vehicleName: 'Honda Winner X 150',
      licensePlate: '43B4-456.78',
      issue: 'Đèn pha LED chập chờn khi đánh lái sang phải',
      cause: 'Lỏng giắc cắm công tắc cụm tay lái bên trái',
      solution: 'Vệ sinh giắc cắm và bọc chống nước co nhiệt',
      status: 'pending',
      priority: 'low',
      estimatedCost: 80000,
      partsUsed: [],
      reportedAt: '25/11/2026 10:00'
    }
  ]);

  // Module 2.5: Vehicle Inspections State with Before & After proof photos
  const [inspections, setInspections] = useState<VehicleCheckRecord[]>([
    {
      id: 'chk-1',
      checkCode: 'KT2611-01',
      vehicleId: '1',
      vehicleName: 'Honda Vision 2026',
      licensePlate: '43E1-73737',
      odometer: 12500,
      checkedAt: '25/11/2026 09:00',
      checkType: 'post_rental',
      brakes: true,
      tires: true,
      lightsAndHorn: true,
      engine: true,
      mirrorsAndBody: true,
      notes: 'Xe hoạt động hoàn hảo, đã rửa sạch dàn áo và bôi trơn dây xích',
      result: 'passed',
      inspectorName: 'Nguyễn Văn Minh',
      beforeImage: SAMPLE_PROOF_IMAGES.cleanBefore,
      afterImage: SAMPLE_PROOF_IMAGES.cleanAfter
    },
    {
      id: 'chk-2',
      checkCode: 'KT2611-02',
      vehicleId: '2',
      vehicleName: 'Honda Air Blade 125cc',
      licensePlate: '43B1-123.45',
      odometer: 24600,
      checkedAt: '24/11/2026 16:30',
      checkType: 'pre_rental',
      brakes: true,
      tires: false,
      lightsAndHorn: true,
      engine: true,
      mirrorsAndBody: true,
      notes: 'Lốp sau mòn gai rãnh, cần thay lốp Michelin trước khi cho khách thuê đường dài',
      result: 'need_maintenance',
      inspectorName: 'Nguyễn Văn Minh',
      beforeImage: SAMPLE_PROOF_IMAGES.tireBefore,
      afterImage: SAMPLE_PROOF_IMAGES.tireAfter
    }
  ]);

  // Lịch sử chi tiết phụ tùng đã thay thế của từng xe (để nhân viên tra cứu xe này đã thay gì và báo giá)
  const [replacedPartsHistory, setReplacedPartsHistory] = useState<ReplacedPartHistory[]>([
    {
      id: 'rph-1',
      vehicleId: '1',
      vehicleName: 'Honda Vision 2026',
      licensePlate: '43E1-73737',
      replacedAt: '20/11/2026',
      partName: 'Dầu nhớt Motul Scooter Expert LE 10W40 (0.8L)',
      partCode: 'PT-OIL-01',
      quantity: 1,
      unitPrice: 120000,
      laborFee: 20000,
      total: 140000,
      technician: 'Nguyễn Văn Minh',
      reason: 'Bảo dưỡng định kỳ mốc 12.000 km',
      warrantyUntil: '15/12/2026 (1.500 km)',
      beforeImage: SAMPLE_PROOF_IMAGES.cleanBefore,
      afterImage: SAMPLE_PROOF_IMAGES.cleanAfter
    },
    {
      id: 'rph-2',
      vehicleId: '1',
      vehicleName: 'Honda Vision 2026',
      licensePlate: '43E1-73737',
      replacedAt: '15/10/2026',
      partName: 'Má phanh đĩa trước Nissin chính hãng Honda',
      partCode: 'PT-BRK-01',
      quantity: 1,
      unitPrice: 180000,
      laborFee: 30000,
      total: 210000,
      technician: 'Nguyễn Văn Minh',
      reason: 'Má phanh mòn kim loại phát tiếng kêu rít',
      warrantyUntil: '15/04/2027 (6 tháng)',
      beforeImage: SAMPLE_PROOF_IMAGES.brakeBefore,
      afterImage: SAMPLE_PROOF_IMAGES.brakeAfter
    },
    {
      id: 'rph-3',
      vehicleId: '2',
      vehicleName: 'Honda Air Blade 125cc',
      licensePlate: '43B1-123.45',
      replacedAt: '12/11/2026',
      partName: 'Dây Curoa truyền động Bando Honda chính hãng',
      partCode: 'PT-BEL-01',
      quantity: 1,
      unitPrice: 280000,
      laborFee: 50000,
      total: 330000,
      technician: 'Nguyễn Văn Minh',
      reason: 'Xe bị giật cục khi tăng tốc ở dải tốc độ 20-30km/h',
      warrantyUntil: '12/11/2027 (1 năm)',
      beforeImage: SAMPLE_PROOF_IMAGES.cleanBefore,
      afterImage: SAMPLE_PROOF_IMAGES.cleanAfter
    },
    {
      id: 'rph-4',
      vehicleId: '2',
      vehicleName: 'Honda Air Blade 125cc',
      licensePlate: '43B1-123.45',
      replacedAt: '05/11/2026',
      partName: 'Lốp không săm Michelin City Extra (Sau 90/90-14)',
      partCode: 'PT-TIR-02',
      quantity: 1,
      unitPrice: 520000,
      laborFee: 40000,
      total: 560000,
      technician: 'Nguyễn Văn Minh',
      reason: 'Lốp cũ bị dính đinh to rách mép talon',
      warrantyUntil: '05/11/2027 (1 năm)',
      beforeImage: SAMPLE_PROOF_IMAGES.tireBefore,
      afterImage: SAMPLE_PROOF_IMAGES.tireAfter
    }
  ]);

  // Bộ chọn phụ tùng & Báo giá tạm thời (Quote Builder)
  const [selectedQuoteBikeId, setSelectedQuoteBikeId] = useState<string>('');
  const [quoteParts, setQuoteParts] = useState<{ partId: string; quantity: number }[]>([]);
  const [quoteCustomNote, setQuoteCustomNote] = useState('');
  const [quoteVehicleHistoryFilter, setQuoteVehicleHistoryFilter] = useState<string>('all');
  const [partsActiveSubTab, setPartsActiveSubTab] = useState<'catalog' | 'quotation' | 'bikeHistory'>('quotation');

  // Module 2.8: Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: 'nt-1', title: 'Lịch bảo dưỡng định kỳ xe Honda Vision (43C1-888.88)', time: '10 phút trước', unread: true, type: 'maintenance' },
    { id: 'nt-2', title: 'Yêu cầu sửa chữa khẩn cấp #SC001 vừa được tạo', time: '1 giờ trước', unread: true, type: 'repair' },
    { id: 'nt-3', title: 'Công việc kiểm định an toàn bàn giao xe #DH028', time: 'Hôm nay 08:30', unread: false, type: 'task' },
    { id: 'nt-4', title: 'Nhắc nhở: 2 xe máy có lịch bảo dưỡng quá hạn 3 ngày', time: 'Hôm qua', unread: false, type: 'overdue' }
  ]);

  // Modal Dialogs
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState<VehicleItem | null>(null);
  const [selectedMaintenanceDetail, setSelectedMaintenanceDetail] = useState<MaintenanceRecord | null>(null);
  const [selectedRepairDetail, setSelectedRepairDetail] = useState<RepairRequest | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showCreateMaintenanceModal, setShowCreateMaintenanceModal] = useState(false);
  const [showProofComparisonModal, setShowProofComparisonModal] = useState<{
    title: string;
    subtitle: string;
    beforeImg?: string;
    afterImg?: string;
    notes?: string;
  } | null>(null);

  // Form: Create Maintenance
  const [formMaintVehicleId, setFormMaintVehicleId] = useState('');
  const [formMaintTitle, setFormMaintTitle] = useState('');
  const [formMaintType, setFormMaintType] = useState('routine');
  const [formMaintDate, setFormMaintDate] = useState('2026-11-25');
  const [formMaintCost, setFormMaintCost] = useState(150000);
  const [formMaintNotes, setFormMaintNotes] = useState('');
  const [formMaintBeforeImg, setFormMaintBeforeImg] = useState<string>('');
  const [formMaintAfterImg, setFormMaintAfterImg] = useState<string>('');
  const [formMaintSelectedParts, setFormMaintSelectedParts] = useState<string[]>([]);

  // Form: Create Inspection Checklist with Before/After Photos
  const [chkVehicleId, setChkVehicleId] = useState('');
  const [chkOdometer, setChkOdometer] = useState(15000);
  const [chkBrakes, setChkBrakes] = useState(true);
  const [chkTires, setChkTires] = useState(true);
  const [chkLights, setChkLights] = useState(true);
  const [chkEngine, setChkEngine] = useState(true);
  const [chkBody, setChkBody] = useState(true);
  const [chkResult, setChkResult] = useState<'passed' | 'need_maintenance' | 'need_repair' | 'unfit_for_rent'>('passed');
  const [chkNotes, setChkNotes] = useState('');
  const [chkBeforeImg, setChkBeforeImg] = useState<string>('');
  const [chkAfterImg, setChkAfterImg] = useState<string>('');

  // Form: Profile Management
  const [profName, setProfName] = useState(user?.fullName || 'Nguyễn Văn Minh');
  const [profPhone, setProfPhone] = useState(user?.phone || '0905 999 888');
  const [profEmail, setProfEmail] = useState(user?.email || 'technician@motobike.vn');
  const [profOldPass, setProfOldPass] = useState('');
  const [profNewPass, setProfNewPass] = useState('');

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
        if (!selectedQuoteBikeId && vRes.data.data.length > 0) {
          setSelectedQuoteBikeId(vRes.data.data[0]._id);
        }
      }
      if (mRes.data?.data) {
        // Enriched with before/after sample images if empty
        const enriched = mRes.data.data.map((m: any, idx: number) => ({
          ...m,
          beforeImage: m.beforeImage || (idx % 2 === 0 ? SAMPLE_PROOF_IMAGES.cleanBefore : SAMPLE_PROOF_IMAGES.brakeBefore),
          afterImage: m.afterImage || (m.status === 'completed' ? SAMPLE_PROOF_IMAGES.cleanAfter : undefined)
        }));
        setMaintenances(enriched);
      }
    } catch (err: any) {
      try {
        const pubRes = await api.get('/vehicles/public');
        if (pubRes.data?.data) {
          setVehicles(pubRes.data.data);
          if (!selectedQuoteBikeId && pubRes.data.data.length > 0) {
            setSelectedQuoteBikeId(pubRes.data.data[0]._id);
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

  // 2.1. Thống kê Dashboard
  const stats = useMemo(() => {
    const assignedBikes = vehicles.length || 9;
    const needMaint = maintenances.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length;
    const inRep = repairs.filter(r => r.status === 'in_progress' || r.status === 'waiting_parts').length;
    const completedMaint = maintenances.filter(m => m.status === 'completed').length;
    const pendingTasks = repairs.filter(r => r.status === 'pending').length + maintenances.filter(m => m.status === 'scheduled').length;

    return {
      assignedBikes,
      needMaint,
      inRep,
      completedMaint,
      pendingTasks
    };
  }, [vehicles, maintenances, repairs]);

  // Live Quote Calculations
  const quoteSummary = useMemo(() => {
    let totalPartsPrice = 0;
    let totalLaborFee = 0;
    const items = quoteParts.map(qp => {
      const part = PARTS_CATALOG.find(p => p.id === qp.partId);
      if (!part) return null;
      const partTotal = part.unitPrice * qp.quantity;
      const laborTotal = part.laborFee * qp.quantity;
      totalPartsPrice += partTotal;
      totalLaborFee += laborTotal;
      return {
        ...part,
        quantity: qp.quantity,
        partTotal,
        laborTotal,
        lineTotal: partTotal + laborTotal
      };
    }).filter(Boolean);

    const grandTotal = totalPartsPrice + totalLaborFee;
    return {
      items,
      totalPartsPrice,
      totalLaborFee,
      grandTotal
    };
  }, [quoteParts]);

  // Actions
  const handleCompleteMaintenance = async (id: string, customAfterImg?: string) => {
    try {
      await api.put(`/maintenance/${id}`, { status: 'completed' });
    } catch (e) {}
    setMaintenances(prev => prev.map(m => m._id === id ? {
      ...m,
      status: 'completed',
      afterImage: customAfterImg || SAMPLE_PROOF_IMAGES.cleanAfter
    } : m));
    toast.success('Đã lưu ảnh minh chứng nghiệm thu và hoàn thành phiếu bảo dưỡng!');
    if (selectedMaintenanceDetail) setSelectedMaintenanceDetail(null);
  };

  const handleUpdateRepairStatus = (repairId: string, nextStatus: RepairRequest['status']) => {
    setRepairs(prev => prev.map(r => {
      if (r.id === repairId) {
        return {
          ...r,
          status: nextStatus,
          afterImage: nextStatus === 'completed' ? (r.afterImage || SAMPLE_PROOF_IMAGES.brakeAfter) : r.afterImage,
          completedAt: nextStatus === 'completed' ? new Date().toLocaleString('vi-VN') : r.completedAt
        };
      }
      return r;
    }));
    toast.success('Đã cập nhật trạng thái sửa chữa & lưu vết minh chứng!');
    if (selectedRepairDetail) {
      setSelectedRepairDetail(prev => prev ? {
        ...prev,
        status: nextStatus,
        afterImage: nextStatus === 'completed' ? (prev.afterImage || SAMPLE_PROOF_IMAGES.brakeAfter) : prev.afterImage
      } : null);
    }
  };

  // Helper convert File to Base64 preview
  const handleImageUpload = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find(v => v._id === chkVehicleId);
    if (!veh) {
      toast.error('Vui lòng chọn xe để kiểm tra');
      return;
    }
    const newRecord: VehicleCheckRecord = {
      id: `chk-${Date.now()}`,
      checkCode: `KT${Date.now().toString().slice(-6)}`,
      vehicleId: veh._id,
      vehicleName: veh.name,
      licensePlate: veh.licensePlate,
      odometer: chkOdometer,
      checkedAt: new Date().toLocaleString('vi-VN'),
      checkType: 'routine',
      brakes: chkBrakes,
      tires: chkTires,
      lightsAndHorn: chkLights,
      engine: chkEngine,
      mirrorsAndBody: chkBody,
      notes: chkNotes || 'Đã kiểm tra an toàn theo quy chuẩn kỹ thuật',
      result: chkResult,
      inspectorName: user?.fullName || 'Nguyễn Văn Minh',
      beforeImage: chkBeforeImg || SAMPLE_PROOF_IMAGES.cleanBefore,
      afterImage: chkAfterImg || (chkResult === 'passed' ? SAMPLE_PROOF_IMAGES.cleanAfter : undefined)
    };
    setInspections([newRecord, ...inspections]);
    setShowInspectionModal(false);
    toast.success(`Đã lưu phiếu kiểm định xe ${veh.licensePlate} kèm ảnh minh chứng đối chứng!`);
  };

  // Quote Builder Helpers
  const handleTogglePartInQuote = (partId: string) => {
    setQuoteParts(prev => {
      const exists = prev.find(p => p.partId === partId);
      if (exists) {
        return prev.filter(p => p.partId !== partId);
      } else {
        return [...prev, { partId, quantity: 1 }];
      }
    });
  };

  const handleChangePartQuantity = (partId: string, delta: number) => {
    setQuoteParts(prev => prev.map(p => {
      if (p.partId === partId) {
        const nextQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: nextQty };
      }
      return p;
    }));
  };

  const handleSaveQuoteAndApply = () => {
    const veh = vehicles.find(v => v._id === selectedQuoteBikeId);
    if (!veh) {
      toast.error('Vui lòng chọn xe cần lập báo giá');
      return;
    }
    if (quoteParts.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất 1 linh kiện cần thay');
      return;
    }

    // Ghi nhận vào lịch sử phụ tùng thay thế của xe
    const newHistoryItems: ReplacedPartHistory[] = quoteParts.map(qp => {
      const part = PARTS_CATALOG.find(p => p.id === qp.partId)!;
      return {
        id: `rph-${Date.now()}-${part.id}`,
        vehicleId: veh._id,
        vehicleName: veh.name,
        licensePlate: veh.licensePlate,
        replacedAt: new Date().toLocaleDateString('vi-VN'),
        partName: part.name,
        partCode: part.code,
        quantity: qp.quantity,
        unitPrice: part.unitPrice,
        laborFee: part.laborFee,
        total: (part.unitPrice + part.laborFee) * qp.quantity,
        technician: user?.fullName || 'Nguyễn Văn Minh',
        reason: quoteCustomNote || 'Thay thế bảo dưỡng theo phiếu báo giá kỹ thuật',
        warrantyUntil: part.warranty,
        beforeImage: SAMPLE_PROOF_IMAGES.brakeBefore,
        afterImage: SAMPLE_PROOF_IMAGES.brakeAfter
      };
    });

    setReplacedPartsHistory(prev => [...newHistoryItems, ...prev]);
    toast.success(`Đã lập và lưu phiếu báo giá ${quoteSummary.grandTotal.toLocaleString()}đ cho xe ${veh.licensePlate}!`);
    setQuoteParts([]);
    setQuoteCustomNote('');
    setPartsActiveSubTab('bikeHistory');
    setQuoteVehicleHistoryFilter(veh._id);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Đã lưu thông tin tài khoản cá nhân!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profNewPass || profNewPass.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    toast.success('Đã cập nhật mật khẩu mới thành công!');
    setProfOldPass('');
    setProfNewPass('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: 'inherit' }}>
      
      {/* ========================================================
          1. SIDEBAR (Brand: XTMotoBike Kỹ Thuật - Royal Blue Navy)
          ======================================================== */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '72px',
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
        <div>
          {/* Brand Header */}
          <div
            style={{
              padding: '18px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                flexShrink: 0
              }}
            >
              <Wrench size={20} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '-0.3px', color: '#ffffff' }}>
                  XTMoto<span style={{ color: '#38bdf8' }}>Tech</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Cổng Kỹ Thuật & Bảo Dưỡng
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            
            {/* 2.1 Trang chủ */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'home' ? '#2563eb' : 'transparent',
                color: activeTab === 'home' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'home' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Bike size={18} />
              {sidebarOpen && <span>Trang chủ</span>}
            </button>

            {/* 2.2 Quản lý xe */}
            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'vehicles' ? '#2563eb' : 'transparent',
                color: activeTab === 'vehicles' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'vehicles' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Gauge size={18} />
              {sidebarOpen && <span>Quản lý xe ({vehicles.length})</span>}
            </button>

            {/* 2.3 Quản lý bảo dưỡng */}
            <button
              type="button"
              onClick={() => setActiveTab('maintenance')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
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
              {sidebarOpen && <span>Quản lý bảo dưỡng ({maintenances.length})</span>}
            </button>

            {/* 2.4 Quản lý sửa chữa */}
            <button
              type="button"
              onClick={() => setActiveTab('repairs')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'repairs' ? '#2563eb' : 'transparent',
                color: activeTab === 'repairs' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'repairs' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <AlertTriangle size={18} />
              {sidebarOpen && <span>Quản lý sửa chữa ({repairs.filter(r => r.status !== 'completed').length})</span>}
            </button>

            {/* 2.5 Kiểm tra tình trạng xe */}
            <button
              type="button"
              onClick={() => setActiveTab('inspection')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'inspection' ? '#2563eb' : 'transparent',
                color: activeTab === 'inspection' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'inspection' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <ClipboardCheck size={18} />
              {sidebarOpen && <span>Kiểm tra xe ({inspections.length})</span>}
            </button>

            {/* MỚI: Phụ tùng & Báo giá thay thế */}
            <button
              type="button"
              onClick={() => setActiveTab('parts')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'parts' ? '#2563eb' : 'rgba(37,99,235,0.08)',
                color: activeTab === 'parts' ? '#ffffff' : '#38bdf8',
                fontWeight: activeTab === 'parts' ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: activeTab === 'parts' ? '3px solid #38bdf8' : '3px solid transparent'
              }}
            >
              <Package size={18} />
              {sidebarOpen && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Phụ tùng & Báo giá</span>
                  <span style={{ background: '#38bdf8', color: '#0f172a', fontSize: '10px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px' }}>HOT</span>
                </div>
              )}
            </button>

            {/* 2.6 Lịch sử bảo dưỡng & sửa chữa */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
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
              {sidebarOpen && <span>Lịch sử kỹ thuật</span>}
            </button>

            {/* 2.7 Báo cáo thống kê */}
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
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
              {sidebarOpen && <span>Báo cáo thống kê</span>}
            </button>

            {/* 2.8 Thông báo */}
            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeTab === 'notifications' ? '#2563eb' : 'transparent',
                color: activeTab === 'notifications' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'notifications' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={18} />
                {sidebarOpen && <span>Thông báo</span>}
              </div>
              {sidebarOpen && (
                <span style={{ background: '#ef4444', color: '#ffffff', borderRadius: '10px', padding: '1px 6px', fontSize: '10px', fontWeight: 800 }}>
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
            </button>

            {/* 2.9 Tài khoản cá nhân */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '10px',
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
              {sidebarOpen && <span>Tài khoản cá nhân</span>}
            </button>
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1e293b', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '13px' }}>
              NV
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {user?.fullName || 'Nguyễn Văn Minh'}
                </div>
                <div style={{ fontSize: '11px', color: '#60a5fa' }}>
                  Kỹ thuật viên chuyên trách
                </div>
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
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              fontSize: '12px',
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
          2. MAIN CONTENT
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={20} />
            </button>

            <div style={{ position: 'relative', width: '340px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm kiếm xe, biển số, phụ tùng thay..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              onClick={loadData}
              title="Tải lại dữ liệu thật"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <RefreshCw size={15} color="#475569" className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Bell size={16} color="#475569" />
              {notifications.some(n => n.unread) && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              )}
            </button>

            <div
              onClick={() => setActiveTab('profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12.5px' }}>
                M
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {user?.fullName || 'Nguyễn Văn Minh'}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main style={{ padding: '24px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          
          {/* Header Title with quick buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                {activeTab === 'home' && '2.1. Bảng điều khiển Kỹ thuật viên (Dashboard)'}
                {activeTab === 'vehicles' && '2.2. Quản lý danh sách & Tình trạng xe'}
                {activeTab === 'maintenance' && '2.3. Quản lý lịch & Phiếu bảo dưỡng xe'}
                {activeTab === 'repairs' && '2.4. Quản lý yêu cầu & Tiến độ sửa chữa'}
                {activeTab === 'inspection' && '2.5. Phiếu kiểm tra xe kèm Ảnh minh chứng đối chứng'}
                {activeTab === 'parts' && 'Kho Phụ tùng thay thế & Báo giá kỹ thuật'}
                {activeTab === 'history' && '2.6. Lịch sử bảo dưỡng, sửa chữa & Thay thế linh kiện'}
                {activeTab === 'reports' && '2.7. Báo cáo thống kê hiệu suất & Chi phí'}
                {activeTab === 'notifications' && '2.8. Trung tâm thông báo kỹ thuật'}
                {activeTab === 'profile' && '2.9. Quản lý tài khoản cá nhân'}
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Hệ thống vận hành tiêu chuẩn: Kiểm tra đối chứng ảnh Trước/Sau - Quản lý phụ tùng thay thế & Báo giá XTMotoBike
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('parts')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Package size={16} />
                <span>Báo giá phụ tùng</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInspectionModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
                }}
              >
                <ClipboardCheck size={16} />
                <span>+ Kiểm tra xe (Có ảnh)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCreateMaintenanceModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Plus size={16} />
                <span>+ Lập phiếu bảo dưỡng</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              MODULE 2.1: TRANG CHỦ (DASHBOARD)
              ======================================================== */}
          {activeTab === 'home' && (
            <>
              {/* 5 Thẻ thống kê chuẩn đặc tả 2.1 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '22px' }}>
                
                {/* 1. Tổng số xe được phân công */}
                <div
                  onClick={() => setActiveTab('vehicles')}
                  style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}
                >
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Xe được phân công</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px' }}>{stats.assignedBikes}</div>
                  <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>🛵 Toàn bộ đội xe</div>
                </div>

                {/* 2. Số xe cần bảo dưỡng */}
                <div
                  onClick={() => setActiveTab('maintenance')}
                  style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}
                >
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Xe cần bảo dưỡng</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#ea580c', margin: '4px 0 2px' }}>{stats.needMaint}</div>
                  <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 700 }}>🔧 Đến chu kỳ kiểm tra</div>
                </div>

                {/* 3. Số xe đang sửa chữa */}
                <div
                  onClick={() => setActiveTab('repairs')}
                  style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}
                >
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Xe đang sửa chữa</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', margin: '4px 0 2px' }}>{stats.inRep}</div>
                  <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>🛠️ Đang thay phụ tùng</div>
                </div>

                {/* 4. Số xe đã hoàn thành bảo dưỡng */}
                <div
                  onClick={() => setActiveTab('history')}
                  style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}
                >
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Đã hoàn thành bảo dưỡng</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', margin: '4px 0 2px' }}>{stats.completedMaint}</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>✓ Sẵn sàng xuất bến</div>
                </div>

                {/* 5. Số công việc chưa xử lý */}
                <div
                  onClick={() => setActiveTab('maintenance')}
                  style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.02)' }}
                >
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Công việc chưa xử lý</div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', margin: '4px 0 2px' }}>{stats.pendingTasks}</div>
                  <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>⏳ Cần tiếp nhận xử lý</div>
                </div>
              </div>

              {/* Lịch bảo dưỡng sắp tới & Công việc đang thực hiện */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '22px' }}>
                
                {/* Lịch bảo dưỡng sắp tới */}
                <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      <Calendar size={17} color="#2563eb" />
                      <span>Lịch bảo dưỡng sắp tới</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('maintenance')}
                      style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Xem tất cả &rarr;
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {maintenances.slice(0, 4).map((m) => (
                      <div
                        key={m._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          borderRadius: '10px',
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                            {m.vehicle?.name || 'Xe máy'} ({m.vehicle?.licensePlate || '43-ĐN'})
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {m.title} • {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString('vi-VN') : '25/11/2026'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: m.status === 'completed' ? '#f0fdf4' : m.status === 'in_progress' ? '#eff6ff' : '#fff7ed',
                              color: m.status === 'completed' ? '#16a34a' : m.status === 'in_progress' ? '#2563eb' : '#ea580c'
                            }}
                          >
                            {m.status === 'completed' && 'Hoàn thành'}
                            {m.status === 'in_progress' && 'Đang thực hiện'}
                            {m.status === 'scheduled' && 'Chờ thực hiện'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedMaintenanceDetail(m)}
                            style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11.5px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phụ tùng thay thế & Báo giá nhanh */}
                <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      <Package size={17} color="#0284c7" />
                      <span>Tra cứu phụ tùng & Báo giá thay thế</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('parts')}
                      style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Mở bảng giá &rarr;
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {PARTS_CATALOG.slice(0, 3).map(pt => (
                      <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0369a1' }}>{pt.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Mã: {pt.code} • Bảo hành: {pt.warranty}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>{pt.unitPrice.toLocaleString()}đ</div>
                          <div style={{ fontSize: '10.5px', color: '#16a34a' }}>Kho: {pt.stock} cái</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('parts')}
                    style={{ width: '100%', padding: '9px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <DollarSign size={15} />
                    <span>Lập báo giá phụ tùng cho khách</span>
                  </button>
                </div>

              </div>

              {/* Banner Quy chuẩn Kỹ thuật với ảnh đối chứng */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  borderRadius: '18px',
                  padding: '20px 24px',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 20px rgba(37,99,235,0.18)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldCheck size={20} color="#60a5fa" />
                    <span style={{ fontSize: '15px', fontWeight: 900 }}>Quy chuẩn Minh chứng Đối chứng Ảnh (Trước & Sau)</span>
                  </div>
                  <p style={{ fontSize: '12.5px', opacity: 0.9, margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
                    Mọi phiếu kiểm định xe, bảo dưỡng định kỳ và sửa chữa đều phải chụp ảnh hiện trạng Trước khi làm và Sau khi hoàn thành để đối chứng minh bạch với khách hàng và quản lý.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(true)}
                  style={{
                    padding: '9px 18px',
                    background: '#ffffff',
                    color: '#1e3a8a',
                    fontWeight: 800,
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Chụp ảnh kiểm tra ngay
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              MODULE 2.2: QUẢN LÝ XE
              ======================================================== */}
          {activeTab === 'vehicles' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Tra cứu và theo dõi tình trạng kỹ thuật đội xe
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Theo dõi số km đã đi, lịch sử bảo dưỡng và xem lịch sử các phụ tùng đã thay thế của từng xe
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['all', 'available', 'rented', 'maintenance', 'broken'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterVehicleStatus(st)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: filterVehicleStatus === st ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: filterVehicleStatus === st ? '#eff6ff' : '#ffffff',
                        color: filterVehicleStatus === st ? '#2563eb' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {st === 'all' && 'Tất cả'}
                      {st === 'available' && 'Sẵn sàng'}
                      {st === 'rented' && 'Đang cho thuê'}
                      {st === 'maintenance' && 'Đang bảo dưỡng'}
                      {st === 'broken' && 'Cần sửa chữa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Danh sách xe 2.2 */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Mã xe</th>
                      <th style={{ padding: '12px' }}>Tên xe & Hãng</th>
                      <th style={{ padding: '12px' }}>Biển số</th>
                      <th style={{ padding: '12px' }}>Loại xe</th>
                      <th style={{ padding: '12px' }}>Số km (Odo)</th>
                      <th style={{ padding: '12px' }}>Tình trạng</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles
                      .filter(v => filterVehicleStatus === 'all' || v.status === filterVehicleStatus)
                      .filter(v => !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((veh) => (
                        <tr key={veh._id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#64748b' }}>
                            #{veh._id.slice(-6).toUpperCase()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{veh.name}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{veh.brand} ({veh.year || 2024})</div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>
                            {veh.licensePlate}
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {veh.type}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                            {(veh.odometer || 12000).toLocaleString('vi-VN')} km
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: veh.status === 'available' ? '#f0fdf4' : veh.status === 'rented' ? '#eff6ff' : veh.status === 'maintenance' ? '#fef3c7' : '#fef2f2',
                                color: veh.status === 'available' ? '#16a34a' : veh.status === 'rented' ? '#2563eb' : veh.status === 'maintenance' ? '#b45309' : '#dc2626'
                              }}
                            >
                              {veh.status === 'available' && '✓ Sẵn sàng'}
                              {veh.status === 'rented' && '🛵 Đang cho thuê'}
                              {veh.status === 'maintenance' && '🔧 Đang bảo dưỡng'}
                              {veh.status === 'broken' && '⚠️ Cần sửa chữa'}
                              {veh.status === 'reserved' && '⏳ Đã đặt trước'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedVehicleDetail(veh)}
                                style={{ padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Chi tiết kỹ thuật
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedQuoteBikeId(veh._id);
                                  setQuoteVehicleHistoryFilter(veh._id);
                                  setActiveTab('parts');
                                  setPartsActiveSubTab('bikeHistory');
                                }}
                                style={{ padding: '5px 10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                title="Xem các phụ tùng xe này đã thay thế"
                              >
                                Xem phụ tùng đã thay
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 2.3: QUẢN LÝ BẢO DƯỠNG (QUAN TRỌNG NHẤT)
              ======================================================== */}
          {activeTab === 'maintenance' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Quy trình tiếp nhận, cập nhật tiến độ & hoàn thành bảo dưỡng
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Theo dõi đầy đủ mã phiếu, hạng mục, kỹ thuật viên, chi phí, phụ tùng và ảnh đối chứng Trước/Sau
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setMaintSubTab('schedule')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: maintSubTab === 'schedule' ? '#2563eb' : '#f1f5f9',
                      color: maintSubTab === 'schedule' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Tất cả phiếu bảo dưỡng ({maintenances.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaintSubTab('upcoming')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: maintSubTab === 'upcoming' ? '#2563eb' : '#f1f5f9',
                      color: maintSubTab === 'upcoming' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Lịch bảo dưỡng sắp tới ({maintenances.filter(m => m.status !== 'completed').length})
                  </button>
                </div>
              </div>

              {/* Table Phiếu bảo dưỡng */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Mã phiếu</th>
                      <th style={{ padding: '12px' }}>Xe cần bảo dưỡng</th>
                      <th style={{ padding: '12px' }}>Hạng mục & Ảnh minh chứng</th>
                      <th style={{ padding: '12px' }}>Kỹ thuật viên</th>
                      <th style={{ padding: '12px' }}>Chi phí</th>
                      <th style={{ padding: '12px' }}>Trạng thái</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances
                      .filter(m => maintSubTab === 'schedule' || m.status !== 'completed')
                      .map((item) => (
                        <tr key={item._id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>
                            BD{item._id.slice(-6).toUpperCase()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.vehicle?.name || 'Xe Máy'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{item.vehicle?.licensePlate || '43-ĐN'}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ color: '#0f172a', fontWeight: 700 }}>{item.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              {item.beforeImage && (
                                <button
                                  type="button"
                                  onClick={() => setShowProofComparisonModal({
                                    title: `Đối chứng ảnh: ${item.title}`,
                                    subtitle: `Xe ${item.vehicle?.name || ''} - Biển số ${item.vehicle?.licensePlate || ''}`,
                                    beforeImg: item.beforeImage,
                                    afterImg: item.afterImage,
                                    notes: item.notes || item.description
                                  })}
                                  style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Camera size={12} />
                                  <span>{item.afterImage ? 'Ảnh Trước & Sau' : 'Ảnh Hiện trạng'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {item.technician?.fullName || user?.fullName || 'Nguyễn Văn Minh'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {(item.cost || 150000).toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: item.status === 'completed' ? '#f0fdf4' : item.status === 'in_progress' ? '#eff6ff' : '#fff7ed',
                                color: item.status === 'completed' ? '#16a34a' : item.status === 'in_progress' ? '#2563eb' : '#ea580c'
                              }}
                            >
                              {item.status === 'completed' && 'Hoàn thành'}
                              {item.status === 'in_progress' && 'Đang thực hiện'}
                              {item.status === 'scheduled' && 'Chờ xử lý'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedMaintenanceDetail(item)}
                                style={{ padding: '5px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Chi tiết
                              </button>
                              {item.status !== 'completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteMaintenance(item._id)}
                                  style={{ padding: '5px 10px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  ✓ Hoàn thành
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
          )}

          {/* ========================================================
              MODULE 2.4: QUẢN LÝ SỬA CHỮA
              ======================================================== */}
          {activeTab === 'repairs' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Tiếp nhận và xử lý yêu cầu sửa chữa
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Kiểm tra xác định lỗi, ghi nhận linh kiện phụ tùng thay thế và ảnh minh chứng Trước/Sau
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {repairs.map(r => (
                  <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#2563eb' }}>Mã: {r.code}</span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: r.status === 'completed' ? '#f0fdf4' : r.status === 'in_progress' ? '#eff6ff' : r.status === 'waiting_parts' ? '#fef3c7' : '#fff7ed',
                            color: r.status === 'completed' ? '#16a34a' : r.status === 'in_progress' ? '#2563eb' : r.status === 'waiting_parts' ? '#b45309' : '#ea580c'
                          }}
                        >
                          {r.status === 'pending' && 'Chờ tiếp nhận'}
                          {r.status === 'accepted' && 'Đã tiếp nhận'}
                          {r.status === 'in_progress' && 'Đang sửa chữa'}
                          {r.status === 'waiting_parts' && 'Chờ linh kiện'}
                          {r.status === 'completed' && 'Đã hoàn thành'}
                          {r.status === 'unfixable' && 'Không thể sửa chữa'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                        {r.vehicleName}
                      </h3>
                      <div style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 700, marginBottom: '8px' }}>
                        Biển số: {r.licensePlate}
                      </div>

                      <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5, marginBottom: '6px' }}>
                        <strong>Lỗi phát sinh:</strong> {r.issue}
                      </div>
                      {r.cause && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                          <strong>Nguyên nhân:</strong> {r.cause}
                        </div>
                      )}
                      
                      {/* Phụ tùng thay thế */}
                      {r.partsUsed.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#0369a1', background: '#e0f2fe', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                          <strong>🔧 Phụ tùng đã chọn thay:</strong> {r.partsUsed.join(', ')}
                        </div>
                      )}

                      {/* Nút xem ảnh đối chứng */}
                      {r.beforeImage && (
                        <button
                          type="button"
                          onClick={() => setShowProofComparisonModal({
                            title: `Đối chứng sửa chữa: ${r.code} - ${r.vehicleName}`,
                            subtitle: `Vấn đề: ${r.issue}`,
                            beforeImg: r.beforeImage,
                            afterImg: r.afterImage,
                            notes: r.solution || r.cause
                          })}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            background: '#ffffff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            color: '#2563eb',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginBottom: '8px'
                          }}
                        >
                          <Camera size={14} />
                          <span>Đối chứng ảnh Trước & Sau khi sửa</span>
                        </button>
                      )}

                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                        Chi phí sửa chữa: {r.estimatedCost.toLocaleString('vi-VN')}đ
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                      {r.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRepairStatus(r.id, 'accepted')}
                          style={{ flex: 1, padding: '7px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Tiếp nhận sửa chữa
                        </button>
                      )}
                      {r.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRepairStatus(r.id, 'in_progress')}
                          style={{ flex: 1, padding: '7px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Bắt đầu sửa chữa
                        </button>
                      )}
                      {r.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateRepairStatus(r.id, 'completed')}
                          style={{ flex: 1, padding: '7px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✓ Nghiệm thu hoàn thành
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedRepairDetail(r)}
                        style={{ padding: '7px 12px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 2.5: KIỂM TRA TÌNH TRẠNG XE (KÈM ẢNH MINH CHỨNG)
              ======================================================== */}
          {activeTab === 'inspection' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Kiểm soát an toàn xe kèm Ảnh minh chứng đối chứng (Trước & Sau)
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Kiểm tra 5 tiêu chí kỹ thuật: Phanh, Lốp xe, Đèn còi, Động cơ, Gương dàn áo và lưu trữ ảnh chụp thực tế
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(true)}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ClipboardCheck size={16} />
                  <span>+ Lập phiếu kiểm tra mới</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                {inspections.map(ins => (
                  <div key={ins.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb' }}>{ins.checkCode}</span>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: ins.result === 'passed' ? '#f0fdf4' : ins.result === 'need_maintenance' ? '#eff6ff' : '#fff7ed',
                            color: ins.result === 'passed' ? '#16a34a' : ins.result === 'need_maintenance' ? '#2563eb' : '#ea580c'
                          }}
                        >
                          {ins.result === 'passed' && '✓ Đạt yêu cầu'}
                          {ins.result === 'need_maintenance' && '🔧 Cần bảo dưỡng'}
                          {ins.result === 'need_repair' && '⚠️ Cần sửa chữa'}
                          {ins.result === 'unfit_for_rent' && '⛔ Không đủ điều kiện'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                        {ins.vehicleName} ({ins.licensePlate})
                      </h3>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '10px' }}>
                        Odo: {ins.odometer.toLocaleString()} km • Thời gian: {ins.checkedAt}
                      </div>

                      {/* 5 Hạng mục kiểm tra */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                        <div>{ins.brakes ? '✅' : '❌'} Hệ thống phanh</div>
                        <div>{ins.tires ? '✅' : '❌'} Lốp xe & áp suất</div>
                        <div>{ins.lightsAndHorn ? '✅' : '❌'} Đèn & còi xe</div>
                        <div>{ins.engine ? '✅' : '❌'} Động cơ vận hành</div>
                        <div style={{ gridColumn: 'span 2' }}>{ins.mirrorsAndBody ? '✅' : '❌'} Gương & bộ phận bên ngoài</div>
                      </div>

                      {/* Hiển thị trực quan 2 ảnh minh chứng đối chứng (Trước và Sau) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          <img
                            src={ins.beforeImage || SAMPLE_PROOF_IMAGES.cleanBefore}
                            alt="Ảnh trước kiểm tra"
                            style={{ width: '100%', height: '95px', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(15,23,42,0.75)', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', textAlign: 'center' }}>
                            📸 Ảnh trước kiểm tra
                          </div>
                        </div>

                        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          {ins.afterImage ? (
                            <>
                              <img
                                src={ins.afterImage}
                                alt="Ảnh sau kiểm tra"
                                style={{ width: '100%', height: '95px', objectFit: 'cover' }}
                              />
                              <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(22,163,74,0.85)', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', textAlign: 'center' }}>
                                ✓ Sau khi hoàn thành
                              </div>
                            </>
                          ) : (
                            <div style={{ height: '95px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', textAlign: 'center', padding: '6px' }}>
                              <Camera size={18} style={{ marginBottom: '4px' }} />
                              <span>Đang chờ ảnh sau xử lý</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '8px' }}>
                        "{ins.notes}"
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '11.5px', color: '#64748b' }}>
                      <div>Kiểm định viên: <strong>{ins.inspectorName}</strong></div>
                      <button
                        type="button"
                        onClick={() => setShowProofComparisonModal({
                          title: `Đối chứng kiểm định: ${ins.vehicleName} (${ins.licensePlate})`,
                          subtitle: `Phiếu #${ins.checkCode} - Odo: ${ins.odometer.toLocaleString()} km`,
                          beforeImg: ins.beforeImage || SAMPLE_PROOF_IMAGES.cleanBefore,
                          afterImg: ins.afterImage,
                          notes: ins.notes
                        })}
                        style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Phóng to so sánh &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE MỚI: KHO PHỤ TÙNG & BÁO GIÁ THAY THẾ (THEO YÊU CẦU CỦA USER)
              "làm chỗ phụ kiện cần thay nhân viên vô đó chọn để xem xe đó đã thay thế gì để báo giá thay kiểu vậy"
              ======================================================== */}
          {activeTab === 'parts' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              
              {/* Header Module Phụ Tùng */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Quản lý Phụ tùng thay thế & Lập báo giá sửa chữa / bảo dưỡng
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Chọn xe tra cứu lịch sử linh kiện đã thay, chọn phụ tùng mới để tính tổng chi phí và báo giá khách hàng
                  </p>
                </div>

                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPartsActiveSubTab('quotation')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: partsActiveSubTab === 'quotation' ? '#2563eb' : '#f1f5f9',
                      color: partsActiveSubTab === 'quotation' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <DollarSign size={15} />
                    <span>Lập báo giá thay thế</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartsActiveSubTab('bikeHistory')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: partsActiveSubTab === 'bikeHistory' ? '#2563eb' : '#f1f5f9',
                      color: partsActiveSubTab === 'bikeHistory' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <History size={15} />
                    <span>Xe đó đã thay thế gì ({replacedPartsHistory.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartsActiveSubTab('catalog')}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: partsActiveSubTab === 'catalog' ? '#2563eb' : '#f1f5f9',
                      color: partsActiveSubTab === 'catalog' ? '#ffffff' : '#475569',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Package size={15} />
                    <span>Kho phụ tùng & Tồn kho ({PARTS_CATALOG.length})</span>
                  </button>
                </div>
              </div>

              {/* 1. SUBTAB: LẬP BÁO GIÁ THAY THẾ (BỘ CHỌN PHỤ KIỆN) */}
              {partsActiveSubTab === 'quotation' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
                  
                  {/* Cột trái: Chọn xe & Danh sách phụ tùng để tích chọn */}
                  <div>
                    {/* Hộp chọn xe */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                        1. Chọn xe cần kiểm tra & thay phụ kiện:
                      </label>
                      <select
                        value={selectedQuoteBikeId}
                        onChange={e => setSelectedQuoteBikeId(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontWeight: 700, background: '#ffffff' }}
                      >
                        {vehicles.map(v => (
                          <option key={v._id} value={v._id}>
                            {v.name} • Biển số: {v.licensePlate} ({v.type} - Odo: {(v.odometer || 12000).toLocaleString()} km)
                          </option>
                        ))}
                      </select>

                      {/* Gợi ý lịch sử phụ tùng đã thay trước đây của xe này */}
                      {selectedQuoteBikeId && (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>
                            Lịch sử: Xe này đã thay{' '}
                            <strong style={{ color: '#2563eb' }}>
                              {replacedPartsHistory.filter(h => h.vehicleId === selectedQuoteBikeId).length} món phụ kiện
                            </strong>{' '}
                            trước đây.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteVehicleHistoryFilter(selectedQuoteBikeId);
                              setPartsActiveSubTab('bikeHistory');
                            }}
                            style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Xem chi tiết các món đã thay &rarr;
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Danh sách các linh kiện có sẵn để kỹ thuật viên tích chọn */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          2. Tích chọn các phụ kiện cần thay mới:
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Đã chọn {quoteParts.length} món
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                        {PARTS_CATALOG.map(part => {
                          const isSelected = quoteParts.some(p => p.partId === part.id);
                          const currentQty = quoteParts.find(p => p.partId === part.id)?.quantity || 1;

                          return (
                            <div
                              key={part.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                background: isSelected ? '#eff6ff' : '#ffffff',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTogglePartInQuote(part.id)}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <div>
                                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                                    {part.name}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                                    Mã: <span style={{ fontWeight: 700, color: '#2563eb' }}>{part.code}</span> • Nhóm: {part.category} • Bảo hành: {part.warranty}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                                    Tương thích: {part.compatible} (Còn {part.stock} cái trong kho)
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a' }}>
                                    {part.unitPrice.toLocaleString('vi-VN')}đ
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    + Công: {part.laborFee.toLocaleString('vi-VN')}đ
                                  </div>
                                </div>

                                {isSelected && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleChangePartQuantity(part.id, -1)}
                                      style={{ width: '24px', height: '24px', border: 'none', background: '#f1f5f9', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                      -
                                    </button>
                                    <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '12.5px', fontWeight: 800 }}>
                                      {currentQty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleChangePartQuantity(part.id, 1)}
                                      style={{ width: '24px', height: '24px', border: 'none', background: '#f1f5f9', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Cột phải: Phiếu báo giá chi tiết (Live Quote Preview) */}
                  <div>
                    <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', position: 'sticky', top: '90px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
                            Phiếu Báo Giá Thay Thế Phụ Kiện
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            XTMotoBike Service Center
                          </div>
                        </div>
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                          Chính hãng 100%
                        </span>
                      </div>

                      {/* Thông tin xe được báo giá */}
                      {selectedQuoteBikeId && (
                        <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '14px' }}>
                          {(() => {
                            const b = vehicles.find(v => v._id === selectedQuoteBikeId);
                            if (!b) return null;
                            return (
                              <>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{b.name}</div>
                                <div style={{ color: '#2563eb', fontWeight: 700 }}>Biển số: {b.licensePlate} • {b.brand}</div>
                                <div style={{ color: '#64748b', fontSize: '11px' }}>Kỹ thuật viên lập: {user?.fullName || 'Nguyễn Văn Minh'}</div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Danh sách các mục tính tiền */}
                      {quoteSummary.items.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                          <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                          Chưa có phụ kiện nào được chọn.<br />Vui lòng tích chọn phụ tùng ở bảng bên trái.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '240px', overflowY: 'auto' }}>
                          {quoteSummary.items.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '12.5px', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                              <div style={{ flex: 1, paddingRight: '8px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {item.name} <span style={{ color: '#2563eb' }}>x{item.quantity}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Giá: {item.unitPrice.toLocaleString()}đ + Công: {item.laborFee.toLocaleString()}đ
                                </div>
                              </div>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                {item.lineTotal.toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ghi chú lý do thay */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                          Ghi chú nguyên nhân / Yêu cầu của khách:
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Khách báo phanh kêu rít, lốp mòn rách..."
                          value={quoteCustomNote}
                          onChange={e => setQuoteCustomNote(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>

                      {/* Bảng tổng kết số tiền */}
                      <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                          <span>Tiền linh kiện phụ tùng:</span>
                          <span style={{ fontWeight: 700 }}>{quoteSummary.totalPartsPrice.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                          <span>Tiền công kỹ thuật thay lắp:</span>
                          <span style={{ fontWeight: 700 }}>{quoteSummary.totalLaborFee.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                          <span>TỔNG TIỀN BÁO GIÁ:</span>
                          <span style={{ color: '#2563eb' }}>{quoteSummary.grandTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>

                      {/* Các nút hành động */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={quoteSummary.items.length === 0}
                          onClick={handleSaveQuoteAndApply}
                          style={{
                            width: '100%',
                            padding: '11px',
                            background: quoteSummary.items.length === 0 ? '#94a3b8' : '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 800,
                            cursor: quoteSummary.items.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Check size={16} />
                          <span>Lưu & Ghi nhận thay thế vào lịch sử xe</span>
                        </button>

                        <button
                          type="button"
                          disabled={quoteSummary.items.length === 0}
                          onClick={() => {
                            toast.success('Đang tạo file PDF phiếu báo giá chi tiết gửi khách...');
                            window.print();
                          }}
                          style={{
                            width: '100%',
                            padding: '9px',
                            background: '#ffffff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            cursor: quoteSummary.items.length === 0 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Printer size={15} />
                          <span>In / Xuất phiếu báo giá gửi khách</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              )}

              {/* 2. SUBTAB: LỊCH SỬ XE ĐÓ ĐÃ THAY THẾ GÌ (ĐỂ TRA CỨU) */}
              {partsActiveSubTab === 'bikeHistory' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Lọc theo xe:</span>
                      <select
                        value={quoteVehicleHistoryFilter}
                        onChange={e => setQuoteVehicleHistoryFilter(e.target.value)}
                        style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                      >
                        <option value="all">-- Tất cả xe trong đội ({vehicles.length}) --</option>
                        {vehicles.map(v => (
                          <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                      Tổng số bản ghi thay thế phụ tùng:{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {replacedPartsHistory.filter(h => quoteVehicleHistoryFilter === 'all' || h.vehicleId === quoteVehicleHistoryFilter).length}
                      </strong>
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                          <th style={{ padding: '12px' }}>Thời gian</th>
                          <th style={{ padding: '12px' }}>Xe & Biển số</th>
                          <th style={{ padding: '12px' }}>Phụ kiện đã thay</th>
                          <th style={{ padding: '12px' }}>SL</th>
                          <th style={{ padding: '12px' }}>Đơn giá + Công</th>
                          <th style={{ padding: '12px' }}>Tổng tiền</th>
                          <th style={{ padding: '12px' }}>Thời hạn bảo hành</th>
                          <th style={{ padding: '12px' }}>Ảnh đối chứng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {replacedPartsHistory
                          .filter(h => quoteVehicleHistoryFilter === 'all' || h.vehicleId === quoteVehicleHistoryFilter)
                          .map((hist) => (
                            <tr key={hist.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                              <td style={{ padding: '12px', fontWeight: 600, color: '#475569' }}>
                                {hist.replacedAt}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>{hist.vehicleName}</div>
                                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>{hist.licensePlate}</div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>{hist.partName}</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Mã: {hist.partCode} • {hist.reason}</div>
                              </td>
                              <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>
                                {hist.quantity}
                              </td>
                              <td style={{ padding: '12px', color: '#475569', fontSize: '12px' }}>
                                {hist.unitPrice.toLocaleString()}đ + {hist.laborFee.toLocaleString()}đ
                              </td>
                              <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>
                                {hist.total.toLocaleString('vi-VN')}đ
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                  ✓ {hist.warrantyUntil}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                {hist.beforeImage ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowProofComparisonModal({
                                      title: `Ảnh đối chứng thay thế phụ tùng`,
                                      subtitle: `${hist.partName} trên xe ${hist.vehicleName} (${hist.licensePlate})`,
                                      beforeImg: hist.beforeImage,
                                      afterImg: hist.afterImage,
                                      notes: hist.reason
                                    })}
                                    style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Camera size={13} />
                                    <span>Xem ảnh</span>
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chưa có ảnh</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 3. SUBTAB: KHO PHỤ TÙNG & TỒN KHO */}
              {partsActiveSubTab === 'catalog' && (
                <div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                          <th style={{ padding: '12px' }}>Mã phụ tùng</th>
                          <th style={{ padding: '12px' }}>Tên phụ tùng chính hãng</th>
                          <th style={{ padding: '12px' }}>Phân loại nhóm</th>
                          <th style={{ padding: '12px' }}>Giá niêm yết</th>
                          <th style={{ padding: '12px' }}>Tiền công lắp</th>
                          <th style={{ padding: '12px' }}>Bảo hành</th>
                          <th style={{ padding: '12px' }}>Tồn kho</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PARTS_CATALOG.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                            <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>{item.code}</td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>Thích hợp: {item.compatible}</div>
                            </td>
                            <td style={{ padding: '12px', color: '#475569' }}>{item.category}</td>
                            <td style={{ padding: '12px', fontWeight: 900, color: '#0f172a' }}>{item.unitPrice.toLocaleString()}đ</td>
                            <td style={{ padding: '12px', color: '#64748b' }}>{item.laborFee.toLocaleString()}đ</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                {item.warranty}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 800, color: item.stock < 15 ? '#ea580c' : '#16a34a' }}>
                              {item.stock} cái
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setPartsActiveSubTab('quotation');
                                  handleTogglePartInQuote(item.id);
                                }}
                                style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Thêm vào báo giá
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================
              MODULE 2.6: LỊCH SỬ BẢO DƯỠNG & SỬA CHỮA
              ======================================================== */}
          {activeTab === 'history' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Tra cứu toàn bộ hồ sơ lịch sử kỹ thuật xe
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Lưu vết các hạng mục đã hoàn thành, chi phí từng lần thực hiện và nhân viên phụ trách
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {['all', 'routine', 'repair', 'inspection'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHistoryFilterType(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: historyFilterType === t ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: historyFilterType === t ? '#eff6ff' : '#ffffff',
                        color: historyFilterType === t ? '#2563eb' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {t === 'all' && 'Tất cả lịch sử'}
                      {t === 'routine' && 'Bảo dưỡng định kỳ'}
                      {t === 'repair' && 'Sửa chữa'}
                      {t === 'inspection' && 'Kiểm định an toàn'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Thời gian thực hiện</th>
                      <th style={{ padding: '12px' }}>Xe & Biển số</th>
                      <th style={{ padding: '12px' }}>Hạng mục đã xử lý</th>
                      <th style={{ padding: '12px' }}>Kỹ thuật viên</th>
                      <th style={{ padding: '12px' }}>Chi phí</th>
                      <th style={{ padding: '12px' }}>Kết quả & Ảnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances
                      .filter(m => historyFilterType === 'all' || m.type === historyFilterType)
                      .map((h) => (
                        <tr key={h._id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                            {h.scheduledDate ? new Date(h.scheduledDate).toLocaleDateString('vi-VN') : '25/11/2026'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{h.vehicle?.name || 'Xe Máy'}</div>
                            <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>{h.vehicle?.licensePlate || '43-ĐN'}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#334155' }}>
                            <div style={{ fontWeight: 700 }}>{h.title}</div>
                            {h.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{h.description}</div>}
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {h.technician?.fullName || user?.fullName || 'Nguyễn Văn Minh'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {(h.cost || 150000).toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                ✓ Nghiệm thu
                              </span>
                              {h.beforeImage && (
                                <button
                                  type="button"
                                  onClick={() => setShowProofComparisonModal({
                                    title: `Ảnh nghiệm thu bảo dưỡng: ${h.title}`,
                                    subtitle: `Xe ${h.vehicle?.name || ''} - Biển ${h.vehicle?.licensePlate || ''}`,
                                    beforeImg: h.beforeImage,
                                    afterImg: h.afterImage,
                                    notes: h.notes || h.description
                                  })}
                                  style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '3px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Ảnh
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
          )}

          {/* ========================================================
              MODULE 2.7: BÁO CÁO THỐNG KÊ
              ======================================================== */}
          {activeTab === 'reports' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Báo cáo thống kê hiệu suất kỹ thuật & chi phí
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Thống kê số lượng xe bảo dưỡng, sửa chữa, phụ tùng đã thay và tổng chi phí theo thời gian
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toast.success('Đang kết xuất file Excel báo cáo kỹ thuật tháng 11/2026...')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Download size={15} />
                    <span>Xuất báo cáo Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Printer size={15} />
                    <span>In báo cáo</span>
                  </button>
                </div>
              </div>

              {/* Bảng tổng hợp số liệu 2.7 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Xe đã bảo dưỡng</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>{stats.completedMaint + 4} lượt</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Tỷ lệ đạt chuẩn 98%</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Xe đang sửa chữa</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#ea580c', marginTop: '4px' }}>{stats.inRep} xe</div>
                  <div style={{ fontSize: '11px', color: '#ea580c', marginTop: '2px' }}>Đang thay phụ tùng</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Linh kiện đã thay</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>{replacedPartsHistory.length} món</div>
                  <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>Chính hãng có bảo hành</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng chi phí kỹ thuật</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>5.120.000đ</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Trong tháng 11/2026</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 2.8: THÔNG BÁO
              ======================================================== */}
          {activeTab === 'notifications' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Trung tâm thông báo & phân công nhiệm vụ
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Cập nhật lịch bảo dưỡng mới, yêu cầu sửa chữa và cảnh báo công việc quá hạn
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                    toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
                  }}
                  style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
                    }}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: n.unread ? '#eff6ff' : '#f8fafc',
                      border: n.unread ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: n.unread ? '#2563eb' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: n.unread ? 800 : 600, color: '#0f172a' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                          {n.time}
                        </div>
                      </div>
                    </div>

                    {n.unread && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              MODULE 2.9: QUẢN LÝ TÀI KHOẢN CÁ NHÂN
              ======================================================== */}
          {activeTab === 'profile' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                  Hồ sơ tài khoản Kỹ thuật viên
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                  Cập nhật thông tin cá nhân, số điện thoại liên hệ và bảo mật mật khẩu
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Form thông tin cá nhân */}
                <form onSubmit={handleSaveProfile} style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                    Thông tin liên hệ
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                      <input
                        type="text"
                        value={profName}
                        onChange={e => setProfName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                      <input
                        type="text"
                        value={profPhone}
                        onChange={e => setProfPhone(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input
                        type="email"
                        value={profEmail}
                        onChange={e => setProfEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{ marginTop: '8px', padding: '10px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Lưu thông tin cá nhân
                    </button>
                  </div>
                </form>

                {/* Form đổi mật khẩu */}
                <form onSubmit={handleChangePassword} style={{ background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                    Đổi mật khẩu bảo mật
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={profOldPass}
                        onChange={e => setProfOldPass(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Mật khẩu mới</label>
                      <input
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        value={profNewPass}
                        onChange={e => setProfNewPass(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{ marginTop: '8px', padding: '10px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                    >
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
          MODAL: CHI TIẾT XE KỸ THUẬT (2.2)
          ======================================================== */}
      {selectedVehicleDetail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setSelectedVehicleDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Hồ sơ kỹ thuật xe: {selectedVehicleDetail.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVehicleDetail(null)}
                style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div><strong>Mã xe:</strong> {selectedVehicleDetail._id.slice(-6).toUpperCase()}</div>
              <div><strong>Biển số:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>{selectedVehicleDetail.licensePlate}</span></div>
              <div><strong>Hãng & Đời:</strong> {selectedVehicleDetail.brand} ({selectedVehicleDetail.year || 2024})</div>
              <div><strong>Loại xe:</strong> {selectedVehicleDetail.type}</div>
              <div><strong>Số km đã đi:</strong> {(selectedVehicleDetail.odometer || 12000).toLocaleString()} km</div>
              <div><strong>Tình trạng:</strong> {selectedVehicleDetail.status}</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Vị trí kho hiện tại:</strong> {selectedVehicleDetail.location || 'Kho chính (08 Phan Chu Trinh, Đà Nẵng)'}
              </div>
            </div>

            {/* Các phụ tùng xe này đã thay thế */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Lịch sử phụ tùng đã thay trên xe này:</span>
                <span style={{ color: '#2563eb', fontSize: '12px' }}>
                  {replacedPartsHistory.filter(h => h.vehicleId === selectedVehicleDetail._id).length} lần thay
                </span>
              </div>

              {replacedPartsHistory.filter(h => h.vehicleId === selectedVehicleDetail._id).length === 0 ? (
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                  Xe chưa có ghi nhận thay phụ tùng nào hoặc đang sử dụng phụ tùng zin nguyên bản.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {replacedPartsHistory.filter(h => h.vehicleId === selectedVehicleDetail._id).map(ph => (
                    <div key={ph.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0369a1' }}>{ph.partName} (x{ph.quantity})</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>Ngày: {ph.replacedAt} • Lý do: {ph.reason}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{ph.total.toLocaleString()}đ</div>
                        <div style={{ color: '#16a34a', fontSize: '10.5px' }}>Bảo hành: {ph.warrantyUntil}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedQuoteBikeId(selectedVehicleDetail._id);
                  setSelectedVehicleDetail(null);
                  setActiveTab('parts');
                  setPartsActiveSubTab('quotation');
                }}
                style={{ padding: '8px 14px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <DollarSign size={14} />
                <span>Báo giá thay phụ tùng</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChkVehicleId(selectedVehicleDetail._id);
                  setSelectedVehicleDetail(null);
                  setShowInspectionModal(true);
                }}
                style={{ padding: '8px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Kiểm tra an toàn xe
              </button>
              <button
                type="button"
                onClick={() => setSelectedVehicleDetail(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TẠO PHIẾU KIỂM TRA XE (KÈM ẢNH MINH CHỨNG ĐỐI CHỨNG)
          ======================================================== */}
      {showInspectionModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setShowInspectionModal(false)}
        >
          <form
            onSubmit={handleSaveInspection}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardCheck size={22} color="#16a34a" />
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  2.5. Tạo phiếu kiểm tra xe kèm Ảnh minh chứng đối chứng
                </h3>
              </div>
              <button type="button" onClick={() => setShowInspectionModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Chọn xe kiểm tra *</label>
                <select
                  value={chkVehicleId}
                  onChange={e => setChkVehicleId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">-- Chọn xe trong danh mục --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Số km hiển thị trên đồng hồ (Odometer)</label>
                <input
                  type="number"
                  value={chkOdometer}
                  onChange={e => setChkOdometer(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* 5 Hạng mục kiểm tra checkbox */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Danh mục kiểm định an toàn (Tích chọn nếu đạt yêu cầu):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={chkBrakes} onChange={e => setChkBrakes(e.target.checked)} />
                    <span>Hệ thống phanh trước & sau (má phanh, độ bám, dầu phanh)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={chkTires} onChange={e => setChkTires(e.target.checked)} />
                    <span>Lốp xe & áp suất hơi (gai lốp, không thủng đinh)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={chkLights} onChange={e => setChkLights(e.target.checked)} />
                    <span>Đèn chiếu sáng, xi-nhan và còi báo hiệu</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={chkEngine} onChange={e => setChkEngine(e.target.checked)} />
                    <span>Động cơ vận hành êm, ga nhạy, không rò rỉ nhớt</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={chkBody} onChange={e => setChkBody(e.target.checked)} />
                    <span>Gương chiếu hậu, yên xe và dàn áo nguyên vẹn</span>
                  </label>
                </div>
              </div>

              {/* UPLOAD / CHỌN ẢNH MINH CHỨNG ĐỐI CHỨNG (TRƯỚC & SAU) */}
              <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#0369a1', marginBottom: '8px' }}>
                  <Camera size={16} />
                  <span>Ảnh minh chứng đối chứng (Bắt buộc theo quy chuẩn):</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Ảnh trước kiểm tra */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: '4px' }}>
                      1. Ảnh TRƯỚC kiểm tra (Hiện trạng):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, setChkBeforeImg);
                      }}
                      style={{ fontSize: '11px', width: '100%', marginBottom: '6px' }}
                    />
                    <div style={{ position: 'relative', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {chkBeforeImg ? (
                        <img src={chkBeforeImg} alt="Preview Trước" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChkBeforeImg(SAMPLE_PROOF_IMAGES.cleanBefore)}
                          style={{ fontSize: '11px', color: '#2563eb', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Dùng ảnh mẫu mẫu xe
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ảnh sau kiểm tra / hoàn tất */}
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: '4px' }}>
                      2. Ảnh SAU KHI hoàn tất xử lý:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, setChkAfterImg);
                      }}
                      style={{ fontSize: '11px', width: '100%', marginBottom: '6px' }}
                    />
                    <div style={{ position: 'relative', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {chkAfterImg ? (
                        <img src={chkAfterImg} alt="Preview Sau" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChkAfterImg(SAMPLE_PROOF_IMAGES.cleanAfter)}
                          style={{ fontSize: '11px', color: '#16a34a', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Dùng ảnh xe hoàn tất
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Kết luận kết quả kiểm tra *</label>
                <select
                  value={chkResult}
                  onChange={e => setChkResult(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                >
                  <option value="passed">✓ Đạt yêu cầu (Đủ điều kiện cho thuê)</option>
                  <option value="need_maintenance">🔧 Cần bảo dưỡng</option>
                  <option value="need_repair">⚠️ Cần sửa chữa</option>
                  <option value="unfit_for_rent">⛔ Không đủ điều kiện cho thuê</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Ghi chú các lỗi phát hiện</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận chi tiết các lỗi cần khắc phục..."
                  value={chkNotes}
                  onChange={e => setChkNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowInspectionModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Hủy
              </button>
              <button type="submit" style={{ padding: '8px 20px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Xác nhận kết quả & Lưu ảnh
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL: TẠO PHIẾU BẢO DƯỠNG XE (2.3)
          ======================================================== */}
      {showCreateMaintenanceModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setShowCreateMaintenanceModal(false)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/maintenance', {
                  vehicle: formMaintVehicleId,
                  title: formMaintTitle,
                  type: formMaintType,
                  scheduledDate: formMaintDate,
                  cost: formMaintCost,
                  description: formMaintNotes,
                  status: 'scheduled'
                });
                toast.success('Đã tạo lịch bảo dưỡng xe thành công!');
                setShowCreateMaintenanceModal(false);
                loadData();
              } catch (err: any) {
                toast.error(err.message || 'Lỗi khi tạo bảo dưỡng');
              }
            }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '560px', width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                2.3. Lập phiếu bảo dưỡng xe
              </h3>
              <button type="button" onClick={() => setShowCreateMaintenanceModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Xe cần bảo dưỡng *</label>
                <select
                  value={formMaintVehicleId}
                  onChange={e => setFormMaintVehicleId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">-- Chọn xe trong danh mục --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Hạng mục bảo dưỡng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thay dầu nhớt Motul, kiểm tra má phanh..."
                  value={formMaintTitle}
                  onChange={e => setFormMaintTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Ngày thực hiện</label>
                  <input
                    type="date"
                    value={formMaintDate}
                    onChange={e => setFormMaintDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Chi phí ước tính (đ)</label>
                  <input
                    type="number"
                    value={formMaintCost}
                    onChange={e => setFormMaintCost(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Ghi chú nội dung</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết phụ kiện thay thế..."
                  value={formMaintNotes}
                  onChange={e => setFormMaintNotes(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreateMaintenanceModal(false)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Hủy
              </button>
              <button type="submit" style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Lưu phiếu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL: CHI TIẾT PHIẾU BẢO DƯỠNG (KÈM ĐỐI CHỨNG ẢNH & PHỤ TÙNG)
          ======================================================== */}
      {selectedMaintenanceDetail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setSelectedMaintenanceDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Chi tiết phiếu bảo dưỡng #{selectedMaintenanceDetail._id.slice(-6).toUpperCase()}
              </h3>
              <button type="button" onClick={() => setSelectedMaintenanceDetail(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div><strong>Xe:</strong> {selectedMaintenanceDetail.vehicle?.name || 'Xe máy'}</div>
              <div><strong>Biển số:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>{selectedMaintenanceDetail.vehicle?.licensePlate || '43-ĐN'}</span></div>
              <div><strong>Hạng mục:</strong> {selectedMaintenanceDetail.title}</div>
              <div><strong>Trạng thái:</strong> {selectedMaintenanceDetail.status}</div>
              <div><strong>Chi phí:</strong> {(selectedMaintenanceDetail.cost || 150000).toLocaleString()}đ</div>
              <div><strong>Kỹ thuật viên:</strong> {selectedMaintenanceDetail.technician?.fullName || user?.fullName || 'Nguyễn Văn Minh'}</div>
              {selectedMaintenanceDetail.description && (
                <div style={{ gridColumn: 'span 2' }}><strong>Ghi chú:</strong> {selectedMaintenanceDetail.description}</div>
              )}
            </div>

            {/* Ảnh đối chứng Trước & Sau khi bảo dưỡng */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} color="#2563eb" />
                <span>Ảnh minh chứng đối chứng (Trước & Sau khi bảo dưỡng):</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                  <img
                    src={selectedMaintenanceDetail.beforeImage || SAMPLE_PROOF_IMAGES.cleanBefore}
                    alt="Trước bảo dưỡng"
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '6px 10px', background: '#1e293b', color: '#ffffff', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
                    📸 Ảnh trước bảo dưỡng (Hiện trạng)
                  </div>
                </div>

                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                  {selectedMaintenanceDetail.afterImage ? (
                    <>
                      <img
                        src={selectedMaintenanceDetail.afterImage}
                        alt="Sau bảo dưỡng"
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '6px 10px', background: '#16a34a', color: '#ffffff', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
                        ✓ Sau khi hoàn tất nghiệm thu
                      </div>
                    </>
                  ) : (
                    <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      <Camera size={24} style={{ marginBottom: '6px' }} />
                      <span>Chưa có ảnh sau hoàn tất</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {selectedMaintenanceDetail.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => handleCompleteMaintenance(selectedMaintenanceDetail._id)}
                  style={{ padding: '8px 18px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Hoàn thành & Lưu ảnh nghiệm thu
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedMaintenanceDetail(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CHI TIẾT SỬA CHỮA (KÈM ĐỐI CHỨNG ẢNH & BÁO GIÁ PHỤ TÙNG)
          ======================================================== */}
      {selectedRepairDetail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setSelectedRepairDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Chi tiết yêu cầu sửa chữa #{selectedRepairDetail.code}
              </h3>
              <button type="button" onClick={() => setSelectedRepairDetail(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '6px' }}><strong>Xe:</strong> {selectedRepairDetail.vehicleName} (<span style={{ color: '#2563eb', fontWeight: 800 }}>{selectedRepairDetail.licensePlate}</span>)</div>
              <div style={{ marginBottom: '6px' }}><strong>Lỗi phát sinh:</strong> {selectedRepairDetail.issue}</div>
              {selectedRepairDetail.cause && <div style={{ marginBottom: '6px' }}><strong>Nguyên nhân:</strong> {selectedRepairDetail.cause}</div>}
              {selectedRepairDetail.solution && <div style={{ marginBottom: '6px' }}><strong>Phương án khắc phục:</strong> {selectedRepairDetail.solution}</div>}
              {selectedRepairDetail.partsUsed.length > 0 && (
                <div style={{ marginBottom: '6px', color: '#0284c7' }}>
                  <strong>Phụ tùng thay thế:</strong> {selectedRepairDetail.partsUsed.join(', ')}
                </div>
              )}
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                Chi phí ước tính: {selectedRepairDetail.estimatedCost.toLocaleString()}đ
              </div>
            </div>

            {/* Ảnh đối chứng sửa chữa */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} color="#2563eb" />
                <span>Ảnh đối chứng hiện trạng trước khi sửa vs sau khi hoàn tất:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                  <img
                    src={selectedRepairDetail.beforeImage || SAMPLE_PROOF_IMAGES.tireBefore}
                    alt="Trước sửa chữa"
                    style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '6px 10px', background: '#1e293b', color: '#ffffff', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
                    📸 Hiện trạng hư hỏng trước sửa
                  </div>
                </div>

                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                  {selectedRepairDetail.afterImage ? (
                    <>
                      <img
                        src={selectedRepairDetail.afterImage}
                        alt="Sau sửa chữa"
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '6px 10px', background: '#16a34a', color: '#ffffff', fontSize: '11px', fontWeight: 700, textAlign: 'center' }}>
                        ✓ Đã thay thế & Nghiệm thu
                      </div>
                    </>
                  ) : (
                    <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      <Camera size={24} style={{ marginBottom: '6px' }} />
                      <span>Chưa có ảnh sau sửa chữa</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedRepairDetail(null);
                  setActiveTab('parts');
                  setPartsActiveSubTab('quotation');
                }}
                style={{ padding: '8px 14px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                + Báo giá phụ tùng thay thế
              </button>
              {selectedRepairDetail.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => handleUpdateRepairStatus(selectedRepairDetail.id, 'completed')}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✓ Hoàn thành sửa chữa
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedRepairDetail(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PHÓNG TO SO SÁNH ẢNH ĐỐI CHỨNG (BEFORE & AFTER)
          ======================================================== */}
      {showProofComparisonModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}
          onClick={() => setShowProofComparisonModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', maxWidth: '840px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                  {showProofComparisonModal.title}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  {showProofComparisonModal.subtitle}
                </div>
              </div>
              <button type="button" onClick={() => setShowProofComparisonModal(null)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Hai khung ảnh to đối chứng Trước & Sau */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* TRƯỚC */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #cbd5e1', background: '#f8fafc' }}>
                <div style={{ background: '#1e293b', color: '#ffffff', padding: '8px 12px', fontSize: '12.5px', fontWeight: 800, textAlign: 'center' }}>
                  📸 ẢNH MINH CHỨNG TRƯỚC KHI THỰC HIỆN
                </div>
                <img
                  src={showProofComparisonModal.beforeImg || SAMPLE_PROOF_IMAGES.cleanBefore}
                  alt="Trước thực hiện"
                  style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                />
              </div>

              {/* SAU */}
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #86efac', background: '#f8fafc' }}>
                <div style={{ background: '#16a34a', color: '#ffffff', padding: '8px 12px', fontSize: '12.5px', fontWeight: 800, textAlign: 'center' }}>
                  ✓ ẢNH MINH CHỨNG SAU KHI HOÀN THÀNH
                </div>
                {showProofComparisonModal.afterImg ? (
                  <img
                    src={showProofComparisonModal.afterImg}
                    alt="Sau khi hoàn thành"
                    style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    <Camera size={32} style={{ marginBottom: '8px' }} />
                    <span>Chưa có ảnh sau khi hoàn tất</span>
                  </div>
                )}
              </div>
            </div>

            {showProofComparisonModal.notes && (
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '12.5px', color: '#334155', fontStyle: 'italic', marginBottom: '16px' }}>
                <strong>Ghi chú đối chứng:</strong> "{showProofComparisonModal.notes}"
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowProofComparisonModal(null)}
                style={{ padding: '8px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Đóng đối chứng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
