'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { handleImageError, resolveVehicleImage } from '@/lib/media';
import SupportOperationsWorkspace, {
  CATEGORY_LABELS,
  ContractSummary,
  getApiErrorMessage,
  PRIORITY_META,
  REPAIR_STATUS_LABELS,
  STATUS_META,
  SupportContextData,
  SupportTicketIntakeModal,
  TicketRecord,
  TicketSummaryStats,
} from '@/components/support/SupportOperationsWorkspace';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bike,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  Headphones,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserCircle,
  Users,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';

type SupportTabId =
  | 'overview'
  | 'tickets'
  | 'bookings'
  | 'rescue_fleet'
  | 'customers'
  | 'notifications'
  | 'profile';

interface StaffNotification {
  _id: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    ticketId?: string;
    bookingId?: string;
  };
}

const BOOKING_STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Chờ duyệt', bg: '#fef3c7', color: '#b45309' },
  confirmed: { label: 'Đã xác nhận', bg: '#e0f2fe', color: '#0369a1' },
  active: { label: 'Đang thuê xe', bg: '#dcfce7', color: '#15803d' },
  overdue: { label: 'Quá hạn trả', bg: '#fef2f2', color: '#dc2626' },
  completed: { label: 'Đã hoàn thành', bg: '#f1f5f9', color: '#475569' },
  cancelled: { label: 'Đã hủy', bg: '#fee2e2', color: '#b91c1c' },
};

const VEHICLE_STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  available: { label: 'Sẵn sàng đổi xe', bg: '#dcfce7', color: '#15803d' },
  rented: { label: 'Đang cho thuê', bg: '#dbeafe', color: '#1d4ed8' },
  reserved: { label: 'Đã giữ chỗ', bg: '#e0f2fe', color: '#0369a1' },
  maintenance: { label: 'Đang bảo trì', bg: '#fef3c7', color: '#b45309' },
  broken: { label: 'Đang hỏng', bg: '#fef2f2', color: '#dc2626' },
  retired: { label: 'Ngưng hoạt động', bg: '#f1f5f9', color: '#64748b' },
};

