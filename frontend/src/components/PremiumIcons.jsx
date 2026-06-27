import React from 'react';

// Premium Logo Component with 3D/Glassmorphic Style
export const PremiumLogo = ({ width = 28, height = 28, style = {} }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="logoShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="logoGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
        </linearGradient>
        <linearGradient id="logoOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7e47" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* 3D Shield Base */}
      <path 
        d="M50 5 L90 25 V60 C90 78 72 90 50 95 C28 90 10 78 10 60 V25 L50 5 Z" 
        fill="url(#logoShieldGrad)" 
      />
      
      {/* Glassmorphic Inner Shield */}
      <path 
        d="M50 12 L82 28 V56 C82 72 68 82 50 87 C32 82 18 72 18 56 V28 L50 12 Z" 
        fill="url(#logoGlassGrad)" 
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="2"
      />
      
      {/* 3D Person / Anchor Element */}
      <circle cx="50" cy="38" r="14" fill="url(#logoOrangeGrad)" filter="url(#logoGlow)" />
      <path 
        d="M26 68 C26 56 36 52 50 52 C64 52 74 56 74 68 V72 H26 V68 Z" 
        fill="url(#logoOrangeGrad)" 
        filter="url(#logoGlow)"
      />
      
      {/* Dynamic light reflection line */}
      <path 
        d="M22 28 L48 15 L78 28" 
        stroke="rgba(255, 255, 255, 0.3)" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

// ==========================================
// SIDEBAR NAVIGATION ICONS (DUOTONE WITH GLOW)
// ==========================================

export const DashboardIcon = ({ active, size = 18, style = {} }) => {
  const activeColor = active ? '#3b82f6' : 'var(--primary)';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        transition: 'all 0.3s ease',
        filter: active ? `drop-shadow(0 0 4px ${activeColor})` : 'none',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="dbAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Base gray/slate tracks */}
      <rect x="14" y="3" width="7" height="5" rx="1.5" fill="#64748b" fillOpacity="0.4" stroke="#64748b" strokeWidth="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" fill="#64748b" fillOpacity="0.4" stroke="#64748b" strokeWidth="1.5" />
      {/* Active duotone highlight blocks */}
      <rect x="3" y="3" width="7" height="10" rx="1.5" fill="url(#dbAccentGrad)" stroke="#2563eb" strokeWidth="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" fill="url(#dbAccentGrad)" fillOpacity="0.8" stroke="#2563eb" strokeWidth="1.5" />
    </svg>
  );
};

export const AssetOperationsIcon = ({ active, size = 18, style = {} }) => {
  const activeColor = active ? '#3b82f6' : 'var(--primary)';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        transition: 'all 0.3s ease',
        filter: active ? `drop-shadow(0 0 4px ${activeColor})` : 'none',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="assetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* Isometric Box Duotone style */}
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="#64748b" fillOpacity="0.25" stroke="#64748b" strokeWidth="1.8" />
      <path d="M3.27 6.96 L12 12.01 L20.73 6.96" stroke="url(#assetGrad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="22.08" x2="12" y2="12" stroke="url(#assetGrad)" strokeWidth="2" />
      <polygon points="12,12 20.73,6.96 21,8 12,13.2" fill="url(#assetGrad)" fillOpacity="0.4" />
      <polygon points="3,8 12,12 12,13.2 3.27,8.2" fill="url(#assetGrad)" fillOpacity="0.2" />
    </svg>
  );
};

export const DispatchFeedIcon = ({ active, size = 18, style = {} }) => {
  const activeColor = active ? '#3b82f6' : 'var(--primary)';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        transition: 'all 0.3s ease',
        filter: active ? `drop-shadow(0 0 4px ${activeColor})` : 'none',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="feedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="#64748b" fillOpacity="0.25" stroke="#64748b" strokeWidth="1.8" />
      <polyline points="22,6 12,13 2,6" stroke="url(#feedGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="14" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(239,68,68,0.4))" />
    </svg>
  );
};

