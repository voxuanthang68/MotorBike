'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';
import AccountMenu from '@/components/layout/AccountMenu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, initialize } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initialize().finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (authReady && !isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role === 'customer') {
      router.push('/portal');
    }
  }, [authReady, isAuthenticated, isLoading, user, router]);

  if (!authReady || isLoading || !isAuthenticated || !user || user.role === 'customer') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px', borderWidth: '3px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-brand">
            <span className="dashboard-topbar-dot" />
            <span>XTBike Hải Châu • Điều hành cho thuê xe</span>
          </div>
          <AccountMenu />
        </header>
        {children}
      </main>
    </div>
  );
}
