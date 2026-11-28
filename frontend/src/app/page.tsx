'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { handleImageError, resolveMediaUrl, resolveVehicleImage } from '@/lib/media';
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
  User,
  MessageCircle,
  ChevronLeft
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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
    badge: 'Còn xe',
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

function toCatalogBike(vehicle: any): Motorbike {
  const fallback = MOTORBIKES.find(bike => bike.type === vehicle.type) || MOTORBIKES[0];
  const image = resolveVehicleImage(vehicle, fallback.image);
  const pricePerDay = Number(vehicle.pricePerDay || 0);
  const type = vehicle.type === 'semi-automatic' ? 'manual' : vehicle.type === 'sport' ? 'clutch' : vehicle.type;
  const typeName = type === 'scooter' ? 'Xe tay ga' : type === 'manual' ? 'Xe số' : type === 'electric' ? 'Xe điện' : 'Xe côn tay';
  const rawGallery = Array.isArray(vehicle.images) && vehicle.images.length > 0
    ? vehicle.images.map((item: any) => resolveMediaUrl(item)).filter(Boolean)
    : [];
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
    gallery: rawGallery.length > 0 ? rawGallery : [image],
    engine: vehicle.engineCC ? `${vehicle.engineCC}cc` : 'Động cơ xe máy',
    conditionTag: vehicle.condition === 'excellent' ? 'Xe mới' : 'Xe bảo dưỡng định kỳ',
    description: vehicle.description || fallback.description,
    features: vehicle.features?.length ? vehicle.features : fallback.features,
    specifications: { ...fallback.specifications, year: `Đời ${vehicle.year || '2024'}` },
  };
}

