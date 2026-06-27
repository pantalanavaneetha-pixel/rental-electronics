import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SummaryCard from '../components/SummaryCard';
import { GoldCoinStack, IncidentShield, OpenAuditsFolder, CalendarDue, DashboardIcon, CopyIcon, RefreshIcon, CheckCircleIcon, WarningTriangleIcon, ExclamationCircleIcon, ShieldAlertIcon, InvoiceClipboard, PlusIcon, EditIcon, EyeIcon } from '../components/PremiumIcons';
import StatusBadge from '../components/StatusBadge';
import DeviceSelector, { EXISTING_DEVICES } from '../components/DeviceSelector';
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
    deviceBaseCost: 150000,
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
    deviceBaseCost: 80000,
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
    deviceBaseCost: 120000,
    securityDepositHeld: 25000,
    damageType: "Body Scratches / Dents",
    damageDeduction: 4166,
    photoEvidenceUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600",
    settlementStatus: "Settled"
  },
  {
    rentalId: "REF-2026-004",
    customerName: "Rohan Sharma",
    customerEmail: "rohan.sharma@example.com",
    kycStatus: "Verified",
    deviceModel: "Canon DSLR Camera",
    deviceBaseCost: 25000,
    securityDepositHeld: 10000,
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held"
  },
  {
    rentalId: "REF-2026-005",
    customerName: "Sneha Reddy",
    customerEmail: "sneha.reddy@example.com",
    kycStatus: "Verified",
    deviceModel: "Lenovo ThinkPad Laptop",
    deviceBaseCost: 40000,
    securityDepositHeld: 15000,
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held"
  }
];

