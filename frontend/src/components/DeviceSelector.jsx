/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef } from 'react';
import { LaptopDevice, TVDevice, CameraDevice, RouterDevice, GamepadDevice, DefaultDeviceIcon, CheckCircleIcon } from './PremiumIcons';

export const EXISTING_DEVICES = [
  // 1. Computing & Workstations (Apple, Lenovo, Dell, HP, Microsoft, ASUS, Razer)
  { name: 'Apple MacBook Pro M3 Max', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 200000 },
  { name: 'Apple MacBook Air M3', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 90000 },
  { name: 'Apple Mac Studio M2 Ultra', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 350000 },
  { name: 'Lenovo ThinkPad P1 Gen 6', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 150000 },
  { name: 'Lenovo ThinkPad X1 Carbon Gen 11', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 120000 },
  { name: 'Dell XPS 15 9530', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 110000 },
  { name: 'Dell Precision 7680 Workstation', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 250000 },
  { name: 'HP ZBook Power G10', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 130000 },
  { name: 'HP Spectre x360 16', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 100000 },
  { name: 'Microsoft Surface Laptop Studio 2', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 180000 },
  { name: 'ASUS ROG Zephyrus G16', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 160000 },
  { name: 'Razer Blade 16 (2024)', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 220000 },
  { name: 'Lenovo ThinkPad Laptop', category: 'Computing', icon: 'laptop', color: 'rgba(59, 130, 246, 0.12)', textColor: '#2563eb', baseCost: 40000 },
  
  // 2. Audio Visual (A/V) & Displays (Sony, Samsung, LG, BenQ, EPSON, Sonos, Bose)
  { name: 'Sony 65" A95L QD-OLED 4K TV', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 180000 },
  { name: 'Samsung 55" Odyssey Ark Monitor', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 140000 },
  { name: 'LG C3 48" OLED 4K Smart TV', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 75000 },
  { name: 'LG UltraFine 27" 5K Display', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 110000 },
  { name: 'Samsung 34" Odyssey G8 OLED', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 85000 },
  { name: 'EPSON Pro Cinema 4K Projector', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 200000 },
  { name: 'BenQ HT4550i 4K Projector', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 130000 },
  { name: 'Sonos Arc Premium Soundbar', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 70000 },
  { name: 'Bose Smart Ultra Soundbar', category: 'Audio Visual', icon: 'tv', color: 'rgba(34, 197, 94, 0.12)', textColor: '#16a34a', baseCost: 65000 },
  
  // 3. Camera & Production Gear (Sony, Canon, RED, DJI, GoPro, Blackmagic)
  { name: 'Sony FX3 Cinema Camera', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 250000 },
  { name: 'Sony Alpha 7R V Mirrorless', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 160000 },
  { name: 'Canon EOS R5 C Cinema', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 220000 },
  { name: 'Canon EOS C70 Cinema', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 280000 },
  { name: 'RED Komodo 6K Starter Kit', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 450000 },
  { name: 'RED V-Raptor 8K VV', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 800000 },
  { name: 'DJI Inspire 3 Cinema Drone', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 750000 },
  { name: 'DJI Mavic 3 Pro Cine', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 180000 },
  { name: 'GoPro HERO12 Black Action', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 40000 },
  { name: 'Blackmagic Pocket Cinema 6K Pro', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 140000 },
  { name: 'Canon DSLR Camera', category: 'Camera & Production', icon: 'camera', color: 'rgba(234, 179, 8, 0.12)', textColor: '#ca8a04', baseCost: 25000 },
  
  // 4. Networking & Office Equipment (Cisco, Netgear, Ubiquiti, HP, Epson)
  { name: 'Cisco Catalyst C9200 Switch', category: 'Networking & Office', icon: 'router', color: 'rgba(168, 85, 247, 0.12)', textColor: '#9333ea', baseCost: 95000 },
  { name: 'High-Speed Cisco ISR 4331 Router', category: 'Networking & Office', icon: 'router', color: 'rgba(168, 85, 247, 0.12)', textColor: '#9333ea', baseCost: 80000 },
  { name: 'Netgear Nighthawk Wi-Fi 7 Router', category: 'Networking & Office', icon: 'router', color: 'rgba(168, 85, 247, 0.12)', textColor: '#9333ea', baseCost: 45000 },
  { name: 'Ubiquiti UniFi Dream Machine Pro', category: 'Networking & Office', icon: 'router', color: 'rgba(168, 85, 247, 0.12)', textColor: '#9333ea', baseCost: 35000 },
  { name: 'HP LaserJet Enterprise MFP', category: 'Networking & Office', icon: 'router', color: 'rgba(168, 85, 247, 0.12)', textColor: '#9333ea', baseCost: 60000 },
  { name: 'Epson EcoTank Pro Wireless Printer', category: 'Networking & Office', icon: 'router', color: 'rgba(168, 85, 247, 0.12)', textColor: '#9333ea', baseCost: 30000 },
  
  // 5. Gaming & Virtual Reality (Meta, Apple, HTC, Sony, Microsoft, Nintendo, ASUS, Lenovo, MSI, Custom)
  { name: 'Meta Quest 3 VR Headset', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 45000 },
  { name: 'Apple Vision Pro Spatial Headset', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 300000 },
  { name: 'HTC Vive Pro 2 VR System', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 110000 },
  { name: 'Sony PlayStation 5 Slim', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 45000 },
  { name: 'Microsoft Xbox Series X', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 45000 },
  { name: 'Nintendo Switch OLED Model', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 32000 },
  { name: 'ASUS ROG Ally Handheld', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 55000 },
  { name: 'Lenovo Legion Go Handheld', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 65000 },
  { name: 'MSI Aegis RS Gaming Desktop', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 150000 },
  { name: 'Custom Liquid-Cooled RTX 4090 Rig', category: 'Gaming & VR', icon: 'gamepad', color: 'rgba(239, 68, 68, 0.12)', textColor: '#dc2626', baseCost: 320000 }
];