export const CorporateCustomersIcon = ({ active, size = 18, style = {} }) => {
  const activeColor = active ? '#3b82f6' : 'var(--primary)';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        transition: 'all 0.3s ease',
        filter: active ? `drop-shadow(0 0 4px ${activeColor})` : 'none',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="corpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Two people icons overlapping with premium curves */}
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="#64748b" fillOpacity="0.2" stroke="#64748b" strokeWidth="1.8" />
      <circle cx="9" cy="7" r="4" fill="#64748b" fillOpacity="0.2" stroke="#64748b" strokeWidth="1.8" />
      
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="url(#corpGrad)" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="url(#corpGrad)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2" fill="url(#corpGrad)" />
    </svg>
  );
};

export const ReturnDeskIcon = ({ active, size = 18, style = {} }) => {
  const activeColor = active ? '#3b82f6' : 'var(--primary)';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      style={{ 
        transition: 'all 0.3s ease',
        filter: active ? `drop-shadow(0 0 6px ${activeColor})` : 'none',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="boxFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c5a880" />
          <stop offset="100%" stopColor="#a07a4b" />
        </linearGradient>
        <linearGradient id="boxSide" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a07a4b" />
          <stop offset="100%" stopColor="#785932" />
        </linearGradient>
        <linearGradient id="boxTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e7d4bc" />
          <stop offset="100%" stopColor="#c5a880" />
        </linearGradient>
        <linearGradient id="returnArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      {/* Circular Arrow Track */}
      <path 
        d="M85 62C88 68 85 76 75 81C63 87 45 88 30 84C22 82 17 79 17 77L25 74C25 75 29 77 34 78C47 82 61 81 70 76C77 72 78 68 76 65L85 62Z" 
        fill="url(#returnArrowGrad)" 
      />
      <path d="M8 73L28 62L22 84L8 73Z" fill="url(#returnArrowGrad)" />
      
      {/* 3D Isometric Cardboard Box */}
      <g transform="translate(0, -6)">
        <path d="M20 33V65L50 80V48Z" fill="url(#boxFront)" stroke="#4a351d" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M50 48V80L80 65V33Z" fill="url(#boxSide)" stroke="#4a351d" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M20 33L50 18L80 33L50 48Z" fill="url(#boxTop)" stroke="#4a351d" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M46 46V54H54V46L50 48Z" fill="#5c401f" stroke="#4a351d" strokeWidth="1.5" />
        <path d="M20 33L50 48" stroke="#4a351d" strokeWidth="1.5" />
        <path d="M80 33L50 48" stroke="#4a351d" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

export const SettlementDeskIcon = ({ active, size = 18, style = {} }) => {
  const activeColor = active ? '#3b82f6' : 'var(--primary)';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        transition: 'all 0.3s ease',
        filter: active ? `drop-shadow(0 0 4px ${activeColor})` : 'none',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="#64748b" fillOpacity="0.2" stroke="#64748b" strokeWidth="1.8" />
      <rect x="2" y="5" width="20" height="14" rx="2" fill="url(#cardGrad)" fillOpacity="0.15" stroke="url(#cardGrad)" strokeWidth="1.8" />
      <line x1="2" y1="10" x2="22" y2="10" stroke="#64748b" strokeWidth="1.8" />
      {/* Glowing Chip */}
      <rect x="5" y="13" width="4.5" height="3.5" rx="0.5" fill="url(#chipGrad)" stroke="#b45309" strokeWidth="0.8" />
      <circle cx="16" cy="15" r="1.5" fill="#64748b" />
      <circle cx="19" cy="15" r="1.5" fill="#64748b" fillOpacity="0.6" />
    </svg>
  );
};


// ==========================================
// METRIC CARDS 3D / TANGIBLE ICONS (LARGE)
// ==========================================

export const GoldCoinStack = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(217, 119, 6, 0.35))'
      }}
    >
      <defs>
        <linearGradient id="goldCap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <linearGradient id="goldSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="30%" stopColor="#facc15" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="70%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      
      {/* Coin 1 (Bottom Stack Left) */}
      <g>
        <path d="M10 65 V85 C10 91.5 22.3 95 35 95 C47.7 95 60 91.5 60 85 V65 Z" fill="url(#goldSide)" stroke="#854d0e" strokeWidth="1.5" />
        <ellipse cx="35" cy="65" rx="25" ry="10" fill="url(#goldCap)" stroke="#ca8a04" strokeWidth="1.5" />
      </g>

      {/* Coin 2 (Middle Stack Right) */}
      <g>
        <path d="M40 45 V68 C40 74.5 52.3 78 65 78 C77.7 78 90 74.5 90 68 V45 Z" fill="url(#goldSide)" stroke="#854d0e" strokeWidth="1.5" />
        <ellipse cx="65" cy="45" rx="25" ry="10" fill="url(#goldCap)" stroke="#ca8a04" strokeWidth="1.5" />
      </g>
      
      {/* Coin 3 (Top Stack Center) */}
      <g>
        <path d="M22 20 V42 C22 49 35.4 52 50 52 C64.6 52 78 49 78 42 V20 Z" fill="url(#goldSide)" stroke="#854d0e" strokeWidth="1.8" />
        <ellipse cx="50" cy="20" rx="28" ry="11" fill="url(#goldCap)" stroke="#d97706" strokeWidth="2" />
        <ellipse cx="50" cy="20" rx="18" ry="7" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="3 3" />
      </g>
    </svg>
  );
};

