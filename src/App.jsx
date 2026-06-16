import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './views/Dashboard';
import ReturnForm from './views/ReturnForm';
import Settlement from './views/Settlement';
import CustomerDetails from './views/CustomerDetails';
import OpenAudits from './views/OpenAudits';
import MonitoredDeposits from './views/MonitoredDeposits';
import ActiveIncidents from './views/ActiveIncidents';
import DueToday from './views/DueToday';



// Currency configuration mapping rates relative to base currency (INR = 1)
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 0.012, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.011, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.0095, label: 'GBP (£)' },
  AED: { symbol: 'د.إ', rate: 0.044, label: 'AED (د.إ)' },
  SGD: { symbol: 'S$', rate: 0.016, label: 'SGD (S$)' }
};

// Initial mock rentals matching user specifications and unified blueprint
const INITIAL_MOCK_RECORDS = [
  {
    rentalId: "REF-2026-001",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    customerPhone: "+1-555-0199",
    kycStatus: "Verified",
    deviceModel: "MacBook Pro M3",
    securityDepositHeld: 50000,       // INR base (displayed in USD as $600 approx)
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held"
  },
  {
    rentalId: "REF-2026-002",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    customerPhone: "+91-98765-43210",
    kycStatus: "Pending",
    deviceModel: "iPad Pro M4",
    securityDepositHeld: 15000,       // INR base
    damageType: "Cracked Screen",
    damageDeduction: 12500,           // INR base ($150 approx)
    photoEvidenceUrl: "https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=600",
    settlementStatus: "Under Review"
  },
  {
    rentalId: "REF-2026-003",
    customerName: "Amit Verma",
    customerEmail: "amit.verma@example.com",
    customerPhone: "+91-99999-88888",
    kycStatus: "Rejected",
    deviceModel: "iPhone 15 Pro",
    securityDepositHeld: 25000,       // INR base
    damageType: "Body Scratches / Dents",
    damageDeduction: 4166,            // INR base ($50 approx)
    photoEvidenceUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600",
    settlementStatus: "Settled"
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Role state: 'Manager' (full view), 'Service Technician' (return form only), 'Accounts Staff' (settlement only)
  const [userRole, setUserRole] = useState(() => {
    const saved = localStorage.getItem('rentshield_cc_role');
    return saved || 'Manager';
  });

  // Theme state: dark mode defaults for premium aesthetics, light mode follows user parameters
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('rentshield_cc_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Load initial currency state from localStorage or default to 'INR'
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('rentshield_cc_currency');
    return saved && CURRENCY_CONFIG[saved] ? saved : 'INR';
  });

  // Shared mock collection simulating a running live operational table
  const [records, setRecords] = useState([]);

  // Fetch records from backend API
  const fetchRecords = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/rentals');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
      } else {
        throw new Error('API response not OK');
      }
    } catch (err) {
      console.warn("Express backend server offline or unreachable. Falling back to local storage...");
      const saved = localStorage.getItem('rentshield_cc_records');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0 && parsed[0].rentalId) {
            setRecords(parsed);
            return;
          }
        } catch (e) {}
      }
      setRecords(INITIAL_MOCK_RECORDS);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentView]);

  // Sync theme to localStorage and body tag classList
  useEffect(() => {
    localStorage.setItem('rentshield_cc_theme', theme);
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }, [theme]);

  // Sync role to localStorage and enforce view restrictions
  useEffect(() => {
    localStorage.setItem('rentshield_cc_role', userRole);
    if (userRole === 'Service Technician' && currentView !== 'return') {
      setCurrentView('return');
    } else if (userRole === 'Accounts Staff' && currentView !== 'settlement' && currentView !== 'audits') {
      setCurrentView('settlement');
    }
  }, [userRole, currentView]);

  // Sync currency to localStorage
  useEffect(() => {
    localStorage.setItem('rentshield_cc_currency', currency);
  }, [currency]);

  // Local storage backup sync for records
  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem('rentshield_cc_records', JSON.stringify(records));
    }
  }, [records]);

  const addNewReturn = (newRecord) => {
    fetchRecords();
    
    // Redirect to dashboard on submit only if active role permits it
    if (userRole === 'Manager') {
      setCurrentView('dashboard');
    } else if (userRole === 'Accounts Staff') {
      setCurrentView('settlement');
    } else {
      setCurrentView('return');
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Convert amount from base currency (INR) to current display currency
  const fromBase = (valInBase, selectedCurrency) => {
    const config = CURRENCY_CONFIG[selectedCurrency];
    return valInBase * config.rate;
  };

  // Convert input amount in current selected currency back to base (INR)
  const toBase = (valInCurrent, selectedCurrency) => {
    const config = CURRENCY_CONFIG[selectedCurrency];
    return Math.round(valInCurrent / config.rate);
  };

  // Helper to format values elegantly with currency symbols
  const formatVal = (valInBase) => {
    const config = CURRENCY_CONFIG[currency];
    const converted = valInBase * config.rate;

    if (currency === 'INR') {
      return `${config.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
    } else {
      return `${config.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <div className="control-center-layout">
      <Navbar 
        setView={setCurrentView} 
        activeView={currentView} 
        currency={currency} 
        onCurrencyChange={setCurrency} 
        currencyConfig={CURRENCY_CONFIG} 
        theme={theme}
        toggleTheme={toggleTheme}
        userRole={userRole}
        setUserRole={setUserRole}
      />
      <main className="main-content-pane">
        <div className="control-center-view-wrapper animated-view" key={currentView}>
          {currentView === 'dashboard' && userRole === 'Manager' && (
            <Dashboard 
              records={records} 
              setView={setCurrentView} 
              setRecords={setRecords}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}
          {currentView === 'customer-detail' && userRole === 'Manager' && (
            <CustomerDetails 
              records={records} 
              setView={setCurrentView} 
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}
          {currentView === 'return' && (userRole === 'Manager' || userRole === 'Service Technician') && (
            <ReturnForm 
              onSubmit={addNewReturn} 
              records={records}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}
          {currentView === 'settlement' && (userRole === 'Manager' || userRole === 'Accounts Staff') && (
            <Settlement 
              records={records} 
              setRecords={setRecords} 
              formatVal={formatVal}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
            />
          )}
          {currentView === 'audits' && (userRole === 'Manager' || userRole === 'Accounts Staff') && (
            <OpenAudits 
              records={records} 
              setRecords={setRecords} 
              setView={setCurrentView}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}
          {currentView === 'deposits' && userRole === 'Manager' && (
            <MonitoredDeposits 
              records={records} 
              setRecords={setRecords} 
              setView={setCurrentView}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}
          {currentView === 'incidents' && userRole === 'Manager' && (
            <ActiveIncidents 
              records={records} 
              setRecords={setRecords} 
              setView={setCurrentView}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}
          {currentView === 'duetoday' && userRole === 'Manager' && (
            <DueToday 
              records={records} 
              setRecords={setRecords} 
              setView={setCurrentView}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          )}

        </div>
      </main>
    </div>
  );
}
