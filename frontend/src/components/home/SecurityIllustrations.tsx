import React from 'react';

// Illustration 1: Tự động kiểm tra giấy tờ giả
export function FakeDocCheckIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="220" fill="#f0fdfa" />
      {/* City skyline background */}
      <path d="M20 180V120H45V180H65V90H95V180H120V140H140V180" stroke="#ccfbf1" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M220 180V110H250V180H280V130H305V180" stroke="#ccfbf1" strokeWidth="2" strokeDasharray="3 3" />
      
      {/* Car in background */}
      <path d="M120 160C125 152 140 148 155 148H180C192 148 202 154 206 160L215 170H110L120 160Z" fill="#99f6e4" opacity="0.6" />
      <circle cx="135" cy="172" r="8" fill="#5eead4" />
      <circle cx="190" cy="172" r="8" fill="#5eead4" />

      {/* Desk surface */}
      <rect x="0" y="176" width="320" height="44" fill="#e6fffa" />
      <line x1="0" y1="176" x2="320" y2="176" stroke="#00bfa5" strokeWidth="2" opacity="0.3" />

      {/* Person */}
      <g transform="translate(10, 0)">
        {/* Head & hair */}
        <path d="M68 62C68 50 78 40 90 40C102 40 112 50 112 62C112 74 102 84 90 84C78 84 68 74 68 62Z" fill="#fed7aa" />
        <path d="M66 58C66 45 74 36 90 36C104 36 114 44 114 54C114 58 110 56 104 52C98 48 84 50 78 56C74 60 70 62 66 58Z" fill="#1e293b" />
        <path d="M96 66C96 68 98 70 100 68" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        {/* Body (Teal shirt) */}
        <path d="M50 176L55 106C56 94 66 86 78 86H102C114 86 124 94 125 106L130 176H50Z" fill="#00a896" />
        {/* Arm extending holding card */}
        <path d="M108 106L152 118C156 119 160 124 158 128C156 132 150 134 146 132L116 124" fill="#00897b" />
        {/* Hand */}
        <circle cx="160" cy="125" r="7" fill="#fed7aa" />

        {/* CCCD / ID Card */}
        <g transform="translate(155, 108) rotate(-5)">
          <rect width="40" height="26" rx="4" fill="#ffffff" stroke="#00bfa5" strokeWidth="1.5" />
          <rect x="4" y="6" width="10" height="13" rx="2" fill="#99f6e4" />
          <circle cx="9" cy="10" r="3" fill="#00a896" />
          <line x1="18" y1="8" x2="34" y2="8" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="13" x2="30" y2="13" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="18" y1="18" x2="32" y2="18" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          {/* Chip */}
          <rect x="5" y="14" width="4" height="3" fill="#fbbf24" rx="0.5" />
        </g>
      </g>

      {/* Scanner Kiosk / Tablet */}
      <g transform="translate(195, 45)">
        <rect x="8" y="10" width="80" height="110" rx="8" fill="#1e293b" />
        <rect x="13" y="15" width="70" height="100" rx="6" fill="#042f2e" />
        {/* Screen camera */}
        <circle cx="48" cy="22" r="2.5" fill="#5eead4" />
        
        {/* Biometric scanning box */}
        <rect x="23" y="32" width="50" height="50" rx="4" fill="#115e59" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="4 2" />
        <circle cx="48" cy="50" r="12" fill="#99f6e4" />
        <path d="M38 72C38 66 42 62 48 62C54 62 58 66 58 72H38Z" fill="#14b8a6" />

        {/* Verification checkmark circle badge */}
        <circle cx="48" cy="98" r="11" fill="#00bfa5" />
        <path d="M43 98L47 102L54 94" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Scanner Stand */}
        <path d="M42 120H54V135H42V120Z" fill="#334155" />
        <path d="M30 135H66V140H30V135Z" fill="#475569" rx="2" />
      </g>

      {/* Floating Shield Verified Icon */}
      <g transform="translate(175, 45)">
        <path d="M12 2L2 6V14C2 20 6.5 25.5 12 27C17.5 25.5 22 20 22 14V6L12 2Z" fill="#00bfa5" />
        <path d="M8 14L11 17L16 11" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// Illustration 2: Tự động kiểm tra lừa đảo
