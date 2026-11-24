'use client';
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Hoạt Động', color: '#059669', bg: '#ecfdf5' },
  rented:    { label: 'Đang Thuê',  color: '#2563eb', bg: '#eff6ff' },
  maintenance:{ label: 'Bảo Trì',  color: '#d97706', bg: '#fffbeb' },
  broken:    { label: 'Hỏng',       color: '#dc2626', bg: '#fef2f2' },
  retired:   { label: 'Nghỉ Hưu',  color: '#6b7280', bg: '#f3f4f6' },
};

const TYPE_LABELS: Record<string, string> = {
  scooter: 'Xe tay ga',
  'semi-automatic': 'Xe số TĐ',
  manual: 'Xe số',
  sport: 'Xe thể thao',
  electric: 'Xe điện',
};

const STATUS_ICON: Record<string, string> = {
  available: '🟢', rented: '🔵', maintenance: '🟡', broken: '🔴', retired: '⚫',
};

const AVAILABILITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Trống', color: '#047857', bg: '#ecfdf5' },
  pending_confirmation: { label: 'Chờ xác nhận', color: '#b45309', bg: '#fffbeb' },
  booked: { label: 'Đã đặt', color: '#1d4ed8', bg: '#eff6ff' },
  rented: { label: 'Đang thuê', color: '#7c3aed', bg: '#f5f3ff' },
  maintenance: { label: 'Bảo trì', color: '#b45309', bg: '#fffbeb' },
  broken: { label: 'Hỏng', color: '#b91c1c', bg: '#fef2f2' },
};

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [page, setPage]               = useState(1);
  const [showModal, setShowModal]     = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [detailVehicle, setDetailVehicle] = useState<any>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    name: '', brand: '', model: '', year: new Date().getFullYear(),
    licensePlate: '', color: '', type: 'scooter', engineCC: '',
    pricePerDay: '', pricePerHour: '', deposit: '',
    description: '', location: 'Kho chính', status: 'available',
  });

  /* ── Fetch ── */
  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', { search, statusFilter, typeFilter, page }],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), limit: '15' });
      if (search)       p.set('search', search);
      if (statusFilter) p.set('status', statusFilter);
      if (typeFilter)   p.set('type', typeFilter);
      const res = await api.get(`/vehicles?${p}`);
      return res.data;
    },
  });

  /* ── Mutations ── */
  const saveMutation = useMutation({
    mutationFn: (d: any) => {
      const config = d instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
      return editVehicle
        ? api.put(`/vehicles/${editVehicle._id}`, d, config)
        : api.post('/vehicles', d, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(editVehicle ? 'Cập nhật xe thành công!' : 'Thêm xe thành công!');
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!'),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (v: any) =>
      api.put(`/vehicles/${v._id}`, { ...v, status: v.status === 'available' ? 'retired' : 'available' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Đã cập nhật trạng thái!');
      setDetailVehicle(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi!'),
  });

  /* ── Helpers ── */
  const resetForm = () => {
    setFormData({ name:'', brand:'', model:'', year: new Date().getFullYear(), licensePlate:'', color:'', type:'scooter', engineCC:'', pricePerDay:'', pricePerHour:'', deposit:'', description:'', location:'Kho chính', status:'available' });
    setImageFiles([]);
    setEditVehicle(null);
  };

  const openEdit = (v: any) => {
    setEditVehicle(v);
    setImageFiles([]);
    setFormData({ name:v.name, brand:v.brand, model:v.model, year:v.year, licensePlate:v.licensePlate, color:v.color, type:v.type, engineCC:v.engineCC||'', pricePerDay:v.pricePerDay, pricePerHour:v.pricePerHour||'', deposit:v.deposit||'', description:v.description||'', location:v.location||'Kho chính', status:v.status });
    setShowModal(true);
  };

  const vehicles   = data?.data        || [];
  const displayedVehicles = availabilityFilter ? vehicles.filter((vehicle: any) => vehicle.availability === availabilityFilter) : vehicles;
  const pagination = data?.pagination;
  const stats      = data?.stats       || [];

  const submitForm = (form: HTMLFormElement) => {
    const browserFormData = new FormData(form);
    const selectedFiles = browserFormData.getAll('vehicleImages').filter((value): value is File => value instanceof File && value.size > 0);
    if (!editVehicle && selectedFiles.length === 0) {
      toast.error('Vui lòng thêm ít nhất một hình ảnh xe.');
      return;
    }
    if (selectedFiles.length === 0) {
      saveMutation.mutate(formData);
      return;
    }
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, String(value)));
    selectedFiles.forEach(file => payload.append('images', file));
    saveMutation.mutate(payload);
  };

  const statusCards = ['available', 'rented', 'maintenance', 'broken'].map(s => ({
    status: s,
    count: stats.find((st: any) => st._id === s)?.count || 0,
    ...STATUS_LABELS[s],
  }));

  /* ────────────────────────────────── JSX ────────────────────────────────── */
  return (
    <div className="page-container">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Danh Sách Xe</h1>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
            Trang chủ <span style={{ margin: '0 5px' }}>›</span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Xe</span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ gap: '6px', fontSize: '13px' }}
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          + Thêm Xe Mới
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {statusCards.map(s => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(statusFilter === s.status ? '' : s.status)}
            style={{
              padding: '16px 18px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer',
              background: statusFilter === s.status ? '#fff7ed' : '#fff',
              border: `1px solid ${statusFilter === s.status ? 'var(--brand-primary)' : '#e2e8f0'}`,
              boxShadow: '0 1px 4px rgba(15,23,42,.04)', transition: 'all .2s',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
              {STATUS_ICON[s.status]} {s.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: statusFilter === s.status ? 'var(--brand-primary)' : '#0f172a' }}>
              {s.count}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', padding: '12px 16px', marginBottom: 18, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}>
        <strong style={{ color: '#334155' }}>Tình trạng cho thuê:</strong>
        {Object.entries(AVAILABILITY_LABELS).map(([key, item]) => <button key={key} onClick={() => setAvailabilityFilter(availabilityFilter === key ? '' : key)} style={{ border: `1px solid ${item.color}55`, background: availabilityFilter === key ? item.bg : '#fff', color: item.color, borderRadius: 999, padding: '5px 10px', cursor: 'pointer', fontWeight: 700 }}>{item.label}</button>)}
        <span style={{ color: '#64748b' }}>Xe có đơn “Chờ xác nhận” chưa được xem là đã cho thuê.</span>
      </div>

      {/* ── Table Card ── */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>

        {/* Table toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Danh Sách Xe</span>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                placeholder="Tìm xe, biển số..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#0f172a', width: '155px' }}
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', background: '#f8fafc', color: '#475569', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Tất cả loại xe</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', background: '#f8fafc', color: '#475569', outline: 'none', cursor: 'pointer' }}>
              <option value="">Tất cả tình trạng thuê</option>
              {Object.entries(AVAILABILITY_LABELS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px' }} />
          </div>
        ) : displayedVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏍️</div>
            <div className="empty-state-text">Không có xe nào phù hợp với tình trạng đã chọn</div>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>Thêm xe mới</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['STT','Biển Số','Tên Xe','Hãng Xe','Dung Tích','Giá Thuê (VNĐ)','Địa Điểm','Trạng Thái','Chi Tiết'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedVehicles.map((v: any, idx: number) => {
                  const sl = STATUS_LABELS[v.status] || STATUS_LABELS.broken;
                  return (
                    <tr
                      key={v._id}
                      style={{ borderBottom: '1px solid #f8fafc', transition: 'background .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#94a3b8' }}>{(page - 1) * 15 + idx + 1}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '3px 8px', borderRadius: '5px' }}>
                          {v.licensePlate}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{v.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{TYPE_LABELS[v.type] || v.type} • {v.year}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>{v.brand}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: '#475569' }}>{v.engineCC ? `${v.engineCC}cc` : '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {new Intl.NumberFormat('vi-VN').format(v.pricePerDay)}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '12px', color: '#475569', maxWidth: '140px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.location || '—'}</div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: sl.bg, color: sl.color }}>
                          {STATUS_ICON[v.status]} {sl.label}
                        </span>
                        <div><span style={{ display: 'inline-flex', marginTop: 5, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: (AVAILABILITY_LABELS[v.availability] || AVAILABILITY_LABELS.available).bg, color: (AVAILABILITY_LABELS[v.availability] || AVAILABILITY_LABELS.available).color }}>{(AVAILABILITY_LABELS[v.availability] || AVAILABILITY_LABELS.available).label}</span></div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {/* View detail */}
                          <button
                            onClick={() => setDetailVehicle(v)}
                            title="Xem chi tiết"
                            style={btnIcon}
                            onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#eff6ff', borderColor: '#bfdbfe' })}
                            onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#f8fafc', borderColor: '#e2e8f0' })}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(v)}
                            title="Chỉnh sửa"
                            style={btnIcon}
                            onMouseEnter={e => Object.assign(e.currentTarget.style, { background: '#f0fdfa', borderColor: '#99f6e4' })}
                            onMouseLeave={e => Object.assign(e.currentTarget.style, { background: '#f8fafc', borderColor: '#e2e8f0' })}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Trang {page} / {pagination.pages}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          DETAIL MODAL  —  CarRentSG Style
      ══════════════════════════════════════════════════════ */}
      {detailVehicle && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn .2s ease' }}
          onClick={() => setDetailVehicle(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '680px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,.18)', animation: 'slideUp .3s ease' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Chi tiết Xe</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Trang chủ <span style={{ margin: '0 4px' }}>›</span> Xe <span style={{ margin: '0 4px' }}>›</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{detailVehicle.name}</span>
                </div>
              </div>
              <button onClick={() => setDetailVehicle(null)} style={{ ...btnIcon, width: '34px', height: '34px', fontSize: '14px', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Body: 2-col */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '190px 1fr', gap: '24px' }}>

              {/* Left — photo + name + badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '160px', height: '130px', borderRadius: '14px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {detailVehicle.mainImage
                    ? <img src={`http://localhost:5000${detailVehicle.mainImage}`} alt={detailVehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '52px' }}>🏍️</span>
                  }
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>{detailVehicle.name}</div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: (STATUS_LABELS[detailVehicle.status] || STATUS_LABELS.broken).bg, color: (STATUS_LABELS[detailVehicle.status] || STATUS_LABELS.broken).color }}>
                    {STATUS_ICON[detailVehicle.status]} {(STATUS_LABELS[detailVehicle.status] || STATUS_LABELS.broken).label}
                  </span>
                </div>
              </div>

              {/* Right — fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Biển số */}
                <DetailField label="Biển Số" value={detailVehicle.licensePlate} mono />

                {/* Row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <DetailField label="Dung Tích" value={detailVehicle.engineCC ? `${detailVehicle.engineCC}cc` : '—'} />
                  <DetailField label="Hãng Xe" value={detailVehicle.brand} />
                </div>

                {/* Row 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <DetailField label="Loại Xe" value={TYPE_LABELS[detailVehicle.type] || detailVehicle.type} />
                  <DetailField label="Năm SX" value={String(detailVehicle.year)} />
                </div>

                {/* Giá */}
                <DetailField label="Giá Cho Thuê" value={`${new Intl.NumberFormat('vi-VN').format(detailVehicle.pricePerDay)} đ / ngày`} />

                {/* Vị trí */}
                <DetailField label="Chi Nhánh / Vị Trí" value={detailVehicle.location || '—'} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => {
                  if (confirm(`Bạn muốn ${detailVehicle.status === 'available' ? 'vô hiệu hóa' : 'kích hoạt lại'} xe này?`)) {
                    toggleStatusMutation.mutate(detailVehicle);
                  }
                }}
                style={{ padding: '9px 18px', borderRadius: '9px', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', background: detailVehicle.status === 'available' ? '#fef2f2' : '#ecfdf5', color: detailVehicle.status === 'available' ? '#dc2626' : '#059669', transition: 'all .2s' }}
              >
                {detailVehicle.status === 'available' ? 'Vô Hiệu Hóa Trạng Thái' : '✅ Kích Hoạt Lại'}
              </button>
              <button
                onClick={() => { setDetailVehicle(null); openEdit(detailVehicle); }}
                className="btn btn-primary"
                style={{ fontSize: '13px' }}
              >
                ✏️ Chỉnh Sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ══════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editVehicle ? '✏️ Chỉnh sửa xe' : '🏍️ Thêm xe mới'}</h2>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={e => { e.preventDefault(); submitForm(e.currentTarget); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <FormGroup label="Tên xe *"><input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Honda Air Blade 125cc" required /></FormGroup>
                <FormGroup label="Hãng xe *"><input className="form-input" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Honda" required /></FormGroup>
                <FormGroup label="Model *"><input className="form-input" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="Air Blade" required /></FormGroup>
                <FormGroup label="Năm sản xuất *"><input className="form-input" type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} required /></FormGroup>
                <FormGroup label="Biển số xe *"><input className="form-input" value={formData.licensePlate} onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })} placeholder="43B1-12345" required /></FormGroup>
                <FormGroup label="Màu sắc *"><input className="form-input" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="Đen Bạc" required /></FormGroup>
                <FormGroup label="Loại xe">
                  <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Dung tích (cc)"><input className="form-input" type="number" value={formData.engineCC} onChange={e => setFormData({ ...formData, engineCC: e.target.value })} placeholder="125" /></FormGroup>
                <FormGroup label="Giá thuê / ngày (VNĐ) *"><input className="form-input" type="number" value={formData.pricePerDay} onChange={e => setFormData({ ...formData, pricePerDay: e.target.value })} placeholder="150000" required /></FormGroup>
                <FormGroup label="Tiền đặt cọc (VNĐ)"><input className="form-input" type="number" value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: e.target.value })} placeholder="500000" /></FormGroup>
                <FormGroup label="Trạng thái">
                  <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </FormGroup>
                <FormGroup label="Vị trí / Chi nhánh"><input className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} /></FormGroup>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Mô tả về xe..." style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Hình ảnh xe {!editVehicle && '*'}</label>
                  <input ref={imageInputRef} name="vehicleImages" className="form-input" type="file" accept="image/*" multiple required={!editVehicle} onChange={e => setImageFiles(Array.from(e.target.files || []))} />
                  <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
                    {editVehicle ? 'Có thể chọn thêm ảnh mới; ảnh cũ vẫn được giữ lại.' : 'Chọn ít nhất 1 ảnh. Ảnh đầu tiên sẽ là ảnh đại diện của xe.'}
                  </div>
                  {imageFiles.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: '#1d4ed8' }}>{imageFiles.length} ảnh đã chọn: {imageFiles.map(file => file.name).join(', ')}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Đang lưu...</> : editVehicle ? '💾 Cập nhật' : '✅ Thêm xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── tiny helper components ── */
const btnIcon: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '30px', height: '30px', borderRadius: '8px',
  border: '1px solid #e2e8f0', background: '#f8fafc',
  cursor: 'pointer', transition: 'all .15s', color: '#475569',
};

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>{label}</div>
      <div style={{ padding: '9px 13px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#0f172a', background: '#f8fafc', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 700 : 400 }}>
        {value}
      </div>
    </div>
  );
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
