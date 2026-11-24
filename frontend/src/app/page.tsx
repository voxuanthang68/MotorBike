'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import RentalWizard from '@/components/booking/RentalWizard';
import ContractPreviewModal from '@/components/ContractPreviewModal';
import {
  Bike,
  ShieldCheck,
  MapPin,
  Phone,
  Clock,
  Compass,
  Calendar,
  ChevronRight,
  SlidersHorizontal,
  Search,
  FileText,
  CheckCircle2,
  Zap,
  RotateCcw,
  Heart,
  X,
  Fuel,
  Gauge,
  PackageCheck,
  Check,
  HelpCircle,
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface Motorbike {
  id: string;
  name: string;
  year: string;
  brand: string;
  type: 'scooter' | 'manual' | 'clutch' | 'electric';
  typeName: string;
  pricePerDay: number;
  priceFormatted: string;
  priceMonthFormatted?: string;
  badge?: string;
  transmissionText: string;
  conditionTag: string;
  engine: string;
  fuelConsumption: string;
  image: string;
  gallery: string[];
  popular?: boolean;
  features: string[];
  description: string;
  routes: string;
  specifications: {
    tankCapacity: string;
    weight: string;
    brake: string;
    starter: string;
    year: string;
  };
}

const MOTORBIKES: Motorbike[] = [
  {
    id: '1',
    name: 'Honda Vision Smartkey 2024',
    year: '2024',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga',
    pricePerDay: 130000,
    priceFormatted: '130K',
    priceMonthFormatted: '2.600K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Số tự động',
    conditionTag: 'Xe mới',
    engine: '110cc eSP thế hệ mới',
    fuelConsumption: '1.87 L/100km',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80'
    ],
    popular: true,
    features: ['Khóa Smartkey chống trộm', 'Cốp rộng 16L tiện lợi', 'Trọng lượng nhẹ 96kg dễ dắt', 'Tối ưu du lịch nội thành'],
    description: 'Honda Vision 2024 là dòng xe tay ga quốc dân được yêu thích nhất tại Đà Nẵng nhờ kiểu dáng thanh thoát, tay lái nhẹ và cực kỳ tiết kiệm xăng. Động cơ eSP 110cc vận hành êm ái, thích hợp cho các cặp đôi dạo phố ngắm cảnh biển.',
    routes: 'Dạo phố Bạch Đằng, Cầu Rồng, Bãi biển Mỹ Khê, Chùa Linh Ứng và Phố Cổ Hội An.',
    specifications: {
      tankCapacity: '4.9 Lít',
      weight: '96 kg',
      brake: 'Phanh đĩa trước / tang trống sau (CBS an toàn)',
      starter: 'Điện tử Smartkey thông minh',
      year: 'Đời mới 2024'
    }
  },
  {
    id: '2',
    name: 'Honda Air Blade 125cc LED 2023',
    year: '2023',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga',
    pricePerDay: 150000,
    priceFormatted: '150K',
    priceMonthFormatted: '3.000K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Số tự động',
    conditionTag: 'Xe mới',
    engine: '125cc eSP+ 4 van mạnh mẽ',
    fuelConsumption: '2.14 L/100km',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80'
    ],
    popular: true,
    features: ['Khóa Smartkey tiện ích', 'Động cơ eSP+ 4 van bốc khỏe', 'Phanh đĩa CBS an toàn', 'Cốp siêu rộng 22.7L'],
    description: 'Air Blade 125cc sở hữu thiết kế thể thao nam tính, khung xe đầm chắc và động cơ 4 van thế hệ mới tăng tốc mượt mà. Xe cực kỳ đầm khi chạy ở tốc độ cao trên cung đường ven biển Hoàng Sa và Võ Nguyên Giáp.',
    routes: 'Chinh phục Đèo Hải Vân, Bán đảo Sơn Trà, Đỉnh Bàn Cờ, Bà Nà Hills và Hội An.',
    specifications: {
      tankCapacity: '4.4 Lít',
      weight: '113 kg',
      brake: 'Phanh đĩa thủy lực an toàn',
      starter: 'Khóa thông minh Smartkey 2024',
      year: 'Đời mới 2023'
    }
  },
  {
    id: '3',
    name: 'Honda SH Mode 125 ABS 2024',
    year: '2024',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga cao cấp',
    pricePerDay: 220000,
    priceFormatted: '220K',
    priceMonthFormatted: '4.500K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Số tự động',
    conditionTag: 'Xe mới',
    engine: '125cc eSP+ 4 van êm ái',
    fuelConsumption: '2.12 L/100km',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'
    ],
    popular: true,
    features: ['Phanh ABS chống bó cứng an toàn', 'Phong cách Châu Âu lịch lãm', 'Động cơ eSP+ êm ái tuyệt đối', 'Đèn LED định vị sắc sảo'],
    description: 'Dòng xe tay ga cao cấp chuẩn thanh lịch, giúp bạn có những bức ảnh check-in tuyệt đẹp tại các cây cầu nổi tiếng của Đà Nẵng hay các resort ven biển Sơn Trà. Hệ thống phanh ABS chống trượt bánh khi gặp mưa ướt.',
    routes: 'Tuyến đường ven biển Võ Nguyên Giáp, Cầu Tình Yêu, Bán đảo Sơn Trà và Resort cao cấp.',
    specifications: {
      tankCapacity: '5.5 Lít',
      weight: '116 kg',
      brake: 'Phanh chống bó cứng ABS cao cấp',
      starter: 'Smartkey FOB sang trọng',
      year: 'Đời mới 2024'
    }
  },
  {
    id: '4',
    name: 'Honda Wave Alpha 110cc 2024',
    year: '2024',
    brand: 'Honda',
    type: 'manual',
    typeName: 'Xe số',
    pricePerDay: 90000,
    priceFormatted: '90K',
    priceMonthFormatted: '1.800K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Xe số 4 cấp',
    conditionTag: 'Xe mới',
    engine: '110cc bền bỉ siêu tiết kiệm',
    fuelConsumption: '1.72 L/100km',
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=800&auto=format&fit=crop&q=80'
    ],
    popular: true,
    features: ['Tiết kiệm xăng kỷ lục 1.7L/100km', 'Khỏe khoắn leo dốc Đèo Hải Vân', 'Dễ điều khiển nhẹ nhàng', 'Chi phí thuê tiết kiệm nhất'],
    description: 'Vua xe số bền bỉ và kinh tế. Wave Alpha nổi tiếng với khả năng tiết kiệm xăng kỷ lục chỉ ~1.7L/100km. Xe máy khỏe, về số 1 hoặc 2 leo dốc dẻo dai, là lựa chọn số 1 cho các bạn trẻ phượt Đèo Hải Vân.',
    routes: 'Đèo Hải Vân, Cung đường đèo Sơn Trà, Suối Mơ, Ngũ Hành Sơn, Hội An.',
    specifications: {
      tankCapacity: '3.7 Lít',
      weight: '97 kg',
      brake: 'Phanh cơ tang trống bền bỉ',
      starter: 'Nút đề điện và cần đạp chân',
      year: 'Đời mới 2024'
    }
  },
  {
    id: '5',
    name: 'Honda Winner X 150 ABS 2024',
    year: '2024',
    brand: 'Honda',
    type: 'clutch',
    typeName: 'Xe côn tay',
    pricePerDay: 180000,
    priceFormatted: '180K',
    priceMonthFormatted: '3.600K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Côn tay 6 số',
    conditionTag: 'Xe mới',
    engine: '150cc DOHC 6 số uy lực',
    fuelConsumption: '1.99 L/100km',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80'
    ],
    popular: true,
    features: ['Côn tay thể thao 6 số', 'Phanh ABS chống bó cứng trước', 'Động cơ DOHC bứt tốc mạnh mẽ', 'Chuyên phượt Sơn Trà và Hải Vân'],
    description: 'Siêu phẩm côn tay đường trường cho phượt thủ. Khối động cơ DOHC 150cc 6 cấp số cho lực kéo mạnh mẽ và phanh ABS đem lại sự an tâm tuyệt đối khi đổ đèo Hải Vân hay đi đường trường dài.',
    routes: 'Đèo Hải Vân, Mũi Nghê, Cây Đa ngàn năm Sơn Trà, Cù Lao Chàm.',
    specifications: {
      tankCapacity: '4.5 Lít',
      weight: '122 kg',
      brake: 'Phanh đĩa ABS chống bó cứng bánh trước',
      starter: 'Điện tử Smartkey tiện lợi',
      year: 'Đời mới 2024'
    }
  },
  {
    id: '6',
    name: 'Yamaha Sirius 110 FI 2024',
    year: '2024',
    brand: 'Yamaha',
    type: 'manual',
    typeName: 'Xe số',
    pricePerDay: 100000,
    priceFormatted: '100K',
    priceMonthFormatted: '2.000K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Xe số 4 cấp',
    conditionTag: 'Xe mới',
    engine: '115cc Phun xăng điện tử FI',
    fuelConsumption: '1.65 L/100km',
    image: 'https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80'
    ],
    features: ['Phun xăng điện tử FI tiết kiệm', 'Máy bốc đề-pa vượt dốc nhanh', 'Vành đúc thể thao đầm chắc', 'Phanh đĩa trước an toàn'],
    description: 'Sirius FI với động cơ 115cc của Yamaha mang lại cảm giác ga nhạy, máy bốc và phản hồi tức thì. Vành đúc chắc chắn giúp bạn tự tin ôm cua trên những cung đường dốc quanh co ở Đà Nẵng.',
    routes: 'Vịnh Lăng Cô, Đèo Hải Vân, Đỉnh Bàn Cờ, Bán đảo Sơn Trà, Hội An.',
    specifications: {
      tankCapacity: '3.8 Lít',
      weight: '99 kg',
      brake: 'Phanh đĩa trước thể thao',
      starter: 'Đề điện tử nhạy nổ',
      year: 'Đời mới 2024'
    }
  },
  {
    id: '7',
    name: 'Honda Lead 125 Cốp Khủng 2024',
    year: '2024',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga',
    pricePerDay: 140000,
    priceFormatted: '140K',
    priceMonthFormatted: '2.800K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Số tự động',
    conditionTag: 'Xe mới',
    engine: '125cc eSP+ làm mát dung dịch',
    fuelConsumption: '2.16 L/100km',
    image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'
    ],
    features: ['Cốp siêu to 37L chứa 2 mũ và balo', 'Cổng sạc điện thoại USB tiện dụng', 'Tiết kiệm xăng tối ưu', 'Sàn để chân phẳng rộng rãi'],
    description: 'Chiếc xe lý tưởng cho các chuyến du lịch gia đình hoặc nhóm bạn. Dung tích cốp kỷ lục 37L có thể chứa vừa cả balo du lịch, túi xách, quà đặc sản mua tại chợ Cồn và 2 mũ bảo hiểm lớn.',
    routes: 'Tour ẩm thực nội thành Hải Châu, Chợ Cồn, Chợ Hàn, Bãi biển Mỹ Khê và Hội An.',
    specifications: {
      tankCapacity: '6.0 Lít (bình xăng lớn)',
      weight: '113 kg',
      brake: 'Phanh đĩa kết hợp CBS',
      starter: 'Smartkey có báo động',
      year: 'Đời mới 2024'
    }
  },
  {
    id: '8',
    name: 'Yamaha Exciter 155 VVA 2024',
    year: '2024',
    brand: 'Yamaha',
    type: 'clutch',
    typeName: 'Xe côn tay',
    pricePerDay: 190000,
    priceFormatted: '190K',
    priceMonthFormatted: '3.800K',
    badge: 'Miễn thế chấp',
    transmissionText: 'Côn tay 6 số',
    conditionTag: 'Xe mới',
    engine: '155cc Van biến thiên VVA',
    fuelConsumption: '2.09 L/100km',
    image: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
    ],
    features: ['Van biến thiên VVA mở tua bốc', 'Ly hợp chống trượt Slipper Clutch', 'Khóa Smartkey hiện đại', 'Cổng sạc 12V điện thoại'],
    description: 'Exciter 155 VVA sở hữu công nghệ van biến thiên tăng cường công suất ở dải tua cao và bộ ly hợp chống trượt bánh sau khi dồn số gấp, đem lại trải nghiệm lái thể thao phấn khích nhất.',
    routes: 'Cung đường phượt biển Đà Nẵng đến Lăng Cô, Đèo Hải Vân, Rừng Dừa Bảy Mẫu.',
    specifications: {
      tankCapacity: '5.4 Lít',
      weight: '121 kg',
      brake: 'Phanh đĩa 2 piston thể thao',
      starter: 'Khóa thông minh Smartkey',
      year: 'Đời mới 2024'
    }
  }
];

