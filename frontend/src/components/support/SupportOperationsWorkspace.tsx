'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { handleImageError, PHOTO_IMAGE_FALLBACK, resolveMediaUrl, resolveVehicleImage } from '@/lib/media';
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileText,
  Image as ImageIcon,
  Link2,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Repeat,
  Search,
  Send,
  ShieldAlert,
  User as UserIcon,
  UserCheck,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from 'lucide-react';

export interface CustomerSummary {
  _id: string;
  fullName?: string;
  phone?: string;
  email?: string;
  cccd?: string;
  drivingLicense?: string;
  drivingLicenseClass?: string;
  address?: string;
  customerTier?: string;
  isBlacklisted?: boolean;
}

export interface VehicleSummary {
  _id: string;
  name?: string;
  brand?: string;
  licensePlate?: string;
  model?: string;
  color?: string;
  type?: string;
  engineCC?: number;
  odometer?: number;
  status?: string;
  mainImage?: string;
  images?: Array<string | { url?: string }>;
  pricePerDay?: number;
  deposit?: number;
}

export interface BookingSummary {
  _id: string;
  bookingCode?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  pricePerDay?: number;
  deposit?: number;
  finalPrice?: number;
  totalPrice?: number;
  pickupLocation?: string;
  returnLocation?: string;
  rentalType?: string;
  customer?: CustomerSummary | string;
  vehicle?: VehicleSummary | string;
}

export interface ContractSummary {
  _id: string;
  contractCode?: string;
  booking?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  rentalDays?: number;
  totalRentalFee?: number;
  totalPayable?: number;
  depositAmount?: number;
  paidAmount?: number;
  customerInfo?: {
    fullName?: string;
    phone?: string;
    cccd?: string;
  };
  vehicleInfo?: {
    name?: string;
    licensePlate?: string;
  };
}

export interface RepairSummary {
  _id: string;
  code?: string;
  booking?: string;
  bookingCode?: string;
  vehicle?: string;
  vehicleName?: string;
  licensePlate?: string;
  customerName?: string;
  customerPhone?: string;
  issueSummary?: string;
  proposedSolution?: string;
  totalEstimatedCost?: number;
  status?: string;
  progressPercent?: number;
  technicianName?: string;
  createdAt?: string;
}

export interface SupportStaffSummary {
  _id: string;
  fullName?: string;
  phone?: string;
  role?: string;
}

export interface TicketMessage {
  _id?: string;
  sender?: {
    _id?: string;
    fullName?: string;
    phone?: string;
    role?: string;
  };
  content?: string;
  attachments?: string[];
  createdAt?: string;
}

export interface TicketActionLog {
  _id?: string;
  action?: string;
  detail?: string;
  actorName?: string;
  actorRole?: string;
  createdAt?: string;
}

export interface TicketRecord {
  _id: string;
  ticketCode?: string;
  customer?: CustomerSummary;
  booking?: BookingSummary;
  contract?: ContractSummary;
  vehicle?: VehicleSummary;
  linkedRepairOrder?: RepairSummary;
  subject: string;
  description: string;
  locationText?: string;
  category: string;
  priority: string;
  status: string;
  rescueStatus?: string;
  assignedTo?: SupportStaffSummary;
  resolvedBy?: SupportStaffSummary;
  resolvedAt?: string;
  resolution?: string;
  messages?: TicketMessage[];
  actionLogs?: TicketActionLog[];
  hasUnreadCustomerMessage?: boolean;
  hasUnreadStaffMessage?: boolean;
  lastMessageAt?: string;
  createdAt: string;
}

export interface TicketSummaryStats {
  all: number;
  open: number;
  in_progress: number;
  resolved: number;
  urgent: number;
  unread: number;
}

export interface SupportContextData {
  customers: CustomerSummary[];
  bookings: BookingSummary[];
  availableVehicles: VehicleSummary[];
  allVehicles?: VehicleSummary[];
  supportStaff: SupportStaffSummary[];
  contracts: ContractSummary[];
  repairOrders?: RepairSummary[];
}

