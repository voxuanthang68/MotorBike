'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const ROLE_CONFIG: Record<string, { label: string; color: string; desc: string }> = {
  owner: { label: 'Chủ cửa hàng', color: '#f97316', desc: 'Toàn quyền kiểm soát hệ thống & tài chính' },
  admin: { label: 'Quản trị viên', color: '#8b5cf6', desc: 'Quản trị hệ thống, tài khoản & cấu hình' },
  technician: { label: 'Kỹ thuật viên', color: '#06b6d4', desc: 'Kiểm tra xe, ký điện tử, bảo dưỡng' },
  support: { label: 'Nhân viên hỗ trợ', color: '#10b981', desc: 'Cứu hộ khẩn cấp, giải quyết sự cố 24/7' },
  accountant: { label: 'Kế toán', color: '#f59e0b', desc: 'Quản lý thu chi, cọc, doanh thu' },
  receptionist: { label: 'Lễ tân', color: '#3b82f6', desc: 'Tiếp nhận đặt xe, check-in, check-out' },
  customer: { label: 'Khách hàng', color: '#94a3b8', desc: 'Khách thuê xe máy' },
};

const MODULE_CONFIG: Record<string, string> = {
  dashboard: 'Dashboard tổng quan', vehicles: 'Quản lý xe', bookings: 'Đặt xe & thuê xe',
  contracts: 'Hợp đồng', customers: 'Khách hàng', payments: 'Thanh toán & tiền cọc',
  reports: 'Báo cáo & thống kê', maintenance: 'Bảo trì & sửa chữa', tickets: 'Hỗ trợ khách hàng',
  users: 'Nhân viên & tài khoản', settings: 'Cài đặt hệ thống',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [createModal, setCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { user: currentUser } = useAuthStore();
  const [permissionModal, setPermissionModal] = useState(false);
  const [permissionRole, setPermissionRole] = useState('owner');
  const [permissionDraft, setPermissionDraft] = useState<any[]>([]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('receptionist');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users', selectedRole],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (selectedRole) params.role = selectedRole;
      const res = await api.get('/users', { params });
      return res.data;
    }
  });

  const { data: permissionData } = useQuery({
    queryKey: ['permission-matrix'],
    queryFn: async () => (await api.get('/permissions')).data,
    enabled: ['owner', 'admin'].includes(currentUser?.role || ''),
  });

  const permissionMutation = useMutation({
    mutationFn: async () => {
      const selected = permissionDraft.find(item => item.role === permissionRole);
      return api.put(`/permissions/${permissionRole}`, {
        permissions: Object.fromEntries((selected?.permissions || []).map((item: any) => [item.module, item])),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      toast.success('Đã lưu ma trận phân quyền.');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Không thể lưu phân quyền.'),
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      toast.success('Tạo tài khoản nhân sự thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => api.put(`/users/${editingUser._id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      toast.success('Cập nhật thông tin nhân viên thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Đã xóa nhân viên!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return api.put(`/users/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Cập nhật trạng thái tài khoản thành công!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra!')
  });

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setRole('receptionist');
    setEmployeeId('');
    setDepartment('');
  };

  const closeModal = () => {
    setCreateModal(false);
    setEditingUser(null);
    resetForm();
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setPassword('');
    setRole(user.role || 'receptionist');
    setEmployeeId(user.employeeId || '');
    setDepartment(user.department || '');
    setCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      fullName,
      email,
      phone,
      role,
      employeeId,
      department,
    };
    if (!editingUser || password) payload.password = password;
    if (editingUser) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const users = data?.data || [];
  const activePermission = permissionDraft.find(item => item.role === permissionRole);
  const openPermissionMatrix = () => {
    setPermissionDraft(JSON.parse(JSON.stringify(permissionData?.data || [])));
    setPermissionRole('owner');
    setPermissionModal(true);
  };
  const togglePermission = (module: string, action: string) => {
    setPermissionDraft(previous => previous.map(item => item.role !== permissionRole ? item : {
      ...item,
      permissions: item.permissions.map((permission: any) => permission.module !== module ? permission : { ...permission, [action]: !permission[action] }),
    }));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 Quản Lý Nhân Sự & Phân Quyền (RBAC)</h1>
          <p className="page-subtitle">Phân quyền 7 vai trò: Chủ cửa hàng, Quản trị, Kỹ thuật, Hỗ trợ, Kế toán, Lễ tân, Khách hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
        {['owner', 'admin'].includes(currentUser?.role || '') && <button className="btn btn-secondary" onClick={openPermissionMatrix}>🔐 Ma trận phân quyền</button>}
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingUser(null); setCreateModal(true); }}>
          <span>+</span> Thêm Nhân Viên Mới
        </button>
        </div>
      </div>

      {/* Role Filter tabs */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${selectedRole === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedRole('')}
        >
          Tất Cả ({users.length})
        </button>
        {Object.entries(ROLE_CONFIG).map(([rKey, rCfg]) => (
          <button
            key={rKey}
            className={`btn btn-sm ${selectedRole === rKey ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedRole(rKey)}
          >
            {rCfg.label}
          </button>
        ))}
      </div>

      {/* Users table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
            <div style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách nhân sự...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-text">Chưa có người dùng nào</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '52px', textAlign: 'center' }}>STT</th>
                  <th>Nhân Viên / Người Dùng</th>
                  <th>Số Điện Thoại</th>
                  <th>Vai Trò (Role)</th>
                  <th>Quyền Hạn Chính</th>
                  <th>Ngày Tạo</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any, idx: number) => {
                  const cfg = ROLE_CONFIG[u.role] || { label: u.role, color: '#94a3b8', desc: '' };
                  return (
                    <tr key={u._id}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}88)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: 'white',
                              fontSize: '14px',
                              flexShrink: 0
                            }}
                          >
                            {u.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{u.phone || 'Chưa cập nhật'}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: cfg.color,
                            background: `${cfg.color}15`,
                            border: `1px solid ${cfg.color}33`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {cfg.desc}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>
                      <td>
                        {u.isActive !== false ? (
                          <span className="badge badge-active">Hoạt động</span>
                        ) : (
                          <span className="badge badge-broken">Bị khóa</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(u)} style={{ marginRight: '6px' }}>Sửa</button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xóa nhân viên ${u.fullName}?`)) deleteMutation.mutate(u._id);
                          }}
                          style={{ marginRight: '6px' }}
                        >Xóa</button>
                        <button
                          className={`btn btn-sm ${u.isActive !== false ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleActiveMutation.mutate({ id: u._id, isActive: u.isActive === false })}
                        >
                          {u.isActive !== false ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {permissionModal && (
        <div className="modal-overlay" onClick={() => setPermissionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1050px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">🔐 Ma trận phân quyền vai trò</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Thiết lập quyền Xem, Thêm, Sửa, Xóa cho từng chức năng.</div>
              </div>
              <button onClick={() => setPermissionModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => <button key={key} className={`btn btn-sm ${permissionRole === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPermissionRole(key)}>{cfg.label}</button>)}
            </div>
            <div style={{ overflowX: 'auto', marginTop: 14 }}>
              <table className="data-table" style={{ minWidth: 760 }}>
                <thead><tr><th style={{ width: '52px', textAlign: 'center' }}>STT</th><th>Chức năng</th><th style={{ textAlign: 'center' }}>Xem</th><th style={{ textAlign: 'center' }}>Thêm</th><th style={{ textAlign: 'center' }}>Sửa</th><th style={{ textAlign: 'center' }}>Xóa</th></tr></thead>
                <tbody>
                  {(activePermission?.permissions || []).map((permission: any, idx: number) => <tr key={permission.module}>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                    <td><strong>{MODULE_CONFIG[permission.module] || permission.module}</strong><div style={{ fontSize: 11, color: '#94a3b8' }}>{permission.module}</div></td>
                    {(['view', 'create', 'update', 'delete'] as const).map(action => <td key={action} style={{ textAlign: 'center' }}><input type="checkbox" checked={Boolean(permission[action])} onChange={() => togglePermission(permission.module, action)} style={{ width: 18, height: 18, accentColor: '#2563eb' }} /></td>)}
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setPermissionModal(false)}>Đóng</button>
              <button className="btn btn-primary" disabled={permissionMutation.isPending || !activePermission} onClick={() => permissionMutation.mutate()}>{permissionMutation.isPending ? 'Đang lưu...' : `Lưu quyền cho ${ROLE_CONFIG[permissionRole]?.label || permissionRole}`}</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {createModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">👤 {editingUser ? 'Sửa thông tin nhân viên' : 'Thêm tài khoản nhân viên mới'}</div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn Kỹ Thuật"
                  className="form-input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Email đăng nhập *</label>
                  <input
                    type="email"
                    required
                    placeholder="ktv@motobike.vn"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0905 123 456"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Phân quyền chức vụ (Role) *</label>
                <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="technician">Nhân viên kỹ thuật (Ký điện tử, tình trạng xe, hình ảnh)</option>
                  <option value="receptionist">Lễ tân (Tiếp nhận đặt xe, check-in, check-out)</option>
                  <option value="accountant">Kế toán (Quản lý doanh thu, cọc, dòng tiền)</option>
                  <option value="support">Nhân viên hỗ trợ (Cứu hộ lưu động 24/7)</option>
                  <option value="admin">Quản trị hệ thống (Admin)</option>
                  <option value="owner">Chủ cửa hàng (Owner)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Mã nhân viên</label>
                  <input type="text" className="form-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="NV-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phòng ban</label>
                  <input type="text" className="form-input" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Kỹ thuật" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="••••••"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={closeModal} className="btn btn-secondary w-full">Hủy Bỏ</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn btn-primary w-full">
                  {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : (editingUser ? 'Lưu thay đổi' : 'Tạo Tài Khoản')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
