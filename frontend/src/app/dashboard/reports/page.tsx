'use client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const TYPE_META: Record<string, { label: string; color: string }> = {
  scooter: { label: 'Xe tay ga (Scooter)', color: '#f97316' },
  manual: { label: 'Xe số (Manual)', color: '#3b82f6' },
  'semi-automatic': { label: 'Xe bán tự động', color: '#06b6d4' },
  clutch: { label: 'Xe côn tay (Clutch)', color: '#10b981' },
  sport: { label: 'Xe thể thao / PKL', color: '#8b5cf6' },
  electric: { label: 'Xe điện', color: '#14b8a6' },
};

export default function ReportsPage() {
  const { data: dashData } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data?.data || null,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['reports-payments'],
    queryFn: async () => {
      try {
        const res = await api.get('/payments?limit=200');
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
  });

  const { data: maintData } = useQuery({
    queryKey: ['reports-maintenance'],
    queryFn: async () => {
      try {
        const res = await api.get('/maintenance?limit=200');
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['reports-vehicles'],
    queryFn: async () => {
      try {
        const res = await api.get('/vehicles?limit=100');
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['reports-bookings'],
    queryFn: async () => {
      try {
        const res = await api.get('/bookings?limit=200');
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
  });

  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const maints = Array.isArray(maintData) ? maintData : [];
  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : [];
  const bookings = Array.isArray(bookingsData) ? bookingsData : [];

  const totalRevenue = useMemo(() => {
    const payRev = payments
      .filter((p: any) => p.status === 'completed' && p.type !== 'refund')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    if (payRev > 0) return payRev;
    return bookings
      .filter((b: any) => ['active', 'completed'].includes(b.status))
      .reduce((sum: number, b: any) => sum + Number(b.finalPrice || b.totalPrice || 0), 0);
  }, [payments, bookings]);

  const totalCost = useMemo(() => {
    return maints
      .filter((m: any) => m.status === 'completed')
      .reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0);
  }, [maints]);

  const netProfit = totalRevenue - totalCost;
  const profitRate = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;
  const utilizationRate = dashData?.utilizationRate ?? (
    vehicles.length > 0
      ? Math.round((vehicles.filter((v: any) => v.status === 'rented').length / vehicles.length) * 100)
      : 0
  );

  const monthlySeries = useMemo(() => {
    const buckets: Record<string, { month: string; revenue: number; cost: number; profit: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets[key] = { month: `T${d.getMonth() + 1}/${d.getFullYear()}`, revenue: 0, cost: 0, profit: 0 };
    }

    const completedPayments = payments.filter((p: any) => p.status === 'completed' && p.type !== 'refund');
    if (completedPayments.length > 0) {
      for (const p of completedPayments) {
        const dt = p.transactionDate || p.createdAt;
        if (!dt) continue;
        const d = new Date(dt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (buckets[key]) buckets[key].revenue += Number(p.amount || 0);
      }
    } else {
      for (const b of bookings) {
        if (!['active', 'completed'].includes(b.status)) continue;
        const dt = b.startDate || b.createdAt;
        if (!dt) continue;
        const d = new Date(dt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (buckets[key]) buckets[key].revenue += Number(b.finalPrice || b.totalPrice || 0);
      }
    }

    for (const m of maints) {
      if (m.status !== 'completed') continue;
      const dt = m.completedDate || m.scheduledDate || m.createdAt;
      if (!dt) continue;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets[key]) buckets[key].cost += Number(m.cost || 0);
    }

    return Object.values(buckets).map(item => ({
      ...item,
      profit: item.revenue - item.cost,
    }));
  }, [payments, bookings, maints]);

  const fleetDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      const k = v.type || 'scooter';
      counts[k] = (counts[k] || 0) + 1;
    }
    const total = vehicles.length || 1;
    return Object.entries(counts).map(([k, count]) => ({
      name: TYPE_META[k]?.label || k,
      value: Math.round((count / total) * 100),
      count,
      color: TYPE_META[k]?.color || '#64748b',
    }));
  }, [vehicles]);

  const topBikes = useMemo(() => {
    const stats = new Map<string, { name: string; licensePlate: string; rentals: number; revenue: number }>();
    const activeVehIds = new Set(vehicles.map((v: any) => String(v._id)));
    for (const b of bookings) {
      if (b.status === 'cancelled' || !b.vehicle) continue;
      const vid = String(b.vehicle._id || b.vehicle);
      if (activeVehIds.size > 0 && !activeVehIds.has(vid)) continue;
      const prev = stats.get(vid) || {
        name: b.vehicle.name || 'Xe máy',
        licensePlate: b.vehicle.licensePlate || '---',
        rentals: 0,
        revenue: 0,
      };
      prev.rentals += 1;
      prev.revenue += Number(b.finalPrice || b.totalPrice || 0);
      stats.set(vid, prev);
    }
    return Array.from(stats.values())
      .sort((a, b) => b.revenue - a.revenue || b.rentals - a.rentals)
      .slice(0, 5);
  }, [bookings, vehicles]);

  const handleExportCSV = () => {
    const headers = 'Tháng,Doanh thu (VNĐ),Chi phí bảo trì (VNĐ),Lợi nhuận ròng (VNĐ)\n';
    const rows = monthlySeries.map(m => `${m.month},${m.revenue},${m.cost},${m.profit}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Bao_cao_doanh_thu_XTBike.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Báo Cáo & Phân Tích Doanh Thu Toàn Diện</h1>
          <p className="page-subtitle">Thống kê thực tế doanh thu, chi phí bảo trì và hiệu suất khai thác đội xe</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            🖨️ In Báo Cáo
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            📥 Xuất File Excel (CSV)
          </button>
        </div>
      </div>

      {/* KPI Highlights (100% Real Data) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DOANH THU GHI NHẬN</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Từ giao dịch & đơn thuê thực tế
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LỢI NHUẬN RÒNG</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>
            {netProfit.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Tỷ suất lợi nhuận {profitRate}%
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TỶ LỆ KHAI THÁC ĐỘI XE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>
            {utilizationRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Đội xe hoạt động: {vehicles.length} xe
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CHI PHÍ BẢO TRÌ ĐÃ HOÀN TẤT</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-yellow)', marginTop: '4px' }}>
            {totalCost.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Dữ liệu phiếu bảo trì hoàn tất
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Biểu Đồ Doanh Thu & Lợi Nhuận (VNĐ)</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Dữ liệu 6 tháng gần nhất theo giao dịch thực tế</div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => v >= 1000000 ? `${Math.round(v / 1000000)}tr` : `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                  formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} đ`]}
                />
                <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#f97316" fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#10b981" fillOpacity={1} fill="url(#colorProf)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Cơ Cấu Đội Xe Đang Hoạt Động</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Phân bổ thực tế theo loại xe hiện có</div>

          <div style={{ height: '300px', width: '100%' }}>
            {fleetDistribution.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Chưa có xe nào trong đội xe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fleetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                    formatter={(val: any, _name: any, item: any) => [`${item?.payload?.count || 0} xe (${val}%)`]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Rented Motorbikes Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>🏆 Top Dòng Xe Mang Lại Doanh Thu (Đội xe hiện có)</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Xếp hạng theo số lượt thuê và doanh thu thực tế</div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '64px', textAlign: 'center' }}>STT</th>
              <th>Dòng Xe & Biển Số</th>
              <th>Số Lượt Thuê</th>
              <th>Doanh Thu Đạt Được</th>
            </tr>
          </thead>
          <tbody>
            {topBikes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                  Chưa có dữ liệu đơn thuê nào cho đội xe hiện tại.
                </td>
              </tr>
            ) : topBikes.map((bike, idx) => (
              <tr key={`${bike.licensePlate}-${idx}`}>
                <td>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#e2e8f0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: idx < 3 ? 'white' : '#475569',
                      fontSize: '12px'
                    }}
                  >
                    #{idx + 1}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bike.name}</span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>({bike.licensePlate})</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{bike.rentals} lượt</span>
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{bike.revenue.toLocaleString('vi-VN')} đ</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
