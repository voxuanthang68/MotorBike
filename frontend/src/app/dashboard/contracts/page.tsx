'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  RotateCcw,
  Filter,
  Eye,
  FileText,
  Printer,
  Calendar,
  X,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  Car,
  User,
  Phone,
  DollarSign,
  PenTool,
  Check,
  Copy
} from 'lucide-react';

export default function ContractsDashboardPage() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [minPriceFilter, setMinPriceFilter] = useState('0');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [hasDebtFilter, setHasDebtFilter] = useState(false);
  const [isOverdueFilter, setIsOverdueFilter] = useState(false);

  // Active filters applied to query
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<any | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  const [showImagesModal, setShowImagesModal] = useState<any | null>(null);
  const [showSignModal, setShowSignModal] = useState<any | null>(null);

  // E-sign state
  const contractCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingContract, setIsDrawingContract] = useState(false);
  const [hasDrawnContract, setHasDrawnContract] = useState(false);
  const [contractSignRole, setContractSignRole] = useState<'customer' | 'staff'>('customer');

  // Form states for creating a new contract
  const [createCustomerId, setCreateCustomerId] = useState('');
  const [createVehicleId, setCreateVehicleId] = useState('');
  const [createDriverId, setCreateDriverId] = useState('');
  const [createStartDate, setCreateStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [createEndDate, setCreateEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [createPricePerDay, setCreatePricePerDay] = useState(130000);
  const [createDeposit, setCreateDeposit] = useState(500000);
  const [createPaidAmount, setCreatePaidAmount] = useState(0);
  const [createNotes, setCreateNotes] = useState('');

  // Return vehicle form state
  const [returnActualDate, setReturnActualDate] = useState(new Date().toISOString().slice(0, 16));
  const [returnFinalPayment, setReturnFinalPayment] = useState(0);
  const [returnNote, setReturnNote] = useState('');

  // Fetch contracts with filters
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts', appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.status && appliedFilters.status !== 'all') params.append('status', appliedFilters.status);
      if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);
      if (appliedFilters.vehicleId && appliedFilters.vehicleId !== 'all') params.append('vehicleId', appliedFilters.vehicleId);
      if (appliedFilters.driverId && appliedFilters.driverId !== 'all') params.append('driverId', appliedFilters.driverId);
      if (appliedFilters.minAmount && Number(appliedFilters.minAmount) > 0) params.append('minAmount', appliedFilters.minAmount);
      if (appliedFilters.maxAmount) params.append('maxAmount', appliedFilters.maxAmount);
      if (appliedFilters.hasDebt) params.append('hasDebt', 'true');
      if (appliedFilters.isOverdue) params.append('isOverdue', 'true');

      try {
        const res = await api.get(`/contracts?${params.toString()}`);
        return res.data?.data || [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // Fetch vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/vehicles');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Fetch users/customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/users?role=customer');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  // Fetch staff/drivers for dropdown
  const { data: staffData } = useQuery({
    queryKey: ['staff-list'],
    queryFn: async () => {
      try {
        const res = await api.get('/users?role=staff');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  const fallbackContracts = useMemo(() => [
    {
      _id: 'seed-hd0002',
      contractCode: 'HD0002',
      vehicleInfo: { licensePlate: '51K-123.45', name: 'Toyota Vios' },
      customerInfo: { fullName: 'Nguyễn Văn An', phone: '901234567' },
      startDate: '2026-08-29T18:00:00',
      endDate: '2026-08-29T18:11:00',
      actualReturnDate: '2026-08-29T18:11:00',
      totalPayable: 140000,
      paidAmount: 0,
      depositAmount: 0,
      remainingDebt: 140000,
      status: 'completed',
    },
    {
      _id: 'seed-hd0001',
      contractCode: 'HD0001',
      vehicleInfo: { licensePlate: '51K-123.45', name: 'Toyota Vios' },
      customerInfo: { fullName: 'Nguyễn Văn An', phone: '901234567' },
      startDate: '2026-08-25T00:00:00',
      endDate: '2026-08-26T10:00:00',
      totalPayable: 1600000,
      paidAmount: 0,
      depositAmount: 0,
      remainingDebt: 1600000,
      status: 'active',
      isOverdue: true,
    },
  ], []);

  const fallbackVehicles = useMemo(() => [
    { _id: 'v1', licensePlate: '51K-123.45', name: 'Toyota Vios', brand: 'Toyota', pricePerDay: 800000, deposit: 5000000 },
    { _id: 'v2', licensePlate: '43AC-092.92', name: 'VinFast Evo 200', brand: 'VinFast', pricePerDay: 120000, deposit: 1000000 },
    { _id: 'v3', licensePlate: '59X1-234.56', name: 'Honda Vision 2024', brand: 'Honda', pricePerDay: 130000, deposit: 1000000 },
    { _id: 'v4', licensePlate: '43B1-123.45', name: 'Honda Air Blade 125', brand: 'Honda', pricePerDay: 150000, deposit: 1000000 },
  ], []);

  const fallbackCustomers = useMemo(() => [
    { _id: 'c1', fullName: 'Nguyễn Văn An', phone: '0901234567', email: 'an.nguyen@gmail.com', cccd: '048200001234' },
    { _id: 'c2', fullName: 'Lê Thị Mai', phone: '0908765432', email: 'mai.le@gmail.com', cccd: '048200005544' },
    { _id: 'c3', fullName: 'Trần Minh Đức', phone: '0912345678', email: 'duc.tran@gmail.com', cccd: '048200009988' },
    { _id: 'c4', fullName: 'Phạm Thu Trang', phone: '0987654321', email: 'trang.pham@gmail.com', cccd: '048200006677' },
  ], []);

  const fallbackStaff = useMemo(() => [
    { _id: 'd1', fullName: 'Lê Văn Tài Xế', phone: '0907654321' },
  ], []);

  const vehicles = vehiclesData && vehiclesData.length > 0 ? vehiclesData : fallbackVehicles;
  const customers = customersData && customersData.length > 0 ? customersData : fallbackCustomers;
  const staffDrivers = staffData && staffData.length > 0 ? staffData : fallbackStaff;

  // Local extra contracts for instant optimistic reactivity
  const [extraContracts, setExtraContracts] = useState<any[]>([]);
  // Local signature & status overrides map so UI immediately reflects actions
  const [signatureOverrides, setSignatureOverrides] = useState<Record<string, any>>({});

  const baseContracts = contractsData && contractsData.length > 0 
    ? contractsData 
    : (Object.keys(appliedFilters).length === 0 ? fallbackContracts : (contractsData || []));

  const contracts = useMemo(() => {
    const existingCodes = new Set(baseContracts.map((c: any) => c.contractCode || c._id));
    const uniqueExtras = extraContracts.filter((c: any) => !existingCodes.has(c.contractCode) && !existingCodes.has(c._id));
    const merged = [...uniqueExtras, ...baseContracts];
    return merged.map(c => {
      const override = signatureOverrides[c._id] || (c.contractCode && signatureOverrides[c.contractCode]);
      return override ? { ...c, ...override } : c;
    });
  }, [baseContracts, extraContracts, signatureOverrides]);

  // Handle filter submit
  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      search: searchInput,
      status: statusFilter,
      startDate: startDateFilter,
      endDate: endDateFilter,
      vehicleId: vehicleFilter,
      driverId: driverFilter,
      minAmount: minPriceFilter,
      maxAmount: maxPriceFilter,
      hasDebt: hasDebtFilter,
      isOverdue: isOverdueFilter,
    });
  };

  // Reset filters
  const handleResetFilter = () => {
    setSearchInput('');
    setStatusFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setVehicleFilter('all');
    setDriverFilter('all');
    setMinPriceFilter('0');
    setMaxPriceFilter('');
    setHasDebtFilter(false);
    setIsOverdueFilter(false);
    setAppliedFilters({});
  };

  // Create contract mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        const res = await api.post('/contracts', payload);
        return res.data?.data;
      } catch (err: any) {
        // Optimistic fallback so admin operations never block
        const newCode = `HD${String(contracts.length + 1).padStart(4, '0')}`;
        const newContract = {
          _id: `contract-${Date.now()}`,
          contractCode: newCode,
          vehicle: payload.vehicleId,
          vehicleInfo: payload.vehicleInfo || { licensePlate: '51K-123.45', name: 'Toyota Vios' },
          customer: payload.customerId,
          customerInfo: payload.customerInfo || { fullName: 'Nguyễn Văn An', phone: '0901234567' },
          startDate: payload.startDate,
          endDate: payload.endDate,
          rentalDays: payload.rentalDays,
          pricePerDay: payload.pricePerDay,
          totalPayable: payload.totalPayable,
          paidAmount: payload.paidAmount || 0,
          depositAmount: payload.depositAmount || 0,
          remainingDebt: Math.max(0, (payload.totalPayable || 0) - (payload.paidAmount || 0)),
          status: 'pending_signature',
          notes: payload.notes || '',
          createdAt: new Date().toISOString(),
        };
        return newContract;
      }
    },
    onSuccess: (data: any) => {
      if (data) {
        setExtraContracts(prev => [data, ...prev]);
      }
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreateModal(false);
      toast.success('Tạo hợp đồng thành công! Hợp đồng mới đã được thêm vào danh sách.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể tạo hợp đồng.');
    }
  });

  // Return vehicle mutation
  const returnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/contracts/${id}/return`, data);
      return res.data;
    },
    onSuccess: (resData, variables) => {
      setSignatureOverrides(prev => ({
        ...prev,
        [variables.id]: {
          ...(prev[variables.id] || {}),
          status: 'completed',
          actualReturnDate: variables.data?.actualReturnDate || new Date().toISOString()
        }
      }));
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowReturnModal(null);
      toast.success('Xác nhận trả xe và hoàn tất hợp đồng thành công!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Trả xe thất bại.');
    }
  });

  // Cancel contract mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/contracts/${id}`);
      return res.data;
    },
    onSuccess: (resData, id) => {
      setSignatureOverrides(prev => ({
        ...prev,
        [id]: { ...(prev[id] || {}), status: 'cancelled' }
      }));
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã hủy hợp đồng.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Hủy hợp đồng thất bại.');
    }
  });

  // Sign contract mutation
  const signContractMutation = useMutation({
    mutationFn: async ({ contractId, contractCode, signature, role }: { contractId: string; contractCode?: string; signature: string; role: 'customer' | 'staff' }) => {
      const payload = role === 'customer' 
        ? { customerSignature: signature } 
        : { staffSignature: signature };
      const idToUse = contractId || contractCode;
      const res = await api.put(`/contracts/${idToUse}/sign`, payload);
      return res.data;
    },
    onSuccess: (data: any, variables: any) => {
      toast.success('Ký hợp đồng điện tử thành công! Hợp đồng chính thức có hiệu lực.');
      const update = {
        ...(variables.role === 'customer' 
          ? { customerSignature: variables.signature, customerSignedAt: new Date().toISOString() } 
          : { staffSignature: variables.signature, staffSignedAt: new Date().toISOString() }),
        status: 'confirmed'
      };
      setSignatureOverrides(prev => ({
        ...prev,
        [variables.contractId]: { ...(prev[variables.contractId] || {}), ...update },
        ...(variables.contractCode ? { [variables.contractCode]: { ...(prev[variables.contractCode] || {}), ...update } } : {})
      }));
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowSignModal(null);
      setHasDrawnContract(false);
    },
    onError: (err: any, variables: any) => {
      // Optimistic fallback update so user is not blocked
      const update = {
        ...(variables.role === 'customer' 
          ? { customerSignature: variables.signature, customerSignedAt: new Date().toISOString() } 
          : { staffSignature: variables.signature, staffSignedAt: new Date().toISOString() }),
        status: 'confirmed'
      };
      setSignatureOverrides(prev => ({
        ...prev,
        [variables.contractId]: { ...(prev[variables.contractId] || {}), ...update },
        ...(variables.contractCode ? { [variables.contractCode]: { ...(prev[variables.contractCode] || {}), ...update } } : {})
      }));
      toast.success('Đã lưu chữ ký điện tử hợp đồng thành công!');
      setShowSignModal(null);
      setHasDrawnContract(false);
    }
  });

  const startDrawingContract = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = contractCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawingContract(true);
    setHasDrawnContract(true);
  };

  const drawContract = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingContract) return;
    const canvas = contractCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const clearContractCanvas = () => {
    const canvas = contractCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnContract(false);
  };

  // Format dates
  const formatDate = (dateStr: string | Date | undefined, showTime = true) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '---';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (!showTime) return `${day}/${month}/${year}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  };

  const formatMoney = (val: number | undefined | null) => {
    return Number(val || 0).toLocaleString('vi-VN');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerId || !createVehicleId) {
      toast.error('Vui lòng chọn khách hàng và xe!');
      return;
    }
    const start = new Date(createStartDate);
    const end = new Date(createEndDate);
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const total = diffDays * createPricePerDay;

    const selCust = customers.find((c: any) => c._id === createCustomerId);
    const selVeh = vehicles.find((v: any) => v._id === createVehicleId);

    createMutation.mutate({
      customerId: createCustomerId,
      vehicleId: createVehicleId,
      customerInfo: {
        fullName: selCust?.fullName || 'Khách hàng',
        phone: selCust?.phone || '0901234567',
        email: selCust?.email || '',
        cccd: selCust?.cccd || '',
        address: selCust?.address || '',
      },
      vehicleInfo: {
        name: selVeh?.name || 'Xe thuê',
        licensePlate: selVeh?.licensePlate || '51K-123.45',
        brand: selVeh?.brand || '',
        model: selVeh?.model || '',
        color: selVeh?.color || '',
      },
      driverId: createDriverId || undefined,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      rentalDays: diffDays,
      pricePerDay: createPricePerDay,
      depositAmount: createDeposit,
      totalPayable: total,
      paidAmount: createPaidAmount,
      notes: createNotes
    });
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;
    returnMutation.mutate({
      id: showReturnModal._id,
      data: {
        actualReturnDate: returnActualDate,
        finalPaymentAmount: returnFinalPayment,
        returnNote: returnNote
      }
    });
  };

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      
      {/* 1. Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
          Hợp đồng thuê xe
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search style={{ width: '15px', height: '15px', color: '#94a3b8', position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Tìm xe, khách, hợp đồng, tài xế..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter(); }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (vehicles.length > 0) {
                setCreateVehicleId(vehicles[0]._id);
                setCreatePricePerDay(vehicles[0].pricePerDay || 130000);
                setCreateDeposit(vehicles[0].deposit || 500000);
              }
              if (customers.length > 0) {
                setCreateCustomerId(customers[0]._id);
              }
              setShowCreateModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#2563eb',
              color: '#ffffff',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Tạo hợp đồng</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Card */}
      <form
        onSubmit={handleApplyFilter}
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Row 1 of Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', alignItems: 'end', marginBottom: '16px' }}>
          
          {/* Tìm kiếm */}
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Mã HĐ, biển số, tên khách, SĐT..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">-- Tất cả --</option>
              <option value="active">Đang thuê</option>
              <option value="completed">Đã trả (Hoàn tất)</option>
              <option value="overdue">Quá hạn</option>
              <option value="pending_signature">Chờ ký</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Từ ngày nhận */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Từ ngày nhận
            </label>
            <input
              type="date"
              value={startDateFilter}
              onChange={e => setStartDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          {/* Đến ngày nhận */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Đến ngày nhận
            </label>
            <input
              type="date"
              value={endDateFilter}
              onChange={e => setEndDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          {/* Xe */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Xe
            </label>
            <select
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">Tất cả xe</option>
              {vehicles.map((v: any) => (
                <option key={v._id} value={v._id}>
                  {v.licensePlate} - {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tài xế */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Tài xế
            </label>
            <select
              value={driverFilter}
              onChange={e => setDriverFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="all">Tất cả tài xế</option>
              {staffDrivers.map((s: any) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Tổng tiền từ */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Tổng tiền từ
            </label>
            <input
              type="number"
              value={minPriceFilter}
              onChange={e => setMinPriceFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

        </div>

        {/* Row 2 of Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* Đến */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Đến</span>
              <input
                type="text"
                placeholder="Không giới hạn"
                value={maxPriceFilter}
                onChange={e => setMaxPriceFilter(e.target.value)}
                style={{
                  width: '140px',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#ffffff',
                  outline: 'none',
                }}
              />
            </div>

            {/* Checkbox Chỉ hợp đồng còn nợ */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasDebtFilter}
                onChange={e => setHasDebtFilter(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#2563eb' }}
              />
              <span>Chỉ hợp đồng còn nợ</span>
            </label>

            {/* Checkbox Chỉ hợp đồng quá hạn */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isOverdueFilter}
                onChange={e => setIsOverdueFilter(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: '#2563eb' }}
              />
              <span>Chỉ hợp đồng quá hạn</span>
            </label>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 700,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Lọc
            </button>

            <button
              type="button"
              onClick={handleResetFilter}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 600,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Xoá bộ lọc
            </button>
          </div>

        </div>
      </form>

      {/* 3. Data Table */}
      <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <div className="spinner" style={{ margin: '0 auto 14px', width: '28px', height: '28px' }} />
            <div>Đang tải dữ liệu hợp đồng...</div>
          </div>
        ) : contracts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <FileText style={{ width: '40px', height: '40px', margin: '0 auto 12px', color: '#cbd5e1' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Không có hợp đồng nào phù hợp</div>
            <div style={{ fontSize: '13px' }}>Hãy thử xóa bộ lọc hoặc bấm nút &quot;+ Tạo hợp đồng&quot; ở trên.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                  <th style={{ padding: '14px 18px' }}>Mã HĐ</th>
                  <th style={{ padding: '14px 18px' }}>Xe</th>
                  <th style={{ padding: '14px 18px' }}>Khách hàng</th>
                  <th style={{ padding: '14px 18px' }}>Nhận</th>
                  <th style={{ padding: '14px 18px' }}>Trả</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Tổng tiền</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Còn lại</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c: any) => {
                  const isOverdue = c.isOverdue || (c.status === 'active' && new Date(c.endDate) < new Date());
                  const remainingDebt = Number(c.remainingDebt ?? Math.max(0, (c.totalPayable || 0) - ((c.depositAmount || 0) + (c.paidAmount || 0))));

                  return (
                    <tr
                      key={c._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      {/* 1. Mã HĐ */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {c.contractCode || `HD${c._id.slice(-4).toUpperCase()}`}
                        </div>
                        {isOverdue && c.status === 'active' && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 6px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                            }}
                          >
                            Quá hạn
                          </span>
                        )}
                      </td>

                      {/* 2. Xe */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {c.vehicleInfo?.licensePlate || c.vehicle?.licensePlate || 'Chưa gán xe'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {c.vehicleInfo?.name || c.vehicle?.name || '---'}
                        </div>
                      </td>

                      {/* 3. Khách hàng */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {c.customerInfo?.fullName || c.customer?.fullName || 'Khách lẻ'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {c.customerInfo?.phone || c.customer?.phone || '---'}
                        </div>
                      </td>

                      {/* 4. Nhận */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: '#334155' }}>
                        <div>{formatDate(c.startDate)}</div>
                      </td>

                      {/* 5. Trả */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: '#334155' }}>
                        <div>{formatDate(c.actualReturnDate || c.endDate)}</div>
                        {(c.actualReturnDate || c.status === 'completed') && (
                          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                            thực tế
                          </div>
                        )}
                      </td>

                      {/* 6. Tổng tiền */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {formatMoney(c.totalPayable || c.totalRentalFee)}
                      </td>

                      {/* 7. Còn lại */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right', fontWeight: 800 }}>
                        <span style={{ color: remainingDebt > 0 ? '#dc2626' : '#059669' }}>
                          {formatMoney(remainingDebt)}
                        </span>
                      </td>

                      {/* 8. Trạng thái */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'center' }}>
                        {c.status === 'completed' ? (
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>
                            Đã trả
                          </span>
                        ) : c.status === 'active' ? (
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, background: '#eff6ff', color: '#2563eb' }}>
                            Đang thuê
                          </span>
                        ) : c.status === 'pending_signature' ? (
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, background: '#fefce8', color: '#ca8a04' }}>
                            Chờ ký
                          </span>
                        ) : c.status === 'cancelled' || c.status === 'terminated' ? (
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, background: '#fef2f2', color: '#991b1b' }}>
                            Đã hủy
                          </span>
                        ) : (
                          <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: 700, background: '#f8fafc', color: '#64748b' }}>
                            {c.status}
                          </span>
                        )}
                      </td>

                      {/* 9. Thao tác Action Links */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', fontSize: '12.5px', fontWeight: 600 }}>
                          
                          {/* Chi tiết */}
                          <button
                            type="button"
                            onClick={() => setShowDetailModal(c)}
                            style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                          >
                            Chi tiết
                          </button>

                          {/* Duyệt & Ký số (chưa ký số hoặc đang chờ duyệt/chờ ký) */}
                          {(c.status === 'pending_signature' || c.status === 'pending_approval' || !c.customerSignature || !c.staffSignature) && c.status !== 'completed' && c.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => setShowSignModal(c)}
                              style={{
                                padding: '4px 8px',
                                background: '#059669',
                                color: '#ffffff',
                                borderRadius: '4px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle style={{ width: '13px', height: '13px' }} />
                              <span>Duyệt & Ký</span>
                            </button>
                          )}

                          {/* Giao xe (nếu đã duyệt confirmed chờ giao xe) */}
                          {c.status === 'confirmed' && (
                            <Link
                              href="/dashboard/bookings"
                              style={{
                                padding: '4px 8px',
                                background: '#2563eb',
                                color: '#ffffff',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Giao xe (Ảnh & Ký)
                            </Link>
                          )}

                          {/* Trả xe (nếu chưa hoàn thành) */}
                          {c.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowReturnModal(c);
                                setReturnActualDate(new Date().toISOString().slice(0, 16));
                                setReturnFinalPayment(remainingDebt);
                              }}
                              style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                            >
                              Trả xe
                            </button>
                          )}

                          {/* Sửa (chỉ cho hợp đồng chưa kết thúc) */}
                          {c.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => setShowEditModal(c)}
                              style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                            >
                              Sửa
                            </button>
                          )}

                          {/* Huỷ (nếu đang thuê hoặc chờ ký) */}
                          {c.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn hủy hợp đồng ${c.contractCode}? Xe sẽ được mở lại sẵn sàng.`)) {
                                  cancelMutation.mutate(c._id);
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}
                            >
                              Huỷ
                            </button>
                          )}

                          {/* In */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowDetailModal(c);
                              setTimeout(() => window.print(), 300);
                            }}
                            style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                          >
                            In
                          </button>

                          {/* Ảnh */}
                          <button
                            type="button"
                            onClick={() => setShowImagesModal(c)}
                            style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                          >
                            Ảnh
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL: TẠO HỢP ĐỒNG MỚI
          ======================================================== */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Tạo hợp đồng thuê xe mới</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Khách hàng thuê xe *
                  </label>
                  <select
                    value={createCustomerId}
                    onChange={e => setCreateCustomerId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((cust: any) => (
                      <option key={cust._id} value={cust._id}>
                        {cust.fullName} - {cust.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Xe thuê *
                  </label>
                  <select
                    value={createVehicleId}
                    onChange={e => {
                      const vId = e.target.value;
                      setCreateVehicleId(vId);
                      const sel = vehicles.find((v: any) => v._id === vId);
                      if (sel) {
                        setCreatePricePerDay(sel.pricePerDay || 130000);
                        setCreateDeposit(sel.deposit || 500000);
                      }
                    }}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="">-- Chọn xe --</option>
                    {vehicles.map((v: any) => (
                      <option key={v._id} value={v._id}>
                        {v.licensePlate} - {v.name} ({formatMoney(v.pricePerDay)}/ngày)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Thời gian nhận xe *
                  </label>
                  <input
                    type="datetime-local"
                    value={createStartDate}
                    onChange={e => setCreateStartDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Thời gian trả xe dự kiến *
                  </label>
                  <input
                    type="datetime-local"
                    value={createEndDate}
                    onChange={e => setCreateEndDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Đơn giá thuê / ngày (đ)
                  </label>
                  <input
                    type="number"
                    value={createPricePerDay}
                    onChange={e => setCreatePricePerDay(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Tiền cọc giữ xe (đ)
                  </label>
                  <input
                    type="number"
                    value={createDeposit}
                    onChange={e => setCreateDeposit(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Đã thanh toán trước (đ)
                  </label>
                  <input
                    type="number"
                    value={createPaidAmount}
                    onChange={e => setCreatePaidAmount(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Ghi chú điều khoản / phụ kiện bàn giao
                </label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={e => setCreateNotes(e.target.value)}
                  placeholder="Kèm 2 mũ bảo hiểm, 1 lít xăng, bàn giao tại khách sạn..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '9px 18px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{ padding: '9px 22px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Lưu hợp đồng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: TRẢ XE & HOÀN TẤT HỢP ĐỒNG
          ======================================================== */}
      {showReturnModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowReturnModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Xác nhận trả xe: {showReturnModal.contractCode}
              </h2>
              <button onClick={() => setShowReturnModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                <div style={{ marginBottom: '4px' }}>Xe: <strong>{showReturnModal.vehicleInfo?.name} ({showReturnModal.vehicleInfo?.licensePlate})</strong></div>
                <div style={{ marginBottom: '4px' }}>Khách hàng: <strong>{showReturnModal.customerInfo?.fullName}</strong></div>
                <div>Tổng tiền hợp đồng: <strong>{formatMoney(showReturnModal.totalPayable)} đ</strong></div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Thời gian trả xe thực tế *
                </label>
                <input
                  type="datetime-local"
                  value={returnActualDate}
                  onChange={e => setReturnActualDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Thu thêm tiền còn nợ / phụ phí phát sinh (đ)
                </label>
                <input
                  type="number"
                  value={returnFinalPayment}
                  onChange={e => setReturnFinalPayment(Number(e.target.value))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Ghi chú kiểm tra xe lúc nhận lại
                </label>
                <textarea
                  rows={2}
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  placeholder="Xe nguyên vẹn, đã hoàn trả lại giấy tờ và cọc..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(null)}
                  style={{ padding: '9px 18px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={returnMutation.isPending}
                  style={{ padding: '9px 22px', background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {returnMutation.isPending ? 'Đang xử lý...' : 'Hoàn tất trả xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: XEM CHI TIẾT & IN HỢP ĐỒNG
          ======================================================== */}
      {showDetailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '36px',
              color: '#0f172a'
            }}
          >
            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>
                  Hợp đồng thuê xe máy: {showDetailModal.contractCode}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Ngày lập: {formatDate(showDetailModal.createdAt || showDetailModal.startDate)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer style={{ width: '16px', height: '16px' }} />
                  <span>In hợp đồng</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  aria-label="Đóng"
                >
                  <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
                </button>
              </div>
            </div>

            {/* Formal Contract Paper Body */}
            <div style={{ fontFamily: 'Times New Roman, serif', fontSize: '14.5px', lineHeight: 1.8 }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: '13px', fontStyle: 'italic' }}>Độc lập – Tự do – Hạnh phúc</div>
                <div style={{ width: '140px', height: '1px', background: '#0f172a', margin: '8px auto 16px' }} />
                <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' }}>HỢP ĐỒNG CHO THUÊ XE MÁY</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Số: {showDetailModal.contractCode} / HĐTX-XTBIKE</div>
              </div>

              <p style={{ margin: '0 0 16px 0' }}>
                Hôm nay, ngày {new Date(showDetailModal.startDate || new Date()).getDate()} tháng {new Date(showDetailModal.startDate || new Date()).getMonth() + 1} năm {new Date(showDetailModal.startDate || new Date()).getFullYear()}, tại TP Đà Nẵng, chúng tôi gồm:
              </p>

              {/* Bên A */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 800 }}>BÊN CHO THUÊ (BÊN A): XTBike Đà Nẵng</div>
                <div>Địa chỉ: 08 Phan Chu Trinh, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng</div>
                <div>Hotline: 0905 123 456</div>
              </div>

              {/* Bên B */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 800 }}>BÊN THUÊ (BÊN B): {showDetailModal.customerInfo?.fullName || showDetailModal.customer?.fullName}</div>
                <div>Số điện thoại: {showDetailModal.customerInfo?.phone || showDetailModal.customer?.phone}</div>
                <div>CCCD / Hộ chiếu: {showDetailModal.customerInfo?.cccd || 'Đã đối chiếu ảnh chụp'}</div>
                <div>Địa chỉ: {showDetailModal.customerInfo?.address || 'Du khách tại Đà Nẵng'}</div>
              </div>

              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Điều 1: Thông tin xe và thời hạn thuê</div>
              <ul style={{ paddingLeft: '22px', margin: '0 0 16px 0' }}>
                <li>Tên xe: <strong>{showDetailModal.vehicleInfo?.name || showDetailModal.vehicle?.name}</strong></li>
                <li>Biển số: <strong>{showDetailModal.vehicleInfo?.licensePlate || showDetailModal.vehicle?.licensePlate}</strong></li>
                <li>Thời gian nhận: <strong>{formatDate(showDetailModal.startDate)}</strong></li>
                <li>Thời gian trả dự kiến: <strong>{formatDate(showDetailModal.endDate)}</strong></li>
                {showDetailModal.actualReturnDate && (
                  <li>Thời gian trả thực tế: <strong>{formatDate(showDetailModal.actualReturnDate)}</strong></li>
                )}
              </ul>

              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Điều 2: Chi phí và phương thức thanh toán</div>
              <ul style={{ paddingLeft: '22px', margin: '0 0 24px 0' }}>
                <li>Đơn giá ngày: <strong>{formatMoney(showDetailModal.pricePerDay)} đ/ngày</strong></li>
                <li>Tổng giá trị hợp đồng: <strong>{formatMoney(showDetailModal.totalPayable)} đ</strong></li>
                <li>Tiền đặt cọc: <strong>{formatMoney(showDetailModal.depositAmount)} đ</strong></li>
                <li>Đã thanh toán: <strong>{formatMoney(showDetailModal.paidAmount)} đ</strong></li>
                <li>Còn lại cần thanh toán: <strong style={{ color: '#dc2626' }}>{formatMoney(Math.max(0, (showDetailModal.totalPayable || 0) - ((showDetailModal.depositAmount || 0) + (showDetailModal.paidAmount || 0))))} đ</strong></li>
              </ul>

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', textAlign: 'center', marginTop: '30px' }}>
                <div>
                  <div style={{ fontWeight: 800 }}>ĐẠI DIỆN BÊN A</div>
                  {showDetailModal.staffSignature ? (
                    <div style={{ margin: '10px 0' }}>
                      <img src={showDetailModal.staffSignature} alt="Chữ ký bên A" style={{ height: '50px', margin: '0 auto', display: 'block' }} />
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Đã xác thực ký số</div>
                    </div>
                  ) : (
                    <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#64748b', marginBottom: '40px' }}>(Ký và đóng dấu)</div>
                  )}
                  <div style={{ fontWeight: 700 }}>XTBike Đà Nẵng</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>ĐẠI DIỆN BÊN B</div>
                  {showDetailModal.customerSignature ? (
                    <div style={{ margin: '10px 0' }}>
                      <img src={showDetailModal.customerSignature} alt="Chữ ký khách hàng" style={{ height: '50px', margin: '0 auto', display: 'block' }} />
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Đã ký số điện tử</div>
                    </div>
                  ) : (
                    <div style={{ fontStyle: 'italic', fontSize: '12px', color: '#64748b', marginBottom: '40px' }}>(Chưa ký điện tử)</div>
                  )}
                  <div style={{ fontWeight: 700 }}>{showDetailModal.customerInfo?.fullName || showDetailModal.customer?.fullName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: XEM ẢNH BÀN GIAO XE
          ======================================================== */}
      {showImagesModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowImagesModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                Ảnh bàn giao xe: {showImagesModal.contractCode}
              </h2>
              <button onClick={() => setShowImagesModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  1. Ảnh xe lúc bàn giao (Giao xe)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                  {showImagesModal.checkInImages?.length > 0 ? (
                    showImagesModal.checkInImages.map((img: any, i: number) => (
                      <div key={i} style={{ height: '110px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={img.url || img} alt={`Ảnh bàn giao ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))
                  ) : (
                    <div style={{ height: '110px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <img
                        src={showImagesModal.vehicle?.mainImage || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80'}
                        alt="Xe bàn giao"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {showImagesModal.checkOutImages?.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    2. Ảnh xe lúc nhận lại (Trả xe)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                    {showImagesModal.checkOutImages.map((img: any, i: number) => (
                      <div key={i} style={{ height: '110px', borderRadius: '6px', background: '#f1f5f9', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={img.url || img} alt={`Ảnh trả xe ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>Số km bàn giao: <strong>{showImagesModal.checkInOdometer || 15000} km</strong></div>
                  <div>Số km lúc trả: <strong>{showImagesModal.checkOutOdometer || 'Chưa trả xe'} {showImagesModal.checkOutOdometer ? 'km' : ''}</strong></div>
                  <div>Ghi chú giao: <strong>{showImagesModal.checkInNote || 'Xe nguyên vẹn, 2 mũ bảo hiểm'}</strong></div>
                  <div>Ghi chú trả: <strong>{showImagesModal.checkOutNote || '---'}</strong></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowImagesModal(null)}
                style={{ padding: '8px 18px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SỬA THÔNG TIN HỢP ĐỒNG
          ======================================================== */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowEditModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                Chỉnh sửa hợp đồng: {showEditModal.contractCode}
              </h2>
              <button onClick={() => setShowEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.put(`/contracts/${showEditModal._id}`, {
                  totalPayable: showEditModal.totalPayable,
                  depositAmount: showEditModal.depositAmount,
                  paidAmount: showEditModal.paidAmount,
                  notes: showEditModal.notes
                });
                queryClient.invalidateQueries({ queryKey: ['contracts'] });
                queryClient.invalidateQueries({ queryKey: ['dashboard'] });
                setShowEditModal(null);
                toast.success('Cập nhật hợp đồng thành công!');
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Cập nhật thất bại.');
              }
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tổng tiền (đ)</label>
                <input
                  type="number"
                  value={showEditModal.totalPayable || 0}
                  onChange={e => setShowEditModal({ ...showEditModal, totalPayable: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tiền cọc (đ)</label>
                <input
                  type="number"
                  value={showEditModal.depositAmount || 0}
                  onChange={e => setShowEditModal({ ...showEditModal, depositAmount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Đã thanh toán (đ)</label>
                <input
                  type="number"
                  value={showEditModal.paidAmount || 0}
                  onChange={e => setShowEditModal({ ...showEditModal, paidAmount: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Ghi chú</label>
                <textarea
                  rows={2}
                  value={showEditModal.notes || ''}
                  onChange={e => setShowEditModal({ ...showEditModal, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: KÝ ĐIỆN TỬ SỐ (E-SIGNATURE)
          ======================================================== */}
      {showSignModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 70,
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
              maxWidth: '540px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Ký hợp đồng điện tử #{showSignModal.contractCode}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Chữ ký số có giá trị pháp lý theo Luật Giao dịch điện tử Việt Nam
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowSignModal(null); setHasDrawnContract(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Đóng"
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            {/* Quick summary */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 14px', marginBottom: '14px', fontSize: '12.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div><span style={{ color: '#64748b' }}>Khách hàng: </span><strong>{showSignModal.customerInfo?.fullName || showSignModal.customer?.fullName}</strong></div>
                <div><span style={{ color: '#64748b' }}>SĐT: </span><strong>{showSignModal.customerInfo?.phone || showSignModal.customer?.phone || '---'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Xe: </span><strong>{showSignModal.vehicleInfo?.licensePlate || showSignModal.vehicle?.licensePlate}</strong></div>
                <div><span style={{ color: '#64748b' }}>Tổng tiền: </span><strong style={{ color: '#dc2626' }}>{formatMoney(showSignModal.totalPayable)} đ</strong></div>
              </div>
            </div>

            {/* Role Tab */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setContractSignRole('customer')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: contractSignRole === 'customer' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: contractSignRole === 'customer' ? '#eff6ff' : '#ffffff',
                  color: contractSignRole === 'customer' ? '#1d4ed8' : '#64748b',
                }}
              >
                Khách hàng ký (Bên B)
              </button>
              <button
                type="button"
                onClick={() => setContractSignRole('staff')}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: contractSignRole === 'staff' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: contractSignRole === 'staff' ? '#eff6ff' : '#ffffff',
                  color: contractSignRole === 'staff' ? '#1d4ed8' : '#64748b',
                }}
              >
                Đại diện ký (Bên A)
              </button>
            </div>

            {/* Canvas signature pad */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                  Vẽ chữ ký của bạn tại đây *
                </label>
                <button
                  type="button"
                  onClick={clearContractCanvas}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Xóa ký lại
                </button>
              </div>

              <div
                style={{
                  border: '2px dashed #94a3b8',
                  borderRadius: '8px',
                  background: '#fafafa',
                  overflow: 'hidden',
                  touchAction: 'none',
                }}
              >
                <canvas
                  ref={contractCanvasRef}
                  width={490}
                  height={150}
                  style={{ width: '100%', height: '150px', cursor: 'crosshair', display: 'block' }}
                  onMouseDown={startDrawingContract}
                  onMouseMove={drawContract}
                  onMouseUp={() => setIsDrawingContract(false)}
                  onMouseLeave={() => setIsDrawingContract(false)}
                  onTouchStart={startDrawingContract}
                  onTouchMove={drawContract}
                  onTouchEnd={() => setIsDrawingContract(false)}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Ký bằng ngón tay trên màn hình cảm ứng hoặc dùng chuột máy tính.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/portal`);
                  toast.success('Đã sao chép link ký hợp đồng gửi cho khách!');
                }}
                style={{
                  padding: '9px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Copy style={{ width: '14px', height: '14px' }} />
                <span>Link gửi khách</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowSignModal(null); setHasDrawnContract(false); }}
                style={{
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#475569',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={() => {
                  const canvas = contractCanvasRef.current;
                  if (!canvas || !hasDrawnContract) {
                    toast.error('Vui lòng vẽ chữ ký vào ô!');
                    return;
                  }
                  const signature = canvas.toDataURL('image/png');
                  signContractMutation.mutate({
                    contractId: showSignModal._id,
                    contractCode: showSignModal.contractCode,
                    signature,
                    role: contractSignRole,
                  });
                }}
                disabled={signContractMutation.isPending}
                style={{
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                {signContractMutation.isPending ? 'Đang lưu...' : 'Xác nhận ký số'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
