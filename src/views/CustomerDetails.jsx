import React, { useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { jsPDF } from 'jspdf';

const parseDeductions = (record) => {
  if (!record) return { damagePenalty: 0, lateFee: 0 };
  const totalDeduction = parseFloat(record.damageDeduction) || 0;
  const lateFee = parseFloat(record.lateFeeCharged) || 0;
  const damagePenalty = Math.max(0, totalDeduction - lateFee);
  return { damagePenalty, lateFee };
};

export default function CustomerDetails({ records, setView, currency, currencyConfig, formatVal }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Extract ID from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get('id');
  const record = records.find(r => r.rentalId === paramId);

  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
    setView('dashboard');
  };

  const handleActionClick = (targetView) => {
    setView(targetView);
  };

  const renderCustomerId = (id) => {
    if (!id) return 'N/A';
    return (
      <span 
        className="badge-id" 
        title="Click to copy full Customer ID"
        style={{ 
          cursor: 'pointer', 
          fontFamily: 'monospace', 
          fontSize: '0.85rem', 
          padding: '4px 8px', 
          background: 'var(--bg-input)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '4px',
          color: 'var(--text-secondary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all var(--transition-fast)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(id);
          alert(`Copied Customer ID: ${id}`);
        }}
      >
        <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '12px', height: '12px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0A2.25 2.25 0 0113.5 3.75h-3a2.25 2.25 0 01-2.166-1.512m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.546.07 1.052.34 1.42.758m-9.017-.758a2.25 2.25 0 00-1.42.758M18 6.75h-.08m-11.84 0H6" />
        </svg>
        {id}
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

  if (!record) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div className="alert-message-box alert-danger-style" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="alert-message-content">
            <strong style={{ display: 'block', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rental Record Not Found</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>
              The rental ID you are trying to view does not exist or has been deleted.
            </p>
          </div>
        </div>
        <button onClick={handleBack} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { damagePenalty, lateFee } = parseDeductions(record);
  const netRefund = record.securityDepositHeld - record.damageDeduction;
  const hasDeficit = netRefund < 0;
  const absRefund = Math.abs(netRefund);

  const photos = record.photoEvidenceUrl ? record.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];

  return (
    <div className="animated-view" style={{ overflow: 'auto' }}>
      
      {/* Header Navigation */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={handleBack}
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.85rem' 
            }}
          >
            <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '12px', height: '12px', marginRight: '2px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" fill="var(--primary-glow)" fillOpacity="0.15" />
                <circle cx="9" cy="7" r="4" fill="var(--primary-glow)" fillOpacity="0.15" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Customer Details & Ledger
              <StatusBadge status={record.settlementStatus} />
            </h1>
            <p className="muted-description" style={{ marginTop: '0.15rem' }}>
              Full contract parameters, asset assignments, and reconciliation actions.
            </p>
          </div>
        </div>
        
        {record.settlementStatus === 'Isolated Repair' && (
          <div style={{
            padding: '4px 10px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#ef4444',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            animation: 'triage-badge-flash 1.4s ease-in-out infinite',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '12px', height: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            EMERGENCY TRIAGE QUEUE
          </div>
        )}
      </div>

      {/* KYC Warning Banner */}
      {record.kycStatus !== 'Verified' && (
        <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1.25rem', borderLeftWidth: '5px' }}>
          <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div className="alert-message-content">
            <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KYC Compliance Safety Lock Active</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', lineHeight: 1.45 }}>
              Customer verification status is currently <strong>{record.kycStatus}</strong>. Operations, refunds, or further device allocations are flagged under audit constraints.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Details Workspace */}
      <div className="grid-2" style={{ gap: '1.25rem', alignItems: 'start', minWidth: 0, maxWidth: '100%' }}>
        
        {/* Left Column: Profile & Asset specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, maxWidth: '100%' }}>
          
          {/* Customer Profile Card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Customer Profile
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">Full Name</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.customerName}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">Customer ID</span>
                <span>{renderCustomerId(record.customerId)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">Email Address</span>
                <a href={`mailto:${record.customerEmail}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  {record.customerEmail}
                </a>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">Mobile Number</span>
                <a href={`tel:${record.customerPhone}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                  {record.customerPhone || 'N/A'}
                </a>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">KYC Status</span>
                <span style={{ 
                  fontWeight: 700, 
                  color: record.kycStatus === 'Verified' ? 'var(--success)' : record.kycStatus === 'Pending' ? 'var(--warning)' : 'var(--danger)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: record.kycStatus === 'Verified' ? 'var(--success)' : record.kycStatus === 'Pending' ? 'var(--warning)' : 'var(--danger)', display: 'inline-block' }} />
                  {record.kycStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Rental Contract Card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary)' }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Rental & Device Profile
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">Rental ID</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {record.rentalId}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="muted-description">Assigned Equipment</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.deviceModel}</span>
              </div>
              
              {record.deviceSerial && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="muted-description">Device Serial Number</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{record.deviceSerial}</span>
                </div>
              )}
              
              {record.startDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="muted-description">Rental Start Date</span>
                  <span style={{ fontSize: '0.85rem' }}>{new Date(record.startDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {record.endDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="muted-description">Rental Expiry Date</span>
                  <span style={{ fontSize: '0.85rem' }}>{new Date(record.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial breakdown & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, maxWidth: '100%' }}>
          
          {/* Financial Breakdown Card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-19.5 5.25h19.5m-19.5 0h19.5M4 18h16a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1z" />
              </svg>
              Security Deposit Ledger
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '0.5rem' }}>
              
              <div className="flex-between" style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span className="muted-description">Security Deposit Held</span>
                <span className="currency-amount neutral" style={{ fontWeight: 600 }}>
                  {formatVal(record.securityDepositHeld)}
                </span>
              </div>

              <div className="flex-between" style={{ padding: '8px 12px', background: damagePenalty > 0 ? 'rgba(220,38,38,0.04)' : 'var(--bg-input)', borderRadius: '6px', border: damagePenalty > 0 ? '1px solid rgba(220,38,38,0.15)' : '1px solid var(--border-color)' }}>
                <span className="muted-description">Assessed Physical Damage Penalty</span>
                <span className="currency-amount negative" style={{ fontWeight: 600 }}>
                  -{formatVal(damagePenalty)}
                </span>
              </div>

              <div className="flex-between" style={{ padding: '8px 12px', background: lateFee > 0 ? 'rgba(245,158,11,0.05)' : 'var(--bg-input)', borderRadius: '6px', border: lateFee > 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--border-color)' }}>
                <span className="muted-description">Accumulated Overdue Daily Fees</span>
                <span className="currency-amount warning" style={{ fontWeight: 600 }}>
                  -{formatVal(lateFee)}
                </span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

              {hasDeficit ? (
                <div className="flex-between" style={{ padding: '10px 12px', background: 'rgba(220,38,38,0.06)', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.2)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>Outstanding Liability Deficit Due</span>
                  <span className="currency-amount negative" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                    {formatVal(absRefund)}
                  </span>
                </div>
              ) : (
                <div className="flex-between" style={{ padding: '10px 12px', background: 'rgba(22,163,74,0.06)', borderRadius: '6px', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>Net Refund Disbursal Due</span>
                  <span className="currency-amount positive" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                    {formatVal(netRefund)}
                  </span>
                </div>
              )}
            </div>

            {/* Damage Proof Section */}
            {photos.length > 0 && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px', marginRight: '4px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  Damage Proof Evidence ({photos.length} photos):
                </div>
                <div 
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    overflowX: 'auto', 
                    paddingBottom: '10px'
                  }}
                >
                  {photos.map((photo, idx) => (
                    <div 
                      key={idx}
                      style={{
                        flex: '0 0 auto',
                        position: 'relative',
                        width: '100px',
                        height: '75px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '2px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'transform var(--transition-fast)'
                      }}
                      onClick={() => window.open(photo, '_blank')}
                      title="Open full image"
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img 
                        src={photo} 
                        alt={`Evidence ${idx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remarks & Notes */}
            {record.notes && (
              <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Reconciliation Remarks
                </span>
                <span style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>"{record.notes}"</span>
              </div>
            )}
            
            {record.paymentMethod && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted-description">Payment Mode</span>
                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{record.paymentMethod}</span>
              </div>
            )}
            
            {record.settlementAt && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted-description">Settled On</span>
                <span style={{ fontWeight: 500 }}>{new Date(record.settlementAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Contextual Handoff Actions */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary)' }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Operational Handoff Actions
            </h3>
            
            {record.settlementStatus === 'Held' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  The device return has not been assessed yet. Perform inspection and document return parameters to release or deduct from the security deposit.
                </p>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary), var(--primary-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleActionClick('return')}
                >
                  <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  File Damage & Return Desk
                </button>
              </div>
            )}

            {(record.settlementStatus === 'Under Review' || record.settlementStatus === 'Isolated Repair') && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  An inspection has been recorded. Review assessed deductions, apply comments, select repayment mode, and finalize the financial settlement.
                </p>
                <button 
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    background: record.settlementStatus === 'Isolated Repair' 
                      ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                      : undefined,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => handleActionClick('settlement')}
                >
                  {record.settlementStatus === 'Isolated Repair' ? (
                    <>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Priority Reconcile & Settle
                    </>
                  ) : (
                    <>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 012.625 18V5.625c0-.621.504-1.125 1.125-1.125z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                      </svg>
                      Reconcile & Settle Deposit
                    </>
                  )}
                </button>
              </div>
            )}

            {record.settlementStatus === 'Settled' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
                  This contract has been fully reconciled and settled. You can download the itemized settlement receipt.
                </p>
                <button 
                  className="btn btn-secondary"
                  style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--primary-glow)', 
                    borderColor: 'var(--primary)', 
                    color: 'var(--primary)',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onClick={() => downloadPDFReceipt(record)}
                >
                  <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download PDF Receipt
                </button>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setSelectedReceipt(record)}
                >
                  <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View Digital Receipt
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Embedded receipt details popup modal (matching original style) */}
      {selectedReceipt && (() => {
        const receiptRefund = selectedReceipt.securityDepositHeld - selectedReceipt.damageDeduction;
        const receiptDeficit = receiptRefund < 0;
        const receiptAbs = Math.abs(receiptRefund);

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
                    <span style={{ color: 'var(--text-secondary)' }}>Payment Mode:</span>
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
                  <div style={{ color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                    ✓ No damages logged. Device returned in perfect condition.
                  </div>
                ) : (
                  <div className="flex-between" style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                    <span>• {selectedReceipt.damageType}</span>
                    <span className="text-danger" style={{ fontWeight: 600 }}>-{formatVal(selectedReceipt.damageDeduction)}</span>
                  </div>
                )}
              </div>

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
                {receiptDeficit ? (
                  <>
                    <div className="flex-between mt-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--danger)' }}>Equals: Net Liability Deficit Due:</span>
                      <span className="currency-amount negative" style={{ fontSize: '1.25rem' }}>
                        {formatVal(receiptAbs)}
                      </span>
                    </div>
                    <div className="deficit-banner" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '14px', height: '14px', color: 'var(--danger)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Deductions exceeded deposit. Accounts must collect outstanding balance.
                    </div>
                  </>
                ) : (
                  <div className="flex-between mt-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--secondary)' }}>Equals: Net Disbursal Refund Due:</span>
                    <span className="currency-amount positive" style={{ fontSize: '1.25rem' }}>
                      {formatVal(receiptRefund)}
                    </span>
                  </div>
                )}
              </div>

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
