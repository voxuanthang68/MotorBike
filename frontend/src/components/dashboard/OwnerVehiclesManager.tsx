'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Sẵn sàng', color: '#059669', bg: '#ecfdf5' },
  rented: { label: 'Đang thuê', color: '#2563eb', bg: '#eff6ff' },
  maintenance: { label: 'Bảo trì', color: '#d97706', bg: '#fffbeb' },
  broken: { label: 'Hỏng hóc', color: '#dc2626', bg: '#fef2f2' },
  retired: { label: 'Ngưng dùng', color: '#6b7280', bg: '#f3f4f6' },
};

const TYPE_LABELS: Record<string, string> = {
  scooter: 'Xe tay ga',
  'semi-automatic': 'Xe số tự động',
  manual: 'Xe số côn tay',
  sport: 'Xe thể thao',
  electric: 'Xe điện',
};

export default function OwnerVehiclesManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceVehicle, setPriceVehicle] = useState<any>(null);
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [deposit, setDeposit] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    color: '',
    type: 'scooter',
    engineCC: '',
    pricePerDay: '',
    pricePerHour: '',
    deposit: '',
    description: '',
    location: 'Kho chính Hải Châu',
    status: 'available',
  });

  // Query Vehicles
  const { data: vehicleData, isLoading } = useQuery({
    queryKey: ['owner-vehicles', { search, statusFilter, typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '100');
      const res = await api.get(`/vehicles?${params}`);
      return res.data;
    },
  });

  const vehicles = vehicleData?.data || [];

  // Mutations
  const saveVehicleMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingVehicle) {
        return api.put(`/vehicles/${editingVehicle._id}`, payload);
      }
      return api.post('/vehicles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(editingVehicle ? 'Cập nhật thông tin xe thành công!' : 'Thêm xe mới thành công!');
      setShowAddEditModal(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu xe!');
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ id, pricePerDay, pricePerHour, deposit }: any) => {
      return api.put(`/vehicles/${id}`, {
        pricePerDay: Number(pricePerDay),
        pricePerHour: Number(pricePerHour || 0),
        deposit: Number(deposit || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã cập nhật giá thuê xe thành công!');
      setShowPriceModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật giá thuê!');
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã xóa xe khỏi danh sách!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa xe!');
    },
  });

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      color: '',
      type: 'scooter',
      engineCC: '',
      pricePerDay: '',
      pricePerHour: '',
      deposit: '',
      description: '',
      location: 'Kho chính Hải Châu',
      status: 'available',
    });
  };

  const handleOpenEdit = (v: any) => {
    setEditingVehicle(v);
    setFormData({
      name: v.name || '',
      brand: v.brand || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      licensePlate: v.licensePlate || '',
      color: v.color || '',
      type: v.type || 'scooter',
      engineCC: v.engineCC || '',
      pricePerDay: v.pricePerDay || '',
      pricePerHour: v.pricePerHour || '',
      deposit: v.deposit || '',
      description: v.description || '',
      location: v.location || 'Kho chính Hải Châu',
      status: v.status || 'available',
    });
    setShowAddEditModal(true);
  };

  const handleOpenPrice = (v: any) => {
    setPriceVehicle(v);
    setPricePerDay(String(v.pricePerDay || ''));
    setPricePerHour(String(v.pricePerHour || ''));
    setDeposit(String(v.deposit || ''));
    setShowPriceModal(true);
  };

  const handleDelete = (v: any) => {
    if (window.confirm(`Chủ cửa hàng xác nhận muốn XÓA xe ${v.name} (${v.licensePlate})?`)) {
      deleteVehicleMutation.mutate(v._id);
    }
  };

  // Stats
  const totalCount = vehicles.length;
  const availableCount = vehicles.filter((v: any) => v.status === 'available').length;
  const rentedCount = vehicles.filter((v: any) => v.status === 'rented').length;
  const maintenanceCount = vehicles.filter((v: any) => v.status === 'maintenance').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            🏍️ Quản Lý Đội Xe & Thiết Lập Giá Thuê
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Toàn quyền thêm mới xe, chỉnh sửa thông tin xe, cập nhật giá thuê linh hoạt và xóa xe
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddEditModal(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
          }}
        >
          <span>➕</span>
          <span>Thêm Xe Mới</span>
        </button>
      </div>

      {/* 2. Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TỔNG SỐ XE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>{totalCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>XE SẴN SÀNG</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{availableCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>XE ĐANG CHO THUÊ</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{rentedCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>XE BẢO DƯỠNG</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{maintenanceCount}</div>
        </div>
      </div>

      {/* 3. Filters */}
      <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên xe, biển số..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13.5px',
            outline: 'none',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
        >
          <option value="">Tất cả loại xe</option>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* 4. Table */}
      <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách xe...</div>
        ) : vehicles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy xe nào phù hợp.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>XE & BIỂN SỐ</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>LOẠI XE</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>GIÁ THUÊ / NGÀY</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>GIÁ / GIỜ</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>TIỀN CỌC</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v: any) => {
                  const statusInfo = STATUS_LABELS[v.status] || { label: v.status, color: '#64748b', bg: '#f1f5f9' };
                  return (
                    <tr key={v._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{v.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                            {v.licensePlate}
                          </span>
                          <span>{v.brand} {v.model ? `• ${v.model}` : ''}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                        {TYPE_LABELS[v.type] || v.type}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#059669' }}>
                            {Number(v.pricePerDay || 0).toLocaleString('vi-VN')} đ
                          </span>
                          <button
                            onClick={() => handleOpenPrice(v)}
                            title="Sửa nhanh giá thuê"
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Đổi giá
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                        {v.pricePerHour ? `${Number(v.pricePerHour).toLocaleString('vi-VN')} đ` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                        {v.deposit ? `${Number(v.deposit).toLocaleString('vi-VN')} đ` : '0 đ'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: statusInfo.color,
                            background: statusInfo.bg,
                            display: 'inline-block',
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenPrice(v)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #a7f3d0',
                              background: '#ecfdf5',
                              color: '#047857',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🏷️ Sửa giá
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(v)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ Xóa
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
      </div>

      {/* 5. Modal Sửa Nhanh Giá Thuê */}
      {showPriceModal && priceVehicle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowPriceModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>🏷️ Cập Nhật Giá Thuê Xe</h3>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  {priceVehicle.name} • {priceVehicle.licensePlate}
                </div>
              </div>
              <button
                onClick={() => setShowPriceModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePriceMutation.mutate({
                  id: priceVehicle._id,
                  pricePerDay,
                  pricePerHour,
                  deposit,
                });
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Giá thuê theo ngày (VNĐ/ngày) *
                  </label>
                  <input
                    type="number"
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    required
                    placeholder="150000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Giá thuê theo giờ (VNĐ/giờ)
                  </label>
                  <input
                    type="number"
                    value={pricePerHour}
                    onChange={(e) => setPricePerHour(e.target.value)}
                    placeholder="25000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Tiền đặt cọc (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="500000"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatePriceMutation.isPending}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {updatePriceMutation.isPending ? 'Đang lưu...' : '💾 Lưu Giá Thuê'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Thêm / Sửa Toàn Bộ Thông Tin Xe */}
      {showAddEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowAddEditModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {editingVehicle ? '✏️ Chỉnh Sửa Xe' : '🏍️ Thêm Xe Mới Vào Đội Xe'}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveVehicleMutation.mutate(formData);
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Tên xe *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Honda Air Blade 125cc"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hãng xe *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Honda / Yamaha / VinFast..."
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Biển số xe *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="43B1-123.45"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Loại xe
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    {Object.entries(TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                    Giá thuê theo ngày (VNĐ/ngày) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '2px solid #a7f3d0', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Giá thuê theo giờ (VNĐ/giờ)
                  </label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Tiền đặt cọc (VNĐ)
                  </label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Trạng thái xe
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, s]) => (
                      <option key={k} value={k}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Vị trí / Chi nhánh
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Ghi chú / Mô tả xe
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ghi chú về tình trạng xe, phụ kiện đi kèm..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveVehicleMutation.isPending}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {saveVehicleMutation.isPending ? 'Đang lưu...' : editingVehicle ? '💾 Cập Nhật Xe' : '✅ Thêm Xe Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
