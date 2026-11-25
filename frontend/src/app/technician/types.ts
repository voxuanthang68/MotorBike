export type InspectionCheckStatus = 'normal' | 'damage' | 'check';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface InspectionChecklistItem {
  id: string;
  order: number;
  key: 'overall' | 'engine' | 'brakes' | 'tires' | 'lights' | 'mirrors' | 'body' | 'accessories';
  title: string;
  status: InspectionCheckStatus;
  damageLocation: string;
  damageSeverity: 'low' | 'medium' | 'high';
  note: string;
  photos: string[];
}

export interface DamagePin {
  id: string;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  label: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReturnInspectionItem {
  id: string;
  inspectionCode: string; // VD: KT-2026-042
  bookingId: string;
  bookingCode: string; // VD: HD-DN-2026-318
  isRealBooking?: boolean;
  customerName: string;
  customerPhone: string;
  customerIdCard: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  vehicleImage?: string;
  rentalStartDate: string;
  rentalEndDate: string;
  returnDate: string;
  deliveryOdometer: number;
  returnOdometer: number;
  fuelLevel: number; // 0 - 100
  // Đối chiếu ảnh trước và sau khi thuê
  deliveryImages: string[];
  returnImages: string[];
  // 8 hạng mục kiểm tra chi tiết & ghim vị trí hư hỏng trên xe
  checklist: InspectionChecklistItem[];
  pins: DamagePin[];
  // Tiêu chí kiểm tra an toàn (đồng bộ với Dashboard & Modal chi tiết)
  brakes: boolean;
  tires: boolean;
  lightsAndHorn: boolean;
  engine: boolean;
  mirrorsAndBody: boolean;
  status: 'draft' | 'pending_inspection' | 'passed' | 'damaged';
  notes: string;
  inspectorName: string;
  hasDamageReport?: boolean;
  damageReportId?: string;
}

export interface DamagePosition {
  id: string;
  position: string;
  severity: SeverityLevel;
  description: string;
  photo?: string;
  suggestedAction: 'repair' | 'replace';
  suggestedPartName?: string;
}

export interface DamageReportItem {
  id: string;
  code: string;
  inspectionId?: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  reportedAt: string;
  inspectorName: string;
  positions: DamagePosition[];
  overallSeverity: SeverityLevel;
  notes: string;
  status: 'draft' | 'confirmed' | 'repair_proposed';
  repairId?: string;
  customerAgreedSignature?: boolean;
}

export const SAMPLE_PHOTOS = {
  cleanFront: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80',
  cleanRear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=80',
  adventureSide: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&w=900&q=80',
  damageScratched: 'https://images.unsplash.com/photo-1571216332002-282dce467b32?auto=format&fit=crop&w=900&q=80',
  damageBrokenLight: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=900&q=80',
  repairedPerfect: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=900&q=80',
  newPartInstalled: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80'
};

export function createDefaultChecklist(overrides?: Partial<Record<InspectionChecklistItem['key'], Partial<InspectionChecklistItem>>>): InspectionChecklistItem[] {
  const base: Array<Omit<InspectionChecklistItem, 'status' | 'damageLocation' | 'damageSeverity' | 'photos'> & { defaultNote: string }> = [
    { id: 'chk-1', order: 1, key: 'overall', title: 'Kiểm tra tổng thể xe', note: '', defaultNote: 'Xe sạch sẽ, không va đập.' },
    { id: 'chk-2', order: 2, key: 'engine', title: 'Kiểm tra động cơ', note: '', defaultNote: 'Động cơ êm, sang số mượt.' },
    { id: 'chk-3', order: 3, key: 'brakes', title: 'Kiểm tra hệ thống phanh', note: '', defaultNote: 'Phanh ăn, đĩa không đảo.' },
    { id: 'chk-4', order: 4, key: 'tires', title: 'Kiểm tra lốp xe', note: '', defaultNote: 'Lốp còn gai sâu, áp suất đạt chuẩn.' },
    { id: 'chk-5', order: 5, key: 'lights', title: 'Kiểm tra đèn và còi', note: '', defaultNote: 'Hoạt động bình thường.' },
    { id: 'chk-6', order: 6, key: 'mirrors', title: 'Kiểm tra gương chiếu hậu', note: '', defaultNote: 'Gương nguyên vẹn, không lỏng ốc.' },
    { id: 'chk-7', order: 7, key: 'body', title: 'Kiểm tra thân xe & dàn áo', note: '', defaultNote: 'Không phát sinh vết xước mới.' },
    { id: 'chk-8', order: 8, key: 'accessories', title: 'Kiểm tra các bộ phận khác (Chìa khóa, mũ, giấy tờ)', note: '', defaultNote: 'Đủ phụ kiện.' }
  ];

  return base.map(item => {
    const ov = overrides?.[item.key];
    return {
      id: item.id,
      order: item.order,
      key: item.key,
      title: item.title,
      status: ov?.status || 'normal',
      damageLocation: ov?.damageLocation || '',
      damageSeverity: ov?.damageSeverity || 'medium',
      note: ov?.note !== undefined ? ov.note : item.defaultNote,
      photos: ov?.photos || []
    };
  });
}

export function syncBooleansFromChecklist(checklist: InspectionChecklistItem[]) {
  const isOk = (key: InspectionChecklistItem['key']) => {
    const found = checklist.find(c => c.key === key);
    return !found || found.status === 'normal';
  };
  return {
    brakes: isOk('brakes'),
    tires: isOk('tires'),
    lightsAndHorn: isOk('lights'),
    engine: isOk('engine'),
    mirrorsAndBody: isOk('mirrors') && isOk('body') && isOk('overall')
  };
}
