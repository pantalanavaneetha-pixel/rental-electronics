import React, { useState } from 'react';
 
export default function Navbar({ setView, activeView, currency, onCurrencyChange, currencyConfig, theme, toggleTheme, userRole, setUserRole }) {
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
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
            <path d="M26 74L8 92" stroke="#0284c7" strokeWidth="12" strokeLinecap="round" />
            <circle cx="54" cy="46" r="32" stroke="#0284c7" strokeWidth="10" />
            <circle cx="54" cy="36" r="11" fill="#f97316" />
            <path d="M34 62C34 53 43 49 54 49C65 49 74 53 74 62V66H34V62Z" fill="#f97316" />
          </svg>
          <span className="gradient-text">RentShield CC</span>
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
          <h2 className="navbar-brand-custom" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <path d="M26 74L8 92" stroke="#0284c7" strokeWidth="12" strokeLinecap="round" />
              <circle cx="54" cy="46" r="32" stroke="#0284c7" strokeWidth="10" />
              <circle cx="54" cy="36" r="11" fill="#f97316" />
              <path d="M34 62C34 53 43 49 54 49C65 49 74 53 74 62V66H34V62Z" fill="#f97316" />
            </svg>
            <span className="gradient-text">RentShield CC</span>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1.5" fill="currentColor" fillOpacity="0.15" />
                  <rect x="14" y="3" width="7" height="5" rx="1.5" />
                  <rect x="14" y="12" width="7" height="9" rx="1.5" />
                  <rect x="3" y="16" width="7" height="5" rx="1.5" />
                </svg>
                Dashboard
              </button>
            )}
 
            {/* Log Return visible to Manager & Service Technician */}
            {(userRole === 'Manager' || userRole === 'Service Technician') && (
              <button 
                id="nav-link-return"
                className={`sidebar-link-item ${activeView === 'return' ? 'active' : ''}`} 
                onClick={() => handleLinkClick('return')}
              >
                <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M85 62C88 68 85 76 75 81C63 87 45 88 30 84C22 82 17 79 17 77L25 74C25 75 29 77 34 78C47 82 61 81 70 76C77 72 78 68 76 65L85 62Z" fill="#3b82f6" />
                  <path d="M8 73L28 62L22 84L8 73Z" fill="#3b82f6" />
                  <path d="M20 33V65L50 80V48Z" fill="#b08968" stroke="#2b1a0f" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M50 48V80L80 65V33Z" fill="#8c6239" stroke="#2b1a0f" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M20 33L50 18L80 33L50 48Z" fill="#ddb892" stroke="#2b1a0f" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M46 46V54H54V46L50 48Z" fill="#7f4f24" stroke="#2b1a0f" strokeWidth="1.5" />
                  <path d="M20 33L50 48" stroke="#2b1a0f" strokeWidth="1.5" />
                  <path d="M80 33L50 48" stroke="#2b1a0f" stroke-width="1.5" />
                </svg>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                  <circle cx="6" cy="15" r="1.5" fill="currentColor" />
                  <circle cx="10" cy="15" r="1.5" fill="currentColor" />
                </svg>
                Settlement Desk
              </button>
            )}

          </nav>
        </div>
 
        {/* Configuration Widgets at bottom of sidebar */}
        <div className="sidebar-config-section">
          {/* Role Selector dropdown */}
          <div className="sidebar-config-item-wrapper">
            <span className="sidebar-config-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Role
            </span>
            <select 
              id="sys-role-select"
              value={userRole} 
              onChange={(e) => {
                const newRole = e.target.value;
                setUserRole(newRole);
                if (newRole === 'Service Technician') handleLinkClick('return');
                else if (newRole === 'Accounts Staff') handleLinkClick('settlement');
                else handleLinkClick('dashboard');
              }}
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
              className="role-select"
            >
              <option value="Manager">Manager</option>
              <option value="Service Technician">Service Technician</option>
              <option value="Accounts Staff">Accounts Staff</option>
            </select>
          </div>
 
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a78bfa' }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

