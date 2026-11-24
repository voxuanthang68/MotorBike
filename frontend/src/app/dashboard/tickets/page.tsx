'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

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

  // Form states for creating support ticket
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('urgent');
  const [category, setCategory] = useState('rescue'); // rescue, breakdown, extension, deposit, general

  // Fetch tickets
  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return res.data;
    }
  });

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
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return api.post(`/tickets/${id}/reply`, { content });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(res.data.data);
      setReplyContent('');
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
    if (!replyContent.trim() || !selectedTicket) return;
    replyMutation.mutate({ id: selectedTicket._id, content: replyContent });
  };

  const tickets = data?.data || [];

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
                {tickets.map((t: any) => {
                  const pri = PRIORITY_BADGES[t.priority] || { label: t.priority, class: 'tag' };
                  const sta = STATUS_BADGES[t.status] || { label: t.status, class: 'badge-pending' };
                  return (
                    <tr key={t._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          #{t._id?.slice(-6).toUpperCase()}
                        </span>
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
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelectedTicket(t)}
                        >
                          💬 Hỗ Trợ Ngay
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">
                  💬 Sự Cố #{selectedTicket._id?.slice(-6).toUpperCase()}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                  {selectedTicket.subject}
                </div>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Incident Details Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', marginBottom: '12px', flexShrink: 0 }}>
              <div><strong>Khách hàng:</strong> {selectedTicket.customer?.fullName} ({selectedTicket.customer?.phone})</div>
              <div><strong>Nội dung:</strong> {selectedTicket.description}</div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                <span className={`badge ${STATUS_BADGES[selectedTicket.status]?.class}`}>
                  {STATUS_BADGES[selectedTicket.status]?.label}
                </span>
                <span className={`badge ${PRIORITY_BADGES[selectedTicket.priority]?.class}`}>
                  {PRIORITY_BADGES[selectedTicket.priority]?.label}
                </span>
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedTicket.messages?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', fontSize: '13px' }}>
                  Chưa có trao đổi nào. Hãy nhập tin nhắn bên dưới để hỗ trợ khách.
                </div>
              ) : (
                selectedTicket.messages?.map((msg: any, idx: number) => {
                  const isMe = msg.sender?._id === user?._id;
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: isMe ? 'var(--brand-gradient)' : '#ffffff',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        color: isMe ? 'white' : 'var(--text-primary)',
                      }}
                    >
                      <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px', fontWeight: 600 }}>
                        {msg.sender?.fullName || 'Người hỗ trợ'} ({msg.sender?.role || 'Nhân viên'})
                      </div>
                      <div>{msg.content}</div>
                      <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px', textAlign: 'right' }}>
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleReplySubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Nhập nội dung phản hồi, hướng dẫn cứu hộ..."
                className="form-input"
                style={{ flex: 1 }}
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
              />
              <button type="submit" disabled={replyMutation.isPending} className="btn btn-primary">
                Gửi ➔
              </button>
            </form>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-primary)', paddingTop: '10px' }}>
              {selectedTicket.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={() => statusMutation.mutate({ id: selectedTicket._id, status: 'resolved', resolution: 'Đã hoàn tất hỗ trợ sự cố xe cho khách hàng.' })}
                  className="btn btn-sm btn-success w-full"
                >
                  ✓ Đánh Dấu Đã Xử Lý Xong
                </button>
              )}
              <button type="button" onClick={() => setSelectedTicket(null)} className="btn btn-sm btn-secondary w-full">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
