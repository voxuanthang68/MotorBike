import type React from 'react';

export const BACKEND_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
).replace(/\/api\/?$/, '');

export const VEHICLE_IMAGE_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
      <rect width="240" height="160" rx="14" fill="#eef2f7"/>
      <circle cx="74" cy="112" r="24" stroke="#64748b" stroke-width="6" fill="#ffffff"/>
      <circle cx="74" cy="112" r="7" fill="#2563eb"/>
      <circle cx="166" cy="112" r="24" stroke="#64748b" stroke-width="6" fill="#ffffff"/>
      <circle cx="166" cy="112" r="7" fill="#2563eb"/>
      <path d="M74 112L102 74H142L166 112M104 74L116 54H138M144 64L160 54H174" stroke="#1e293b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="86" y="64" width="44" height="14" rx="7" fill="#2563eb"/>
      <text x="120" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#475569">XTBike Motorbike</text>
    </svg>`
  );

export const PHOTO_IMAGE_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
      <rect width="240" height="160" rx="14" fill="#f1f5f9"/>
      <rect x="74" y="42" width="92" height="68" rx="10" stroke="#64748b" stroke-width="4" fill="#ffffff"/>
      <circle cx="102" cy="66" r="7" fill="#3b82f6"/>
      <path d="M84 98L108 78L128 92L144 80L158 98" stroke="#475569" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="120" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#64748b">Không tải được ảnh</text>
    </svg>`
  );

export function resolveMediaUrl(
  raw?: string | { url?: string | null } | null,
  fallback = ''
): string {
  const rawStr = typeof raw === 'string' ? raw : raw?.url;
  if (!rawStr) return fallback;
  let cleaned = String(rawStr).trim().replace(/\\/g, '/');
  if (!cleaned) return fallback;

  if (cleaned === '/placeholder-bike.jpg' || cleaned === 'placeholder-bike.jpg') {
    return VEHICLE_IMAGE_FALLBACK;
  }
  if (/^(https?:|data:|blob:)/i.test(cleaned)) {
    return cleaned;
  }
  if (cleaned.startsWith('//')) {
    return `https:${cleaned}`;
  }

  const uploadsIdx = cleaned.toLowerCase().indexOf('/uploads/');
  if (uploadsIdx >= 0) {
    cleaned = cleaned.slice(uploadsIdx);
  } else if (cleaned.toLowerCase().startsWith('uploads/')) {
    cleaned = `/${cleaned}`;
  }

  if (cleaned.startsWith('/uploads/')) {
    return `${BACKEND_ORIGIN}${cleaned}`;
  }
  if (cleaned.startsWith('/')) {
    return /^\/(file|globe|next|vercel|window)\.svg$/i.test(cleaned)
      ? cleaned
      : `${BACKEND_ORIGIN}${cleaned}`;
  }
  return `${BACKEND_ORIGIN}/${cleaned}`;
}

export function resolveVehicleImage(
  vehicle?: {
    mainImage?: string | null;
    images?: Array<string | { url?: string | null } | null> | null;
  } | null,
  fallback = VEHICLE_IMAGE_FALLBACK
): string {
  if (!vehicle) return fallback;
  const candidate = vehicle.mainImage || vehicle.images?.[0];
  return resolveMediaUrl(candidate, fallback) || fallback;
}

export function handleImageError(fallback = VEHICLE_IMAGE_FALLBACK) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = fallback;
  };
}
