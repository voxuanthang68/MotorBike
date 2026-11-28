'use client';

import React from 'react';

export interface StandardContractData {
  contractNumber?: string;
  signDay?: string;
  signMonth?: string;
  signYear?: string;
  location?: string;
  signPlace?: string;
  partyA?: {
    fullName?: string;
    birthYear?: string;
    cccd?: string;
    cccdIssueDate?: string;
    cccdIssuePlace?: string;
    permanentAddress?: string;
    tempAddress?: string;
    phone?: string;
  };
  organization?: {
    companyName?: string;
    regNumber?: string;
    issuedBy?: string;
    firstRegDate?: string;
    firstChangeDate?: string;
    headAddress?: string;
    repName?: string;
    repTitle?: string;
    repCccd?: string;
    repCccdPlace?: string;
    repCccdDate?: string;
  };
  partyB?: {
    fullName?: string;
    birthYear?: string;
    cccd?: string;
    cccdIssueDate?: string;
    cccdIssuePlace?: string;
    permanentAddress?: string;
    tempAddress?: string;
    phone?: string;
    licenseClass?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
  };
  vehicle?: {
    count?: string;
    brand?: string;
    type?: string;
    color?: string;
    engineNumber?: string;
    chassisNumber?: string;
    licensePlate?: string;
  };
  rentalDuration?: string;
  purpose?: string;
  totalAmountNumber?: number;
  totalAmountText?: string;
  totalAmountWords?: string;
  depositAmountNumber?: number;
  paidAmountNumber?: number;
  paymentMethodText?: string;
  paymentDeadlineHour?: string;
  paymentDeadlineDate?: string;
  invoiceNote?: string;
  startDate?: string;
  endDate?: string;
  actualReturnDate?: string;
  noticePeriod?: string;
  courtName?: string;
  staffSignature?: string | null;
  staffSignedAt?: string | null;
  customerSignature?: string | null;
  customerSignedAt?: string | null;
}

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const UNITS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readThreeDigits(num: number, showZeroHundreds: boolean): string {
  const hundreds = Math.floor(num / 100);
  const tens = Math.floor((num % 100) / 10);
  const ones = num % 10;
  const parts: string[] = [];

  if (hundreds > 0 || showZeroHundreds) {
    parts.push(`${DIGITS[hundreds]} trăm`);
  }

  if (tens > 1) {
    parts.push(`${DIGITS[tens]} mươi`);
    if (ones === 1) parts.push('mốt');
    else if (ones === 4) parts.push('tư');
    else if (ones === 5) parts.push('lăm');
    else if (ones > 0) parts.push(DIGITS[ones]);
  } else if (tens === 1) {
    parts.push('mười');
    if (ones === 5) parts.push('lăm');
    else if (ones > 0) parts.push(DIGITS[ones]);
  } else if (ones > 0) {
    if (hundreds > 0 || showZeroHundreds) parts.push('linh');
    parts.push(DIGITS[ones]);
  }

  return parts.join(' ');
}

export function numberToVietnameseWords(amount: number): string {
  const rounded = Math.round(Number(amount) || 0);
  if (rounded <= 0) return 'Không đồng';

  const groups: number[] = [];
  let n = rounded;
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const showZeroHundreds = i < groups.length - 1;
    const text = readThreeDigits(g, showZeroHundreds);
    if (text) {
      parts.push(UNITS[i] ? `${text} ${UNITS[i]}` : text);
    }
  }

  const joined = `${parts.join(' ').trim()} đồng`;
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

const formatViDate = (val?: string | Date | null): string => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('vi-VN');
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  scooter: 'Xe tay ga',
  manual: 'Xe số',
  'semi-automatic': 'Xe số bán tự động',
  clutch: 'Xe côn tay',
  sport: 'Xe mô tô thể thao',
  electric: 'Xe máy điện',
};

const PAYMENT_METHOD_TEXT: Record<string, string> = {
  qr: 'Chuyển khoản VietQR',
  bank_transfer: 'Chuyển khoản ngân hàng / VietQR',
  cash: 'Tiền mặt',
  momo: 'Ví điện tử MoMo',
  vnpay: 'Cổng thanh toán VNPAY',
  zalo_pay: 'Ví ZaloPay',
};

export interface ContractPartyLike {
  fullName?: string | null;
  birthYear?: string | number | null;
  cccd?: string | null;
  cccdIssueDate?: string | null;
  cccdIssuePlace?: string | null;
  address?: string | null;
  tempAddress?: string | null;
  phone?: string | null;
  drivingLicense?: string | null;
  drivingLicenseClass?: string | null;
  licenseExpiryDate?: string | null;
}

export interface ContractVehicleLike {
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  type?: string | null;
  color?: string | null;
  engineNumber?: string | null;
  engineCC?: number | null;
  chassisNumber?: string | null;
  licensePlate?: string | null;
}