export const IncidentShield = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(239, 68, 68, 0.35))'
      }}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="40%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="innerShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
        </linearGradient>
      </defs>
      {/* 3D Hazard Shield */}
      <path 
        d="M50 8 L90 28 V60 C90 76 73 87 50 92 C27 87 10 76 10 60 V28 L50 8 Z" 
        fill="url(#shieldGrad)" 
        stroke="#7f1d1d" 
        strokeWidth="2" 
      />
      <path 
        d="M50 16 L80 34 V54 C80 67 67 76 50 80 C33 76 20 67 20 54 V34 L50 16 Z" 
        fill="url(#innerShield)" 
        stroke="rgba(255,255,255,0.25)" 
        strokeWidth="1.5" 
      />
      
      {/* Exclamation Point Mark */}
      <path d="M50 32 V54" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
      <circle cx="50" cy="67" r="5" fill="#ffffff" />
    </svg>
  );
};

export const OpenAuditsFolder = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(234, 179, 8, 0.35))'
      }}
    >
      <defs>
        <linearGradient id="folderBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id="folderFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="sheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      
      {/* Folder Backing */}
      <path 
        d="M8 22C8 19.2 10.2 17 13 17H38C40 17 42 18.2 42.8 20L46.5 29C46.9 30 47.8 30.6 48.8 30.6H87C89.8 30.6 92 32.8 92 35.6V78C92 80.8 89.8 83 87 83H13C10.2 83 8 80.8 8 78V22Z" 
        fill="url(#folderBack)" 
        stroke="#854d0e"
        strokeWidth="1.5"
      />
      
      {/* Nested Document Sheets peeking out */}
      <rect x="22" y="24" width="56" height="42" rx="4" fill="url(#sheetGrad)" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-5 50 45)" />
      <rect x="25" y="22" width="56" height="42" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" transform="rotate(-2 53 43)" />
      {/* Sheet Content lines */}
      <line x1="33" y1="32" x2="60" y2="32" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="33" y1="40" x2="70" y2="40" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="48" x2="65" y2="48" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      
      {/* Folder Front Cover with angled top */}
      <path 
        d="M8 35.6C8 32.8 10.2 30.6 13 30.6H87C89.8 30.6 92 32.8 92 35.6V78C92 80.8 89.8 83 87 83H13C10.2 83 8 80.8 8 78V35.6Z" 
        fill="url(#folderFront)" 
        stroke="#ca8a04"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const CalendarDue = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3))'
      }}
    >
      <defs>
        <linearGradient id="calHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="calBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>
      
      {/* Calendar Base Container */}
      <rect x="15" y="20" width="70" height="70" rx="10" fill="url(#calBodyGrad)" stroke="#94a3b8" strokeWidth="2" />
      
      {/* Colored Header panel */}
      <path d="M15 30C15 24.5 19.5 20 25 20H75C80.5 20 85 24.5 85 30V40H15V30Z" fill="url(#calHeaderGrad)" stroke="#1d4ed8" strokeWidth="0.5" />
      
      {/* Calendar Rings */}
      <rect x="28" y="10" width="8" height="18" rx="4" fill="#475569" stroke="#334155" strokeWidth="1" />
      <rect x="64" y="10" width="8" height="18" rx="4" fill="#475569" stroke="#334155" strokeWidth="1" />
      
      {/* Grid items */}
      <rect x="25" y="50" width="10" height="10" rx="2" fill="#cbd5e1" />
      <rect x="45" y="50" width="10" height="10" rx="2" fill="#cbd5e1" />
      <rect x="65" y="50" width="10" height="10" rx="2" fill="#cbd5e1" />
      
      <rect x="25" y="68" width="10" height="10" rx="2" fill="#cbd5e1" />
      {/* Due Today warning date highlighted */}
      <rect x="45" y="68" width="10" height="10" rx="2" fill="#ef4444" filter="drop-shadow(0 0 4px #ef4444)" />
      <rect x="65" y="68" width="10" height="10" rx="2" fill="#cbd5e1" />
      
      {/* Clock badge icon overlay */}
      <circle cx="78" cy="78" r="15" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
      <path d="M78 70V78H84" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
};