export default function HomePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [homeNotifs, setHomeNotifs] = useState<any[]>([]);
  const [homeUnreadCount, setHomeUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadHomeNotifications = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setHomeNotifs([]);
      setHomeUnreadCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setHomeNotifs(list);
      setHomeUnreadCount(res.data?.unreadCount ?? list.filter((n: any) => !n.isRead).length);
    } catch {
      // Ignore unauthenticated errors
    }
  };

  useEffect(() => {
    if (!mounted || !user) return;
    loadHomeNotifications();
    const timer = window.setInterval(loadHomeNotifications, 20000);
    return () => window.clearInterval(timer);
  }, [mounted, user]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
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
  const [availabilityRefreshTick, setAvailabilityRefreshTick] = useState(0);
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
  }, [availabilityRefreshTick]);

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
          1. HEADER NAVBAR (XTMotoBike Soft Blue Modern Style)
          ======================================================== */}
      <header
        style={{
          background: 'rgba(239, 246, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #bfdbfe',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 12px rgba(37, 99, 235, 0.06)',
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
                XTMotoBike
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

            {/* Vehicle Type Dropdown Button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: showVehicleDropdown ? '#2563eb' : '#1e293b',
                  background: showVehicleDropdown ? '#eff6ff' : 'transparent',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Bike size={16} style={{ color: showVehicleDropdown ? '#2563eb' : '#475569' }} />
                <span>Xe của chúng tôi</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: showVehicleDropdown ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    opacity: 0.7,
                  }}
                />
              </button>

              {showVehicleDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
                    padding: '8px',
                    minWidth: '220px',
                    zIndex: 100,
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 12px 4px' }}>
                    Chọn dòng xe bạn muốn
                  </div>
                  {[
                    { id: 'all', label: 'Tất cả các dòng xe', count: '8 mẫu xe đời 2024' },
                    { id: 'scooter', label: 'Xe tay ga (Scooter)', count: 'Vision, Lead, SH, Air Blade' },
                    { id: 'manual', label: 'Xe số (Manual)', count: 'Wave Alpha, Sirius FI' },
                    { id: 'clutch', label: 'Xe côn tay / Sport', count: 'Exciter 155, CBR150R' },
                    ...(favoriteIds.length > 0 ? [{ id: 'favorites', label: 'Xe yêu thích', count: `${favoriteIds.length} xe đã lưu` }] : [])
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(item.id);
                        setShowVehicleDropdown(false);
                        const target = document.getElementById('danh-sach-xe');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: selectedType === item.id ? '#eff6ff' : 'transparent',
                        color: selectedType === item.id ? '#2563eb' : '#0f172a',
                        cursor: 'pointer',
                        display: 'block',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: '11.5px', color: selectedType === item.id ? '#3b82f6' : '#64748b', marginTop: '2px' }}>{item.count}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

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

            {/* Contact Popover Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowContactDropdown(!showContactDropdown)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: showContactDropdown ? '#2563eb' : '#1e293b',
                  background: showContactDropdown ? '#eff6ff' : 'transparent',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Phone size={15} style={{ color: showContactDropdown ? '#2563eb' : '#475569' }} />
                <span>Liên hệ</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: showContactDropdown ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    opacity: 0.7,
                  }}
                />
              </button>

              {showContactDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.15)',
                    padding: '16px',
                    width: '300px',
                    zIndex: 100,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                      <Phone size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Hotline Tư Vấn & Đặt Xe</div>
                      <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>● Hỗ trợ 24/7 trực tuyến</div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                      Số điện thoại đặt xe trực tiếp
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb', letterSpacing: '0.5px' }}>
                      0905 123 456
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <a
                      href="tel:0905123456"
                      onClick={() => setShowContactDropdown(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#2563eb',
                        color: '#ffffff',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                      }}
                    >
                      <Phone size={15} />
                      Gọi ngay: 0905 123 456
                    </a>

                    <a
                      href="https://zalo.me/0905123456"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowContactDropdown(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '9px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        border: '1px solid #bfdbfe',
                      }}
                    >
                      <span>💬 Nhắn tin Zalo tư vấn</span>
                    </a>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '11.5px', color: '#64748b', lineHeight: 1.5 }}>
                    📍 <strong>Điểm giao xe:</strong> Sân bay, Ga tàu & Khách sạn TP Đà Nẵng (giao xe trong 15 phút).
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Action / Auth Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-label="Mở thông báo"
                onClick={() => {
                  const next = !showNotifDropdown;
                  setShowNotifDropdown(next);
                  if (next && user) loadHomeNotifications();
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: showNotifDropdown ? '#eff6ff' : '#f1f5f9',
                  border: showNotifDropdown ? '1px solid #bfdbfe' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.15s ease',
                }}
              >
                <Bell size={18} style={{ color: showNotifDropdown ? '#2563eb' : '#475569' }} />
                {mounted && user && homeUnreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      minWidth: '17px',
                      height: '17px',
                      borderRadius: '999px',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                    }}
                  >
                    {homeUnreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '340px',
                    maxWidth: 'calc(100vw - 24px)',
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                      Thông báo {mounted && user ? `(${homeUnreadCount} mới)` : ''}
                    </strong>
                    {mounted && user && homeUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          setHomeNotifs(prev => prev.map(x => ({ ...x, isRead: true })));
                          setHomeUnreadCount(0);
                          try { await api.put('/notifications/read-all'); } catch {}
                        }}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  {!mounted || !user ? (
                    <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                      <div>Vui lòng đăng nhập để xem thông báo của bạn.</div>
                      <Link
                        href="/login"
                        onClick={() => setShowNotifDropdown(false)}
                        style={{ display: 'inline-block', marginTop: '10px', padding: '7px 14px', borderRadius: '8px', background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '12px', textDecoration: 'none' }}
                      >
                        Đăng nhập
                      </Link>
                    </div>
                  ) : homeNotifs.length === 0 ? (
                    <div style={{ padding: '22px 14px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                      Hiện tại bạn chưa có thông báo mới nào.
                    </div>
                  ) : (
                    <>
                      <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {homeNotifs.slice(0, 8).map((n: any) => (
                          <div
                            key={n._id}
                            onClick={async () => {
                              setHomeNotifs(prev => prev.map(x => (x._id === n._id ? { ...x, isRead: true } : x)));
                              if (!n.isRead) setHomeUnreadCount(c => Math.max(0, c - 1));
                              try { await api.put(`/notifications/${n._id}/read`); } catch {}
                              setShowNotifDropdown(false);
                              const fallbackDest = user.role === 'customer' ? '/portal' : user.role === 'technician' ? '/technician' : '/dashboard/notifications';
                              router.push(n.link || fallbackDest);
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              background: n.isRead ? '#f8fafc' : '#eff6ff',
                              border: n.isRead ? '1px solid #f1f5f9' : '1px solid #bfdbfe',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: '12.5px', fontWeight: n.isRead ? 600 : 800, color: '#0f172a' }}>{n.title}</div>
                            {n.message && <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>{n.message}</div>}
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', background: '#f8fafc', textAlign: 'center' }}>
                        <Link
                          href={user.role === 'customer' ? '/portal' : user.role === 'technician' ? '/technician' : '/dashboard/notifications'}
                          onClick={() => setShowNotifDropdown(false)}
                          style={{ color: '#2563eb', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                        >
                          Xem tất cả thông báo →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

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
              <span style={{ color: '#1d4ed8' }}>XTMotoBike</span>
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
                alt="Khám phá Đà Nẵng cùng XTMotoBike"
                onError={handleImageError()}
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
                      src={resolveMediaUrl(bike.image)}
                      alt={bike.name}
                      loading="lazy"
                      onError={handleImageError()}
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
              BOTTOM PROMO / CTA BANNER (XTMotoBike Companion Banner)
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
                    XTMotoBike – Đồng hành cùng bạn trên mọi nẻo đường!
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
      <section id="cam-ket" style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              🛡️ An tâm mọi hành trình
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Trọn bộ trang bị đi kèm mỗi hợp đồng thuê
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
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
              <div key={idx} style={{ background: '#f8fafc', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  {item.title}
                </div>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
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
      <section id="quy-trinh" style={{ padding: '80px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              ⚡ Nhanh chóng & Thuận tiện
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Quy trình thuê xe trong 3 bước
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
              Tiết kiệm tối đa thời gian của quý khách ngay khi hạ cánh tại Đà Nẵng.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }} className="search-grid-responsive">
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>1</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Chọn xe và lịch nhận
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Duyệt qua danh mục xe, chọn điểm nhận tại sân bay Đà Nẵng, ga xe lửa hoặc khách sạn quận Hải Châu, Sơn Trà.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>2</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Giao xe và kiểm tra kỹ thuật
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                Kỹ thuật viên giao xe tận nơi đúng giờ hẹn, hướng dẫn vận hành và cùng bạn kiểm tra phanh, lốp, đèn tín hiệu.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', marginBottom: '16px' }}>3</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Ký số và nhận xe
              </div>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
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
                background: '#eff6ff',
                color: '#2563eb',
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #dbeafe',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              <span>Xem trước mẫu hợp đồng cho thuê xe máy điện tử</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. FAQ SECTION
          ======================================================== */}
      <section id="hoi-dap" style={{ background: '#ffffff', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
              ❓ Câu hỏi phổ biến
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.2rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>
              Những câu hỏi thường gặp
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
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
                a: 'XTMotoBike giao và nhận xe hoàn toàn miễn phí tại Sảnh đến Sân bay Quốc tế Đà Nẵng, Ga tàu hỏa và các khách sạn trong nội thành quận Hải Châu trong khung giờ từ 06:00 đến 22:00.'
              },
              {
                q: 'Nếu xe gặp sự cố trên Đèo Hải Vân thì hỗ trợ thế nào?',
                a: 'Đội cứu hộ lưu động của XTMotoBike túc trực trên tuyến đường ven biển và đèo Hải Vân. Khi có sự cố lốp hay động cơ, kỹ thuật viên sẽ có mặt trong 30 đến 45 phút để khắc phục hoặc đổi xe mới tương đương.'
              }
            ].map((faq, fIdx) => (
              <div key={fIdx} style={{ background: '#f8fafc', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  {faq.q}
                </div>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          7.5 STORE LOCATION MAP (Nằm trên Footer)
          ======================================================== */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px 28px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                📍
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '0 0 3px' }}>
                  Vị trí cửa hàng XTMotoBike Đà Nẵng
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                  08 Phan Chu Trinh, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng (Cách Cầu Rồng 800m, Sân bay 2km)
                </p>
              </div>
            </div>
            
            <a
              href="https://maps.google.com/?q=08+Phan+Chu+Trinh,+H%E1%BA%A3i+Ch%C3%A2u+1,+H%E1%BA%A3i+Ch%C3%A2u,+%C4%90%C3%A0+N%E1%BA%B5ng"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#2563eb',
                textDecoration: 'none',
                background: '#eff6ff',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
              }}
            >
              <span>🗺️ Mở Google Maps chỉ đường &rarr;</span>
            </a>
          </div>
          
          <div style={{ borderRadius: '14px', overflow: 'hidden', height: '320px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            <iframe
              title="Bản đồ cửa hàng XTMotoBike Đà Nẵng"
              src="https://maps.google.com/maps?q=08%20Phan%20Chu%20Trinh,%20H%E1%BA%A3i%20Ch%C3%A2u%201,%20H%E1%BA%A3i%20Ch%C3%A2u,%20%C4%90%C3%A0%20N%E1%BA%B5ng&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ========================================================
          8. FOOTER — Modern Soft Light Blue Theme
          ======================================================== */}
      <footer style={{ background: '#f0f7ff', borderTop: '1px solid #bfdbfe', color: '#64748b', padding: '70px 24px 40px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 1fr', gap: '36px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)' }}>
                  <Bike style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                </div>
                <span>XTMotoBike Đà Nẵng</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#475569', maxWidth: '380px', margin: '0 0 16px 0' }}>
                Dịch vụ cho thuê xe máy du lịch tự túc chất lượng cao tại TP Đà Nẵng. 100% xe đời mới bảo dưỡng định kỳ, giao nhận tận nơi và hỗ trợ cứu hộ 24/7.
              </p>
              <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700, background: '#eff6ff', border: '1px solid #dbeafe', display: 'inline-block', padding: '6px 14px', borderRadius: '8px' }}>
                Hotline giao xe: <span style={{ color: '#2563eb', fontWeight: 800 }}>0905 123 456</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                Địa chỉ và điểm giao nhận
              </div>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#475569', margin: '0 0 8px 0' }}>
                📍 Cửa hàng: 08 Phan Chu Trinh, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng
              </p>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#475569', margin: '0 0 8px 0' }}>
                ✈️ Sảnh đến: Sân bay Quốc tế Đà Nẵng (giao xe trong 15 phút)
              </p>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                🚂 Ga đường sắt: 200 Hải Phòng, Tam Thuận, Thanh Khê, Đà Nẵng
              </p>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                Liên kết hệ thống
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', lineHeight: 2.2 }}>
                <li><a href="#danh-sach-xe" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Bảng xe sẵn có</a></li>
                <li><Link href="/portal" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>Cổng khách hàng (/portal)</Link></li>
                <li><Link href="/technician" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>Trang kỹ thuật viên (/technician)</Link></li>
                <li><Link href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700 }}>Trang quản trị (/dashboard)</Link></li>
                <li><Link href="/login" style={{ color: '#64748b', textDecoration: 'none' }}>Đăng nhập nhân viên</Link></li>
              </ul>
            </div>
          </div>

          <div style={{ paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#94a3b8', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              © 2026 XTMotoBike Platform Đà Nẵng. Toàn bộ xe máy được cấp phép hoạt động vận tải khách du lịch.
            </div>
            <div>
              Dịch vụ giao nhận xe máy tận nơi 06:00 - 22:00 hàng ngày.
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================
          MODAL: VEHICLE SPECIMEN DETAILS (Modern Card / Split Layout)
          ======================================================== */}
      {selectedBikeDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedBikeDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '1180px',
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              padding: '24px 28px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
              position: 'relative'
            }}
          >
            {/* Top Bar with Icon, Title, Rating, Count & Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Bike size={24} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {selectedBikeDetail.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', color: '#64748b', fontWeight: 600 }}>
                  <span style={{ color: '#eab308' }}>★</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>4.9</span>
                  <span>(120 đánh giá)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748b' }}>
                  <span>|</span>
                  <span>👁️ Đã thuê 1.2k+ lượt</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBikeDetail(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Main Content Grid: Left 2 Cols (Gallery + Specs) & Right Col (Booking Box) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 340px', gap: '24px', marginBottom: '24px' }}>
              
              {/* Column 1: Image Gallery */}
              <div>
                <div
                  style={{
                    height: '290px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#f8fafc',
                    position: 'relative',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={resolveMediaUrl(selectedBikeDetail.gallery[activeImageIndex] || selectedBikeDetail.image)}
                    alt={selectedBikeDetail.name}
                    onError={handleImageError()}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Badge Còn xe */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <span>✓</span> Còn xe
                  </div>

                  {/* Prev / Next Arrows */}
                  {selectedBikeDetail.gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(prev => prev > 0 ? prev - 1 : selectedBikeDetail.gallery.length - 1);
                        }}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <ChevronLeft size={18} color="#0f172a" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex(prev => prev < selectedBikeDetail.gallery.length - 1 ? prev + 1 : 0);
                        }}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <ChevronRight size={18} color="#0f172a" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
                  {selectedBikeDetail.gallery.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        height: '64px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: activeImageIndex === idx ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        opacity: activeImageIndex === idx ? 1 : 0.65,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <img src={resolveMediaUrl(img)} alt="" onError={handleImageError()} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Specs, Description & Rental Conditions */}
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                  {selectedBikeDetail.name}
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
                  Đẳng cấp – Tiện nghi – Thoải mái trên mọi hành trình
                </div>

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: '#2563eb' }}>
                    {selectedBikeDetail.pricePerDay.toLocaleString('vi-VN')}đ
                  </span>
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>/ ngày</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, marginBottom: '16px' }}>
                  <span>🏷️ Giá thuê tốt nhất tại Đà Nẵng!</span>
                </div>

                {/* 4 Feature Badges (Dung tích, Tốc độ, Tiêu hao, Hộp số) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px 6px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '16px', textAlign: 'center' }}>
                  <div>
                    <div style={{ color: '#2563eb', display: 'flex', justifyContent: 'center', marginBottom: '2px' }}><Bike size={18} /></div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>{selectedBikeDetail.engine.split(' ')[0] || '125cc'}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Dung tích</div>
                  </div>
                  <div>
                    <div style={{ color: '#2563eb', display: 'flex', justifyContent: 'center', marginBottom: '2px' }}><Gauge size={18} /></div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>~ 115 km/h</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Tốc độ tối đa</div>
                  </div>
                  <div>
                    <div style={{ color: '#2563eb', display: 'flex', justifyContent: 'center', marginBottom: '2px' }}><Fuel size={18} /></div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>{selectedBikeDetail.fuelConsumption.split(' ')[0] || '2.0L/100km'}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Mức tiêu hao</div>
                  </div>
                  <div>
                    <div style={{ color: '#2563eb', display: 'flex', justifyContent: 'center', marginBottom: '2px' }}><PackageCheck size={18} /></div>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>{selectedBikeDetail.transmissionText || 'Tự động'}</div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>Hộp số</div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '4px', borderLeft: '3px solid #2563eb', paddingLeft: '8px' }}>
                    Mô tả xe
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {selectedBikeDetail.description}
                  </p>
                </div>

                {/* Rental Conditions */}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', borderLeft: '3px solid #2563eb', paddingLeft: '8px' }}>
                    Điều kiện thuê
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> CMND/CCCD hoặc giấy tờ tùy thân hợp lệ</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Đặt cọc 1.000.000đ - 2.000.000đ (hoàn trả ngay sau khi trả xe)</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> Tuân thủ luật giao thông và quy định của cửa hàng</li>
                  </ul>
                </div>
              </div>

              {/* Column 3: Booking Form Card */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>
                    <Calendar size={18} color="#2563eb" />
                    <span>Đặt thuê xe</span>
                  </div>

                  {/* Ngày nhận xe */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Ngày nhận xe
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px', background: '#f8fafc' }}>
                      <Calendar size={15} color="#64748b" />
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={e => setPickupDate(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 600, color: '#0f172a', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Ngày trả xe */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Ngày trả xe
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px', background: '#f8fafc' }}>
                      <Calendar size={15} color="#64748b" />
                      <input
                        type="date"
                        value={returnDate}
                        onChange={e => setReturnDate(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 600, color: '#0f172a', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Thời gian thuê */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Thời gian thuê
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        <Clock size={15} color="#64748b" />
                        <span>{plannedDays} ngày</span>
                      </div>
                      <select
                        value={plannedDays}
                        onChange={e => setPlannedDays(Number(e.target.value))}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12.5px', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {[1, 2, 3, 4, 5, 7, 10, 14, 30].map(d => (
                          <option key={d} value={d}>{d} ngày</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '12px', borderTop: '1px solid #f1f5f9', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Tổng tiền</span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>
                      {(selectedBikeDetail.pricePerDay * plannedDays).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const bike = selectedBikeDetail;
                      setSelectedBikeDetail(null);
                      setBookingBike(bike);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <Calendar size={16} />
                    <span>Đặt thuê ngay &rarr;</span>
                  </button>

                  <a
                    href="https://zalo.me/0905123456"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#ffffff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>Chat với cửa hàng</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Section: Customer Reviews & Promo Banner */}
            <div style={{ paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  <MessageCircle size={18} color="#2563eb" />
                  <span>Đánh giá từ khách hàng</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Đang hiển thị đánh giá xác thực từ hệ thống')}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Xem tất cả đánh giá &rarr;
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 280px', gap: '16px' }}>
                {/* Review 1 */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1d4ed8', fontSize: '13px' }}>
                      M
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Nguyễn Văn Minh</div>
                      <div style={{ fontSize: '11px', color: '#eab308' }}>★★★★★ <span style={{ color: '#0f172a', fontWeight: 700 }}>5.0</span></div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 4px', fontStyle: 'italic' }}>
                    "Xe rất đẹp, dịch vụ chuyên nghiệp!"
                  </p>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>12/04/2026</div>
                </div>

                {/* Review 2 */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#b91c1c', fontSize: '13px' }}>
                      H
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Trần Thị Hà</div>
                      <div style={{ fontSize: '11px', color: '#eab308' }}>★★★★★ <span style={{ color: '#0f172a', fontWeight: 700 }}>5.0</span></div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 4px', fontStyle: 'italic' }}>
                    "Thủ tục nhanh gọn, giá hợp lý."
                  </p>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>08/04/2026</div>
                </div>

                {/* Review 3 */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4338ca', fontSize: '13px' }}>
                      N
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Lê Hoàng Nam</div>
                      <div style={{ fontSize: '11px', color: '#eab308' }}>★★★★★ <span style={{ color: '#0f172a', fontWeight: 700 }}>5.0</span></div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 4px', fontStyle: 'italic' }}>
                    "Sẽ tiếp tục ủng hộ XTMotoBike!"
                  </p>
                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>05/04/2026</div>
                </div>

                {/* Promo Card: Thuê xe Moto tại Đà Nẵng */}
                <div
                  style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)',
                    padding: '14px',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 800, fontStyle: 'italic' }}>
                      Thuê xe Moto tại Đà Nẵng
                    </div>
                    <div style={{ fontSize: '11.5px', opacity: 0.9, marginTop: '2px' }}>
                      Khám phá thành phố biển cùng XTMotoBike!
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const bike = selectedBikeDetail;
                      setSelectedBikeDetail(null);
                      setBookingBike(bike);
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#1d4ed8',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                      marginTop: '8px'
                    }}
                  >
                    Khám phá ngay &rarr;
                  </button>
                </div>
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
          onCompleted={() => setAvailabilityRefreshTick((t) => t + 1)}
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
