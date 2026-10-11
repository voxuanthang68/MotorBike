'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Motorbike {
  id: string;
  name: string;
  brand: string;
  type: 'scooter' | 'manual' | 'clutch';
  typeName: string;
  pricePerDay: number;
  engine: string;
  fuelConsumption: string;
  image: string;
  popular?: boolean;
  features: string[];
}

const MOTORBIKES: Motorbike[] = [
  {
    id: '1',
    name: 'Honda Vision 2024 Smartkey',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga',
    pricePerDay: 130000,
    engine: '110cc',
    fuelConsumption: '1.87 L/100km',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    popular: true,
    features: ['Khóa Smartkey', 'Cốp rộng 16L', 'Trọng lượng nhẹ', 'Phù hợp nữ & du lịch']
  },
  {
    id: '2',
    name: 'Honda Air Blade 125cc LED',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga',
    pricePerDay: 150000,
    engine: '125cc',
    fuelConsumption: '2.14 L/100km',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    popular: true,
    features: ['Khóa Smartkey', 'Động cơ eSP+ 4 van', 'Phanh ABS an toàn', 'Cốp 22.7L']
  },
  {
    id: '3',
    name: 'Honda Lead 125 Cốp Khủng',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga',
    pricePerDay: 140000,
    engine: '125cc',
    fuelConsumption: '2.16 L/100km',
    image: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&auto=format&fit=crop&q=80',
    features: ['Cốp siêu to 37L', 'Cổng sạc USB', 'Tiết kiệm xăng', 'Sàn để chân rộng']
  },
  {
    id: '4',
    name: 'Honda SH Mode 125 ABS',
    brand: 'Honda',
    type: 'scooter',
    typeName: 'Xe tay ga cao cấp',
    pricePerDay: 220000,
    engine: '125cc',
    fuelConsumption: '2.12 L/100km',
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    popular: true,
    features: ['Phanh ABS an toàn', 'Sang trọng đẳng cấp', 'Động cơ eSP+', 'Êm ái lướt phố']
  },
  {
    id: '5',
    name: 'Honda Wave Alpha 110cc',
    brand: 'Honda',
    type: 'manual',
    typeName: 'Xe số',
    pricePerDay: 90000,
    engine: '110cc',
    fuelConsumption: '1.72 L/100km',
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&auto=format&fit=crop&q=80',
    popular: true,
    features: ['Tiết kiệm xăng vượt trội', 'Bền bỉ leo dốc Đèo Hải Vân', 'Dễ lái', 'Chi phí tiết kiệm nhất']
  },
  {
    id: '6',
    name: 'Yamaha Sirius 110 FI',
    brand: 'Yamaha',
    type: 'manual',
    typeName: 'Xe số',
    pricePerDay: 100000,
    engine: '115cc',
    fuelConsumption: '1.65 L/100km',
    image: 'https://images.unsplash.com/photo-1615172282427-9a57ef2d142e?w=800&auto=format&fit=crop&q=80',
    features: ['Phun xăng điện tử FI', 'Máy bốc tăng tốc nhanh', 'Leo đèo khỏe', 'Vành đúc thể thao']
  },
  {
    id: '7',
    name: 'Honda Winner X 150 ABS',
    brand: 'Honda',
    type: 'clutch',
    typeName: 'Xe côn tay',
    pricePerDay: 180000,
    engine: '150cc',
    fuelConsumption: '1.99 L/100km',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    popular: true,
    features: ['Côn tay thể thao', 'Phanh ABS chống bó cứng', 'Động cơ DOHC 6 số', 'Chuyên phượt Sơn Trà - Hải Vân']
  },
  {
    id: '8',
    name: 'Yamaha Exciter 155 VVA',
    brand: 'Yamaha',
    type: 'clutch',
    typeName: 'Xe côn tay',
    pricePerDay: 190000,
    engine: '155cc',
    fuelConsumption: '2.09 L/100km',
    image: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
    features: ['Van biến thiên VVA', 'Bộ ly hợp chống trượt Assist & Slipper', 'Khóa Smartkey', 'Công suất mạnh mẽ']
  }
];