export function FraudCheckIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="220" fill="#f0fdfa" />
      
      {/* Background circles / networks */}
      <circle cx="80" cy="80" r="50" stroke="#ccfbf1" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="240" cy="90" r="60" stroke="#ccfbf1" strokeWidth="1.5" strokeDasharray="4 4" />

      {/* Desk */}
      <rect x="0" y="176" width="320" height="44" fill="#e6fffa" />
      <line x1="0" y1="176" x2="320" y2="176" stroke="#00bfa5" strokeWidth="2" opacity="0.3" />

      {/* Operator */}
      <g transform="translate(100, 35)">
        {/* Head & hair */}
        <path d="M52 48C52 38 60 30 70 30C80 30 88 38 88 48C88 58 80 66 70 66C60 66 52 58 52 48Z" fill="#fed7aa" />
        <path d="M50 44C50 32 58 24 70 24C82 24 90 32 90 42C90 46 86 44 80 40C74 38 64 40 58 44Z" fill="#1e293b" />
        <path d="M74 50C74 52 76 53 78 52" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        {/* Body */}
        <path d="M32 145L36 86C37 76 46 68 56 68H84C94 68 103 76 104 86L108 145H32Z" fill="#00a896" />
        {/* Arms on desk */}
        <path d="M42 98L22 136H60L46 98" fill="#00897b" />
        <path d="M94 98L114 136H78L92 98" fill="#00897b" />
      </g>

      {/* Laptop */}
      <g transform="translate(115, 120)">
        <rect x="18" y="5" width="70" height="46" rx="4" fill="#0f172a" />
        <rect x="22" y="9" width="62" height="38" rx="2" fill="#042f2e" />
        <line x1="26" y1="18" x2="48" y2="18" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="24" x2="60" y2="24" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="30" x2="42" y2="30" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
        {/* Shield on laptop */}
        <circle cx="68" cy="28" r="8" fill="#00bfa5" />
        <path d="M65 28L67 30L72 25" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Keyboard base */}
        <path d="M6 51H100L108 58H0L6 51Z" fill="#334155" />
      </g>

      {/* Floating Network Nodes / Cards */}
      {/* Node 1: Left Profile */}
      <g transform="translate(30, 48)">
        <rect width="64" height="48" rx="8" fill="#ffffff" stroke="#00bfa5" strokeWidth="1.5" />
        <circle cx="20" cy="24" r="10" fill="#99f6e4" />
        <circle cx="20" cy="22" r="5" fill="#00a896" />
        <line x1="36" y1="18" x2="54" y2="18" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="25" x2="50" y2="25" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        {/* Verified Badge */}
        <circle cx="52" cy="36" r="6" fill="#00bfa5" />
        <path d="M49 36L51 38L55 34" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Connection lines */}
      <path d="M94 72L135 125" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M225 72L185 125" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Node 2: Warning node on Right */}
      <g transform="translate(225, 45)">
        <circle cx="20" cy="20" r="18" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M20 10L28 26H12L20 10Z" fill="#f59e0b" />
        <line x1="20" y1="16" x2="20" y2="21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="23.5" r="1" fill="#ffffff" />
      </g>

      {/* Node 3: Credit / Bank Card */}
      <g transform="translate(230, 105)">
        <rect width="46" height="30" rx="4" fill="#0f172a" />
        <rect x="0" y="6" width="46" height="6" fill="#334155" />
        <circle cx="34" cy="22" r="4" fill="#00bfa5" />
      </g>
    </svg>
  );
}

// Illustration 3: Tự động cảnh báo phạt nguội
export function TrafficFineAlertIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="220" fill="#f0fdfa" />
      
      {/* Ground road */}
      <rect x="0" y="176" width="320" height="44" fill="#e6fffa" />
      <line x1="0" y1="176" x2="320" y2="176" stroke="#00bfa5" strokeWidth="2" opacity="0.3" />
      <line x1="20" y1="198" x2="300" y2="198" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="16 12" />

      {/* Traffic Camera Pole on Right */}
      <g transform="translate(265, 30)">
        <path d="M12 146V0" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
        <path d="M12 25H-25" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
        {/* CCTV Camera housing */}
        <path d="M-35 15L-15 22L-15 35L-35 30Z" fill="#334155" />
        <circle cx="-35" cy="22" r="4" fill="#00bfa5" />
        {/* Flashing light / radar signal */}
        <path d="M-45 15L-70 50L-50 65L-35 30Z" fill="#5eead4" opacity="0.25" />
      </g>

      {/* Car parked */}
      <g transform="translate(150, 105)">
        <path d="M15 65C18 45 32 35 55 35H95C115 35 125 48 132 65L145 71H5L15 65Z" fill="#ffffff" stroke="#00bfa5" strokeWidth="2" />
        {/* Windows */}
        <path d="M34 60L46 42H70V60H34Z" fill="#ccfbf1" />
        <path d="M76 42H96L108 60H76V42Z" fill="#ccfbf1" />
        {/* Body lower */}
        <rect x="0" y="65" width="150" height="15" rx="3" fill="#00a896" />
        {/* Wheels */}
        <circle cx="35" cy="80" r="12" fill="#1e293b" />
        <circle cx="35" cy="80" r="6" fill="#94a3b8" />
        <circle cx="115" cy="80" r="12" fill="#1e293b" />
        <circle cx="115" cy="80" r="6" fill="#94a3b8" />
      </g>

      {/* Person standing holding smartphone */}
      <g transform="translate(45, 30)">
        {/* Head */}
        <path d="M38 48C38 38 46 30 56 30C66 30 74 38 74 48C74 58 66 66 56 66C46 66 38 58 38 48Z" fill="#fed7aa" />
        <path d="M36 44C36 32 44 24 56 24C68 24 76 32 76 42C76 46 72 44 66 40C60 38 50 40 44 44Z" fill="#1e293b" />
        {/* Body */}
        <path d="M22 146L26 86C27 76 36 68 46 68H66C76 68 85 76 86 86L90 146H22Z" fill="#00a896" />
        {/* Arm holding phone */}
        <path d="M72 88L92 108C94 110 94 115 90 117C86 119 82 116 80 112L68 98" fill="#00897b" />
        <circle cx="95" cy="112" r="5" fill="#fed7aa" />

        {/* Smartphone */}
        <g transform="translate(90, 85)">
          <rect width="28" height="48" rx="5" fill="#0f172a" stroke="#00bfa5" strokeWidth="1.5" />
          <rect x="2" y="4" width="24" height="40" rx="3" fill="#ffffff" />
          {/* Notification bubble */}
          <rect x="4" y="8" width="20" height="18" rx="2" fill="#e0f2fe" />
          <path d="M14 12L19 21H9L14 12Z" fill="#f59e0b" />
          <circle cx="14" cy="29" r="3" fill="#00bfa5" />
        </g>
      </g>

      {/* Floating Giant Warning Badge */}
      <g transform="translate(180, 40)">
        <rect width="64" height="64" rx="14" fill="#ffffff" stroke="#00bfa5" strokeWidth="2" />
        {/* Radar camera icon */}
        <circle cx="32" cy="24" r="8" fill="#ccfbf1" />
        <circle cx="32" cy="24" r="4" fill="#00a896" />
        {/* Warning triangle */}
        <path d="M32 36L44 54H20L32 36Z" fill="#f59e0b" />
        <line x1="32" y1="43" x2="32" y2="48" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="51" r="1" fill="#ffffff" />
      </g>
    </svg>
  );
}