export const VaultSafe = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(37, 99, 235, 0.3))'
      }}
    >
      <defs>
        <linearGradient id="vaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="goldDial" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      
      {/* Steel vault body */}
      <rect x="2" y="2" width="20" height="20" rx="3" fill="url(#vaultGrad)" stroke="#0f172a" strokeWidth="1.5" />
      <rect x="4" y="4" width="16" height="16" rx="1.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      
      {/* Vault Door hinges */}
      <rect x="3" y="6" width="1.5" height="3" rx="0.5" fill="#334155" />
      <rect x="3" y="15" width="1.5" height="3" rx="0.5" fill="#334155" />
      
      {/* Dial lock widget */}
      <circle cx="12" cy="12" r="4.5" fill="url(#goldDial)" stroke="#78350f" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill="#1e293b" />
      <line x1="12" y1="7.5" x2="12" y2="9.5" stroke="#ffffff" strokeWidth="1" />
      <line x1="12" y1="14.5" x2="12" y2="16.5" stroke="#ffffff" strokeWidth="0.8" />
      <line x1="7.5" y1="12" x2="9.5" y2="12" stroke="#ffffff" strokeWidth="0.8" />
      <line x1="14.5" y1="12" x2="16.5" y2="12" stroke="#ffffff" strokeWidth="0.8" />

      {/* Lock Status indicator */}
      <circle cx="18" cy="6" r="1.2" fill="#10b981" />
    </svg>
  );
};

export const StopwatchHourglass = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(245, 158, 11, 0.35))'
      }}
    >
      <defs>
        <linearGradient id="stopwatchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      
      {/* Outer Watch Dial */}
      <circle cx="12" cy="13" r="8.5" fill="none" stroke="url(#stopwatchGrad)" strokeWidth="2.5" />
      <circle cx="12" cy="13" r="6" fill="#fffbeb" fillOpacity="0.1" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
      
      {/* Button Plungers */}
      <rect x="11" y="2" width="2" height="2.5" rx="0.5" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
      <path d="M7.5 4.5 L9.5 6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Watch hands showing overdue */}
      <path d="M12 13 L12 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13 L15.5 15.5" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.5" fill="#c2410c" />
    </svg>
  );
};

export const ToolkitShield = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(239, 68, 68, 0.35))'
      }}
    >
      <defs>
        <linearGradient id="toolGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="60%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      
      {/* Safety triangular hazard badge */}
      <path 
        d="M12 2 L22 19 A2 2 0 0 1 20 22 H4 A2 2 0 0 1 2 19 L12 2 Z" 
        fill="url(#toolGrad)" 
        stroke="#7f1d1d" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      
      {/* Inner graphic representing repair toolkit (crossed tools) */}
      <g stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round">
        <line x1="8" y1="16" x2="16" y2="8" />
        <line x1="16" y1="16" x2="8" y2="8" />
        <circle cx="12" cy="12" r="2.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.2" />
      </g>
    </svg>
  );
};

export const InvoiceClipboard = ({ size = 34 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(99, 102, 241, 0.3))'
      }}
    >
      <defs>
        <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      
      {/* Clipboard Backboard */}
      <rect x="4" y="3" width="16" height="18" rx="2" fill="url(#boardGrad)" stroke="#4338ca" strokeWidth="1.5" />
      
      {/* Ledger sheet */}
      <rect x="7" y="6" width="10" height="13" rx="1" fill="#ffffff" />
      
      {/* Header clip */}
      <rect x="10" y="2" width="4" height="2.5" rx="0.5" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
      
      {/* Document layout lines */}
      <line x1="9" y1="9" x2="15" y2="9" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="12" x2="13" y2="12" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="15" x2="14" y2="15" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};


