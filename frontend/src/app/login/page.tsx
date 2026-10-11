'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') router.push('/portal');
      else router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const demoAccounts = [
    { role: 'Chủ cửa hàng', email: 'owner@motobike.vn', password: 'Owner@123', color: '#f97316' },
    { role: 'Quản trị viên', email: 'admin@motobike.vn', password: 'Admin@123', color: '#8b5cf6' },
    { role: 'Lễ tân', email: 'receptionist@motobike.vn', password: 'Recep@123', color: '#3b82f6' },
    { role: 'Kỹ thuật', email: 'tech@motobike.vn', password: 'Tech@123', color: '#06b6d4' },
    { role: 'Kế toán', email: 'accountant@motobike.vn', password: 'Acct@123', color: '#f59e0b' },
    { role: 'Khách hàng', email: 'customer@gmail.com', password: 'Customer@123', color: '#94a3b8' },
  ];

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
      {/* Background orbs */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '440px', animation: 'slideUp 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'var(--brand-gradient)',
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
          }}>🏍️</div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Moto<span style={{ color: 'var(--brand-primary)' }}>Bike</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Hải Châu • Đà Nẵng
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Đăng nhập hệ thống</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Nhập thông tin tài khoản để tiếp tục
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: '18px', height: '18px' }} /> Đang đăng nhập...</>
              ) : (
                '🔐 Đăng nhập'
              )}
            </button>
          </form>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Khách hàng chưa có tài khoản?{' '}
            <Link href="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Demo Accounts */}
        <div style={{ marginTop: '24px' }}>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Tài khoản demo (nhấn để điền tự động)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => setFormData({ email: acc.email, password: acc.password })}
                style={{
                  padding: '8px 12px',
                  background: 'var(--glass-bg)',
                  border: `1px solid rgba(255,255,255,0.06)`,
                  borderRadius: '8px',
                  color: acc.color,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = acc.color)}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
