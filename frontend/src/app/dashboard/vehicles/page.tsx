'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  available: { label: 'Sẵn sàng', badge: 'badge-available' },
  rented: { label: 'Đang thuê', badge: 'badge-rented' },
  maintenance: { label: 'Bảo trì', badge: 'badge-maintenance' },
  broken: { label: 'Hỏng', badge: 'badge-broken' },
  retired: { label: 'Nghỉ hưu', badge: 'badge-cancelled' },
};

const TYPE_LABELS: Record<string, string> = {
  scooter: 'Xe tay ga', 'semi-automatic': 'Xe số tự động', manual: 'Xe số', sport: 'Xe thể thao', electric: 'Xe điện'
};

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', brand: '', model: '', year: new Date().getFullYear(), licensePlate: '',
    color: '', type: 'scooter', engineCC: '', pricePerDay: '', pricePerHour: '',
    deposit: '', description: '', location: 'Kho chính', status: 'available'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', { search, statusFilter, typeFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get(`/vehicles?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editVehicle
      ? api.put(`/vehicles/${editVehicle._id}`, data)
      : api.post('/vehicles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(editVehicle ? 'Cập nhật xe thành công!' : 'Thêm xe thành công!');
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Đã xóa xe!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi!'),
  });

  const resetForm = () => {
    setFormData({ name: '', brand: '', model: '', year: new Date().getFullYear(), licensePlate: '', color: '', type: 'scooter', engineCC: '', pricePerDay: '', pricePerHour: '', deposit: '', description: '', location: 'Kho chính', status: 'available' });
    setEditVehicle(null);
  };

  const openEdit = (v: any) => {
    setEditVehicle(v);
    setFormData({ name: v.name, brand: v.brand, model: v.model, year: v.year, licensePlate: v.licensePlate, color: v.color, type: v.type, engineCC: v.engineCC || '', pricePerDay: v.pricePerDay, pricePerHour: v.pricePerHour || '', deposit: v.deposit || '', description: v.description || '', location: v.location || 'Kho chính', status: v.status });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const vehicles = data?.data || [];
  const pagination = data?.pagination;
  const stats = data?.stats || [];

  const statusStats = ['available', 'rented', 'maintenance', 'broken'].map(s => ({
    status: s,
    count: stats.find((st: any) => st._id === s)?.count || 0,
    ...STATUS_LABELS[s]
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏍️ Quản lý xe</h1>
          <p className="page-subtitle">Danh sách xe moto trong hệ thống</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Thêm xe mới
        </button>
      </div>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {statusStats.map(s => (
          <button key={s.status}
            onClick={() => setStatusFilter(statusFilter === s.status ? '' : s.status)}
            style={{
              padding: '14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
              background: statusFilter === s.status ? 'rgba(249,115,22,0.1)' : 'var(--glass-bg)',
              border: `1px solid ${statusFilter === s.status ? 'var(--brand-primary)' : 'var(--glass-border)'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: statusFilter === s.status ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
              {s.count}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ maxWidth: '300px' }}>
          <span>🔍</span>
          <input placeholder="Tìm tên xe, biển số..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Tất cả loại xe</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Vehicle Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '16px' }} />)}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏍️</div>
          <div className="empty-state-text">Không có xe nào</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Thêm xe mới</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {vehicles.map((v: any) => (
            <div key={v._id} className="vehicle-card">
              {v.mainImage ? (
                <img src={`http://localhost:5000${v.mainImage}`} alt={v.name} className="vehicle-image" />
              ) : (
                <div className="vehicle-image-placeholder">🏍️</div>
              )}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>{v.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{v.brand} • {v.year}</div>
                  </div>
                  <span className={`badge ${STATUS_LABELS[v.status]?.badge || 'badge-pending'}`}>
                    {STATUS_LABELS[v.status]?.label || v.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span className="tag">{v.licensePlate}</span>
                  <span className="tag">{TYPE_LABELS[v.type] || v.type}</span>
                  {v.engineCC > 0 && <span className="tag">{v.engineCC}cc</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="price-display" style={{ fontSize: '16px' }}>
                      {new Intl.NumberFormat('vi-VN').format(v.pricePerDay)}đ
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ngày</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(v)} title="Chỉnh sửa">✏️</button>
                    <Link href={`/dashboard/bookings/new?vehicleId=${v._id}`} className="btn btn-primary btn-sm">
                      Cho thuê
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>›</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editVehicle ? '✏️ Chỉnh sửa xe' : '🏍️ Thêm xe mới'}</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Tên xe *</label>
                  <input className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Honda Air Blade 125cc" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hãng xe *</label>
                  <input className="form-input" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Honda" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Model *</label>
                  <input className="form-input" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="Air Blade" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Năm sản xuất *</label>
                  <input className="form-input" type="number" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Biển số xe *</label>
                  <input className="form-input" value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} placeholder="43B1-12345" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Màu sắc *</label>
                  <input className="form-input" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} placeholder="Đen Bạc" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại xe</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dung tích (cc)</label>
                  <input className="form-input" type="number" value={formData.engineCC} onChange={e => setFormData({...formData, engineCC: e.target.value})} placeholder="125" />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá thuê/ngày (VNĐ) *</label>
                  <input className="form-input" type="number" value={formData.pricePerDay} onChange={e => setFormData({...formData, pricePerDay: e.target.value})} placeholder="150000" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tiền đặt cọc (VNĐ)</label>
                  <input className="form-input" type="number" value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} placeholder="500000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Trạng thái</label>
                  <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vị trí</label>
                  <input className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Mô tả về xe..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <><div className="spinner" style={{width:'16px',height:'16px'}}/> Đang lưu...</> : (editVehicle ? '💾 Cập nhật' : '✅ Thêm xe')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
