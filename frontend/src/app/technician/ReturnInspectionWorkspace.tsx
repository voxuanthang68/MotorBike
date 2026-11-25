'use client';

import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardCheck,
  Plus,
  Columns2,
  User,
  Phone,
  Calendar,
  Gauge,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Camera,
  ImagePlus,
  Save,
  FileWarning,
  MapPin,
  X,
  ZoomIn
} from 'lucide-react';
import {
  ReturnInspectionItem,
  InspectionChecklistItem,
  InspectionCheckStatus,
  DamagePin,
  SAMPLE_PHOTOS,
  syncBooleansFromChecklist
} from './types';

interface ReturnInspectionWorkspaceProps {
  inspections: ReturnInspectionItem[];
  activeInspectionId: string;
  onSelectInspection: (id: string) => void;
  onUpdateInspection: (updated: ReturnInspectionItem) => void;
  onOpenNewModal: () => void;
  onOpenPhotoCompare: (payload: {
    title: string;
    subtitle: string;
    beforeImgs: string[];
    afterImgs: string[];
    notes?: string;
  }) => void;
  onConfirmInspection: (ins: ReturnInspectionItem) => Promise<void> | void;
  onOpenDamageReport: (ins: ReturnInspectionItem) => void;
  searchQuery?: string;
}

const SAMPLE_BY_KEY: Record<InspectionChecklistItem['key'], string> = {
  overall: SAMPLE_PHOTOS.adventureSide,
  engine: SAMPLE_PHOTOS.newPartInstalled,
  brakes: SAMPLE_PHOTOS.repairedPerfect,
  tires: SAMPLE_PHOTOS.cleanRear,
  lights: SAMPLE_PHOTOS.damageBrokenLight,
  mirrors: SAMPLE_PHOTOS.cleanFront,
  body: SAMPLE_PHOTOS.damageScratched,
  accessories: SAMPLE_PHOTOS.cleanFront
};

