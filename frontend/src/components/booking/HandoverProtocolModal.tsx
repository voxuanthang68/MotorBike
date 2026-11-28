'use client';

import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleImageError, PHOTO_IMAGE_FALLBACK, resolveMediaUrl } from '@/lib/media';

export interface HandoverProtocolPayload {
  checkInOdometer: number;
  checkInNote: string;
  checkInImages: Array<{ url: string; caption: string }>;
  checkInStaffSignature: string;
  checkInCustomerSignature: string;
  fuelLevel: string;
}

interface HandoverProtocolModalProps {
  isOpen: boolean;
  vehiclePlate: string;
  vehicleName: string;
  customerName: string;
  customerPhone?: string;
  initialOdometer?: number;
  initialImages?: string[];
  initialNote?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (payload: HandoverProtocolPayload) => void;
}

function SignaturePadBox({
  label,
  onSignatureChange,
}: {
  label: string;
  onSignatureChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const getCoords = (
    canvas: HTMLCanvasElement,
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || canvas.width);
    const scaleY = canvas.height / (rect.height || canvas.height);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(canvas, e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    hasDrawnRef.current = true;
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(canvas, e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStop = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (hasDrawnRef.current && canvasRef.current) {
      onSignatureChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    isDrawingRef.current = false;
    hasDrawnRef.current = false;
    onSignatureChange('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{label}</label>
        <button
          type="button"
          onClick={handleClear}
          style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}
        >
          Xóa ký lại
        </button>
      </div>
      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '6px', background: '#fafafa', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={260}
          height={100}
          style={{ width: '100%', height: '100px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
          onMouseDown={handleStart}
          onMouseMove={handleDraw}
          onMouseUp={handleStop}
          onMouseLeave={handleStop}
          onTouchStart={handleStart}
          onTouchMove={handleDraw}
          onTouchEnd={handleStop}
        />
      </div>
    </div>
  );
}

function HandoverProtocolForm({
  vehiclePlate,
  vehicleName,
  customerName,
  customerPhone,
  initialOdometer = 0,
  initialImages = [],
  initialNote = 'Xe sạch sẽ, phanh tốt, xăng đầy vạch, kèm 2 mũ bảo hiểm',
  isSubmitting = false,
  onClose,
  onConfirm,
}: Omit<HandoverProtocolModalProps, 'isOpen'>) {
  const [odometer, setOdometer] = useState<number>(() => Number(initialOdometer || 0));
  const [fuelLevel, setFuelLevel] = useState<string>('full');
  const [note, setNote] = useState<string>(initialNote);
  const [images, setImages] = useState<string[]>(() =>
    Array.isArray(initialImages) ? initialImages.map((u) => resolveMediaUrl(u)).filter(Boolean) : []
  );
  const [staffSigUrl, setStaffSigUrl] = useState<string>('');
  const [customerSigUrl, setCustomerSigUrl] = useState<string>('');

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev, String(ev.target?.result)]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (images.length === 0) {
      toast.error('Vui lòng chụp hoặc tải ít nhất 1 ảnh xe trước khi giao!');
      return;
    }
    if (!staffSigUrl || !customerSigUrl) {
      toast.error('Yêu cầu cả 2 bên (Nhân viên & Khách hàng) ký xác nhận bàn giao xe!');
      return;
    }

    onConfirm({
      checkInOdometer: Math.max(0, Number(odometer) || 0),
      checkInNote: `${note} [Nhiên liệu: ${fuelLevel}]`,
      checkInImages: images.map((u) => ({ url: u, caption: 'Bàn giao xe' })),
      checkInStaffSignature: staffSigUrl,
      checkInCustomerSignature: customerSigUrl,
      fuelLevel,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          border: '1px solid #e2e8f0',
          color: '#0f172a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Biên bản bàn giao xe (Giao xe)</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Yêu cầu: Chụp/tải ảnh xe lúc giao và cả 2 bên ký xác nhận
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px', color: '#64748b' }} />
          </button>
        </div>

        {/* Vehicle & Customer Info */}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              Xe bàn giao:{' '}
              <strong>
                {vehiclePlate} {vehicleName ? `(${vehicleName})` : ''}
              </strong>
            </div>
            <div>
              Khách nhận xe:{' '}
              <strong>
                {customerName} {customerPhone ? `(${customerPhone})` : ''}
              </strong>
            </div>
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
              value={odometer}
              onChange={(e) => setOdometer(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Mức nhiên liệu / Pin lúc giao *
            </label>
            <select
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '8px' }}>
            {images.map((img, idx) => (
              <div
                key={idx}
                style={{
                  height: '80px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid #cbd5e1',
                }}
              >
                <img src={resolveMediaUrl(img, PHOTO_IMAGE_FALLBACK)} alt={`Ảnh xe ${idx + 1}`} onError={handleImageError(PHOTO_IMAGE_FALLBACK)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  title="Xóa ảnh"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '999px',
                    border: 'none',
                    background: 'rgba(15, 23, 42, 0.72)',
                    color: '#ffffff',
                    fontSize: '12px',
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
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
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFilesChange} />
            </label>
          </div>
        </div>

        {/* Step C: Handover Note */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
            Tình trạng vỏ xe &amp; phụ kiện bàn giao
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Step D: DUAL SIGNATURE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <SignaturePadBox label="1. Nhân viên giao xe ký *" onSignatureChange={setStaffSigUrl} />
          <SignaturePadBox label="2. Khách nhận xe ký *" onSignatureChange={setCustomerSigUrl} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '9px 22px',
              fontSize: '13px',
              fontWeight: 700,
              background: '#059669',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Đang lưu...' : 'Hoàn tất bàn giao xe'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HandoverProtocolModal(props: HandoverProtocolModalProps) {
  if (!props.isOpen) return null;
  return (
    <HandoverProtocolForm
      key={`${props.vehiclePlate}-${props.customerName}-${props.initialOdometer || 0}`}
      vehiclePlate={props.vehiclePlate}
      vehicleName={props.vehicleName}
      customerName={props.customerName}
      customerPhone={props.customerPhone}
      initialOdometer={props.initialOdometer}
      initialImages={props.initialImages}
      initialNote={props.initialNote}
      isSubmitting={props.isSubmitting}
      onClose={props.onClose}
      onConfirm={props.onConfirm}
    />
  );
}
