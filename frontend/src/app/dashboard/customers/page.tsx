'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Filter,
  RotateCcw,
  User,
  Phone,
  CreditCard,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  X,
  Award,
  Calendar,
  Lock,
  Trash2,
  Edit
} from 'lucide-react';

export default function CustomersManagementPage() {
  const queryClient = useQueryClient();

  // Search & Filter state matching screenshot
  const [searchInput, setSearchInput] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [customerTierFilter, setCustomerTierFilter] = useState('all');
  const [isBlacklistOnly, setIsBlacklistOnly] = useState(false);
  const [hasDebtOnly, setHasDebtOnly] = useState(false);
  const [inactive90DaysOnly, setInactive90DaysOnly] = useState(false);

  // Active applied filters
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<any | null>(null);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);

  // Create Form State
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<'standard' | 'walk_in' | 'high_risk'>('standard');
  const [newCustomerTier, setNewCustomerTier] = useState('regular');
  const [newCccd, setNewCccd] = useState('');
  const [newDrivingLicense, setNewDrivingLicense] = useState('');
  const [newDrivingLicenseClass, setNewDrivingLicenseClass] = useState('B2');
  const [newAddress, setNewAddress] = useState('');
  const [newRiskReason, setNewRiskReason] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCustomerType, setEditCustomerType] = useState<'standard' | 'walk_in' | 'high_risk'>('standard');
  const [editCustomerTier, setEditCustomerTier] = useState('regular');
  const [editCccd, setEditCccd] = useState('');
  const [editDrivingLicense, setEditDrivingLicense] = useState('');
  const [editDrivingLicenseClass, setEditDrivingLicenseClass] = useState('B2');
  const [editAddress, setEditAddress] = useState('');
  const [editRiskReason, setEditRiskReason] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Fetch customers
  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers-list', appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.customerType && appliedFilters.customerType !== 'all') params.append('customerType', appliedFilters.customerType);
      if (appliedFilters.customerTier && appliedFilters.customerTier !== 'all') params.append('customerTier', appliedFilters.customerTier);
      if (appliedFilters.isBlacklistOnly) params.append('isBlacklisted', 'true');
      if (appliedFilters.hasDebtOnly) params.append('hasDebt', 'true');
      if (appliedFilters.inactive90DaysOnly) params.append('inactive90Days', 'true');

      try {
        const res = await api.get(`/customers?${params.toString()}`);
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 30000
  });

  const customersList = useMemo(() => {
    return Array.isArray(customersData) ? customersData : [];
  }, [customersData]);

  // Apply filter action
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchInput,
      customerType: customerTypeFilter,
      customerTier: customerTierFilter,
      isBlacklistOnly,
      hasDebtOnly,
      inactive90DaysOnly
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCustomerTypeFilter('all');
    setCustomerTierFilter('all');
    setIsBlacklistOnly(false);
    setHasDebtOnly(false);
    setInactive90DaysOnly(false);
    setAppliedFilters({});
  };

  // 1. Mutation: Create Customer
  const createCustomerMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/customers', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Tạo khách hàng mới thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setShowCreateModal(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo khách hàng');
    }
  });

  // 2. Mutation: Edit Customer
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật thông tin khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setShowEditModal(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật khách hàng');
    }
  });

  // 3. Mutation: Toggle Blacklist
  const toggleBlacklistMutation = useMutation({
    mutationFn: async ({ id, isBlacklisted, riskReason }: { id: string; isBlacklisted: boolean; riskReason?: string }) => {
      const res = await api.put(`/customers/${id}/blacklist`, { isBlacklisted, riskReason });
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.isBlacklisted ? 'Đã đưa khách hàng vào danh sách rủi ro (Chặn)!' : 'Đã bỏ chặn khách hàng!');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi thay đổi trạng thái chặn');
    }
  });

  // 4. Mutation: Delete Customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đã xóa khách hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa khách hàng');
    }
  });

  const resetCreateForm = () => {
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
    setNewCustomerType('standard');
    setNewCustomerTier('regular');
    setNewCccd('');
    setNewDrivingLicense('');
    setNewDrivingLicenseClass('B2');
    setNewAddress('');
    setNewRiskReason('');
    setNewNotes('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) {
      toast.error('Vui lòng nhập Họ tên và Số điện thoại!');
      return;
    }
    if (newCustomerType === 'high_risk' && !newRiskReason.trim()) {
      toast.error('Khách hàng rủi ro bắt buộc phải nhập Lý do rủi ro / Cảnh báo!');
      return;
    }

    createCustomerMutation.mutate({
      fullName: newFullName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      customerType: newCustomerType,
      customerTier: newCustomerTier,
      cccd: newCccd.trim(),
      drivingLicense: newDrivingLicense.trim(),
      drivingLicenseClass: newDrivingLicenseClass,
      address: newAddress.trim(),
      riskReason: newRiskReason.trim(),
      notes: newNotes.trim()
    });
  };

  const openEditModal = (c: any) => {
    setShowEditModal(c);
    setEditFullName(c.fullName || '');
    setEditPhone(c.phone || '');
    setEditEmail(c.email || '');
    setEditCustomerType(c.customerType || (c.isBlacklisted ? 'high_risk' : 'standard'));
    setEditCustomerTier(c.customerTier || 'regular');
    setEditCccd(c.cccd || '');
    setEditDrivingLicense(c.drivingLicense || '');
    setEditDrivingLicenseClass(c.drivingLicenseClass || 'B2');
    setEditAddress(c.address || '');
    setEditRiskReason(c.riskReason || '');
    setEditNotes(c.notes || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!editFullName.trim() || !editPhone.trim()) {
      toast.error('Vui lòng nhập Họ tên và Số điện thoại!');
      return;
    }
    if (editCustomerType === 'high_risk' && !editRiskReason.trim()) {
      toast.error('Vui lòng nhập lý do cảnh báo rủi ro!');
      return;
    }

    updateCustomerMutation.mutate({
      id: showEditModal._id,
      data: {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        customerType: editCustomerType,
        customerTier: editCustomerTier,
        cccd: editCccd.trim(),
        drivingLicense: editDrivingLicense.trim(),
        drivingLicenseClass: editDrivingLicenseClass,
        address: editAddress.trim(),
        riskReason: editRiskReason.trim(),
        notes: editNotes.trim(),
        isBlacklisted: editCustomerType === 'high_risk'
      }
    });
  };

  return (
    <div style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      
      {/* 1. Header with Title & Action Button matching screenshot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
          Khách hàng
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search box on top right */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '15px',
                height: '15px',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              placeholder="Tìm xe, khách, hợp đồng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyFilters();
              }}
              style={{
                width: '100%',
                padding: '8px 14px 8px 34px',
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

          {/* "+ Tạo khách hàng" button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Tạo khách hàng</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Box matching screenshot layout */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '18px 22px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          
          {/* Tìm kiếm */}
          <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tên, SĐT, CCCD..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Loại khách */}
          <div style={{ flex: '0 0 170px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Loại khách
            </label>
            <select
              value={customerTypeFilter}
              onChange={(e) => setCustomerTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">-- Tất cả --</option>
              <option value="standard">Khách hàng</option>
              <option value="walk_in">Khách vãng lai</option>
              <option value="high_risk">Khách hàng rủi ro</option>
            </select>
          </div>

          {/* Hạng khách */}
          <div style={{ flex: '0 0 150px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Hạng khách
            </label>
            <select
              value={customerTierFilter}
              onChange={(e) => setCustomerTierFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">-- Tất cả --</option>
              <option value="regular">Thường</option>
              <option value="silver">Bạc</option>
              <option value="gold">Vàng</option>
              <option value="vip">VIP</option>
              <option value="diamond">Kim cương</option>
            </select>
          </div>

          {/* Checkboxes matching screenshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isBlacklistOnly}
                onChange={(e) => setIsBlacklistOnly(e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              <span>Chỉ danh sách đen</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasDebtOnly}
                onChange={(e) => setHasDebtOnly(e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              <span>Chỉ khách đang nợ</span>
            </label>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inactive90DaysOnly}
                onChange={(e) => setInactive90DaysOnly(e.target.checked)}
                style={{ width: '14px', height: '14px' }}
              />
              <span>Trên 90 ngày chưa quay lại</span>
            </label>
          </div>

          {/* Filter Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={handleApplyFilters}
              style={{
                padding: '7px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '7px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              Xoá bộ lọc
            </button>
          </div>
        </div>

        {/* Tab / Button: Khách quen & ưu đãi */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={() => setShowLoyaltyModal(true)}
            style={{
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#1e293b',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award style={{ width: '14px', height: '14px', color: '#d97706' }} />
            <span>Khách quen & ưu đãi</span>
          </button>
        </div>
      </div>

      {/* 3. Customers Table matching screenshot layout */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', fontWeight: 700 }}>
                <th style={{ padding: '14px 12px', textAlign: 'center', width: '52px' }}>STT</th>
                <th style={{ padding: '14px 18px' }}>Mã KH</th>
                <th style={{ padding: '14px 18px' }}>Họ tên</th>
                <th style={{ padding: '14px 18px' }}>Điện thoại</th>
                <th style={{ padding: '14px 18px' }}>CCCD</th>
                <th style={{ padding: '14px 18px' }}>GPLX</th>
                <th style={{ padding: '14px 18px' }}>Loại</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customersList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                    <User style={{ width: '36px', height: '36px', color: '#cbd5e1', margin: '0 auto 8px' }} />
                    <div>Không tìm thấy khách hàng nào phù hợp bộ lọc.</div>
                  </td>
                </tr>
              ) : (
                customersList.map((c: any, idx: number) => {
                  const isHighRisk = c.customerType === 'high_risk' || c.isBlacklisted;
                  const isWalkIn = c.customerType === 'walk_in';

                  return (
                    <tr
                      key={c._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      {/* STT */}
                      <td style={{ padding: '14px 12px', verticalAlign: 'top', textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        {idx + 1}
                      </td>

                      {/* Mã KH */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {c.customerCode || `KH${c._id.slice(-4).toUpperCase()}`}
                        </div>
                      </td>

                      {/* Họ tên */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {c.fullName}
                        </div>
                        {c.email && (
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            {c.email}
                          </div>
                        )}
                      </td>

                      {/* Điện thoại */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: '#0f172a' }}>
                        {c.phone || '---'}
                      </td>

                      {/* CCCD */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: '#334155', fontFamily: 'monospace' }}>
                        {c.cccd || '---'}
                      </td>

                      {/* GPLX */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', color: '#334155' }}>
                        {c.drivingLicense ? (
                          <span>
                            {c.drivingLicense} {c.drivingLicenseClass ? `(${c.drivingLicenseClass})` : ''}
                          </span>
                        ) : (
                          '---'
                        )}
                      </td>

                      {/* Loại (3 loại khách hàng) */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top' }}>
                        {isHighRisk ? (
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 800,
                              }}
                            >
                              Khách hàng rủi ro
                            </span>
                            {c.riskReason && (
                              <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>
                                Lý do: {c.riskReason}
                              </div>
                            )}
                          </div>
                        ) : isWalkIn ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            Khách vãng lai
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            Khách hàng
                          </span>
                        )}
                      </td>

                      {/* Thao tác links matching screenshot: Chi tiết | Sửa | Chặn | Xoá */}
                      <td style={{ padding: '14px 18px', verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', fontSize: '12.5px', fontWeight: 600 }}>
                          
                          {/* Chi tiết */}
                          <button
                            type="button"
                            onClick={() => setShowDetailModal(c)}
                            style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                          >
                            Chi tiết
                          </button>

                          {/* Sửa */}
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', padding: 0 }}
                          >
                            Sửa
                          </button>

                          {/* Chặn / Bỏ chặn */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isHighRisk) {
                                if (window.confirm(`Bạn có chắc muốn bỏ chặn khách hàng ${c.fullName}?`)) {
                                  toggleBlacklistMutation.mutate({ id: c._id, isBlacklisted: false });
                                }
                              } else {
                                const reason = window.prompt(`Nhập lý do đưa khách hàng ${c.fullName} vào danh sách rủi ro (Chặn):`);
                                if (reason !== null) {
                                  toggleBlacklistMutation.mutate({ id: c._id, isBlacklisted: true, riskReason: reason });
                                }
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: isHighRisk ? '#059669' : '#dc2626', cursor: 'pointer', padding: 0 }}
                          >
                            {isHighRisk ? 'Bỏ chặn' : 'Chặn'}
                          </button>

                          {/* Xoá */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc muốn xóa khách hàng ${c.fullName}?`)) {
                                deleteCustomerMutation.mutate(c._id);
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}
                          >
                            Xoá
                          </button>
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

      {/* 4. MODAL: TẠO KHÁCH HÀNG MỚI (VỚI 3 LOẠI KHÁCH RÕ RÀNG) */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
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
              maxWidth: '620px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Tạo khách hàng mới
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Chọn 1 trong 3 nhóm khách hàng để thiết lập chính sách và bảo vệ rủi ro
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              
              {/* 3 LOẠI KHÁCH HÀNG CARDS */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Phân loại khách hàng *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  
                  {/* Option 1: Khách hàng */}
                  <div
                    onClick={() => setNewCustomerType('standard')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '6px',
                      border: newCustomerType === 'standard' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: newCustomerType === 'standard' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: newCustomerType === 'standard' ? '#1d4ed8' : '#0f172a' }}>
                      Khách hàng
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                      Khách định danh, thành viên thuê dài hạn
                    </div>
                  </div>

                  {/* Option 2: Khách vãng lai */}
                  <div
                    onClick={() => setNewCustomerType('walk_in')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '6px',
                      border: newCustomerType === 'walk_in' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      background: newCustomerType === 'walk_in' ? '#fffbeb' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: newCustomerType === 'walk_in' ? '#b45309' : '#0f172a' }}>
                      Khách vãng lai
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                      Khách lẻ ghé quầy, khách du lịch ngắn ngày
                    </div>
                  </div>

                  {/* Option 3: Khách hàng rủi ro */}
                  <div
                    onClick={() => setNewCustomerType('high_risk')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '6px',
                      border: newCustomerType === 'high_risk' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: newCustomerType === 'high_risk' ? '#fef2f2' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: newCustomerType === 'high_risk' ? '#b91c1c' : '#0f172a' }}>
                      Khách hàng rủi ro
                    </div>
                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', lineHeight: 1.3 }}>
                      Từng nợ xấu, trả trễ, danh sách đen cảnh báo
                    </div>
                  </div>
                </div>
              </div>

              {/* NẾU CHỌN KHÁCH HÀNG RỦI RO: HIỂN THỊ CẢNH BÁO BẮT BUỘC */}
              {newCustomerType === 'high_risk' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#991b1b', fontWeight: 700, fontSize: '12.5px' }}>
                    <ShieldAlert style={{ width: '16px', height: '16px' }} />
                    <span>Lý do đưa vào danh sách rủi ro / Cảnh báo nội bộ *</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Từng quỵt tiền thuê xe, trả trễ 3 ngày, làm vỡ vỏ xe không bồi thường..."
                    value={newRiskReason}
                    onChange={(e) => setNewRiskReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12.5px',
                      border: '1px solid #f87171',
                      borderRadius: '4px',
                      background: '#ffffff',
                      color: '#991b1b',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* THÔNG TIN CƠ BẢN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Họ và tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn An"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Số điện thoại *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0901234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Số CCCD / Hộ chiếu
                  </label>
                  <input
                    type="text"
                    placeholder="79201001234"
                    value={newCccd}
                    onChange={(e) => setNewCccd(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Email (Không bắt buộc)
                  </label>
                  <input
                    type="email"
                    placeholder="khachhang@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* BẰNG LÁI & HẠNG KHÁCH */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Số GPLX (Bằng lái xe)
                  </label>
                  <input
                    type="text"
                    placeholder="790123456789"
                    value={newDrivingLicense}
                    onChange={(e) => setNewDrivingLicense(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 12px',
                      fontSize: '13px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hạng GPLX
                  </label>
                  <select
                    value={newDrivingLicenseClass}
                    onChange={(e) => setNewDrivingLicenseClass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12.5px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="A1">A1 (Xe máy)</option>
                    <option value="A2">A2 (Mô tô)</option>
                    <option value="B1">B1 (Ô tô)</option>
                    <option value="B2">B2 (Ô tô)</option>
                    <option value="C">C (Tải)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hạng khách
                  </label>
                  <select
                    value={newCustomerTier}
                    onChange={(e) => setNewCustomerTier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12.5px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="regular">Thường</option>
                    <option value="silver">Bạc</option>
                    <option value="gold">Vàng</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>

              {/* ĐỊA CHỈ */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Địa chỉ thường trú / Khách sạn lưu trú
                </label>
                <input
                  type="text"
                  placeholder="Quận Hải Châu, TP. Đà Nẵng hoặc Khách sạn..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* GHI CHÚ */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Ghi chú nội bộ
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về thói quen thuê xe, yêu cầu đặc biệt..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={createCustomerMutation.isPending}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  {createCustomerMutation.isPending ? 'Đang tạo...' : 'Tạo khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: SỬA THÔNG TIN KHÁCH HÀNG */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
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
              maxWidth: '620px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Sửa thông tin khách hàng: {showEditModal.fullName}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Mã: {showEditModal.customerCode || 'KH'} — SĐT: {showEditModal.phone}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              
              {/* 3 LOẠI KHÁCH HÀNG CHUYỂN ĐỔI */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Chuyển đổi loại khách hàng
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  
                  <div
                    onClick={() => setEditCustomerType('standard')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '6px',
                      border: editCustomerType === 'standard' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: editCustomerType === 'standard' ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: editCustomerType === 'standard' ? '#1d4ed8' : '#0f172a' }}>
                      Khách hàng
                    </div>
                  </div>

                  <div
                    onClick={() => setEditCustomerType('walk_in')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '6px',
                      border: editCustomerType === 'walk_in' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      background: editCustomerType === 'walk_in' ? '#fffbeb' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: editCustomerType === 'walk_in' ? '#b45309' : '#0f172a' }}>
                      Khách vãng lai
                    </div>
                  </div>

                  <div
                    onClick={() => setEditCustomerType('high_risk')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '6px',
                      border: editCustomerType === 'high_risk' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: editCustomerType === 'high_risk' ? '#fef2f2' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '13px', color: editCustomerType === 'high_risk' ? '#b91c1c' : '#0f172a' }}>
                      Khách hàng rủi ro
                    </div>
                  </div>
                </div>
              </div>

              {editCustomerType === 'high_risk' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                    Lý do cảnh báo rủi ro *
                  </div>
                  <input
                    type="text"
                    required
                    value={editRiskReason}
                    onChange={(e) => setEditRiskReason(e.target.value)}
                    placeholder="Nhập lý do cảnh báo..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12.5px',
                      border: '1px solid #f87171',
                      borderRadius: '4px',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    CCCD
                  </label>
                  <input
                    type="text"
                    value={editCccd}
                    onChange={(e) => setEditCccd(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    GPLX
                  </label>
                  <input
                    type="text"
                    value={editDrivingLicense}
                    onChange={(e) => setEditDrivingLicense(e.target.value)}
                    style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hạng GPLX
                  </label>
                  <select
                    value={editDrivingLicenseClass}
                    onChange={(e) => setEditDrivingLicenseClass(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff' }}
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hạng khách
                  </label>
                  <select
                    value={editCustomerTier}
                    onChange={(e) => setEditCustomerTier(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', fontSize: '12.5px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff' }}
                  >
                    <option value="regular">Thường</option>
                    <option value="silver">Bạc</option>
                    <option value="gold">Vàng</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{ width: '100%', padding: '7px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateCustomerMutation.isPending}
                  style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 700, background: '#2563eb', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer' }}
                >
                  {updateCustomerMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: CHI TIẾT KHÁCH HÀNG */}
      {showDetailModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
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
              maxWidth: '560px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Hồ sơ chi tiết: {showDetailModal.fullName}
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Mã khách hàng:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{showDetailModal.customerCode || 'KH0001'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Phân loại:</span>
                {showDetailModal.customerType === 'high_risk' || showDetailModal.isBlacklisted ? (
                  <span style={{ fontWeight: 800, color: '#dc2626' }}>Khách hàng rủi ro (Chặn)</span>
                ) : showDetailModal.customerType === 'walk_in' ? (
                  <span style={{ fontWeight: 700, color: '#d97706' }}>Khách vãng lai</span>
                ) : (
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>Khách hàng (Chuẩn)</span>
                )}
              </div>
              {showDetailModal.riskReason && (
                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '6px', color: '#991b1b' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>Cảnh báo rủi ro:</div>
                  <div style={{ marginTop: '2px' }}>{showDetailModal.riskReason}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Số điện thoại:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{showDetailModal.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Số CCCD:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{showDetailModal.cccd || '---'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>GPLX (Bằng lái xe):</span>
                <span>{showDetailModal.drivingLicense || '---'} {showDetailModal.drivingLicenseClass ? `(${showDetailModal.drivingLicenseClass})` : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Địa chỉ:</span>
                <span>{showDetailModal.address || 'Hải Châu, Đà Nẵng'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Tổng số chuyến thuê:</span>
                <span style={{ fontWeight: 700 }}>{showDetailModal.totalRentals || 0} chuyến</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#64748b' }}>Công nợ hiện tại:</span>
                <span style={{ fontWeight: 800, color: (showDetailModal.debtAmount || 0) > 0 ? '#dc2626' : '#059669' }}>
                  {Number(showDetailModal.debtAmount || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowDetailModal(null)}
                style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: KHÁCH QUEN & ƯU ĐÃI */}
      {showLoyaltyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
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
              maxWidth: '560px',
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Chính sách Khách quen & Ưu đãi
              </div>
              <button
                type="button"
                onClick={() => setShowLoyaltyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ padding: '12px', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 800, color: '#1e40af' }}>Hạng Vàng (Gold) — Giảm 5%</div>
                <div style={{ color: '#3b82f6', marginTop: '3px' }}>Áp dụng khi khách hoàn thành từ 3 chuyến thuê trở lên.</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '6px', background: '#fef3c7', border: '1px solid #fde68a' }}>
                <div style={{ fontWeight: 800, color: '#92400e' }}>Hạng VIP — Giảm 10% & Miễn cọc</div>
                <div style={{ color: '#b45309', marginTop: '3px' }}>Áp dụng khi khách hoàn thành từ 5 chuyến thuê, lịch sử trả xe đúng hẹn, CCCD định danh đầy đủ.</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, color: '#334155' }}>Khách vãng lai</div>
                <div style={{ color: '#64748b', marginTop: '3px' }}>Yêu cầu đặt cọc chuẩn và chụp ảnh CCCD/GPLX khi nhận xe.</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowLoyaltyModal(false)}
                style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#334155', cursor: 'pointer' }}
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