export default function HomePage() {
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [pickupDate, setPickupDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('Sân bay Đà Nẵng');
  const [bookingBike, setBookingBike] = useState<Motorbike | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Form states for quick booking
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const filteredBikes = useMemo(() => {
    if (selectedType === 'all') return MOTORBIKES;
    return MOTORBIKES.filter(b => b.type === selectedType);
  }, [selectedType]);

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast.error('Vui lòng điền họ tên và số điện thoại!');
      return;
    }
    setBookingSuccess(true);
    toast.success('Gửi yêu cầu đặt xe thành công! Nhân viên sẽ gọi xác nhận trong 5 phút.');
  };

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Floating Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-150px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.15), transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* HEADER NAVBAR */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(16px)',
          background: 'rgba(10, 10, 15, 0.85)',
          borderBottom: '1px solid var(--border-primary)',
          padding: '16px 32px'
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)'
              }}
            >
              🏍️
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                MotoBike <span className="gradient-text">Hải Châu</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thuê Xe Máy Uy Tín Đà Nẵng</div>
            </div>
          </Link>

          {/* Navigation links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden-mobile">
            <a href="#danh-sach-xe" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}>
              Dòng Xe & Bảng Giá
            </a>
            <a href="#quy-trinh" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Quy Trình Thuê
            </a>
            <a href="#uu-diem" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Ưu Điểm Vượt Trội
            </a>
            <a href="#dia-diem-da-nang" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Điểm Phượt Đà Nẵng
            </a>
            <a href="#lien-he" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
              Liên Hệ
            </a>
          </nav>

          {/* User actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <Link
                href={user.role === 'customer' ? '/portal' : '/dashboard'}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                <span>{user.role === 'customer' ? 'Cổng Khách Hàng' : 'Quản Lý Hệ Thống'}</span>
                <span>⚡</span>
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Đăng Nhập
                </Link>
                <Link href="/register" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  Đăng Ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 24px 80px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto 48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '999px',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              color: 'var(--brand-primary)',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <span>✨</span> Dịch Vụ Cho Thuê Xe Máy Chuyên Nghiệp #1 Quận Hải Châu • Đà Nẵng
          </div>

          <h1 style={{ fontSize: '46px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '20px' }}>
            Khám Phá Thành Phố Biển Đà Nẵng <br />
            <span className="gradient-text">Với Dàn Xe Đời Mới Siêu Êm</span>
          </h1>

          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            Giao xe tận nơi miễn phí chỉ trong <strong style={{ color: 'var(--text-primary)' }}>15 phút</strong> tại Quận Hải Châu,
            Sân bay Quốc tế Đà Nẵng, Cầu Rồng và Khách sạn. Thủ tục nhanh gọn, hợp đồng ký điện tử trực tiếp không cần photo giấy tờ.
          </p>
        </div>

        {/* QUICK SEARCH / BOOKING WIDGET */}
        <div
          className="glass-card"
          style={{
            padding: '28px',
            maxWidth: '1060px',
            margin: '0 auto 60px',
            border: '1px solid rgba(249, 115, 22, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(249, 115, 22, 0.1)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                📍 Điểm nhận xe tại Đà Nẵng
              </label>
              <select
                className="form-input"
                value={pickupLocation}
                onChange={e => setPickupLocation(e.target.value)}
              >
                <option value="Sân bay Đà Nẵng">Sân bay Quốc tế Đà Nẵng</option>
                <option value="Cửa hàng Hải Châu">Cửa hàng trung tâm Hải Châu</option>
                <option value="Cầu Rồng / Bạch Đằng">Khu vực Cầu Rồng / Bạch Đằng</option>
                <option value="Ga tàu Đà Nẵng">Ga xe lửa Đà Nẵng (Hải Châu)</option>
                <option value="Khách sạn tại Hải Châu">Giao tận khách sạn Quận Hải Châu</option>
                <option value="Bãi biển Mỹ Khê">Giao tận nơi Bãi biển Mỹ Khê</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                📅 Ngày & Giờ nhận xe
              </label>
              <input
                type="date"
                className="form-input"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                📅 Ngày & Giờ trả xe
              </label>
              <input
                type="date"
                className="form-input"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                🛵 Loại xe mong muốn
              </label>
              <select
                className="form-input"
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
              >
                <option value="all">Tất cả các dòng xe</option>
                <option value="scooter">Xe tay ga (Vision, AirBlade, Lead)</option>
                <option value="manual">Xe số (Wave Alpha, Sirius)</option>
                <option value="clutch">Xe côn tay (Winner X, Exciter 155)</option>
              </select>
            </div>

            <div>
              <a
                href="#danh-sach-xe"
                className="btn btn-primary w-full"
                style={{ height: '42px', fontSize: '14px', fontWeight: 600 }}
              >
                <span>Tìm Xe Ngay</span>
                <span>🔍</span>
              </a>
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-primary)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              fontSize: '12px',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span>✅ 2 Nón bảo hiểm đạt chuẩn CR</span>
              <span>✅ 2 Áo mưa tiện lợi cao cấp</span>
              <span>✅ Giá đỡ điện thoại chắc chắn</span>
              <span>✅ Hỗ trợ cứu hộ 24/7 toàn TP Đà Nẵng</span>
            </div>
            <div style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
              Hotline 24/7: 0905.888.999 (Zalo)
            </div>
          </div>
        </div>

        {/* TRUST BADGES / STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '4px' }}>500+</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Xe Máy Đời Mới 2023-2024</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bảo dưỡng thay nhớt sau mỗi lượt thuê</div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '4px' }}>15 Phút</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Giao Xe Nhanh Tại Hải Châu</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sân bay, bến xe, khách sạn trung tâm</div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '4px' }}>0 Đồng</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Miễn Cọc Cho Du Khách</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chỉ cần vé máy bay khứ hồi & CCCD/Hộ chiếu</div>
          </div>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-yellow)', marginBottom: '4px' }}>4.9/5 ⭐</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>2.800+ Đánh Giá Tốt</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Từ khách du lịch trong nước & quốc tế</div>
          </div>
        </div>
      </section>

      {/* FLEET SHOWCASE SECTION */}
      <section id="danh-sach-xe" style={{ padding: '80px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '40px' }}>
            <div className="badge badge-confirmed" style={{ marginBottom: '12px' }}>DÀN XE CHẤT LƯỢNG CAO</div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
              Bảng Giá Thuê Xe Máy Hải Châu - Đà Nẵng
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '15px' }}>
              Giá công khai minh bạch, không phí ẩn. Xe được kiểm định an toàn 12 hạng mục kỹ thuật trước khi bàn giao cho quý khách.
            </p>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                className={`btn btn-sm ${selectedType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedType('all')}
              >
                Tất Cả ({MOTORBIKES.length})
              </button>
              <button
                className={`btn btn-sm ${selectedType === 'scooter' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedType('scooter')}
              >
                Xe Tay Ga (4)
              </button>
              <button
                className={`btn btn-sm ${selectedType === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedType('manual')}
              >
                Xe Số Tiết Kiệm (2)
              </button>
              <button
                className={`btn btn-sm ${selectedType === 'clutch' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedType('clutch')}
              >
                Xe Côn Tay Phượt (2)
              </button>
            </div>
          </div>

          {/* Motorbike Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredBikes.map(bike => (
              <div
                key={bike.id}
                className="vehicle-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {bike.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--brand-gradient)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      zIndex: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    🔥 Thuê nhiều
                  </div>
                )}

                {/* Bike Image */}
                <div style={{ position: 'relative', overflow: 'hidden', height: '190px' }}>
                  <img
                    src={bike.image}
                    alt={bike.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease'
                    }}
                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      background: 'rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(4px)',
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {bike.typeName}
                  </div>
                </div>

                {/* Bike Details */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{bike.name}</div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    <span>⚙️ {bike.engine}</span>
                    <span>⛽ {bike.fuelConsumption}</span>
                    <span>🏷️ {bike.brand}</span>
                  </div>

                  <div style={{ marginBottom: '16px', flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>TÍNH NĂNG & TIỆN ÍCH:</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {bike.features.map((feat, idx) => (
                        <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--brand-primary)', fontSize: '10px' }}>✓</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price & CTA */}
                  <div
                    style={{
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giá thuê theo ngày</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {bike.pricePerDay.toLocaleString('vi-VN')} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>đ/ngày</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setBookingBike(bike);
                        setBookingSuccess(false);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Đặt Xe Nhanh
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RENTAL WORKFLOW PROCESS */}
      <section id="quy-trinh" style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="badge badge-active" style={{ marginBottom: '12px' }}>THỦ TỤC 100% ONLINE</div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            Quy Trình Thuê Xe 4 Bước Tiện Lợi
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Áp dụng chữ ký điện tử hiện đại, không cần photo giấy tờ rườm rà, nhận xe ngay tại cửa khách sạn hoặc sân bay Đà Nẵng.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.15)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>
              1
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Chọn Xe & Lịch Trình</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Lựa chọn dòng xe tay ga hoặc xe số ưng ý, chọn ngày nhận xe và điểm hẹn giao xe (Sân bay Đà Nẵng, Cầu Rồng, Khách sạn Hải Châu).
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>
              2
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Ký Hợp Đồng Điện Tử</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Hệ thống tự động tạo hợp đồng thuê xe điện tử. Bạn chỉ cần ký chữ ký tay trực tiếp trên điện thoại/máy tính trong 30 giây.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>
              3
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Nhận Xe & Kiểm Tra Kỹ Thuật</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Kỹ thuật viên giao xe tận nơi trong 15 phút. Cùng kiểm tra xe, chụp ảnh 4 góc lưu hệ thống và nhận 2 mũ bảo hiểm + áo mưa.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>
              4
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Trả Xe & Hoàn Tất</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Hết thời gian thuê, nhân viên đến tận điểm hẹn để nhận lại xe. Hoàn tất check-out và thanh toán linh hoạt qua chuyển khoản hoặc tiền mặt.
            </p>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US & LOCAL ADVANTAGES */}
      <section id="uu-diem" style={{ padding: '80px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div className="badge badge-confirmed" style={{ marginBottom: '12px' }}>DỊCH VỤ CHUYÊN NGHIỆP</div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
              Vì Sao Nên Thuê Xe Máy Tại Hải Châu - Đà Nẵng?
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Chúng tôi cam kết chất lượng xe tốt nhất thị trường để chuyến du lịch miền Trung của bạn an toàn và trọn vẹn.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🚀</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Giao Xe Nhanh Chóng Trong 15 Phút</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Vị trí đắc địa tại Quận Hải Châu ngay trung tâm TP Đà Nẵng giúp đội ngũ nhân viên giao xe tức thì đến Sân bay, Ga xe lửa và các khách sạn chỉ trong 10-15 phút.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📑</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Ký Điện Tử Không Cần Giấy Tờ Phức Tạp</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Không giữ CCCD gốc của khách hàng du lịch có vé máy bay khứ hồi. Hợp đồng pháp lý rõ ràng bảo vệ quyền lợi đôi bên, ký trực tiếp trên màn hình.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🔧</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Xe Được Bảo Dưỡng Nghiêm Ngặt</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                100% xe được đội ngũ kỹ thuật viên kiểm tra phanh, lốp, đèn, còi và nhớt trước khi bàn giao. Leo đèo dốc Sơn Trà, Đèo Hải Vân an tâm tuyệt đối.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🆘</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Cứu Hộ 24/7 Toàn Đà Nẵng</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Sự cố thủng lốp, hỏng xe giữa đường? Đội ngũ cứu hộ lưu động tại Hải Châu sẽ có mặt ngay để khắc phục hoặc đổi xe mới miễn phí trong 30 phút.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🎁</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Combo Phụ Kiện Phượt Miễn Phí</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Tặng kèm 2 nón bảo hiểm sạch sẽ đạt chuẩn, 2 áo mưa dự phòng, giá đỡ điện thoại dẫn đường Google Maps và 1 lít xăng sẵn trong xe.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>💳</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Thanh Toán Linh Hoạt & Đa Dạng</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                Hỗ trợ thanh toán tiền mặt khi nhận xe, chuyển khoản QR VietQR, thẻ tín dụng hoặc các ví điện tử Momo, VNPay tiện lợi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAMOUS TOURIST ROUTES IN DA NANG */}
      <section id="dia-diem-da-nang" style={{ padding: '80px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div className="badge badge-active" style={{ marginBottom: '12px' }}>GỢI Ý PHƯỢT ĐÀ NẴNG</div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            Những Cung Đường Tuyệt Đẹp Khởi Hành Từ Hải Châu
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Từ trung tâm Quận Hải Châu, bạn có thể dễ dàng lái xe máy vi vu khắp các thắng cảnh nổi tiếng của Đà Nẵng và Hội An.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80"
              alt="Đèo Hải Vân"
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Đèo Hải Vân - Thiên Hạ Đệ Nhất Hùng Quan</div>
              <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginBottom: '8px' }}>📍 Cách Hải Châu 25 km • Cung đường phượt đỉnh cao</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Một bên là vách núi hùng vĩ, một bên là vịnh Lăng Cô xanh ngắt. Thích hợp đi xe số khỏe máy hoặc xe tay ga đầm chắc.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80"
              alt="Bán Đảo Sơn Trà"
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Bán Đảo Sơn Trà & Chùa Linh Ứng</div>
              <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginBottom: '8px' }}>📍 Cách Hải Châu 10 km • Ngắm trọn Đà Nẵng từ trên cao</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Cung đường ven biển Hoàng Sa tuyệt đẹp dẫn lên Chùa Linh Ứng tượng Phật Bà 67m, Cây Đa ngàn năm và Đỉnh Bàn Cờ.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop&q=80"
              alt="Cầu Rồng Đà Nẵng"
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Cầu Rồng & Bạch Đằng Về Đêm</div>
              <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginBottom: '8px' }}>📍 Ngay trung tâm Quận Hải Châu</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Chiêm ngưỡng Cầu Rồng phun lửa, phun nước vào tối thứ 7 & Chủ Nhật, dạo phố đi bộ Bạch Đằng và chợ đêm Sơn Trà.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop&q=80"
              alt="Phố Cổ Hội An"
              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
            />
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '17px', fontWeight: 700, marginBottom: '6px' }}>Phố Cổ Hội An & Rừng Dừa Bảy Mẫu</div>
              <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginBottom: '8px' }}>📍 Cách Hải Châu 28 km theo đường biển Võ Nguyên Giáp</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Chạy xe máy dọc bờ biển ngắm hàng phi lao và ghé thăm phố cổ lồng đèn lung linh, thưởng thức cao lầu và chè bắp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="lien-he" style={{ background: 'rgba(5, 5, 10, 0.95)', borderTop: '1px solid var(--border-primary)', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                🏍️
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800 }}>MotoBike Hải Châu</div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Hệ thống cho thuê xe máy uy tín hàng đầu tại Quận Hải Châu, TP. Đà Nẵng. Đem đến trải nghiệm du lịch tự túc an toàn, tiết kiệm và trọn vẹn nhất.
            </p>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Mã số thuế: 0401998877 do Sở KH&ĐT Đà Nẵng cấp
            </div>
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Địa Điểm & Liên Hệ</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li>📍 <strong>Trụ sở chính:</strong> 128 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng</li>
              <li>📍 <strong>Chi nhánh Sân bay:</strong> Cổng ra Sân bay Quốc tế Đà Nẵng (Giao trong 5p)</li>
              <li>📞 <strong>Hotline/Zalo 24/7:</strong> <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>0905.888.999</span></li>
              <li>✉️ <strong>Email:</strong> contact@motobikehaichau.vn</li>
              <li>⏰ <strong>Giờ làm việc:</strong> 06:00 - 23:00 tất cả các ngày trong tuần</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Dịch Vụ Nổi Bật</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li>• Thuê xe máy theo ngày / theo tuần / theo tháng</li>
              <li>• Giao xe miễn phí tận nơi tại Quận Hải Châu</li>
              <li>• Giao nhận xe tại Sân bay Đà Nẵng</li>
              <li>• Hợp đồng điện tử ký online tiện lợi</li>
              <li>• Dịch vụ cứu hộ xe máy 24/7</li>
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Đăng Nhập Quản Trị</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Dành cho Chủ cửa hàng, Kỹ thuật viên, Lễ tân, Kế toán và Nhân viên hỗ trợ:
            </p>
            <Link href="/login" className="btn btn-secondary w-full" style={{ fontSize: '13px', marginBottom: '8px' }}>
              Cổng Đăng Nhập Nhân Viên
            </Link>
            <Link href="/dashboard" className="btn btn-primary w-full" style={{ fontSize: '13px' }}>
              Truy Cập Dashboard
            </Link>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 MotoBike Rental Management System - Hải Châu, Đà Nẵng. All rights reserved.
        </div>
      </footer>

      {/* QUICK BOOKING MODAL */}
      {bookingBike && (
        <div className="modal-overlay" onClick={() => setBookingBike(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div className="modal-title">
                🛵 Đặt Xe: <span className="gradient-text">{bookingBike.name}</span>
              </div>
              <button
                onClick={() => setBookingBike(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎉</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '8px' }}>
                  Yêu Cầu Đã Được Tiếp Nhận!
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', lineHeight: 1.6 }}>
                  Cảm ơn bạn đã lựa chọn MotoBike Hải Châu. Nhân viên lễ tân sẽ liên hệ qua số <strong>{customerPhone}</strong> trong vòng 5 phút để xác nhận điểm giao xe.
                </p>
                <div className="glass-card" style={{ padding: '16px', textAlign: 'left', marginBottom: '20px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Xe đã chọn:</span>
                    <strong>{bookingBike.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Điểm nhận:</span>
                    <span>{pickupLocation}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Đơn giá:</span>
                    <strong style={{ color: 'var(--brand-primary)' }}>{bookingBike.pricePerDay.toLocaleString('vi-VN')} đ/ngày</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setBookingBike(null)} className="btn btn-secondary w-full">
                    Đóng
                  </button>
                  <Link href="/login" className="btn btn-primary w-full">
                    Đăng Nhập Quản Lý
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickBook}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                  <img src={bookingBike.image} alt={bookingBike.name} style={{ width: '80px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{bookingBike.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                      {bookingBike.pricePerDay.toLocaleString('vi-VN')} đ/ngày
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Họ và tên quý khách *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      className="form-input"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số điện thoại / Zalo *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0905 123 456"
                      className="form-input"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Ngày nhận xe</label>
                    <input
                      type="date"
                      className="form-input"
                      value={pickupDate}
                      onChange={e => setPickupDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày trả xe</label>
                    <input
                      type="date"
                      className="form-input"
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Điểm nhận xe tại Đà Nẵng</label>
                  <select
                    className="form-input"
                    value={pickupLocation}
                    onChange={e => setPickupLocation(e.target.value)}
                  >
                    <option value="Sân bay Đà Nẵng">Sân bay Quốc tế Đà Nẵng</option>
                    <option value="Cửa hàng Hải Châu">Cửa hàng trung tâm Hải Châu (128 Bạch Đằng)</option>
                    <option value="Cầu Rồng / Bạch Đằng">Khu vực Cầu Rồng / Bạch Đằng</option>
                    <option value="Ga tàu Đà Nẵng">Ga xe lửa Đà Nẵng</option>
                    <option value="Khách sạn tại Hải Châu">Giao tận khách sạn Quận Hải Châu</option>
                    <option value="Bãi biển Mỹ Khê">Giao tận nơi Bãi biển Mỹ Khê</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Ghi chú thêm (khung giờ đến, số lượng mũ...)</label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Chuyến bay hạ cánh lúc 9h sáng tại Sân bay Đà Nẵng..."
                    className="form-input"
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px 16px', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '10px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Ước tính ({calculateDays()} ngày thuê):</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {(bookingBike.pricePerDay * calculateDays()).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 600 }}>
                    Miễn phí giao xe tại Hải Châu!
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setBookingBike(null)} className="btn btn-secondary w-full">
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary w-full">
                    Xác Nhận Đặt Xe
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
