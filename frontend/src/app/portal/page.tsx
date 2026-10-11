'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ duyệt', class: 'badge-pending' },
  confirmed: { label: 'Đã xác nhận', class: 'badge-confirmed' },
  active: { label: 'Đang thuê', class: 'badge-active' },
  completed: { label: 'Đã hoàn thành', class: 'badge-completed' },
  cancelled: { label: 'Đã hủy', class: 'badge-cancelled' },
};

export default function CustomerPortalPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rentals' | 'history' | 'tickets' | 'profile'>('rentals');

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

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Query my bookings
  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await api.get('/bookings');
      return res.data;
    },
    enabled: !!isAuthenticated
  });

  // Query my contracts
  const { data: contractsData } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts');
      return res.data;
    },
    enabled: !!isAuthenticated
  });

  // Query my support tickets
  const { data: ticketsData } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    },
    enabled: !!isAuthenticated
  });

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
    ctx.strokeStyle = '#f97316';
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Background Glow */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.12), transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* TOP HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10, 10, 15, 0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-primary)',
          padding: '14px 24px'
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🏍️
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                MotoBike <span className="gradient-text">Hải Châu</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cổng Khách Hàng</div>
            </div>
          </Link>

          {/* User Bar & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href="/" className="btn btn-secondary btn-sm">
              <span>🏠</span> Trang Chủ
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--brand-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: 'white'
                }}
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || 'K'}
              </div>
              <div className="hidden-mobile">
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.fullName || 'Khách hàng'}</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 500 }}>Khách hàng thân thiết (VIP)</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-sm"
              style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              title="Đăng xuất"
            >
              🚪 Thoát
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        {/* Welcome Banner */}
        <div
          className="glass-card"
          style={{
            padding: '28px',
            marginBottom: '32px',
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand-primary)', fontWeight: 700, marginBottom: '6px' }}>
              XIN CHÀO BẠN ĐẾN VỚI ĐÀ NẴNG
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
              Chào mừng, <span className="gradient-text">{user?.fullName || 'Khách hàng'}</span>!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px' }}>
              Quản lý hành trình thuê xe, hợp đồng điện tử pháp lý và yêu cầu đội cứu hộ lưu động 24/7 tại Quận Hải Châu.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => setRescueModal(true)} className="btn btn-danger">
              <span>🆘</span> Cứu Hộ Khẩn Cấp 24/7
            </button>
            <Link href="/#danh-sach-xe" className="btn btn-primary">
              <span>🛵</span> Thuê Thêm Xe Mới
            </Link>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>XE ĐANG THUÊ</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>
              {activeBookings.length} xe
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '2px' }}>Đang lưu thông an toàn</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>HỢP ĐỒNG ĐIỆN TỬ</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>
              {contracts.length} hợp đồng
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Pháp lý minh bạch</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>YÊU CẦU HỖ TRỢ</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>
              {tickets.length} yêu cầu
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Cứu hộ lưu động</div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ĐIỂM TÍCH LŨY</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-yellow)', marginTop: '4px' }}>
              250 điểm
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-yellow)', marginTop: '2px' }}>Giảm 10% lần thuê tới</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'rentals' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rentals')}
          >
            🛵 Chuyến Xe Hiện Tại ({activeBookings.length})
          </button>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            📅 Lịch Sử Đặt Xe ({bookings.length})
          </button>
          <button
            className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('tickets')}
          >
            🆘 Cứu Hộ & Khiếu Nại ({tickets.length})
          </button>
          <button
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Hồ Sơ Khách Hàng
          </button>
        </div>

        {/* TAB 1: ACTIVE RENTALS & E-CONTRACTS */}
        {activeTab === 'rentals' && (
          <div>
            {activeBookings.length === 0 ? (
              <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏍️</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Hiện tại bạn chưa có xe nào đang thuê</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px' }}>
                  Bạn có muốn thuê xe máy để vi vu khám phá Đèo Hải Vân, Bán đảo Sơn Trà hay Chùa Linh Ứng hôm nay không?
                </p>
                <Link href="/#danh-sach-xe" className="btn btn-primary">
                  Xem Dàn Xe & Đặt Ngay
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                {activeBookings.map((b: any) => {
                  const relatedContract = contracts.find((c: any) => c.booking === b._id || c.booking?._id === b._id);
                  return (
                    <div key={b._id} className="glass-card" style={{ padding: '24px', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                        <div>
                          <span className="badge badge-active" style={{ marginBottom: '8px' }}>ĐANG LƯU HÀNH</span>
                          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{b.vehicle?.name || 'Xe Đang Thuê'}</h3>
                          <div style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 700 }}>
                            Biển số: {b.vehicle?.licensePlate}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mã đặt xe</div>
                          <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.bookingCode}</div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>📅 <strong>Thời gian:</strong> {new Date(b.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(b.endDate).toLocaleDateString('vi-VN')} ({b.totalDays} ngày)</div>
                        <div>📍 <strong>Điểm nhận:</strong> {b.pickupLocation || 'Tại cửa hàng Hải Châu'}</div>
                        <div>💰 <strong>Tổng chi phí:</strong> <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{b.finalPrice?.toLocaleString('vi-VN')} đ</span></div>
                        <div>🔒 <strong>Tiền cọc giữ:</strong> {b.deposit?.toLocaleString('vi-VN')} đ</div>
                      </div>

                      {/* Contract status */}
                      <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hợp đồng điện tử:</div>
                          {relatedContract?.customerSignature ? (
                            <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>✅ Đã ký số điện tử</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--accent-yellow)', fontWeight: 600 }}>⏳ Chưa ký chữ ký</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {relatedContract && (
                            <button
                              onClick={() => setContractModal(relatedContract)}
                              className="btn btn-sm btn-secondary"
                            >
                              📄 Xem Hợp Đồng
                            </button>
                          )}
                          {relatedContract && !relatedContract.customerSignature && (
                            <button
                              onClick={() => setSignModal(relatedContract)}
                              className="btn btn-sm btn-primary"
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
        )}

        {/* TAB 2: BOOKING HISTORY */}
        {activeTab === 'history' && (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Toàn Bộ Lịch Sử Thuê Xe Của Bạn</h2>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Danh sách các lần thuê xe máy tại MotoBike Hải Châu</div>
            </div>

            {loadingBookings ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <div style={{ color: 'var(--text-secondary)' }}>Đang tải lịch sử...</div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-text">Bạn chưa có đơn thuê xe nào</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã Đơn</th>
                      <th>Xe Thuê</th>
                      <th>Thời Gian</th>
                      <th>Điểm Nhận Xe</th>
                      <th>Tổng Tiền</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b: any) => {
                      const sta = STATUS_LABELS[b.status] || { label: b.status, class: 'badge-pending' };
                      return (
                        <tr key={b._id}>
                          <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>{b.bookingCode}</span></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{b.vehicle?.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>{b.vehicle?.licensePlate}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px' }}>{new Date(b.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(b.endDate).toLocaleDateString('vi-VN')}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.totalDays} ngày</div>
                          </td>
                          <td><div style={{ fontSize: '13px' }}>📍 {b.pickupLocation}</div></td>
                          <td><div style={{ fontWeight: 700 }}>{b.finalPrice?.toLocaleString('vi-VN')} đ</div></td>
                          <td><span className={`badge ${sta.class}`}>{sta.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RESCUE & SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Phiếu Cứu Hộ & Hỗ Trợ Kỹ Thuật</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Đội cứu hộ lưu động Hải Châu sẵn sàng ứng cứu trên toàn địa bàn TP Đà Nẵng</div>
              </div>
              <button onClick={() => setRescueModal(true)} className="btn btn-danger">
                <span>🆘</span> Gửi Yêu Cầu Cứu Hộ Gấp
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="glass-card" style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Bạn chưa có yêu cầu sự cố nào</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '460px', margin: '0 auto' }}>
                  Nếu gặp sự cố thủng lốp, hỏng xe giữa đường tại Sơn Trà, Đèo Hải Vân hay nội thành, hãy bấm gửi yêu cầu để nhân viên đến hỗ trợ.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {tickets.map((t: any) => (
                  <div key={t._id} className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <span className="badge badge-broken">#{t._id?.slice(-6).toUpperCase()}</span>
                      <span className="badge badge-confirmed">{t.status === 'in_progress' ? 'Đang cứu hộ' : t.status === 'resolved' ? 'Đã xử lý' : 'Chờ tiếp nhận'}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{t.subject}</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                      {t.description}
                    </p>
                    <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(t.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <button onClick={() => setSelectedTicket(t)} className="btn btn-sm btn-secondary">
                        💬 Trò Chuyện ({t.messages?.length || 0})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <div className="glass-card" style={{ padding: '32px', maxWidth: '680px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Hồ Sơ Định Danh Khách Hàng</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Thông tin được bảo mật và dùng để đối soát hợp đồng thuê xe máy tự lái
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '13px' }}>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" disabled value={user?.fullName || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input className="form-input" disabled value={user?.phone || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" disabled value={user?.email || ''} />
              </div>
              <div className="form-group">
                <label className="form-label">Số CCCD / Hộ chiếu</label>
                <input className="form-input" disabled value={user?.cccd || '048200001234'} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Địa chỉ</label>
              <input className="form-input" disabled value={user?.address || 'Quận Hải Châu, TP. Đà Nẵng'} />
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px', color: 'var(--accent-green)' }}>
              ✓ Tài khoản đã được xác minh danh tính và đủ điều kiện thuê xe không cần giữ CCCD gốc.
            </div>
          </div>
        )}
      </main>

      {/* MODAL: RESCUE REQUEST */}
      {rescueModal && (
        <div className="modal-overlay" onClick={() => setRescueModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">🆘 Gửi Yêu Cầu Cứu Hộ Gấp Tại Đà Nẵng</div>
              <button onClick={() => setRescueModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleRescueSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Vấn đề gặp phải *</label>
                <select className="form-input" value={rescueSubject} onChange={e => setRescueSubject(e.target.value)}>
                  <option value="Xe bị thủng lốp / cán đinh">Xe bị thủng lốp / cán đinh</option>
                  <option value="Xe bị chết máy giữa đường">Xe bị chết máy giữa đường</option>
                  <option value="Hết xăng cần tiếp nhiên liệu">Hết xăng cần tiếp nhiên liệu</option>
                  <option value="Gãy gương / đứt dây ga / va chạm">Sự cố gãy gương / đứt dây phanh</option>
                  <option value="Yêu cầu đổi xe khác khẩn cấp">Yêu cầu đổi xe khác khẩn cấp</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Vị trí hiện tại của bạn *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ghi rõ số nhà, tên đường, hoặc địa danh gần nhất (Ví dụ: Chân cầu Rồng, Đỉnh Đèo Hải Vân, Bãi biển Mỹ Khê...)"
                  className="form-input"
                  value={rescueDescription}
                  onChange={e => setRescueDescription(e.target.value)}
                />
              </div>

              <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '12px', borderRadius: '10px', fontSize: '12px', color: 'var(--brand-primary)', marginBottom: '16px' }}>
                Hotline đội cứu hộ trực ban: <strong>0905.888.999</strong> (Hỗ trợ 24/7)
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setRescueModal(false)} className="btn btn-secondary w-full">Hủy</button>
                <button type="submit" disabled={rescueMutation.isPending} className="btn btn-danger w-full">
                  {rescueMutation.isPending ? 'Đang gửi...' : 'Gửi Yêu Cầu Cứu Hộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL CONTRACT */}
      {contractModal && (
        <div className="modal-overlay" onClick={() => setContractModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <div className="modal-title">📄 Hợp Đồng Thuê Xe #{contractModal.contractNumber}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-sm btn-secondary">🖨️ In</button>
                <button onClick={() => setContractModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '13px', lineHeight: 1.6 }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontWeight: 800 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '12px', fontStyle: 'italic' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '8px' }}>
                  HỢP ĐỒNG CHO THUÊ XE MÁY ĐIỆN TỬ
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', marginBottom: '14px' }}>
                <div><strong>Bên Cho Thuê:</strong> Cửa hàng MotoBike Hải Châu - 128 Bạch Đằng, Đà Nẵng</div>
                <div><strong>Bên Thuê:</strong> {contractModal.customerInfo?.fullName || user?.fullName} ({contractModal.customerInfo?.phone})</div>
                <div><strong>Xe thuê:</strong> {contractModal.vehicleInfo?.name} - Biển số: <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{contractModal.vehicleInfo?.licensePlate}</span></div>
                <div><strong>Thời hạn:</strong> {new Date(contractModal.startDate).toLocaleDateString('vi-VN')} đến {new Date(contractModal.endDate).toLocaleDateString('vi-VN')} ({contractModal.rentalDays} ngày)</div>
                <div><strong>Tổng tiền thuê:</strong> {contractModal.totalPayable?.toLocaleString('vi-VN')} đ (Cọc: {contractModal.depositAmount?.toLocaleString('vi-VN')} đ)</div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>ĐẠI DIỆN CỬA HÀNG (BÊN A)</div>
                  {contractModal.staffSignature ? (
                    <img src={contractModal.staffSignature} alt="Chữ ký cửa hàng" style={{ height: '60px', margin: '0 auto' }} />
                  ) : (
                    <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>✓ Đã xác nhận hệ thống</div>
                  )}
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>KHÁCH HÀNG THUÊ XE (BÊN B)</div>
                  {contractModal.customerSignature ? (
                    <div>
                      <img src={contractModal.customerSignature} alt="Chữ ký khách hàng" style={{ height: '60px', margin: '0 auto' }} />
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', marginTop: '4px' }}>✓ Đã ký số điện tử</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setContractModal(null); setSignModal(contractModal); }}
                      className="btn btn-sm btn-primary"
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
        <div className="modal-overlay" onClick={() => setSignModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-title">✍️ Ký Tên Hợp Đồng Thuê Xe #{signModal.contractNumber}</div>
              <button onClick={() => setSignModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSignSubmit}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Tôi cam kết đã nhận xe trong tình trạng an toàn và đồng ý với các điều khoản thuê xe của MotoBike Hải Châu.
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label">Vẽ chữ ký của bạn vào ô dưới đây *</label>
                  <button type="button" onClick={clearCanvas} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '12px', cursor: 'pointer' }}>
                    Xóa ký lại
                  </button>
                </div>

                <div style={{ border: '2px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
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
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Ký bằng chuột hoặc chạm cảm ứng ngón tay trên điện thoại
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setSignModal(null)} className="btn btn-secondary w-full">Hủy</button>
                <button type="submit" disabled={signMutation.isPending} className="btn btn-primary w-full">
                  {signMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Ký Hợp Đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHAT WITH SUPPORT */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px', height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">💬 {selectedTicket.subject}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã ticket: #{selectedTicket._id?.slice(-6).toUpperCase()}</div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Conversation Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedTicket.messages?.map((msg: any, idx: number) => {
                const isMe = msg.sender?._id === user?._id;
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: isMe ? 'var(--brand-gradient)' : 'rgba(255,255,255,0.08)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      color: 'white'
                    }}
                  >
                    <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>
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
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className="form-input"
                style={{ flex: 1 }}
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Gửi</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
