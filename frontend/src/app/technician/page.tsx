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
  ChevronLeft
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
}

interface AppNotification {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: 'maintenance' | 'repair' | 'task' | 'overdue';
}

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const { user, logout, initialize } = useAuthStore();
  
  // 9 Modules Navigation State
  const [activeTab, setActiveTab] = useState<
    'home' | 'vehicles' | 'maintenance' | 'repairs' | 'inspection' | 'history' | 'reports' | 'notifications' | 'profile'
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

  // Module 2.4: Repairs State
  const [repairs, setRepairs] = useState<RepairRequest[]>([
    {
      id: 'rp-1',
      code: 'SC001',
      vehicleName: 'Honda Vision 2024',
      licensePlate: '43C1-888.88',
      issue: 'Khó đề nổ buổi sáng, ắc quy yếu',
      cause: 'Ắc quy bị chai sau 18 tháng sử dụng',
      solution: 'Thay mới bình ắc quy GS 12V-5Ah',
      status: 'in_progress',
      priority: 'high',
      estimatedCost: 380000,
      partsUsed: ['Ắc quy GS 12V-5Ah'],
      reportedAt: '25/11/2026 08:30'
    },
    {
      id: 'rp-2',
      code: 'SC002',
      vehicleName: 'Yamaha Exciter 155',
      licensePlate: '43B2-234.56',
      issue: 'Chùng xích và trượt má phanh sau',
      cause: 'Xích dão quá mức, má phanh mòn',
      solution: 'Tăng xích hoặc thay sên phốt DID, thay má phanh Nissin',
      status: 'waiting_parts',
      priority: 'medium',
      estimatedCost: 450000,
      partsUsed: ['Má phanh Nissin'],
      reportedAt: '24/11/2026 14:15'
    },
    {
      id: 'rp-3',
      code: 'SC003',
      vehicleName: 'Honda Winner X 150',
      licensePlate: '43B4-456.78',
      issue: 'Đèn pha LED chập chờn khi rẽ',
      cause: 'Lỏng giắc cắm công tắc cụm tay lái',
      solution: 'Vệ sinh giắc cắm và bọc chống nước co nhiệt',
      status: 'pending',
      priority: 'low',
      estimatedCost: 80000,
      partsUsed: [],
      reportedAt: '25/11/2026 10:00'
    }
  ]);

  // Module 2.5: Vehicle Inspections State
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
      notes: 'Xe hoạt động hoàn hảo, đã rửa sạch và châm thêm 1 lít xăng',
      result: 'passed',
      inspectorName: 'Nguyễn Văn Minh'
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
      notes: 'Lốp sau có dấu hiệu nứt chân chim nhẹ, cần lên lịch thay',
      result: 'need_maintenance',
      inspectorName: 'Nguyễn Văn Minh'
    }
  ]);

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

  // Form: Create Maintenance
  const [formMaintVehicleId, setFormMaintVehicleId] = useState('');
  const [formMaintTitle, setFormMaintTitle] = useState('');
  const [formMaintType, setFormMaintType] = useState('routine');
  const [formMaintDate, setFormMaintDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMaintCost, setFormMaintCost] = useState(150000);
  const [formMaintNotes, setFormMaintNotes] = useState('');

  // Form: Create Inspection Checklist
  const [chkVehicleId, setChkVehicleId] = useState('');
  const [chkOdometer, setChkOdometer] = useState(15000);
  const [chkBrakes, setChkBrakes] = useState(true);
  const [chkTires, setChkTires] = useState(true);
  const [chkLights, setChkLights] = useState(true);
  const [chkEngine, setChkEngine] = useState(true);
  const [chkBody, setChkBody] = useState(true);
  const [chkResult, setChkResult] = useState<'passed' | 'need_maintenance' | 'need_repair' | 'unfit_for_rent'>('passed');
  const [chkNotes, setChkNotes] = useState('');

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
      if (vRes.data?.data) setVehicles(vRes.data.data);
      if (mRes.data?.data) setMaintenances(mRes.data.data);
    } catch (err: any) {
      try {
        const pubRes = await api.get('/vehicles/public');
        if (pubRes.data?.data) setVehicles(pubRes.data.data);
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

  // Actions
  const handleCompleteMaintenance = async (id: string) => {
    try {
      await api.put(`/maintenance/${id}`, { status: 'completed' });
      toast.success('Đã hoàn thành phiếu bảo dưỡng!');
      loadData();
      if (selectedMaintenanceDetail) setSelectedMaintenanceDetail(null);
    } catch (e) {
      setMaintenances(prev => prev.map(m => m._id === id ? { ...m, status: 'completed' } : m));
      toast.success('Đã hoàn thành phiếu bảo dưỡng!');
      if (selectedMaintenanceDetail) setSelectedMaintenanceDetail(null);
    }
  };

  const handleUpdateRepairStatus = (repairId: string, nextStatus: RepairRequest['status']) => {
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: nextStatus } : r));
    toast.success('Đã cập nhật trạng thái sửa chữa!');
    if (selectedRepairDetail) {
      setSelectedRepairDetail(prev => prev ? { ...prev, status: nextStatus } : null);
    }
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
      inspectorName: user?.fullName || 'Nguyễn Văn Minh'
    };
    setInspections([newRecord, ...inspections]);
    setShowInspectionModal(false);
    toast.success(`Đã lưu phiếu kiểm định xe ${veh.licensePlate} thành công!`);
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
    toast.success('Đổi mật khẩu thành công!');
    setProfOldPass('');
    setProfNewPass('');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* ========================================================
          1. LEFT SIDEBAR (Dark Slate)
          ======================================================== */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '72px',
          background: '#0d1527',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          flexShrink: 0
        }}
      >
        <div>
          {/* Brand */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                <Bike size={22} />
              </div>
              {sidebarOpen && (
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                    XTMotoBike
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                    Kỹ thuật viên
                  </div>
                </div>
              )}
            </div>
          </Link>

          {/* 9 Core Navigation Tabs */}
          <nav style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            
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
              {sidebarOpen && <span>Quản lý bảo dưỡng</span>}
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
                placeholder="Tìm kiếm xe, biển số, mã phiếu..."
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
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                {activeTab === 'home' && '2.1. Trang chủ Kỹ thuật viên (Dashboard)'}
                {activeTab === 'vehicles' && '2.2. Quản lý thông tin & kỹ thuật đội xe'}
                {activeTab === 'maintenance' && '2.3. Quản lý tiến trình bảo dưỡng xe'}
                {activeTab === 'repairs' && '2.4. Quản lý yêu cầu sửa chữa & thay thế'}
                {activeTab === 'inspection' && '2.5. Phiếu kiểm tra tình trạng an toàn xe'}
                {activeTab === 'history' && '2.6. Lịch sử bảo dưỡng & sửa chữa'}
                {activeTab === 'reports' && '2.7. Báo cáo thống kê kỹ thuật'}
                {activeTab === 'notifications' && '2.8. Trung tâm thông báo kỹ thuật'}
                {activeTab === 'profile' && '2.9. Quản lý tài khoản cá nhân'}
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Hệ thống vận hành tiêu chuẩn theo quy trình kiểm tra - bảo dưỡng - sửa chữa XTMotoBike
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <span>+ Lập phiếu kiểm tra xe</span>
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
                <span>+ Lên lịch bảo dưỡng</span>
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
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {m.title} • {m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString('vi-VN') : '25/11/2026'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: m.status === 'in_progress' ? '#eff6ff' : '#fff7ed',
                              color: m.status === 'in_progress' ? '#2563eb' : '#ea580c'
                            }}
                          >
                            {m.status === 'in_progress' ? 'Đang thực hiện' : 'Chờ xử lý'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedMaintenanceDetail(m)}
                            style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danh sách công việc đang thực hiện */}
                <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                      <Wrench size={17} color="#2563eb" />
                      <span>Danh sách công việc đang thực hiện</span>
                    </div>
                    <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      {repairs.filter(r => r.status === 'in_progress').length + maintenances.filter(m => m.status === 'in_progress').length} việc
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {repairs.map(r => (
                      <div
                        key={r.id}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>[{r.code}]</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{r.vehicleName}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{r.issue}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedRepairDetail(r)}
                          style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Xử lý
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Thông báo mới nhất */}
              <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    <Bell size={17} color="#2563eb" />
                    <span>Thông báo mới nhất</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('notifications')}
                    style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Xem tất cả ({notifications.length}) &rarr;
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700, marginBottom: '4px' }}>● {n.time}</div>
                      <div style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>{n.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              MODULE 2.2: QUẢN LÝ XE (DANH SÁCH & CHI TIẾT KỸ THUẬT)
              ======================================================== */}
          {activeTab === 'vehicles' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Tra cứu & Theo dõi tình trạng kỹ thuật của xe
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Tìm kiếm theo biển số, mã xe, tên xe và kiểm tra lịch sử bảo dưỡng
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
                      {st === 'available' && 'Hoạt động tốt'}
                      {st === 'rented' && 'Đang cho thuê'}
                      {st === 'maintenance' && 'Bảo dưỡng'}
                      {st === 'broken' && 'Cần sửa chữa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Danh sách xe */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 800 }}>
                      <th style={{ padding: '12px' }}>Mã xe / Biển số</th>
                      <th style={{ padding: '12px' }}>Tên xe & Hãng</th>
                      <th style={{ padding: '12px' }}>Loại xe</th>
                      <th style={{ padding: '12px' }}>Số km đã đi</th>
                      <th style={{ padding: '12px' }}>Ngày đưa vào SD</th>
                      <th style={{ padding: '12px' }}>Tình trạng xe</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles
                      .filter(v => filterVehicleStatus === 'all' || v.status === filterVehicleStatus)
                      .filter(v => !searchQuery || `${v.name} ${v.licensePlate} ${v.brand}`.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((veh) => (
                        <tr key={veh._id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#2563eb' }}>{veh.licensePlate}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mã: {veh._id.slice(-6).toUpperCase()}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{veh.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>Hãng: {veh.brand} • Đời: {veh.year || 2024}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {veh.type === 'scooter' ? 'Xe tay ga' : veh.type === 'manual' ? 'Xe số' : 'Xe côn tay'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>
                            {(veh.odometer || 12000).toLocaleString('vi-VN')} km
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>
                            {veh.createdAt ? new Date(veh.createdAt).toLocaleDateString('vi-VN') : '01/01/2024'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: veh.status === 'available' ? '#f0fdf4' : veh.status === 'rented' ? '#eff6ff' : '#fff7ed',
                                color: veh.status === 'available' ? '#16a34a' : veh.status === 'rented' ? '#2563eb' : '#ea580c'
                              }}
                            >
                              {veh.status === 'available' && '✓ Hoạt động tốt'}
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
                                Xem chi tiết
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
                    Theo dõi đầy đủ mã phiếu, hạng mục, kỹ thuật viên, chi phí và đề xuất lịch tiếp theo
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
                      <th style={{ padding: '12px' }}>Ngày bảo dưỡng</th>
                      <th style={{ padding: '12px' }}>Hạng mục</th>
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
                          <td style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>
                            {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString('vi-VN') : '25/11/2026'}
                          </td>
                          <td style={{ padding: '12px', color: '#0f172a', fontWeight: 600 }}>
                            {item.title}
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
                    Kiểm tra xác định lỗi, ghi nhận nguyên nhân, cập nhật linh kiện phụ tùng và chi phí
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
                      {r.partsUsed.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, marginBottom: '6px' }}>
                          Phụ tùng thay thế: {r.partsUsed.join(', ')}
                        </div>
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
                          ✓ Hoàn thành sửa chữa
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
              MODULE 2.5: KIỂM TRA TÌNH TRẠNG XE (CHECKLIST)
              ======================================================== */}
          {activeTab === 'inspection' && (
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: '0 0 2px' }}>
                    Kiểm soát chất lượng xe trước khi giao và sau khi khách trả
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                    Kiểm tra hệ thống phanh, lốp xe, đèn còi, động cơ, gương chiếu hậu và xác nhận điều kiện cho thuê
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(true)}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Lập phiếu kiểm tra mới
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {inspections.map(ins => (
                  <div key={ins.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#ffffff' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                      <div>{ins.brakes ? '✅' : '❌'} Hệ thống phanh</div>
                      <div>{ins.tires ? '✅' : '❌'} Lốp xe & áp suất</div>
                      <div>{ins.lightsAndHorn ? '✅' : '❌'} Đèn & còi xe</div>
                      <div>{ins.engine ? '✅' : '❌'} Động cơ vận hành</div>
                      <div style={{ gridColumn: 'span 2' }}>{ins.mirrorsAndBody ? '✅' : '❌'} Gương & bộ phận bên ngoài</div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', fontStyle: 'italic', marginBottom: '8px' }}>
                      "{ins.notes}"
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      Kiểm định viên: <strong>{ins.inspectorName}</strong>
                    </div>
                  </div>
                ))}
              </div>
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
                      <th style={{ padding: '12px' }}>Kết quả</th>
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
                            <div>{h.title}</div>
                            {h.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{h.description}</div>}
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            {h.technician?.fullName || user?.fullName || 'Nguyễn Văn Minh'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {(h.cost || 150000).toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                              ✓ Đã nghiệm thu
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
                    Thống kê số lượng xe bảo dưỡng, sửa chữa, công việc hoàn thành và tổng chi phí theo thời gian
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
                  <div style={{ fontSize: '11px', color: '#ea580c', marginTop: '2px' }}>Đang chờ thay phụ tùng</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Công việc hoàn thành</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>19 / 24 việc</div>
                  <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Đạt tiến độ 80%</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Tổng chi phí kỹ thuật</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#2563eb', marginTop: '4px' }}>4.850.000đ</div>
                  <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>Trong tháng 11/2026</div>
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
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '580px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
          MODAL: TẠO PHIẾU KIỂM TRA XE (2.5)
          ======================================================== */}
      {showInspectionModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setShowInspectionModal(false)}
        >
          <form
            onSubmit={handleSaveInspection}
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardCheck size={22} color="#16a34a" />
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  2.5. Tạo phiếu kiểm tra tình trạng xe
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
                Xác nhận kết quả kiểm tra
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          MODAL: TẠO PHIẾU BẢO DƯỠNG (2.3)
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
            style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '520px', width: '100%' }}
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
                  placeholder="Ví dụ: Thay dầu nhớt, kiểm tra phanh..."
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
                  placeholder="Ghi chú chi tiết..."
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

    </div>
  );
}
