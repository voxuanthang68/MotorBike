'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const ROLE_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  owner: { label: 'Chủ cửa hàng', color: '#f97316', desc: 'Toàn quyền kiểm soát hệ thống & tài chính' },
  admin: { label: 'Quản trị viên', color: '#8b5cf6', desc: 'Quản trị hệ thống, tài khoản & cấu hình' },
  technician: { label: 'Kỹ thuật viên', color: '#06b6d4', desc: 'Kiểm tra xe, ký điện tử, bảo dưỡng' },
  support: { label: 'Nhân viên hỗ trợ', color: '#10b981', desc: 'Cứu hộ khẩn cấp, giải quyết sự cố 24/7' },
  accountant: { label: 'Kế toán', color: '#f59e0b', desc: 'Quản lý thu chi, cọc, doanh thu' },
  receptionist: { label: 'Lễ tân', color: '#3b82f6', desc: 'Tiếp nhận đặt xe, check-in, check-out' },
};

export default function OwnerStaffManager() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('receptionist');
  const [department, setDepartment] = useState('');

  // Query users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['owner-staff', selectedRole],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (selectedRole) params.role = selectedRole;
      const res = await api.get('/users', { params });
      return res.data;
    },
  });

  const staffList = (usersData?.data || []).filter((u: any) => {
    // Only display staff members (exclude pure customers unless needed)
    if (u.role === 'customer') return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = u.fullName?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Thêm nhân viên mới thành công!');
      setShowAddEditModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi thêm nhân viên!'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: any) => api.put(`/users/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Cập nhật nhân viên thành công!');
      setShowAddEditModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Lỗi cập nhật nhân viên!'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã xóa nhân viên!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể xóa nhân viên!'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/users/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã cập nhật trạng thái tài khoản!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Thao tác thất bại!'),
  });

  const resetForm = () => {
    setEditingStaff(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setRole('receptionist');
    setDepartment('');
  };

  const handleOpenEdit = (u: any) => {
    setEditingStaff(u);
    setFullName(u.fullName || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setRole(u.role || 'receptionist');
    setDepartment(u.department || '');
    setShowAddEditModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff._id,
        payload: { fullName, phone, role, department },
      });
    } else {
      createMutation.mutate({
        fullName,
        email,
        phone,
        password,
        role,
        department,
      });
    }
  };

  const handleDelete = (u: any) => {
    if (window.confirm(`Chủ cửa hàng xác nhận muốn XÓA nhân viên ${u.fullName} (${u.email})?`)) {
      deleteMutation.mutate(u._id);
    }
  };

  // Quick stats
  const totalStaff = staffList.length;
  const receptionistCount = staffList.filter((u: any) => u.role === 'receptionist').length;
  const technicianCount = staffList.filter((u: any) => u.role === 'technician').length;
  const supportCount = staffList.filter((u: any) => u.role === 'support').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            👥 Quản Lý Nhân Sự Cửa Hàng
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Thêm mới nhân viên, điều chỉnh chức vụ/phòng ban và phân quyền truy cập hệ thống
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddEditModal(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
          }}
        >
          <span>➕</span>
          <span>Thêm Nhân Viên</span>
        </button>
      </div>

      {/* 2. Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TỔNG NHÂN VIÊN</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>{totalStaff}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>LỄ TÂN</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>{receptionistCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>KỸ THUẬT VIÊN</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{technicianCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>HỖ TRỢ / CỨU HỘ</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{supportCount}</div>
        </div>
      </div>

      {/* 3. Filters */}
      <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Tìm nhân viên theo tên, email, số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '9px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '13.5px',
            outline: 'none',
          }}
        />

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#fff', outline: 'none' }}
        >
          <option value="">Tất cả chức vụ</option>
          {Object.entries(ROLE_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* 4. Table */}
      <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách nhân viên...</div>
        ) : staffList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không có nhân viên nào phù hợp.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>NHÂN VIÊN</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>CHỨC VỤ</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>LIÊN HỆ</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>PHÒNG BAN</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((u: any) => {
                  const roleConfig = ROLE_CONFIG[u.role] || { label: u.role, color: '#64748b' };
                  const isActive = u.isActive !== false;
                  return (
                    <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: roleConfig.color,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px',
                            }}
                          >
                            {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{u.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: roleConfig.color,
                            background: `${roleConfig.color}15`,
                            border: `1px solid ${roleConfig.color}33`,
                            display: 'inline-block',
                          }}
                        >
                          {roleConfig.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                        {u.phone ? `📞 ${u.phone}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                        {u.department || 'Chi nhánh Hải Châu'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: isActive ? '#ecfdf5' : '#fef2f2',
                            color: isActive ? '#059669' : '#dc2626',
                            border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`,
                          }}
                        >
                          {isActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEdit(u)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => toggleActiveMutation.mutate({ id: u._id, isActive: !isActive })}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${isActive ? '#fde68a' : '#a7f3d0'}`,
                              background: isActive ? '#fffbeb' : '#ecfdf5',
                              color: isActive ? '#d97706' : '#059669',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isActive ? 'Khóa' : 'Mở'}
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ Xóa
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

      {/* 5. Modal Thêm / Sửa Nhân Viên */}
      {showAddEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => e.target === e.currentTarget && setShowAddEditModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {editingStaff ? '✏️ Chỉnh Sửa Nhân Viên' : '👥 Thêm Mới Nhân Viên Cửa Hàng'}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Họ và tên nhân viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                {!editingStaff && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Email đăng nhập *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nhanvien@motobikehaichau.vn"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                {!editingStaff && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      Mật khẩu khởi tạo
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mặc định: 123456"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Chức vụ / Vai trò *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="receptionist">Lễ tân (Tiếp nhận & check-in xe)</option>
                    <option value="technician">Kỹ thuật viên (Kiểm xe, bảo dưỡng)</option>
                    <option value="support">Nhân viên hỗ trợ (Cứu hộ khẩn cấp)</option>
                    <option value="accountant">Kế toán (Quản lý thu chi)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Phòng ban / Chi nhánh
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Cửa hàng Hải Châu • Đà Nẵng"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Đang lưu...'
                    : editingStaff
                    ? '💾 Cập Nhật'
                    : '✅ Thêm Nhân Viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
