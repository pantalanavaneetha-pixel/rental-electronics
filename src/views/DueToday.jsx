import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function DueToday({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase }) {
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

  const handleFileReturnClick = (id) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url);
    setView('return');
  };

  const handleDetailsClick = (id) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url);
    setView('customer-detail');
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();

  // Filter active records (Held status means active lease)
  const activeRecords = records.filter(r => r.settlementStatus === 'Held' && r.endDate);

  // Group into today and overdue
  const dueTodayOriginal = activeRecords.filter(r => r.endDate.split('T')[0] === todayStr);
  const overdueOriginal = activeRecords.filter(r => r.endDate.split('T')[0] < todayStr);

  const applySearch = (list) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(r => 
      (r.rentalId && r.rentalId.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
      (r.deviceModel && r.deviceModel.toLowerCase().includes(q))
    );
  };

  const filteredDueToday = applySearch(dueTodayOriginal);
  const filteredOverdue = applySearch(overdueOriginal);

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
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
                <defs>
                  <linearGradient id="dueCalHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="dueCalBody" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f1f5f9" />
                  </linearGradient>
                </defs>
                <rect x="15" y="20" width="70" height="70" rx="10" fill="url(#dueCalBody)" stroke="#94a3b8" strokeWidth="2.5" />
                <path d="M15 30C15 24.4772 19.4772 20 25 20H75C80.5228 20 85 24.4772 85 30V40H15V30Z" fill="url(#dueCalHeader)" />
                <rect x="30" y="10" width="8" height="15" rx="4" fill="#64748b" />
                <rect x="62" y="10" width="8" height="15" rx="4" fill="#64748b" />
                <rect x="25" y="50" width="10" height="10" rx="2" fill="#cbd5e1" />
                <rect x="45" y="50" width="10" height="10" rx="2" fill="#cbd5e1" />
                <rect x="65" y="50" width="10" height="10" rx="2" fill="#cbd5e1" />
                <rect x="25" y="68" width="10" height="10" rx="2" fill="#cbd5e1" />
                <rect x="45" y="68" width="10" height="10" rx="2" fill="#ef4444" />
                <rect x="65" y="68" width="10" height="10" rx="2" fill="#cbd5e1" />
                <circle cx="78" cy="78" r="14" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <path d="M78 70V78H84" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            Devices Due Today
          </h1>
          <p className="muted-description" style={{ marginTop: '0.2rem' }}>
            Monitor and process electronic rental assets scheduled to be returned today or overdue.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search outstanding returns..."
            style={{ minWidth: '260px', fontSize: '0.85rem', height: '38px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        {/* 1. RETURNS DUE TODAY SECTION */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></span>
            Returns Due Today ({dueTodayOriginal.length})
          </h2>

          {dueTodayOriginal.length === 0 ? (
            <div className="alert-message-box alert-success-style" style={{ margin: '0 0 0.5rem 0', padding: '16px', borderRadius: '8px', borderWidth: '1px' }}>
              <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="alert-message-content" style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>No Devices Due Today (0 Items)</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4, fontWeight: 500 }}>
                  There are no electronic assets scheduled for return today.
                </p>
              </div>
            </div>
          ) : filteredDueToday.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              No returns due today match your search query.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '10px 8px' }}>Rental ID</th>
                    <th>Customer Info</th>
                    <th>Device Assigned</th>
                    <th>Deposit Held</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDueToday.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <span className="rental-tracking-id">{r.rentalId}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.customerEmail}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.customerPhone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.deviceModel}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>S/N: {r.deviceSerial || 'N/A'}</div>
                      </td>
                      <td style={{ fontWeight: 700 }} className="currency-amount">
                        {formatVal(r.securityDepositHeld)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => startQuickEdit(r)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Quick Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDetailsClick(r.rentalId)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFileReturnClick(r.rentalId)}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            File Return
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. OVERDUE RETURNS SECTION */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></span>
            Overdue Returns ({overdueOriginal.length})
          </h2>

          {overdueOriginal.length === 0 ? (
            <div className="alert-message-box alert-success-style" style={{ margin: '0 0 0.5rem 0', padding: '16px', borderRadius: '8px', borderWidth: '1px' }}>
              <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="alert-message-content" style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>No Overdue Returns (0 Items)</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4, fontWeight: 500 }}>
                  All active rentals are within their scheduled lease duration. No customer follow-ups required.
                </p>
              </div>
            </div>
          ) : filteredOverdue.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              No overdue returns match your search query.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '10px 8px' }}>Rental ID</th>
                    <th>Customer / Contact Info</th>
                    <th>Device Assigned</th>
                    <th>Scheduled Return</th>
                    <th>Deposit</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverdue.map((r, idx) => {
                    const endPart = r.endDate.split('T')[0];
                    const overdueDays = Math.max(1, Math.round((new Date(todayStr) - new Date(endPart)) / (1000 * 60 * 60 * 24)));

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '10px 8px' }}>
                          <span className="rental-tracking-id" style={{ color: 'var(--danger)', fontWeight: 700 }}>{r.rentalId}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.customerEmail}</div>
                          
                          {/* Highlighted customer phone number link for immediate contact */}
                          <div style={{ fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              background: 'var(--primary-glow)',
                              borderRadius: '4px',
                              border: '1px solid rgba(99, 102, 241, 0.2)'
                            }}>
                              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="var(--primary)" style={{ width: '13px', height: '13px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a20.373 20.373 0 01-9.336-9.337c-.155-.44.01-.927.387-1.21l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.11-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                              <a href={`tel:${r.customerPhone}`} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }} title="Click to dial customer phone number">
                                {r.customerPhone || 'N/A'}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{r.deviceModel}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>S/N: {r.deviceSerial || 'N/A'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
                            {new Date(r.endDate).toLocaleDateString()}
                          </div>
                          <span style={{ 
                            padding: '2px 6px', 
                            background: 'rgba(239, 68, 68, 0.12)', 
                            color: '#ef4444', 
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            display: 'inline-block',
                            marginTop: '4px'
                          }}>
                            OVERDUE BY {overdueDays} DAYS
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }} className="currency-amount">
                          {formatVal(r.securityDepositHeld)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => startQuickEdit(r)}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              Quick Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDetailsClick(r.rentalId)}
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFileReturnClick(r.rentalId)}
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              File Return
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
