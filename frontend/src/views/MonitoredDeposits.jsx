import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { BackArrowIcon, GoldCoinStack, EditIcon, EyeIcon, WarningTriangleIcon, CheckCircleIcon, ExclamationCircleIcon } from '../components/PremiumIcons';

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

  const safeSplitDate = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') return dateVal.split('T')[0];
    if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
    if (typeof dateVal.toISOString === 'function') return dateVal.toISOString().split('T')[0];
    return '';
  };

  const startQuickEdit = (rec) => {
    const displayDeposit = fromBase(rec.securityDepositHeld, currency);
    setEditingRecord(rec);
    setEditName(rec.customerName || '');
    setEditEmail(rec.customerEmail || '');
    setEditPhone(rec.customerPhone || '');
    setEditDeviceModel(rec.deviceModel || '');
    setEditDeposit(Math.round(displayDeposit).toString());
    setEditEndDate(safeSplitDate(rec.endDate));
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
          <BackArrowIcon size={14} style={{ verticalAlign: 'middle' }} />
          Back
        </button>
      </div>

      {/* View Header */}
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GoldCoinStack size={20} />
            </div>
            Monitored Security Deposits
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
                      {r.settlementStatus === 'Settled' && r.settlementAt && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap' }}>
                          On: {new Date(r.settlementAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => startQuickEdit(r)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleActionClick(r.rentalId, 'customer-detail')}
                          className="btn btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <EyeIcon size={12} />
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
