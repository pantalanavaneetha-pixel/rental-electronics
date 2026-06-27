import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../components/StatusBadge';
import { jsPDF } from 'jspdf';
import { BackArrowIcon, CorporateCustomersIcon, WarningTriangleIcon, ShieldAlertIcon, UserProfileIcon, LaptopDevice, CardReceiptIcon, CameraIcon, ForwardArrowIcon, DocumentIcon, DownloadIcon, EyeIcon, EditIcon, FastTrackIcon } from '../components/PremiumIcons';

const parseDeductions = (record) => {
  if (!record) return { damagePenalty: 0, lateFee: 0 };
  const totalDeduction = parseFloat(record.damageDeduction) || 0;
  const lateFee = parseFloat(record.lateFeeCharged) || 0;
  const damagePenalty = Math.max(0, totalDeduction - lateFee);
  return { damagePenalty, lateFee };
};

export default function CustomerDetails({ records, setView, currency, currencyConfig, formatVal, fromBase, toBase, fetchRecords, userRole }) {
  // Extract ID from URL query parameters
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get('id');
  const record = records.find(r => r.rentalId === paramId);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showMiniHeader, setShowMiniHeader] = useState(false);
  const containerRef = useRef(null);

  const handleScroll = (e) => {
    if (e.currentTarget.scrollTop > 120) {
      setShowMiniHeader(true);
    } else {
      setShowMiniHeader(false);
    }
  };

  // Detailed record and history state
  const [detailData, setDetailData] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Fetch detailed record from server
  useEffect(() => {
    if (!paramId) return;
    setIsLoadingDetail(true);
    setDetailError('');
    fetch(`http://localhost:5000/api/rentals/${paramId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch detailed record');
        return res.json();
      })
      .then(payload => {
        if (payload.success) {
          setDetailData(payload.data);
        } else {
          throw new Error(payload.error || 'Failed to load details');
        }
      })
      .catch(err => {
        console.error(err);
        setDetailError('Failed to load detailed record from server.');
      })
      .finally(() => {
        setIsLoadingDetail(false);
      });
  }, [paramId]);

  // Edit form states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editKycStatus, setEditKycStatus] = useState('Verified');
  const [editIsCorporate, setEditIsCorporate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Simulated identity scanner states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleOpenEditModal = () => {
    if (!record) return;
    setEditName(record.customerName || '');
    setEditEmail(record.customerEmail || '');
    setEditPhone(record.customerPhone || '');
    setEditAddress(record.address || '');
    setEditKycStatus(record.kycStatus || 'Verified');
    setEditIsCorporate(!!record.isCorporate);
    setSaveError('');
    setUploadedFile(null);
    setScanResult(null);
    setIsScanning(false);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      setSaveError('Customer name is required and must be at least 2 characters.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(editEmail.trim())) {
      setSaveError('Please provide a valid email address.');
      return;
    }
    const phoneRegex = /^\+?[1-9]\d{1,14}(?:\s*\/\s*\+?[1-9]\d{1,14})?$/;
    if (!phoneRegex.test(editPhone.trim())) {
      setSaveError('Please provide a valid E.164 phone number.');
      return;
    }
    if (editAddress.trim().length > 0 && editAddress.trim().length < 5) {
      setSaveError('Address details must be at least 5 characters long.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const payload = {
        userName: editName,
        userEmail: editEmail,
        userPhone: editPhone,
        address: editAddress,
        kycStatus: editKycStatus,
        isCorporate: editIsCorporate,
        deviceModel: record.deviceModel,
        securityDepositHeld: record.securityDepositHeld,
        endDate: record.endDate
      };

      const res = await fetch(`http://localhost:5000/api/rentals/${record.rentalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update customer details.');
      }

      setIsEditModalOpen(false);
      if (fetchRecords) {
        await fetchRecords();
      }
      alert('Customer profile and KYC status updated successfully!');
    } catch (err) {
      setSaveError(err.message || 'An unexpected server error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedReceipt) {
          setSelectedReceipt(null);
        } else if (isEditModalOpen) {
          setIsEditModalOpen(false);
        }
      }

      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (userRole === 'Accounts Staff') {
          setView('settlement');
        } else if (userRole === 'Service Technician') {
          setView('return');
        } else {
          setView('dashboard');
        }
      }

      if (isEditModalOpen && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveProfile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedReceipt, isEditModalOpen, setView, handleSaveProfile]);

  const handleBack = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
    if (userRole === 'Accounts Staff') {
      setView('settlement');
    } else if (userRole === 'Service Technician') {
      setView('return');
    } else {
      setView('dashboard');
    }
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
        <DocumentIcon size={12} style={{ verticalAlign: 'middle' }} />
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
    doc.text("ONE POINT SOLUTIONS SETTLEMENT RECEIPT", 15, 25);
 
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
    doc.text("Thank you for choosing One Point Solutions. This is a computer-generated transaction record.", 105, 275, { align: 'center' });
 
    doc.save(`OnePointSolutions_Receipt_${receipt.rentalId}.pdf`);
  };

  if (!record) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div className="alert-message-box alert-danger-style" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
            <WarningTriangleIcon size={22} />
          </div>
          <div className="alert-message-content">
            <strong style={{ display: 'block', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rental Record Not Found</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>
              The rental ID you are trying to view does not exist or has been deleted.
            </p>
          </div>
        </div>
        <button onClick={handleBack} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back
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
    <div ref={containerRef} onScroll={handleScroll} className="animated-view" style={{ overflow: 'auto' }}>
      
      {/* Sliding Top Mini-Header */}
      <div className={`sliding-mini-header ${showMiniHeader ? 'visible' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <UserProfileIcon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.customerName}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', flexShrink: 0 }}>|</span>
          <span 
            className="badge-id" 
            title="Click to copy Customer ID"
            style={{ 
              cursor: 'pointer', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              padding: '2px 6px', 
              background: 'var(--bg-input)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              flexShrink: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(record.customerId);
              alert(`Copied Customer ID: ${record.customerId}`);
            }}
          >
            {record.customerId}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', flexShrink: 0 }}>|</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.deviceModel}
          </span>
          <StatusBadge status={record.settlementStatus} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {record.settlementStatus === 'Held' && (
            <button 
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleActionClick('return')}
            >
              <DocumentIcon size={12} />
              File Damage
            </button>
          )}

          {(record.settlementStatus === 'Under Review' || record.settlementStatus === 'Isolated Repair') && (
            <button 
              className="btn btn-primary"
              style={{ 
                padding: '0.35rem 0.7rem', 
                fontSize: '0.78rem', 
                background: record.settlementStatus === 'Isolated Repair' ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : undefined,
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px' 
              }}
              onClick={() => handleActionClick('settlement')}
            >
              {record.settlementStatus === 'Isolated Repair' ? <FastTrackIcon size={12} /> : <CardReceiptIcon size={12} />}
              Reconcile
            </button>
          )}

          {record.settlementStatus === 'Settled' && (
            <>
              <button 
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => downloadPDFReceipt(record)}
              >
                <DownloadIcon size={12} />
                Download PDF
              </button>
              <button 
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setSelectedReceipt(record)}
              >
                <EyeIcon size={12} />
                View Receipt
              </button>
            </>
          )}
          <button 
            onClick={handleBack}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
          >
            Back
          </button>
        </div>
      </div>
      
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
            <BackArrowIcon size={12} style={{ marginRight: '2px' }} />
            Back <span className="keycap-indicator">alt+B</span>
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CorporateCustomersIcon active={true} size={24} style={{ verticalAlign: 'middle', flexShrink: 0 }} />
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
            <WarningTriangleIcon size={12} />
            EMERGENCY TRIAGE QUEUE
          </div>
        )}
      </div>

      {/* KYC Warning Banner */}
      {record.kycStatus !== 'Verified' && (
        <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1.25rem', borderLeftWidth: '5px' }}>
          <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
            <ShieldAlertIcon size={22} />
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
        <div className="sticky-profile-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, maxWidth: '100%' }}>
          
          {/* Customer Profile Card */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserProfileIcon size={18} style={{ color: 'var(--primary)' }} />
                Customer Profile
              </h3>
              <button 
                onClick={handleOpenEditModal}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <EditIcon size={12} />
                Edit Profile
              </button>
            </div>
            
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
                <span className="muted-description">Client Classification</span>
                <span style={{ fontWeight: 600, color: record.isCorporate ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {record.isCorporate ? '🏢 Corporate Customer' : '👤 Retail/Event Client'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', gap: '4px' }}>
                <span className="muted-description">Registered Address</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {record.address || 'No registered address on file.'}
                </span>
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
              <LaptopDevice style={{ width: '1.15rem', height: '1.15rem', color: 'var(--primary)' }} />
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
              <CardReceiptIcon size="1.15rem" style={{ color: 'var(--primary)' }} />
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
                  <CameraIcon size={14} style={{ marginRight: '4px' }} />
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

            {/* AI Automated Processing Outputs */}
            {detailData && (detailData.aiExplanation || detailData.customerFriendlyNotes) && (
              <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'var(--primary-glow)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🤖 AI Assessment & Reconciliations
                </h4>
                
                {detailData.customerFriendlyNotes && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Customer Friendly Statement:
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4, fontWeight: 500 }}>
                      {detailData.customerFriendlyNotes}
                    </p>
                  </div>
                )}
                
                {detailData.aiExplanation && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Technical Damage Audit Notes:
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
                      {detailData.aiExplanation}
                    </p>
                  </div>
                )}

                {detailData.aiPrompt && (
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Audit Prompt Instruction:
                    </strong>
                    <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', overflowX: 'auto', background: 'var(--bg-main)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {detailData.aiPrompt}
                    </pre>
                  </div>
                )}
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
              <ForwardArrowIcon size={18} style={{ color: 'var(--primary)' }} />
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
                  <DocumentIcon size={14} />
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
                      <FastTrackIcon size={14} />
                      Priority Reconcile & Settle
                    </>
                  ) : (
                    <>
                      <CardReceiptIcon size={14} />
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
                  <DownloadIcon size={14} />
                  Download PDF Receipt
                </button>
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => setSelectedReceipt(record)}
                >
                  <EyeIcon size={14} />
                  View Digital Receipt
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Linked Action & Message Dispatch History */}
      <div className="glass-panel" style={{ marginTop: '1.25rem', padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DocumentIcon size={18} style={{ color: 'var(--primary)' }} />
          Linked Action & Dispatch History
        </h3>
        
        {isLoadingDetail ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', color: 'var(--text-secondary)' }}>
            <span className="elegant-spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--primary)' }}></span>
            Loading timeline ledger...
          </div>
        ) : detailError ? (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem' }}>
            ⚠ {detailError} (Displaying offline state)
          </div>
        ) : !detailData || !detailData.history || detailData.history.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            No communication history or manual dispatch logs registered for this contract.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="timeline-container">
            {detailData.history.map((log, index) => (
              <div 
                key={log.id || index} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '12px', 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: log.type === 'Email' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: log.type === 'Email' ? 'var(--primary)' : 'var(--success)'
                  }}>
                    {log.type === 'Email' ? '✉' : '💬'}
                  </div>
                  {index < detailData.history.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {log.subject || `${log.type} Dispatch to ${log.recipient}`}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {log.message}
                  </p>
                  <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      background: log.status === 'Sent' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: log.status === 'Sent' ? 'var(--success)' : 'var(--danger)',
                      textTransform: 'uppercase'
                    }}>
                      {log.status}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      via {log.type} Gateway
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded receipt details popup modal (matching original style) */}
      {selectedReceipt && (() => {
        const receiptRefund = selectedReceipt.securityDepositHeld - selectedReceipt.damageDeduction;
        const receiptDeficit = receiptRefund < 0;
        const receiptAbs = Math.abs(receiptRefund);

        return (
          <div className="ops-modal-overlay">
            <div className="ops-modal-container receipt-modal-width">
              <div className="ops-modal-header">
                <h3 className="ops-modal-header-title">
                  <DocumentIcon size={20} style={{ color: 'var(--primary)' }} />
                  Settlement Receipt
                </h3>
                <button 
                  className="ops-modal-close-btn" 
                  onClick={() => setSelectedReceipt(null)}
                  aria-label="Close"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ✕ <span className="keycap-indicator" style={{ fontSize: '0.62rem', padding: '0px 3.5px', marginLeft: '2px', borderBottomWidth: '1.5px' }}>esc</span>
                </button>
              </div>
              
              <div className="ops-modal-body">
                <div className="ops-receipt-card">
                  <div className="ops-receipt-row">
                    <span className="ops-receipt-label">Rental ID:</span>
                    <span className="ops-receipt-value rental-tracking-id">{selectedReceipt.rentalId}</span>
                  </div>
                  <div className="ops-receipt-row">
                    <span className="ops-receipt-label">Customer:</span>
                    <span className="ops-receipt-value">{selectedReceipt.customerName}</span>
                  </div>
                  <div className="ops-receipt-row">
                    <span className="ops-receipt-label">Device Name:</span>
                    <span className="ops-receipt-value">{selectedReceipt.deviceModel}</span>
                  </div>
                  {selectedReceipt.settlementAt && (
                    <div className="ops-receipt-row">
                      <span className="ops-receipt-label">Settlement Date:</span>
                      <span className="ops-receipt-value">{new Date(selectedReceipt.settlementAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedReceipt.paymentMethod && (
                    <div className="ops-receipt-row">
                      <span className="ops-receipt-label">Payment Mode:</span>
                      <span className="ops-receipt-value" style={{ color: 'var(--success)' }}>{selectedReceipt.paymentMethod}</span>
                    </div>
                  )}
                  {selectedReceipt.notes && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-main)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Reconciliation Remarks:</span>
                      <span style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>"{selectedReceipt.notes}"</span>
                    </div>
                  )}
                </div>

                <div className="ops-receipt-card">
                  <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>DEDUCTIONS BREAKDOWN</h4>
                  {selectedReceipt.damageType === 'None' ? (
                    <div style={{ color: 'var(--secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
                      ✓ No damages logged. Device returned in perfect condition.
                    </div>
                  ) : (
                    <div className="ops-receipt-row" style={{ fontSize: '0.88rem', borderBottom: 'none' }}>
                      <span>• {selectedReceipt.damageType}</span>
                      <span className="text-danger" style={{ fontWeight: 600 }}>-{formatVal(selectedReceipt.damageDeduction)}</span>
                    </div>
                  )}
                </div>

                {(() => {
                  const { damagePenalty, lateFee } = parseDeductions(selectedReceipt);
                  return (
                    <div style={{ marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                        <span className="muted-description">Base Security Deposit Held:</span>
                        <span className="currency-amount neutral">{formatVal(selectedReceipt.securityDepositHeld)}</span>
                      </div>
                      <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                        <span className="muted-description">Minus: Assessed Physical Damage Penalty:</span>
                        <span className="currency-amount negative">-{formatVal(damagePenalty)}</span>
                      </div>
                      <div className="flex-between" style={{ fontSize: '0.9rem' }}>
                        <span className="muted-description">Minus: Accumulated Overdue Daily Fees:</span>
                        <span className="currency-amount warning">-{formatVal(lateFee)}</span>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                      {receiptDeficit ? (
                        <>
                          <div className="flex-between mt-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--danger)' }}>Equals: Net Liability Deficit Due:</span>
                            <span className="currency-amount negative" style={{ fontSize: '1.15rem' }}>
                              {formatVal(receiptAbs)}
                            </span>
                          </div>
                          <div className="deficit-banner" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)' }}>
                            <WarningTriangleIcon size={14} style={{ color: 'var(--danger)' }} />
                            Deductions exceeded deposit. Accounts must collect outstanding balance.
                          </div>
                        </>
                      ) : (
                        <div className="flex-between mt-6" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--success)' }}>Equals: Net Disbursal Refund Due:</span>
                          <span className="currency-amount positive" style={{ fontSize: '1.15rem' }}>
                            {formatVal(receiptRefund)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="ops-modal-footer">
                <button 
                  className="btn btn-secondary" 
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'var(--primary-glow)', 
                    borderColor: 'var(--primary)', 
                    color: 'var(--primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    height: '42px'
                  }} 
                  onClick={() => downloadPDFReceipt(selectedReceipt)}
                >
                  <DownloadIcon size={14} />
                  Download PDF
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '42px' }} 
                  onClick={() => setSelectedReceipt(null)}
                >
                  Close Receipt <span className="keycap-indicator">esc</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Customer Profile Modal Overlay */}
      {isEditModalOpen && (
        <div className="ops-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="ops-modal-container" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="ops-modal-header">
              <h3 className="ops-modal-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EditIcon size={20} style={{ color: 'var(--primary)' }} />
                Edit Customer & KYC Compliance
              </h3>
              <button 
                className="ops-modal-close-btn" 
                onClick={() => setIsEditModalOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ✕ <span className="keycap-indicator" style={{ fontSize: '0.62rem', padding: '0px 3.5px', marginLeft: '2px', borderBottomWidth: '1.5px' }}>esc</span>
              </button>
            </div>

            <div className="ops-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem' }}>
              {saveError && (
                <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1.25rem', borderLeftWidth: '5px' }}>
                  <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                    <WarningTriangleIcon size={22} />
                  </div>
                  <div className="alert-message-content">
                    <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Validation Error</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>{saveError}</p>
                  </div>
                </div>
              )}

              <div className="ops-form-section-title" style={{ marginTop: 0 }}>👤 Client Information</div>
              
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value.replace(/[^a-zA-Z\s\-\.]/g, ''))}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="grid-2" style={{ gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mobile Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editPhone} 
                    onChange={e => setEditPhone(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Registered Address</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  value={editAddress} 
                  onChange={e => setEditAddress(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', padding: '8px' }}
                  placeholder="Enter full physical address..."
                />
              </div>

              <div className="ops-form-section-title">🛡️ Compliance & Verification</div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <input 
                  type="checkbox" 
                  id="editIsCorporate"
                  checked={editIsCorporate} 
                  onChange={e => setEditIsCorporate(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="editIsCorporate" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Corporate Client Account
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>KYC Status Override</label>
                <select 
                  className="form-control" 
                  value={editKycStatus} 
                  onChange={e => setEditKycStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Verified">Verified (Compliant)</option>
                  <option value="Pending">Pending Audit</option>
                  <option value="Rejected">Rejected (Blocked)</option>
                </select>
              </div>

              <div style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Simulated ID Identity Scanner
                </span>
                
                {!uploadedFile ? (
                  <div 
                    style={{ textAlign: 'center', padding: '16px', cursor: 'pointer' }}
                    onClick={() => {
                      setUploadedFile({ name: 'Aadhaar_Card_Mock.pdf', size: '2.4 MB' });
                      setIsScanning(true);
                      setTimeout(() => {
                        setIsScanning(false);
                        setScanResult('success');
                        setEditKycStatus('Verified');
                      }, 2000);
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '4px' }}>📁</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>Click to upload Government ID / Business ID PAN</span>
                    <span style={{ fontSize: '0.72rem', display: 'block', color: 'var(--text-muted)', marginTop: '2px' }}>Supports Aadhaar, Passport, or Business Registration (PDF, PNG up to 10MB)</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>📄 {uploadedFile.name} ({uploadedFile.size})</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setUploadedFile(null);
                          setScanResult(null);
                          setIsScanning(false);
                        }} 
                        style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>

                    {isScanning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--primary)' }}>
                        <span className="spinner-icon-inline" style={{ width: '12px', height: '12px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                        <span>Simulating AI OCR text extraction and ID matching...</span>
                      </div>
                    )}

                    {scanResult === 'success' && (
                      <div style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>✓ AI Verification Passed: ID document details match Customer Profile perfectly. KYC updated to Verified.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            <div className="ops-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
                style={{ flex: 1 }}
              >
                Cancel <span className="keycap-indicator">esc</span>
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProfile}
                disabled={isSaving || isScanning}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isSaving ? 'Saving Changes...' : <>Save Profile Details <span className="keycap-indicator">Ctrl+↵</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
