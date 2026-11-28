'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import VietQrPaymentBox, { QrSessionData } from '@/components/payment/VietQrPaymentBox';

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  rental_fee: { label: 'Tiền thuê xe', color: '#10b981', sign: '+' },
  deposit: { label: 'Tiền đặt cọc', color: '#3b82f6', sign: '+' },
  refund: { label: 'Hoàn trả tiền cọc', color: '#ef4444', sign: '-' },
  damage_fee: { label: 'Phí bồi thường hư hại', color: '#f59e0b', sign: '+' },
  late_fee: { label: 'Phụ phí trễ giờ', color: '#f97316', sign: '+' },
  fuel_fee: { label: 'Phụ phí xăng dầu', color: '#8b5cf6', sign: '+' },
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản (VietQR)',
  qr: 'Quét mã QR',
  momo: 'Ví MoMo',
  vnpay: 'Cổng VNPAY',
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [qrModal, setQrModal] = useState<any | null>(null);
  const [qrDraftAmount, setQrDraftAmount] = useState<number>(500000);
  const [qrDraftDesc, setQrDraftDesc] = useState<string>('Thanh toan tien thue xe XTBike');

  // Form states
  const [type, setType] = useState('rental_fee');
  const [amount, setAmount] = useState(150000);
  const [method, setMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');
  const [bookingCode, setBookingCode] = useState('');

  // Fetch payments list
  const { data, isLoading } = useQuery({
    queryKey: ['payments', selectedType, selectedMethod, page],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (selectedType) params.type = selectedType;
      if (selectedMethod) params.method = selectedMethod;
      const res = await api.get('/payments', { params });
      return res.data;
    }
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['payments-summary'],
    queryFn: async () => {
      const res = await api.get('/payments/summary');
      return res.data;
    }
  });

  // Create payment mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/payments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-summary'] });
      setCreateModal(false);
      toast.success('Ghi nhận giao dịch tài chính thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      type,
      amount: Number(amount),
      method,
      paymentMethod: method,
      bookingCode,
      note: notes || `Giao dịch ${TYPE_CONFIG[type]?.label || type}${bookingCode ? ` đơn ${bookingCode}` : ''}`,
      notes: notes || `Giao dịch ${TYPE_CONFIG[type]?.label || type}${bookingCode ? ` đơn ${bookingCode}` : ''}`,
      status: 'completed',
    });
  };

  const payments = data?.data || [];
  const summary = summaryData?.data || { totalRevenue: 0, totalDeposit: 0, totalRefund: 0, totalFees: 0 };
  const pagination = data?.pagination || { total: 0, pages: 1 };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Quản Lý Thu Chi, Tiền Cọc & Kế Toán</h1>
          <p className="page-subtitle">Kiểm soát dòng tiền doanh thu thuê xe, đối soát cọc và xuất hóa đơn tại Hải Châu</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setQrDraftAmount(500000);
              setQrDraftDesc('Thanh toan tien thue xe XTBike');
              setQrModal({ amount: 500000, desc: 'Thanh toan tien thue xe XTBike' });
            }}
          >
            <span>📱</span> Tạo Mã VietQR Thanh Toán
          </button>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>
            <span>+</span> Ghi Nhận Giao Dịch
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG DOANH THU THUÊ XE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '6px' }}>
            {summary.totalRevenue?.toLocaleString('vi-VN') || 0} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Dòng tiền thực nhận</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TIỀN ĐẶT CỌC ĐANG GIỮ</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '6px' }}>
            {summary.totalDeposit?.toLocaleString('vi-VN') || 0} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Sẽ hoàn trả khi nhận xe</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ĐÃ HOÀN TRẢ CỌC</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-red)', marginTop: '6px' }}>
            {summary.totalRefund?.toLocaleString('vi-VN') || 0} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Hoàn cọc sau check-out</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>PHỤ PHÍ & BỒI THƯỜNG</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '6px' }}>
            {summary.totalFees?.toLocaleString('vi-VN') || 0} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Phí trễ, xăng, hỏng hóc</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${selectedType === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedType(''); setPage(1); }}
          >
            Tất Cả Loại
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'rental_fee' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedType('rental_fee'); setPage(1); }}
          >
            Tiền Thuê Xe
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'deposit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedType('deposit'); setPage(1); }}
          >
            Tiền Cọc
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'refund' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedType('refund'); setPage(1); }}
          >
            Hoàn Cọc
          </button>
          <button
            className={`btn btn-sm ${selectedType === 'damage_fee' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setSelectedType('damage_fee'); setPage(1); }}
          >
            Phụ Phí
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-input"
            style={{ width: '180px', padding: '6px 12px', fontSize: '12px' }}
            value={selectedMethod}
            onChange={(e) => { setSelectedMethod(e.target.value); setPage(1); }}
          >
            <option value="">-- Phương thức --</option>
            <option value="bank_transfer">Chuyển khoản (VietQR)</option>
            <option value="cash">Tiền mặt</option>
            <option value="momo">Ví MoMo</option>
            <option value="vnpay">VNPAY</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải lịch sử giao dịch...</div>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <div className="empty-state-text">Chưa có giao dịch thanh toán nào</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '52px', textAlign: 'center' }}>STT</th>
                  <th>Mã GD</th>
                  <th>Loại Thu / Chi</th>
                  <th>Số Tiền (VNĐ)</th>
                  <th>Phương Thức</th>
                  <th>Ghi Chú & Nội Dung</th>
                  <th>Thời Gian</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any, idx: number) => {
                  const cfg = TYPE_CONFIG[p.type] || { label: p.type, color: 'var(--text-primary)', sign: '' };
                  return (
                    <tr key={p._id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        {(page - 1) * 12 + idx + 1}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {p.paymentCode || p.transactionCode || p._id?.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: cfg.color }}>
                          {cfg.sign} {p.amount?.toLocaleString('vi-VN')} đ
                        </div>
                      </td>
                      <td>
                        <span className="tag">
                          {METHOD_LABELS[p.method || p.paymentMethod] || p.method || p.paymentMethod || 'Chuyển khoản'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.note || p.notes || 'Thanh toán thuê xe máy'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(p.transactionDate || p.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-completed">Thành công</span>
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

      {/* CREATE TRANSACTION MODAL */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">💰 Ghi Nhận Giao Dịch Thu / Chi</div>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Loại giao dịch *</label>
                <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                  <option value="rental_fee">Tiền thuê xe (+ Thu)</option>
                  <option value="deposit">Tiền đặt cọc xe (+ Thu giữ hộ)</option>
                  <option value="refund">Hoàn trả tiền cọc cho khách (- Chi)</option>
                  <option value="damage_fee">Phí bồi thường hư hại xe (+ Thu)</option>
                  <option value="late_fee">Phụ phí trả xe trễ (+ Thu)</option>
                  <option value="fuel_fee">Phụ phí xăng dầu (+ Thu)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  className="form-input"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Phương thức thanh toán *</label>
                <select className="form-input" value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="bank_transfer">Chuyển khoản VietQR</option>
                  <option value="cash">Tiền mặt tại quầy / khi giao xe</option>
                  <option value="momo">Ví điện tử MoMo</option>
                  <option value="vnpay">Cổng thanh toán VNPAY</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Mã đơn đặt xe (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: MB-8899"
                  className="form-input"
                  value={bookingCode}
                  onChange={e => setBookingCode(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Ghi chú nội dung giao dịch</label>
                <textarea
                  rows={2}
                  placeholder="Khách chuyển khoản cọc xe Vision qua VietQR..."
                  className="form-input"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setCreateModal(false)} className="btn btn-secondary w-full">Hủy Bỏ</button>
                <button type="submit" disabled={createMutation.isPending} className="btn btn-primary w-full">
                  {createMutation.isPending ? 'Đang lưu...' : 'Lưu Giao Dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIETQR MODAL */}
      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ width: '100%' }}>
                📱 Quét Mã VietQR Chuyển Khoản
              </div>
              <button onClick={() => setQrModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '14px', alignItems: 'end' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Số tiền (VNĐ)</label>
                <input
                  type="number"
                  min={1000}
                  step={10000}
                  className="form-input"
                  value={qrDraftAmount}
                  onChange={e => setQrDraftAmount(Math.max(1000, Number(e.target.value) || 1000))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Nội dung</label>
                <input
                  type="text"
                  className="form-input"
                  value={qrDraftDesc}
                  onChange={e => setQrDraftDesc(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: '40px', padding: '0 12px', fontSize: '12px' }}
                onClick={() => setQrModal({ amount: Math.max(1000, qrDraftAmount || 1000), desc: qrDraftDesc.trim() || 'Thanh toan XTBike' })}
              >
                Áp dụng
              </button>
            </div>

            <VietQrPaymentBox
              amount={Number(qrModal.amount || 500000)}
              type="rental_fee"
              description={qrModal.desc}
              accentColor="#059669"
              qrSize={230}
              confirmLabel="Đã Nhận Được Tiền"
              onConfirmPayment={async (qrSession: QrSessionData) => {
                try {
                  await api.post('/payments', {
                    type: 'rental_fee',
                    amount: qrSession.amount,
                    method: 'qr',
                    qrSessionId: qrSession._id,
                    qrSessionCode: qrSession.sessionCode,
                    referenceNumber: qrSession.transferContent,
                    note: `${qrModal.desc} (${qrSession.sessionCode})`,
                  });
                  queryClient.invalidateQueries({ queryKey: ['payments'] });
                  queryClient.invalidateQueries({ queryKey: ['payments-summary'] });
                  setQrModal(null);
                  toast.success('Đã ghi nhận giao dịch VietQR!');
                } catch (err: unknown) {
                  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                  toast.error(msg || 'Ghi nhận thất bại.');
                  throw err;
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