const VEHICLE_FILE_BASE_URL = 'http://localhost:5000';

function toCatalogBike(vehicle: any): Motorbike {
  const fallback = MOTORBIKES.find(bike => bike.type === vehicle.type) || MOTORBIKES[0];
  const imagePath = vehicle.mainImage || vehicle.images?.[0]?.url;
  const image = imagePath
    ? (String(imagePath).startsWith('http') ? imagePath : `${VEHICLE_FILE_BASE_URL}${imagePath}`)
    : fallback.image;
  const pricePerDay = Number(vehicle.pricePerDay || 0);
  const type = vehicle.type === 'semi-automatic' ? 'manual' : vehicle.type === 'sport' ? 'clutch' : vehicle.type;
  const typeName = type === 'scooter' ? 'Xe tay ga' : type === 'manual' ? 'Xe số' : type === 'electric' ? 'Xe điện' : 'Xe côn tay';
  return {
    ...fallback,
    id: String(vehicle._id),
    name: vehicle.name,
    year: String(vehicle.year || '2024'),
    brand: vehicle.brand,
    type: type as Motorbike['type'],
    typeName,
    pricePerDay,
    priceFormatted: `${Math.round(pricePerDay / 1000)}K`,
    priceMonthFormatted: pricePerDay ? `${Math.round(pricePerDay * 20 / 1000)}K` : undefined,
    image,
    gallery: (vehicle.images || []).map((item: any) => String(item.url).startsWith('http') ? item.url : `${VEHICLE_FILE_BASE_URL}${item.url}`),
    engine: vehicle.engineCC ? `${vehicle.engineCC}cc` : 'Động cơ xe máy',
    conditionTag: vehicle.condition === 'excellent' ? 'Xe mới' : 'Xe bảo dưỡng định kỳ',
    description: vehicle.description || fallback.description,
    features: vehicle.features?.length ? vehicle.features : fallback.features,
    specifications: { ...fallback.specifications, year: `Đời ${vehicle.year || '2024'}` },
  };
}

