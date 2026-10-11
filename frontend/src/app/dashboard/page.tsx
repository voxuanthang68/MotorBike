'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const vehicleStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: 'Sẵn sàng', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    rented: { label: 'Đang thuê', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    maintenance: { label: 'Bảo trì', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    broken: { label: 'Hỏng', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    retired: { label: 'Ngừng hoạt động', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  };

  const statCards = [
    {
      title: 'Xe đang thuê',
      value: dashData?.activeRentals || 0,
      icon: '🏍️',
      color: '#3b82f6',
      change: '+2 hôm nay',
    },
    {
      title: 'Doanh thu hôm nay',
      value: formatCurrency(dashData?.todayRevenue || 0),
      icon: '💰',
      color: '#10b981',
      change: `Tháng này: ${formatCurrency(dashData?.monthRevenue || 0)}`,
    },
    {
      title: 'Đặt xe mới hôm nay',
      value: dashData?.todayBookings || 0,
      icon: '📅',
      color: '#f97316',
      change: 'Yêu cầu mới',
    },
    {
      title: 'Khách hàng mới (tháng)',
      value: dashData?.newCustomers || 0,
      icon: '👥',
      color: '#8b5cf6',
      change: `Tổng: ${dashData?.totalCustomers || 0}`,
    },
  ];

  const chartData = dashData?.monthlyChart?.map((item: any) => ({
    month: MONTHS[(item._id.month || 1) - 1],
    revenue: item.revenue,
    bookings: item.count,
  })) || [];

  const vehiclePieData = dashData?.vehicleStats?.map((s: any) => ({
    name: vehicleStatusMap[s._id]?.label || s._id,
    value: s.count,
    color: vehicleStatusMap[s._id]?.color || '#94a3b8',
  })) || [];

  if (isLoading) {
    return (
      <div className="page-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '16px' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Xin chào, {user?.fullName?.split(' ').slice(-1)[0]} 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/bookings/new" className="btn btn-primary">
          + Đặt xe mới
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px', borderRadius: '50%',
              background: card.color, opacity: 0.08,
            }} />
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: card.color, marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{card.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.change}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Revenue Chart */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>📈 Doanh thu 6 tháng gần nhất</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                labelStyle={{ color: '#f8fafc' }}
                formatter={(v: any) => [formatCurrency(v), 'Doanh thu']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle Status Pie */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>🏍️ Trạng thái xe</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={vehiclePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                {vehiclePieData.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {vehiclePieData.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent Bookings */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>📅 Đặt xe gần đây</h3>
            <Link href="/dashboard/bookings" style={{ fontSize: '12px', color: 'var(--brand-primary)', textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dashData?.recentBookings?.length > 0 ? dashData.recentBookings.map((b: any) => (
              <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
                  {b.customer?.fullName?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.customer?.fullName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.vehicle?.name}</div>
                </div>
                <span className={`badge badge-${b.status}`}>{b.status}</span>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                <div className="empty-state-icon">📭</div>
                <div style={{ fontSize: '13px' }}>Chưa có đặt xe nào</div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Returns */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>⏰ Trả xe sắp đến hạn (24h)</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {dashData?.upcomingReturns?.length || 0} xe
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dashData?.upcomingReturns?.length > 0 ? dashData.upcomingReturns.map((b: any) => (
              <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{b.vehicle?.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {b.customer?.fullName} • Hạn: {new Date(b.endDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                <div className="empty-state-icon">✅</div>
                <div style={{ fontSize: '13px' }}>Không có xe nào sắp trả</div>
              </div>
            )}
          </div>

          {/* Maintenance alert */}
          {dashData?.pendingMaintenance > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                🔧 {dashData.pendingMaintenance} xe cần bảo trì
              </div>
              <Link href="/dashboard/maintenance" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Xem chi tiết →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