export default function SupportPortalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading, initialize, logout, setUser } = useAuthStore();

  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<SupportTabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Notification Bell Popover
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement | null>(null);

  // Global & Tab Filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Shared Create Ticket Intake Modal State
  const [intakeModalState, setIntakeModalState] = useState<{
    open: boolean;
    bookingId?: string;
    customerId?: string;
    nonce: number;
  }>({ open: false, nonce: 0 });

  // Profile & Password Form State (nullable edit overrides avoid useEffect setState)
  const [profNameEdit, setProfNameEdit] = useState<string | null>(null);
  const [profPhoneEdit, setProfPhoneEdit] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  // Auth Bootstrap & Strict Role Guard
  useEffect(() => {
    initialize().finally(() => setAuthReady(true));
  }, [initialize]);

  useEffect(() => {
    if (!authReady || authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (user.role === 'customer') {
      router.push('/portal');
      return;
    }
    if (user.role === 'technician') {
      router.push('/technician');
      return;
    }
    if (!['support', 'admin', 'owner'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [authReady, authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isAllowedStaff = Boolean(authReady && isAuthenticated && user && ['support', 'admin', 'owner'].includes(user.role));

  // Real Tickets Stream
  const { data: ticketsPayload, refetch: refetchTickets } = useQuery<{ data: TicketRecord[]; summary?: TicketSummaryStats }>({
    queryKey: ['tickets'],
    enabled: isAllowedStaff,
    queryFn: async () => {
      const res = await api.get('/tickets');
      return {
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        summary: res.data?.summary,
      };
    },
    refetchInterval: 4000,
  });

  // Real Cross-Module Support Context
  const { data: contextData, refetch: refetchContext } = useQuery<SupportContextData>({
    queryKey: ['support-workspace-context'],
    enabled: isAllowedStaff,
    queryFn: async () => {
      const res = await api.get('/tickets/workspace/context');
      return res.data?.data || {
        customers: [],
        bookings: [],
        availableVehicles: [],
        allVehicles: [],
        supportStaff: [],
        contracts: [],
        repairOrders: [],
      };
    },
    refetchInterval: 12000,
  });

  // Real Shift Notifications
  const { data: notificationsPayload, refetch: refetchNotifs } = useQuery<{ data: StaffNotification[]; unreadCount: number }>({
    queryKey: ['support-notifications'],
    enabled: isAllowedStaff,
    queryFn: async () => {
      const res = await api.get('/notifications');
      return {
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        unreadCount: Number(res.data?.unreadCount || 0),
      };
    },
    refetchInterval: 8000,
  });

  const allTickets = useMemo(() => ticketsPayload?.data || [], [ticketsPayload]);
  const summary: TicketSummaryStats = useMemo(() => {
    if (ticketsPayload?.summary) return ticketsPayload.summary;
    return {
      all: allTickets.length,
      open: allTickets.filter((t) => t.status === 'open').length,
      in_progress: allTickets.filter((t) => t.status === 'in_progress').length,
      resolved: allTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      urgent: allTickets.filter((t) => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length,
      unread: allTickets.filter((t) => t.hasUnreadCustomerMessage).length,
    };
  }, [ticketsPayload, allTickets]);

  const bookings = useMemo(() => contextData?.bookings || [], [contextData]);
  const contracts = useMemo(() => contextData?.contracts || [], [contextData]);
  const customers = useMemo(() => contextData?.customers || [], [contextData]);
  const allVehicles = useMemo(() => contextData?.allVehicles || contextData?.availableVehicles || [], [contextData]);
  const availableVehicles = useMemo(() => contextData?.availableVehicles || [], [contextData]);
  const repairOrders = useMemo(() => contextData?.repairOrders || [], [contextData]);

  const notifications = useMemo(() => notificationsPayload?.data || [], [notificationsPayload]);
  const unreadNotifCount = notificationsPayload?.unreadCount || 0;

  // Map BookingId -> Contract for quick O(1) lookup
  const contractByBookingId = useMemo(() => {
    const map = new Map<string, ContractSummary>();
    for (const c of contracts) {
      if (c.booking) map.set(String(c.booking), c);
    }
    return map;
  }, [contracts]);

  // Priority Queue for Overview
  const priorityTickets = useMemo(() => {
    return allTickets
      .filter((t) => !['resolved', 'closed'].includes(t.status))
      .sort((a, b) => {
        const score = (t: TicketRecord) =>
          (t.hasUnreadCustomerMessage ? 100 : 0) +
          (t.priority === 'urgent' ? 50 : t.priority === 'high' ? 20 : 0) +
          (t.status === 'open' ? 10 : 0);
        return score(b) - score(a);
      })
      .slice(0, 6);
  }, [allTickets]);

  // Cross-ticket recent audit logs for Overview
  const recentAuditFeed = useMemo(() => {
    const entries: Array<{
      id: string;
      ticketId: string;
      ticketCode: string;
      subject: string;
      detail: string;
      actorName: string;
      createdAt: string;
    }> = [];
    for (const t of allTickets) {
      for (const log of t.actionLogs || []) {
        entries.push({
          id: `${t._id}-${log._id || log.createdAt || ''}-${log.action || ''}`,
          ticketId: t._id,
          ticketCode: t.ticketCode || t._id.slice(-6).toUpperCase(),
          subject: t.subject,
          detail: log.detail || log.action || 'Cập nhật xử lý',
          actorName: log.actorName || 'Hệ thống',
          createdAt: log.createdAt || t.createdAt,
        });
      }
    }
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [allTickets]);

  // Filtered Lists for Dedicated Tabs
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
      if (bookingSearch.trim()) {
        const q = bookingSearch.trim().toLowerCase();
        const custObj = typeof b.customer === 'object' ? b.customer : undefined;
        const vehObj = typeof b.vehicle === 'object' ? b.vehicle : undefined;
        const contractObj = contractByBookingId.get(String(b._id));
        const hay = [
          b.bookingCode,
          custObj?.fullName,
          custObj?.phone,
          custObj?.cccd,
          vehObj?.licensePlate,
          vehObj?.name,
          contractObj?.contractCode,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, bookingStatusFilter, bookingSearch, contractByBookingId]);

  const filteredVehicles = useMemo(() => {
    return allVehicles.filter((v) => {
      if (vehicleStatusFilter !== 'all' && v.status !== vehicleStatusFilter) return false;
      if (vehicleSearch.trim()) {
        const q = vehicleSearch.trim().toLowerCase();
        const hay = [v.name, v.brand, v.licensePlate, v.model, v.color].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allVehicles, vehicleStatusFilter, vehicleSearch]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!customerSearch.trim()) return true;
      const q = customerSearch.trim().toLowerCase();
      const hay = [c.fullName, c.phone, c.email, c.cccd, c.drivingLicense, c.address].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [customers, customerSearch]);

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, notifFilter]);

  // Staff Initials
  const staffName = user?.fullName || 'Nhân viên Hỗ trợ';
  const staffInitials = useMemo(() => {
    const parts = staffName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'HT';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [staffName]);

  const openTicketInWorkspace = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('tickets');
  };

  const openIntakeForBooking = (bookingId?: string, customerId?: string) => {
    setIntakeModalState((prev) => ({
      open: true,
      bookingId,
      customerId,
      nonce: prev.nonce + 1,
    }));
  };

  const handleMarkNotifRead = async (notif: StaffNotification) => {
    if (!notif.isRead) {
      api.put(`/notifications/${notif._id}/read`).then(() => refetchNotifs()).catch(() => {});
    }
    setBellOpen(false);
    if (notif.data?.ticketId) {
      openTicketInWorkspace(notif.data.ticketId);
    } else if (notif.type === 'ticket') {
      setActiveTab('tickets');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      refetchNotifs();
      toast.success('Đã đánh dấu tất cả thông báo đã đọc.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật thông báo.'));
    }
  };

  const handleRefreshAll = () => {
    refetchTickets();
    refetchContext();
    refetchNotifs();
    queryClient.invalidateQueries({ queryKey: ['ticket-detail'] });
    toast.success('Đã đồng bộ dữ liệu ca trực mới nhất!');
  };

  const handleCopyText = (val?: string, label = 'SĐT') => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    toast.success(`Đã sao chép ${label}: ${val}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextName = (profNameEdit ?? user?.fullName ?? '').trim();
    const nextPhone = (profPhoneEdit ?? user?.phone ?? '').trim();
    if (!nextName || !nextPhone) {
      toast.error('Vui lòng nhập đầy đủ họ tên và SĐT.');
      return;
    }
    try {
      setSavingProfile(true);
      const res = await api.put('/users/profile', { fullName: nextName, phone: nextPhone });
      if (res.data?.data) setUser(res.data.data);
      toast.success('Đã cập nhật hồ sơ nhân viên hỗ trợ!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      toast.error('Mật khẩu mới tối thiểu 6 ký tự.');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      setSavingPass(true);
      await api.put('/auth/change-password', { currentPassword: currPass, newPassword: newPass });
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
      toast.success('Đổi mật khẩu thành công!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
    } finally {
      setSavingPass(false);
    }
  };

  if (!authReady || authLoading || !isAuthenticated || !user || !['support', 'admin', 'owner'].includes(user.role)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Đang khởi tạo Cổng Nhân Viên Hỗ Trợ...</div>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: SupportTabId; label: string; icon: React.ComponentType<{ size?: number }>; badge?: number }> = [
    { id: 'overview', label: 'Ca trực & SLA', icon: LayoutDashboard, badge: summary.urgent > 0 ? summary.urgent : undefined },
    { id: 'tickets', label: 'Ticket & Live Chat', icon: MessageSquare, badge: summary.open + summary.in_progress },
    { id: 'bookings', label: 'Đơn thuê & Hợp đồng', icon: FileText, badge: bookings.length },
    { id: 'rescue_fleet', label: 'Xe dự phòng & Kỹ thuật', icon: Wrench, badge: repairOrders.filter((r) => r.status !== 'completed').length },
    { id: 'customers', label: 'Hồ sơ Khách hàng', icon: Users },
    { id: 'notifications', label: 'Thông báo Ca trực', icon: Bell, badge: unreadNotifCount },
    { id: 'profile', label: 'Hồ sơ & Bảo mật', icon: UserCircle },
  ];

  const activeRepairCount = repairOrders.filter((r) => r.status !== 'completed' && r.status !== 'customer_rejected').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
      {/* ================= 1. DEDICATED STANDALONE SUPPORT SIDEBAR ================= */}
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
          flexShrink: 0,
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
                background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                flexShrink: 0,
              }}
            >
              <Headphones size={19} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 900, fontSize: '15.5px', color: '#ffffff', letterSpacing: '-0.2px' }}>
                  XTBike <span style={{ color: '#38bdf8' }}>Support</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>CSKH &amp; Cứu Hộ 24/7</div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: sidebarOpen ? '18px 18px 8px' : '14px 10px 6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textAlign: sidebarOpen ? 'left' : 'center',
            }}
          >
            {sidebarOpen ? 'CỔNG NHÂN VIÊN HỖ TRỢ' : '•••'}
          </div>

          <nav style={{ padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <IconComp size={18} />
                    {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                  </div>
                  {sidebarOpen && typeof item.badge === 'number' && item.badge > 0 && (
                    <span
                      style={{
                        background: item.id === 'overview' && summary.urgent > 0 ? '#dc2626' : isActive ? 'rgba(255,255,255,0.22)' : '#0f172a',
                        color: '#ffffff',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        minWidth: '22px',
                        textAlign: 'center',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div style={{ margin: '18px 14px 6px', padding: '12px', borderRadius: '10px', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(248, 113, 113, 0.25)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>Hotline Cứu Hộ 24/7</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>0905.888.999</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>Đà Nẵng • SLA phản hồi &lt; 5 phút</div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', border: '2px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '12.5px', flexShrink: 0 }}>
              {staffInitials}
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staffName}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {user.role === 'support' ? 'Nhân viên Hỗ trợ (CSKH)' : `Quản lý (${user.role})`}
                </div>
              </div>
            )}
          </div>

          {sidebarOpen && ['owner', 'admin'].includes(user.role) && (
            <Link
              href="/dashboard"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '7px 10px',
                marginBottom: '8px',
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>← Về trang Điều hành chung</span>
            </Link>
          )}

          <button
            type="button"
            onClick={async () => {
              await logout();
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
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
          >
            <LogOut size={14} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ================= 2. MAIN STANDALONE WORKSPACE ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Sticky Top Header */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
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
                color: '#475569',
              }}
              title="Thu gọn / mở rộng menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                {navItems.find((n) => n.id === activeTab)?.label || 'Cổng Nhân Viên Hỗ Trợ'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Ca trực: <strong style={{ color: '#059669' }}>Đang trực tuyến</strong> • {summary.open} chờ tiếp nhận • {summary.unread} tin mới
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              style={{
                padding: '7px 11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: soundEnabled ? '#0f172a' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {soundEnabled ? <Volume2 size={15} color="#059669" /> : <VolumeX size={15} />}
              <span>{soundEnabled ? 'Chuông báo: Bật' : 'Chuông báo: Tắt'}</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              style={{
                padding: '7px 11px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={14} />
              <span>Đồng bộ</span>
            </button>

            <button
              type="button"
              onClick={() => openIntakeForBooking()}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            >
              <Plus size={15} />
              <span>Tiếp nhận Hotline</span>
            </button>

            {/* Notification Bell */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setBellOpen((v) => !v)}
                style={{
                  position: 'relative',
                  width: '36px',
                  height: '36px',
                  borderRadius: '9px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#334155',
                }}
              >
                <Bell size={17} />
                {unreadNotifCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      borderRadius: '999px',
                      minWidth: '17px',
                      height: '17px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                    }}
                  >
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '44px',
                    width: '340px',
                    maxHeight: '420px',
                    overflowY: 'auto',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 14px 35px rgba(15, 23, 42, 0.16)',
                    zIndex: 80,
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px' }}>Thông báo ca trực ({unreadNotifCount})</span>
                    {unreadNotifCount > 0 && (
                      <button type="button" onClick={handleMarkAllNotifsRead} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>
                        Đọc hết
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontSize: '12.5px', color: '#94a3b8' }}>Chưa có thông báo nào.</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n._id}
                        type="button"
                        onClick={() => handleMarkNotifRead(n)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 14px',
                          border: 'none',
                          borderBottom: '1px solid #f1f5f9',
                          background: n.isRead ? '#ffffff' : '#eff6ff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: n.isRead ? 600 : 800, fontSize: '12.5px', color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>{n.message}</div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '3px' }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab Workspace Content */}
        <main style={{ padding: '22px 24px', flex: 1 }}>
          {/* ================= TAB 1: OVERVIEW & SLA ================= */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', borderRadius: '14px', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Bàn điều phối CSKH &amp; Cứu hộ 24/7
                  </div>
                  <h1 style={{ margin: '4px 0 6px 0', fontSize: '22px', fontWeight: 900 }}>
                    Xin chào, {staffName}
                  </h1>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    Hiện có <strong style={{ color: '#fbbf24' }}>{summary.open}</strong> phiếu chờ tiếp nhận,{' '}
                    <strong style={{ color: '#f87171' }}>{summary.unread}</strong> tin nhắn khách vừa gửi và{' '}
                    <strong style={{ color: '#34d399' }}>{availableVehicles.length}</strong> xe dự phòng sẵn sàng đổi khẩn cấp.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tickets')}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MessageSquare size={15} />
                    <span>Vào xử lý Ticket ngay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openIntakeForBooking()}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.08)', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={15} />
                    <span>Ghi nhận cuộc gọi Hotline</span>
                  </button>
                </div>
              </div>

              {/* Real-time Operational Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                {[
                  { title: 'Ticket chờ tiếp nhận', value: summary.open, sub: 'Cần nhận & phản hồi ngay', color: '#d97706', bg: '#fffbeb', onClick: () => setActiveTab('tickets') },
                  { title: 'Tin mới chưa đọc', value: summary.unread, sub: 'Khách vừa phản hồi chat', color: '#dc2626', bg: '#fef2f2', onClick: () => setActiveTab('tickets') },
                  { title: 'Đơn đang cho thuê', value: bookings.filter((b) => b.status === 'active' || b.status === 'overdue').length, sub: 'Theo dõi hành trình & quá hạn', color: '#2563eb', bg: '#eff6ff', onClick: () => setActiveTab('bookings') },
                  { title: 'Xe dự phòng sẵn sàng', value: availableVehicles.length, sub: 'Sẵn sàng đổi xe khẩn cấp', color: '#059669', bg: '#f0fdf4', onClick: () => setActiveTab('rescue_fleet') },
                  { title: 'Phiếu kỹ thuật đang mở', value: activeRepairCount, sub: 'Đồng bộ từ Cổng Kỹ Thuật', color: '#ea580c', bg: '#fff7ed', onClick: () => setActiveTab('rescue_fleet') },
                ].map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={card.onClick}
                    style={{ textAlign: 'left', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{card.title}</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: card.color, margin: '6px 0 4px' }}>{card.value}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>{card.sub} →</div>
                  </button>
                ))}
              </div>

              {/* 2 Columns: Priority Queue + Cross-Module Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
                {/* Priority Queue */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={17} color="#dc2626" />
                      <span>Ưu tiên xử lý ngay ({priorityTickets.length})</span>
                    </h2>
                    <button type="button" onClick={() => setActiveTab('tickets')} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      Xem toàn bộ →
                    </button>
                  </div>

                  {priorityTickets.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                      Tuyệt vời! Không có sự cố tồn đọng cần xử lý gấp.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {priorityTickets.map((t) => {
                        const pri = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                        const sta = STATUS_META[t.status] || STATUS_META.open;
                        const veh = t.vehicle || (typeof t.booking?.vehicle === 'object' ? t.booking.vehicle : undefined);
                        return (
                          <div key={t._id} style={{ border: t.hasUnreadCustomerMessage ? '1px solid #fca5a5' : '1px solid #e2e8f0', background: t.hasUnreadCustomerMessage ? '#fffbeb' : '#f8fafc', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '12px' }}>#{t.ticketCode || t._id.slice(-6).toUpperCase()}</span>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, background: pri.bg, color: pri.color, border: `1px solid ${pri.border}`, padding: '1px 7px', borderRadius: '999px' }}>{pri.label}</span>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, background: sta.bg, color: sta.color, border: `1px solid ${sta.border}`, padding: '1px 7px', borderRadius: '999px' }}>{sta.label}</span>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{t.subject}</div>
                              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                                {t.customer?.fullName || 'Khách'} • {t.customer?.phone || '---'} {veh?.licensePlate ? `• Xe ${veh.licensePlate}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openTicketInWorkspace(t._id)}
                              style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>Xử lý</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Audit Feed */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={17} color="#059669" />
                    <span>Nhật ký Điều phối &amp; Cứu hộ gần đây</span>
                  </h2>
                  {recentAuditFeed.length === 0 ? (
                    <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Chưa có lịch sử thao tác ca trực nào.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {recentAuditFeed.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => openTicketInWorkspace(entry.ticketId)}
                          style={{ textAlign: 'left', border: '1px solid #f1f5f9', borderLeft: '3px solid #2563eb', background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 800, color: '#2563eb' }}>
                            <span>#{entry.ticketCode} • {entry.subject}</span>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>{new Date(entry.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#0f172a', marginTop: '3px', fontWeight: 600 }}>{entry.detail}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Thực hiện: {entry.actorName}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: CORE 3-COLUMN TICKETS WORKSPACE ================= */}
          {activeTab === 'tickets' && (
            <SupportOperationsWorkspace
              embeddedInPortal
              controlledSelectedTicketId={selectedTicketId}
              onSelectTicketId={setSelectedTicketId}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((v) => !v)}
              onOpenBookingLookup={(bookingCode) => {
                if (bookingCode) setBookingSearch(bookingCode);
                setActiveTab('bookings');
              }}
            />
          )}

          {/* ================= TAB 3: BOOKINGS & CONTRACTS LOOKUP ================= */}
          {activeTab === 'bookings' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Tra cứu Đơn thuê &amp; Hợp đồng liên kết ({filteredBookings.length})</h2>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Tìm nhanh theo mã đơn BK, mã hợp đồng HĐ, tên/SĐT/CCCD khách hoặc biển số xe để kiểm tra và tạo phiếu hỗ trợ tức thì.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Tìm mã BK, HĐ, SĐT, CCCD, biển số..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      style={{ padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '270px' }}
                    />
                  </div>
                  <select value={bookingStatusFilter} onChange={(e) => setBookingStatusFilter(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang thuê xe</option>
                    <option value="overdue">Quá hạn trả</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Mã Đơn / HĐ</th>
                      <th style={{ padding: '10px 12px' }}>Khách hàng</th>
                      <th style={{ padding: '10px 12px' }}>Xe &amp; Biển số</th>
                      <th style={{ padding: '10px 12px' }}>Lịch thuê</th>
                      <th style={{ padding: '10px 12px' }}>Tổng tiền / Cọc</th>
                      <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thao tác CSKH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                          Không tìm thấy đơn thuê phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => {
                        const cust = typeof b.customer === 'object' ? b.customer : undefined;
                        const veh = typeof b.vehicle === 'object' ? b.vehicle : undefined;
                        const contract = contractByBookingId.get(String(b._id));
                        const st = BOOKING_STATUS_META[b.status || ''] || { label: b.status || '---', bg: '#f1f5f9', color: '#475569' };

                        return (
                          <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>{b.bookingCode}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>HĐ: {contract?.contractCode || 'Chưa lập HĐ'}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 700 }}>{cust?.fullName || contract?.customerInfo?.fullName || '---'}</div>
                              <div style={{ fontSize: '11.5px', color: '#475569' }}>
                                {cust?.phone || contract?.customerInfo?.phone || '---'} • CCCD: {cust?.cccd || contract?.customerInfo?.cccd || '---'}
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 800 }}>{veh?.licensePlate || contract?.vehicleInfo?.licensePlate || '---'}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{veh?.name || contract?.vehicleInfo?.name || '---'}</div>
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '11.5px' }}>
                              <div>Từ: {b.startDate ? new Date(b.startDate).toLocaleString('vi-VN') : '---'}</div>
                              <div>Đến: {b.endDate ? new Date(b.endDate).toLocaleString('vi-VN') : '---'}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 700 }}>{Number(b.finalPrice || b.totalPrice || contract?.totalPayable || 0).toLocaleString('vi-VN')}đ</div>
                              <div style={{ fontSize: '11px', color: '#059669' }}>Cọc: {Number(b.deposit || contract?.depositAmount || 0).toLocaleString('vi-VN')}đ</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: st.bg, color: st.color }}>
                                {st.label}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => openIntakeForBooking(b._id, cust?._id)}
                                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Tạo phiếu hỗ trợ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: RESCUE FLEET & TECHNICAL REPAIRS ================= */}
          {activeTab === 'rescue_fleet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Fleet Availability */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bike size={18} color="#2563eb" />
                      <span>Tình trạng Đội xe &amp; Xe dự phòng đổi khẩn cấp ({filteredVehicles.length})</span>
                    </h2>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Kiểm tra nhanh xe trạng thái &quot;Sẵn sàng đổi xe&quot; trước khi thực hiện đổi xe hoặc tư vấn khách.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Tìm tên xe, biển số..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                    />
                    <select value={vehicleStatusFilter} onChange={(e) => setVehicleStatusFilter(e.target.value)} style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}>
                      <option value="all">Tất cả trạng thái xe</option>
                      <option value="available">Sẵn sàng đổi xe ({availableVehicles.length})</option>
                      <option value="rented">Đang cho thuê</option>
                      <option value="maintenance">Đang bảo trì</option>
                      <option value="broken">Đang hỏng</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {filteredVehicles.map((v) => {
                    const vst = VEHICLE_STATUS_META[v.status || ''] || { label: v.status || '---', bg: '#f1f5f9', color: '#475569' };
                    return (
                      <div key={v._id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <img
                          src={resolveVehicleImage(v)}
                          alt={v.name || 'Xe'}
                          onError={handleImageError()}
                          style={{ width: '58px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#e2e8f0', flexShrink: 0 }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'monospace' }}>{v.licensePlate}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px', background: vst.bg, color: vst.color }}>{vst.label}</span>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {Number(v.pricePerDay || 0).toLocaleString('vi-VN')}đ/ngày • {Number(v.odometer || 0).toLocaleString('vi-VN')} km
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linked Repair Orders from Technician Portal */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <h2 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wrench size={18} color="#ea580c" />
                  <span>Tiến độ Phiếu Kỹ thuật &amp; Sửa chữa liên kết ({repairOrders.length})</span>
                </h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 12px' }}>Mã Phiếu</th>
                        <th style={{ padding: '10px 12px' }}>Xe / Biển số</th>
                        <th style={{ padding: '10px 12px' }}>Đơn / Khách hàng</th>
                        <th style={{ padding: '10px 12px' }}>Nội dung &amp; Xử lý</th>
                        <th style={{ padding: '10px 12px' }}>Dự toán</th>
                        <th style={{ padding: '10px 12px' }}>Trạng thái KTV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repairOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>Chưa có phiếu sửa chữa nào được điều phối.</td>
                        </tr>
                      ) : (
                        repairOrders.map((r) => (
                          <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 800, color: '#ea580c' }}>{r.code}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 700 }}>{r.licensePlate}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{r.vehicleName}</div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: 700 }}>{r.customerName || '---'}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>{r.bookingCode || 'Nội bộ'} • {r.customerPhone || ''}</div>
                            </td>
                            <td style={{ padding: '10px 12px', maxWidth: '300px' }}>
                              <div style={{ fontWeight: 600 }}>{r.issueSummary || r.proposedSolution}</div>
                              {r.technicianName && <div style={{ fontSize: '11px', color: '#64748b' }}>KTV phụ trách: {r.technicianName}</div>}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700 }}>{Number(r.totalEstimatedCost || 0).toLocaleString('vi-VN')}đ</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                                {REPAIR_STATUS_LABELS[r.status || ''] || r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: CUSTOMER DIRECTORY & RISK FLAGS ================= */}
          {activeTab === 'customers' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Hồ sơ Khách hàng &amp; Cảnh báo Rủi ro ({filteredCustomers.length})</h2>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Đối chiếu CCCD/GPLX, phát hiện khách cảnh báo blacklist và mở nhanh phiếu hỗ trợ.
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Tìm tên khách, SĐT, CCCD, GPLX..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    style={{ padding: '8px 10px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', width: '280px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '12px' }}>
                {filteredCustomers.map((c) => {
                  const custBookingsCount = bookings.filter((b) => String(typeof b.customer === 'object' ? b.customer?._id : b.customer || '') === String(c._id)).length;
                  const custTicketsCount = allTickets.filter((t) => String(t.customer?._id || '') === String(c._id)).length;

                  return (
                    <div key={c._id} style={{ border: c.isBlacklisted ? '1px solid #fca5a5' : '1px solid #e2e8f0', background: c.isBlacklisted ? '#fef2f2' : '#f8fafc', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#0f172a' }}>{c.fullName || 'Khách hàng'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '12.5px', color: '#334155' }}>
                            <Phone size={13} color="#2563eb" />
                            <strong>{c.phone || '---'}</strong>
                            {c.phone && (
                              <button type="button" onClick={() => handleCopyText(c.phone)} style={{ border: 'none', background: '#e2e8f0', borderRadius: '4px', padding: '2px 6px', fontSize: '10.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Copy size={10} />
                                Copy
                              </button>
                            )}
                          </div>
                        </div>
                        {c.isBlacklisted ? (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#dc2626', color: '#ffffff', padding: '2px 8px', borderRadius: '999px' }}>Rủi ro cao</span>
                        ) : (
                          <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px' }}>{c.customerTier || 'Tiêu chuẩn'}</span>
                        )}
                      </div>

                      <div style={{ fontSize: '11.5px', color: '#475569', display: 'grid', gap: '2px' }}>
                        <div>CCCD: <strong>{c.cccd || 'Chưa cập nhật'}</strong></div>
                        <div>GPLX: <strong>{c.drivingLicense || 'Chưa cập nhật'}</strong> {c.drivingLicenseClass ? `(Hạng ${c.drivingLicenseClass})` : ''}</div>
                        <div>Địa chỉ: <strong>{c.address || '---'}</strong></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '11.5px' }}>
                        <span style={{ color: '#64748b' }}>
                          <strong>{custBookingsCount}</strong> đơn • <strong>{custTicketsCount}</strong> phiếu
                        </span>
                        <button
                          type="button"
                          onClick={() => openIntakeForBooking(undefined, c._id)}
                          style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          + Tiếp nhận hỗ trợ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 6: SHIFT NOTIFICATIONS ================= */}
          {activeTab === 'notifications' && (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Thông báo Ca trực Hỗ trợ ({filteredNotifications.length})</h2>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>Cảnh báo yêu cầu cứu hộ khẩn cấp, tin nhắn khách hàng và cập nhật sửa chữa.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('all')}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: notifFilter === 'all' ? '#0f172a' : '#ffffff', color: notifFilter === 'all' ? '#ffffff' : '#334155', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter('unread')}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: notifFilter === 'unread' ? '#0f172a' : '#ffffff', color: notifFilter === 'unread' ? '#ffffff' : '#334155', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Chưa đọc ({unreadNotifCount})
                  </button>
                  {unreadNotifCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllNotifsRead}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <CheckCheck size={14} />
                      <span>Đọc tất cả</span>
                    </button>
                  )}
                </div>
              </div>

              {filteredNotifications.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>Không có thông báo nào.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredNotifications.map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => handleMarkNotifRead(n)}
                      style={{
                        textAlign: 'left',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: n.isRead ? '1px solid #e2e8f0' : '1px solid #93c5fd',
                        background: n.isRead ? '#ffffff' : '#eff6ff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: n.isRead ? 700 : 800, fontSize: '13.5px', color: '#0f172a' }}>{n.title}</div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>{n.message}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 7: STAFF PROFILE & PASSWORD ================= */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#2563eb" />
                  <span>Thông tin Nhân viên Hỗ trợ</span>
                </h2>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Họ và tên</label>
                    <input
                      type="text"
                      value={profNameEdit ?? user.fullName ?? ''}
                      onChange={(e) => setProfNameEdit(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      value={profPhoneEdit ?? user.phone ?? ''}
                      onChange={(e) => setProfPhoneEdit(e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Email công việc</label>
                    <input
                      type="text"
                      disabled
                      value={user.email || ''}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '13px', boxSizing: 'border-box', color: '#64748b' }}
                    />
                  </div>
                  <button type="submit" disabled={savingProfile} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                    {savingProfile ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
                  </button>
                </form>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} color="#059669" />
                  <span>Đổi mật khẩu tài khoản</span>
                </h2>
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mật khẩu hiện tại</label>
                    <input type="password" required value={currPass} onChange={(e) => setCurrPass(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mật khẩu mới</label>
                    <input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Xác nhận mật khẩu mới</label>
                    <input type="password" required value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" disabled={savingPass} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start' }}>
                    {savingPass ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </button>
                </form>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} color="#2563eb" />
                  <span>Quy chuẩn SLA Cứu hộ &amp; CSKH XTBike Đà Nẵng</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} /> 1. Phản hồi Khẩn cấp &lt; 3 phút
                    </div>
                    <div style={{ marginTop: '4px', color: '#64748b' }}>Mọi phiếu {CATEGORY_LABELS.rescue} / {CATEGORY_LABELS.breakdown} phải nhấn Nhận xử lý và liên hệ khách ngay.</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} /> 2. Đổi xe đồng bộ Hợp đồng
                    </div>
                    <div style={{ marginTop: '4px', color: '#64748b' }}>Dùng chức năng &quot;Đổi xe khẩn cấp&quot; ngay trong phiếu để cập nhật đồng thời Đơn thuê, Hợp đồng &amp; Kỹ thuật.</div>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} /> 3. Kiểm tra trùng lịch khi Gia hạn
                    </div>
                    <div style={{ marginTop: '4px', color: '#64748b' }}>Không gia hạn bằng tay; luôn thao tác trực tiếp trên phiếu để tự kiểm tra trùng lịch đặt xe kế tiếp.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Shared Hotline Intake Modal triggered from Header / Bookings / Customers tabs */}
      {intakeModalState.open && (
        <SupportTicketIntakeModal
          key={intakeModalState.nonce}
          bookings={bookings}
          customers={customers}
          initialBookingId={intakeModalState.bookingId}
          initialCustomerId={intakeModalState.customerId}
          onClose={() => setIntakeModalState((prev) => ({ ...prev, open: false }))}
          onCreated={(created) => {
            setIntakeModalState((prev) => ({ ...prev, open: false }));
            if (created?._id) {
              setSelectedTicketId(created._id);
            }
            setActiveTab('tickets');
          }}
        />
      )}
    </div>
  );
}