// ==========================================
// DEVICE SELECTOR PRESENTS ICONS
// ==========================================

export const LaptopDevice = ({ style = {} }) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 2px 4px rgba(100,116,139,0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="laptopChassis" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="laptopScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      {/* Display Screen Frame */}
      <rect x="3" y="3" width="18" height="12" rx="1.5" fill="url(#laptopChassis)" stroke="#334155" strokeWidth="1.2" />
      <rect x="4.5" y="4.5" width="15" height="9" rx="0.5" fill="url(#laptopScreen)" />
      {/* Glow highlight inside screen */}
      <path d="M5 5 L12 11 L19 5" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      
      {/* Keyboard Base deck */}
      <path d="M1 18 H23 L22 20 H2 L1 18 Z" fill="url(#laptopChassis)" stroke="#334155" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="7" y1="19" x2="17" y2="19" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

export const TVDevice = ({ style = {} }) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="tvGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      {/* Television display */}
      <rect x="2" y="4" width="20" height="13" rx="1.5" fill="url(#tvGlass)" stroke="#1e293b" strokeWidth="1.5" />
      {/* Borderless light reflection */}
      <path d="M3 5 L13 14 L21 5" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
      
      {/* Stand base mount */}
      <path d="M9 17 L8 21 H16 L15 17 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

export const CameraDevice = ({ style = {} }) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="lensReflect" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Camera chassis */}
      <path d="M2 19 V8 C2 7 3 6 4 6 H7 L8.5 3.5 C9 2.5 10 2.5 10.5 3.5 L12 6 H20 C21 6 22 7 22 8 V19 C22 20 21 21 20 21 H4 C3 21 2 20 2 19 Z" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
      
      {/* Outer lens dial */}
      <rect x="5" y="4" width="2.2" height="2" rx="0.3" fill="#94a3b8" />
      <circle cx="18" cy="9" r="1.5" fill="#ef4444" />
      
      {/* Large reflection lens */}
      <circle cx="12" cy="13.5" r="5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="12" cy="13.5" r="3.5" fill="url(#lensReflect)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
    </svg>
  );
};

export const RouterDevice = ({ style = {} }) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 2px 4px rgba(6,182,212,0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="routerChassis" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      {/* Router flat box */}
      <rect x="2" y="14" width="20" height="7" rx="1.5" fill="url(#routerChassis)" stroke="#0f172a" strokeWidth="1.5" />
      
      {/* 3 Antennas */}
      <line x1="5" y1="14" x2="5" y2="3" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="14" x2="12" y2="2" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="19" y1="14" x2="19" y2="3" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Status LEDs indicators */}
      <circle cx="6" cy="17.5" r="0.8" fill="#22d3ee" filter="drop-shadow(0 0 2px #22d3ee)" />
      <circle cx="9" cy="17.5" r="0.8" fill="#22d3ee" filter="drop-shadow(0 0 2px #22d3ee)" />
      <circle cx="12" cy="17.5" r="0.8" fill="#22d3ee" filter="drop-shadow(0 0 2px #22d3ee)" />
      <circle cx="15" cy="17.5" r="0.8" fill="#22d3ee" filter="drop-shadow(0 0 2px #22d3ee)" />
      <circle cx="18" cy="17.5" r="0.8" fill="#22c55e" filter="drop-shadow(0 0 2px #22c55e)" />
    </svg>
  );
};

export const GamepadDevice = ({ style = {} }) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 2px 4px rgba(236,72,153,0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="gamepadBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>
      
      {/* Console controller body */}
      <path 
        d="M17 5H7C4 5 2 7 2 10.5C2 13 3 17 5 19C6 20 8 19 9 17.5 L10.5 15 H13.5 L15 17.5 C16 19 18 20 19 19C21 17 22 13 22 10.5C22 7 20 5 17 5Z" 
        fill="url(#gamepadBody)" 
        stroke="#0f172a" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      
      {/* D-Pad cross */}
      <line x1="5.5" y1="10" x2="8.5" y2="10" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="8.5" x2="7" y2="11.5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Action colored buttons */}
      <circle cx="15.5" cy="11.5" r="1" fill="#ef4444" />
      <circle cx="18" cy="9.5" r="1" fill="#3b82f6" />
      <circle cx="16.5" cy="8.5" r="0.8" fill="#10b981" />
      <circle cx="17" cy="12.5" r="0.8" fill="#facc15" />
      
      {/* Analog thumbsticks */}
      <circle cx="10" cy="12" r="1.5" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
      <circle cx="14" cy="12" r="1.5" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
    </svg>
  );
};

