import React, { useState } from 'react';
import { 
  PremiumLogo, 
  DashboardIcon, 
  AssetOperationsIcon, 
  CorporateCustomersIcon, 
  ReturnDeskIcon, 
  SettlementDeskIcon,
  SunIcon,
  MoonIcon
} from './PremiumIcons';
 
export default function Navbar({ setView, activeView, currency, onCurrencyChange, currencyConfig, theme, toggleTheme, userRole, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
 
  const handleLinkClick = (view) => {
    setView(view);
    setMenuOpen(false);
  };
 
  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="mobile-top-bar">
        <h2 className="navbar-brand-custom" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PremiumLogo width={26} height={26} />
          <span className="gradient-text">One Point Solutions</span>
        </h2>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>
 
      {/* Sidebar Backdrop Overlay on Mobile */}
      {menuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />
      )}
 
      <aside className={`sidebar-container ${menuOpen ? 'open' : ''}`} id="control-center-sidebar">
        {/* Brand Section */}
        <div className="sidebar-brand-nav-group">
          <h2 className="navbar-brand-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <PremiumLogo width={30} height={30} />
            <span className="gradient-text">One Point Solutions</span>
          </h2>
          
          {/* Navigation Menu Links */}
          <nav className="sidebar-menu-list" aria-label="Control Center Navigation">
            {/* Operations Dashboard only visible to Manager */}
            {userRole === 'Manager' && (
              <button 
                id="nav-link-dashboard"
                className={`sidebar-link-item ${activeView === 'dashboard' ? 'active' : ''}`} 
                onClick={() => handleLinkClick('dashboard')}
              >
                <DashboardIcon active={activeView === 'dashboard'} size={18} />
                Dashboard
              </button>
            )}
 
            {/* Asset Operations visible to Manager & Service Technician */}
            {(userRole === 'Manager' || userRole === 'Service Technician') && (
              <button 
                id="nav-link-assets"
                className={`sidebar-link-item ${activeView === 'assets' ? 'active' : ''}`} 
                onClick={() => handleLinkClick('assets')}
              >
                <AssetOperationsIcon active={activeView === 'assets'} size={18} />
                Asset Operations
              </button>
            )}
 
 
            {/* Corporate Customers only visible to Manager */}
            {userRole === 'Manager' && (
              <button 
                id="nav-link-corporate"
                className={`sidebar-link-item ${activeView === 'corporate' ? 'active' : ''}`} 
                onClick={() => handleLinkClick('corporate')}
              >
                <CorporateCustomersIcon active={activeView === 'corporate'} size={18} />
                Corporate Customers
              </button>
            )}
  
            {/* Log Return visible to Manager & Service Technician */}
            {(userRole === 'Manager' || userRole === 'Service Technician') && (
              <button 
                id="nav-link-return"
                className={`sidebar-link-item ${activeView === 'return' ? 'active' : ''}`} 
                onClick={() => handleLinkClick('return')}
              >
                <ReturnDeskIcon active={activeView === 'return'} size={18} />
                Return Desk
              </button>
            )}
  
            {/* Settlement Desk visible to Manager & Accounts Staff */}
            {(userRole === 'Manager' || userRole === 'Accounts Staff') && (
              <button 
                id="nav-link-settlement"
                className={`sidebar-link-item ${activeView === 'settlement' ? 'active' : ''}`} 
                onClick={() => handleLinkClick('settlement')}
              >
                <SettlementDeskIcon active={activeView === 'settlement'} size={18} />
                Settlement Desk
              </button>
            )}
 
          </nav>
        </div>
 
        {/* Configuration Widgets at bottom of sidebar */}
        <div className="sidebar-config-section">
          {/* Currency Settings Selector */}
          <div className="sidebar-config-item-wrapper">
            <span className="sidebar-config-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Currency
            </span>
            <select 
              id="sys-currency-select"
              value={currency} 
              onChange={(e) => onCurrencyChange(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '0.4rem',
                borderRadius: 'var(--border-radius-md)',
                fontWeight: '600',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              className="currency-select"
            >
              {Object.keys(currencyConfig).map((key) => (
                <option key={key} value={key}>
                  {currencyConfig[key].label}
                </option>
              ))}
            </select>
          </div>
 
          {/* Theme Switcher Toggle & Label Row */}
          <div className="sidebar-config-item-row">
            <span className="sidebar-config-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Theme Mode
            </span>
            <button 
              id="sys-theme-toggle"
              onClick={toggleTheme} 
              className="theme-toggle-btn" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <SunIcon size={16} style={{ color: '#f59e0b' }} />
              ) : (
                <MoonIcon size={16} style={{ color: '#a78bfa' }} />
              )}
            </button>
          </div>

          {/* Sign Out Button */}
          {onLogout && (
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <button
                id="sidebar-sign-out-btn"
                onClick={onLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '9px 14px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'var(--danger)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-primary)',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--danger-glow)';
                  e.currentTarget.style.borderColor = 'var(--danger)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
                title="Sign out and return to login"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

