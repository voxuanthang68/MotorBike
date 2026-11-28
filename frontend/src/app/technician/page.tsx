'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [showHeaderNotifs, setShowHeaderNotifs] = useState(false);
  const headerNotifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headerNotifRef.current && !headerNotifRef.current.contains(e.target as Node)) {
        setShowHeaderNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Core Real States (loaded 100% from MongoDB Backend)
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([]);
  const [partsCatalog, setPartsCatalog] = useState<PartItem[]>([]);
  const [returnedBookings, setReturnedBookings] = useState<any[]>([]);
  const [selectedReturnedBookingId, setSelectedReturnedBookingId] = useState('');
  const [activeInspectionId, setActiveInspectionId] = useState('');
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

  // Return Inspections (Real MongoDB)
  const [returnInspections, setReturnInspections] = useState<ReturnInspectionItem[]>([]);

  // Damage Reports (Real MongoDB)
  const [damageReports, setDamageReports] = useState<DamageReportItem[]>([]);

  // Repair Orders (Real MongoDB)
  const [repairs, setRepairs] = useState<RepairItem[]>([]);

  // Notifications (Real MongoDB)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Profile Form States
  const [profName, setProfName] = useState(user?.fullName || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profEmail, setProfEmail] = useState(user?.email || '');
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

  // New Inspection Modal Form States (strictly populated from returned booking)
  const [newInsOdo, setNewInsOdo] = useState(0);
  const [newInsFuelLevel, setNewInsFuelLevel] = useState(90);
  const [newInsNotes, setNewInsNotes] = useState('');

  // Damage Report Modal States
  const [dmgPositionsList, setDmgPositionsList] = useState<DamagePosition[]>([]);
  const [dmgNotes, setDmgNotes] = useState('');
  const [dmgOverallSeverity, setDmgOverallSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Create Repair Quote Modal (from BBHH)
  const [repSelectedParts, setRepSelectedParts] = useState<{ partId: string; quantity: number }[]>([]);
  const [repSolutionText, setRepSolutionText] = useState('');

  const displayTechName = user?.fullName || profName || 'Kỹ thuật viên';
  const techInitials = useMemo(() => {
    const parts = displayTechName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'KT';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [displayTechName]);

  const backendImgBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
  const resolveUrl = (u?: string) => {
    if (!u) return '';
    if (u.startsWith('http') || u.startsWith('data:') || u.startsWith('blob:')) return u;
    return `${backendImgBase}${u.startsWith('/') ? '' : '/'}${u}`;
  };

  useEffect(() => {
    if (user) {
      setProfName(prev => prev || user.fullName || '');
      setProfPhone(prev => prev || user.phone || '');
      setProfEmail(prev => prev || user.email || '');
    }
  }, [user]);

  const selectReturnedBookingForModal = (bk: any) => {
    if (!bk) {
      setSelectedReturnedBookingId('');
      setNewInsOdo(0);
      setNewInsFuelLevel(90);
      setNewInsNotes('');
      return;
    }
    setSelectedReturnedBookingId(bk._id);
    setNewInsOdo(Number(bk.checkOutOdometer || bk.checkInOdometer || bk.vehicle?.odometer || 0));
    setNewInsFuelLevel(90);
    setNewInsNotes(bk.customerReturnNote || '');
  };

  const openNewInspectionModal = (preselectBooking?: any) => {
    const target = preselectBooking || returnedBookings[0] || null;
    selectReturnedBookingForModal(target);
    setShowNewInspectionModal(true);
  };

  // Load 100% Real Data from MongoDB backend
  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, mRes, tRes, nRes] = await Promise.allSettled([
        api.get('/vehicles?limit=100'),
        api.get('/maintenance?limit=100'),
        api.get('/technician/overview'),
        api.get('/notifications')
      ]);

      if (vRes.status === 'fulfilled' && Array.isArray(vRes.value.data?.data)) {
        const mappedVehs: VehicleItem[] = vRes.value.data.data.map((v: any, idx: number) => {
          const rawStatus = v.availability || v.status || 'available';
          let techStatus: VehicleItem['status'] = 'available';
          if (rawStatus === 'rented') techStatus = 'rented';
          else if (rawStatus === 'reserved' || rawStatus === 'booked' || rawStatus === 'pending_confirmation') techStatus = 'reserved';
          else if (v.status === 'broken') techStatus = 'broken';
          else if (v.status === 'maintenance') techStatus = 'maintenance';
          else if (rawStatus === 'available') techStatus = 'available';

          const mainImg = resolveUrl(v.mainImage || v.images?.[0]?.url) || SAMPLE_PHOTOS.cleanFront;
          const imgs = Array.isArray(v.images) && v.images.length > 0
            ? v.images.map((i: any) => resolveUrl(typeof i === 'string' ? i : i?.url)).filter(Boolean)
            : [mainImg];

          return {
            _id: v._id,
            code: `MR-DN-${String(idx + 1).padStart(3, '0')}`,
            name: v.name,
            brand: v.brand || 'Honda',
            color: v.color || 'Tiêu chuẩn',
            licensePlate: v.licensePlate,
            type: v.type === 'scooter' ? 'Xe tay ga' : v.type === 'manual' ? 'Xe số' : v.type === 'clutch' ? 'Xe côn tay' : (v.type || 'Xe máy'),
            year: v.year || 2024,
            engineCC: v.engineCC || 125,
            odometer: Number(v.odometer || 0),
            nextMaintenanceOdo: Number(v.odometer || 0) + 2000,
            status: techStatus,
            lastMaintenanceDate: v.lastMaintenanceDate ? new Date(v.lastMaintenanceDate).toISOString().slice(0, 10) : 'Chưa bảo dưỡng',
            techNote: v.description || '',
            image: mainImg,
            gallery: imgs
          };
        });
        setVehicles(mappedVehs);
        if (!newMaintVehId && mappedVehs[0]) setNewMaintVehId(mappedVehs[0]._id);
      }

      if (mRes.status === 'fulfilled' && Array.isArray(mRes.value.data?.data)) {
        const mappedMaints: MaintenanceRecord[] = mRes.value.data.data.map((m: any) => ({
          ...m,
          scheduledDate: m.scheduledDate ? new Date(m.scheduledDate).toISOString().slice(0, 10) : '',
          completedDate: m.completedDate ? new Date(m.completedDate).toISOString().slice(0, 10) : undefined
        }));
        setMaintenances(mappedMaints);
      }

      if (tRes.status === 'fulfilled' && tRes.value.data?.data) {
        const ov = tRes.value.data.data;
        const fixIns = (ins: any): ReturnInspectionItem => ({
          ...ins,
          vehicleImage: resolveUrl(ins.vehicleImage) || SAMPLE_PHOTOS.cleanFront,
          deliveryImages: (ins.deliveryImages || []).map(resolveUrl).filter(Boolean),
          returnImages: (ins.returnImages || []).map(resolveUrl).filter(Boolean)
        });
        const fixRep = (rep: any): RepairItem => ({
          ...rep,
          vehicleImage: resolveUrl(rep.vehicleImage) || SAMPLE_PHOTOS.cleanFront,
          beforePhotos: (rep.beforePhotos || []).map(resolveUrl).filter(Boolean),
          afterPhotos: (rep.afterPhotos || []).map(resolveUrl).filter(Boolean),
          replacementPhotos: (rep.replacementPhotos || []).map(resolveUrl).filter(Boolean)
        });
        const fixDmg = (dmg: any): DamageReportItem => ({
          ...dmg,
          positions: (dmg.positions || []).map((p: any) => ({
            ...p,
            photo: resolveUrl(p.photo)
          }))
        });

        const insList = Array.isArray(ov.inspections) ? ov.inspections.map(fixIns) : [];
        setReturnInspections(insList);
        if (insList.length > 0 && (!activeInspectionId || !insList.some((x: any) => x.id === activeInspectionId))) {
          setActiveInspectionId(insList[0].id);
        } else if (insList.length === 0) {
          setActiveInspectionId('');
        }

        setDamageReports(Array.isArray(ov.damageReports) ? ov.damageReports.map(fixDmg) : []);
        setRepairs(Array.isArray(ov.repairs) ? ov.repairs.map(fixRep) : []);
        setPartsCatalog(Array.isArray(ov.parts) ? ov.parts : []);

        const retList = Array.isArray(ov.returnedBookings) ? ov.returnedBookings : [];
        setReturnedBookings(retList);
        if (retList.length > 0) {
          selectReturnedBookingForModal(retList[0]);
        } else {
          selectReturnedBookingForModal(null);
        }
      }

      if (nRes.status === 'fulfilled' && Array.isArray(nRes.value.data?.data)) {
        const mappedNotifs: AppNotification[] = nRes.value.data.data.map((n: any) => {
          let targetTab: TabId = 'notifications';
          if (n.data?.action === 'customer_returned') targetTab = 'return_inspection';
          else if (n.data?.repairId) targetTab = 'repair_management';
          else if (n.data?.damageReportId) targetTab = 'damage_management';
          else if (n.type === 'maintenance') targetTab = 'maintenance';

          return {
            id: n._id,
            title: n.title,
            description: n.message,
            time: n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : '',
            unread: !n.isRead,
            type: n.type === 'maintenance' ? 'maintenance' : n.type === 'alert' ? 'damage' : 'system',
            targetTab
          };
        });
        setNotifications(mappedNotifs);
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
  // 3. EVENT HANDLERS (100% REAL API PERSISTENCE)
  // ==========================================
  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedBk = returnedBookings.find(b => b._id === selectedReturnedBookingId);
    if (!selectedBk) {
      toast.error('Chỉ được tiếp nhận xe từ danh sách đơn khách hàng đã trả xe!');
      return;
    }

    try {
      const checklist = createDefaultChecklist();
      const res = await api.post('/technician/inspections', {
        bookingId: selectedBk._id,
        deliveryOdometer: Number(selectedBk.checkInOdometer || selectedBk.vehicle?.odometer || 0),
        returnOdometer: Number(newInsOdo || 0),
        fuelLevel: Number(newInsFuelLevel),
        checklist,
        pins: [],
        notes: newInsNotes || selectedBk.customerReturnNote || 'Đã tiếp nhận xe khách trả để kiểm tra 8 hạng mục.'
      });

      const created: ReturnInspectionItem = {
        ...res.data.data,
        vehicleImage: resolveUrl(res.data.data.vehicleImage) || SAMPLE_PHOTOS.cleanFront,
        deliveryImages: (res.data.data.deliveryImages || []).map(resolveUrl).filter(Boolean),
        returnImages: (res.data.data.returnImages || []).map(resolveUrl).filter(Boolean)
      };

      setReturnInspections(prev => [created, ...prev]);
      const nextReturned = returnedBookings.filter(b => b._id !== selectedBk._id);
      setReturnedBookings(nextReturned);
      selectReturnedBookingForModal(nextReturned[0] || null);
      setActiveInspectionId(created.id);
      setActiveTab('return_inspection');
      setShowNewInspectionModal(false);
      toast.success(`Đã tiếp nhận phiếu ${created.inspectionCode}!`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tiếp nhận xe chưa được khách trả');
    }
  };

  const handleUpdateInspection = (updated: ReturnInspectionItem) => {
    setReturnInspections(prev => prev.map(item => (item.id === updated.id ? updated : item)));
    api.put(`/technician/inspections/${updated.id}`, updated).catch(() => {});
  };

  const handleSaveDraftInspection = async (draft: ReturnInspectionItem) => {
    setReturnInspections(prev => prev.map(item => (item.id === draft.id ? draft : item)));
    try {
      await api.put(`/technician/inspections/${draft.id}`, draft);
      toast.success(`Đã lưu bản nháp phiếu ${draft.inspectionCode} lên hệ thống!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu bản nháp');
    }
  };

  const handleConfirmInspection = async (ins: ReturnInspectionItem) => {
    const damageItems = ins.checklist.filter(c => c.status === 'damage');
    const checkItems = ins.checklist.filter(c => c.status === 'check');
    const finalStatus: ReturnInspectionItem['status'] = damageItems.length > 0 ? 'damaged' : 'passed';

    const payload = { ...ins, status: finalStatus };
    setReturnInspections(prev => prev.map(item => (item.id === ins.id ? payload : item)));

    try {
      await api.put(`/technician/inspections/${ins.id}`, payload);
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi xác nhận kiểm tra');
      return;
    }

    if (finalStatus === 'passed') {
      toast.success(
        checkItems.length > 0
          ? `Đã xác nhận ${ins.inspectionCode} (lưu ý ${checkItems.length} mục kiểm tra thêm).`
          : `Đã xác nhận ĐẠT cho xe ${ins.licensePlate} — Xe chuyển về Sẵn sàng!`
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

  const handleSaveDamageReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateDamageReportModal) return;

    const ins = showCreateDamageReportModal;
    try {
      const res = await api.post('/technician/damage-reports', {
        inspectionId: ins.id,
        positions: dmgPositionsList,
        overallSeverity: dmgOverallSeverity,
        notes: dmgNotes || 'Khách hàng đã ký xác nhận biên bản hư hỏng.',
        customerAgreedSignature: true
      });
      const newReport: DamageReportItem = res.data.data;
      setReturnInspections(prev =>
        prev.map(i => (i.id === ins.id ? { ...i, status: 'damaged', hasDamageReport: true, damageReportId: newReport.id } : i))
      );
      setDamageReports(prev => [newReport, ...prev]);
      setShowCreateDamageReportModal(null);
      toast.success(`Đã lập Biên bản hư hỏng ${newReport.code}!`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu biên bản hư hỏng');
    }
  };

  const handleSaveRepairOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateRepairModal) return;

    const dmg = showCreateRepairModal;
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

    const partsPrice = partsLines.reduce((s, p) => s + p.total, 0);
    const laborFee = modalQuoteCalc.laborPrice || 150000;

    try {
      const res = await api.post('/technician/repairs', {
        damageReportId: dmg.id,
        vehicleId: dmg.vehicleId,
        bookingCode: dmg.bookingCode,
        customerName: dmg.customerName,
        customerPhone: dmg.customerPhone,
        issueSummary: dmg.positions.map(p => `${p.position}: ${p.description}`).join('; '),
        proposedSolution: repSolutionText || 'Thay thế phụ tùng mới chính hãng và phục hồi vị trí hư hỏng',
        parts: partsLines,
        totalPartsPrice: partsPrice,
        totalLaborFee: laborFee,
        totalEstimatedCost: partsPrice + laborFee,
        status: 'waiting_approval',
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
        beforePhotos: dmg.positions.map(p => p.photo || SAMPLE_PHOTOS.damageScratched)
      });

      const createdRep: RepairItem = res.data.data;
      setDamageReports(prev =>
        prev.map(d => (d.id === dmg.id ? { ...d, status: 'repair_proposed', repairId: createdRep.id } : d))
      );
      setRepairs(prev => [createdRep, ...prev]);
      setSelectedRepairId(createdRep.id);
      setShowCreateRepairModal(null);
      setRepSelectedParts([]);
      setRepSolutionText('');
      setActiveTab('repair_management');
      toast.success(`Đã tạo phiếu sửa chữa ${createdRep.code} từ ${dmg.code}!`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi tạo phiếu sửa chữa');
    }
  };

  const handleCreateRepairFromWorkspace = async (draft: RepairItem) => {
    try {
      const res = await api.post('/technician/repairs', {
        vehicleId: draft.vehicleId,
        bookingCode: draft.bookingCode,
        customerName: draft.customerName,
        customerPhone: draft.customerPhone,
        issueSummary: draft.issueSummary,
        proposedSolution: draft.proposedSolution,
        parts: draft.parts,
        totalPartsPrice: draft.totalPartsPrice,
        totalLaborFee: draft.totalLaborFee,
        totalEstimatedCost: draft.totalEstimatedCost,
        status: draft.status,
        technicianNotes: draft.technicianNotes,
        damageItems: draft.damageItems
      });
      const persisted: RepairItem = res.data.data;
      setRepairs(prev => [persisted, ...prev]);
      setSelectedRepairId(persisted.id);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể lưu phiếu sửa chữa mới lên máy chủ');
    }
  };

  const handleUpdateRepairInWorkspace = async (updated: RepairItem) => {
    setRepairs(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    try {
      await api.put(`/technician/repairs/${updated.id}`, updated);
      if (updated.status === 'completed' || updated.status === 'in_progress') {
        loadData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi cập nhật phiếu sửa chữa');
    }
  };

  const handleMarkNotificationRead = async (n: AppNotification) => {
    setNotifications(prev => prev.map(x => (x.id === n.id ? { ...x, unread: false } : x)));
    try {
      await api.put(`/notifications/${n.id}/read`);
    } catch {}
    if (n.targetTab) setActiveTab(n.targetTab);
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    try {
      await api.put('/notifications/read-all');
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc!');
    } catch {}
  };

  const handleUpdateVehicleStatus = async (veh: VehicleItem, newStatus: VehicleItem['status']) => {
    setVehicles(prev => prev.map(v => (v._id === veh._id ? { ...v, status: newStatus } : v)));
    if (selectedVehicleDetail?._id === veh._id) {
      setSelectedVehicleDetail({ ...selectedVehicleDetail, status: newStatus });
    }
    const apiStatus =
      newStatus === 'repairing'
        ? 'broken'
        : newStatus === 'reserved'
        ? 'rented'
        : newStatus;
    try {
      await api.put(`/vehicles/${veh._id}`, { status: apiStatus });
      toast.success(`Đã cập nhật trạng thái xe ${veh.licensePlate} trong hệ thống!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái xe');
      loadData();
    }
  };

  const monthlyChartData: MonthlyChartDatum[] = useMemo(() => {
    const now = new Date();
    const months: Array<{ label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`
      });
    }

    const bucketOf = (dateStr?: string) => {
      if (!dateStr) return null;
      const dt = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(dt.getTime())) return null;
      return `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getFullYear()).slice(-2)}`;
    };

    return months.map(m => {
      const insCount = returnInspections.filter(i => bucketOf(i.returnDate) === m.label).length;
      const maintList = maintenances.filter(x => bucketOf(x.scheduledDate) === m.label);
      const repList = repairs.filter(r => bucketOf(r.createdAt) === m.label);
      const repCost = repList.reduce((s, r) => s + (r.actualCost || r.totalEstimatedCost || 0), 0);
      const maintCost = maintList.reduce((s, x) => s + (x.cost || 0), 0);

      return {
        label: m.label,
        inspections: insCount,
        maintenance: maintList.length,
        repairs: repList.length,
        cost: repCost + maintCost
      };
    });
  }, [returnInspections, maintenances, repairs]);

  const handleExportCsvReport = () => {
    const rows = [
      ['Tháng', 'Kiểm tra trả xe', 'Bảo dưỡng', 'Sửa chữa', 'Chi phí (VND)'],
      ...monthlyChartData.map(d => [d.label, d.inspections, d.maintenance, d.repairs, d.cost])
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
    { id: 'return_inspection', label: 'Kiểm tra xe khi trả', icon: ClipboardCheck, badge: returnedBookings.length },
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
              {techInitials}
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

            <div ref={headerNotifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowHeaderNotifs(prev => !prev)}
                aria-label="Mở danh sách thông báo"
                style={{
                  position: 'relative',
                  background: showHeaderNotifs ? '#eff6ff' : '#f8fafc',
                  border: showHeaderNotifs ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Bell size={16} color={showHeaderNotifs ? '#2563eb' : '#475569'} />
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

              {showHeaderNotifs && (
                <div
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '360px',
                    maxWidth: 'calc(100vw - 32px)',
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
                    zIndex: 90,
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                      Thông báo kỹ thuật ({unreadNotifsCount} mới)
                    </div>
                    {unreadNotifsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                        Hiện chưa có thông báo nào.
                      </div>
                    ) : notifications.slice(0, 8).map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowHeaderNotifs(false);
                          handleMarkNotificationRead(n);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: n.unread ? '#eff6ff' : '#f8fafc',
                          border: n.unread ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: n.unread ? 800 : 600, color: '#0f172a' }}>{n.title}</span>
                          {n.unread && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', marginTop: '5px', flexShrink: 0 }} />}
                        </div>
                        {n.description && <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>{n.description}</div>}
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{n.time}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowHeaderNotifs(false);
                        setActiveTab('notifications');
                      }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Xem tất cả trong mục Thông báo ({notifications.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                {techInitials}
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
                    onClick={() => openNewInspectionModal()}
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
                    <span>Tiếp nhận kiểm tra trả xe ({returnedBookings.length})</span>
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
                  <MonthlyWorkBarChart data={monthlyChartData} />
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
                    {maintenances.length === 0 ? (
                      <div style={{ fontSize: '12.5px', color: '#64748b', padding: '14px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px' }}>
                        Chưa có lịch bảo dưỡng nào trong hệ thống.
                      </div>
                    ) : maintenances.slice(0, 4).map((m, idx) => (
                      <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                            <span style={{ color: '#64748b', marginRight: '6px' }}>#{idx + 1}</span>
                            {m.vehicle?.name || 'Xe máy'} • <span style={{ color: '#2563eb' }}>{m.vehicle?.licensePlate || '43-ĐN'}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{m.title}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>{m.scheduledDate || ''}</div>
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
                    {notifications.length === 0 ? (
                      <div style={{ fontSize: '12.5px', color: '#64748b', padding: '14px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px' }}>
                        Chưa có thông báo mới.
                      </div>
                    ) : notifications.slice(0, 4).map((n, idx) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotificationRead(n)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: n.unread ? '#eff6ff' : '#f8fafc',
                          border: n.unread ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                            <span style={{ color: '#64748b', marginRight: '6px' }}>#{idx + 1}</span>
                            {n.title}
                          </span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Xe khách trả chờ tiếp nhận ({returnedBookings.length}) & Phiếu kiểm tra ({returnInspections.length})
                  </h3>
                  <button type="button" onClick={() => setActiveTab('return_inspection')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                    Mở màn hình Kiểm tra xe ({returnInspections.length}) →
                  </button>
                </div>

                {returnedBookings.length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {returnedBookings.map((bk: any, idx: number) => (
                      <div key={bk._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#fff7ed', borderRadius: '11px', border: '1px solid #fed7aa', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#9a3412' }}>
                            #{idx + 1} • CHỜ TIẾP NHẬN • {bk.vehicle?.name} (<span style={{ fontFamily: 'monospace' }}>{bk.vehicle?.licensePlate}</span>)
                          </div>
                          <div style={{ fontSize: '12px', color: '#7c2d12' }}>
                            Đơn <strong>{bk.bookingCode}</strong> • KH: {bk.customer?.fullName} • Trả lúc: {bk.customerReturnedAt ? new Date(bk.customerReturnedAt).toLocaleString('vi-VN') : 'Đã trả xe'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openNewInspectionModal(bk)}
                          style={{ padding: '7px 14px', background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Tiếp nhận xe trả
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {returnInspections.length === 0 ? (
                    <div style={{ fontSize: '12.5px', color: '#64748b', padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px' }}>
                      {returnedBookings.length > 0
                        ? 'Chọn nút "+ Tiếp nhận xe trả" phía trên để mở phiếu kiểm tra 8 hạng mục.'
                        : 'Chưa có phiếu kiểm tra xe khi trả nào (Chỉ tiếp nhận được xe sau khi khách hàng thực hiện trả xe).'}
                    </div>
                  ) : returnInspections.map((ins, idx) => (
                    <div key={ins.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '11px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', minWidth: '24px' }}>#{idx + 1}</span>
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
                          <th style={{ padding: '12px 12px', textAlign: 'center', width: '48px' }}>STT</th>
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
                            <td colSpan={10} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                              Không tìm thấy phương tiện phù hợp.
                            </td>
                          </tr>
                        ) : (
                          pagedVehicles.map((veh, idx) => {
                            const vehCode = veh.code || `MR-DN-${String((safeVehPage - 1) * PER_PAGE + idx + 1).padStart(3, '0')}`;
                            const badge = getVehBadge(veh.status);
                            return (
                              <tr key={veh._id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                                <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                                  {(safeVehPage - 1) * PER_PAGE + idx + 1}
                                </td>
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
                                  {(veh.odometer || 0).toLocaleString('vi-VN')} km
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
                                  {veh.lastMaintenanceDate || 'Chưa bảo dưỡng'}
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
              onSaveDraft={handleSaveDraftInspection}
              onOpenNewModal={() => openNewInspectionModal()}
              returnedBookings={returnedBookings}
              onAcceptReturnedBooking={bk => openNewInspectionModal(bk)}
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
                    else toast.error('Cần tiếp nhận và kiểm tra xe khách trả trước khi lập biên bản hư hỏng');
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
                {damageReports.filter(d => dmgFilter === 'all' || d.status === dmgFilter).length === 0 ? (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '32px', background: '#ffffff', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                    Chưa có biên bản hư hỏng nào trong hệ thống.
                  </div>
                ) : null}
                {damageReports
                  .filter(d => dmgFilter === 'all' || d.status === dmgFilter)
                  .map((dmg, idx) => (
                    <div key={dmg.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', background: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: '6px' }}>STT #{idx + 1}</span>
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
              onUpdateRepair={handleUpdateRepairInWorkspace}
              onCreateRepair={handleCreateRepairFromWorkspace}
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
                          <th style={{ padding: '12px 12px', textAlign: 'center', width: '48px' }}>STT</th>
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
                          .map((pt, idx) => (
                            <tr key={pt.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                              <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
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
                    .map((pt, idx) => (
                      <div key={pt.id} style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px' }}>
                        <div style={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>#{idx + 1} • {pt.code} • {pt.category}</div>
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
                        <th style={{ padding: '12px 12px', textAlign: 'center', width: '48px' }}>STT</th>
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
                      {maintenances.filter(m => maintStatusFilter === 'all' || m.status === maintStatusFilter).length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '28px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                            Chưa có lịch bảo dưỡng nào phù hợp.
                          </td>
                        </tr>
                      ) : maintenances
                        .filter(m => maintStatusFilter === 'all' || m.status === maintStatusFilter)
                        .map((m, idx) => (
                          <tr key={m._id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                            <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>BD#{m._id.slice(-4).toUpperCase()}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{m.vehicle?.name || 'Xe máy'}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>{m.vehicle?.licensePlate || '43-ĐN'}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>{m.title}</td>
                            <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{m.scheduledDate || ''}</td>
                            <td style={{ padding: '12px 16px', color: '#475569' }}>{m.technician?.fullName || displayTechName}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{(m.cost || 0).toLocaleString('vi-VN')} đ</td>
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
                                    onClick={async () => {
                                      try {
                                        await api.put(`/maintenance/${m._id}`, { status: 'in_progress' });
                                        setMaintenances(prev => prev.map(x => (x._id === m._id ? { ...x, status: 'in_progress' } : x)));
                                        toast.success('Đã tiếp nhận bảo dưỡng!');
                                        loadData();
                                      } catch (err: any) {
                                        toast.error(err?.response?.data?.message || 'Lỗi khi tiếp nhận bảo dưỡng');
                                      }
                                    }}
                                    style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Tiếp nhận
                                  </button>
                                )}
                                {m.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await api.put(`/maintenance/${m._id}`, { status: 'completed' });
                                        setMaintenances(prev => prev.map(x => (x._id === m._id ? { ...x, status: 'completed', completedDate: new Date().toISOString().slice(0, 10) } : x)));
                                        toast.success('Đã hoàn thành bảo dưỡng và mở lại trạng thái Sẵn sàng!');
                                        loadData();
                                      } catch (err: any) {
                                        toast.error(err?.response?.data?.message || 'Lỗi khi hoàn thành bảo dưỡng');
                                      }
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
                        <th style={{ padding: '12px 12px', textAlign: 'center', width: '48px' }}>STT</th>
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
                      {unifiedHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '28px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                            Chưa có hồ sơ lịch sử kỹ thuật nào.
                          </td>
                        </tr>
                      ) : unifiedHistory.map((h, idx) => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                          <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
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
                    {monthlyChartData.reduce((s, d) => s + d.inspections, 0)} lượt
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
                  <MonthlyWorkBarChart data={reportPeriod === '3m' ? monthlyChartData.slice(-3) : monthlyChartData} />
                </div>

                <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Biến động chi phí sửa chữa & phụ tùng</h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px' }}>Đơn vị tính: Triệu VNĐ</p>
                  <CostTrendLineChart data={reportPeriod === '3m' ? monthlyChartData.slice(-3) : monthlyChartData} />
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
                    onClick={handleMarkAllNotificationsRead}
                    style={{ padding: '7px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.filter(n => notifFilter === 'all' || n.unread).length === 0 ? (
                  <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    Không có thông báo nào.
                  </div>
                ) : notifications
                  .filter(n => notifFilter === 'all' || n.unread)
                  .map((n, idx) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkNotificationRead(n)}
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
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', minWidth: '24px' }}>#{idx + 1}</span>
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
                    {techInitials}
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
                      await initialize();
                      toast.success('Đã cập nhật thông tin cá nhân!');
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
                    }
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
                  onSubmit={async e => {
                    e.preventDefault();
                    try {
                      await api.put('/auth/change-password', {
                        currentPassword: profOldPass,
                        newPassword: profNewPass
                      });
                      toast.success('Đã cập nhật mật khẩu mới!');
                      setProfOldPass('');
                      setProfNewPass('');
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || 'Không thể đổi mật khẩu');
                    }
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
          MODAL 1: TIẾP NHẬN KIỂM TRA TRẢ XE MỚI (CHỈ XE ĐÃ TRẢ)
          ======================================================== */}
      {showNewInspectionModal && (() => {
        const selectedBk = returnedBookings.find(b => b._id === selectedReturnedBookingId) || returnedBookings[0] || null;
        const retVehIds = new Set(returnedBookings.map(b => String(b.vehicle?._id)));
        const otherVehicles = vehicles.filter(v => !retVehIds.has(String(v._id)));
        const stLabel = (st: string) =>
          st === 'rented' ? 'Đang thuê (chưa trả)' : st === 'maintenance' ? 'Đang bảo dưỡng' : st === 'broken' ? 'Hư hỏng' : st === 'reserved' ? 'Đã đặt' : 'Sẵn sàng';
        const otherVehiclesBox = otherVehicles.length > 0 ? (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px', fontSize: '11.5px', color: '#475569', marginTop: '10px' }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Các xe hiện có còn lại trong đội xe ({otherVehicles.length} xe không chờ kiểm tra trả):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {otherVehicles.map(v => (
                <span key={v._id} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px 7px' }}>
                  <strong>{v.licensePlate}</strong> ({v.name}) — {stLabel(v.status)}
                </span>
              ))}
            </div>
          </div>
        ) : null;
        return (
          <div onClick={() => setShowNewInspectionModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '16px' }}>
            <form onSubmit={handleSaveInspection} onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '18px', padding: '24px', maxWidth: '620px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Tiếp nhận xe khách đã trả</h3>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Chỉ hiển thị xe thuộc đội xe đang hoạt động đã được khách hàng thực hiện trả xe
                  </div>
                </div>
                <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              {returnedBookings.length === 0 || !selectedBk ? (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '18px', color: '#9a3412', fontSize: '13px', lineHeight: 1.55 }}>
                  <strong>Chưa có xe nào được khách hàng trả chờ tiếp nhận!</strong>
                  <div style={{ marginTop: '6px' }}>
                    Theo quy trình hệ thống, nhân viên kỹ thuật chỉ được tiếp nhận khi khách hàng đã bấm <strong>Trả xe</strong> trên Cổng khách hàng hoặc lễ tân đã xác nhận nhận trả xe tại quầy.
                  </div>
                  {otherVehiclesBox}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                    <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8', display: 'block', marginBottom: '6px' }}>
                        Chọn đơn khách hàng đã trả ({returnedBookings.length} xe chờ kiểm tra): *
                      </label>
                      <select
                        value={selectedBk._id}
                        onChange={e => {
                          const bk = returnedBookings.find(b => b._id === e.target.value);
                          selectReturnedBookingForModal(bk || null);
                        }}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #93c5fd', fontSize: '13px', background: '#ffffff', fontWeight: 600 }}
                      >
                        {returnedBookings.map(b => (
                          <option key={b._id} value={b._id}>
                            {b.bookingCode} • {b.vehicle?.name} ({b.vehicle?.licensePlate}) • KH: {b.customer?.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', fontSize: '12.5px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div><span style={{ color: '#64748b' }}>Mã đơn thuê:</span> <strong style={{ fontFamily: 'monospace' }}>{selectedBk.bookingCode}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Trả lúc:</span> <strong>{selectedBk.customerReturnedAt ? new Date(selectedBk.customerReturnedAt).toLocaleString('vi-VN') : 'Đã trả'}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Khách hàng:</span> <strong>{selectedBk.customer?.fullName}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Số điện thoại:</span> <strong>{selectedBk.customer?.phone || 'N/A'}</strong></div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#64748b' }}>Phương tiện:</span>{' '}
                        <strong>{selectedBk.vehicle?.name}</strong> (<span style={{ color: '#2563eb', fontFamily: 'monospace', fontWeight: 800 }}>{selectedBk.vehicle?.licensePlate}</span>)
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Odo lúc giao</label>
                        <input type="number" readOnly value={Number(selectedBk.checkInOdometer || selectedBk.vehicle?.odometer || 0)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '13px', color: '#475569' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Odo khi trả *</label>
                        <input type="number" required value={newInsOdo} onChange={e => setNewInsOdo(Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
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

                    {otherVehiclesBox}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button type="button" onClick={() => setShowNewInspectionModal(false)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                    <button type="submit" style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>Tiếp nhận & Mở phiếu kiểm tra 8 hạng mục</button>
                  </div>
                </>
              )}
            </form>
          </div>
        );
      })()}

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
            onSubmit={async e => {
              e.preventDefault();
              try {
                const res = await api.post('/technician/parts', {
                  code: newPartCode.trim(),
                  name: newPartName.trim(),
                  category: newPartCategory,
                  unitPrice: newPartPrice,
                  laborFee: newPartLabor,
                  warranty: '6 tháng',
                  stock: newPartStock,
                  compatible: 'Đa dòng xe'
                });
                if (res.data?.data) {
                  setPartsCatalog(prev => [...prev, res.data.data]);
                }
                setShowAddPartModal(false);
                setNewPartCode('');
                setNewPartName('');
                toast.success('Đã thêm phụ tùng mới vào kho cơ sở dữ liệu!');
              } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Lỗi khi thêm phụ tùng');
              }
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
            onSubmit={async e => {
              e.preventDefault();
              const vehId = newMaintVehId || vehicles[0]?._id;
              if (!vehId) {
                toast.error('Chưa có xe hợp lệ');
                return;
              }
              try {
                await api.post('/maintenance', {
                  vehicle: vehId,
                  type: 'routine',
                  title: newMaintTitle,
                  scheduledDate: newMaintDate,
                  cost: newMaintCost,
                  description: newMaintNotes,
                  status: 'scheduled'
                });
                setShowNewMaintModal(false);
                toast.success('Đã tạo lịch bảo dưỡng mới vào hệ thống!');
                loadData();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || 'Lỗi khi tạo lịch bảo dưỡng');
              }
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
