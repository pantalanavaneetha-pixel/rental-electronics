import React, { useState, useEffect } from 'react';

// ─── Module-level constants (defined once, stable across re-renders) ───────────
// The canonical damage type key that triggers the ISOLATED_REPAIR emergency protocol
const WATER_DAMAGE_KEY = 'Water Damage / Fluid Intrusion';

import {
  ReturnDeskIcon,
  FastTrackIcon,
  ShieldCheckIcon,
  PhoneCrackIcon,
  PhoneScratchesIcon,
  PhoneDropletIcon,
  PortDamageIcon,
  MissingAccessoriesIcon,
  PowerFailureIcon,
  CustomDeductionIcon,
  WarningTriangleIcon,
  ShieldAlertIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CameraIcon,
  FolderIcon,
  UploadIcon,
  LinkIcon,
  CardReceiptIcon,
  LightbulbIcon,
  AiCoreIcon
} from '../components/PremiumIcons';

export default function ReturnForm({ onSubmit, records, currency, currencyConfig, formatVal, fromBase, toBase, setView, userRole }) {
  // Local form state
  const [form, setForm] = useState({
    rentalId: '',
    customerName: '',
    deviceModel: '',
    securityDepositHeld: 25000, // Stored in Base INR
    damageType: 'None',
    damageDeduction: 0,
    photoEvidenceUrl: ''
  });

  const [selectedDamages, setSelectedDamages] = useState({});
  const [activeRecordHelper, setActiveRecordHelper] = useState('');
  
  // Custom damage state inputs
  const [customDamageDesc, setCustomDamageDesc] = useState('');
  const [customDamageCost, setCustomDamageCost] = useState('');

  // Camera and Photo Upload modes state
  const [photoMode, setPhotoMode] = useState('camera'); // 'camera', 'upload', 'url'
  const [videoStream, setVideoStream] = useState(null);

  // Late returns ledger modifier state
  const [daysOverdue, setDaysOverdue] = useState(0);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [photoEvidenceUrls, setPhotoEvidenceUrls] = useState([]);
  const [imageVerifications, setImageVerifications] = useState({});

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Emergency Triage State ───────────────────────────────────────────────
  // Tracks whether the current damage selection triggers an urgent safety flag
  const [flaggedForUrgentTriage, setFlaggedForUrgentTriage] = useState(false);

  // ─── AI Screen Crack & Damage Assessment Simulator State ──────────────────
  const [aiState, setAiState] = useState({
    status: 'idle', // 'idle' | 'analyzing' | 'success' | 'mismatch'
    message: '',
    analyzedImage: ''
  });
  const [aiSimulationMode, setAiSimulationMode] = useState('auto'); // 'auto' | 'force-success' | 'force-mismatch'

  // Helper to add an image with 'success' status instantly
  const addImageWithVerification = (url) => {
    setPhotoEvidenceUrls(prev => [...prev, url]);
    setImageVerifications(prev => ({ ...prev, [url]: { status: 'success', message: 'Visual Evidence Attached' } }));
  };

  // Real-time liquid exposure keyword detector for manual description input
  useEffect(() => {
    const liquidFailed = !!selectedDamages['Water Damage / Fluid Intrusion'];
    
    if (liquidFailed) {
      setFlaggedForUrgentTriage(true);
    } else {
      const descLower = customDamageDesc.toLowerCase();
      const containsLiquidKeywords = descLower.includes('water') || descLower.includes('liquid') || descLower.includes('fluid') || descLower.includes('moisture') || descLower.includes('spill');
      setFlaggedForUrgentTriage(containsLiquidKeywords);
    }
  }, [customDamageDesc, selectedDamages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const submitBtn = document.querySelector('form button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          e.preventDefault();
          submitBtn.click();
        }
      }

      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (setView) {
          setView(userRole === 'Service Technician' ? 'assets' : 'dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setView, userRole]);

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  const startCamera = async () => {
    setIsCameraLoading(true);
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      setVideoStream(stream);
      setTimeout(() => {
        const videoEl = document.getElementById('webcam-video');
        if (videoEl) {
          videoEl.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setCameraError('Could not access camera. Please check permissions or try the "File Upload" tab.');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const uploadPhotoToServer = async (base64Data) => {
    setIsUploadingPhoto(true);
    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Data })
      });
      const data = await response.json();
      if (data.success && data.url) {
        addImageWithVerification(data.url);
        return data.url;
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photo to server. Make sure the backend server is running.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const capturePhoto = () => {
    const videoEl = document.getElementById('webcam-video');
    if (videoEl && videoStream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      uploadPhotoToServer(dataUrl);
      
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          uploadPhotoToServer(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Warning: Please upload a valid image file (PNG, JPG, or JPEG).");
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          uploadPhotoToServer(event.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Warning: Please drop a valid image file (PNG, JPG, or JPEG).");
      }
    }
  };

  const getDynamicDamageCost = (damageName, category, depositHeld) => {
    const deposit = parseFloat(depositHeld) || 0;
    const cat = (category || '').toLowerCase();
    const dmg = (damageName || '').toLowerCase();

    if (deposit <= 0) {
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
      if (group === 'laptop') return Math.round(deposit * 0.50);
      if (group === 'camera') return Math.round(deposit * 0.50);
      if (group === 'tablet') return Math.round(deposit * 0.40);
      if (group === 'phone') return Math.round(deposit * 0.30);
      return Math.round(deposit * 0.40);
    }

    if (dmg.includes('dent') || dmg.includes('scratch')) {
      if (group === 'laptop') return Math.round(deposit * 0.15);
      if (group === 'camera') return Math.round(deposit * 0.15);
      if (group === 'tablet') return Math.round(deposit * 0.12);
      if (group === 'phone') return Math.round(deposit * 0.10);
      return Math.round(deposit * 0.12);
    }

    if (dmg.includes('water') || dmg.includes('fluid')) {
      return Math.round(deposit * 1.00);
    }

    if (dmg.includes('port') || dmg.includes('charging')) {
      if (group === 'laptop') return Math.round(deposit * 0.25);
      if (group === 'camera') return Math.round(deposit * 0.25);
      if (group === 'tablet') return Math.round(deposit * 0.20);
      if (group === 'phone') return Math.round(deposit * 0.15);
      return Math.round(deposit * 0.20);
    }

    if (dmg.includes('power') || dmg.includes('defect') || dmg.includes('hardware')) {
      if (group === 'laptop') return Math.round(deposit * 0.60);
      if (group === 'camera') return Math.round(deposit * 0.60);
      if (group === 'tablet') return Math.round(deposit * 0.50);
      if (group === 'phone') return Math.round(deposit * 0.40);
      return Math.round(deposit * 0.50);
    }

    if (dmg.includes('accessories') || dmg.includes('charger') || dmg.includes('cable')) {
      if (group === 'laptop') return Math.round(deposit * 0.12);
      if (group === 'camera') return Math.round(deposit * 0.12);
      if (group === 'tablet') return Math.round(deposit * 0.10);
      if (group === 'phone') return Math.round(deposit * 0.08);
      return Math.round(deposit * 0.10);
    }

    return 0;
  };

  // Fixed damage classification matrix in base INR (converted from USD)
  const matrixInInr = {
    'None': 0,
    'Cracked Screen': 10000,
    'Body Dents': 3750,
    'Water Damage / Fluid Intrusion': 20833,
    'Custom': 0
  };

  // Synchronize with URL helper param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const matchedRecord = records.find(r => r.rentalId === paramId && r.settlementStatus === 'Held');
    
    if (matchedRecord) {
      setForm({
        rentalId: matchedRecord.rentalId,
        customerName: matchedRecord.customerName,
        deviceModel: matchedRecord.deviceModel,
        securityDepositHeld: matchedRecord.securityDepositHeld,
        damageType: 'None',
        damageDeduction: 0,
        photoEvidenceUrl: matchedRecord.photoEvidenceUrl || ''
      });
      setActiveRecordHelper(matchedRecord.rentalId);
      setDaysOverdue(0);
      setFlaggedForUrgentTriage(false); // Reset triage on new record load
      setSelectedDamages({});
      
      const matchedPhotos = matchedRecord.photoEvidenceUrl ? matchedRecord.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
      setPhotoEvidenceUrls(matchedPhotos);
      const initialVerifs = {};
      matchedPhotos.forEach(url => {
        initialVerifs[url] = { status: 'success', message: 'Verified Evidence' };
      });
      setImageVerifications(initialVerifs);
    }
  }, [records]);

  // Real-time lookup helper to autofill customer details if Booking ID matches active rental
  useEffect(() => {
    if (form.rentalId.trim()) {
      const matched = records.find(r => r.rentalId.trim().toLowerCase() === form.rentalId.trim().toLowerCase());
      if (matched && matched.settlementStatus === 'Held') {
        setForm(prev => {
          if (
            prev.customerName !== matched.customerName ||
            prev.deviceModel !== matched.deviceModel ||
            prev.securityDepositHeld !== matched.securityDepositHeld
          ) {
            return {
              ...prev,
              customerName: matched.customerName,
              deviceModel: matched.deviceModel,
              securityDepositHeld: matched.securityDepositHeld
            };
          }
          return prev;
        });
        setActiveRecordHelper(matched.rentalId);
      }
    }
  }, [form.rentalId, records]);

  const handleHelperSelect = (record) => {
    setForm({
      rentalId: record.rentalId,
      customerName: record.customerName,
      deviceModel: record.deviceModel,
      securityDepositHeld: record.securityDepositHeld,
      damageType: 'None',
      damageDeduction: 0,
      photoEvidenceUrl: record.photoEvidenceUrl || ''
    });
    setActiveRecordHelper(record.rentalId);
    setCustomDamageDesc('');
    setCustomDamageCost('');
    setDaysOverdue(0);
    setFlaggedForUrgentTriage(false); // Always reset triage when switching records
    setSelectedDamages({});
    
    const matchedPhotos = record.photoEvidenceUrl ? record.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
    setPhotoEvidenceUrls(matchedPhotos);
    const initialVerifs = {};
    matchedPhotos.forEach(url => {
      initialVerifs[url] = { status: 'success', message: 'Verified Evidence' };
    });
    setImageVerifications(initialVerifs);
  };

  const handleDamageToggle = (type) => {
    if (type === 'None') {
      setSelectedDamages({});
      setForm(prev => ({ ...prev, damageType: 'None', damageDeduction: 0 }));
      setFlaggedForUrgentTriage(false);
      return;
    }

    const activeRecord = records.find(r => r.rentalId === activeRecordHelper);
    const category = activeRecord ? (activeRecord.deviceCategory || activeRecord.deviceModel || '') : '';
    const securityDepositHeld = activeRecord ? (activeRecord.securityDepositHeld || 0) : 0;

    setSelectedDamages(prev => {
      const next = { ...prev };
      if (next[type]) {
        delete next[type];
      } else {
        let cost = 0;
        if (type === 'Custom') {
          cost = toBase(parseFloat(customDamageCost) || 0, currency);
        } else {
          cost = getDynamicDamageCost(type, category, securityDepositHeld);
        }
        
        next[type] = { type, cost, multiplier: 1.0 };
      }

      const keys = Object.keys(next);
      if (keys.length === 0) {
        setForm(f => ({ ...f, damageType: 'None', damageDeduction: 0 }));
      } else {
        const mainType = keys[0];
        const sumDeduction = keys.reduce((sum, k) => sum + next[k].cost, 0);
        setForm(f => ({ ...f, damageType: mainType, damageDeduction: sumDeduction }));
      }

      setFlaggedForUrgentTriage(!!next['Water Damage / Fluid Intrusion']);
      return next;
    });
  };

  const handleDamage = (type) => {
    handleDamageToggle(type);
  };

  const handleCustomCostChange = (val) => {
    setCustomDamageCost(val);
    const num = parseFloat(val) || 0;
    const baseVal = toBase(num, currency);
    
    setSelectedDamages(prev => {
      const next = { ...prev };
      next['Custom'] = { type: 'Custom', cost: baseVal, multiplier: 1.0 };
      
      const keys = Object.keys(next);
      const sumDeduction = keys.reduce((sum, k) => sum + next[k].cost, 0);
      setForm(f => ({ ...f, damageDeduction: sumDeduction }));
      return next;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const activeDamageKeys = Object.keys(selectedDamages).filter(k => k !== 'None');
    const hasPhysicalDamageSelection = activeDamageKeys.length > 0;
    const hasPhotoEvidence = photoEvidenceUrls.length > 0 && photoEvidenceUrls.some(url => url.trim().startsWith('http') || url.trim().startsWith('data:image'));

    if (hasPhysicalDamageSelection && !hasPhotoEvidence) {
      alert("Validation Error: A damage report requires uploading at least one photo evidence image.");
      return;
    }

    if (hasPhysicalDamageSelection && hasMismatchOrScanning) {
      alert("Validation Error: The uploaded damage proof image must be successfully verified by the AI Core before submission.");
      return;
    }

    const damagesPayload = Object.values(selectedDamages).map(item => ({
      type: item.type === 'Custom' ? (customDamageDesc.trim() || 'Custom Damage') : item.type,
      cost: item.cost,
      multiplier: item.multiplier || 1.0
    }));

    if (daysOverdue > 0) {
      damagesPayload.push({
        type: `Late Return Penalty (${daysOverdue} Days)`,
        cost: daysOverdue * 1250,
        multiplier: 1.0
      });
    }

    console.log("Submit Return Claim Process Payload:", damagesPayload);

    const aggregateDeductions = form.damageDeduction + (daysOverdue * 1250);
    const combinedDamageType = daysOverdue > 0
      ? (form.damageType === 'None' 
          ? `Late Return Penalty (${daysOverdue} Days)`
          : `${form.damageType} + Late Fee (${daysOverdue} Days)`)
      : form.damageType;

    setIsSubmitting(true);

    fetch(`http://localhost:5000/api/claims/${form.rentalId.trim()}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        damages: damagesPayload,
        // Late return: raw day count for server-side re-verification
        daysOverdue: daysOverdue,
        // Primary flag name (spec): triageFlag
        triageFlag: flaggedForUrgentTriage,
        // Alias kept for backward-compat with existing backend field name
        flaggedForUrgentTriage: flaggedForUrgentTriage,
        photoEvidenceUrl: photoEvidenceUrls.join(','),
        // Add description and notes for backend validation
        description: customDamageDesc.trim(),
        notes: customDamageDesc.trim()
      })
    })
    .then(async res => {
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || payload.message || 'API failed');
      }
      return payload;
    })
    .then(payload => {
      setIsSubmitting(false);
      // Clear param ID from search path
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.pushState({}, '', url);

      // Determine correct settlement status to reflect in frontend state
      // Triage submissions go to 'Isolated Repair', others to 'Under Review' or 'Settled'
      const frontendStatus = flaggedForUrgentTriage
        ? 'Isolated Repair'
        : (aggregateDeductions > 0 ? 'Under Review' : 'Settled');

      // Trigger submit callback to update frontend registry state
      onSubmit({
        rentalId: form.rentalId.trim(),
        settlementStatus: frontendStatus,
        customerName: form.customerName.trim(),
        deviceModel: form.deviceModel.trim(),
        securityDepositHeld: form.securityDepositHeld,
        damageType: combinedDamageType,
        damageDeduction: aggregateDeductions,
        photoEvidenceUrl: photoEvidenceUrls.join(','),
        // Pass triage metadata so Settlement view can show the emergency notice
        isTriaged: flaggedForUrgentTriage
      });
      // Reset triage flag, photos and description after successful submission
      setFlaggedForUrgentTriage(false);
      setPhotoEvidenceUrls([]);
      setImageVerifications({});
      setCustomDamageDesc('');
      setCustomDamageCost('');
      setSelectedDamages({});
    })
    .catch(err => {
      setIsSubmitting(false);
      console.error(err);
      alert(`Failed to process claim: ${err.message}`);
    });
  };

  const blockInvalidChar = (e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const blockInvalidDaysChar = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const blockNumbersOnName = (e) => {
    if (e.key.length === 1 && /[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const activeSymbol = currencyConfig[currency].symbol;
  const activeRentals = records.filter(r => r.settlementStatus === 'Held');
  const matchedActiveRecord = records.find(r => r.rentalId.trim().toLowerCase() === form.rentalId.trim().toLowerCase());
  const hasMismatchOrScanning = photoEvidenceUrls.some(url => {
    const verif = imageVerifications[url];
    return !verif || verif.status === 'mismatch' || verif.status === 'analyzing';
  });
  const allImagesMatched = photoEvidenceUrls.length > 0 && photoEvidenceUrls.every(url => imageVerifications[url] && imageVerifications[url].status === 'success');

  const isSubmitDisabled = !matchedActiveRecord || 
                           matchedActiveRecord.settlementStatus !== 'Held' ||
                           isSubmitting ||
                           isUploadingPhoto ||
                           (!!selectedDamages['Custom'] && customDamageDesc.trim() === '') ||
                           (Object.keys(selectedDamages).length > 0 && (
                             photoEvidenceUrls.length === 0 || hasMismatchOrScanning
                           ));

  // Convert internal security deposit to active display currency for the input field
  const displayDepositValue = Math.round(fromBase(form.securityDepositHeld, currency));

  const handleDepositChange = (val) => {
    const num = parseFloat(val) || 0;
    const baseVal = toBase(num, currency);
    setForm(prev => ({ ...prev, securityDepositHeld: baseVal }));
  };

  // Render ID status badge helper
  const renderIdStatus = () => {
    if (!form.rentalId.trim()) return null;
    const matched = records.find(r => r.rentalId.trim().toLowerCase() === form.rentalId.trim().toLowerCase());
    if (matched) {
      if (matched.settlementStatus === 'Held') {
        return (
          <div className="alert-message-box alert-success-style" style={{ padding: '8px 12px', marginTop: '0.5rem', gap: '8px', borderWidth: '1px' }}>
            <div className="alert-message-icon-wrapper">
              <CheckCircleIcon size={16} />
            </div>
            <div className="alert-message-content" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Active Booking: {matched.customerName} ({matched.deviceModel})
            </div>
          </div>
        );
      } else if (matched.settlementStatus === 'Under Review') {
        return (
          <div className="alert-message-box alert-warning-style" style={{ padding: '8px 12px', marginTop: '0.5rem', gap: '8px', borderWidth: '1px' }}>
            <div className="alert-message-icon-wrapper">
              <WarningTriangleIcon size={16} style={{ color: '#d97706' }} />
            </div>
            <div className="alert-message-content" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Returned & Awaiting Settlement
            </div>
          </div>
        );
      } else if (matched.settlementStatus === 'Isolated Repair') {
        return (
          <div className="alert-message-box alert-warning-style" style={{ padding: '8px 12px', marginTop: '0.5rem', gap: '8px', borderWidth: '1px' }}>
            <div className="alert-message-icon-wrapper">
              <FastTrackIcon size={16} />
            </div>
            <div className="alert-message-content" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Emergency Triage — ISOLATED_REPAIR Queue
            </div>
          </div>
        );
      } else {
        return (
          <div className="alert-message-box alert-success-style" style={{ padding: '8px 12px', marginTop: '0.5rem', gap: '8px', borderWidth: '1px' }}>
            <div className="alert-message-icon-wrapper">
              <InfoCircleIcon size={16} />
            </div>
            <div className="alert-message-content" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Settled & Closed
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="alert-message-box alert-danger-style" style={{ padding: '8px 12px', marginTop: '0.5rem', gap: '8px', borderWidth: '1px' }}>
          <div className="alert-message-icon-wrapper">
            <ShieldAlertIcon size={16} style={{ flexShrink: 0 }} />
          </div>
          <div className="alert-message-content" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
            Invalid Booking ID: This rental reference does not exist or is not active.
          </div>
        </div>
      );
    }
  };

  return (
    <div className="animated-view" style={{ maxWidth: '680px', width: '100%', margin: '0 auto', overflow: 'auto' }}>
      
      {/* Active Records helper selection buttons */}
      {activeRentals.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }} className="glass-panel">
          <small className="muted-description" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontWeight: 700, fontSize: '0.75rem' }}>
            <LightbulbIcon size={12} style={{ color: 'var(--warning)' }} />
            QUICK-FILL FROM ACTIVE TICKETS:
          </small>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {activeRentals.map(r => (
              <button 
                key={r.rentalId}
                type="button"
                className="btn btn-secondary"
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '0.8rem', 
                  borderRadius: '4px',
                  borderColor: activeRecordHelper === r.rentalId ? 'var(--primary)' : 'var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => handleHelperSelect(r)}
              >
                <span className="rental-tracking-id" style={{ background: 'transparent', padding: 0 }}>{r.rentalId}</span> ({r.customerName})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form Panel */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReturnDeskIcon active={true} size={22} style={{ marginRight: '6px' }} /> Logistics & Return Intake Form
          </h3>
          <span className="validation-badge success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FastTrackIcon /> Fast-Track Check (&lt; 60s)
          </span>
        </div>
        
        <form onSubmit={handleFormSubmit}>
          
          <div style={{ marginBottom: '16px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Booking Reference ID:</label>
            <input 
              required 
              disabled={isSubmitting}
              type="text" 
              className="form-control"
              style={{ width: '100%', textTransform: 'uppercase' }} 
              maxLength={20}
              value={form.rentalId}
              onChange={e => setForm({...form, rentalId: e.target.value.toUpperCase()})} 
            />
            {renderIdStatus()}
          </div>

          <div style={{ marginBottom: '16px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Customer Full Name:</label>
            <input 
              required 
              disabled={isSubmitting}
              type="text" 
              className="form-control"
              style={{ width: '100%' }} 
              value={form.customerName}
              onChange={e => setForm({...form, customerName: e.target.value.replace(/[^a-zA-Z\s\-\.]/g, '')})} 
              onKeyDown={blockNumbersOnName}
            />
          </div>

          <div style={{ marginBottom: '16px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Device Model:</label>
            <input 
              required 
              disabled={isSubmitting}
              type="text" 
              placeholder="e.g. iPad Pro M4" 
              className="form-control"
              style={{ width: '100%' }} 
              value={form.deviceModel}
              onChange={e => setForm({...form, deviceModel: e.target.value.replace(/[^a-zA-Z0-9\s\-\.]/g, '')})} 
            />
          </div>

          <div style={{ marginBottom: '16px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Upfront Deposit Held ({activeSymbol}):
            </label>
            <input 
              required 
              disabled={isSubmitting}
              type="number" 
              min="0"
              onKeyDown={blockInvalidChar}
              className="form-control"
              style={{ width: '100%' }} 
              value={displayDepositValue} 
              onChange={e => handleDepositChange(e.target.value)} 
            />
          </div>

          <div style={{ marginBottom: '16px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Days Overdue / Delayed Return:
            </label>
            <input 
              required 
              disabled={isSubmitting}
              type="number" 
              min="0"
              step="1"
              onKeyDown={blockInvalidDaysChar}
              className="form-control"
              style={{ width: '100%' }} 
              value={daysOverdue} 
              placeholder="0"
              onChange={e => {
                const val = e.target.value;
                if (val === '') {
                  setDaysOverdue(0);
                  return;
                }
                const parsed = parseInt(val, 10);
                if (isNaN(parsed) || parsed < 0) {
                  setDaysOverdue(0);
                } else {
                  setDaysOverdue(parsed);
                }
              }} 
            />
          </div>

          {/* Multi-Select Damage Issue Selector */}
          <div style={{ marginBottom: '20px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>
              Damage Issue Selector (Select all that apply):
            </label>
            <div className="damage-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              {[
                { type: 'None', label: 'Perfect Condition (Clear All)', icon: <ShieldCheckIcon />, cost: 0, isNone: true },
                { type: 'Cracked Screen', label: 'Cracked Screen', icon: <PhoneCrackIcon />, cost: 10000 },
                { type: 'Body Dents', label: 'Body Dents / Scratches', icon: <PhoneScratchesIcon />, cost: 3750 },
                { type: 'Water Damage / Fluid Intrusion', label: 'Liquid Intrusion', icon: <PhoneDropletIcon />, cost: 20833 },
                { type: 'Port / Charging Malfunction', label: 'Port Damage', icon: <PortDamageIcon />, cost: 5000 },
                { type: 'Missing Accessories (Charger/Cables)', label: 'Missing Accessories', icon: <MissingAccessoriesIcon />, cost: 2500 },
                { type: 'Power Failure / Hardware Defect', label: 'Power Failure', icon: <PowerFailureIcon />, cost: 12000 },
                { type: 'Custom', label: 'Other (Enter Custom Damage)', icon: <CustomDeductionIcon />, cost: null }
              ].map(opt => {
                const isSelected = opt.isNone 
                  ? Object.keys(selectedDamages).length === 0 
                  : !!selectedDamages[opt.type];
                
                const isWaterDamage = opt.type === 'Water Damage / Fluid Intrusion';
                
                let computedCost = opt.cost;
                const activeRecord = records.find(r => r.rentalId === activeRecordHelper);
                if (activeRecord && opt.cost !== null && !opt.isNone) {
                  computedCost = getDynamicDamageCost(opt.type, activeRecord.deviceCategory || activeRecord.deviceModel, activeRecord.securityDepositHeld);
                }

                let costDisplay = '';
                if (opt.isNone) {
                  costDisplay = 'No Fee';
                } else if (opt.cost === null) {
                  costDisplay = 'Variable';
                } else {
                  costDisplay = formatVal(computedCost);
                }

                return (
                  <button
                    key={opt.type}
                    type="button"
                    disabled={isSubmitting}
                    className={`damage-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isSubmitting && handleDamageToggle(opt.type)}
                    style={{
                      background: isSelected
                        ? (isWaterDamage ? 'rgba(239,68,68,0.12)' : 'var(--primary-glow)')
                        : 'var(--bg-input)',
                      border: isSelected
                        ? (isWaterDamage ? '2px solid #ef4444' : '2px solid var(--primary)')
                        : '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'center',
                      opacity: isSubmitting ? 0.7 : 1,
                      boxShadow: isSelected && isWaterDamage
                        ? '0 0 12px rgba(239,68,68,0.25)'
                        : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '24px', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)' }}>{opt.icon}</span>
                    <strong style={{
                      fontSize: '0.78rem',
                      color: isSelected && isWaterDamage ? '#ef4444' : 'var(--text-primary)',
                      fontWeight: isSelected && isWaterDamage ? 700 : 500,
                      lineHeight: 1.2
                    }}>{opt.label}</strong>
                    <span className="currency-amount neutral" style={{
                      fontSize: '0.72rem',
                      color: isSelected
                        ? (isWaterDamage ? '#f59e0b' : 'var(--primary)')
                        : 'var(--text-muted)'
                    }}>
                      {costDisplay}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* ─── Context-Aware Emergency Safety Banner ───────────────────────────── */}
          {/*
            Uses max-height + opacity transition instead of display:none
            so the slide-in / slide-out animation works smoothly.
            The container is always in the DOM — height collapses to 0 when inactive.
          */}
          <div
            id="emergency-triage-safety-banner"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{
              maxHeight: flaggedForUrgentTriage ? '300px' : '0px',
              opacity: flaggedForUrgentTriage ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.38s cubic-bezier(0.22,1,0.36,1), opacity 0.28s ease',
              marginTop: flaggedForUrgentTriage ? '0.75rem' : '0',
              borderRadius: '10px'
            }}
          >
            {flaggedForUrgentTriage && (
              <div 
                className="alert-message-box alert-warning-style"
                style={{
                  borderLeftWidth: '5px',
                  padding: '16px',
                  boxShadow: '0 0 16px rgba(245,158,11,0.25)'
                }}
              >
                <div className="alert-message-icon-wrapper" style={{ alignSelf: 'flex-start', marginTop: '2px' }}>
                  <WarningTriangleIcon width={24} height={24} style={{ color: '#d97706' }} />
                </div>
                <div className="alert-message-content">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b45309' }}>
                    <ShieldAlertIcon width={16} height={16} style={{ color: '#ef4444' }} /> Important Safety Information
                  </strong>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', lineHeight: 1.4, color: '#7c2d12', fontWeight: 600 }}>
                    Water damage detected. Please do not attempt to turn on or charge the device for your safety. We have prioritized this item for our repair team to handle safely.
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem',
                  fontWeight: 900, color: '#fff', letterSpacing: '0.06em',
                  background: '#ef4444', alignSelf: 'flex-start',
                  boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
                }}>URGENT</div>
              </div>
            )}
          </div>

          {Object.keys(selectedDamages).length > 0 && (
            <div style={{ marginBottom: '16px' }} className="form-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                {!!selectedDamages['Custom'] 
                  ? 'Custom Damage Description (Required):' 
                  : `Damage Description / Notes ${photoEvidenceUrls.length === 0 ? '(Required - No Photo Uploaded)' : '(Optional)'}:`}
              </label>
              <input 
                required={!!selectedDamages['Custom'] || photoEvidenceUrls.length === 0}
                disabled={isSubmitting}
                type="text" 
                className={`form-control ${
                  Object.keys(selectedDamages).length > 0 && 
                  (!!selectedDamages['Custom'] || photoEvidenceUrls.length === 0) && 
                  customDamageDesc.trim() === '' 
                    ? 'input-error-state' 
                    : ''
                }`}
                placeholder={!!selectedDamages['Custom'] ? "e.g. Scratched Camera Lens" : "Describe the damage details here..."} 
                value={customDamageDesc} 
                onChange={e => setCustomDamageDesc(e.target.value)} 
              />
              {Object.keys(selectedDamages).length > 0 && 
               (!!selectedDamages['Custom'] || photoEvidenceUrls.length === 0) && 
               customDamageDesc.trim() === '' && (
                <div className="validation-error-text">
                  <WarningTriangleIcon width={14} height={14} style={{ color: '#ef4444' }} />
                  Please provide a brief description of the damage or upload photo evidence.
                </div>
              )}
            </div>
          )}

          {!!selectedDamages['Custom'] && (
            <div style={{ marginBottom: '16px' }} className="form-group">
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Custom Deduction Cost ({activeSymbol}):</label>
              <input 
                required
                disabled={isSubmitting}
                type="number" 
                min="0"
                onKeyDown={blockInvalidChar}
                className="form-control" 
                placeholder="5000" 
                value={customDamageCost} 
                onChange={e => handleCustomCostChange(e.target.value)} 
              />
            </div>
          )}

          {/* Photo Evidence Tabbed Interface (Camera Capture / Drag & Drop Upload / Paste URL) */}
          {Object.keys(selectedDamages).length > 0 && (
            <div style={{ marginBottom: '24px', padding: '16px', border: '2px solid rgba(220, 38, 38, 0.4)', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.04)' }} className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', marginBottom: '12px', fontSize: '1.05rem', color: 'var(--danger)' }}>
                <WarningTriangleIcon width={20} height={20} style={{ color: 'var(--danger)' }} /> Submit Proof of Damage (Required Evidence):
              </label>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {[
                  { id: 'camera', label: 'Take Photo', icon: <CameraIcon style={{ marginRight: '6px' }} /> },
                  { id: 'upload', label: 'Upload File', icon: <UploadIcon style={{ marginRight: '6px' }} /> },
                  { id: 'url', label: 'Image URL', icon: <LinkIcon style={{ marginRight: '6px' }} /> }
                ].map(tab => {
                  const isTabDisabled = isSubmitting || isUploadingPhoto;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={isTabDisabled}
                      className={`btn ${photoMode === tab.id ? 'btn-primary' : 'btn-secondary'} ${isTabDisabled ? 'btn-disabled' : ''}`}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        borderRadius: '4px',
                        background: photoMode === tab.id ? 'var(--primary)' : 'transparent',
                        borderColor: photoMode === tab.id ? 'var(--primary)' : 'var(--border-color)',
                        color: photoMode === tab.id ? '#fff' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isTabDisabled ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => {
                        if (!isTabDisabled) {
                          setPhotoMode(tab.id);
                          stopCamera();
                        }
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Camera Capture Mode */}
              {photoMode === 'camera' && (
                <div style={{ textAlign: 'center', background: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                  {cameraError && (
                    <div className="alert-message-box alert-danger-style" style={{ padding: '8px 12px', marginBottom: '0.75rem', fontSize: '0.82rem', gap: '8px', borderWidth: '1px', textAlign: 'left' }}>
                      <div className="alert-message-icon-wrapper">
                        <ExclamationCircleIcon style={{ width: '16px', height: '16px' }} />
                      </div>
                      <div className="alert-message-content">
                        <strong>{cameraError}</strong>
                      </div>
                    </div>
                  )}
                  
                  {videoStream ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <video 
                        id="webcam-video" 
                        autoPlay 
                        playsInline 
                        style={{ 
                          width: '100%', 
                          maxWidth: '400px', 
                          borderRadius: '6px', 
                          border: '2px solid var(--primary)', 
                          transform: 'scaleX(-1)' // Mirror effect
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CameraIcon /> Capture Snapshot
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={stopCamera} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding: '24px 0' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                          Capture a snapshot directly from your webcam/device camera.
                        </p>
                        <button 
                          type="button" 
                          disabled={isCameraLoading || isSubmitting}
                          className={`btn btn-primary ${isCameraLoading || isSubmitting ? 'btn-disabled' : ''}`}
                          onClick={startCamera}
                          style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          {isCameraLoading ? 'Initializing Camera...' : <><CameraIcon /> Activate Camera</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload / Drag & Drop Mode */}
              {photoMode === 'upload' && (
                <label 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  style={{ 
                    display: 'block',
                    textAlign: 'center', 
                    background: 'var(--bg-main)', 
                    padding: '32px 16px', 
                    borderRadius: '6px', 
                    border: '2px dashed var(--border-color)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'border-color var(--transition-fast)',
                    pointerEvents: isSubmitting ? 'none' : 'auto',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    accept="image/*" 
                    disabled={isSubmitting}
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                  />
                  <div>
                    <span style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      <FolderIcon width={40} height={40} style={{ margin: '0 auto' }} />
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Drag & Drop Image Here</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', marginBottom: '16px' }}>
                      Supports PNG, JPG, JPEG
                    </p>
                    <span className="btn btn-secondary" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem' }}>
                      Browse Files
                    </span>
                  </div>
                </label>
              )}

              {/* Paste URL Mode */}
              {photoMode === 'url' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                      type="url" 
                      disabled={isSubmitting}
                      placeholder="Paste image URL here..." 
                      className="form-control"
                      style={{ width: '100%', borderColor: 'var(--border-color)' }} 
                      value={customUrlInput}
                      onChange={e => setCustomUrlInput(e.target.value)} 
                    />
                    <button
                      type="button"
                      disabled={isSubmitting}
                      className={`btn btn-primary ${isSubmitting ? 'btn-disabled' : ''}`}
                      style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '0 12px' }}
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          addImageWithVerification(customUrlInput.trim());
                          setCustomUrlInput('');
                        }
                      }}
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Thumbnail preview list with delete overlays */}
          {(photoEvidenceUrls.length > 0 || isUploadingPhoto) && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(120, 120, 120, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <small style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CameraIcon /> CAPTURED EVIDENCE IMAGES ({photoEvidenceUrls.length}):
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {photoEvidenceUrls.map((url, idx) => {
                  const verif = imageVerifications[url];
                  const borderColor = verif?.status === 'success' 
                    ? '#10b981' 
                    : verif?.status === 'mismatch' 
                      ? '#ef4444' 
                      : verif?.status === 'analyzing'
                        ? '#3b82f6'
                        : 'var(--border-color)';
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        position: 'relative', 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '6px', 
                        overflow: 'hidden', 
                        border: `2px solid ${borderColor}`,
                        background: 'var(--bg-main)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <img 
                        src={url} 
                        alt={`Evidence ${idx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          padding: 0,
                          zIndex: 10,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }}
                        onClick={() => {
                          setPhotoEvidenceUrls(prev => prev.filter((_, i) => i !== idx));
                        }}
                        title="Remove image"
                      >
                        ✕
                      </button>
                      {verif && (
                        <div 
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '18px',
                            background: verif.status === 'success' 
                              ? 'rgba(16, 185, 129, 0.95)' 
                              : verif.status === 'mismatch' 
                                ? 'rgba(239, 68, 68, 0.95)' 
                                : 'rgba(59, 130, 246, 0.95)',
                            color: '#fff',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            letterSpacing: '0.05em',
                            pointerEvents: 'none'
                          }}
                          title={verif.message}
                        >
                          {verif.status === 'success' ? '✔ Match' : verif.status === 'mismatch' ? '✖ Mismatch' : '⏳ Scanning'}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isUploadingPhoto && (
                  <div 
                    style={{ 
                      position: 'relative', 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '6px', 
                      overflow: 'hidden', 
                      border: '2px dashed var(--primary)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span className="spinner-loader" style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      marginBottom: '4px'
                    }}></span>
                    <small style={{ fontSize: '9px', color: 'var(--primary)' }}>Uploading...</small>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Screen Crack & Damage Assessment Sandbox Simulator Panel */}
          {false && form.damageType !== 'None' && photoEvidenceUrls.length > 0 && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: '16px', 
                borderRadius: '8px', 
                border: aiState.status === 'success' 
                  ? '1px solid rgba(22, 163, 74, 0.35)' 
                  : aiState.status === 'mismatch'
                    ? '1px solid rgba(220, 38, 38, 0.35)'
                    : '1px solid var(--border-color)', 
                background: aiState.status === 'success'
                  ? 'rgba(22, 163, 74, 0.02)'
                  : aiState.status === 'mismatch'
                    ? 'rgba(220, 38, 38, 0.02)'
                    : 'var(--bg-main)',
                marginBottom: '20px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                  <AiCoreIcon size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  AI CORE ANALYSIS HANDLER
                </h4>
                
                {/* Simulation Control Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Simulation:</span>
                  <select 
                    value={aiSimulationMode} 
                    onChange={e => setAiSimulationMode(e.target.value)}
                    style={{ 
                      fontSize: '0.72rem', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      background: 'var(--bg-input)', 
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="auto">Auto-Detect (Keywords)</option>
                    <option value="force-success">Force Match (Success)</option>
                    <option value="force-mismatch">Force Mismatch (Error)</option>
                  </select>
                </div>
              </div>

              {/* Simulation Sandbox Core */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                
                {/* Scanning Image Block */}
                <div 
                  style={{ 
                    position: 'relative', 
                    width: '120px', 
                    height: '100px', 
                    borderRadius: '6px', 
                    overflow: 'hidden',
                    border: '1.5px solid var(--border-color)',
                    background: '#000',
                    flexShrink: 0
                  }}
                >
                  <img 
                    src={aiState.analyzedImage} 
                    alt="AI Scanning Target" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      opacity: aiState.status === 'analyzing' ? 0.6 : 0.95,
                      transition: 'opacity 0.2s'
                    }} 
                  />
                  
                  {/* Laser Scanning Overlay Animation */}
                  {aiState.status === 'analyzing' && (
                    <>
                      <div 
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0, 
                          background: 'linear-gradient(to bottom, rgba(59,130,246,0) 0%, rgba(59,130,246,0.15) 80%, rgba(59,130,246,0.3) 100%)',
                          pointerEvents: 'none'
                        }} 
                      />
                      {/* Laser Bar */}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: 0, 
                          right: 0, 
                          height: '2px', 
                          background: 'var(--primary)', 
                          boxShadow: '0 0 10px var(--primary), 0 0 4px var(--primary)', 
                          animation: 'laserScan 1.5s infinite linear',
                          pointerEvents: 'none'
                        }} 
                      />
                      {/* Loading Text Overlay */}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: 0, 
                          right: 0, 
                          bottom: 0, 
                          background: 'rgba(0,0,0,0.7)', 
                          color: '#fff', 
                          fontSize: '0.65rem', 
                          textAlign: 'center', 
                          padding: '3px 0',
                          fontWeight: 600
                        }}
                      >
                        SCANNING...
                      </div>
                    </>
                  )}
                </div>

                {/* Status Badging & Results Description */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  {aiState.status === 'analyzing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: 'var(--primary)', 
                          display: 'inline-block',
                          boxShadow: '0 0 8px var(--primary)',
                          animation: 'pulse 1s infinite'
                        }} />
                        <strong style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>AI Core Assessing Asset Integrity...</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Running computer vision convolutions on structural crack and fluid-entry vectors...
                      </p>
                    </div>
                  )}

                  {aiState.status === 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span 
                        className="badge success" 
                        style={{ 
                          background: 'rgba(22, 163, 74, 0.1)', 
                          color: '#16a34a', 
                          border: '1px solid rgba(22, 163, 74, 0.3)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          width: 'fit-content'
                        }}
                      >
                        <CheckCircleIcon size={12} />
                        VERIFICATION SUCCESS
                      </span>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {aiState.message}
                      </p>
                    </div>
                  )}
 
                  {aiState.status === 'mismatch' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span 
                        className="badge danger" 
                        style={{ 
                          background: 'rgba(220, 38, 38, 0.1)', 
                          color: '#dc2626', 
                          border: '1px solid rgba(220, 38, 38, 0.3)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          width: 'fit-content'
                        }}
                      >
                        <ShieldAlertIcon size={12} />
                        VERIFICATION MISMATCH
                      </span>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                        {aiState.message}
                      </p>
                    </div>
                  )}
                  
                  {aiState.status === 'idle' && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Ready to analyze return evidence.
                    </p>
                  )}
                </div>
 
              </div>
            </div>
          )}
 
          {/* Instant Math Live Settlement Breakdown Card */}
          {(() => {
            const lateFeeInInr = daysOverdue * 1250;
            const totalDeductionsInInr = form.damageDeduction + lateFeeInInr;
            const netRefund = form.securityDepositHeld - totalDeductionsInInr;
            const hasDeficit = netRefund < 0;
            const absRefund = Math.abs(netRefund);
 
            return (
              <div 
                className="glass-panel" 
                style={{ 
                  background: hasDeficit ? 'var(--danger-glow)' : 'var(--secondary-glow)', 
                  border: hasDeficit ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid rgba(22, 163, 74, 0.25)', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  animation: 'fadeIn 0.2s ease-in-out'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', letterSpacing: '0.05em', color: hasDeficit ? 'var(--danger)' : 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CardReceiptIcon size={18} /> INSTANT MATH ESTIMATOR
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                  <div className="flex-between">
                    <span className="muted-description">Upfront Deposit Held:</span>
                    <strong className="currency-amount neutral">{formatVal(form.securityDepositHeld)}</strong>
                  </div>
                  {daysOverdue > 0 && (
                    <div className="flex-between">
                      <span className="muted-description">Late Return Penalty ({daysOverdue} days):</span>
                      <strong className="currency-amount negative">-{formatVal(lateFeeInInr)}</strong>
                    </div>
                  )}
                  <div className="flex-between">
                    <span className="muted-description">Damage Deductions Charged:</span>
                    <strong className="currency-amount negative">-{formatVal(form.damageDeduction)}</strong>
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                  {hasDeficit ? (
                    <div className="flex-between">
                      <span style={{ fontWeight: 800, color: 'var(--danger)' }}>Outstanding Liability:</span>
                      <strong className="currency-amount negative" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {formatVal(absRefund)}
                      </strong>
                    </div>
                  ) : (
                    <div className="flex-between">
                      <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>Net Refund Due:</span>
                      <strong className="currency-amount positive" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {formatVal(netRefund)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {!(!form.rentalId.trim()) && isSubmitDisabled && (
            <div className="validation-checklist-container" style={{
              background: 'rgba(220, 38, 38, 0.02)',
              border: '1px solid rgba(220, 38, 38, 0.15)',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.8rem'
            }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Mandatory Return Requirements Checklist:
              </strong>
              <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }} className="validation-helper-list">
                {[
                  { key: 'booking', label: 'Enter a valid active Booking Reference ID', met: !!matchedActiveRecord && matchedActiveRecord.settlementStatus === 'Held' },
                  { key: 'evidence', label: 'Provide photo evidence OR type a written description', met: Object.keys(selectedDamages).length === 0 || photoEvidenceUrls.length > 0 || customDamageDesc.trim() !== '' }
                ].map(req => (
                  <li key={req.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: req.met ? 'var(--success)' : 'var(--danger)' }}>
                    {req.met ? (
                      <CheckCircleIcon size={12} />
                    ) : (
                      <ShieldAlertIcon size={12} />
                    )}
                    <span style={{ opacity: req.met ? 0.75 : 1, fontWeight: req.met ? 500 : 600 }}>{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '1.25rem' }}>
            {setView && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setView(userRole === 'Service Technician' ? 'assets' : 'dashboard')}
                style={{ flex: 1, padding: '12px', height: '46px', fontWeight: 600 }}
              >
                Back <span className="keycap-indicator">alt+B</span>
              </button>
            )}
            <button
              type="submit"
              className={`action-btn ${isSubmitDisabled ? 'btn-disabled' : ''}`}
              disabled={isSubmitDisabled}
              style={{
                flex: setView ? 2 : 1,
                padding: '12px',
                height: '46px',
                ...(isSubmitDisabled ? {
                  background: 'var(--border-color)',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                  boxShadow: 'none',
                  animation: 'none'
                } : (flaggedForUrgentTriage ? {
                  background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)',
                  boxShadow: '0 4px 18px rgba(239,68,68,0.35)',
                  animation: 'triage-border-breathe 2s ease-in-out infinite'
                } : {}))
              }}
            >
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="spinner-loader" style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Processing Return...
                </span>
              ) : isSubmitDisabled ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShieldAlertIcon size={16} /> {
                    !matchedActiveRecord ? "Enter Valid Active Booking Reference ID" :
                    Object.keys(selectedDamages).length > 0 && photoEvidenceUrls.length === 0 ? "Submit Proof of Damage (Required)" :
                    photoEvidenceUrls.some(url => imageVerifications[url]?.status === 'analyzing') ? "AI Scanning..." :
                    "AI Mismatch: Resolve Evidence"
                  }
                </span>
              ) : flaggedForUrgentTriage ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FastTrackIcon size={16} /> Triage Record <span className="keycap-indicator">Ctrl+↵</span>
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircleIcon size={16} /> Commit Return <span className="keycap-indicator">Ctrl+↵</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
