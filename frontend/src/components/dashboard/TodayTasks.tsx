'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Phone,
  Camera,
  FileText,
  X,
  CheckCircle,
  Calendar,
  Clock,
  Car,
  User as UserIcon,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface TodayTasksProps {
  standalone?: boolean;
}

export default function TodayTasks({ standalone = false }: TodayTasksProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overdue' | 'pickup' | 'return'>('overdue');

  // Modals state
  const [returnModalContract, setReturnModalContract] = useState<any | null>(null);
  const [handoverModalContract, setHandoverModalContract] = useState<any | null>(null);
  const [detailModalContract, setDetailModalContract] = useState<any | null>(null);
  const [imagesModalContract, setImagesModalContract] = useState<any | null>(null);

  // Return form state
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [returnOdometer, setReturnOdometer] = useState<number | string>('');
  const [returnExtraFee, setReturnExtraFee] = useState<number>(0);
  const [returnNote, setReturnNote] = useState('');

  // Handover form state
  const [handoverOdometer, setHandoverOdometer] = useState<number | string>('15000');
  const [handoverNote, setHandoverNote] = useState('Xe nguyên vẹn, đầy đủ phụ kiện và 2 mũ bảo hiểm');

  // Fetch real Contracts from DB
  const {
    data: contractsData,
    isLoading: contractsLoading,
    refetch: refetchContracts,
  } = useQuery({
    queryKey: ['contracts-today'],
    queryFn: async () => {
      try {
        const res = await api.get('/contracts');
        return res.data?.data || [];
      } catch (err: any) {
        console.error('Lỗi tải danh sách hợp đồng thật:', err);
        return [];
      }
    },
    refetchInterval: 10000,
  });

  // Fetch real Bookings from DB
  const {
    data: bookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['bookings-today'],
    queryFn: async () => {
      try {
        const res = await api.get('/bookings');
        return res.data?.data || [];
      } catch (err: any) {
        console.error('Lỗi tải danh sách đặt xe thật:', err);
        return [];
      }
    },
    refetchInterval: 10000,
  });

  // Format currency
  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return `${num.toLocaleString('vi-VN')} đ`;
  };

  // Format short date
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // Process REAL tasks
  const { overdueList, pickupList, returnList } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const contracts: any[] = Array.isArray(contractsData) ? contractsData : [];
    const bookings: any[] = Array.isArray(bookingsData) ? bookingsData : [];

    const overdue: any[] = [];
    const pickup: any[] = [];
    const toReturn: any[] = [];

    // 1. Process real contracts
    contracts.forEach((c) => {
      const end = c.endDate ? new Date(c.endDate) : null;
      const start = c.startDate ? new Date(c.startDate) : null;

      // Real Debt calculation
      const total = Number(c.totalPayable ?? c.totalRentalFee ?? 0);
      const paid = Number(c.paidAmount ?? 0);
      const deposit = Number(c.depositAmount ?? 0);
      const debt = Number(c.remainingDebt ?? Math.max(0, total - (paid + deposit)));

      // OVERDUE: Contract is active AND end date is in the past
      if (c.status === 'active' && end && end < now) {
        const diffMs = now.getTime() - end.getTime();
        const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
        overdue.push({
          ...c,
          taskType: 'overdue',
          overdueHours: diffHours,
          remainingDebt: debt,
        });
      }
      // DUE FOR RETURN: Contract is active AND end date is today or upcoming
      else if (c.status === 'active' && end && end >= now) {
        const isToday = end >= todayStart && end <= todayEnd;
        toReturn.push({
          ...c,
          taskType: 'return',
          isTodayReturn: isToday,
          remainingDebt: debt,
        });
      }
      // PENDING PICKUP / HANDOVER: Contract pending signature, draft, or not yet checked-in
      else if (
        ['pending_signature', 'draft'].includes(c.status) ||
        (c.status === 'active' && !c.checkInTime)
      ) {
        pickup.push({
          ...c,
          taskType: 'pickup',
          remainingDebt: debt,
        });
      }
    });

    // 2. Process real bookings waiting for vehicle handover (confirmed or pending)
    bookings.forEach((b) => {
      if (['pending', 'confirmed'].includes(b.status)) {
        // Only include if no contract has already been created for this booking
        const hasContract = contracts.some(
          (c) =>
            (c.booking?._id && String(c.booking._id) === String(b._id)) ||
            (c.booking && String(c.booking) === String(b._id)) ||
            (c.contractCode && b.contractCode && c.contractCode === b.contractCode)
        );

        if (!hasContract) {
          const finalPrice = Number(b.finalPrice ?? b.totalPrice ?? 0);
          const dep = Number(b.deposit ?? 0);
          pickup.push({
            _id: b._id,
            isBookingOnly: true,
            contractCode: b.bookingCode || `BK-${b._id.slice(-5).toUpperCase()}`,
            customerInfo: {
              fullName: b.customer?.fullName || b.customerName || 'Khách đặt xe',
              phone: b.customer?.phone || b.customerPhone || '0901234567',
              email: b.customer?.email,
            },
            vehicleInfo: {
              name: b.vehicle?.name || 'Phương tiện thuê',
              licensePlate: b.vehicle?.licensePlate || 'Chưa gắn biển',
              brand: b.vehicle?.brand || '',
              model: b.vehicle?.model || '',
            },
            startDate: b.startDate,
            endDate: b.endDate,
            totalPayable: finalPrice,
            remainingDebt: Math.max(0, finalPrice - dep),
            taskType: 'pickup',
            status: b.status,
          });
        }
      }
    });

    // Sort overdue by most overdue first
    overdue.sort((a, b) => (b.overdueHours || 0) - (a.overdueHours || 0));

    // Sort returns so today's returns are top
    toReturn.sort((a, b) => {
      if (a.isTodayReturn && !b.isTodayReturn) return -1;
      if (!a.isTodayReturn && b.isTodayReturn) return 1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });

    return { overdueList: overdue, pickupList: pickup, returnList: toReturn };
  }, [contractsData, bookingsData]);

  // Return vehicle mutation (calls real backend API)
  const returnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/contracts/${id}/return`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Nhận lại xe thành công! Hợp đồng đã hoàn tất.');
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReturnModalContract(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xác nhận trả xe');
    },
  });

  // Handover vehicle mutation (calls real backend API)
  const handoverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/contracts/${id}/checkin`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Bàn giao xe thành công! Xe đã được giao cho khách.');
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setHandoverModalContract(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể giao xe');
    },
  });

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      navigator.clipboard?.writeText(phone);
      toast.success(`Đã sao chép SĐT: ${phone}`);
    }
  };

  const currentDisplayList =
    activeTab === 'overdue' ? overdueList : activeTab === 'pickup' ? pickupList : returnList;

  const currentSectionTitle =
    activeTab === 'overdue'
      ? `Quá hạn chưa trả xe (${overdueList.length})`
      : activeTab === 'pickup'
      ? `Cần giao xe (${pickupList.length})`
      : `Cần nhận xe (${returnList.length})`;

  return (
    <div
      style={{
        padding: standalone ? '28px 36px' : '0',
        background: standalone ? '#f8fafc' : 'transparent',
        minHeight: standalone ? '100vh' : 'auto',
        color: '#0f172a',
        fontFamily: 'inherit',
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Việc hôm nay
          </h1>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              background: '#e0f2fe',
              color: '#0369a1',
              padding: '3px 10px',
              borderRadius: '9999px',
            }}
          >
            Dữ liệu thời gian thực
          </span>
        </div>

        <button
          onClick={() => {
            refetchContracts();
            refetchBookings();
            toast.success('Đã làm mới dữ liệu từ hệ thống');
          }}
          disabled={contractsLoading || bookingsLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '7px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw
            style={{
              width: '14px',
              height: '14px',
              animation: contractsLoading || bookingsLoading ? 'spin 1s linear infinite' : 'none',
            }}
          />
          Làm mới
        </button>
      </div>

      {/* 2. Top Summary Metric Cards (3 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: Cần giao xe */}
        <div
          onClick={() => setActiveTab('pickup')}
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            borderTop: activeTab === 'pickup' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderRight: activeTab === 'pickup' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderBottom: activeTab === 'pickup' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderLeft: '4px solid #1d4ed8',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow:
              activeTab === 'pickup'
                ? '0 4px 12px rgba(37, 99, 235, 0.12)'
                : '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            CẦN GIAO XE
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '8px 0 4px 0',
              lineHeight: 1.1,
            }}
          >
            {pickupList.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Hôm nay</div>
        </div>

        {/* Card 2: Cần nhận xe */}
        <div
          onClick={() => setActiveTab('return')}
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            borderTop: activeTab === 'return' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderRight: activeTab === 'return' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderBottom: activeTab === 'return' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderLeft: '4px solid #1d4ed8',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow:
              activeTab === 'return'
                ? '0 4px 12px rgba(37, 99, 235, 0.12)'
                : '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            CẦN NHẬN XE
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0f172a',
              margin: '8px 0 4px 0',
              lineHeight: 1.1,
            }}
          >
            {returnList.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Đến hạn trả</div>
        </div>

        {/* Card 3: Quá hạn */}
        <div
          onClick={() => setActiveTab('overdue')}
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            borderTop: activeTab === 'overdue' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            borderRight: activeTab === 'overdue' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            borderBottom: activeTab === 'overdue' ? '2px solid #ef4444' : '1px solid #e2e8f0',
            borderLeft: '4px solid #1d4ed8',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow:
              activeTab === 'overdue'
                ? '0 4px 12px rgba(239, 68, 68, 0.12)'
                : '0 1px 3px rgba(0,0,0,0.02)',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}
          >
            QUÁ HẠN
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: overdueList.length > 0 ? '#dc2626' : '#0f172a',
              margin: '8px 0 4px 0',
              lineHeight: 1.1,
            }}
          >
            {overdueList.length}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Chưa trả xe</div>
        </div>
      </div>

      {/* 3. Section Title */}
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
          }}
        >
          {currentSectionTitle}
        </h2>
      </div>

      {/* 4. List of REAL Task Cards */}
      {currentDisplayList.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '48px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <CheckCircle style={{ width: '40px', height: '40px', color: '#10b981', margin: '0 auto 10px' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
            Không có xe nào trong danh mục này
          </div>
          <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
            Toàn bộ dữ liệu phương tiện và hợp đồng trong mục này đã được xử lý xong.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentDisplayList.map((item: any, idx: number) => {
            const isOverdue = item.taskType === 'overdue';
            const isPickup = item.taskType === 'pickup';
            const isReturn = item.taskType === 'return';

            // Real data extraction
            const licensePlate =
              item.vehicleInfo?.licensePlate ||
              item.vehicle?.licensePlate ||
              'Chưa gắn biển';
            const vehicleName =
              item.vehicleInfo?.name ||
              item.vehicle?.name ||
              `${item.vehicleInfo?.brand || ''} ${item.vehicleInfo?.model || ''}`.trim() ||
              'Xe máy';
            const contractCode = item.contractCode || `HĐ-${String(idx + 1).padStart(4, '0')}`;
            const customerName =
              item.customerInfo?.fullName ||
              item.customer?.fullName ||
              'Khách hàng';
            const customerPhone =
              item.customerInfo?.phone || item.customer?.phone || '';
            const debt = Number(item.remainingDebt || 0);

            // Left stripe color
            const borderLeftColor = isOverdue ? '#ef4444' : isPickup ? '#2563eb' : '#10b981';

            // Overdue display text
            const overdueBadgeText =
              (item.overdueHours || 0) >= 48
                ? `Trễ ${Math.floor(item.overdueHours / 24)} ngày`
                : `Trễ ${item.overdueHours || 1} giờ`;

            return (
              <div
                key={item._id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '8px',
                  borderTop: '1px solid #e2e8f0',
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${borderLeftColor}`,
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                {/* Row 1: License Plate, Model, Badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '17px',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '-0.2px',
                        lineHeight: 1.2,
                      }}
                    >
                      {licensePlate}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#64748b',
                        marginTop: '3px',
                      }}
                    >
                      {vehicleName} • {contractCode}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isOverdue && (
                      <span
                        style={{
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fee2e2',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {overdueBadgeText}
                      </span>
                    )}
                    {isPickup && (
                      <span
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #dbeafe',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {item.isBookingOnly ? 'Đơn đặt mới' : 'Chờ giao xe'}
                      </span>
                    )}
                    {isReturn && (
                      <span
                        style={{
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #d1fae5',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {item.isTodayReturn ? 'Đến hạn trả hôm nay' : `Hạn trả: ${formatDate(item.endDate)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Customer Name, Phone */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {customerName}
                  </div>

                  {customerPhone ? (
                    <a
                      href={`tel:${customerPhone}`}
                      onClick={(e) => handleCopyPhone(customerPhone, e)}
                      title="Bấm để gọi hoặc sao chép SĐT"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#0f172a',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <Phone style={{ width: '13px', height: '13px', color: '#be185d' }} />
                      <span>{customerPhone}</span>
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Chưa có SĐT</span>
                  )}
                </div>

                {/* Row 3: Real Debt Info */}
                <div style={{ marginBottom: '18px' }}>
                  {debt > 0 ? (
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      Khách còn nợ {formatMoney(debt)}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#059669',
                      }}
                    >
                      Đã thanh toán đủ
                    </span>
                  )}
                </div>

                {/* Row 4: Action Buttons (3 Buttons) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                  }}
                >
                  {/* Button 1: Nhận lại xe OR Giao xe */}
                  {isPickup ? (
                    <button
                      onClick={() => {
                        setHandoverOdometer(item.vehicle?.odometer || item.checkInOdometer || 15000);
                        setHandoverModalContract(item);
                      }}
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      Giao xe
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setReturnDate(new Date().toISOString().slice(0, 16));
                        setReturnOdometer(
                          (item.checkInOdometer || 15000) + 120
                        );
                        setReturnExtraFee(item.remainingDebt || 0);
                        setReturnModalContract(item);
                      }}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '10px 14px',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      Nhận lại xe
                    </button>
                  )}

                  {/* Button 2: Chi tiết */}
                  <button
                    onClick={() => setDetailModalContract(item)}
                    style={{
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    Chi tiết
                  </button>

                  {/* Button 3: Ảnh xe */}
                  <button
                    onClick={() => setImagesModalContract(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: '#ffffff',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <Camera style={{ width: '15px', height: '15px', color: '#475569' }} />
                    Ảnh xe
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL 1: NHẬN LẠI XE (TRẢ XE & HOÀN TẤT)
          ======================================================== */}
      {returnModalContract && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setReturnModalContract(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Nhận lại xe: {returnModalContract.vehicleInfo?.licensePlate || 'Xe thuê'}
              </h3>
              <button
                onClick={() => setReturnModalContract(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                Hợp đồng: <strong>{returnModalContract.contractCode}</strong> • Khách:{' '}
                <strong>{returnModalContract.customerInfo?.fullName}</strong>
              </div>
              <div style={{ color: '#dc2626', fontWeight: 700 }}>
                Số tiền khách còn nợ:{' '}
                {formatMoney(returnModalContract.remainingDebt || 0)}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                returnMutation.mutate({
                  id: returnModalContract._id,
                  data: {
                    actualReturnDate: returnDate,
                    checkOutOdometer: returnOdometer ? Number(returnOdometer) : undefined,
                    returnNote: returnNote,
                    damageFee: Number(returnExtraFee) || 0,
                  },
                });
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Thời gian nhận xe thực tế *
                </label>
                <input
                  type="datetime-local"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Số km lúc nhận lại (km)
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 15450"
                    value={returnOdometer}
                    onChange={(e) => setReturnOdometer(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Thu tiền nợ & phụ phí (đ)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={returnExtraFee}
                    onChange={(e) => setReturnExtraFee(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Ghi chú kiểm tra xe lúc nhận lại
                </label>
                <textarea
                  rows={2}
                  placeholder="Xe sạch sẽ, phanh tốt, đã thanh toán đủ nợ..."
                  value={returnNote}
                  onChange={(e) => setReturnNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReturnModalContract(null)}
                  style={{
                    padding: '9px 16px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={returnMutation.isPending}
                  style={{
                    padding: '9px 20px',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {returnMutation.isPending ? 'Đang lưu...' : 'Xác nhận nhận lại xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: GIAO XE (BÀN GIAO CHO KHÁCH)
          ======================================================== */}
      {handoverModalContract && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setHandoverModalContract(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Bàn giao xe: {handoverModalContract.vehicleInfo?.licensePlate || 'Xe bàn giao'}
              </h3>
              <button
                onClick={() => setHandoverModalContract(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div
              style={{
                background: '#eff6ff',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #bfdbfe',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div>Khách nhận: <strong>{handoverModalContract.customerInfo?.fullName}</strong></div>
              <div>Số điện thoại: <strong>{handoverModalContract.customerInfo?.phone}</strong></div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handoverMutation.mutate({
                  id: handoverModalContract._id,
                  data: {
                    checkInOdometer: Number(handoverOdometer),
                    checkInNote: handoverNote,
                  },
                });
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Số km lúc bàn giao xe (km) *
                </label>
                <input
                  type="number"
                  value={handoverOdometer}
                  onChange={(e) => setHandoverOdometer(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Ghi chú bàn giao & phụ kiện đi kèm
                </label>
                <textarea
                  rows={2}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setHandoverModalContract(null)}
                  style={{
                    padding: '9px 16px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={handoverMutation.isPending}
                  style={{
                    padding: '9px 20px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {handoverMutation.isPending ? 'Đang lưu...' : 'Xác nhận giao xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: XEM CHI TIẾT
          ======================================================== */}
      {detailModalContract && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setDetailModalContract(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Hợp đồng: {detailModalContract.contractCode}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Biển số xe: {detailModalContract.vehicleInfo?.licensePlate || detailModalContract.vehicle?.licensePlate || '---'}
                </span>
              </div>
              <button
                onClick={() => setDetailModalContract(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              {/* Customer */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  👤 Khách hàng
                </div>
                <div>Họ và tên: <strong>{detailModalContract.customerInfo?.fullName || '---'}</strong></div>
                <div>Số điện thoại: <strong>{detailModalContract.customerInfo?.phone || '---'}</strong></div>
                {detailModalContract.customerInfo?.cccd && (
                  <div>CCCD: <strong>{detailModalContract.customerInfo.cccd}</strong></div>
                )}
                {detailModalContract.customerInfo?.address && (
                  <div>Địa chỉ: <strong>{detailModalContract.customerInfo.address}</strong></div>
                )}
              </div>

              {/* Vehicle */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  🏍️ Phương tiện thuê
                </div>
                <div>Tên xe: <strong>{detailModalContract.vehicleInfo?.name || detailModalContract.vehicle?.name || '---'}</strong></div>
                <div>Biển số: <strong>{detailModalContract.vehicleInfo?.licensePlate || detailModalContract.vehicle?.licensePlate || '---'}</strong></div>
                <div>Hãng xe: <strong>{detailModalContract.vehicleInfo?.brand || detailModalContract.vehicle?.brand || '---'}</strong></div>
              </div>

              {/* Schedule */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  📅 Thời gian thuê
                </div>
                <div>Bắt đầu: <strong>{formatDate(detailModalContract.startDate)}</strong></div>
                <div>Kết thúc: <strong>{formatDate(detailModalContract.endDate)}</strong></div>
                {detailModalContract.actualReturnDate && (
                  <div>Trả thực tế: <strong>{formatDate(detailModalContract.actualReturnDate)}</strong></div>
                )}
              </div>

              {/* Financials */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  💰 Tài chính & Công nợ
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>Tổng tiền thuê: <strong>{formatMoney(detailModalContract.totalPayable)}</strong></div>
                  <div>Tiền cọc: <strong>{formatMoney(detailModalContract.depositAmount)}</strong></div>
                  <div>Đã thanh toán: <strong>{formatMoney(detailModalContract.paidAmount)}</strong></div>
                  <div style={{ color: Number(detailModalContract.remainingDebt) > 0 ? '#dc2626' : '#059669' }}>
                    Khách còn nợ: <strong>{formatMoney(detailModalContract.remainingDebt)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setDetailModalContract(null)}
                style={{
                  padding: '9px 20px',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: ẢNH XE & BIÊN BẢN BÀN GIAO THỰC TẾ
          ======================================================== */}
      {imagesModalContract && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setImagesModalContract(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                Ảnh bàn giao xe: {imagesModalContract.vehicleInfo?.licensePlate || imagesModalContract.contractCode}
              </h3>
              <button
                onClick={() => setImagesModalContract(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Check-in images */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  1. Ảnh xe lúc bàn giao (Giao xe)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {imagesModalContract.checkInImages?.length > 0 ? (
                    imagesModalContract.checkInImages.map((img: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          height: '110px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        <img
                          src={img.url || img}
                          alt={`Ảnh bàn giao ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))
                  ) : imagesModalContract.vehicle?.mainImage ? (
                    <div
                      style={{
                        height: '110px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        overflow: 'hidden',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <img
                        src={imagesModalContract.vehicle.mainImage}
                        alt="Xe thực tế"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '24px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px dashed #cbd5e1',
                        gridColumn: '1 / -1',
                        fontSize: '12.5px',
                      }}
                    >
                      Chưa có hình ảnh bàn giao lúc nhận xe
                    </div>
                  )}
                </div>
              </div>

              {/* Check-out images if any */}
              {imagesModalContract.checkOutImages?.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    2. Ảnh xe lúc nhận lại (Trả xe)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {imagesModalContract.checkOutImages.map((img: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          height: '110px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        <img
                          src={img.url || img}
                          alt={`Ảnh nhận lại ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Odometer & Condition notes */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12.5px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    Số km bàn giao:{' '}
                    <strong>{imagesModalContract.checkInOdometer || 'Chưa ghi nhận'} {imagesModalContract.checkInOdometer ? 'km' : ''}</strong>
                  </div>
                  <div>
                    Số km lúc trả:{' '}
                    <strong>
                      {imagesModalContract.checkOutOdometer || 'Chưa trả xe'}{' '}
                      {imagesModalContract.checkOutOdometer ? 'km' : ''}
                    </strong>
                  </div>
                  <div>
                    Ghi chú giao:{' '}
                    <strong>{imagesModalContract.checkInNote || 'Không có ghi chú'}</strong>
                  </div>
                  <div>
                    Ghi chú trả: <strong>{imagesModalContract.checkOutNote || '---'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setImagesModalContract(null)}
                style={{
                  padding: '8px 18px',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
