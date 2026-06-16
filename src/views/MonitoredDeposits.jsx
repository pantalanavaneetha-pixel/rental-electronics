import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function MonitoredDeposits({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Edit Modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDeviceModel, setEditDeviceModel] = useState('');
  const [editDeposit, setEditDeposit] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editTouched, setEditTouched] = useState({
    name: false,
    email: false,
    phone: false,
    deviceModel: false,
    endDate: false,
    deposit: false
  });

  // Keyboard gates
  const blockNumbersOnName = (e) => {
    if (e.key.length === 1 && /[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const blockAlphaOnPhone = (e) => {
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const blockInvalidChar = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const getDaysLeftText = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    // Set both to midnight to ignore time part
    const end = new Date(Date.UTC(year, month, day));
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    const diffTime = end - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `(${diffDays} days left to return)`;
    } else if (diffDays === 0) {
      return '(Returns today!)';
    } else {
      return `(Overdue by ${Math.abs(diffDays)} days)`;
    }
  };

  const isEditFormValid = () => {
    return editName.trim() !== '' &&
           isValidEmail(editEmail.trim()) &&
           editPhone.trim() !== '' &&
           editDeviceModel.trim() !== '' &&
           editDeposit !== '' &&
           parseFloat(editDeposit) >= 0 &&
           editEndDate !== '';
  };

  const startQuickEdit = (rec) => {
    const displayDeposit = fromBase(rec.securityDepositHeld, currency);
    setEditingRecord(rec);
    setEditName(rec.customerName || '');
    setEditEmail(rec.customerEmail || '');
    setEditPhone(rec.customerPhone || '');
    setEditDeviceModel(rec.deviceModel || '');
    setEditDeposit(Math.round(displayDeposit).toString());
    setEditEndDate(rec.endDate ? rec.endDate.split('T')[0] : '');
    setEditError('');
    setEditSuccess('');
    setEditTouched({
      name: false,
      email: false,
      phone: false,
      deviceModel: false,
      endDate: false,
      deposit: false
    });
  };

  const closeQuickEdit = () => {
    setEditingRecord(null);
  };

  const handleQuickEditSubmit = (e) => {
    e.preventDefault();
    setEditError('');
    setEditSuccess('');

    if (!isEditFormValid()) {
      setEditError('Please fill out all required fields correctly.');
      return;
    }

    setEditSubmitting(true);
    const depositNum = parseFloat(editDeposit);
    const depositInBase = toBase(depositNum, currency);

    const updatedPayload = {
      userName: editName.trim(),
      userEmail: editEmail.trim(),
      userPhone: editPhone.trim().replace(/[-\s]/g, ''),
      deviceModel: editDeviceModel.trim(),
      securityDepositHeld: depositInBase,
      endDate: editEndDate ? new Date(editEndDate).toISOString() : null
    };

    fetch(`http://localhost:5000/api/rentals/${editingRecord.rentalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedPayload)
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update record on server.');
      return data;
    })
    .then(payload => {
      const updatedRec = payload.data;
      const updatedRecords = records.map(r => r.rentalId === editingRecord.rentalId ? { ...r, ...updatedRec } : r);
      setRecords(updatedRecords);
      setEditSuccess('Record updated successfully!');
      setTimeout(() => {
        closeQuickEdit();
      }, 1000);
    })
    .catch(err => {
      console.error(err);
      setEditError(err.message || 'Server error while updating the record.');
    })
    .finally(() => {
      setEditSubmitting(false);
    });
  };

  const handleActionClick = (id, targetView) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url);
    setView(targetView);
  };

  // Filter records based on search query
  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.rentalId && r.rentalId.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
      (r.deviceModel && r.deviceModel.toLowerCase().includes(q))
    );
  });

  const activeSymbol = currencyConfig[currency].symbol;

  return (
    <div className="animated-view" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Back to Dashboard Button */}
      <div style={{ marginBottom: '0.75rem' }}>
        <button
          onClick={() => setView('dashboard')}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* View Header */}
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="headerGoldSide" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#b45309" />
                    <stop offset="25%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="75%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="headerGoldCap" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <g>
                  <path d="M30 35 V75 C30 80.5 40 85 52.5 85 C65 85 75 80.5 75 75 V35 Z" fill="url(#headerGoldSide)" />
                  <path d="M30 43 C30 48.5 40 53 52.5 53 C65 53 75 48.5 75 43 M30 51 C30 56.5 40 61 52.5 61 C65 61 75 56.5 75 51 M30 59 C30 64.5 40 69 52.5 69 C65 69 75 64.5 75 59 M30 67 C30 72.5 40 77 52.5 77 C65 77 75 72.5 75 67" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.4" />
                  <ellipse cx="52.5" cy="35" rx="22.5" ry="10" fill="url(#headerGoldCap)" stroke="#d97706" strokeWidth="1.5" />
                </g>
                <g>
                  <path d="M50 50 V85 C50 89.5 59 93 70 93 C81 93 90 89.5 90 85 V50 Z" fill="url(#headerGoldSide)" />
                  <path d="M50 57 C50 61.5 59 65 70 65 C81 65 90 61.5 90 57 M50 64 C50 68.5 59 72 70 72 C81 72 90 68.5 90 64 M50 71 C50 75.5 59 79 70 79 C81 79 90 75.5 90 71 M50 78 C50 82.5 59 86 70 86 C81 86 90 82.5 90 78" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.4" />
                  <ellipse cx="70" cy="50" rx="20" ry="8" fill="url(#headerGoldCap)" stroke="#d97706" strokeWidth="1.5" />
                </g>
                <g>
                  <path d="M10 65 V90 C10 93.8 19 97 30 97 C41 97 50 93.8 50 90 V65 Z" fill="url(#headerGoldSide)" />
                  <path d="M10 71.25 C10 75.05 19 78.25 30 78.25 C41 78.25 50 75.05 50 71.25 M10 77.5 C10 81.3 19 84.5 30 84.5 C41 84.5 50 81.3 50 77.5 M10 83.75 C10 87.55 19 90.75 30 90.75 C41 90.75 50 87.55 50 83.75" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.4" />
                  <ellipse cx="30" cy="65" rx="20" ry="8" fill="url(#headerGoldCap)" stroke="#d97706" strokeWidth="1.5" />
                </g>
              </svg>
            </div>
            Monitored Deposit Breakdown
          </h1>
          <p className="muted-description" style={{ marginTop: '0.2rem' }}>
            View security deposit ledgers, active coverage metrics, and release authorizations.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search deposits..."
            style={{ minWidth: '240px', fontSize: '0.85rem', height: '38px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <div className="table-container" style={{ border: 'none', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 10px' }}>Rental ID</th>
                <th>Customer Info</th>
                <th>Device Assigned</th>
                <th>Deposit Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No deposits matching the search query found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <span className="rental-tracking-id">{r.rentalId}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.customerEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.deviceModel}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Serial: {r.deviceSerial || 'N/A'}</div>
                    </td>
                    <td style={{ fontWeight: 700 }} className="currency-amount">
                      {formatVal(r.securityDepositHeld)}
                    </td>
                    <td>
                      <StatusBadge status={r.settlementStatus} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => startQuickEdit(r)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Quick Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick(r.rentalId, 'customer-detail')}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {editingRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel" style={{
            width: '90%',
            maxWidth: '500px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            animation: 'viewGlide 0.3s ease-out',
            border: '1px solid var(--border-color)'
          }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', fontWeight: 700 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Quick Edit: {editingRecord.rentalId}
              </h3>
              <button 
                type="button"
                onClick={closeQuickEdit}
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleQuickEditSubmit}>
              {editError && (
                <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div className="alert-message-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="alert-message-content">
                    <strong>{editError}</strong>
                  </div>
                </div>
              )}

              {editSuccess && (
                <div className="alert-message-box alert-success-style" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div className="alert-message-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="alert-message-content">
                    <strong>{editSuccess}</strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Customer Full Name</label>
                <input 
                  type="text" 
                  className={`form-control ${editTouched.name && editName.trim() === '' ? 'input-error-state' : ''}`}
                  value={editName}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^a-zA-Z\s\-\.]/g, '');
                    setEditName(sanitized);
                  }}
                  onKeyDown={blockNumbersOnName}
                  onBlur={() => setEditTouched(prev => ({ ...prev, name: true }))}
                  required
                />
                {editTouched.name && editName.trim() === '' && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Customer name is required
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Customer Email Address</label>
                <input 
                  type="email" 
                  className={`form-control ${editTouched.email && (editEmail.trim() === '' || !isValidEmail(editEmail.trim())) ? 'input-error-state' : ''}`}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  onBlur={() => setEditTouched(prev => ({ ...prev, email: true }))}
                  required
                />
                {editTouched.email && (editEmail.trim() === '' || !isValidEmail(editEmail.trim())) && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {editEmail.trim() === '' ? 'Customer email is required' : 'Enter a valid email address'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Customer Phone Number</label>
                <input 
                  type="text" 
                  className={`form-control ${editTouched.phone && editPhone.trim() === '' ? 'input-error-state' : ''}`}
                  value={editPhone}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9\+]/g, '');
                    setEditPhone(sanitized);
                  }}
                  onKeyDown={blockAlphaOnPhone}
                  onBlur={() => setEditTouched(prev => ({ ...prev, phone: true }))}
                  required
                />
                {editTouched.phone && editPhone.trim() === '' && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Phone number is required
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Device Model & Brand</label>
                <input 
                  type="text" 
                  className={`form-control ${editTouched.deviceModel && editDeviceModel.trim() === '' ? 'input-error-state' : ''}`}
                  value={editDeviceModel}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^a-zA-Z0-9\s\-\.]/g, '');
                    setEditDeviceModel(sanitized);
                  }}
                  onBlur={() => setEditTouched(prev => ({ ...prev, deviceModel: true }))}
                  required
                />
                {editTouched.deviceModel && editDeviceModel.trim() === '' && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Device model is required
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Scheduled Return Date</label>
                <input 
                  type="date" 
                  className={`form-control ${editTouched.endDate && editEndDate === '' ? 'input-error-state' : ''}`}
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  onBlur={() => setEditTouched(prev => ({ ...prev, endDate: true }))}
                  required
                />
                {editTouched.endDate && editEndDate === '' && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Scheduled return date is required
                  </div>
                )}
                {editEndDate && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, marginTop: '4px' }}>
                    {getDaysLeftText(editEndDate)}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Security Deposit Held ({activeSymbol})</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    {activeSymbol}
                  </span>
                  <input 
                    type="number" 
                    className={`form-control ${editTouched.deposit && (editDeposit === '' || parseFloat(editDeposit) < 0) ? 'input-error-state' : ''}`}
                    min="0"
                    onKeyDown={blockInvalidChar}
                    style={{ paddingLeft: '2.2rem' }}
                    value={editDeposit} 
                    onChange={(e) => setEditDeposit(e.target.value)}
                    onBlur={() => setEditTouched(prev => ({ ...prev, deposit: true }))}
                    required
                  />
                </div>
                {editTouched.deposit && (editDeposit === '' || parseFloat(editDeposit) < 0) && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Security deposit amount is required
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={closeQuickEdit}
                  className="btn btn-secondary"
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary ${editSubmitting || !isEditFormValid() ? 'btn-disabled' : ''}`}
                  disabled={editSubmitting || !isEditFormValid()}
                >
                  {editSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
