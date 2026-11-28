'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { RefreshCw, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface QrSessionData {
  _id: string;
  sessionCode: string;
  booking?: string | null;
  type: string;
  amount: number;
  transferContent: string;
  qrUrl: string;
  fallbackQrDataUrl?: string;
  status: 'active' | 'expired' | 'paid' | 'superseded';
  ttlSeconds: number;
  expiresAt: string;
  serverTime?: string;
}

interface VietQrPaymentBoxProps {
  bookingId?: string;
  bookingCode?: string;
  amount: number;
  type?: string;
  description?: string;
  accentColor?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  qrSize?: number;
  confirmLabel?: string;
  confirmLoading?: boolean;
  onConfirmPayment?: (session: QrSessionData) => Promise<void> | void;
  onSessionExpired?: () => void;
  extraContentAfterCard?: React.ReactNode;
}

const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`;

const extractApiError = (err: unknown): { code?: string; message?: string } => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { code?: string; message?: string } } }).response;
    return response?.data || {};
  }
  return {};
};

export default function VietQrPaymentBox({
  bookingId,
  bookingCode,
  amount,
  type = 'rental_fee',
  description,
  accentColor = '#2563eb',
  bankName = 'Quân Đội (MBBank)',
  accountNumber = '0905888999',
  accountName = 'XTBike',
  qrSize = 250,
  confirmLabel,
  confirmLoading = false,
  onConfirmPayment,
  onSessionExpired,
  extraContentAfterCard,
}: VietQrPaymentBoxProps) {
  const [session, setSession] = useState<QrSessionData | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [useFallbackQr, setUseFallbackQr] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestCounterRef = useRef(0);
  const expiredNotifiedRef = useRef(false);
  const onSessionExpiredRef = useRef(onSessionExpired);

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  const generateQrSession = useCallback(async (isManualRegenerate = false) => {
    if (!amount || amount <= 0) return;

    const reqId = ++requestCounterRef.current;
    setCreating(true);
    setErrorMsg(null);
    setUseFallbackQr(false);
    expiredNotifiedRef.current = false;

    try {
      const res = await api.post('/payments/qr-session', {
        bookingId: bookingId || undefined,
        bookingCode: bookingCode || undefined,
        amount: Math.round(amount),
        type,
        description: description || undefined,
      });

      if (reqId !== requestCounterRef.current) return;

      const data: QrSessionData = res.data?.data;
      const ttl = Number(data?.ttlSeconds || 30);
      const serverNowMs = data?.serverTime ? new Date(data.serverTime).getTime() : Date.now();
      const serverExpiresMs = data?.expiresAt ? new Date(data.expiresAt).getTime() : serverNowMs + ttl * 1000;
      const durationMs = Math.max(1000, serverExpiresMs - serverNowMs);
      const clientDeadline = Date.now() + durationMs;

      setSession(data);
      setDeadlineMs(clientDeadline);
      setRemainingSeconds(Math.max(1, Math.ceil(durationMs / 1000)));

      if (isManualRegenerate) {
        toast.success(`Đã tạo mã QR mới (${data.sessionCode}) — Hiệu lực 30 giây`);
      }
    } catch (err: unknown) {
      if (reqId !== requestCounterRef.current) return;
      const apiErr = extractApiError(err);
      const message = apiErr.message || 'Không thể tạo mã QR thanh toán. Vui lòng thử lại.';
      setErrorMsg(message);
      setSession(null);
      setDeadlineMs(null);
      setRemainingSeconds(0);
    } finally {
      if (reqId === requestCounterRef.current) {
        setCreating(false);
      }
    }
  }, [bookingId, bookingCode, amount, type, description]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      void generateQrSession(false);
    }, 0);
    return () => clearTimeout(initTimer);
  }, [generateQrSession]);

  const sessionCode = session?.sessionCode;
  const sessionStatus = session?.status;

  // Accurate 200ms tick countdown synced to clientDeadlineMs
  useEffect(() => {
    if (!deadlineMs || !sessionCode || sessionStatus !== 'active') return;

    const updateTimer = () => {
      const leftMs = deadlineMs - Date.now();
      const leftSec = Math.max(0, Math.ceil(leftMs / 1000));
      setRemainingSeconds(leftSec);

      if (leftMs <= 0) {
        setSession((prev) => (prev && prev.status === 'active' ? { ...prev, status: 'expired' } : prev));
        if (!expiredNotifiedRef.current) {
          expiredNotifiedRef.current = true;
          toast.error('Mã QR đã hết hiệu lực (quá 30 giây). Vui lòng tạo lại mã mới.');
          onSessionExpiredRef.current?.();
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 200);
    return () => clearInterval(timer);
  }, [deadlineMs, sessionCode, sessionStatus]);

  const ttlTotal = session?.ttlSeconds || 30;
  const isExpired = Boolean(
    session &&
      (session.status === 'expired' ||
        session.status === 'superseded' ||
        remainingSeconds <= 0)
  );
  const isUrgent = !isExpired && remainingSeconds <= 10;
  const progressPercent = isExpired ? 0 : Math.min(100, Math.max(0, (remainingSeconds / ttlTotal) * 100));

  const qrImageSrc = session
    ? useFallbackQr && session.fallbackQrDataUrl
      ? session.fallbackQrDataUrl
      : session.qrUrl
    : '';

  const handleConfirmClick = async () => {
    if (!session || isExpired || creating || submitting || confirmLoading || !onConfirmPayment) return;
    setSubmitting(true);
    try {
      await onConfirmPayment(session);
    } catch (err: unknown) {
      const { code } = extractApiError(err);
      if (code === 'QR_EXPIRED' || code === 'QR_SUPERSEDED') {
        setDeadlineMs(Date.now());
        setRemainingSeconds(0);
        setSession((prev) => (prev ? { ...prev, status: 'expired' } : prev));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* QR Card */}
      <div
        style={{
          background: '#ffffff',
          border: `1.5px solid ${isExpired ? '#fca5a5' : isUrgent ? '#fdba74' : '#bfdbfe'}`,
          borderRadius: 16,
          padding: 20,
          textAlign: 'center',
          boxShadow: isExpired
            ? '0 8px 24px rgba(220, 38, 38, 0.08)'
            : '0 8px 24px rgba(37, 99, 235, 0.08)',
          marginBottom: 16,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Top Header + Countdown Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: isExpired ? '#b91c1c' : '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG
            </div>
            {session && (
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                Mã phiên: <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{session.sessionCode}</strong>
              </div>
            )}
          </div>

          <div
            data-testid="qr-countdown-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              background: isExpired ? '#fef2f2' : isUrgent ? '#fff7ed' : '#ecfdf5',
              color: isExpired ? '#dc2626' : isUrgent ? '#ea580c' : '#059669',
              border: `1px solid ${isExpired ? '#fecaca' : isUrgent ? '#fed7aa' : '#a7f3d0'}`,
            }}
          >
            <Clock size={14} />
            {creating ? (
              <span>Đang tạo mã...</span>
            ) : isExpired ? (
              <span>Hết hiệu lực (00s)</span>
            ) : (
              <span>Hết hạn sau: {String(remainingSeconds).padStart(2, '0')}s</span>
            )}
          </div>
        </div>

        {/* Countdown Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            background: '#e2e8f0',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: `${creating ? 100 : progressPercent}%`,
              height: '100%',
              background: isExpired ? '#ef4444' : isUrgent ? '#f97316' : '#10b981',
              transition: 'width 0.2s linear, background-color 0.2s ease',
            }}
          />
        </div>

        {/* Error state if creating failed */}
        {errorMsg && !creating && (
          <div
            style={{
              padding: '24px 16px',
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              marginBottom: 14,
            }}
          >
            <div style={{ color: '#dc2626', fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
              {errorMsg}
            </div>
            <button
              type="button"
              onClick={() => generateQrSession(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={15} />
              Thử tạo lại mã QR
            </button>
          </div>
        )}

        {/* QR Display Box with Expiration Overlay */}
        {!errorMsg && (
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
              background: '#ffffff',
              borderRadius: 14,
              border: `1px solid ${isExpired ? '#fca5a5' : '#cbd5e1'}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              minWidth: qrSize + 20,
              minHeight: qrSize + 20,
            }}
          >
            {creating || !qrImageSrc ? (
              <div
                style={{
                  width: qrSize,
                  height: qrSize,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Đang khởi tạo mã QR mới...</span>
              </div>
            ) : (
              <img
                src={qrImageSrc}
                alt={`VietQR ${session?.sessionCode || ''}`}
                onError={() => {
                  if (!useFallbackQr && session?.fallbackQrDataUrl) {
                    setUseFallbackQr(true);
                  }
                }}
                style={{
                  width: qrSize,
                  height: qrSize,
                  objectFit: 'contain',
                  display: 'block',
                  filter: isExpired ? 'blur(7px) grayscale(1)' : 'none',
                  opacity: isExpired ? 0.28 : 1,
                  pointerEvents: isExpired ? 'none' : 'auto',
                  transition: 'filter 0.25s ease, opacity 0.25s ease',
                  userSelect: 'none',
                }}
              />
            )}

            {/* Expired Overlay */}
            {isExpired && !creating && (
              <div
                data-testid="qr-expired-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.86)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 18,
                  textAlign: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#b91c1c' }}>
                  Mã QR đã hết hiệu lực
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45, maxWidth: 220 }}>
                  Hết thời gian 30 giây. Vui lòng tạo lại mã mới để tiếp tục quét thanh toán.
                </div>
                <button
                  type="button"
                  data-testid="regenerate-qr-btn"
                  onClick={() => generateQrSession(true)}
                  style={{
                    marginTop: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  }}
                >
                  <RefreshCw size={14} />
                  Tạo lại mã QR mới
                </button>
              </div>
            )}
          </div>
        )}

        {/* Amount Display */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12.5, color: '#64748b' }}>
            Số tiền quét mã chuyển khoản:
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: isExpired ? '#94a3b8' : accentColor, letterSpacing: -0.5 }}>
            {money(amount)}
          </div>
        </div>

        {/* Bank Details */}
        <div
          style={{
            marginTop: 12,
            background: '#f8fafc',
            padding: '12px 16px',
            borderRadius: 10,
            fontSize: 12.5,
            color: '#334155',
            textAlign: 'left',
            lineHeight: 1.65,
            border: '1px solid #e2e8f0',
          }}
        >
          <div>Ngân hàng: <strong>{bankName}</strong></div>
          <div>
            Số tài khoản:{' '}
            <strong style={{ color: '#1e293b', fontFamily: 'monospace', fontSize: 14 }}>{accountNumber}</strong>
          </div>
          <div>Chủ tài khoản: <strong>{accountName}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>
              Nội dung CK:{' '}
              <strong style={{ color: isExpired ? '#dc2626' : '#2563eb', textDecoration: isExpired ? 'line-through' : 'none' }}>
                {session?.transferContent || `XTBike ${bookingCode || ''}`}
              </strong>
            </span>
            {!creating && (
              <button
                type="button"
                onClick={() => generateQrSession(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#2563eb',
                  borderRadius: 6,
                  padding: '3px 9px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={11} />
                {isExpired ? 'Tạo mã mới' : 'Làm mới mã (30s)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {extraContentAfterCard}

      {/* Optional Confirm Action */}
      {onConfirmPayment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isExpired ? (
            <button
              type="button"
              onClick={() => generateQrSession(true)}
              disabled={creating}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: 14,
                fontSize: 15,
                fontWeight: 800,
                borderRadius: 10,
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={17} />
              Mã QR đã hết hiệu lực — Bấm để tạo lại mã mới
            </button>
          ) : null}

          <button
            type="button"
            data-testid="confirm-qr-payment-btn"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: 14,
              fontSize: 15,
              fontWeight: 800,
              borderRadius: 10,
              opacity: isExpired || creating || !session ? 0.5 : 1,
              cursor: isExpired || creating || !session ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onClick={handleConfirmClick}
            disabled={isExpired || creating || submitting || confirmLoading || !session}
          >
            <CheckCircle2 size={18} />
            {submitting || confirmLoading
              ? 'Đang xác nhận...'
              : isExpired
                ? 'Mã QR đã hết hạn (30s)'
                : confirmLabel || `Tôi Đã Chuyển Khoản ${money(amount)}`}
          </button>
        </div>
      )}
    </div>
  );
}
