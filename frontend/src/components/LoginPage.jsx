import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { PremiumLogo, ShieldCheckIcon, CheckCircleIcon } from './PremiumIcons';

/* ─── Inline SVG Icons ──────────────────────────────────────────── */
const WrenchIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);
const AccountUserIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const EyeOnIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const LockIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const MailIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

/* ─── Role Definitions ──────────────────────────────────────────── */
const ROLES = [
  {
    id: 'Manager',
    label: 'Admin / Staff',
    shortLabel: 'Admin',
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    defaultView: 'dashboard',
    credentials: { hint: 'admin@onepointsolutions.com' }
  },
  {
    id: 'Service Technician',
    label: 'Technician',
    shortLabel: 'Technician',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    defaultView: 'return',
    credentials: { hint: 'technician@onepointsolutions.com' }
  },
  {
    id: 'Accounts Staff',
    label: 'Accounts Staff',
    shortLabel: 'Accounts',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    defaultView: 'settlement',
    credentials: { hint: 'accounts@onepointsolutions.com' }
  }
];

/* ─── Stat Card for branding panel ─────────────────────────────── */
const StatCard = ({ value, label, icon, color }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '14px',
        padding: '12px 10px',
        cursor: 'default',
        transition: 'all 0.3s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}44` : 'none',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{icon}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.62rem', color: 'rgba(148,163,184,0.8)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
};

/* ─── Feature Bullet Row ────────────────────────────────────────── */
const FeatureBullet = ({ emoji, text, accent }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px',
        borderRadius: '10px',
        cursor: 'default',
        transition: 'all 0.25s ease',
        background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        transform: hovered ? 'translateX(6px)' : 'none',
        marginBottom: '4px',
      }}
    >
      <span style={{
        width: '32px', height: '32px', flexShrink: 0,
        background: hovered ? `${accent}22` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? `${accent}44` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.95rem',
        transition: 'all 0.25s ease',
        boxShadow: hovered ? `0 0 12px ${accent}33` : 'none',
      }}>
        {emoji}
      </span>
      <span style={{
        fontSize: '0.8rem',
        color: hovered ? '#e2e8f0' : 'rgba(203, 213, 225, 0.8)',
        fontWeight: hovered ? 600 : 500,
        transition: 'all 0.25s ease',
        letterSpacing: '0.01em',
      }}>
        {text}
      </span>
    </div>
  );
};

