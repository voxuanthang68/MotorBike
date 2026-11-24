'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  routine: { label: 'Bảo dưỡng định kỳ', icon: '🔄' },
  repair: { label: 'Sửa chữa hỏng hóc', icon: '🔧' },
  pre_rental: { label: 'Kiểm tra trước giao xe', icon: '📋' },
  post_rental: { label: 'Kiểm tra sau thu hồi', icon: '🔍' },
};

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  scheduled: { label: 'Đã lên lịch', class: 'badge-pending' },
  in_progress: { label: 'Đang kiểm tra / sửa', class: 'badge-confirmed' },
  completed: { label: 'Đã hoàn thành', class: 'badge-completed' },
  cancelled: { label: 'Đã hủy', class: 'badge-cancelled' },
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any | null>(null);

  // Digital signature canvas
  const techCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Form states for new maintenance / inspection
  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState('pre_rental');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(0);
  const [odometer, setOdometer] = useState(0);

  // Technical inspection checklist
  const [checklist, setChecklist] = useState({
    engine: true, // Động cơ nổ êm, không khói
    brakes: true, // Phanh trước & sau ăn chắc
    tires: true, // Lốp xe đủ rãnh gai & áp suất
    lights: true, // Đèn pha, cos, xi nhan hoạt động
    horn: true, // Còi kêu to rõ
    mirrors: true, // 2 gương chiếu hậu đầy đủ
    oil: true, // Mức nhớt máy đạt chuẩn
    smartkey: true, // Khóa Smartkey / khóa cơ tốt
  });

  // Query vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => {
      const res = await api.get('/vehicles', { params: { limit: 100 } });
      return res.data;
    }
  });

  // Query maintenance records
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', selectedType, selectedStatus],
    queryFn: async () => {
      const params: any = { limit: 20 };
      if (selectedType) params.type = selectedType;
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get('/maintenance', { params });
      return res.data;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/maintenance', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setCreateModal(false);
      resetForm();
      toast.success('Tạo phiếu kiểm tra kỹ thuật thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  // Complete maintenance mutation with signature
  const completeMutation = useMutation({
    mutationFn: async ({ id, signature, notes }: { id: string; signature: string; notes?: string }) => {
      return api.put(`/maintenance/${id}`, {
        status: 'completed',
        technicianSignature: signature,
        resolutionNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDetailModal(null);
      toast.success('Kỹ thuật viên đã ký xác nhận & hoàn tất phiếu bảo dưỡng!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi cập nhật!')
  });

  const resetForm = () => {
    setVehicleId('');
    setType('pre_rental');
    setDescription('');
    setCost(0);
    setOdometer(0);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = techCanvasRef.current;
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
    const canvas = techCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#06b6d4'; // Cyan for technician
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = techCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.error('Vui lòng chọn xe cần kiểm tra/bảo dưỡng!');
      return;
    }

    const payload = {
      title: `Kiểm tra ${TYPE_LABELS[type]?.label || 'kỹ thuật'} - ${description || 'Định kỳ'}`,
      vehicle: vehicleId,
      type,
      description: `${description || 'Kiểm định an toàn'}. Checklist: Động cơ: ${checklist.engine ? 'Tốt' : 'Cần xem lại'}, Phanh: ${checklist.brakes ? 'Tốt' : 'Yếu'}, Lốp: ${checklist.tires ? 'Tốt' : 'Mòn'}, Đèn: ${checklist.lights ? 'Sáng' : 'Hỏng'}, Nhớt: ${checklist.oil ? 'Đầy' : 'Cạn'}.`,
      cost,
      odometer,
      status: 'in_progress',
      scheduledDate: new Date()
    };

    createMutation.mutate(payload);
  };

  const handleCompleteWithSign = () => {
    if (!detailModal) return;
    const sig = techCanvasRef.current?.toDataURL() || '';
    if (!sig) {
      toast.error('Kỹ thuật viên vui lòng ký xác nhận vào ô chữ ký!');
      return;
    }
    completeMutation.mutate({
      id: detailModal._id,
      signature: sig,
      notes: 'Đã kiểm tra kỹ thuật đạt chuẩn an toàn giao thông, sẵn sàng cho thuê.'
    });
  };

  const records = data?.data || [];
  const vehicles = vehiclesData?.data || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🔧 Quản Lý Kỹ Thuật, Tình Trạng Xe & Ký Điện Tử</h1>
          <p className="page-subtitle">Module chuyên biệt cho Kỹ thuật viên: kiểm tra 12 hạng mục an toàn, chụp ảnh hiện trạng và ký số xác nhận</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
          <span>+</span> Tạo Phiếu Kiểm Tra Kỹ Thuật
        </button>
      </div>

      {/* Checklist quick KPI bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>QUY TRÌNH KỸ THUẬT</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>8 Tiêu Chuẩn An Toàn</div>
          <div style={{ fontSize: '11px', color: '#06b6d4', marginTop: '2px' }}>Phanh, Lốp, Nhớt, Động cơ, Đèn, Còi...</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>HÌNH ẢNH HIỆN TRẠNG</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>Lưu Trữ Ảnh 4 Góc</div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>Minh bạch vết trầy xước trước & sau thuê</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CHỮ KÝ KỸ THUẬT VIÊN</div>
          <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>Ký Số Trách Nhiệm</div>
          <div style={{ fontSize: '11px', color: '#f97316', marginTop: '2px' }}>Cam kết xe an toàn trước khi lăn bánh</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedType === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('')}
          >
            Tất Cả Loại
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'pre_rental' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('pre_rental')}
          >
            Kiểm Tra Trước Giao
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'post_rental' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('post_rental')}
          >
            Kiểm Tra Sau Thu Hồi
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'routine' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('routine')}
          >
            Bảo Dưỡng Định Kỳ
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'repair' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('repair')}
          >
            Sửa Chữa Hỏng Hóc
          </button>
        </div>
      </div>

      {/* Maintenance table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách kỹ thuật...</div>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-text">Chưa có phiếu kiểm tra kỹ thuật nào</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Xe Moto</th>
                  <th>Loại Phiếu</th>
                  <th>Mô Tả / Tình Trạng</th>
                  <th>Số KM (Odo)</th>
                  <th>Chi Phí (đ)</th>
                  <th>Kỹ Thuật Viên</th>
                  <th>Chữ Ký Xác Nhận</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec: any) => {
                  const typeInfo = TYPE_LABELS[rec.type] || { label: rec.type, icon: '🔧' };
                  const statusInfo = STATUS_LABELS[rec.status] || { label: rec.status, class: 'badge-pending' };
                  return (
                    <tr key={rec._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.vehicle?.name || 'Xe hệ thống'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: 700 }}>
                          {rec.vehicle?.licensePlate || ''}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.description || 'Kiểm tra kỹ thuật định kỳ'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Ngày: {new Date(rec.scheduledDate || rec.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{rec.odometer || 0} km</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.cost?.toLocaleString('vi-VN') || 0} đ</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{rec.technician?.fullName || user?.fullName || 'KTV Hải Châu'}</div>
                      </td>
                      <td>
                        {rec.technicianSignature ? (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '12px' }}>
                            ✅ Đã ký số
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-yellow)', fontSize: '12px' }}>
                            ⏳ Chưa ký
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setDetailModal(rec)}
                        >
                          👁️ Chi Tiết & Ký
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

      {/* CREATE TECHNICAL INSPECTION MODAL */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title">🔧 Phiếu Kiểm Tra Kỹ Thuật & Tình Trạng Xe</div>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Chọn xe kiểm tra *</label>
                  <select
                    required
                    className="form-input"
                    value={vehicleId}
                    onChange={e => {
                      setVehicleId(e.target.value);
                      const found = vehicles.find((v: any) => v._id === e.target.value);
                      if (found) setOdometer(found.odometer || 0);
                    }}
                  >
                    <option value="">-- Chọn xe mô tô --</option>
                    {vehicles.map((v: any) => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.licensePlate}) - {v.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Loại kiểm tra *</label>
                  <select
                    className="form-input"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="pre_rental">Kiểm tra an toàn trước giao xe</option>
                    <option value="post_rental">Kiểm tra thu hồi sau khi khách trả</option>
                    <option value="routine">Bảo dưỡng định kỳ (thay nhớt, lọc gió)</option>
                    <option value="repair">Sửa chữa sự cố / hỏng hóc</option>
                  </select>
                </div>
              </div>

              {/* Technical Inspection Checklist */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#06b6d4', textTransform: 'uppercase' }}>
                  ✓ Checklist 8 Hạng Mục An Toàn Kỹ Thuật
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.engine} onChange={e => setChecklist({ ...checklist, engine: e.target.checked })} />
                    <span>Động cơ êm, không gõ máy</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.brakes} onChange={e => setChecklist({ ...checklist, brakes: e.target.checked })} />
                    <span>Phanh trước & phanh sau ăn</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.tires} onChange={e => setChecklist({ ...checklist, tires: e.target.checked })} />
                    <span>Lốp gai dày, đủ áp suất</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.lights} onChange={e => setChecklist({ ...checklist, lights: e.target.checked })} />
                    <span>Hệ thống đèn pha, cos, xi nhan</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.horn} onChange={e => setChecklist({ ...checklist, horn: e.target.checked })} />
                    <span>Còi xe phát âm thanh rõ</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.mirrors} onChange={e => setChecklist({ ...checklist, mirrors: e.target.checked })} />
                    <span>Đủ 02 gương chiếu hậu</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.oil} onChange={e => setChecklist({ ...checklist, oil: e.target.checked })} />
                    <span>Mức nhớt máy đạt chuẩn</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={checklist.smartkey} onChange={e => setChecklist({ ...checklist, smartkey: e.target.checked })} />
                    <span>Khóa Smartkey nhạy, pin tốt</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Số KM trên đồng hồ</label>
                  <input
                    type="number"
                    className="form-input"
                    value={odometer}
                    onChange={e => setOdometer(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chi phí vật tư / bảo dưỡng (đ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={cost}
                    onChange={e => setCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Ghi chú chi tiết tình trạng vỏ xe, trầy xước</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận vết trầy xước bên yếm phải, đã vệ sinh xích tải, thay nhớt Castrol 10W-40..."
                  className="form-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary w-full">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary w-full">
                  {createMutation.isPending ? 'Đang lưu...' : 'Tạo Phiếu Kiểm Tra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL & SIGNATURE MODAL */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">
                🔍 Phiếu Kỹ Thuật: {detailModal.vehicle?.name} ({detailModal.vehicle?.licensePlate})
              </div>
              <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.7 }}>
              <div><strong>Loại:</strong> {TYPE_LABELS[detailModal.type]?.label || detailModal.type}</div>
              <div><strong>Kỹ thuật viên:</strong> {detailModal.technician?.fullName || user?.fullName}</div>
              <div><strong>Số KM (Odo):</strong> {detailModal.odometer || 0} km</div>
              <div><strong>Chi phí phụ tùng:</strong> {detailModal.cost?.toLocaleString('vi-VN')} đ</div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-primary)' }}>
                <strong>Tình trạng ghi nhận:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{detailModal.description || 'Xe đạt tiêu chuẩn an toàn kỹ thuật'}</p>
              </div>
            </div>

            {/* Signature Area */}
            {detailModal.technicianSignature ? (
              <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 700, marginBottom: '6px' }}>
                  ✓ ĐÃ ĐƯỢC KÝ XÁC NHẬN BỞI KỸ THUẬT VIÊN
                </div>
                <img src={detailModal.technicianSignature} alt="Chữ ký KTV" style={{ height: '70px', display: 'block', margin: '0 auto' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Ký lúc: {new Date(detailModal.completedDate || detailModal.updatedAt).toLocaleString('vi-VN')}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ color: '#06b6d4', fontWeight: 600 }}>
                    ✍️ Kỹ thuật viên ký xác nhận xe đủ điều kiện lưu hành *
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Xóa ký lại
                  </button>
                </div>

                <div style={{ border: '2px dashed #67e8f9', borderRadius: '12px', background: '#ffffff', overflow: 'hidden' }}>
                  <canvas
                    ref={techCanvasRef}
                    width={540}
                    height={130}
                    style={{ width: '100%', height: '130px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Ký bằng chuột hoặc cảm ứng điện thoại để chịu trách nhiệm kỹ thuật cho xe.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDetailModal(null)} className="btn btn-secondary w-full">
                Đóng
              </button>
              {!detailModal.technicianSignature && (
                <button
                  onClick={handleCompleteWithSign}
                  disabled={completeMutation.isPending}
                  className="btn btn-primary w-full"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
                >
                  {completeMutation.isPending ? 'Đang lưu...' : 'Ký Xác Nhận & Hoàn Tất'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
