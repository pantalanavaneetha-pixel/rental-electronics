import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { BackArrowIcon, CalendarDue, CheckCircleIcon, ExclamationCircleIcon, PhoneIcon, EditIcon, WarningTriangleIcon } from '../components/PremiumIcons';

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
          <BackArrowIcon size={14} style={{ verticalAlign: 'middle' }} />
          Back
        </button>
      </div>

      {/* View Header */}
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarDue size={20} style={{ verticalAlign: 'middle' }} />
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
                <CheckCircleIcon size={20} />
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
                            <EditIcon size={16} />
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
                <CheckCircleIcon size={20} />
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
                              <PhoneIcon size={13} style={{ color: 'var(--primary)' }} />
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
                              <EditIcon size={16} />
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
        <div className="ops-modal-overlay">
          <form onSubmit={handleQuickEditSubmit} className="ops-modal-container">
            <div className="ops-modal-header">
              <h3 className="ops-modal-header-title">
                <EditIcon size={20} style={{ color: 'var(--primary)' }} />
                Edit: {editingRecord.rentalId}
              </h3>
              <button 
                type="button"
                onClick={closeQuickEdit}
                className="ops-modal-close-btn"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="ops-modal-body">
              {editError && (
                <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div className="alert-message-icon-wrapper">
                    <WarningTriangleIcon size={16} />
                  </div>
                  <div className="alert-message-content">
                    <strong>{editError}</strong>
                  </div>
                </div>
              )}

              {editSuccess && (
                <div className="alert-message-box alert-success-style" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div className="alert-message-icon-wrapper">
                    <CheckCircleIcon size={16} />
                  </div>
                  <div className="alert-message-content">
                    <strong>{editSuccess}</strong>
                  </div>
                </div>
              )}

              <div className="ops-grid-2">
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
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
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
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                      {editEmail.trim() === '' ? 'Customer email is required' : 'Enter a valid email address'}
                    </div>
                  )}
                </div>
              </div>

              <div className="ops-grid-2">
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
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
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
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                      Device model is required
                    </div>
                  )}
                </div>
              </div>

              <div className="ops-grid-2">
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
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                      Scheduled return date is required
                    </div>
                  )}
                  {editEndDate && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, marginTop: '4px' }}>
                      {getDaysLeftText(editEndDate)}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Security Deposit Held ({activeSymbol})</label>
                  <div className="ops-input-prefix-wrapper">
                    <span className="ops-input-prefix">
                      {activeSymbol}
                    </span>
                    <input 
                      type="number" 
                      className={`form-control ops-input-with-prefix ${editTouched.deposit && (editDeposit === '' || parseFloat(editDeposit) < 0) ? 'input-error-state' : ''}`}
                      min="0"
                      onKeyDown={blockInvalidChar}
                      value={editDeposit} 
                      onChange={(e) => setEditDeposit(e.target.value)}
                      onBlur={() => setEditTouched(prev => ({ ...prev, deposit: true }))}
                      required
                    />
                  </div>
                  {editTouched.deposit && (editDeposit === '' || parseFloat(editDeposit) < 0) && (
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                      Security deposit amount is required
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="ops-modal-footer">
              <button 
                type="button" 
                onClick={closeQuickEdit}
                className="btn btn-secondary"
                disabled={editSubmitting}
                style={{ flex: 1, height: '42px' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`btn btn-primary ${editSubmitting || !isEditFormValid() ? 'btn-disabled' : ''}`}
                disabled={editSubmitting || !isEditFormValid()}
                style={{ flex: 1, height: '42px' }}
              >
                {editSubmitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