export default function ReturnInspectionWorkspace({
  inspections,
  activeInspectionId,
  onSelectInspection,
  onUpdateInspection,
  onOpenNewModal,
  onOpenPhotoCompare,
  onConfirmInspection,
  onOpenDamageReport,
  searchQuery = ''
}: ReturnInspectionWorkspaceProps) {
  const [pinLabel, setPinLabel] = useState('Vết trầy xước mới');
  const [pinSeverity, setPinSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const canvasFileRef = useRef<HTMLInputElement | null>(null);

  const filteredInspections = inspections.filter(ins => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ins.inspectionCode.toLowerCase().includes(q) ||
      ins.bookingCode.toLowerCase().includes(q) ||
      ins.vehicleName.toLowerCase().includes(q) ||
      ins.licensePlate.toLowerCase().includes(q) ||
      ins.customerName.toLowerCase().includes(q)
    );
  });

  const activeIns =
    inspections.find(i => i.id === activeInspectionId) ||
    filteredInspections[0] ||
    inspections[0] ||
    null;

  if (!activeIns) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '48px 24px',
          textAlign: 'center'
        }}
      >
        <ClipboardCheck size={42} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Chưa có phiếu kiểm tra xe khi trả
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Nhấn nút bên dưới để tiếp nhận đơn trả xe đầu tiên từ khách hàng.
        </p>
        <button
          type="button"
          onClick={onOpenNewModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} />
          <span>Tiếp nhận xe trả mới</span>
        </button>
      </div>
    );
  }

  // Computed metrics for active inspection
  const normalCount = activeIns.checklist.filter(c => c.status === 'normal').length;
  const damageCount = activeIns.checklist.filter(c => c.status === 'damage').length;
  const checkCount = activeIns.checklist.filter(c => c.status === 'check').length;
  const checklistPhotos = activeIns.checklist.flatMap(c => c.photos);
  const totalPhotosCount = checklistPhotos.length + (activeIns.returnImages?.length || 0);
  const kmDriven = activeIns.returnOdometer - activeIns.deliveryOdometer;

  const updateChecklistItem = (itemId: string, patch: Partial<InspectionChecklistItem>) => {
    const nextChecklist = activeIns.checklist.map(item =>
      item.id === itemId ? { ...item, ...patch } : item
    );
    const bools = syncBooleansFromChecklist(nextChecklist);
    onUpdateInspection({
      ...activeIns,
      checklist: nextChecklist,
      ...bools
    });
  };

  const handleUploadItemPhotos = (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const targetItem = activeIns.checklist.find(c => c.id === itemId);
    if (!targetItem) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const current = activeIns.checklist.find(c => c.id === itemId)?.photos || [];
          updateChecklistItem(itemId, { photos: [...current, reader.result as string] });
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success(`Đã tải lên ${files.length} ảnh minh chứng!`);
  };

  const handleUploadDiagramPhoto = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateInspection({
          ...activeIns,
          returnImages: [reader.result, ...(activeIns.returnImages || []).slice(1)]
        });
        toast.success('Đã cập nhật ảnh hiện trường xe để đánh dấu vị trí!');
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const handleAddSamplePhoto = (item: InspectionChecklistItem) => {
    const sampleUrl = SAMPLE_BY_KEY[item.key] || SAMPLE_PHOTOS.cleanFront;
    updateChecklistItem(item.id, { photos: [...item.photos, sampleUrl] });
    toast.success(`Đã thêm ảnh mẫu cho mục "${item.title}"`);
  };

  const handleRemoveItemPhoto = (item: InspectionChecklistItem, photoIdx: number) => {
    updateChecklistItem(item.id, {
      photos: item.photos.filter((_, idx) => idx !== photoIdx)
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.max(6, Math.min(94, Math.round(rawX * 10) / 10));
    const y = Math.max(8, Math.min(88, Math.round(rawY * 10) / 10));

    const newPin: DamagePin = {
      id: `pin-${Date.now()}`,
      x,
      y,
      label: pinLabel.trim() || `Vị trí #${activeIns.pins.length + 1}`,
      severity: pinSeverity
    };

    onUpdateInspection({
      ...activeIns,
      pins: [...activeIns.pins, newPin]
    });
    toast.success(`Đã ghim điểm #${activeIns.pins.length + 1}: ${newPin.label}`);
  };

  const handleRemovePin = (pinId: string) => {
    onUpdateInspection({
      ...activeIns,
      pins: activeIns.pins.filter(p => p.id !== pinId)
    });
  };

  const handleSaveDraft = () => {
    onUpdateInspection({
      ...activeIns,
      status: 'draft'
    });
    toast.success(`Đã lưu bản nháp phiếu ${activeIns.inspectionCode}!`);
  };

  const getStatusBadgeStyle = (status: ReturnInspectionItem['status']) => {
    switch (status) {
      case 'passed':
        return { bg: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', label: '✓ Đã xác nhận đạt' };
      case 'damaged':
        return { bg: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', label: '⚠ Có hư hỏng' };
      case 'pending_inspection':
        return { bg: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', label: '⏳ Chờ kiểm tra' };
      case 'draft':
      default:
        return { bg: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', label: '📋 Đang lưu nháp' };
    }
  };

  const activeBadge = getStatusBadgeStyle(activeIns.status);
  const diagramSrc =
    activeIns.returnImages?.[0] ||
    activeIns.vehicleImage ||
    SAMPLE_PHOTOS.adventureSide;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '12px' }}>
      {/* ==========================================
          1. TOP HEADER BAR
         ========================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Kiểm tra xe khi khách trả
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Quy trình tiếp nhận, đánh giá 8 hạng mục kỹ thuật, chụp ảnh hiện trường và đối chiếu trước khi giao xe
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
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
          <span>Tiếp nhận xe trả mới</span>
        </button>
      </div>

      {/* ==========================================
          2. TICKET SELECTOR STRIP
         ========================================== */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '12px',
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          flexWrap: 'wrap'
        }}
      >
        {(filteredInspections.length > 0 ? filteredInspections : inspections).map(ins => {
          const isSelected = ins.id === activeIns.id;
          const badge = getStatusBadgeStyle(ins.status);
          return (
            <button
              key={ins.id}
              type="button"
              onClick={() => onSelectInspection(ins.id)}
              style={{
                minWidth: '248px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#f8fafc',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                  {ins.inspectionCode}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: badge.bg,
                    color: badge.color,
                    border: badge.border,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginTop: '5px' }}>
                {ins.vehicleName} • <span style={{ color: '#2563eb' }}>{ins.licensePlate}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                KH: {ins.customerName}
              </div>
            </button>
          );
        })}
      </div>

      {/* ==========================================
          3. VEHICLE & RENTAL SUMMARY CARD
         ========================================== */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          padding: '18px 20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={activeIns.vehicleImage || activeIns.deliveryImages?.[0] || SAMPLE_PHOTOS.adventureSide}
              alt={activeIns.vehicleName}
              style={{
                width: '56px',
                height: '44px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid #e2e8f0',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {activeIns.vehicleName}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 800,
                    color: '#1d4ed8',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}
                >
                  {activeIns.licensePlate}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: '6px',
                    background: activeBadge.bg,
                    color: activeBadge.color,
                    border: activeBadge.border
                  }}
                >
                  {activeBadge.label}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Mã phiếu kiểm tra: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{activeIns.inspectionCode}</strong> • Mã đơn thuê: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{activeIns.bookingCode}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const allAfterImgs = [
                ...(activeIns.returnImages || []),
                ...checklistPhotos
              ];
              onOpenPhotoCompare({
                title: `So sánh ảnh trước giao & khi trả — ${activeIns.vehicleName} (${activeIns.licensePlate})`,
                subtitle: `Phiếu ${activeIns.inspectionCode} • Đơn thuê ${activeIns.bookingCode} • KH: ${activeIns.customerName} • Odo: ${activeIns.deliveryOdometer.toLocaleString('vi-VN')} → ${activeIns.returnOdometer.toLocaleString('vi-VN')} km`,
                beforeImgs: activeIns.deliveryImages.length > 0 ? activeIns.deliveryImages : [SAMPLE_PHOTOS.cleanFront],
                afterImgs: allAfterImgs.length > 0 ? allAfterImgs : [SAMPLE_PHOTOS.cleanRear],
                notes: activeIns.notes
              });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Columns2 size={15} color="#475569" />
            <span>So sánh ảnh trước giao & khi trả</span>
          </button>
        </div>

        {/* 4-column info strip */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Col 1: Khách hàng */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
              <User size={13} />
              <span>Khách hàng</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
              {activeIns.customerName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
              <Phone size={12} />
              <span>{activeIns.customerPhone}</span>
            </div>
          </div>

          {/* Col 2: Thời gian thuê & trả */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
              <Calendar size={13} />
              <span>Thời gian thuê & trả</span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
              Nhận: <span style={{ fontFamily: 'monospace' }}>{activeIns.rentalStartDate}</span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
              Trả: <span style={{ fontFamily: 'monospace' }}>{activeIns.returnDate}</span>
            </div>
          </div>

          {/* Col 3: Số kilomet */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
              <Gauge size={13} />
              <span>Số kilomet (Trước / Khi trả)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                {activeIns.deliveryOdometer.toLocaleString('vi-VN')} km →
              </span>
              <input
                type="number"
                min={activeIns.deliveryOdometer}
                value={activeIns.returnOdometer}
                onChange={e =>
                  onUpdateInspection({
                    ...activeIns,
                    returnOdometer: Number(e.target.value) || 0
                  })
                }
                style={{
                  width: '86px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: kmDriven >= 0 ? '#2563eb' : '#dc2626',
                marginTop: '4px'
              }}
            >
              Đã chạy: {kmDriven >= 0 ? `+${kmDriven.toLocaleString('vi-VN')}` : kmDriven.toLocaleString('vi-VN')} km
            </div>
          </div>

          {/* Col 4: Nhiên liệu & Tiếp nhận */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
              <Fuel size={13} />
              <span>Nhiên liệu & Tiếp nhận</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={activeIns.fuelLevel}
                onChange={e =>
                  onUpdateInspection({
                    ...activeIns,
                    fuelLevel: Number(e.target.value)
                  })
                }
                style={{ flex: 1, maxWidth: '120px', accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', minWidth: '36px' }}>
                {activeIns.fuelLevel}%
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
              NV tiếp nhận: <strong>{activeIns.inspectorName}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          4. INTERACTIVE PINNING + INSPECTION SUMMARY (2 COLUMNS)
         ========================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px',
          alignItems: 'stretch'
        }}
      >
        {/* Left Card: Đánh dấu vị trí hư hỏng trên xe */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ flex: '1 1 220px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Đánh dấu vị trí hư hỏng trên xe
              </h3>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '3px 0 0' }}>
                Nhấp trực tiếp lên hình ảnh xe để ghim vị trí trầy xước, móp vỡ hoặc bộ phận cần kiểm tra
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={pinLabel}
                onChange={e => setPinLabel(e.target.value)}
                placeholder="Vết trầy xước mới"
                style={{
                  width: '155px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
              <select
                value={pinSeverity}
                onChange={e => setPinSeverity(e.target.value as any)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  color: '#0f172a',
                  background: '#ffffff',
                  fontWeight: 600
                }}
              >
                <option value="low">Mức độ: Nhẹ</option>
                <option value="medium">Mức độ: Trung bình</option>
                <option value="high">Mức độ: Nặng</option>
              </select>
            </div>
          </div>

          {/* Clickable Vehicle Image Canvas */}
          <div
            onClick={handleCanvasClick}
            title="Nhấp vào ảnh để ghim vị trí hư hỏng"
            style={{
              position: 'relative',
              width: '100%',
              height: '295px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              cursor: 'crosshair',
              background: '#0f172a',
              userSelect: 'none'
            }}
          >
            <img
              src={diagramSrc}
              alt={activeIns.vehicleName}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                opacity: 0.94
              }}
            />

            {/* Rendered Numbered Pins */}
            {activeIns.pins.map((pin, idx) => {
              const pinBg =
                pin.severity === 'high' ? '#dc2626' : pin.severity === 'medium' ? '#2563eb' : '#0284c7';
              return (
                <div
                  key={pin.id}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    left: `${pin.x}%`,
                    top: `${pin.y}%`,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: pinBg,
                      color: '#ffffff',
                      border: '2.5px solid #ffffff',
                      boxShadow: '0 3px 10px rgba(0, 0, 0, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 900
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      background: 'rgba(15, 23, 42, 0.88)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                  >
                    <span>{pin.label}</span>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemovePin(pin.id);
                      }}
                      title="Xóa ghim này"
                      style={{
                        background: 'rgba(255,255,255,0.18)',
                        border: 'none',
                        color: '#ffffff',
                        width: '15px',
                        height: '15px',
                        borderRadius: '50%',
                        fontSize: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Upload custom diagram image quick button */}
            <input
              ref={canvasFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleUploadDiagramPhoto(e.target.files)}
            />
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                canvasFileRef.current?.click();
              }}
              style={{
                position: 'absolute',
                right: '10px',
                bottom: '10px',
                background: 'rgba(15, 23, 42, 0.78)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <Camera size={12} />
              <span>Đổi ảnh xe hiện trường</span>
            </button>
          </div>
        </div>

        {/* Right Card: Tổng hợp kết quả kiểm tra */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>
            Tổng hợp kết quả kiểm tra
          </h3>

          {/* 3 Stat Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #dcfce7',
                borderRadius: '10px',
                padding: '14px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', lineHeight: 1.1 }}>{normalCount}</div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#15803d', marginTop: '4px' }}>Bình thường</div>
            </div>

            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '10px',
                padding: '14px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', lineHeight: 1.1 }}>{damageCount}</div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#b91c1c', marginTop: '4px' }}>Có hư hỏng</div>
            </div>

            <div
              style={{
                background: '#fefce8',
                border: '1px solid #fef3c7',
                borderRadius: '10px',
                padding: '14px 8px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>{checkCount}</div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#a16207', marginTop: '4px' }}>Kiểm tra thêm</div>
            </div>
          </div>

          <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px', display: 'block' }}>
            Nhận xét tổng quát khi tiếp nhận trả xe
          </label>
          <textarea
            rows={5}
            value={activeIns.notes}
            onChange={e => onUpdateInspection({ ...activeIns, notes: e.target.value })}
            placeholder="Nhập nhận xét tổng quát sau khi kiểm tra xe..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              color: '#0f172a',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              flex: 1,
              minHeight: '110px'
            }}
          />

          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12.5px',
              color: '#475569'
            }}
          >
            <span>
              Điểm hư hỏng đã ghim: <strong style={{ color: '#0f172a' }}>{activeIns.pins.length}</strong>
            </span>
            <span>
              Tổng ảnh chụp: <strong style={{ color: '#0f172a' }}>{totalPhotosCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          5. DETAILED 8-ITEM CHECKLIST GRID
         ========================================== */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px'
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
            Danh mục kiểm tra kỹ thuật chi tiết (8 hạng mục)
          </h2>
          <span style={{ fontSize: '12.5px', color: '#64748b' }}>
            Chọn trạng thái và đính kèm ảnh chụp thực tế cho từng bộ phận
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '14px'
          }}
        >
          {activeIns.checklist.map(item => {
            const isDamage = item.status === 'damage';
            const isCheck = item.status === 'check';
            const needsDetail = isDamage || isCheck;

            const cardBorder = isDamage
              ? '1.5px solid #fca5a5'
              : isCheck
              ? '1.5px solid #fcd34d'
              : '1px solid #e2e8f0';
            const cardBg = isDamage ? '#fffbfb' : isCheck ? '#fffdf5' : '#ffffff';

            return (
              <div
                key={item.id}
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Item Header Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {item.order}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                      {item.title}
                    </span>
                  </div>

                  {/* 3-State Toggle Pill Group */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '3px',
                      gap: '3px'
                    }}
                  >
                    {(
                      [
                        { val: 'normal', label: 'Bình thường', bg: '#16a34a', Icon: CheckCircle2 },
                        { val: 'damage', label: 'Hư hỏng', bg: '#dc2626', Icon: AlertTriangle },
                        { val: 'check', label: 'Kiểm tra thêm', bg: '#d97706', Icon: HelpCircle }
                      ] as const
                    ).map(opt => {
                      const active = item.status === opt.val;
                      const IconComp = opt.Icon;
                      return (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => updateChecklistItem(item.id, { status: opt.val as InspectionCheckStatus })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '7px',
                            border: 'none',
                            background: active ? opt.bg : 'transparent',
                            color: active ? '#ffffff' : '#475569',
                            fontSize: '11.5px',
                            fontWeight: active ? 700 : 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <IconComp size={13} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conditional Damage Location & Severity Row */}
                {needsDetail && (
                  <div
                    style={{
                      background: isDamage ? '#fef2f2' : '#fefce8',
                      border: isDamage ? '1px solid #fecaca' : '1px solid #fde68a',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '4px'
                        }}
                      >
                        <MapPin size={12} />
                        <span>Vị trí hư hỏng cụ thể</span>
                      </label>
                      <input
                        type="text"
                        value={item.damageLocation}
                        onChange={e => updateChecklistItem(item.id, { damageLocation: e.target.value })}
                        placeholder="VD: Cánh yếm phải, tay phanh..."
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '7px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '12px',
                          color: '#0f172a',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#475569',
                          marginBottom: '4px'
                        }}
                      >
                        Mức độ hư hỏng
                      </label>
                      <select
                        value={item.damageSeverity}
                        onChange={e =>
                          updateChecklistItem(item.id, {
                            damageSeverity: e.target.value as 'low' | 'medium' | 'high'
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '7px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '12px',
                          color: '#0f172a',
                          fontWeight: 600
                        }}
                      >
                        <option value="low">Nhẹ (xước sơn nhẹ)</option>
                        <option value="medium">Trung bình (nứt nhựa / cong nhẹ)</option>
                        <option value="high">Nặng (nứt vỡ cụm / mất an toàn)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Item Notes Textarea */}
                <textarea
                  rows={2}
                  value={item.note}
                  onChange={e => updateChecklistItem(item.id, { note: e.target.value })}
                  placeholder="Ghi chú kiểm tra chi tiết..."
                  style={{
                    width: '100%',
                    padding: '9px 11px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    fontSize: '12.5px',
                    color: '#334155',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />

                {/* Photo Evidence Footer */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                      Ảnh minh chứng ({item.photos.length})
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        ref={el => {
                          fileInputsRef.current[item.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => {
                          handleUploadItemPhotos(item.id, e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputsRef.current[item.id]?.click()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '7px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Camera size={13} />
                        <span>Chụp / Tải ảnh</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSamplePhoto(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '7px',
                          background: '#ffffff',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <ImagePlus size={13} />
                        <span>Thêm ảnh mẫu</span>
                      </button>
                    </div>
                  </div>

                  {/* Thumbnails strip */}
                  {item.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {item.photos.map((src, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '74px',
                            height: '54px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer'
                          }}
                          onClick={() => setZoomPhoto(src)}
                        >
                          <img
                            src={src}
                            alt={`${item.title} #${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveItemPhoto(item, idx);
                            }}
                            title="Xóa ảnh"
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              width: '17px',
                              height: '17px',
                              borderRadius: '50%',
                              background: 'rgba(15,23,42,0.75)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
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
              </div>
            );
          })}
        </div>
      </div>

      {/* ==========================================
          6. STICKY BOTTOM ACTION BAR
         ========================================== */}
      <div
        style={{
          position: 'sticky',
          bottom: '12px',
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          padding: '13px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          zIndex: 35
        }}
      >
        <div style={{ fontSize: '13px', color: '#475569' }}>
          Đang kiểm tra <strong style={{ color: '#0f172a' }}>{activeIns.licensePlate}</strong> • Phát hiện{' '}
          <strong style={{ color: damageCount > 0 ? '#dc2626' : '#16a34a' }}>{damageCount} hư hỏng</strong>,{' '}
          <strong style={{ color: checkCount > 0 ? '#d97706' : '#475569' }}>
            {checkCount} mục cần kiểm tra thêm
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              borderRadius: '9px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Save size={15} />
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            onClick={() => onConfirmInspection(activeIns)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '9px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(22, 163, 74, 0.22)'
            }}
          >
            <CheckCircle2 size={15} />
            <span>Xác nhận kiểm tra</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDamageReport(activeIns)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '9px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(220, 38, 38, 0.22)'
            }}
          >
            <FileWarning size={15} />
            <span>Lập biên bản hư hỏng</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          PHOTO LIGHTBOX MODAL
         ========================================== */}
      {zoomPhoto && (
        <div
          onClick={() => setZoomPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: '24px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '820px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              padding: '12px'
            }}
          >
            <button
              type="button"
              onClick={() => setZoomPhoto(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(15,23,42,0.75)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
            <img
              src={zoomPhoto}
              alt="Ảnh minh chứng"
              style={{
                width: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '10px',
                display: 'block'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