export default function HomePage() {
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('Sân bay Đà Nẵng');
  const [bookingBike, setBookingBike] = useState<any>(null);
  const [selectedBikeDetail, setSelectedBikeDetail] = useState<Motorbike | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showContractPreview, setShowContractPreview] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPrice, setSearchPrice] = useState('all');
  const [searchBrand, setSearchBrand] = useState('all');
  const [sortOption, setSortOption] = useState('rating');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [availabilityById, setAvailabilityById] = useState<Record<string, string>>({});
  const [availabilityByName, setAvailabilityByName] = useState<Record<string, string>>({});
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [catalogBikes, setCatalogBikes] = useState<Motorbike[]>([]);

  // ONE LIVE THING: Route & Rate Planner
  const [plannedRoute, setPlannedRoute] = useState<'city' | 'haivan' | 'sontra' | 'hoian'>('city');
  const [plannedDays, setPlannedDays] = useState<number>(2);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('8bike_favorites');
      if (saved) {
        setFavoriteIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const refreshAvailability = () => api.get('/vehicles/public').then(response => {
      if (!active) return;
      const next: Record<string, string> = {};
      const nextById: Record<string, string> = {};
      (response.data?.data || []).forEach((vehicle: any) => {
        if (vehicle._id) nextById[String(vehicle._id)] = vehicle.availability || vehicle.status;
        const name = String(vehicle.name).trim().toLowerCase();
        next[name] = vehicle.availability;
        next[name.replace(/\s*-\s*\d{4}$/, '')] = vehicle.availability;
        next[name.replace(/\b\d{4}\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim()] = vehicle.availability;
      });
      setCatalogBikes((response.data?.data || []).map(toCatalogBike));
      setAvailabilityById(nextById);
      setAvailabilityByName(next);
      setAvailabilityLoaded(true);
    }).catch(() => {
      if (active) setAvailabilityLoaded(false);
    });
    refreshAvailability();
    const timer = window.setInterval(refreshAvailability, 20000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const toggleFavorite = (bikeId: string) => {
    setFavoriteIds(prev => {
      const exists = prev.includes(bikeId);
      const updated = exists ? prev.filter(id => id !== bikeId) : [...prev, bikeId];
      try {
        localStorage.setItem('8bike_favorites', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      if (exists) {
        toast.success('Đã bỏ xe khỏi danh sách yêu thích');
      } else {
        toast.success('Đã thêm xe vào danh sách yêu thích');
      }
      return updated;
    });
  };

  const isFavorite = (id: string) => favoriteIds.includes(id);

  const filteredBikes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const bikes = catalogBikes.length > 0 ? catalogBikes : MOTORBIKES;
    const result = bikes.filter(b => {
      const catalogName = b.name.trim().toLowerCase();
      const availability = availabilityById[b.id] || availabilityByName[catalogName] || availabilityByName[catalogName.replace(/\s*-\s*\d{4}$/, '')] || availabilityByName[catalogName.replace(/\b\d{4}\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim()];
      if (availabilityLoaded && availability && availability !== 'available') return false;
      if (selectedType === 'favorites' && !favoriteIds.includes(b.id)) return false;
      if (selectedType !== 'all' && selectedType !== 'favorites' && b.type !== selectedType) return false;
      if (searchBrand !== 'all' && b.brand !== searchBrand) return false;
      if (normalizedQuery && !`${b.name} ${b.brand} ${b.engine} ${b.typeName}`.toLowerCase().includes(normalizedQuery)) return false;
      if (searchPrice === 'under100' && b.pricePerDay >= 100000) return false;
      if (searchPrice === '100to150' && (b.pricePerDay < 100000 || b.pricePerDay > 150000)) return false;
      if (searchPrice === 'over150' && b.pricePerDay <= 150000) return false;
      return true;
    });
    return [...result].sort((a, b) => sortOption === 'priceAsc' ? a.pricePerDay - b.pricePerDay : sortOption === 'priceDesc' ? b.pricePerDay - a.pricePerDay : a.name.localeCompare(b.name));
  }, [catalogBikes, selectedType, favoriteIds, searchQuery, searchBrand, searchPrice, sortOption, availabilityById, availabilityByName, availabilityLoaded]);

  const resetFilters = () => {
    setSearchQuery('');
    setSearchPrice('all');
    setSearchBrand('all');
    setSelectedType('all');
    setSortOption('rating');
  };

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  // Live calculator calculation
  const routeRecommendation = useMemo(() => {
    switch (plannedRoute) {
      case 'haivan':
        return {
          title: 'Chinh phục Đèo Hải Vân và Vịnh Lăng Cô',
          bikeName: 'Honda Winner X 150 ABS hoặc Wave Alpha',
          bikeId: '5',
          dailyRate: 180000,
          advice: 'Cung đường đèo có nhiều khúc cua tay áo và độ dốc 10%. Nên ưu tiên xe côn tay hoặc xe số có lực kéo mạnh và phanh an toàn khi đổ dốc.',
          perks: ['2 mũ bảo hiểm đạt chuẩn', '2 áo mưa tiện lợi', '1 lít xăng', 'Hỗ trợ kỹ thuật toàn tuyến']
        };
      case 'sontra':
        return {
          title: 'Khám phá Bán đảo Sơn Trà và Đỉnh Bàn Cờ',
          bikeName: 'Honda Wave Alpha hoặc Yamaha Sirius FI',
          bikeId: '4',
          dailyRate: 90000,
          advice: 'Tuyến đường lên Đỉnh Bàn Cờ có đoạn dốc cao cấm xe tay ga tự động. Xe số giúp bạn ghìm số 1 và 2 an toàn tuyệt đối khi xuống dốc.',
          perks: ['2 mũ bảo hiểm đạt chuẩn', 'Giá đỡ điện thoại xem bản đồ', '1 lít xăng khởi hành', 'Cứu hộ lưu động']
        };
      case 'hoian':
        return {
          title: 'Hành trình Phố Cổ Hội An và Rừng Dừa',
          bikeName: 'Honda Air Blade 125cc hoặc Honda Vision',
          bikeId: '2',
          dailyRate: 150000,
          advice: 'Đường ven biển bằng phẳng dài 30km. Xe tay ga đầm chắc, yên rộng êm ái cho 2 người và cốp lớn chứa đồ du lịch thoải mái.',
          perks: ['2 mũ bảo hiểm đạt chuẩn', '2 áo mưa', 'Giao xe tận nơi khách sạn', 'Hỗ trợ 24/7']
        };
      default:
        return {
          title: 'Dạo phố Bạch Đằng, Cầu Rồng và Biển Mỹ Khê',
          bikeName: 'Honda Vision Smartkey 2024',
          bikeId: '1',
          dailyRate: 130000,
          advice: 'Lựa chọn nhẹ nhàng, tiết kiệm xăng nhất khi di chuyển trong trung tâm thành phố và chụp ảnh check-in các cây cầu.',
          perks: ['2 mũ bảo hiểm đạt chuẩn', 'Khóa Smartkey chống trộm', 'Giao xe sân bay miễn phí', '1 lít xăng']
        };
    }
  }, [plannedRoute]);

  const liveEstimatedTotal = routeRecommendation.dailyRate * plannedDays;

  return (
    <div style={{ minHeight: '100vh', background: '#faf5f7', color: '#0f172a' }}>

      {/* ========================================================
          1. HEADER NAVBAR (Blue & Rose-Gray Glassmorphic Bar)
          ======================================================== */}
      <header
        style={{
          background: 'rgba(250, 245, 247, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #ebdce3',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 14px rgba(157, 23, 77, 0.04)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand mark */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)',
              }}
            >
              <Bike style={{ width: '22px', height: '22px', color: '#ffffff' }} />
            </div>
            <div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.4px' }}>
                XTBike <span style={{ color: '#9d174d', fontSize: '13px', fontWeight: 700, background: '#fcecf2', padding: '2px 8px', borderRadius: '6px', border: '1px solid #f7d1de' }}>Đà Nẵng</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden-mobile">
            <a href="#danh-sach-xe" style={{ color: '#1d4ed8', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>
              Bảng xe sẵn có
            </a>
            <a href="#tinh-lo-trinh" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Bộ tính lộ trình
            </a>
            <a href="#quy-trinh" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Quy trình nhận xe
            </a>
            <a href="#cam-ket" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Cam kết dịch vụ
            </a>
            <a href="#hoi-dap" style={{ color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
              Hỏi đáp
            </a>
          </nav>

          {/* Action / Auth Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="tel:0905123456"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1d4ed8',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: 700,
                padding: '8px 14px',
                background: '#fcecf2',
                border: '1px solid #f7d1de',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <Phone style={{ width: '14px', height: '14px', color: '#1d4ed8' }} />
              <span>0905 123 456</span>
            </a>

            {mounted && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  href={user.role === 'customer' ? '/portal' : '/dashboard'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)',
                  }}
                >
                  <UserCheck style={{ width: '14px', height: '14px' }} />
                  <span>{user.fullName?.split(' ').slice(-1)[0] || 'Tài khoản'}</span>
                </Link>
                <button
                  onClick={logout}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #ebdce3',
                    color: '#64748b',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  Thoát
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)',
                }}
              >
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          2. HERO SECTION — Blue & Rose-Gray Theme
          ======================================================== */}
      <section style={{ background: 'linear-gradient(180deg, #f7edf1 0%, #faf5f7 100%)', padding: '60px 24px 70px', borderBottom: '1px solid #ebdce3' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }}>
          
          {/* Left Column: Anchored Headline & Value Proposition */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fcecf2',
                border: '1px solid #f7d1de',
                color: '#9d174d',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '18px',
              }}
            >
              <Sparkles style={{ width: '15px', height: '15px', color: '#be185d' }} />
              <span>Dịch vụ thuê xe máy du lịch tự túc uy tín #1 Đà Nẵng</span>
            </div>

            <h1 style={{ fontSize: 'clamp(2.2rem, 3.4vw, 3.5rem)', fontWeight: 900, color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 20px 0' }}>
              Thuê xe máy du lịch tự túc tại Đà Nẵng
            </h1>

            <p style={{ fontSize: '17px', color: '#475569', lineHeight: 1.6, margin: '0 0 32px 0', maxWidth: '560px' }}>
              Giao xe miễn phí tận nơi tại sân bay, ga tàu và khách sạn. 100% xe đời mới 2023 - 2024, tặng kèm 2 mũ bảo hiểm đạt chuẩn, 2 áo mưa và 1 lít xăng.
            </p>

            {/* Action Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <a
                href="#danh-sach-xe"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 6px 18px rgba(29, 78, 216, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Xem bảng 8 dòng xe</span>
                <ChevronRight style={{ width: '18px', height: '18px' }} />
              </a>

              <a
                href="#tinh-lo-trinh"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  border: '1px solid #ebdce3',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(157, 23, 77, 0.04)',
                }}
              >
                <Compass style={{ width: '16px', height: '16px', color: '#1d4ed8' }} />
                <span>Tính chi phí lộ trình</span>
              </a>
            </div>

            {/* Three-point Trust Statement on Solid Surface */}
            <div style={{ background: '#ffffff', border: '1px solid #ebdce3', padding: '18px 24px', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', boxShadow: '0 4px 16px rgba(157, 23, 77, 0.04)' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8' }}>0₫ thế chấp</div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Không giữ CCCD gốc</div>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8' }}>15 phút giao xe</div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Sân bay và khách sạn</div>
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8' }}>Cứu hộ 24/7</div>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>Tuyến Hải Vân - Hội An</div>
              </div>
            </div>
          </div>

          {/* Right Column: Specimen Showcase Card */}
          <div style={{ background: '#ffffff', border: '1px solid #ebdce3', padding: '30px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(157, 23, 77, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#9d174d', background: '#fcecf2', padding: '3px 10px', borderRadius: '20px', border: '1px solid #f7d1de' }}>
                ⭐ Mẫu xe tiêu biểu tuần này
              </span>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Đời mới 2024</span>
            </div>

            {/* Motorcycle Specimen Image */}
            <div style={{ height: '240px', overflow: 'hidden', borderRadius: '12px', background: '#f5ebf0', marginBottom: '20px' }}>
              <img
                src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80"
                alt="Honda Vision Smartkey 2024"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Honda Vision Smartkey
              </h2>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#1d4ed8' }}>
                130.000₫ <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ ngày</span>
              </div>
            </div>

            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: '0 0 18px 0' }}>
              Động cơ 110cc eSP êm ái, khóa thông minh chống trộm, mức tiêu thụ 1.87 L/100km.
            </p>

            <button
              type="button"
              onClick={() => setSelectedBikeDetail(MOTORBIKES[0])}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
              }}
            >
              Xem thông số kỹ thuật xe này
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. ONE LIVE THING: Live Route & Rate Planner
          ======================================================== */}
      <section id="tinh-lo-trinh" style={{ background: '#f5ebf0', borderTop: '1px solid #ebdce3', borderBottom: '1px solid #ebdce3', padding: '70px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#fcecf2', border: '1px solid #f7d1de', color: '#9d174d', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              💡 Công cụ dự toán thông minh
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Bộ tính chi phí lộ trình & Gợi ý xe tối ưu
            </h2>
            <p style={{ fontSize: '16px', color: '#57484e', margin: 0 }}>
              Chọn cung đường dự kiến và số ngày du lịch để nhận tính toán chi phí chính xác kèm lời khuyên kỹ thuật.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'start' }}>
            
            {/* Left Box: Route & Days Selection Controls */}
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #ebdce3', boxShadow: '0 4px 18px rgba(157, 23, 77, 0.03)' }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                Bước 1: Chọn cung đường bạn muốn trải nghiệm
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                {[
                  { id: 'city', title: 'Nội thành và Bãi biển Mỹ Khê', tag: 'Đường bằng phẳng' },
                  { id: 'haivan', title: 'Chinh phục Đèo Hải Vân', tag: 'Độ dốc 10%, cua gấp' },
                  { id: 'sontra', title: 'Bán đảo Sơn Trà và Đỉnh Bàn Cờ', tag: 'Cần xe số leo dốc' },
                  { id: 'hoian', title: 'Phố cổ Hội An và Rừng Dừa', tag: 'Đường dài 30km' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setPlannedRoute(r.id as any)}
                    style={{
                      textAlign: 'left',
                      padding: '16px',
                      borderRadius: '10px',
                      border: plannedRoute === r.id ? 'none' : '1px solid #ebdce3',
                      background: plannedRoute === r.id ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#fcf8fa',
                      color: plannedRoute === r.id ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                      boxShadow: plannedRoute === r.id ? '0 4px 14px rgba(29, 78, 216, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: plannedRoute === r.id ? '#dbeafe' : '#645a60' }}>{r.tag}</div>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                Bước 2: Chọn số ngày dự kiến thuê xe
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 5, 7, 14, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPlannedDays(d)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: plannedDays === d ? 'none' : '1px solid #f7d1de',
                      background: plannedDays === d ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#fcecf2',
                      color: plannedDays === d ? '#ffffff' : '#9d174d',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: plannedDays === d ? '0 4px 12px rgba(29, 78, 216, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {d === 30 ? '1 Tháng' : `${d} Ngày`}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Box: Live Result & Recommended Vehicle */}
            <div style={{ background: 'linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 100%)', color: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 8px 28px rgba(29, 78, 216, 0.28)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#fcecf2', background: 'rgba(252, 236, 242, 0.2)', padding: '4px 12px', borderRadius: '16px', fontWeight: 700, marginBottom: '12px', border: '1px solid rgba(252, 236, 242, 0.3)' }}>
                ⭐ Đề xuất cho hành trình của bạn
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '0 0 12px 0' }}>
                {routeRecommendation.bikeName}
              </h3>

              <p style={{ fontSize: '14px', color: '#dbeafe', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                {routeRecommendation.advice}
              </p>

              {/* Price Calculation Box */}
              <div style={{ background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', padding: '18px 20px', borderRadius: '10px', marginBottom: '24px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                  <span>Đơn giá ngày:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{routeRecommendation.dailyRate.toLocaleString('vi-VN')}₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#cbd5e1' }}>
                  <span>Thời gian thuê:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{plannedDays} ngày</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.18)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Tổng tiền dự kiến:</span>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#fef08a' }}>
                    {liveEstimatedTotal.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>

              {/* Included Perks List */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12.5px', color: '#bfdbfe', marginBottom: '10px', fontWeight: 600 }}>
                  Trọn bộ trang bị miễn phí đi kèm:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {routeRecommendation.perks.map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#f8fafc' }}>
                      <Check style={{ width: '15px', height: '15px', color: '#93c5fd', flexShrink: 0 }} />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#danh-sach-xe"
                onClick={() => {
                  const targetBike = MOTORBIKES.find(b => b.id === routeRecommendation.bikeId);
                  if (targetBike) {
                    setSelectedType(targetBike.type);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  transition: 'background 0.15s ease'
                }}
              >
                <span>Xem xe này trong bảng giá</span>
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. SPECIMEN CATALOGUE (The Vehicle Collection)
          ======================================================== */}
      <section id="danh-sach-xe" style={{ padding: '80px 24px', background: '#faf5f7' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#fcecf2', border: '1px solid #f7d1de', color: '#9d174d', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
                🏍️ Đội xe chất lượng cao
              </div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
                Bảng danh mục xe máy tự lái
              </h2>
              <p style={{ fontSize: '16px', color: '#57484e', margin: 0 }}>
                Toàn bộ xe được kiểm tra phanh thắng, lốp và động cơ trước khi bàn giao cho quý khách.
              </p>
            </div>

            {/* Quick search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search style={{ width: '16px', height: '16px', color: '#9d174d', position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên xe: Vision, Lead..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    fontSize: '13.5px',
                    border: '1px solid #ebdce3',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                />
              </div>

              {(searchQuery || selectedType !== 'all' || searchPrice !== 'all') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    padding: '10px 14px',
                    fontSize: '13px',
                    background: '#fcecf2',
                    border: '1px solid #f7d1de',
                    borderRadius: '8px',
                    color: '#9d174d',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '36px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả các dòng xe' },
              { id: 'scooter', label: 'Xe tay ga' },
              { id: 'manual', label: 'Xe số' },
              { id: 'clutch', label: 'Xe côn tay' },
              ...(favoriteIds.length > 0 ? [{ id: 'favorites', label: `Xe yêu thích (${favoriteIds.length})` }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: selectedType === tab.id ? 'none' : '1px solid #ebdce3',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: selectedType === tab.id ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' : '#ffffff',
                  color: selectedType === tab.id ? '#ffffff' : '#57484e',
                  boxShadow: selectedType === tab.id ? '0 4px 14px rgba(29, 78, 216, 0.28)' : '0 2px 5px rgba(157, 23, 77, 0.02)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vehicle Specimen Tiles Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '28px' }}>
            {filteredBikes.map(bike => (
              <div
                key={bike.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ebdce3',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 20px rgba(157, 23, 77, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Vehicle Image Tile */}
                <div style={{ position: 'relative', height: '220px', background: '#f5ebf0' }}>
                  <img
                    src={bike.image}
                    alt={bike.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {bike.badge && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)' }}>
                      ✓ {bike.badge}
                    </div>
                  )}

                  {/* Favorite Button */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(bike.id)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '36px',
                      height: '36px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid #ebdce3',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    title={isFavorite(bike.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  >
                    <Heart style={{ width: '18px', height: '18px', color: isFavorite(bike.id) ? '#dc2626' : '#94a3b8', fill: isFavorite(bike.id) ? '#dc2626' : 'none' }} />
                  </button>
                </div>

                {/* Card Information Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#9d174d', background: '#fcecf2', border: '1px solid #f7d1de', padding: '2px 8px', borderRadius: '6px' }}>{bike.typeName}</span>
                      <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 700, background: '#eff6ff', border: '1px solid #dbeafe', padding: '2px 8px', borderRadius: '6px' }}>{bike.transmissionText}</span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                      {bike.name}
                    </h3>

                    <div style={{ fontSize: '13px', color: '#57484e', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Fuel style={{ width: '14px', height: '14px', color: '#1d4ed8' }} />
                      <span>{bike.engine} · {bike.fuelConsumption}</span>
                    </div>

                    {/* Route Recommendation Pill */}
                    <div style={{ background: '#fcf8fa', border: '1px solid #ebdce3', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#57484e', marginBottom: '20px' }}>
                      <strong style={{ color: '#0f172a' }}>Thích hợp:</strong> {bike.routes.split(',').slice(0, 2).join(',')}
                    </div>
                  </div>

                  <div>
                    {/* Price Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '14px', borderTop: '1px solid #ebdce3', marginBottom: '18px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#57484e', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Giá thuê ngày</div>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#1d4ed8' }}>
                          {bike.pricePerDay.toLocaleString('vi-VN')}₫
                        </span>
                      </div>

                      {bike.pricePerDay && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#57484e' }}>Thuê tháng chỉ</div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            {(bike.pricePerDay * 20).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBikeDetail(bike);
                          setActiveImageIndex(0);
                        }}
                        style={{
                          padding: '11px',
                          background: '#ffffff',
                          border: '1px solid #ebdce3',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#0f172a',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        Chi tiết xe
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingBike(bike)}
                        style={{
                          padding: '11px',
                          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#ffffff',
                          cursor: 'pointer',
                          boxShadow: '0 4px 14px rgba(29, 78, 216, 0.28)',
                        }}
                      >
                        Đặt xe ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBikes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fcf8fa', borderRadius: '16px', border: '1px solid #ebdce3' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Không tìm thấy xe phù hợp với bộ lọc
              </div>
              <p style={{ color: '#57484e', fontSize: '14px', marginBottom: '20px' }}>
                Vui lòng thử lại với từ khóa khác hoặc xóa bỏ các điều kiện lọc.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                style={{ padding: '12px 26px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(29, 78, 216, 0.25)' }}
              >
                Xem tất cả dòng xe
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          5. THE JOURNEY INCLUSIONS (Standard Gear Table)
          ======================================================== */}
      <section id="cam-ket" style={{ background: '#f5ebf0', borderTop: '1px solid #ebdce3', borderBottom: '1px solid #ebdce3', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#fcecf2', border: '1px solid #f7d1de', color: '#9d174d', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              🛡️ An tâm mọi hành trình
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Trọn bộ trang bị đi kèm mỗi hợp đồng thuê
            </h2>
            <p style={{ fontSize: '16px', color: '#57484e', margin: 0 }}>
              Không phụ phí ẩn. Mỗi xe bàn giao đều có đầy đủ trang thiết bị an toàn và giấy tờ pháp lý.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              {
                title: '02 Mũ bảo hiểm đạt chuẩn',
                desc: 'Mũ bảo hiểm nửa đầu chính hãng có tem kiểm định CR an toàn, vệ sinh sạch sẽ và thay lót định kỳ.'
              },
              {
                title: '02 Áo mưa tiện lợi',
                desc: 'Áo mưa dẻo dai xếp gọn sẵn trong cốp để bạn chủ động trước những cơn mưa bất chợt vùng duyên hải.'
              },
              {
                title: '01 Giá đỡ điện thoại kim loại',
                desc: 'Gắn chắc chắn vào chân gương chiếu hậu, hỗ trợ xem Google Maps tìm đường an toàn.'
              },
              {
                title: '01 Lít xăng châm sẵn',
                desc: 'Đủ nhiên liệu để bạn xuất phát ngay từ sân bay hoặc ga tàu đến cây xăng gần nhất.'
              },
              {
                title: 'Cứu hộ lưu động 24/7',
                desc: 'Hỗ trợ vá xe, cứu hộ hỏng hóc tận nơi trên toàn tuyến Đà Nẵng, Đèo Hải Vân và Phố Cổ Hội An.'
              },
              {
                title: 'Bảo hiểm xe máy dân sự',
                desc: 'Giấy chứng nhận bảo hiểm trách nhiệm dân sự bắt buộc của chủ xe cơ giới còn hiệu lực.'
              }
            ].map((item, idx) => (
              <div key={idx} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #ebdce3', boxShadow: '0 2px 10px rgba(157, 23, 77, 0.03)' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '13.5px', color: '#57484e', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. HOW IT WORKS (3 Clean Steps)
          ======================================================== */}
      <section id="quy-trinh" style={{ padding: '80px 24px', background: '#faf5f7' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#fcecf2', border: '1px solid #f7d1de', color: '#9d174d', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              ⚡ Nhanh chóng & Thuận tiện
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Quy trình thuê xe trong 3 bước
            </h2>
            <p style={{ fontSize: '16px', color: '#57484e', margin: 0 }}>
              Tiết kiệm tối đa thời gian của quý khách ngay khi hạ cánh tại Đà Nẵng.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }} className="search-grid-responsive">
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #ebdce3', boxShadow: '0 4px 14px rgba(157, 23, 77, 0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>1</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Chọn xe và lịch nhận
              </div>
              <p style={{ fontSize: '14px', color: '#57484e', lineHeight: 1.6, margin: 0 }}>
                Duyệt qua danh mục xe, chọn điểm nhận tại sân bay Đà Nẵng, ga xe lửa hoặc khách sạn quận Hải Châu, Sơn Trà.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #ebdce3', boxShadow: '0 4px 14px rgba(157, 23, 77, 0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>2</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Giao xe và kiểm tra kỹ thuật
              </div>
              <p style={{ fontSize: '14px', color: '#57484e', lineHeight: 1.6, margin: 0 }}>
                Kỹ thuật viên giao xe tận nơi đúng giờ hẹn, hướng dẫn vận hành và cùng bạn kiểm tra phanh, lốp, đèn tín hiệu.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #ebdce3', boxShadow: '0 4px 14px rgba(157, 23, 77, 0.04)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>3</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Ký số và nhận xe
              </div>
              <p style={{ fontSize: '14px', color: '#57484e', lineHeight: 1.6, margin: 0 }}>
                Xác thực bằng ảnh chụp CCCD hoặc hộ chiếu, ký hợp đồng điện tử 60 giây và khởi hành hành trình khám phá.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowContractPreview(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fcecf2',
                color: '#1d4ed8',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #ebdce3',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText style={{ width: '16px', height: '16px', color: '#1d4ed8' }} />
              <span>Xem trước mẫu hợp đồng cho thuê xe máy điện tử</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FAQ SECTION
          ======================================================== */}
      <section id="hoi-dap" style={{ background: '#f5ebf0', borderTop: '1px solid #ebdce3', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#fcecf2', border: '1px solid #f7d1de', color: '#9d174d', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              ❓ Câu hỏi phổ biến
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Những câu hỏi thường gặp
            </h2>
            <p style={{ fontSize: '16px', color: '#57484e', margin: 0 }}>
              Giải đáp minh bạch về thủ tục, địa điểm giao nhận và chính sách hỗ trợ.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {[
              {
                q: 'Thủ tục thuê xe cần những giấy tờ gì?',
                a: 'Quý khách chỉ cần có Căn cước công dân gắn chip hoặc Hộ chiếu (Passport) còn hiệu lực và Giấy phép lái xe hợp lệ. Nhân viên chỉ đối chiếu và chụp ảnh lưu hồ sơ điện tử, hoàn toàn không giữ bản gốc của quý khách.'
              },
              {
                q: 'Có cần phải đặt cọc tiền mặt không?',
                a: 'Khách du lịch có thông tin vé máy bay khứ hồi hoặc đặt phòng khách sạn tại Đà Nẵng được MIỄN THẾ CHẤP tiền mặt đối với hầu hết các dòng xe số và xe ga thông dụng.'
              },
              {
                q: 'Giao nhận xe tại Sân bay Đà Nẵng có tính phí không?',
                a: 'XTBike giao và nhận xe hoàn toàn miễn phí tại Sảnh đến Sân bay Quốc tế Đà Nẵng, Ga tàu hỏa và các khách sạn trong nội thành quận Hải Châu trong khung giờ từ 06:00 đến 22:00.'
              },
              {
                q: 'Nếu xe gặp sự cố trên Đèo Hải Vân thì hỗ trợ thế nào?',
                a: 'Đội cứu hộ lưu động của XTBike túc trực trên tuyến đường ven biển và đèo Hải Vân. Khi có sự cố lốp hay động cơ, kỹ thuật viên sẽ có mặt trong 30 đến 45 phút để khắc phục hoặc đổi xe mới tương đương.'
              }
            ].map((faq, fIdx) => (
              <div key={fIdx} style={{ background: '#ffffff', padding: '24px 28px', borderRadius: '12px', border: '1px solid #ebdce3' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  {faq.q}
                </div>
                <p style={{ fontSize: '14px', color: '#57484e', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          8. FOOTER — Modern Light Elegant Footer
          ======================================================== */}
      <footer style={{ background: '#f2e6eb', borderTop: '1px solid #ebdce3', color: '#57484e', padding: '70px 24px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '48px', marginBottom: '50px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', boxShadow: '0 4px 10px rgba(29, 78, 216, 0.25)' }}>
                  <Bike style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                </div>
                <span>XTBike Đà Nẵng</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#57484e', maxWidth: '420px', margin: '0 0 20px 0' }}>
                Dịch vụ cho thuê xe máy du lịch tự túc chất lượng cao tại TP Đà Nẵng. 100% xe đời mới bảo dưỡng định kỳ, giao nhận tận nơi và hỗ trợ cứu hộ 24/7.
              </p>
              <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700, background: '#fcecf2', border: '1px solid #f7d1de', display: 'inline-block', padding: '6px 14px', borderRadius: '8px' }}>
                Hotline giao xe: <span style={{ color: '#1d4ed8', fontWeight: 800 }}>0905 123 456</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                Địa chỉ và điểm giao nhận
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#57484e', margin: '0 0 8px 0' }}>
                📍 Cửa hàng: 08 Phan Chu Trinh, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng
              </p>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#57484e', margin: '0 0 8px 0' }}>
                ✈️ Sảnh đến: Sân bay Quốc tế Đà Nẵng (giao xe trong 15 phút)
              </p>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#57484e', margin: 0 }}>
                🚂 Ga đường sắt: 200 Hải Phòng, Tam Thuận, Thanh Khê, Đà Nẵng
              </p>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                Liên kết hệ thống
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', lineHeight: 2.2 }}>
                <li><a href="#danh-sach-xe" style={{ color: '#57484e', textDecoration: 'none', fontWeight: 600 }}>Bảng xe sẵn có</a></li>
                <li><a href="#tinh-lo-trinh" style={{ color: '#57484e', textDecoration: 'none', fontWeight: 600 }}>Bộ tính chi phí lộ trình</a></li>
                <li><Link href="/portal" style={{ color: '#9d174d', textDecoration: 'none', fontWeight: 700 }}>Cổng khách hàng (/portal)</Link></li>
                <li><Link href="/dashboard" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>Trang quản trị (/dashboard)</Link></li>
                <li><Link href="/login" style={{ color: '#57484e', textDecoration: 'none' }}>Đăng nhập nhân viên</Link></li>
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: '20px', borderTop: '1px solid #ebdce3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#8c7b83', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              © 2026 XTBike Platform Đà Nẵng. Toàn bộ xe máy được cấp phép hoạt động vận tải khách du lịch.
            </div>
            <div>
              Dịch vụ giao nhận xe máy tận nơi 06:00 - 22:00 hàng ngày.
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================
          MODAL: VEHICLE SPECIMEN DETAILS
          ======================================================== */}
      {selectedBikeDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedBikeDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '840px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px',
              border: '1px solid #ebdce3',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)'
            }}
          >
            {/* Top modal bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#9d174d', background: '#fcecf2', border: '1px solid #f7d1de', padding: '3px 10px', borderRadius: '6px' }}>{selectedBikeDetail.typeName}</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '8px 0 0 0' }}>
                  {selectedBikeDetail.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBikeDetail(null)}
                style={{ background: '#fcf8fa', border: '1px solid #ebdce3', borderRadius: '8px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X style={{ width: '20px', height: '20px', color: '#57484e' }} />
              </button>
            </div>

            {/* Gallery photo switcher */}
            <div style={{ height: '280px', borderRadius: '12px', overflow: 'hidden', background: '#f5ebf0', marginBottom: '14px', border: '1px solid #ebdce3' }}>
              <img
                src={selectedBikeDetail.gallery[activeImageIndex] || selectedBikeDetail.image}
                alt={selectedBikeDetail.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {selectedBikeDetail.gallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '64px',
                    height: '48px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: activeImageIndex === idx ? 1 : 0.6,
                    border: activeImageIndex === idx ? '2px solid #1d4ed8' : '1px solid #ebdce3'
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>

            {/* Technical Specifications Grid */}
            <div style={{ background: '#fcf8fa', border: '1px solid #ebdce3', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Thông số kỹ thuật tiêu chuẩn
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                <div><span style={{ color: '#57484e' }}>Động cơ:</span> <strong style={{ color: '#0f172a' }}>{selectedBikeDetail.engine}</strong></div>
                <div><span style={{ color: '#57484e' }}>Mức tiêu hao:</span> <strong style={{ color: '#0f172a' }}>{selectedBikeDetail.fuelConsumption}</strong></div>
                <div><span style={{ color: '#57484e' }}>Bình xăng:</span> <strong style={{ color: '#0f172a' }}>{selectedBikeDetail.specifications.tankCapacity}</strong></div>
                <div><span style={{ color: '#57484e' }}>Trọng lượng:</span> <strong style={{ color: '#0f172a' }}>{selectedBikeDetail.specifications.weight}</strong></div>
                <div><span style={{ color: '#57484e' }}>Hệ thống phanh:</span> <strong style={{ color: '#0f172a' }}>{selectedBikeDetail.specifications.brake}</strong></div>
                <div><span style={{ color: '#57484e' }}>Khởi động:</span> <strong style={{ color: '#0f172a' }}>{selectedBikeDetail.specifications.starter}</strong></div>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Mô tả và cảm giác lái
              </div>
              <p style={{ fontSize: '13.5px', color: '#57484e', lineHeight: 1.6, margin: 0 }}>
                {selectedBikeDetail.description}
              </p>
            </div>

            {/* Bottom Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #ebdce3' }}>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#1d4ed8' }}>
                  {selectedBikeDetail.pricePerDay.toLocaleString('vi-VN')}₫
                </span>
                <span style={{ fontSize: '13px', color: '#57484e' }}> / ngày</span>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedBikeDetail(null)}
                  style={{
                    padding: '12px 20px',
                    background: '#ffffff',
                    border: '1px solid #ebdce3',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    color: '#0f172a'
                  }}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bike = selectedBikeDetail;
                    setSelectedBikeDetail(null);
                    setBookingBike(bike);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    boxShadow: '0 4px 14px rgba(29, 78, 216, 0.28)'
                  }}
                >
                  Tiến hành đặt xe này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BOOKING WIZARD MODAL INTEGRATION
          ======================================================== */}
      {bookingBike && (
        <RentalWizard
          bike={bookingBike}
          onClose={() => setBookingBike(null)}
        />
      )}

      {/* ========================================================
          CONTRACT PREVIEW MODAL
          ======================================================== */}
      {showContractPreview && (
        <ContractPreviewModal
          onClose={() => setShowContractPreview(false)}
        />
      )}

    </div>
  );
}