const COUNTRY_PHONE_CONFIGS = [
  { code: '91', country: 'India', flag: '🇮🇳', currency: 'INR', digits: 10, prefix: '+91' },
  { code: '01', country: 'United States', flag: '🇺🇸', currency: 'USD', digits: 10, prefix: '+1' },
  { code: '44', country: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', digits: 10, prefix: '+44' },
  { code: '49', country: 'Germany', flag: '🇩🇪', currency: 'EUR', digits: 10, prefix: '+49' },
  { code: '97', country: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', digits: 9, prefix: '+971' },
  { code: '65', country: 'Singapore', flag: '🇸🇬', currency: 'SGD', digits: 8, prefix: '+65' }
];

const detectCountryByPrefix = (prefixVal) => {
  const clean = prefixVal.replace(/[^0-9]/g, '');
  if (clean === '91') return COUNTRY_PHONE_CONFIGS.find(c => c.code === '91');
  if (clean === '01' || clean === '1') return COUNTRY_PHONE_CONFIGS.find(c => c.code === '01');
  if (clean === '44') return COUNTRY_PHONE_CONFIGS.find(c => c.code === '44');
  if (clean === '49') return COUNTRY_PHONE_CONFIGS.find(c => c.code === '49');
  if (clean === '97') return COUNTRY_PHONE_CONFIGS.find(c => c.code === '97');
  if (clean === '65') return COUNTRY_PHONE_CONFIGS.find(c => c.code === '65');
  return null;
};

export default function Dashboard({ records, setRecords, setView, currency, currencyConfig, formatVal, fromBase, toBase, onCurrencyChange }) {
  const { isAuthenticated, user } = useAuth();

  // Intake form state (Stage 1 Handoff)
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [countryPrefix, setCountryPrefix] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [altPhoneNumber, setAltPhoneNumber] = useState('');
  const [isCorporate, setIsCorporate] = useState(false);

  // Quick Edit Modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDeviceModel, setEditDeviceModel] = useState('');
  const [editDeviceBaseCost, setEditDeviceBaseCost] = useState('');
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


  const [kycStatus, setKycStatus] = useState('Verified');
  const [kycChecking, setKycChecking] = useState(false);
  const [governmentId, setGovernmentId] = useState('');
  const [address, setAddress] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceBaseCost, setDeviceBaseCost] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState(7);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showIntakeModal, setShowIntakeModal] = useState(false);

  // Form touched state to support direct field validation display onBlur
  const [touched, setTouched] = useState({
    customerName: false,
    customerEmail: false,
    customerPhone: false,
    kycStatus: false,
    governmentId: false,
    address: false,
    deviceModel: false,
    startDate: false,
    durationDays: false,
    securityDeposit: false,
    deviceBaseCost: false
  });

  // Analyzer state
  const [analyzerDevice, setAnalyzerDevice] = useState('Canon DSLR Camera');
  const [analyzerDamage, setAnalyzerDamage] = useState('Cracked Screen');
  const [analyzerMultiplier, setAnalyzerMultiplier] = useState(1.0);

  const getDynamicDamageCost = (damageName, category, baseCost) => {
    const base = parseFloat(baseCost) || 0;
    const cat = (category || '').toLowerCase();
    const dmg = (damageName || '').toLowerCase();

    if (base <= 0) {
      if (dmg.includes('screen')) return 10000;
      if (dmg.includes('dent') || dmg.includes('scratch')) return 3750;
      if (dmg.includes('water') || dmg.includes('fluid')) return 20833;
      if (dmg.includes('port') || dmg.includes('charging')) return 5000;
      if (dmg.includes('accessories') || dmg.includes('charger')) return 2500;
      if (dmg.includes('power') || dmg.includes('defect') || dmg.includes('hardware')) return 12000;
      return 0;
    }

    let group = 'general';
    if (cat.includes('laptop') || cat.includes('macbook') || cat.includes('notebook')) {
      group = 'laptop';
    } else if (cat.includes('camera') || cat.includes('lens') || cat.includes('dslr')) {
      group = 'camera';
    } else if (cat.includes('phone') || cat.includes('iphone') || cat.includes('samsung')) {
      group = 'phone';
    } else if (cat.includes('ipad') || cat.includes('tablet') || cat.includes('galaxy tab')) {
      group = 'tablet';
    }

    if (dmg.includes('screen')) {
      if (group === 'laptop') return Math.round(base * 0.15);
      if (group === 'camera') return Math.round(base * 0.16);
      if (group === 'tablet') return Math.round(base * 0.12);
      if (group === 'phone') return Math.round(base * 0.10);
      return Math.round(base * 0.12);
    }

    if (dmg.includes('dent') || dmg.includes('scratch')) {
      if (group === 'laptop') return Math.round(base * 0.05);
      if (group === 'camera') return Math.round(base * 0.05);
      if (group === 'tablet') return Math.round(base * 0.04);
      if (group === 'phone') return Math.round(base * 0.03);
      return Math.round(base * 0.04);
    }

    if (dmg.includes('water') || dmg.includes('fluid')) {
      if (group === 'laptop') return Math.round(base * 0.30);
      if (group === 'camera') return Math.round(base * 0.35);
      if (group === 'tablet') return Math.round(base * 0.25);
      if (group === 'phone') return Math.round(base * 0.20);
      return Math.round(base * 0.25);
    }

    if (dmg.includes('port') || dmg.includes('charging')) {
      if (group === 'laptop') return Math.round(base * 0.08);
      if (group === 'camera') return Math.round(base * 0.08);
      if (group === 'tablet') return Math.round(base * 0.06);
      if (group === 'phone') return Math.round(base * 0.05);
      return Math.round(base * 0.06);
    }

    if (dmg.includes('power') || dmg.includes('defect') || dmg.includes('hardware')) {
      if (group === 'laptop') return Math.round(base * 0.20);
      if (group === 'camera') return Math.round(base * 0.20);
      if (group === 'tablet') return Math.round(base * 0.15);
      if (group === 'phone') return Math.round(base * 0.12);
      return Math.round(base * 0.15);
    }

    if (dmg.includes('accessories') || dmg.includes('charger') || dmg.includes('cable')) {
      if (group === 'laptop') return Math.round(base * 0.04);
      if (group === 'camera') return Math.round(base * 0.04);
      if (group === 'tablet') return Math.round(base * 0.03);
      if (group === 'phone') return Math.round(base * 0.02);
      return Math.round(base * 0.03);
    }

    return 0;
  };

  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }

      if (e.key === 'Escape') {
        setShowIntakeModal(false);
      }

      if (showIntakeModal && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitBtn = document.querySelector('form.ops-modal-container button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          e.preventDefault();
          submitBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showIntakeModal]);

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

    // Dynamic price lookup
    const matched = EXISTING_DEVICES.find(d => d.name.toLowerCase() === sanitized.toLowerCase());
    if (matched && matched.baseCost) {
      const displayBaseCost = fromBase(matched.baseCost, currency);
      setDeviceBaseCost(Math.round(displayBaseCost).toString());

      // Recommend security deposit as 33% of base cost
      const displayDeposit = fromBase(Math.round(matched.baseCost * 0.33), currency);
      setSecurityDeposit(Math.round(displayDeposit).toString());
    }
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

  const handlePrefixChange = (val) => {
    setCountryPrefix(val);
    const country = detectCountryByPrefix(val);
    if (country) {
      if (onCurrencyChange) {
        onCurrencyChange(country.currency);
      }
      if (phoneNumber.length > country.digits) {
        setPhoneNumber(phoneNumber.slice(0, country.digits));
      }
      if (altPhoneNumber.length > country.digits) {
        setAltPhoneNumber(altPhoneNumber.slice(0, country.digits));
      }
    }
  };

  const handlePhoneNumberChange = (val) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    const country = detectCountryByPrefix(countryPrefix);
    const limit = country ? country.digits : 15;
    setPhoneNumber(sanitized.slice(0, limit));
  };

  const handleAltPhoneNumberChange = (val) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    const country = detectCountryByPrefix(countryPrefix);
    const limit = country ? country.digits : 15;
    setAltPhoneNumber(sanitized.slice(0, limit));
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

  const detectedCountry = detectCountryByPrefix(countryPrefix);
  const isFormValid = customerName.trim().length >= 2 &&
                      isValidEmail(customerEmail.trim()) &&
                      detectedCountry !== null &&
                      phoneNumber.trim().length === detectedCountry.digits &&
                      (altPhoneNumber.trim() === '' || altPhoneNumber.trim().length === detectedCountry.digits) &&
                      address.trim().length >= 5 &&
                      address.trim().length <= 300 &&
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
        <CopyIcon size={10} style={{ flexShrink: 0 }} />
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

    const currentDetectedCountry = detectCountryByPrefix(countryPrefix);
    if (!currentDetectedCountry) {
      setErrorMsg('Please select a valid country.');
      return;
    }

    if (phoneNumber.trim().length !== currentDetectedCountry.digits) {
      setErrorMsg(`Phone number must be exactly ${currentDetectedCountry.digits} digits for ${currentDetectedCountry.country}.`);
      return;
    }

    if (altPhoneNumber.trim() !== '' && altPhoneNumber.trim().length !== currentDetectedCountry.digits) {
      setErrorMsg(`Alternative phone number must be exactly ${currentDetectedCountry.digits} digits for ${currentDetectedCountry.country}.`);
      return;
    }

    setIsSubmitting(true);

    // Convert deposit to base currency (INR) for internal storage
    const depositInBase = toBase(depositNum, currency);

    const baseCostNum = parseFloat(deviceBaseCost);
    const baseCostInBase = !isNaN(baseCostNum) && baseCostNum >= 0 ? toBase(baseCostNum, currency) : (depositInBase * 2);

    const start = new Date(startDate);
    const end = new Date(getCalculatedReturnDate());

    // Combine prefix and numbers
    const mainE164 = currentDetectedCountry.prefix + phoneNumber.trim();
    const altE164 = altPhoneNumber.trim() !== '' ? currentDetectedCountry.prefix + altPhoneNumber.trim() : '';
    const sanitizedPhone = altE164 ? `${mainE164} / ${altE164}` : mainE164;

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
        address: address.trim(),
        deviceSerial: `SR-${Math.floor(10000 + Math.random() * 90000)}`,
        deviceCategory: deviceModel.trim(),
        deviceBaseCost: baseCostInBase,
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
        const detailsStr = data.details ? data.details.map(d => `${d.field}: ${d.message}`).join(', ') : '';
        throw new Error(data.error ? `${data.error} (${detailsStr})` : 'API failed');
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
        customerPhone: sanitizedPhone,
        deviceModel: deviceModel.trim(),
        deviceBaseCost: parseFloat(dbRecord.base_cost || baseCostInBase),
        securityDepositHeld: parseFloat(dbRecord.security_deposit),
        damageType: 'None',
        damageDeduction: 0,
        daysOverdue: 0,
        lateFeeCharged: 0,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      };
      setRecords([mappedRecord, ...records]);
      setCustomerName('');
      setCustomerEmail('');
      setCountryPrefix('91');
      setPhoneNumber('');
      setAltPhoneNumber('');
      setDeviceModel('');
      setDeviceBaseCost('');
      setSecurityDeposit('');
      setAltPhoneNumber('');
      setIsCorporate(false);
      setKycStatus('Verified');
      setDeviceModel('');
      setSecurityDeposit('');
      setAddress('');

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

      setShowIntakeModal(false);
    })
    .catch(err => {
      console.error(err);
      setErrorMsg(err.message || 'Failed to register intake on server. Check server connection.');
      setIsSubmitting(false);
    });
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

  if (!isAuthenticated || user?.role !== 'Manager') {
    return (
      <div className="alert-message-box alert-danger-style" style={{ margin: '3rem auto', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div className="alert-message-content">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Access Denied</h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {!isAuthenticated 
              ? 'Please sign in to access the administrator dashboard.' 
              : 'You do not have the required Manager role privileges to view this page.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-view" style={{ overflow: 'auto' }}>
      {/* Page Title & Utility Controls */}
      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DashboardIcon active={true} size={28} style={{ verticalAlign: 'middle', flexShrink: 0 }} />
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
            <RefreshIcon size={12} />
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
          title="Total Deposits" 
          value={formatVal(totalDepositsSum)} 
          icon={<GoldCoinStack />} 
          type="primary" 
          onClick={() => handleMetricClick('deposits')}
          isSelected={false}
        />
        <SummaryCard 
          title="Active Incidents" 
          value={activeIncidentsCount} 
          icon={<IncidentShield />} 
          type="danger" 
          onClick={() => handleMetricClick('incidents')}
          isSelected={false}
        />
        <SummaryCard 
          title="Open Audits" 
          value={openAuditsCount} 
          icon={<OpenAuditsFolder />} 
          type="warning" 
          onClick={() => handleMetricClick('audits')}
          isSelected={false}
        />
        <SummaryCard 
          title="Due Today" 
          value={todayReturns.length} 
          icon={<CalendarDue />} 
          type="primary" 
          onClick={() => handleMetricClick('duetoday')}
          isSelected={false}
        />
      </div>

      {successMsg && (
        <div className="alert-message-box alert-success-style" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="alert-message-icon-wrapper">
              <CheckCircleIcon size={20} />
            </div>
            <div className="alert-message-content">
              <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success</strong>
              <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{successMsg}</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessMsg('')} 
            style={{ background: 'transparent', border: 'none', color: 'var(--success-solid)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.25rem', padding: '0 4px' }}
            title="Dismiss Alert"
          >
            ✕
          </button>
        </div>
      )}

      <div className="dashboard-grid" style={{ marginTop: '0', gridTemplateColumns: '1fr', overflow: 'visible', height: 'auto', minHeight: 'auto', flex: 'none' }}>
        {showIntakeModal && (
          <div className="ops-modal-overlay">
            <form onSubmit={handleSubmit} className="ops-modal-container">
              <div className="ops-modal-header">
                <div className="ops-modal-header-title">
                  <div className="ops-modal-header-step">1</div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Register New Rental</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="ops-modal-close-btn"
                  aria-label="Close"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ✕ <span className="keycap-indicator" style={{ fontSize: '0.62rem', padding: '0px 3.5px', marginLeft: '2px', borderBottomWidth: '1.5px' }}>esc</span>
                </button>
              </div>

              <div className="ops-modal-body">
                {errorMsg && (
                  <div className="alert-message-box alert-danger-style" style={{ marginBottom: '1.25rem' }}>
                    <div className="alert-message-icon-wrapper">
                      <WarningTriangleIcon size={20} />
                    </div>
                    <div className="alert-message-content">
                      <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Error</strong>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{errorMsg}</span>
                    </div>
                  </div>
                )}
                
                {successMsg && (
                  <div className="alert-message-box alert-success-style" style={{ marginBottom: '1.25rem' }}>
                    <div className="alert-message-icon-wrapper">
                      <CheckCircleIcon size={20} />
                    </div>
                    <div className="alert-message-content">
                      <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Success</strong>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{successMsg}</span>
                    </div>
                  </div>
                )}

                {/* Section 1: Customer Profile */}
                <div className="ops-form-section-title">
                  👤 Customer Profile
                </div>

                <div className="ops-grid-2">
                  <div className="form-group">
                    <label>Customer Full Name</label>
                    <input 
                      type="text" 
                      className={`form-control ${touched.customerName && (customerName.trim() === '' || customerName.trim().length < 2) ? 'input-error-state' : ''}`}
                      placeholder="Alex Mercer" 
                      value={customerName} 
                      onChange={(e) => handleNameChange(e.target.value)}
                      onKeyDown={blockNumbersOnName}
                      onBlur={() => setTouched(prev => ({ ...prev, customerName: true }))}
                      required
                    />
                    {touched.customerName && customerName.trim() === '' && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Customer Full Name is required
                      </div>
                    )}
                    {touched.customerName && customerName.trim() !== '' && customerName.trim().length < 2 && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Full Name must be at least 2 characters
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
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Customer Email Address is required
                      </div>
                    )}
                    {touched.customerEmail && customerEmail.trim() !== '' && !isValidEmail(customerEmail.trim()) && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Valid customer email address is required
                      </div>
                    )}
                  </div>
                </div>

                <div className="ops-grid-2">
                  <div className="form-group">
                    <label>Contact Number</label>
                    <div className="ops-phone-row">
                      <select
                        value={countryPrefix}
                        onChange={(e) => handlePrefixChange(e.target.value)}
                        className="form-control ops-phone-prefix-select"
                        style={{ cursor: 'pointer' }}
                      >
                        {COUNTRY_PHONE_CONFIGS.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.prefix}
                          </option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        className={`form-control ${touched.customerPhone && (phoneNumber.trim() === '' || (detectedCountry && phoneNumber.trim().length !== detectedCountry.digits)) ? 'input-error-state' : ''}`}
                        placeholder={detectedCountry ? `Enter ${detectedCountry.digits}-digit number` : "Enter contact number"}
                        value={phoneNumber} 
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        onKeyDown={blockAlphaOnPhone}
                        onBlur={() => setTouched(prev => ({ ...prev, customerPhone: true }))}
                        required
                      />
                    </div>
                    {detectedCountry && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Country: <strong>{detectedCountry.country}</strong> | Currency: <strong>{detectedCountry.currency}</strong>
                      </div>
                    )}
                    {touched.customerPhone && phoneNumber.trim() === '' && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Contact number is required
                      </div>
                    )}
                    {touched.customerPhone && detectedCountry && phoneNumber.trim().length !== detectedCountry.digits && phoneNumber.trim().length > 0 && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Number must be exactly {detectedCountry.digits} digits.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Alt Contact Number <span style={{ fontWeight: 'normal', color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Optional)</span></label>
                    <div className="ops-phone-row">
                      <div className="ops-phone-prefix-display">
                        {detectedCountry ? `${detectedCountry.flag} ${detectedCountry.prefix}` : '—'}
                      </div>
                      <input 
                        type="text" 
                        className={`form-control ${touched.customerPhone && altPhoneNumber.trim() !== '' && detectedCountry && altPhoneNumber.trim().length !== detectedCountry.digits ? 'input-error-state' : ''}`}
                        placeholder={detectedCountry ? `${detectedCountry.digits} digits` : "Alternative number"}
                        value={altPhoneNumber} 
                        onChange={(e) => handleAltPhoneNumberChange(e.target.value)}
                        onKeyDown={blockAlphaOnPhone}
                        onBlur={() => setTouched(prev => ({ ...prev, customerPhone: true }))}
                      />
                    </div>
                    {touched.customerPhone && altPhoneNumber.trim() !== '' && detectedCountry && altPhoneNumber.trim().length !== detectedCountry.digits && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Alt number must be exactly {detectedCountry.digits} digits.
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Residential / Billing Address</label>
                  <textarea 
                    className={`form-control ${touched.address && (address.trim() === '' || address.trim().length < 5) ? 'input-error-state' : ''}`}
                    placeholder="Full Street Address, City, State, ZIP" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                    style={{ resize: 'vertical', minHeight: '60px' }}
                  />
                  {touched.address && address.trim() === '' && (
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                      Address is required
                    </div>
                  )}
                  {touched.address && address.trim() !== '' && address.trim().length < 5 && (
                    <div className="ops-validation-error">
                      <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                      Address must be at least 5 characters
                    </div>
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

                {/* Section 2: Asset Assignment & KYC */}
                <div className="ops-form-section-title">
                  📱 Asset Assignment & KYC
                </div>

                <div className="ops-grid-2">
                  <div className="form-group">
                    <label>Device Model & Brand</label>
                    <DeviceSelector
                      value={deviceModel}
                      onChange={handleDeviceModelChange}
                      error={touched.deviceModel && deviceModel.trim() === ''}
                      onBlur={() => setTouched(prev => ({ ...prev, deviceModel: true }))}
                    />
                    {touched.deviceModel && deviceModel.trim() === '' && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Device Model and brand is required
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>KYC Verification Status</label>
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
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Compliance Status must be Verified
                      </div>
                    )}
                  </div>
                </div>

                {kycStatus !== 'Verified' && (
                  <div className="alert-message-box alert-danger-style" style={{ borderLeftWidth: '5px', marginBottom: '1.25rem' }}>
                    <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                      <ShieldAlertIcon size={22} />
                    </div>
                    <div className="alert-message-content">
                      <strong style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KYC COMPLIANCE LOCK ACTIVE</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', lineHeight: 1.4, fontWeight: 600 }}>
                        This customer account is currently <strong>{kycStatus}</strong>. Assignment of electronic rental assets is strictly blocked until identity checks are cleared.
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 3: Rental Duration & Period */}
                <div className="ops-form-section-title">
                  📅 Rental Duration & Period
                </div>

                <div className="ops-grid-2">
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
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
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
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Duration must be 1 or more
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

                {/* Section 4: Financial Deposit & Agreement */}
                <div className="ops-form-section-title">
                  💰 Financial Deposit & Agreement
                </div>

                <div className="ops-grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Security Deposit Held ({activeSymbol})</label>
                    <div className="ops-input-prefix-wrapper">
                      <span className="ops-input-prefix">
                        {activeSymbol}
                      </span>
                      <input 
                        type="number" 
                        className={`form-control ops-input-with-prefix ${touched.securityDeposit && (securityDeposit === '' || parseFloat(securityDeposit) < 0) ? 'input-error-state' : ''}`}
                        min="0"
                        step="1"
                        onKeyDown={blockInvalidChar}
                        placeholder={currency === 'INR' ? '25000' : currency === 'USD' ? '300' : currency === 'EUR' ? '280' : currency === 'GBP' ? '250' : currency === 'AED' ? '1100' : currency === 'SGD' ? '400' : '250'} 
                        value={securityDeposit} 
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, securityDeposit: true }))}
                        required
                      />
                    </div>
                    {touched.securityDeposit && (securityDeposit === '' || parseFloat(securityDeposit) < 0) && (
                      <div className="ops-validation-error">
                        <ExclamationCircleIcon size={12} style={{ flexShrink: 0 }} />
                        Security deposit amount is required
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Device Replacement Cost / Base Value ({activeSymbol})</label>
                    <div className="ops-input-prefix-wrapper">
                      <span className="ops-input-prefix">
                        {activeSymbol}
                      </span>
                      <input 
                        type="number" 
                        className="form-control ops-input-with-prefix"
                        min="0"
                        step="1"
                        onKeyDown={blockInvalidChar}
                        placeholder="e.g. 120000" 
                        value={deviceBaseCost} 
                        onChange={(e) => setDeviceBaseCost(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Rental Agreement Terms</label>
                  <div className="rental-agreement-box">
                    <strong>1. Security Deposit & Deductions</strong><br/>
                    The customer agrees to a security deposit to be held during the rental period. Deductions will be strictly calculated based on the return condition checklist and damage severity multipliers.<br/><br/>
                    <strong>2. Late Fees</strong><br/>
                    Returns made past the agreed End Date will incur a daily compounding late fee deducted from the security deposit.<br/><br/>
                    <strong>3. Compliance & KYC</strong><br/>
                    This agreement requires the customer to provide a valid Government ID and residential address. The equipment remains the property of the company at all times.
                  </div>
                </div>
              </div>

              <div className="ops-modal-footer">
                 <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowIntakeModal(false)}
                  style={{ flex: 1, height: '42px' }}
                >
                  Cancel <span className="keycap-indicator">esc</span>
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary sluggiest-hover ${isSubmitting || !isFormValid ? 'btn-disabled' : ''}`}
                  style={{ 
                    flex: 2, 
                    height: '42px',
                    backgroundColor: !isFormValid ? 'var(--border-color)' : undefined,
                    color: !isFormValid ? 'var(--text-muted)' : undefined,
                    cursor: !isFormValid ? 'not-allowed' : 'pointer'
                  }}
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? (
                    <><span className="elegant-spinner" style={{marginRight: '8px', width: '14px', height: '14px', borderTopColor: 'white'}}></span> Processing...</>
                  ) : <>Lock Deposit & Issue Device <span className="keycap-indicator">Ctrl+↵</span></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {editingRecord && (
          <div className="ops-modal-overlay">
            <form onSubmit={handleQuickEditSubmit} className="ops-modal-container">
              <div className="ops-modal-header">
                <h3 className="ops-modal-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <EditIcon size={20} style={{ color: 'var(--primary)' }} />
                  Edit Details: {editingRecord.rentalId}
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

        {/* Right column containing Today's Returns and Deposit Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'auto' }} className="ledger-panel-wrapper">

        
          <div className="glass-panel ledger-panel" style={{ padding: '1.25rem', margin: 0, height: 'auto', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem', flexShrink: 0 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <InvoiceClipboard size={18} style={{ color: 'var(--primary)', verticalAlign: 'middle' }} />
              Rental Deposit Ledger
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowIntakeModal(true)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.85rem', 
                  height: '38px', 
                  padding: '0 1rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxSizing: 'border-box'
                }}
              >
                <PlusIcon size={14} style={{ verticalAlign: 'middle' }} />
                New Customer
              </button>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control"
                placeholder="Search... [/]"
                style={{ maxWidth: '200px', fontSize: '0.85rem', height: '38px', padding: '0 0.8rem', boxSizing: 'border-box' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
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
          <div className="table-container" style={{ border: 'none', flex: 'none', overflowY: 'visible', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
            {records.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📁</div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Rentals Deployed</h3>
                <p style={{ margin: '6px 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: '1.4' }}>
                  There are currently no active rental agreements in the system database. Get started by registering a new checkout contract.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowIntakeModal(true)}
                  style={{ fontSize: '0.82rem', fontWeight: 'bold', padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusIcon size={14} />
                  Register New Rental
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '45px 20px', textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>No Matching Records</h3>
                <p style={{ margin: '4px 0 14px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.4' }}>
                  Your search query or status filter pills did not yield any results in the ledger database.
                </p>
                <button
                  type="button"
                  className="action-btn-small"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  style={{ fontSize: '0.78rem', fontWeight: 'bold', padding: '6px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '6px', transition: 'all var(--transition-fast)' }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="custom-table">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Rental ID</th>
                    <th>Customer Name</th>
                    <th>Rental Period</th>
                    <th>Deposit Held</th>
                    <th>Tracking Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r, index) => (
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
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>{new Date(r.startDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          to {new Date(r.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>
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
                       <td style={{ textAlign: 'right', paddingRight: '1rem' }} onClick={e => e.stopPropagation()}>
                         <div style={{ display: 'inline-flex', gap: '8px' }}>
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               startQuickEdit(r);
                             }}
                             className="btn btn-secondary"
                             style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                           >
                             <EditIcon size={16} />
                           </button>
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleActionClick(r.rentalId, 'customer-detail');
                             }}
                             className="btn btn-primary"
                             style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                           >
                             <EyeIcon size={12} />
                             Details
                           </button>
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        </div>
      </div>


    </div>
  );
}
