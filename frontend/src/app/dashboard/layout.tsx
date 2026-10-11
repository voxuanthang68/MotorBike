'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role === 'customer') {
      router.push('/portal');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user || user.role === 'customer') {
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
        {children}
      </main>
    </div>
  );
}
