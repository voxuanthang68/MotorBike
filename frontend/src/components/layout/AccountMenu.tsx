'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, Home, LogOut, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const roleLabels: Record<string, string> = {
  owner: 'Chủ cửa hàng',
  admin: 'Quản trị viên',
  technician: 'Kỹ thuật viên',
  support: 'Hỗ trợ viên',
  accountant: 'Kế toán',
  receptionist: 'Lễ tân',
  customer: 'Khách hàng',
};

const roleColors: Record<string, string> = {
  owner: '#f97316',
  admin: '#8b5cf6',
  technician: '#06b6d4',
  support: '#10b981',
  accountant: '#f59e0b',
  receptionist: '#3b82f6',
  customer: '#94a3b8',
};

export default function AccountMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const userRole = user?.role || 'customer';

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setNotifs(list);
      setUnreadCount(res.data?.unreadCount ?? list.filter((n: any) => !n.isRead).length);
    } catch {
      // Ignore transient errors
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 25000);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất!');
    router.push('/login');
  };

  return (
    <div className="account-menu" ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="account-menu-trigger"
          style={{ padding: '0', width: '40px', justifyContent: 'center', position: 'relative' }}
          onClick={() => {
            setOpen(false);
            const next = !notifOpen;
            setNotifOpen(next);
            if (next) fetchNotifications();
          }}
          aria-expanded={notifOpen}
          aria-label="Mở thông báo"
        >
          <Bell size={18} color={notifOpen ? '#2563eb' : '#475569'} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '999px',
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="account-menu-panel" style={{ width: '340px', right: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Thông báo ({unreadCount} mới)</strong>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    setNotifs(prev => prev.map(x => ({ ...x, isRead: true })));
                    setUnreadCount(0);
                    try { await api.put('/notifications/read-all'); } catch {}
                  }}
                  style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Đọc tất cả
                </button>
              )}
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px 0' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                  Hiện chưa có thông báo nào.
                </div>
              ) : notifs.slice(0, 8).map((n: any) => (
                <div
                  key={n._id}
                  onClick={async () => {
                    setNotifs(prev => prev.map(x => (x._id === n._id ? { ...x, isRead: true } : x)));
                    if (!n.isRead) setUnreadCount(c => Math.max(0, c - 1));
                    try { await api.put(`/notifications/${n._id}/read`); } catch {}
                    setNotifOpen(false);
                    router.push(n.link || (userRole === 'technician' ? '/technician' : '/dashboard/notifications'));
                  }}
                  style={{
                    padding: '9px 11px',
                    borderRadius: '8px',
                    background: n.isRead ? '#f8fafc' : '#eff6ff',
                    border: n.isRead ? '1px solid #f1f5f9' : '1px solid #bfdbfe',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: n.isRead ? 600 : 800, color: '#0f172a' }}>{n.title}</div>
                  {n.message && <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>{n.message}</div>}
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={userRole === 'technician' ? '/technician' : '/dashboard/notifications'}
              onClick={() => setNotifOpen(false)}
              style={{ display: 'block', textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
            >
              Xem tất cả thông báo →
            </Link>
          </div>
        )}
      </div>

      <button
        type="button"
        className={`account-menu-trigger ${open ? 'active' : ''}`}
        onClick={() => {
          setNotifOpen(false);
          setOpen(value => !value);
        }}
        aria-expanded={open}
        aria-label="Mở thông tin tài khoản"
      >
        <span className="account-menu-avatar" style={{ background: `linear-gradient(135deg, ${roleColors[userRole] || '#f97316'}, ${roleColors[userRole] || '#f97316'}88)` }}>
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </span>
        <span className="account-menu-name">{user?.fullName || 'Người dùng'}</span>
        <ChevronDown size={16} strokeWidth={2.4} />
      </button>

      {open && (
        <div className="account-menu-panel">
          <div className="account-menu-heading">
            <div className="account-menu-avatar large" style={{ background: `linear-gradient(135deg, ${roleColors[userRole] || '#f97316'}, ${roleColors[userRole] || '#f97316'}88)` }}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="account-menu-title">{user?.fullName || 'Người dùng'}</div>
              <div className="account-menu-email">{user?.email || 'Chưa có email'}</div>
            </div>
          </div>

          <div className="account-menu-role" style={{ color: roleColors[userRole] || 'var(--text-secondary)' }}>
            <UserRound size={15} />
            <span>{roleLabels[userRole] || userRole}</span>
          </div>

          <div className="account-menu-actions">
            <Link href="/" className="account-menu-action" onClick={() => setOpen(false)}>
              <Home size={16} />
              <span>Trang chủ</span>
            </Link>
            <button type="button" className="account-menu-action danger" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Đổi tài khoản</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
