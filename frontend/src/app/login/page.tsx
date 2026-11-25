'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !password) {
      toast.error('Vui lòng nhập số điện thoại/email và mật khẩu!');
      return;
    }
    try {
      await login(emailOrPhone, password);
      toast.success('Đăng nhập thành công!');
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.role === 'customer') {
        router.push('/portal');
      } else if (updatedUser?.role === 'technician') {
        router.push('/technician');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập không thành công');
    }
  };

  const handleQuickDemoLogin = async (acc: { email: string; pass: string; role: string }) => {
    setEmailOrPhone(acc.email);
    setPassword(acc.pass);
    try {
      await login(acc.email, acc.pass);
      toast.success(`Đăng nhập thành công với vai trò ${acc.role}!`);
      const updatedUser = useAuthStore.getState().user;
      if (updatedUser?.role === 'customer') {
        router.push('/portal');
      } else if (updatedUser?.role === 'technician') {
        router.push('/technician');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(450px, 100%), 1fr))',
        background: '#ffffff',
      }}
    >
      {/* ========================================================
          LEFT SIDE: EMERALD / TEAL GRADIENT OVER VEHICLE BANNER
          ======================================================== */}
      <div
        style={{
          position: 'relative',
          background: `linear-gradient(135deg, rgba(0, 191, 165, 0.88) 0%, rgba(13, 148, 136, 0.92) 100%), url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1400&auto=format&fit=crop&q=80') center/cover no-repeat`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          color: '#ffffff',
        }}
      >
        {/* Brand header on top */}
        <div>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
              XTBike<span style={{ color: '#ecfdf5' }}>.VN</span>
            </span>
          </Link>
        </div>

        {/* Hero text matching Image 2 */}
        <div style={{ maxWidth: '480px', margin: '40px 0' }}>
          <h1
            style={{
              fontSize: '40px',
              fontWeight: 900,
              lineHeight: 1.25,
              marginBottom: '20px',
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            Thuê xe dễ dàng
            <br />
            cho mọi hành trình
          </h1>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'rgba(255, 255, 255, 0.92)',
              fontWeight: 400,
            }}
          >
            Đặt xe nhanh chóng, giá minh bạch, đa dạng lựa chọn xe tự lái và có tài xế cho du lịch & công tác.
          </p>
        </div>

        {/* Bottom subtle note */}
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
              © XTBike.VN • Nền tảng thuê xe thông minh Đà Nẵng
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDE: CLEAN WHITE AUTH CARD (MATCHING IMAGE 2)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '38px 36px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
            background: '#ffffff',
          }}
        >
          {/* Header Title */}
          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: '#0f172a',
                marginBottom: '6px',
                letterSpacing: '-0.5px',
              }}
            >
              Chào mừng
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Đăng nhập vào tài khoản của bạn để tiếp tục
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Input 1: Phone or Email */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                required
                placeholder="Số điện thoại hoặc Email"
                className="eightcar-auth-input"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
              />
            </div>

            {/* Input 2: Password with eye icon */}
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mật khẩu"
                className="eightcar-auth-input"
                style={{ paddingRight: '48px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Remember me & Utility links */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '10px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#00bfa5', width: '15px', height: '15px' }}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '24px',
              }}
            >
              <span
                onClick={() => toast('Tính năng đăng nhập qua mã OTP SMS đang hoạt động song song.')}
                style={{ color: '#00bfa5', cursor: 'pointer', fontWeight: 600 }}
              >
                Đăng nhập bằng OTP
              </span>
              <span
                onClick={() => toast('Vui lòng liên hệ Hotline 0905 123 456 để cấp lại mật khẩu tức thì.')}
                style={{ color: '#00bfa5', cursor: 'pointer', fontWeight: 600 }}
              >
                Quên mật khẩu?
              </span>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="eightcar-auth-btn">
              {isLoading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
            </button>
          </form>

          <div style={{ textAlign: 'right', marginTop: '-14px', marginBottom: '20px' }}>
            <Link href="/forgot-password" style={{ color: '#00bfa5', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Quên mật khẩu?
            </Link>
          </div>

          {/* Separator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '26px 0 20px',
              color: '#94a3b8',
              fontSize: '12.5px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ padding: '0 12px' }}>Hoặc đăng nhập với</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Social login buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button
              type="button"
              className="eightcar-social-circle"
              title="Google"
              onClick={() => handleQuickDemoLogin({ email: 'customer@gmail.com', pass: 'Customer@123', role: 'Khách hàng' })}
            >
              <span style={{ color: '#ea4335', fontWeight: 900 }}>G</span>
            </button>
            <button
              type="button"
              className="eightcar-social-circle"
              title="Facebook"
              onClick={() => handleQuickDemoLogin({ email: 'customer@gmail.com', pass: 'Customer@123', role: 'Khách hàng' })}
            >
              <span style={{ color: '#1877f2', fontWeight: 900 }}>f</span>
            </button>
            <button
              type="button"
              className="eightcar-social-circle"
              title="VNeID / Thẻ căn cước"
              onClick={() => handleQuickDemoLogin({ email: 'customer@gmail.com', pass: 'Customer@123', role: 'Khách hàng' })}
            >
              <span style={{ color: '#00bfa5', fontSize: '14px' }}>🆔</span>
            </button>
          </div>

          {/* Quick Demo Test Logins for easy approval testing */}
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '12px', marginBottom: '22px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              ⚡ Tài khoản mẫu để kiểm tra nhanh:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin({ email: 'technician@motobike.vn', pass: 'Tech@123', role: 'Kỹ thuật viên' })}
                style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 800, gridColumn: 'span 2' }}
              >
                🔧 Kỹ thuật viên (Technician Demo)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin({ email: 'owner@motobike.vn', pass: 'Owner@123', role: 'Chủ xe' })}
                style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #fed7aa', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontWeight: 700 }}
              >
                👑 Chủ xe (Owner)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin({ email: 'receptionist@motobike.vn', pass: 'Recep@123', role: 'Lễ tân' })}
                style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontWeight: 700 }}
              >
                👩‍💼 Lễ tân duyệt đơn
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin({ email: 'admin@motobike.vn', pass: 'Admin@123', role: 'Admin' })}
                style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #e9d5ff', background: '#faf5ff', color: '#7e22ce', cursor: 'pointer', fontWeight: 700 }}
              >
                🛡️ Quản trị (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin({ email: 'customer@gmail.com', pass: 'Customer@123', role: 'Khách hàng' })}
                style={{ padding: '6px 8px', fontSize: '11.5px', borderRadius: '6px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', cursor: 'pointer', fontWeight: 700 }}
              >
                🧑‍💻 Khách hàng
              </button>
            </div>
          </div>

          {/* Switch to Register link */}
          <div style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b' }}>
            Chưa có tài khoản?{' '}
            <Link href="/register" style={{ color: '#00bfa5', fontWeight: 700, textDecoration: 'none' }}>
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
