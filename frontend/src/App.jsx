import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './views/Dashboard';
import ReturnForm from './views/ReturnForm';
import Settlement from './views/Settlement';
import CustomerDetails from './views/CustomerDetails';
import OpenAudits from './views/OpenAudits';
import MonitoredDeposits from './views/MonitoredDeposits';
import ActiveIncidents from './views/ActiveIncidents';
import DueToday from './views/DueToday';
import CorporateCustomers from './views/CorporateCustomers';
import AssetOperations from './views/AssetOperations';
import Unauthorized from './views/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerPortal from './views/CustomerPortal';

// Currency configuration mapping rates relative to base currency (INR = 1)
const CURRENCY_CONFIG = {
  INR: { symbol: '₹', rate: 1, label: 'INR (₹)' },
  USD: { symbol: '$', rate: 0.012, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 0.011, label: 'EUR (€)' },
  GBP: { symbol: '£', rate: 0.0095, label: 'GBP (£)' },
  AED: { symbol: 'د.إ', rate: 0.044, label: 'AED (د.إ)' },
  SGD: { symbol: 'S$', rate: 0.016, label: 'SGD (S$)' }
};

// Initial mock rentals matching user specifications
const offsetDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const INITIAL_MOCK_RECORDS = [
  {
    rentalId: "REF-2026-001",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@example.com",
    customerPhone: "+1-555-0199",
    kycStatus: "Verified",
    deviceModel: "MacBook Pro M3",
    deviceBaseCost: 150000,
    securityDepositHeld: 50000,
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held",
    startDate: offsetDate(-12),
    endDate: offsetDate(-5)
  },
  {
    rentalId: "REF-2026-002",
    customerName: "Priya Patel",
    customerEmail: "priya.patel@example.com",
    customerPhone: "+91-98765-43210",
    kycStatus: "Pending",
    deviceModel: "iPad Pro M4",
    deviceBaseCost: 80000,
    securityDepositHeld: 15000,
    damageType: "Cracked Screen",
    damageDeduction: 12500,
    photoEvidenceUrl: "https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=600",
    settlementStatus: "Under Review",
    startDate: offsetDate(-20),
    endDate: offsetDate(-8)
  },
  {
    rentalId: "REF-2026-003",
    customerName: "Amit Verma",
    customerEmail: "amit.verma@example.com",
    customerPhone: "+91-99999-88888",
    kycStatus: "Rejected",
    deviceModel: "iPhone 15 Pro",
    deviceBaseCost: 120000,
    securityDepositHeld: 25000,
    damageType: "Body Scratches / Dents",
    damageDeduction: 4166,
    photoEvidenceUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600",
    settlementStatus: "Settled",
    startDate: offsetDate(-30),
    endDate: offsetDate(-18)
  },
  {
    rentalId: "REF-2026-004",
    customerName: "Rohan Sharma",
    customerEmail: "rohan.sharma@example.com",
    customerPhone: "+91-98888-77777",
    kycStatus: "Verified",
    deviceModel: "Canon DSLR Camera",
    deviceBaseCost: 25000,
    securityDepositHeld: 10000,
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held",
    startDate: offsetDate(-4),
    endDate: offsetDate(3)
  },
  {
    rentalId: "REF-2026-005",
    customerName: "Sneha Reddy",
    customerEmail: "sneha.reddy@example.com",
    customerPhone: "+91-97777-66666",
    kycStatus: "Verified",
    deviceModel: "Lenovo ThinkPad Laptop",
    deviceBaseCost: 40000,
    securityDepositHeld: 15000,
    damageType: "None",
    damageDeduction: 0,
    photoEvidenceUrl: "",
    settlementStatus: "Held",
    startDate: offsetDate(-7),
    endDate: offsetDate(7)
  }
];

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const { isAuthenticated, user, logout: authLogout } = useAuth();
  const userRole = user ? user.role : 'Manager';
  
  const location = useLocation();
  const navigate = useNavigate();

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

  // Re-fetch database records when location path changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
    }
  }, [location.pathname, isAuthenticated]);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login');
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

  // Form submission success redirect handler
  const addNewReturn = (newRecord) => {
    fetchRecords();
    if (userRole === 'Manager') {
      navigate('/dashboard');
    } else if (userRole === 'Accounts Staff') {
      navigate('/settlement');
    } else {
      navigate('/return');
    }
  };

  return (
    <Routes>
      {/* Public Guest Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <HomeRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes nested under Layout */}
      <Route element={
        <Layout 
          theme={theme}
          toggleTheme={toggleTheme}
          currency={currency}
          setCurrency={setCurrency}
          userRole={userRole}
          handleLogout={handleLogout}
        />
      }>
        {/* Manager-only Views */}
        <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
          <Route path="/dashboard" element={
            <Dashboard 
              records={records} 
              setView={(v) => navigate(`/${v}`)} 
              setRecords={setRecords}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
              onCurrencyChange={setCurrency}
            />
          } />
          <Route path="/corporate" element={
            <CorporateCustomers
              records={records}
              setView={(v) => navigate(`/${v}`)}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
            />
          } />
          <Route path="/deposits" element={
            <MonitoredDeposits 
              records={records} 
              setRecords={setRecords} 
              setView={(v) => navigate(`/${v}`)}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          } />
          <Route path="/incidents" element={
            <ActiveIncidents 
              records={records} 
              setRecords={setRecords} 
              setView={(v) => navigate(`/${v}`)}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          } />
          <Route path="/duetoday" element={
            <DueToday 
              records={records} 
              setRecords={setRecords} 
              setView={(v) => navigate(`/${v}`)}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          } />
        </Route>

        {/* Manager + Service Technician Views */}
        <Route element={<ProtectedRoute allowedRoles={['Manager', 'Service Technician']} />}>
          <Route path="/assets" element={
            <AssetOperations 
              records={records} 
              setView={(v) => navigate(`/${v}`)} 
              setRecords={setRecords}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
            />
          } />
          <Route path="/return" element={
            <ReturnForm 
              onSubmit={addNewReturn} 
              records={records}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
              setView={(v) => navigate(`/${v}`)}
              userRole={userRole}
            />
          } />
        </Route>

        {/* Manager + Accounts Staff Views */}
        <Route element={<ProtectedRoute allowedRoles={['Manager', 'Accounts Staff']} />}>
          <Route path="/settlement" element={
            <Settlement 
              records={records} 
              setRecords={setRecords} 
              formatVal={formatVal}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              setView={(v) => navigate(`/${v}`)}
            />
          } />
          <Route path="/audits" element={
            <OpenAudits 
              records={records} 
              setRecords={setRecords} 
              setView={(v) => navigate(`/${v}`)}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
              userRole={userRole}
            />
          } />
        </Route>

        {/* Shared Detail Views (accessible to all authenticated staff) */}
        <Route element={<ProtectedRoute allowedRoles={['Manager', 'Service Technician', 'Accounts Staff']} />}>
          <Route path="/customer-detail" element={
            <CustomerDetails 
              records={records} 
              setView={(v) => navigate(`/${v}`)}
              currency={currency}
              currencyConfig={CURRENCY_CONFIG}
              formatVal={formatVal}
              fromBase={fromBase}
              toBase={toBase}
              fetchRecords={fetchRecords}
              userRole={userRole}
            />
          } />
        </Route>

        {/* Customer Portal View */}
        <Route element={<ProtectedRoute allowedRoles={['Customer', 'Manager']} />}>
          <Route path="/portal" element={
            <CustomerPortal 
              records={records} 
              formatVal={formatVal} 
            />
          } />
        </Route>

        {/* Root Redirects */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

/**
 * Layout Outlet Wrapper
 * Injects Sidebar Navigation and manages dark/light theme classes on the container shell.
 */
function Layout({ theme, toggleTheme, currency, setCurrency, userRole, handleLogout }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Maps clean location pathname to navbar highlight view index
  const getActiveView = () => {
    const cleanPath = pathname.replace(/^\//, '');
    return cleanPath || 'dashboard';
  };

  const handleSetView = (view) => {
    navigate(`/${view}`);
  };

  return (
    <div className="control-center-layout">
      <Navbar 
        setView={handleSetView} 
        activeView={getActiveView()} 
        currency={currency} 
        onCurrencyChange={setCurrency} 
        currencyConfig={CURRENCY_CONFIG} 
        theme={theme}
        toggleTheme={toggleTheme}
        userRole={userRole}
        onLogout={handleLogout}
      />
      <main className="main-content-pane">
        <div className="control-center-view-wrapper animated-view" key={pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/**
 * HomeRedirect
 * Dynamically resolves the correct landing page based on the logged-in user's role.
 */
function HomeRedirect() {
  const { user } = useAuth();
  if (user?.role === 'Service Technician') {
    return <Navigate to="/return" replace />;
  }
  if (user?.role === 'Accounts Staff') {
    return <Navigate to="/settlement" replace />;
  }
  if (user?.role === 'Customer') {
    return <Navigate to="/portal" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
