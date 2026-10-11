'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending_signature: { label: 'Chờ ký', class: 'badge-pending' },
  active: { label: 'Có hiệu lực', class: 'badge-active' },
  completed: { label: 'Đã hoàn thành', class: 'badge-completed' },
  cancelled: { label: 'Đã hủy', class: 'badge-cancelled' },
};

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [signModal, setSignModal] = useState<any | null>(null);
  const [signRole, setSignRole] = useState<'customer' | 'staff'>('customer');

  // Canvas for signature
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Fetch contracts
  const { data, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts');
      return res.data;
    }
  });

  // Sign mutation
  const signMutation = useMutation({
    mutationFn: async ({ id, customerSignature, staffSignature }: { id: string; customerSignature?: string; staffSignature?: string }) => {
      return api.put(`/contracts/${id}/sign`, { customerSignature, staffSignature });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setSignModal(null);
      if (selectedContract) {
        setSelectedContract(res.data.data);
      }
      toast.success('Ký hợp đồng điện tử thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ký hợp đồng thất bại!')
  });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
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
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signModal) return;
    const sigData = sigCanvasRef.current?.toDataURL() || '';
    if (!sigData) {
      toast.error('Vui lòng ký vào khung!');
      return;
    }

    if (signRole === 'customer') {
      signMutation.mutate({ id: signModal._id, customerSignature: sigData });
    } else {
      signMutation.mutate({ id: signModal._id, staffSignature: sigData });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const contracts = data?.data || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản Lý Hợp Đồng Thuê Xe Điện Tử</h1>
          <p className="page-subtitle">Hợp đồng điện tử pháp lý, ký số hai bên (khách hàng & cửa hàng Hải Châu)</p>
        </div>
      </div>

      {/* Contracts table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách hợp đồng...</div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-text">Chưa có hợp đồng nào được khởi tạo</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Hợp Đồng</th>
                  <th>Khách Hàng</th>
                  <th>Xe Thuê</th>
                  <th>Thời Gian Thuê</th>
                  <th>Tổng Giá Trị</th>
                  <th>Chữ Ký Khách</th>
                  <th>Chữ Ký Cửa Hàng</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract: any) => {
                  const statusInfo = STATUS_LABELS[contract.status] || { label: contract.status, class: 'badge-pending' };
                  return (
                    <tr key={contract._id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-primary)' }}>
                          {contract.contractNumber || `HD-${contract._id?.slice(-6).toUpperCase()}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{contract.customerInfo?.fullName || contract.customer?.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contract.customerInfo?.phone || contract.customer?.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{contract.vehicleInfo?.name || contract.vehicle?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--brand-primary)' }}>{contract.vehicleInfo?.licensePlate || contract.vehicle?.licensePlate}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {new Date(contract.startDate).toLocaleDateString('vi-VN')} ➔ {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {contract.rentalDays} ngày
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{contract.totalPayable?.toLocaleString('vi-VN')} đ</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cọc: {contract.depositAmount?.toLocaleString('vi-VN')} đ</div>
                      </td>
                      <td>
                        {contract.customerSignature ? (
                          <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>✅ Đã ký</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--accent-yellow)' }}>⏳ Chưa ký</span>
                        )}
                      </td>
                      <td>
                        {contract.staffSignature ? (
                          <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>✅ Đã ký</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--accent-yellow)' }}>⏳ Chưa ký</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedContract(contract)}
                          >
                            👁️ Xem Chi Tiết
                          </button>
                          {(!contract.customerSignature || !contract.staffSignature) && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setSignModal(contract);
                                setSignRole(!contract.customerSignature ? 'customer' : 'staff');
                              }}
                            >
                              ✍️ Ký Ngay
                            </button>
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
      </div>

      {/* VIEW CONTRACT DETAIL & PRINT MODAL */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '850px', maxHeight: '92vh', background: '#0f0f18' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
              <div>
                <div className="modal-title">
                  📄 Hợp Đồng Số: {selectedContract.contractNumber || `HD-${selectedContract._id?.slice(-6).toUpperCase()}`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ngày lập: {new Date(selectedContract.createdAt || selectedContract.startDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handlePrint} className="btn btn-sm btn-secondary">
                  🖨️ In Hợp Đồng
                </button>
                <button onClick={() => setSelectedContract(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Contract Body Document */}
            <div style={{ padding: '24px 0', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
              {/* National Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '13px', fontStyle: 'italic' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ margin: '8px auto', width: '120px', height: '1px', background: 'var(--text-muted)' }} />
                <div style={{ fontWeight: 800, fontSize: '18px', marginTop: '16px', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  HỢP ĐỒNG CHO THUÊ XE MÁY TỰ LÁI
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  (Áp dụng dịch vụ thuê xe tại Quận Hải Châu, TP. Đà Nẵng)
                </div>
              </div>

              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    BÊN CHO THUÊ (BÊN A)
                  </div>
                  <div><strong>Đơn vị:</strong> Hệ Thống Cho Thuê Xe Máy MotoBike Hải Châu</div>
                  <div><strong>Địa chỉ:</strong> 128 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng</div>
                  <div><strong>Hotline:</strong> 0905.888.999</div>
                  <div><strong>Đại diện:</strong> Ông/Bà Quản Lý Chi Nhánh Hải Châu</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    BÊN THUÊ XE (BÊN B)
                  </div>
                  <div><strong>Họ và tên:</strong> {selectedContract.customerInfo?.fullName || selectedContract.customer?.fullName}</div>
                  <div><strong>Số CCCD/Hộ chiếu:</strong> {selectedContract.customerInfo?.cccd || selectedContract.customer?.cccd || 'Đã kiểm tra'}</div>
                  <div><strong>Số GPLX:</strong> {selectedContract.customerInfo?.drivingLicense || selectedContract.customer?.drivingLicense || 'Đã kiểm tra'}</div>
                  <div><strong>Số điện thoại:</strong> {selectedContract.customerInfo?.phone || selectedContract.customer?.phone}</div>
                </div>
              </div>

              {/* Vehicle & Rental terms */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  ĐIỀU 1: THÔNG TIN PHƯƠNG TIỆN & CHI PHÍ THUÊ XE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  <div>• Tên xe: <strong>{selectedContract.vehicleInfo?.name}</strong></div>
                  <div>• Biển số: <strong style={{ color: 'var(--brand-primary)' }}>{selectedContract.vehicleInfo?.licensePlate}</strong></div>
                  <div>• Hãng xe: <strong>{selectedContract.vehicleInfo?.brand}</strong></div>
                  <div>• Thời gian thuê: <strong>{selectedContract.rentalDays} ngày</strong></div>
                  <div>• Từ ngày: <strong>{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</strong></div>
                  <div>• Đến ngày: <strong>{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</strong></div>
                  <div>• Đơn giá thuê: <strong>{selectedContract.pricePerDay?.toLocaleString('vi-VN')} đ/ngày</strong></div>
                  <div>• Tiền đặt cọc: <strong style={{ color: 'var(--accent-green)' }}>{selectedContract.depositAmount?.toLocaleString('vi-VN')} đ</strong></div>
                  <div>• Tổng thanh toán: <strong style={{ color: 'var(--brand-primary)', fontSize: '15px' }}>{selectedContract.totalPayable?.toLocaleString('vi-VN')} đ</strong></div>
                </div>
              </div>

              {/* Commitments */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>ĐIỀU 2: TRÁCH NHIỆM VÀ CAM KẾT CHUNG</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
                  1. Bên B có trách nhiệm bảo quản xe cẩn thận, chấp hành nghiêm chỉnh luật giao thông. Không sử dụng xe vào mục đích vi phạm pháp luật.<br />
                  2. Bên A cam kết xe trong tình trạng vận hành tốt, bảo hiểm trách nhiệm dân sự đầy đủ và kèm 02 mũ bảo hiểm đạt chuẩn.<br />
                  3. Hai bên công nhận chữ ký điện tử được ký trực tiếp trên hệ thống này có giá trị pháp lý ràng buộc tương đương văn bản giấy.
                </p>
              </div>

              {/* Signature Display Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
                {/* Side A Signature */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>(Ký, ghi rõ họ tên và đóng dấu điện tử)</div>
                  {selectedContract.staffSignature ? (
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                      <img src={selectedContract.staffSignature} alt="Chữ ký Bên A" style={{ height: '70px', maxWidth: '100%' }} />
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px' }}>
                        ✓ Đã xác thực ký số điện tử
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                      Chưa ký
                    </div>
                  )}
                </div>

                {/* Side B Signature */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>ĐẠI DIỆN BÊN THUÊ XE (BÊN B)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>(Khách hàng ký và xác nhận)</div>
                  {selectedContract.customerSignature ? (
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', display: 'inline-block' }}>
                      <img src={selectedContract.customerSignature} alt="Chữ ký Bên B" style={{ height: '70px', maxWidth: '100%' }} />
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600, marginTop: '4px' }}>
                        ✓ {selectedContract.customerInfo?.fullName || 'Khách hàng đã ký'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--glass-border)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                      Chưa ký
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedContract(null)} className="btn btn-secondary">
                Đóng
              </button>
              {(!selectedContract.customerSignature || !selectedContract.staffSignature) && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSignModal(selectedContract);
                    setSignRole(!selectedContract.customerSignature ? 'customer' : 'staff');
                  }}
                >
                  ✍️ Ký Hợp Đồng Ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIGNING CANVAS MODAL */}
      {signModal && (
        <div className="modal-overlay" onClick={() => setSignModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div className="modal-title">
                ✍️ Ký Điện Tử Hợp Đồng #{signModal.contractNumber || signModal._id?.slice(-6).toUpperCase()}
              </div>
              <button onClick={() => setSignModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSignSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Chọn vai trò người ký</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm w-full ${signRole === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSignRole('customer')}
                  >
                    👤 Khách Hàng (Bên B)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm w-full ${signRole === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSignRole('staff')}
                  >
                    🏢 Cửa Hàng / Lễ Tân (Bên A)
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label">Vẽ chữ ký của bạn vào ô dưới đây *</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Xóa Ký Lại
                  </button>
                </div>

                <div style={{ border: '2px dashed var(--glass-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                  <canvas
                    ref={sigCanvasRef}
                    width={500}
                    height={160}
                    style={{ width: '100%', height: '160px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                  />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Chữ ký sẽ được mã hóa và lưu trực tiếp vào cơ sở dữ liệu hợp đồng điện tử.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setSignModal(null)} className="btn btn-secondary w-full">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={signMutation.isPending} className="btn btn-primary w-full">
                  {signMutation.isPending ? 'Đang lưu chữ ký...' : 'Xác Nhận Ký Hợp Đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
