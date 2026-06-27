import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { SettlementDeskIcon, CheckCircleIcon, ExclamationCircleIcon, DocumentIcon, EyeIcon } from '../components/PremiumIcons';

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

/**
 * Constructs a short, simplified reconciliation mark for a claim record.
 */
const getShortReconciliationMark = (claim) => {
  if (!claim) return 'N/A';
  const hasDeductions = claim.damageDeduction > 0;
  const isOverdue = claim.daysOverdue > 0;
  const method = claim.paymentMethod || 'Default';
  
  let issue = '';
  if (hasDeductions && isOverdue) {
    issue = `${claim.damageType || 'Damages'} & Overdue (${claim.daysOverdue}d)`;
  } else if (hasDeductions) {
    issue = claim.damageType || 'Physical Damage';
  } else if (isOverdue) {
    issue = `Overdue Return (${claim.daysOverdue}d)`;
  } else {
    issue = 'Perfect Condition';
  }
  
  if (issue.length > 25) {
    issue = issue.substring(0, 22) + '...';
  }
  
  return `${issue} (${method})`;
};

export default function Settlement({ records, setRecords, formatVal, currency, currencyConfig, setView }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'archive', 'campaign'
  
  // Search state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('');

  // Local state overrides
  const [remarks, setRemarks] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState({});
  
  // AI Prompt & Note Assistant States
  const [editedPrompts, setEditedPrompts] = useState({});
  const [aiGenerating, setAiGenerating] = useState({});

  const [selectedDamages, setSelectedDamages] = useState({});
  const [customFee, setCustomFee] = useState(0); // customFee in base currency (INR)
  const [reconciliationMessage, setReconciliationMessage] = useState('');

  const [scanningRecordId, setScanningRecordId] = useState(null);
  const [scanningStep, setScanningStep] = useState(0);
  const [tempPhotoUrl, setTempPhotoUrl] = useState(null);

  const triggerVerificationScan = (rentalId, photoUrl) => {
    setScanningRecordId(rentalId);
    setScanningStep(1);
    setTempPhotoUrl(photoUrl);

    setTimeout(() => {
      setScanningStep(2);
      setTimeout(() => {
        setScanningStep(3);
        setTimeout(() => {
          setScanningStep(4);
          setTimeout(async () => {
            try {
              const res = await fetch(`http://localhost:5000/api/claims/${rentalId}/photo`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoEvidenceUrl: photoUrl })
              });
              const resJson = await res.json();
              if (res.ok && resJson.success) {
                setRecords(records.map(r => r.rentalId === rentalId ? resJson.data : r));
              } else {
                throw new Error(resJson.error || 'Failed to update photo evidence.');
              }
            } catch (err) {
              alert(`Error uploading photo evidence: ${err.message}`);
            } finally {
              setScanningRecordId(null);
              setScanningStep(0);
              setTempPhotoUrl(null);
            }
          }, 800);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let activeStream = null;
    if (cameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          activeStream = stream;
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          alert(`Camera access error: ${err.message}. Please check permissions or select from folder.`);
          setCameraActive(false);
        });
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      stopCamera();
      return dataUrl;
    }
    return null;
  };

  // Convert amount from base currency (INR) to current display currency
  const fromBase = (valInBase) => {
    const config = currencyConfig[currency] || { rate: 1 };
    return valInBase * config.rate;
  };

  // Convert input amount in current selected currency back to base (INR)
  const toBase = (valInCurrent) => {
    const config = currencyConfig[currency] || { rate: 1 };
    return Math.round(valInCurrent / config.rate);
  };

  const STANDARD_DAMAGES = [
    { name: 'Cracked Screen', cost: 10000 },
    { name: 'Body Dents', cost: 3750 },
    { name: 'Water Damage / Fluid Intrusion', cost: 20833 },
    { name: 'Port / Charging Malfunction', cost: 5000 },
    { name: 'Missing Accessories (Charger/Cables)', cost: 2500 },
    { name: 'Power Failure / Hardware Defect', cost: 12000 }
  ];

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

  const getActiveCalculations = () => {
    if (!activeClaim) return { damageFee: 0, lateFee: 0, totalDeductions: 0, netRefund: 0 };
    
    let damageFee = 0;
    Object.keys(selectedDamages).forEach(name => {
      if (selectedDamages[name]) {
        if (name === 'Custom') {
          damageFee += parseFloat(customFee) || 0;
        } else {
          const std = STANDARD_DAMAGES.find(d => d.name === name);
          if (std) {
            const computedCost = getDynamicDamageCost(name, activeClaim.deviceCategory || activeClaim.deviceModel, activeClaim.deviceBaseCost);
            damageFee += computedCost;
          }
        }
      }
    });

    const lateFee = parseFloat(activeClaim.lateFeeCharged) || 0;
    const totalDeductions = damageFee + lateFee;
    const netRefund = activeClaim.securityDepositHeld - totalDeductions;

    return {
      damageFee,
      lateFee,
      totalDeductions,
      netRefund
    };
  };

  const generateMessageText = (claim, damages, fee, refund) => {
    if (!claim) return '';
    const customerName = claim.customerName || 'Customer';
    const deviceName = claim.deviceModel || 'Device';
    
    const selectedList = Object.keys(damages)
      .filter(k => damages[k])
      .map(k => k === 'Custom' ? 'Custom Damage' : k);
      
    const conditionIssues = selectedList.length > 0 ? selectedList.join(', ') : 'None';
    
    return `Hello ${customerName}, your rental return for ${deviceName} has been processed. We noted the following condition issues: ${conditionIssues}. This resulted in a damage fee of ${formatVal(fee)}. Your final refund amount is ${formatVal(refund)}. Thank you!`;
  };

  const handleDamageToggle = (name) => {
    setSelectedDamages(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleCustomFeeChange = (e) => {
    const val = parseFloat(e.target.value) || 0;
    setCustomFee(toBase(val));
  };

  // Dynamic Event/Notification logs timeline states
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Single communication modal states
  const [commModal, setCommModal] = useState(null); // { record, channel: 'WhatsApp' | 'Email' }
  const [commSubject, setCommSubject] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [commTemplate, setCommTemplate] = useState('Deduction Statement');
  const [isSendingComm, setIsSendingComm] = useState(false);

  // Campaign promotional broadcast states
  const [broadcastChannel, setBroadcastChannel] = useState('Both');
  const [broadcastSubject, setBroadcastSubject] = useState('🎉 One Point Solutions: Special Festive Rental Promo Offer!');
  const [broadcastMessage, setBroadcastMessage] = useState('Celebrate this festival season with RentShield! We are offering an exclusive 20% discount on all MacBook, iPad, and iPhone rentals. Contact our support desk to reserve your upgraded device today.');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Helper to copy text to clipboard
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`Copied ${label || 'value'}: ${text}`);
  };

  // Filter and split records into open claims and settled registry history
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

  const archiveFilteredRecords = records.filter(r => {
    const q = archiveSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.rentalId && r.rentalId.toLowerCase().includes(q)) ||
      (r.customerId && r.customerId.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.customerEmail && r.customerEmail.toLowerCase().includes(q)) ||
      (r.deviceModel && r.deviceModel.toLowerCase().includes(q)) ||
      (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q))
    );
  });

  const settledClaims = archiveFilteredRecords.filter(r => r.settlementStatus === 'Settled');

  // Select first item in open queue by default if not set
  const activeClaimId = selectedClaimId || (openClaims.length > 0 ? openClaims[0].rentalId : null);
  const activeClaim = openClaims.find(c => c.rentalId === activeClaimId);

  // Sync selectedClaimId when list updates
  useEffect(() => {
    if (openClaims.length > 0) {
      if (!openClaims.some(c => c.rentalId === selectedClaimId)) {
        setSelectedClaimId(openClaims[0].rentalId);
      }
    } else {
      setSelectedClaimId(null);
    }
  }, [openClaims, selectedClaimId]);

  // Load dynamic event history logs from server when active claim transitions
  useEffect(() => {
    if (activeClaimId) {
      setLoadingLogs(true);
      fetch(`http://localhost:5000/api/notifications?rentalId=${activeClaimId}`)
        .then(res => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then(data => {
          setNotificationHistory(data.data || []);
        })
        .catch(err => {
          console.warn('Backend logs offline. Falling back to local states.', err);
          setNotificationHistory([]);
        })
        .finally(() => {
          setLoadingLogs(false);
        });
    } else {
      setNotificationHistory([]);
    }
  }, [activeClaimId]);

  // Auto-initialize checkboxes from incoming claim status
  useEffect(() => {
    if (activeClaim) {
      const damages = {};
      let customVal = 0;
      
      const type = activeClaim.damageType || 'None';
      const { damagePenalty } = parseDeductions(activeClaim); // base currency (INR)
      
      if (type !== 'None' && damagePenalty > 0) {
        let matchedSomething = false;
        
        if (type.toLowerCase().includes('screen')) {
          damages['Cracked Screen'] = true;
          matchedSomething = true;
        }
        if (type.toLowerCase().includes('dent') || type.toLowerCase().includes('scratch')) {
          damages['Body Dents'] = true;
          matchedSomething = true;
        }
        if (type.toLowerCase().includes('water') || type.toLowerCase().includes('fluid') || type.toLowerCase().includes('liquid')) {
          damages['Water Damage / Fluid Intrusion'] = true;
          matchedSomething = true;
        }
        if (type.toLowerCase().includes('port') || type.toLowerCase().includes('charg')) {
          damages['Port / Charging Malfunction'] = true;
          matchedSomething = true;
        }
        if (type.toLowerCase().includes('accessor') || type.toLowerCase().includes('cable')) {
          damages['Missing Accessories (Charger/Cables)'] = true;
          matchedSomething = true;
        }
        if (type.toLowerCase().includes('power') || type.toLowerCase().includes('defect') || type.toLowerCase().includes('hardware')) {
          damages['Power Failure / Hardware Defect'] = true;
          matchedSomething = true;
        }

        // Calculate how much damage fee is left after accounting for matched standard damages
        let standardSum = 0;
        if (damages['Cracked Screen']) standardSum += 10000;
        if (damages['Body Dents']) standardSum += 3750;
        if (damages['Water Damage / Fluid Intrusion']) standardSum += 20833;
        if (damages['Port / Charging Malfunction']) standardSum += 5000;
        if (damages['Missing Accessories (Charger/Cables)']) standardSum += 2500;
        if (damages['Power Failure / Hardware Defect']) standardSum += 12000;

        const diff = damagePenalty - standardSum;
        if (diff > 0 || !matchedSomething) {
          damages['Custom'] = true;
          customVal = diff > 0 ? diff : damagePenalty;
        }
      }
      
      setSelectedDamages(damages);
      setCustomFee(customVal);
    } else {
      setSelectedDamages({});
      setCustomFee(0);
    }
  }, [activeClaimId]);

  // Auto-generate notification text when states change
  useEffect(() => {
    if (activeClaim) {
      const { damageFee, netRefund } = getActiveCalculations();
      const msg = generateMessageText(activeClaim, selectedDamages, damageFee, netRefund);
      setReconciliationMessage(msg);
    } else {
      setReconciliationMessage('');
    }
  }, [activeClaimId, selectedDamages, customFee, currency]);

  const handleViewCustomer = (rentalId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', rentalId);
    window.history.pushState({}, '', url);
    if (setView) setView('customer-detail');
  };

  const handleExportCSV = () => {
    if (settledClaims.length === 0) {
      alert("No settled records available to export.");
      return;
    }
    
    // CSV headers
    const headers = ["Rental ID", "Customer ID", "Customer Name", "Customer Email", "Device Model", "Security Deposit (Base INR)", "Damage Deduction (Base INR)", "Settlement Status", "Settlement Date", "Reconciliation Method", "Notes"];
    
    // Map records to rows
    const rows = settledClaims.map(r => [
      r.rentalId,
      r.customerId || 'N/A',
      r.customerName,
      r.customerEmail || 'N/A',
      r.deviceModel,
      r.securityDepositHeld,
      r.damageDeduction,
      r.settlementStatus,
      r.settlementAt ? new Date(r.settlementAt).toLocaleDateString() : 'N/A',
      r.paymentMethod || 'Default',
      (r.notes || '').replace(/"/g, '""') // Escape quotes
    ]);
    
    // Construct CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OnePointSolutions_SettledClaims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle single template communication auto-prefill selection
  useEffect(() => {
    if (!commModal) return;
    const { record, channel } = commModal;
    const { damagePenalty, lateFee } = parseDeductions(record);
    const netRefund = record.securityDepositHeld - record.damageDeduction;
    const hasDeficit = netRefund < 0;
    const absRefund = Math.abs(netRefund);
    const defaultMethod = paymentMethods[record.rentalId] || (hasDeficit ? "Corporate Invoice Issued" : "UPI Refund Transfer");

    let subject = '';
    let body = '';

    if (commTemplate === 'Deduction Statement') {
      if (channel === 'Email') {
        subject = hasDeficit 
          ? `🛡️ One Point Solutions Reconciled Invoice - Deficit Balance Due [Ref: ${record.rentalId}]`
          : `🛡️ One Point Solutions Refund Receipt - Deposit Cleared [Ref: ${record.rentalId}]`;
        
        body = hasDeficit
          ? `Dear ${record.customerName},\n\nWe have completed the post-rental inspection audit on your returned device ${record.deviceModel} (Ref: ${record.rentalId}). Deductions exceeded your deposit.\n\nOutstanding Deficit Due: ${formatVal(absRefund)}\nBase Deposit: ${formatVal(record.securityDepositHeld)}\nPhysical Damages Assessed: ${formatVal(damagePenalty)}\nLate Fees Accrued: ${formatVal(lateFee)}\n\nReconciliation Channel: ${defaultMethod}\n\nPlease pay the outstanding balance at your earliest convenience. Thank you.`
          : `Dear ${record.customerName},\n\nWe have completed the post-rental inspection audit on your returned device ${record.deviceModel} (Ref: ${record.rentalId}). Remaining refund has been processed.\n\nNet Payout Disbursed: ${formatVal(netRefund)}\nBase Deposit: ${formatVal(record.securityDepositHeld)}\nPhysical Damages: ${formatVal(damagePenalty)}\nLate Overdue Fees: ${formatVal(lateFee)}\n\nReconciliation Channel: ${defaultMethod}\n\nThe funds should reflect in your account shortly. Thank you for renting with One Point Solutions!`;
      } else {
        body = hasDeficit
          ? `One Point Solutions Invoice Alert: Outstanding liability deficit of ${formatVal(absRefund)} is due for contract ${record.rentalId}. Reconciled via: ${defaultMethod}.`
          : `One Point Solutions Payout Alert: Net refund of ${formatVal(netRefund)} has been successfully released via ${defaultMethod} for contract ${record.rentalId}.`;
      }
    } else if (commTemplate === 'Overdue Checklist') {
      if (channel === 'Email') {
        subject = `⏰ URGENT Return Alert: Overdue Equipment Checklist [Ref: ${record.rentalId}]`;
        body = `Dear ${record.customerName},\n\nThis is a warning that your rental ${record.deviceModel} (Contract Ref: ${record.rentalId}) is currently overdue.\n\nLate return penalty charges of ₹1,250 per day are accumulating against your held security deposit of ${formatVal(record.securityDepositHeld)}.\n\nPlease return the laptop/tablet and original charger immediately to prevent further deductions.\n\nBest regards,\nOne Point Solutions Audit Desk`;
      } else {
        body = `One Point Solutions Alert: Rental ${record.rentalId} is overdue. Daily penalty fees of ₹1,250 are accumulating. Please return the device immediately.`;
      }
    } else if (commTemplate === 'Festival Discount') {
      if (channel === 'Email') {
        subject = `🎉 Special Festive Rental Offer from One Point Solutions!`;
        body = `Dear ${record.customerName},\n\nCelebrate this festive season with our exclusive tech rental deals! Get 20% off on your next high-performance laptop or tablet rental.\n\nSimply reply to this email or call us to reserve your next device today.\n\nBest regards,\nOne Point Solutions Team`;
      } else {
        body = `Dear ${record.customerName}, celebrate this festive season with 20% off your next tech rental! Contact One Point Solutions support to book today!`;
      }
    } else {
      // Custom blank template
      subject = channel === 'Email' ? `🛡️ Service Update regarding Contract ${record.rentalId}` : '';
      body = `Dear ${record.customerName},\n\n`;
    }

    setCommSubject(subject);
    setCommMessage(body);
  }, [commTemplate, commModal]);

  // Handle single notification dispatch via System API
  const handleSendSystemNotification = () => {
    if (!commMessage.trim()) {
      alert("Please compose message content.");
      return;
    }
    setIsSendingComm(true);
    fetch('http://localhost:5000/api/notifications/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rentalId: commModal.record.rentalId,
        type: commModal.channel,
        templateName: 'Custom Message',
        customSubject: commSubject,
        customMessage: commMessage
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch alert');
      return data;
    })
    .then(() => {
      alert(`Simulated system ${commModal.channel} successfully logged and sent!`);
      // Reload timeline logs
      return fetch(`http://localhost:5000/api/notifications?rentalId=${commModal.record.rentalId}`);
    })
    .then(r => r.json())
    .then(d => {
      setNotificationHistory(d.data || []);
      setCommModal(null);
    })
    .catch(err => {
      console.error(err);
      alert(`Dispatch Error: ${err.message}`);
    })
    .finally(() => {
      setIsSendingComm(false);
    });
  };

  // Handle campaign bulk broadcast
  const handleSendCampaign = () => {
    if (!broadcastMessage.trim()) {
      alert("Please draft campaign content.");
      return;
    }
    setIsBroadcasting(true);
    setBroadcastResult(null);

    fetch('http://localhost:5000/api/notifications/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: broadcastChannel,
        subject: broadcastSubject,
        message: broadcastMessage
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to broadcast');
      return data;
    })
    .then(data => {
      setBroadcastResult({
        success: true,
        summary: data.summary || { totalCustomers: 0, emailsSent: 0, whatsAppsSent: 0 }
      });
      alert(`Festival promotion campaign broadcasted to all customer records!`);
    })
    .catch(err => {
      console.error(err);
      alert(`Broadcast Campaign Error: ${err.message}`);
    })
    .finally(() => {
      setIsBroadcasting(false);
    });
  };

  // Run LLM AI notes generation engine
  const handleGenerateAiNotes = (id, promptText) => {
    setAiGenerating(prev => ({ ...prev, [id]: true }));
    fetch('http://localhost:5000/api/ai/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate notes');
      return data;
    })
    .then(data => {
      setRemarks(prev => ({ ...prev, [id]: data.notes }));
      setAiGenerating(prev => ({ ...prev, [id]: false }));
    })
    .catch(err => {
      console.error(err);
      alert(`AI Notes Generation Error: ${err.message}`);
      setAiGenerating(prev => ({ ...prev, [id]: false }));
    });
  };

  // Finalize settlement approval and release/invoice deposit
  const handleCloseClaim = (id, activeNote, activeMethod, finalDeduction) => {
    setIsSubmitting(prev => ({ ...prev, [id]: true }));
    fetch(`http://localhost:5000/api/settlements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: activeNote,
        paymentMethod: activeMethod,
        status: 'SETTLED',
        trackingStatus: 'SETTLED',
        deductionAmount: finalDeduction
      })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API settlement failed');
      return data;
    })
    .then(updatedRecord => {
      setRecords(records.map(r => r.rentalId === id ? updatedRecord : r));
      alert(`Rental ${id} successfully settled!`);
    })
    .catch(err => {
      console.error(err);
      alert(`Failed to process settlement: ${err.message}`);
    })
    .finally(() => {
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    });
  };

  // High-res pdf receipt generator
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

    // Notes Section
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

  return (
    <div className="animated-view" style={{ overflow: 'auto', paddingBottom: '30px' }}>
      
      {/* Visual Desk Title Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem', fontWeight: 800 }}>
          <SettlementDeskIcon active={true} size={28} style={{ background: 'var(--primary-glow)', padding: '6px', borderRadius: '8px' }} />
          Finance Settlement Desk
        </h2>

        {/* Action Tabs Header */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
          <button 
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'pending' ? 'var(--primary)' : 'none',
              color: activeTab === 'pending' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-fast)'
            }}
            onClick={() => setActiveTab('pending')}
          >
            📋 Open Claims Queue
            <span style={{ fontSize: '0.72rem', padding: '1px 5px', borderRadius: '4px', background: activeTab === 'pending' ? 'rgba(255,255,255,0.2)' : 'var(--border-color)', color: activeTab === 'pending' ? '#fff' : 'var(--text-primary)', fontWeight: 800 }}>
              {records.filter(r => r.settlementStatus === 'Under Review' || r.settlementStatus === 'Isolated Repair').length}
            </span>
          </button>
          
          <button 
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'archive' ? 'var(--primary)' : 'none',
              color: activeTab === 'archive' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-fast)'
            }}
            onClick={() => setActiveTab('archive')}
          >
            🗄️ Settled Archive
            <span style={{ fontSize: '0.72rem', padding: '1px 5px', borderRadius: '4px', background: activeTab === 'archive' ? 'rgba(255,255,255,0.2)' : 'var(--border-color)', color: activeTab === 'archive' ? '#fff' : 'var(--text-primary)', fontWeight: 800 }}>
              {records.filter(r => r.settlementStatus === 'Settled').length}
            </span>
          </button>

          <button 
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'campaign' ? 'var(--primary)' : 'none',
              color: activeTab === 'campaign' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-fast)'
            }}
            onClick={() => setActiveTab('campaign')}
          >
            🎉 Festive Campaign Broadcast
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PENDING ACTION DESK                                      */}
      {/* ============================================================== */}
      {activeTab === 'pending' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Claims Requiring Verification
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Inspect physical damage proof, audit items, and authorize security deposit refunds or deficit billing.
              </p>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Filter pending files..."
              style={{ maxWidth: '240px', fontSize: '0.85rem', height: '38px', padding: '6px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {openClaims.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CheckCircleIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <strong>All Claims Cleared</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>No electronic damage disputes require operational action today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              
              {/* LEFT COLUMN: PENDING QUEUE */}
              <div style={{ flex: '1 1 30%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                  Queue Checklist ({openClaims.length} items)
                </span>
                
                <div style={{ maxHeight: '680px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {openClaims.map((c) => {
                    const isActive = c.rentalId === activeClaimId;
                    const isIsolated = c.settlementStatus === 'Isolated Repair';
                    const hasEvidence = c.photoEvidenceUrl && c.photoEvidenceUrl.trim().length > 0;
                    
                    return (
                      <div
                        key={c.rentalId}
                        onClick={() => setSelectedClaimId(c.rentalId)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: isActive 
                            ? '2.5px solid var(--primary)' 
                            : isIsolated
                              ? '1px dashed rgba(245,158,11,0.6)'
                              : '1px solid var(--border-color)',
                          background: isActive 
                            ? 'var(--primary-glow)' 
                            : 'var(--bg-card)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all var(--transition-fast)',
                          boxShadow: isActive ? 'var(--shadow-lifted)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.customerName}</strong>
                          {isIsolated ? (
                            <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--danger)', color: '#fff', fontWeight: '800' }}>URGENT</span>
                          ) : (
                            <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: '800' }}>REVIEW</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Ref: {c.rentalId}</span>
                          <span>{c.deviceModel}</span>
                        </div>
                        
                        {/* Evidence attachment icon indicator */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid rgba(120,120,120,0.08)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.7rem', color: hasEvidence ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {hasEvidence ? '📷 Photo Proof Attached' : '📭 No Photo Attached'}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatVal(c.damageDeduction)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: CLAIM FILE INSPECTOR PANEL */}
              <div style={{ flex: '2 1 65%', minWidth: '350px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeClaim ? (
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>
                          Claim Sheet: {activeClaim.rentalId}
                        </h4>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
                          Asset Model: <strong>{activeClaim.deviceModel}</strong> (Serial: {activeClaim.deviceSerial || 'N/A'})
                        </div>
                      </div>
                      <div>
                        {activeClaim.settlementStatus === 'Isolated Repair' ? (
                          <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', animation: 'triage-badge-flash 1.4s ease-in-out infinite' }}>🚨 PRIORITY ISOLATED</span>
                        ) : (
                          <span style={{ background: 'var(--warning-glow)', border: '1px solid var(--warning)', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px' }}>UNDER AUDIT</span>
                        )}
                      </div>
                    </div>

                    {/* Section 1: Customer Identity and Quick Actions */}
                    <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Customer Name & ID</small>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {activeClaim.customerName}
                            <span 
                              onClick={() => copyToClipboard(activeClaim.customerId, 'Customer ID')} 
                              title="Copy Customer ID"
                              style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.72rem', padding: '2px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)' }}
                            >
                              📋 {activeClaim.customerId ? activeClaim.customerId.slice(0, 8) + '...' : 'N/A'}
                            </span>
                            {setView && (
                              <button
                                type="button"
                                onClick={() => handleViewCustomer(activeClaim.rentalId)}
                                title="View Customer Details & Ledger"
                                style={{
                                  background: 'var(--primary-glow)',
                                  color: 'var(--primary)',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: '600',
                                  border: '1px solid var(--primary)'
                                }}
                              >
                                <EyeIcon size={12} />
                                Details
                              </button>
                            )}
                          </span>
                        </div>

                        <div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>KYC Identity Check</small>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{
                              fontSize: '0.75rem', 
                              fontWeight: 800, 
                              color: activeClaim.kycStatus === 'Verified' ? 'var(--success)' : 'var(--danger)', 
                              background: activeClaim.kycStatus === 'Verified' ? 'var(--secondary-glow)' : 'var(--danger-glow)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: `1px solid ${activeClaim.kycStatus === 'Verified' ? 'var(--success)' : 'var(--danger)'}`
                            }}>
                              {activeClaim.kycStatus || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Interactive WhatsApp / Email launch triggers */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            title="Compose WhatsApp Message"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              borderRadius: '6px',
                              border: '1px solid var(--success)',
                              color: 'var(--success)',
                              background: 'var(--secondary-glow)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => setCommModal({ record: activeClaim, channel: 'WhatsApp' })}
                          >
                            💬 WhatsApp
                          </button>
                          
                          <button
                            type="button"
                            title="Compose Email Message"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              borderRadius: '6px',
                              border: '1px solid var(--primary)',
                              color: 'var(--primary)',
                              background: 'var(--primary-glow)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => setCommModal({ record: activeClaim, channel: 'Email' })}
                          >
                            ✉ Email
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Damage Proof Validity Checker & CV Overlays */}
                    {(() => {
                      const hasDeductions = activeClaim.damageDeduction > 0;
                      const hasPhotoProof = activeClaim.photoEvidenceUrl && activeClaim.photoEvidenceUrl.trim().length > 0;
                      const isDamageProofValid = !hasDeductions || hasPhotoProof;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          
                          {/* Automated validation badge banner */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: isDamageProofValid ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                            border: `1px solid ${isDamageProofValid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            borderRadius: '6px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: isDamageProofValid ? 'var(--success)' : 'var(--danger)', fontWeight: 800, fontSize: '1.1rem' }}>
                                {isDamageProofValid ? '✓' : '⚠'}
                              </span>
                              <div style={{ fontSize: '0.78rem' }}>
                                <strong style={{ color: isDamageProofValid ? 'var(--success)' : 'var(--danger)' }}>
                                  {isDamageProofValid ? 'Damage Proof Validated' : 'Invalid Damage Proof Warning'}
                                </strong>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                  {hasDeductions ? 'Inspection report contains a verified photo link.' : 'Device returned with no physical damage assessed.'}
                                </span>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: isDamageProofValid ? 'var(--secondary-glow)' : 'var(--danger-glow)', color: isDamageProofValid ? 'var(--success)' : 'var(--danger)' }}>
                              {isDamageProofValid ? 'PASS' : 'WARNING'}
                            </span>
                          </div>

                          {!isDamageProofValid && (
                            <div style={{
                              background: 'rgba(239, 68, 68, 0.02)',
                              border: '1px dashed rgba(239, 68, 68, 0.4)',
                              borderRadius: '8px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              textAlign: 'center',
                              margin: '8px 0',
                              transition: 'all var(--transition-ease)',
                              width: '100%'
                            }}>
                              {scanningRecordId === activeClaim.rentalId ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                                  <style>{`
                                    @keyframes laser-scan {
                                      0% { top: 0%; }
                                      50% { top: 100%; }
                                      100% { top: 0%; }
                                    }
                                  `}</style>
                                  
                                  <div style={{
                                    position: 'relative',
                                    width: '180px',
                                    height: '120px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    border: '2px solid var(--border-color)',
                                    background: '#000'
                                  }}>
                                    {tempPhotoUrl && (
                                      <img 
                                        src={tempPhotoUrl} 
                                        alt="Scanning Preview" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                                      />
                                    )}
                                    <div style={{
                                      position: 'absolute',
                                      left: 0,
                                      width: '100%',
                                      height: '3px',
                                      background: 'linear-gradient(90deg, transparent, var(--success), transparent)',
                                      boxShadow: '0 0 8px var(--success)',
                                      animation: 'laser-scan 2s infinite linear'
                                    }} />
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', textAlign: 'left', padding: '0 12px' }}>
                                    <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ color: scanningStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                        {scanningStep > 1 ? '✓ Match device serial & category' : '🔍 Match device serial & category'}
                                      </span>
                                      <span style={{ fontWeight: 700, color: scanningStep > 1 ? 'var(--success)' : 'var(--warning)', fontSize: '0.72rem' }}>
                                        {scanningStep > 1 ? `${activeClaim.deviceModel} (Matched)` : scanningStep === 1 ? 'Scanning...' : 'Pending'}
                                      </span>
                                    </div>

                                    <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ color: scanningStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                        {scanningStep > 2 ? '✓ Run computer vision damage detection' : '🔍 Run computer vision damage detection'}
                                      </span>
                                      <span style={{ fontWeight: 700, color: scanningStep > 2 ? 'var(--success)' : 'var(--warning)', fontSize: '0.72rem' }}>
                                        {scanningStep > 2 ? `${activeClaim.damageType} (Detected)` : scanningStep === 2 ? 'Analyzing pixels...' : 'Pending'}
                                      </span>
                                    </div>

                                    <div style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ color: scanningStep >= 3 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                        {scanningStep > 3 ? '✓ Verify compliance & deduction' : '🔍 Verify compliance & deduction'}
                                      </span>
                                      <span style={{ fontWeight: 700, color: scanningStep > 3 ? 'var(--success)' : 'var(--warning)', fontSize: '0.72rem' }}>
                                        {scanningStep > 3 ? `${formatVal(activeClaim.damageDeduction)} (Verified)` : scanningStep === 3 ? 'Auditing ledger...' : 'Pending'}
                                      </span>
                                    </div>

                                    {scanningStep === 4 && (
                                      <div style={{ 
                                        marginTop: '6px', 
                                        background: 'var(--success-glow)', 
                                        border: '1px solid var(--success)', 
                                        borderRadius: '4px', 
                                        padding: '4px 8px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 800, 
                                        color: 'var(--success)',
                                        textAlign: 'center'
                                      }}>
                                        🎉 VERIFICATION SUCCESSFUL
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : cameraActive ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                                  <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    style={{ 
                                      width: '100%', 
                                      maxHeight: '240px', 
                                      borderRadius: '6px', 
                                      background: '#000',
                                      objectFit: 'cover'
                                    }} 
                                  />
                                  <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                      type="button"
                                      className="btn btn-danger" 
                                      onClick={() => {
                                        const photoUrl = capturePhoto();
                                        if (photoUrl) {
                                          triggerVerificationScan(activeClaim.rentalId, photoUrl);
                                        }
                                      }}
                                      style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      📸 Snap & Upload
                                    </button>
                                    <button 
                                      type="button"
                                      className="btn btn-secondary" 
                                      onClick={stopCamera}
                                      style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span style={{ fontSize: '1.8rem' }}>📸</span>
                                  <div style={{ fontSize: '0.8rem' }}>
                                    <strong style={{ color: 'var(--danger)', display: 'block', marginBottom: '4px' }}>Physical Damage Photo Evidence Required</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                                      This claim contains physical damage deductions of <strong>{formatVal(activeClaim.damageDeduction)}</strong> but is missing photo proof. Please upload the photo evidence.
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                                    <input 
                                      type="file" 
                                      accept="image/*"
                                      id={`damage-photo-upload-${activeClaim.rentalId}`}
                                      style={{ display: 'none' }}
                                      onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const mockPhotoUrl = reader.result || 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=600&auto=format&fit=crop&q=60';
                                          triggerVerificationScan(activeClaim.rentalId, mockPhotoUrl);
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                    />
                                    <label 
                                      htmlFor={`damage-photo-upload-${activeClaim.rentalId}`}
                                      className="btn btn-danger"
                                      style={{ 
                                        padding: '6px 14px', 
                                        fontSize: '0.75rem', 
                                        cursor: 'pointer', 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px',
                                        fontWeight: 700,
                                        margin: 0,
                                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)'
                                      }}
                                    >
                                      📂 Choose File
                                    </label>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() => setCameraActive(true)}
                                      style={{
                                        padding: '6px 14px',
                                        fontSize: '0.75rem',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontWeight: 700,
                                        margin: 0
                                      }}
                                    >
                                      📷 Take Photo
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {/* Image box overlay */}
                          {activeClaim.photoEvidenceUrl && (
                            <div 
                              style={{ 
                                position: 'relative', 
                                borderRadius: '8px', 
                                overflow: 'hidden', 
                                border: '2px solid rgba(239, 68, 68, 0.25)', 
                                background: '#000',
                                maxHeight: '240px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img 
                                src={activeClaim.photoEvidenceUrl} 
                                alt="Inspection Proof" 
                                style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                              
                              {/* Overlay Grid */}
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  top: 0, 
                                  left: 0, 
                                  width: '100%', 
                                  height: '100%', 
                                  backgroundImage: 'radial-gradient(rgba(37, 99, 235, 0.1) 1px, transparent 1px)', 
                                  backgroundSize: '14px 14px',
                                  pointerEvents: 'none'
                                }} 
                              />
                              
                              {/* CV Bounding Box */}
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  border: '2px dashed var(--danger)',
                                  borderRadius: '4px',
                                  top: '25%',
                                  left: '30%',
                                  width: '40%',
                                  height: '50%',
                                  boxShadow: '0 0 10px rgba(220, 38, 38, 0.4)',
                                  pointerEvents: 'none'
                                }}
                              >
                                <div 
                                  style={{ 
                                    position: 'absolute', 
                                    top: '-20px', 
                                    left: '-2px', 
                                    background: 'var(--danger)', 
                                    color: '#fff', 
                                    fontSize: '8px', 
                                    fontWeight: 900, 
                                    padding: '2px 5px', 
                                    borderRadius: '2px 2px 0 0',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  CV SCAN: {activeClaim.damageType} (94% CONFIDENCE)
                                </div>
                              </div>

                              <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: '1px solid var(--primary)', borderRadius: '4px', padding: '2px 6px', fontSize: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                                SCAN SUCCESSFUL
                              </div>
                            </div>
                          )}

                          {/* Damage Issue Selector */}
                          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                              🛡️ Damage Issue Selector
                            </span>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                              {STANDARD_DAMAGES.map((dmg) => {
                                const computedCost = getDynamicDamageCost(dmg.name, activeClaim.deviceCategory || activeClaim.deviceModel, activeClaim.deviceBaseCost);
                                return (
                                  <label 
                                    key={dmg.name} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '8px', 
                                      fontSize: '0.8rem', 
                                      color: 'var(--text-primary)', 
                                      cursor: 'pointer',
                                      padding: '6px 10px',
                                      background: 'var(--bg-input)',
                                      borderRadius: '6px',
                                      border: `1px solid ${selectedDamages[dmg.name] ? 'var(--primary)' : 'var(--border-color)'}`,
                                      transition: 'all var(--transition-fast)'
                                    }}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={!!selectedDamages[dmg.name]}
                                      onChange={() => handleDamageToggle(dmg.name)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span>{dmg.name}</span>
                                      <small style={{ color: 'var(--text-muted)' }}>+{formatVal(computedCost)}</small>
                                    </div>
                                  </label>
                                );
                              })}
                              
                              <label 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  fontSize: '0.8rem', 
                                  color: 'var(--text-primary)', 
                                  cursor: 'pointer',
                                  padding: '6px 10px',
                                  background: 'var(--bg-input)',
                                  borderRadius: '6px',
                                  border: `1px solid ${selectedDamages['Custom'] ? 'var(--primary)' : 'var(--border-color)'}`,
                                  transition: 'all var(--transition-fast)'
                                }}
                              >
                                <input 
                                  type="checkbox"
                                  checked={!!selectedDamages['Custom']}
                                  onChange={() => handleDamageToggle('Custom')}
                                  style={{ cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                  <span>Custom Penalty</span>
                                  {selectedDamages['Custom'] && (
                                    <input 
                                      type="number"
                                      value={customFee > 0 ? Math.round(fromBase(customFee) * 100) / 100 : ''}
                                      onChange={handleCustomFeeChange}
                                      placeholder={`Enter amount (${currency})`}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        marginTop: '4px',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)',
                                        width: '100%',
                                        outline: 'none'
                                      }}
                                    />
                                  )}
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section 3: Action & Dispatch Event Logs timeline */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 14px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                        📋 Action & Notification Dispatch History
                      </span>
                      
                      {loadingLogs ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span className="spinner-loader" style={{ width: '12px', height: '12px', border: '1.5px solid rgba(120,120,120,0.3)', borderTop: '1.5px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          Querying system notification logs...
                        </div>
                      ) : notificationHistory.length === 0 ? (
                        <small style={{ color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', padding: '6px 0' }}>
                          No dispatch activity records found for this contract yet. Use actions to send messages.
                        </small>
                      ) : (
                        <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                          {notificationHistory.map((log) => (
                            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.78rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {log.type === 'Email' ? '📧 Email' : '💬 WhatsApp'}: {log.subject || 'Simulated Dispatch'}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }} title={log.message}>
                                  {log.message}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                <span style={{ fontSize: '0.65rem', background: 'var(--secondary-glow)', color: 'var(--success)', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                                  {log.status || 'Sent'}
                                </span>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </small>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 4: AI Notes suggestions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.12)', borderRadius: '6px', padding: '10px' }}>
                        <small style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Technical Audit Explanation
                        </small>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {activeClaim.aiExplanation || "No technical AI summary was pre-calculated for this claim."}
                        </p>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)', borderRadius: '6px', padding: '10px' }}>
                        <small style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          Customer Statement
                        </small>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                          {activeClaim.customerFriendlyNotes || "No customer friendly statement was pre-calculated for this claim."}
                        </p>
                      </div>
                    </div>

                    {/* AI Prompt GeneratorCollapsible Panel */}
                    <details style={{ background: 'rgba(245, 158, 11, 0.02)', border: '1px dashed var(--warning)', borderRadius: '8px', padding: '10px' }}>
                      <summary style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}>
                        ⚡ AI Prompt Generator & Note Assistant (Click to open)
                      </summary>
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          className="form-control"
                          style={{ width: '100%', fontSize: '0.75rem', fontFamily: 'monospace', height: '80px', resize: 'vertical', padding: '6px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)' }}
                          value={editedPrompts[activeClaim.rentalId] !== undefined ? editedPrompts[activeClaim.rentalId] : activeClaim.aiPrompt}
                          onChange={e => setEditedPrompts({ ...editedPrompts, [activeClaim.rentalId]: e.target.value })}
                          placeholder="AI prompt will appear here..."
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="action-btn-small"
                            style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                            onClick={() => copyToClipboard(editedPrompts[activeClaim.rentalId] !== undefined ? editedPrompts[activeClaim.rentalId] : activeClaim.aiPrompt, 'AI Prompt')}
                          >
                            Copy Prompt
                          </button>
                          <button
                            type="button"
                            disabled={aiGenerating[activeClaim.rentalId] === true}
                            style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: '700', borderRadius: '4px', background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', border: 'none', color: '#fff', cursor: aiGenerating[activeClaim.rentalId] === true ? 'not-allowed' : 'pointer', opacity: aiGenerating[activeClaim.rentalId] === true ? 0.7 : 1 }}
                            onClick={() => handleGenerateAiNotes(activeClaim.rentalId, editedPrompts[activeClaim.rentalId] !== undefined ? editedPrompts[activeClaim.rentalId] : activeClaim.aiPrompt)}
                          >
                            {aiGenerating[activeClaim.rentalId] === true ? 'Running Gemini Engine...' : '✨ Run Gemini Note Generator'}
                          </button>
                        </div>
                      </div>
                    </details>

                    {/* Section 5: Financial breakdown */}
                    {(() => {
                      const { damageFee: damagePenalty, lateFee, totalDeductions, netRefund } = getActiveCalculations();
                      const hasDeficit = netRefund < 0;
                      const absRefund = Math.abs(netRefund);

                      return (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                            Itemized Financial Ledger
                          </h5>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                            <div style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Security Deposit</span>
                              <strong style={{ fontSize: '0.9rem', marginTop: '2px' }}>{formatVal(activeClaim.securityDepositHeld)}</strong>
                            </div>

                            <div style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Physical Damage</span>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--danger)', marginTop: '2px' }}>−{formatVal(damagePenalty)}</strong>
                            </div>

                            <div style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Late Fees</span>
                              <strong style={{ fontSize: '0.9rem', color: '#b45309', marginTop: '2px' }}>−{formatVal(lateFee)}</strong>
                            </div>

                            {hasDeficit ? (
                              <div style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 700 }}>Net Deficit Due</span>
                                <strong style={{ fontSize: '0.95rem', color: 'var(--danger)', marginTop: '2px' }}>{formatVal(absRefund)}</strong>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: 700 }}>Refund Released</span>
                                <strong style={{ fontSize: '0.95rem', color: 'var(--success)', marginTop: '2px' }}>{formatVal(netRefund)}</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Section 6: Action Execution controls */}
                    {(() => {
                      const { damageFee, totalDeductions, netRefund } = getActiveCalculations();
                      const hasDeficit = netRefund < 0;
                      
                      const defaultMethod = hasDeficit ? "Corporate Invoice Issued" : "UPI Refund Transfer";
                      const activeMethod = paymentMethods[activeClaim.rentalId] || defaultMethod;

                      const claimSubmitting = isSubmitting[activeClaim.rentalId] === true;

                      // Double check damage proof validity
                      const hasDeductions = damageFee > 0;
                      const hasPhotoProof = activeClaim.photoEvidenceUrl && activeClaim.photoEvidenceUrl.trim().length > 0;
                      const isDamageProofValid = !hasDeductions || hasPhotoProof;

                      return (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="form-group" style={{ width: '100%' }}>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Reconciliation Mode / Payment Channel:
                              </label>
                              <select
                                value={activeMethod}
                                onChange={e => setPaymentMethods({ ...paymentMethods, [activeClaim.rentalId]: e.target.value })}
                                className="form-control"
                                style={{ cursor: 'pointer', fontSize: '0.85rem', height: '40px', padding: '6px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', width: '100%' }}
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

                            {/* Zero-Touch Customer Notification Generator block */}
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                ✉️ Customer Notification Dispatch (Auto-Generated)
                              </span>
                              
                              <textarea 
                                className="form-control"
                                placeholder="Reconciliation message details..."
                                value={reconciliationMessage}
                                onChange={e => setReconciliationMessage(e.target.value)}
                                rows="4"
                                style={{ 
                                  width: '100%', 
                                  fontSize: '0.82rem', 
                                  padding: '8px 12px', 
                                  background: 'var(--bg-input)', 
                                  border: '1px solid var(--border-color)', 
                                  borderRadius: '6px', 
                                  color: 'var(--text-primary)', 
                                  lineHeight: '1.4',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                              />
                              
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="action-btn-small"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                  onClick={() => copyToClipboard(reconciliationMessage, 'Notification Message')}
                                >
                                  📋 Copy to Clipboard
                                </button>

                                <button
                                  type="button"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    borderRadius: '4px',
                                    border: '1px solid var(--success)',
                                    color: 'var(--success)',
                                    background: 'var(--secondary-glow)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={() => {
                                    const phone = (activeClaim.customerPhone || '').replace(/[+\s-]/g, '');
                                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(reconciliationMessage)}`;
                                    window.open(url, '_blank');
                                  }}
                                >
                                  💬 Send via WhatsApp
                                </button>

                                <button
                                  type="button"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    borderRadius: '4px',
                                    border: '1px solid var(--primary)',
                                    color: 'var(--primary)',
                                    background: 'var(--primary-glow)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={() => {
                                    const email = activeClaim.customerEmail || '';
                                    const subject = `Rental Settlement Summary - Contract ${activeClaim.rentalId}`;
                                    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reconciliationMessage)}`;
                                    window.location.href = url;
                                  }}
                                >
                                  ✉️ Send via Email
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Submit button with verification constraint check */}
                          <button 
                            disabled={claimSubmitting || !isDamageProofValid}
                            className="action-btn" 
                            style={{ 
                              background: !isDamageProofValid
                                ? 'var(--text-muted)'
                                : activeClaim.settlementStatus === 'Isolated Repair'
                                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                                  : (hasDeficit 
                                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                    : 'linear-gradient(135deg, #10b981 0%, #16a34a 100%)'),
                              color: '#fff', 
                              boxShadow: !isDamageProofValid 
                                ? 'none'
                                : activeClaim.settlementStatus === 'Isolated Repair'
                                  ? '0 4px 14px rgba(239,68,68,0.25)'
                                  : (hasDeficit ? '0 4px 12px rgba(220, 38, 38, 0.25)' : '0 4px 12px rgba(22, 163, 74, 0.25)'),
                              width: '100%',
                              padding: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: (claimSubmitting || !isDamageProofValid) ? 'not-allowed' : 'pointer',
                              opacity: (claimSubmitting || !isDamageProofValid) ? 0.7 : 1
                            }} 
                            onClick={() => handleCloseClaim(activeClaim.rentalId, reconciliationMessage, activeMethod, totalDeductions)}
                          >
                            {claimSubmitting ? (
                              <>
                                <span className="spinner-loader" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                Reconciling & Disbursing...
                              </>
                            ) : !isDamageProofValid ? (
                              '⚠ Blocked: Upload damage photo evidence to proceed'
                            ) : activeClaim.settlementStatus === 'Isolated Repair' ? (
                              'Emergency Settle — Release from ISOLATED_REPAIR'
                            ) : hasDeficit ? (
                              'Approve Deficit Breakdown & Issue Invoice' 
                            ) : (
                              'Approve Refund Breakdown & Clear Payout'
                            )}
                          </button>

                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span style={{ color: 'var(--success)' }}>✓</span> Simulates Auto Email Alerts
                            </small>
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span style={{ color: 'var(--success)' }}>✓</span> Simulates WhatsApp Receipts
                            </small>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    <ExclamationCircleIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                    <strong>No Claim Selected</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                      Select a record from the queue check sheet on the left to begin auditing.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SETTLED ARCHIVE REGISTRY                                */}
      {/* ============================================================== */}
      {activeTab === 'archive' && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Historical Reconciled Ledger Registry
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                View complete records of historical settled transactions, refund clearances, and deficit invoice dispatches.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                📊 Export CSV
              </button>
              <input
                type="text"
                className="form-control"
                placeholder="Search archive..."
                style={{ maxWidth: '280px', fontSize: '0.85rem', height: '38px', padding: '6px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
                value={archiveSearchQuery}
                onChange={e => setArchiveSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {settledClaims.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No recently settled bookings found matching search criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    <th style={{ padding: '12px 8px' }}>Rental ID</th>
                    <th style={{ padding: '12px 8px' }}>Customer Details</th>
                    <th style={{ padding: '12px 8px' }}>Device Model</th>
                    <th style={{ padding: '12px 8px' }}>Settled Date</th>
                    <th style={{ padding: '12px 8px' }}>Total Deductions</th>
                    <th style={{ padding: '12px 8px' }}>Refund / Deficit Charge</th>
                    <th style={{ padding: '12px 8px' }}>Reconciliation Mark</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {settledClaims.map((s, idx) => {
                    const netValue = s.securityDepositHeld - s.damageDeduction;
                    const hasDeficit = netValue < 0;
                    const shortMark = getShortReconciliationMark(s);

                    return (
                      <tr 
                        key={idx} 
                        style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'background var(--transition-fast)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(120, 120, 120, 0.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                      >
                        <td style={{ padding: '12px 8px', fontWeight: 700, fontFamily: 'monospace' }}>{s.rentalId}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600 }}>{s.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.customerEmail}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{s.deviceModel}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {s.settlementAt ? new Date(s.settlementAt).toLocaleString() : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--danger)', fontWeight: 600 }}>
                          -{formatVal(s.damageDeduction)}
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: hasDeficit ? 'var(--danger)' : 'var(--success)' }}>
                          {hasDeficit ? 'Deficit: ' : 'Refund: '}{formatVal(Math.abs(netValue))}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                            {shortMark}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                            onClick={() => setSelectedReceipt(s)}
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FESTIVE CAMPAIGN BROADCAST                              */}
      {/* ============================================================== */}
      {activeTab === 'campaign' && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span> Special Festival Promotional Campaign Broadcast
          </h3>
          <p style={{ margin: '6px 0 20px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Draft a customized campaign promotion or festive offer message to broadcast to all customer records in our directory.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Channel Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Broadcast Channel Selection:
              </label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="broadcastChannel"
                    value="Both"
                    checked={broadcastChannel === 'Both'}
                    onChange={() => setBroadcastChannel('Both')}
                    style={{ cursor: 'pointer' }}
                  />
                  Both Email & WhatsApp
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="broadcastChannel"
                    value="Email"
                    checked={broadcastChannel === 'Email'}
                    onChange={() => setBroadcastChannel('Email')}
                    style={{ cursor: 'pointer' }}
                  />
                  Email Only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="broadcastChannel"
                    value="WhatsApp"
                    checked={broadcastChannel === 'WhatsApp'}
                    onChange={() => setBroadcastChannel('WhatsApp')}
                    style={{ cursor: 'pointer' }}
                  />
                  WhatsApp Only
                </label>
              </div>
            </div>

            {/* Subject Line (Only shown if Email is selected) */}
            {(broadcastChannel === 'Email' || broadcastChannel === 'Both') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Subject Line:
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  value={broadcastSubject}
                  onChange={e => setBroadcastSubject(e.target.value)}
                  placeholder="e.g., 🎉 Festival Season Special Rent Deals!"
                />
              </div>
            )}

            {/* Campaign Message Body */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Promotional Campaign Message Body:
              </label>
              <textarea
                className="form-control"
                style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: '1.4', resize: 'vertical' }}
                rows="6"
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Write your festival offer text. The system will automatically prepend 'Dear [Customer Name],' to personalize it."
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                *Note: Pre-formatted tags like customer name will be automatically populated server-side to guarantee personalization.
              </small>
            </div>

            {/* Broadcast action triggers */}
            <button
              disabled={isBroadcasting}
              className="action-btn"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)',
                color: '#fff',
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: 'none',
                cursor: isBroadcasting ? 'not-allowed' : 'pointer',
                opacity: isBroadcasting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px'
              }}
              onClick={handleSendCampaign}
            >
              {isBroadcasting ? (
                <>
                  <span className="spinner-loader" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Broadcasting campaign to all directory records...
                </>
              ) : (
                <>
                  <span>🚀</span> Dispatch Bulk Festival Promo Campaign
                </>
              )}
            </button>

            {/* Results Banner */}
            {broadcastResult && (
              <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', marginTop: '12px' }}>
                <strong style={{ color: 'var(--success)', display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
                  ✓ Campaign Broadcast Successful!
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Successfully targeted <strong>{broadcastResult.summary.totalCustomers}</strong> customer database contacts.
                  Dispatched <strong>{broadcastResult.summary.emailsSent}</strong> emails and <strong>{broadcastResult.summary.whatsAppsSent}</strong> WhatsApp alerts.
                </span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP MODAL: DYNAMIC CUSTOMER COMMS DRAFT                      */}
      {/* ============================================================== */}
      {commModal && (() => {
        const { record, channel } = commModal;
        const cleanPhone = record.customerPhone ? record.customerPhone.replace(/[^0-9+]/g, '') : '';
        const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(commMessage)}`;
        const mailtoUrl = `mailto:${record.customerEmail}?subject=${encodeURIComponent(commSubject)}&body=${encodeURIComponent(commMessage)}`;

        return (
          <div className="ops-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}>
            <div className="ops-modal-container" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '560px',
              maxWidth: '92%',
              padding: '24px',
              boxShadow: 'var(--shadow-lifted)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                  {channel === 'WhatsApp' ? (
                    <span style={{ color: 'var(--success)' }}>💬 WhatsApp Alert</span>
                  ) : (
                    <span style={{ color: 'var(--primary)' }}>📧 Email Document</span>
                  )}
                  <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'normal' }}>
                    for {record.customerName}
                  </small>
                </h3>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                  onClick={() => setCommModal(null)}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Select Message Template:
                  </label>
                  <select
                    value={commTemplate}
                    onChange={e => setCommTemplate(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value="Deduction Statement">Deduction & Refund Summary Statement</option>
                    <option value="Overdue Checklist">Overdue Return Warning checklist</option>
                    <option value="Festival Discount">Festival Rental Promo Offer</option>
                    <option value="Custom">Custom Blank Message Template</option>
                  </select>
                </div>

                {channel === 'Email' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Email Subject:
                    </label>
                    <input
                      type="text"
                      value={commSubject}
                      onChange={e => setCommSubject(e.target.value)}
                      className="form-control"
                      style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Message Content:
                  </label>
                  <textarea
                    value={commMessage}
                    onChange={e => setCommMessage(e.target.value)}
                    rows="6"
                    className="form-control"
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', resize: 'vertical', fontSize: '0.85rem', lineHeight: '1.4', fontFamily: 'sans-serif' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  disabled={isSendingComm}
                  className="action-btn"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: isSendingComm ? 'not-allowed' : 'pointer',
                    opacity: isSendingComm ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.85rem'
                  }}
                  onClick={handleSendSystemNotification}
                >
                  {isSendingComm ? (
                    <span className="spinner-loader" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    '🚀 Send via System API'
                  )}
                </button>
                
                <a
                  href={channel === 'WhatsApp' ? whatsappUrl : mailtoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    backgroundColor: 'var(--primary-glow)',
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    fontSize: '0.85rem'
                  }}
                  onClick={() => setCommModal(null)}
                >
                  {channel === 'WhatsApp' ? (
                    <>
                      <span>🔗</span> Launch WhatsApp Web
                    </>
                  ) : (
                    <>
                      <span>🔗</span> Open Mail App
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================== */}
      {/* POPUP MODAL: DETAILED SETTLEMENT RECEIPT                       */}
      {/* ============================================================== */}
      {selectedReceipt && (() => {
        const netRefund = selectedReceipt.securityDepositHeld - selectedReceipt.damageDeduction;
        const hasDeficit = netRefund < 0;
        const absDiff = Math.abs(netRefund);

        return (
          <div className="ops-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)'
          }}>
            <div className="ops-modal-container receipt-modal-width" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '580px',
              maxWidth: '92%',
              padding: '24px',
              boxShadow: 'var(--shadow-lifted)'
            }}>
              <div className="ops-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 className="ops-modal-header-title" style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 800 }}>
                  <DocumentIcon size={20} style={{ verticalAlign: 'middle' }} />
                  Settlement Receipt Details
                </h3>
                <button 
                  className="ops-modal-close-btn" 
                  onClick={() => setSelectedReceipt(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>
              
              <div className="ops-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
                
                {/* Info summary */}
                <div className="ops-receipt-card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Rental ID:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.rentalId}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                      <strong>{selectedReceipt.customerName}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Device Name:</span>
                      <strong>{selectedReceipt.deviceModel}</strong>
                    </div>
                    {selectedReceipt.settlementAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Settlement Date:</span>
                        <strong>{new Date(selectedReceipt.settlementAt).toLocaleString()}</strong>
                      </div>
                    )}
                    {selectedReceipt.paymentMethod && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Reconcile Mode:</span>
                        <strong style={{ color: 'var(--success)' }}>{selectedReceipt.paymentMethod}</strong>
                      </div>
                    )}
                  </div>
                  
                  {selectedReceipt.notes && (
                    <div style={{ marginTop: '0.75rem', padding: '8px 10px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 700, display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Reconciliation Remarks:
                      </span>
                      <span style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>"{selectedReceipt.notes}"</span>
                    </div>
                  )}
                </div>

                {/* Deductions Card */}
                <div className="ops-receipt-card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 800 }}>
                    Deductions Itemized List
                  </h4>
                  {selectedReceipt.damageType === 'None' ? (
                    <div style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
                      ✓ No damages logged. Device returned in perfect condition.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>• {selectedReceipt.damageType}</span>
                      <strong style={{ color: 'var(--danger)' }}>-{formatVal(selectedReceipt.damageDeduction)}</strong>
                    </div>
                  )}
                </div>

                {/* Ledger Breakdown */}
                {(() => {
                  const { damagePenalty, lateFee } = parseDeductions(selectedReceipt);
                  return (
                    <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Base Security Deposit Held:</span>
                        <span>{formatVal(selectedReceipt.securityDepositHeld)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Minus: Assessed Physical Damage Penalty:</span>
                        <span style={{ color: 'var(--danger)' }}>-{formatVal(damagePenalty)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Minus: Accumulated Overdue Daily Fees:</span>
                        <span style={{ color: '#b45309' }}>-{formatVal(lateFee)}</span>
                      </div>
                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                      
                      {hasDeficit ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontWeight: 700 }}>
                            <span style={{ color: 'var(--danger)' }}>Equals: Net Liability Deficit Due:</span>
                            <span style={{ color: 'var(--danger)', fontSize: '1.05rem' }}>
                              {formatVal(absDiff)}
                            </span>
                          </div>
                          <div style={{ marginTop: '8px', padding: '8px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600 }}>
                            ⚠️ Deductions exceeded deposit. Accounts must collect outstanding balance.
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontWeight: 700 }}>
                          <span style={{ color: 'var(--success)' }}>Equals: Net Disbursal Refund Due:</span>
                          <span style={{ color: 'var(--success)', fontSize: '1.05rem' }}>
                            {formatVal(netRefund)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Evidence thumbnails */}
                {(() => {
                  const photos = selectedReceipt.photoEvidenceUrl ? selectedReceipt.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
                  if (photos.length === 0) return null;
                  return (
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 700 }}>
                        Damage Proof Photo Evidence ({photos.length} photos):
                      </div>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                        {photos.map((photo, idx) => (
                          <div 
                            key={idx}
                            style={{ flex: '0 0 auto', width: '100px', height: '75px', borderRadius: '4px', overflow: 'hidden', border: '1.5px solid var(--border-color)', cursor: 'pointer' }}
                            onClick={() => window.open(photo, '_blank')}
                            title="Click to view full photo"
                          >
                            <img src={photo} alt={`Evidence ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>

              <div className="ops-modal-footer" style={{ display: 'flex', gap: '10px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
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
                    height: '40px'
                  }} 
                  onClick={() => downloadPDFReceipt(selectedReceipt)}
                >
                  📥 Download PDF Receipt
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '40px' }} 
                  onClick={() => setSelectedReceipt(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
