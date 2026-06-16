import React from 'react';

const SummaryCard = ({ title, value, icon, subtext, type = 'primary', onClick, isSelected }) => {
  // Map type to accent colors
  const activeBorderColor = type === 'primary' ? 'var(--primary)' : type === 'danger' ? 'var(--danger)' : 'var(--warning)';
  const activeGlow = type === 'primary' ? 'rgba(99, 102, 241, 0.25)' : type === 'danger' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';

  return (
    <div 
      className={`massive-metric-card type-${type} ${isSelected ? 'selected-metric-card' : ''}`} 
      id={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        border: isSelected ? `2px solid ${activeBorderColor}` : '1px solid var(--border-color)',
        boxShadow: isSelected ? `0 0 16px ${activeGlow}, var(--shadow-sm)` : undefined,
        transform: isSelected ? 'translateY(-2px)' : undefined,
        transition: 'all var(--transition-normal)'
      }}
    >
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div className="metric-icon-wrapper">
          {icon}
        </div>
      </div>
      <div className="metric-value currency-amount">
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }} className="muted-description">
          {subtext}
        </div>
      )}
      {onClick && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '0.68rem',
          fontWeight: 600,
          color: isSelected ? activeBorderColor : 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          opacity: 0.85
        }}>
          {isSelected ? 'Selected' : 'View Details'}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;

