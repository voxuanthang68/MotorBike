'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending: { label: 'Chờ duyệt', class: 'badge-pending' },
  confirmed: { label: 'Đã xác nhận', class: 'badge-confirmed' },
  active: { label: 'Đang thuê', class: 'badge-active' },
  completed: { label: 'Đã hoàn thành', class: 'badge-completed' },
  cancelled: { label: 'Đã hủy', class: 'badge-cancelled' },
};

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modals
  const [checkInModal, setCheckInModal] = useState<any | null>(null);
  const [checkOutModal, setCheckOutModal] = useState<any | null>(null);
  const [createContractModal, setCreateContractModal] = useState<any | null>(null);

  // Form states for Check-in
  const [checkInOdo, setCheckInOdo] = useState<number>(0);
  const [checkInNote, setCheckInNote] = useState<string>('Xe sạch sẽ, phanh tốt, xăng đầy vạch, 2 mũ bảo hiểm');
  const checkInCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingIn, setIsDrawingIn] = useState(false);

  // Form states for Check-out
  const [checkOutOdo, setCheckOutOdo] = useState<number>(0);
  const [checkOutNote, setCheckOutNote] = useState<string>('Khách trả xe đúng hẹn, không trầy xước phát sinh');
  const [lateFee, setLateFee] = useState<number>(0);
  const [damageFee, setDamageFee] = useState<number>(0);
  const [fuelFee, setFuelFee] = useState<number>(0);
  const checkOutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingOut, setIsDrawingOut] = useState(false);

  // Query bookings
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', selectedStatus, searchTerm, page],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/bookings', { params });
      return res.data;
    }
  });

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) => {
      return api.put(`/bookings/${id}/status`, { status, cancelReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Cập nhật trạng thái thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  // CheckIn mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/bookings/${id}/checkin`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCheckInModal(null);
      toast.success('Bàn giao & Check-in xe thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Check-in thất bại!')
  });

  // CheckOut mutation
  const checkOutMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.put(`/bookings/${id}/checkout`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCheckOutModal(null);
      toast.success('Thu hồi xe & Check-out thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Check-out thất bại!')
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return api.post('/contracts', {
        bookingId,
        termsAndConditions: 'Bên thuê cam kết tuân thủ Luật giao thông đường bộ Việt Nam. Không mang xe ra khỏi phạm vi thỏa thuận mà không báo trước.'
      });
    },
    onSuccess: (res: any) => {
      toast.success('Tạo hợp đồng điện tử thành công! Chuyển hướng đến hợp đồng...');
      setCreateContractModal(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Tạo hợp đồng thất bại!')
  });

  // Canvas drawing helpers
  const startDrawing = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (canvas: HTMLCanvasElement, e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f97316';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInModal) return;
    const sig = checkInCanvasRef.current?.toDataURL() || '';
    checkInMutation.mutate({
      id: checkInModal._id,
      data: {
        checkInOdometer: checkInOdo || checkInModal.vehicle?.odometer || 0,
        checkInNote,
        checkInSignature: sig
      }
    });
  };

  const handleCheckOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkOutModal) return;
    const sig = checkOutCanvasRef.current?.toDataURL() || '';
    checkOutMutation.mutate({
      id: checkOutModal._id,
      data: {
        checkOutOdometer: checkOutOdo || (checkOutModal.checkInOdometer + 50),
        checkOutNote,
        checkOutSignature: sig,
        lateFee,
        damageFee,
        fuelFee
      }
    });
  };

  const bookings = data?.data || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản Lý Đặt Xe & Thuê Xe</h1>
          <p className="page-subtitle">Tiếp nhận đặt xe, bàn giao check-in, thu hồi check-out và tạo hợp đồng tại Hải Châu</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/dashboard/contracts" className="btn btn-secondary">
            <span>📄</span> Danh Sách Hợp Đồng
          </Link>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${selectedStatus === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedStatus(''); setPage(1); }}
          >
            Tất Cả
          </button>
          <button
            className={`btn btn-sm ${selectedStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedStatus('pending'); setPage(1); }}
          >
            Chờ Duyệt
          </button>
          <button
            className={`btn btn-sm ${selectedStatus === 'confirmed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedStatus('confirmed'); setPage(1); }}
          >
            Đã Xác Nhận
          </button>
          <button
            className={`btn btn-sm ${selectedStatus === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedStatus('active'); setPage(1); }}
          >
            Đang Thuê
          </button>
          <button
            className={`btn btn-sm ${selectedStatus === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedStatus('completed'); setPage(1); }}
          >
            Đã Hoàn Thành
          </button>
          <button
            className={`btn btn-sm ${selectedStatus === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedStatus('cancelled'); setPage(1); }}
          >
            Đã Hủy
          </button>
        </div>

        <div className="search-bar" style={{ maxWidth: '300px' }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Tìm mã đặt xe, tên..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          )}
        </div>
      </div>

      {/* Bookings table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách đặt xe...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-text">Chưa có đơn đặt xe nào phù hợp</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Xe Thuê</th>
                  <th>Thời Gian Thuê</th>
                  <th>Tổng Tiền</th>
                  <th>Điểm Nhận</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking: any) => {
                  const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, class: 'badge-pending' };
                  return (
                    <tr key={booking._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {booking.bookingCode || booking._id?.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{booking.customer?.fullName || 'Khách vãng lai'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{booking.customer?.phone || booking.customer?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{booking.vehicle?.name || 'Chưa gán xe'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--brand-primary)' }}>{booking.vehicle?.licensePlate || ''}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {new Date(booking.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {booking.totalDays} ngày ({booking.pricePerDay?.toLocaleString('vi-VN')} đ/ngày)
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {booking.finalPrice?.toLocaleString('vi-VN') || booking.totalPrice?.toLocaleString('vi-VN')} đ
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Cọc: {booking.deposit?.toLocaleString('vi-VN')} đ
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📍 {booking.pickupLocation || 'Tại cửa hàng'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Pending: Confirm or Cancel */}
                          {booking.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => statusMutation.mutate({ id: booking._id, status: 'confirmed' })}
                              >
                                Duyệt
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => statusMutation.mutate({ id: booking._id, status: 'cancelled', cancelReason: 'Khách đổi ý' })}
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {/* Confirmed: Create Contract or Check-in */}
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                className="btn btn-sm btn-secondary"
                                title="Tạo Hợp Đồng"
                                onClick={() => setCreateContractModal(booking)}
                              >
                                📄 Hợp Đồng
                              </button>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setCheckInModal(booking);
                                  setCheckInOdo(booking.vehicle?.odometer || 0);
                                }}
                              >
                                🚀 Check-in (Giao Xe)
                              </button>
                            </>
                          )}

                          {/* Active: Check-out */}
                          {booking.status === 'active' && (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ background: 'var(--accent-purple)' }}
                              onClick={() => {
                                setCheckOutModal(booking);
                                setCheckOutOdo(booking.checkInOdometer ? booking.checkInOdometer + 30 : 0);
                              }}
                            >
                              🏁 Check-out (Nhận Xe)
                            </button>
                          )}

                          {/* Completed */}
                          {booking.status === 'completed' && (
                            <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                              ✓ Đã xong
                            </span>
                          )}
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
        {pagination.pages > 1 && (
          <div className="pagination" style={{ padding: '16px' }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CHECK-IN MODAL (BÀN GIAO XE & KÝ NHẬN) */}
      {checkInModal && (
        <div className="modal-overlay" onClick={() => setCheckInModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <div className="modal-title">
                🚀 Bàn Giao Xe & Check-in (Mã: {checkInModal.bookingCode})
              </div>
              <button onClick={() => setCheckInModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCheckInSubmit}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Khách hàng:</strong> {checkInModal.customer?.fullName}</div>
                <div><strong>Số điện thoại:</strong> {checkInModal.customer?.phone}</div>
                <div><strong>Xe bàn giao:</strong> {checkInModal.vehicle?.name}</div>
                <div><strong>Biển số xe:</strong> <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{checkInModal.vehicle?.licensePlate}</span></div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Số Kilomet hiện tại trên đồng hồ xe (Odometer) *</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={checkInOdo}
                  onChange={e => setCheckInOdo(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Tình trạng xe & phụ kiện bàn giao *</label>
                <textarea
                  rows={2}
                  className="form-input"
                  value={checkInNote}
                  onChange={e => setCheckInNote(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label">Chữ ký điện tử Khách hàng / Người nhận xe *</label>
                  <button
                    type="button"
                    onClick={() => clearCanvas(checkInCanvasRef.current)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Xóa ký lại
                  </button>
                </div>
                <div style={{ border: '1px dashed var(--glass-border)', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                  <canvas
                    ref={checkInCanvasRef}
                    width={560}
                    height={140}
                    style={{ width: '100%', height: '140px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={(e) => { setIsDrawingIn(true); startDrawing(checkInCanvasRef.current!, e); }}
                    onMouseMove={(e) => { if (isDrawingIn) draw(checkInCanvasRef.current!, e); }}
                    onMouseUp={() => setIsDrawingIn(false)}
                    onMouseLeave={() => setIsDrawingIn(false)}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  * Vẽ trực tiếp chữ ký của khách hàng bằng chuột hoặc cảm ứng ngón tay
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setCheckInModal(null)} className="btn btn-secondary w-full">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={checkInMutation.isPending} className="btn btn-primary w-full">
                  {checkInMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-OUT MODAL (THU HỒI XE & QUYẾT TOÁN) */}
      {checkOutModal && (
        <div className="modal-overlay" onClick={() => setCheckOutModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title">
                🏁 Thu Hồi Xe & Check-out (Mã: {checkOutModal.bookingCode})
              </div>
              <button onClick={() => setCheckOutModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCheckOutSubmit}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '12px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong>Khách hàng:</strong> {checkOutModal.customer?.fullName}</div>
                <div><strong>Biển số:</strong> {checkOutModal.vehicle?.licensePlate}</div>
                <div><strong>Odo lúc nhận:</strong> {checkOutModal.checkInOdometer || 0} km</div>
                <div><strong>Tiền cọc đang giữ:</strong> <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{checkOutModal.deposit?.toLocaleString('vi-VN')} đ</span></div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Số Kilomet lúc trả xe (Odometer) *</label>
                <input
                  type="number"
                  required
                  className="form-input"
                  value={checkOutOdo}
                  onChange={e => setCheckOutOdo(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Phụ phí trễ giờ (đ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={lateFee}
                    onChange={e => setLateFee(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phí xăng dầu (đ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={fuelFee}
                    onChange={e => setFuelFee(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phí trầy xước/hư hại (đ)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={damageFee}
                    onChange={e => setDamageFee(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Ghi chú tình trạng xe lúc hoàn trả</label>
                <textarea
                  rows={2}
                  className="form-input"
                  value={checkOutNote}
                  onChange={e => setCheckOutNote(e.target.value)}
                />
              </div>

              {/* Settlement summary */}
              <div style={{ background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tiền cọc hoàn trả lại cho khách:</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)' }}>
                    {Math.max(0, (checkOutModal.deposit || 0) - (lateFee + fuelFee + damageFee)).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                {lateFee + fuelFee + damageFee > 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--accent-red)', textAlign: 'right' }}>
                    Khấu trừ phụ phí: {(lateFee + fuelFee + damageFee).toLocaleString('vi-VN')} đ
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label">Chữ ký điện tử Nhân viên kiểm tra thu hồi *</label>
                  <button
                    type="button"
                    onClick={() => clearCanvas(checkOutCanvasRef.current)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Xóa ký lại
                  </button>
                </div>
                <div style={{ border: '1px dashed var(--glass-border)', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                  <canvas
                    ref={checkOutCanvasRef}
                    width={560}
                    height={120}
                    style={{ width: '100%', height: '120px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={(e) => { setIsDrawingOut(true); startDrawing(checkOutCanvasRef.current!, e); }}
                    onMouseMove={(e) => { if (isDrawingOut) draw(checkOutCanvasRef.current!, e); }}
                    onMouseUp={() => setIsDrawingOut(false)}
                    onMouseLeave={() => setIsDrawingOut(false)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setCheckOutModal(null)} className="btn btn-secondary w-full">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={checkOutMutation.isPending} className="btn btn-primary w-full">
                  {checkOutMutation.isPending ? 'Đang lưu...' : 'Hoàn Tất Check-Out & Quyết Toán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CONTRACT CONFIRMATION MODAL */}
      {createContractModal && (
        <div className="modal-overlay" onClick={() => setCreateContractModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title">📄 Khởi Tạo Hợp Đồng Thuê Xe Điện Tử</div>
              <button onClick={() => setCreateContractModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              Bạn có muốn tạo hợp đồng thuê xe điện tử pháp lý cho đơn đặt xe <strong>{createContractModal.bookingCode}</strong> (Khách: {createContractModal.customer?.fullName}, Xe: {createContractModal.vehicle?.name}) không?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCreateContractModal(null)} className="btn btn-secondary w-full">Hủy</button>
              <button
                onClick={() => createContractMutation.mutate(createContractModal._id)}
                disabled={createContractMutation.isPending}
                className="btn btn-primary w-full"
              >
                {createContractMutation.isPending ? 'Đang tạo...' : 'Tạo Hợp Đồng Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