export const DefaultDeviceIcon = ({ style = {} }) => {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle', 
        filter: 'drop-shadow(0 2px 4px rgba(100,116,139,0.2))',
        ...style 
      }}
    >
      <circle cx="12" cy="12" r="9" fill="#475569" fillOpacity="0.25" stroke="#475569" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="#64748b" />
    </svg>
  );
};


// ==========================================
// EXPANDED UTILITY AND DECORATION ICONS
// ==========================================

export const CheckCircleIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="checkCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#checkCircleGrad)" fillOpacity="0.2" stroke="url(#checkCircleGrad)" strokeWidth="2" />
      <path d="M8.5 12.5l2 2 5-5" stroke="url(#checkCircleGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const ExclamationCircleIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="exclamCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#exclamCircleGrad)" fillOpacity="0.2" stroke="url(#exclamCircleGrad)" strokeWidth="2" />
      <path d="M12 8v5" stroke="url(#exclamCircleGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="url(#exclamCircleGrad)" />
    </svg>
  );
};

export const InfoCircleIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="infoCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#infoCircleGrad)" fillOpacity="0.2" stroke="url(#infoCircleGrad)" strokeWidth="2" />
      <path d="M12 16v-4" stroke="url(#infoCircleGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="url(#infoCircleGrad)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

export const ShieldAlertIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="shieldAlertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#shieldAlertGrad)" fillOpacity="0.2" stroke="url(#shieldAlertGrad)" strokeWidth="2" />
      <path d="M12 8v5" stroke="url(#shieldAlertGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="url(#shieldAlertGrad)" />
    </svg>
  );
};

export const CardReceiptIcon = ({ size = 20, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="cardReceiptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="20" height="14" rx="2" fill="url(#cardReceiptGrad)" fillOpacity="0.15" stroke="url(#cardReceiptGrad)" strokeWidth="2" />
      <line x1="2" y1="10" x2="22" y2="10" stroke="url(#cardReceiptGrad)" strokeWidth="2" />
      <rect x="5" y="13" width="3.5" height="2.5" rx="0.5" fill="#fbbf24" />
      <line x1="13" y1="14" x2="17" y2="14" stroke="url(#cardReceiptGrad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const SearchIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="7" fill="url(#searchGrad)" fillOpacity="0.1" stroke="url(#searchGrad)" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke="url(#searchGrad)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

export const BackArrowIcon = ({ size = 14, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        ...style 
      }}
    >
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const WarningTriangleIcon = ({ size = 20, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="warnTriangleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path d="M12 2L2 22h20L12 2z" fill="url(#warnTriangleGrad)" fillOpacity="0.25" stroke="url(#warnTriangleGrad)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v4" stroke="url(#warnTriangleGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="url(#warnTriangleGrad)" />
    </svg>
  );
};

export const DocumentIcon = ({ size = 20, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="url(#docGrad)" fillOpacity="0.15" stroke="url(#docGrad)" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="url(#docGrad)" strokeWidth="2" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="url(#docGrad)" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="url(#docGrad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const CameraIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(100,116,139,0.25))',
        ...style 
      }}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="#64748b" fillOpacity="0.1" stroke="#475569" strokeWidth="2" />
      <circle cx="12" cy="13" r="4" fill="#64748b" fillOpacity="0.15" stroke="#475569" strokeWidth="2" />
    </svg>
  );
};

export const UploadIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.25))',
        ...style 
      }}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const LinkIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(100,116,139,0.2))',
        ...style 
      }}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const GearSettingsIcon = ({ size = 18, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(71,85,105,0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path 
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" 
        fill="url(#gearGrad)" 
        stroke="#334155" 
        strokeWidth="1.5" 
      />
      <circle cx="12" cy="12" r="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
    </svg>
  );
};

// Premium Shield Check Icon (Perfect Condition)
export const ShieldCheckIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="shieldCheckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#shieldCheckGrad)" fillOpacity="0.2" stroke="url(#shieldCheckGrad)" strokeWidth="2" />
      <path d="M9 11l2 2 4-4" stroke="url(#shieldCheckGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Premium Cracked Screen Icon
export const PhoneCrackIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="phoneCrackChassis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="crackLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#phoneCrackChassis)" fillOpacity="0.15" stroke="url(#phoneCrackChassis)" strokeWidth="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 5l4 4-2 3 5 3-3 4" stroke="url(#crackLineGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Premium Scratches / Dents Icon
export const PhoneScratchesIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="phoneScratchChassis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="scratchLines" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#phoneScratchChassis)" fillOpacity="0.15" stroke="url(#phoneScratchChassis)" strokeWidth="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6h3M7 9h4M13 12h3" stroke="url(#scratchLines)" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 14l2-2" stroke="url(#scratchLines)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

// Premium Liquid Exposure Droplet Icon
export const PhoneDropletIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 6px rgba(59, 130, 246, 0.35))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="dropletChassis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="waterDroplet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="5" y="2" width="14" height="20" rx="2" fill="url(#dropletChassis)" fillOpacity="0.15" stroke="url(#dropletChassis)" strokeWidth="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 6a2.5 2.5 0 0 0-2.5 2.5c0 1.5 2.5 4 2.5 4s2.5-2.5 2.5-4A2.5 2.5 0 0 0 12 6z" fill="url(#waterDroplet)" stroke="#1d4ed8" strokeWidth="1" />
    </svg>
  );
};