export const PRIORITY_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  urgent: { label: 'Khẩn cấp', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  high: { label: 'Ưu tiên cao', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  medium: { label: 'Bình thường', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  low: { label: 'Thấp', bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

export const STATUS_META: Record<string, { label: string; bg: string; color: string; border: string }> = {
  open: { label: 'Chờ tiếp nhận', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  in_progress: { label: 'Đang hỗ trợ', bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  resolved: { label: 'Đã giải quyết', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  closed: { label: 'Đã đóng', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  rescue: 'Cứu hộ đường bộ',
  breakdown: 'Hỏng xe / Xin đổi xe',
  vehicle_issue: 'Sự cố phương tiện',
  extension: 'Xin gia hạn thuê xe',
  deposit: 'Đối soát tiền cọc',
  payment: 'Thanh toán / Hóa đơn',
  complaint: 'Khiếu nại dịch vụ',
  general: 'Tư vấn chung',
  service: 'Hỗ trợ dịch vụ',
  other: 'Yêu cầu khác',
};

export const REPAIR_STATUS_LABELS: Record<string, string> = {
  waiting_quote: 'Chờ KTV báo giá',
  waiting_approval: 'Chờ khách duyệt',
  customer_approved: 'Đã duyệt sửa',
  in_progress: 'Đang sửa chữa',
  waiting_acceptance: 'Chờ nghiệm thu',
  completed: 'Đã hoàn tất sửa',
  customer_rejected: 'Khách từ chối',
};

export const QUICK_REPLIES = [
  'Đội cứu hộ XTBike đang trên đường đến vị trí của bạn (dự kiến 15-20 phút).',
  'Bạn vui lòng gửi vị trí GPS hiện tại và chụp 1-2 ảnh tình trạng xe giúp mình nhé.',
  'Cửa hàng đã xác nhận phương án đổi xe thay thế cho bạn, kỹ thuật đang mang xe tới.',
  'Đã kiểm tra lịch xe trống và hỗ trợ gia hạn thời gian thuê theo yêu cầu của bạn.',
];

export function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // Ignore browser autoplay restrictions
  }
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return fallback;
}

const toLocalDateTimeInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export interface SupportTicketIntakeModalProps {
  bookings: BookingSummary[];
  customers: CustomerSummary[];
  initialBookingId?: string;
  initialCustomerId?: string;
  onClose: () => void;
  onCreated: (created: TicketRecord) => void;
}

export function SupportTicketIntakeModal({
  bookings,
  customers,
  initialBookingId = '',
  initialCustomerId = '',
  onClose,
  onCreated,
}: SupportTicketIntakeModalProps) {
  const queryClient = useQueryClient();
  const [bookingId, setBookingId] = useState<string>(initialBookingId);
  const [customerId, setCustomerId] = useState<string>(() => {
    if (initialCustomerId) return initialCustomerId;
    if (initialBookingId) {
      const b = bookings.find((item) => item._id === initialBookingId);
      if (b?.customer && typeof b.customer === 'object') return b.customer._id;
    }
    return '';
  });
  const [category, setCategory] = useState<string>('rescue');
  const [priority, setPriority] = useState<string>('urgent');
  const [locationText, setLocationText] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignToMe, setAssignToMe] = useState<boolean>(true);

  const createTicketMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/tickets', payload);
      return res.data?.data as TicketRecord;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-workspace-context'] });
      toast.success(`Đã tiếp nhận phiếu hỗ trợ #${created?.ticketCode || ''}!`);
      onCreated(created);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể tạo phiếu hỗ trợ.')),
  });

  const activeBookingsOnly = bookings.filter((b) => ['active', 'confirmed', 'pending', 'overdue'].includes(b.status || ''));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', color: '#0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Tiếp nhận Sự cố / Yêu cầu Hỗ trợ (Hotline)</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTicketMutation.mutate({
              bookingId: bookingId || undefined,
              customerId: customerId || undefined,
              category,
              priority,
              locationText,
              subject,
              description,
              assignToMe,
            });
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
              Chọn đơn đang thuê (Tự động gắn Khách + Xe + Hợp đồng)
            </label>
            <select
              value={bookingId}
              onChange={(e) => {
                const bId = e.target.value;
                setBookingId(bId);
                const b = bookings.find((item) => item._id === bId);
                if (b?.customer && typeof b.customer === 'object') {
                  setCustomerId(b.customer._id);
                }
              }}
              style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="">-- Không chọn đơn cụ thể --</option>
              {(activeBookingsOnly.length > 0 ? activeBookingsOnly : bookings).map((b) => {
                const custObj = typeof b.customer === 'object' ? b.customer : undefined;
                const vehObj = typeof b.vehicle === 'object' ? b.vehicle : undefined;
                return (
                  <option key={b._id} value={b._id}>
                    {b.bookingCode} • {custObj?.fullName || 'Khách'} ({custObj?.phone || ''}) • {vehObj?.licensePlate || ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Khách hàng *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="">-- Chọn khách hàng --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fullName} • {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Loại yêu cầu *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mức ưu tiên *</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                <option value="urgent">Khẩn cấp (Cứu hộ ngay)</option>
                <option value="high">Ưu tiên cao</option>
                <option value="medium">Bình thường</option>
                <option value="low">Thấp</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Vị trí hiện tại / Địa điểm</label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="Ví dụ: Gần cầu Rồng, đường Trần Hưng Đạo, Sơn Trà"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tiêu đề sự cố *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ví dụ: Khách báo thủng lốp sau, cần cứu hộ đổi xe"
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mô tả chi tiết *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể yêu cầu khách hàng..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600 }}>
            <input type="checkbox" checked={assignToMe} onChange={(e) => setAssignToMe(e.target.checked)} />
            <span>Tự động nhận xử lý phiếu này ngay</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="submit" disabled={createTicketMutation.isPending} style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}>
              {createTicketMutation.isPending ? 'Đang tạo...' : 'Lưu phiếu hỗ trợ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface SupportOperationsWorkspaceProps {
  embeddedInPortal?: boolean;
  controlledSelectedTicketId?: string | null;
  onSelectTicketId?: (id: string | null) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenBookingLookup?: (bookingCode?: string) => void;
  showAdminPortalLink?: boolean;
}

export function SupportOperationsWorkspace({
  embeddedInPortal = false,
  controlledSelectedTicketId,
  onSelectTicketId,
  soundEnabled: soundEnabledProp,
  onToggleSound,
  onOpenBookingLookup,
  showAdminPortalLink = false,
}: SupportOperationsWorkspaceProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Queue & Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'open' | 'in_progress' | 'mine' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [internalSelectedTicketId, setInternalSelectedTicketId] = useState<string | null>(null);
  const [internalSoundEnabled, setInternalSoundEnabled] = useState<boolean>(true);

  const selectedTicketId = controlledSelectedTicketId !== undefined ? controlledSelectedTicketId : internalSelectedTicketId;
  const setSelectedTicketId = onSelectTicketId || setInternalSelectedTicketId;
  const soundEnabled = soundEnabledProp !== undefined ? soundEnabledProp : internalSoundEnabled;
  const toggleSound = onToggleSound || (() => setInternalSoundEnabled((v) => !v));

  // Conversation controls
  const [replyContent, setReplyContent] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastKnownMsgCountRef = useRef<Record<string, number>>({});

  // Modals state
  const [createModal, setCreateModal] = useState<boolean>(false);

  const [linkContextModal, setLinkContextModal] = useState<boolean>(false);
  const [linkBookingId, setLinkBookingId] = useState<string>('');
  const [linkPriority, setLinkPriority] = useState<string>('medium');
  const [linkCategory, setLinkCategory] = useState<string>('vehicle_issue');
  const [linkLocation, setLinkLocation] = useState<string>('');

  const [dispatchRepairModal, setDispatchRepairModal] = useState<boolean>(false);
  const [repairVehicleId, setRepairVehicleId] = useState<string>('');
  const [repairIssueSummary, setRepairIssueSummary] = useState<string>('');
  const [repairProposedSolution, setRepairProposedSolution] = useState<string>('');
  const [repairMarkBroken, setRepairMarkBroken] = useState<boolean>(true);

  const [swapVehicleModal, setSwapVehicleModal] = useState<boolean>(false);
  const [swapNewVehicleId, setSwapNewVehicleId] = useState<string>('');
  const [swapOldVehicleStatus, setSwapOldVehicleStatus] = useState<'maintenance' | 'broken'>('maintenance');
  const [swapCreateRepair, setSwapCreateRepair] = useState<boolean>(true);
  const [swapNote, setSwapNote] = useState<string>('');

  const [extendRentalModal, setExtendRentalModal] = useState<boolean>(false);
  const [extendNewEndDate, setExtendNewEndDate] = useState<string>('');
  const [extendNote, setExtendNote] = useState<string>('');

  const [resolveModal, setResolveModal] = useState<boolean>(false);
  const [resolveTargetStatus, setResolveTargetStatus] = useState<'resolved' | 'closed'>('resolved');
  const [resolutionNote, setResolutionNote] = useState<string>('');

  // 1. Fetch Support Tickets List
  const {
    data: ticketsPayload,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery<{ data: TicketRecord[]; summary?: TicketSummaryStats }>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets');
      return {
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        summary: res.data?.summary,
      };
    },
    refetchInterval: 4000,
  });

  // 2. Fetch Cross-Module Reference Context
  const { data: contextData } = useQuery<SupportContextData>({
    queryKey: ['support-workspace-context'],
    queryFn: async () => {
      try {
        const res = await api.get('/tickets/workspace/context');
        return res.data?.data || { customers: [], bookings: [], availableVehicles: [], allVehicles: [], supportStaff: [], contracts: [], repairOrders: [] };
      } catch {
        return { customers: [], bookings: [], availableVehicles: [], allVehicles: [], supportStaff: [], contracts: [], repairOrders: [] };
      }
    },
    refetchInterval: 15000,
  });

  const allTickets = useMemo(() => ticketsPayload?.data || [], [ticketsPayload]);
  const summary: TicketSummaryStats = useMemo(() => {
    if (ticketsPayload?.summary) return ticketsPayload.summary;
    return {
      all: allTickets.length,
      open: allTickets.filter((t) => t.status === 'open').length,
      in_progress: allTickets.filter((t) => t.status === 'in_progress').length,
      resolved: allTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      urgent: allTickets.filter((t) => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length,
      unread: allTickets.filter((t) => t.hasUnreadCustomerMessage).length,
    };
  }, [ticketsPayload, allTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (statusFilter === 'unread' && !t.hasUnreadCustomerMessage) return false;
      if (statusFilter === 'open' && t.status !== 'open') return false;
      if (statusFilter === 'in_progress' && t.status !== 'in_progress') return false;
      if (statusFilter === 'mine' && String(t.assignedTo?._id || '') !== String(user?._id || '')) return false;
      if (statusFilter === 'resolved' && !['resolved', 'closed'].includes(t.status)) return false;

      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        const ticketVeh = t.vehicle || (typeof t.booking?.vehicle === 'object' ? t.booking.vehicle : undefined);
        const hay = [
          t.ticketCode,
          t._id.slice(-6),
          t.subject,
          t.description,
          t.customer?.fullName,
          t.customer?.phone,
          t.booking?.bookingCode,
          t.contract?.contractCode,
          ticketVeh?.licensePlate,
          ticketVeh?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allTickets, statusFilter, categoryFilter, priorityFilter, searchInput, user?._id]);

  const activeTicketId = selectedTicketId || filteredTickets[0]?._id || allTickets[0]?._id || null;

  // 3. Live Polling Active Ticket Thread (zero setState-in-effect)
  const { data: activeTicketDetail } = useQuery<TicketRecord | null>({
    queryKey: ['ticket-detail', activeTicketId],
    enabled: Boolean(activeTicketId),
    queryFn: async () => {
      if (!activeTicketId) return null;
      const res = await api.get(`/tickets/${activeTicketId}`);
      const fresh: TicketRecord | undefined = res.data?.data;
      if (!fresh) return null;

      const msgs = fresh.messages || [];
      const prevCount = lastKnownMsgCountRef.current[fresh._id];
      if (prevCount !== undefined && msgs.length > prevCount) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.sender?._id && String(lastMsg.sender._id) !== String(user?._id || '')) {
          if (soundEnabled) playNotificationSound();
          toast('Khách hàng vừa gửi tin nhắn mới!', { icon: '💬' });
        }
      }
      lastKnownMsgCountRef.current[fresh._id] = msgs.length;
      return fresh;
    },
    refetchInterval: 3000,
  });

  const activeTicket: TicketRecord | null = useMemo(() => {
    if (activeTicketDetail && activeTicketDetail._id === activeTicketId) return activeTicketDetail;
    return allTickets.find((t) => t._id === activeTicketId) || null;
  }, [activeTicketDetail, activeTicketId, allTickets]);

  const activeBooking = activeTicket?.booking || null;
  const activeVehicle: VehicleSummary | null = useMemo(() => {
    if (!activeTicket) return null;
    if (activeTicket.vehicle) return activeTicket.vehicle;
    if (activeBooking?.vehicle && typeof activeBooking.vehicle === 'object') return activeBooking.vehicle;
    return null;
  }, [activeTicket, activeBooking]);

  const activeContract: ContractSummary | null = useMemo(() => {
    if (!activeTicket) return null;
    if (activeTicket.contract) return activeTicket.contract;
    if (activeBooking?._id && contextData?.contracts) {
      return contextData.contracts.find((c) => String(c.booking || '') === String(activeBooking._id)) || null;
    }
    return null;
  }, [activeTicket, activeBooking, contextData]);

  const invalidateAllSupportQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-detail', activeTicketId] });
    queryClient.invalidateQueries({ queryKey: ['support-workspace-context'] });
    queryClient.invalidateQueries({ queryKey: ['support-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['bookings-schedule'] });
    queryClient.invalidateQueries({ queryKey: ['contracts-schedule'] });
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  };

  // Handlers & Mutations
  const handleSelectTicket = (ticket: TicketRecord) => {
    setSelectedTicketId(ticket._id);
    if (ticket.hasUnreadCustomerMessage) {
      api.put(`/tickets/${ticket._id}/mark-read`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
      }).catch(() => {});
    }
  };

  const replyMutation = useMutation({
    mutationFn: async ({ id, content, attachments }: { id: string; content: string; attachments?: string[] }) => {
      const res = await api.post(`/tickets/${id}/reply`, { content, attachments });
      return res.data?.data as TicketRecord;
    },
    onSuccess: (updated) => {
      if (updated?._id) {
        lastKnownMsgCountRef.current[updated._id] = (updated.messages || []).length;
      }
      setReplyContent('');
      setAttachedImage(null);
      invalidateAllSupportQueries();
      toast.success('Đã gửi phản hồi hỗ trợ!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Gửi phản hồi thất bại.')),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, assignedTo }: { id: string; assignedTo?: string }) => {
      const res = await api.put(`/tickets/${id}/assign`, { assignedTo });
      return res.data;
    },
    onSuccess: (data) => {
      invalidateAllSupportQueries();
      toast.success(data?.message || 'Đã phân công xử lý!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể phân công phiếu.')),
  });

  const linkContextMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await api.post(`/tickets/${id}/link-context`, payload);
      return res.data;
    },
    onSuccess: () => {
      setLinkContextModal(false);
      invalidateAllSupportQueries();
      toast.success('Đã cập nhật liên kết đơn thuê & phân loại!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật thông tin liên kết.')),
  });

  const dispatchRepairMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await api.post(`/tickets/${id}/dispatch-repair`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setDispatchRepairModal(false);
      invalidateAllSupportQueries();
      toast.success(data?.message || 'Đã chuyển bộ phận Kỹ thuật xử lý!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể tạo phiếu kỹ thuật.')),
  });

  const swapVehicleMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await api.post(`/tickets/${id}/swap-vehicle`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSwapVehicleModal(false);
      invalidateAllSupportQueries();
      toast.success(data?.message || 'Đã đổi xe thành công!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể đổi xe.')),
  });

  const extendRentalMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await api.post(`/tickets/${id}/extend-rental`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setExtendRentalModal(false);
      invalidateAllSupportQueries();
      toast.success(data?.message || 'Đã gia hạn hợp đồng thuê!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể gia hạn đơn thuê.')),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution, priority }: { id: string; status?: string; resolution?: string; priority?: string }) => {
      const res = await api.put(`/tickets/${id}`, { status, resolution, priority });
      return res.data;
    },
    onSuccess: () => {
      setResolveModal(false);
      setResolutionNote('');
      invalidateAllSupportQueries();
      toast.success('Đã cập nhật trạng thái phiếu hỗ trợ!');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái.')),
  });

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(String(reader.result || ''));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAttachGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    toast.loading('Đang lấy tọa độ GPS...', { id: 'support-gps' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const mapsLink = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setReplyContent((prev) => (prev ? `${prev}\n📍 Vị trí điều phối: ${mapsLink}` : `📍 Vị trí điều phối: ${mapsLink}`));
        toast.success('Đã gắn tọa độ GPS!', { id: 'support-gps' });
      },
      () => toast.error('Không thể lấy GPS. Vui lòng bật định vị.', { id: 'support-gps' }),
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const openDispatchRepairModal = () => {
    if (!activeTicket) return;
    setRepairVehicleId(activeVehicle?._id || '');
    setRepairIssueSummary(activeTicket.subject || '');
    setRepairProposedSolution(activeTicket.description || '');
    setRepairMarkBroken(true);
    setDispatchRepairModal(true);
  };

  const openSwapVehicleModal = () => {
    if (!activeTicket) return;
    const avail = contextData?.availableVehicles || [];
    setSwapNewVehicleId(avail[0]?._id || '');
    setSwapOldVehicleStatus('maintenance');
    setSwapCreateRepair(true);
    setSwapNote('');
    setSwapVehicleModal(true);
  };

  const openExtendRentalModal = () => {
    if (!activeBooking?.endDate) {
      toast.error('Phiếu chưa gắn đơn thuê xe có ngày kết thúc hợp lệ.');
      return;
    }
    const currentEnd = new Date(activeBooking.endDate);
    const plusOneDay = new Date(currentEnd.getTime() + 86400000);
    setExtendNewEndDate(toLocalDateTimeInput(plusOneDay));
    setExtendNote('');
    setExtendRentalModal(true);
  };

  const openLinkContextModal = () => {
    if (!activeTicket) return;
    setLinkBookingId(activeBooking?._id || '');
    setLinkPriority(activeTicket.priority || 'medium');
    setLinkCategory(activeTicket.category || 'vehicle_issue');
    setLinkLocation(activeTicket.locationText || '');
    setLinkContextModal(true);
  };

  const handleCopyPhone = (phone?: string) => {
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    toast.success(`Đã sao chép SĐT: ${phone}`);
  };

  const bookingsList = contextData?.bookings || [];
  const customersList = contextData?.customers || [];
  const availableVehicles = contextData?.availableVehicles || [];
  const supportStaff = contextData?.supportStaff || [];

  return (
    <div style={{ padding: embeddedInPortal ? '0' : '20px 28px', background: '#f8fafc', minHeight: embeddedInPortal ? 'auto' : 'calc(100vh - 64px)', color: '#0f172a' }}>
      {/* 1. HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: embeddedInPortal ? '20px' : '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert style={{ width: '22px', height: '22px', color: '#2563eb' }} />
            <span>Xử Lý Ticket, Chat Trực Tuyến &amp; Điều Phối Cứu Hộ</span>
          </h1>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
            Tiếp nhận phản hồi, tra cứu hồ sơ hợp đồng – xe đang thuê, điều phối kỹ thuật, đổi xe và gia hạn hợp đồng trực tiếp.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {showAdminPortalLink && (
            <Link
              href="/support"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Mở Cổng Hỗ Trợ Viên (/support) →</span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleSound}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: soundEnabled ? '#0f172a' : '#64748b',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Bật / tắt âm báo tin nhắn mới"
          >
            {soundEnabled ? <Volume2 size={15} color="#059669" /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'Âm báo: Bật' : 'Âm báo: Tắt'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              refetchTickets();
              queryClient.invalidateQueries({ queryKey: ['support-workspace-context'] });
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>Tiếp nhận sự cố / Yêu cầu</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Chờ tiếp nhận', value: summary.open, color: '#d97706', bg: '#fffbeb', border: '#fde68a', filter: 'open' as const },
          { label: 'Đang hỗ trợ', value: summary.in_progress, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', filter: 'in_progress' as const },
          { label: 'Tin nhắn chờ trả lời', value: summary.unread, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', filter: 'unread' as const },
          { label: 'Khẩn cấp chưa xong', value: summary.urgent, color: '#b91c1c', bg: '#fff1f2', border: '#fecdd3', filter: 'all' as const },
          { label: 'Đã hoàn tất', value: summary.resolved, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', filter: 'resolved' as const },
        ].map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={() => setStatusFilter(kpi.filter)}
            style={{
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '10px',
              border: statusFilter === kpi.filter && kpi.filter !== 'all' ? `2px solid ${kpi.color}` : `1px solid ${kpi.border}`,
              background: kpi.bg,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>{kpi.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: kpi.color, marginTop: '4px' }}>{kpi.value}</div>
          </button>
        ))}
      </div>

      {/* 3. EMERGENCY RESCUE INFO + FILTER TOOLBAR */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all' as const, label: `Tất cả (${summary.all})` },
              { id: 'unread' as const, label: `Tin mới (${summary.unread})` },
              { id: 'open' as const, label: `Chờ xử lý (${summary.open})` },
              { id: 'in_progress' as const, label: `Đang hỗ trợ (${summary.in_progress})` },
              { id: 'mine' as const, label: 'Phiếu của tôi' },
              { id: 'resolved' as const, label: `Đã xong (${summary.resolved})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === tab.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: statusFilter === tab.id ? '#0f172a' : '#f8fafc',
                  color: statusFilter === tab.id ? '#ffffff' : '#475569',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '999px' }}>
            Hotline Cứu Hộ 24/7: 0905.888.999 • Hải Châu – Đà Nẵng
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) 1fr 1fr', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Tìm mã phiếu, tên khách, SĐT, biển số xe, mã đơn BK..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
          >
            <option value="all">Tất cả loại yêu cầu</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
          >
            <option value="all">Tất cả mức ưu tiên</option>
            <option value="urgent">Khẩn cấp</option>
            <option value="high">Ưu tiên cao</option>
            <option value="medium">Bình thường</option>
            <option value="low">Thấp</option>
          </select>
        </div>
      </div>

      {/* 4. 3-COLUMN SUPPORT OPERATIONS WORKSPACE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 330px) minmax(360px, 1fr) minmax(290px, 330px)',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* LEFT PANE: TICKET QUEUE */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '720px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Hàng đợi xử lý ({filteredTickets.length})</span>
            {summary.unread > 0 && (
              <span style={{ fontSize: '11px', background: '#dc2626', color: '#fff', padding: '2px 8px', borderRadius: '999px' }}>
                {summary.unread} mới
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ticketsLoading ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Đang tải danh sách phiếu hỗ trợ...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                Không có phiếu hỗ trợ nào phù hợp bộ lọc.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = activeTicket?._id === t._id;
                const pri = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                const sta = STATUS_META[t.status] || STATUS_META.open;
                const vehObj = t.vehicle || (typeof t.booking?.vehicle === 'object' ? t.booking.vehicle : undefined);

                return (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => handleSelectTicket(t)}
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : t.hasUnreadCustomerMessage ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : t.hasUnreadCustomerMessage ? '#fffbeb' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '12px', color: '#2563eb' }}>
                        #{t.ticketCode || t._id.slice(-6).toUpperCase()}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {t.hasUnreadCustomerMessage && (
                          <span style={{ fontSize: '10px', fontWeight: 800, background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: '999px' }}>
                            Tin mới
                          </span>
                        )}
                        <span style={{ fontSize: '10.5px', fontWeight: 700, background: pri.bg, color: pri.color, border: `1px solid ${pri.border}`, padding: '1px 6px', borderRadius: '999px' }}>
                          {pri.label}
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, background: sta.bg, color: sta.color, border: `1px solid ${sta.border}`, padding: '1px 6px', borderRadius: '999px' }}>
                          {sta.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', lineHeight: 1.3 }}>{t.subject}</div>
                    <div style={{ fontSize: '12px', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b', marginTop: '2px', flexWrap: 'wrap', gap: '4px' }}>
                      <span>
                        <strong>{t.customer?.fullName || 'Khách hàng'}</strong> {t.customer?.phone ? `• ${t.customer.phone}` : ''}
                      </span>
                      {vehObj?.licensePlate && (
                        <span style={{ fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                          {vehObj.licensePlate}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8' }}>
                      <span>{CATEGORY_LABELS[t.category] || t.category}</span>
                      <span>{new Date(t.lastMessageAt || t.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER PANE: CONVERSATION & RESOLUTION */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            height: '720px',
            overflow: 'hidden',
          }}
        >
          {!activeTicket ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '32px', textAlign: 'center' }}>
              <MessageSquare size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#334155' }}>Chọn một phiếu hỗ trợ ở danh sách bên trái</div>
              <div style={{ fontSize: '12.5px', marginTop: '4px' }}>Bạn có thể trao đổi trực tiếp, gửi GPS/ảnh, đổi xe, gia hạn hoặc báo kỹ thuật.</div>
            </div>
          ) : (
            <>
              {/* Center Top Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', fontSize: '13px' }}>
                        #{activeTicket.ticketCode || activeTicket._id.slice(-6).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#e2e8f0', color: '#334155' }}>
                        {CATEGORY_LABELS[activeTicket.category] || activeTicket.category}
                      </span>
                      {activeTicket.linkedRepairOrder && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                          🔧 {activeTicket.linkedRepairOrder.code} ({REPAIR_STATUS_LABELS[activeTicket.linkedRepairOrder.status || ''] || activeTicket.linkedRepairOrder.status})
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>{activeTicket.subject}</h2>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>{activeTicket.description}</div>
                    {activeTicket.locationText && (
                      <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <MapPin size={13} />
                        <span>Vị trí: {activeTicket.locationText}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Assignment */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {String(activeTicket.assignedTo?._id || '') !== String(user?._id || '') && (
                        <button
                          type="button"
                          onClick={() => assignMutation.mutate({ id: activeTicket._id })}
                          disabled={assignMutation.isPending}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <UserCheck size={13} />
                          <span>Nhận xử lý</span>
                        </button>
                      )}
                      <select
                        value={activeTicket.assignedTo?._id || ''}
                        onChange={(e) => {
                          if (e.target.value) assignMutation.mutate({ id: activeTicket._id, assignedTo: e.target.value });
                        }}
                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '11.5px', background: '#ffffff' }}
                      >
                        <option value="">-- Phân công nhân viên --</option>
                        {supportStaff.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.fullName} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(!activeTicket.messages || activeTicket.messages.length === 0) ? (
                  <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', fontSize: '13px', maxWidth: '340px' }}>
                    Chưa có tin nhắn phản hồi. Chọn câu trả lời nhanh bên dưới hoặc nhập tin nhắn hỗ trợ khách hàng ngay.
                  </div>
                ) : (
                  activeTicket.messages.map((msg, idx) => {
                    const isCustomer =
                      msg.sender?.role === 'customer' ||
                      (activeTicket.customer?._id && String(msg.sender?._id || '') === String(activeTicket.customer._id));
                    const isMe = !isCustomer && String(msg.sender?._id || '') === String(user?._id || '');
                    const senderLabel = isCustomer
                      ? activeTicket.customer?.fullName || msg.sender?.fullName || 'Khách hàng'
                      : msg.sender?.fullName || 'Nhân viên hỗ trợ';

                    return (
                      <div
                        key={msg._id || idx}
                        style={{
                          alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                          maxWidth: '82%',
                          background: isCustomer ? '#ffffff' : isMe ? '#2563eb' : '#1e293b',
                          color: isCustomer ? '#0f172a' : '#ffffff',
                          border: isCustomer ? '1px solid #e2e8f0' : 'none',
                          borderRadius: isCustomer ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                          padding: '10px 14px',
                          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
                          fontSize: '13px',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: isCustomer ? '#059669' : '#bfdbfe' }}>
                          {isCustomer ? 'Khách hàng: ' : 'Hỗ trợ viên: '}
                          {senderLabel}
                        </div>

                        {msg.content && (
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.45 }}>
                            {msg.content}
                          </div>
                        )}

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {msg.attachments.map((imgUrl, aIdx) => {
                              const resolvedAtt = resolveMediaUrl(imgUrl, PHOTO_IMAGE_FALLBACK);
                              return (
                                <img
                                  key={aIdx}
                                  src={resolvedAtt}
                                  alt="Đính kèm"
                                  onError={handleImageError(PHOTO_IMAGE_FALLBACK)}
                                  onClick={() => setLightboxImage(resolvedAtt)}
                                  style={{ width: '160px', height: '110px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', border: '1px solid rgba(0,0,0,0.12)', background: '#e2e8f0' }}
                                />
                              );
                            })}
                          </div>
                        )}

                        <div style={{ fontSize: '10px', opacity: 0.72, marginTop: '4px', textAlign: 'right' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Replies + Composer */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr}
                      type="button"
                      onClick={() => setReplyContent(qr)}
                      style={{
                        whiteSpace: 'nowrap',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#334155',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {qr.slice(0, 48)}...
                    </button>
                  ))}
                </div>

                {attachedImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: '#eff6ff', borderRadius: '8px', marginBottom: '8px' }}>
                    <img src={attachedImage} alt="Preview" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }} />
                    <span style={{ flex: 1, fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>Ảnh đính kèm sẵn sàng gửi</span>
                    <button
                      type="button"
                      onClick={() => setAttachedImage(null)}
                      style={{ border: 'none', background: '#ef4444', color: '#fff', borderRadius: '999px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      ×
                    </button>
                  </div>
                )}

                <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleImageFileChange} />
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageFileChange} />

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!activeTicket || (!replyContent.trim() && !attachedImage)) return;
                    replyMutation.mutate({
                      id: activeTicket._id,
                      content: replyContent.trim(),
                      attachments: attachedImage ? [attachedImage] : [],
                    });
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nhập phản hồi hỗ trợ, hướng dẫn cứu hộ..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="submit"
                      disabled={replyMutation.isPending || (!replyContent.trim() && !attachedImage)}
                      style={{
                        padding: '0 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Send size={14} />
                      <span>{replyMutation.isPending ? 'Đang gửi' : 'Gửi'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Camera size={13} />
                        <span>Chụp hình</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ImageIcon size={13} />
                        <span>Tải ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAttachGPS}
                        style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <MapPin size={13} />
                        <span>Gắn GPS</span>
                      </button>
                    </div>

                    {!['resolved', 'closed'].includes(activeTicket.status) && (
                      <button
                        type="button"
                        onClick={() => {
                          setResolveTargetStatus('resolved');
                          setResolutionNote(activeTicket.resolution || 'Đã hoàn tất hỗ trợ xử lý cho khách hàng.');
                          setResolveModal(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#059669',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Hoàn tất xử lý</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* RIGHT PANE: CROSS-MODULE DATA & OPERATIONS */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '720px',
            overflowY: 'auto',
          }}
        >
          {!activeTicket ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12.5px', padding: '40px 10px' }}>
              Chưa chọn phiếu hỗ trợ.
            </div>
          ) : (
            <>
              {/* A. Customer Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={14} color="#2563eb" />
                    HỒ SƠ KHÁCH HÀNG
                  </span>
                  {activeTicket.customer?.isBlacklisted && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px' }}>
                      Cảnh báo rủi ro
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                  {activeTicket.customer?.fullName || 'Chưa rõ khách hàng'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12.5px', color: '#334155' }}>
                  <Phone size={13} color="#64748b" />
                  <strong>{activeTicket.customer?.phone || '---'}</strong>
                  {activeTicket.customer?.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(activeTicket.customer?.phone)}
                      style={{ border: 'none', background: '#e2e8f0', borderRadius: '4px', padding: '2px 6px', fontSize: '10.5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Copy size={11} />
                      Copy
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', display: 'grid', gap: '2px' }}>
                  <div>CCCD: <strong>{activeTicket.customer?.cccd || 'Chưa cập nhật'}</strong></div>
                  <div>GPLX: <strong>{activeTicket.customer?.drivingLicense || 'Chưa cập nhật'}</strong></div>
                  <div>Địa chỉ: <strong>{activeTicket.customer?.address || '---'}</strong></div>
                </div>
              </div>

              {/* B. Linked Booking, Contract & Vehicle Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#059669" />
                    ĐƠN THUÊ &amp; HỢP ĐỒNG
                  </span>
                  <button
                    type="button"
                    onClick={openLinkContextModal}
                    style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <Link2 size={12} />
                    {activeBooking ? 'Đổi liên kết' : 'Gắn đơn / xe'}
                  </button>
                </div>

                {activeBooking ? (
                  <div style={{ fontSize: '12px', display: 'grid', gap: '4px', color: '#334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mã đơn:</span>
                      <strong style={{ color: '#2563eb' }}>{activeBooking.bookingCode}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mã HĐ:</span>
                      <strong>{activeContract?.contractCode || 'Chưa lập HĐ'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Thời gian thuê:</span>
                      <strong>
                        {activeBooking.startDate ? new Date(activeBooking.startDate).toLocaleDateString('vi-VN') : '---'} →{' '}
                        {activeBooking.endDate ? new Date(activeBooking.endDate).toLocaleDateString('vi-VN') : '---'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Giá trị đơn / Cọc:</span>
                      <strong>
                        {Number(activeBooking.finalPrice || activeBooking.totalPrice || 0).toLocaleString('vi-VN')}đ /{' '}
                        {Number(activeBooking.deposit || 0).toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {onOpenBookingLookup ? (
                        <button
                          type="button"
                          onClick={() => onOpenBookingLookup(activeBooking.bookingCode)}
                          style={{ border: 'none', background: 'none', padding: 0, fontSize: '11px', fontWeight: 700, color: '#2563eb', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Xem chi tiết Đơn &amp; Hợp đồng →
                        </button>
                      ) : (
                        <>
                          <Link href="/dashboard/bookings" style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textDecoration: 'underline' }}>
                            Mở Quản lý đặt xe →
                          </Link>
                          {activeContract && (
                            <Link href="/dashboard/contracts" style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textDecoration: 'underline' }}>
                              Mở Hợp đồng →
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    Phiếu chưa gắn với đơn thuê cụ thể. Bấm &quot;Gắn đơn / xe&quot; để liên kết dữ liệu hợp đồng &amp; xe.
                  </div>
                )}

                {activeVehicle && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img
                      src={resolveVehicleImage(activeVehicle)}
                      alt={activeVehicle.name || 'Xe'}
                      onError={handleImageError()}
                      style={{ width: '56px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#e2e8f0', flexShrink: 0 }}
                    />
                    <div style={{ fontSize: '12px', flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{activeVehicle.licensePlate}</div>
                      <div style={{ color: '#475569' }}>{activeVehicle.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Odo: {Number(activeVehicle.odometer || 0).toLocaleString('vi-VN')} km • Trạng thái: <strong>{activeVehicle.status}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* C. Cross-Module Action Dispatchers */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#f59e0b" />
                  <span>NGHIỆP VỤ ĐIỀU PHỐI LIÊN KẾT</span>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={openDispatchRepairModal}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #fed7aa',
                      background: '#fff7ed',
                      color: '#c2410c',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Wrench size={14} />
                    <span>Báo Kỹ thuật / Lập phiếu sửa chữa</span>
                  </button>

                  <button
                    type="button"
                    onClick={openSwapVehicleModal}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Repeat size={14} />
                    <span>Đổi xe khẩn cấp cho khách</span>
                  </button>

                  <button
                    type="button"
                    onClick={openExtendRentalModal}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                      background: '#f0fdf4',
                      color: '#15803d',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <CalendarClock size={14} />
                    <span>Gia hạn thời gian thuê trên HĐ</span>
                  </button>

                  {!['resolved', 'closed'].includes(activeTicket.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolveTargetStatus('resolved');
                        setResolutionNote(activeTicket.resolution || 'Đã hoàn tất xử lý và phản hồi khách hàng.');
                        setResolveModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ClipboardCheck size={14} />
                      <span>Chốt kết quả &amp; Đóng yêu cầu</span>
                    </button>
                  )}
                </div>
              </div>

              {/* D. Audit Action Timeline */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  LỊCH SỬ XỬ LÝ ({activeTicket.actionLogs?.length || 0})
                </div>
                {!activeTicket.actionLogs || activeTicket.actionLogs.length === 0 ? (
                  <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Chưa có log thao tác nào.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeTicket.actionLogs
                      .slice()
                      .reverse()
                      .map((log, i) => (
                        <div key={log._id || i} style={{ fontSize: '11.5px', borderLeft: '2px solid #cbd5e1', paddingLeft: '8px' }}>
                          <div style={{ fontWeight: 700, color: '#334155' }}>{log.detail}</div>
                          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {log.actorName || 'Hệ thống'} • {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================= MODAL 1: TIẾP NHẬN SỰ CỐ / YÊU CẦU MỚI ================= */}
      {createModal && (
        <SupportTicketIntakeModal
          bookings={bookingsList}
          customers={customersList}
          onClose={() => setCreateModal(false)}
          onCreated={(created) => {
            setCreateModal(false);
            if (created?._id) setSelectedTicketId(created._id);
          }}
        />
      )}

      {/* ================= MODAL 2: LIÊN KẾT ĐƠN ĐẶT XE / CẬP NHẬT NGỮ CẢNH ================= */}
      {linkContextModal && activeTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setLinkContextModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '10px', maxWidth: '520px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '17px', fontWeight: 800 }}>Liên kết Đơn thuê &amp; Phân loại Sự cố</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                linkContextMutation.mutate({
                  id: activeTicket._id,
                  payload: {
                    bookingId: linkBookingId || undefined,
                    priority: linkPriority,
                    category: linkCategory,
                    locationText: linkLocation,
                  },
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Gắn đơn đặt xe</label>
                <select value={linkBookingId} onChange={(e) => setLinkBookingId(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <option value="">-- Giữ nguyên / Không gắn --</option>
                  {bookingsList.map((b) => {
                    const custObj = typeof b.customer === 'object' ? b.customer : undefined;
                    const vehObj = typeof b.vehicle === 'object' ? b.vehicle : undefined;
                    return (
                      <option key={b._id} value={b._id}>
                        {b.bookingCode} • {custObj?.fullName || 'Khách'} • {vehObj?.licensePlate || ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Loại yêu cầu</label>
                  <select value={linkCategory} onChange={(e) => setLinkCategory(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Ưu tiên</label>
                  <select value={linkPriority} onChange={(e) => setLinkPriority(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                    <option value="urgent">Khẩn cấp</option>
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Bình thường</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Vị trí sự cố</label>
                <input type="text" value={linkLocation} onChange={(e) => setLinkLocation(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setLinkContextModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={linkContextMutation.isPending} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {linkContextMutation.isPending ? 'Đang lưu...' : 'Lưu liên kết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ĐIỀU PHỐI KỸ THUẬT / TẠO PHIẾU SỬA ================= */}
      {dispatchRepairModal && activeTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setDispatchRepairModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '10px', maxWidth: '520px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800 }}>Báo Kỹ thuật viên &amp; Lập phiếu sửa chữa</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#64748b' }}>
              Hệ thống sẽ tạo phiếu sửa chữa thực tế đồng bộ ngay sang trang Kỹ thuật viên và gửi thông báo cứu hộ.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!repairVehicleId) {
                  toast.error('Vui lòng chọn xe cần kỹ thuật kiểm tra.');
                  return;
                }
                dispatchRepairMutation.mutate({
                  id: activeTicket._id,
                  payload: {
                    vehicleId: repairVehicleId,
                    issueSummary: repairIssueSummary,
                    proposedSolution: repairProposedSolution,
                    markBroken: repairMarkBroken,
                  },
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Xe gặp sự cố *</label>
                <select value={repairVehicleId} onChange={(e) => setRepairVehicleId(e.target.value)} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <option value="">-- Chọn xe --</option>
                  {activeVehicle && (
                    <option value={activeVehicle._id}>
                      {activeVehicle.licensePlate} - {activeVehicle.name} (Xe trên đơn)
                    </option>
                  )}
                  {(contextData?.allVehicles || availableVehicles)
                    .filter((v) => v._id !== activeVehicle?._id)
                    .map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.licensePlate} - {v.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tóm tắt hư hỏng *</label>
                <input type="text" required value={repairIssueSummary} onChange={(e) => setRepairIssueSummary(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Yêu cầu xử lý gửi Kỹ thuật viên *</label>
                <textarea rows={3} required value={repairProposedSolution} onChange={(e) => setRepairProposedSolution(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600 }}>
                <input type="checkbox" checked={repairMarkBroken} onChange={(e) => setRepairMarkBroken(e.target.checked)} />
                <span>Đánh dấu xe ở trạng thái Hỏng (broken) thay vì Bảo trì (maintenance)</span>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setDispatchRepairModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={dispatchRepairMutation.isPending} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ea580c', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {dispatchRepairMutation.isPending ? 'Đang điều phối...' : 'Gửi Kỹ thuật xử lý'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ĐỔI XE KHẨN CẤP ================= */}
      {swapVehicleModal && activeTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSwapVehicleModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '10px', maxWidth: '520px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800 }}>Đổi xe khẩn cấp cho Khách hàng</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#64748b' }}>
              Cập nhật đồng thời xe mới lên Đơn đặt xe &amp; Hợp đồng, giải phóng/chuyển xe cũ sang bảo trì và thông báo khách hàng.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!swapNewVehicleId) {
                  toast.error('Không có xe sẵn sàng để đổi.');
                  return;
                }
                swapVehicleMutation.mutate({
                  id: activeTicket._id,
                  payload: {
                    newVehicleId: swapNewVehicleId,
                    oldVehicleStatus: swapOldVehicleStatus,
                    createRepairOrder: swapCreateRepair,
                    note: swapNote,
                  },
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                Đơn: <strong>{activeBooking?.bookingCode || 'Chưa gắn đơn'}</strong> • Xe hiện tại:{' '}
                <strong>{activeVehicle?.licensePlate || '---'} ({activeVehicle?.name || ''})</strong>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Chọn xe thay thế đang sẵn sàng ({availableVehicles.length}) *
                </label>
                <select value={swapNewVehicleId} onChange={(e) => setSwapNewVehicleId(e.target.value)} required style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <option value="">-- Chọn xe sẵn sàng --</option>
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.licensePlate} - {v.name} ({Number(v.pricePerDay || 0).toLocaleString('vi-VN')}đ/ngày)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Trạng thái xe cũ sau khi đổi</label>
                <select value={swapOldVehicleStatus} onChange={(e) => setSwapOldVehicleStatus(e.target.value === 'broken' ? 'broken' : 'maintenance')} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <option value="maintenance">Đưa về Bảo trì (maintenance)</option>
                  <option value="broken">Đánh dấu Xe hỏng nặng (broken)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Lý do / Ghi chú đổi xe</label>
                <input type="text" value={swapNote} onChange={(e) => setSwapNote(e.target.value)} placeholder="Xe chết máy không nổ, đổi xe khác để khách tiếp tục hành trình..." style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600 }}>
                <input type="checkbox" checked={swapCreateRepair} onChange={(e) => setSwapCreateRepair(e.target.checked)} />
                <span>Tự động lập Phiếu sửa chữa cho xe cũ gửi Kỹ thuật viên</span>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setSwapVehicleModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={swapVehicleMutation.isPending} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {swapVehicleMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đổi xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: GIA HẠN THỜI GIAN THUÊ ================= */}
      {extendRentalModal && activeTicket && activeBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setExtendRentalModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '10px', maxWidth: '500px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800 }}>Gia hạn Hợp đồng &amp; Đơn thuê</h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#64748b' }}>
              Hệ thống tự động kiểm tra trùng lịch xe và cộng thêm tiền thuê phát sinh lên Đơn đặt xe &amp; Hợp đồng.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                extendRentalMutation.mutate({
                  id: activeTicket._id,
                  payload: {
                    newEndDate: extendNewEndDate ? new Date(extendNewEndDate).toISOString() : undefined,
                    note: extendNote,
                  },
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                <div>Đơn: <strong>{activeBooking.bookingCode}</strong> ({activeVehicle?.licensePlate || '---'})</div>
                <div>Ngày trả hiện tại: <strong>{activeBooking.endDate ? new Date(activeBooking.endDate).toLocaleString('vi-VN') : '---'}</strong></div>
                <div>Đơn giá: <strong>{Number(activeBooking.pricePerDay || 0).toLocaleString('vi-VN')} đ/ngày</strong></div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Ngày &amp; giờ trả xe mới *</label>
                <input
                  type="datetime-local"
                  required
                  value={extendNewEndDate}
                  onChange={(e) => setExtendNewEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Ghi chú gia hạn</label>
                <input type="text" value={extendNote} onChange={(e) => setExtendNote(e.target.value)} placeholder="Khách xác nhận thanh toán phụ thu khi trả xe..." style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setExtendRentalModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={extendRentalMutation.isPending} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {extendRentalMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận gia hạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: CHỐT KẾT QUẢ & ĐÓNG PHIẾU ================= */}
      {resolveModal && activeTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setResolveModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '10px', maxWidth: '480px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: 800 }}>Hoàn tất &amp; Đóng yêu cầu hỗ trợ</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateStatusMutation.mutate({
                  id: activeTicket._id,
                  status: resolveTargetStatus,
                  resolution: resolutionNote,
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Trạng thái sau xử lý</label>
                <select value={resolveTargetStatus} onChange={(e) => setResolveTargetStatus(e.target.value === 'closed' ? 'closed' : 'resolved')} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                  <option value="resolved">Đã giải quyết (Resolved)</option>
                  <option value="closed">Đóng phiếu (Closed)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Nội dung kết quả xử lý *</label>
                <textarea rows={3} required value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setResolveModal(false)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={updateStatusMutation.isPending} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {updateStatusMutation.isPending ? 'Đang lưu...' : 'Xác nhận hoàn tất'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX PREVIEW ================= */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={resolveMediaUrl(lightboxImage, PHOTO_IMAGE_FALLBACK)}
              alt="Ảnh phóng to"
              onError={handleImageError(PHOTO_IMAGE_FALLBACK)}
              style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }}
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              style={{ position: 'absolute', top: '-14px', right: '-14px', background: '#ffffff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '18px', fontWeight: 700, cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportOperationsWorkspace;
