'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const MONTHLY_REVENUE = [
  { month: 'Tháng 1', revenue: 42000000, cost: 8500000, profit: 33500000 },
  { month: 'Tháng 2', revenue: 58000000, cost: 11000000, profit: 47000000 },
  { month: 'Tháng 3', revenue: 64000000, cost: 9200000, profit: 54800000 },
  { month: 'Tháng 4', revenue: 89000000, cost: 14000000, profit: 75000000 },
  { month: 'Tháng 5', revenue: 95000000, cost: 15500000, profit: 79500000 },
  { month: 'Tháng 6', revenue: 112000000, cost: 18200000, profit: 93800000 },
  { month: 'Tháng 7', revenue: 125000000, cost: 19500000, profit: 105500000 },
  { month: 'Tháng 8', revenue: 108000000, cost: 16000000, profit: 92000000 },
  { month: 'Tháng 9', revenue: 76000000, cost: 12000000, profit: 64000000 },
  { month: 'Tháng 10', revenue: 84000000, cost: 13500000, profit: 70500000 },
];

const FLEET_DISTRIBUTION = [
  { name: 'Xe tay ga (Vision, AB, Lead)', value: 55, color: '#f97316' },
  { name: 'Xe số (Wave, Sirius)', value: 25, color: '#3b82f6' },
  { name: 'Xe côn tay (Winner X, Exciter)', value: 15, color: '#10b981' },
  { name: 'Phân khối lớn', value: 5, color: '#8b5cf6' },
];

const TOP_BIKES = [
  { name: 'Honda Vision 2024', rentals: 312, revenue: 40560000, rating: '4.9 ⭐' },
  { name: 'Honda Air Blade 125', rentals: 245, revenue: 36750000, rating: '4.8 ⭐' },
  { name: 'Honda Wave Alpha', rentals: 210, revenue: 18900000, rating: '4.7 ⭐' },
  { name: 'Honda SH Mode ABS', rentals: 128, revenue: 28160000, rating: '5.0 ⭐' },
  { name: 'Honda Winner X 150', rentals: 115, revenue: 20700000, rating: '4.8 ⭐' },
];

export default function ReportsPage() {
  const handleExportCSV = () => {
    const headers = 'Tháng,Doanh thu (VNĐ),Chi phí bảo trì (VNĐ),Lợi nhuận ròng (VNĐ)\n';
    const rows = MONTHLY_REVENUE.map(m => `${m.month},${m.revenue},${m.cost},${m.profit}`).join('\n');
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
          <p className="page-subtitle">Thống kê lợi nhuận, chi phí bảo trì xe, tỷ lệ lấp đầy theo mùa vụ du lịch Đà Nẵng</p>
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

      {/* KPI Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>DOANH THU NĂM NAY</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--brand-primary)', marginTop: '4px' }}>853.000.000 đ</div>
          <div style={{ fontSize: '12px', color: 'var(--accent-green)', marginTop: '2px' }}>↑ 28% so với cùng kỳ năm trước</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LỢI NHUẬN RÒNG</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>715.100.000 đ</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Tỷ suất lợi nhuận 83.8%</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>TỶ LỆ LẤP ĐẦY DÀN XE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-blue)', marginTop: '4px' }}>86.4%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Cao điểm mùa hè 98%</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CHI PHÍ BẢO TRÌ & NHỚT</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-yellow)', marginTop: '4px' }}>137.900.000 đ</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Trung bình 16% tổng thu</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Revenue & Profit Area Chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Biểu Đồ Doanh Thu & Lợi Nhuận (VNĐ)</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Dữ liệu 10 tháng gần nhất tại chi nhánh Hải Châu</div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_REVENUE}>
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
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `${v / 1000000}tr`} />
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

        {/* Fleet Distribution Pie */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Cơ Cấu Nhu Cầu Theo Dòng Xe</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Xe ga chiếm ưu thế tuyệt đối với khách du lịch Đà Nẵng</div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={FLEET_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {FLEET_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                  formatter={(val: any) => [`${val}% thị phần`]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Rented Motorbikes Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>🏆 Top 5 Dòng Xe Mang Lại Doanh Thu Cao Nhất</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Xếp hạng theo số lượt thuê và doanh thu mang lại</div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Dòng Xe Mô Tô</th>
              <th>Số Lượt Thuê</th>
              <th>Doanh Thu Đạt Được</th>
              <th>Đánh Giá Khách Hàng</th>
            </tr>
          </thead>
          <tbody>
            {TOP_BIKES.map((bike, idx) => (
              <tr key={idx}>
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
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{bike.rentals} lượt</span>
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{bike.revenue.toLocaleString('vi-VN')} đ</span>
                </td>
                <td>
                  <span style={{ color: 'var(--accent-yellow)', fontWeight: 600 }}>{bike.rating}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
