import React, { useState, useEffect } from 'react';

// ─── Module-level constants (defined once, stable across re-renders) ───────────
// The canonical damage type key that triggers the ISOLATED_REPAIR emergency protocol
const WATER_DAMAGE_KEY = 'Water Damage / Fluid Intrusion';

// Clean SVG Icons for modern visual design
const LogisticsIntakeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', marginRight: '6px' }}>
    <path d="M85 62C88 68 85 76 75 81C63 87 45 88 30 84C22 82 17 79 17 77L25 74C25 75 29 77 34 78C47 82 61 81 70 76C77 72 78 68 76 65L85 62Z" fill="#3b82f6" />
    <path d="M8 73L28 62L22 84L8 73Z" fill="#3b82f6" />
    <path d="M20 33V65L50 80V48Z" fill="#b08968" stroke="#2b1a0f" strokeWidth="3" strokeLinejoin="round" />
    <path d="M50 48V80L80 65V33Z" fill="#8c6239" stroke="#2b1a0f" strokeWidth="3" strokeLinejoin="round" />
    <path d="M20 33L50 18L80 33L50 48Z" fill="#ddb892" stroke="#2b1a0f" strokeWidth="3" strokeLinejoin="round" />
    <path d="M46 46V54H54V46L50 48Z" fill="#7f4f24" stroke="#2b1a0f" strokeWidth="1.5" />
    <path d="M20 33L50 48" stroke="#2b1a0f" strokeWidth="1.5" />
    <path d="M80 33L50 48" stroke="#2b1a0f" strokeWidth="1.5" />
  </svg>
);

const FastTrackIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#16a34a' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 11 11 13 15 9" />
  </svg>
);

const PhoneCrackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
    <path d="m7 5 5 4-2 3 5 3-3 4" strokeWidth="1.6" />
  </svg>
);

const PhoneScratchesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
    <path d="M8 6h3M7 9h4M13 12h3" strokeWidth="1.6" />
  </svg>
);

const PhoneDropletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
    <path d="M12 7a2 2 0 0 0-2 2c0 1.2 2 3.2 2 3.2s2-2 2-3.2a2 2 0 0 0-2-2z" fill="#ef4444" fillOpacity="0.25" strokeWidth="1.6" />
  </svg>
);

const CalculatorIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.6" />
    <rect x="8" y="10" width="3" height="3" rx="0.5" />
    <rect x="13" y="10" width="3" height="3" rx="0.5" />
    <rect x="8" y="15" width="3" height="3" rx="0.5" />
    <rect x="13" y="15" width="3" height="3" rx="0.5" />
  </svg>
);

const WarningIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M44.75 14.5C47.0588 10.5 52.9412 10.5 55.25 14.5L92.2154 78.5C94.5242 82.5 91.633 87.5 86.9654 87.5H13.0346C8.36703 87.5 5.47578 82.5 7.78458 78.5L44.75 14.5Z" fill="#FFFFFF" stroke="#ef4444" strokeWidth="10" strokeLinejoin="round" />
    <path d="M47 34C47 32.34 48.34 31 50 31C51.66 31 53 32.34 53 34L51.8 55C51.8 56.1 51 57 50 57C49 57 48.2 56.1 48.2 55L47 34Z" fill="#000000" />
    <circle cx="50" cy="67" r="4.5" fill="#000000" />
  </svg>
);

const AlertIcon = ({ width = 18, height = 18, style }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <path d="M44.75 14.5C47.0588 10.5 52.9412 10.5 55.25 14.5L92.2154 78.5C94.5242 82.5 91.633 87.5 86.9654 87.5H13.0346C8.36703 87.5 5.47578 82.5 7.78458 78.5L44.75 14.5Z" fill="#FFFFFF" stroke="#ef4444" strokeWidth="10" strokeLinejoin="round" />
    <path d="M47 34C47 32.34 48.34 31 50 31C51.66 31 53 32.34 53 34L51.8 55C51.8 56.1 51 57 50 57C49 57 48.2 56.1 48.2 55L47 34Z" fill="#000000" />
    <circle cx="50" cy="67" r="4.5" fill="#000000" />
  </svg>
);

const InfoIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const BlockIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const CheckIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CameraIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const FolderIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
    <defs>
      <linearGradient id="rtFolderBack" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="rtFolderFront" x1="10" y1="35" x2="90" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#facc15" />
      </linearGradient>
    </defs>
    <path d="M10 25C10 22.2386 12.2386 20 15 20H38C40.054 20 41.9163 21.2533 42.6738 23.147L46.4674 32.6304C46.8461 33.5773 47.7773 34.2038 48.7937 34.2038H85C87.7614 34.2038 90 36.4424 90 39.2038V75C90 77.7614 87.7614 80 85 80H15C12.2386 80 10 77.7614 10 75V25Z" fill="url(#rtFolderBack)" />
    <path d="M10 39C10 36.2386 12.2386 34 15 34H85C87.7614 34 90 36.2386 90 39V75C90 77.7614 87.7614 80 85 80H15C12.2386 80 10 77.7614 10 75V39Z" fill="url(#rtFolderFront)" />
  </svg>
);

const UploadIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const LinkIcon = ({ width = 14, height = 14, style }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const CalculatorEstimateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.6" />
    <path d="M9 12h2M10 11v2M14 12h2M14 16h2M14 18h2M8 17h2" strokeWidth="1.6" />
  </svg>
);

export default function ReturnForm({ onSubmit, records, currency, currencyConfig, formatVal, fromBase, toBase }) {
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
  const [customUrlInput, setCustomUrlInput] = useState('');

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

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  // Trigger AI Analysis when a photo is added or damageType changes
  useEffect(() => {
    if (form.damageType === 'None') {
      setAiState({ status: 'idle', message: '', analyzedImage: '' });
      return;
    }

    if (photoEvidenceUrls.length === 0) {
      setAiState({ status: 'idle', message: '', analyzedImage: '' });
      return;
    }

    const lastImage = photoEvidenceUrls[photoEvidenceUrls.length - 1];

    setAiState({ status: 'analyzing', message: 'AI Core analyzing structural asset integrity...', analyzedImage: lastImage });

    const timer = setTimeout(() => {
      let isMatch = false;
      let badgeMsg = '';

      if (aiSimulationMode === 'force-success') {
        isMatch = true;
      } else if (aiSimulationMode === 'force-mismatch') {
        isMatch = false;
      } else {
        const urlLower = lastImage.toLowerCase();
        if (form.damageType === 'Cracked Screen') {
          isMatch = urlLower.includes('crack') || 
                    urlLower.includes('screen') || 
                    urlLower.includes('shatter') || 
                    urlLower.includes('broken') || 
                    urlLower.includes('b1fe343e5e23') ||
                    urlLower.startsWith('data:image');
        } else if (form.damageType === 'Body Dents') {
          isMatch = urlLower.includes('dent') || 
                    urlLower.includes('scratch') || 
                    urlLower.includes('b2e2302');
        } else if (form.damageType === WATER_DAMAGE_KEY) {
          isMatch = urlLower.includes('water') || 
                    urlLower.includes('droplet') || 
                    urlLower.includes('fluid') || 
                    urlLower.includes('liquid') || 
                    urlLower.includes('f218e8de');
        } else {
          isMatch = true; // Default to match for custom to avoid locking the technician
        }
      }

      if (form.damageType === 'Cracked Screen' || form.damageType === WATER_DAMAGE_KEY) {
        if (isMatch) {
          badgeMsg = 'AI Verification: 98% Match - Structural Damage Confirmed. Claim Authorized.';
        } else {
          badgeMsg = 'AI Verification Mismatch: Selected damage category does not align with visual evidence. Re-verify asset condition.';
        }
      } else {
        if (isMatch) {
          badgeMsg = `AI Verification: 95% Match - ${form.damageType} Detected. Claim Accepted.`;
        } else {
          badgeMsg = 'AI Verification Mismatch: Selected damage category does not align with visual evidence. Re-verify asset condition.';
        }
      }

      setAiState({
        status: isMatch ? 'success' : 'mismatch',
        message: badgeMsg,
        analyzedImage: lastImage
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [photoEvidenceUrls, form.damageType, aiSimulationMode]);

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

  const capturePhoto = () => {
    const videoEl = document.getElementById('webcam-video');
    if (videoEl && videoStream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      setPhotoEvidenceUrls(prev => [...prev, dataUrl]);
      
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
          setPhotoEvidenceUrls(prev => [...prev, event.target.result]);
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
          setPhotoEvidenceUrls(prev => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Warning: Please drop a valid image file (PNG, JPG, or JPEG).");
      }
    }
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
      
      const matchedPhotos = matchedRecord.photoEvidenceUrl ? matchedRecord.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
      setPhotoEvidenceUrls(matchedPhotos);
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

  // Handle active record helper buttons
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
    
    const matchedPhotos = record.photoEvidenceUrl ? record.photoEvidenceUrl.split(/,(?=data:image\/|https?:\/\/)/).filter(Boolean) : [];
    setPhotoEvidenceUrls(matchedPhotos);
  };

  const handleDamage = (type) => {
    // Determine if the newly selected damage type triggers the emergency safety protocol
    const isHighRisk = type === WATER_DAMAGE_KEY;
    setFlaggedForUrgentTriage(isHighRisk);

    if (type === 'Custom') {
      setForm(prev => ({
        ...prev,
        damageType: 'Custom',
        damageDeduction: toBase(parseFloat(customDamageCost) || 0, currency)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        damageType: type,
        damageDeduction: matrixInInr[type] || 0
      }));
    }
  };

  const handleCustomCostChange = (val) => {
    setCustomDamageCost(val);
    const num = parseFloat(val) || 0;
    setForm(prev => ({
      ...prev,
      damageDeduction: toBase(num, currency)
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Mandatory Photo Evidence Validation for transparency
    const hasPhotoEvidence = photoEvidenceUrls.length > 0 && photoEvidenceUrls.some(url => url.trim().startsWith('http') || url.trim().startsWith('data:image'));
    if (form.damageType !== 'None' && !hasPhotoEvidence) {
      alert("Transparency Error: A valid Photo Evidence Link or Capture is strictly mandatory whenever damage is assessed!");
      return;
    }

    // Compile final values
    const finalDamageType = form.damageType === 'Custom' 
      ? (customDamageDesc.trim() || 'Custom Damage') 
      : form.damageType;

    const damagesPayload = [];

    if (finalDamageType !== 'None') {
      damagesPayload.push({
        type: finalDamageType,
        cost: form.damageDeduction,
        multiplier: 1.0
      });
    }

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
      ? (finalDamageType === 'None' 
          ? `Late Return Penalty (${daysOverdue} Days)`
          : `${finalDamageType} + Late Fee (${daysOverdue} Days)`)
      : finalDamageType;

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
        photoEvidenceUrl: photoEvidenceUrls.join(',')
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

      // Reset triage flag and photos after successful submission
      setFlaggedForUrgentTriage(false);
      setPhotoEvidenceUrls([]);
    })
    .catch(err => {
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
  const isSubmitDisabled = !matchedActiveRecord || 
                           matchedActiveRecord.settlementStatus !== 'Held' ||
                           (form.damageType !== 'None' && aiState.status === 'mismatch') ||
                           aiState.status === 'analyzing';

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
              <CheckIcon style={{ width: '16px', height: '16px' }} />
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
              <WarningIcon width={16} height={16} style={{ color: '#d97706' }} />
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
              <FastTrackIcon />
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
              <InfoIcon style={{ width: '16px', height: '16px' }} />
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
            <BlockIcon style={{ flexShrink: 0, width: '16px', height: '16px' }} />
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--warning)' }}>
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
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
            <LogisticsIntakeIcon /> Logistics & Return Intake Form
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
              type="text" 
              className="form-control"
              style={{ width: '100%' }} 
              value={form.customerName}
              onChange={e => setForm({...form, customerName: e.target.value.replace(/[^a-zA-Z\s\-\.]/g, '')})} 
              onKeyDown={blockNumbersOnName}
            />
          </div>

          <div style={{ marginBottom: '16px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Device Model Category:</label>
            <input 
              required 
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
              type="number" 
              min="0"
              step="1"
              onKeyDown={blockInvalidDaysChar}
              className="form-control"
              style={{ width: '100%' }} 
              value={daysOverdue === 0 ? '' : daysOverdue} 
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

          {/* Touch-Friendly Visual Damage Selector (Simplicity) */}
          <div style={{ marginBottom: '20px' }} className="form-group">
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>
              Damage Classification:
            </label>
            <div className="damage-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
                { type: 'None', label: 'Perfect Condition', icon: <ShieldCheckIcon />, cost: 0 },
                { type: 'Cracked Screen', label: 'Cracked Screen', icon: <PhoneCrackIcon />, cost: 10000 },
                { type: 'Body Dents', label: 'Body Dents', icon: <PhoneScratchesIcon />, cost: 3750 },
                { type: 'Water Damage / Fluid Intrusion', label: 'Water Damage', icon: <PhoneDropletIcon />, cost: 20833 },
                { type: 'Custom', label: 'Custom Cost', icon: <CalculatorIcon />, cost: null }
              ].map(opt => {
                const isSelected = form.damageType === opt.type;
                const isWaterDamage = opt.type === 'Water Damage / Fluid Intrusion';
                const costDisplay = opt.cost === 0 ? 'No Fee' : opt.cost === null ? 'Variable' : formatVal(opt.cost);
                return (
                  <button
                    key={opt.type}
                    type="button"
                    className={`damage-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDamage(opt.type)}
                    style={{
                      background: isSelected
                        ? (isWaterDamage ? 'rgba(239,68,68,0.10)' : 'var(--primary-glow)')
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
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      textAlign: 'center',
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
                    <WarningIcon width={24} height={24} style={{ color: '#d97706' }} />
                  </div>
                  <div className="alert-message-content">
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#b45309' }}>
                      <AlertIcon width={16} height={16} style={{ color: '#ef4444' }} /> SAFETY PROTOCOL — IMMEDIATE ACTION REQUIRED
                    </strong>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', lineHeight: 1.4, color: '#7c2d12', fontWeight: 600 }}>
                      Water entry detected. <strong>Isolate the battery immediately</strong> before handling.
                      Strip the physical battery safely and route this asset directly to the
                      <strong> Priority Repair Queue</strong>. Device status will be set to
                      <strong> ISOLATED_REPAIR</strong> in the database upon submission.
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
          </div>

          {form.damageType === 'Custom' && (
            <>
              <div style={{ marginBottom: '16px' }} className="form-group">
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Custom Damage Description:</label>
                <input 
                  required
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Scratched Camera Lens" 
                  value={customDamageDesc} 
                  onChange={e => setCustomDamageDesc(e.target.value)} 
                />
              </div>

              <div style={{ marginBottom: '16px' }} className="form-group">
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>Custom Deduction Cost ({activeSymbol}):</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  onKeyDown={blockInvalidChar}
                  className="form-control" 
                  placeholder="5000" 
                  value={customDamageCost} 
                  onChange={e => handleCustomCostChange(e.target.value)} 
                />
              </div>
            </>
          )}

          {/* Photo Evidence Tabbed Interface (Camera Capture / Drag & Drop Upload / Paste URL) */}
          {form.damageType !== 'None' && (
            <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.02)' }} className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '8px', color: 'var(--danger)' }}>
                <WarningIcon width={16} height={16} style={{ color: 'var(--danger)' }} /> Photo Evidence Upload or Capture (Required):
              </label>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {[
                  { id: 'camera', label: 'Take Photo', icon: <CameraIcon style={{ marginRight: '6px' }} /> },
                  { id: 'upload', label: 'Upload File', icon: <UploadIcon style={{ marginRight: '6px' }} /> },
                  { id: 'url', label: 'Image URL', icon: <LinkIcon style={{ marginRight: '6px' }} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`btn ${photoMode === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      borderRadius: '4px',
                      background: photoMode === tab.id ? 'var(--primary)' : 'transparent',
                      borderColor: photoMode === tab.id ? 'var(--primary)' : 'var(--border-color)',
                      color: photoMode === tab.id ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => {
                      setPhotoMode(tab.id);
                      stopCamera();
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Camera Capture Mode */}
              {photoMode === 'camera' && (
                <div style={{ textAlign: 'center', background: 'var(--bg-main)', padding: '16px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                  {cameraError && (
                    <div className="alert-message-box alert-danger-style" style={{ padding: '8px 12px', marginBottom: '0.75rem', fontSize: '0.82rem', gap: '8px', borderWidth: '1px', textAlign: 'left' }}>
                      <div className="alert-message-icon-wrapper">
                        <BlockIcon style={{ width: '16px', height: '16px' }} />
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
                          className={`btn btn-primary ${isCameraLoading ? 'btn-disabled' : ''}`}
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
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    accept="image/*" 
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
                      placeholder="https://images.unsplash.com/... or paste image URL" 
                      className="form-control"
                      style={{ width: '100%', borderColor: 'var(--border-color)' }} 
                      value={customUrlInput}
                      onChange={e => setCustomUrlInput(e.target.value)} 
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '0 12px' }}
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          setPhotoEvidenceUrls(prev => [...prev, customUrlInput.trim()]);
                          setCustomUrlInput('');
                        }
                      }}
                    >
                      Add URL
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => {
                        let sampleUrl = 'https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=600'; // Cracked screen
                        if (form.damageType === 'Body Dents') {
                          sampleUrl = 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600'; // Dented phone
                        } else if (form.damageType === WATER_DAMAGE_KEY) {
                          sampleUrl = 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=600'; // Water droplets
                        }
                        setPhotoEvidenceUrls(prev => [...prev, sampleUrl]);
                      }}
                      title="Autofill a mock visual evidence URL for rapid warehouse testing"
                    >
                      <CameraIcon /> Demo URL
                    </button>
                  </div>
                  {form.photoEvidenceUrl && form.photoEvidenceUrl.match(/^https?:\/\/.+/i) && (
                    <div className="evidence-preview-container" style={{ borderStyle: 'solid', borderColor: 'var(--danger)', padding: '8px', borderRadius: '6px', background: 'var(--bg-main)' }}>
                      <small style={{ color: 'var(--danger)', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CameraIcon style={{ color: 'var(--danger)' }} /> Mandatory Evidence Photo Preview:
                      </small>
                      <img 
                        src={form.photoEvidenceUrl} 
                        alt="Evidence Preview" 
                        className="evidence-preview-image"
                        style={{ border: '2px solid var(--danger)', borderRadius: '4px', maxWidth: '100%', maxHeight: '180px', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Thumbnail preview list with delete overlays */}
          {photoEvidenceUrls.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(120, 120, 120, 0.03)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <small style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CameraIcon /> CAPTURED EVIDENCE IMAGES ({photoEvidenceUrls.length}):
              </small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {photoEvidenceUrls.map((url, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      position: 'relative', 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '6px', 
                      overflow: 'hidden', 
                      border: '2px solid var(--border-color)',
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
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                      }}
                      onClick={() => {
                        setPhotoEvidenceUrls(prev => prev.filter((_, i) => i !== idx));
                      }}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Screen Crack & Damage Assessment Sandbox Simulator Panel */}
          {form.damageType !== 'None' && photoEvidenceUrls.length > 0 && (
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', flexShrink: 0 }}>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
                  </svg>
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
                        <CheckIcon width={12} height={12} />
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
                        <BlockIcon width={12} height={12} />
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
                  <CalculatorEstimateIcon /> INSTANT MATH ESTIMATOR
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
                  { key: 'photo', label: 'Upload or capture photo evidence for assessed damage', met: form.damageType === 'None' || (photoEvidenceUrls.length > 0 && photoEvidenceUrls.some(url => url.trim().startsWith('http') || url.trim().startsWith('data:image'))) },
                  { key: 'aiScan', label: 'AI Core integrity analysis must be completed', met: aiState.status !== 'analyzing' },
                  { key: 'aiMatch', label: 'AI Damage verification must confirm visual evidence matching category', met: form.damageType === 'None' || aiState.status === 'success' }
                ].map(req => (
                  <li key={req.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: req.met ? 'var(--success)' : 'var(--danger)' }}>
                    {req.met ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    <span style={{ opacity: req.met ? 0.75 : 1, fontWeight: req.met ? 500 : 600 }}>{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            className={`action-btn ${isSubmitDisabled ? 'btn-disabled' : ''}`}
            disabled={isSubmitDisabled}
            style={{
              width: '100%',
              padding: '12px',
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
            {isSubmitDisabled ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <BlockIcon /> {
                  !matchedActiveRecord ? "Enter Valid Active Booking Reference ID" :
                  aiState.status === 'analyzing' ? "AI Analysis Scanning..." :
                  "AI Verification Mismatch: Resolve Evidence"
                }
              </span>
            ) : flaggedForUrgentTriage ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FastTrackIcon /> Commit ISOLATED_REPAIR Record — Priority Queue
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckIcon /> Commit Return Record
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
