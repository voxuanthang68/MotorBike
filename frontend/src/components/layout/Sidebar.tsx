'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles?: string[];
}

const navItems: { section: string; items: NavItem[] }[] = [
  {
    section: 'Tổng quan',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['owner', 'admin', 'accountant', 'receptionist'] },
    ]
  },
  {
    section: 'Quản lý',
    items: [
      { href: '/dashboard/vehicles', label: 'Quản lý xe', icon: '🏍️', roles: ['owner', 'admin', 'technician', 'receptionist'] },
      { href: '/dashboard/bookings', label: 'Đặt xe & Thuê xe', icon: '📅', roles: ['owner', 'admin', 'receptionist', 'support'] },
      { href: '/dashboard/contracts', label: 'Hợp đồng', icon: '📄', roles: ['owner', 'admin', 'receptionist'] },
      { href: '/dashboard/customers', label: 'Khách hàng', icon: '👥', roles: ['owner', 'admin', 'receptionist', 'support'] },
    ]
  },
  {
    section: 'Kỹ thuật',
    items: [
      { href: '/dashboard/maintenance', label: 'Bảo trì & Sửa chữa', icon: '🔧', roles: ['owner', 'admin', 'technician'] },
    ]
  },
  {
    section: 'Tài chính',
    items: [
      { href: '/dashboard/payments', label: 'Thanh toán', icon: '💰', roles: ['owner', 'admin', 'accountant', 'receptionist'] },
      { href: '/dashboard/reports', label: 'Báo cáo & Thống kê', icon: '📈', roles: ['owner', 'admin', 'accountant'] },
    ]
  },
  {
    section: 'Hỗ trợ',
    items: [
      { href: '/dashboard/tickets', label: 'Hỗ trợ khách hàng', icon: '🎫', roles: ['owner', 'admin', 'support'] },
    ]
  },
  {
    section: 'Hệ thống',
    items: [
      { href: '/dashboard/users', label: 'Nhân viên', icon: '👤', roles: ['owner', 'admin'] },
      { href: '/dashboard/settings', label: 'Cài đặt', icon: '⚙️', roles: ['owner', 'admin'] },
    ]
  },
];

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Đã đăng xuất!');
    router.push('/login');
  };

  const userRole = user?.role || 'customer';
  const filteredSections = navItems.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || item.roles.includes(userRole))
  })).filter(section => section.items.length > 0);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏍️</div>
        <div>
          <div className="sidebar-logo-text">MotoBike</div>
          <div className="sidebar-logo-sub">Hải Châu • Đà Nẵng</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredSections.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="sidebar-user">
        <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${roleColors[userRole] || '#f97316'}, ${roleColors[userRole] || '#f97316'}88)` }}>
          {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.fullName || 'Người dùng'}
          </div>
          <div style={{ fontSize: '11px', color: roleColors[userRole] || 'var(--text-secondary)', fontWeight: 500 }}>
            {roleLabels[userRole] || userRole}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
            fontSize: '18px', padding: '4px',
            borderRadius: '6px', transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
        >
          🚪
        </button>
      </div>
    </aside>
  );
}
