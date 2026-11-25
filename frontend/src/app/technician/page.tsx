'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  Wrench,
  Bike,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  Headphones,
  Settings,
  Search,
  Bell,
  Sun,
  LogOut,
  ChevronRight,
  Eye,
  Check,
  Menu,
  ChevronDown,
  HelpCircle,
  Play
} from 'lucide-react';

interface MaintenanceScheduleItem {
  id: string;
  time: string;
  bikeName: string;
  image: string;
  type: string;
  status: 'in_progress' | 'pending' | 'scheduled';
  statusText: string;
}

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeMenu, setActiveMenu] = useState('home');
  const [activeSubMenu, setActiveSubMenu] = useState('schedule');
  const [expandedMenu, setExpandedMenu] = useState<string | null>('maintenance');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [taskProgress, setTaskProgress] = useState(70);
  const [taskCompleted, setTaskCompleted] = useState(false);

  // Sample schedule items exactly matching reference image
  const [schedules, setSchedules] = useState<MaintenanceScheduleItem[]>([
    {
      id: '1',
      time: '24/04/2026',
      bikeName: 'Honda SH 160i',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=80',
      type: 'Bảo dưỡng định kỳ (5.000km)',
      status: 'in_progress',
      statusText: 'Đang thực hiện'
    },
    {
      id: '2',
      time: '25/04/2026',
      bikeName: 'Yamaha Exciter 155',
      image: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=200&auto=format&fit=crop&q=80',
      type: 'Kiểm tra tổng quát',
      status: 'pending',
      statusText: 'Chờ thực hiện'
    },
    {
      id: '3',
      time: '26/04/2026',
      bikeName: 'Honda CBR150R',
      image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&auto=format&fit=crop&q=80',
      type: 'Thay dầu nhớt',
      status: 'scheduled',
      statusText: 'Đã lên lịch'
    },
    {
      id: '4',
      time: '27/04/2026',
      bikeName: 'Suzuki Raider',
      image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=200&auto=format&fit=crop&q=80',
      type: 'Kiểm tra phanh, lốp',
      status: 'scheduled',
      statusText: 'Đã lên lịch'
    }
  ]);

  const toggleSubmenu = (menu: string) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const handleCompleteCurrentTask = () => {
    setTaskProgress(100);
    setTaskCompleted(true);
    toast.success('Đã hoàn thành công việc kiểm tra & thay nhớt Yamaha Exciter 155!');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fb', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* ========================================================
          1. LEFT SIDEBAR (Dark Navy Slate)
          ======================================================== */}
      <aside
        style={{
          width: sidebarOpen ? '250px' : '70px',
          background: '#0d1527',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s ease',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          flexShrink: 0
        }}
      >
        <div>
          {/* Logo Brand */}
          <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
              <Bike size={22} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  XTMotoBike
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                  Thuê xe Đà Nẵng
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            
            {/* Trang chủ */}
            <button
              type="button"
              onClick={() => setActiveMenu('home')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeMenu === 'home' ? '#2563eb' : 'transparent',
                color: activeMenu === 'home' ? '#ffffff' : '#94a3b8',
                fontWeight: activeMenu === 'home' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Bike size={18} />
              {sidebarOpen && <span>Trang chủ</span>}
            </button>

            {/* Xe của tôi */}
            <button
              type="button"
              onClick={() => setActiveMenu('my_bikes')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeMenu === 'my_bikes' ? '#2563eb' : 'transparent',
                color: activeMenu === 'my_bikes' ? '#ffffff' : '#94a3b8',
                fontWeight: activeMenu === 'my_bikes' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Bike size={18} />
              {sidebarOpen && <span>Xe của tôi</span>}
            </button>

            {/* Bảo dưỡng (Dropdown) */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu('maintenance')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: expandedMenu === 'maintenance' ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Wrench size={18} />
                  {sidebarOpen && <span>Bảo dưỡng</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown
                    size={14}
                    style={{
                      transform: expandedMenu === 'maintenance' ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s'
                    }}
                  />
                )}
              </button>

              {expandedMenu === 'maintenance' && sidebarOpen && (
                <div style={{ paddingLeft: '34px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSubMenu('schedule')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeSubMenu === 'schedule' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                      color: activeSubMenu === 'schedule' ? '#60a5fa' : '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: activeSubMenu === 'schedule' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Calendar size={14} />
                    <span>Lịch bảo dưỡng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubMenu('history')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeSubMenu === 'history' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                      color: activeSubMenu === 'history' ? '#60a5fa' : '#94a3b8',
                      fontSize: '12.5px',
                      fontWeight: activeSubMenu === 'history' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <History size={14} />
                    <span>Lịch sử bảo dưỡng</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sửa chữa */}
            <button
              type="button"
              onClick={() => setActiveMenu('repairs')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeMenu === 'repairs' ? '#2563eb' : 'transparent',
                color: activeMenu === 'repairs' ? '#ffffff' : '#94a3b8',
                fontWeight: activeMenu === 'repairs' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Wrench size={18} />
              {sidebarOpen && <span>Sửa chữa</span>}
            </button>

            {/* Báo cáo */}
            <button
              type="button"
              onClick={() => setActiveMenu('reports')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeMenu === 'reports' ? '#2563eb' : 'transparent',
                color: activeMenu === 'reports' ? '#ffffff' : '#94a3b8',
                fontWeight: activeMenu === 'reports' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <FileText size={18} />
              {sidebarOpen && <span>Báo cáo</span>}
            </button>

            {/* Hỗ trợ */}
            <button
              type="button"
              onClick={() => setActiveMenu('support')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeMenu === 'support' ? '#2563eb' : 'transparent',
                color: activeMenu === 'support' ? '#ffffff' : '#94a3b8',
                fontWeight: activeMenu === 'support' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Headphones size={18} />
              {sidebarOpen && <span>Hỗ trợ</span>}
            </button>

            {/* Cài đặt */}
            <button
              type="button"
              onClick={() => setActiveMenu('settings')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: activeMenu === 'settings' ? '#2563eb' : 'transparent',
                color: activeMenu === 'settings' ? '#ffffff' : '#94a3b8',
                fontWeight: activeMenu === 'settings' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Settings size={18} />
              {sidebarOpen && <span>Cài đặt</span>}
            </button>
          </nav>
        </div>

        {/* Bottom User info & Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1e293b', border: '2px solid #3b82f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800 }}>
              NV
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {user?.fullName || 'Nguyễn Văn Minh'}
                </div>
                <div style={{ fontSize: '11px', color: '#60a5fa' }}>
                  Kỹ thuật viên
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <LogOut size={14} />
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Header Navbar */}
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40
          }}
        >
          {/* Left search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={20} />
            </button>

            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm kiếm xe, mã sửa chữa..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Right quick tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Bell size={17} color="#475569" />
              <span style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', color: '#ffffff', fontSize: '9.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                2
              </span>
            </button>

            <button
              type="button"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Sun size={17} color="#475569" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px' }}>
                M
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {user?.fullName || 'Nguyễn Văn Minh'}
              </div>
              <ChevronDown size={14} color="#64748b" />
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main style={{ padding: '24px 28px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          
          {/* Page Greeting & Date Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
                <Wrench size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  Trang chủ Kỹ thuật viên
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Theo dõi công việc bảo dưỡng, sửa chữa xe trong hệ thống
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700 }}>
              <Calendar size={16} />
              <span>Thứ Tư, 25/11/2026</span>
            </div>
          </div>

          {/* 4 Stat Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px', marginBottom: '24px' }}>
            
            {/* Stat 1: Xe cần bảo dưỡng */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bike size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>12</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Xe cần bảo dưỡng</div>
                </div>
              </div>
              <button type="button" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>

            {/* Stat 2: Xe đang sửa chữa */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>3</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Xe đang sửa chữa</div>
                </div>
              </div>
              <button type="button" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>

            {/* Stat 3: Xe hoạt động tốt */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>18</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Xe hoạt động tốt</div>
                </div>
              </div>
              <button type="button" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>

            {/* Stat 4: Bảo dưỡng quá hạn */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>2</div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Bảo dưỡng quá hạn</div>
                </div>
              </div>
              <button type="button" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={16} color="#64748b" />
              </button>
            </div>
          </div>

          {/* Main 2-Column Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '24px' }}>
            
            {/* Left Box: Lịch bảo dưỡng sắp tới Table */}
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '22px 24px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
                  <Calendar size={18} color="#2563eb" />
                  <span>Lịch bảo dưỡng sắp tới</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Đang hiển thị toàn bộ lịch bảo dưỡng xe')}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Xem tất cả &rarr;
                </button>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: 700 }}>
                      <th style={{ padding: '10px 12px' }}>Thời gian</th>
                      <th style={{ padding: '10px 12px' }}>Xe</th>
                      <th style={{ padding: '10px 12px' }}>Loại bảo dưỡng</th>
                      <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '13px' }}>
                        <td style={{ padding: '12px', color: '#0f172a', fontWeight: 600 }}>{item.time}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '42px', height: '32px', borderRadius: '6px', overflow: 'hidden', background: '#f1f5f9' }}>
                              <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.bikeName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#475569' }}>{item.type}</td>
                        <td style={{ padding: '12px' }}>
                          {item.status === 'in_progress' && (
                            <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                              {item.statusText}
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span style={{ background: '#fff7ed', color: '#ea580c', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                              {item.statusText}
                            </span>
                          )}
                          {item.status === 'scheduled' && (
                            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 }}>
                              {item.statusText}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toast.success(`Chi tiết bảo dưỡng: ${item.bikeName}`)}
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '5px 12px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Donut Status & Promotion Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Card: Trạng thái xe trong kho */}
              <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14.5px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>
                  <Bike size={17} color="#2563eb" />
                  <span>Trạng thái xe trong kho</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  {/* Donut Chart representation */}
                  <div style={{ position: 'relative', width: '110px', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      {/* Background circle */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="4"
                      />
                      {/* Hoạt động tốt (56 xe ~ 72%) */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="4.5"
                        strokeDasharray="72, 100"
                      />
                      {/* Đang sửa chữa (8 xe) */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="4.5"
                        strokeDasharray="10, 100"
                        strokeDashoffset="-72"
                      />
                      {/* Bảo dưỡng (12 xe) */}
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="4.5"
                        strokeDasharray="15, 100"
                        strokeDashoffset="-82"
                      />
                    </svg>
                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>78</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>Tổng xe</div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ color: '#475569' }}>Hoạt động tốt</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>56</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                        <span style={{ color: '#475569' }}>Đang sửa chữa</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>8</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                        <span style={{ color: '#475569' }}>Bảo dưỡng</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>12</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                        <span style={{ color: '#475569' }}>Không hoạt động</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>2</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Banner: Kiểm tra xe định kỳ */}
              <div
                style={{
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
                  padding: '20px',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)'
                }}
              >
                <div style={{ position: 'relative', zIndex: 1, maxWidth: '200px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                    Kiểm tra xe định kỳ
                  </h3>
                  <p style={{ fontSize: '12px', margin: '0 0 14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                    Đảm bảo an toàn cho mọi hành trình!
                  </p>
                  <button
                    type="button"
                    onClick={() => toast.success('Xem cẩm nang bảo trì tiêu chuẩn XTMotoBike')}
                    style={{
                      background: '#ffffff',
                      color: '#1d4ed8',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Xem hướng dẫn &rarr;
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom 2 Boxes: Công việc hiện tại & Thông báo mới nhất */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            
            {/* Box 1: Công việc hiện tại */}
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '22px 24px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Công việc hiện tại</span>
                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                  1 công việc
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                {/* Bike Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '70px', height: '52px', borderRadius: '8px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <img
                      src="https://images.unsplash.com/photo-1558980664-769d59546b3d?w=200&auto=format&fit=crop&q=80"
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Yamaha Exciter 155</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Mã xe: EX155-001</div>
                  </div>
                </div>

                {/* Job Description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '240px' }}>
                  <Wrench size={18} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Công việc:</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                      Kiểm tra hệ thống phanh và thay dầu nhớt
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ minWidth: '160px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Tiến độ</span>
                    <span style={{ color: '#2563eb' }}>{taskProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ width: `${taskProgress}%`, height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={handleCompleteCurrentTask}
                  disabled={taskCompleted}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: taskCompleted ? '#16a34a' : '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: taskCompleted ? 'default' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Check size={16} />
                  <span>{taskCompleted ? 'Đã hoàn thành' : 'Hoàn thành'}</span>
                </button>
              </div>
            </div>

            {/* Box 2: Thông báo mới nhất */}
            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                  <Bell size={16} color="#2563eb" />
                  <span>Thông báo mới nhất</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Đã tải tất cả thông báo kỹ thuật')}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Xem tất cả &rarr;
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>Đơn thuê #DH028 vừa được trả xe</span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', flexShrink: 0 }}>10:30</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c', flexShrink: 0 }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>Xe Honda CBR150R cần bảo dưỡng gấp</span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', flexShrink: 0 }}>09:15</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>Lịch bảo dưỡng đã được cập nhật</span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', flexShrink: 0 }}>08:20</span>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
