'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: string[];
}

// Arranged according to Image 2's workflow while preserving all 14 existing items from Image 1
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['owner', 'admin', 'accountant', 'receptionist'] },
  { href: '/dashboard/today', label: 'Việc hôm nay', icon: '⚡', roles: ['owner', 'admin', 'receptionist', 'support', 'technician', 'accountant'] },
  { href: '/dashboard/contracts', label: 'Quản lý hợp đồng', icon: '📄', roles: ['owner', 'admin', 'receptionist', 'support', 'technician', 'accountant'] },
  { href: '/dashboard/schedule', label: 'Lịch đặt xe', icon: '📅', roles: ['owner', 'admin', 'receptionist', 'support', 'technician', 'accountant'] },
  { href: '/dashboard/vehicles', label: 'Quản lý xe', icon: '🏍️', roles: ['owner', 'admin', 'technician', 'receptionist', 'support', 'accountant'] },
  { href: '/dashboard/bookings', label: 'Quản lý đặt xe', icon: '📋', roles: ['owner', 'admin', 'receptionist', 'support', 'technician', 'accountant'] },
  { href: '/dashboard/customers', label: 'Khách hàng', icon: '👥', roles: ['owner', 'admin', 'receptionist', 'support', 'accountant'] },
  { href: '/dashboard/notifications', label: 'Thông báo', icon: '🔔', roles: ['owner', 'admin', 'receptionist', 'support', 'accountant'] },
  { href: '/dashboard/payments', label: 'Thanh toán', icon: '💰', roles: ['owner', 'admin', 'accountant', 'receptionist'] },
  { href: '/dashboard/maintenance', label: 'Bảo trì & Sửa chữa', icon: '🔧', roles: ['owner', 'admin', 'technician'] },
  { href: '/dashboard/reports', label: 'Báo cáo & Thống kê', icon: '📈', roles: ['owner', 'admin', 'accountant'] },
  { href: '/dashboard/tickets', label: 'Hỗ trợ khách hàng', icon: '🎫', roles: ['owner', 'admin', 'support'] },
  { href: '/dashboard/users', label: 'Nhân viên', icon: '👤', roles: ['owner', 'admin'] },
  { href: '/dashboard/settings', label: 'Cài đặt', icon: '⚙️', roles: ['owner', 'admin'] },
];

const roleLabels: Record<string, string> = {
  owner: 'Chủ cửa hàng',
  admin: 'Admin',
  technician: 'Kỹ thuật viên',
  support: 'Hỗ trợ viên',
  accountant: 'Kế toán',
  receptionist: 'Lễ tân',
  customer: 'Khách hàng',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [permissionMap, setPermissionMap] = useState<Record<string, any>>({});
  const [pendingBookingsCount, setPendingBookingsCount] = useState<number>(0);

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'customer') return;
    api.get('/permissions/me').then(response => setPermissionMap(response.data?.permissions || {})).catch(() => setPermissionMap({}));
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'customer') return;
    api.get('/bookings?status=pending').then(res => {
      const list = res.data?.data || [];
      setPendingBookingsCount(list.length);
    }).catch(() => {});
  }, [user, pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất!');
    router.push('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Vui lòng điền đầy đủ mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setIsChangingPassword(true);
      await api.put('/auth/change-password', { currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userRole = user?.role || 'customer';
  const isOwner = userRole === 'owner';
  const moduleForPath = (href: string) => (href === '/dashboard' || href === '/dashboard/today') ? 'dashboard' : href.replace('/dashboard/', '');

  // For Store Owner: ONLY show the 5 requested items
  const ownerNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Tổng quan & Doanh thu', icon: '📊' },
    { href: '/dashboard/vehicles', label: 'Quản lý xe & Giá thuê', icon: '🏍️' },
    { href: '/dashboard/users', label: 'Quản lý nhân viên', icon: '👥' },
    { href: '/dashboard/payments', label: 'Doanh thu', icon: '💰' },
    { href: '/dashboard/reports', label: 'Báo cáo & Thống kê', icon: '📈' },
  ];

  const filteredItems = isOwner
    ? ownerNavItems
    : navItems.filter(item => {
        if (item.roles && !item.roles.includes(userRole)) return false;
        const permission = permissionMap[moduleForPath(item.href)];
        return !permission || permission.view !== false;
      });

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏍️</div>
          <div>
            <div className="sidebar-logo-text">XTBike</div>
            <div className="sidebar-logo-sub">Hải Châu • Đà Nẵng</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.href === '/dashboard/bookings' && pendingBookingsCount > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      background: '#d97706',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: '9999px',
                    }}
                  >
                    {pendingBookingsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions at Bottom (matching Image 2) */}
        <div className="sidebar-bottom">
          <div>
            <div className="sidebar-user-name">
              {user?.fullName || 'Admin'}
            </div>
            <div className="sidebar-user-role">
              {roleLabels[userRole] || 'Admin'}
            </div>
          </div>

          <button
            type="button"
            className="sidebar-btn-action"
            onClick={() => setShowPasswordModal(true)}
          >
            Đổi mật khẩu
          </button>

          <button
            type="button"
            className="sidebar-btn-action sidebar-btn-logout"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasswordModal(false);
          }}
        >
          <div
            style={{
              background: '#0d1527',
              border: '1px solid #1a2744',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>🔒 Đổi mật khẩu</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    background: '#162238',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    background: '#162238',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #1e293b',
                    background: '#162238',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #233454',
                    background: '#162238',
                    color: '#94a3b8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13.5px',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    opacity: isChangingPassword ? 0.7 : 1,
                  }}
                >
                  {isChangingPassword ? 'Đang cập nhật...' : 'Xác nhận đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