export interface ContractBookingLike {
  customerInfo?: ContractPartyLike | null;
  customer?: ContractPartyLike | string | null;
  vehicleInfo?: ContractVehicleLike | null;
  vehicle?: ContractVehicleLike | string | null;
  createdAt?: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  totalDays?: number | null;
  finalPrice?: number | null;
  totalPrice?: number | null;
  deposit?: number | null;
  paymentMethod?: string | null;
  contractCode?: string | null;
  bookingCode?: string | null;
}

export interface ContractRecordLike {
  booking?: ContractBookingLike | string | null;
  customerInfo?: ContractPartyLike | null;
  customer?: ContractPartyLike | string | null;
  vehicleInfo?: ContractVehicleLike | null;
  vehicle?: ContractVehicleLike | string | null;
  createdAt?: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  actualReturnDate?: string | Date | null;
  rentalDays?: number | null;
  pricePerDay?: number | null;
  totalPayable?: number | null;
  totalRentalFee?: number | null;
  depositAmount?: number | null;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  contractCode?: string | null;
  contractNumber?: string | null;
  staffSignature?: string | null;
  staffSignedAt?: string | Date | null;
  customerSignature?: string | null;
  customerSignedAt?: string | Date | null;
}

const toIsoOrString = (val?: string | Date | null): string | null => {
  if (!val) return null;
  return val instanceof Date ? val.toISOString() : String(val);
};

export function mapContractToStandardData(
  contract?: ContractRecordLike | null,
  booking?: ContractBookingLike | null,
  fallbackUser?: ContractPartyLike | null
): StandardContractData {
  const c: ContractRecordLike = contract || {};
  const bookingFromContract = c.booking && typeof c.booking === 'object' ? c.booking : null;
  const b: ContractBookingLike = booking || bookingFromContract || {};
  const custInfo: ContractPartyLike = c.customerInfo || b.customerInfo || {};
  const custFromContract = c.customer && typeof c.customer === 'object' ? c.customer : null;
  const custFromBooking = b.customer && typeof b.customer === 'object' ? b.customer : null;
  const custDoc: ContractPartyLike = custFromContract || custFromBooking || fallbackUser || {};
  const vehInfo: ContractVehicleLike = c.vehicleInfo || b.vehicleInfo || {};
  const vehFromContract = c.vehicle && typeof c.vehicle === 'object' ? c.vehicle : null;
  const vehFromBooking = b.vehicle && typeof b.vehicle === 'object' ? b.vehicle : null;
  const vehDoc: ContractVehicleLike = vehFromContract || vehFromBooking || {};

  const signRef = c.createdAt || b.createdAt || c.startDate || b.startDate || new Date();
  const signDateObj = new Date(signRef);
  const validSignDate = Number.isNaN(signDateObj.getTime()) ? new Date() : signDateObj;

  const startRaw = c.startDate || b.startDate;
  const endRaw = c.endDate || b.endDate;
  const days = Number(c.rentalDays || b.totalDays || 1);
  const totalAmountNumber = Number(c.totalPayable ?? c.totalRentalFee ?? b.finalPrice ?? b.totalPrice ?? 0);
  const depositAmountNumber = Number(c.depositAmount ?? b.deposit ?? 0);
  const paidAmountNumber = Number(c.paidAmount ?? 0);

  const methodKey = c.paymentMethod || b.paymentMethod || 'bank_transfer';
  const paymentMethodText = PAYMENT_METHOD_TEXT[methodKey] || methodKey;

  const contractCode = c.contractCode || c.contractNumber || b.contractCode || b.bookingCode || '';
  const contractNumber = contractCode ? `${contractCode} – ${validSignDate.getFullYear()}/HĐTX` : undefined;

  const vehName = vehInfo.name || vehDoc.name || '';
  const vehBrand = vehInfo.brand || vehDoc.brand || (vehName ? vehName.split(' ')[0] : '');
  const rawType = vehInfo.type || vehDoc.type || '';
  const translatedType = VEHICLE_TYPE_LABELS[rawType] || rawType;
  const vehType = translatedType ? (vehName ? `${vehName} (${translatedType})` : translatedType) : (vehInfo.model || vehDoc.model || vehName || '');
  const engineStr = vehInfo.engineNumber || (vehDoc.engineCC ? `${vehDoc.engineCC}cc` : '');

  return {
    contractNumber,
    signDay: String(validSignDate.getDate()).padStart(2, '0'),
    signMonth: String(validSignDate.getMonth() + 1).padStart(2, '0'),
    signYear: String(validSignDate.getFullYear()),
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
      fullName: custInfo.fullName || custDoc.fullName || '',
      birthYear: custInfo.birthYear ? String(custInfo.birthYear) : '',
      cccd: custInfo.cccd || custDoc.cccd || '',
      cccdIssueDate: custInfo.cccdIssueDate || '',
      cccdIssuePlace: custInfo.cccdIssuePlace || '',
      permanentAddress: custInfo.address || custDoc.address || '',
      tempAddress: custInfo.tempAddress || '',
      phone: custInfo.phone || custDoc.phone || '',
      licenseClass: custInfo.drivingLicenseClass || custDoc.drivingLicenseClass || 'A1/A2',
      licenseNumber: custInfo.drivingLicense || custDoc.drivingLicense || '',
      licenseExpiry: custInfo.licenseExpiryDate || '',
    },
    vehicle: {
      count: '01',
      brand: vehBrand,
      type: vehType,
      color: vehInfo.color || vehDoc.color || '',
      engineNumber: engineStr,
      chassisNumber: vehInfo.chassisNumber || '',
      licensePlate: vehInfo.licensePlate || vehDoc.licensePlate || '',
    },
    rentalDuration: `${String(days).padStart(2, '0')} ngày`,
    purpose: 'Di chuyển cá nhân, tham quan du lịch tại Đà Nẵng và các vùng lân cận',
    totalAmountNumber,
    totalAmountText: totalAmountNumber > 0 ? totalAmountNumber.toLocaleString('vi-VN') : undefined,
    totalAmountWords: totalAmountNumber > 0 ? numberToVietnameseWords(totalAmountNumber) : undefined,
    depositAmountNumber,
    paidAmountNumber,
    paymentMethodText,
    paymentDeadlineHour: '17:00',
    paymentDeadlineDate: formatViDate(startRaw) || formatViDate(validSignDate),
    invoiceNote: 'Xuất hóa đơn điện tử / biên nhận thanh toán theo yêu cầu của Bên B',
    startDate: formatViDate(startRaw),
    endDate: formatViDate(endRaw),
    actualReturnDate: formatViDate(c.actualReturnDate),
    noticePeriod: '01 ngày',
    courtName: 'nhân dân TP. Đà Nẵng',
    staffSignature: c.staffSignature || null,
    staffSignedAt: toIsoOrString(c.staffSignedAt),
    customerSignature: c.customerSignature || null,
    customerSignedAt: toIsoOrString(c.customerSignedAt),
  };
}

