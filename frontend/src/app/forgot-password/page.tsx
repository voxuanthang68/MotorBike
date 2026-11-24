'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [token, setToken] = useState('');
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try { const response = await api.post('/auth/forgot-password', { email }); setToken(response.data.resetToken || ''); setRequested(true); toast.success(response.data.message); }
    catch (error: any) { toast.error(error.response?.data?.message || 'Không thể gửi yêu cầu.'); }
    finally { setLoading(false); }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try { await api.put(`/auth/reset-password/${token}`, { newPassword }); toast.success('Đặt lại mật khẩu thành công.'); window.location.href = '/login'; }
    catch (error: any) { toast.error(error.response?.data?.message || 'Mã đặt lại không hợp lệ.'); }
    finally { setLoading(false); }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', padding: 24 }}>
      <section style={{ width: '100%', maxWidth: 440, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 32 }}>
        <h1 style={{ margin: '0 0 8px', color: '#0f172a' }}>Quên mật khẩu</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Nhập email để nhận mã đặt lại mật khẩu.</p>
        {!requested ? <form onSubmit={requestReset}><input className="eightcar-auth-input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><button className="eightcar-auth-btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</button></form> : token ? <form onSubmit={resetPassword}><input className="eightcar-auth-input" required value={token} onChange={e => setToken(e.target.value)} placeholder="Mã đặt lại mật khẩu" /><input className="eightcar-auth-input" style={{ marginTop: 12 }} type="password" minLength={6} required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" /><button className="eightcar-auth-btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>{loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</button></form> : <p style={{ color: '#64748b', fontSize: 14 }}>Kiểm tra email để tiếp tục đặt lại mật khẩu.</p>}
        <Link href="/login" style={{ display: 'block', marginTop: 20, textAlign: 'center', color: '#00bfa5', textDecoration: 'none' }}>Quay lại đăng nhập</Link>
      </section>
    </main>
  );
}
