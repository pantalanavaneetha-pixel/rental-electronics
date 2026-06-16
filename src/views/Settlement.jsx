import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

/**
 * Extracts the split deduction values from a record.
 * Uses the server-provided lateFeeCharged field (from the DB) instead of
 * regex-parsing the damage description string — secure, clean, and reliable.
 */
const parseDeductions = (record) => {
  if (!record) return { damagePenalty: 0, lateFee: 0 };
  const totalDeduction = parseFloat(record.damageDeduction) || 0;
  const lateFee = parseFloat(record.lateFeeCharged) || 0;
  const damagePenalty = Math.max(0, totalDeduction - lateFee);
  return { damagePenalty, lateFee };
};

export default function Settlement({ records, setRecords, formatVal, currency, currencyConfig }) {
  // Local state for custom remarks and payment methods
  const [remarks, setRemarks] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const renderCustomerId = (id) => {
    if (!id) return 'N/A';
    const shortId = id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
    return (
      <span 
        className="badge-id" 
        title="Click to copy full Customer ID"
        style={{ 
          cursor: 'pointer', 
          fontFamily: 'monospace', 
          fontSize: '0.8rem', 
          padding: '3px 6px', 
          background: 'var(--bg-input)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '4px',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '8px',
          transition: 'all var(--transition-fast)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(id);
          alert(`Copied Customer ID: ${id}`);
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {shortId}
      </span>
    );
  };

  const downloadPDFReceipt = (receipt) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const netRefund = receipt.securityDepositHeld - receipt.damageDeduction;
    const hasDeficit = netRefund < 0;
    const absDiff = Math.abs(netRefund);

    // Document styling parameters
    doc.setFillColor(31, 41, 55); // Dark Slate header background
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("RENTSHIELD CC SETTLEMENT RECEIPT", 15, 25);
 
    // Metadata Block
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 50);
    doc.text(`Receipt Reference: RCP-${receipt.rentalId}`, 15, 55);
 
    // Customer & Rental Details Card
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(250, 250, 250);
    doc.rect(15, 65, 180, 50, 'FD'); // Details box
 
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text("Rental Transaction Details", 20, 73);
 
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Rental Reference ID: ${receipt.rentalId}`, 20, 83);
    doc.text(`Customer Name: ${receipt.customerName}`, 20, 89);
    doc.text(`Customer ID: ${receipt.customerId || 'N/A'}`, 20, 95);
    doc.text(`Device Model: ${receipt.deviceModel}`, 20, 101);
    doc.text(`Reconciliation Method: ${receipt.paymentMethod || 'Default'}`, 20, 107);
 
    // Financial breakdown Table
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text("Financial Breakdown", 15, 130);
 
    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, 135, 180, 8, 'F');
    doc.setFontSize(10);
    doc.text("Description", 20, 140);
    doc.text(`Amount (${currency})`, 160, 140, { align: 'right' });
 
    // Table Rows
    doc.setFont("Helvetica", "normal");
    
    // Row 1: Deposit
    doc.text("Security Deposit Held", 20, 150);
    doc.text(formatVal(receipt.securityDepositHeld), 160, 150, { align: 'right' });
 
    // Row 2: Damages  
    const { damagePenalty: pdfDamagePenalty, lateFee: pdfLateFee } = parseDeductions(receipt);
    doc.setTextColor(220, 38, 38);
    doc.text(`Assessed Physical Damage Penalty`, 20, 158);
    doc.text(`-${formatVal(pdfDamagePenalty)}`, 160, 158, { align: 'right' });
 
    // Row 3: Late Fees
    doc.setTextColor(180, 83, 9);
    doc.text(`Accumulated Overdue Daily Fees${receipt.daysOverdue ? ` (${receipt.daysOverdue} days)` : ''}`, 20, 166);
    doc.text(`-${formatVal(pdfLateFee)}`, 160, 166, { align: 'right' });
 
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 172, 195, 172);
 
    // Row 4: Totals
    doc.setFont("Helvetica", "bold");
    if (hasDeficit) {
      doc.setTextColor(220, 38, 38);
      doc.text("Outstanding Liability Due", 20, 180);
      doc.text(formatVal(absDiff), 160, 180, { align: 'right' });
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text("Net Refund Disbursed", 20, 180);
      doc.text(formatVal(netRefund), 160, 180, { align: 'right' });
    }
 
    // Notes Section (if remarks exist)
    if (receipt.notes) {
      doc.setTextColor(80, 80, 80);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Remarks & Notes:", 15, 190);
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(9.5);
      
      const splitNotes = doc.splitTextToSize(receipt.notes, 180);
      doc.text(splitNotes, 15, 196);
    }
 
    // Footer signature
    doc.setTextColor(150, 150, 150);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Thank you for choosing RentShield CC. This is a computer-generated transaction record.", 105, 275, { align: 'center' });
 
    doc.save(`RentShield_Receipt_${receipt.rentalId}.pdf`);
  };

  const closeClaim = (id) => {
    const record = records.find(r => r.rentalId === id);
    if (!record) return;

    const defaultNote = `Deduction applied due to: ${record.damageType}.`;
    const activeNote = remarks[id] !== undefined ? remarks[id] : defaultNote;

    const netRefund = record.securityDepositHeld - record.damageDeduction;
    const hasDeficit = netRefund < 0;
    const defaultMethod = hasDeficit ? "Corporate Invoice Issued" : "UPI Refund Transfer";
    const activeMethod = paymentMethods[id] || defaultMethod;

    // PATCH /api/settlements/:rentalId — flips status to Settled and timestamps approval
    fetch(`http://localhost:5000/api/settlements/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes: activeNote,
        paymentMethod: activeMethod,
        status: 'SETTLED',
        trackingStatus: 'SETTLED'
      })
    })
    .then(res => {
      if (!res.ok) throw new Error('API failed');
      return res.json();
    })
    .then(updatedRecord => {
      setRecords(records.map(r => r.rentalId === id ? updatedRecord : r));
    })
    .catch(err => {
      console.error(err);
      alert('Failed to process settlement on server. Check server status.');
    });
  };

  const filteredRecords = records.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.rentalId && r.rentalId.toLowerCase().includes(q)) ||
      (r.customerId && r.customerId.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
      (r.deviceModel && r.deviceModel.toLowerCase().includes(q))
    );
  });

  const openClaims = filteredRecords.filter(r =>
    r.settlementStatus === 'Under Review' || r.settlementStatus === 'Isolated Repair'
  );
  const settledClaims = filteredRecords.filter(r => r.settlementStatus === 'Settled');

  return (
    <div className="animated-view" style={{ overflow: 'auto' }}>
      
      {/* Pending Settlement Desk */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', verticalAlign: 'middle', marginRight: '6px' }}>
              <rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" fillOpacity="0.1" />
              <line x1="2" y1="10" x2="22" y2="10" />
              <circle cx="6" cy="15" r="1.5" fill="currentColor" />
              <circle cx="10" cy="15" r="1.5" fill="currentColor" />
            </svg>
            Finance Settlement & Reconciliation Panel
          </h3>
          <input
            type="text"
            className="form-control"
            placeholder="Search by ID, name, email..."
            style={{ maxWidth: '240px', fontSize: '0.85rem', height: '36px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {openClaims.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No pending internal damage disputes require review today.</p>
        ) : (
          openClaims.map((c, i) => {
            const defaultNote = `Deduction applied due to: ${c.damageType}.`;
            const activeNote = remarks[c.rentalId] !== undefined ? remarks[c.rentalId] : defaultNote;

            const netRefund = c.securityDepositHeld - c.damageDeduction;
            const hasDeficit = netRefund < 0;
            const absRefund = Math.abs(netRefund);

            const activeMethod = paymentMethods[c.rentalId] || (hasDeficit ? "Corporate Invoice" : "UPI Transfer");

            return (
              <div 
                key={i} 
                style={{ 
                  border: c.settlementStatus === 'Isolated Repair'
                    ? '1px solid rgba(245,158,11,0.55)'
                    : '1px solid var(--border-color)', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '16px', 
                  background: c.settlementStatus === 'Isolated Repair'
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.04))'
                    : 'var(--bg-main)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {/* Triage emergency notice at top of card */}
                {/* Triage emergency notice at top of card */}
                {c.settlementStatus === 'Isolated Repair' && (
                  <div 
                    className="alert-message-box alert-warning-style"
                    style={{
                      borderLeftWidth: '5px',
                      padding: '10px 14px',
                      marginBottom: '14px',
                      animation: 'triage-border-breathe 2.2s ease-in-out infinite'
                    }}
                  >
                    <div className="alert-message-icon-wrapper" style={{ alignSelf: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#d97706' }}>
                        <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <div className="alert-message-content">
                      <strong style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>ISOLATED REPAIR — Priority Queue</strong>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.1rem', fontWeight: 600 }}>
                        Device status: <strong style={{ color: '#ef4444' }}>ISOLATED_REPAIR</strong> · Battery isolation required before handling
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem',
                      fontWeight: 900, color: '#fff', letterSpacing: '0.06em',
                      background: '#ef4444',
                      animation: 'triage-badge-flash 1.4s ease-in-out infinite',
                      alignSelf: 'center'
                    }}>URGENT</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }} className="flex-between">
                  <div>
                    <span className="muted-description">Reference: </span><span className="rental-tracking-id">{c.rentalId}</span> - <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.customerName}</span> {renderCustomerId(c.customerId)}
                    {c.kycStatus === 'Pending' && (
                      <span className="validation-badge warning" style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px', verticalAlign: 'middle', marginLeft: '8px' }}>
                        <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '12px', height: '12px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        KYC PENDING
                      </span>
                    )}
                    {c.kycStatus === 'Rejected' && (
                      <span className="validation-badge danger" style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px', verticalAlign: 'middle', marginLeft: '8px', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                        <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '12px', height: '12px' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        KYC REJECTED
                      </span>
                    )}
                    <br />
                    <small className="muted-description">Equipment Class: {c.deviceModel}</small>
                  </div>
                  {c.photoEvidenceUrl && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                      <a href={c.photoEvidenceUrl} target="_blank" rel="noreferrer">
                        <img 
                          src={c.photoEvidenceUrl} 
                          alt="Evidence" 
                          className="evidence-thumbnail-trigger"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </a>
                    </div>
                  )}
                </div>

                {/* Clean Transparent Itemized Ledger Breakdown Card */}
                {(() => {
                  const { damagePenalty, lateFee } = parseDeductions(c);
                  return (
                    <div 
                      className="glass-panel" 
                      style={{ 
                        background: 'rgba(120, 120, 120, 0.02)', 
                        border: '1px solid var(--border-color)', 
                        padding: '20px', 
                        borderRadius: '12px',
                        margin: '16px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', letterSpacing: '0.06em', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                          <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                          <path d="M16 8H8" strokeWidth="1.8" />
                          <path d="M16 12H8" strokeWidth="1.8" />
                          <path d="M13 16H8" strokeWidth="1.8" />
                        </svg>
                        Cascading Financial Settlement Receipt
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 800 }}>ITEMIZED</span>
                      </h4>
                      
                      {/* Row 1: Base Deposit — standard text */}
                      <div className="flex-between" style={{ fontSize: '0.9rem', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>1</span>
                          <span className="muted-description">Base Security Deposit Held</span>
                        </span>
                        <span className="currency-amount neutral" style={{ fontWeight: 600 }}>
                          {formatVal(c.securityDepositHeld)}
                        </span>
                      </div>

                      {/* Row 2: Assessed Physical Damage Penalty — red text */}
                      <div className="flex-between" style={{ fontSize: '0.9rem', padding: '8px 12px', background: damagePenalty > 0 ? 'rgba(220,38,38,0.04)' : 'var(--bg-input)', borderRadius: '6px', border: damagePenalty > 0 ? '1px solid rgba(220,38,38,0.15)' : '1px solid var(--border-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(220,38,38,0.10)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>2</span>
                          <span className="muted-description">Minus: Assessed Physical Damage Penalty</span>
                        </span>
                        <span className="currency-amount negative" style={{ fontWeight: 600 }}>
                          −{formatVal(damagePenalty)}
                        </span>
                      </div>

                      {/* Row 3: Accumulated Overdue Daily Fees — amber text */}
                      <div className="flex-between" style={{ fontSize: '0.9rem', padding: '8px 12px', background: lateFee > 0 ? 'rgba(245,158,11,0.05)' : 'var(--bg-input)', borderRadius: '6px', border: lateFee > 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--border-color)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>3</span>
                          <span className="muted-description">
                            Minus: Accumulated Overdue Daily Fees
                            {(c.daysOverdue > 0 || lateFee > 0) && (
                              <span style={{ fontSize: '0.75rem', color: '#b45309', marginLeft: '6px', fontWeight: 600 }}>
                                ({c.daysOverdue || Math.round(lateFee / 1250)} days × ₹1,250)
                              </span>
                            )}
                          </span>
                        </span>
                        <span style={{ color: '#b45309', fontWeight: 600, fontFamily: 'var(--font-primary)' }}>
                          −{formatVal(lateFee)}
                        </span>
                      </div>

                      {/* Cascading divider with equals indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                        <div style={{ flex: 1, height: '2px', background: hasDeficit ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)' }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: hasDeficit ? 'var(--danger)' : 'var(--secondary)', letterSpacing: '0.06em' }}>EQUALS</span>
                        <div style={{ flex: 1, height: '2px', background: hasDeficit ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)' }} />
                      </div>

                      {/* Row 4: Net Disbursal — large, bold, success-green or danger-red */}
                      {hasDeficit ? (
                        <div className="flex-between" style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.2)', alignItems: 'baseline' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(220,38,38,0.12)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" style={{ width: '10px', height: '10px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.95rem' }}>
                              Net Liability Deficit Due
                            </span>
                          </span>
                          <span className="currency-amount negative" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                            {formatVal(absRefund)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex-between" style={{ padding: '12px 14px', background: 'rgba(22,163,74,0.06)', borderRadius: '8px', border: '1px solid rgba(22,163,74,0.2)', alignItems: 'baseline' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(22,163,74,0.12)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" style={{ width: '10px', height: '10px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>
                              Net Disbursal Refund Due
                            </span>
                          </span>
                          <span className="currency-amount positive" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                            {formatVal(netRefund)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Payment method selector & Remarks */}
                <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Reconciliation Action / Channel:
                    </label>
                    <select
                      value={activeMethod}
                      onChange={e => setPaymentMethods({ ...paymentMethods, [c.rentalId]: e.target.value })}
                      className="form-control"
                      style={{ cursor: 'pointer' }}
                    >
                      {hasDeficit ? (
                        <>
                          <option value="Corporate Invoice Issued">Corporate Invoice Issued</option>
                          <option value="Direct Bank Draft Collection">Direct Bank Draft Collection</option>
                          <option value="UPI Pay-In Collected">UPI Pay-In Collected</option>
                          <option value="Outstanding Ledger Write-off">Outstanding Ledger Write-off</option>
                        </>
                      ) : (
                        <>
                          <option value="UPI Refund Transfer">UPI Refund Transfer</option>
                          <option value="NEFT Bank Transfer">NEFT Bank Transfer</option>
                          <option value="Original Credit Card Reversal">Original Credit Card Reversal</option>
                          <option value="Hand-delivered Cash Reconcile">Hand-delivered Cash Reconcile</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Settlement Remarks:
                    </label>
                    <textarea 
                      className="form-control"
                      placeholder="Enter parameters for deduction explanation..."
                      value={activeNote}
                      onChange={e => setRemarks({ ...remarks, [c.rentalId]: e.target.value })}
                      rows="2"
                      style={{ resize: 'none', width: '100%' }}
                    />
                  </div>
                 </div>
                
                {c.kycStatus !== 'Verified' && (
                  <div 
                    className="glass-panel"
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderLeft: '4px solid #ef4444',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <strong style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px', verticalAlign: 'middle' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      KYC COMPLIANCE WARNING:
                    </strong> Customer identity status is <strong>{c.kycStatus}</strong>. Releases of deposit refunds should be held until verification checks are cleared.
                  </div>
                )}

                {/* Approve button — triage-aware styling */}
                <button 
                  className="action-btn" 
                  style={{ 
                    backgroundColor: c.settlementStatus === 'Isolated Repair'
                      ? 'transparent'
                      : (hasDeficit ? 'var(--danger)' : 'var(--success)'),
                    background: c.settlementStatus === 'Isolated Repair'
                      ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                      : undefined,
                    color: '#fff', 
                    boxShadow: c.settlementStatus === 'Isolated Repair'
                      ? '0 4px 18px rgba(239,68,68,0.35)'
                      : (hasDeficit ? '0 4px 12px var(--danger-glow)' : '0 4px 12px var(--success-glow)'),
                    width: '100%',
                    padding: '12px',
                    fontWeight: c.settlementStatus === 'Isolated Repair' ? 800 : undefined,
                    animation: c.settlementStatus === 'Isolated Repair' 
                      ? 'triage-border-breathe 2s ease-in-out infinite' 
                      : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }} 
                  onClick={() => closeClaim(c.rentalId)}
                >
                  {c.settlementStatus === 'Isolated Repair' ? (
                    <>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '15px', height: '15px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Emergency Settle — Release from ISOLATED_REPAIR
                    </>
                  ) : (hasDeficit 
                    ? 'Approve Deficit Breakdown & Issue Invoice' 
                    : 'Approve Refund Breakdown & Clear Payout')}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Recently Settled Registry history logs */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Recently Reconciled & Settled Registry
        </h3>
        {settledClaims.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No recently settled bookings recorded in the active session.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {settledClaims.map((s, idx) => {
              const netValue = s.securityDepositHeld - s.damageDeduction;
              const hasDeficit = netValue < 0;

              return (
                <div key={idx} className="history-item flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="rental-tracking-id">{s.rentalId}</span> - <span style={{ fontWeight: 500 }}>{s.customerName}</span> {renderCustomerId(s.customerId)}
                    <br />
                    <small className="muted-description">
                      Asset: {s.deviceModel} | Method: {s.paymentMethod || 'Default'}
                    </small>
                    {s.settlementAt && (
                      <>
                        <br />
                        <small className="muted-description" style={{ fontSize: '0.8rem' }}>
                          Cleared: {new Date(s.settlementAt).toLocaleString()}
                        </small>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <small className="muted-description" style={{ display: 'block', fontWeight: 600 }}>Deduction:</small>
                      <span className="currency-amount negative" style={{ fontSize: '0.9rem' }}>
                        -{formatVal(s.damageDeduction)}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <small className="muted-description" style={{ display: 'block', fontWeight: 600 }}>
                        {hasDeficit ? 'Deficit Charge:' : 'Refund Released:'}
                      </small>
                      <span className={`currency-amount ${hasDeficit ? 'negative' : 'positive'}`} style={{ fontSize: '1rem' }}>
                        {formatVal(Math.abs(netValue))}
                      </span>
                    </div>

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedReceipt(s)}
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Local receipt modal render */}
      {selectedReceipt && (() => {
        const netRefund = selectedReceipt.securityDepositHeld - selectedReceipt.damageDeduction;
        const hasDeficit = netRefund < 0;
        const absDiff = Math.abs(netRefund);

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', animation: 'fadeIn 0.3s ease forwards' }}>
              <div className="flex-between mb-4">
                <h3 style={{ fontSize: '1.25rem' }}>Settlement Receipt</h3>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                  onClick={() => setSelectedReceipt(null)}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div className="flex-between">
                  <span className="muted-description">Rental ID:</span>
                  <span className="rental-tracking-id">{selectedReceipt.rentalId}</span>
                </div>
                <div className="flex-between mt-6" style={{ marginTop: '0.5rem' }}>
                  <span className="muted-description">Customer:</span>
                  <span style={{ fontWeight: 500 }}>{selectedReceipt.customerName}</span>
                </div>
                <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                  <span className="muted-description">Device Name:</span>
                  <span style={{ fontWeight: 500 }}>{selectedReceipt.deviceModel}</span>
                </div>
                {selectedReceipt.settlementAt && (
                  <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                    <span className="muted-description">Settlement Date:</span>
                    <span style={{ fontWeight: 500 }}>{new Date(selectedReceipt.settlementAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedReceipt.paymentMethod && (
                  <div className="flex-between" style={{ marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Reconcile Mode:</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>{selectedReceipt.paymentMethod}</span>
                  </div>
                )}
                {selectedReceipt.notes && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Reconciliation Remarks:</span>
                    <span style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>"{selectedReceipt.notes}"</span>
                  </div>
                )}
              </div>

              <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>DEDUCTIONS BREAKDOWN</h4>
                {selectedReceipt.damageType === 'None' ? (
                  <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" style={{ width: '14px', height: '14px', color: 'var(--success)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    No damages logged. Device returned in perfect condition.
                  </div>
                ) : (
                  <div className="flex-between" style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                    <span>• {selectedReceipt.damageType}</span>
                    <span className="text-danger" style={{ fontWeight: 600 }}>-{formatVal(selectedReceipt.damageDeduction)}</span>
                  </div>
                )}
              </div>

              {(() => {
                const { damagePenalty, lateFee } = parseDeductions(selectedReceipt);
                return (
                  <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="flex-between" style={{ fontSize: '0.95rem' }}>
                      <span className="muted-description">Base Security Deposit Held:</span>
                      <span className="currency-amount neutral">{formatVal(selectedReceipt.securityDepositHeld)}</span>
                    </div>
                    <div className="flex-between" style={{ fontSize: '0.95rem' }}>
                      <span className="muted-description">Minus: Assessed Physical Damage Penalty:</span>
                      <span className="currency-amount negative">-{formatVal(damagePenalty)}</span>
                    </div>
                    <div className="flex-between" style={{ fontSize: '0.95rem' }}>
                      <span className="muted-description">Minus: Accumulated Overdue Daily Fees:</span>
                      <span className="currency-amount warning">-{formatVal(lateFee)}</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                    {hasDeficit ? (
                      <>
                        <div className="flex-between mt-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--danger)' }}>Equals: Net Liability Deficit Due:</span>
                          <span className="currency-amount negative" style={{ fontSize: '1.25rem' }}>
                            {formatVal(absDiff)}
                          </span>
                        </div>
                        <div className="deficit-banner" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Deductions exceeded deposit. Accounts must collect outstanding balance.
                        </div>
                      </>
                    ) : (
                      <div className="flex-between mt-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--secondary)' }}>Equals: Net Disbursal Refund Due:</span>
                        <span className="currency-amount positive" style={{ fontSize: '1.25rem' }}>
                          {formatVal(netRefund)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const photos = selectedReceipt.photoEvidenceUrl ? selectedReceipt.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
                if (photos.length === 0) return null;
                return (
                  <div style={{ marginBottom: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px', marginRight: '4px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      Damage Proof Evidence ({photos.length} photos):
                    </div>
                    <div 
                      className="evidence-carousel-container"
                      style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        overflowX: 'auto', 
                        paddingBottom: '10px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--primary) var(--bg-main)'
                      }}
                    >
                      {photos.map((photo, idx) => (
                        <div 
                          key={idx}
                          style={{
                            flex: '0 0 auto',
                            position: 'relative',
                            width: '120px',
                            height: '90px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '2px solid var(--border-color)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
                          }}
                          onClick={() => window.open(photo, '_blank')}
                          title="Click to open full image"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.04)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                          }}
                        >
                          <img 
                            src={photo} 
                            alt={`Evidence ${idx + 1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            fontSize: '10px',
                            textAlign: 'center',
                            padding: '2px 0'
                          }}>
                            Photo {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '13px', height: '13px', color: 'var(--warning)', flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3m0 0h.01m-9.04-4.5c0-4.142 3.358-7.5 7.5-7.5s7.5 3.358 7.5 7.5c0 1.94-.738 3.71-1.94 5.06a8.96 8.96 0 00-1.06 1.94H9.5a8.96 8.96 0 00-1.06-1.94A7.468 7.468 0 012.96 16.5z" />
                      </svg>
                      Click on any thumbnail to open the image in a new tab.
                    </div>
                  </div>
                );
              })()}

              <button 
                className="btn btn-secondary" 
                style={{ 
                  width: '100%', 
                  marginTop: '1rem', 
                  backgroundColor: 'var(--primary-glow)', 
                  borderColor: 'var(--primary)', 
                  color: 'var(--primary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }} 
                onClick={() => downloadPDFReceipt(selectedReceipt)}
              >
                <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDF Receipt
              </button>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '0.75rem' }} 
                onClick={() => setSelectedReceipt(null)}
              >
                Close Receipt
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
