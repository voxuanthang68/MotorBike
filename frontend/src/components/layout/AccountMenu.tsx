'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Home, LogOut, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const userRole = user?.role || 'customer';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
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
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className={`account-menu-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen(value => !value)}
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
