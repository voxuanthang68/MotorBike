'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import TodayTasks from '@/components/dashboard/TodayTasks';
import OwnerVehiclesManager from '@/components/dashboard/OwnerVehiclesManager';
import OwnerStaffManager from '@/components/dashboard/OwnerStaffManager';

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const isReceptionistOrStaff = ['receptionist', 'technician', 'support', 'driver'].includes(user?.role || '');
  
  const [viewTab, setViewTab] = useState<'today' | 'overview' | 'vehicles' | 'staff'>(
    isOwner ? 'overview' : 'today'
  );
  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data?.data;
    },
    refetchInterval: 30000,
  });

  const { data: pendingBookingsData } = useQuery({
    queryKey: ['dashboard-pending-bookings'],
    queryFn: async () => {
      try {
        const res = await api.get('/bookings?status=pending');
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  const totalVehicles = dashData?.totalVehicles ?? dashData?.operationsScope?.totalVehicles ?? 0;
  const rentedVehicles = dashData?.rentedVehicles ?? dashData?.activeRentals ?? 0;
  const utilizationRate = dashData?.utilizationRate ?? (totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0);

  const activeContracts = dashData?.activeContracts ?? 0;
  const pendingBookings = dashData?.pendingBookings ?? dashData?.todayBookings ?? 0;

  const monthRevenue = dashData?.monthRevenue ?? 0;
  const completedContractsThisMonth = dashData?.completedContractsThisMonth ?? dashData?.operationsScope?.completedContractsThisMonth ?? 0;

  const debtAmount = dashData?.debtAmount ?? 0;
  const monthExpenses = dashData?.monthExpenses ?? 0;
  const monthProfit = dashData?.monthProfit ?? 0;
  const profitMargin = dashData?.profitMargin ?? 0;

  const fleetStatus = dashData?.fleetStatus || {
    available: { count: 0, percentage: 0 },
    rented: { count: 0, percentage: 0 },
    maintenance: { count: 0, percentage: 0 },
    retired: { count: 0, percentage: 0 },
  };

  const operationsScope = dashData?.operationsScope || {
    totalVehicles: totalVehicles,
    totalCustomers: dashData?.totalCustomers ?? 0,
    totalDrivers: 0,
    completedContractsThisMonth: completedContractsThisMonth,
  };

  const alerts = Array.isArray(dashData?.alerts) ? dashData.alerts : [];

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      
      {/* 1. Header with Tab Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>
              {viewTab === 'overview'
                ? isOwner
                  ? '👑 Trang Chủ Cửa Hàng - Tổng Quan & Doanh Thu'
                  : '📊 Tổng Quan Kinh Doanh'
                : viewTab === 'vehicles'
                ? '🏍️ Quản Lý Đội Xe & Thiết Lập Giá Thuê'
                : viewTab === 'staff'
                ? '👥 Quản Lý Nhân Sự Cửa Hàng'
                : '⚡ Việc Hôm Nay'}
            </span>
            {isOwner && (
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#f97316',
                  background: '#fff7ed',
                  border: '1px solid #ffedd5',
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                Chủ Cửa Hàng
              </span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {viewTab === 'overview'
              ? 'Theo dõi chỉ số kinh doanh, doanh thu độc quyền cho Chủ cửa hàng và hiệu suất đội xe'
              : viewTab === 'vehicles'
              ? 'Thêm, sửa, xóa xe, điều chỉnh giá thuê theo ngày / theo giờ và quản lý kho xe'
              : viewTab === 'staff'
              ? 'Thêm, sửa, xóa nhân viên, phân quyền lễ tân, kỹ thuật, kế toán và hỗ trợ'
              : 'Theo dõi xe cần giao, cần nhận và các lượt quá hạn trả'}
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px', flexWrap: 'wrap' }}>
          {/* Overview Tab */}
          <button
            onClick={() => setViewTab('overview')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: viewTab === 'overview' ? '#ffffff' : 'transparent',
              color: viewTab === 'overview' ? '#0f172a' : '#64748b',
              boxShadow: viewTab === 'overview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📊</span>
            <span>{isOwner ? 'Tổng quan & Doanh thu' : 'Tổng quan'}</span>
          </button>

          {/* Owner Only: Manage Vehicles */}
          {isOwner && (
            <button
              onClick={() => setViewTab('vehicles')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewTab === 'vehicles' ? '#ffffff' : 'transparent',
                color: viewTab === 'vehicles' ? '#0f172a' : '#64748b',
                boxShadow: viewTab === 'vehicles' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🏍️</span>
              <span>Quản lý xe & Giá thuê</span>
            </button>
          )}

          {/* Owner Only: Manage Staff */}
          {isOwner && (
            <button
              onClick={() => setViewTab('staff')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: viewTab === 'staff' ? '#ffffff' : 'transparent',
                color: viewTab === 'staff' ? '#0f172a' : '#64748b',
                boxShadow: viewTab === 'staff' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>👥</span>
              <span>Quản lý nhân viên</span>
            </button>
          )}

          {/* Today Tasks Tab */}
          <button
            onClick={() => setViewTab('today')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: viewTab === 'today' ? '#ffffff' : 'transparent',
              color: viewTab === 'today' ? '#0f172a' : '#64748b',
              boxShadow: viewTab === 'today' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚡</span>
            <span>Việc hôm nay</span>
          </button>
        </div>
      </div>

      {/* Conditionally render Tabs */}
      {viewTab === 'today' ? (
        <TodayTasks />
      ) : viewTab === 'vehicles' ? (
        <OwnerVehiclesManager />
      ) : viewTab === 'staff' ? (
        <OwnerStaffManager />
      ) : (
        <>
      {/* 1.1 Alert: Pending Bookings */}
      {pendingBookingsData && pendingBookingsData.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            fontSize: '13.5px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontSize: '11.5px' }}>
              CHỜ DUYỆT ({pendingBookingsData.length})
            </span>
            <span style={{ color: '#b45309', fontWeight: 600 }}>
              Có {pendingBookingsData.length} đơn đặt xe mới của khách hàng đang chờ duyệt và ký số xác nhận.
            </span>
          </div>
          <Link
            href="/dashboard/bookings"
            style={{
              color: '#ffffff',
              background: '#059669',
              fontWeight: 700,
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12.5px',
              whiteSpace: 'nowrap'
            }}
          >
            Duyệt đơn ngay →
          </Link>
        </div>
      )}

      {/* 2. Alert Banners (only shown when real alerts exist) */}
      {!isLoading && alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              style={{
                background: '#fff1f2',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '13.5px',
                lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 700, color: '#991b1b', marginRight: '6px', whiteSpace: 'nowrap' }}>
                {alert.label}:
              </span>
              <span style={{ color: '#b91c1c' }}>
                {alert.message}
              </span>
              {alert.actionText && (
                <Link
                  href={alert.actionUrl || '/dashboard/contracts'}
                  style={{
                    marginLeft: '8px',
                    color: '#1d4ed8',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {alert.actionText}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Metric Cards — Row 1 (4 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Card 1: Xe đang cho thuê */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '6px',
            borderTop: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            borderLeft: '4px solid #1d4ed8',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '110px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
            XE ĐANG CHO THUÊ
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d4ed8', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
            {rentedVehicles}/{totalVehicles}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Tỷ lệ khai thác {utilizationRate}%
          </div>
        </div>

        {/* Card 2: Hợp đồng hiệu lực */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '6px',
            borderTop: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            borderLeft: '4px solid #1d4ed8',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '110px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
            HỢP ĐỒNG HIỆU LỰC
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
            {activeContracts}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {pendingBookings} đặt trước
          </div>
        </div>

        {/* Card 3: Doanh thu tháng (Chỉ Chủ Cửa Hàng) hoặc Tổng khách hàng */}
        {isOwner ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #1d4ed8',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                DOANH THU THÁNG
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#f97316', background: '#fff7ed', border: '1px solid #ffedd5', padding: '1px 6px', borderRadius: '4px' }}>
                👑 Chỉ Chủ Xem
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d4ed8', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {formatCurrency(monthRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {completedContractsThisMonth} hợp đồng hoàn tất
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #2563eb',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
              TỔNG KHÁCH HÀNG
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {operationsScope.totalCustomers}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Khách hàng hệ thống
            </div>
          </div>
        )}

        {/* Card 4: Công nợ (Chỉ Chủ Cửa Hàng) hoặc Lượt hoàn tất */}
        {isOwner ? (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #dc2626',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                CÔNG NỢ
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                Phải thu
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {formatCurrency(debtAmount)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Khách còn phải trả
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #059669',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
              LƯỢT THUÊ HOÀN TẤT
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {completedContractsThisMonth}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Trong tháng này
            </div>
          </div>
        )}
      </div>

      {/* 4. Financial Metrics (Row 2): ONLY OWNER CAN VIEW */}
      {isOwner ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Card 5: Chi phí tháng */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #d97706',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
              CHI PHÍ THÁNG
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {formatCurrency(monthExpenses)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Bảo dưỡng & phụ tùng
            </div>
          </div>

          {/* Card 6: Lợi nhuận tháng */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #059669',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
              LỢI NHUẬN THÁNG
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {formatCurrency(monthProfit)}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Doanh thu trừ chi phí
            </div>
          </div>

          {/* Card 7: Biên lợi nhuận */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
              borderTop: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              borderBottom: '1px solid #e2e8f0',
              borderLeft: '4px solid #1d4ed8',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '110px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
              BIÊN LỢI NHUẬN
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d4ed8', margin: '6px 0 4px 0', lineHeight: 1.1 }}>
              {profitMargin}%
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Trong tháng này
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '22px' }}>🔒</span>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155' }}>
              Dữ liệu Doanh thu & Lợi nhuận cửa hàng được bảo mật
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Chỉ tài khoản Chủ cửa hàng (Store Owner) mới có quyền truy cập dữ liệu tài chính & doanh thu này.
            </div>
          </div>
        </div>
      )}

      {/* 5. Row 3: Two Big Section Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Left Section: Tình trạng đội xe */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '24px 28px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 24px 0' }}>
            Tình trạng đội xe
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Sẵn sàng */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px' }}>
              <span style={{ width: '130px', color: '#475569', flexShrink: 0 }}>Sẵn sàng</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', margin: '0 16px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${fleetStatus.available.percentage}%`,
                    background: '#10b981',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ width: '90px', textAlign: 'right', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                {fleetStatus.available.count} xe ({fleetStatus.available.percentage}%)
              </span>
            </div>

            {/* Đang thuê */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px' }}>
              <span style={{ width: '130px', color: '#475569', flexShrink: 0 }}>Đang thuê</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', margin: '0 16px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${fleetStatus.rented.percentage}%`,
                    background: '#3b82f6',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ width: '90px', textAlign: 'right', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                {fleetStatus.rented.count} xe ({fleetStatus.rented.percentage}%)
              </span>
            </div>

            {/* Bảo dưỡng */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px' }}>
              <span style={{ width: '130px', color: '#475569', flexShrink: 0 }}>Bảo dưỡng</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', margin: '0 16px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${fleetStatus.maintenance.percentage}%`,
                    background: '#f59e0b',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ width: '90px', textAlign: 'right', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                {fleetStatus.maintenance.count} xe ({fleetStatus.maintenance.percentage}%)
              </span>
            </div>

            {/* Ngừng khai thác */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px' }}>
              <span style={{ width: '130px', color: '#475569', flexShrink: 0 }}>Ngừng khai thác</span>
              <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden', margin: '0 16px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${fleetStatus.retired.percentage}%`,
                    background: '#94a3b8',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{ width: '90px', textAlign: 'right', fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>
                {fleetStatus.retired.count} xe ({fleetStatus.retired.percentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Quy mô hoạt động */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0' }}>
              Quy mô hoạt động
            </h2>

            {/* Sub-boxes grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>Tổng số xe</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{operationsScope.totalVehicles}</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>Khách hàng</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{operationsScope.totalCustomers}</div>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>Tài xế</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{operationsScope.totalDrivers}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '6px', padding: '12px 14px', maxWidth: '180px' }}>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '4px' }}>HĐ hoàn tất tháng này</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{operationsScope.completedContractsThisMonth}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/contracts?create=1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                background: '#2563eb',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              + Tạo hợp đồng
            </Link>

            <Link
              href="/dashboard/schedule"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Xem lịch đặt xe
            </Link>
          </div>
        </div>
      </div>
      </>
      )}

    </div>
  );
}