// Helper to escape regex search query character strings
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Inline SVG Icon Renderer
const DeviceIcon = ({ type, style = {} }) => {
  switch (type) {
    case 'laptop':
      return <LaptopDevice style={style} />;
    case 'tv':
      return <TVDevice style={style} />;
    case 'camera':
      return <CameraDevice style={style} />;
    case 'router':
      return <RouterDevice style={style} />;
    case 'gamepad':
      return <GamepadDevice style={style} />;
    default:
      return <DefaultDeviceIcon style={style} />;
  }
};

export default function DeviceSelector({ value, onChange, error, onBlur }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPill, setSelectedPill] = useState('All');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  // Compile matching suggestions based on the typed value & selected category pill
  const getVisibleItems = () => {
    const query = typeof value === 'string' ? value.toLowerCase().trim() : '';
    
    // Hide all suggestions initially if search query is empty (requires input to show matches)
    if (!query) {
      return [];
    }

    // Filter by text search
    let list = EXISTING_DEVICES.filter(item =>
      item.name.toLowerCase().includes(query)
    );

    // Filter by category pill if selected
    if (selectedPill !== 'All') {
      list = list.filter(item => item.category === selectedPill);
    }

    return list;
  };

  const visibleItems = getVisibleItems();

  // Keep highlighted index in bounds
  useEffect(() => {
    if (visibleItems.length > 0) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [value, selectedPill]);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && visibleItems.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (visibleItems.length > 0) {
          setHighlightedIndex(prev => (prev + 1) % visibleItems.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (visibleItems.length > 0) {
          setHighlightedIndex(prev => (prev - 1 + visibleItems.length) % visibleItems.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < visibleItems.length) {
          onChange(visibleItems[highlightedIndex].name);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Search matches character highlights
  const renderHighlightedText = (text) => {
    const query = (value || '').trim();
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={index} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {part}
            </strong>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%' }}
    >
      <input
        ref={inputRef}
        type="text"
        className={`form-control ${error ? 'input-error-state' : ''}`}
        placeholder="Type device name, brand or model..."
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '40px',
          padding: '6px 12px',
          boxSizing: 'border-box',
          fontSize: '0.88rem'
        }}
      />

      {/* Suggestions Dropdown */}
      {isOpen && visibleItems.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '44px',
            left: 0,
            width: '100%',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
            zIndex: 999,
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Quick Filter Pills Row (Horizontal Scrollable) */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '6px', 
              padding: '6px 8px', 
              borderBottom: '1px solid #f1f5f9', 
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              background: '#f8fafc',
              flexShrink: 0
            }}
          >
            {[
              { id: 'All', label: 'All Devices' },
              { id: 'Computing', label: '💻 Computing' },
              { id: 'Audio Visual', label: '📺 A/V' },
              { id: 'Camera & Production', label: '📷 Camera' },
              { id: 'Networking & Office', label: '🔌 Office' },
              { id: 'Gaming & VR', label: '🎮 Gaming' }
            ].map(pill => {
              const active = selectedPill === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPill(pill.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    borderRadius: '12px',
                    border: active ? '1px solid var(--primary)' : '1px solid #cbd5e1',
                    background: active ? 'var(--primary)' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    fontWeight: active ? 700 : 'normal',
                    transition: 'all 0.1s ease',
                    flexShrink: 0,
                    outline: 'none'
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Suggestions List Container */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
            {visibleItems.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              const isSelected = item.name === value;

              return (
                <div
                  key={item.name}
                  onClick={() => {
                    onChange(item.name);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    color: isSelected ? 'var(--primary)' : '#334155',
                    background: isSelected 
                      ? 'var(--primary-glow)' 
                      : isHighlighted 
                        ? '#f8fafc' 
                        : '#ffffff',
                      cursor: 'pointer',
                      borderLeft: isHighlighted ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all 0.1s ease',
                      gap: '12px'
                  }}
                >
                  {/* Device icon + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <DeviceIcon type={item.icon} style={{ color: isSelected ? 'var(--primary)' : '#64748b' }} />
                    <span style={{ fontWeight: isSelected ? 600 : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {renderHighlightedText(item.name)}
                    </span>
                  </div>

                  {/* Category color-coded badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: item.color,
                        color: item.textColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {item.category}
                    </span>

                    {isSelected && (
                      <CheckCircleIcon size={12} style={{ color: 'var(--primary)' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