// Premium Port / Charging Damage Icon
export const PortDamageIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="portChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="portWarningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#portChassisGrad)" fillOpacity="0.15" stroke="url(#portChassisGrad)" strokeWidth="2" />
      {/* Port connection slot */}
      <rect x="7" y="10" width="10" height="4" rx="1" fill="#1e293b" stroke="url(#portWarningGrad)" strokeWidth="1.5" />
      {/* Spark or damage indicators */}
      <path d="M4 14l2-2M20 14l-2-2" stroke="url(#portWarningGrad)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

// Premium Missing Accessories Icon
export const MissingAccessoriesIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="accessoriesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Dashed cable outline */}
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" stroke="url(#accessoriesGrad)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
      {/* Plug shape */}
      <rect x="10" y="16" width="4" height="5" rx="1" fill="url(#accessoriesGrad)" stroke="#6d28d9" strokeWidth="1" />
      <line x1="11" y1="21" x2="11" y2="23" stroke="#6d28d9" strokeWidth="1.5" />
      <line x1="13" y1="21" x2="13" y2="23" stroke="#6d28d9" strokeWidth="1.5" />
      {/* Question mark overlay representing missing */}
      <path d="M12 6.5a1.5 1.5 0 0 1 1.5 1.5c0 1.5-1.5 1.5-1.5 3" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="13" r="1.1" fill="#ef4444" />
    </svg>
  );
};

// Premium Power Failure Icon
export const PowerFailureIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(220, 38, 38, 0.3))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="powerFailureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {/* Broken power circle */}
      <path d="M18.36 5.64A9 9 0 1 1 5.64 5.64" stroke="url(#powerFailureGrad)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Broken indicator diagonal */}
      <line x1="12" y1="2" x2="12" y2="12" stroke="url(#powerFailureGrad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// Premium Custom Deduction Icon
