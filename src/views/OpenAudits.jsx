import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';

// Helper to parse late fees and damage deductions
const parseDeductions = (record) => {
  if (!record) return { damagePenalty: 0, lateFee: 0 };
  const totalDeduction = parseFloat(record.damageDeduction) || 0;
  const lateFee = parseFloat(record.lateFeeCharged) || 0;
  const damagePenalty = Math.max(0, totalDeduction - lateFee);
  return { damagePenalty, lateFee };
};

export default function OpenAudits({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase }) {
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
            <div style={{ background: 'var(--warning-glow)', color: 'var(--warning)', width: '36px', height: '36px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="audFolderBack" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>
                  <linearGradient id="audFolderFront" x1="10" y1="35" x2="90" y2="85" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#facc15" />
                  </linearGradient>
                </defs>
                <path d="M10 25C10 22.2386 12.2386 20 15 20H38C40.054 20 41.9163 21.2533 42.6738 23.147L46.4674 32.6304C46.8461 33.5773 47.7773 34.2038 48.7937 34.2038H85C87.7614 34.2038 90 36.4424 90 39.2038V75C90 77.7614 87.7614 80 85 80H15C12.2386 80 10 77.7614 10 75V25Z" fill="url(#audFolderBack)" />
                <path d="M10 39C10 36.2386 12.2386 34 15 34H85C87.7614 34 90 36.2386 90 39V75C90 77.7614 87.7614 80 85 80H15C12.2386 80 10 77.7614 10 75V39Z" fill="url(#audFolderFront)" />
              </svg>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Quick Edit
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          Resolve Triage
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
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
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                      {isVerified ? 'AI Verified' : 'Run AI Scan'}
                    </button>

                    <button
                      onClick={() => handleProceedToSettlement(r.rentalId)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <polyline points="12 4 20 12 12 20" />
                      </svg>
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