// Illustration 4: Tự động soạn thảo hợp đồng
export function AutoContractIllustration() {
  return (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <rect width="320" height="220" fill="#f0fdfa" />
      
      {/* Background office elements */}
      <path d="M20 180V130H60V180" stroke="#ccfbf1" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="40" cy="110" r="12" fill="#ccfbf1" opacity="0.6" />

      {/* Desk */}
      <rect x="0" y="176" width="320" height="44" fill="#e6fffa" />
      <line x1="0" y1="176" x2="320" y2="176" stroke="#00bfa5" strokeWidth="2" opacity="0.3" />

      {/* Person sitting at desk */}
      <g transform="translate(140, 30)">
        {/* Head */}
        <path d="M48 48C48 38 56 30 66 30C76 30 84 38 84 48C84 58 76 66 66 66C56 66 48 58 48 48Z" fill="#fed7aa" />
        <path d="M46 44C46 32 54 24 66 24C78 24 86 32 86 42C86 46 82 44 76 40C70 38 60 40 54 44Z" fill="#1e293b" />
        <path d="M70 50C70 52 72 53 74 52" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
        {/* Body */}
        <path d="M32 146L36 86C37 76 46 68 56 68H76C86 68 95 76 96 86L100 146H32Z" fill="#00a896" />
        {/* Arm reaching with stylus pen */}
        <path d="M48 95L24 135C22 138 18 138 15 135L10 128L40 90" fill="#00897b" />
        <circle cx="12" cy="132" r="6" fill="#fed7aa" />
        {/* Stylus Pen */}
        <line x1="8" y1="138" x2="2" y2="148" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Digital Tablet on Desk */}
      <g transform="translate(90, 115) rotate(-10)">
        <rect width="90" height="65" rx="6" fill="#0f172a" />
        <rect x="3" y="3" width="84" height="59" rx="4" fill="#ffffff" />
        {/* Header bar of contract */}
        <rect x="8" y="8" width="74" height="8" rx="2" fill="#00bfa5" />
        <line x1="8" y1="22" x2="60" y2="22" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="50" y2="28" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="34" x2="68" y2="34" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        {/* Signature line with teal signature squiggle */}
        <path d="M12 46Q18 42 22 47T30 44T38 48" stroke="#00bfa5" strokeWidth="2" fill="none" strokeLinecap="round" />
        <line x1="8" y1="52" x2="42" y2="52" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
        {/* Stamp badge */}
        <circle cx="68" cy="46" r="8" fill="#e6fffa" stroke="#00bfa5" strokeWidth="1.5" />
        <path d="M64 46L67 49L72 43" stroke="#00bfa5" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Floating Smart Contract AI Document Icon */}
      <g transform="translate(18, 35)">
        <rect width="65" height="80" rx="8" fill="#ffffff" stroke="#00bfa5" strokeWidth="1.5" />
        {/* Document lines */}
        <rect x="8" y="10" width="30" height="6" rx="1.5" fill="#00bfa5" />
        <line x1="8" y1="24" x2="52" y2="24" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="32" x2="44" y2="32" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="40" x2="50" y2="40" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="48" x2="38" y2="48" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
        {/* AI Chip Badge */}
        <rect x="36" y="56" width="22" height="16" rx="4" fill="#00bfa5" />
        <text x="47" y="68" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">AI</text>
      </g>
    </svg>
  );
}
