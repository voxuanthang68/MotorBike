'use client';

import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Eye,
  ArrowLeft,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Camera,
  Trash2,
  Printer,
  Clock,
  Info,
  X,
  Bike,
  User,
  Phone,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Package
} from 'lucide-react';
import {
  RepairItem,
  RepairStatus,
  RepairPartLine,
  RepairDamageEvidenceItem,
  PartItem,
  SAMPLE_PHOTOS
} from './types';

interface RepairManagementWorkspaceProps {
  repairs: RepairItem[];
  selectedRepairId: string | null;
  onSelectRepairId: (id: string | null) => void;
  onUpdateRepair: (updated: RepairItem) => void;
  onCreateRepair: (created: RepairItem) => void;
  vehicles: Array<{
    _id: string;
    name: string;
    licensePlate: string;
    type?: string;
    odometer?: number;
    image?: string;
  }>;
  partsCatalog: PartItem[];
  inspectorName: string;
  onCompleteVehicleAvailable?: (vehicleId: string) => void;
  searchQuery?: string;
}

const STATUS_TABS: Array<{ key: 'all' | RepairStatus; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting_quote', label: 'Chờ báo giá' },
  { key: 'waiting_approval', label: 'Chờ khách xác nhận' },
  { key: 'customer_approved', label: 'Đã xác nhận' },
  { key: 'in_progress', label: 'Đang sửa chữa' },
  { key: 'waiting_acceptance', label: 'Chờ nghiệm thu' },
  { key: 'completed', label: 'Đã hoàn thành' },
  { key: 'customer_rejected', label: 'Khách từ chối' }
];

const STATUS_META: Record<
  RepairStatus,
  { label: string; badgeText: string; bg: string; color: string; border: string; step: number }
