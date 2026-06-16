import React, { useState, useEffect } from 'react';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import { jsPDF } from 'jspdf';

const parseDeductions = (record) => {
  if (!record) return { damagePenalty: 0, lateFee: 0 };
  const totalDeduction = parseFloat(record.damageDeduction) || 0;
  const lateFee = parseFloat(record.lateFeeCharged) || 0;
  const damagePenalty = Math.max(0, totalDeduction - lateFee);
  return { damagePenalty, lateFee };
};

const INITIAL_MOCK_RECORDS = [
  {
    rentalId: "REF-2026-001",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    kycStatus: "Verified",
    deviceModel: "MacBook Pro M3",
    securityDepositHeld: 50000,
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held"
  },
  {
    rentalId: "REF-2026-002",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    kycStatus: "Pending",
    deviceModel: "iPad Pro M4",
    securityDepositHeld: 15000,
    damageType: "Cracked Screen",
    damageDeduction: 12500,
    photoEvidenceUrl: "https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=600",
    settlementStatus: "Under Review"
  },
  {
    rentalId: "REF-2026-003",
    customerName: "Amit Verma",
    customerEmail: "amit.verma@example.com",
    kycStatus: "Rejected",
    deviceModel: "iPhone 15 Pro",
    securityDepositHeld: 25000,
    damageType: "Body Scratches / Dents",
    damageDeduction: 4166,
    photoEvidenceUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600",
    settlementStatus: "Settled"
  }
];

