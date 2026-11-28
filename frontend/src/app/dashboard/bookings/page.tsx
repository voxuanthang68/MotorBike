'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import VietQrPaymentBox, { QrSessionData } from '@/components/payment/VietQrPaymentBox';
import StandardRentalContractDocument, {
  buildStandardContractTerms,
  mapContractToStandardData,
} from '@/components/contract/StandardRentalContractDocument';
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
  CheckCircle,
  Filter,
  Download,
  Check,
  AlertCircle,
  PenTool,
  Copy,
  LayoutGrid,
  ListFilter,
  ShieldCheck,
  RotateCcw,
  Camera,
  Upload,
  Gauge,
  Fuel,
  ArrowRight
} from 'lucide-react';

export default function VehicleBookingSchedulePage() {
  const queryClient = useQueryClient();

  // View Switcher: 'list' (Duyệt & Quản lý đặt xe) vs 'timeline' (Lịch timeline)
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // Filter state for Booking List
  const [bookingListStatus, setBookingListStatus] = useState<string>('all');
  const [bookingListSearch, setBookingListSearch] = useState<string>('');

  // Search & Filter state for Timeline (dynamic around today)
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
  const [selectedDayKey, setSelectedDayKey] = useState(() => new Date().toISOString().slice(0, 10));

  // MODALS STATE
  // 1. Walk-in booking modal (Khách đến cửa hàng thuê xe / bấm ô trống Timeline)
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInCustomerMode, setWalkInCustomerMode] = useState<'walkin' | 'existing'>('walkin');
  const [walkInCustomerId, setWalkInCustomerId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInCccd, setWalkInCccd] = useState('');
  const [walkInLicense, setWalkInLicense] = useState('');
  const [walkInAddress, setWalkInAddress] = useState('');
  const [walkInVehicleId, setWalkInVehicleId] = useState('');
  const [walkInStartDate, setWalkInStartDate] = useState('');
  const [walkInEndDate, setWalkInEndDate] = useState('');
  const [walkInRentalType, setWalkInRentalType] = useState<'daily' | 'monthly'>('daily');
  const [walkInAccessories, setWalkInAccessories] = useState<string[]>([]);
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState<'cash' | 'qr' | 'bank_transfer'>('cash');
  const [walkInPaymentStatus, setWalkInPaymentStatus] = useState<'unpaid' | 'deposit_paid' | 'fully_paid'>('deposit_paid');
  const [walkInDeposit, setWalkInDeposit] = useState<number>(500000);
  const [walkInNote, setWalkInNote] = useState('');

  // 2. Timeline item detail
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<any | null>(null);

  // 3. FULL CONTRACT & E-SIGN MODAL (HIỂN THỊ TOÀN BỘ HỢP ĐỒNG & KÝ 2 BÊN)
  const [contractModal, setContractModal] = useState<{
    booking: any;
    contract?: any;
    customerSignature?: string | null;
    customerSignedAt?: string | null;
    staffSignature?: string | null;
    staffSignedAt?: string | null;
  } | null>(null);

  const contractStaffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingContractStaff, setIsDrawingContractStaff] = useState(false);
  const [hasDrawnContractStaff, setHasDrawnContractStaff] = useState(false);
  const contractCustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingContractCust, setIsDrawingContractCust] = useState(false);
  const [hasDrawnContractCust, setHasDrawnContractCust] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [isSubmittingContract, setIsSubmittingContract] = useState(false);

  // 3.5. APPROVE & SIGN MODAL (LỄ TÂN / ADMIN DUYỆT ĐƠN & KÝ SỐ)
  const [approveSignModal, setApproveSignModal] = useState<any | null>(null);
  const staffApproveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingStaffApprove, setIsDrawingStaffApprove] = useState(false);
  const [hasDrawnStaffApprove, setHasDrawnStaffApprove] = useState(false);
  const [approveNote, setApproveNote] = useState('Đã kiểm tra CCCD/GPLX, xác nhận đã nhận cọc');
  const [isDepositConfirmed, setIsDepositConfirmed] = useState(true);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);
  const [bookingQrModal, setBookingQrModal] = useState<any | null>(null);
  const [bookingQrMode, setBookingQrMode] = useState<'full' | 'deposit'>('full');

  // 4. HANDOVER MODAL (GIAO XE: ẢNH XE & CHỮ KÝ 2 BÊN)
  const [handoverModal, setHandoverModal] = useState<any | null>(null);
  const [handoverOdo, setHandoverOdo] = useState<number>(15200);
  const [handoverFuel, setHandoverFuel] = useState<string>('full');
  const [handoverNote, setHandoverNote] = useState<string>('Xe sạch sẽ, phanh tốt, xăng đầy vạch, kèm 2 mũ bảo hiểm');
  const [handoverImages, setHandoverImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80'
  ]);
  const handoverCustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const handoverStaffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasDrawnHandoverCust, setHasDrawnHandoverCust] = useState(false);
  const [hasDrawnHandoverStaff, setHasDrawnHandoverStaff] = useState(false);
  const [isDrawingHandoverCust, setIsDrawingHandoverCust] = useState(false);
  const [isDrawingHandoverStaff, setIsDrawingHandoverStaff] = useState(false);

  // 5. RETURN MODAL (TRẢ XE: ẢNH XE & CHỮ KÝ 2 BÊN)
  const [returnModal, setReturnModal] = useState<any | null>(null);
  const [returnOdo, setReturnOdo] = useState<number>(15480);
  const [returnFuel, setReturnFuel] = useState<string>('full');
  const [returnNote, setReturnNote] = useState<string>('Khách trả xe đúng hẹn, xe nguyên vẹn không trầy xước.');
  const [returnImages, setReturnImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'
  ]);
  const [lateFee, setLateFee] = useState<number>(0);
  const [damageFee, setDamageFee] = useState<number>(0);
  const [fuelFee, setFuelFee] = useState<number>(0);
  const returnCustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const returnStaffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasDrawnReturnCust, setHasDrawnReturnCust] = useState(false);
  const [hasDrawnReturnStaff, setHasDrawnReturnStaff] = useState(false);
  const [isDrawingReturnCust, setIsDrawingReturnCust] = useState(false);
  const [isDrawingReturnStaff, setIsDrawingReturnStaff] = useState(false);

  // 6. VIEW INSPECTION IMAGES & SIGNATURES MODAL
  const [viewHandoverImagesModal, setViewHandoverImagesModal] = useState<any | null>(null);

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

  // 3.5. Fetch customers list for walk-in booking selector
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers?limit=100');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Real vehicles & customers from API only
  const vehiclesList = useMemo(() => {
    return Array.isArray(vehiclesData) ? vehiclesData : [];
  }, [vehiclesData]);
  const customersList = useMemo(() => {
    return Array.isArray(customersData) ? customersData : [];
  }, [customersData]);

  const toLocalDateTimeInput = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const WALKIN_ACCESSORY_OPTIONS = [
    { id: 'helmet', name: 'Mũ bảo hiểm 3/4', price: 20000 },
    { id: 'raincoat', name: 'Áo mưa bộ', price: 15000 },
    { id: 'phone_holder', name: 'Giá đỡ điện thoại', price: 10000 },
  ];

  const openWalkInBookingModal = (preset?: { vehicleId?: string; startDateKey?: string }) => {
    const startDt = preset?.startDateKey ? new Date(`${preset.startDateKey}T08:00`) : new Date();
    const validStart = Number.isNaN(startDt.getTime()) ? new Date() : startDt;
    const endDt = new Date(validStart.getTime() + 86400000);

    const availableOrFirst =
      (preset?.vehicleId && vehiclesList.find((v: any) => v._id === preset.vehicleId)) ||
      vehiclesList.find((v: any) => v.status === 'available' && v.availability === 'available') ||
      vehiclesList[0];

    setWalkInCustomerMode('walkin');
    setWalkInCustomerId(customersList[0]?._id || '');
    setWalkInName('');
    setWalkInPhone('');
    setWalkInCccd('');
    setWalkInLicense('');
    setWalkInAddress('');
    setWalkInVehicleId(availableOrFirst?._id || '');
    setWalkInStartDate(toLocalDateTimeInput(validStart));
    setWalkInEndDate(toLocalDateTimeInput(endDt));
    setWalkInRentalType('daily');
    setWalkInAccessories([]);
    setWalkInPaymentMethod('cash');
    setWalkInPaymentStatus('deposit_paid');
    setWalkInDeposit(availableOrFirst?.deposit || 500000);
    setWalkInNote('');
    setWalkInModalOpen(true);
  };

  useEffect(() => {
    if (!walkInModalOpen) return;
    if (!walkInVehicleId && vehiclesList.length > 0) {
      const firstAvail = vehiclesList.find((v: any) => v.status === 'available') || vehiclesList[0];
      setWalkInVehicleId(firstAvail._id);
      setWalkInDeposit(firstAvail.deposit || 500000);
    }
    if (!walkInCustomerId && customersList.length > 0) {
      setWalkInCustomerId(customersList[0]._id);
    }
  }, [walkInModalOpen, vehiclesList, customersList, walkInVehicleId, walkInCustomerId]);

  // Clear legacy local override caches if present so reload always reflects real MongoDB data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('xtbike_local_contracts');
        localStorage.removeItem('xtbike_local_booking_status');
        localStorage.removeItem('xtbike_local_handover_data');
      } catch {}
    }
  }, []);

  // Real bookings combined strictly with live MongoDB contracts
  const allBookings = useMemo(() => {
    const base = Array.isArray(bookingsData) ? bookingsData : [];
    const liveContracts = Array.isArray(contractsData) ? contractsData : [];
    return base.map((b: any) => {
      const checkInImages = Array.isArray(b.checkInImages) ? b.checkInImages : [];
      const checkInSignature = b.checkInSignature || '';
      const checkInTime = b.checkInTime;
      const checkInOdometer = b.checkInOdometer || b.vehicle?.odometer || 0;
      const checkInNote = b.checkInNote || '';

      // Find linked contract from contractsData
      const linkedContract = liveContracts.find((c: any) => {
        const cBookingId = typeof c.booking === 'object' ? c.booking?._id : c.booking;
        return (cBookingId && String(cBookingId) === String(b._id)) ||
               (b.contractCode && c.contractCode === b.contractCode) ||
               (b.contractId && String(c._id) === String(b.contractId));
      });

      const contract = linkedContract || null;

      const hasContract = Boolean(
        b.contractCreated || 
        b.contractCode || 
        contract
      );

      const isCompleted = Boolean(
        b.status === 'completed' ||
        contract?.status === 'completed' ||
        Boolean(contract?.actualReturnDate) ||
        Boolean(contract?.checkOutTime) ||
        Boolean(b.checkOutTime)
      );

      const isHandoverDone = Boolean(
        b.status === 'active' ||
        Boolean(checkInTime) ||
        Boolean(checkInSignature) ||
        checkInImages.length > 0 ||
        (contract && (
          contract.status === 'active' ||
          Boolean(contract.checkInTime) ||
          Boolean(contract.checkInCustomerSignature) ||
          Boolean(contract.checkInStaffSignature) ||
          (contract.checkInImages && contract.checkInImages.length > 0)
        ))
      );

      let updatedStatus = b.status;
      if (isCompleted) {
        updatedStatus = 'completed';
      } else if (updatedStatus === 'cancelled' || contract?.status === 'cancelled' || contract?.status === 'terminated') {
        updatedStatus = 'cancelled';
      } else if (isHandoverDone) {
        updatedStatus = 'active';
      } else if (hasContract && updatedStatus === 'pending') {
        updatedStatus = 'confirmed';
      }

      return {
        ...b,
        status: updatedStatus,
        contractCreated: hasContract,
        contractCode: b.contractCode || contract?.contractCode,
        contractId: b.contractId || contract?._id,
        contractObj: contract,
        isHandoverDone,
        checkInImages,
        checkInSignature,
        checkInTime,
        checkInOdometer,
        checkInNote,
      };
    });
  }, [bookingsData, contractsData]);

  // Count pending bookings for alert badge
  const pendingCount = useMemo(() => {
    return allBookings.filter((b: any) => b.status === 'pending').length;
  }, [allBookings]);

  // Timeline items
  const timelineItems = useMemo(() => {
    return allBookings.map((b: any) => ({
      _id: b._id,
      code: b.contractCode || b.bookingCode || 'ĐX',
      vehicleId: String(b.vehicle?._id || b.vehicle),
      licensePlate: b.vehicle?.licensePlate,
      customerName: b.customer?.fullName || 'Khách hàng',
      customerPhone: b.customer?.phone || '',
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      totalPrice: b.finalPrice || b.totalPrice || 0,
      type: b.contractCode ? 'contract' : 'booking'
    }));
  }, [allBookings]);

  // Days list for Timeline
  const daysList = useMemo(() => {
    const start = new Date(startDateFilter);
    const end = new Date(endDateFilter);
    const arr: { date: Date; key: string; dayOfWeek: string; dateLabel: string; isWeekend: boolean }[] = [];
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return arr;

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

  // Filtered vehicles for Timeline
  const displayedVehicles = useMemo(() => {
    return vehiclesList.filter((v: any) => {
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        const plate = (v.licensePlate || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        if (!plate.includes(q) && !name.includes(q)) return false;
      }
      if (vehicleFilter !== 'all' && String(v._id) !== vehicleFilter && String(v.licensePlate) !== vehicleFilter) return false;
      return true;
    });
  }, [vehiclesList, searchInput, vehicleFilter]);

  // Filtered bookings for the List View
  const displayedBookingsList = useMemo(() => {
    return allBookings.filter((b: any) => {
      if (bookingListStatus !== 'all' && b.status !== bookingListStatus) return false;
      if (bookingListSearch.trim()) {
        const q = bookingListSearch.trim().toLowerCase();
        const code = (b.bookingCode || '').toLowerCase();
        const custName = (b.customer?.fullName || '').toLowerCase();
        const custPhone = (b.customer?.phone || '').toLowerCase();
        const plate = (b.vehicle?.licensePlate || '').toLowerCase();
        if (!code.includes(q) && !custName.includes(q) && !custPhone.includes(q) && !plate.includes(q)) return false;
      }
      return true;
    });
  }, [allBookings, bookingListStatus, bookingListSearch]);

  // ================= MUTATIONS =================
  // 0. ĐẶT XE TẠI CỬA HÀNG (KHÁCH ĐẾN THUÊ TRỰC TIẾP)
  const walkInBookingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/bookings', payload);
      return res.data?.data;
    },
    onSuccess: (createdBooking) => {
      toast.success(`Đã tạo đơn đặt xe tại cửa hàng ${createdBooking?.bookingCode || ''} thành công!`);
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setWalkInModalOpen(false);
      setBookingListStatus('all');
      if (createdBooking && createdBooking.paymentMethod === 'qr' && createdBooking.paymentStatus === 'unpaid') {
        setBookingQrMode('full');
        setBookingQrModal(createdBooking);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Không thể tạo đơn đặt xe tại cửa hàng.');
    }
  });

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInVehicleId) {
      toast.error('Vui lòng chọn xe cho khách!');
      return;
    }
    if (walkInCustomerMode === 'existing' && !walkInCustomerId) {
      toast.error('Vui lòng chọn khách hàng hoặc chuyển sang "Khách mới tại quầy"!');
      return;
    }
    if (walkInCustomerMode === 'walkin' && (!walkInName.trim() || !walkInPhone.trim())) {
      toast.error('Vui lòng nhập họ tên và số điện thoại khách thuê!');
      return;
    }

    const start = new Date(walkInStartDate);
    const end = new Date(walkInEndDate);
    if (!walkInStartDate || !walkInEndDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
      toast.error('Thời gian trả xe dự kiến phải sau thời gian nhận xe!');
      return;
    }

    const selectedAccessoryObjs = WALKIN_ACCESSORY_OPTIONS
      .filter((acc) => walkInAccessories.includes(acc.id))
      .map((acc) => ({ name: acc.name, price: acc.price }));

    walkInBookingMutation.mutate({
      bookingSource: 'walk_in',
      vehicleId: walkInVehicleId,
      customerId: walkInCustomerMode === 'existing' ? walkInCustomerId : undefined,
      customerName: walkInCustomerMode === 'walkin' ? walkInName.trim() : undefined,
      customerPhone: walkInCustomerMode === 'walkin' ? walkInPhone.trim() : undefined,
      customerCccd: walkInCccd.trim() || undefined,
      customerLicense: walkInLicense.trim() || undefined,
      customerAddress: walkInAddress.trim() || undefined,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      rentalType: walkInRentalType,
      accessories: selectedAccessoryObjs,
      paymentMethod: walkInPaymentMethod,
      paymentStatus: walkInPaymentStatus,
      deposit: Math.max(0, Number(walkInDeposit) || 0),
      pickupLocation: '128 Bạch Đằng, Hải Châu (Tại cửa hàng)',
      returnLocation: '128 Bạch Đằng, Hải Châu',
      customerNote: walkInNote.trim(),
      staffNote: 'Khách đến cửa hàng đặt thuê trực tiếp',
    });
  };

  // 1. DUYỆT ĐƠN ĐẶT XE & KÝ SỐ
  const approveBookingMutation = useMutation({
    mutationFn: async ({ bookingId, staffSignature, note }: { bookingId: string; staffSignature?: string; note?: string }) => {
      const res = await api.put(`/bookings/${bookingId}/status`, {
        status: 'confirmed',
        note: note || 'Đã kiểm tra và ký duyệt đơn',
        staffSignature
      });
      const b = allBookings.find((item: any) => item._id === bookingId);
      const contractId = b?.contractId || b?.contract?._id;
      if (contractId && staffSignature) {
        await api.put(`/contracts/${contractId}/sign`, { staffSignature }).catch(() => {});
      }
      return { success: true, bookingId, staffSignature, data: res.data };
    },
    onSuccess: () => {
      toast.success('Đã ký số và duyệt đơn đặt xe thành công! Đơn chuyển sang trạng thái Đã đặt (Chờ giao xe).');
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pending-bookings'] });
      setApproveSignModal(null);
      setHasDrawnStaffApprove(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi duyệt đơn đặt xe');
    }
  });

  // 2. TỪ CHỐI ĐƠN
  const rejectBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: 'cancelled', cancelReason: reason });
      return { success: true, bookingId, data: res.data };
    },
    onSuccess: () => {
      toast.success('Đã từ chối đơn đặt xe.');
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pending-bookings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn');
    }
  });

  // 3. TẠO HỢP ĐỒNG TỪ ĐƠN ĐÃ DUYỆT
  const createContractFromBookingMutation = useMutation({
    mutationFn: async (booking: any) => {
      const payload = {
        bookingId: booking._id,
        customerId: booking.customer?._id || booking.customer,
        vehicleId: booking.vehicle?._id || booking.vehicle,
        customerInfo: {
          fullName: booking.customer?.fullName || 'Khách hàng',
          phone: booking.customer?.phone || '',
          cccd: booking.customer?.cccd || '',
          email: booking.customer?.email || '',
          address: booking.customer?.address || '',
        },
        vehicleInfo: {
          name: booking.vehicle?.name || 'Xe thuê',
          licensePlate: booking.vehicle?.licensePlate || '',
          brand: booking.vehicle?.brand || '',
          model: booking.vehicle?.model || '',
          color: booking.vehicle?.color || '',
        },
        startDate: booking.startDate,
        endDate: booking.endDate,
        rentalDays: booking.totalDays || 1,
        pricePerDay: booking.pricePerDay || booking.vehicle?.pricePerDay || 0,
        totalRentalFee: booking.finalPrice || booking.totalPrice || 0,
        depositAmount: booking.deposit || 0,
        totalPayable: booking.finalPrice || booking.totalPrice || 0,
        paidAmount: 0,
        termsAndConditions: buildStandardContractTerms(mapContractToStandardData({}, booking)),
        status: 'pending_signature',
      };

      const res = await api.post('/contracts', payload);
      return { contract: res.data?.data, bookingId: booking._id };
    },
    onSuccess: ({ contract }) => {
      toast.success(`Đã tạo hợp đồng ${contract?.contractCode || ''} thành công! Hãy tiến hành bàn giao xe.`);
      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể tạo hợp đồng');
    }
  });

  // 4. HOÀN TẤT BÀN GIAO XE (Check-in với ảnh & chữ ký 2 bên)
  const handoverMutation = useMutation({
    mutationFn: async (payload: any) => {
      const hasRealContract = payload.contractId && payload.contractId !== payload.bookingId;
      let resData: any = null;
      if (hasRealContract) {
        const res = await api.put(`/contracts/${payload.contractId}/handover`, payload);
        resData = res.data;
      } else if (payload.bookingId) {
        const res = await api.put(`/bookings/${payload.bookingId}/status`, { status: 'active' });
        resData = res.data;
      }
      return { success: true, data: resData, contractId: payload.contractId, bookingId: payload.bookingId, payload };
    },
    onSuccess: () => {
      toast.success('Bàn giao xe thành công! Ảnh xe và chữ ký xác nhận của 2 bên đã được lưu. Xe chính thức lăn bánh.');
      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setHandoverModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi bàn giao xe');
    }
  });

  // 5. HOÀN TẤT NHẬN TRẢ XE (Check-out với ảnh & chữ ký 2 bên)
  const returnMutation = useMutation({
    mutationFn: async (payload: any) => {
      const hasRealContract = payload.contractId && payload.contractId !== payload.bookingId;
      let contractRes = null;
      if (hasRealContract) {
        contractRes = await api.put(`/contracts/${payload.contractId}/return`, payload);
      } else if (payload.bookingId) {
        contractRes = await api.put(`/bookings/${payload.bookingId}/status`, {
          status: 'completed',
          note: payload.checkOutNote || 'Khách đã trả xe hoàn tất'
        });
      }

      return {
        success: true,
        data: contractRes?.data,
        contractId: payload.contractId,
        bookingId: payload.bookingId,
        payload
      };
    },
    onSuccess: () => {
      toast.success('Nhận trả xe và thanh lý hợp đồng thành công! Xe đã trống và sẵn sàng tiếp tục cho thuê tiếp.');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReturnModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi trả xe');
    }
  });

  // ================= CANVAS DRAWING HELPERS =================
  const createDrawingHandlers = (
    ref: React.RefObject<HTMLCanvasElement | null>,
    isDrawingState: boolean,
    setIsDrawingState: (v: boolean) => void,
    setHasDrawnState: (v: boolean) => void
  ) => ({
    start: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width || canvas.width);
      const scaleY = canvas.height / (rect.height || canvas.height);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      ctx.beginPath();
      ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
      setIsDrawingState(true);
      setHasDrawnState(true);
    },
    draw: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawingState) return;
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width || canvas.width);
      const scaleY = canvas.height / (rect.height || canvas.height);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a';
      ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
      ctx.stroke();
    },
    stop: () => setIsDrawingState(false),
    clear: () => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawnState(false);
    }
  });

  const staffApproveDraw = createDrawingHandlers(staffApproveCanvasRef, isDrawingStaffApprove, setIsDrawingStaffApprove, setHasDrawnStaffApprove);
  const handoverCustDraw = createDrawingHandlers(handoverCustCanvasRef, isDrawingHandoverCust, setIsDrawingHandoverCust, setHasDrawnHandoverCust);
  const handoverStaffDraw = createDrawingHandlers(handoverStaffCanvasRef, isDrawingHandoverStaff, setIsDrawingHandoverStaff, setHasDrawnHandoverStaff);
  const returnCustDraw = createDrawingHandlers(returnCustCanvasRef, isDrawingReturnCust, setIsDrawingReturnCust, setHasDrawnReturnCust);
  const returnStaffDraw = createDrawingHandlers(returnStaffCanvasRef, isDrawingReturnStaff, setIsDrawingReturnStaff, setHasDrawnReturnStaff);
  const contractStaffDraw = createDrawingHandlers(contractStaffCanvasRef, isDrawingContractStaff, setIsDrawingContractStaff, setHasDrawnContractStaff);
  const contractCustDraw = createDrawingHandlers(contractCustCanvasRef, isDrawingContractCust, setIsDrawingContractCust, setHasDrawnContractCust);

  const generateCustomerSignature = (name: string, code: string) => {
    const safeName = (name || 'Khách hàng').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeCode = (code || 'BK').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="90" viewBox="0 0 280 90">
      <rect width="100%" height="100%" fill="none"/>
      <path d="M 25 55 Q 55 20, 85 50 T 145 42 T 205 52 T 255 35" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 30 65 Q 110 72, 230 60" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
      <text x="35" y="48" font-family="'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif" font-size="26" font-style="italic" fill="#0369a1" font-weight="bold">${safeName}</text>
      <text x="30" y="82" font-family="sans-serif" font-size="9" fill="#0284c7" font-weight="600">✓ Đã ký số OTP khi đặt cọc trực tuyến</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const generateStaffSignature = (name: string) => {
    const safeName = (name || 'Đại diện XTBike').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="90" viewBox="0 0 280 90">
      <rect width="100%" height="100%" fill="none"/>
      <path d="M 20 50 Q 60 15, 100 45 T 160 38 T 220 50" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 35 68 Q 120 72, 245 62" fill="none" stroke="#34d399" stroke-width="1.8" stroke-linecap="round"/>
      <text x="35" y="46" font-family="'Brush Script MT', 'Dancing Script', 'Segoe Script', cursive, sans-serif" font-size="26" font-style="italic" fill="#047857" font-weight="bold">${safeName}</text>
      <text x="30" y="82" font-family="sans-serif" font-size="9" fill="#059669" font-weight="600">✓ Xác thực ký số Đại diện Bên Cho Thuê</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleOpenContractModal = (booking: any) => {
    const linkedContract = contractsData?.find((c: any) => {
      const cBookingId = typeof c.booking === 'object' ? c.booking?._id : c.booking;
      return (cBookingId && String(cBookingId) === String(booking._id)) ||
             (booking.contractCode && c.contractCode === booking.contractCode) ||
             (booking.contractId && String(c._id) === String(booking.contractId));
    });

    const contract = linkedContract || booking.contractObj;
    const realCustomerSig = contract?.customerSignature || booking.customerSignature || booking.checkInCustomerSignature || null;

    setContractModal({
      booking,
      contract,
      customerSignature: realCustomerSig,
      customerSignedAt: realCustomerSig ? (contract?.customerSignedAt || booking.createdAt || new Date().toISOString()) : null,
      staffSignature: contract?.staffSignature || null,
      staffSignedAt: contract?.staffSignedAt || null,
    });
    setHasDrawnContractStaff(Boolean(contract?.staffSignature));
    setHasDrawnContractCust(Boolean(realCustomerSig));
    setContractError(null);
  };

  const handleSignAndConfirmContract = async () => {
    if (!contractModal) return;
    const { booking, contract, customerSignature, customerSignedAt } = contractModal;
    setContractError(null);

    let staffSig = contractModal.staffSignature;
    if (!staffSig) {
      if (hasDrawnContractStaff && contractStaffCanvasRef.current) {
        staffSig = contractStaffCanvasRef.current.toDataURL('image/png');
      } else {
        const msg = 'Vui lòng ký xác nhận Đại diện cửa hàng (Bên A) hoặc chọn "Dùng chữ ký số mặc định"!';
        setContractError(msg);
        toast.error(msg);
        return;
      }
    }

    let custSig = customerSignature || null;
    if (!custSig) {
      if (hasDrawnContractCust && contractCustCanvasRef.current) {
        custSig = contractCustCanvasRef.current.toDataURL('image/png');
      } else {
        const msg = 'Vui lòng yêu cầu Khách hàng (Bên B) ký xác nhận vào khung chữ ký trước khi hoàn tất hợp đồng!';
        setContractError(msg);
        toast.error(msg);
        return;
      }
    }

    setIsSubmittingContract(true);
    try {
      const payload = {
        bookingId: booking._id,
        customerId: booking.customer?._id || booking.customer,
        vehicleId: booking.vehicle?._id || booking.vehicle,
        customerInfo: {
          fullName: booking.customer?.fullName || booking.customerInfo?.fullName || 'Khách hàng',
          phone: booking.customer?.phone || booking.customerInfo?.phone || '0901234567',
          cccd: booking.customer?.cccd || booking.customerInfo?.cccd || '',
          drivingLicense: booking.customer?.drivingLicense || booking.customerInfo?.drivingLicense || '',
          drivingLicenseClass: booking.customer?.drivingLicenseClass || booking.customerInfo?.drivingLicenseClass || '',
          email: booking.customer?.email || booking.customerInfo?.email || '',
          address: booking.customer?.address || booking.customerInfo?.address || 'TP. Đà Nẵng',
        },
        vehicleInfo: {
          name: booking.vehicle?.name || booking.vehicleInfo?.name || 'Xe thuê',
          licensePlate: booking.vehicle?.licensePlate || booking.vehicleInfo?.licensePlate || '43A-123.45',
          brand: booking.vehicle?.brand || booking.vehicleInfo?.brand || '',
          model: booking.vehicle?.model || booking.vehicleInfo?.model || '',
          type: booking.vehicle?.type || booking.vehicleInfo?.type || '',
          color: booking.vehicle?.color || booking.vehicleInfo?.color || '',
          engineNumber: booking.vehicle?.engineCC ? `${booking.vehicle.engineCC}cc` : (booking.vehicleInfo?.engineNumber || ''),
        },
        startDate: booking.startDate,
        endDate: booking.endDate,
        rentalDays: booking.totalDays || 1,
        pricePerDay: booking.pricePerDay || booking.vehicle?.pricePerDay || 0,
        totalRentalFee: booking.finalPrice || booking.totalPrice || 0,
        depositAmount: booking.deposit || 0,
        totalPayable: booking.finalPrice || booking.totalPrice || 0,
        paidAmount: booking.paymentStatus === 'fully_paid'
          ? (booking.finalPrice || booking.totalPrice || 0)
          : (booking.paymentStatus === 'deposit_paid' ? (booking.deposit || 0) : 0),
        paymentMethod: booking.paymentMethod || 'cash',
        customerSignature: custSig,
        customerSignedAt: customerSignedAt || new Date().toISOString(),
        staffSignature: staffSig,
        staffSignedAt: new Date().toISOString(),
        termsAndConditions: buildStandardContractTerms(mapContractToStandardData({}, booking)),
        status: 'confirmed',
      };

      let resultContract: any = null;

      if (contract?._id && !String(contract._id).startsWith('contract-')) {
        const res = await api.put(`/contracts/${contract._id}/sign`, {
          staffSignature: staffSig,
          customerSignature: custSig,
        });
        resultContract = res.data?.data;
      }

      if (!resultContract) {
        const res = await api.post('/contracts', payload);
        resultContract = res.data?.data;
      }

      toast.success(`Đã ký xác nhận hợp đồng ${resultContract?.contractCode || ''} thành công! Đã sẵn sàng bàn giao xe.`);

      queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts-today'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      setContractModal(null);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.message || 'Có lỗi khi xác nhận hợp đồng';
      setContractError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmittingContract(false);
    }
  };

  const getBookingForDay = (vehicle: any, dayKey: string) => {
    const vId = String(vehicle._id);
    const vPlate = vehicle.licensePlate;
    return timelineItems.find((item: any) => {
      const matchVehicle = (item.vehicleId && item.vehicleId === vId) || 
                           (item.licensePlate && vPlate && item.licensePlate.toLowerCase() === vPlate.toLowerCase());
      if (!matchVehicle) return false;
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);
      const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      return dayKey >= startKey && dayKey <= endKey;
    });
  };

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      
      {/* 1. Header with Tab Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            {viewMode === 'list' ? 'Quản lý đặt xe & Duyệt đơn' : 'Lịch đặt xe (Timeline)'}
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Quy trình khép kín: Khách đặt &rarr; Duyệt đơn &rarr; Tạo hợp đồng &rarr; Giao xe (ảnh + ký 2 bên) &rarr; Trả xe (ảnh + ký 2 bên)
          </div>
        </div>

        {/* Actions & View Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openWalkInBookingModal()}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#2563eb',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Đặt xe tại cửa hàng</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'list' ? '#0f172a' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : '#64748b',
            }}
          >
            <ListFilter style={{ width: '15px', height: '15px' }} />
            <span>Danh sách đặt xe</span>
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '1px 6px', borderRadius: '9999px' }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: viewMode === 'timeline' ? '#0f172a' : 'transparent',
              color: viewMode === 'timeline' ? '#ffffff' : '#64748b',
            }}
          >
            <Calendar style={{ width: '15px', height: '15px' }} />
            <span>Lịch timeline</span>
          </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          VIEW MODE 1: BOOKING MANAGEMENT & WORKFLOW LIST
          ======================================================== */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Workflow Steps Indicator Card */}
          <div style={{ background: '#ffffff', padding: '14px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#b45309' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '9999px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
              <span>Khách đặt xe &rarr; Chờ duyệt</span>
            </div>
            <ArrowRight style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1d4ed8' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '9999px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
              <span>Duyệt đơn & Tạo hợp đồng</span>
            </div>
            <ArrowRight style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#059669' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '9999px', background: '#dcfce7', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
              <span>Giao xe: Ảnh + 2 bên ký</span>
            </div>
            <ArrowRight style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#475569' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '9999px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</div>
              <span>Trả xe: Ảnh + 2 bên ký hoàn tất</span>
            </div>
          </div>

          {/* Status Quick Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả đơn', count: allBookings.length, bg: '#ffffff', color: '#0f172a' },
              { id: 'pending', label: '1. Chờ duyệt', count: allBookings.filter((b: any) => b.status === 'pending').length, bg: '#fef3c7', color: '#b45309' },
              { id: 'confirmed', label: '2. Đã duyệt (Chờ tạo HĐ / Giao xe)', count: allBookings.filter((b: any) => b.status === 'confirmed').length, bg: '#eff6ff', color: '#1d4ed8' },
              { id: 'active', label: '3. Đang thuê (Chờ trả xe)', count: allBookings.filter((b: any) => b.status === 'active').length, bg: '#dcfce7', color: '#15803d' },
              { id: 'completed', label: '4. Đã hoàn thành', count: allBookings.filter((b: any) => b.status === 'completed').length, bg: '#f1f5f9', color: '#475569' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setBookingListStatus(st.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: bookingListStatus === st.id ? '2px solid #0f172a' : '1px solid #cbd5e1',
                  background: st.bg,
                  color: st.color,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{st.label}</span>
                <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '9999px', background: 'rgba(0,0,0,0.06)' }}>
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar for Bookings List */}
          <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách hàng, số điện thoại, biển số xe..."
                value={bookingListSearch}
                onChange={(e) => setBookingListSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Bookings Table */}
          <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                    <th style={{ padding: '14px 12px', textAlign: 'center', width: '52px' }}>STT</th>
                    <th style={{ padding: '14px 18px' }}>Mã đặt xe</th>
                    <th style={{ padding: '14px 18px' }}>Khách hàng</th>
                    <th style={{ padding: '14px 18px' }}>Xe thuê</th>
                    <th style={{ padding: '14px 18px' }}>Thời gian</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Tổng tiền & Cọc</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>Hợp đồng & Biên bản</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao tác nghiệp vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedBookingsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                        <FileText style={{ width: '36px', height: '36px', color: '#cbd5e1', margin: '0 auto 8px' }} />
                        <div>Không có đơn đặt xe nào.</div>
                      </td>
                    </tr>
                  ) : (
                    displayedBookingsList.map((booking: any, idx: number) => {
                      const isPending = booking.status === 'pending';
                      const isConfirmed = booking.status === 'confirmed';
                      const isActive = booking.status === 'active';
                      const isCompleted = booking.status === 'completed';
                      const hasContract = booking.contractCreated || booking.contractCode;

                      return (
                        <tr
                          key={booking._id}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                        >
                          {/* STT */}
                          <td style={{ padding: '14px 12px', verticalAlign: 'top', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                            {idx + 1}
                          </td>

                          {/* Mã đơn */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {booking.bookingCode || `BK-${booking._id.slice(-4).toUpperCase()}`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {booking.bookingSource === 'walk_in' ? 'Tại quầy' : 'Trực tuyến'}
                            </div>
                          </td>

                          {/* Khách hàng */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {booking.customer?.fullName || 'Khách lẻ'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {booking.customer?.phone || '---'}
                            </div>
                            {booking.customer?.cccd && (
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>CCCD: {booking.customer.cccd}</div>
                            )}
                          </td>

                          {/* Xe thuê */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {booking.vehicle?.licensePlate || 'Chưa gán xe'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              {booking.vehicle?.name || '---'}
                            </div>
                          </td>

                          {/* Thời gian */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                            <div>
                              {new Date(booking.startDate).toLocaleDateString('vi-VN')} &rarr;{' '}
                              {new Date(booking.endDate).toLocaleDateString('vi-VN')}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              ({booking.totalDays || 1} ngày)
                            </div>
                          </td>

                          {/* Tổng tiền & Cọc */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>
                              {Number(booking.finalPrice || booking.totalPrice || 0).toLocaleString('vi-VN')} đ
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                              Cọc: {Number(booking.deposit || 0).toLocaleString('vi-VN')} đ
                            </div>
                          </td>

                          {/* Trạng thái */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'center' }}>
                            {isPending ? (
                              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fef3c7', color: '#b45309' }}>
                                Chờ duyệt đơn
                              </span>
                            ) : isConfirmed ? (
                              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8' }}>
                                Đã duyệt (Chờ giao xe)
                              </span>
                            ) : isActive ? (
                              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                                Đang thuê
                              </span>
                            ) : isCompleted ? (
                              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#f1f5f9', color: '#475569' }}>
                                Hoàn tất
                              </span>
                            ) : (
                              <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}>
                                Đã hủy
                              </span>
                            )}
                            <div style={{ marginTop: '5px' }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  background:
                                    booking.paymentStatus === 'fully_paid'
                                      ? '#dcfce7'
                                      : booking.paymentStatus === 'deposit_paid'
                                        ? '#dbeafe'
                                        : '#fff7ed',
                                  color:
                                    booking.paymentStatus === 'fully_paid'
                                      ? '#15803d'
                                      : booking.paymentStatus === 'deposit_paid'
                                        ? '#1d4ed8'
                                        : '#c2410c',
                                }}
                              >
                                {booking.paymentStatus === 'fully_paid'
                                  ? 'Đã thanh toán đủ'
                                  : booking.paymentStatus === 'deposit_paid'
                                    ? 'Đã cọc'
                                    : 'Chưa thanh toán'}
                              </span>
                            </div>
                          </td>

                          {/* Hợp đồng & Biên bản */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'center' }}>
                            {hasContract ? (
                              <div>
                                <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                                  Đã tạo HĐ
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenContractModal(booking)}
                                  style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}
                                >
                                  Xem HĐ ({booking.contractCode || 'Chi tiết'})
                                </button>
                                {(booking.checkInImages?.length > 0 || booking.checkInSignature) && (
                                  <button
                                    type="button"
                                    onClick={() => setViewHandoverImagesModal(booking)}
                                    style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#1d4ed8', fontSize: '11px', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                                  >
                                    Xem ảnh bàn giao
                                  </button>
                                )}
                              </div>
                            ) : isPending ? (
                              <span style={{ fontSize: '11px', color: '#b45309', fontStyle: 'italic' }}>
                                Chờ duyệt trước khi tạo HĐ
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenContractModal(booking)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontSize: '11.5px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  textDecoration: 'underline'
                                }}
                              >
                                Chưa lập HĐ (Bấm tạo)
                              </button>
                            )}
                          </td>

                          {/* Thao tác nghiệp vụ chuẩn quy trình */}
                          <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', fontSize: '12px', fontWeight: 700 }}>
                              
                              {/* NÚT TẠO MÃ VIETQR THEO ĐÚNG SỐ TIỀN ĐẶT XE (GỒM PHỤ KIỆN) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingQrMode('full');
                                  setBookingQrModal(booking);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '4px',
                                  background: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Mã VietQR theo đúng số tiền đặt xe (gồm phụ kiện)"
                              >
                                <span>📱 QR</span>
                              </button>
                              
                              {/* BƯỚC 1: DUYỆT ĐƠN (Chỉ khi đơn là pending) */}
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setApproveSignModal(booking)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      background: '#059669',
                                      color: '#ffffff',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Check style={{ width: '13px', height: '13px' }} />
                                    <span>Duyệt & Ký số</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const reason = window.prompt('Nhập lý do từ chối:');
                                      if (reason !== null) rejectBookingMutation.mutate({ bookingId: booking._id, reason });
                                    }}
                                    style={{
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      background: '#ffffff',
                                      color: '#dc2626',
                                      border: '1px solid #fca5a5',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}

                              {/* BƯỚC 2: TẠO HỢP ĐỒNG (Chỉ khi đã duyệt confirmed và chưa có HĐ) */}
                              {isConfirmed && !hasContract && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenContractModal(booking)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    background: '#2563eb',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <FileText style={{ width: '13px', height: '13px' }} />
                                  <span>Tạo HĐ</span>
                                </button>
                              )}

                              {/* XEM HỢP ĐỒNG (Khi đã có HĐ) */}
                              {hasContract && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenContractModal(booking)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #bfdbfe',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Xem toàn bộ hợp đồng & chữ ký 2 bên"
                                >
                                  <FileText style={{ width: '13px', height: '13px' }} />
                                  <span>Xem HĐ</span>
                                </button>
                              )}

                              {/* BƯỚC 3: GIAO XE (Ảnh xe + 2 bên ký xác nhận bàn giao) */}
                              {isConfirmed && !booking.isHandoverDone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHandoverImages(booking.vehicle?.mainImage ? [booking.vehicle.mainImage] : []);
                                    setHasDrawnHandoverCust(false);
                                    setHasDrawnHandoverStaff(false);
                                    setHandoverOdo(Number(booking.vehicle?.odometer || 0));
                                    setHandoverFuel('full');
                                    setHandoverNote('Xe sạch sẽ, phanh tốt, xăng đầy vạch, kèm 2 mũ bảo hiểm');
                                    setHandoverModal({
                                      contractId: booking.contractId || booking._id,
                                      bookingId: booking._id,
                                      vehiclePlate: booking.vehicle?.licensePlate || '',
                                      vehicleName: booking.vehicle?.name || '',
                                      customerName: booking.customer?.fullName || 'Khách hàng',
                                      customerPhone: booking.customer?.phone || '',
                                      pricePerDay: booking.pricePerDay || 0,
                                      deposit: booking.deposit || 0,
                                    });
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Camera style={{ width: '13px', height: '13px' }} />
                                  <span>Giao xe (Ảnh & Ký)</span>
                                </button>
                              )}

                              {/* BƯỚC 4: TRẢ XE (Ảnh xe lúc trả + 2 bên ký hoàn tất) */}
                              {isActive && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Reset return form state
                                    setReturnImages([]);
                                    setReturnOdo(Number(booking.checkInOdometer || booking.vehicle?.odometer || 0));
                                    setReturnFuel('full');
                                    setReturnNote('Khách trả xe đúng hẹn, xe nguyên vẹn không trầy xước.');
                                    setLateFee(0);
                                    setDamageFee(0);
                                    setFuelFee(0);
                                    setHasDrawnReturnCust(false);
                                    setHasDrawnReturnStaff(false);
                                    setIsPaymentConfirmed(true);
                                    setReturnModal({
                                      contractId: booking.contractId || booking._id,
                                      bookingId: booking._id,
                                      vehiclePlate: booking.vehicle?.licensePlate || '',
                                      vehicleName: booking.vehicle?.name || '',
                                      customerName: booking.customer?.fullName || 'Khách hàng',
                                      customerPhone: booking.customer?.phone || '',
                                      totalPayable: booking.finalPrice || booking.totalPrice || 0,
                                      deposit: Number(booking.deposit || 0),
                                      checkInOdometer: Number(booking.checkInOdometer || booking.vehicle?.odometer || 0),
                                      checkInNote: booking.checkInNote || '',
                                      checkInImages: Array.isArray(booking.checkInImages) ? booking.checkInImages : [],
                                    });
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    background: '#1d4ed8',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <RotateCcw style={{ width: '13px', height: '13px' }} />
                                  <span>Trả xe (Ảnh & Ký)</span>
                                </button>
                              )}

                              {/* Xem ảnh biên bản */}
                              {(isActive || isCompleted) && booking.checkInImages?.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setViewHandoverImagesModal(booking)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '4px',
                                    background: '#ffffff',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Ảnh BB
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW MODE 2: TIMELINE GANTT CHART
          ======================================================== */}
      {viewMode === 'timeline' && (
        <>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Từ ngày</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Đến ngày</label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Xe</label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  style={{ padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">Tất cả xe</option>
                  {vehiclesList.map((v: any) => (
                    <option key={v._id} value={v._id}>{v.licensePlate} ({v.name})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] })}
                  style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', cursor: 'pointer' }}
                >
                  Xem lịch
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 700, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', cursor: 'pointer' }}
                >
                  Xuất PDF
                </button>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed', minWidth: `${228 + daysList.length * 36}px` }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th rowSpan={2} style={{ width: '48px', padding: '12px 6px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#64748b', borderRight: '1px solid #e2e8f0', background: '#f8fafc', position: 'sticky', left: 0, zIndex: 2 }}>STT</th>
                    <th rowSpan={2} style={{ width: '180px', padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#1e293b', borderRight: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', left: '48px', zIndex: 2 }}>Xe</th>
                    {daysList.map((d) => (
                      <th
                        key={`dow-${d.key}`}
                        onClick={() => setSelectedDayKey(d.key)}
                        style={{ width: '36px', padding: '6px 2px 2px 2px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: d.isWeekend ? '#b45309' : '#475569', background: d.key === selectedDayKey ? '#eff6ff' : (d.isWeekend ? '#fef9ee' : '#f8fafc'), borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
                      >
                        {d.dayOfWeek}
                      </th>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    {daysList.map((d) => (
                      <th
                        key={`date-${d.key}`}
                        onClick={() => setSelectedDayKey(d.key)}
                        style={{ padding: '2px 2px 6px 2px', textAlign: 'center', fontSize: '10.5px', fontWeight: 600, color: d.isWeekend ? '#b45309' : '#64748b', background: d.key === selectedDayKey ? '#eff6ff' : (d.isWeekend ? '#fef9ee' : '#f8fafc'), borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
                      >
                        {d.dateLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedVehicles.map((vehicle: any, idx: number) => (
                    <tr key={vehicle._id} style={{ borderBottom: '1px solid #f1f5f9', height: '52px' }}>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: 700, color: '#64748b', borderRight: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', left: 0, zIndex: 1 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 16px', borderRight: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', left: '48px', zIndex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', lineHeight: 1.2 }}>{vehicle.licensePlate}</div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>{vehicle.name}</div>
                      </td>
                      {daysList.map((d) => {
                        const booking = getBookingForDay(vehicle, d.key);
                        const isSelectedDay = d.key === selectedDayKey;
                        return (
                          <td key={`${vehicle._id}-${d.key}`} style={{ padding: '2px', textAlign: 'center', borderRight: '1px solid #e2e8f0', background: d.isWeekend ? '#fefcf6' : '#ffffff', verticalAlign: 'middle' }}>
                            {booking ? (
                              <div
                                onClick={() => setSelectedBookingDetail(booking)}
                                style={{ width: '100%', height: '38px', borderRadius: '4px', background: booking.status === 'active' ? '#059669' : booking.status === 'completed' ? '#64748b' : '#d97706', cursor: 'pointer' }}
                              />
                            ) : (
                              <div
                                onClick={() => openWalkInBookingModal({ vehicleId: vehicle._id, startDateKey: d.key })}
                                title={`Đặt xe tại cửa hàng cho ${vehicle.licensePlate} từ ${d.dateLabel}`}
                                style={{ width: '100%', height: '38px', cursor: 'pointer', border: isSelectedDay ? '2px solid #2563eb' : 'none', borderRadius: '2px' }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================
          MODAL 0: DUYỆT ĐƠN ĐẶT XE & KÝ SỐ LỄ TÂN / ADMIN
          ======================================================== */}
      {approveSignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Duyệt đơn đặt xe & Ký số xác nhận</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Lễ tân / Quản trị viên kiểm tra hồ sơ và ký xác nhận duyệt đơn đặt</div>
              </div>
              <button type="button" onClick={() => setApproveSignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            {/* Thông tin đơn */}
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>Mã đơn: <strong style={{ color: '#2563eb' }}>{approveSignModal.bookingCode || 'BK'}</strong></div>
                <div>Xe thuê: <strong>{approveSignModal.vehicle?.licensePlate || ''} - {approveSignModal.vehicle?.name || ''}</strong></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>Khách hàng: <strong>{approveSignModal.customer?.fullName || 'Khách hàng'}</strong></div>
                <div>Số ĐT: <strong>{approveSignModal.customer?.phone || '---'}</strong></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Thời gian thuê: <strong>{new Date(approveSignModal.startDate).toLocaleDateString('vi-VN')} → {new Date(approveSignModal.endDate).toLocaleDateString('vi-VN')}</strong></div>
                <div>Tiền cọc quy định: <strong style={{ color: '#059669' }}>{Number(approveSignModal.deposit || 0).toLocaleString('vi-VN')} đ</strong></div>
              </div>
            </div>

            {/* Xác nhận cọc */}
            <div style={{ marginBottom: '14px', background: '#ecfdf5', padding: '10px 14px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#065f46', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isDepositConfirmed}
                  onChange={(e) => setIsDepositConfirmed(e.target.checked)}
                />
                <span>Xác nhận đã nhận tiền cọc hợp lệ (Chuyển khoản / Tiền mặt)</span>
              </label>
            </div>

            {/* Ghi chú duyệt */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Ghi chú kiểm tra của Lễ tân
              </label>
              <input
                type="text"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Khung chữ ký điện tử Lễ tân / Admin */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  Chữ ký điện tử Đại diện Lễ tân / Cửa hàng *
                </label>
                <button
                  type="button"
                  onClick={staffApproveDraw.clear}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11.5px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Xóa ký lại
                </button>
              </div>
              <div style={{ border: '2px dashed #94a3b8', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
                <canvas
                  ref={staffApproveCanvasRef}
                  width={530}
                  height={120}
                  onMouseDown={staffApproveDraw.start}
                  onMouseMove={staffApproveDraw.draw}
                  onMouseUp={staffApproveDraw.stop}
                  onMouseLeave={staffApproveDraw.stop}
                  onTouchStart={staffApproveDraw.start}
                  onTouchMove={staffApproveDraw.draw}
                  onTouchEnd={staffApproveDraw.stop}
                  style={{ display: 'block', width: '100%', height: '120px', cursor: 'crosshair', background: '#fafafa' }}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Ký tay bằng chuột hoặc màn hình cảm ứng để xác thực phê duyệt
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setApproveSignModal(null)}
                style={{ padding: '9px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const staffSig = staffApproveCanvasRef.current?.toDataURL('image/png') || '';
                  approveBookingMutation.mutate({
                    bookingId: approveSignModal._id,
                    staffSignature: staffSig,
                    note: approveNote,
                  });
                }}
                disabled={approveBookingMutation.isPending}
                style={{
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check style={{ width: '14px', height: '14px' }} />
                <span>{approveBookingMutation.isPending ? 'Đang duyệt...' : 'Ký & Duyệt đơn (Đã đặt)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: XEM TOÀN BỘ HỢP ĐỒNG & BÊN MÌNH KÝ XÁC NHẬN
          ======================================================== */}
      {contractModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setContractModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '880px',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
          >
            {/* Header bar */}
            <div style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1e293b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Hợp đồng điện tử
                </span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800 }}>
                    Hợp đồng cho thuê xe máy: {contractModal.contract?.contractCode || contractModal.booking?.contractCode || `HD-${contractModal.booking?.bookingCode || 'BK'}`}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    Khách hàng: {contractModal.booking?.customer?.fullName || 'Khách hàng'} • Biển số: {contractModal.booking?.vehicle?.licensePlate || ''}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 14px',
                    background: '#334155',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer style={{ width: '14px', height: '14px' }} />
                  <span>In hợp đồng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContractModal(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  aria-label="Đóng"
                >
                  <X style={{ width: '22px', height: '22px' }} />
                </button>
              </div>
            </div>

            {/* Scrollable Contract Document View */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 32px',
              background: '#f8fafc'
            }}>
              <StandardRentalContractDocument
                mode="populated"
                data={mapContractToStandardData(contractModal.contract || contractModal, contractModal.booking)}
                staffSignatureSlot={
                  contractModal.staffSignature ? (
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={contractModal.staffSignature} alt="Chữ ký Bên A" style={{ height: '58px', margin: '0 auto', display: 'block', objectFit: 'contain' }} />
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                        ✓ ĐÃ XÁC THỰC KÝ SỐ ĐẠI DIỆN CỬA HÀNG
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Thời gian: {new Date(contractModal.staffSignedAt || Date.now()).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ border: '2px dashed #3b82f6', borderRadius: '8px', background: '#f0f9ff', padding: '4px', position: 'relative' }}>
                        <canvas
                          ref={contractStaffCanvasRef}
                          width={320}
                          height={110}
                          onMouseDown={contractStaffDraw.start}
                          onMouseMove={contractStaffDraw.draw}
                          onMouseUp={contractStaffDraw.stop}
                          onMouseLeave={contractStaffDraw.stop}
                          onTouchStart={contractStaffDraw.start}
                          onTouchMove={contractStaffDraw.draw}
                          onTouchEnd={contractStaffDraw.stop}
                          style={{ display: 'block', width: '100%', height: '110px', cursor: 'crosshair', background: '#ffffff', borderRadius: '6px' }}
                        />
                        {!hasDrawnContractStaff && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                            Ký tên tại đây (chuột hoặc cảm ứng)
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px' }}>
                        <button
                          type="button"
                          onClick={contractStaffDraw.clear}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        >
                          Xóa ký lại
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const quickSig = generateStaffSignature('Đại diện XTBike Đà Nẵng');
                            setContractModal(prev => prev ? ({ ...prev, staffSignature: quickSig, staffSignedAt: new Date().toISOString() }) : null);
                            setHasDrawnContractStaff(true);
                          }}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}
                        >
                          Dùng chữ ký số mặc định
                        </button>
                      </div>
                    </div>
                  )
                }
                customerSignatureSlot={
                  contractModal.customerSignature ? (
                    <div style={{ padding: '8px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', minHeight: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={contractModal.customerSignature}
                        alt="Chữ ký khách hàng"
                        style={{ height: '58px', margin: '0 auto', display: 'block', objectFit: 'contain' }}
                      />
                      <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle style={{ width: '13px', height: '13px' }} />
                        <span>
                          {contractModal.booking?.bookingSource === 'walk_in'
                            ? 'KHÁCH HÀNG ĐÃ KÝ TẠI CỬA HÀNG'
                            : 'ĐÃ KÝ SỐ ĐIỆN TỬ KHI ĐẶT XE ONLINE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#166534', marginTop: '2px' }}>
                        {new Date(contractModal.customerSignedAt || Date.now()).toLocaleDateString('vi-VN')}
                      </div>
                      {!contractModal.staffSignature && (
                        <button
                          type="button"
                          onClick={() => {
                            setContractModal(prev => prev ? ({ ...prev, customerSignature: null, customerSignedAt: null }) : null);
                            setHasDrawnContractCust(false);
                          }}
                          style={{ marginTop: '4px', background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                        >
                          Khách ký lại
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{ border: '2px dashed #10b981', borderRadius: '8px', background: '#f0fdf4', padding: '4px', position: 'relative' }}>
                        <canvas
                          ref={contractCustCanvasRef}
                          width={320}
                          height={110}
                          onMouseDown={contractCustDraw.start}
                          onMouseMove={contractCustDraw.draw}
                          onMouseUp={contractCustDraw.stop}
                          onMouseLeave={contractCustDraw.stop}
                          onTouchStart={contractCustDraw.start}
                          onTouchMove={contractCustDraw.draw}
                          onTouchEnd={contractCustDraw.stop}
                          style={{ display: 'block', width: '100%', height: '110px', cursor: 'crosshair', background: '#ffffff', borderRadius: '6px', touchAction: 'none' }}
                        />
                        {!hasDrawnContractCust && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#64748b', fontSize: '12px', fontStyle: 'italic', padding: '0 12px' }}>
                            Khách hàng (Bên B) ký tên tại đây
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px' }}>
                        <button
                          type="button"
                          onClick={contractCustDraw.clear}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        >
                          Xóa ký lại
                        </button>
                        <span style={{ color: '#059669', fontWeight: 600 }}>Bắt buộc khách ký</span>
                      </div>
                    </div>
                  )
                }
              />
            </div>

            {contractError && (
              <div style={{ padding: '10px 24px', background: '#fef2f2', borderTop: '1px solid #fecaca', color: '#b91c1c', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{contractError}</span>
              </div>
            )}

            {/* Modal Bottom Action Bar */}
            <div style={{
              padding: '14px 24px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <div style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: contractModal.customerSignature || hasDrawnContractCust ? '#059669' : '#d97706' }} />
                <span>
                  {contractModal.customerSignature
                    ? 'Khách đã ký xác nhận. Giờ bên mình ký xác nhận để hoàn tất hợp đồng.'
                    : 'Yêu cầu Khách hàng (Bên B) và Đại diện cửa hàng (Bên A) cùng ký trước khi xác nhận.'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setContractModal(null)}
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSignAndConfirmContract}
                  disabled={isSubmittingContract}
                  style={{
                    padding: '8px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isSubmittingContract ? 'wait' : 'pointer',
                    opacity: isSubmittingContract ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Check style={{ width: '15px', height: '15px' }} />
                  <span>{isSubmittingContract ? 'Đang lưu hợp đồng...' : (contractModal.staffSignature ? 'Xác nhận & Cập nhật HĐ' : 'Xác nhận ký 2 bên & Hoàn tất HĐ')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: BÀN GIAO XE (GIAO XE: ẢNH XE + 2 BÊN KÝ XÁC NHẬN)
          ======================================================== */}
      {handoverModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Biên bản bàn giao xe (Giao xe)</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Yêu cầu: Chụp/tải ảnh xe lúc giao và cả 2 bên ký xác nhận</div>
              </div>
              <button type="button" onClick={() => setHandoverModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            {/* Vehicle & Customer Info */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Xe bàn giao: <strong>{handoverModal.vehiclePlate} ({handoverModal.vehicleName})</strong></div>
                <div>Khách nhận xe: <strong>{handoverModal.customerName} ({handoverModal.customerPhone})</strong></div>
              </div>
            </div>

            {/* Step A: Odometer & Fuel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Số km hiện tại (Odometer) *
                </label>
                <input
                  type="number"
                  value={handoverOdo}
                  onChange={(e) => setHandoverOdo(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Mức nhiên liệu / Pin lúc giao *
                </label>
                <select
                  value={handoverFuel}
                  onChange={(e) => setHandoverFuel(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="full">Đầy bình / 100%</option>
                  <option value="half">Nửa bình / 50%</option>
                  <option value="low">Gần hết / Dưới 25%</option>
                </select>
              </div>
            </div>

            {/* Step B: Vehicle Inspection Images */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Hình ảnh xe trước khi giao (Tối thiểu 1 ảnh) *
              </label>
              
              {/* Image Previews */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                {handoverImages.map((img, idx) => (
                  <div key={idx} style={{ height: '80px', borderRadius: '6px', overflow: 'hidden', position: 'relative', border: '1px solid #cbd5e1' }}>
                    <img src={img} alt={`Ảnh xe ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}

                <label
                  style={{
                    height: '80px',
                    borderRadius: '6px',
                    border: '2px dashed #94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  <Camera style={{ width: '20px', height: '20px', marginBottom: '4px' }} />
                  <span>Chụp / Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        files.forEach((file) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setHandoverImages((prev) => [...prev, String(ev.target?.result)]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Step C: Handover Note */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Tình trạng vỏ xe & phụ kiện bàn giao
              </label>
              <textarea
                rows={2}
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Step D: DUAL SIGNATURE (KHÁCH KÝ + NHÂN VIÊN KÝ BÀN GIAO) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              
              {/* Bên A: Nhân viên giao xe ký */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>1. Nhân viên giao xe ký *</label>
                  <button type="button" onClick={handoverStaffDraw.clear} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>Xóa ký lại</button>
                </div>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
                  <canvas
                    ref={handoverStaffCanvasRef}
                    width={260}
                    height={100}
                    style={{ width: '100%', height: '100px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={handoverStaffDraw.start}
                    onMouseMove={handoverStaffDraw.draw}
                    onMouseUp={handoverStaffDraw.stop}
                    onMouseLeave={handoverStaffDraw.stop}
                    onTouchStart={handoverStaffDraw.start}
                    onTouchMove={handoverStaffDraw.draw}
                    onTouchEnd={handoverStaffDraw.stop}
                  />
                </div>
              </div>

              {/* Bên B: Khách nhận xe ký */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>2. Khách nhận xe ký *</label>
                  <button type="button" onClick={handoverCustDraw.clear} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>Xóa ký lại</button>
                </div>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
                  <canvas
                    ref={handoverCustCanvasRef}
                    width={260}
                    height={100}
                    style={{ width: '100%', height: '100px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={handoverCustDraw.start}
                    onMouseMove={handoverCustDraw.draw}
                    onMouseUp={handoverCustDraw.stop}
                    onMouseLeave={handoverCustDraw.stop}
                    onTouchStart={handoverCustDraw.start}
                    onTouchMove={handoverCustDraw.draw}
                    onTouchEnd={handoverCustDraw.stop}
                  />
                </div>
              </div>

            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setHandoverModal(null)}
                style={{ padding: '9px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (handoverImages.length === 0) {
                    toast.error('Vui lòng chụp hoặc tải ít nhất 1 ảnh xe trước khi giao!');
                    return;
                  }
                  if (!hasDrawnHandoverCust || !hasDrawnHandoverStaff) {
                    toast.error('Yêu cầu cả 2 bên (Nhân viên & Khách hàng) ký xác nhận bàn giao xe!');
                    return;
                  }
                  const staffSig = handoverStaffCanvasRef.current?.toDataURL('image/png') || '';
                  const custSig = handoverCustCanvasRef.current?.toDataURL('image/png') || '';

                  handoverMutation.mutate({
                    contractId: handoverModal.contractId,
                    bookingId: handoverModal.bookingId,
                    checkInOdometer: handoverOdo,
                    checkInNote: `${handoverNote} [Nhiên liệu: ${handoverFuel}]`,
                    checkInImages: handoverImages.map((u) => ({ url: u, caption: 'Bàn giao xe' })),
                    checkInStaffSignature: staffSig,
                    checkInCustomerSignature: custSig,
                  });
                }}
                disabled={handoverMutation.isPending}
                style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 700, background: '#059669', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer' }}
              >
                {handoverMutation.isPending ? 'Đang lưu...' : 'Hoàn tất bàn giao xe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: NHẬN TRẢ XE (TRẢ XE: ẢNH XE + 2 BÊN KÝ XÁC NHẬN)
          ======================================================== */}
      {returnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', border: '1px solid #e2e8f0' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Biên bản nhận trả xe & Thanh lý hợp đồng</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Kiểm tra tình trạng xe lúc trả, tính phụ phí và 2 bên ký hoàn tất</div>
              </div>
              <button type="button" onClick={() => setReturnModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            {/* Vehicle & Customer Info */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>Xe trả: <strong>{returnModal.vehiclePlate} ({returnModal.vehicleName})</strong></div>
                <div>Khách trả xe: <strong>{returnModal.customerName}</strong></div>
              </div>
              {returnModal.checkInNote && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                  <span style={{ fontWeight: 700 }}>Tình trạng lúc giao: </span>{returnModal.checkInNote}
                </div>
              )}
            </div>

            {/* Odometer & Fuel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Số km lúc trả (Odometer) *
                </label>
                <input
                  type="number"
                  value={returnOdo}
                  onChange={(e) => setReturnOdo(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Mức nhiên liệu / Pin lúc trả *
                </label>
                <select
                  value={returnFuel}
                  onChange={(e) => setReturnFuel(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                >
                  <option value="full">Đầy bình / 100%</option>
                  <option value="half">Nửa bình / 50%</option>
                  <option value="low">Gần hết / Dưới 25%</option>
                </select>
              </div>
            </div>

            {/* Additional Fees */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Phí trễ hạn (đ)</label>
                <input
                  type="number"
                  value={lateFee}
                  onChange={(e) => setLateFee(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Phí hư tổn (đ)</label>
                <input
                  type="number"
                  value={damageFee}
                  onChange={(e) => setDamageFee(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Phí bù xăng/pin (đ)</label>
                <input
                  type="number"
                  value={fuelFee}
                  onChange={(e) => setFuelFee(Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* ĐỐI CHIẾU HÌNH ẢNH TRƯỚC VÀ SAU KHI TRẢ XE */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  📸 Đối chiếu hình ảnh xe: Lúc giao → Lúc trả
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                  So sánh hiện trạng để xác nhận tình trạng xe
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* CỘT 1: ẢNH LÚC GIAO XE (BEFORE) */}
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '2px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Camera style={{ width: '13px', height: '13px' }} />
                      <span>🔵 Ảnh lúc GIAO xe</span>
                    </span>
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {returnModal.checkInOdometer || 0} km
                    </span>
                  </div>
                  {(returnModal.checkInImages || []).length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px' }}>
                      {(returnModal.checkInImages || []).map((img: any, i: number) => {
                        const url = typeof img === 'string' ? img : img.url;
                        return (
                          <div key={i} style={{ height: '75px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #93c5fd', position: 'relative' }}>
                            <img src={url} alt={`Ảnh giao xe ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(29,78,216,0.7)', color: '#fff', fontSize: '9px', textAlign: 'center', padding: '2px' }}>
                              Ảnh {i + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ height: '75px', border: '2px dashed #93c5fd', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
                      Không có ảnh giao xe
                    </div>
                  )}
                  <div style={{ fontSize: '10.5px', color: '#1d4ed8', marginTop: '6px', fontWeight: 600 }}>
                    ← Hiện trạng ban đầu khi giao cho khách
                  </div>
                </div>

                {/* CỘT 2: ẢNH LÚC TRẢ XE (AFTER) */}
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '2px solid #86efac' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Camera style={{ width: '13px', height: '13px' }} />
                      <span>🟢 Ảnh lúc TRẢ xe *</span>
                    </span>
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {returnOdo} km
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                    {returnImages.map((img, idx) => (
                      <div key={idx} style={{ height: '75px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #86efac', position: 'relative' }}>
                        <img src={img} alt={`Ảnh trả xe ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => setReturnImages(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: '50%', width: '16px', height: '16px', color: '#fff', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label style={{ height: '75px', borderRadius: '6px', border: '2px dashed #4ade80', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#ffffff', color: '#15803d', fontSize: '10px', fontWeight: 700, gap: '2px' }}>
                      <Camera style={{ width: '18px', height: '18px' }} />
                      <span>Chụp / Thêm</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach((file) => {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                if (ev.target?.result) setReturnImages((prev) => [...prev, String(ev.target?.result)]);
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#15803d', fontWeight: 600 }}>
                    Chụp 4 góc, đồng hồ km & vết trầy xước nếu có
                  </div>
                </div>
              </div>

              {/* Chênh lệch km */}
              {returnModal.checkInOdometer > 0 && returnOdo > 0 && (
                <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: '#fef9c3', border: '1px solid #fde047', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#854d0e', fontWeight: 700 }}>
                    Chênh lệch quãng đường:
                  </span>
                  <strong style={{ color: '#92400e', fontSize: '14px' }}>
                    {Math.max(0, returnOdo - (returnModal.checkInOdometer || 0)).toLocaleString('vi-VN')} km đã đi
                  </strong>
                </div>
              )}
            </div>

            {/* Ghi chú tình trạng lúc trả */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Ghi chú tình trạng xe lúc trả
              </label>
              <textarea
                rows={2}
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Mô tả tình trạng xe lúc nhận lại: vết trầy, thiếu phụ kiện, v.v."
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            {/* QUYẾT TOÁN THANH TOÁN & HOÀN CỌC */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Quyết toán thanh toán & Tiền cọc:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                <div>Tiền cọc đã nhận: <strong>{Number(returnModal.deposit || 0).toLocaleString('vi-VN')} đ</strong></div>
                <div>Tổng phụ phí phát sinh: <strong>{(Number(lateFee || 0) + Number(damageFee || 0) + Number(fuelFee || 0)).toLocaleString('vi-VN')} đ</strong></div>
              </div>
              {(() => {
                const depositAmt = Number(returnModal.deposit || 0);
                const extraAmt = Number(lateFee || 0) + Number(damageFee || 0) + Number(fuelFee || 0);
                const balance = depositAmt - extraAmt;
                return (
                  <div style={{ padding: '8px 12px', borderRadius: '4px', background: balance >= 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${balance >= 0 ? '#a7f3d0' : '#fecaca'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: balance >= 0 ? '#065f46' : '#991b1b' }}>
                      {balance >= 0 ? 'Số tiền cọc hoàn trả cho khách:' : 'Khách cần thanh toán thêm:'}
                    </span>
                    <strong style={{ fontSize: '14px', color: balance >= 0 ? '#059669' : '#dc2626' }}>
                      {Math.abs(balance).toLocaleString('vi-VN')} đ
                    </strong>
                  </div>
                );
              })()}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isPaymentConfirmed}
                  onChange={(e) => setIsPaymentConfirmed(e.target.checked)}
                />
                <span>Đã đối chiếu tình trạng xe & xác nhận thanh toán/hoàn cọc đầy đủ</span>
              </label>
            </div>

            {/* DUAL SIGNATURE (KHÁCH TRẢ XE & NHÂN VIÊN KIỂM TRA) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>1. Khách hàng ký xác nhận trả *</label>
                  <button type="button" onClick={returnCustDraw.clear} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>Xóa ký lại</button>
                </div>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
                  <canvas
                    ref={returnCustCanvasRef}
                    width={260}
                    height={100}
                    style={{ width: '100%', height: '100px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={returnCustDraw.start}
                    onMouseMove={returnCustDraw.draw}
                    onMouseUp={returnCustDraw.stop}
                    onMouseLeave={returnCustDraw.stop}
                    onTouchStart={returnCustDraw.start}
                    onTouchMove={returnCustDraw.draw}
                    onTouchEnd={returnCustDraw.stop}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>2. Nhân viên nhận xe ký *</label>
                  <button type="button" onClick={returnStaffDraw.clear} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>Xóa ký lại</button>
                </div>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
                  <canvas
                    ref={returnStaffCanvasRef}
                    width={260}
                    height={100}
                    style={{ width: '100%', height: '100px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={returnStaffDraw.start}
                    onMouseMove={returnStaffDraw.draw}
                    onMouseUp={returnStaffDraw.stop}
                    onMouseLeave={returnStaffDraw.stop}
                    onTouchStart={returnStaffDraw.start}
                    onTouchMove={returnStaffDraw.draw}
                    onTouchEnd={returnStaffDraw.stop}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                style={{ padding: '9px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  if (returnImages.length === 0) {
                    toast.error('Vui lòng chụp ảnh kiểm tra xe lúc nhận lại!');
                    return;
                  }
                  if (!isPaymentConfirmed) {
                    toast.error('Vui lòng xác nhận đã thanh toán / hoàn cọc đầy đủ!');
                    return;
                  }
                  if (!hasDrawnReturnCust || !hasDrawnReturnStaff) {
                    toast.error('Yêu cầu cả 2 bên (Khách hàng & Nhân viên) ký xác nhận bàn giao trả xe!');
                    return;
                  }
                  const custSig = returnCustCanvasRef.current?.toDataURL('image/png') || '';
                  const staffSig = returnStaffCanvasRef.current?.toDataURL('image/png') || '';

                  returnMutation.mutate({
                    contractId: returnModal.contractId,
                    bookingId: returnModal.bookingId,
                    checkOutOdometer: returnOdo,
                    checkOutNote: `${returnNote} [Nhiên liệu lúc trả: ${returnFuel}]`,
                    checkOutImages: returnImages.map((u) => ({ url: u, caption: 'Nhận trả xe' })),
                    checkOutCustomerSignature: custSig,
                    checkOutStaffSignature: staffSig,
                    lateFee,
                    damageFee,
                    fuelFee,
                  });
                }}
                disabled={returnMutation.isPending}
                style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 700, background: '#059669', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer' }}
              >
                {returnMutation.isPending ? 'Đang hoàn tất...' : 'Xác nhận thanh toán & Hoàn tất trả xe (Xe sẵn sàng cho thuê)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: QUÉT MÃ VIETQR THEO ĐÚNG SỐ TIỀN ĐẶT XE (GỒM PHỤ KIỆN)
          ======================================================== */}
      {bookingQrModal && (() => {
        const fullAmount = Number(bookingQrModal.finalPrice || bookingQrModal.totalPrice || 0);
        const depositAmount = Number(bookingQrModal.deposit || 0);
        const currentPayAmount = bookingQrMode === 'full' ? fullAmount : depositAmount;
        const accessoriesList = Array.isArray(bookingQrModal.accessories) ? bookingQrModal.accessories : [];
        const accessoryTotal = accessoriesList.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0);

        const handleBookingQrConfirm = async (qrSession: QrSessionData) => {
          try {
            await api.post('/payments', {
              bookingId: bookingQrModal._id,
              customerId: bookingQrModal.customer?._id || bookingQrModal.customer,
              type: bookingQrMode === 'full' ? 'rental_fee' : 'deposit',
              amount: qrSession.amount,
              method: 'qr',
              qrSessionId: qrSession._id,
              qrSessionCode: qrSession.sessionCode,
              referenceNumber: qrSession.transferContent,
              note: `Thanh toán ${bookingQrMode === 'full' ? 'toàn bộ' : 'cọc'} đơn ${bookingQrModal.bookingCode} (${qrSession.sessionCode})`,
            });
            queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
            setBookingQrModal(null);
            toast.success('Đã xác nhận khách chuyển khoản VietQR thành công!');
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Xác nhận thanh toán thất bại.');
            throw err;
          }
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    📱 Mã VietQR Thanh Toán Đơn Đặt Xe
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Đơn: <strong>{bookingQrModal.bookingCode}</strong> • Khách: <strong>{bookingQrModal.customer?.fullName || 'Khách hàng'}</strong>
                  </div>
                </div>
                <button type="button" onClick={() => setBookingQrModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </button>
              </div>

              {/* Mode Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setBookingQrMode('full')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: bookingQrMode === 'full' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: bookingQrMode === 'full' ? '#ecfdf5' : '#ffffff',
                    color: bookingQrMode === 'full' ? '#047857' : '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>Trọn gói (gồm phụ kiện)</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {fullAmount.toLocaleString('vi-VN')} đ
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingQrMode('deposit')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: bookingQrMode === 'deposit' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: bookingQrMode === 'deposit' ? '#eff6ff' : '#ffffff',
                    color: bookingQrMode === 'deposit' ? '#1d4ed8' : '#475569',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>Tiền cọc giữ xe</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                    {depositAmount.toLocaleString('vi-VN')} đ
                  </div>
                </button>
              </div>

              <VietQrPaymentBox
                bookingId={bookingQrModal._id}
                bookingCode={bookingQrModal.bookingCode}
                amount={currentPayAmount}
                type={bookingQrMode === 'full' ? 'rental_fee' : 'deposit'}
                accentColor={bookingQrMode === 'full' ? '#059669' : '#2563eb'}
                qrSize={220}
                confirmLabel={`Xác nhận đã nhận ${currentPayAmount.toLocaleString('vi-VN')} đ`}
                onConfirmPayment={handleBookingQrConfirm}
                extraContentAfterCard={
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Chi tiết đơn đặt xe:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: '4px' }}>
                      <span>Xe: {bookingQrModal.vehicle?.name} ({bookingQrModal.vehicle?.licensePlate})</span>
                      <span>{bookingQrModal.totalDays || 1} ngày</span>
                    </div>

                    {accessoriesList.length > 0 && (
                      <div style={{ padding: '6px 10px', background: '#eff6ff', borderRadius: '6px', margin: '6px 0', border: '1px solid #dbeafe' }}>
                        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                          Phụ kiện đã đặt ({accessoriesList.length} món):
                        </div>
                        {accessoriesList.map((acc: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '12px' }}>
                            <span>+ {acc.name}:</span>
                            <strong>+{Number(acc.price || 0).toLocaleString('vi-VN')} đ</strong>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e40af', borderTop: '1px dashed #bfdbfe', marginTop: '4px', paddingTop: '2px' }}>
                          <span>Tổng phụ kiện:</span>
                          <span>+{accessoryTotal.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '6px', fontWeight: 800, fontSize: '13.5px' }}>
                      <span>Tổng tiền đơn (gồm phụ kiện):</span>
                      <span style={{ color: '#059669' }}>{fullAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                }
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBookingQrModal(null)}
                  style={{ padding: '8px 18px', background: '#f1f5f9', color: '#334155', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  Đóng
                </button>
              </div>

            </div>
          </div>
        );
      })()}
      {viewHandoverImagesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '8px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800 }}>
                Biên bản bàn giao xe #{viewHandoverImagesModal.bookingCode || viewHandoverImagesModal.contractCode}
              </div>
              <button type="button" onClick={() => setViewHandoverImagesModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            {/* Images */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Hình ảnh xe bàn giao:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {(viewHandoverImagesModal.checkInImages || []).map((img: any, i: number) => (
                  <div key={i} style={{ height: '110px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img src={img.url || img} alt="Ảnh xe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures verified */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#475569' }}>Chữ ký Bên A (Nhân viên)</div>
                  <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>Đã xác nhận bàn giao</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#475569' }}>Chữ ký Bên B (Khách hàng)</div>
                  <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>Đã xác nhận nhận xe</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" onClick={() => setViewHandoverImagesModal(null)} style={{ padding: '8px 18px', background: '#0f172a', color: '#ffffff', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ĐẶT XE TẠI CỬA HÀNG (KHÁCH ĐẾN THUÊ TRỰC TIẾP)
          ======================================================== */}
      {walkInModalOpen && (() => {
        const selectedVeh = vehiclesList.find((v: any) => v._id === walkInVehicleId);
        const startDt = walkInStartDate ? new Date(walkInStartDate) : null;
        const endDt = walkInEndDate ? new Date(walkInEndDate) : null;
        const diffDays = startDt && endDt && !Number.isNaN(startDt.getTime()) && !Number.isNaN(endDt.getTime()) && endDt > startDt
          ? Math.max(1, Math.ceil((endDt.getTime() - startDt.getTime()) / 86400000))
          : 1;
        const dailyPrice = Number(selectedVeh?.pricePerDay || 0);
        const monthlyPrice = Math.round(dailyPrice * 26 * 0.8);
        const rentalMonths = walkInRentalType === 'monthly' ? Math.max(1, Math.ceil(diffDays / 30)) : 0;
        const baseRental = walkInRentalType === 'monthly' ? rentalMonths * monthlyPrice : dailyPrice * diffDays;
        const accessorySum = WALKIN_ACCESSORY_OPTIONS
          .filter((a) => walkInAccessories.includes(a.id))
          .reduce((sum, a) => sum + a.price, 0);
        const estimatedTotal = baseRental + accessorySum;

        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={() => setWalkInModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', padding: '24px 28px', boxShadow: '0 24px 50px rgba(15, 23, 42, 0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Đặt xe tại cửa hàng (Khách đến thuê trực tiếp)
                  </h2>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                    Đơn tạo tại quầy sẽ tự động xác nhận (Đã duyệt) để tiến hành lập hợp đồng &amp; bàn giao xe ngay.
                  </div>
                </div>
                <button type="button" onClick={() => setWalkInModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit}>
                {/* 1. Customer Section */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>1. Thông tin khách thuê</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setWalkInCustomerMode('walkin')}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: walkInCustomerMode === 'walkin' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: walkInCustomerMode === 'walkin' ? '#eff6ff' : '#ffffff',
                          color: walkInCustomerMode === 'walkin' ? '#1d4ed8' : '#475569',
                        }}
                      >
                        + Khách mới tại quầy
                      </button>
                      <button
                        type="button"
                        onClick={() => setWalkInCustomerMode('existing')}
                        style={{
                          padding: '5px 11px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: walkInCustomerMode === 'existing' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: walkInCustomerMode === 'existing' ? '#eff6ff' : '#ffffff',
                          color: walkInCustomerMode === 'existing' ? '#1d4ed8' : '#475569',
                        }}
                      >
                        Khách đã có hồ sơ ({customersList.length})
                      </button>
                    </div>
                  </div>

                  {walkInCustomerMode === 'existing' ? (
                    <div style={{ marginBottom: '10px' }}>
                      <select
                        value={walkInCustomerId}
                        onChange={(e) => setWalkInCustomerId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="">-- Chọn khách hàng có sẵn --</option>
                        {customersList.map((c: any) => (
                          <option key={c._id} value={c._id}>
                            {c.fullName} • {c.phone} {c.cccd ? `• CCCD: ${c.cccd}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Họ và tên khách *</label>
                        <input
                          type="text"
                          value={walkInName}
                          onChange={(e) => setWalkInName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Số điện thoại *</label>
                        <input
                          type="text"
                          value={walkInPhone}
                          onChange={(e) => setWalkInPhone(e.target.value)}
                          placeholder="0905xxxxxx"
                          required
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CCCD / Hộ chiếu</label>
                      <input
                        type="text"
                        value={walkInCccd}
                        onChange={(e) => setWalkInCccd(e.target.value)}
                        placeholder="048xxxxxxxxx"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Số GPLX</label>
                      <input
                        type="text"
                        value={walkInLicense}
                        onChange={(e) => setWalkInLicense(e.target.value)}
                        placeholder="Số bằng lái"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Địa chỉ</label>
                      <input
                        type="text"
                        value={walkInAddress}
                        onChange={(e) => setWalkInAddress(e.target.value)}
                        placeholder="Địa chỉ thường trú"
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Vehicle & Schedule */}
                <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>2. Chọn xe &amp; Thời gian thuê</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Xe cho thuê *</label>
                      <select
                        value={walkInVehicleId}
                        onChange={(e) => {
                          const vId = e.target.value;
                          setWalkInVehicleId(vId);
                          const v = vehiclesList.find((item: any) => item._id === vId);
                          if (v) setWalkInDeposit(v.deposit || 500000);
                        }}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="">-- Chọn xe --</option>
                        {vehiclesList.map((v: any) => (
                          <option key={v._id} value={v._id}>
                            {v.licensePlate} - {v.name} ({Number(v.pricePerDay || 0).toLocaleString('vi-VN')}đ/ngày){v.status === 'available' ? ' ✓ Sẵn sàng' : ` [${v.status}]`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Hình thức thuê</label>
                      <select
                        value={walkInRentalType}
                        onChange={(e) => setWalkInRentalType(e.target.value === 'monthly' ? 'monthly' : 'daily')}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="daily">Thuê theo ngày</option>
                        <option value="monthly">Thuê theo tháng</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Thời gian nhận xe *</label>
                      <input
                        type="datetime-local"
                        value={walkInStartDate}
                        onChange={(e) => setWalkInStartDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Thời gian trả dự kiến *</label>
                      <input
                        type="datetime-local"
                        value={walkInEndDate}
                        onChange={(e) => setWalkInEndDate(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Phụ kiện kèm theo (nếu có)</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {WALKIN_ACCESSORY_OPTIONS.map((acc) => {
                        const checked = walkInAccessories.includes(acc.id);
                        return (
                          <label
                            key={acc.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: checked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                              background: checked ? '#eff6ff' : '#ffffff',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setWalkInAccessories((prev) =>
                                  e.target.checked ? [...prev, acc.id] : prev.filter((x) => x !== acc.id)
                                );
                              }}
                            />
                            <span>{acc.name} (+{acc.price.toLocaleString('vi-VN')}đ)</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Payment & Summary */}
                <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>3. Thanh toán tại cửa hàng</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Hình thức</label>
                      <select
                        value={walkInPaymentMethod}
                        onChange={(e) => setWalkInPaymentMethod(e.target.value as 'cash' | 'qr' | 'bank_transfer')}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="cash">Tiền mặt tại quầy</option>
                        <option value="qr">Chuyển khoản VietQR</option>
                        <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Trạng thái thu tiền</label>
                      <select
                        value={walkInPaymentStatus}
                        onChange={(e) => setWalkInPaymentStatus(e.target.value as 'unpaid' | 'deposit_paid' | 'fully_paid')}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      >
                        <option value="deposit_paid">Đã thu tiền cọc</option>
                        <option value="fully_paid">Đã thu đủ toàn bộ</option>
                        <option value="unpaid">Chưa thu (Thu sau / Tạo mã QR)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tiền cọc giữ xe (đ)</label>
                      <input
                        type="number"
                        value={walkInDeposit}
                        onChange={(e) => setWalkInDeposit(Number(e.target.value))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Ghi chú thêm</label>
                    <input
                      type="text"
                      value={walkInNote}
                      onChange={(e) => setWalkInNote(e.target.value)}
                      placeholder="Khách giữ lại CCCD gốc, bàn giao ngay tại quầy..."
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Thời lượng ước tính:</span>
                      <strong>{diffDays} ngày {walkInRentalType === 'monthly' ? `(${rentalMonths} tháng)` : ''}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Tiền thuê xe ({walkInRentalType === 'monthly' ? `${monthlyPrice.toLocaleString('vi-VN')}đ/tháng` : `${dailyPrice.toLocaleString('vi-VN')}đ/ngày`}):</span>
                      <strong>{baseRental.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    {accessorySum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Phụ kiện kèm theo:</span>
                        <strong>+{accessorySum.toLocaleString('vi-VN')} đ</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '6px', fontSize: '14.5px', fontWeight: 800 }}>
                      <span>Tổng tiền đơn dự kiến:</span>
                      <span style={{ color: '#059669' }}>{estimatedTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setWalkInModalOpen(false)}
                    style={{ padding: '9px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={walkInBookingMutation.isPending}
                    style={{
                      padding: '9px 22px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check style={{ width: '15px', height: '15px' }} />
                    <span>{walkInBookingMutation.isPending ? 'Đang lưu...' : 'Xác nhận đặt xe tại cửa hàng'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