const val = (v: string | undefined, dots: string) => (v && v.trim() ? v.trim() : dots);

export function buildStandardContractTerms(data: StandardContractData = {}): string {
  const num = val(data.contractNumber, '…… – ……./HĐTX');
  const d = val(data.signDay, '….');
  const m = val(data.signMonth, '….');
  const y = val(data.signYear, '……');
  const loc = val(data.location, '……………………………………….');
  const pA = data.partyA || {};
  const org = data.organization || {};
  const pB = data.partyB || {};
  const veh = data.vehicle || {};

  const amountStr = data.totalAmountText || (data.totalAmountNumber ? data.totalAmountNumber.toLocaleString('vi-VN') : '…………');
  const wordsStr = data.totalAmountWords || (data.totalAmountNumber ? numberToVietnameseWords(data.totalAmountNumber) : '…………………………….');

  return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc

HỢP ĐỒNG CHO THUÊ XE MÁY
Số: ${num}

- Căn cứ Bộ Luật Dân sự 2015;
- Căn cứ luật thương mại 2005;
- Căn cứ vào nhu cầu và khả năng cung ứng của các bên dưới đây:

Hôm nay, ngày ${d} tháng ${m} năm ${y}, tại ${loc}, chúng tôi gồm:

BÊN CHO THUÊ (sau đây gọi là Bên A):
Ông/bà: ${val(pA.fullName, '………………………………………')} Sinh năm: ${val(pA.birthYear, '…………………')}
CCCD/Hộ chiếu số: ${val(pA.cccd, '………………………')} Cấp ngày ${val(pA.cccdIssueDate, '………………')} Nơi cấp ${val(pA.cccdIssuePlace, '……………')}
Địa chỉ thường trú: ${val(pA.permanentAddress, '…………………………………………………………………………')}
Địa chỉ tạm trú (nếu có): ${val(pA.tempAddress, '……………………………………………………………')}
Số điện thoại: ${val(pA.phone, '…………………………………………………………………………')}

(Trường hợp bên thuê là tổ chức thì ghi:
CÔNG TY ${val(org.companyName, '………………………………………………………………………………………')}
GCNĐKDN số: ${val(org.regNumber, '……………')}, do Sở Kế hoạch và Đầu tư ${val(org.issuedBy, '………..')} cấp, đăng ký lần đầu ngày ${val(org.firstRegDate, '…………….')} đăng ký thay đổi lần thứ 1 ngày ${val(org.firstChangeDate, '…………………')}
Địa chỉ trụ sở chính: ${val(org.headAddress, '………………………………………………………………………')}
Đại diện bởi ông/bà: ${val(org.repName, '…………………………')} Chức vụ: ${val(org.repTitle, '…………………')}
CCCD/Hộ chiếu số: ${val(org.repCccd, '…………………………')} do ${val(org.repCccdPlace, '…………………')} cấp ngày ${val(org.repCccdDate, '……………')})

BÊN THUÊ (Sau đây gọi tắt là Bên B):
Ông/bà: ${val(pB.fullName, '………………………………………')} Sinh năm: ${val(pB.birthYear, '…………………')}
CCCD/Hộ chiếu số: ${val(pB.cccd, '………………………')} Cấp ngày ${val(pB.cccdIssueDate, '………………')} Nơi cấp ${val(pB.cccdIssuePlace, '……………')}
Địa chỉ thường trú: ${val(pB.permanentAddress, '…………………………………………………………………………')}
Địa chỉ tạm trú (nếu có): ${val(pB.tempAddress, '……………………………………………………………')}
Số điện thoại: ${val(pB.phone, '…………………………………………………………………………')}

Hai bên đã thỏa thuận và thống nhất ký kết Hợp đồng cho thuê xe máy với những điều khoản cụ thể như sau:

Điều 1. Đặc điểm và thỏa thuận thuê xe
Bằng hợp đồng này, Bên A đồng ý cho Bên B thuê và bên B đồng ý thuê ${val(veh.count, '….')} xe máy có đặc điểm sau đây:
- Nhãn hiệu: ${val(veh.brand, '………………………………………………')}
- Loại xe: ${val(veh.type, '…………………')} Màu Sơn: ${val(veh.color, '…………………')}
- Số máy: ${val(veh.engineNumber, '…………………')} Số khung: ${val(veh.chassisNumber, '…………………')}
- Biển kiểm soát số: ${val(veh.licensePlate, '………………………………………………')}

– Bên A cam đoan trước khi ký bản Hợp đồng này, xe máy nêu trên:
  - Không có tranh chấp về quyền sở hữu/sử dụng;
  - Không bị ràng buộc bởi bất kỳ Hợp đồng cho thuê xe máy nào đang có hiệu lực.

– Bên B cam đoan: Bên B được cấp giấy phép lái xe hạng ${val(pB.licenseClass, '…..')} số ${val(pB.licenseNumber, '…………………')} có giá trị đến ngày ${val(pB.licenseExpiry, '…………………')} .

Điều 2. Thời hạn thuê xe máy
Thời hạn thuê là ${val(data.rentalDuration, '…… tháng/ngày')} kể từ ngày Hợp đồng này được ký kết

Điều 3. Mục đích thuê
Bên B sử dụng tài sản thuê nêu trên vào mục đích ${val(data.purpose, '……………………………………………')}

Điều 4: Giá thuê và phương thức thanh toán
1. Giá thuê tài sản nêu trên là: ${amountStr} VND (Bằng chữ: ${wordsStr}) trả bằng tiền Việt Nam hiện hành.
2. Phương thức thanh toán: Thanh toán bằng ${val(data.paymentMethodText, '…………….')} và Bên B phải thanh toán cho Bên A số tiền thuê xe nêu trên vào trước ${val(data.paymentDeadlineHour, '……')} giờ, ngày ${val(data.paymentDeadlineDate, '…………………')}
3. Việc giao và nhận số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.

Điều 5: Phương thức giao, trả lại tài sản thuê
Hết thời hạn thuê nêu trên, Bên B phải giao trả chiếc xe máy trên cho Bên A.

Điều 6: Trách nhiệm và quyền hạn của các bên
1. Trách nhiệm, quyền hạn của bên A:
- Giao xe và toàn bộ giấy tờ liên quan đến xe ngay sau khi Hợp đồng có hiệu lực và Bên B đã thanh toán tiền thuê xe 01 tháng đầu tiên. Giấy tờ liên quan đến xe gồm: Giấy đăng ký xe, giấy bảo hiểm xe.
- Chịu trách nhiệm pháp lý về nguồn gốc và quyền sở hữu của xe.
- Mua bảo hiểm xe cho các lần kế tiếp trong thời hạn hiệu lực của Hợp đồng.
- Xuất hóa đơn thuê xe: ${val(data.invoiceNote, '……………………………………………………')}
- Bên A có quyền được nhận đủ tiền thuê tài sản theo phương thức đã thỏa thuận, nhận lại tài sản thuê khi hết hạn Hợp đồng.
- Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi thường thiệt hại nếu Bên B có hành vi vi phạm hợp đồng hoặc phá hoại tài sản.

2. Trách nhiệm, quyền hạn của bên B:
- Thanh toán tiền thuê xe cho Bên A đúng hạn.
- Chịu toàn bộ chi phí bảo dưỡng xe theo định kỳ.
- Chịu toàn bộ chi phí xăng dầu khi sử dụng xe.
- Nhận tài sản thuê theo đúng thỏa thuận.
- Được sử dụng tài sản thuê theo đúng công dụng, mục đích của tài sản.
- Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi thường thiệt hại nếu bên A chậm giao tài sản, tài sản không đúng theo thỏa thuận gây thiệt hại cho Bên B.

Điều 7: Hiệu lực hợp đồng
Hợp đồng có giá trị kể từ ngày ${val(data.startDate, '………..')} đến hết ngày ${val(data.endDate, '……………………………')}
Nếu một trong hai bên, bên nào muốn chấm dứt Hợp đồng trước thời hạn thì phải thông báo cho Bên kia trước ít nhất ${val(data.noticePeriod, '…… tháng/ngày')}.

Điều 8: Điều khoản chung
- Trong quá trình thực hiện hợp đồng, nếu có đề nghị điều chỉnh thì phải thông báo cho nhau bằng văn bản để cùng bàn bạc giải quyết.
- Hai bên cam kết thi hành đúng các điều khoản của hợp đồng, không bên nào tự ý đơn phương sửa đổi, đình chỉ hoặc hủy bỏ hợp đồng. Mọi sự vi phạm được xử lý theo pháp luật. Trường hợp có tranh chấp mà hai bên không tự giải quyết được, sẽ do Tòa Án ${val(data.courtName, '…………….')} giải quyết.
- Hợp đồng này có hiệu lực từ ngày ký và coi như được thanh lý sau khi hai bên thực hiện xong nghĩa vụ của mình và không còn bất kỳ khiếu nại nào.

Hợp đồng được lập thành 04 (bốn) bản có giá trị pháp lý như nhau, Bên A giữ 02 (hai) bản. Bên B giữ 02 (hai) bản.

${val(data.signPlace, '………')}, ngày ${d} tháng ${m} năm ${y}

ĐẠI DIỆN BÊN A                         ĐẠI DIỆN BÊN B
(ký và ghi rõ họ tên)                   (ký và ghi rõ họ tên)`;
}

interface StandardRentalContractDocumentProps {
  mode?: 'template' | 'populated';
  data?: StandardContractData;
  staffSignatureSlot?: React.ReactNode;
  customerSignatureSlot?: React.ReactNode;
  compact?: boolean;
}

export default function StandardRentalContractDocument({
  mode = 'populated',
  data = {},
  staffSignatureSlot,
  customerSignatureSlot,
  compact = false,
}: StandardRentalContractDocumentProps) {
  const isTemplate = mode === 'template';
  const showVal = (v: string | undefined, dots: string) =>
    !isTemplate && v && v.trim() ? <strong>{v.trim()}</strong> : <span>{dots}</span>;

  const pA = isTemplate ? {} : (data.partyA || {});
  const org = isTemplate ? {} : (data.organization || {});
  const pB = isTemplate ? {} : (data.partyB || {});
  const veh = isTemplate ? {} : (data.vehicle || {});

  const totalText = !isTemplate && (data.totalAmountText || data.totalAmountNumber)
    ? (data.totalAmountText || Number(data.totalAmountNumber).toLocaleString('vi-VN'))
    : '';
  const totalWords = !isTemplate && (data.totalAmountWords || data.totalAmountNumber)
    ? (data.totalAmountWords || numberToVietnameseWords(Number(data.totalAmountNumber)))
    : '';

  return (
    <div
      style={{
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: '"Times New Roman", Georgia, serif',
        fontSize: compact ? '13px' : '14px',
        lineHeight: compact ? 1.72 : 1.85,
        padding: compact ? '22px 26px' : '36px 44px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      }}
    >
      {/* National Motto & Title */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: compact ? '13.5px' : '14.5px', textTransform: 'uppercase' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div
          style={{
            display: 'inline-block',
            fontWeight: 700,
            fontSize: compact ? '13px' : '14px',
            borderBottom: '1px solid #0f172a',
            paddingBottom: '2px',
            marginTop: '2px',
          }}
        >
          Độc lập – Tự do – Hạnh phúc
        </div>
        <div style={{ fontWeight: 700, fontSize: compact ? '16px' : '17.5px', marginTop: '14px', textTransform: 'uppercase' }}>
          HỢP ĐỒNG CHO THUÊ XE MÁY
        </div>
        <div style={{ fontSize: compact ? '12.5px' : '13.5px', marginTop: '4px' }}>
          Số: {showVal(data.contractNumber, '…… – ……./HĐTX')}
        </div>
      </div>

      {/* Legal Basis */}
      <div style={{ fontStyle: 'italic', marginBottom: '12px' }}>
        <div>- Căn cứ Bộ Luật Dân sự 2015;</div>
        <div>- Căn cứ luật thương mại 2005;</div>
        <div>- Căn cứ vào nhu cầu và khả năng cung ứng của các bên dưới đây:</div>
      </div>

      <p style={{ margin: '0 0 14px 0', textIndent: '24px' }}>
        Hôm nay, ngày {showVal(data.signDay, '….')} tháng {showVal(data.signMonth, '….')} năm {showVal(data.signYear, '……')}, tại{' '}
        {showVal(data.location, '……………………………………….')}, chúng tôi gồm:
      </p>

      {/* Party A */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>BÊN CHO THUÊ (sau đây gọi là Bên A):</div>
        <div>
          Ông/bà: {showVal(pA.fullName, '…………………………………')} &nbsp; Sinh năm: {showVal(pA.birthYear, '…………………')}
        </div>
        <div>
          CCCD/Hộ chiếu số: {showVal(pA.cccd, '………………………')} &nbsp; Cấp ngày {showVal(pA.cccdIssueDate, '………………')} &nbsp; Nơi cấp{' '}
          {showVal(pA.cccdIssuePlace, '……………')}
        </div>
        <div>Địa chỉ thường trú: {showVal(pA.permanentAddress, '…………………………………………………………………………')}</div>
        <div>Địa chỉ tạm trú (nếu có): {showVal(pA.tempAddress, '……………………………………………………………')}</div>
        <div>Số điện thoại: {showVal(pA.phone, '…………………………………………………………………………')}</div>
      </div>

      {/* Organization block (matches Page 1 template verbatim) */}
      <div style={{ marginBottom: '14px' }}>
        <div>(Trường hợp bên thuê là tổ chức thì ghi:</div>
        <div>CÔNG TY {showVal(org.companyName, '………………………………………………………………………………………')}</div>
        <div>
          GCNĐKDN số: {showVal(org.regNumber, '……………')}, do Sở Kế hoạch và Đầu tư {showVal(org.issuedBy, '………..')} cấp, đăng ký lần đầu ngày{' '}
          {showVal(org.firstRegDate, '…………….')} đăng ký thay đổi lần thứ 1 ngày {showVal(org.firstChangeDate, '…………………')}
        </div>
        <div>Địa chỉ trụ sở chính: {showVal(org.headAddress, '………………………………………………………………………')}</div>
        <div>
          Đại diện bởi ông/bà: {showVal(org.repName, '…………………………')} &nbsp; Chức vụ: {showVal(org.repTitle, '…………………')}
        </div>
        <div>
          CCCD/Hộ chiếu số: {showVal(org.repCccd, '…………………………')} do {showVal(org.repCccdPlace, '…………………')} cấp ngày{' '}
          {showVal(org.repCccdDate, '……………')})
        </div>
      </div>

      {/* Party B */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>BÊN THUÊ (Sau đây gọi tắt là Bên B):</div>
        <div>
          Ông/bà: {showVal(pB.fullName, '…………………………………')} &nbsp; Sinh năm: {showVal(pB.birthYear, '…………………')}
        </div>
        <div>
          CCCD/Hộ chiếu số: {showVal(pB.cccd, '………………………')} &nbsp; Cấp ngày {showVal(pB.cccdIssueDate, '………………')} &nbsp; Nơi cấp{' '}
          {showVal(pB.cccdIssuePlace, '……………')}
        </div>
        <div>Địa chỉ thường trú: {showVal(pB.permanentAddress, '…………………………………………………………………………')}</div>
        <div>Địa chỉ tạm trú (nếu có): {showVal(pB.tempAddress, '……………………………………………………………')}</div>
        <div>Số điện thoại: {showVal(pB.phone, '…………………………………………………………………………')}</div>
      </div>

      <p style={{ margin: '0 0 14px 0' }}>
        Hai bên đã thỏa thuận và thống nhất ký kết Hợp đồng cho thuê xe máy với những điều khoản cụ thể như sau:
      </p>

      {/* Điều 1 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>Điều 1. Đặc điểm và thỏa thuận thuê xe</div>
        <p style={{ margin: '0 0 6px 0' }}>
          Bằng hợp đồng này, Bên A đồng ý cho Bên B thuê và bên B đồng ý thuê {showVal(veh.count, '….')} xe máy có đặc điểm sau đây:
        </p>
        <div style={{ paddingLeft: '24px', marginBottom: '8px' }}>
          <div>- Nhãn hiệu: {showVal(veh.brand, '………………………………………………')}</div>
          <div>
            - Loại xe: {showVal(veh.type, '…………………')} &nbsp; Màu Sơn: {showVal(veh.color, '…………………')}
          </div>
          <div>
            - Số máy: {showVal(veh.engineNumber, '…………………')} &nbsp; Số khung: {showVal(veh.chassisNumber, '…………………')}
          </div>
          <div>- Biển kiểm soát số: {showVal(veh.licensePlate, '………………………………………………')}</div>
        </div>
        <div style={{ marginBottom: '6px' }}>
          <div>– Bên A cam đoan trước khi ký bản Hợp đồng này, xe máy nêu trên:</div>
          <div style={{ paddingLeft: '28px' }}>
            <div>- Không có tranh chấp về quyền sở hữu/sử dụng;</div>
            <div>- Không bị ràng buộc bởi bất kỳ Hợp đồng cho thuê xe máy nào đang có hiệu lực.</div>
          </div>
        </div>
        <div>
          – Bên B cam đoan: Bên B được cấp giấy phép lái xe hạng {showVal(pB.licenseClass, '…..')} số{' '}
          {showVal(pB.licenseNumber, '…………………')} có giá trị đến ngày {showVal(pB.licenseExpiry, '…………………')} .
        </div>
      </div>

      {/* Điều 2 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>Điều 2. Thời hạn thuê xe máy</div>
        <div>
          Thời hạn thuê là {showVal(data.rentalDuration, '…… tháng/ngày')} kể từ ngày Hợp đồng này được ký kết
        </div>
      </div>

      {/* Điều 3 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>Điều 3. Mục đích thuê</div>
        <div>
          Bên B sử dụng tài sản thuê nêu trên vào mục đích {showVal(data.purpose, '……………………………………………')}
        </div>
      </div>

      {/* Điều 4 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>Điều 4: Giá thuê và phương thức thanh toán</div>
        <div style={{ paddingLeft: '20px' }}>
          <div>
            1. Giá thuê tài sản nêu trên là: {showVal(totalText, '…………')} VND (Bằng chữ:{' '}
            {showVal(totalWords, '…………………………….')}) trả bằng tiền Việt Nam hiện hành.
          </div>
          <div>
            2. Phương thức thanh toán: Thanh toán bằng {showVal(data.paymentMethodText, '…………….')} và Bên B phải thanh toán cho Bên A số tiền thuê xe nêu trên vào trước{' '}
            {showVal(data.paymentDeadlineHour, '……')} giờ, ngày {showVal(data.paymentDeadlineDate, '…………………')}
          </div>
          <div>3. Việc giao và nhận số tiền nêu trên do hai bên tự thực hiện và chịu trách nhiệm trước pháp luật.</div>
          {!isTemplate && (Number(data.depositAmountNumber || 0) > 0 || Number(data.paidAmountNumber || 0) > 0) && (
            <div style={{ marginTop: '4px', fontSize: '12.5px', color: '#334155', fontStyle: 'italic' }}>
              (Chi tiết thanh toán: Tiền đặt cọc{' '}
              <strong>{Number(data.depositAmountNumber || 0).toLocaleString('vi-VN')} VND</strong> · Đã thanh toán{' '}
              <strong>{Number(data.paidAmountNumber || 0).toLocaleString('vi-VN')} VND</strong>)
            </div>
          )}
        </div>
      </div>

      {/* Điều 5 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>Điều 5: Phương thức giao, trả lại tài sản thuê</div>
        <div>Hết thời hạn thuê nêu trên, Bên B phải giao trả chiếc xe máy trên cho Bên A.</div>
      </div>

      {/* Điều 6 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>Điều 6: Trách nhiệm và quyền hạn của các bên</div>
        <div style={{ paddingLeft: '12px' }}>
          <div style={{ fontWeight: 700, fontStyle: 'italic', marginBottom: '4px' }}>1. Trách nhiệm, quyền hạn của bên A:</div>
          <div style={{ paddingLeft: '16px', marginBottom: '10px' }}>
            <div>
              - Giao xe và toàn bộ giấy tờ liên quan đến xe ngay sau khi Hợp đồng có hiệu lực và Bên B đã thanh toán tiền thuê xe 01 tháng đầu tiên. Giấy tờ liên quan đến xe gồm: Giấy đăng ký xe, giấy bảo hiểm xe.
            </div>
            <div>- Chịu trách nhiệm pháp lý về nguồn gốc và quyền sở hữu của xe.</div>
            <div>- Mua bảo hiểm xe cho các lần kế tiếp trong thời hạn hiệu lực của Hợp đồng.</div>
            <div>- Xuất hóa đơn thuê xe: {showVal(data.invoiceNote, '……………………………………………………')}</div>
            <div>- Bên A có quyền được nhận đủ tiền thuê tài sản theo phương thức đã thỏa thuận, nhận lại tài sản thuê khi hết hạn Hợp đồng.</div>
            <div>- Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi thường thiệt hại nếu Bên B có hành vi vi phạm hợp đồng hoặc phá hoại tài sản.</div>
          </div>

          <div style={{ fontWeight: 700, fontStyle: 'italic', marginBottom: '4px' }}>2. Trách nhiệm, quyền hạn của bên B:</div>
          <div style={{ paddingLeft: '16px' }}>
            <div>- Thanh toán tiền thuê xe cho Bên A đúng hạn.</div>
            <div>- Chịu toàn bộ chi phí bảo dưỡng xe theo định kỳ.</div>
            <div>- Chịu toàn bộ chi phí xăng dầu khi sử dụng xe.</div>
            <div>- Nhận tài sản thuê theo đúng thỏa thuận.</div>
            <div>- Được sử dụng tài sản thuê theo đúng công dụng, mục đích của tài sản.</div>
            <div>
              - Đơn phương đình chỉ thực hiện Hợp đồng và yêu cầu bồi thường thiệt hại nếu bên A chậm giao tài sản, tài sản không đúng theo thỏa thuận gây thiệt hại cho Bên B.
            </div>
          </div>
        </div>
      </div>

      {/* Điều 7 */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>Điều 7: Hiệu lực hợp đồng</div>
        <div style={{ textIndent: '24px' }}>
          Hợp đồng có giá trị kể từ ngày {showVal(data.startDate, '………..')} đến hết ngày {showVal(data.endDate, '……………………………')}
          {!isTemplate && data.actualReturnDate ? ` (Thực tế trả xe: ${data.actualReturnDate})` : ''}
        </div>
        <div style={{ textIndent: '24px' }}>
          Nếu một trong hai bên, bên nào muốn chấm dứt Hợp đồng trước thời hạn thì phải thông báo cho Bên kia trước ít nhất{' '}
          {showVal(data.noticePeriod, '…… tháng/ngày')}.
        </div>
      </div>

      {/* Điều 8 */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>Điều 8: Điều khoản chung</div>
        <div style={{ paddingLeft: '20px', marginBottom: '8px' }}>
          <div>- Trong quá trình thực hiện hợp đồng, nếu có đề nghị điều chỉnh thì phải thông báo cho nhau bằng văn bản để cùng bàn bạc giải quyết.</div>
          <div>
            - Hai bên cam kết thi hành đúng các điều khoản của hợp đồng, không bên nào tự ý đơn phương sửa đổi, đình chỉ hoặc hủy bỏ hợp đồng. Mọi sự vi phạm được xử lý theo pháp luật. Trường hợp có tranh chấp mà hai bên không tự giải quyết được, sẽ do Tòa Án{' '}
            {showVal(data.courtName, '…………….')} giải quyết.
          </div>
          <div>- Hợp đồng này có hiệu lực từ ngày ký và coi như được thanh lý sau khi hai bên thực hiện xong nghĩa vụ của mình và không còn bất kỳ khiếu nại nào.</div>
        </div>
        <div>
          Hợp đồng được lập thành 04 (bốn) bản có giá trị pháp lý như nhau, Bên A giữ 02 (hai) bản. Bên B giữ 02 (hai) bản.
        </div>
      </div>

      {/* Date & Signature Block */}
      <div style={{ textAlign: 'right', fontStyle: 'italic', marginBottom: '16px' }}>
        {isTemplate ? (
          <span>………ngày……tháng……năm….</span>
        ) : (
          <span>
            {data.signPlace || 'Đà Nẵng'}, ngày {data.signDay || '…'} tháng {data.signMonth || '…'} năm {data.signYear || '……'}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', textAlign: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>ĐẠI DIỆN BÊN A</div>
          <div style={{ fontStyle: 'italic', fontSize: '12.5px', color: '#475569', marginBottom: '10px' }}>(ký và ghi rõ họ tên)</div>
          {staffSignatureSlot ? (
            staffSignatureSlot
          ) : !isTemplate && data.staffSignature ? (
            <div style={{ marginTop: '8px' }}>
              <img
                src={data.staffSignature}
                alt="Chữ ký Bên A"
                style={{ height: '58px', margin: '0 auto', display: 'block', objectFit: 'contain' }}
              />
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                ✓ Đã xác thực ký số Bên A
              </div>
            </div>
          ) : (
            <div style={{ height: '56px' }} />
          )}
          {!isTemplate && pA.fullName && (
            <div style={{ fontWeight: 700, marginTop: '8px' }}>{pA.fullName}</div>
          )}
        </div>

        <div>
          <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>ĐẠI DIỆN BÊN B</div>
          <div style={{ fontStyle: 'italic', fontSize: '12.5px', color: '#475569', marginBottom: '10px' }}>(ký và ghi rõ họ tên)</div>
          {customerSignatureSlot ? (
            customerSignatureSlot
          ) : !isTemplate && data.customerSignature ? (
            <div style={{ marginTop: '8px' }}>
              <img
                src={data.customerSignature}
                alt="Chữ ký Bên B"
                style={{ height: '58px', margin: '0 auto', display: 'block', objectFit: 'contain' }}
              />
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
                ✓ Đã ký số điện tử Bên B
              </div>
            </div>
          ) : (
            <div style={{ height: '56px' }} />
          )}
          {!isTemplate && pB.fullName && (
            <div style={{ fontWeight: 700, marginTop: '8px' }}>{pB.fullName}</div>
          )}
        </div>
      </div>
    </div>
  );
}
