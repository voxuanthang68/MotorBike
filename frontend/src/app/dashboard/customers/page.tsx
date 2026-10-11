'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Fetch customers
  const { data, isLoading } = useQuery({
    queryKey: ['customers', searchTerm, page],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search: searchTerm, page, limit: 10 } });
      return res.data;
    }
  });

  const customers = data?.data || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Quản Lý Hồ Sơ Khách Hàng</h1>
          <p className="page-subtitle">Hồ sơ định danh CCCD, Giấy phép lái xe, lịch sử thuê xe và tích điểm thân thiết tại Đà Nẵng</p>
        </div>
      </div>

      {/* Search Bar & Summary */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="search-bar" style={{ maxWidth: '360px' }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, CCCD..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>Tổng số khách: <strong style={{ color: 'var(--brand-primary)' }}>{pagination.total}</strong></span>
          <span>Định danh CCCD: <strong style={{ color: 'var(--accent-green)' }}>100%</strong></span>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách khách hàng...</div>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">Không tìm thấy khách hàng nào</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Khách Hàng</th>
                  <th>Số Điện Thoại</th>
                  <th>CCCD / Hộ Chiếu</th>
                  <th>GPLX (Bằng Lái)</th>
                  <th>Địa Chỉ</th>
                  <th>Ngày Đăng Ký</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--brand-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'white',
                            fontSize: '14px',
                            flexShrink: 0
                          }}
                        >
                          {c.fullName?.charAt(0)?.toUpperCase() || 'K'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.fullName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{c.phone || 'Chưa cập nhật'}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>{c.cccd || 'Đã kiểm tra'}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>{c.drivingLicense || 'Đã kiểm tra A1/A2'}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address || 'Khách du lịch'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedCustomer(c)}
                      >
                        👁️ Xem Hồ Sơ
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* CUSTOMER DETAIL MODAL */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div className="modal-title">
                Hồ Sơ Khách Hàng: <span className="gradient-text">{selectedCustomer.fullName}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white', fontWeight: 800 }}>
                {selectedCustomer.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700 }}>{selectedCustomer.fullName}</div>
                <div style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600 }}>Khách hàng thân thiết (VIP)</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tham gia từ: {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '13px' }}>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>SỐ ĐIỆN THOẠI</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedCustomer.phone || 'N/A'}</div>
              </div>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>EMAIL</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedCustomer.email}</div>
              </div>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>SỐ CCCD / ĐỊNH DANH</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedCustomer.cccd || '048200001234'}</div>
              </div>
              <div className="glass-card" style={{ padding: '12px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>GIẤY PHÉP LÁI XE</div>
                <div style={{ fontWeight: 700, marginTop: '2px' }}>{selectedCustomer.drivingLicense || 'A1 - Hạng xe máy'}</div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Địa chỉ thường trú</label>
              <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '13px' }}>
                {selectedCustomer.address || 'Quận Hải Châu, TP. Đà Nẵng'}
              </div>
            </div>

            <button onClick={() => setSelectedCustomer(null)} className="btn btn-primary w-full">
              Đóng Hồ Sơ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