export default function Dashboard({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase }) {
  // Intake form state (Stage 1 Handoff)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [isCorporate, setIsCorporate] = useState(false);
  const [kycStatus, setKycStatus] = useState('Verified');
  const [kycChecking, setKycChecking] = useState(false);
  const [deviceModel, setDeviceModel] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(7);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form touched state to support direct field validation display onBlur
  const [touched, setTouched] = useState({
    customerName: false,
    customerEmail: false,
    customerPhone: false,
    kycStatus: false,
    deviceModel: false,
    startDate: false,
    durationDays: false,
    securityDeposit: false
  });

  const handleNameChange = (name) => {
    const sanitized = name.replace(/[^a-zA-Z\s\-\.]/g, '');
    setCustomerName(sanitized);
    const cleanName = sanitized.trim().replace(/\s+/g, '.').toLowerCase();
    const autoEmail = cleanName ? `${cleanName}@example.com` : '';
    setCustomerEmail(autoEmail);
  };

  const handleDeviceModelChange = (val) => {
    const sanitized = val.replace(/[^a-zA-Z0-9\s\-\.]/g, '');
    setDeviceModel(sanitized);
  };

  const isValidEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  const getCalculatedReturnDate = () => {
    if (!startDate) return '';
    const parts = startDate.split('-');
    if (parts.length !== 3) return startDate;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const days = parseInt(durationDays, 10);
    if (isNaN(days) || days < 0) return startDate;
    const date = new Date(Date.UTC(year, month, day));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().split('T')[0];
  };

  const blockNumbersOnName = (e) => {
    if (e.key.length === 1 && /[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (val) => {
    const sanitized = val.replace(/[^0-9\+]/g, '');
    setCustomerPhone(sanitized);
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

  const isFormValid = customerName.trim() !== '' &&
                      isValidEmail(customerEmail.trim()) &&
                      customerPhone.trim() !== '' &&
                      kycStatus === 'Verified' &&
                      deviceModel.trim() !== '' &&
                      securityDeposit !== '' &&
                      startDate !== '' &&
                      durationDays !== '';

  // Trigger KYC verification check when email changes
  useEffect(() => {
    if (!customerEmail.trim()) {
      setKycStatus('Verified');
      return;
    }

    const delayDebounce = setTimeout(() => {
      setKycChecking(true);
      fetch(`http://localhost:5000/api/users/check-kyc?email=${encodeURIComponent(customerEmail.trim())}`)
        .then(res => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then(data => {
          if (data.success) {
            setKycStatus(data.kycStatus || 'Verified');
          }
        })
        .catch(err => {
          console.warn('KYC verification lookup error (falling back to offline check):', err);
          const matchedRecord = records.find(r => r.customerEmail?.trim().toLowerCase() === customerEmail.trim().toLowerCase());
          if (matchedRecord) {
            setKycStatus(matchedRecord.kycStatus || 'Verified');
          }
        })
        .finally(() => setKycChecking(false));
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [customerEmail, records]);

  // Selected receipt for details popup modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Card click triggers navigation to dedicated pages
  const handleMetricClick = (metricType) => {
    setView(metricType);
  };


  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [dashboardRecords, setDashboardRecords] = useState(records);

  useEffect(() => {
    let url = 'http://localhost:5000/api/records';
    const params = [];
    if (activeFilter === 'Held') params.push('status=Held');
    else if (activeFilter === 'Under Review') params.push('status=Under%20Review');
    else if (activeFilter === 'Isolated Repair') params.push('status=Isolated%20Repair');
    else if (activeFilter === 'Settled') params.push('status=Settled');
    else if (activeFilter === 'Water') params.push('damageType=Water');
    else if (activeFilter === 'Overdue') params.push('overdue=true');

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(data => {
        setDashboardRecords(data);
      })
      .catch(err => {
        console.warn('Using client-side filtering fallback:', err);
        let filtered = [...records];
        if (activeFilter === 'Held') {
          filtered = filtered.filter(r => r.settlementStatus === 'Held');
        } else if (activeFilter === 'Under Review') {
          filtered = filtered.filter(r => r.settlementStatus === 'Under Review');
        } else if (activeFilter === 'Isolated Repair') {
          filtered = filtered.filter(r => r.settlementStatus === 'Isolated Repair');
        } else if (activeFilter === 'Settled') {
          filtered = filtered.filter(r => r.settlementStatus === 'Settled');
        } else if (activeFilter === 'Water') {
          filtered = filtered.filter(r => r.damageType && r.damageType.toLowerCase().includes('water'));
        } else if (activeFilter === 'Overdue') {
          filtered = filtered.filter(r => r.daysOverdue > 0);
        }
        setDashboardRecords(filtered);
      });
  }, [activeFilter, records]);

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
          transition: 'all var(--transition-fast)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isFormValid) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    const depositNum = parseFloat(securityDeposit);
    if (isNaN(depositNum) || depositNum < 0) {
      setErrorMsg('Please enter a valid security deposit amount.');
      return;
    }

    if (!isValidEmail(customerEmail.trim())) {
      setErrorMsg('Please enter a valid customer email address.');
      return;
    }

    setIsSubmitting(true);

    // Convert deposit to base currency (INR) for internal storage
    const depositInBase = toBase(depositNum, currency);

    const start = new Date(startDate);
    const end = new Date(getCalculatedReturnDate());

    // Sanitize phone number to fit Joi's E.164 pattern: strip hyphens and spaces
    const sanitizedPhone = customerPhone.trim().replace(/[-\s]/g, '');

    fetch('http://localhost:5000/api/rentals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName: customerName.trim(),
        userEmail: customerEmail.trim(),
        userPhone: sanitizedPhone,
        isCorporate: isCorporate,
        kycStatus: kycStatus,
        deviceSerial: `SR-${Math.floor(10000 + Math.random() * 90000)}`,
        deviceCategory: deviceModel.trim(),
        deviceBaseCost: depositInBase * 2,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        securityDeposit: depositInBase,
        baseTariff: Math.round(depositInBase * 0.1) || 1500,
        initialConditionNotes: 'Delivered in clean, functional state'
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'API failed');
      }
      return data;
    })
    .then(payload => {
      const dbRecord = payload.data;
      const mappedRecord = {
        rentalId: dbRecord.id,
        settlementStatus: 'Held',
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        deviceModel: deviceModel.trim(),
        securityDepositHeld: parseFloat(dbRecord.security_deposit),
        damageType: 'None',
        damageDeduction: 0,
        daysOverdue: 0,
        lateFeeCharged: 0
      };
      setRecords([mappedRecord, ...records]);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('+919876543210');
      setIsCorporate(false);
      setKycStatus('Verified');
      setDeviceModel('');
      setSecurityDeposit('');
      setStartDate(() => new Date().toISOString().split('T')[0]);
      setDurationDays(7);
      setTouched({
        customerName: false,
        customerEmail: false,
        customerPhone: false,
        kycStatus: false,
        deviceModel: false,
        startDate: false,
        durationDays: false,
        securityDeposit: false
      });
      setIsSubmitting(false);
      setSuccessMsg(`Rental ticket ${dbRecord.id} successfully registered!`);
    })
    .catch(err => {
      console.error(err);
      setErrorMsg(err.message || 'Failed to register intake on server. Check server connection.');
      setIsSubmitting(false);
    });
  };

  const handleActionClick = (id, targetView) => {
    // Write query parameter to window search bar without reloading page
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url);
    setView(targetView);
  };

  const handleResetRegistry = () => {
    if (window.confirm("Are you sure you want to clear the registry and restore default mock data?")) {
      setErrorMsg('');
      setSuccessMsg('');
      fetch('http://localhost:5000/api/reset', { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error('Reset failed');
          return res.json();
        })
        .then(() => {
          // reload records from api
          fetch('http://localhost:5000/api/records')
            .then(res => {
              if (!res.ok) throw new Error('Failed to fetch records');
              return res.json();
            })
            .then(data => {
              setRecords(data);
              setSuccessMsg("Ledger registry reset successfully!");
            });
        })
        .catch(err => {
          console.error(err);
          setErrorMsg("Failed to reset registry on the server.");
        });
    }
  };

  const activeSymbol = currencyConfig[currency].symbol;

  // Metric computations (values in base currency INR)
  const totalDepositsSum = records.reduce((acc, r) => acc + r.securityDepositHeld, 0);
  const activeIncidentsCount = records.filter(r => r.damageType !== 'None').length;
  const openAuditsCount = records.filter(r => r.settlementStatus === 'Under Review' || r.settlementStatus === 'Isolated Repair').length;

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();
  const todayReturns = records.filter(r => {
    if (!r.endDate || r.settlementStatus !== 'Held') return false;
    const endPart = r.endDate.split('T')[0];
    return endPart <= todayStr;
  });

  const filteredRecords = dashboardRecords.filter(r => {
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

  return (
    <div className="animated-view" style={{ overflow: 'auto' }}>
      {/* Page Title & Utility Controls */}
      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', flexShrink: 0 }}>
              <rect x="3" y="3" width="7" height="9" rx="1.5" fill="var(--primary-glow)" fillOpacity="0.15" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            Asset Operations Dashboard
          </h1>
          <p className="muted-description" style={{ marginTop: '0.15rem' }}>
            Real-time intake, return auditing, and payout clearance operations.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleResetRegistry} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderStyle: 'dashed', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Restore default mock data"
          >
            <svg className="svg-icon" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '12px', height: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Reset Registry
          </button>
          
          <div style={{ background: 'rgba(120,120,120,0.02)', border: '1px solid var(--border-color)', padding: '0.4rem 0.9rem', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block', boxShadow: '0 0 8px var(--secondary)' }}></span>
              Active Session
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ gap: '1rem', marginBottom: '1rem' }}>
        <SummaryCard 
          title="Total Monitored Deposits" 
          value={formatVal(totalDepositsSum)} 
          icon={
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <defs>
                <linearGradient id="dbGoldSide" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="25%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="75%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                <linearGradient id="dbGoldCap" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <g>
                <path d="M30 35 V75 C30 80.5 40 85 52.5 85 C65 85 75 80.5 75 75 V35 Z" fill="url(#dbGoldSide)" />
                <path d="M30 43 C30 48.5 40 53 52.5 53 C65 53 75 48.5 75 43 M30 51 C30 56.5 40 61 52.5 61 C65 61 75 56.5 75 51 M30 59 C30 64.5 40 69 52.5 69 C65 69 75 64.5 75 59 M30 67 C30 72.5 40 77 52.5 77 C65 77 75 72.5 75 67" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.4" />
                <ellipse cx="52.5" cy="35" rx="22.5" ry="10" fill="url(#dbGoldCap)" stroke="#d97706" strokeWidth="1.5" />
              </g>
              <g>
                <path d="M50 50 V85 C50 89.5 59 93 70 93 C81 93 90 89.5 90 85 V50 Z" fill="url(#dbGoldSide)" />
                <path d="M50 57 C50 61.5 59 65 70 65 C81 65 90 61.5 90 57 M50 64 C50 68.5 59 72 70 72 C81 72 90 68.5 90 64 M50 71 C50 75.5 59 79 70 79 C81 79 90 75.5 90 71 M50 78 C50 82.5 59 86 70 86 C81 86 90 82.5 90 78" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.4" />
                <ellipse cx="70" cy="50" rx="20" ry="8" fill="url(#dbGoldCap)" stroke="#d97706" strokeWidth="1.5" />
              </g>
              <g>
                <path d="M10 65 V90 C10 93.8 19 97 30 97 C41 97 50 93.8 50 90 V65 Z" fill="url(#dbGoldSide)" />
                <path d="M10 71.25 C10 75.05 19 78.25 30 78.25 C41 78.25 50 75.05 50 71.25 M10 77.5 C10 81.3 19 84.5 30 84.5 C41 84.5 50 81.3 50 77.5 M10 83.75 C10 87.55 19 90.75 30 90.75 C41 90.75 50 87.55 50 83.75" stroke="#92400e" strokeWidth="0.8" fill="none" opacity="0.4" />
                <ellipse cx="30" cy="65" rx="20" ry="8" fill="url(#dbGoldCap)" stroke="#d97706" strokeWidth="1.5" />
              </g>
            </svg>
          } 
          type="primary" 
          onClick={() => handleMetricClick('deposits')}
          isSelected={false}
        />
        <SummaryCard 
          title="Active Incidents" 
          value={activeIncidentsCount} 
          icon={
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <path d="M44.75 14.5C47.0588 10.5 52.9412 10.5 55.25 14.5L92.2154 78.5C94.5242 82.5 91.633 87.5 86.9654 87.5H13.0346C8.36703 87.5 5.47578 82.5 7.78458 78.5L44.75 14.5Z" fill="#FFFFFF" stroke="#ef4444" strokeWidth="10" strokeLinejoin="round" />
              <path d="M47 34C47 32.34 48.34 31 50 31C51.66 31 53 32.34 53 34L51.8 55C51.8 56.1 51 57 50 57C49 57 48.2 56.1 48.2 55L47 34Z" fill="#000000" />
              <circle cx="50" cy="67" r="4.5" fill="#000000" />
            </svg>
          } 
          type="danger" 
          onClick={() => handleMetricClick('incidents')}
          isSelected={false}
        />
        <SummaryCard 
          title="Open Audits" 
          value={openAuditsCount} 
          icon={
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <defs>
                <linearGradient id="dbFolderBack" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
                <linearGradient id="dbFolderFront" x1="10" y1="35" x2="90" y2="85" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
              </defs>
              <path d="M10 25C10 22.2386 12.2386 20 15 20H38C40.054 20 41.9163 21.2533 42.6738 23.147L46.4674 32.6304C46.8461 33.5773 47.7773 34.2038 48.7937 34.2038H85C87.7614 34.2038 90 36.4424 90 39.2038V75C90 77.7614 87.7614 80 85 80H15C12.2386 80 10 77.7614 10 75V25Z" fill="url(#dbFolderBack)" />
              <path d="M10 39C10 36.2386 12.2386 34 15 34H85C87.7614 34 90 36.2386 90 39V75C90 77.7614 87.7614 80 85 80H15C12.2386 80 10 77.7614 10 75V39Z" fill="url(#dbFolderFront)" />
            </svg>
          } 
          type="warning" 
          onClick={() => handleMetricClick('audits')}
          isSelected={false}
        />
        <SummaryCard 
          title="Due Today" 
          value={todayReturns.length} 
          icon={
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <defs>
                <linearGradient id="calHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="calBody" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
              </defs>
              <rect x="15" y="20" width="70" height="70" rx="10" fill="url(#calBody)" stroke="#94a3b8" strokeWidth="2.5" />
              <path d="M15 30C15 24.4772 19.4772 20 25 20H75C80.5228 20 85 24.4772 85 30V40H15V30Z" fill="url(#calHeader)" />
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
          } 
          type="primary" 
          onClick={() => handleMetricClick('duetoday')}
          isSelected={false}
        />
      </div>

      <div className="dashboard-grid" style={{ marginTop: '0' }}>
        {/* Stage 1 Intake Form (left column) */}
        <div className="glass-panel intake-form-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>1</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Stage 1: Handoff & Customer Intake</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1rem' }}>
                <div className="alert-message-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="alert-message-content">
                  <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Error</strong>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{errorMsg}</span>
                </div>
              </div>
            )}
            
            {successMsg && (
              <div className="alert-message-box alert-success-style" style={{ marginBottom: '1rem' }}>
                <div className="alert-message-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="alert-message-content">
                  <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Success</strong>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{successMsg}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Customer Full Name</label>
              <input 
                type="text" 
                className={`form-control ${touched.customerName && customerName.trim() === '' ? 'input-error-state' : ''}`}
                placeholder="Alex Mercer" 
                value={customerName} 
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={blockNumbersOnName}
                onBlur={() => setTouched(prev => ({ ...prev, customerName: true }))}
                required
              />
              {touched.customerName && customerName.trim() === '' && (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Customer Full Name is required
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Customer Email Address</label>
              <input 
                type="email" 
                className={`form-control ${touched.customerEmail && (customerEmail.trim() === '' || !isValidEmail(customerEmail.trim())) ? 'input-error-state' : ''}`}
                placeholder="alex.mercer@example.com" 
                value={customerEmail} 
                onChange={(e) => setCustomerEmail(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, customerEmail: true }))}
                required
              />
              {touched.customerEmail && customerEmail.trim() === '' && (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Customer Email Address is required
                </div>
              )}
              {touched.customerEmail && customerEmail.trim() !== '' && !isValidEmail(customerEmail.trim()) && (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Valid customer email address is required
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Customer Phone Number</label>
              <input 
                type="text" 
                className={`form-control ${touched.customerPhone && customerPhone.trim() === '' ? 'input-error-state' : ''}`}
                placeholder="+919876543210" 
                value={customerPhone} 
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={blockAlphaOnPhone}
                onBlur={() => setTouched(prev => ({ ...prev, customerPhone: true }))}
                required
              />
              {touched.customerPhone && customerPhone.trim() === '' ? (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Phone number is required
                </div>
              ) : (
                <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                  Format: International E.164 (e.g. +919876543210). Spaces/hyphens will be auto-cleaned.
                </small>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.75rem 0' }}>
              <input 
                type="checkbox" 
                id="isCorporate"
                checked={isCorporate} 
                onChange={(e) => setIsCorporate(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isCorporate" style={{ margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Corporate Customer Profile
              </label>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>KYC Verification Status</span>
                {kycChecking && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Checking...</span>}
              </label>
              <select
                value={kycStatus}
                onChange={(e) => setKycStatus(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, kycStatus: true }))}
                className={`form-control ${touched.kycStatus && kycStatus !== 'Verified' ? 'input-error-state' : ''}`}
                style={{ 
                  cursor: 'pointer',
                  color: (kycStatus !== 'Verified') ? '#ef4444' : 'var(--text-primary)',
                  fontWeight: (kycStatus !== 'Verified') ? 700 : 'normal'
                }}
              >
                <option value="Verified">Verified / Approved</option>
                <option value="Pending">Pending Verification</option>
                <option value="Rejected">Rejected / Blocked</option>
              </select>
              {touched.kycStatus && kycStatus !== 'Verified' && (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  KYC Compliance Status must be Verified
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Device Model & Brand</label>
              <input 
                type="text" 
                className={`form-control ${touched.deviceModel && deviceModel.trim() === '' ? 'input-error-state' : ''}`}
                placeholder="iPad Pro M4" 
                value={deviceModel} 
                onChange={(e) => handleDeviceModelChange(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, deviceModel: true }))}
                required
              />
              {touched.deviceModel && deviceModel.trim() === '' && (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Device Model and brand is required
                </div>
              )}
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label>Rental Start Date</label>
                <input 
                  type="date" 
                  className={`form-control ${touched.startDate && startDate === '' ? 'input-error-state' : ''}`}
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, startDate: true }))}
                  required
                />
                {touched.startDate && startDate === '' && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Rental Start Date must be selected
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Duration (Days)</label>
                <input 
                  type="number" 
                  min="1" 
                  className={`form-control ${touched.durationDays && (durationDays === '' || parseInt(durationDays, 10) < 1) ? 'input-error-state' : ''}`}
                  value={durationDays} 
                  onKeyDown={blockInvalidChar}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDurationDays('');
                      return;
                    }
                    const parsed = parseInt(val, 10);
                    setDurationDays(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, durationDays: true }))}
                  required
                />
                {touched.durationDays && (durationDays === '' || parseInt(durationDays, 10) < 1) && (
                  <div className="validation-error-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Duration (Days) must be 1 or more
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Calendar End Date (Locked)</label>
              <input 
                type="date" 
                className="form-control" 
                value={getCalculatedReturnDate()} 
                readOnly
                style={{ background: 'var(--bg-input)', opacity: 0.8, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>Security Deposit Held ({activeSymbol})</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  {activeSymbol}
                </span>
                <input 
                  type="number" 
                  className={`form-control ${touched.securityDeposit && (securityDeposit === '' || parseFloat(securityDeposit) < 0) ? 'input-error-state' : ''}`}
                  min="0"
                  onKeyDown={blockInvalidChar}
                  placeholder={currency === 'INR' ? '25000' : currency === 'USD' ? '300' : currency === 'EUR' ? '280' : currency === 'GBP' ? '250' : currency === 'AED' ? '1100' : currency === 'SGD' ? '400' : '250'} 
                  style={{ paddingLeft: '2.2rem' }}
                  value={securityDeposit} 
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, securityDeposit: true }))}
                  required
                />
              </div>
              {touched.securityDeposit && (securityDeposit === '' || parseFloat(securityDeposit) < 0) && (
                <div className="validation-error-text">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  Security deposit amount is required
                </div>
              )}
            </div>

            {kycStatus !== 'Verified' && (
              <div 
                className="alert-message-box alert-danger-style"
                style={{
                  borderLeftWidth: '5px',
                  marginBottom: '1rem'
                }}
              >
                <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <div className="alert-message-content">
                  <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KYC COMPLIANCE LOCK ACTIVE</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4, fontWeight: 600 }}>
                    This customer account is currently <strong>{kycStatus}</strong>. Assignment of electronic rental assets is strictly blocked until identity checks are cleared.
                  </p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className={`btn btn-primary ${isSubmitting || !isFormValid ? 'btn-disabled' : ''}`}
              style={{ 
                width: '100%', 
                marginTop: '0.75rem',
                backgroundColor: !isFormValid ? 'var(--border-color)' : undefined,
                color: !isFormValid ? 'var(--text-muted)' : undefined,
                cursor: !isFormValid ? 'not-allowed' : 'pointer'
              }}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? 'Registering Intake...' : 'Lock Security Deposit & Issue Device'}
            </button>
          </form>
        </div>

        {/* Right column containing Today's Returns and Deposit Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="ledger-panel-wrapper">

        
          <div className="glass-panel ledger-panel" style={{ padding: '1.25rem', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', verticalAlign: 'middle' }}>
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                <path d="M16 8H8" strokeWidth="1.8" />
                <path d="M16 12H8" strokeWidth="1.8" />
                <path d="M13 16H8" strokeWidth="1.8" />
              </svg>
              Current Rental Deposit Ledger
            </h3>
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              style={{ maxWidth: '200px', fontSize: '0.82rem', height: '32px', padding: '0 0.6rem' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status/Type Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', flexShrink: 0 }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'Held', label: 'Held' },
              { id: 'Under Review', label: 'Under Review' },
              { id: 'Isolated Repair', label: 'Isolated Repair' },
              { id: 'Settled', label: 'Settled' },
              { id: 'Water', label: 'Water Damage' },
              { id: 'Overdue', label: 'Overdue' }
            ].map(pill => {
              const isSelected = activeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFilter(pill.id)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-input)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 'normal',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
          <div className="table-container" style={{ border: 'none', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Rental ID</th>
                  <th>Customer Name</th>
                  <th>Tracking Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No matching rental records found.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, index) => (
                    <tr 
                      key={index} 
                      className="clickable-row"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleActionClick(r.rentalId, 'customer-detail')}
                      title="Click to view customer details and execute actions"
                    >
                      <td style={{ padding: '12px' }}>
                        <span className="rental-tracking-id">{r.rentalId}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                      <td><StatusBadge status={r.settlementStatus} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>


    </div>
  );
}
