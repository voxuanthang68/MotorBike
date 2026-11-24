'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function StaffNotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 15000,
  });
  const notifications = data?.data || [];
  const unreadCount = notifications.filter((item: any) => !item.isRead).length;

  const readMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-notifications'] }),
    onError: () => toast.error('Không thể cập nhật thông báo.'),
  });
  const readAllMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff-notifications'] }),
  });

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Thông báo</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Đơn thuê mới và các cập nhật cần nhân viên xử lý.</p>
        </div>
        {unreadCount > 0 && <button className="btn btn-secondary" onClick={() => readAllMutation.mutate()}>Đánh dấu tất cả đã đọc</button>}
      </div>
      <div className="card" style={{ padding: 20 }}>
        {isLoading ? <div style={{ padding: 40, textAlign: 'center' }}>Đang tải thông báo...</div> : notifications.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}><div style={{ fontSize: 48 }}>🔔</div><h3>Chưa có thông báo</h3><p>Thông báo đơn thuê mới sẽ hiển thị tại đây.</p></div>
        ) : <div style={{ display: 'grid', gap: 12 }}>{notifications.map((item: any) => (
          <button key={item._id} onClick={() => !item.isRead && readMutation.mutate(item._id)} style={{ textAlign: 'left', border: '1px solid var(--border-color)', borderRadius: 14, padding: 18, background: item.isRead ? 'white' : '#eff8ff', cursor: item.isRead ? 'default' : 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><strong>{item.title}</strong>{!item.isRead && <span style={{ color: '#0ea5e9', fontSize: 12, fontWeight: 700 }}>CHƯA ĐỌC</span>}</div>
            <p style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>{item.message}</p>
            <small style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
          </button>
        ))}</div>}
      </div>
    </div>
  );
}