export const CustomDeductionIcon = ({ size = 22, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="customDedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="url(#customDedGrad)" fillOpacity="0.15" stroke="url(#customDedGrad)" strokeWidth="2" />
      <line x1="8" y1="7" x2="16" y2="7" stroke="url(#customDedGrad)" strokeWidth="2" />
      <rect x="7" y="11" width="3" height="3" rx="0.5" fill="url(#customDedGrad)" />
      <rect x="14" y="11" width="3" height="3" rx="0.5" fill="url(#customDedGrad)" />
      <rect x="7" y="16" width="3" height="3" rx="0.5" fill="url(#customDedGrad)" />
      <path d="M14 16.5h3M14 18.5h3" stroke="url(#customDedGrad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// Premium Fast Track Bolt Icon
export const FastTrackIcon = ({ size = 12, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 0 3px #facc15)',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="fastTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="url(#fastTrackGrad)" stroke="#ca8a04" strokeWidth="1" />
    </svg>
  );
};

// Premium Folder Icon
export const FolderIcon = ({ size = 40, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 4px 6px rgba(234, 179, 8, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="premiumFolderBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="premiumFolderFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <path d="M10 25C10 22.2 12.2 20 15 20H38c2 0 3.9 1.3 4.7 3.1l3.8 9.5c.4 1 .9 1.6 1.9 1.6H85c2.8 0 5 2.2 5 5V75c0 2.8-2.2 5-5 5H15c-2.8 0-5-2.2-5-5V25z" fill="url(#premiumFolderBack)" stroke="#a16207" strokeWidth="1.5" />
      <path d="M10 39C10 36.2 12.2 34 15 34H85c2.8 0 5 2.2 5 5V75c0 2.8-2.2 5-5 5H15c-2.8 0-5-2.2-5-5V39z" fill="url(#premiumFolderFront)" stroke="#ca8a04" strokeWidth="1.5" />
    </svg>
  );
};

// Premium Phone / Call Icon
export const PhoneIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path 
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" 
        fill="url(#phoneGrad)" 
        fillOpacity="0.2" 
        stroke="url(#phoneGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Premium Edit Pencil Icon
export const EditIcon = ({ size = 18, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="editGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path 
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" 
        stroke="url(#editGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" 
        fill="url(#editGrad)" 
        fillOpacity="0.2" 
        stroke="url(#editGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Premium Eye / View Icon
export const EyeIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path 
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" 
        stroke="url(#eyeGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
        fill="url(#eyeGrad)" 
        fillOpacity="0.2" 
        stroke="url(#eyeGrad)" 
        strokeWidth="2" 
      />
    </svg>
  );
};

// Premium Forward Arrow Icon
export const ForwardArrowIcon = ({ size = 14, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        ...style 
      }}
    >
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Premium User Profile Icon
export const UserProfileIcon = ({ size = 18, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle 
        cx="12" 
        cy="7" 
        r="4" 
        fill="url(#userGrad)" 
        fillOpacity="0.2" 
        stroke="url(#userGrad)" 
        strokeWidth="2" 
      />
      <path 
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
        fill="url(#userGrad)" 
        fillOpacity="0.2" 
        stroke="url(#userGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

// Premium Download Icon
export const DownloadIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="downloadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path 
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" 
        stroke="url(#downloadGrad)" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Premium Sun Icon (for theme toggle)
export const SunIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="5" fill="url(#sunGrad)" fillOpacity="0.2" stroke="url(#sunGrad)" strokeWidth="2.2" />
      <path 
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" 
        stroke="url(#sunGrad)" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

// Premium Moon Icon (for theme toggle)
export const MoonIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.4))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="65%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path 
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
        fill="url(#moonGrad)" 
        fillOpacity="0.2" 
        stroke="url(#moonGrad)" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Premium Copy/Clipboard Icon
export const CopyIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(100, 116, 139, 0.2))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="copyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="url(#copyGrad)" fillOpacity="0.15" stroke="url(#copyGrad)" strokeWidth="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="url(#copyGrad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// Premium Refresh/Reset Icon
export const RefreshIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.25))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="refreshGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path 
        d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.57-.56" 
        stroke="url(#refreshGrad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

// Premium Plus/Add Icon
export const PlusIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        ...style 
      }}
    >
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Premium Lightbulb / Hint Icon
export const LightbulbIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.35))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <path 
        d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" 
        fill="url(#bulbGrad)" 
        fillOpacity="0.15" 
        stroke="url(#bulbGrad)" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
      />
      <path d="M9 18h6M10 22h4" stroke="url(#bulbGrad)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
};

// Premium AI Core / Sparkle Icon
export const AiCoreIcon = ({ size = 16, style = {} }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ 
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.35))',
        ...style 
      }}
    >
      <defs>
        <linearGradient id="aiCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path 
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" 
        stroke="url(#aiCoreGrad)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <circle cx="12" cy="12" r="4" fill="url(#aiCoreGrad)" fillOpacity="0.25" stroke="url(#aiCoreGrad)" strokeWidth="1.5" />
    </svg>
  );
};