/* ─── Floating animated orb ─────────────────────────────────────── */
const Orb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none', ...style }} />
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function LoginPage({ onLogin }) {
  const { login: setAuthSession } = useAuth();
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isLargeScreen, setIsLargeScreen] = useState(() => window.innerWidth >= 1024);

  const tabRefs = [useRef(null), useRef(null), useRef(null)];

  // Pre-fill initial credentials on mount
  useEffect(() => {
    setEmail(ROLES[0].credentials.hint);
    setPassword('password123');
  }, []);
  const selectedRole = ROLES[selectedRoleIdx];

  const updateTabIndicator = () => {
    const ref = tabRefs[selectedRoleIdx];
    if (ref?.current) {
      setTabIndicatorStyle({ left: ref.current.offsetLeft, width: ref.current.offsetWidth });
    }
  };

  /* Slide tab indicator & responsive resize listener */
  useEffect(() => {
    updateTabIndicator();
  }, [selectedRoleIdx]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
      updateTabIndicator();
    };
    window.addEventListener('resize', handleResize);
    // Call after a small timeout to make sure refs have settled their layout
    const timer = setTimeout(updateTabIndicator, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [selectedRoleIdx]);

  /* Validation */
  const validate = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errs.email = 'Please enter a valid email.';
    if (!password.trim()) errs.password = 'Password is required.';
    else if (password.length < 4) errs.password = 'Password must be at least 4 characters.';
    return errs;
  };

  const handleRoleChange = (idx) => {
    setSelectedRoleIdx(idx);
    setErrors({});
    setEmail(ROLES[idx].credentials.hint);
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setIsLoading(false);
      setToastMsg(`Access Granted: Redirecting to ${data.user.role} portal...`);
      setToastVisible(true);

      setTimeout(() => {
        setToastVisible(false);
        // Update both the Auth Context and parent App state
        setAuthSession(data.token, data.user);
        const defaultView = data.user.role === 'Service Technician' ? 'return' : data.user.role === 'Accounts Staff' ? 'settlement' : 'dashboard';
        onLogin(data.user.role, defaultView);
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      setErrors({ auth: err.message });
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 44px',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-primary)',
    fontWeight: 500,
    background: '#f8fafc',
    border: `1.5px solid ${errors[field] ? '#ef4444' : focusedField === field ? selectedRole.accentColor : '#e2e8f0'}`,
    borderRadius: '10px',
    color: '#0f172a',
    outline: 'none',
    transition: 'all 0.22s ease',
    boxSizing: 'border-box',
    boxShadow: focusedField === field
      ? `0 0 0 3px ${selectedRole.glowColor}, 0 1px 3px rgba(0,0,0,0.08)`
      : '0 1px 3px rgba(0,0,0,0.06)',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'var(--font-primary)',
      position: 'relative',
      background: '#f1f5f9',
      overflow: 'hidden',
    }}>

      {/* ── SUCCESS TOAST ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: '24px', left: '50%', zIndex: 9999,
        transform: `translateX(-50%) translateY(${toastVisible ? '0' : '-130px'})`,
        transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: '#fff', padding: '14px 24px', borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          minWidth: '300px', maxWidth: '90vw',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'rgba(16,185,129,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CheckCircleIcon size={18} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Access Granted</div>
            <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#0f172a', marginTop: '2px' }}>{toastMsg}</div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          LEFT BRANDING PANEL — only on ≥1024px
      ══════════════════════════════════════════════════════════ */}
      {isLargeScreen && (
        <div style={{
          width: '44%',
          minWidth: '420px',
          maxWidth: '560px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '32px 36px',
          position: 'relative',
          overflowY: 'auto',
          background: 'linear-gradient(160deg, #06040f 0%, #0f172a 35%, #130a2e 65%, #0a1628 100%)',
          minHeight: '100vh',
        }}>
          {/* Animated gradient mesh orbs */}
          <Orb style={{ top: '-120px', left: '-100px', width: '420px', height: '420px', background: 'rgba(99,102,241,0.22)', animation: 'orbFloat1 8s ease-in-out infinite' }} />
          <Orb style={{ bottom: '-80px', right: '-80px', width: '350px', height: '350px', background: 'rgba(59,130,246,0.16)', animation: 'orbFloat2 10s ease-in-out infinite' }} />
          <Orb style={{ top: '40%', left: '60%', width: '200px', height: '200px', background: 'rgba(139,92,246,0.14)', animation: 'orbFloat3 7s ease-in-out infinite' }} />
          <Orb style={{ top: '20%', right: '-40px', width: '160px', height: '160px', background: 'rgba(245,158,11,0.08)', animation: 'orbFloat1 9s ease-in-out infinite reverse' }} />

          {/* Grid overlay for depth */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            zIndex: 0,
          }} />

          {/* TOP — Logo + brand */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '16px', padding: '12px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}>
                <PremiumLogo width={38} height={38} />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  One Point Solutions
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(148,163,184,0.7)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>
                  Enterprise Portal
                </div>
              </div>
            </div>

            {/* Hero headline */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '20px', padding: '5px 14px', marginBottom: '18px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#818cf8', animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Operations Dashboard</span>
              </div>

              <h1 style={{
                fontSize: '2.1rem', fontWeight: 900, color: '#fff',
                lineHeight: 1.12, letterSpacing: '-0.035em', margin: '0 0 16px 0',
              }}>
                Asset Lifecycle<br />
                <span style={{
                  backgroundImage: 'linear-gradient(135deg, #a5b4fc 0%, #818cf8 40%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  & Settlement Portal
                </span>
              </h1>

              <p style={{
                fontSize: '0.9rem', color: 'rgba(148,163,184,0.8)', lineHeight: 1.75,
                maxWidth: '380px', margin: 0, fontWeight: 400,
              }}>
                Manage rental deposits, track damage claims, and process settlements with complete transparency and precision.
              </p>
            </div>

            {/* Stat Cards row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <StatCard value="99.8%" label="Uptime SLA" icon="🟢" color="#4ade80" />
              <StatCard value="2,400+" label="Settlements" icon="⚡" color="#818cf8" />
              <StatCard value="ISO 27001" label="Certified" icon="🔐" color="#f9a8d4" />
            </div>

            {/* Feature bullets */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '8px',
            }}>
              {[
                { emoji: '🛡️', text: 'KYC-verified customer onboarding', accent: '#818cf8' },
                { emoji: '📋', text: 'AI-powered damage assessment reports', accent: '#a78bfa' },
                { emoji: '⚡', text: 'Real-time settlement & payout tracking', accent: '#60a5fa' },
                { emoji: '🔐', text: 'Role-based access control & audit trails', accent: '#34d399' },
              ].map((item, i) => (
                <FeatureBullet key={i} emoji={item.emoji} text={item.text} accent={item.accent} />
              ))}
            </div>
          </div>

          {/* BOTTOM — copyright */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.35), transparent)', marginBottom: '12px' }} />
            <p style={{ fontSize: '0.7rem', color: 'rgba(100,116,139,0.65)', margin: 0, fontWeight: 500 }}>
              © 2026 One Point Solutions · Secured by enterprise-grade TLS
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          RIGHT LOGIN PANEL
      ══════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isLargeScreen ? '40px 24px' : '24px 16px',
        background: '#f1f5f9',
        position: 'relative',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {/* Dot-grid background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
          backgroundSize: '26px 26px', zIndex: 0,
        }} />

        {/* Mobile-only logo bar */}
        {!isLargeScreen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', position: 'relative', zIndex: 1 }}>
            <PremiumLogo width={32} height={32} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>One Point Solutions</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Enterprise Portal</div>
            </div>
          </div>
        )}

        {/* Card container — full width on mobile, max 440px on desktop */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          maxWidth: isLargeScreen ? '440px' : '100%',
          margin: 'auto',
          paddingTop: '20px',
          paddingBottom: '20px',
        }}>
          {/* ── Login Card ── */}
          <div style={{
            background: '#fff',
            borderRadius: '22px',
            boxShadow: '0 24px 64px rgba(15,23,42,0.11), 0 8px 20px rgba(15,23,42,0.06)',
            border: '1px solid rgba(226,232,240,0.9)',
            overflow: 'hidden',
          }}>

            {/* Card header accent bar */}
            <div style={{
              height: '4px',
              background: `linear-gradient(90deg, ${selectedRole.accentColor}, ${selectedRole.accentColor}88)`,
              transition: 'background 0.4s ease',
            }} />

            {/* Card header text */}
            <div style={{ padding: isLargeScreen ? '28px 32px 20px' : '20px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: selectedRole.accentColor,
                  boxShadow: `0 0 8px ${selectedRole.accentColor}`,
                  transition: 'all 0.35s ease',
                }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Secure Sign‑In
                </span>
              </div>
              <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.025em' }}>
                Welcome back 👋
              </h2>
              <p style={{ fontSize: '0.855rem', color: '#64748b', margin: 0, fontWeight: 400 }}>
                Choose your access role and sign in to continue.
              </p>
            </div>

            {/* Form body */}
            <div style={{ padding: isLargeScreen ? '24px 32px 32px' : '18px 20px 20px' }}>

              {/* ── Role Tabs ── */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#475569', marginBottom: '9px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  Access Role
                </label>
                <div style={{
                  position: 'relative', display: 'flex',
                  background: '#f1f5f9', borderRadius: '12px',
                  padding: '4px', border: '1px solid #e2e8f0',
                }}>
                  {/* Sliding pill */}
                  <div style={{
                    position: 'absolute', top: '4px', bottom: '4px',
                    borderRadius: '9px', background: '#fff',
                    boxShadow: '0 2px 10px rgba(15,23,42,0.1)',
                    border: `1.5px solid ${selectedRole.accentColor}33`,
                    transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1), width 0.3s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s ease',
                    ...tabIndicatorStyle,
                  }} />

                  {ROLES.map((role, idx) => {
                    const isActive = selectedRoleIdx === idx;
                    return (
                      <button
                        key={role.id}
                        ref={tabRefs[idx]}
                        type="button"
                        onClick={() => handleRoleChange(idx)}
                        style={{
                          flex: 1, position: 'relative', zIndex: 1,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          gap: '4px', padding: '10px 4px',
                          border: 'none', background: 'transparent',
                          cursor: 'pointer', borderRadius: '9px',
                          transition: 'color 0.25s ease',
                          color: isActive ? role.accentColor : '#64748b',
                        }}
                      >
                        {idx === 0
                          ? <ShieldCheckIcon size={17} style={{ color: isActive ? role.accentColor : '#94a3b8', transition: 'color 0.25s' }} />
                          : idx === 1
                            ? <WrenchIcon size={17} color={isActive ? role.accentColor : '#94a3b8'} />
                            : <AccountUserIcon size={17} color={isActive ? role.accentColor : '#94a3b8'} />
                        }
                        <span style={{
                          fontSize: '0.68rem', fontWeight: isActive ? 700 : 500,
                          letterSpacing: '0.02em', whiteSpace: 'nowrap',
                          transition: 'font-weight 0.25s, color 0.25s',
                        }}>
                          {role.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* ── Email ── */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '7px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'email' ? selectedRole.accentColor : errors.email ? '#ef4444' : '#94a3b8',
                      transition: 'color 0.2s', display: 'flex', pointerEvents: 'none',
                    }}>
                      <MailIcon size={16} />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={selectedRole.credentials.hint}
                      autoComplete="email"
                      style={inputStyle('email')}
                    />
                  </div>
                  {errors.email && (
                    <p style={{ color: '#ef4444', fontSize: '0.74rem', margin: '5px 0 0 2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ⚠ {errors.email}
                    </p>
                  )}
                </div>

                {/* ── Password ── */}
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Password</label>
                    <button
                      type="button"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.74rem', color: selectedRole.accentColor,
                        fontWeight: 600, fontFamily: 'var(--font-primary)', padding: 0,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'password' ? selectedRole.accentColor : errors.password ? '#ef4444' : '#94a3b8',
                      transition: 'color 0.2s', display: 'flex', pointerEvents: 'none',
                    }}>
                      <LockIcon size={16} />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ ...inputStyle('password'), paddingRight: '46px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      tabIndex={-1}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '2px', color: '#94a3b8', display: 'flex', alignItems: 'center',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeOnIcon size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p style={{ color: '#ef4444', fontSize: '0.74rem', margin: '5px 0 0 2px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      ⚠ {errors.password}
                    </p>
                  )}
                </div>

                {/* ── Remember Me ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '24px', marginTop: '16px' }}>
                  <button
                    type="button"
                    id="remember-me-toggle"
                    onClick={() => setRememberMe(p => !p)}
                    style={{
                      width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                      border: `2px solid ${rememberMe ? selectedRole.accentColor : '#cbd5e1'}`,
                      background: rememberMe ? selectedRole.accentColor : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', padding: 0,
                    }}
                  >
                    {rememberMe && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <label
                    onClick={() => setRememberMe(p => !p)}
                    style={{ fontSize: '0.81rem', color: '#475569', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}
                  >
                    Remember my role &amp; session
                  </label>
                </div>

                {errors.auth && (
                  <div style={{
                    color: '#ef4444',
                    fontSize: '0.78rem',
                    margin: '0 0 16px 0',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(239,68,68,0.06)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.18)'
                  }}>
                    ⚠ {errors.auth}
                  </div>
                )}

                {/* ── Submit ── */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={isLoading}
                  style={{
                    width: '100%', padding: '13px 24px',
                    fontSize: '0.9rem', fontWeight: 700,
                    fontFamily: 'var(--font-primary)', color: '#fff',
                    border: 'none', borderRadius: '11px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isLoading
                      ? '#94a3b8'
                      : `linear-gradient(135deg, ${selectedRole.accentColor} 0%, ${selectedRole.accentColor}cc 100%)`,
                    boxShadow: isLoading ? 'none' : `0 6px 22px ${selectedRole.accentColor}55`,
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 12px 32px ${selectedRole.accentColor}66`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 6px 22px ${selectedRole.accentColor}55`;
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <span style={{
                        width: '17px', height: '17px',
                        border: '2.5px solid rgba(255,255,255,0.3)',
                        borderTop: '2.5px solid #fff', borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite', flexShrink: 0,
                      }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to {selectedRole.label}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8',
            marginTop: '18px', fontWeight: 500,
          }}>
            🔒 Protected by enterprise-grade TLS encryption
          </p>
        </div>
      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 20px) scale(0.97); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-25px, 15px) scale(1.08); }
          70% { transform: translate(10px, -20px) scale(0.95); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-18px, -24px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
