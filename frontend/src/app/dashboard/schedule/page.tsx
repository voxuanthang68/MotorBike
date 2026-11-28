'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search,
  Calendar,
  Printer,
  Plus,
  X,
  Eye,
  FileText,
  User,
  Phone,
  Car,
  Clock,
  Check,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  PenTool
} from 'lucide-react';

export default function VehicleBookingSchedulePage() {
  const queryClient = useQueryClient();

  // Search & Filter state (dynamic around today)
  const [searchInput, setSearchInput] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [endDateFilter, setEndDateFilter] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 26);
    return d.toISOString().slice(0, 10);
  });
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Active selected day column
  const [selectedDayKey, setSelectedDayKey] = useState(() => new Date().toISOString().slice(0, 10));

  // Modals state
  const [quickCreateModal, setQuickCreateModal] = useState<{
    vehicleId: string;
    vehiclePlate: string;
    vehicleName: string;
    startDate: string;
  } | null>(null);

  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);

  // E-Sign and approval states
  const [approveModal, setApproveModal] = useState<any | null>(null);
  const staffScheduleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingScheduleSign, setIsDrawingScheduleSign] = useState(false);
  const [hasDrawnScheduleSign, setHasDrawnScheduleSign] = useState(false);
  const [approveDepositConfirmed, setApproveDepositConfirmed] = useState(true);
  const [approveNote, setApproveNote] = useState('Đã nhận cọc và xác nhận lịch giữ xe');

  // Approval Mutation
  const approveBookingMutation = useMutation({
    mutationFn: async ({ bookingId, note, depositConfirmed }: any) => {
      await api.put(`/bookings/${bookingId}/status`, {
        status: 'confirmed',
        note,
        depositConfirmed
      });
      return { success: true, bookingId };
    },
    onSuccess: () => {
      toast.success('Đã duyệt đơn và ký số thành công! Đơn xe chuyển sang trạng thái Đã đặt (Chờ giao xe).');
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setApproveModal(null);
      setHasDrawnScheduleSign(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt đơn');
    }
  });

  const startDrawingSchedule = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawingScheduleSign(true);
    setHasDrawnScheduleSign(true);
    const canvas = staffScheduleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawSchedule = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingScheduleSign) return;
    const canvas = staffScheduleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawingSchedule = () => {
    setIsDrawingScheduleSign(false);
  };

  const clearScheduleCanvas = () => {
    const canvas = staffScheduleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnScheduleSign(false);
  };

  // Quick create form inputs
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newEndDate, setNewEndDate] = useState('2026-09-05');
  const [newPricePerDay, setNewPricePerDay] = useState(800000);
  const [newDeposit, setNewDeposit] = useState(2000000);

  // 1. Fetch vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-schedule'],
    queryFn: async () => {
      try {
        const res = await api.get('/vehicles?limit=100');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // 2. Fetch contracts
  const { data: contractsData } = useQuery({
    queryKey: ['contracts-schedule'],
    queryFn: async () => {
      try {
        const res = await api.get('/contracts');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // 3. Fetch bookings
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings-schedule'],
    queryFn: async () => {
      try {
        const res = await api.get('/bookings?limit=100');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Real vehicles from API only (no mock vehicles)
  const vehiclesList = useMemo(() => {
    return Array.isArray(vehiclesData) ? vehiclesData : [];
  }, [vehiclesData]);

  // Merge live bookings + contracts into unified timeline items (no mock items)
  const timelineItems = useMemo(() => {
    const list: any[] = [];

    if (contractsData && contractsData.length > 0) {
      contractsData.forEach((c: any) => {
        if (c.vehicle && typeof c.vehicle === 'object' && c.vehicle.isActive === false) return;
        const vId = c.vehicle?._id || c.vehicle;
        const plate = c.vehicleInfo?.licensePlate || c.vehicle?.licensePlate;
        if (c.startDate && c.endDate) {
          list.push({
            _id: c._id,
            code: c.contractCode || 'HĐ',
            vehicleId: String(vId),
            licensePlate: plate,
            customerName: c.customerInfo?.fullName || c.customer?.fullName || 'Khách hàng',
            customerPhone: c.customerInfo?.phone || c.customer?.phone || '',
            startDate: c.startDate,
            endDate: c.actualReturnDate || c.endDate,
            status: c.status === 'completed' ? 'completed' : c.status === 'active' ? 'active' : c.status === 'confirmed' ? 'confirmed' : 'pending',
            totalPrice: c.totalPayable || c.totalRentalFee || 0,
            type: 'contract'
          });
        }
      });
    }

    if (bookingsData && bookingsData.length > 0) {
      bookingsData.forEach((b: any) => {
        if (b.vehicle && typeof b.vehicle === 'object' && b.vehicle.isActive === false) return;
        const vId = b.vehicle?._id || b.vehicle;
        const plate = b.vehicle?.licensePlate;
        if (b.startDate && b.endDate) {
          list.push({
            _id: b._id,
            code: b.bookingCode || 'ĐX',
            vehicleId: String(vId),
            licensePlate: plate,
            customerName: b.customer?.fullName || 'Khách hàng',
            customerPhone: b.customer?.phone || '',
            startDate: b.startDate,
            endDate: b.endDate,
            status: b.status === 'active' ? 'active' : b.status === 'completed' ? 'completed' : b.status === 'confirmed' ? 'confirmed' : 'pending',
            totalPrice: b.finalPrice || b.totalPrice || 0,
            type: 'booking'
          });
        }
      });
    }

    return list;
  }, [contractsData, bookingsData]);

  // Items waiting for approval
  const pendingScheduleItems = useMemo(() => {
    return timelineItems.filter((item: any) => item.status === 'pending');
  }, [timelineItems]);

  // Compute array of days between startDateFilter and endDateFilter
  const daysList = useMemo(() => {
    const start = new Date(startDateFilter);
    const end = new Date(endDateFilter);
    const arr: {
      date: Date;
      key: string;
      dayOfWeek: string;
      dateLabel: string;
      isWeekend: boolean;
    }[] = [];

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return arr;
    }

    const current = new Date(start);
    const dowNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    let count = 0;
    while (current <= end && count < 45) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const dowIndex = current.getDay();

      arr.push({
        date: new Date(current),
        key,
        dayOfWeek: dowNames[dowIndex],
        dateLabel: `${current.getDate()}/${current.getMonth() + 1}`,
        isWeekend: dowIndex === 0 || dowIndex === 6,
      });

      current.setDate(current.getDate() + 1);
      count++;
    }

    return arr;
  }, [startDateFilter, endDateFilter]);

  // Filtered vehicles
  const displayedVehicles = useMemo(() => {
    return vehiclesList.filter((v: any) => {
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        const plate = (v.licensePlate || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        const brand = (v.brand || '').toLowerCase();
        if (!plate.includes(q) && !name.includes(q) && !brand.includes(q)) {
          return false;
        }
      }

      if (vehicleFilter !== 'all') {
        const vId = String(v._id);
        const vPlate = String(v.licensePlate);
        if (vId !== vehicleFilter && vPlate !== vehicleFilter) {
          return false;
        }
      }

      if (vehicleTypeFilter !== 'all') {
        const t = (v.type || '').toLowerCase();
        if (vehicleTypeFilter === 'scooter' && !t.includes('scooter') && !t.includes('ga')) return false;
        if (vehicleTypeFilter === 'manual' && !t.includes('manual') && !t.includes('số')) return false;
        if (vehicleTypeFilter === 'car' && !t.includes('car') && !t.includes('oto') && !t.includes('ô tô')) return false;
      }

      return true;
    });
  }, [vehiclesList, searchInput, vehicleFilter, vehicleTypeFilter]);

  // Helper to check if a vehicle is booked on a specific day
  const getBookingForDay = (vehicle: any, dayKey: string) => {
    const vId = String(vehicle._id);
    const vPlate = vehicle.licensePlate;

    return timelineItems.find((item: any) => {
      const matchVehicle = (item.vehicleId && item.vehicleId === vId) || 
                           (item.licensePlate && vPlate && item.licensePlate.toLowerCase() === vPlate.toLowerCase());
      if (!matchVehicle) return false;

      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && item.status !== 'active') return false;
        if (statusFilter === 'pending' && item.status !== 'pending') return false;
        if (statusFilter === 'completed' && item.status !== 'completed') return false;
      }

      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

      return dayKey >= startKey && dayKey <= endKey;
    });
  };

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      
      {/* 1. Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
          Lịch đặt xe
        </h1>

        {/* Search Bar matching top right */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Tìm xe, khách, hợp đồng, tài xế..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              background: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#0f172a',
            }}
          />
        </div>
      </div>

      {/* 1.1 Alert Banner for Pending Bookings */}
      {pendingScheduleItems.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#d97706',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px',
              }}
            >
              CHỜ DUYỆT ({pendingScheduleItems.length})
            </span>
            <span style={{ fontSize: '13.5px', color: '#92400e', fontWeight: 600 }}>
              Có {pendingScheduleItems.length} xe đang có đơn khách đặt trước (ô màu cam). Bấm vào ô hoặc bấm nút bên phải để duyệt & ký số ngay!
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                if (pendingScheduleItems.length > 0) {
                  setApproveModal(pendingScheduleItems[0]);
                }
              }}
              style={{
                padding: '6px 14px',
                background: '#059669',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle style={{ width: '14px', height: '14px' }} />
              <span>Duyệt xe chờ duyệt ngay</span>
            </button>

            <Link
              href="/dashboard/bookings"
              style={{
                padding: '6px 14px',
                background: '#ffffff',
                color: '#b45309',
                border: '1px solid #fcd34d',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Xem DS Đặt xe →
            </Link>
          </div>
        </div>
      )}

      {/* 2. Filter Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          {/* Từ ngày */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Từ ngày</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                minWidth: '135px',
              }}
            />
          </div>

          {/* Đến ngày */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Đến ngày</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                minWidth: '135px',
              }}
            />
          </div>

          {/* Xe dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Xe</label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả xe</option>
              {vehiclesList.map((v: any) => (
                <option key={v._id} value={v._id}>
                  {v.licensePlate} ({v.name})
                </option>
              ))}
            </select>
          </div>

          {/* Loại xe */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Loại xe</label>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">-- Tất cả --</option>
              <option value="scooter">Xe tay ga</option>
              <option value="manual">Xe số</option>
              <option value="car">Ô tô</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">-- Tất cả --</option>
              <option value="active">Đang thuê</option>
              <option value="pending">Đặt trước</option>
              <option value="completed">Đã trả</option>
            </select>
          </div>

          {/* Buttons: Xem lịch & Xuất PDF */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] })}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 700,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <span>Xem lịch</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 700,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Schedule Timeline Gantt Grid */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              tableLayout: 'fixed',
              minWidth: `${228 + daysList.length * 36}px`,
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  rowSpan={2}
                  style={{
                    width: '48px',
                    padding: '12px 6px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#64748b',
                    borderRight: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2,
                  }}
                >
                  STT
                </th>
                <th
                  rowSpan={2}
                  style={{
                    width: '180px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 800,
                    color: '#1e293b',
                    borderRight: '1px solid #e2e8f0',
                    background: '#ffffff',
                    position: 'sticky',
                    left: '48px',
                    zIndex: 2,
                  }}
                >
                  Xe
                </th>

                {daysList.map((d) => {
                  const isSelected = d.key === selectedDayKey;
                  return (
                    <th
                      key={`dow-${d.key}`}
                      onClick={() => setSelectedDayKey(d.key)}
                      style={{
                        width: '36px',
                        padding: '6px 2px 2px 2px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: d.isWeekend ? '#b45309' : '#475569',
                        background: isSelected ? '#eff6ff' : (d.isWeekend ? '#fef9ee' : '#f8fafc'),
                        borderRight: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      title={d.key}
                    >
                      {d.dayOfWeek}
                    </th>
                  );
                })}
              </tr>

              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                {daysList.map((d) => {
                  const isSelected = d.key === selectedDayKey;
                  return (
                    <th
                      key={`date-${d.key}`}
                      onClick={() => setSelectedDayKey(d.key)}
                      style={{
                        padding: '2px 2px 6px 2px',
                        textAlign: 'center',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: d.isWeekend ? '#b45309' : '#64748b',
                        background: isSelected ? '#eff6ff' : (d.isWeekend ? '#fef9ee' : '#f8fafc'),
                        borderRight: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {d.dateLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {displayedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={daysList.length + 2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Không có xe nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                displayedVehicles.map((vehicle: any, idx: number) => {
                  return (
                    <tr key={vehicle._id} style={{ borderBottom: '1px solid #f1f5f9', height: '52px' }}>
                      <td
                        style={{
                          padding: '10px 6px',
                          textAlign: 'center',
                          fontWeight: 700,
                          color: '#64748b',
                          borderRight: '1px solid #e2e8f0',
                          background: '#ffffff',
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderRight: '1px solid #e2e8f0',
                          background: '#ffffff',
                          position: 'sticky',
                          left: '48px',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', lineHeight: 1.2 }}>
                          {vehicle.licensePlate}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                          {vehicle.name}
                        </div>
                      </td>

                      {daysList.map((d) => {
                        const booking = getBookingForDay(vehicle, d.key);
                        const isSelectedDay = d.key === selectedDayKey;

                        return (
                          <td
                            key={`${vehicle._id}-${d.key}`}
                            style={{
                              padding: '2px',
                              textAlign: 'center',
                              borderRight: '1px solid #e2e8f0',
                              background: d.isWeekend ? '#fefcf6' : '#ffffff',
                              verticalAlign: 'middle',
                              position: 'relative',
                            }}
                          >
                            {booking ? (
                              <div
                                onClick={() => setSelectedBookingDetail(booking)}
                                title={`${booking.customerName} (${booking.customerPhone}) - ${booking.code}`}
                                style={{
                                  width: '100%',
                                  height: '38px',
                                  borderRadius: '4px',
                                  background:
                                    booking.status === 'active'
                                      ? '#059669'
                                      : booking.status === 'confirmed'
                                      ? '#2563eb'
                                      : booking.status === 'completed'
                                      ? '#64748b'
                                      : '#d97706',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxSizing: 'border-box',
                                  transition: 'filter 0.15s ease',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
                                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                              />
                            ) : (
                              <div
                                onClick={() => {
                                  setQuickCreateModal({
                                    vehicleId: vehicle._id,
                                    vehiclePlate: vehicle.licensePlate,
                                    vehicleName: vehicle.name,
                                    startDate: d.key,
                                  });
                                  const nextDay = new Date(d.date);
                                  nextDay.setDate(nextDay.getDate() + 2);
                                  setNewEndDate(nextDay.toISOString().slice(0, 10));
                                  setNewPricePerDay(vehicle.pricePerDay || 800000);
                                }}
                                style={{
                                  width: '100%',
                                  height: '38px',
                                  cursor: 'pointer',
                                  border: isSelectedDay ? '2px solid #2563eb' : 'none',
                                  borderRadius: '2px',
                                  boxSizing: 'border-box',
                                  transition: 'background 0.12s ease',
                                }}
                                title="Bấm ô trống để tạo nhanh hợp đồng"
                                onMouseEnter={(e) => {
                                  if (!isSelectedDay) e.currentTarget.style.background = '#f1f5f9';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelectedDay) e.currentTarget.style.background = 'transparent';
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Legend below timeline */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          fontSize: '12px',
          color: '#334155',
          flexWrap: 'wrap',
          padding: '4px 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#059669' }} />
          <span>Đang thuê</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#2563eb' }} />
          <span>Đã duyệt (Đã đặt)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#d97706' }} />
          <span>Chờ duyệt</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#64748b' }} />
          <span>Đã trả</span>
        </div>

        <div style={{ color: '#64748b', fontStyle: 'italic', marginLeft: 'auto' }}>
          Bấm ô trống để tạo nhanh hợp đồng
        </div>
      </div>

      {/* 5. MODAL: TIMELINE BLOCK DETAILS */}
      {selectedBookingDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Thông tin xe & đơn đặt {selectedBookingDetail.code}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Đóng"
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Trạng thái:</span>
                {selectedBookingDetail.status === 'pending' ? (
                  <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#fef3c7', color: '#b45309', fontSize: '11.5px', fontWeight: 800 }}>
                    Chờ duyệt đơn
                  </span>
                ) : selectedBookingDetail.status === 'confirmed' ? (
                  <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11.5px', fontWeight: 800 }}>
                    Đã duyệt (Chờ giao xe)
                  </span>
                ) : selectedBookingDetail.status === 'active' ? (
                  <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#dcfce7', color: '#15803d', fontSize: '11.5px', fontWeight: 800 }}>
                    Đang thuê xe
                  </span>
                ) : (
                  <span style={{ padding: '3px 10px', borderRadius: '9999px', background: '#f1f5f9', color: '#475569', fontSize: '11.5px', fontWeight: 800 }}>
                    Đã trả hoàn tất
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Biển số xe:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{selectedBookingDetail.licensePlate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Khách hàng:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedBookingDetail.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Số điện thoại:</span>
                <span style={{ color: '#0f172a' }}>{selectedBookingDetail.customerPhone || '---'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Thời gian thuê:</span>
                <span style={{ color: '#0f172a' }}>
                  {new Date(selectedBookingDetail.startDate).toLocaleDateString('vi-VN')} &rarr;{' '}
                  {new Date(selectedBookingDetail.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#64748b' }}>Tổng tiền:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>
                  {Number(selectedBookingDetail.totalPrice || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                style={{ padding: '7px 18px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
              >
                Đóng
              </button>

              {selectedBookingDetail.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setApproveModal(selectedBookingDetail);
                      setSelectedBookingDetail(null);
                    }}
                    style={{
                      padding: '7px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      background: '#059669',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle style={{ width: '15px', height: '15px' }} />
                    <span>Duyệt đơn & Ký số ngay</span>
                  </button>

                  <Link
                    href="/dashboard/bookings"
                    style={{
                      padding: '7px 12px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                      color: '#1d4ed8',
                      textDecoration: 'none'
                    }}
                  >
                    Xem ở DS Đặt xe →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: DUYỆT ĐƠN & KÝ SỐ NGAY TRÊN LỊCH */}
      {approveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '560px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Duyệt xe & Ký số xác nhận đặt trước
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Mã đơn: {approveModal.code} — Xe: {approveModal.licensePlate}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Đóng"
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Khách hàng:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{approveModal.customerName} ({approveModal.customerPhone || '---'})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Thời gian thuê:</span>
                <span style={{ color: '#0f172a' }}>
                  {new Date(approveModal.startDate).toLocaleDateString('vi-VN')} &rarr;{' '}
                  {new Date(approveModal.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tổng tiền dự kiến:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>
                  {Number(approveModal.totalPrice || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Checkbox xác nhận tiền cọc */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                <input
                  type="checkbox"
                  checked={approveDepositConfirmed}
                  onChange={(e) => setApproveDepositConfirmed(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span>Đã kiểm tra & xác nhận khách hàng đặt cọc giữ xe</span>
              </label>
            </div>

            {/* Ghi chú */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Ghi chú duyệt đơn
              </label>
              <textarea
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Chữ ký số lễ tân */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Chữ ký số nhân viên / Lễ tân duyệt
                </label>
                <button
                  type="button"
                  onClick={clearScheduleCanvas}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Xóa ký lại
                </button>
              </div>
              <div style={{ border: '1px dashed #94a3b8', borderRadius: '6px', background: '#fafafa', position: 'relative' }}>
                <canvas
                  ref={staffScheduleCanvasRef}
                  width={500}
                  height={120}
                  onMouseDown={startDrawingSchedule}
                  onMouseMove={drawSchedule}
                  onMouseUp={stopDrawingSchedule}
                  onMouseLeave={stopDrawingSchedule}
                  onTouchStart={startDrawingSchedule}
                  onTouchMove={drawSchedule}
                  onTouchEnd={stopDrawingSchedule}
                  style={{ width: '100%', height: '120px', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                />
                {!hasDrawnScheduleSign && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94a3b8', fontSize: '12px' }}>
                    Ký số tại đây bằng chuột hoặc ngón tay
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  let sigData: string | undefined = undefined;
                  if (hasDrawnScheduleSign && staffScheduleCanvasRef.current) {
                    sigData = staffScheduleCanvasRef.current.toDataURL();
                  }
                  approveBookingMutation.mutate({
                    bookingId: approveModal._id,
                    note: approveNote,
                    depositConfirmed: approveDepositConfirmed,
                    staffSignature: sigData
                  });
                }}
                disabled={approveBookingMutation.isPending}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#059669',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check style={{ width: '14px', height: '14px' }} />
                <span>{approveBookingMutation.isPending ? 'Đang duyệt...' : 'Xác nhận duyệt & Đổi trạng thái Đã đặt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
