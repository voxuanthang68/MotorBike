'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  Wrench, Bike, Calendar, Clock, CheckCircle2, AlertTriangle, History,
  FileText, Search, Bell, LogOut, ChevronRight, Eye, Menu, X, Plus,
  RefreshCw, Gauge, ShieldCheck, Filter, Camera, ClipboardCheck, User,
  Download, Printer, Package, DollarSign, Trash2, Send, ChevronDown,
  ChevronUp, BarChart2, Settings, Home, AlertCircle, CheckSquare,
  Star, TrendingUp, ArrowUpRight, MoreVertical, Edit, Check,
  XCircle, Layers, MapPin, Phone, Mail, Building, Upload
} from 'lucide-react';
import {
  MOCK_VEHICLES, MOCK_MAINTENANCE, MOCK_REPAIRS, MOCK_INSPECTIONS,
  MOCK_PARTS, MOCK_NOTIFICATIONS, CHART_DATA_MONTHLY,
  CHART_DATA_VEHICLE_STATUS, CHART_DATA_COST
} from './mockData';

// ==========================================
// TYPES
// ==========================================
type TabId = 'dashboard' | 'vehicles' | 'inspection' | 'damage' | 'repair' | 'parts' | 'maintenance' | 'history' | 'reports' | 'notifications' | 'profile';

// ==========================================
// CONSTANTS
// ==========================================
const MENU_ITEMS = [
  { id: 'dashboard' as TabId, label: 'Dashboard', icon: Home },
  { id: 'vehicles' as TabId, label: 'Quản lý xe', icon: Bike },
  { id: 'inspection' as TabId, label: 'Kiểm tra xe khi trả', icon: ClipboardCheck },
  { id: 'damage' as TabId, label: 'Quản lý hư hỏng', icon: AlertTriangle },
  { id: 'repair' as TabId, label: 'Quản lý sửa chữa', icon: Wrench },
  { id: 'parts' as TabId, label: 'Quản lý phụ tùng', icon: Package },
  { id: 'maintenance' as TabId, label: 'Quản lý bảo dưỡng', icon: Calendar },
  { id: 'history' as TabId, label: 'Lịch sử kỹ thuật', icon: History },
  { id: 'reports' as TabId, label: 'Báo cáo thống kê', icon: BarChart2 },
  { id: 'notifications' as TabId, label: 'Thông báo', icon: Bell },
  { id: 'profile' as TabId, label: 'Tài khoản cá nhân', icon: User },
];

const STATUS_VEHICLE: Record<string, { label: string; className: string }> = {
  available: { label: 'Sẵn sàng', className: 'bg-green-100 text-green-700' },
  rented: { label: 'Đang thuê', className: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Bảo dưỡng', className: 'bg-yellow-100 text-yellow-700' },
  broken: { label: 'Hư hỏng', className: 'bg-red-100 text-red-700' },
  retired: { label: 'Đã nghỉ', className: 'bg-gray-100 text-gray-700' },
  reserved: { label: 'Đã đặt', className: 'bg-purple-100 text-purple-700' },
};

const STATUS_MAINTENANCE: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Đã lên lịch', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Đang thực hiện', className: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-700' },
};

const STATUS_REPAIR: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ tiếp nhận', className: 'bg-gray-100 text-gray-700' },
  received: { label: 'Đã tiếp nhận', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Đang sửa chữa', className: 'bg-yellow-100 text-yellow-700' },
  waiting_parts: { label: 'Chờ linh kiện', className: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-700' },
  cannot_repair: { label: 'Không thể sửa', className: 'bg-red-100 text-red-700' },
};

const STATUS_PARTS: Record<string, { label: string; className: string }> = {
  in_stock: { label: 'Còn hàng', className: 'bg-green-100 text-green-700' },
  low_stock: { label: 'Sắp hết', className: 'bg-yellow-100 text-yellow-700' },
  out_of_stock: { label: 'Hết hàng', className: 'bg-red-100 text-red-700' },
};

const PRIORITY: Record<string, { label: string; className: string }> = {
  high: { label: 'Cao', className: 'bg-red-100 text-red-700' },
  medium: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Thấp', className: 'bg-blue-100 text-blue-700' },
};

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ'; }

// ==========================================
// STAT CARD
// ==========================================
function StatCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: { value: number; up: boolean };
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            <ArrowUpRight size={12} className={trend.up ? '' : 'rotate-90'} />
            {trend.value}% so với tháng trước
          </p>
        )}
      </div>
    </div>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================
function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>{label}</span>;
}

