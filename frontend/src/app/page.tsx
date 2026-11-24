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
  UserCheck,
  Home,
  Tag,
  BookOpen,
  Bell,
  Play,
  ChevronDown,
  Headphones,
  Star,
  User
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
  rating?: number;
  reviewCount?: number;
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>

      {/* ========================================================
          1. HEADER NAVBAR (MotoRent Clean Modern Style)
          ======================================================== */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand mark */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
              <svg width="44" height="32" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 14H16M2 18H14M6 22H18" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="18" cy="22" r="6" stroke="#2563eb" strokeWidth="3" />
                <circle cx="38" cy="22" r="6" stroke="#2563eb" strokeWidth="3" />
                <path d="M18 22L26 10L32 10L38 22M26 10L22 6L28 6M26 15L36 15" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                MotoRent
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                Thuê xe dễ dàng
              </div>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="hidden-mobile">
            <a
              href="#"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#2563eb',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Home size={15} />
              <span>Trang chủ</span>
            </a>

            <a
              href="#danh-sach-xe"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1e293b',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s ease',
              }}
            >
              <Bike size={16} style={{ color: '#475569' }} />
              <span>Xe của chúng tôi</span>
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </a>

            <a
              href="#danh-sach-xe"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1e293b',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Tag size={15} style={{ color: '#475569' }} />
              <span>Bảng giá</span>
            </a>

            <a
              href="#quy-trinh"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1e293b',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <BookOpen size={15} style={{ color: '#475569' }} />
              <span>Hướng dẫn</span>
            </a>

            <a
              href="tel:0905123456"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#1e293b',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Phone size={15} style={{ color: '#475569' }} />
              <span>Liên hệ</span>
            </a>
          </nav>

          {/* Action / Auth Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => toast.success('Bạn không có thông báo mới nào')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s ease',
              }}
            >
              <Bell size={18} style={{ color: '#475569' }} />
              <span style={{ position: 'absolute', top: '9px', right: '9px', width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />
            </button>

            {mounted && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  href={user.role === 'customer' ? '/portal' : '/dashboard'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#2563eb',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  <User size={15} />
                  <span>{user.fullName?.split(' ').slice(-1)[0] || 'Tài khoản'}</span>
                </Link>
                <button
                  onClick={logout}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
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
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                <User size={15} />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          2. HERO SECTION — Panoramic Da Nang Han River & Dragon Bridge
          ======================================================== */}
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 45%, #ffffff 100%)',
          padding: '48px 24px 80px',
          overflow: 'hidden',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {/* Scenic Background image of Dragon Bridge Da Nang with soft overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&auto=format&fit=crop&q=80')`,
            backgroundPosition: 'center 40%',
            backgroundSize: 'cover',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '32px', alignItems: 'center' }}>
          
          {/* Left Column: Anchored Headline & CTA */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                color: '#1d4ed8',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '18px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
              }}
            >
              <MapPin size={15} style={{ color: '#2563eb' }} />
              <span>Thuê xe Moto tại Đà Nẵng</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4vw, 3.8rem)',
                fontWeight: 900,
                color: '#0f172a',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                margin: '0 0 16px 0',
              }}
            >
              Khám phá Đà Nẵng<br />
              <span style={{ color: '#0f172a' }}>cùng </span>
              <span style={{ color: '#1d4ed8' }}>MotoRent</span>
            </h1>

            <p style={{ fontSize: '17px', color: '#334155', lineHeight: 1.6, margin: '0 0 32px 0', maxWidth: '520px', fontWeight: 500 }}>
              Thuê xe máy nhanh chóng – Thủ tục đơn giản<br />
              – Giá tốt nhất!
            </p>

            {/* Action Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <a
                href="#danh-sach-xe"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '13px 28px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Thuê xe ngay</span>
                <ArrowRight size={17} />
              </a>

              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('quy-trinh');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  padding: '13px 22px',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Play size={11} fill="#2563eb" />
                </div>
                <span>Xem video</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual of Rider on Blue Sport Bike along Han River */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* Playful cursive calligraphy tag in top right */}
            <div
              style={{
                position: 'absolute',
                top: '-15px',
                right: '20px',
                zIndex: 15,
                transform: 'rotate(-4deg)',
                textAlign: 'right',
              }}
            >
              <div
                style={{
                  fontFamily: "'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif",
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#1d4ed8',
                  lineHeight: 1.15,
                  textShadow: '0 2px 6px rgba(255, 255, 255, 0.8)',
                }}
              >
                Tự do khám phá<br />
                Mọi hành trình!
              </div>
            </div>

            {/* Rider & Motorcycle showcase frame */}
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                height: '350px',
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
                border: '4px solid #ffffff',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1000&auto=format&fit=crop&q=80"
                alt="Khám phá Đà Nẵng cùng MotoRent"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.6) 0%, transparent 40%)',
                }}
              />
              <div style={{ position: 'absolute', bottom: '16px', left: '20px', right: '20px', color: '#ffffff' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd' }}>
                  Cung đường biển Đà Nẵng & Đèo Hải Vân
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800 }}>
                  Trải nghiệm tự do khám phá miền duyên hải
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. FLOATING BOOKING SEARCH BAR (Overlapping Hero)
          ======================================================== */}
      <div style={{ maxWidth: '1240px', margin: '-38px auto 36px', position: 'relative', zIndex: 30, padding: '0 24px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.2fr 0.9fr',
            gap: '14px',
            alignItems: 'center',
          }}
          className="search-grid-responsive"
        >
          {/* 1. Ngày nhận xe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
              <Calendar size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Ngày nhận xe</div>
              <input
                type="date"
                value={pickupDate || '2025-04-24'}
                onChange={e => setPickupDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '13.5px', color: '#0f172a', outline: 'none', cursor: 'pointer', width: '100%', padding: 0 }}
              />
            </div>
          </div>

          {/* 2. Ngày trả xe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
              <Calendar size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Ngày trả xe</div>
              <input
                type="date"
                value={returnDate || '2025-04-25'}
                onChange={e => setReturnDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '13.5px', color: '#0f172a', outline: 'none', cursor: 'pointer', width: '100%', padding: 0 }}
              />
            </div>
          </div>

          {/* 3. Chọn loại xe */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
              <Bike size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Chọn loại xe</div>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '13.5px', color: '#0f172a', outline: 'none', cursor: 'pointer', width: '100%', padding: 0 }}
              >
                <option value="all">Tất cả loại xe</option>
                <option value="scooter">Xe tay ga</option>
                <option value="manual">Xe số</option>
                <option value="clutch">Xe côn tay</option>
              </select>
            </div>
          </div>

          {/* 4. Nút Tìm kiếm */}
          <a
            href="#danh-sach-xe"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#2563eb',
              color: '#ffffff',
              height: '52px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'background 0.15s ease',
            }}
          >
            <Search size={18} />
            <span>Tìm kiếm</span>
          </a>
        </div>
      </div>

      {/* ========================================================
          4. FOUR VALUE PROPOSITIONS (Horizontal Trust Row)
          ======================================================== */}
      <div style={{ maxWidth: '1240px', margin: '0 auto 48px', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="search-grid-responsive">
          {/* Value 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>Thủ tục nhanh gọn</div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>Chỉ 5 phút</div>
            </div>
          </div>

          {/* Value 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>Xe chất lượng</div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>Được bảo dưỡng định kỳ</div>
            </div>
          </div>

          {/* Value 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Headphones size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>Hỗ trợ 24/7</div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>Luôn đồng hành cùng bạn</div>
            </div>
          </div>

          {/* Value 4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Tag size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>Giá tốt nhất</div>
              <div style={{ fontSize: '12.5px', color: '#64748b' }}>Cam kết cạnh tranh</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. DÒNG XE ĐƯỢC YÊU THÍCH (Specimen Catalogue)
          ======================================================== */}
      <section id="danh-sach-xe" style={{ padding: '0 24px 60px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                Dòng xe được yêu thích
              </h2>
              <div style={{ height: '3.5px', width: '56px', background: '#2563eb', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative', width: '240px' }} className="hidden-mobile">
                <Search size={15} style={{ color: '#94a3b8', position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Tìm Vision, SH, Lead..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    fontSize: '13px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                  }}
                />
              </div>

              <a
                href="#danh-sach-xe"
                onClick={() => {
                  setSelectedType('all');
                  setSearchQuery('');
                }}
                style={{
                  color: '#2563eb',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Xem tất cả</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
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
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: selectedType === tab.id ? 'none' : '1px solid #e2e8f0',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: selectedType === tab.id ? '#2563eb' : '#ffffff',
                  color: selectedType === tab.id ? '#ffffff' : '#475569',
                  boxShadow: selectedType === tab.id ? '0 2px 10px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vehicle Specimen Tiles Grid matching exactly the screenshot cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
            {filteredBikes.map(bike => (
              <div
                key={bike.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(bike.id)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  }}
                  title={isFavorite(bike.id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                >
                  <Heart style={{ width: '16px', height: '16px', color: isFavorite(bike.id) ? '#dc2626' : '#94a3b8', fill: isFavorite(bike.id) ? '#dc2626' : 'none' }} />
                </button>

                {/* Top Area: Vehicle Image */}
                <div>
                  <div
                    onClick={() => {
                      setSelectedBikeDetail(bike);
                      setActiveImageIndex(0);
                    }}
                    style={{
                      height: '160px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      position: 'relative',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '10px',
                    }}
                  >
                    <img
                      src={bike.image}
                      alt={bike.name}
                      loading="lazy"
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />

                    {bike.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid #dbeafe',
                        }}
                      >
                        ✓ {bike.badge}
                      </span>
                    )}
                  </div>

                  {/* Vehicle Name */}
                  <h3
                    onClick={() => {
                      setSelectedBikeDetail(bike);
                      setActiveImageIndex(0);
                    }}
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 6px 0',
                      cursor: 'pointer',
                      lineHeight: 1.3,
                    }}
                  >
                    {bike.name}
                  </h3>

                  {/* Star Rating & Reviews */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '16px', fontSize: '12.5px', color: '#64748b' }}>
                    <Star size={14} style={{ fill: '#eab308', color: '#eab308' }} />
                    <strong style={{ color: '#0f172a' }}>{bike.rating || 4.8}</strong>
                    <span>({bike.reviewCount || 95} đánh giá)</span>
                  </div>
                </div>

                {/* Bottom Row: Price & Thuê ngay Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                      {bike.pricePerDay.toLocaleString('vi-VN')}đ
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}> /ngày</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBookingBike(bike)}
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    Thuê ngay
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredBikes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', marginTop: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Không tìm thấy xe phù hợp với bộ lọc
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                Vui lòng thử lại với từ khóa khác hoặc xóa bỏ các điều kiện lọc.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                style={{ padding: '12px 26px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
              >
                Xem tất cả dòng xe
              </button>
            </div>
          )}

          {/* ========================================================
              BOTTOM PROMO / CTA BANNER (MotoRent Companion Banner)
              ======================================================== */}
          <div style={{ marginTop: '48px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                borderRadius: '20px',
                padding: '28px 36px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                boxShadow: '0 10px 30px rgba(37, 99, 235, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
              className="search-grid-responsive"
            >
              {/* Graphic Silhouette Backdrop */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '35%',
                  opacity: 0.18,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg viewBox="0 0 200 80" fill="none" style={{ width: '100%', height: '100%' }}>
                  <path d="M0 60 L40 20 L80 60 L120 10 L160 60 L200 30" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M0 70 Q 50 30, 100 70 T 200 70" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              {/* Text & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', zIndex: 5 }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bike size={32} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
                    MotoRent – Đồng hành cùng bạn trên mọi nẻo đường!
                  </h3>
                  <p style={{ fontSize: '14px', margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                    Thuê xe dễ dàng, khám phá Đà Nẵng trọn vẹn hơn
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (filteredBikes.length > 0) {
                    setBookingBike(filteredBikes[0]);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#ffffff',
                  color: '#1d4ed8',
                  padding: '12px 28px',
                  borderRadius: '30px',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 5,
                }}
              >
                <span>Đặt xe ngay</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
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
