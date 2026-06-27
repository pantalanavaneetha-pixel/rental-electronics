import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import { BackArrowIcon, OpenAuditsFolder, CheckCircleIcon, ExclamationCircleIcon, EditIcon, EyeIcon, WarningTriangleIcon, FastTrackIcon, ForwardArrowIcon, InfoCircleIcon } from '../components/PremiumIcons';

// Helper to parse late fees and damage deductions
const parseDeductions = (record) => {
  if (!record) return { damagePenalty: 0, lateFee: 0 };
  const totalDeduction = parseFloat(record.damageDeduction) || 0;
  const lateFee = parseFloat(record.lateFeeCharged) || 0;
  const damagePenalty = Math.max(0, totalDeduction - lateFee);
  return { damagePenalty, lateFee };
};

export default function OpenAudits({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase, userRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Scan simulator state
  const [scanningId, setScanningId] = useState(null);
  const [verifiedClaims, setVerifiedClaims] = useState(() => {
    const saved = localStorage.getItem('rentshield_cc_verified_claims');
    return saved ? JSON.parse(saved) : {};
  });

  // Quick Edit Modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDeviceModel, setEditDeviceModel] = useState('');
  const [editDeposit, setEditDeposit] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editTouched, setEditTouched] = useState({
    name: false,
    email: false,
    phone: false,
    deviceModel: false,
    deposit: false
  });

  // Sync verified claims to localStorage
  useEffect(() => {
    localStorage.setItem('rentshield_cc_verified_claims', JSON.stringify(verifiedClaims));
  }, [verifiedClaims]);

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

  const isEditFormValid = () => {
    return editName.trim() !== '' &&
           isValidEmail(editEmail.trim()) &&
           editPhone.trim() !== '' &&
           editDeviceModel.trim() !== '' &&
           editDeposit !== '' &&
           parseFloat(editDeposit) >= 0;
  };

  // Quick edit details functions
  const startQuickEdit = (rec) => {
    const displayDeposit = fromBase(rec.securityDepositHeld, currency);
    setEditingRecord(rec);
    setEditName(rec.customerName || '');
    setEditEmail(rec.customerEmail || '');
    setEditPhone(rec.customerPhone || '');
    setEditDeviceModel(rec.deviceModel || '');
    setEditDeposit(Math.round(displayDeposit).toString());
    setEditError('');
    setEditSuccess('');
    setEditTouched({
      name: false,
      email: false,
      phone: false,
      deviceModel: false,
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
      securityDepositHeld: depositInBase
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

  // Run simulated AI Scan
  const runAIScan = (rentalId) => {
    setScanningId(rentalId);
    setTimeout(() => {
      setScanningId(null);
      setVerifiedClaims(prev => ({
        ...prev,
        [rentalId]: true
      }));
    }, 2000);
  };

  // Toggle emergency triage
  const handleToggleTriage = (rentalId) => {
    fetch(`http://localhost:5000/api/rentals/${rentalId}/triage`, {
      method: 'PATCH'
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle triage on server.');
      return data;
    })
    .then(payload => {
      const updatedRec = payload.data;
      const updatedRecords = records.map(r => r.rentalId === rentalId ? { ...r, ...updatedRec } : r);
      setRecords(updatedRecords);
    })
    .catch(err => {
      console.error('Error toggling triage:', err);
      alert(err.message || 'Failed to update triage status.');
    });
  };

  // Navigate to settlement desk and pre-select this rental ID
  const handleProceedToSettlement = (rentalId) => {
    // Write query parameter to window search bar
    const url = new URL(window.location.href);
    url.searchParams.set('id', rentalId);
    window.history.pushState({}, '', url);
    setView('settlement');
  };

  const handleDetailsClick = (rentalId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', rentalId);
    window.history.pushState({}, '', url);
    setView('customer-detail');
  };

  // Filter records to get only open audits ('Under Review' or 'Isolated Repair')
  const openAuditRecords = records.filter(r => 
    r.settlementStatus === 'Under Review' || r.settlementStatus === 'Isolated Repair'
  );

  const filteredRecords = openAuditRecords.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.rentalId && r.rentalId.toLowerCase().includes(q)) ||
      (r.customerId && r.customerId.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
      (r.deviceModel && r.deviceModel.toLowerCase().includes(q)) ||
      (r.damageType && r.damageType.toLowerCase().includes(q))
    );
  });

  const activeSymbol = currencyConfig[currency].symbol;

  return (
    <div className="animated-view" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <button
          onClick={() => setView(userRole === 'Accounts Staff' ? 'settlement' : 'dashboard')}
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
          {userRole === 'Accounts Staff' ? 'Back to Settlement Desk' : 'Back'}
        </button>
      </div>

      {/* View Header */}
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <div style={{ background: 'var(--warning-glow)', color: 'var(--warning)', width: '36px', height: '36px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <OpenAuditsFolder size={20} />
            </div>
            Open Returns & Damage Audits
          </h1>
          <p className="muted-description" style={{ marginTop: '0.2rem' }}>
            Verify structural integrity, assess physical damage penalties, and isolate triage units.
          </p>
        </div>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search open audits..."
            style={{ minWidth: '240px', fontSize: '0.85rem', height: '38px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main content grid */}
      <div style={{ flex: 1, minHeight: 0 }} className="table-container">
        {filteredRecords.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircleIcon size={24} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700 }}>All Audits Cleared</h3>
            <p style={{ color: 'var(--text-secondary)', maxW: '400px', margin: 0, fontSize: '0.9rem' }} className="muted-description">
              There are currently no return inspections pending damage review or triage assessment.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1.5rem' }}>
            {filteredRecords.map((r) => {
              const { damagePenalty, lateFee } = parseDeductions(r);
              const photos = r.photoEvidenceUrl ? r.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
              const isTriage = r.settlementStatus === 'Isolated Repair';
              const isVerified = verifiedClaims[r.rentalId] || false;
              const isScanning = scanningId === r.rentalId;

              return (
                <div 
                  key={r.rentalId} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.25rem',
                    borderLeft: isTriage 
                      ? '4px solid #ef4444' 
                      : '4px solid var(--warning)',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Scanner overlay effect inside the specific card */}
                  {isScanning && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(13, 20, 38, 0.9)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}>
                      <div className="laser-scan-line" style={{
                        position: 'absolute',
                        left: 0,
                        width: '100%',
                        height: '3px',
                        background: 'linear-gradient(90deg, rgba(239,68,68,0) 0%, #ef4444 50%, rgba(239,68,68,0) 100%)',
                        boxShadow: '0 0 10px #ef4444',
                        animation: 'laserScan 1.2s ease-in-out infinite'
                      }} />
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid transparent',
                        borderTopColor: 'var(--warning)',
                        borderRightColor: 'var(--warning)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
                        AI Core analyzing structural asset integrity...
                      </span>
                    </div>
                  )}

                  {/* Header Row */}
                  <div className="flex-between" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="rental-tracking-id">{r.rentalId}</span>
                      <StatusBadge status={r.settlementStatus} />
                      {isTriage && (
                        <span style={{
                          padding: '2px 8px',
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em'
                        }}>
                          PRIORITY REPAIR RE-ROUTE
                        </span>
                      )}
                    </div>
                    
                    {/* KYC Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="muted-description" style={{ fontSize: '0.75rem' }}>KYC:</span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        color: r.kycStatus === 'Verified' ? 'var(--success)' : 'var(--danger)',
                        background: r.kycStatus === 'Verified' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {r.kycStatus}
                      </span>
                    </div>
                  </div>

                  {/* Body Workspace Grid */}
                  <div className="grid-3" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    {/* Customer Profile info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Profile</strong>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.customerName}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ID: {r.customerId || 'N/A'}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Email: {r.customerEmail}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Phone: {r.customerPhone}</span>
                    </div>

                    {/* Device Assignments */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assigned Asset</strong>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.deviceModel}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Serial: {r.deviceSerial || 'N/A'}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '4px' }}>
                        <span className="muted-description">Deposit Held:</span>
                        <strong className="currency-amount">{formatVal(r.securityDepositHeld)}</strong>
                      </div>
                    </div>

                    {/* Timeline & Fees */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Timeline Parameters</strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span className="muted-description">Start:</span>
                        <span>{r.startDate ? new Date(r.startDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span className="muted-description">End:</span>
                        <span>{r.endDate ? new Date(r.endDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {r.daysOverdue > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: '4px', color: 'var(--danger)', fontWeight: 600 }}>
                          <span>Late Days ({r.daysOverdue} days):</span>
                          <span>+{formatVal(r.lateFeeCharged)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Damages & Photo Evidence Carousel */}
                  <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(120, 120, 120, 0.02)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>Reported Damages</strong>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)' }}>
                          {r.damageType} {r.damageDeduction > 0 && `(Penalty: -${formatVal(r.damageDeduction)})`}
                        </span>
                      </div>

                      {/* Photo evidence label */}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {photos.length} Photo Attachments
                      </span>
                    </div>

                    {/* Evidence Gallery Carousel */}
                    {photos.length > 0 ? (
                      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {photos.map((photo, idx) => (
                          <div 
                            key={idx} 
                            style={{ width: '80px', height: '60px', borderRadius: '4px', border: '1px solid var(--border-color)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                            onClick={() => window.open(photo, '_blank')}
                            title="Click to view full photo"
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          >
                            <img src={photo} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No photo attachments uploaded for return.
                      </span>
                    )}
                  </div>

                  {/* AI Scanner Verification Integrity Box */}
                  <div className={`alert-message-box ${isVerified ? 'alert-success-style' : 'alert-warning-style'}`} style={{ marginBottom: '1rem', fontSize: '0.8rem' }}>
                    <div className="alert-message-icon-wrapper">
                      {isVerified ? (
                        <CheckCircleIcon size={16} />
                      ) : (
                        <InfoCircleIcon size={16} />
                      )}
                    </div>
                    <div className="alert-message-content">
                      {isVerified ? (
                        <strong>AI Verification: 98% Match - Structural Damage Confirmed. Claim Authorized.</strong>
                      ) : (
                        <strong>Verification Pending: Trigger AI Core Assessment scan to confirm structural asset integrity.</strong>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => startQuickEdit(r)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <EditIcon size={16} />
                    </button>

                    <button
                      onClick={() => handleDetailsClick(r.rentalId)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <EyeIcon size={12} />
                      Details
                    </button>

                    <button
                      onClick={() => handleToggleTriage(r.rentalId)}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        color: isTriage ? 'var(--success)' : 'var(--danger)',
                        borderColor: isTriage ? 'var(--success)' : 'var(--danger)',
                        background: 'transparent'
                      }}
                    >
                      {isTriage ? (
                        <>
                          <CheckCircleIcon size={12} />
                          Resolve Triage
                        </>
                      ) : (
                        <>
                          <WarningTriangleIcon size={12} />
                          Escalate to Triage
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => runAIScan(r.rentalId)}
                      className={`btn btn-secondary ${isVerified ? 'btn-disabled' : ''}`}
                      disabled={isVerified}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FastTrackIcon size={12} />
                      {isVerified ? 'AI Verified' : 'Run AI Scan'}
                    </button>

                    <button
                      onClick={() => handleProceedToSettlement(r.rentalId)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ForwardArrowIcon size={12} />
                      Settle Claim
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
