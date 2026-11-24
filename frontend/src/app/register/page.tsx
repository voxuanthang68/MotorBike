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
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success('Đăng ký tài khoản thành công!');
      router.push('/portal');
    } catch (error: any) {
      toast.error(error.message || 'Đăng ký không thành công');
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

        {/* Hero text matching Image 1 */}
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
            Bắt đầu hành trình
            <br />
              cùng XTBike
          </h1>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              color: 'rgba(255, 255, 255, 0.92)',
              fontWeight: 400,
            }}
          >
            Tạo tài khoản để đặt xe nhanh chóng, quản lý chuyến đi và nhận nhiều ưu đãi hấp dẫn.
          </p>
        </div>

        {/* Bottom subtle note */}
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
          © XTBike.VN • Nền tảng thuê xe thông minh Đà Nẵng
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDE: CLEAN WHITE AUTH CARD (MATCHING IMAGE 1)
          ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '36px 34px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
            background: '#ffffff',
          }}
        >
          {/* Header Title */}
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 900,
                color: '#0f172a',
                marginBottom: '6px',
                letterSpacing: '-0.5px',
              }}
            >
              Đăng ký
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Tạo tài khoản mới để sử dụng dịch vụ thuê xe
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Input 1: Họ và tên */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Họ và tên *
              </label>
              <input
                type="text"
                required
                placeholder="Họ và tên"
                className="eightcar-auth-input"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            {/* Input 2: Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="Email"
                className="eightcar-auth-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Input 3: Số điện thoại */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                placeholder="Số điện thoại"
                className="eightcar-auth-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Input 4: Mật khẩu */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Mật khẩu *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mật khẩu"
                  className="eightcar-auth-input"
                  style={{ paddingRight: '48px' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    padding: 0,
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Input 5: Nhập lại mật khẩu */}
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Nhập lại mật khẩu *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu"
                  className="eightcar-auth-input"
                  style={{ paddingRight: '48px' }}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    padding: 0,
                  }}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Input 6: Mã giới thiệu (Nếu có) */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Mã giới thiệu (Nếu có)
              </label>
              <input
                type="text"
                placeholder="Mã giới thiệu (Nếu có)"
                className="eightcar-auth-input"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              />
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="eightcar-auth-btn">
              {isLoading ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ'}
            </button>
          </form>

          {/* Switch to Login link */}
          <div style={{ textAlign: 'center', fontSize: '13.5px', color: '#64748b', marginTop: '22px' }}>
            Đã có tài khoản?{' '}
            <Link href="/login" style={{ color: '#00bfa5', fontWeight: 700, textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
