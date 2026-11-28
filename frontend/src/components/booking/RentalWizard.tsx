'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import VietQrPaymentBox, { QrSessionData } from '@/components/payment/VietQrPaymentBox';
import StandardRentalContractDocument, {
  buildStandardContractTerms,
  numberToVietnameseWords,
  StandardContractData,
} from '@/components/contract/StandardRentalContractDocument';

type Bike = { id: string; name: string; pricePerDay: number; image: string; priceFormatted: string };
type Props = { bike: Bike; onClose: () => void; onCompleted?: () => void };

const steps = ['Lịch & Dịch vụ', 'Hồ sơ CCCD & GPLX', 'Ký hợp đồng', 'Thanh toán cọc', 'Hoàn tất'];
const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const RentalPricingContext = createContext<any>(null);
const ACCESSORY_OPTIONS = [
  { key: 'helmet', name: 'Mũ bảo hiểm 3/4 cao cấp', price: 30000 },
  { key: 'raincoat', name: 'Áo mưa bộ', price: 20000 },
  { key: 'phoneHolder', name: 'Giá đỡ điện thoại', price: 20000 },
  { key: 'luggageRack', name: 'Baga/thùng đựng hành lý', price: 50000 },
];

export default function RentalWizard({ bike, onClose: closeWizard, onCompleted }: Props) {
  const router = useRouter();
  const onClose = () => { closeWizard(); if (step === 4) router.push('/portal'); };
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalType, setRentalType] = useState<'daily' | 'monthly'>('daily');
  const [couponCode, setCouponCode] = useState('');
  const [pickupLocation, setPickupLocation] = useState('Sân bay Đà Nẵng');
  const [services, setServices] = useState({ insurance: true, delivery: false, gear: false });
  const [accessories, setAccessories] = useState<Record<string, boolean>>({ helmet: false, raincoat: false, phoneHolder: false, luggageRack: false });
  const [note, setNote] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [cccd, setCccd] = useState(user?.cccd || '');
  const [license, setLicense] = useState(user?.drivingLicense || '');
  const [licenseClass, setLicenseClass] = useState('A2');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [paymentMode, setPaymentMode] = useState<'full' | 'deposit'>('full');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signed, setSigned] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [draftSignature, setDraftSignature] = useState('');
  const [draftContractTerms, setDraftContractTerms] = useState('');

  const days = Math.max(1, Math.ceil((new Date(endDate || Date.now() + 86400000).getTime() - new Date(startDate || Date.now()).getTime()) / 86400000));
  const serviceTotal = (services.insurance ? 100000 : 0) + (services.delivery ? 100000 : 0) + (services.gear ? 80000 : 0);
  const accessoryTotal = ACCESSORY_OPTIONS.reduce((total, item) => total + (accessories[item.key] ? item.price : 0), 0);
  const monthlyPrice = Math.round(bike.pricePerDay * 26 * 0.8);
  const rentalMonths = Math.max(1, Math.ceil(days / 30));
  const packageDiscount = rentalType === 'monthly' ? Math.max(0, bike.pricePerDay * 26 * rentalMonths - monthlyPrice * rentalMonths) : 0;
  const rentalBase = rentalType === 'monthly' ? monthlyPrice * rentalMonths : bike.pricePerDay * days;
  const couponPercent = couponCode.trim().toUpperCase() === 'MONTHLY20' && rentalType === 'monthly' ? 20 : couponCode.trim().toUpperCase() === 'WELCOME10' ? 10 : couponCode.trim().toUpperCase() === 'WEEKEND15' ? 15 : 0;
  const discountAmount = Math.round((rentalBase + serviceTotal + accessoryTotal) * couponPercent / 100);
  const rentalTotal = rentalBase + serviceTotal + accessoryTotal - discountAmount;
  const deposit = Math.max(20000, Math.round(rentalTotal * 0.1));

  // Dynamic QR amount according to selected mode (full incl. accessories vs deposit)
  const finalPayAmount = paymentMode === 'full' ? rentalTotal : deposit;
  const selectedAccessoriesList = ACCESSORY_OPTIONS.filter(item => accessories[item.key]);

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const date = (d: Date) => d.toISOString().slice(0, 10);
    setStartDate(date(today)); setEndDate(date(tomorrow));
  }, []);

  useEffect(() => {
    if (step !== 4 || !booking) return;
    api.get('/payments').then(response => {
      const found = (response.data?.data || []).find((item: any) => item.booking?._id === booking._id || item.booking === booking._id);
      if (found) setPayment(found);
    }).catch(() => undefined);
  }, [step, booking]);

  const readFile = (key: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFiles(prev => ({ ...prev, [key]: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const createBooking = async () => {
    setLoading(true);
    try {
      await api.post('/bookings/check-availability', {
        vehicleId: bike.id,
        vehicleName: bike.name,
        startDate,
        endDate,
      });
      if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
        toast.error('Vui lòng đăng nhập tài khoản khách hàng để tiếp tục đặt xe.');
        router.push('/login');
        return;
      }
      setStep(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xe hiện không sẵn sàng trong thời gian này.');
    } finally {
      setLoading(false);
    }
  };

  const saveDocuments = async () => {
    if (!cccd || !license) return toast.error('Vui lòng nhập số CCCD và GPLX.');
    setLoading(true);
    try {
      await api.put('/users/profile', { cccd, drivingLicense: license, drivingLicenseClass: licenseClass, cccdFrontImage: files.cccdFront, cccdBackImage: files.cccdBack, drivingLicenseFrontImage: files.licenseFront, drivingLicenseBackImage: files.licenseBack });
      setStep(2);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Không thể lưu hồ sơ.'); }
    finally { setLoading(false); }
  };

  const buildDraftContractData = (): StandardContractData => {
    const today = new Date();
    const fmtDate = (d: string) => {
      if (!d) return '';
      const parsed = new Date(d);
      return Number.isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString('vi-VN');
    };
    const bAny = bike as any;
    return {
      contractNumber: booking?.bookingCode ? `${booking.bookingCode} – ${today.getFullYear()}/HĐTX` : undefined,
      signDay: String(today.getDate()).padStart(2, '0'),
      signMonth: String(today.getMonth() + 1).padStart(2, '0'),
      signYear: String(today.getFullYear()),
      location: '128 Bạch Đằng, Hải Châu, TP. Đà Nẵng',
      signPlace: 'Đà Nẵng',
      partyA: {
        fullName: 'Đại diện cửa hàng XTBike Đà Nẵng',
        birthYear: '1990',
        cccd: '048090001234',
        cccdIssueDate: '10/05/2021',
        cccdIssuePlace: 'Cục CS QLHC về TTXH',
        permanentAddress: '128 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng',
        tempAddress: '128 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng',
        phone: '0905 123 456',
      },
      partyB: {
        fullName: user?.fullName || cccd,
        cccd: cccd || user?.cccd || '',
        permanentAddress: user?.address || '',
        phone: user?.phone || '',
        licenseClass,
        licenseNumber: license || user?.drivingLicense || '',
      },
      vehicle: {
        count: '01',
        brand: bAny.brand || bike.name.split(' ')[0] || '',
        type: bike.name,
        color: bAny.color || '',
        engineNumber: bAny.engine || '',
        chassisNumber: bAny.chassisNumber || '',
        licensePlate: bAny.licensePlate || '',
      },
      rentalDuration: rentalType === 'monthly' ? `${rentalMonths} tháng` : `${String(days).padStart(2, '0')} ngày`,
      purpose: 'Di chuyển cá nhân, tham quan du lịch tại Đà Nẵng và các vùng lân cận',
      totalAmountNumber: rentalTotal,
      totalAmountText: rentalTotal.toLocaleString('vi-VN'),
      totalAmountWords: numberToVietnameseWords(rentalTotal),
      depositAmountNumber: deposit,
      paidAmountNumber: 0,
      paymentMethodText: 'Chuyển khoản VietQR',
      paymentDeadlineHour: '17:00',
      paymentDeadlineDate: fmtDate(startDate),
      invoiceNote: 'Xuất hóa đơn điện tử / biên nhận thanh toán theo yêu cầu của Bên B',
      startDate: fmtDate(startDate),
      endDate: fmtDate(endDate),
      noticePeriod: '01 ngày',
      courtName: 'nhân dân TP. Đà Nẵng',
    };
  };

  const signature = () => canvasRef.current?.toDataURL() || '';
  const signContract = async () => {
    if (!acceptedTerms) return toast.error('Vui lòng đọc và xác nhận toàn bộ điều khoản hợp đồng.');
    const value = signature();
    if (!value) return toast.error('Vui lòng ký tên trên khung ký.');

    const contractText = buildStandardContractTerms(buildDraftContractData());

    setDraftSignature(value);
    setDraftContractTerms(contractText);
    setSigned(true);
    setStep(3);
  };

  const payDeposit = async (qrSession: QrSessionData) => {
    setLoading(true);
    try {
      const selectedAccessories = ACCESSORY_OPTIONS.filter(item => accessories[item.key]).map(({ name, price }) => ({ name, price }));
      const paymentType = paymentMode === 'full' ? 'rental_fee' : 'deposit';
      const res = await api.post('/bookings/checkout', {
        vehicleId: bike.id,
        vehicleName: bike.name,
        startDate,
        endDate,
        pickupLocation,
        customerNote: note,
        accessories: selectedAccessories,
        extraServicesTotal: serviceTotal,
        rentalType,
        couponCode,
        customerSignature: draftSignature,
        termsAndConditions: draftContractTerms,
        qrSessionId: qrSession._id,
        qrSessionCode: qrSession.sessionCode,
        paymentType,
        amount: qrSession.amount,
      });
      const result = res.data?.data;
      if (result?.booking) setBooking(result.booking);
      if (result?.contract) setContract(result.contract);
      if (result?.payment) setPayment(result.payment);
      onCompleted?.();
      setStep(4);
      toast.success(paymentMode === 'full' ? 'Thanh toán & đặt xe thành công!' : 'Thanh toán cọc & đặt xe thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Thanh toán chưa thành công.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a';
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top); ctx.stroke(); setSigned(true);
  };

  if (step === 4) return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 860, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
      <div className="modal-header" style={{ padding: '20px 26px' }}><div><div className="modal-title">Đặt Thuê Xe Mô Tô: {bike.name}</div><div style={{ color: '#64748b', fontSize: 12 }}>Thời gian thuê và hồ sơ điện tử</div></div><button onClick={onClose} style={{ border: 0, background: 'none', fontSize: 24, color: '#94a3b8' }}>×</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #e2e8f0' }}>{steps.map((label, index) => <div key={label} style={{ padding: '14px 6px', textAlign: 'center', color: index === 4 ? '#1463ff' : '#0f9f75', fontWeight: 700, fontSize: 12, borderBottom: index === 4 ? '2px solid #1463ff' : '2px solid transparent' }}>{index + 1}. {label}</div>)}</div>
      <div style={{ textAlign: 'center', padding: '64px 24px 54px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900, margin: '0 auto 22px' }}>OK</div>
        <h2 style={{ margin: 0, color: '#172033', fontSize: 25 }}>Đặt Xe Moto & Đặt Cọc Thành Công!</h2>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Mã đơn hàng: <strong style={{ color: '#64748b' }}>{booking?.bookingCode}</strong> · Mã GD: <strong style={{ color: '#64748b' }}>{payment?.paymentCode || 'Đã ghi nhận'}</strong></div>
        <div style={{ maxWidth: 505, margin: '22px auto 0', padding: 18, borderRadius: 14, background: '#f8fafc', border: '1px solid #dbe3ef', textAlign: 'left' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 13 }}>
            <span style={{ color: '#64748b' }}>Xe thuê:</span><strong style={{ textAlign: 'right' }}>{bike.name}</strong>
            <span style={{ color: '#64748b' }}>Thời gian:</span><span style={{ textAlign: 'right' }}>{startDate} đến {endDate}</span>
            <span style={{ color: '#64748b' }}>{paymentMode === 'full' ? 'Số tiền đã thanh toán:' : 'Tiền cọc đã thanh toán:'}</span><strong style={{ textAlign: 'right', color: '#059669' }}>{money(finalPayAmount)}</strong>
            <span style={{ color: '#64748b' }}>Hồ sơ CCCD & GPLX:</span><strong style={{ textAlign: 'right', color: '#059669' }}>Đã tải 2 mặt & Lưu hồ sơ</strong>
            <span style={{ color: '#64748b' }}>Trạng thái:</span><strong style={{ textAlign: 'right', color: '#2563eb' }}>Đã xác nhận & Đã ký hợp đồng điện tử</strong>
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 24, minWidth: 220 }} onClick={onClose}>▣ &nbsp; Xem Đơn Hàng Của Tôi</button>
      </div>
    </div>
  </div>;

  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 860, maxHeight: '92vh', overflowY: 'auto', padding: 0 }}>
      <div className="modal-header" style={{ padding: '20px 26px' }}><div><div className="modal-title">Đặt Thuê Xe Mô Tô: {bike.name}</div><div style={{ color: '#64748b', fontSize: 12 }}>Thời gian thuê và hồ sơ điện tử</div></div><button onClick={onClose} style={{ border: 0, background: 'none', fontSize: 24, color: '#94a3b8' }}>×</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #e2e8f0' }}>{steps.map((label, index) => <div key={label} style={{ padding: '14px 6px', textAlign: 'center', color: index === step ? '#1463ff' : index < step ? '#0f9f75' : '#94a3b8', fontWeight: 700, fontSize: 12, borderBottom: index === step ? '2px solid #1463ff' : '2px solid transparent' }}>{index + 1}. {label}</div>)}</div>
      <div className={`rental-wizard-body step-${step}`} style={{ padding: 28 }}>
        <RentalPricingContext.Provider value={{ rentalType, setRentalType, monthlyPrice, couponCode, setCouponCode, couponPercent }}>
        {step === 0 && <><div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 14, padding: 16, marginBottom: 20 }}>Xe <strong>{bike.name}</strong> yêu cầu khách thuê có CCCD và GPLX phù hợp.</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><label>Ngày nhận xe<input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>Ngày trả xe<input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label></div><label style={{ display: 'block', marginTop: 16 }}>Địa điểm nhận xe<select className="form-input" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)}><option>Sân bay Đà Nẵng</option><option>128 Bạch Đằng, Hải Châu</option><option>Giao tận khách sạn Hải Châu</option></select></label><div style={{ marginTop: 20 }}><strong>Dịch vụ & trang bị đi kèm</strong>{[['insurance', 'Gói bảo hiểm thân vỏ & phụ tùng xe máy', 100000], ['delivery', 'Giao nhận xe tận nơi', 100000], ['gear', 'Bộ giáp bảo hộ phượt cao cấp', 80000]].map(([key, label, price]) => <label key={String(key)} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, border: '1px solid #dbe3ef', borderRadius: 12, marginTop: 10 }}><span><input type="checkbox" checked={Boolean(services[key as keyof typeof services])} onChange={e => setServices({ ...services, [key]: e.target.checked })} /> {label}</span><strong>+{money(Number(price))}</strong></label>)}</div><div style={{ marginTop: 20 }}><strong>Phụ kiện thuê thêm</strong>{ACCESSORY_OPTIONS.map(item => <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, border: '1px solid #dbe3ef', borderRadius: 12, marginTop: 10 }}><span><input type="checkbox" checked={accessories[item.key]} onChange={e => setAccessories({ ...accessories, [item.key]: e.target.checked })} /> {item.name}</span><strong>+{money(item.price)}</strong></label>)}</div><textarea className="form-input" style={{ marginTop: 18 }} placeholder="Ghi chú cho bộ phận kỹ thuật & giao xe" value={note} onChange={e => setNote(e.target.value)} /><Summary bike={bike} days={days} serviceTotal={serviceTotal + accessoryTotal} total={rentalTotal} deposit={deposit} /><button className="btn btn-primary" style={{ float: 'right', marginTop: 18 }} onClick={createBooking} disabled={loading}>{loading ? 'Đang tạo đơn...' : 'Tiếp tục cung cấp CCCD & Bằng lái →'}</button></>}
        {step === 1 && <><h3>Cung cấp hình ảnh Căn Cước Công Dân (CCCD) & Bằng Lái Xe (GPLX)</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><label>Số CCCD<input className="form-input" value={cccd} onChange={e => setCccd(e.target.value)} /></label><label>Số GPLX<input className="form-input" value={license} onChange={e => setLicense(e.target.value)} /></label></div><label style={{ display: 'block', marginTop: 14 }}>Hạng bằng lái<select className="form-input" value={licenseClass} onChange={e => setLicenseClass(e.target.value)}><option>A2</option><option>A1</option></select></label><Upload label="Mặt trước CCCD" value={files.cccdFront} onChange={file => readFile('cccdFront', file)} /><Upload label="Mặt sau CCCD" value={files.cccdBack} onChange={file => readFile('cccdBack', file)} /><Upload label="Mặt trước GPLX" value={files.licenseFront} onChange={file => readFile('licenseFront', file)} /><Upload label="Mặt sau GPLX" value={files.licenseBack} onChange={file => readFile('licenseBack', file)} /><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setStep(0)}>← Quay lại</button><button className="btn btn-primary" onClick={saveDocuments} disabled={loading}>{loading ? 'Đang lưu...' : 'Xác nhận hồ sơ & tiếp tục ký hợp đồng'}</button></div></>}
        {step === 2 && (
          <>
            <div style={{ maxHeight: 440, overflowY: 'auto', borderRadius: 12 }}>
              <StandardRentalContractDocument
                mode="populated"
                data={buildDraftContractData()}
                compact
              />
            </div>

            {/* Checkbox accept */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: '#00bfa5' }} />
              <span>Tôi đã đọc, hiểu rõ và đồng ý với toàn bộ điều khoản Hợp đồng cho thuê xe máy điện tử này.</span>
            </label>

            {/* Signature canvas */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Chữ ký điện tử của Bên B</div>
              <canvas
                ref={canvasRef}
                width={760}
                height={160}
                style={{ width: '100%', border: '2px dashed #cbd5e1', borderRadius: 12, background: '#fafafa', touchAction: 'none', cursor: 'crosshair' }}
                onPointerDown={e => {
                  const ctx = canvasRef.current?.getContext('2d');
                  const rect = e.currentTarget.getBoundingClientRect();
                  ctx?.beginPath();
                  ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                }}
                onPointerMove={e => { if (e.buttons === 1) draw(e); }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: 13 }}
                    onClick={() => setStep(1)}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: 13 }}
                    onClick={() => { canvasRef.current?.getContext('2d')?.clearRect(0, 0, 760, 160); setSigned(false); setDraftSignature(''); }}
                  >
                    Xóa chữ ký
                  </button>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={!signed || !acceptedTerms || loading}
                  onClick={signContract}
                  style={{ minWidth: 220 }}
                >
                  {loading ? 'Đang xử lý...' : 'Ký Hợp Đồng & Tiếp Tục →'}
                </button>
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                📱 Quét Mã VietQR Thanh Toán Đơn Đặt Xe
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                Đơn đặt xe chỉ được xác nhận sau khi bạn hoàn tất quét mã thanh toán trong thời hạn 30 giây
              </p>
            </div>

            {/* Toggle Payment Mode: Full (All incl. accessories) vs Deposit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setPaymentMode('full')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: paymentMode === 'full' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: paymentMode === 'full' ? '#ecfdf5' : '#ffffff',
                  color: paymentMode === 'full' ? '#047857' : '#475569',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>Thanh toán trọn gói</div>
                  <span style={{ fontSize: 10.5, background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Bao gồm phụ kiện</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                  {money(rentalTotal)}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Tiền xe + dịch vụ & tất cả phụ kiện
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('deposit')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: paymentMode === 'deposit' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: paymentMode === 'deposit' ? '#eff6ff' : '#ffffff',
                  color: paymentMode === 'deposit' ? '#1d4ed8' : '#475569',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>Đặt cọc trước giữ xe</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                  {money(deposit)}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                  Thanh toán phần còn lại khi nhận xe
                </div>
              </button>
            </div>

            <VietQrPaymentBox
              bookingId={booking?._id}
              bookingCode={booking?.bookingCode || bike.name}
              amount={finalPayAmount}
              type={paymentMode === 'full' ? 'rental_fee' : 'deposit'}
              accentColor={paymentMode === 'full' ? '#059669' : '#2563eb'}
              qrSize={250}
              confirmLabel={`Tôi Đã Chuyển Khoản ${money(finalPayAmount)}`}
              confirmLoading={loading}
              onConfirmPayment={payDeposit}
              extraContentAfterCard={
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px', fontSize: 13, marginBottom: 18 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 10, fontSize: 13.5 }}>
                    📋 Bảng Kê Chi Tiết Số Tiền Đặt Xe
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#475569' }}>Tiền thuê xe ({bike.name} • {days} ngày):</span>
                    <strong>{money(rentalBase)}</strong>
                  </div>

                  {selectedAccessoriesList.length > 0 ? (
                    <div style={{ margin: '8px 0', padding: '8px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #dbeafe' }}>
                      <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
                        Phụ kiện đi kèm ({selectedAccessoriesList.length} món):
                      </div>
                      {selectedAccessoriesList.map((item) => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#334155', marginLeft: 6 }}>
                          <span>+ {item.name}:</span>
                          <strong>+{money(item.price)}</strong>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#1e40af', fontWeight: 700, borderTop: '1px dashed #bfdbfe', marginTop: 6, paddingTop: 4 }}>
                        <span>Tổng tiền phụ kiện:</span>
                        <span>+{money(accessoryTotal)}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12, marginBottom: 6 }}>
                      <span>Phụ kiện đi kèm:</span>
                      <span>Không chọn (0 đ)</span>
                    </div>
                  )}

                  {serviceTotal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#475569' }}>Dịch vụ bổ sung:</span>
                      <strong>+{money(serviceTotal)}</strong>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: 6 }}>
                      <span>Ưu đãi voucher ({couponCode}):</span>
                      <strong>-{money(discountAmount)}</strong>
                    </div>
                  )}

                  <div style={{ borderTop: '2px solid #cbd5e1', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                      TỔNG CỘNG ĐƠN ĐẶT XE:
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>
                      {money(rentalTotal)}
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        )}
        {step === 4 && <div style={{ textAlign: 'center', padding: 30 }}><div style={{ fontSize: 32, fontWeight: 900, color: '#0f9f75' }}>OK</div><h2>Đặt xe & đặt cọc thành công!</h2><p>Mã đơn hàng: <strong>{booking?.bookingCode}</strong></p><p>Hồ sơ CCCD & GPLX đã lưu · Hợp đồng đã ký · Cọc đã thanh toán</p><button className="btn btn-primary" onClick={onClose}>Xem đơn hàng của tôi</button></div>}
        </RentalPricingContext.Provider>
      </div>
    </div>
  </div>;
}

function Upload({ label, value, onChange }: { label: string; value?: string; onChange: (file?: File) => void }) { return <label style={{ display: 'inline-flex', flexDirection: 'column', width: '48%', marginTop: 16, color: '#475569' }}>{label}<input type="file" accept="image/*" onChange={e => onChange(e.target.files?.[0])} />{value && <img src={value} alt={label} style={{ marginTop: 8, width: '100%', height: 110, objectFit: 'cover', borderRadius: 10 }} />}</label>; }
function Summary({ bike, days, serviceTotal, total, deposit }: { bike: Bike; days: number; serviceTotal: number; total: number; deposit: number }) {
  const pricing = useContext(RentalPricingContext);
  return <div style={{ background: '#f8fafc', border: '1px solid #dbe3ef', borderRadius: 12, padding: 16, marginTop: 18, lineHeight: 1.8 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
      <button type="button" className={pricing.rentalType === 'daily' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => pricing.setRentalType('daily')}>Gói theo ngày<br /><small>{money(bike.pricePerDay)}/ngày</small></button>
      <button type="button" className={pricing.rentalType === 'monthly' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => pricing.setRentalType('monthly')}>Gói theo tháng<br /><small>{money(pricing.monthlyPrice)}/30 ngày · tiết kiệm 20%</small></button>
    </div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}><input className="form-input" value={pricing.couponCode} onChange={e => pricing.setCouponCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá (WELCOME10, MONTHLY20...)" /><span style={{ color: pricing.couponPercent ? '#0f9f75' : '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{pricing.couponPercent ? `Giảm ${pricing.couponPercent}%` : 'Mã ưu đãi'}</span></div>
    <div>Tiền thuê xe ({days} ngày): <strong style={{ float: 'right' }}>{money(bike.pricePerDay * days)}</strong></div><div>Dịch vụ & phụ kiện: <strong style={{ float: 'right' }}>{money(serviceTotal)}</strong></div><div style={{ margin: '8px 0', borderTop: '1px solid #cbd5e1' }} /* taste-skill-ignore */ />
    <div style={{ fontSize: 17, fontWeight: 800 }}>Tổng chi phí: <strong style={{ float: 'right', color: '#1463ff' }}>{money(total)}</strong></div><div>Tiền cọc: <strong style={{ float: 'right', color: '#1463ff' }}>{money(deposit)}</strong></div>
  </div>;
}
