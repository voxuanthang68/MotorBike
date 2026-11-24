'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('Hệ Thống Cho Thuê Xe Máy XTBike');
  const [address, setAddress] = useState('128 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng');
  const [phone, setPhone] = useState('0905.888.999');
  const [email, setEmail] = useState('contact@motobikehaichau.vn');
  const [bankName, setBankName] = useState('Ngân hàng Quân Đội (MBBank)');
  const [bankAccount, setBankAccount] = useState('0905888999');
  const [bankOwner, setBankOwner] = useState('XTBike');

  // Policy configs
  const [hourlyOvertimeFee, setHourlyOvertimeFee] = useState(25000);
  const [fuelBarFee, setFuelBarFee] = useState(30000);
  const [freeHelmets, setFreeHelmets] = useState(2);
  const [enableDigitalSign, setEnableDigitalSign] = useState(true);
  const [autoCreateContract, setAutoCreateContract] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Lưu cấu hình hệ thống & chính sách thuê xe thành công!');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Cài Đặt Hệ Thống & Cửa Hàng Hải Châu</h1>
          <p className="page-subtitle">Cấu hình thông tin pháp lý cửa hàng, tài khoản nhận cọc và chính sách phụ phí thuê xe</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Store Info */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>🏢 Thông Tin Cửa Hàng & Pháp Lý</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Hiển thị trên đầu hợp đồng điện tử và hóa đơn</div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Tên cửa hàng / Doanh nghiệp</label>
              <input
                type="text"
                className="form-input"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Địa chỉ trụ sở chính tại Hải Châu</label>
              <input
                type="text"
                className="form-input"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group">
                <label className="form-label">Hotline / Zalo liên hệ</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email hỗ trợ</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment & VietQR settings */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>💳 Tài Khoản Ngân Hàng Nhận Tiền Cọc & VietQR</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Tự động tạo mã QR khi lễ tân thu tiền</div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Tên ngân hàng</label>
              <input
                type="text"
                className="form-input"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Số tài khoản</label>
              <input
                type="text"
                className="form-input"
                value={bankAccount}
                onChange={e => setBankAccount(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label">Tên chủ tài khoản</label>
              <input
                type="text"
                className="form-input"
                value={bankOwner}
                onChange={e => setBankOwner(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Policy & Auto settings */}
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>📋 Chính Sách Thuê Xe & Phụ Phí Tự Động</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Hệ thống tự động tính khi check-out xe</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Phụ phí trễ giờ (đ/giờ)</label>
              <input
                type="number"
                className="form-input"
                value={hourlyOvertimeFee}
                onChange={e => setHourlyOvertimeFee(Number(e.target.value))}
              />
              <div className="form-hint">Áp dụng khi khách trả trễ sau 1 giờ ân hạn</div>
            </div>

            <div className="form-group">
              <label className="form-label">Phí xăng bù trừ (đ/vạch)</label>
              <input
                type="number"
                className="form-input"
                value={fuelBarFee}
                onChange={e => setFuelBarFee(Number(e.target.value))}
              />
              <div className="form-hint">Tính khi mức xăng lúc trả thấp hơn lúc nhận</div>
            </div>

            <div className="form-group">
              <label className="form-label">Số lượng mũ bảo hiểm miễn phí</label>
              <input
                type="number"
                className="form-input"
                value={freeHelmets}
                onChange={e => setFreeHelmets(Number(e.target.value))}
              />
              <div className="form-hint">Mặc định 2 nón bảo hiểm nửa đầu hoặc 3/4</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-primary)', paddingTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={enableDigitalSign}
                onChange={e => setEnableDigitalSign(e.target.checked)}
              />
              <span>Bắt buộc ký số điện tử trên Canvas trước khi bàn giao xe</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={autoCreateContract}
                onChange={e => setAutoCreateContract(e.target.checked)}
              />
              <span>Tự động kích hoạt hợp đồng khi cả hai bên đã ký xác nhận</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="submit" className="btn btn-primary btn-lg">
            💾 Lưu Thay Đổi Cấu Hình
          </button>
        </div>
      </form>
    </div>
  );
}