> = {
  waiting_quote: {
    label: 'Chờ báo giá',
    badgeText: 'Chờ báo giá',
    bg: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    step: 1
  },
  waiting_approval: {
    label: 'Chờ khách xác nhận',
    badgeText: 'Chờ khách xác nhận',
    bg: '#fefce8',
    color: '#a16207',
    border: '1px solid #fde68a',
    step: 2
  },
  customer_approved: {
    label: 'Đã xác nhận',
    badgeText: 'Đã xác nhận',
    bg: '#ecfdf5',
    color: '#059669',
    border: '1px solid #a7f3d0',
    step: 3
  },
  in_progress: {
    label: 'Đang sửa chữa',
    badgeText: 'Đang sửa chữa',
    bg: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    step: 4
  },
  waiting_acceptance: {
    label: 'Chờ nghiệm thu',
    badgeText: 'Chờ nghiệm thu',
    bg: '#eef2ff',
    color: '#4f46e5',
    border: '1px solid #c7d2fe',
    step: 5
  },
  completed: {
    label: 'Đã hoàn thành',
    badgeText: 'Đã hoàn thành',
    bg: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    step: 6
  },
  customer_rejected: {
    label: 'Khách từ chối sửa chữa',
    badgeText: 'Khách từ chối sửa chữa',
    bg: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    step: 3
  }
};

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RepairManagementWorkspace({
  repairs,
  selectedRepairId,
  onSelectRepairId,
  onUpdateRepair,
  onCreateRepair,
  vehicles,
  partsCatalog,
  inspectorName,
  onCompleteVehicleAvailable,
  searchQuery = ''
}: RepairManagementWorkspaceProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | RepairStatus>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  // Create Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVehicleKey, setNewVehicleKey] = useState('');
  const [newBookingCode, setNewBookingCode] = useState('HD-DN-2026-320');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newPickPartId, setNewPickPartId] = useState(partsCatalog[0]?.id || '');
  const [newPickQty, setNewPickQty] = useState(1);
  const [newModalParts, setNewModalParts] = useState<RepairPartLine[]>([]);
  const [newLaborFee, setNewLaborFee] = useState(150000);
  const [newTechNotes, setNewTechNotes] = useState('');

  // Detail View Local States
  const [detailPickPartId, setDetailPickPartId] = useState(partsCatalog[0]?.id || '');
  const [detailPickMethod, setDetailPickMethod] = useState('Thay mới chính hãng');
  const [detailPickQty, setDetailPickQty] = useState(1);
  const [editingLaborFee, setEditingLaborFee] = useState<number | null>(null);
  const [editingActualCost, setEditingActualCost] = useState<number | null>(null);
  const [editingTechNote, setEditingTechNote] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<{
    repairId: string;
    itemId: string;
    slot: 'beforePhotos' | 'newPartPhotos' | 'afterPhotos';
  } | null>(null);

  const combinedQuery = (localSearch || searchQuery).trim().toLowerCase();

  // Available fleet list (real vehicles + fallback MotoRent vehicles)
  const fleetOptions = useMemo(() => {
    const defaults = [
      { _id: 'mr-1', code: 'MR-DN-001', name: 'Honda Air Blade 160 ABS', licensePlate: '43C1-892.45', type: 'Xe tay ga', odo: 14820, color: 'Xám đen nhám', image: SAMPLE_PHOTOS.cleanFront },
      { _id: 'mr-2', code: 'MR-DN-002', name: 'Honda CB150X Adventure', licensePlate: '43A1-118.62', type: 'Xe côn tay', odo: 16210, color: 'Đen nhám', image: SAMPLE_PHOTOS.adventureSide },
      { _id: 'mr-3', code: 'mr-3', name: 'Honda Winner X 150 ABS', licensePlate: '43D1-654.12', type: 'Xe côn tay', odo: 18400, color: 'Đỏ đen', image: SAMPLE_PHOTOS.cleanRear }
    ];
    if (vehicles.length > 0) {
      return vehicles.map((v, i) => ({
        _id: v._id,
        code: `MR-DN-${String(i + 1).padStart(3, '0')}`,
        name: v.name,
        licensePlate: v.licensePlate,
        type: v.type || 'Xe tay ga',
        odo: v.odometer || 12500,
        color: 'Tiêu chuẩn',
        image: v.image || SAMPLE_PHOTOS.cleanFront
      }));
    }
    return defaults;
  }, [vehicles]);

  const selectedRepair = repairs.find(r => r.id === selectedRepairId) || null;

  // Filtered repairs list
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchQuery =
        !combinedQuery ||
        r.code.toLowerCase().includes(combinedQuery) ||
        r.licensePlate.toLowerCase().includes(combinedQuery) ||
        r.vehicleName.toLowerCase().includes(combinedQuery) ||
        r.customerName.toLowerCase().includes(combinedQuery) ||
        r.bookingCode.toLowerCase().includes(combinedQuery);
      return matchStatus && matchQuery;
    });
  }, [repairs, statusFilter, combinedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRepairs.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedRepairs = filteredRepairs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ==========================================
  // MODAL HANDLERS (CREATE NEW REPAIR)
  // ==========================================
  const handleAddPartToNewModal = () => {
    const pt = partsCatalog.find(p => p.id === newPickPartId);
    if (!pt || newPickQty <= 0) return;
    const existingIdx = newModalParts.findIndex(x => x.partId === pt.id);
    if (existingIdx >= 0) {
      const updated = newModalParts.map((item, idx) =>
        idx === existingIdx
          ? {
              ...item,
              quantity: item.quantity + newPickQty,
              total: (item.quantity + newPickQty) * item.unitPrice
            }
          : item
      );
      setNewModalParts(updated);
    } else {
      setNewModalParts([
        ...newModalParts,
        {
          partId: pt.id,
          partCode: pt.code,
          name: pt.name,
          actionMethod: 'Thay mới chính hãng',
          quantity: newPickQty,
          unitPrice: pt.unitPrice,
          laborFee: pt.laborFee,
          total: pt.unitPrice * newPickQty,
          isActualUsed: false
        }
      ]);
    }
    setNewPickQty(1);
  };

  const newPartsTotal = newModalParts.reduce((sum, p) => sum + p.total, 0);
  const newGrandTotal = newPartsTotal + Math.max(0, newLaborFee);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = fleetOptions.find(v => v._id === newVehicleKey) || fleetOptions[0];
    const nextNum = repairs.length + 21;
    const newCode = `PSC-2026-0${nextNum}`;
    const ts = nowStamp();
    const newId = `rep-${Date.now()}`;

    const created: RepairItem = {
      id: newId,
      code: newCode,
      bookingCode: newBookingCode.trim() || 'Tạo trực tiếp',
      vehicleId: veh._id,
      vehicleCode: veh.code,
      vehicleName: veh.name,
      licensePlate: veh.licensePlate,
      vehicleOdo: veh.odo,
      vehicleType: veh.type,
      vehicleColor: veh.color,
      vehicleImage: veh.image,
      customerName: newCustName.trim(),
      customerPhone: newCustPhone.trim() || '0905 000 000',
      issueSummary: newSolution.trim(),
      proposedSolution: newSolution.trim(),
      parts: newModalParts,
      totalPartsPrice: newPartsTotal,
      totalLaborFee: Math.max(0, newLaborFee),
      totalEstimatedCost: newGrandTotal,
      status: 'waiting_quote',
      progressPercent: 10,
      technicianName: inspectorName,
      technicianNotes: newTechNotes.trim(),
      damageItems: [
        {
          id: `dmg-item-${Date.now()}`,
          title: 'Hạng mục sửa chữa kỹ thuật',
          severity: 'medium',
          actionLabel: 'Sửa chữa / phục hồi',
          location: 'Toàn xe',
          description: newSolution.trim(),
          beforePhotos: [],
          newPartPhotos: [],
          afterPhotos: []
        }
      ],
      beforePhotos: [],
      afterPhotos: [],
      replacementPhotos: [],
      logs: [
        {
          id: `log-${Date.now()}`,
          title: `Tạo mới phiếu sửa chữa ${newCode}`,
          note: newSolution.trim(),
          actor: inspectorName,
          timestamp: ts
        }
      ],
      createdAt: ts,
      updatedAt: ts
    };

    onCreateRepair(created);
    onSelectRepairId(newId);
    setShowCreateModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewSolution('');
    setNewModalParts([]);
    setNewLaborFee(150000);
    setNewTechNotes('');
    toast.success(`Đã tạo phiếu đề xuất sửa chữa ${newCode}!`);
  };

  // ==========================================
  // DETAIL VIEW HELPERS
  // ==========================================
  const appendLogAndUpdate = (
    rep: RepairItem,
    patch: Partial<RepairItem>,
    logTitle: string,
    logNote?: string
  ) => {
    const ts = nowStamp();
    const existingLogs = rep.logs || [
      {
        id: 'log-base',
        title: `Tạo mới phiếu sửa chữa ${rep.code}`,
        note: rep.issueSummary,
        actor: rep.technicianName,
        timestamp: rep.createdAt
      }
    ];
    onUpdateRepair({
      ...rep,
      ...patch,
      updatedAt: ts,
      logs: [
        {
          id: `log-${Date.now()}`,
          title: logTitle,
          note: logNote,
          actor: inspectorName,
          timestamp: ts
        },
        ...existingLogs
      ]
    });
  };

  const getNormalizedDamageItems = (rep: RepairItem): RepairDamageEvidenceItem[] => {
    if (rep.damageItems && rep.damageItems.length > 0) return rep.damageItems;
    return [
      {
        id: `dmg-default-${rep.id}`,
        title: 'Hạng mục sửa chữa kỹ thuật',
        severity: 'medium',
        actionLabel: 'Sửa chữa / phục hồi',
        location: 'Toàn xe',
        description: rep.proposedSolution || rep.issueSummary,
        beforePhotos: rep.beforePhotos || [],
        newPartPhotos: rep.replacementPhotos || [],
        afterPhotos: rep.afterPhotos || []
      }
    ];
  };

  const triggerPhotoUpload = (
    repairId: string,
    itemId: string,
    slot: 'beforePhotos' | 'newPartPhotos' | 'afterPhotos'
  ) => {
    uploadTargetRef.current = { repairId, itemId, slot };
    fileInputRef.current?.click();
  };

  const handlePhotoFilesSelected = (files: FileList | null) => {
    const target = uploadTargetRef.current;
    if (!files || files.length === 0 || !target) return;
    const rep = repairs.find(r => r.id === target.repairId);
    if (!rep) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        const url = reader.result;
        const items = getNormalizedDamageItems(rep).map(item =>
          item.id === target.itemId
            ? { ...item, [target.slot]: [...item[target.slot], url] }
            : item
        );
        const allBefore = items.flatMap(i => i.beforePhotos);
        const allNewParts = items.flatMap(i => i.newPartPhotos);
        const allAfter = items.flatMap(i => i.afterPhotos);
        onUpdateRepair({
          ...rep,
          damageItems: items,
          beforePhotos: allBefore,
          replacementPhotos: allNewParts,
          afterPhotos: allAfter,
          updatedAt: nowStamp()
        });
      };
      reader.readAsDataURL(file);
    });
    toast.success(`Đã đính kèm ${files.length} ảnh minh chứng!`);
  };

  const handleAddSampleSlotPhoto = (
    rep: RepairItem,
    itemId: string,
    slot: 'beforePhotos' | 'newPartPhotos' | 'afterPhotos'
  ) => {
    const sample =
      slot === 'beforePhotos'
        ? SAMPLE_PHOTOS.damageScratched
        : slot === 'newPartPhotos'
        ? SAMPLE_PHOTOS.newPartInstalled
        : SAMPLE_PHOTOS.repairedPerfect;

    const items = getNormalizedDamageItems(rep).map(item =>
      item.id === itemId ? { ...item, [slot]: [...item[slot], sample] } : item
    );
    onUpdateRepair({
      ...rep,
      damageItems: items,
      beforePhotos: items.flatMap(i => i.beforePhotos),
      replacementPhotos: items.flatMap(i => i.newPartPhotos),
      afterPhotos: items.flatMap(i => i.afterPhotos),
      updatedAt: nowStamp()
    });
    toast.success('Đã thêm ảnh minh chứng mẫu!');
  };

  const handleRemoveSlotPhoto = (
    rep: RepairItem,
    itemId: string,
    slot: 'beforePhotos' | 'newPartPhotos' | 'afterPhotos',
    idx: number
  ) => {
    const items = getNormalizedDamageItems(rep).map(item =>
      item.id === itemId
        ? { ...item, [slot]: item[slot].filter((_, i) => i !== idx) }
        : item
    );
    onUpdateRepair({
      ...rep,
      damageItems: items,
      beforePhotos: items.flatMap(i => i.beforePhotos),
      replacementPhotos: items.flatMap(i => i.newPartPhotos),
      afterPhotos: items.flatMap(i => i.afterPhotos),
      updatedAt: nowStamp()
    });
  };

  const handleAddPartToDetail = (rep: RepairItem) => {
    const pt = partsCatalog.find(p => p.id === detailPickPartId);
    if (!pt || detailPickQty <= 0) return;

    const newLine: RepairPartLine = {
      partId: pt.id,
      partCode: pt.code,
      name: pt.name,
      actionMethod: detailPickMethod,
      quantity: detailPickQty,
      unitPrice: pt.unitPrice,
      laborFee: pt.laborFee,
      total: pt.unitPrice * detailPickQty,
      isActualUsed: true
    };
    const nextParts = [...rep.parts, newLine];
    const nextPartsPrice = nextParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    const nextTotal = nextPartsPrice + rep.totalLaborFee;

    appendLogAndUpdate(
      rep,
      {
        parts: nextParts,
        totalPartsPrice: nextPartsPrice,
        totalEstimatedCost: nextTotal
      },
      `Thêm phụ tùng ${pt.code} (${pt.name} x${detailPickQty})`,
      `Phương án: ${detailPickMethod} • Giá: ${newLine.total.toLocaleString('vi-VN')} đ`
    );
    setDetailPickQty(1);
    toast.success(`Đã thêm ${pt.name} vào phiếu sửa chữa!`);
  };

  const handleRemovePartFromDetail = (rep: RepairItem, idx: number) => {
    const removed = rep.parts[idx];
    const nextParts = rep.parts.filter((_, i) => i !== idx);
    const nextPartsPrice = nextParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0);
    const nextTotal = nextPartsPrice + rep.totalLaborFee;

    appendLogAndUpdate(
      rep,
      {
        parts: nextParts,
        totalPartsPrice: nextPartsPrice,
        totalEstimatedCost: nextTotal
      },
      `Xóa phụ tùng ${removed?.name || ''}`
    );
    toast.success('Đã xóa phụ tùng khỏi danh sách');
  };

  // ==========================================
  // RENDER DETAIL PAGE VIEW (SCREENSHOTS 3, 4, 5)
  // ==========================================
  if (selectedRepair) {
    const rep = selectedRepair;
    const meta = STATUS_META[rep.status] || STATUS_META.waiting_quote;
    const isRejected = rep.status === 'customer_rejected';
    const canModifyBeforeAfterPhotos =
      rep.status === 'customer_approved' ||
      rep.status === 'in_progress' ||
      rep.status === 'waiting_acceptance' ||
      rep.status === 'completed';

    const stepperSteps = [
      { num: 1, label: 'Lập phương án' },
      { num: 2, label: 'Gửi báo giá' },
      { num: 3, label: isRejected ? 'Khách từ chối' : 'Khách xác nhận' },
      { num: 4, label: 'Đang sửa chữa' },
      { num: 5, label: 'Chờ nghiệm thu' },
      { num: 6, label: 'Hoàn thành' }
    ];

    const damageEvidenceList = getNormalizedDamageItems(rep);
    const laborValue = editingLaborFee !== null ? editingLaborFee : rep.totalLaborFee;
    const actualValue =
      editingActualCost !== null
        ? editingActualCost
        : rep.actualCost || rep.totalEstimatedCost;
    const techNoteValue =
      editingTechNote !== null ? editingTechNote : rep.technicianNotes || '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            handlePhotoFilesSelected(e.target.files);
            e.target.value = '';
          }}
        />

        {/* 1. TOP BAR */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setEditingLaborFee(null);
                setEditingActualCost(null);
                setEditingTechNote(null);
                onSelectRepairId(null);
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Quay lại danh sách"
            >
              <ArrowLeft size={16} />
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
                  {rep.code}
                </h1>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    background: meta.bg,
                    color: meta.color,
                    border: meta.border,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={12} />
                  <span>{meta.badgeText}</span>
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                Tạo lúc {rep.createdAt} • Cập nhật {rep.updatedAt || rep.createdAt} • Kỹ thuật viên phụ trách:{' '}
                <strong style={{ color: '#0f172a' }}>{rep.technicianName}</strong>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>In phiếu</span>
            </button>

            {rep.status === 'waiting_quote' && (
              <button
                type="button"
                onClick={() => {
                  appendLogAndUpdate(
                    rep,
                    { status: 'waiting_approval', progressPercent: 25 },
                    `Gửi báo giá ${rep.totalEstimatedCost.toLocaleString('vi-VN')} đ cho khách hàng`,
                    `Đã gửi cho ${rep.customerName} (${rep.customerPhone})`
                  );
                  toast.success(`Đã gửi báo giá ${rep.code} tới khách hàng!`);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(37,99,235,0.22)'
                }}
              >
                <Send size={14} />
                <span>Gửi báo giá cho khách hàng</span>
              </button>
            )}

            {rep.status === 'waiting_approval' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    appendLogAndUpdate(
                      rep,
                      {
                        status: 'customer_approved',
                        progressPercent: 40,
                        customerFeedbackDate: nowStamp(),
                        customerFeedbackNote: 'Khách hàng đã xác nhận đồng ý báo giá sửa chữa.'
                      },
                      'Khách hàng ĐÃ XÁC NHẬN đồng ý báo giá',
                      `Tổng dự kiến duyệt: ${rep.totalEstimatedCost.toLocaleString('vi-VN')} đ`
                    );
                    toast.success('Đã ghi nhận khách hàng ĐỒNG Ý báo giá!');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsUp size={14} />
                  <span>Khách đồng ý báo giá</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    appendLogAndUpdate(
                      rep,
                      {
                        status: 'customer_rejected',
                        progressPercent: 0,
                        customerFeedbackDate: nowStamp(),
                        customerFeedbackNote: 'Khách từ chối phương án sửa chữa tại cửa hàng.'
                      },
                      'Khách hàng TỪ CHỐI sửa chữa'
                    );
                    toast.error('Đã ghi nhận khách từ chối sửa chữa');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ThumbsDown size={14} />
                  <span>Khách từ chối</span>
                </button>
              </>
            )}

            {rep.status === 'customer_approved' && (
              <button
                type="button"
                onClick={() => {
                  appendLogAndUpdate(
                    rep,
                    { status: 'in_progress', progressPercent: 60 },
                    'Bắt đầu thi công sửa chữa & thay phụ tùng'
                  );
                  toast.success('Đã chuyển sang trạng thái Đang sửa chữa!');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Play size={14} />
                <span>Bắt đầu sửa chữa</span>
              </button>
            )}

            {rep.status === 'waiting_quote' && (
              <button
                type="button"
                disabled
                title="Cần gửi báo giá và nhận xác nhận khách hàng trước"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f1f5f9',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'not-allowed'
                }}
              >
                <Play size={14} />
                <span>Bắt đầu sửa chữa</span>
              </button>
            )}

            {rep.status === 'in_progress' && (
              <button
                type="button"
                onClick={() => {
                  appendLogAndUpdate(
                    rep,
                    {
                      status: 'waiting_acceptance',
                      progressPercent: 85,
                      actualCost: actualValue
                    },
                    'Hoàn tất sửa chữa kỹ thuật — Chuyển chờ nghiệm thu',
                    `Chi phí nghiệm thu dự kiến: ${actualValue.toLocaleString('vi-VN')} đ`
                  );
                  toast.success('Đã chuyển sang Chờ nghiệm thu!');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Camera size={14} />
                <span>Chuyển Chờ nghiệm thu</span>
              </button>
            )}

            {(rep.status === 'waiting_acceptance' || rep.status === 'in_progress') && (
              <button
                type="button"
                onClick={() => {
                  const finalizedCost = actualValue;
                  appendLogAndUpdate(
                    rep,
                    {
                      status: 'completed',
                      progressPercent: 100,
                      actualCost: finalizedCost,
                      completedAt: nowStamp(),
                      completionNotes:
                        rep.completionNotes ||
                        'Đã hoàn thành sửa chữa, thay phụ tùng chính hãng và kiểm tra vận hành an toàn.'
                    },
                    `Nghiệm thu hoàn thành phiếu ${rep.code}`,
                    `Chi phí thực tế chốt: ${finalizedCost.toLocaleString('vi-VN')} đ`
                  );
                  if (onCompleteVehicleAvailable && rep.vehicleId) {
                    onCompleteVehicleAvailable(rep.vehicleId);
                  }
                  toast.success(`Đã nghiệm thu hoàn thành phiếu ${rep.code}!`);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#16a34a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <CheckCircle2 size={14} />
                <span>Hoàn thành nghiệm thu</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. 6-STEP PROGRESS STEPPER */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', gap: '8px' }}>
            {stepperSteps.map((st, idx) => {
              const isCompleted = !isRejected && meta.step > st.num;
              const isCurrent = meta.step === st.num;
              const circleBg = isRejected && st.num === 3
                ? '#dc2626'
                : isCompleted
                ? '#16a34a'
                : isCurrent
                ? '#2563eb'
                : '#f1f5f9';
              const circleColor = isCompleted || isCurrent || (isRejected && st.num === 3) ? '#ffffff' : '#64748b';
              return (
                <React.Fragment key={st.num}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '92px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: circleBg,
                        color: circleColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        boxShadow: isCurrent ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none'
                      }}
                    >
                      {isCompleted ? '✓' : st.num}
                    </div>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: isCurrent || isCompleted ? 800 : 600,
                        color: isCurrent ? '#2563eb' : isCompleted ? '#16a34a' : '#64748b',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  {idx < stepperSteps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        minWidth: '28px',
                        height: '2px',
                        background: !isRejected && meta.step > st.num ? '#16a34a' : '#e2e8f0',
                        marginBottom: '20px'
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* 3. SECTION A & SECTION B */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Section A */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>A</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                THÔNG TIN ĐƠN THUÊ & KHÁCH HÀNG
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Mã đơn thuê</div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace', marginTop: '3px' }}>
                  {rep.bookingCode}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Biên bản hư hỏng</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: rep.damageReportCode ? '#dc2626' : '#0f172a', marginTop: '3px' }}>
                  {rep.damageReportCode || 'Tạo trực tiếp'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} /> Khách hàng
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
                  {rep.customerName}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> Số điện thoại
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: '3px' }}>
                  {rep.customerPhone}
                </div>
              </div>
            </div>
          </div>

          {/* Section B */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>B</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                THÔNG TIN PHƯƠNG TIỆN
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={rep.vehicleImage || SAMPLE_PHOTOS.cleanFront}
                alt={rep.vehicleName}
                style={{ width: '82px', height: '58px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  <Bike size={15} color="#2563eb" />
                  <span>{rep.vehicleName}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                  <span>
                    Biển số: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{rep.licensePlate}</strong>
                  </span>
                  <span>
                    Mã xe: <strong style={{ color: '#0f172a' }}>{rep.vehicleCode || 'MR-DN-001'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                  ODO: <strong style={{ color: '#0f172a' }}>{(rep.vehicleOdo || 14820).toLocaleString('vi-VN')} km</strong> • {rep.vehicleType || 'Xe tay ga'} • {rep.vehicleColor || 'Tiêu chuẩn'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECTION F: TRẠNG THÁI XÁC NHẬN BÁO GIÁ */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>F</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                TRẠNG THÁI XÁC NHẬN BÁO GIÁ CỦA KHÁCH HÀNG
              </span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: meta.bg, color: meta.color, border: meta.border }}>
              {meta.badgeText}
            </span>
          </div>

          <div
            style={{
              background:
                rep.status === 'customer_approved' || rep.status === 'completed'
                  ? '#f0fdf4'
                  : rep.status === 'customer_rejected'
                  ? '#fef2f2'
                  : rep.status === 'waiting_approval'
                  ? '#eff6ff'
                  : '#fefce8',
              border:
                rep.status === 'customer_approved' || rep.status === 'completed'
                  ? '1px solid #bbf7d0'
                  : rep.status === 'customer_rejected'
                  ? '1px solid #fecaca'
                  : rep.status === 'waiting_approval'
                  ? '1px solid #bfdbfe'
                  : '1px solid #fde68a',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <Info size={16} color={meta.color} style={{ marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.5 }}>
              {rep.status === 'waiting_quote' && (
                <>
                  <strong style={{ color: '#92400e', display: 'block' }}>
                    Cấm tự ý sửa chữa phát sinh chi phí khi chưa có xác nhận khách hàng
                  </strong>
                  Hãy hoàn tất danh sách phụ tùng, kiểm tra tổng báo giá và nhấn &quot;Gửi báo giá cho khách hàng&quot;.
                </>
              )}
              {rep.status === 'waiting_approval' && (
                <>
                  <strong style={{ color: '#1d4ed8', display: 'block' }}>
                    Đã gửi báo giá ({rep.totalEstimatedCost.toLocaleString('vi-VN')} đ) tới {rep.customerName}
                  </strong>
                  Đang chờ khách hàng phản hồi xác nhận đồng ý hoặc từ chối phương án.
                </>
              )}
              {(rep.status === 'customer_approved' || rep.status === 'in_progress' || rep.status === 'waiting_acceptance' || rep.status === 'completed') && (
                <>
                  <strong style={{ color: '#15803d', display: 'block' }}>
                    Khách hàng đã xác nhận đồng ý phương án & chi phí sửa chữa
                  </strong>
                  {rep.customerFeedbackNote || 'Đã mở khóa chức năng thi công, chụp ảnh phụ tùng mới và ảnh hoàn thiện sau sửa.'}{' '}
                  {rep.customerFeedbackDate && <span style={{ color: '#64748b' }}>({rep.customerFeedbackDate})</span>}
                </>
              )}
              {rep.status === 'customer_rejected' && (
                <>
                  <strong style={{ color: '#dc2626', display: 'block' }}>
                    Khách hàng từ chối sửa chữa tại cửa hàng
                  </strong>
                  {rep.customerFeedbackNote || 'Phiếu được đóng ở trạng thái từ chối để bàn giao bộ phận lễ tân/quản lý xử lý.'}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 5. SECTION C: DANH SÁCH HƯ HỎNG & MINH CHỨNG HÌNH ẢNH */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>C</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                DANH SÁCH HƯ HỎNG & MINH CHỨNG HÌNH ẢNH (BEFORE / PHỤ TÙNG MỚI / AFTER)
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              {damageEvidenceList.length} hạng mục hư hỏng
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {damageEvidenceList.map(item => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  background: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.title}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: item.severity === 'high' ? '#fef2f2' : '#fefce8',
                      color: item.severity === 'high' ? '#dc2626' : '#a16207',
                      border: item.severity === 'high' ? '1px solid #fecaca' : '1px solid #fde68a'
                    }}
                  >
                    ▲ {item.severity === 'high' ? 'Nặng' : item.severity === 'low' ? 'Nhẹ' : 'Trung bình'}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {item.actionLabel}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '2px' }}>
                  Vị trí: <strong>{item.location}</strong>
                </div>
                <div style={{ fontSize: '12.5px', color: '#334155', marginBottom: '12px' }}>
                  {item.description}
                </div>

                {/* 3 Photo Slots: Before / New Part / After */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: '12px'
                  }}
                >
                  {(
                    [
                      {
                        slot: 'beforePhotos' as const,
                        title: `1. Ảnh trước sửa (${item.beforePhotos.length})`,
                        color: '#dc2626',
                        locked: false,
                        emptyText: 'Chưa có ảnh trước sửa'
                      },
                      {
                        slot: 'newPartPhotos' as const,
                        title: `2. Ảnh phụ tùng mới (${item.newPartPhotos.length})`,
                        color: '#2563eb',
                        locked: !canModifyBeforeAfterPhotos,
                        emptyText: canModifyBeforeAfterPhotos
                          ? 'Chưa chụp ảnh phụ tùng mới'
                          : 'Chưa chụp ảnh phụ tùng mới\n(Mở sau khi khách xác nhận)'
                      },
                      {
                        slot: 'afterPhotos' as const,
                        title: `3. Ảnh sau sửa chữa (${item.afterPhotos.length})`,
                        color: '#16a34a',
                        locked: !canModifyBeforeAfterPhotos,
                        emptyText: canModifyBeforeAfterPhotos
                          ? 'Chưa chụp ảnh hoàn thiện sau sửa'
                          : 'Chưa chụp ảnh hoàn thiện sau sửa\n(Mở sau khi khách xác nhận)'
                      }
                    ]
                  ).map(cfg => {
                    const photos = item[cfg.slot];
                    return (
                      <div
                        key={cfg.slot}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: cfg.color }}>{cfg.title}</span>
                          {!cfg.locked && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => triggerPhotoUpload(rep.id, item.id, cfg.slot)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#2563eb',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <Camera size={12} />
                                <span>Thêm ảnh</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddSampleSlotPhoto(rep, item.id, cfg.slot)}
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  color: '#475569',
                                  borderRadius: '5px',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  cursor: 'pointer'
                                }}
                              >
                                + Mẫu
                              </button>
                            </div>
                          )}
                        </div>

                        {photos.length === 0 ? (
                          <div
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '8px',
                              padding: '22px 10px',
                              textAlign: 'center',
                              fontSize: '11.5px',
                              color: '#94a3b8',
                              whiteSpace: 'pre-line',
                              lineHeight: 1.4
                            }}
                          >
                            {cfg.emptyText}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {photos.map((src, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setZoomPhoto(src)}
                                style={{
                                  position: 'relative',
                                  width: '86px',
                                  height: '62px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer'
                                }}
                              >
                                <img
                                  src={src}
                                  alt="Minh chứng"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleRemoveSlotPhoto(rep, item.id, cfg.slot, pIdx);
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '3px',
                                    right: '3px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: 'rgba(15,23,42,0.75)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. SECTION D (PARTS) & SECTION E (COSTS) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '16px',
            alignItems: 'start'
          }}
        >
          {/* Section D */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>D</span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                  DANH SÁCH PHỤ TÙNG ĐỀ XUẤT & SỬ DỤNG
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{rep.parts.length} mục</span>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11.5px', color: '#64748b', fontWeight: 700 }}>
                    <th style={{ padding: '9px 10px' }}>Mã PT</th>
                    <th style={{ padding: '9px 10px' }}>Tên phụ tùng</th>
                    <th style={{ padding: '9px 10px' }}>Phương án xử lý</th>
                    <th style={{ padding: '9px 10px', textAlign: 'center' }}>SL</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ padding: '9px 10px', textAlign: 'right' }}>Thành tiền</th>
                    <th style={{ padding: '9px 6px' }} />
                  </tr>
                </thead>
                <tbody>
                  {rep.parts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '22px 12px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                        Chưa có phụ tùng thay thế nào được chọn (chỉ tính công sửa chữa / sơn dặm).
                      </td>
                    </tr>
                  ) : (
                    rep.parts.map((pt, pIdx) => (
                      <tr key={pIdx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '12.5px' }}>
                        <td style={{ padding: '9px 10px', fontFamily: 'monospace', color: '#2563eb', fontWeight: 700 }}>{pt.partCode}</td>
                        <td style={{ padding: '9px 10px', fontWeight: 700, color: '#0f172a' }}>{pt.name}</td>
                        <td style={{ padding: '9px 10px', color: '#475569' }}>{pt.actionMethod || 'Thay mới chính hãng'}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 700 }}>{pt.quantity}</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', color: '#475569' }}>{pt.unitPrice.toLocaleString('vi-VN')} đ</td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{pt.total.toLocaleString('vi-VN')} đ</td>
                        <td style={{ padding: '9px 6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemovePartFromDetail(rep, pIdx)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                            title="Xóa phụ tùng"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* + Thêm phụ tùng từ kho kỹ thuật */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                + Thêm phụ tùng từ kho kỹ thuật
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={detailPickPartId}
                  onChange={e => setDetailPickPartId(e.target.value)}
                  style={{ flex: '1 1 200px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px' }}
                >
                  {partsCatalog.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.unitPrice.toLocaleString('vi-VN')} đ (Tồn: {p.stock})
                    </option>
                  ))}
                </select>

                <select
                  value={detailPickMethod}
                  onChange={e => setDetailPickMethod(e.target.value)}
                  style={{ flex: '0 1 160px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px' }}
                >
                  <option value="Thay mới chính hãng">Thay mới chính hãng</option>
                  <option value="Sửa chữa & căn chỉnh">Sửa chữa & căn chỉnh</option>
                  <option value="Sơn dặm phục hồi">Sơn dặm phục hồi</option>
                </select>

                <input
                  type="number"
                  min={1}
                  value={detailPickQty}
                  onChange={e => setDetailPickQty(Math.max(1, Number(e.target.value)))}
                  style={{ width: '58px', padding: '7px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '12px', textAlign: 'center' }}
                />

                <button
                  type="button"
                  onClick={() => handleAddPartToDetail(rep)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Thêm
                </button>
              </div>
            </div>
          </div>

          {/* Section E */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>E</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
                TỔNG CHI PHÍ SỬA CHỮA
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                <span>Tiền phụ tùng ({rep.parts.length} mục)</span>
                <strong style={{ color: '#0f172a' }}>{rep.totalPartsPrice.toLocaleString('vi-VN')} đ</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569', gap: '8px' }}>
                <span>Chi phí công thợ</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min={0}
                    value={laborValue}
                    onChange={e => setEditingLaborFee(Math.max(0, Number(e.target.value)))}
                    style={{ width: '96px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontWeight: 700, textAlign: 'right' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextTotal = rep.totalPartsPrice + laborValue;
                      appendLogAndUpdate(
                        rep,
                        { totalLaborFee: laborValue, totalEstimatedCost: nextTotal },
                        `Cập nhật tiền công thợ thành ${laborValue.toLocaleString('vi-VN')} đ`
                      );
                      setEditingLaborFee(null);
                      toast.success('Đã lưu chi phí công thợ!');
                    }}
                    style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Lưu
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Tổng chi phí dự kiến</strong>
                <strong style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>
                  {(rep.totalPartsPrice + laborValue).toLocaleString('vi-VN')} đ
                </strong>
              </div>

              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#15803d' }}>Chi phí thực tế nghiệm thu</span>
                {rep.status === 'completed' ? (
                  <strong style={{ fontSize: '15px', fontWeight: 900, color: '#16a34a' }}>
                    {(rep.actualCost || rep.totalEstimatedCost).toLocaleString('vi-VN')} đ
                  </strong>
                ) : rep.status === 'in_progress' || rep.status === 'waiting_acceptance' ? (
                  <input
                    type="number"
                    min={0}
                    value={actualValue}
                    onChange={e => setEditingActualCost(Math.max(0, Number(e.target.value)))}
                    style={{ width: '110px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #86efac', fontSize: '13px', fontWeight: 800, color: '#15803d', textAlign: 'right' }}
                  />
                ) : (
                  <strong style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>Chưa chốt</strong>
                )}
              </div>

              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  <FileText size={13} color="#2563eb" />
                  <span>Ghi chú kỹ thuật viên:</span>
                </div>
                <textarea
                  rows={2}
                  value={techNoteValue}
                  onChange={e => setEditingTechNote(e.target.value)}
                  onBlur={() => {
                    if (editingTechNote !== null && editingTechNote !== (rep.technicianNotes || '')) {
                      onUpdateRepair({ ...rep, technicianNotes: editingTechNote, updatedAt: nowStamp() });
                      toast.success('Đã lưu ghi chú kỹ thuật viên');
                    }
                  }}
                  placeholder="Nhập ghi chú xử lý kỹ thuật..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#334155', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 7. SECTION G: TIẾN ĐỘ SỬA CHỮA & NHẬT KÝ XỬ LÝ */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: '11.5px', padding: '3px 7px', borderRadius: '6px' }}>G</span>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
              TIẾN ĐỘ SỬA CHỮA & NHẬT KÝ XỬ LÝ
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(
              rep.logs && rep.logs.length > 0
                ? rep.logs
                : [
                    {
                      id: 'log-default',
                      title: `Tạo mới phiếu sửa chữa ${rep.code}`,
                      note: rep.proposedSolution || rep.issueSummary,
                      actor: rep.technicianName,
                      timestamp: rep.createdAt
                    }
                  ]
            ).map(log => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #f1f5f9'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#16a34a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{log.title}</div>
                    {log.note && (
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{log.note}</div>
                    )}
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Wrench size={11} />
                      <span>Thực hiện bởi: {log.actor}</span>
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        {zoomPhoto && (
          <div
            onClick={() => setZoomPhoto(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '24px' }}
          >
            <img src={zoomPhoto} alt="Zoom" style={{ maxWidth: '90%', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER LIST VIEW (SCREENSHOT 1 & 2)
  // ==========================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
            Quản lý sửa chữa
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Lập phương án sửa chữa, gửi báo giá xác nhận khách hàng, thi công và nghiệm thu ảnh minh chứng
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!newVehicleKey && fleetOptions[0]) setNewVehicleKey(fleetOptions[0]._id);
            setShowCreateModal(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Plus size={16} />
          <span>Tạo phiếu sửa chữa mới</span>
        </button>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12.5px',
          color: '#1e40af'
        }}
      >
        <Info size={16} color="#2563eb" style={{ flexShrink: 0 }} />
        <span>
          <strong>Quy tắc nghiệp vụ MotoRent:</strong> Mọi phiếu sửa chữa phát sinh chi phí phải lập báo giá và nhận xác nhận khách hàng trước khi bắt đầu tháo ráp hoặc thay phụ tùng.
        </span>
      </div>

      {/* Filter Card */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {STATUS_TABS.map(tab => {
            const active = statusFilter === tab.key;
            const count =
              tab.key === 'all' ? repairs.length : repairs.filter(r => r.status === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  background: active ? '#2563eb' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  fontSize: '12.5px',
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: active ? 'rgba(255,255,255,0.22)' : '#f1f5f9',
                    color: active ? '#ffffff' : '#475569'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={localSearch}
            onChange={e => {
              setLocalSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã phiếu PSC, biển số, tên xe, khách hàng..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '9px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Mã phiếu</th>
                <th style={{ padding: '12px 16px' }}>Xe / Biển số</th>
                <th style={{ padding: '12px 16px' }}>Khách hàng / Đơn thuê</th>
                <th style={{ padding: '12px 16px' }}>Phương án & Phụ tùng</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Dự kiến / Thực tế</th>
                <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedRepairs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    Không tìm thấy phiếu sửa chữa phù hợp.
                  </td>
                </tr>
              ) : (
                pagedRepairs.map(rep => {
                  const meta = STATUS_META[rep.status] || STATUS_META.waiting_quote;
                  return (
                    <tr key={rep.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <button
                          type="button"
                          onClick={() => onSelectRepairId(rep.id)}
                          style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontWeight: 800, fontFamily: 'monospace', fontSize: '13px', cursor: 'pointer' }}
                        >
                          {rep.code}
                        </button>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', fontFamily: 'monospace' }}>
                          {rep.createdAt}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{rep.vehicleName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                          {rep.licensePlate}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{rep.customerName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                          {rep.bookingCode}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ color: '#334155', fontSize: '12.5px', lineHeight: 1.4 }}>
                          {rep.proposedSolution.length > 78
                            ? `${rep.proposedSolution.slice(0, 78)}...`
                            : rep.proposedSolution}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                          {rep.parts.length} danh mục phụ tùng
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {rep.totalEstimatedCost.toLocaleString('vi-VN')} đ
                        </div>
                        {rep.actualCost && rep.actualCost > 0 && (
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>
                            Thực tế: {rep.actualCost.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: meta.bg,
                            color: meta.color,
                            border: meta.border,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {rep.status === 'customer_rejected' && <XCircle size={12} />}
                          {rep.status === 'in_progress' && <Wrench size={12} />}
                          {(rep.status === 'customer_approved' || rep.status === 'completed') && <CheckCircle2 size={12} />}
                          <span>{meta.badgeText}</span>
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => onSelectRepairId(rep.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Eye size={13} />
                          <span>Chi tiết phiếu</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderTop: '1px solid #f1f5f9',
            fontSize: '12.5px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <span>
            Hiển thị {filteredRepairs.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}–
            {Math.min(safePage * PER_PAGE, filteredRepairs.length)} trong tổng số{' '}
            <strong>{filteredRepairs.length}</strong> bản ghi
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                padding: '5px 10px',
                borderRadius: '7px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: safePage <= 1 ? '#cbd5e1' : '#334155',
                fontSize: '12px',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ‹ Trước
            </button>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {safePage}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '5px 10px',
                borderRadius: '7px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: safePage >= totalPages ? '#cbd5e1' : '#334155',
                fontSize: '12px',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Sau ›
            </button>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL: TẠO PHIẾU ĐỀ XUẤT SỬA CHỮA MỚI (SCREENSHOT 2)
         ========================================== */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px'
          }}
        >
          <form
            onSubmit={handleCreateSubmit}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Tạo phiếu đề xuất sửa chữa mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f8fafc', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Chọn xe *
                  </label>
                  <select
                    value={newVehicleKey || fleetOptions[0]?._id}
                    onChange={e => setNewVehicleKey(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                  >
                    {fleetOptions.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.licensePlate} — {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Mã đơn thuê (nếu có)
                  </label>
                  <input
                    type="text"
                    value={newBookingCode}
                    onChange={e => setNewBookingCode(e.target.value)}
                    placeholder="HD-DN-2026-320"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    placeholder="Nhập họ tên khách hàng"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="0905 xxx xxx"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Phương án sửa chữa đề xuất *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newSolution}
                  onChange={e => setNewSolution(e.target.value)}
                  placeholder="Mô tả hạng mục thay mới, phục hồi hoặc căn chỉnh..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit' }}
                />
              </div>

              {/* Chọn phụ tùng từ kho */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  Chọn phụ tùng đề xuất từ kho
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={newPickPartId}
                    onChange={e => setNewPickPartId(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
                  >
                    {partsCatalog.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.unitPrice.toLocaleString('vi-VN')} đ (Tồn: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={newPickQty}
                    onChange={e => setNewPickQty(Math.max(1, Number(e.target.value)))}
                    style={{ width: '58px', padding: '7px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', textAlign: 'center', background: '#ffffff' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddPartToNewModal}
                    style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + Thêm
                  </button>
                </div>

                {newModalParts.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {newModalParts.map((pt, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '6px 10px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                        <span>
                          <strong>{pt.name}</strong> × {pt.quantity}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: '#2563eb' }}>{pt.total.toLocaleString('vi-VN')} đ</strong>
                          <button
                            type="button"
                            onClick={() => setNewModalParts(newModalParts.filter((_, i) => i !== idx))}
                            style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'stretch' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Chi phí công thợ (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newLaborFee}
                    onChange={e => setNewLaborFee(Number(e.target.value) || 0)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
                  />
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#3b82f6', fontWeight: 600 }}>Tổng chi phí dự kiến</span>
                  <strong style={{ fontSize: '17px', fontWeight: 900, color: '#2563eb' }}>
                    {newGrandTotal.toLocaleString('vi-VN')} đ
                  </strong>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Ghi chú kỹ thuật
                </label>
                <input
                  type="text"
                  value={newTechNotes}
                  onChange={e => setNewTechNotes(e.target.value)}
                  placeholder="Ghi chú bổ sung..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', padding: '10px 12px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  Phiếu tạo mới sẽ ở trạng thái <strong>Chờ báo giá</strong>. Bạn cần gửi báo giá và nhận xác nhận khách hàng trước khi sửa.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#334155', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Tạo phiếu sửa chữa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