// ==========================================
// MODAL WRAPPER
// ==========================================
function Modal({ open, onClose, title, children, size = 'max-w-2xl' }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; size?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative w-full ${size} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ==========================================
// SECTION HEADER
// ==========================================
function SectionHeader({ title, sub, actions }: {
  title: string; sub?: string; actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ==========================================
// DASHBOARD TAB
// ==========================================
function DashboardTab({ setActiveTab }: { setActiveTab: (t: TabId) => void }) {
  const unreadNotifs = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Trang chủ Kỹ thuật viên 🔧</h1>
            <p className="text-blue-100 mt-1">Theo dõi công việc bảo dưỡng, sửa chữa xe trong hệ thống</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-blue-100 text-sm">Thứ Năm, 24/04/2025</p>
            <p className="text-white font-semibold mt-1">Nguyễn Văn Minh</p>
            <p className="text-blue-200 text-xs">Kỹ thuật viên</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Xe được phân công" value={MOCK_VEHICLES.length} sub="Tổng số xe" icon={Bike} color="bg-blue-500" trend={{ value: 5, up: true }} />
        <StatCard title="Xe cần kiểm tra" value={2} sub="Mới trả xe" icon={ClipboardCheck} color="bg-orange-500" />
        <StatCard title="Đang sửa chữa" value={MOCK_REPAIRS.filter(r => r.status === 'in_progress').length} sub="Phiếu sửa chữa" icon={Wrench} color="bg-red-500" />
        <StatCard title="Đang bảo dưỡng" value={MOCK_MAINTENANCE.filter(m => m.status === 'in_progress').length} sub="Phiếu bảo dưỡng" icon={Calendar} color="bg-yellow-500" />
        <StatCard title="Đã hoàn thành" value={3} sub="Trong tháng này" icon={CheckCircle2} color="bg-green-500" trend={{ value: 12, up: true }} />
        <StatCard title="Thông báo mới" value={unreadNotifs} sub="Chưa đọc" icon={Bell} color="bg-purple-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Thống kê công việc kỹ thuật</h3>
              <p className="text-xs text-slate-400">6 tháng gần nhất</p>
            </div>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600">
              <option>6 tháng</option><option>3 tháng</option><option>12 tháng</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={CHART_DATA_MONTHLY} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Bảo dưỡng" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sửa chữa" fill="#DC2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Kiểm tra" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">Trạng thái xe trong kho</h3>
            <p className="text-xs text-slate-400">Tổng 78 xe</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={CHART_DATA_VEHICLE_STATUS} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                dataKey="value" paddingAngle={3}>
                {CHART_DATA_VEHICLE_STATUS.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {CHART_DATA_VEHICLE_STATUS.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-slate-600">{d.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-700">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Lịch bảo dưỡng sắp tới</h3>
            <button onClick={() => setActiveTab('maintenance')} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {MOCK_MAINTENANCE.filter(m => m.status !== 'completed').slice(0, 4).map(m => (
              <div key={m._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{m.vehicleName}</p>
                  <p className="text-xs text-slate-400">{m.type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-slate-600">{m.scheduledDate}</p>
                  <Badge {...STATUS_MAINTENANCE[m.status]} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Thông báo mới nhất</h3>
            <button onClick={() => setActiveTab('notifications')} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {MOCK_NOTIFICATIONS.slice(0, 4).map(n => (
              <div key={n._id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${n.isRead ? 'bg-slate-50' : 'bg-blue-50 border border-blue-100'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.isRead ? 'bg-slate-300' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent work */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">Công việc đang thực hiện</h3>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {MOCK_MAINTENANCE.filter(m => m.status === 'in_progress').length + MOCK_REPAIRS.filter(r => r.status === 'in_progress').length} việc
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-3 text-slate-500 font-medium">Mã phiếu</th>
                <th className="text-left pb-3 text-slate-500 font-medium">Xe</th>
                <th className="text-left pb-3 text-slate-500 font-medium">Loại công việc</th>
                <th className="text-left pb-3 text-slate-500 font-medium">Tiến độ</th>
                <th className="text-left pb-3 text-slate-500 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_MAINTENANCE.filter(m => m.status === 'in_progress').map(m => (
                <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-mono text-xs text-blue-600">{m.code}</td>
                  <td className="py-3">
                    <div>
                      <p className="font-semibold text-slate-700">{m.vehicleName}</p>
                      <p className="text-xs text-slate-400">{m.licensePlate}</p>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600">{m.type}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 w-24">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }} />
                      </div>
                      <span className="text-xs text-slate-500">70%</span>
                    </div>
                  </td>
                  <td className="py-3"><Badge {...STATUS_MAINTENANCE[m.status]} /></td>
                </tr>
              ))}
              {MOCK_REPAIRS.filter(r => r.status === 'in_progress').map(r => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-mono text-xs text-red-600">{r.code}</td>
                  <td className="py-3">
                    <div>
                      <p className="font-semibold text-slate-700">{r.vehicleName}</p>
                      <p className="text-xs text-slate-400">{r.licensePlate}</p>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600">{r.issue}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 w-24">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                      <span className="text-xs text-slate-500">45%</span>
                    </div>
                  </td>
                  <td className="py-3"><Badge {...STATUS_REPAIR[r.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VEHICLES TAB
// ==========================================
function VehiclesTab() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<typeof MOCK_VEHICLES[0] | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  const filtered = MOCK_VEHICLES.filter(v => {
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.licensePlate.includes(search) || v.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchType = filterType === 'all' || v.type === filterType;
    return matchSearch && matchStatus && matchType;
  });
  const total = filtered.length;
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);
  const types = [...new Set(MOCK_VEHICLES.map(v => v.type))];

  return (
    <div>
      <SectionHeader title="Quản lý xe" sub="Danh sách xe được phân công" actions={
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <RefreshCw size={14} /> Làm mới
        </button>
      } />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo biển số, mã xe, tên xe..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_VEHICLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
            <option value="all">Tất cả loại xe</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-400 mt-2">Tìm thấy {total} xe</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Xe</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Biển số</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Loại xe</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Km đã đi</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Tình trạng</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Bảo dưỡng gần nhất</th>
                <th className="px-5 py-3 text-slate-500 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map(v => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={v.image} alt={v.name} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{v.name}</p>
                        <p className="text-xs text-slate-400">{v.code} · {v.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-sm font-semibold text-slate-700">{v.licensePlate}</td>
                  <td className="px-5 py-4 text-slate-600">{v.type}</td>
                  <td className="px-5 py-4 text-slate-600">{v.odometer?.toLocaleString()} km</td>
                  <td className="px-5 py-4"><Badge {...STATUS_VEHICLE[v.status]} /></td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{v.lastMaintenance}</td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => setSelectedVehicle(v)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Eye size={12} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Trang {page} / {totalPages} · {total} xe</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">← Trước</button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Detail Modal */}
      <Modal open={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} title={`Chi tiết xe: ${selectedVehicle?.name}`} size="max-w-3xl">
        {selectedVehicle && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-24 h-18 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-800">{selectedVehicle.name}</h4>
                <p className="text-slate-500">{selectedVehicle.brand} · {selectedVehicle.year}</p>
                <Badge {...STATUS_VEHICLE[selectedVehicle.status]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Mã xe', selectedVehicle.code], ['Biển số', selectedVehicle.licensePlate],
                ['Loại xe', selectedVehicle.type], ['Dung tích', `${selectedVehicle.engineCC}cc`],
                ['Km đã đi', `${selectedVehicle.odometer?.toLocaleString()} km`],
                ['Tình trạng', selectedVehicle.condition || 'Tốt'],
                ['Bảo dưỡng gần nhất', selectedVehicle.lastMaintenance || '-'],
                ['Bảo dưỡng tiếp theo', selectedVehicle.nextMaintenance || '-'],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4">
              <h5 className="text-sm font-bold text-slate-700 mb-3">Lịch sử bảo dưỡng gần đây</h5>
              <div className="space-y-2">
                {MOCK_MAINTENANCE.filter(m => m.vehicleId === selectedVehicle._id).map(m => (
                  <div key={m._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.type}</p>
                      <p className="text-xs text-slate-400">{m.scheduledDate}</p>
                    </div>
                    <Badge {...STATUS_MAINTENANCE[m.status]} />
                  </div>
                ))}
                {MOCK_MAINTENANCE.filter(m => m.vehicleId === selectedVehicle._id).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-3">Chưa có lịch sử bảo dưỡng</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// INSPECTION TAB
// ==========================================
function InspectionTab() {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<typeof MOCK_INSPECTIONS[0] | null>(null);
  const [inspectionItems, setInspectionItems] = useState({
    engine: 'ok', brakes: 'ok', tires: 'ok', lights: 'ok', mirrors: 'ok', body: 'ok'
  });
  const [damageNotes, setDamageNotes] = useState('');
  const [step, setStep] = useState(1);

  const checkItems = [
    { key: 'engine', label: 'Động cơ', desc: 'Tiếng ồn, rò rỉ, hiệu suất' },
    { key: 'brakes', label: 'Hệ thống phanh', desc: 'Phanh trước, phanh sau, dây phanh' },
    { key: 'tires', label: 'Lốp xe', desc: 'Độ mòn, áp suất, nứt vỡ' },
    { key: 'lights', label: 'Đèn và còi', desc: 'Đèn pha, đèn hậu, xi nhan, còi' },
    { key: 'mirrors', label: 'Gương và ngoại thất', desc: 'Gương chiếu hậu, kính, sườn xe' },
    { key: 'body', label: 'Thân xe', desc: 'Trầy xước, móp méo, gỉ sét' },
  ];

  return (
    <div>
      <SectionHeader title="Kiểm tra xe khi khách trả" sub="Tiếp nhận và kiểm tra tình trạng xe" actions={
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Tạo phiếu kiểm tra
        </button>
      } />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{MOCK_INSPECTIONS.filter(i => i.status === 'in_progress').length}</p>
          <p className="text-xs text-orange-500 mt-1">Đang kiểm tra</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{MOCK_INSPECTIONS.filter(i => i.status === 'completed' && i.overallResult === 'passed').length}</p>
          <p className="text-xs text-green-500 mt-1">Đạt yêu cầu</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{MOCK_INSPECTIONS.filter(i => i.overallResult === 'has_damage').length}</p>
          <p className="text-xs text-red-500 mt-1">Có hư hỏng</p>
        </div>
      </div>

      {/* Inspection cards */}
      <div className="space-y-4">
        {MOCK_INSPECTIONS.map(insp => (
          <div key={insp._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck size={22} className="text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800">{insp.code}</h4>
                    <Badge label={insp.overallResult === 'passed' ? 'Đạt yêu cầu' : 'Có hư hỏng'}
                      className={insp.overallResult === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} />
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{insp.vehicleName} · {insp.licensePlate}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Đơn thuê: {insp.bookingCode} · KH: {insp.customer}</p>
                  <p className="text-xs text-slate-400">Trả xe: {insp.returnDate} · KTV: {insp.technician}</p>
                </div>
              </div>
              <div className="text-right">
                {insp.damages.length > 0 && (
                  <p className="text-sm font-bold text-red-600">{fmt(insp.estimatedCost)}</p>
                )}
                <button onClick={() => setSelected(insp)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Eye size={12} /> Chi tiết
                </button>
              </div>
            </div>

            {/* Damage list */}
            {insp.damages.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-700 mb-2">Hư hỏng phát hiện:</p>
                <div className="flex flex-wrap gap-2">
                  {insp.damages.map((d, i) => (
                    <span key={i} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded-lg">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Check items */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {checkItems.map(c => (
                <div key={c.key} className={`text-center p-2 rounded-lg text-xs font-medium ${
                  (insp.items as any)[c.key] === 'ok' ? 'bg-green-50 text-green-700' :
                  (insp.items as any)[c.key] === 'damage' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  <div className="text-base mb-0.5">
                    {(insp.items as any)[c.key] === 'ok' ? '✅' : (insp.items as any)[c.key] === 'damage' ? '❌' : '⚠️'}
                  </div>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Inspection Modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setStep(1); }} title="Tạo phiếu kiểm tra xe" size="max-w-3xl">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-6 overflow-x-auto">
          {['Thông tin xe', 'Kiểm tra tổng thể', 'Chụp ảnh', 'Xác nhận'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 flex-shrink-0 ${step > i + 1 ? 'text-green-600' : step === i + 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step > i + 1 ? 'bg-green-100' : step === i + 1 ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-px mx-2 ${step > i + 1 ? 'bg-green-200' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Mã đơn thuê *</label>
                <input defaultValue="DH-029" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Khách hàng</label>
                <input defaultValue="Lê Văn Bình" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Xe *</label>
                <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {MOCK_VEHICLES.map(v => <option key={v._id}>{v.name} - {v.licensePlate}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Thời gian trả xe</label>
                <input type="datetime-local" defaultValue="2025-04-24T14:00" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-700">📋 Vui lòng kiểm tra kỹ thông tin đơn thuê trước khi tiến hành kiểm tra xe.</p>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-3">Chọn trạng thái cho từng hạng mục kiểm tra:</p>
            {checkItems.map(c => (
              <div key={c.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{c.label}</p>
                  <p className="text-xs text-slate-400">{c.desc}</p>
                </div>
                <select value={(inspectionItems as any)[c.key]}
                  onChange={e => setInspectionItems(prev => ({ ...prev, [c.key]: e.target.value }))}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                    (inspectionItems as any)[c.key] === 'ok' ? 'border-green-200 text-green-700' :
                    (inspectionItems as any)[c.key] === 'damage' ? 'border-red-200 text-red-700' : 'border-yellow-200 text-yellow-700'
                  }`}>
                  <option value="ok">✅ Bình thường</option>
                  <option value="damage">❌ Có hư hỏng</option>
                  <option value="check">⚠️ Cần kiểm tra thêm</option>
                </select>
              </div>
            ))}
            {Object.values(inspectionItems).some(v => v !== 'ok') && (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Mô tả chi tiết hư hỏng</label>
                <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} rows={3}
                  placeholder="Mô tả cụ thể vị trí và mức độ hư hỏng..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">📸 Ảnh TRƯỚC khi thuê (đối chiếu)</p>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                  <Camera size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Ảnh lưu trữ từ lúc giao xe</p>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {['Góc trái', 'Góc phải', 'Phía trước', 'Phía sau'].map(g => (
                      <div key={g} className="bg-slate-100 rounded-lg aspect-video flex items-center justify-center">
                        <span className="text-xs text-slate-400">{g}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">📸 Ảnh SAU khi trả xe (mới chụp)</p>
                <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload size={28} className="text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-blue-500 font-medium">Chụp ảnh hoặc tải lên</p>
                  <p className="text-xs text-blue-300 mt-1">Chụp đầy đủ 4 góc xe</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <p className="text-xs text-orange-700 font-medium">⚠️ Lưu ý: Cần chụp ảnh đủ 4 góc xe và các vị trí hư hỏng (nếu có) để làm bằng chứng.</p>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-2" />
              <h4 className="font-bold text-green-700 text-lg">Xác nhận tạo phiếu kiểm tra</h4>
              <p className="text-sm text-green-600 mt-1">Vui lòng kiểm tra lại thông tin trước khi lưu</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(inspectionItems).map(([key, val]) => {
                const c = checkItems.find(c => c.key === key)!;
                return (
                  <div key={key} className={`p-3 rounded-lg flex items-center gap-2 ${
                    val === 'ok' ? 'bg-green-50 text-green-700' : val === 'damage' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    <span className="text-sm">{val === 'ok' ? '✅' : val === 'damage' ? '❌' : '⚠️'}</span>
                    <span className="text-xs font-medium">{c.label}</span>
                  </div>
                );
              })}
            </div>
            {damageNotes && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-1">Ghi chú hư hỏng:</p>
                <p className="text-sm text-slate-700">{damageNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              ← Quay lại
            </button>
          )}
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
              Tiếp theo →
            </button>
          ) : (
            <button onClick={() => { setShowNew(false); setStep(1); toast.success('Đã tạo phiếu kiểm tra!'); }}
              className="flex-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
              ✅ Xác nhận & Lưu phiếu
            </button>
          )}
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Phiếu kiểm tra: ${selected?.code}`} size="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Xe', `${selected.vehicleName} (${selected.licensePlate})`],
                ['Đơn thuê', selected.bookingCode],
                ['Khách hàng', selected.customer],
                ['Thời gian trả', selected.returnDate],
                ['Kỹ thuật viên', selected.technician],
                ['Kết quả', selected.overallResult === 'passed' ? 'Đạt yêu cầu' : 'Có hư hỏng'],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <h5 className="text-sm font-bold text-slate-700 mb-3">Kết quả kiểm tra từng hạng mục</h5>
              <div className="grid grid-cols-2 gap-2">
                {checkItems.map(c => (
                  <div key={c.key} className={`p-3 rounded-lg flex items-center gap-2 ${
                    (selected.items as any)[c.key] === 'ok' ? 'bg-green-50 text-green-700' :
                    (selected.items as any)[c.key] === 'damage' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    <span>{(selected.items as any)[c.key] === 'ok' ? '✅' : (selected.items as any)[c.key] === 'damage' ? '❌' : '⚠️'}</span>
                    <div>
                      <p className="text-xs font-semibold">{c.label}</p>
                      <p className="text-xs opacity-70">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selected.damages.length > 0 && (
              <div>
                <h5 className="text-sm font-bold text-slate-700 mb-2">Danh sách hư hỏng</h5>
                <div className="space-y-2">
                  {selected.damages.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-sm text-red-700">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
                <FileText size={14} /> Tạo biên bản hư hỏng
              </button>
              <button className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Printer size={14} /> In phiếu kiểm tra
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// DAMAGE TAB
// ==========================================
function DamageTab() {
  const [selected, setSelected] = useState<typeof MOCK_INSPECTIONS[0] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const damagedInspections = MOCK_INSPECTIONS.filter(i => i.damages.length > 0);

  return (
    <div>
      <SectionHeader title="Quản lý hư hỏng" sub="Danh sách hư hỏng phát hiện khi kiểm tra xe" actions={
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Lập biên bản
        </button>
      } />

      <div className="space-y-4">
        {damagedInspections.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
            <CheckCircle2 size={48} className="text-green-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Không có hư hỏng nào cần xử lý</p>
          </div>
        )}
        {damagedInspections.map(insp => (
          <div key={insp._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-slate-800">{insp.vehicleName}</h4>
                    <span className="text-xs text-slate-400">{insp.licensePlate}</span>
                  </div>
                  <p className="text-xs text-slate-400">Phiếu KT: {insp.code} · KH: {insp.customer} · {insp.returnDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-red-600">{fmt(insp.estimatedCost)}</p>
                <p className="text-xs text-slate-400 mt-0.5">Dự toán chi phí</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {insp.damages.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">{d}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Cần sửa chữa</span>
                    <button className="p-1 hover:bg-red-100 rounded transition-colors">
                      <Camera size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo comparison */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">📷 Ảnh TRƯỚC khi thuê</p>
                <div className="bg-slate-200 rounded aspect-video flex items-center justify-center">
                  <span className="text-xs text-slate-400">Chưa có ảnh</span>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-500 mb-2">📷 Ảnh SAU khi trả</p>
                <div className="bg-red-100 rounded aspect-video flex items-center justify-center">
                  <span className="text-xs text-red-400">Chưa có ảnh</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setSelected(insp)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                <Eye size={12} /> Xem chi tiết
              </button>
              <button className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 font-medium bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors">
                <Wrench size={12} /> Tạo phiếu sửa chữa
              </button>
              <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">
                <Send size={12} /> Gửi báo giá KH
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// REPAIR TAB
// ==========================================
function RepairTab() {
  const [repairs, setRepairs] = useState(MOCK_REPAIRS);
  const [selected, setSelected] = useState<typeof MOCK_REPAIRS[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = repairs.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const updateStatus = (id: string, newStatus: string) => {
    setRepairs(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    toast.success('Đã cập nhật trạng thái!');
    if (selected?._id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
  };

  return (
    <div>
      <SectionHeader title="Quản lý sửa chữa" sub="Theo dõi và xử lý yêu cầu sửa chữa" actions={
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Tạo phiếu sửa chữa
        </button>
      } />

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[{ value: 'all', label: 'Tất cả' }, ...Object.entries(STATUS_REPAIR).map(([k, v]) => ({ value: k, label: v.label }))].map(opt => (
          <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterStatus === opt.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(r => (
          <div key={r._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wrench size={20} className="text-orange-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-orange-600 font-bold">{r.code}</span>
                    <Badge {...STATUS_REPAIR[r.status]} />
                    <Badge {...PRIORITY[r.priority]} />
                  </div>
                  <h4 className="font-bold text-slate-800">{r.issue}</h4>
                  <p className="text-xs text-slate-500">{r.vehicleName} · {r.licensePlate} · KTV: {r.technician}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{fmt(r.estimatedCost)}</p>
                <p className="text-xs text-slate-400">Dự toán</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-3 pl-14">{r.description}</p>

            {/* Parts list */}
            <div className="pl-14 mb-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Phụ tùng cần dùng:</p>
              <div className="flex flex-wrap gap-2">
                {r.parts.map((p, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Package size={12} className="text-slate-400" />
                    <span className="text-xs text-slate-600">{p.name}</span>
                    <span className="text-xs font-bold text-slate-700">x{p.qty}</span>
                    <span className="text-xs text-blue-600">{fmt(p.price * p.qty)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">Ngày báo cáo: {r.reportedDate}</p>
              <div className="flex gap-2">
                <button onClick={() => setSelected(r)} className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Eye size={12} /> Chi tiết
                </button>
                {r.status !== 'completed' && (
                  <select value={r.status} onChange={e => updateStatus(r._id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(STATUS_REPAIR).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Phiếu sửa chữa: ${selected?.code}`} size="max-w-3xl">
        {selected && (
          <div className="space-y-5">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Xe', `${selected.vehicleName}`], ['Biển số', selected.licensePlate],
                ['Trạng thái', STATUS_REPAIR[selected.status]?.label], ['Độ ưu tiên', PRIORITY[selected.priority]?.label],
                ['Kỹ thuật viên', selected.technician], ['Ngày báo cáo', selected.reportedDate],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>

            {/* Issue */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Vấn đề</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.description}</p>
            </div>

            {/* Parts */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Danh sách phụ tùng</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-semibold">Phụ tùng</th>
                      <th className="text-center px-4 py-2.5 text-xs text-slate-500 font-semibold">SL</th>
                      <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-semibold">Đơn giá</th>
                      <th className="text-right px-4 py-2.5 text-xs text-slate-500 font-semibold">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.parts.map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2.5 text-slate-700">{p.name}</td>
                        <td className="px-4 py-2.5 text-center">{p.qty}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{fmt(p.price)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-blue-600">{fmt(p.price * p.qty)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="px-4 py-2.5 text-right text-slate-700">Tổng dự toán:</td>
                      <td className="px-4 py-2.5 text-right text-blue-700">{fmt(selected.estimatedCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Ghi chú</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.notes}</p>
            </div>

            <div className="flex gap-3">
              {selected.status !== 'completed' && (
                <button onClick={() => { updateStatus(selected._id, 'completed'); setSelected(null); }}
                  className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} /> Hoàn thành sửa chữa
                </button>
              )}
              <button className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Printer size={14} /> In phiếu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// PARTS TAB
// ==========================================
function PartsTab() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [selected, setSelected] = useState<typeof MOCK_PARTS[0] | null>(null);

  const cats = [...new Set(MOCK_PARTS.map(p => p.category))];
  const filtered = MOCK_PARTS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div>
      <SectionHeader title="Quản lý phụ tùng" sub="Tra cứu và theo dõi phụ tùng thay thế" actions={
        <div className="flex gap-2">
          <button onClick={() => setView(view === 'table' ? 'grid' : 'table')}
            className="flex items-center gap-1.5 text-sm border border-slate-200 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Layers size={14} /> {view === 'table' ? 'Dạng lưới' : 'Dạng bảng'}
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={14} /> Thêm phụ tùng
          </button>
        </div>
      } />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{MOCK_PARTS.filter(p => p.status === 'in_stock').length}</p>
          <p className="text-xs text-green-500 mt-1">Còn hàng</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{MOCK_PARTS.filter(p => p.status === 'low_stock').length}</p>
          <p className="text-xs text-yellow-500 mt-1">Sắp hết</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{MOCK_PARTS.filter(p => p.status === 'out_of_stock').length}</p>
          <p className="text-xs text-red-500 mt-1">Hết hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã hoặc tên phụ tùng..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">Tất cả danh mục</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_PARTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {view === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Phụ tùng</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Danh mục</th>
                <th className="text-left px-5 py-3 text-slate-500 font-semibold">Hãng</th>
                <th className="text-right px-5 py-3 text-slate-500 font-semibold">Giá</th>
                <th className="text-center px-5 py-3 text-slate-500 font-semibold">Tồn kho</th>
                <th className="text-center px-5 py-3 text-slate-500 font-semibold">Trạng thái</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.code}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{p.category}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{p.brand}</td>
                  <td className="px-5 py-3 text-right font-semibold text-blue-600">{fmt(p.price)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-yellow-600' : 'text-green-600'}`}>
                      {p.stock}
                    </span>
                    <span className="text-xs text-slate-400"> {p.unit}</span>
                  </td>
                  <td className="px-5 py-3 text-center"><Badge {...STATUS_PARTS[p.status]} /></td>
                  <td className="px-5 py-3">
                    <button onClick={() => setSelected(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                      Chọn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <Package size={22} className="text-blue-500" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">{p.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{p.code} · {p.brand}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">{fmt(p.price)}</span>
                <Badge {...STATUS_PARTS[p.status]} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Tồn: <strong>{p.stock}</strong> {p.unit}</span>
                <button onClick={() => setSelected(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium underline">Chọn</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Select part modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Chọn phụ tùng: ${selected?.name}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Mã phụ tùng', selected.code], ['Danh mục', selected.category],
                ['Hãng', selected.brand], ['Đơn vị', selected.unit],
                ['Đơn giá', fmt(selected.price)], ['Tồn kho', `${selected.stock} ${selected.unit}`],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Số lượng sử dụng</label>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={selected.stock} defaultValue={1}
                  className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm text-slate-500">/ {selected.stock} {selected.unit} còn lại</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Thêm vào phiếu sửa chữa</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {MOCK_REPAIRS.map(r => <option key={r._id}>{r.code} - {r.vehicleName}</option>)}
              </select>
            </div>
            <button onClick={() => { setSelected(null); toast.success(`Đã thêm ${selected.name} vào phiếu sửa chữa!`); }}
              className="w-full py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
              ✅ Xác nhận sử dụng phụ tùng
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// MAINTENANCE TAB
// ==========================================
function MaintenanceTab() {
  const [records, setRecords] = useState(MOCK_MAINTENANCE);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<typeof MOCK_MAINTENANCE[0] | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = records.filter(m => filterStatus === 'all' || m.status === filterStatus);

  const updateStatus = (id: string, newStatus: string) => {
    setRecords(prev => prev.map(m => m._id === id ? { ...m, status: newStatus } : m));
    toast.success('Đã cập nhật trạng thái bảo dưỡng!');
  };

  return (
    <div>
      <SectionHeader title="Quản lý bảo dưỡng" sub="Lịch bảo dưỡng và theo dõi tiến độ" actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={14} /> Tạo lịch bảo dưỡng
        </button>
      } />

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[{ value: 'all', label: 'Tất cả' }, ...Object.entries(STATUS_MAINTENANCE).map(([k, v]) => ({ value: k, label: v.label }))].map(opt => (
          <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterStatus === opt.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-5 py-3 text-slate-500 font-semibold">Mã phiếu</th>
              <th className="text-left px-5 py-3 text-slate-500 font-semibold">Xe</th>
              <th className="text-left px-5 py-3 text-slate-500 font-semibold">Loại bảo dưỡng</th>
              <th className="text-left px-5 py-3 text-slate-500 font-semibold">Ngày thực hiện</th>
              <th className="text-left px-5 py-3 text-slate-500 font-semibold">Kỹ thuật viên</th>
              <th className="text-right px-5 py-3 text-slate-500 font-semibold">Chi phí</th>
              <th className="text-center px-5 py-3 text-slate-500 font-semibold">Trạng thái</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(m => (
              <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-mono text-xs text-blue-600 font-bold">{m.code}</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-700">{m.vehicleName}</p>
                  <p className="text-xs text-slate-400">{m.licensePlate}</p>
                </td>
                <td className="px-5 py-4 text-slate-600 text-xs">{m.type}</td>
                <td className="px-5 py-4 text-slate-600 text-xs">{m.scheduledDate}</td>
                <td className="px-5 py-4 text-slate-600 text-xs">{m.technician}</td>
                <td className="px-5 py-4 text-right font-semibold text-blue-600">{fmt(m.cost)}</td>
                <td className="px-5 py-4 text-center"><Badge {...STATUS_MAINTENANCE[m.status]} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(m)} className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors">
                      <Eye size={12} />
                    </button>
                    {m.status !== 'completed' && (
                      <select value={m.status} onChange={e => updateStatus(m._id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none">
                        {Object.entries(STATUS_MAINTENANCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Phiếu bảo dưỡng: ${selected?.code}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Xe', selected.vehicleName], ['Biển số', selected.licensePlate],
                ['Loại bảo dưỡng', selected.type], ['Ngày thực hiện', selected.scheduledDate],
                ['Kỹ thuật viên', selected.technician], ['Chi phí', fmt(selected.cost)],
              ].map(([label, value]) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Hạng mục thực hiện</p>
              <div className="space-y-2">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
                    <Check size={14} className={selected.status === 'completed' ? 'text-green-500' : 'text-slate-300'} />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Ghi chú</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selected.notes}</p>
              </div>
            )}
            <div className="flex gap-3">
              {selected.status !== 'completed' && (
                <button onClick={() => { updateStatus(selected._id, 'completed'); setSelected(null); }}
                  className="flex-1 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                  ✅ Hoàn thành bảo dưỡng
                </button>
              )}
              <button className="flex-1 py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                🖨️ In phiếu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ==========================================
// HISTORY TAB
// ==========================================
function HistoryTab() {
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const allHistory = [
    ...MOCK_MAINTENANCE.map(m => ({ ...m, _type: 'maintenance', date: m.scheduledDate })),
    ...MOCK_REPAIRS.map(r => ({ ...r, _type: 'repair', date: r.reportedDate, vehicleName: r.vehicleName, licensePlate: r.licensePlate })),
    ...MOCK_INSPECTIONS.map(i => ({ ...i, _type: 'inspection', date: i.returnDate.split(' ')[0], vehicleName: i.vehicleName, licensePlate: i.licensePlate })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = allHistory.filter(h => {
    const matchVehicle = selectedVehicle === 'all' || h.vehicleName === selectedVehicle;
    const matchType = filterType === 'all' || h._type === filterType;
    return matchVehicle && matchType;
  });

  const typeIcon = { maintenance: Calendar, repair: Wrench, inspection: ClipboardCheck };
  const typeColor = { maintenance: 'bg-blue-100 text-blue-600', repair: 'bg-orange-100 text-orange-600', inspection: 'bg-green-100 text-green-600' };
  const typeLabel = { maintenance: 'Bảo dưỡng', repair: 'Sửa chữa', inspection: 'Kiểm tra xe' };

  return (
    <div>
      <SectionHeader title="Lịch sử kỹ thuật" sub="Toàn bộ lịch sử kiểm tra, bảo dưỡng, sửa chữa" />

      <div className="flex flex-wrap gap-3 mb-5">
        <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">Tất cả xe</option>
          {MOCK_VEHICLES.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
        </select>
        <div className="flex gap-2">
          {[{ value: 'all', label: 'Tất cả' }, { value: 'maintenance', label: 'Bảo dưỡng' }, { value: 'repair', label: 'Sửa chữa' }, { value: 'inspection', label: 'Kiểm tra' }].map(opt => (
            <button key={opt.value} onClick={() => setFilterType(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === opt.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
        <div className="space-y-5">
          {filtered.map((h, i) => {
            const Icon = typeIcon[h._type as keyof typeof typeIcon];
            const color = typeColor[h._type as keyof typeof typeColor];
            const label = typeLabel[h._type as keyof typeof typeLabel];
            return (
              <div key={i} className="relative">
                <div className={`absolute -left-5 w-7 h-7 rounded-full flex items-center justify-center ${color}`}>
                  <Icon size={13} />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                        <span className="font-mono text-xs text-slate-400">{(h as any).code}</span>
                      </div>
                      <p className="font-bold text-slate-800">{h.vehicleName}</p>
                      <p className="text-xs text-slate-400">{h.licensePlate} · {(h as any).type || (h as any).issue || 'Kiểm tra xe'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-600">{h.date}</p>
                      <Badge {...(STATUS_MAINTENANCE[(h as any).status] || STATUS_REPAIR[(h as any).status] || { label: 'Đã kiểm tra', className: 'bg-green-100 text-green-700' })} />
                    </div>
                  </div>
                  {/* Before/after photo comparison */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400 mb-1.5">📷 Trước</p>
                      <div className="bg-slate-200 rounded aspect-video flex items-center justify-center">
                        <span className="text-xs text-slate-400">Chưa có ảnh</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-xs text-slate-400 mb-1.5">📷 Sau</p>
                      <div className="bg-slate-200 rounded aspect-video flex items-center justify-center">
                        <span className="text-xs text-slate-400">Chưa có ảnh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// REPORTS TAB
// ==========================================
function ReportsTab() {
  const totalCost = CHART_DATA_COST.reduce((s, d) => s + d['Chi phí'], 0);
  const totalWork = CHART_DATA_MONTHLY.reduce((s, d) => s + d['Bảo dưỡng'] + d['Sửa chữa'] + d['Kiểm tra'], 0);

  return (
    <div>
      <SectionHeader title="Báo cáo thống kê" sub="Thống kê công việc và chi phí kỹ thuật" actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={14} /> Xuất Excel
          </button>
          <button className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Printer size={14} /> In báo cáo
          </button>
        </div>
      } />

      {/* Date filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Khoảng thời gian:</span>
          <div className="flex gap-2">
            {['Tháng này', '3 tháng', '6 tháng', '12 tháng'].map(opt => (
              <button key={opt} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${opt === '6 tháng' ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng công việc', value: totalWork, icon: CheckSquare, color: 'bg-blue-500' },
          { label: 'Bảo dưỡng', value: CHART_DATA_MONTHLY.reduce((s, d) => s + d['Bảo dưỡng'], 0), icon: Calendar, color: 'bg-green-500' },
          { label: 'Sửa chữa', value: CHART_DATA_MONTHLY.reduce((s, d) => s + d['Sửa chữa'], 0), icon: Wrench, color: 'bg-orange-500' },
          { label: 'Chi phí tổng', value: fmt(totalCost), icon: DollarSign, color: 'bg-purple-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Work count chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 mb-1">Thống kê số lượng công việc</h3>
          <p className="text-xs text-slate-400 mb-4">6 tháng gần nhất (đơn vị: lần)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={CHART_DATA_MONTHLY} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Bảo dưỡng" fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Sửa chữa" fill="#DC2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Kiểm tra" fill="#16A34A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 mb-1">Thống kê chi phí sửa chữa & bảo dưỡng</h3>
          <p className="text-xs text-slate-400 mb-4">6 tháng gần nhất (đơn vị: đồng)</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={CHART_DATA_COST} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                formatter={(v) => [fmt(Number(v ?? 0)), 'Chi phí']} />
              <Line type="monotone" dataKey="Chi phí" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// NOTIFICATIONS TAB
// ==========================================
function NotificationsTab() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('Đã đánh dấu tất cả là đã đọc');
  };

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const unread = notifs.filter(n => !n.isRead).length;
  const typeIcon: Record<string, { icon: React.ElementType; color: string }> = {
    return: { icon: Bike, color: 'bg-blue-100 text-blue-600' },
    maintenance: { icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
    repair: { icon: Wrench, color: 'bg-orange-100 text-orange-600' },
    schedule: { icon: Clock, color: 'bg-green-100 text-green-600' },
  };

  return (
    <div>
      <SectionHeader title="Thông báo" sub={`${unread} thông báo chưa đọc`} actions={
        <div className="flex gap-2">
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      } />

      <div className="space-y-3">
        {notifs.map(n => {
          const ti = typeIcon[n.type] || { icon: Bell, color: 'bg-slate-100 text-slate-600' };
          const Icon = ti.icon;
          return (
            <div key={n._id} onClick={() => markRead(n._id)} className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-all ${n.isRead ? 'border-slate-100' : 'border-blue-200 bg-blue-50/30'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${ti.color}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">{n.time}</span>
                      {!n.isRead && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">{n.date}</span>
                    <Badge {...PRIORITY[n.priority]} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// PROFILE TAB
// ==========================================
function ProfileTab() {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);

  return (
    <div className="max-w-2xl">
      <SectionHeader title="Tài khoản cá nhân" sub="Thông tin và cài đặt tài khoản" />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-5">
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-800" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                <User size={32} className="text-blue-500" />
              </div>
            </div>
            <button onClick={() => setEditing(!editing)}
              className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${editing ? 'bg-green-600 hover:bg-green-700 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <Edit size={14} /> {editing ? 'Lưu thay đổi' : 'Chỉnh sửa'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Họ và tên', value: user?.fullName || 'Nguyễn Văn Minh', field: 'name' },
              { label: 'Email', value: user?.email || 'technician@motobike.vn', field: 'email' },
              { label: 'Số điện thoại', value: '0905 123 456', field: 'phone' },
              { label: 'Vai trò', value: 'Nhân viên kỹ thuật', field: 'role' },
              { label: 'Địa chỉ', value: 'Hải Châu, Đà Nẵng', field: 'address' },
              { label: 'Ngày vào làm', value: '01/01/2024', field: 'startDate' },
            ].map(f => (
              <div key={f.field}>
                <label className="text-xs font-medium text-slate-500 block mb-1">{f.label}</label>
                {editing && f.field !== 'role' && f.field !== 'startDate' ? (
                  <input defaultValue={f.value} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="text-sm font-semibold text-slate-700 py-2">{f.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <h3 className="font-bold text-slate-800 mb-4">Thống kê công việc của tôi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Bảo dưỡng hoàn thành', value: 24, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Sửa chữa hoàn thành', value: 18, icon: Wrench, color: 'text-blue-500' },
            { label: 'Kiểm tra xe', value: 32, icon: ClipboardCheck, color: 'text-orange-500' },
            { label: 'Đánh giá trung bình', value: '4.9⭐', icon: Star, color: 'text-yellow-500' },
          ].map((s, i) => (
            <div key={i} className="text-center bg-slate-50 rounded-xl p-4">
              <s.icon size={24} className={`mx-auto mb-2 ${s.color}`} />
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN TECHNICIAN PAGE
// ==========================================
export default function TechnicianPage() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!accessToken) { router.push('/login'); return; }
    if (user && user.role !== 'technician') { router.push('/'); }
  }, [accessToken, user, router]);

  if (!accessToken || !user) return null;

  const handleLogout = () => {
    logout();
    toast.success('Đã đăng xuất thành công');
    router.push('/login');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab setActiveTab={setActiveTab} />;
      case 'vehicles': return <VehiclesTab />;
      case 'inspection': return <InspectionTab />;
      case 'damage': return <DamageTab />;
      case 'repair': return <RepairTab />;
      case 'parts': return <PartsTab />;
      case 'maintenance': return <MaintenanceTab />;
      case 'history': return <HistoryTab />;
      case 'reports': return <ReportsTab />;
      case 'notifications': return <NotificationsTab />;
      case 'profile': return <ProfileTab />;
      default: return null;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-bold text-sm leading-none">MotoRent</p>
              <p className="text-blue-300 text-xs mt-0.5">Kỹ thuật viên</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {MENU_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{unreadCount}</span>
                )}
              </div>
              {sidebarOpen && (
                <span className="text-sm font-medium flex-1 text-left truncate">{item.label}</span>
              )}
              {sidebarOpen && isActive && <ChevronRight size={14} className="flex-shrink-0 opacity-70" />}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-slate-700">
        {sidebarOpen ? (
          <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-xl">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user.fullName}</p>
              <p className="text-slate-400 text-xs truncate">Kỹ thuật viên</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors" title="Đăng xuất">
              <LogOut size={15} className="text-slate-400 hover:text-white" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full flex items-center justify-center p-2.5 hover:bg-slate-700 rounded-xl transition-colors" title="Đăng xuất">
            <LogOut size={18} className="text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-slate-800 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-slate-800 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
          {/* Toggle sidebar (desktop) */}
          <button onClick={() => setSidebarOpen(o => !o)} className="hidden lg:flex p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu size={18} className="text-slate-500" />
          </button>
          {/* Toggle sidebar (mobile) */}
          <button onClick={() => setMobileOpen(o => !o)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu size={18} className="text-slate-500" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Tìm kiếm xe, mã sửa chữa..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications bell */}
            <button onClick={() => setActiveTab('notifications')} className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <Bell size={18} className="text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>

            {/* Page title (mobile) */}
            <span className="text-sm font-semibold text-slate-700 sm:hidden">
              {MENU_ITEMS.find(m => m.id === activeTab)?.label}
            </span>

            {/* Avatar */}
            <button onClick={() => setActiveTab('profile')} className="flex items-center gap-2 pl-2 hover:bg-slate-50 rounded-xl transition-colors p-1.5">
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                <User size={15} className="text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-700 leading-none">{user.fullName}</p>
                <p className="text-xs text-slate-400 mt-0.5">Kỹ thuật viên</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
            </button>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-white border-b border-slate-100 px-5 py-2.5 flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
          <Home size={12} />
          <ChevronRight size={12} />
          <span>Nhân viên kỹ thuật</span>
          {activeTab !== 'dashboard' && (
            <>
              <ChevronRight size={12} />
              <span className="text-slate-600 font-medium">{MENU_ITEMS.find(m => m.id === activeTab)?.label}</span>
            </>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}
