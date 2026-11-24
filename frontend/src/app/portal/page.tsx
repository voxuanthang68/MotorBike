'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ duyệt', color: '#b45309', bg: '#fef3c7' },
  confirmed: { label: 'Đã đặt (Chờ nhận xe)', color: '#1d4ed8', bg: '#eff6ff' },
  active: { label: 'Đang thuê xe', color: '#15803d', bg: '#dcfce7' },
  completed: { label: 'Hoàn thành', color: '#475569', bg: '#f1f5f9' },
  cancelled: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const getBookingDisplay = (b: any, relatedContract?: any) => {
  if (b.status === 'cancelled') {
    return { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2', step: 0 };
  }
  if (b.status === 'completed') {
    return { label: 'Hoàn thành', color: '#475569', bg: '#f1f5f9', step: 4 };
  }

  // Check if physical handover actually occurred (photos and timestamp recorded)
  const isHandedOver = Boolean(
    b.checkInTime ||
    (b.checkInImages && b.checkInImages.length > 0) ||
    relatedContract?.checkInTime ||
    (relatedContract?.checkInImages && relatedContract?.checkInImages.length > 0)
  );

  if (b.status === 'active' && isHandedOver) {
    return { label: 'Đang thuê xe', color: '#15803d', bg: '#dcfce7', step: 3 };
  }

  // If approved & signed by receptionist/admin
  const isApproved = Boolean(
    b.status === 'confirmed' ||
    b.assignedReceptionist ||
    relatedContract?.staffSignature
  );

  if (isApproved) {
    return { label: 'Đã đặt (Chờ nhận xe)', color: '#1d4ed8', bg: '#eff6ff', step: 2 };
  }

  // Newly placed booking waiting for approval
  return {
    label: b.paymentStatus === 'deposit_paid' ? 'Đã cọc - Chờ duyệt' : 'Chờ duyệt',
    color: '#b45309',
    bg: '#fef3c7',
    step: 1
  };
};

// Sidebar menu items
const MENU_ITEMS = [
  { key: 'dashboard', icon: '🏠', label: 'Trang chủ' },
  { key: 'profile', icon: '👤', label: 'Hồ sơ cá nhân' },
  { key: 'notifications', icon: '🔔', label: 'Thông báo' },
  { key: 'favorites', icon: '❤️', label: 'Xe yêu thích' },
  { key: 'history', icon: '📋', label: 'Đơn thuê xe của tôi' },
  { key: 'contracts', icon: '📄', label: 'Hợp đồng của tôi' },
  { key: 'promotions', icon: '🎁', label: 'Khuyến mãi' },
  { key: 'feedback', icon: '💬', label: 'Gửi phản hồi' },
];

export default function CustomerPortalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout, isAuthenticated, isLoading: authLoading, initialize, setUser } = useAuthStore();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [contractModal, setContractModal] = useState<any | null>(null);
  const [signModal, setSignModal] = useState<any | null>(null);
  const [rescueModal, setRescueModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // Canvas for Customer Digital Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Rescue Ticket Form
  const [rescueSubject, setRescueSubject] = useState('');
  const [rescueDescription, setRescueDescription] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [documentImages, setDocumentImages] = useState<Record<string, string>>({
    cccdFrontImage: user?.cccdFrontImage || '',
    cccdBackImage: user?.cccdBackImage || '',
    drivingLicenseFrontImage: user?.drivingLicenseFrontImage || '',
    drivingLicenseBackImage: user?.drivingLicenseBackImage || '',
  });
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('8bike_favorites');
      if (saved) setFavoriteIds(JSON.parse(saved));
    } catch (e) {}
  }, []);

  // Protect route
  useEffect(() => {
    initialize().finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (authReady && !authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authReady, authLoading, isAuthenticated, router]);

  // Query my bookings
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings');
      return res.data;
    },
    enabled: !!isAuthenticated && !authLoading
  });

  // Query my contracts
  const { data: contractsData } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts');
      return res.data;
    },
    enabled: !!isAuthenticated && !authLoading
  });

  // Query my support tickets
  const { data: ticketsData } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    },
    enabled: !!isAuthenticated && !authLoading
  });

  const { data: notificationsData } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: !!isAuthenticated && !authLoading,
    refetchInterval: 15000,
  });
  const notifications = notificationsData?.data || [];
  const unreadNotifications = notifications.filter((item: any) => !item.isRead).length;

  const markNotificationRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
  };

  const markAllNotificationsRead = async () => {
    await api.put('/notifications/read-all');
    queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
  };

  const NotificationsPanel = () => (
    <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e0e0e0', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#172033' }}>Thông báo</h2>
          <p style={{ margin: '6px 0 0', color: '#8490a5', fontSize: '13px' }}>{unreadNotifications ? `${unreadNotifications} thông báo chưa đọc` : 'Bạn đã xem hết thông báo'}</p>
        </div>
        {unreadNotifications > 0 && <button onClick={markAllNotificationsRead} style={{ border: 0, background: 'transparent', color: TEAL, fontWeight: 700, cursor: 'pointer' }}>Đánh dấu tất cả đã đọc</button>}
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9e9e9e' }}><div style={{ fontSize: '48px' }}>🔔</div><div style={{ fontWeight: 700, color: '#424242' }}>Không có thông báo mới</div><p style={{ fontSize: '14px' }}>Bạn sẽ nhận thông báo khi đơn thuê xe được tạo hoặc cập nhật.</p></div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>{notifications.map((item: any) => <button key={item._id} onClick={() => markNotificationRead(item._id)} style={{ textAlign: 'left', border: '1px solid #e8edf4', borderRadius: '14px', padding: '15px', background: item.isRead ? '#fff' : '#eff8ff', cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><strong style={{ color: '#172033' }}>{item.title}</strong>{!item.isRead && <span style={{ color: TEAL, fontSize: '12px', fontWeight: 700 }}>MỚI</span>}</div><div style={{ color: '#5f6b7a', fontSize: '14px', marginTop: '5px' }}>{item.message}</div><div style={{ color: '#9aa5b5', fontSize: '12px', marginTop: '8px' }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</div></button>)}</div>
      )}
    </div>
  );

  // Sign contract mutation
  const signMutation = useMutation({
    mutationFn: async ({ id, signature }: { id: string; signature: string }) => {
      return api.put(`/contracts/${id}/sign`, { customerSignature: signature });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-contracts'] });
      setSignModal(null);
      if (contractModal) {
        setContractModal(res.data.data);
      }
      toast.success('Ký hợp đồng điện tử thành công! Chúc bạn có chuyến đi an toàn.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ký hợp đồng thất bại!')
  });

  // Create rescue ticket mutation
  const rescueMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/tickets', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setRescueModal(false);
      setRescueSubject('');
      setRescueDescription('');
      toast.success('Đã gửi yêu cầu cứu hộ! Đội hỗ trợ Hải Châu sẽ gọi ngay.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  // Reply message mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return api.post(`/tickets/${id}/reply`, { content });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      setSelectedTicket(res.data.data);
      setReplyMessage('');
      toast.success('Đã gửi phản hồi!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gửi thất bại!')
  });

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất!');
    router.push('/login');
  };

  const handleDocumentFile = (field: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDocumentImages(prev => ({ ...prev, [field]: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const saveDocuments = async () => {
    setSavingDocuments(true);
    try {
      const res = await api.put('/users/profile', documentImages);
      setUser(res.data.data);
      toast.success('Đã lưu ảnh CCCD và GPLX vào hồ sơ.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu giấy tờ.');
    } finally {
      setSavingDocuments(false);
    }
  };

  // Drawing helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#00bfa5';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signModal) return;
    const sig = canvasRef.current?.toDataURL() || '';
    if (!sig) {
      toast.error('Vui lòng vẽ chữ ký vào ô!');
      return;
    }
    signMutation.mutate({ id: signModal._id, signature: sig });
  };

  const handleRescueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rescueMutation.mutate({
      subject: rescueSubject || 'Cần cứu hộ xe gấp trên đường',
      description: rescueDescription,
      priority: 'urgent',
      category: 'vehicle_issue'
    });
  };

  const bookings = bookingsData?.data || [];
  const contracts = contractsData?.data || [];
  const tickets = ticketsData?.data || [];

  const activeBookings = bookings.filter((b: any) => b.status === 'active' || b.status === 'confirmed');
  const completedBookings = bookings.filter((b: any) => b.status === 'completed');

  // Color constants
  const TEAL = '#00bfa5';
  const TEAL_DARK = '#00897b';
  const TEAL_LIGHT = '#e0f2f1';
  const TEAL_BG = '#b2dfdb';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Inter', 'Outfit', -apple-system, sans-serif" }}>
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Logo / Brand */}
        <div
          style={{
            padding: sidebarCollapsed ? '20px 16px' : '24px 24px 20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
              boxShadow: `0 4px 14px ${TEAL}40`,
            }}
          >
            🏍️
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1.2 }}>
                Moto<span style={{ color: TEAL }}>Bike</span>
              </div>
              <div style={{ fontSize: '11px', color: '#9e9e9e', fontWeight: 500 }}>Hải Châu • Đà Nẵng</div>
            </div>
          )}
        </div>

        {/* User Profile Card */}
        {!sidebarCollapsed && (
          <div
            style={{
              margin: '16px',
              padding: '16px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative circle */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.2 }}>{user?.fullName || 'Khách hàng'}</div>
                <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>⭐ Thành viên VIP</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: sidebarCollapsed ? '8px' : '8px 12px', overflowY: 'auto' }}>
          {MENU_ITEMS.map((item) => {
            const isActive = activeMenu === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  width: '100%',
                  padding: sidebarCollapsed ? '14px' : '12px 16px',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  background: isActive ? `${TEAL}15` : 'transparent',
                  color: isActive ? TEAL : '#616161',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  position: 'relative',
                }}
                title={sidebarCollapsed ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: sidebarCollapsed ? '50%' : '0',
                      top: sidebarCollapsed ? 'auto' : '50%',
                      bottom: sidebarCollapsed ? '0' : 'auto',
                      transform: sidebarCollapsed ? 'translateX(-50%)' : 'translateY(-50%)',
                      width: sidebarCollapsed ? '20px' : '3px',
                      height: sidebarCollapsed ? '3px' : '20px',
                      borderRadius: '2px',
                      background: TEAL,
                    }}
                  />
                )}
                <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* SOS Button */}
        <div style={{ padding: sidebarCollapsed ? '12px 8px' : '12px 16px', borderTop: '1px solid #f0f0f0' }}>
          <button
            onClick={() => setRescueModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: sidebarCollapsed ? '14px' : '12px 16px',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              background: '#fff5f5',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: '13px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff5f5'; }}
          >
            <span style={{ fontSize: '18px' }}>🆘</span>
            {!sidebarCollapsed && <span>Cứu Hộ Khẩn Cấp</span>}
          </button>
        </div>

        {/* Logout */}
        <div style={{ padding: sidebarCollapsed ? '8px' : '8px 16px 20px', borderTop: '1px solid #f0f0f0' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              padding: sidebarCollapsed ? '14px' : '12px 16px',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              background: 'transparent',
              color: '#9e9e9e',
              fontWeight: 500,
              fontSize: '14px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fff5f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#9e9e9e'; e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '18px' }}>🚪</span>
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            height: '68px',
            background: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>
              {activeMenu === 'dashboard' && 'Tổng quan'}
              {activeMenu === 'profile' && 'Hồ sơ cá nhân'}
              {activeMenu === 'wallet' && 'Ví của tôi'}
              {activeMenu === 'notifications' && 'Thông báo'}
              {activeMenu === 'favorites' && 'Xe yêu thích'}
              {activeMenu === 'history' && 'Đơn thuê xe của tôi'}
              {activeMenu === 'contracts' && 'Hợp đồng của tôi'}
              {activeMenu === 'promotions' && 'Khuyến mãi'}
              {activeMenu === 'feedback' && 'Gửi phản hồi'}
            </h1>
            <div style={{ fontSize: '12px', color: '#9e9e9e' }}>
              Xin chào, {user?.fullName || 'Khách hàng'}! Chúc bạn ngày mới tốt lành 🏍️
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/"
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                border: `1px solid ${TEAL}`,
                color: TEAL,
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = TEAL; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEAL; }}
            >
              🏠 Trang Chủ
            </Link>

            <Link
              href="/#danh-sach-xe"
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: `0 4px 14px ${TEAL}40`,
                transition: 'all 0.2s ease',
              }}
            >
              🛵 Thuê Xe Mới
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '28px 32px' }}>

          {/* ========== DASHBOARD ========== */}
          {activeMenu === 'dashboard' && (
            <>
              {/* KPI Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
                {/* Card 1: Total Trips */}
                <div
                  style={{
                    borderRadius: '20px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', bottom: '-8px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>Tổng chuyến</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>{bookings.length}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>🏍️ Chuyến đi</div>
                </div>

                {/* Card 2: Active Bikes */}
                <div
                  style={{
                    borderRadius: '20px',
                    padding: '24px',
                    background: `linear-gradient(135deg, ${TEAL} 0%, #00897b 100%)`,
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 8px 32px ${TEAL}50`,
                  }}
                >
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>Xe đang thuê</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>{activeBookings.length}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>🛵 Đang lưu hành</div>
                </div>

                {/* Card 3: Xe Yêu Thích */}
                <div
                  onClick={() => setActiveMenu('favorites')}
                  style={{
                    borderRadius: '20px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>Xe yêu thích</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>{favoriteIds.length}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>❤️ Đã lưu quan tâm</div>
                </div>

                {/* Card 4: Points */}
                <div
                  style={{
                    borderRadius: '20px',
                    padding: '24px',
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(250, 112, 154, 0.3)',
                  }}
                >
                  <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>Điểm tích lũy</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1 }}>250</div>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>⭐ Giảm 10% lần sau</div>
                </div>
              </div>

              {/* Active Rentals Section */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                  marginBottom: '24px',
                }}
              >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>🛵 Xe Đang Thuê</h2>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '2px' }}>Các chuyến xe máy đang hoạt động</div>
                  </div>
                  <span
                    style={{
                      background: `${TEAL}15`,
                      color: TEAL,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {activeBookings.length} xe
                  </span>
                </div>

                {activeBookings.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '52px', marginBottom: '16px' }}>🏍️</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#424242', marginBottom: '8px' }}>Bạn chưa có xe nào đang thuê</div>
                    <p style={{ color: '#9e9e9e', fontSize: '14px', maxWidth: '450px', margin: '0 auto 24px' }}>
                      Khám phá Đèo Hải Vân, Bán đảo Sơn Trà hay Bãi biển Mỹ Khê bằng xe máy hôm nay!
                    </p>
                    <Link
                      href="/#danh-sach-xe"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: `0 6px 20px ${TEAL}40`,
                      }}
                    >
                      🛵 Thuê Xe Ngay
                    </Link>
                  </div>
                ) : (
                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                    {activeBookings.map((b: any) => {
                      const relatedContract = contracts.find((c: any) => c.booking === b._id || c.booking?._id === b._id);
                      return (
                        <div
                          key={b._id}
                          style={{
                            borderRadius: '16px',
                            border: `1px solid ${TEAL}30`,
                            padding: '20px',
                            background: `linear-gradient(135deg, ${TEAL}08 0%, ${TEAL}03 100%)`,
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 25px ${TEAL}15`; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '14px' }}>
                            <div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  background: `${TEAL}18`,
                                  color: TEAL,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  marginBottom: '8px',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                ĐANG LƯU HÀNH
                              </span>
                              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>{b.vehicle?.name || 'Xe Máy'}</h3>
                              <div style={{ fontSize: '13px', color: TEAL, fontWeight: 700, marginTop: '2px' }}>
                                Biển số: {b.vehicle?.licensePlate}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Mã đặt xe</div>
                              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#424242' }}>{b.bookingCode}</div>
                            </div>
                          </div>

                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e8e8e8',
                              padding: '14px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              marginBottom: '14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div>📅 <strong>Thời gian:</strong> {new Date(b.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(b.endDate).toLocaleDateString('vi-VN')} ({b.totalDays} ngày)</div>
                            <div>📍 <strong>Điểm nhận:</strong> {b.pickupLocation || 'Tại cửa hàng Hải Châu'}</div>
                            <div>💰 <strong>Tổng chi phí:</strong> <span style={{ color: TEAL, fontWeight: 700 }}>{b.finalPrice?.toLocaleString('vi-VN')} đ</span></div>
                            <div>🔒 <strong>Tiền cọc:</strong> {b.deposit?.toLocaleString('vi-VN')} đ</div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Hợp đồng:</div>
                              {relatedContract?.customerSignature ? (
                                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✅ Đã ký điện tử</span>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>⏳ Chưa ký</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {relatedContract && (
                                <button
                                  onClick={() => setContractModal(relatedContract)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #e0e0e0',
                                    background: '#fff',
                                    color: '#616161',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  📄 Xem
                                </button>
                              )}
                              {relatedContract && !relatedContract.customerSignature && (
                                <button
                                  onClick={() => setSignModal(relatedContract)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✍️ Ký Ngay
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent History Table */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📋 Đơn đặt xe gần đây</h2>
                    <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '2px' }}>5 đơn mới nhất</div>
                  </div>
                  <button
                    onClick={() => setActiveMenu('history')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '10px',
                      border: `1px solid ${TEAL}`,
                      background: 'transparent',
                      color: TEAL,
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Xem tất cả →
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9e9e9e' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📅</div>
                    <div>Chưa có lịch sử đặt xe</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mã đơn</th>
                          <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xe thuê</th>
                          <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời gian</th>
                          <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng tiền</th>
                          <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 5).map((b: any) => {
                          const sta = STATUS_LABELS[b.status] || { label: b.status, color: '#757575', bg: '#f5f5f5' };
                          return (
                            <tr key={b._id} style={{ borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s ease' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <td style={{ padding: '14px 20px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: TEAL, fontSize: '13px' }}>{b.bookingCode}</span>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#424242' }}>{b.vehicle?.name}</div>
                                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{b.vehicle?.licensePlate}</div>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontSize: '13px', color: '#616161' }}>{new Date(b.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(b.endDate).toLocaleDateString('vi-VN')}</div>
                                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{b.totalDays} ngày</div>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 700, fontSize: '13px', color: '#424242' }}>{b.finalPrice?.toLocaleString('vi-VN')} đ</div>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: sta.bg,
                                    color: sta.color,
                                  }}
                                >
                                  {sta.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== HISTORY TAB ========== */}
          {activeMenu === 'history' && (
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}><h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>📋 Toàn Bộ Lịch Sử Thuê Xe</h2><div style={{ fontSize: 12, color: '#9e9e9e', marginTop: 4 }}>Danh sách các lần thuê xe máy tại XTBike</div></div>
              {loadingBookings ? <div style={{ padding: 60, textAlign: 'center', color: '#9e9e9e' }}>Đang tải lịch sử...</div> : bookings.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#9e9e9e' }}>Bạn chưa có đơn thuê xe nào</div> : <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                {bookings.map((b: any) => {
                  const relatedContract = contracts.find((c: any) => c.booking === b._id || c.booking?._id === b._id);
                  const sta = getBookingDisplay(b, relatedContract);
                  const image = b.vehicle?.mainImage || b.vehicle?.images?.[0]?.url || '/placeholder-bike.jpg';
                  return <div key={b._id} style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', background: '#f8fafc', borderBottom: '1px solid #eef2f7', fontSize: 13 }}>
                      <strong style={{ fontFamily: 'monospace', color: '#172033' }}>{b.bookingCode}</strong>
                      <span style={{ color: '#64748b' }}>
                        ◷ Đặt ngày: {new Date(b.createdAt || b.startDate).toLocaleString('vi-VN')}
                        <b style={{ marginLeft: 14, color: sta.color, background: sta.bg, borderRadius: 20, padding: '6px 14px', fontWeight: 800 }}>
                          {sta.label}
                        </b>
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '170px 1.2fr 1fr 1fr auto', gap: 20, alignItems: 'center', padding: 22 }}>
                      <img src={image.startsWith('http') ? image : `http://localhost:5000${image}`} alt={b.vehicle?.name || 'Xe thuê'} style={{ width: 160, height: 105, objectFit: 'cover', borderRadius: 12, background: '#e2e8f0' }} />
                      <div><div style={{ fontSize: 17, fontWeight: 800, color: '#172033' }}>{b.vehicle?.name}</div><span style={{ display: 'inline-block', marginTop: 7, padding: '4px 10px', borderRadius: 6, color: '#1463ff', background: '#eff6ff', fontSize: 12, fontWeight: 700 }}>{b.vehicle?.licensePlate}</span><div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>Thời gian: {new Date(b.startDate).toLocaleDateString('vi-VN')} → {new Date(b.endDate).toLocaleDateString('vi-VN')} ({b.totalDays} ngày)</div></div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20, fontSize: 13 }}><div style={{ color: '#64748b' }}>Tổng tiền thuê:</div><strong>{(b.finalPrice || b.totalPrice || 0).toLocaleString('vi-VN')} đ</strong><div style={{ color: '#64748b', marginTop: 8 }}>Tiền cọc quy định:</div><strong>{(b.deposit || 0).toLocaleString('vi-VN')} đ</strong></div>
                      <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: 20, fontSize: 13 }}><div style={{ color: '#64748b' }}>Tình trạng cọc:</div><strong style={{ color: b.paymentStatus === 'deposit_paid' || b.paymentStatus === 'fully_paid' ? '#059669' : '#d97706' }}>{b.paymentStatus === 'deposit_paid' || b.paymentStatus === 'fully_paid' ? '✓ Đã cọc' : 'Chưa thanh toán'}</strong><div style={{ color: '#64748b', marginTop: 8 }}>Điểm nhận:</div><span>{b.pickupLocation || 'Tại cửa hàng'}</span></div>
                      {relatedContract ? <button onClick={() => setContractModal(relatedContract)} style={{ minWidth: 150, padding: '10px 14px', borderRadius: 10, border: '1px solid #bfdbfe', background: '#fff', color: '#1463ff', fontWeight: 700, cursor: 'pointer' }}>▣ Hợp Đồng Điện Tử</button> : <span style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center' }}>Chưa có hợp đồng</span>}
                    </div>

                    {/* Tiến trình đơn hàng chuẩn 4 giai đoạn */}
                    <div style={{ background: '#f8fafc', padding: '10px 22px', borderTop: '1px solid #eef2f7', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11.5px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#334155', marginRight: '6px' }}>Tiến trình:</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: sta.step >= 1 ? '#dcfce7' : '#f1f5f9', color: sta.step >= 1 ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                        ✓ 1. Đặt & Cọc xe
                      </span>
                      <span style={{ color: '#cbd5e1' }}>→</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: sta.step >= 2 ? '#dcfce7' : sta.step === 1 ? '#fef3c7' : '#f1f5f9', color: sta.step >= 2 ? '#15803d' : sta.step === 1 ? '#b45309' : '#94a3b8', fontWeight: 600 }}>
                        {sta.step >= 2 ? '✓ 2. Lễ tân duyệt & Ký' : '2. Chờ lễ tân duyệt & ký'}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>→</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: sta.step >= 3 ? '#dcfce7' : sta.step === 2 ? '#eff6ff' : '#f1f5f9', color: sta.step >= 3 ? '#15803d' : sta.step === 2 ? '#1d4ed8' : '#94a3b8', fontWeight: 600 }}>
                        {sta.step >= 3 ? '✓ 3. Đã giao xe (Ảnh & Ký)' : '3. Giao xe (Ảnh & Ký)'}
                      </span>
                      <span style={{ color: '#cbd5e1' }}>→</span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: sta.step >= 4 ? '#dcfce7' : '#f1f5f9', color: sta.step >= 4 ? '#15803d' : '#94a3b8', fontWeight: 600 }}>
                        {sta.step >= 4 ? '✓ 4. Hoàn tất trả xe' : '4. Trả xe & Hoàn tất'}
                      </span>
                    </div>
                  </div>;
                })}
              </div>}
            </div>
          )}
          {activeMenu === 'history' && false && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📋 Toàn Bộ Lịch Sử Thuê Xe</h2>
                <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '2px' }}>Danh sách các lần thuê xe máy tại XTBike</div>
              </div>

              {loadingBookings ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', border: `3px solid ${TEAL_LIGHT}`, borderTop: `3px solid ${TEAL}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  <div style={{ color: '#9e9e9e' }}>Đang tải lịch sử...</div>
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#9e9e9e' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Bạn chưa có đơn thuê xe nào</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mã Đơn</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xe Thuê</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời Gian</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Điểm Nhận Xe</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng Tiền</th>
                        <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b: any) => {
                        const sta = STATUS_LABELS[b.status] || { label: b.status, color: '#757575', bg: '#f5f5f5' };
                        return (
                          <tr key={b._id} style={{ borderBottom: '1px solid #f5f5f5' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: TEAL }}>{b.bookingCode}</span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: 600, color: '#424242' }}>{b.vehicle?.name}</div>
                              <div style={{ fontSize: '11px', color: TEAL }}>{b.vehicle?.licensePlate}</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontSize: '13px' }}>{new Date(b.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(b.endDate).toLocaleDateString('vi-VN')}</div>
                              <div style={{ fontSize: '11px', color: '#9e9e9e' }}>{b.totalDays} ngày</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontSize: '13px' }}>📍 {b.pickupLocation}</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: 700 }}>{b.finalPrice?.toLocaleString('vi-VN')} đ</div>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: sta.bg, color: sta.color }}>{sta.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========== CONTRACTS ========== */}
          {activeMenu === 'contracts' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>📄 Hợp Đồng Thuê Xe</h2>
                  <div style={{ fontSize: '12px', color: '#9e9e9e', marginTop: '2px' }}>Hợp đồng điện tử pháp lý</div>
                </div>
              </div>

              {contracts.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#9e9e9e' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Chưa có hợp đồng nào</div>
                </div>
              ) : (
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
                  {contracts.map((c: any) => (
                    <div
                      key={c._id}
                      style={{
                        borderRadius: '16px',
                        border: '1px solid #e8e8e8',
                        padding: '20px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: TEAL }}>#{c.contractCode || c.contractNumber}</span>
                        {c.customerSignature ? (
                          <span style={{ padding: '3px 10px', borderRadius: '20px', background: '#d1fae5', color: '#059669', fontSize: '11px', fontWeight: 700 }}>✅ Đã ký</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '20px', background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: 700 }}>⏳ Chưa ký</span>
                        )}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#424242', marginBottom: '6px' }}>{c.vehicleInfo?.name}</div>
                      <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '4px' }}>Biển số: {c.vehicleInfo?.licensePlate}</div>
                      <div style={{ fontSize: '12px', color: '#9e9e9e', marginBottom: '12px' }}>
                        {new Date(c.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(c.endDate).toLocaleDateString('vi-VN')} ({c.rentalDays} ngày)
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: TEAL, marginBottom: '14px' }}>{c.totalPayable?.toLocaleString('vi-VN')} đ</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setContractModal(c)}
                          style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #e0e0e0', background: '#fff', color: '#616161', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                        >
                          📄 Xem chi tiết
                        </button>
                        {!c.customerSignature && (
                          <button
                            onClick={() => setSignModal(c)}
                            style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`, color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                          >
                            ✍️ Ký ngay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PROFILE ========== */}
          {activeMenu === 'profile' && (
            <div style={{ maxWidth: '720px' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                }}
              >
                {/* Profile header */}
                <div
                  style={{
                    padding: '32px',
                    background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.25)',
                      border: '3px solid rgba(255,255,255,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '28px',
                    }}
                  >
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'K'}
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 800 }}>{user?.fullName || 'Khách hàng'}</div>
                    <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '4px' }}>⭐ Thành viên VIP • Khách hàng thân thiết</div>
                  </div>
                </div>

                <div style={{ padding: '28px 32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    {[
                      { label: 'Họ và tên', value: user?.fullName || '' },
                      { label: 'Số điện thoại', value: user?.phone || '' },
                      { label: 'Email', value: user?.email || '' },
                      { label: 'Số CCCD / Hộ chiếu', value: user?.cccd || '048200001234' },
                    ].map((field, i) => (
                      <div key={i}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#9e9e9e', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</div>
                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid #e8e8e8',
                            background: '#fafafa',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#424242',
                          }}
                        >
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9e9e9e', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Địa chỉ</div>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e8e8e8',
                        background: '#fafafa',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#424242',
                      }}
                    >
                      {user?.address || 'Quận Hải Châu, TP. Đà Nẵng'}
                    </div>
                  </div>

                  <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '16px', border: '1px solid #e0e0e0', background: '#fafafa' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a', marginBottom: '4px' }}>📎 Giấy tờ thuê xe</div>
                    <div style={{ fontSize: '12px', color: '#777', marginBottom: '14px' }}>Tải ảnh rõ nét CCCD và GPLX để hệ thống xác minh nhanh khi đặt xe.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {[['cccdFrontImage', 'CCCD mặt trước'], ['cccdBackImage', 'CCCD mặt sau'], ['drivingLicenseFrontImage', 'GPLX mặt trước'], ['drivingLicenseBackImage', 'GPLX mặt sau']].map(([field, label]) => (
                        <label key={field} style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '10px', background: '#fff', cursor: 'pointer' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>{label}</div>
                          <input type="file" accept="image/*" onChange={e => handleDocumentFile(field, e.target.files?.[0])} style={{ width: '100%', fontSize: '11px' }} />
                          {documentImages[field] && <img src={documentImages[field]} alt={label} style={{ display: 'block', width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />}
                        </label>
                      ))}
                    </div>
                    <button type="button" onClick={saveDocuments} disabled={savingDocuments} style={{ marginTop: '16px', padding: '10px 18px', border: 'none', borderRadius: '10px', background: TEAL, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{savingDocuments ? 'Đang lưu...' : 'Lưu giấy tờ'}</button>
                  </div>

                  <div
                    style={{
                      background: `${TEAL}10`,
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: `1px solid ${TEAL}25`,
                      fontSize: '13px',
                      color: TEAL,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    ✅ Tài khoản đã được xác minh danh tính - Đủ điều kiện thuê xe không cần giữ CCCD gốc
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== FEEDBACK / TICKETS ========== */}
          {activeMenu === 'feedback' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1a1a1a', margin: 0 }}>💬 Phiếu Hỗ Trợ & Phản Hồi</h2>
                  <div style={{ fontSize: '13px', color: '#9e9e9e' }}>Đội cứu hộ lưu động Hải Châu phục vụ 24/7 tại Đà Nẵng</div>
                </div>
                <button
                  onClick={() => setRescueModal(true)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  🆘 Gửi Yêu Cầu Mới
                </button>
              </div>

              {tickets.length === 0 ? (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1px solid #e0e0e0',
                    padding: '60px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '52px', marginBottom: '16px' }}>🛡️</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#424242', marginBottom: '8px' }}>Chưa có yêu cầu hỗ trợ nào</div>
                  <p style={{ color: '#9e9e9e', fontSize: '14px', maxWidth: '460px', margin: '0 auto' }}>
                    Nếu gặp sự cố trên đường, hãy gửi yêu cầu để đội cứu hộ đến hỗ trợ ngay.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {tickets.map((t: any) => (
                    <div
                      key={t._id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e8e8e8',
                        padding: '20px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: TEAL, fontSize: '12px' }}>#{t._id?.slice(-6).toUpperCase()}</span>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: t.status === 'resolved' ? '#d1fae5' : t.status === 'in_progress' ? '#dbeafe' : '#fef3c7',
                            color: t.status === 'resolved' ? '#059669' : t.status === 'in_progress' ? '#2563eb' : '#d97706',
                          }}
                        >
                          {t.status === 'in_progress' ? 'Đang xử lý' : t.status === 'resolved' ? 'Đã xử lý' : 'Chờ tiếp nhận'}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#424242', marginBottom: '6px' }}>{t.subject}</div>
                      <p style={{ fontSize: '13px', color: '#757575', marginBottom: '14px', lineHeight: 1.6 }}>
                        {t.description}
                      </p>
                      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#9e9e9e' }}>
                          {new Date(t.createdAt).toLocaleString('vi-VN')}
                        </div>
                        <button
                          onClick={() => setSelectedTicket(t)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '10px',
                            border: `1px solid ${TEAL}`,
                            background: 'transparent',
                            color: TEAL,
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          💬 Trò chuyện ({t.messages?.length || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== WALLET ========== */}
          {activeMenu === 'wallet' && (
            <div style={{ maxWidth: '720px' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '32px',
                    background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                    color: '#ffffff',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '14px', opacity: 0.85, marginBottom: '8px' }}>Số dư ví</div>
                  <div style={{ fontSize: '36px', fontWeight: 900, marginBottom: '4px' }}>0 đ</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Điểm tích lũy: 250 điểm ⭐</div>
                </div>
                <div style={{ padding: '28px 32px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#424242', marginBottom: '8px' }}>Chức năng ví đang phát triển</div>
                  <p style={{ color: '#9e9e9e', fontSize: '13px' }}>Sắp ra mắt: Nạp ví, thanh toán không tiền mặt, hoàn tiền tự động.</p>
                </div>
              </div>
            </div>
          )}

          {/* ========== NOTIFICATIONS ========== */}
          {activeMenu === 'notifications' && <NotificationsPanel />}
          {activeMenu === 'notifications' && false && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔔</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#424242', marginBottom: '8px' }}>Không có thông báo mới</div>
              <p style={{ color: '#9e9e9e', fontSize: '14px' }}>Bạn sẽ nhận thông báo khi có cập nhật về đơn thuê xe hoặc khuyến mãi mới.</p>
            </div>
          )}

          {/* ========== FAVORITES ========== */}
          {activeMenu === 'favorites' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e0e0e0',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '52px', marginBottom: '16px' }}>❤️</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#424242', marginBottom: '8px' }}>
                {favoriteIds.length > 0 ? `Bạn đang có ${favoriteIds.length} xe trong danh sách yêu thích` : 'Chưa có xe yêu thích'}
              </div>
              <p style={{ color: '#9e9e9e', fontSize: '14px', marginBottom: '24px' }}>
                {favoriteIds.length > 0
                  ? 'Bấm nút dưới đây để xem lại dàn xe đã lưu và đặt thuê nhanh chóng.'
                  : 'Đánh dấu xe yêu thích trên trang chủ để dễ dàng tìm lại khi cần thuê.'}
              </p>
              <Link
                href="/#danh-sach-xe"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                {favoriteIds.length > 0 ? '🛵 Xem & Đặt Xe Ngay' : '🛵 Xem Dàn Xe'}
              </Link>
            </div>
          )}

          {/* ========== PROMOTIONS ========== */}
          {activeMenu === 'promotions' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {[
                { title: 'Giảm 20% cho khách mới', desc: 'Áp dụng cho lần thuê xe đầu tiên tại XTBike', code: 'NEWBIKE20', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
                { title: 'Giảm 15% cuối tuần', desc: 'Thuê xe T6-CN nhận ngay ưu đãi đặc biệt', code: 'WEEKEND15', bg: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})` },
                { title: 'Thuê 3 ngày giá 2', desc: 'Khuyến mãi đặc biệt tháng 10 cho xe tay ga', code: 'BUY2GET3', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
              ].map((promo, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ padding: '28px', background: promo.bg, color: '#fff' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{promo.title}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px' }}>{promo.desc}</div>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '6px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '14px',
                        letterSpacing: '1px',
                      }}
                    >
                      {promo.code}
                    </div>
                  </div>
                  <div style={{ padding: '16px 28px', background: '#fff' }}>
                    <button
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: `1px solid ${TEAL}`,
                        background: 'transparent',
                        color: TEAL,
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Áp dụng ngay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ==================== MODALS ==================== */}

      {/* MODAL: RESCUE REQUEST */}
      {rescueModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
          onClick={() => setRescueModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#ef4444' }}>🆘 Yêu Cầu Cứu Hộ Gấp</div>
              <button onClick={() => setRescueModal(false)} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleRescueSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#424242', marginBottom: '8px' }}>Vấn đề gặp phải *</label>
                <select
                  value={rescueSubject}
                  onChange={e => setRescueSubject(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '14px', color: '#424242', background: '#fafafa', outline: 'none' }}
                >
                  <option value="Xe bị thủng lốp / cán đinh">Xe bị thủng lốp / cán đinh</option>
                  <option value="Xe bị chết máy giữa đường">Xe bị chết máy giữa đường</option>
                  <option value="Hết xăng cần tiếp nhiên liệu">Hết xăng cần tiếp nhiên liệu</option>
                  <option value="Sự cố gãy gương / đứt dây phanh">Sự cố gãy gương / đứt dây phanh</option>
                  <option value="Yêu cầu đổi xe khác khẩn cấp">Yêu cầu đổi xe khác khẩn cấp</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#424242', marginBottom: '8px' }}>Vị trí hiện tại của bạn *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ số nhà, tên đường, hoặc địa danh gần nhất..."
                  value={rescueDescription}
                  onChange={e => setRescueDescription(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '14px', background: '#fafafa', resize: 'vertical', outline: 'none' }}
                />
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', color: '#ea580c', marginBottom: '20px' }}>
                📞 Hotline: <strong>0905.888.999</strong> (24/7)
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setRescueModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: '#fff', color: '#616161', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={rescueMutation.isPending} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  {rescueMutation.isPending ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL CONTRACT */}
      {contractModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
          onClick={() => setContractModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a' }}>📄 Hợp Đồng #{contractModal.contractNumber}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} style={{ padding: '6px 14px', borderRadius: '10px', border: '1px solid #e0e0e0', background: '#fff', color: '#616161', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>🖨️ In</button>
                <button onClick={() => setContractModal(null)} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '24px', fontSize: '13px', lineHeight: 1.7 }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#616161' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: TEAL, marginTop: '10px' }}>HỢP ĐỒNG CHO THUÊ XE MÁY ĐIỆN TỬ</div>
              </div>

              <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', padding: '16px', borderRadius: '14px', marginBottom: '16px' }}>
                <div><strong>Bên Cho Thuê:</strong> Cửa hàng XTBike - 128 Bạch Đằng, Đà Nẵng</div>
                <div><strong>Bên Thuê:</strong> {contractModal.customerInfo?.fullName || user?.fullName} ({contractModal.customerInfo?.phone})</div>
                <div><strong>Xe thuê:</strong> {contractModal.vehicleInfo?.name} - Biển số: <span style={{ color: TEAL, fontWeight: 700 }}>{contractModal.vehicleInfo?.licensePlate}</span></div>
                <div><strong>Thời hạn:</strong> {new Date(contractModal.startDate).toLocaleDateString('vi-VN')} đến {new Date(contractModal.endDate).toLocaleDateString('vi-VN')} ({contractModal.rentalDays} ngày)</div>
                <div><strong>Tổng tiền:</strong> {contractModal.totalPayable?.toLocaleString('vi-VN')} đ (Cọc: {contractModal.depositAmount?.toLocaleString('vi-VN')} đ)</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginTop: '18px', background: '#fff' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0f172a' }}>I. Thông tin định danh và tài sản thuê</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: '#475569' }}>
                  <div><strong>CCCD:</strong> {contractModal.customerInfo?.cccd || 'Chưa cập nhật'}</div>
                  <div><strong>GPLX:</strong> {contractModal.customerInfo?.drivingLicense || 'Chưa cập nhật'}</div>
                  <div><strong>Hãng xe:</strong> {contractModal.vehicleInfo?.brand || '—'}</div>
                  <div><strong>Model/Màu:</strong> {contractModal.vehicleInfo?.model || '—'} / {contractModal.vehicleInfo?.color || '—'}</div>
                  <div><strong>Đơn giá/ngày:</strong> {contractModal.pricePerDay?.toLocaleString('vi-VN') || 0} đ</div>
                  <div><strong>Hình thức:</strong> {contractModal.rentalType === 'monthly' ? `Theo tháng (${contractModal.rentalMonths || 1} tháng)` : 'Theo ngày'}</div>
                </div>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginTop: '14px', background: '#f8fafc' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0f172a' }}>II. Chi phí và dịch vụ</h3>
                <div><strong>Tiền thuê:</strong> {contractModal.totalRentalFee?.toLocaleString('vi-VN') || 0} đ</div>
                <div><strong>Phí dịch vụ:</strong> {contractModal.serviceFee?.toLocaleString('vi-VN') || 0} đ</div>
                <div><strong>Phụ kiện:</strong> {contractModal.accessories?.length ? contractModal.accessories.map((item: any) => `${item.name} (${item.price?.toLocaleString('vi-VN')} đ)`).join(', ') : 'Không chọn'}</div>
                <div><strong>Mã giảm giá:</strong> {contractModal.couponCode || 'Không có'}</div>
                <div><strong>Giảm giá:</strong> {contractModal.discountAmount?.toLocaleString('vi-VN') || 0} đ</div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #cbd5e1', fontSize: '16px' }}><strong>Tổng phải trả:</strong> <strong style={{ float: 'right', color: TEAL }}>{contractModal.totalPayable?.toLocaleString('vi-VN')} đ</strong></div>
                <div><strong>Tiền cọc:</strong> <span style={{ float: 'right' }}>{contractModal.depositAmount?.toLocaleString('vi-VN')} đ</span></div>
              </div>
              <div style={{ marginTop: '18px', padding: '20px', borderRadius: '14px', background: '#fffdf5', border: '1px solid #fde68a', whiteSpace: 'pre-line', lineHeight: 1.75, color: '#334155' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0f172a' }}>III. Điều khoản hợp đồng</h3>
                {contractModal.termsAndConditions || 'Hợp đồng tuân thủ các quy định về giao nhận, sử dụng, bảo quản, trả xe, bồi thường thiệt hại, phạt vi phạm và giải quyết tranh chấp theo pháp luật Việt Nam.'}
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#616161', marginBottom: '10px', textTransform: 'uppercase' }}>Đại diện cửa hàng (Bên A)</div>
                  {contractModal.staffSignature ? (
                    <img src={contractModal.staffSignature} alt="Staff signature" style={{ height: '60px', margin: '0 auto' }} />
                  ) : (
                    <div style={{ color: '#10b981', fontWeight: 600 }}>✓ Đã xác nhận hệ thống</div>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#616161', marginBottom: '10px', textTransform: 'uppercase' }}>Khách hàng (Bên B)</div>
                  {contractModal.customerSignature ? (
                    <div>
                      <img src={contractModal.customerSignature} alt="Customer signature" style={{ height: '60px', margin: '0 auto' }} />
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✓ Đã ký số điện tử</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setContractModal(null); setSignModal(contractModal); }}
                      style={{ padding: '8px 20px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`, color: '#fff', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                    >
                      ✍️ Ký Ngay
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DIGITAL SIGN CANVAS */}
      {signModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
          onClick={() => setSignModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1a1a1a' }}>✍️ Ký Hợp Đồng #{signModal.contractNumber}</div>
              <button onClick={() => setSignModal(null)} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSignSubmit} style={{ padding: '24px' }}>
              <div style={{ fontSize: '13px', color: '#757575', marginBottom: '16px', lineHeight: 1.6 }}>
                Tôi cam kết đã nhận xe trong tình trạng an toàn và đồng ý với các điều khoản thuê xe của XTBike.
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#424242' }}>Vẽ chữ ký của bạn *</label>
                  <button type="button" onClick={clearCanvas} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                    Xóa ký lại
                  </button>
                </div>

                <div style={{ border: `2px dashed ${TEAL}50`, borderRadius: '14px', background: '#fafafa', overflow: 'hidden' }}>
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={150}
                    style={{ width: '100%', height: '150px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#9e9e9e', marginTop: '6px' }}>
                  Ký bằng chuột hoặc chạm cảm ứng ngón tay trên điện thoại
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setSignModal(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: '#fff', color: '#616161', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={signMutation.isPending} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`, color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  {signMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHAT WITH SUPPORT */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              maxWidth: '580px',
              width: '100%',
              height: '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a' }}>💬 {selectedTicket.subject}</div>
                <div style={{ fontSize: '11px', color: '#9e9e9e' }}>Mã: #{selectedTicket._id?.slice(-6).toUpperCase()}</div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#9e9e9e', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedTicket.messages?.map((msg: any, idx: number) => {
                const isMe = msg.sender?._id === user?._id;
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: isMe ? `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})` : '#ffffff',
                      border: isMe ? 'none' : '1px solid #e8e8e8',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      fontSize: '13px',
                      color: isMe ? '#ffffff' : '#424242',
                      boxShadow: isMe ? `0 2px 10px ${TEAL}30` : '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '3px' }}>
                      {isMe ? 'Bạn' : 'Đội cứu hộ Hải Châu'}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!replyMessage.trim()) return;
                replyMutation.mutate({ id: selectedTicket._id, content: replyMessage });
              }}
              style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none' }}
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Spin animation for loading */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
