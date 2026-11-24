'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

type Bike = { id: string; name: string; pricePerDay: number; image: string; priceFormatted: string };
type Props = { bike: Bike; onClose: () => void };

const steps = ['Lịch & Dịch vụ', 'Hồ sơ CCCD & GPLX', 'Ký hợp đồng', 'Thanh toán cọc', 'Hoàn tất'];
const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const RentalPricingContext = createContext<any>(null);
// Full contract template — filled dynamically in ContractDocument component below
const buildContractTerms = (params: {
  customerName?: string;
  licenseNumber?: string;
  licenseClass?: string;
  bikeName?: string;
  bikeEngine?: string;
  bikePlate?: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: string;
  depositAmount?: string;
  contractNumber?: string;
  signDate?: string;
}) => {
  const {
    customerName = '………………………………………………',
    licenseNumber = '………………………',
    licenseClass = '………',
    bikeName = '………………………………………………',
    bikeEngine = '………………………',
    bikePlate = '………………………………………………',
    startDate = '………/………/………',
    endDate = '………/………/………',
    totalAmount = '………………………………… VNĐ',
    depositAmount = '………………………………… VNĐ',
    contractNumber = '……… – ……./HĐTX',
    signDate = 'ngày …… tháng …… năm ………',
  } = params;

  return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HỢP ĐỒNG CHO THUÊ XE MÁY
Số: ${contractNumber}

─────────────────────────────────────────────
- Căn cứ Bộ Luật Dân sự 2015;
- Căn cứ Luật Thương mại 2005;
- Căn cứ vào nhu cầu và khả năng cung ứng của các bên dưới đây:

Hôm nay, ${signDate}, tại Đà Nẵng, chúng tôi gồm:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BÊN CHO THUÊ (sau đây gọi là Bên A):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cửa hàng: XTBike – Cho Thuê Xe Máy Tự Lái Đà Nẵng
Địa chỉ trụ sở: 128 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng
Đại diện: Chủ cửa hàng XTBike
Số điện thoại: 0905 123 456

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BÊN THUÊ (sau đây gọi là Bên B):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ông/Bà: ${customerName}
GPLX Hạng ${licenseClass} số: ${licenseNumber}

─────────────────────────────────────────────
Hai bên đã thỏa thuận và thống nhất ký kết Hợp đồng cho thuê xe máy với những điều khoản cụ thể như sau:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU 1. ĐẶC ĐIỂM VÀ THỎA THUẬN THUÊ XE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bằng hợp đồng này, Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê 01 (một) xe máy có đặc điểm sau đây:

  • Nhãn hiệu & Tên xe: ${bikeName}
  • Số máy / Động cơ:   ${bikeEngine}
  • Biển kiểm soát số:  ${bikePlate}

– Bên A cam đoan trước khi ký Hợp đồng này, xe máy nêu trên:
  • Không có tranh chấp về quyền sở hữu / sử dụng;
  • Không bị ràng buộc bởi bất kỳ Hợp đồng cho thuê xe máy nào đang có hiệu lực.

– Bên B cam đoan: Bên B được cấp Giấy phép lái xe Hạng ${licenseClass} số ${licenseNumber}, còn hiệu lực sử dụng.

ĐIỀU 2. THỜI HẠN THUÊ XE MÁY
Thời hạn thuê kể từ ngày ${startDate} đến hết ngày ${endDate}.

ĐIỀU 3. MỤC ĐÍCH THUÊ
Bên B sử dụng tài sản thuê nêu trên vào mục đích di chuyển, tham quan du lịch tại Đà Nẵng và các vùng lân cận.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU 4. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Tổng giá thuê tài sản: ${totalAmount}
   (Tiền cọc đảm bảo: ${depositAmount})

2. Phương thức thanh toán: Chuyển khoản ngân hàng hoặc tiền mặt.
   Bên B phải thanh toán đủ tiền thuê trước khi nhận xe.

3. Việc giao nhận số tiền nêu trên do hai bên tự thực hiện và
   chịu trách nhiệm trước pháp luật.

ĐIỀU 5. PHƯƠNG THỨC GIAO, TRẢ LẠI TÀI SẢN THUÊ
Hết thời hạn thuê nêu trên, Bên B phải giao trả xe máy cho Bên A
tại địa chỉ thỏa thuận hoặc vị trí giao xe ban đầu trong tình trạng
nguyên vẹn như khi nhận.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU 6. TRÁCH NHIỆM VÀ QUYỀN HẠN CỦA CÁC BÊN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Trách nhiệm, quyền hạn của Bên A:
  • Giao xe và toàn bộ giấy tờ liên quan ngay sau khi Hợp đồng
    có hiệu lực và Bên B đã hoàn tất thanh toán.
    Giấy tờ gồm: Giấy đăng ký xe, Giấy bảo hiểm xe.
  • Chịu trách nhiệm pháp lý về nguồn gốc và quyền sở hữu của xe.
  • Mua bảo hiểm xe theo quy định trong thời hạn hiệu lực Hợp đồng.
  • Có quyền nhận đủ tiền thuê tài sản theo phương thức đã thỏa thuận,
    nhận lại tài sản thuê khi hết hạn Hợp đồng.
  • Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi thường
    thiệt hại nếu Bên B vi phạm hợp đồng hoặc phá hoại tài sản.

2. Trách nhiệm, quyền hạn của Bên B:
  • Thanh toán tiền thuê xe cho Bên A đúng hạn.
  • Chịu toàn bộ chi phí bảo dưỡng xe theo định kỳ trong thời gian thuê.
  • Chịu toàn bộ chi phí xăng dầu khi sử dụng xe.
  • Nhận tài sản thuê theo đúng thỏa thuận.
  • Được sử dụng tài sản thuê đúng công dụng, mục đích đã ghi trong HĐ.
  • Không cho người khác thuê lại, không tự ý sửa chữa hoặc thay đổi
    kết cấu xe mà không có sự đồng ý bằng văn bản của Bên A.
  • Chịu trách nhiệm bồi thường toàn bộ thiệt hại do tai nạn, vi phạm
    giao thông, mất mát phụ tùng hoặc hư hỏng xe.
  • Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi thường
    thiệt hại nếu Bên A chậm giao tài sản hoặc tài sản không đúng
    theo thỏa thuận.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU 7. HIỆU LỰC HỢP ĐỒNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hợp đồng có giá trị kể từ ngày ${startDate} đến hết ngày ${endDate}.

Nếu một trong hai bên muốn chấm dứt Hợp đồng trước thời hạn thì phải
thông báo cho bên kia trước ít nhất 24 giờ bằng hình thức văn bản
hoặc tin nhắn điện tử.

ĐIỀU 8. ĐIỀU KHOẢN CHUNG
  • Trong quá trình thực hiện hợp đồng, nếu có đề nghị điều chỉnh
    thì phải thông báo cho nhau bằng văn bản để cùng bàn bạc giải quyết.
  • Hai bên cam kết thi hành đúng các điều khoản của hợp đồng,
    không bên nào tự ý đơn phương sửa đổi, đình chỉ hoặc hủy bỏ hợp
    đồng. Mọi vi phạm phải được xử lý theo pháp luật. Trường hợp có
    tranh chấp mà hai bên không tự giải quyết được, sẽ do Tòa án nhân
    dân TP. Đà Nẵng giải quyết.
  • Hợp đồng này có hiệu lực từ ngày ký và coi như được thanh lý sau
    khi hai bên thực hiện xong nghĩa vụ và không còn bất kỳ khiếu nại
    nào.

Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau,
Bên A giữ 01 (một) bản, Bên B giữ 01 (một) bản.

─────────────────────────────────────────────
Đà Nẵng, ${signDate}

       ĐẠI DIỆN BÊN A                    ĐẠI DIỆN BÊN B
   (ký và ghi rõ họ tên)              (ký và ghi rõ họ tên)

   XTBike – Cho Thuê Xe Máy             ${customerName}
─────────────────────────────────────────────`;
};
const ACCESSORY_OPTIONS = [
  { key: 'helmet', name: 'Mũ bảo hiểm 3/4 cao cấp', price: 30000 },
  { key: 'raincoat', name: 'Áo mưa bộ', price: 20000 },
  { key: 'phoneHolder', name: 'Giá đỡ điện thoại', price: 20000 },
  { key: 'luggageRack', name: 'Baga/thùng đựng hành lý', price: 50000 },
];

export default function RentalWizard({ bike, onClose: closeWizard }: Props) {
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
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo'>('vnpay');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signed, setSigned] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
  const depositQrUrl = `https://img.vietqr.io/image/MB-0905888999-compact2.png?amount=${deposit}&addInfo=${encodeURIComponent(`COC ${booking?.bookingCode || bike.name}`)}&accountName=XTBike`;

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
      const selectedAccessories = ACCESSORY_OPTIONS.filter(item => accessories[item.key]).map(({ name, price }) => ({ name, price }));
      const response = await api.post('/bookings', { vehicleId: bike.id, vehicleName: bike.name, startDate, endDate, pickupLocation, customerNote: note, accessories: selectedAccessories, extraServicesTotal: serviceTotal, rentalType, couponCode, paymentMethod });
      setBooking(response.data.data);
      setStep(1);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Không thể tạo đơn thuê xe.'); }
    finally { setLoading(false); }
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

  const signature = () => canvasRef.current?.toDataURL() || '';
  const signContract = async () => {
    if (!booking) return;
    if (!acceptedTerms) return toast.error('Vui lòng đọc và xác nhận toàn bộ điều khoản hợp đồng.');
    const value = signature();
    if (!value) return toast.error('Vui lòng ký tên trên khung ký.');
    setLoading(true);
    try {
      let currentContract = contract;
      if (!currentContract) {
        const today = new Date();
        const signDate = `ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
        const contractText = buildContractTerms({
          customerName: user?.fullName || cccd,
          licenseNumber: license,
          licenseClass,
          bikeName: bike.name,
          bikeEngine: (bike as any).engine || '—',
          bikePlate: (bike as any).licensePlate || '—',
          startDate,
          endDate,
          totalAmount: money(rentalTotal),
          depositAmount: money(deposit),
          contractNumber: booking?.bookingCode || '——',
          signDate,
        });
        const response = await api.post('/contracts', { bookingId: booking._id, termsAndConditions: contractText });
        currentContract = response.data.data;
        setContract(currentContract);
      }
      const response = await api.put(`/contracts/${currentContract._id}/sign`, { customerSignature: value });
      setContract(response.data.data); setSigned(true); setStep(3);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Không thể ký hợp đồng.'); }
    finally { setLoading(false); }
  };

  const payDeposit = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      await api.post('/payments', { bookingId: booking._id, type: 'deposit', amount: deposit, method: paymentMethod, note: `Cọc đơn ${booking.bookingCode}` });
      setStep(4); toast.success('Thanh toán cọc thành công!');
    } catch (error: any) { toast.error(error.response?.data?.message || 'Thanh toán chưa thành công.'); }
    finally { setLoading(false); }
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
            <span style={{ color: '#64748b' }}>Tiền cọc đã thanh toán:</span><strong style={{ textAlign: 'right', color: '#059669' }}>{money(deposit)}</strong>
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
        <style>{`.rental-wizard-body > div:nth-child(1), .rental-wizard-body > div:nth-child(2) { display: none; } .rental-wizard-body.step-3 > div:nth-of-type(1) { display: block !important; } .rental-wizard-body.step-3 > div:nth-of-type(3) > div:first-child { display: none; }`}</style>
        <RentalPricingContext.Provider value={{ rentalType, setRentalType, monthlyPrice, couponCode, setCouponCode, couponPercent }}>
        {step === 3 && <div style={{ textAlign: 'center', padding: 16, marginBottom: 14, border: '1px solid #bfdbfe', borderRadius: 14, background: '#eff6ff' }}><div style={{ fontWeight: 800, color: '#1d4ed8', marginBottom: 10 }}>Mã QR thanh toán tiền cọc</div><img src={depositQrUrl} alt="Mã QR thanh toán tiền cọc" style={{ width: 250, height: 250, objectFit: 'contain', background: '#fff', borderRadius: 10 }} /><div style={{ color: '#1463ff', fontSize: 24, fontWeight: 800, marginTop: 8 }}>{money(deposit)}</div><div style={{ color: '#64748b', fontSize: 12 }}>Nội dung: {booking?.bookingCode} · MBBank 0905888999</div></div>}
        {step === 0 && <><div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 14, padding: 16, marginBottom: 20 }}>Xe <strong>{bike.name}</strong> yêu cầu khách thuê có CCCD và GPLX phù hợp.</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><label>Ngày nhận xe<input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>Ngày trả xe<input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label></div><label style={{ display: 'block', marginTop: 16 }}>Địa điểm nhận xe<select className="form-input" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)}><option>Sân bay Đà Nẵng</option><option>128 Bạch Đằng, Hải Châu</option><option>Giao tận khách sạn Hải Châu</option></select></label><div style={{ marginTop: 20 }}><strong>Dịch vụ & trang bị đi kèm</strong>{[['insurance', 'Gói bảo hiểm thân vỏ & phụ tùng xe máy', 100000], ['delivery', 'Giao nhận xe tận nơi', 100000], ['gear', 'Bộ giáp bảo hộ phượt cao cấp', 80000]].map(([key, label, price]) => <label key={String(key)} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, border: '1px solid #dbe3ef', borderRadius: 12, marginTop: 10 }}><span><input type="checkbox" checked={Boolean(services[key as keyof typeof services])} onChange={e => setServices({ ...services, [key]: e.target.checked })} /> {label}</span><strong>+{money(Number(price))}</strong></label>)}</div><div style={{ marginTop: 20 }}><strong>Phụ kiện thuê thêm</strong>{ACCESSORY_OPTIONS.map(item => <label key={item.key} style={{ display: 'flex', justifyContent: 'space-between', padding: 14, border: '1px solid #dbe3ef', borderRadius: 12, marginTop: 10 }}><span><input type="checkbox" checked={accessories[item.key]} onChange={e => setAccessories({ ...accessories, [item.key]: e.target.checked })} /> {item.name}</span><strong>+{money(item.price)}</strong></label>)}</div><textarea className="form-input" style={{ marginTop: 18 }} placeholder="Ghi chú cho bộ phận kỹ thuật & giao xe" value={note} onChange={e => setNote(e.target.value)} /><Summary bike={bike} days={days} serviceTotal={serviceTotal + accessoryTotal} total={rentalTotal} deposit={deposit} /><button className="btn btn-primary" style={{ float: 'right', marginTop: 18 }} onClick={createBooking} disabled={loading}>{loading ? 'Đang tạo đơn...' : 'Tiếp tục cung cấp CCCD & Bằng lái →'}</button></>}
        {step === 1 && <><h3>Cung cấp hình ảnh Căn Cước Công Dân (CCCD) & Bằng Lái Xe (GPLX)</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}><label>Số CCCD<input className="form-input" value={cccd} onChange={e => setCccd(e.target.value)} /></label><label>Số GPLX<input className="form-input" value={license} onChange={e => setLicense(e.target.value)} /></label></div><label style={{ display: 'block', marginTop: 14 }}>Hạng bằng lái<select className="form-input" value={licenseClass} onChange={e => setLicenseClass(e.target.value)}><option>A2</option><option>A1</option></select></label><Upload label="Mặt trước CCCD" value={files.cccdFront} onChange={file => readFile('cccdFront', file)} /><Upload label="Mặt sau CCCD" value={files.cccdBack} onChange={file => readFile('cccdBack', file)} /><Upload label="Mặt trước GPLX" value={files.licenseFront} onChange={file => readFile('licenseFront', file)} /><Upload label="Mặt sau GPLX" value={files.licenseBack} onChange={file => readFile('licenseBack', file)} /><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}><button className="btn btn-secondary" onClick={() => setStep(0)}>← Quay lại</button><button className="btn btn-primary" onClick={saveDocuments} disabled={loading}>{loading ? 'Đang lưu...' : 'Xác nhận hồ sơ & tiếp tục ký hợp đồng'}</button></div></>}
        {step === 2 && (
          <>
            {/* ── Contract Header ── */}
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', letterSpacing: 1 }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Độc lập – Tự do – Hạnh phúc</div>
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '0 auto 12px', width: 200 }} />
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: 0.5 }}>HỢP ĐỒNG CHO THUÊ XE MÁY</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Số: {booking?.bookingCode || '—'}</div>
            </div>

            {/* ── Contract Scroll Body ── */}
            <div style={{
              maxHeight: 400, overflowY: 'auto',
              border: '1px solid #cbd5e1', borderRadius: 12,
              padding: '20px 24px', background: '#fafafa',
              fontSize: 13, color: '#334155', lineHeight: 1.75,
              fontFamily: 'Georgia, serif'
            }}>
              {/* Preamble */}
              <p style={{ marginTop: 0, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                – Căn cứ Bộ Luật Dân sự 2015; Luật Thương mại 2005;<br />
                – Căn cứ nhu cầu và khả năng cung ứng của các bên.
              </p>

              {/* Party A */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                <div style={{ fontWeight: 800, color: '#15803d', fontSize: 12, marginBottom: 4 }}>BÊN CHO THUÊ (Bên A)</div>
                <div><strong>Cửa hàng:</strong> XTBike – Cho Thuê Xe Máy Tự Lái Đà Nẵng</div>
                <div><strong>Địa chỉ:</strong> 128 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng</div>
                <div><strong>Hotline:</strong> 0905 123 456</div>
              </div>

              {/* Party B */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 12, marginBottom: 4 }}>BÊN THUÊ (Bên B)</div>
                <div><strong>Họ và tên:</strong> {user?.fullName || '—'}</div>
                <div><strong>GPLX Hạng {licenseClass} số:</strong> {license || '—'}</div>
              </div>

              {/* Article 1 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>ĐIỀU 1. ĐẶC ĐIỂM VÀ THỎA THUẬN THUÊ XE</div>
              <p style={{ margin: '0 0 6px 0' }}>Bên A đồng ý cho Bên B thuê 01 (một) xe máy có đặc điểm:</p>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px 12px', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>Nhãn hiệu & Tên xe:</span> <strong>{bike.name}</strong>
                  <span style={{ color: '#64748b' }}>Biển kiểm soát:</span> <strong>{(bike as any).licensePlate || '(theo đăng ký)'}</strong>
                  <span style={{ color: '#64748b' }}>Động cơ:</span> <strong>{(bike as any).engine || (bike as any).priceFormatted + ' – xe máy'}</strong>
                </div>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 12 }}>
                Bên A cam đoan xe không có tranh chấp quyền sở hữu và không bị ràng buộc bởi hợp đồng thuê nào đang có hiệu lực.<br />
                Bên B cam đoan có GPLX Hạng <strong>{licenseClass}</strong> hợp lệ, còn hiệu lực sử dụng.
              </p>

              {/* Article 2 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>ĐIỀU 2. THỜI HẠN THUÊ XE MÁY</div>
              <p style={{ margin: '0 0 12px 0' }}>Từ ngày <strong>{startDate}</strong> đến hết ngày <strong>{endDate}</strong> ({days} ngày).</p>

              {/* Article 3 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>ĐIỀU 3. MỤC ĐÍCH THUÊ</div>
              <p style={{ margin: '0 0 12px 0' }}>Di chuyển, tham quan du lịch tại Đà Nẵng và các vùng lân cận.</p>

              {/* Article 4 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>ĐIỀU 4. GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Tổng tiền thuê:</span>
                  <strong style={{ color: '#0f172a' }}>{money(rentalTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Tiền cọc đảm bảo:</span>
                  <strong style={{ color: '#2563eb' }}>{money(deposit)}</strong>
                </div>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 12 }}>Thanh toán bằng chuyển khoản hoặc tiền mặt trước khi nhận xe. Bên A hoàn trả cọc còn lại sau khi đối soát xe nguyên vẹn.</p>

              {/* Article 5 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>ĐIỀU 5. PHƯƠNG THỨC GIAO, TRẢ LẠI TÀI SẢN</div>
              <p style={{ margin: '0 0 12px 0', fontSize: 12 }}>Hết thời hạn thuê, Bên B phải giao trả xe nguyên vẹn tại địa điểm giao xe ban đầu.</p>

              {/* Article 6 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>ĐIỀU 6. TRÁCH NHIỆM VÀ QUYỀN HẠN CÁC BÊN</div>
              <div style={{ fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}><strong>Bên A có trách nhiệm:</strong> Giao xe kèm giấy đăng ký, bảo hiểm; chịu trách nhiệm pháp lý về nguồn gốc xe; có quyền đơn phương đình chỉ nếu Bên B vi phạm.</div>
                <div><strong>Bên B có trách nhiệm:</strong> Thanh toán đúng hạn; chịu chi phí bảo dưỡng định kỳ và xăng dầu; không cho thuê lại; bồi thường thiệt hại do tai nạn, vi phạm giao thông, hư hỏng xe.</div>
              </div>

              {/* Article 7 */}
              <div style={{ fontWeight: 800, color: '#0f172a', margin: '12px 0 4px' }}>ĐIỀU 7. HIỆU LỰC HỢP ĐỒNG</div>
              <p style={{ margin: '0 0 12px 0', fontSize: 12 }}>Hợp đồng có hiệu lực từ ngày <strong>{startDate}</strong> đến hết ngày <strong>{endDate}</strong>. Bên nào muốn chấm dứt sớm phải thông báo trước ít nhất 24 giờ.</p>

              {/* Article 8 */}
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>ĐIỀU 8. ĐIỀU KHOẢN CHUNG</div>
              <p style={{ margin: '0 0 16px 0', fontSize: 12 }}>Hai bên cam kết thi hành đúng các điều khoản. Tranh chấp (nếu có) sẽ được giải quyết tại Tòa án nhân dân TP. Đà Nẵng. Hợp đồng lập thành 02 bản có giá trị pháp lý như nhau.</p>

              {/* Signature block preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px dashed #cbd5e1', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>ĐẠI DIỆN BÊN A</div>
                  <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 28 }}>(ký và ghi rõ họ tên)</div>
                  <div style={{ fontWeight: 600 }}>XTBike – Đà Nẵng</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>ĐẠI DIỆN BÊN B</div>
                  <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: 28 }}>(ký điện tử bên dưới)</div>
                  <div style={{ fontWeight: 600 }}>{user?.fullName || '—'}</div>
                </div>
              </div>
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
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                  onClick={() => { canvasRef.current?.getContext('2d')?.clearRect(0, 0, 760, 160); setSigned(false); }}
                >
                  Xóa chữ ký
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!signed || !acceptedTerms || loading}
                  onClick={signContract}
                  style={{ minWidth: 220 }}
                >
                  {loading ? 'Đang ký hợp đồng...' : 'Ký Hợp Đồng & Tiếp Tục →'}
                </button>
              </div>
            </div>
          </>
        )}
        {step === 3 && <><h3>Thanh toán tiền cọc</h3><div style={{ display: 'flex', gap: 12 }}><button className={paymentMethod === 'vnpay' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setPaymentMethod('vnpay')}>VNPay QR</button><button className={paymentMethod === 'momo' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setPaymentMethod('momo')}>Ví MoMo</button></div><div style={{ textAlign: 'center', padding: 30, marginTop: 18, border: '1px solid #dbe3ef', borderRadius: 14 }}><div style={{ fontSize: 54 }}>▦</div><p>Số tiền cọc cần thanh toán:</p><strong style={{ color: '#1463ff', fontSize: 28 }}>{money(deposit)}</strong><p style={{ color: '#64748b' }}>Nội dung CK: {booking?.bookingCode}</p></div><button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={payDeposit} disabled={loading}>{loading ? 'Đang xác nhận...' : `Mô phỏng thanh toán cọc (${paymentMethod.toUpperCase()})`}</button></>}
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
