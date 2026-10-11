'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    cccd: '', address: ''
  });
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    try {
      await registerUser(formData);
      toast.success('Đăng ký thành công!');
      router.push('/portal');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '480px', animation: 'slideUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--brand-gradient)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 12px',
            boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
          }}>🏍️</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
            Moto<span style={{ color: 'var(--brand-primary)' }}>Bike</span> Hải Châu
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Đăng ký tài khoản khách hàng
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: step >= s ? 'var(--brand-primary)' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {step === 1 && (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Thông tin cơ bản</h3>
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input className="form-input" type="text" placeholder="Nguyễn Văn A" value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="email@example.com" value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input className="form-input" type="tel" placeholder="0901234567" value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu *</label>
                  <input className="form-input" type="password" placeholder="Ít nhất 6 ký tự" value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Xác nhận mật khẩu *</label>
                  <input className="form-input" type="password" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required />
                </div>
                <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => {
                    if (!formData.fullName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
                      toast.error('Vui lòng điền đầy đủ thông tin!');
                      return;
                    }
                    if (formData.password !== formData.confirmPassword) {
                      toast.error('Mật khẩu không khớp!');
                      return;
                    }
                    setStep(2);
                  }}>
                  Tiếp theo →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Thông tin bổ sung</h3>
                <div className="form-group">
                  <label className="form-label">Số CCCD/CMND</label>
                  <input className="form-input" type="text" placeholder="012345678901" value={formData.cccd}
                    onChange={e => setFormData({...formData, cccd: e.target.value})} />
                  <span className="form-hint">Cần thiết để thuê xe</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ</label>
                  <input className="form-input" type="text" placeholder="123 Đường ABC, Đà Nẵng" value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                    ← Quay lại
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={isLoading}>
                    {isLoading ? <><div className="spinner" style={{width:'16px',height:'16px'}}/> Đang tạo...</> : '✅ Hoàn tất đăng ký'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Đã có tài khoản?{' '}
            <Link href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
