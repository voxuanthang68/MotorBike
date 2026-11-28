'use client';

import StandardRentalContractDocument from '@/components/contract/StandardRentalContractDocument';

interface ContractPreviewModalProps {
  onClose: () => void;
}

export default function ContractPreviewModal({ onClose }: ContractPreviewModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 28px 70px rgba(15,23,42,.22)',
          margin: '20px auto',
        }}
      >
        {/* Modal Header – red bar mimicking a PDF viewer */}
        <div style={{
          background: '#c8102e',
          borderRadius: '18px 18px 0 0',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: 700 }}>
              MAU-HOP-DONG-THUE-XE-MAY.pdf
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: 30,
              height: 30,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >&times;</button>
        </div>

        {/* Contract Document Body */}
        <div style={{ padding: '24px 28px', background: '#f8fafc' }}>
          <StandardRentalContractDocument mode="template" />
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px',
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
          borderTop: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Đóng
          </button>
          <a
            href="#danh-sach-xe"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 22px',
              borderRadius: 10,
              background: '#00bfa5',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Chọn xe &amp; tạo hợp đồng ngay
          </a>
        </div>
      </div>
    </div>
  );
}
