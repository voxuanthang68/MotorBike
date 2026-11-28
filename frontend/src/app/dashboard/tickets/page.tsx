'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

// Web Audio API beep sound for instant new message notification
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

const PRIORITY_BADGES: Record<string, { label: string; class: string }> = {
  urgent: { label: '🚨 Khẩn cấp', class: 'badge-broken' },
  high: { label: '⚡ Ưu tiên cao', class: 'badge-pending' },
  medium: { label: 'Bình thường', class: 'badge-confirmed' },
  low: { label: 'Thấp', class: 'tag' },
};

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  open: { label: 'Chờ xử lý', class: 'badge-pending' },
  in_progress: { label: 'Đang hỗ trợ', class: 'badge-confirmed' },
  resolved: { label: 'Đã giải quyết', class: 'badge-active' },
  closed: { label: 'Đã đóng', class: 'badge-completed' },
};

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for creating support ticket
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('urgent');
  const [category, setCategory] = useState('rescue'); // rescue, breakdown, extension, deposit, general

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch tickets with 3-second polling for real-time new message detection
  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    },
    refetchInterval: 3000,
  });

  // Real-time polling when a chat modal is open
  useEffect(() => {
    if (!selectedTicket?._id) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/tickets/${selectedTicket._id}`);
        const fresh = res.data?.data;
        if (fresh) {
          const oldLen = selectedTicket.messages?.length || 0;
          const newLen = fresh.messages?.length || 0;
          if (newLen > oldLen) {
            const lastMsg = fresh.messages[newLen - 1];
            const isMe = lastMsg.sender?._id === user?._id;
            if (!isMe) {
              playNotificationSound();
              toast('💬 Khách hàng vừa gửi tin nhắn mới!', { icon: '🔔' });
            }
          }
          setSelectedTicket(fresh);
        }
      } catch (err) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedTicket?._id, user?._id, selectedTicket?.messages?.length]);

  // Scroll to bottom when message list changes
  useEffect(() => {
    if (selectedTicket) {
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedTicket?.messages?.length]);

  // Open ticket handler that fetches fresh ticket details & marks read
  const handleOpenTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      api.put(`/tickets/${ticket._id}/mark-read`).catch(() => {});
      const res = await api.get(`/tickets/${ticket._id}`);
      if (res.data?.data) {
        setSelectedTicket(res.data.data);
      }
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    toast.loading('Đang lấy tọa độ GPS...', { id: 'gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsLink = `📍 Vị trí hiện tại: https://maps.google.com/?q=${latitude},${longitude}`;
        setReplyContent((prev) => (prev ? `${prev} - ${mapsLink}` : mapsLink));
        toast.success('Đã gắn tọa độ định vị!', { id: 'gps' });
      },
      (err) => {
        toast.error('Không thể lấy vị trí GPS. Hãy bật định vị trên thiết bị.', { id: 'gps' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/tickets', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setCreateModal(false);
      setSubject('');
      setDescription('');
      toast.success('Gửi yêu cầu hỗ trợ thành công! Đội ngũ cứu hộ sẽ liên hệ ngay.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  // Reply message mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, content, attachments }: { id: string; content: string; attachments?: string[] }) => {
      return api.post(`/tickets/${id}/reply`, { content, attachments });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(res.data.data);
      setReplyContent('');
      setAttachedImage(null);
      toast.success('Đã gửi phản hồi hỗ trợ!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Gửi phản hồi thất bại!')
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      return api.put(`/tickets/${id}`, { status, resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(null);
      toast.success('Cập nhật trạng thái sự cố thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      subject,
      description,
      priority,
      category,
    });
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!replyContent.trim() && !attachedImage) || !selectedTicket) return;
    replyMutation.mutate({
      id: selectedTicket._id,
      content: replyContent.trim(),
      attachments: attachedImage ? [attachedImage] : []
    });
  };

  const tickets = data?.data || [];
  const unreadCount = tickets.filter((t: any) => t.hasUnreadCustomerMessage).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🎫 Nhân Viên Hỗ Trợ & Cứu Hộ Sự Cố 24/7</h1>
          <p className="page-subtitle">Tiếp nhận sự cố cứu hộ đường bộ (thủng lốp, hết xăng, đổi xe khẩn cấp) tại Hải Châu & Đà Nẵng</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
          <span>+</span> Báo Sự Cố Khẩn Cấp
        </button>
      </div>

      {/* Unread Alert Banner */}
      {unreadCount > 0 && (
        <div
          style={{
            padding: '14px 20px',
            marginBottom: '16px',
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            animation: 'pulse 2s infinite',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '15px' }}>
                CÓ {unreadCount} SỰ CỐ ĐANG CÓ TIN NHẮN MỚI TỪ KHÁCH HÀNG!
              </div>
              <div style={{ fontSize: '12px', color: '#991b1b' }}>
                Khách hàng đang đợi phản hồi trên đường. Hãy bấm &quot;Trả lời ngay&quot; để hỗ trợ khách.
              </div>
            </div>
          </div>
          <span style={{ background: '#dc2626', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
            {unreadCount} tin nhắn chờ
          </span>
        </div>
      )}

      {/* Emergency rescue banner */}
      <div
        className="glass-card"
        style={{
          padding: '20px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '36px' }}>🆘</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-red)' }}>ĐỘI CỨU HỘ LƯU ĐỘNG HẢI CHÂU - ĐÀ NẴNG</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Có mặt trong 15-30 phút tại các quận trung tâm, đèo Hải Vân và bán đảo Sơn Trà</div>
          </div>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-primary)', background: '#ffffff', border: '1px solid #fed7aa', padding: '8px 16px', borderRadius: '8px' }}>
          Hotline Cứu Hộ: 0905.888.999
        </div>
      </div>

      {/* Tickets List */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách sự cố...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛡️</div>
            <div className="empty-state-text">Không có sự cố nào đang cần xử lý</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '52px', textAlign: 'center' }}>STT</th>
                  <th>Mã Sự Cố</th>
                  <th>Khách Hàng</th>
                  <th>Tiêu Đề & Nội Dung</th>
                  <th>Mức Độ Ưu Tiên</th>
                  <th>Người Xử Lý</th>
                  <th>Thời Gian Báo</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t: any, idx: number) => {
                  const pri = PRIORITY_BADGES[t.priority] || { label: t.priority, class: 'tag' };
                  const sta = STATUS_BADGES[t.status] || { label: t.status, class: 'badge-pending' };
                  const hasNewMsg = t.hasUnreadCustomerMessage;
                  return (
                    <tr
                      key={t._id}
                      style={{
                        background: hasNewMsg ? '#fffbeb' : undefined,
                        borderLeft: hasNewMsg ? '4px solid #f59e0b' : undefined,
                      }}
                    >
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          #{t._id?.slice(-6).toUpperCase()}
                        </span>
                        {hasNewMsg && (
                          <div style={{ marginTop: '4px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                padding: '2px 6px',
                                borderRadius: '12px',
                                animation: 'pulse 1.5s infinite',
                              }}
                            >
                              🔴 Tin nhắn mới
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.customer?.fullName || 'Khách hàng'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.customer?.phone || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{t.subject}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.description}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${pri.class}`}>{pri.label}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{t.assignedTo?.fullName || 'Chờ phân công'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(t.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${sta.class}`}>{sta.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className={hasNewMsg ? "btn btn-sm" : "btn btn-sm btn-secondary"}
                          style={hasNewMsg ? { background: '#dc2626', color: '#fff', border: 'none', fontWeight: 800, boxShadow: '0 0 10px rgba(220,38,38,0.35)' } : {}}
                          onClick={() => handleOpenTicket(t)}
                        >
                          {hasNewMsg ? '⚡ Trả Lời Ngay (Tin Mới)' : '💬 Hỗ Trợ Ngay'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-title">🆘 Tạo Yêu Cầu Hỗ Trợ / Cứu Hộ Sự Cố</div>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Loại sự cố *</label>
                <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="rescue">Cứu hộ khẩn cấp trên đường (thủng lốp, chết máy)</option>
                  <option value="breakdown">Hỏng hóc phụ tùng / xin đổi xe khác</option>
                  <option value="extension">Xin gia hạn thêm thời gian thuê xe</option>
                  <option value="deposit">Thắc mắc đối soát tiền cọc / thanh toán</option>
                  <option value="general">Hỏi đáp dịch vụ chung</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Mức độ ưu tiên *</label>
                <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="urgent">🚨 Khẩn cấp (Cần cứu hộ ngay lập tức)</option>
                  <option value="high">⚡ Cao (Trong vòng 1 giờ)</option>
                  <option value="medium">Bình thường (Trong ngày)</option>
                  <option value="low">Thấp</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Tiêu đề yêu cầu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Xe bị xịt lốp tại ngã tư Lê Duẩn - Bạch Đằng"
                  className="form-input"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Mô tả chi tiết & vị trí hiện tại *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mô tả cụ thể vị trí, số nhà hoặc gửi định vị Google Maps để nhân viên đến ứng cứu..."
                  className="form-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary w-full">Hủy Bỏ</button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary w-full">
                  {createMutation.isPending ? 'Đang gửi...' : 'Gửi Yêu Cầu Cứu Hộ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAT / REPLY THREAD MODAL */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', height: '85vh', borderRadius: '16px' }}>
            <div className="modal-header" style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💬 Hỗ Trợ Khách Hàng: <span style={{ color: '#0284c7' }}>{selectedTicket.customer?.fullName || 'Khách hàng'}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  SĐT: <strong style={{ color: '#0f172a' }}>{selectedTicket.customer?.phone || 'Chưa có SĐT'}</strong> • Mã sự cố: #{selectedTicket._id?.slice(-6).toUpperCase()}
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Incident Details Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', margin: '12px 0 8px 0', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
                Tiêu đề: {selectedTicket.subject}
              </div>
              <div style={{ color: '#475569' }}><strong>Mô tả sự cố:</strong> {selectedTicket.description}</div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge ${STATUS_BADGES[selectedTicket.status]?.class}`}>
                  {STATUS_BADGES[selectedTicket.status]?.label}
                </span>
                <span className={`badge ${PRIORITY_BADGES[selectedTicket.priority]?.class}`}>
                  {PRIORITY_BADGES[selectedTicket.priority]?.label}
                </span>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedTicket.messages?.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px', fontSize: '13px' }}>
                  Chưa có trao đổi nào. Hãy nhập tin nhắn hoặc gửi ảnh hướng dẫn để hỗ trợ khách hàng.
                </div>
              ) : (
                selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isMe = msg.sender?._id === user?._id;
                  const isCustomer = msg.sender?.role === 'customer' || msg.sender?._id === selectedTicket.customer?._id || (!msg.sender?.role && !isMe);
                  
                  // Tên người gửi rõ ràng
                  const senderName = isCustomer
                    ? (selectedTicket.customer?.fullName || msg.sender?.fullName || 'Khách hàng')
                    : (msg.sender?.fullName || (isMe ? 'Bạn (Nhân viên)' : 'Nhân viên hỗ trợ'));

                  const senderBadge = isCustomer
                    ? 'Khách hàng'
                    : (msg.sender?.role === 'admin' ? 'Quản lý' : msg.sender?.role === 'owner' ? 'Chủ cửa hàng' : 'Nhân viên hỗ trợ');

                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        background: isMe ? '#2563eb' : '#ffffff',
                        border: isMe ? 'none' : '1px solid #e2e8f0',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '13px',
                        color: isMe ? '#ffffff' : '#0f172a',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      }}
                    >
                      {/* Tên khách hàng / người gửi rõ ràng */}
                      <div
                        style={{
                          fontSize: '11px',
                          marginBottom: '4px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: isMe ? '#bfdbfe' : isCustomer ? '#059669' : '#7c3aed',
                        }}
                      >
                        <span>{isCustomer ? '👤' : '🛠️'} {senderName}</span>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            background: isMe ? 'rgba(255,255,255,0.2)' : isCustomer ? '#d1fae5' : '#ede9fe',
                            color: isMe ? '#ffffff' : isCustomer ? '#065f46' : '#5b21b6',
                            fontWeight: 600,
                          }}
                        >
                          {senderBadge}
                        </span>
                      </div>

                      {/* Nội dung text */}
                      {msg.content && (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.45 }}>
                          {msg.content}
                        </div>
                      )}

                      {/* Ảnh đính kèm trong tin nhắn */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {msg.attachments.map((imgUrl: string, aIdx: number) => (
                            <img
                              key={aIdx}
                              src={imgUrl}
                              alt="Ảnh đính kèm"
                              onClick={() => setLightboxImage(imgUrl)}
                              style={{
                                width: '180px',
                                height: '130px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                cursor: 'zoom-in',
                                border: isMe ? '2px solid rgba(255,255,255,0.3)' : '1px solid #cbd5e1',
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Image Preview before sending */}
            {attachedImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#e0f2fe', borderRadius: '10px', marginBottom: '8px' }}>
                <img src={attachedImage} alt="Ảnh chuẩn bị gửi" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                <span style={{ fontSize: '12px', color: '#0369a1', flex: 1, fontWeight: 600 }}>Ảnh đính kèm sẵn sàng gửi</span>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: '22px' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Hidden Camera & File Inputs */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />

            {/* Reply Input Form & Action Buttons */}
            <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nhập nội dung phản hồi, hướng dẫn cứu hộ xe..."
                  className="form-input"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px' }}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={replyMutation.isPending || (!replyContent.trim() && !attachedImage)}
                  className="btn btn-primary"
                  style={{ padding: '0 20px', borderRadius: '10px', fontWeight: 700 }}
                >
                  {replyMutation.isPending ? 'Đang gửi...' : 'Gửi ➔'}
                </button>
              </div>

              {/* Utility Buttons: Chụp hình, Chọn ảnh, Gửi GPS */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer',
                  }}
                >
                  📷 Chụp hình
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer',
                  }}
                >
                  🖼️ Tải ảnh lên
                </button>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1e293b',
                    cursor: 'pointer',
                  }}
                >
                  📍 Gửi định vị GPS
                </button>
              </div>
            </form>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              {selectedTicket.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => statusMutation.mutate({ id: selectedTicket._id, status: 'resolved', resolution: 'Đã hoàn tất hỗ trợ sự cố xe cho khách hàng.' })}
                  className="btn btn-sm btn-success w-full"
                  style={{ borderRadius: '8px', fontWeight: 700 }}
                >
                  ✓ Đánh Dấu Đã Xử Lý Xong
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="btn btn-sm btn-secondary w-full"
                style={{ borderRadius: '8px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {lightboxImage && (
        <div
          className="modal-overlay"
          onClick={() => setLightboxImage(null)}
          style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightboxImage} alt="Ảnh phóng to" style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }} />
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
